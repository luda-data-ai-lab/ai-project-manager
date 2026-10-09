# 서버 배포 가이드 (ai.ludaresearch.org)

이 가이드는 Ubuntu AWS EC2에서 AI DevTracker를 NGINX와 PM2로 실행하고,
NGINX Basic Auth로 접근을 보호하는 방법을 설명합니다. 앱 자체 로그인은 없으므로
Basic Auth 설정을 완료하기 전에는 서버를 외부에 공개하지 마세요.

## 1. DNS 및 EC2 준비

DNS 관리 화면에서 `ai.ludaresearch.org`의 A 레코드를 EC2 공인 IP로 설정합니다.
DNS 변경은 도메인 관리자가 직접 수행해야 합니다. EC2 보안 그룹에는 HTTP(80)와
HTTPS(443) 인바운드를 허용하고, SSH는 필요한 주소에서만 허용하세요.

서버에 접속해 Node.js 버전을 확인합니다.

```bash
node -v
```

Node.js 20 이상과 npm 10 이상이 필요합니다. Node.js가 없거나 버전이 낮으면 Ubuntu용
공식 Node.js 설치 안내를 따라 Node.js 20 이상을 설치하세요. 네이티브 모듈 빌드 도구와
Basic Auth 계정 관리 도구를 설치합니다.

```bash
sudo apt install -y build-essential python3 apache2-utils
```

사용 중인 포트를 확인하고 비어 있는 포트를 선택합니다. 아래 예시는 `3100`을 사용합니다.

```bash
sudo ss -tlnp
```

## 2. 앱 설치 및 실행

```bash
mkdir -p ~/app
cd ~/app
git clone https://github.com/luda-data-ai-lab/ai-project-manager.git
cd ai-project-manager
npm ci
npm run build
```

저장소 루트의 `.env`를 만들어 앱이 EC2 내부에서만 수신하도록 설정하고 터미널을
비활성화합니다.

```bash
cat > .env <<'EOF'
PORT=3100
HOST=127.0.0.1
TERMINAL_ENABLED=false
EOF
```

PM2가 설치되어 있지 않으면 `npm install -g pm2`로 설치한 뒤 앱을 시작하고 프로세스
목록을 저장합니다.

```bash
pm2 start ecosystem.config.cjs && pm2 save
curl -s http://127.0.0.1:3100/api/health
```

정상 응답에는 `"status":"ok"`가 포함됩니다. 서버는 시작할 때 데이터베이스 마이그레이션을
자동으로 적용합니다.

## 3. NGINX Basic Auth 및 HTTPS

`htpasswd`로 첫 Basic Auth 계정을 생성합니다. `-c`는 파일을 새로 만들 때만 사용합니다.
추가 계정을 만들 때는 `-c`를 빼세요.

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-ai devtracker
sudo htpasswd /etc/nginx/.htpasswd-ai another-user
```

NGINX site 설정 파일을 생성합니다.

```bash
sudo tee /etc/nginx/sites-available/ai.ludaresearch.org >/dev/null <<'EOF'
server {
    listen 80;
    server_name ai.ludaresearch.org;

    auth_basic "AI DevTracker";
    auth_basic_user_file /etc/nginx/.htpasswd-ai;
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

사이트를 활성화하고 설정을 검사한 뒤 NGINX를 다시 불러옵니다. 심볼릭 링크는 처음 한 번만
생성하세요.

```bash
sudo ln -s /etc/nginx/sites-available/ai.ludaresearch.org /etc/nginx/sites-enabled/ai.ludaresearch.org
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ai.ludaresearch.org
```

Certbot이 인증서를 발급하면 `https://ai.ludaresearch.org`에서 Basic Auth 인증 후 사용할 수
있습니다.

## 4. 로컬 데이터 가져오기

로컬 PC의 백업 화면에서 전체 JSON을 내보낸 다음, 서버의 백업 화면에서 해당 파일을
가져옵니다. 기본 가져오기는 `merge`입니다. 같은 ID의 항목은 백업 내용으로 갱신되고,
없는 ID는 추가되며, 백업 파일에 없는 기존 항목은 삭제되지 않습니다. `replace`를 선택하면
가져오기 전에 서버의 기존 프로젝트와 관련 기록을 모두 삭제한 뒤 파일 내용을 가져오므로
주의하세요.

서버에서 `npm run seed`는 기존 데이터를 지우고 예제 데이터를 다시 넣으므로 실행하지
마세요. ROI 예제만 안전하게 추가하려면 `npm run seed:roi`를 사용할 수 있습니다. 같은 이름의
ROI 항목은 중복으로 추가되지 않습니다.

## 5. 업데이트

저장소 디렉터리에서 최신 코드를 가져오고 의존성과 클라이언트 빌드를 갱신한 뒤 앱을
재시작합니다. 재시작 시 DB 마이그레이션이 자동으로 실행됩니다.

```bash
cd ~/app/ai-project-manager
git pull && npm ci && npm run build && pm2 restart ai-devtracker
```

## 6. 백업

전체 JSON 백업은 앱 서버의 localhost API에서 직접 내려받을 수 있습니다. 이 요청은 NGINX를
거치지 않으므로 Basic Auth를 우회합니다. 아래 명령으로 백업 디렉터리를 만들고 수동 백업을
실행할 수 있습니다.

```bash
mkdir -p ~/backup
curl -fsS -o ~/backup/devtracker-$(date +%Y%m%d).json http://127.0.0.1:3100/api/export
```

매일 새벽 3시에 백업하는 cron 예시입니다. `crontab -e`에 추가할 때 `%`는 `\%`로
이스케이프해야 합니다.

```cron
0 3 * * * curl -fsS -o "$HOME/backup/devtracker-$(date +\%Y\%m\%d).json" http://127.0.0.1:3100/api/export
```

기본 SQLite 데이터베이스 파일은 `~/app/ai-project-manager/server/data/devtracker.db`입니다.
JSON 백업과 함께 이 파일도 별도로 복사하거나 안전한 스토리지에 보관하세요.

## 7. 서버에서 제한되는 기능

- 터미널 탭은 `.env`의 `TERMINAL_ENABLED=false` 설정으로 비활성화됩니다.
- 서비스 실행·중지·로그 API는 NGINX가 전달하는 forwarded 헤더가 있는 요청을 거부하므로
  외부 브라우저에서 사용할 수 없습니다.
- 서비스 포트 상태와 실행 화면은 서버 측에서 확인합니다. 여기서 표시하는 포트와 localhost
  주소는 EC2 기준이며, 사용자 PC의 로컬 서비스에 연결되는 기능은 아닙니다.
