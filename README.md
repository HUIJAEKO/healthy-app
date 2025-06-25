# 🏋️‍♀️ FitTogether - 헬스 기록 및 친구 공유 앱


## 🎯 프로젝트 소개

**VibeHealth**는 식단과 운동을 기록하고, 자신의 운동 및 식단을 공유하며 동기부여를 받을 수 있는 **헬스 기록 앱**입니다.

- 식단/운동 기록을 간편하게 입력
- 캘린더로 활동 히스토리 시각화
- 친구와 상호 열람 및 1:1 채팅 가능
- 지속적인 루틴 유지를 위한 동기부여 UX 제공

---

## ✅ 주요 기능 (MVP)

| 기능 | 설명 |
|------|------|
| **식단 입력** | 시간대별(아침/점심/저녁/간식)로 음식 및 영양소 기록. 하루 총합 자동 계산. OCR 기능 선택적 사용. |
| **운동 기록** | 운동 부위 다중 선택, 세트/반복/무게 등 기록 가능. |
| **활동 캘린더** | 날짜별 기록 여부 시각화. 클릭 시 해당일 상세 기록 조회. |
| **친구 기능** | 친구 추가, 친구의 캘린더/기록 열람 가능. |
| **메시지** | 친구와 1:1 채팅, 응원 및 정보 교류 가능. |

---

## 🗂️ 앱 구조

### 📱 하단 탭 네비게이션

| 탭 | 설명 |
|----|------|
| 🏠 홈 | 오늘 식단/운동 요약 + 빠른 입력 버튼 + 오늘 친구의 활동 |
| 📝 기록 | 식단/운동 입력 UI |
| 📅 활동 | 내 캘린더 및 상세 기록 조회 |
| 👥 친구 | 친구 목록/추가/기록 열람 |
| 💬 메시지 | 1:1 채팅 기능 |

---

## 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React / Expo (React Native), TypeScript |
| **Backend** | Supabase (Auth + DB + Realtime + Storage) |
| **Hosting** | Vercel |
| **DB** | PostgreSQL (via Supabase) |
| **Realtime** | Supabase Realtime (WebSocket 기반) |
| **Storage** | Supabase Storage (이미지 업로드) |

---

## 🧱 아키텍처

```txt
[Client: React / React Native (Expo)]
            ↓ REST / WebSocket
[Supabase: Auth + DB + Storage + Realtime]
            ↓
[Vercel: 정적/SSR 배포]
