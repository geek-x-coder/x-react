# Monitoring Dashboard

REST API로부터 데이터를 수집하여 실시간으로 어플리케이션의 상태 및 알람을 모니터링하는 React 기반 웹 대시보드입니다.

---

## 목차

1. [주요 기능](#-주요-기능)
2. [프로젝트 구조](#-프로젝트-구조)
3. [설치 및 실행](#-설치-및-실행)
4. [백엔드 연동](#-백엔드-연동)
5. [대시보드 사용법](#-대시보드-사용법)
6. [API 데이터 형식](#-api-데이터-형식)
7. [Criteria & ALERT](#-criteria--alert)
8. [대시보드 설정 JSON](#-대시보드-설정-json)
9. [로컬 스토리지](#-로컬-스토리지)
10. [테마 & 스타일](#-테마--스타일)
11. [문제 해결](#-문제-해결)

---

## ✨ 주요 기능

### 위젯 & 레이아웃

- **드래그&드롭 위젯 배치** — react-grid-layout 기반 자유 배치 및 크기 조절
- **위젯별 리프레시 주기 설정** — 1초~3600초 범위에서 위젯마다 독립 설정
- **리프레시 주기 & 마지막 갱신 시간 표시** — 위젯 헤더에 `every Xs` 칩 및 `HH:MM:SS` 표시
- **LIVE / DEAD 상태 표시** — API 연결 상태에 따른 실시간 상태 뱃지
- **위젯 제목 툴팁** — 제목이 잘릴 경우 호버 시 전체 이름 표시

### 동적 테이블

- **자동 컬럼 생성** — JSON 구조에 관계없이 자동으로 테이블 구성
- **컬럼 선택/순서 설정** — 위젯 설정에서 표시 컬럼을 선택/해제
- **컬럼 정렬** — 헤더 클릭으로 오름차순/내림차순/해제 순환
- **상태 값 자동 색상 처리** — healthy/error/warning 등 자동 인식
- **행 선택 & 클립보드 복사** — 클릭으로 행 선택, Ctrl+C로 헤더 포함 TSV 복사
- **행 상세 팝업** — 더블클릭 시 해당 행 데이터를 실시간 업데이트 팝업으로 표시
- **폰트 크기 설정** — 전체 위젯 테이블 폰트 크기 조절 (10~18px)

### Criteria & ALERT

- **컬럼별 임계치 설정** — `>`, `>=`, `<`, `<=`, `==`, `!=`, `contains`, `not_contains` 연산자 지원
- **ALERT 카운트 뱃지** — 조건에 해당하는 행 수를 위젯 헤더에 `ALERT n` 표시
- **ALERT 필터 토글** — `ALERT n` 클릭 시 조건 해당 행만 필터링
- **이상 셀 하이라이트** — 조건에 걸린 셀에 빨간 배경 강조 표시
- **숫자 자동 변환** — `1,234` 또는 `98%` 형식 값도 수치 비교 가능

### 대시보드 설정

- **JSON 내보내기/가져오기** — 전체 설정(위젯 목록, 레이아웃, 폰트 크기)을 JSON 파일로 저장 및 복원
- **파일 업로드 또는 텍스트 붙여넣기**로 설정 가져오기
- **로컬 스토리지 자동 저장** — 새로고침 후에도 설정 유지

### 인증 & 보안

- JWT 기반 로그인 및 세션 관리
- 401 응답 시 자동 로그아웃
- 미로그인 사용자 로그인 페이지로 리다이렉트

---

## 📁 프로젝트 구조

```
MonitoringDashboard/
├── public/                      # 정적 파일
├── src/
│   ├── components/
│   │   ├── ApiCard.jsx          # 위젯 카드 (헤더, 설정, 팝업, ALERT)
│   │   ├── ApiCard.css
│   │   ├── DynamicTable.jsx     # 동적 테이블 (정렬, 색상, 필터, 행 이벤트)
│   │   └── DynamicTable.css
│   ├── hooks/
│   │   └── useApi.js            # 위젯별 API 폴링 훅 (타이머 관리)
│   ├── pages/
│   │   ├── DashboardPage.jsx    # 메인 대시보드 (레이아웃, 설정 모달)
│   │   ├── DashboardPage.css
│   │   ├── LoginPage.jsx
│   │   └── LoginPage.css
│   ├── services/
│   │   └── api.js               # Axios 인스턴스 및 API 함수
│   ├── store/
│   │   ├── authStore.js         # 인증 상태 (Zustand)
│   │   └── dashboardStore.js    # 위젯/레이아웃/설정 상태 (Zustand)
│   ├── utils/
│   │   └── helpers.js           # Criteria 평가 함수 공유 유틸
│   ├── styles/
│   │   └── index.css            # 전역 CSS 변수 및 기본 스타일
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
├── README.md
└── IMPLEMENTATION_GUIDE.md
```

---

## 🚀 설치 및 실행

### 의존성 설치

```bash
cd MonitoringDashboard
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

---

## 🔌 백엔드 연동

### 필수 엔드포인트

#### 1. 로그인 `POST /auth/login`

**요청:**

```json
{
    "username": "admin",
    "password": "password123"
}
```

**응답 (200):**

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "admin"
    }
}
```

**오류:** 401 (인증 실패)

---

#### 2. 모니터링 데이터 엔드포인트

모든 데이터 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.

##### 배열 형식 `GET /api/status`

```json
[
    {
        "app_id": 1,
        "name": "CoinTrader",
        "status": "healthy",
        "cpu_usage": 45.2,
        "memory_usage": 67.8,
        "uptime_seconds": 3600,
        "last_update": "2026-03-24T10:30:00Z",
        "version": "1.0.0"
    },
    {
        "app_id": 2,
        "name": "FileTransfer",
        "status": "active",
        "cpu_usage": 32.1,
        "memory_usage": 54.2,
        "uptime_seconds": 7200,
        "last_update": "2026-03-24T10:30:00Z",
        "version": "2.1.3"
    }
]
```

##### 객체 형식 `GET /api/alerts`

```json
{
    "alert-1": {
        "alert_id": "alert-1",
        "app_name": "CoinTrader",
        "level": "error",
        "message": "High CPU usage detected",
        "timestamp": "2026-03-24T10:25:00Z",
        "acknowledged": false
    },
    "alert-2": {
        "alert_id": "alert-2",
        "app_name": "FileTransfer",
        "level": "warning",
        "message": "Memory threshold approaching",
        "timestamp": "2026-03-24T10:20:00Z",
        "acknowledged": true
    }
}
```

##### 메트릭 형식 `GET /api/metrics`

```json
[
    {
        "metric_id": "m-1",
        "name": "API Response Time",
        "unit": "ms",
        "value": 145.5,
        "threshold": 1000,
        "status": "ok"
    }
]
```

### 빠른 시작 — Python 백엔드 예제

```bash
pip install flask flask-cors PyJWT
python backend_sample.py
```

```python
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify([
        {
            'name': 'MyApp',
            'status': 'healthy',
            'cpu_usage': 30.5,
            'memory_usage': 60.2,
            'timestamp': datetime.now().isoformat()
        }
    ]), 200

if __name__ == '__main__':
    app.run(port=5000)
```

### 요청 예제 (curl)

```bash
# 로그인 및 토큰 획득
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# API 데이터 조회
curl -X GET http://localhost:5000/api/status \
  -H "Authorization: Bearer <token>"
```

---

## 📊 대시보드 사용법

### 1. 로그인

- `http://localhost:3000` 접속 후 사용자명/비밀번호 입력
- 기본 계정: **admin / password123** (백엔드 설정에 따라 변경)

### 2. 위젯 추가

- 헤더의 `＋` 버튼 클릭 → 제목과 엔드포인트 URL 입력 → 추가

### 3. 위젯 배치 변경

- 위젯 헤더를 드래그하여 위치 이동
- 위젯 우측 하단 모서리를 드래그하여 크기 조절
- 변경 사항은 자동 저장됨

### 4. 위젯 설정 (⚙ 버튼)

| 설정 항목              | 설명                                  |
| ---------------------- | ------------------------------------- |
| 표시 컬럼 선택         | 체크박스로 보여줄 컬럼 선택/해제      |
| 리프레시 주기          | 초 단위 입력 (1~3600)                 |
| Criteria (컬럼별 조건) | 연산자와 임계값 설정 (이하 섹션 참고) |

### 5. 행 조작

| 동작              | 결과                                 |
| ----------------- | ------------------------------------ |
| 단일 클릭         | 행 선택 (강조 표시)                  |
| 더블 클릭         | 행 상세 팝업 (실시간 업데이트)       |
| 행 선택 후 Ctrl+C | 헤더 포함 TSV 형식으로 클립보드 복사 |

### 6. 전체 새로고침

- 헤더의 `⟳` 버튼으로 모든 위젯 즉시 갱신

### 7. 위젯 삭제

- 위젯 설정 팝업 하단의 삭제 버튼 클릭

---

## 🎯 API 데이터 형식

### 지원 형식

#### 배열

```json
[
    { "id": 1, "name": "Item 1", "status": "active" },
    { "id": 2, "name": "Item 2", "status": "inactive" }
]
```

#### 객체 (키-값 맵)

```json
{
    "key1": { "id": "key1", "name": "Item 1", "status": "active" },
    "key2": { "id": "key2", "name": "Item 2", "status": "inactive" }
}
```

### 데이터 타입 처리

| 타입           | 예시            | 표시 방식     |
| -------------- | --------------- | ------------- |
| 문자열         | `"healthy"`     | 텍스트        |
| 숫자           | `45.2`, `1000`  | 숫자          |
| 불린           | `true`, `false` | ✓ / ✗         |
| 객체           | `{ ... }`       | [object] 버튼 |
| null/undefined | —               | — (점선)      |

### 상태 값 자동 색상

| 색상   | 해당 값 예시                                         |
| ------ | ---------------------------------------------------- |
| 초록색 | `healthy`, `success`, `active`, `ok`, `online`       |
| 빨간색 | `error`, `failed`, `critical`, `inactive`, `offline` |
| 노란색 | `warning`, `pending`, `busy`                         |

---

## 🚨 Criteria & ALERT

### Criteria 설정 방법

1. 위젯 헤더의 `⚙` 버튼 클릭
2. 설정 팝업 하단 **Criteria** 섹션에서 컬럼별 조건 입력
3. 체크박스로 활성화 → 연산자 선택 → 임계값 입력

### 지원 연산자

| 연산자         | 설명            | 예시                       |
| -------------- | --------------- | -------------------------- |
| `>`            | 초과            | `cpu_usage > 80`           |
| `>=`           | 이상            | `value >= 100`             |
| `<`            | 미만            | `latency < 500`            |
| `<=`           | 이하            | `score <= 0`               |
| `==`           | 같음            | `status == error`          |
| `!=`           | 다름            | `state != ok`              |
| `contains`     | 포함 (문자열)   | `message contains timeout` |
| `not_contains` | 미포함 (문자열) | `name not_contains test`   |

> **숫자 자동 변환:** `"1,234"`, `"98%"` 와 같이 쉼표나 `%`가 포함된 값도 수치로 변환하여 비교합니다.

### ALERT 뱃지 동작

- 조건에 해당하는 행이 있으면 위젯 헤더에 **`ALERT n`** (빨간색) 표시
- 조건 해당 행이 없으면 **`ALERT 0`** (초록색) 표시
- `ALERT n` 클릭 → 조건에 해당하는 행만 필터링 (토글)
- 조건 해당 행이 0이 되면 필터 자동 해제

---

## 💾 대시보드 설정 JSON

### 내보내기

1. 헤더 `⚙` 버튼 → **대시보드 설정** 모달
2. **내보내기 (JSON 다운로드)** 버튼 클릭
3. `dashboard-config-YYYY-MM-DDTHH-MM-SS.json` 파일 저장됨

### 가져오기

- **파일 선택** 버튼으로 JSON 파일 업로드, 또는
- 텍스트 영역에 JSON 직접 붙여넣기 → **가져오기 적용** 클릭

### JSON 구조

```json
{
    "version": "1.0.0",
    "exportedAt": "2026-03-24T10:00:00.000Z",
    "widgets": [
        {
            "id": "api-1",
            "title": "CoinTrader Status",
            "endpoint": "http://localhost:5000/api/status",
            "refreshIntervalSec": 10,
            "defaultLayout": { "x": 0, "y": 0, "w": 4, "h": 4 },
            "tableSettings": {
                "visibleColumns": ["name", "status", "cpu_usage"],
                "columnWidths": {},
                "criteria": {
                    "cpu_usage": {
                        "enabled": true,
                        "operator": ">",
                        "value": "80"
                    }
                }
            }
        }
    ],
    "layouts": {
        "api-1": { "x": 0, "y": 0, "w": 4, "h": 4, "minW": 2, "minH": 2 }
    },
    "dashboardSettings": {
        "widgetFontSize": 13
    }
}
```

### 폰트 크기 설정

대시보드 설정 모달에서 **위젯 폰트 크기** 항목으로 전체 위젯 테이블의 글자 크기를 조절합니다 (10~18px, 기본값: 13px).

---

## 💾 로컬 스토리지

대시보드는 다음 정보를 자동으로 로컬 스토리지에 저장합니다:

| 키                   | 내용                                                    |
| -------------------- | ------------------------------------------------------- |
| `auth_token`         | JWT 토큰 (로그인 유지)                                  |
| `user`               | 로그인 사용자 정보                                      |
| `dashboard_widgets`  | 위젯 목록 (endpoint, refreshIntervalSec, tableSettings) |
| `dashboard_layouts`  | 위젯별 위치 및 크기                                     |
| `dashboard_settings` | 전역 설정 (widgetFontSize 등)                           |

브라우저 콘솔에서 초기화:

```javascript
// 레이아웃만 초기화
localStorage.removeItem("dashboard_layouts");

// 전체 초기화
localStorage.clear();
```

---

## 🎨 테마 & 스타일

다크 테마 기반의 Prometheus 스타일 UI로, CSS 커스텀 속성으로 색상을 관리합니다.

```css
/* src/styles/index.css */
--bg-primary: #1a1a1a; /* 메인 배경 */
--bg-surface: #2a2a2a; /* 카드 배경 */
--bg-header: #343a40; /* 헤더 배경 */
--text-primary: #e0e0e0; /* 주 텍스트 */
--text-secondary: #999; /* 보조 텍스트 */
--text-tertiary: #666; /* 3차 텍스트 */
--accent-primary: #4a9eff; /* 강조 색상 */
--border-subtle: rgba(255, 255, 255, 0.07); /* 테두리 */

/* 상태 색상 */
--color-success: #28a745;
--color-error: #dc3545;
--color-warning: #ffc107;
--color-info: #0d6efd;
```

---

## 🐛 문제 해결

### 로그인 실패

- 백엔드 서버 실행 여부 확인 (`http://localhost:5000`)
- 사용자명/비밀번호 확인
- 브라우저 콘솔(F12 > Console)에서 에러 메시지 확인

### API 데이터가 안 나옴

- 위젯 설정의 엔드포인트 URL 확인
- 백엔드 CORS 설정 확인 (`Access-Control-Allow-Origin`)
- 브라우저 개발자 도구 > Network 탭에서 응답 확인
- JWT 토큰 만료 여부 확인 (재로그인)

### ALERT가 동작하지 않음

- Criteria 설정에서 체크박스가 활성화되어 있는지 확인
- 임계값 컬럼명이 API 응답의 실제 키와 정확히 일치하는지 확인
- 숫자 컬럼에 쉼표(`1,234`) 또는 `%` 기호가 있는 경우 자동 처리됨

### 레이아웃이 초기화됨

- `dashboard_widgets`, `dashboard_layouts` 키가 로컬 스토리지에 있는지 확인
- **설정 JSON 내보내기**로 백업 후 복원 가능

---

## 📚 기술 스택

| 항목            | 사용 기술                     |
| --------------- | ----------------------------- |
| 프레임워크      | React 18 + Vite               |
| 상태 관리       | Zustand                       |
| 레이아웃        | react-grid-layout             |
| HTTP 클라이언트 | Axios                         |
| 라우팅          | React Router v6               |
| 스타일          | CSS Modules + CSS 커스텀 속성 |

## 📚 추가 리소스

- [React 문서](https://react.dev)
- [Vite 문서](https://vitejs.dev)
- [Zustand 문서](https://zustand-demo.vercel.app)
- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- [Axios 문서](https://axios-http.com)
- [JWT 정보](https://jwt.io)


