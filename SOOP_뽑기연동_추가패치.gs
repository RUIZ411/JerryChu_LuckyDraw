/**
 * 제리츄 뽑기판 V3 - SOOP 연동 추가 패치
 *
 * 기존 Apps Script의 doGet(e) 분기문에 아래 3개 액션을 추가하세요.
 *
 *   if (action === 'drawPing') return handleDrawPing_(e);
 *   if (action === 'drawEvents') return handleDrawEvents_(e);
 *   if (action === 'drawAck') return handleDrawAck_(e);
 *
 * 기존 handleSoopGift_(e)에서 후원 데이터가 데이터_통합에 정상 저장된 직후,
 * 아래 함수를 한 줄 추가하세요.
 *
 *   appendDrawInbox_({
 *     eventId: eventId,
 *     nickname: nickname,
 *     userId: userId,
 *     count: count,
 *     kind: kind,
 *     broadNo: broadNo,
 *     bjId: config.bjId
 *   });
 *
 * 이 패치는 기존 전역 상수 SOOP_COLLECTOR_TOKEN 및 verifySoopCollectorRequest_(e)를 사용합니다.
 */

var DRAW_INBOX_SHEET_NAME = '뽑기_수신함';

function handleDrawPing_(e) {
  if (!verifySoopCollectorRequest_(e)) {
    return drawJson_({ ok: false, message: '인증 토큰이 올바르지 않습니다.' });
  }
  ensureDrawInboxSheet_();
  return drawJson_({ ok: true, message: '제리츄 뽑기판 연결 확인 완료' });
}

function handleDrawEvents_(e) {
  if (!verifySoopCollectorRequest_(e)) {
    return drawJson_({ ok: false, message: '인증 토큰이 올바르지 않습니다.' });
  }

  var sheet = ensureDrawInboxSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return drawJson_({ ok: true, events: [] });

  var bjIdFilter = String((e.parameter && e.parameter.bjId) || '').trim().toLowerCase();
  var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  var events = [];

  values.forEach(function(row) {
    var status = String(row[8] || '').trim();
    var bjId = String(row[7] || '').trim();
    if (status !== '대기') return;
    if (bjIdFilter && bjId.toLowerCase() !== bjIdFilter) return;

    events.push({
      createdAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''),
      eventId: String(row[1] || ''),
      nickname: String(row[2] || ''),
      userId: String(row[3] || ''),
      count: Number(row[4] || 0),
      kind: String(row[5] || ''),
      broadNo: String(row[6] || ''),
      bjId: bjId
    });
  });

  return drawJson_({ ok: true, events: events });
}

function handleDrawAck_(e) {
  if (!verifySoopCollectorRequest_(e)) {
    return drawJson_({ ok: false, message: '인증 토큰이 올바르지 않습니다.' });
  }

  var eventId = String((e.parameter && e.parameter.eventId) || '').trim();
  var status = String((e.parameter && e.parameter.status) || 'queued').trim();
  if (!eventId) return drawJson_({ ok: false, message: 'eventId가 없습니다.' });

  var sheet = ensureDrawInboxSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return drawJson_({ ok: false, message: '대상 이벤트가 없습니다.' });

  var ids = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === eventId) {
      sheet.getRange(i + 2, 9, 1, 2).setValues([[status, new Date()]]);
      return drawJson_({ ok: true, eventId: eventId, status: status });
    }
  }

  return drawJson_({ ok: false, message: 'eventId를 찾지 못했습니다.' });
}

function appendDrawInbox_(gift) {
  var sheet = ensureDrawInboxSheet_();
  var eventId = String(gift.eventId || '').trim();
  if (!eventId) return;

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var finder = sheet.getRange(2, 2, lastRow - 1, 1)
      .createTextFinder(eventId)
      .matchEntireCell(true)
      .findNext();
    if (finder) return; // 이벤트 ID 중복 방지
  }

  sheet.appendRow([
    new Date(),
    eventId,
    String(gift.nickname || ''),
    String(gift.userId || ''),
    Number(gift.count || 0),
    String(gift.kind || ''),
    String(gift.broadNo || ''),
    String(gift.bjId || ''),
    '대기',
    ''
  ]);
}

function ensureDrawInboxSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(DRAW_INBOX_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(DRAW_INBOX_SHEET_NAME);
    sheet.getRange(1, 1, 1, 10).setValues([[
      '등록 시간', '이벤트 ID', '닉네임', '후원자 SOOP ID', '별풍선 개수',
      '후원 종류', '방송 번호', '스트리머 SOOP ID', '처리 상태', '처리 시간'
    ]]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function drawJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
