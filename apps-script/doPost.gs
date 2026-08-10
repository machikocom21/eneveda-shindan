// えねヴェーダ診断 → スプレッドシート保存用 Google Apps Script
// ※ このファイルはリポジトリ管理用のコピーです。
//    変更したら Apps Script エディタに貼り付けて「デプロイを管理」から再デプロイしてください。
//
// 列の構成
//   A列: 日時
//   B列: お名前
//   C列: メールアドレス
//   D列: 診断タイプ（診断結果の1行目）
//   E列: 診断結果テキスト
//   F列: Q1〜Q9の選択内容まとめ
//   G列: Q10の自由記述

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ad = d.answerDetails || {};
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      d.name || '',
      d.email || '',
      d.type || '',
      d.text || '',
      ad.summary || '',
      ad.free || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
