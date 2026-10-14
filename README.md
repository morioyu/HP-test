# 長崎県病院協議会 ホームページ

HTML / CSS / JavaScript のみで構成した静的サイトです（ビルド不要）。

## ファイル構成

```
index.html      トップページ
about.html      協議会概要（会長あいさつ・目的・組織概要・組織図・沿革・アクセス）
news.html       お知らせ一覧（カテゴリ絞り込み・ページ送り・詳細モーダル）
contact.html    お問い合わせフォーム（入力 → 確認 → 完了、入力チェック付き）
css/style.css   スタイル（レスポンシブ対応）
js/main.js      共通スクリプト
js/news-data.js お知らせデータ
images/logo.svg ロゴ・ファビコン
```

## 確認方法

`index.html` をブラウザで開くか、`python3 -m http.server` で起動して http://localhost:8000 を開きます。

## 公開前に差し替えが必要な箇所

- 住所・電話番号・FAX（`〒850-0000`、`095-000-0000` などの仮表記。全ページのフッター、`about.html`、`contact.html`）
- 会長名・設立年・沿革・会員病院数（`〇〇` 表記、`index.html` の数値 `data-count`）
- 会長写真・地図（`about.html` 内のコメント参照）
- お知らせ内容（`js/news-data.js` の配列先頭に追加）
- お問い合わせの送信処理：現在は画面遷移のみで実際には送信されません。
  `js/main.js` の `#send` クリック処理内でサーバー（メール送信 API やフォームサービス）へ送信するよう実装してください。
