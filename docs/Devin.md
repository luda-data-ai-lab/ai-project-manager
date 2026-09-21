# 개인 개발 프로젝트 관리 시스템 — Devin 개발 지시서

> **관련 문서:** `Spec.md` (시스템 기획·설계 명세서)  
> **프로젝트명:** DevTracker (가칭)  
> **개발 도구:** Devin

---

## 1. 프로젝트 목표

AI 도구(Devin·Claude·Cursor)로 개발하는 **자체 프로젝트들을 한 곳에서 관리**하는 웹 애플리케이션을 만든다. 핵심은 "어디까지 했고, 다음에 무엇을 하는가"를 즉시 확인하는 것이다.

---

## 2. 기술 스택

| 레이어 | 선택 | 비고 |
|--------|------|------|
| Frontend | React + Vite | Tailwind CSS 사용 |
| Backend | Node.js + Express | REST API |
| DB | SQLite (better-sqlite3) | 로컬 파일 DB, 추후 PostgreSQL 전환 가능하게 설계 |
| ORM | Drizzle ORM 또는 Knex.js | 마이그레이션 지원 |
| 검색 | SQLite FTS5 | 문서·프롬프트 전문 검색 |
| 인증 | 없음 (1차) | 개인용, 추후 간단 토큰 추가 |
| 배포 | 로컬 → AWS EC2 | 기존 인프라 활용 |

---

## 3. 폴더 구조

```
devtracker/
├── client/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/   # 대시보드 위젯
│   │   │   ├── Project/     # 프로젝트 목록·상세
│   │   │   ├── Task/        # 작업 관리
│   │   │   ├── Prompt/      # 프롬프트 로그
│   │   │   ├── Issue/       # 이슈 관리
│   │   │   ├── Document/    # MD 문서
│   │   │   └── common/      # 공통 컴포넌트
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── server/                  # Express 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   ├── models/          # DB 모델·스키마
│   │   ├── services/        # 비즈니스 로직
│   │   ├── middleware/
│   │   └── index.js
│   ├── db/
│   │   ├── migrations/      # DB 마이그레이션
│   │   └── seeds/           # 시드 데이터
│   └── package.json
├── docs/                    # 프로젝트 문서
│   ├── Spec.md
│   └── Devin.md
└── README.md
```

---

## 4. 데이터베이스 스키마

> Spec.md의 데이터 모델 참조. 아래는 테이블 정의이다.

### projects

```sql
CREATE TABLE projects (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name        TEXT NOT NULL,
  purpose     TEXT,
  status      TEXT NOT NULL DEFAULT 'planning'
              CHECK (status IN ('planning','development','testing','deployed','completed','paused')),
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('high','medium','low')),
  start_date  TEXT,
  target_date TEXT,
  tags        TEXT,           -- JSON array: ["frontend","auth"]
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### tasks

```sql
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo','in_progress','done','blocked')),
  assignee    TEXT DEFAULT 'self',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### prompt_logs

```sql
CREATE TABLE prompt_logs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool            TEXT NOT NULL CHECK (tool IN ('devin','claude','cursor','other')),
  prompt_text     TEXT NOT NULL,
  result_summary  TEXT,
  commit_hash     TEXT,
  used_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### issues

```sql
CREATE TABLE issues (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL DEFAULT 'bug'
                 CHECK (type IN ('bug','improvement','idea','question')),
  status         TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','in_progress','done','hold')),
  priority       TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('urgent','high','normal','low')),
  assignee       TEXT DEFAULT 'self',
  linked_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### documents

