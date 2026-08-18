/**
 * 公開時の初期データです。
 *
 * Googleスプレッドシート連携を設定するときは、2列（key / value）のシートを
 * 「ウェブに公開 → CSV」で公開し、そのURLを googleSheetCsvUrl に入れてください。
 *
 * 対応するkey:
 * currentAmount / currentLocation / deadline / paypayUrl / paypayQrImage
 */
window.SITE_DATA = {
  goalAmount: 300000,
  currentAmount: 0,
  currentLocation: "東京",
  deadline: "2026-08-31",
  googleSheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNSfjEYnqttbeO3h0TgX8vqGGCAzNCMEXPDgnVXyq-vuFX71queRfXn1I4FJGlxBVAuEzGU5yVmuWt/pub?gid=0&single=true&output=csv",
  paypayUrl: "https://qr.paypay.ne.jp/p2p01_A1I2BvXzLOKWdlUn",
  paypayQrImage: "./media/paypay-qr.jpg",
  supporterLogUrl: "",

  // 都道府県コード（JIS X 0401）
  visitedPrefectureCodes: [
    1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
  ],

  galleryItems: [
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_旅_260817_1.jpg",
      alt: "東京を目指すヒッチハイク看板",
      wide: true,
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_4.jpg",
      alt: "日本最北端の地・宗谷岬",
    },
    {
      type: "video",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_1.mp4",
      alt: "旅の途中の動画 1",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_1.jpg",
      alt: "旅先で出会った銅像と一緒に",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_8.jpg",
      alt: "旅先のラーメン屋で",
    },
    {
      type: "video",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_2.mp4",
      alt: "旅の途中の動画 2",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_2.jpg",
      alt: "旅の風景",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_3.jpg",
      alt: "旅の風景",
    },
    {
      type: "video",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_3.mp4",
      alt: "旅の途中の動画 3",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_5.jpg",
      alt: "旅の風景",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_6.jpg",
      alt: "旅の風景",
      wide: true,
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_7.jpg",
      alt: "旅の風景",
    },
    {
      type: "photo",
      src: "./media/gallery/LINE_ALBUM_20260817_260817_9.jpg",
      alt: "旅の風景",
    },
  ],
};
