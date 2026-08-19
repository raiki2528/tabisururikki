# GAS 管理画面 + 支援者 Instagram 記録

## 1. Apps Script を開く

1. [Riki クラファンサイト更新](https://docs.google.com/spreadsheets/d/1ZIc7VBcxDCOyj_o3QZ-Yqyk1uzZ61UYjBN0FPhgjQRQ/edit) を開く
2. **拡張機能 → Apps Script**

## 2. ファイルを追加・更新

| ファイル名 | 中身 |
|---|---|
| `Code.gs` | `gas/Code.gs` をコピペ（上書き） |
| `Admin`（HTML） | `gas/Admin.html` をコピペ |

HTML の追加: **＋ → HTML → ファイル名を `Admin` に**

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

URL の例:
```
https://script.google.com/macros/s/AKfycbxxxxxxxx/exec
```

## 5. サイトに URL を設定

`site-data.js` の `supporterLogUrl` に、**4. でコピーした URL** を入れる:

```js
supporterLogUrl: "https://script.google.com/macros/s/AKfycbxxxxxxxx/exec",
```

GitHub に push すると Vercel が再デプロイされます。

## 6. 動作確認

### 支援者 Instagram 記録

1. 公開サイトで Instagram ユーザー名を入力
2. スプレッドシートに **`supporters`** シートが自動作成される
3. 1行追加されていれば成功

| 記録日時 | instagram | source |
|---|---|---|
| 2026/8/19 15:00:00 | someone_name | support-gate |

#### 記録されないとき（重要）

**確認結果（2026/8/19）:** 新しい GAS URL も **Google ログイン画面にリダイレクト** されています。  
→ **「アクセス: 全員」になっていません。** これが記録されない直接の原因です。

テスト URL（ブラウザで開く）:
```
https://script.google.com/macros/s/AKfycbx5eDYPZrfw1Ldo67uB8UTwA-O_wZV2lDo3NNIY3S1M-DZKUeAT2lfm47q50wUeEwS1/exec?action=logSupporter&instagram=test&source=support-gate
```

| 表示 | 意味 |
|---|---|
| `{"ok":true}` | ✅ OK |
| Google ログイン画面 | ❌ デプロイ設定が間違い |

**直し方（Apps Script）:**
1. [スプレッドシート](https://docs.google.com/spreadsheets/d/1ZIc7VBcxDCOyj_o3QZ-Yqyk1uzZ61UYjBN0FPhgjQRQ/edit) → **拡張機能 → Apps Script**
2. `Code.gs` を最新版に更新 → 保存
3. エディタで `testLogSupporter` を選んで **実行**（初回は権限許可）→ スプレッドシートに `supporters` ができるか確認
4. **デプロイ → デプロイを管理 → 鉛筆**
5. **次のユーザーとして実行: 自分**
6. **アクセスできるユーザー: 全員** ← 「組織内」「Googleアカウントを持つユーザー」ではない
7. **新バージョン** → **デプロイ**

---

## 代替：Googleフォーム（GASが直らない場合・推奨）

GAS の公開設定が難しい場合、**Googleフォーム**なら匿名でも確実に記録できます。

### 1. フォームを作成

1. [スプレッドシート](https://docs.google.com/spreadsheets/d/1ZIc7VBcxDCOyj_o3QZ-Yqyk1uzZ61UYjBN0FPhgjQRQ/edit) → **ツール → フォームを作成**
2. 質問1: 「Instagramユーザー名」（記述式・必須）
3. フォームの **回答** タブ → **スプレッドシートにリンク**（同じブックに）

### 2. entry ID を取得

1. フォーム編集画面 → 右上 **⋮** → **事前入力用の URL を取得**
2. Instagram欄に `test` と入力 → URL をコピー
3. URL から2つを控える:
   - `https://docs.google.com/forms/d/e/XXXX/formResponse` → `supporterFormAction`
   - `entry.1234567890` → `supporterFormEntry`

### 3. site-data.js に設定

```js
supporterFormAction: "https://docs.google.com/forms/d/e/XXXX/formResponse",
supporterFormEntry: "entry.1234567890",
```

push 後、サイトから入力するとフォーム回答シートに記録されます。

---

#### GAS で記録されないとき（旧メモ）

**原因の9割：GAS のアクセス設定**

テスト URL をブラウザで開く:
```
（あなたのGAS URL）?action=logSupporter&instagram=test&source=support-gate
```

- ✅ `{"ok":true}` と表示 → OK
- ❌ **Google ログイン画面** → アクセス設定が間違っています

**直し方:**
1. Apps Script → **デプロイ → デプロイを管理**
2. 鉛筆アイコン → **アクセス: 全員**（匿名ユーザーを含む）
3. **新バージョン** を選んで **デプロイ**
4. `Code.gs` が最新版（`logSupporter` 対応）か確認

**Code.gs も更新:**
- リポジトリの `gas/Code.gs` を Apps Script にコピペしてから再デプロイ

#### 動作確認用 URL の例

```
https://script.google.com/macros/s/xxxxx/exec?action=logSupporter&instagram=test_user&source=support-gate
```

`{"ok":true}` が出れば、サイトからも記録されます。

### 管理画面

- 同じ URL をブラウザで開く → 支援金・現在地を更新

## 7. コードを更新したとき

Apps Script の `Code.gs` を直したら:

**デプロイ → デプロイを管理 → 鉛筆 → 新バージョン → デプロイ**

サイト側（`supporterLogUrl`）の URL は変わりません。

## シート構成

### シート1（既存）

| key | value |
|---|---|
| currentAmount | 24550 |
| currentLocation | 東京 |

### supporters（自動作成）

支援前に Instagram を入力した人の一覧。**入力した ≠ 支援完了** なので、OFUSE/PayPay の入金と DM で突き合わせてください。
