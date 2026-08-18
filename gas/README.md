# GAS 管理画面のセットアップ

スプレッドシートをスマホから簡単に更新するための管理画面です。

## 1. Apps Script を開く

1. [Riki クラファンサイト更新](https://docs.google.com/spreadsheets/d/1ZIc7VBcxDCOyj_o3QZ-Yqyk1uzZ61UYjBN0FPhgjQRQ/edit) を開く
2. **拡張機能 → Apps Script**

## 2. ファイルを追加

| ファイル名 | 中身 |
|---|---|
| `Code.gs` | `gas/Code.gs` をコピペ |
| `Admin`（HTML） | `gas/Admin.html` をコピペ |

HTML ファイルの追加: **＋ → HTML → ファイル名を `Admin` に**

## 3. PIN を変更

`Code.gs` の先頭:

```js
const ADMIN_PIN = "riki2026"; // ← 自分だけが知っているPINに変更
```

## 4. デプロイ

1. **デプロイ → 新しいデプロイ**
2. 種類: **ウェブアプリ**
3. 実行ユーザー: **自分**
4. アクセス: **全員**（匿名ユーザーを含む）
5. **デプロイ** → URL をコピー

## 5. 使い方

- コピーした URL をスマホのホーム画面に追加
- PIN を入力
- 支援金・都道府県を選んで **「サイトに反映する」**
- 公開サイトを再読み込みして確認

## 6. 支援者Instagram記録（任意）

デプロイ URL を `site-data.js` の `supporterLogUrl` に設定すると、
サイトで Instagram ユーザー名を入力した人が `supporters` シートに記録されます。

```js
supporterLogUrl: "https://script.google.com/macros/s/xxxxx/exec",
```

## シート構成

### シート1（既存）

| key | value |
|---|---|
| currentAmount | 24550 |
| currentLocation | 東京 |

### supporters（自動作成）

| 記録日時 | instagram | source |
|---|---|---|

支援前に入力された Instagram ユーザー名がここに溜まります。