```sql
CREATE TABLE documents (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  doc_type        TEXT NOT NULL DEFAULT 'note'
                  CHECK (doc_type IN ('spec','requirement','design','devlog','readme','note')),
  content         TEXT,
  source_location TEXT,        -- 'git' | 'local' + 경로
  version         INTEGER DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### pause_resume_memos

```sql
CREATE TABLE pause_resume_memos (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last_work   TEXT NOT NULL,
  blocker     TEXT,
  next_work   TEXT,
  open_files  TEXT,            -- JSON array
  reference   TEXT,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### environment_configs

```sql
CREATE TABLE environment_configs (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id        TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  source_folder     TEXT,
  run_command       TEXT,
  run_port          TEXT,
  access_url        TEXT,
  runtime           TEXT,       -- "Node 20, Python 3.12"
  install_command   TEXT,
  env_vars_location TEXT,       -- ".env.example 참조"
  db_config_path    TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### git_infos

```sql
CREATE TABLE git_infos (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id     TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  repo_url       TEXT,
  branch         TEXT,
  last_commit    TEXT,
  last_pushed_at TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### deploy_infos

```sql
CREATE TABLE deploy_infos (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id     TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  service_url    TEXT,
  infra          TEXT,
  version        TEXT,
  deployed_at    TEXT,
  deploy_method  TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### test_records

```sql
CREATE TABLE test_records (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target            TEXT NOT NULL,
  method            TEXT CHECK (method IN ('manual','auto','browser')),
  result            TEXT NOT NULL DEFAULT 'untested'
                    CHECK (result IN ('pass','fail','untested')),
  unresolved_issues TEXT,
  tested_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 전문 검색 (FTS5)

```sql
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_type,     -- 'project' | 'task' | 'prompt' | 'document' | 'issue'
  entity_id,
  project_id,
  title,
  content,
  tags
);
```

---

## 5. API 엔드포인트

### 프로젝트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects` | 프로젝트 목록 (필터: status, priority) |
| GET | `/api/projects/:id` | 프로젝트 상세 (관련 정보 포함) |
| POST | `/api/projects` | 프로젝트 생성 |
| PUT | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |

### 작업

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:pid/tasks` | 작업 목록 |
| POST | `/api/projects/:pid/tasks` | 작업 생성 |
| PUT | `/api/tasks/:id` | 작업 수정 |
| DELETE | `/api/tasks/:id` | 작업 삭제 |

### 프롬프트 로그

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:pid/prompts` | 프롬프트 목록 |
| POST | `/api/projects/:pid/prompts` | 프롬프트 기록 추가 |
| DELETE | `/api/prompts/:id` | 프롬프트 기록 삭제 |

### 이슈

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:pid/issues` | 이슈 목록 |
| POST | `/api/projects/:pid/issues` | 이슈 생성 |
| PUT | `/api/issues/:id` | 이슈 수정 |
| DELETE | `/api/issues/:id` | 이슈 삭제 |

### 문서

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:pid/documents` | 문서 목록 |
| GET | `/api/documents/:id` | 문서 상세 (내용 포함) |
| POST | `/api/projects/:pid/documents` | 문서 생성 |
| PUT | `/api/documents/:id` | 문서 수정 |
| DELETE | `/api/documents/:id` | 문서 삭제 |

### 중단·재개 메모

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:pid/memos` | 메모 목록 (최신순) |
| GET | `/api/projects/:pid/memos/latest` | 최신 메모 1건 |
| POST | `/api/projects/:pid/memos` | 메모 작성 |

### 환경·Git·배포·테스트

| Method | Path | 설명 |
|--------|------|------|
| GET/PUT | `/api/projects/:pid/env` | 실행 환경 조회·수정 |
| GET/PUT | `/api/projects/:pid/git` | Git 정보 조회·수정 |
| GET/PUT | `/api/projects/:pid/deploy` | 배포 정보 조회·수정 |
| GET | `/api/projects/:pid/tests` | 테스트 기록 목록 |
| POST | `/api/projects/:pid/tests` | 테스트 기록 추가 |

### 대시보드

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/dashboard` | 대시보드 집계 데이터 |

반환 내용:
- `active_projects`: 진행 중 프로젝트 + 상태
- `next_tasks`: 프로젝트별 다음 할 일 (status=todo, sort_order 기준 첫 번째)
- `blocked_tasks`: status=blocked 작업 목록
- `recent_changes`: 최근 7일 커밋·프롬프트·문서 변경
- `due_soon`: 목표일 D-7 이내 프로젝트

### 검색

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/search?q=...&type=...&project=...` | 통합 검색 |

---

## 6. 프론트엔드 페이지

### 6.1 대시보드 (`/`)

- 진행 중 프로젝트 카드 (클릭 → 상세)
- 다음 할 일 리스트
- 막힌 작업 하이라이트 (빨간 뱃지)
- 최근 변경 타임라인
- 마감 임박 경고

### 6.2 프로젝트 목록 (`/projects`)

- 카드 또는 테이블 뷰
- 상태·우선순위 필터
- 검색
- 신규 프로젝트 생성 버튼

### 6.3 프로젝트 상세 (`/projects/:id`)

탭 구조:

| 탭 | 내용 |
|----|------|
| 개요 | 프로젝트 정보 + 최신 중단 메모 |
| 작업 | 작업 목록 (칸반 또는 리스트) + 상태 변경 |
| 프롬프트 | 프롬프트 로그 타임라인 |
| 문서 | MD 문서 목록 + 에디터/미리보기 |
| 이슈 | 이슈 목록 + 필터 |
| 설정 | 실행 환경 · Git · 배포 · 환경변수 정보 |

### 6.4 검색 (`/search`)

- 통합 검색창
- 결과를 엔티티 유형별 그룹핑
- 프로젝트·태그 필터

---

## 7. 개발 순서

### Phase 1 — MVP

**목표:** 프로젝트를 등록하고, 작업·중단 메모를 기록하며, 대시보드에서 현황을 본다.

1. 프로젝트 초기화 (Vite + React + Express + SQLite)
2. DB 마이그레이션 스크립트 작성 (`projects`, `tasks`, `pause_resume_memos`, `environment_configs`, `git_infos`)
3. 프로젝트 CRUD API + 프론트
4. 작업 CRUD API + 프론트 (리스트 뷰, 상태 변경)
5. 중단·재개 메모 API + 프론트
6. 실행 환경·Git 정보 등록 폼
7. 대시보드 (진행 중 프로젝트 + 다음 할 일 + 막힌 작업)
8. 기본 레이아웃·네비게이션

### Phase 2 — 핵심 기능

1. 프롬프트 로그 API + 프론트 (작업 연결)
2. 이슈 관리 API + 프론트
3. MD 문서 에디터 + 미리보기 (`react-markdown` 또는 유사 라이브러리)
4. 통합 검색 (FTS5) + 검색 페이지
5. 태그 시스템

### Phase 3 — 확장

1. 배포 정보 관리
2. 테스트·검증 기록
3. 백업·내보내기 (JSON/MD)
4. 비용 관리
5. 프로젝트 간 관계

---

## 8. 개발 규칙

1. **API 응답 형식:** `{ success: true, data: ... }` 또는 `{ success: false, error: "메시지" }`
2. **날짜 형식:** ISO 8601 (`2026-09-21T14:30:00Z`)
3. **ID 생성:** hex(randomblob(8)) — 16자리 hex 문자열
4. **에러 처리:** Express 글로벌 에러 핸들러, 프론트에서 toast 알림
5. **코드 스타일:** ESLint + Prettier
6. **커밋 메시지:** `feat:`, `fix:`, `docs:`, `refactor:` 접두사
7. **환경변수:** `.env.example` 파일에 변수 이름만 기록, `.env`는 `.gitignore`
8. **CORS:** 개발 시 `localhost:5173` ↔ `localhost:3001` 허용
9. **포트:** 프론트 5173, 백엔드 3001

---

## 9. 시드 데이터

초기 개발 확인용으로 아래 프로젝트를 시드로 넣는다.

```json
[
  {
    "name": "ExMigrate",
    "purpose": "페인트 제조 MES 엑셀 → DB 이관 시스템",
    "status": "development",
    "priority": "high",
    "tags": ["excel", "database", "migration"]
  },
  {
    "name": "MakeBook",
    "purpose": "사용자 글감·사진으로 장르별 책 제작 서비스",
    "status": "planning",
    "priority": "medium",
    "tags": ["ai", "content", "book"]
  },
  {
    "name": "I/F 관리 시스템",
    "purpose": "인터페이스 리스트·대시보드·시스템 연결 현황 관리",
    "status": "planning",
    "priority": "medium",
    "tags": ["interface", "dashboard"]
  }
]
```

---

## 10. 참고

- 상세 기획은 `Spec.md` 참조
- 보안: API 키·비밀번호는 절대 DB에 저장하지 않음, 환경변수 이름·위치만 기록
- 문서 원본: Git 저장소를 원본으로 권장, 시스템에서는 사본 유지
- 추후 PostgreSQL 전환 대비: SQL에 SQLite 전용 문법 최소화
