# 旅する リッキー｜支援サイト

高校生・旅する リッキーのヒッチハイク日本一周を応援する静的サイトです。

## 公開方法（Vercel）

1. [Vercel](https://vercel.com/) にログイン
2. **Add New → Project**
3. GitHub リポジトリ `raiki2528/tabisururikki` を Import
4. 設定はそのまま（Framework: Other / Build Command: 空 / Output Directory: `./`）
5. **Deploy**

## ローカル確認

```bash
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開いてください。

## サイト内容の更新方法

### 方法A：ファイルを直接編集（いちばん簡単）

`site-data.js` を編集して GitHub に push すると、Vercel が自動で再デプロイされます。

| 項目 | 編集する値 | 例 |
| --- | --- | --- |
| 支援金の合計 | `currentAmount` | `12500` |
| 現在地（都道府県名） | `currentLocation` | `"大阪"` |
| 目標金額 | `goalAmount` | `300000` |
| 締切日 | `deadline` | `"2026-08-31"` |
| PayPayリンク | `paypayUrl` | `"https://qr.paypay.ne.jp/..."` |
| PayPay QR画像 | `paypayQrImage` | `"./media/paypay-qr.jpg"` |

**PayPay QRコードを差し替えるとき**

1. 新しい QR 画像を `media/paypay-qr.jpg` に上書き保存（または別名で保存して `paypayQrImage` のパスを変更）
2. PayPay アプリで新しいリンクを発行したら `paypayUrl` も更新
3. GitHub に push

**訪問済み都道府県を更新するとき**

`visitedPrefectureCodes` の配列に都道府県コード（1=北海道 … 47=沖縄）を追加・削除します。

### 方法B：Googleスプレッドシートから更新（スマホでも編集しやすい）

スプレッドシートを「ウェブに公開 → CSV」で公開し、`site-data.js` の `googleSheetCsvUrl` に URL を設定します。

シートは **2列（key / value）** で、1行1項目です。

| key | value |
| --- | --- |
| currentAmount | 12500 |
| currentLocation | 大阪 |
| deadline | 2026-08-31 |
| paypayUrl | https://qr.paypay.ne.jp/... |
| paypayQrImage | ./media/paypay-qr.jpg |

サイトを開くたびに CSV を読み込むので、スプレッドシートを書き換えるだけで支援額・現在地・PayPay 情報が更新されます。

**注意：** QR 画像ファイル自体の差し替えは、スプレッドシートではできません。画像は `media/` フォルダにアップロードし、必要なら `paypayQrImage` のパスだけシートで変更してください。

## 構成

- `index.html` — ページ本体
- `styles.css` / `script.js` — デザイン・動作
- `site-data.js` — 支援額・地図・ギャラリー・PayPay 設定
- `pref-data.js` — 日本地図データ
- `media/` — 写真・動画・PayPay QR
