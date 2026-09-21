# DevTracker

AI 도구로 개발하는 프로젝트의 진행 상황, 다음 작업, 중단 메모를 한 곳에서 관리하는 개인용 프로젝트 관리 시스템입니다.

## 시작하기

Node.js 20과 npm 10이 필요합니다.

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

브라우저에서 http://localhost:5173 을 열고, API는 http://localhost:3001 에서 확인할 수 있습니다.

## 기술 스택

- Client: React 18, Vite 5, Tailwind CSS 3, React Router, lucide-react
- Server: Node.js ESM, Express 4, Knex, better-sqlite3
- Database: SQLite

## 구조

```text
client/src/       React 페이지, 컴포넌트, hooks, API 유틸리티
server/src/       Express 라우트, 서비스, 미들웨어
server/db/        Knex 마이그레이션과 시드
docs/             기획 및 개발 명세
```

## API 요약

- `GET/POST/PUT/DELETE /api/projects` 프로젝트 CRUD 및 상태·우선순위·검색 필터
- `GET/POST /api/projects/:id/tasks`, `PUT/DELETE /api/tasks/:id` 작업 관리
- `GET/POST /api/projects/:id/memos`, `GET /latest` 중단·재개 메모
- `GET/PUT /api/projects/:id/env`, `GET/PUT /api/projects/:id/git` 실행 환경과 Git 정보
- `GET/PUT /api/projects/:id/deploy` 배포 정보
- `GET/POST /api/projects/:id/tests`, `DELETE /api/tests/:id` 테스트 기록
- `GET/POST /api/projects/:id/relations`, `DELETE /api/relations/:id` 프로젝트 관계 관리
- `GET /api/relations/graph` 프로젝트 관계도 데이터
- `GET /api/search?q=&type=&project=` 프로젝트·작업·프롬프트·문서·이슈 통합 검색
- `GET /api/dashboard` 진행 중 프로젝트, 다음 할 일, 막힌 작업, 최근 변경, 마감 임박 집계
- `GET /api/terminal/status` 터미널 기능 활성화 상태
- `GET /api/export`, `GET /api/export/projects/:id` JSON 백업 내보내기
- `GET /api/export/projects/:id/markdown` 프로젝트 Markdown 내보내기
- `POST /api/import?mode=merge|replace` JSON 백업 가져오기
- `GET /api/health` 서버 상태 확인

모든 응답은 `{ success: true, data }` 또는 `{ success: false, error }` 형식입니다.

프로젝트 상세의 **터미널 탭**은 localhost에서만 사용할 수 있으며, `TERMINAL_ENABLED=false`로 비활성화할 수 있습니다.

## 백업·내보내기

사이드바의 **백업** 메뉴에서 전체 또는 프로젝트별 JSON을 내보내고, 프로젝트 Markdown을 다운로드할 수 있습니다.
JSON 백업은 병합 또는 전체 교체 모드로 가져올 수 있습니다. 자동 백업이 필요하면 로컬 앱이 실행 중인 상태에서
다음과 같이 cron에 등록할 수 있습니다.

```bash
curl -o backup.json http://localhost:3001/api/export
# 예: 매일 새벽 3시
0 3 * * * curl -fsS -o "$HOME/devtracker-backup-$(date +\%Y\%m\%d).json" http://localhost:3001/api/export
```

## 로컬 설정

`server/.env.example`과 `client/.env.example`을 참고해 환경변수를 설정할 수 있습니다. SQLite 파일은 기본적으로 `server/data/devtracker.db`에 생성됩니다.

## 로드맵

- **Phase 1 (완료):** 프로젝트·작업·중단 메모·실행 환경·Git 정보·대시보드 MVP
- **Phase 2:** 프롬프트 로그, 이슈, Markdown 문서, FTS5 통합 검색, 태그 고도화
- **Phase 3:** 배포·테스트 기록, 백업/내보내기, 비용 관리, 프로젝트 관계

상세 요구사항은 [docs/Devin.md](docs/Devin.md)와 [docs/Spec.md](docs/Spec.md)를 참고하세요.
