/**
 * 旅する リッキー｜サイト管理 GAS
 *
 * セットアップ:
 * 1. Googleスプレッドシート「Riki クラファンサイト更新」を開く
 * 2. 拡張機能 → Apps Script
 * 3. この Code.gs の内容を貼り付け
 * 4. Admin.html を HTML ファイルとして追加（ファイル名: Admin）
 * 5. ADMIN_PIN を好きな4桁以上の数字に変更
 * 6. デプロイ → 新しいデプロイ → 種類: ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員（匿名含む）
 * 7. 表示された URL を控える
 *    - 管理画面としてブラウザで開く
 *    - site-data.js の supporterLogUrl に同じ URL を設定（支援者Instagram記録用）
 */

const ADMIN_PIN = "riki2026"; // ← 必ず変更してください
const DATA_SHEET_NAME = "シート1";
const SUPPORTERS_SHEET_NAME = "supporters";

const PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知",
  "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知",
  "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
];

function doGet(e) {
  const action = (e.parameter.action || "admin").toLowerCase();

  if (action === "data") {
    return ContentService.createTextOutput(JSON.stringify(getSiteData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "logsupporter") {
    try {
      logSupporter_(e.parameter.instagram, e.parameter.source || "website");
      return jsonResponse_({ ok: true })
        .setHeader("Access-Control-Allow-Origin", "*");
    } catch (error) {
      return jsonResponse_({ ok: false, error: String(error.message || error) })
        .setHeader("Access-Control-Allow-Origin", "*");
    }
  }

  return HtmlService.createHtmlOutputFromFile("Admin")
    .setTitle("旅リッキー サイト管理")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function saveFromAdmin(payload) {
  assertAdminPin_(payload.pin);
  saveSiteData_(payload.currentAmount, payload.currentLocation);
  return { ok: true, data: getSiteData() };
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (body.action === "save") {
      assertAdminPin_(body.pin);
      saveSiteData_(body.currentAmount, body.currentLocation);
      return jsonResponse_({ ok: true, data: getSiteData() });
    }

    if (body.action === "logSupporter" || body.instagram) {
      logSupporter_(body.instagram, body.source || "website");
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: "Unknown action" });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  }
}

function getSiteData() {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getValues();
  const data = {};

  values.forEach((row) => {
    const key = String(row[0] || "").trim();
    const value = row[1];
    if (key && key.toLowerCase() !== "key") {
      data[key] = value;
    }
  });

  return {
    currentAmount: Number(String(data.currentAmount || "0").replace(/,/g, "")),
    currentLocation: String(data.currentLocation || "東京"),
    updatedAt: new Date().toISOString(),
  };
}

function saveSiteData_(currentAmount, currentLocation) {
  const amount = Number(String(currentAmount || "0").replace(/,/g, ""));
  const location = String(currentLocation || "").trim();

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("支援金額が正しくありません");
  }
  if (!PREFECTURES.includes(location)) {
    throw new Error("都道府県名が正しくありません");
  }

  upsertKeyValue_("currentAmount", amount);
  upsertKeyValue_("currentLocation", location);
}

function logSupporter_(instagram, source) {
  const username = normalizeInstagram_(instagram);
  if (!username) {
    throw new Error("Instagramユーザー名が正しくありません");
  }

  const sheet = getSupportersSheet_();
  sheet.appendRow([new Date(), username, source]);
}

function upsertKeyValue_(key, value) {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }

  sheet.appendRow([key, value]);
}

function getDataSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME) || ss.getSheets()[0];
  return sheet;
}

function getSupportersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUPPORTERS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SUPPORTERS_SHEET_NAME);
    sheet.appendRow(["記録日時", "instagram", "source"]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function normalizeInstagram_(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9._]/g, "");
}

function assertAdminPin_(pin) {
  if (String(pin || "") !== ADMIN_PIN) {
    throw new Error("PINが正しくありません");
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
