# 제리츄 뽑기판 V3 — SOOP 연동 준비 버전

## 이번 버전에 추가된 기능

- SOOP 후원 대기열
- 현재 뽑기 대상 자동 표시
- 번호를 한 번 뽑을 때 남은 횟수 자동 1회 차감
- 대기열 횟수 `+1 / -1`, 뒤로 보내기, 삭제
- 수동 대상 추가
- 웹 관리자 화면에서 뽑기 횟수 지급 기준 설정
  - 별풍선 개수 비례
  - 구간별 지급
  - 정확한 개수별 지급
- Apps Script 연결 테스트
- Apps Script 자동 확인 주기 설정
- 일반 후원 / 도전미션 / 배틀미션 선택 수신
- 스트리머 SOOP ID 필터

## GitHub Pages 업로드

이 폴더 안의 파일과 `assets` 폴더를 GitHub 저장소 루트에 전부 업로드합니다.

1. 저장소 `Settings`
2. `Pages`
3. Source: `Deploy from a branch`
4. Branch: `main`, Folder: `/ (root)`
5. Save

## SOOP 연동 순서

1. 기존 Apps Script 코드에 `SOOP_뽑기연동_추가패치.gs` 내용을 추가합니다.
2. 기존 `doGet(e)` 액션 분기에 다음을 추가합니다.

```javascript
if (action === 'drawPing') return handleDrawPing_(e);
if (action === 'drawEvents') return handleDrawEvents_(e);
if (action === 'drawAck') return handleDrawAck_(e);
```

3. 기존 `handleSoopGift_(e)`에서 후원을 `데이터_통합`에 저장한 직후 다음을 추가합니다.

```javascript
appendDrawInbox_({
  eventId: eventId,
  nickname: nickname,
  userId: userId,
  count: count,
  kind: kind,
  broadNo: broadNo,
  bjId: config.bjId
});
```

4. Apps Script를 **새 버전으로 배포**합니다.
5. 웹사이트의 `관리 설정 → SOOP 연동`에서 다음을 입력합니다.
   - Apps Script `/exec` 주소
   - 기존 `SOOP_COLLECTOR_TOKEN`
   - 지급 기준
6. `연결 테스트`를 누릅니다.
7. SOOP 연동을 켜고 설정을 저장합니다.

## 데이터 저장

- 뽑기판, 대기열, 지급 기준은 현재 방송용 브라우저의 localStorage에 저장됩니다.
- 후원 원본은 스프레드시트 `뽑기_수신함`에 저장됩니다.
- 사이트가 후원 이벤트를 가져오면 Apps Script에서 해당 이벤트 상태가 `queued`, `no_draw`, `ignored` 중 하나로 변경됩니다.

## 중요한 안내

현재 포함된 Apps Script 파일은 **추가 패치 템플릿**입니다. 기존 Apps Script 전체 코드의 변수명이나 분기 구조가 다를 경우 삽입 위치를 조정해야 합니다. 기존 집계 기능을 안전하게 유지한 전체 통합본을 만들려면 현재 사용 중인 Apps Script 전체 코드 또는 ZIP이 필요합니다.
