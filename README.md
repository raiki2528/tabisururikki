# 旅する リッキー｜支援サイト

高校生・旅する リッキーのヒッチハイク日本一周を応援する静的サイトです。

## 公開方法（Vercel）

1. [Vercel](https://vercel.com/) にログイン
2. **Add New → Project**
3. GitHub リポジトリ `raiki2528/tabisururikki` を Import
4. 設定はそのまま（Framework: Other / Build Command: 空 / Output Directory: `./`）
5. **Deploy**

デプロイ後、`site-data.js` の `googleSheetCsvUrl` を設定すると支援額・現在地をスプレッドシートから更新できます。

## ローカル確認

```bash
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開いてください。

## 構成

- `index.html` — ページ本体
- `styles.css` / `script.js` — デザイン・動作
- `site-data.js` — 支援額・地図・ギャラリー設定
- `pref-data.js` — 日本地図データ
- `media/` — 写真・動画
