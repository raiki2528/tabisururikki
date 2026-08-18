const PREFECTURES = {
  1: "北海道",
  2: "青森",
  3: "岩手",
  4: "宮城",
  5: "秋田",
  6: "山形",
  7: "福島",
  8: "茨城",
  9: "栃木",
  10: "群馬",
  11: "埼玉",
  12: "千葉",
  13: "東京",
  14: "神奈川",
  15: "新潟",
  16: "富山",
  17: "石川",
  18: "福井",
  19: "山梨",
  20: "長野",
  21: "岐阜",
  22: "静岡",
  23: "愛知",
  24: "三重",
  25: "滋賀",
  26: "京都",
  27: "大阪",
  28: "兵庫",
  29: "奈良",
  30: "和歌山",
  31: "鳥取",
  32: "島根",
  33: "岡山",
  34: "広島",
  35: "山口",
  36: "徳島",
  37: "香川",
  38: "愛媛",
  39: "高知",
  40: "福岡",
  41: "佐賀",
  42: "長崎",
  43: "熊本",
  44: "大分",
  45: "宮崎",
  46: "鹿児島",
  47: "沖縄",
};

const initialData = window.SITE_DATA || {};
let siteData = { ...initialData };

const formatYen = (value) =>
  `${new Intl.NumberFormat("ja-JP").format(Math.max(0, Number(value) || 0))}円`;

const formatDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

function updateStatus(data) {
  const goal = Math.max(1, Number(data.goalAmount) || 300000);
  const current = Math.max(0, Number(data.currentAmount) || 0);
  const percent = Math.min(100, Math.round((current / goal) * 100));

  document.querySelectorAll("[data-current-amount]").forEach((element) => {
    element.textContent = formatYen(current);
  });
  document.querySelectorAll("[data-goal-amount]").forEach((element) => {
    element.textContent = formatYen(goal);
  });
  document.querySelectorAll("[data-progress-percent]").forEach((element) => {
    element.textContent = `${percent}%`;
  });
  document.querySelectorAll("[data-current-location]").forEach((element) => {
    element.textContent = data.currentLocation || "旅の途中";
  });
  document.querySelectorAll("[data-deadline]").forEach((element) => {
    element.textContent = formatDate(data.deadline || "2026-08-31");
  });

  requestAnimationFrame(() => {
    document.querySelectorAll("[data-progress-bar]").forEach((element) => {
      element.style.width = `${percent}%`;
    });
  });
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

async function loadSheetData() {
  if (!siteData.googleSheetCsvUrl) return;

  try {
    const response = await fetch(siteData.googleSheetCsvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csv = await response.text();
    const rows = csv
      .split(/\r?\n/)
      .map(parseCsvLine)
      .filter(([key]) => key && key.toLowerCase() !== "key");
    const sheetData = Object.fromEntries(rows.map(([key, value]) => [key, value]));

    siteData = {
      ...siteData,
      ...sheetData,
      currentAmount: Number(String(sheetData.currentAmount || siteData.currentAmount).replace(/,/g, "")),
    };
    updateStatus(siteData);
    renderMap(siteData);
    setupPayPay(siteData);
  } catch (error) {
    console.warn("Googleスプレッドシートのデータを取得できませんでした。初期値を表示します。", error);
  }
}

function project([longitude, latitude]) {
  return [(longitude - 122) * 31, (46.4 - latitude) * 22.5];
}

function ringToPath(ring) {
  return ring
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ")
    .concat(" Z");
}

function geometryToPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
}

function findPrefectureCode(name) {
  return Number(
    Object.entries(PREFECTURES).find(([, prefectureName]) => prefectureName === name)?.[0] || 0,
  );
}

function fitMapViewBox(svg) {
  const paths = svg.querySelectorAll("path");
  if (paths.length === 0) return;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  paths.forEach((path) => {
    const box = path.getBBox();
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });

  const padding = 14;
  svg.setAttribute(
    "viewBox",
    [
      (minX - padding).toFixed(2),
      (minY - padding).toFixed(2),
      (maxX - minX + padding * 2).toFixed(2),
      (maxY - minY + padding * 2).toFixed(2),
    ].join(" "),
  );
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
}

async function renderMap(data) {
  const svg = document.querySelector("#japan-map");
  const loading = document.querySelector("[data-map-loading]");
  if (!svg || svg.dataset.loaded === "true") {
    if (svg) {
      const currentCode = findPrefectureCode(data.currentLocation);
      svg.querySelectorAll("path").forEach((path) => {
        path.classList.toggle("current", Number(path.dataset.code) === currentCode);
      });
    }
    return;
  }

  try {
    let geojson = window.PREFECTURE_GEOJSON;
    if (!geojson) {
      const response = await fetch("./pref.geojson");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      geojson = await response.json();
    }
    const visited = new Set((data.visitedPrefectureCodes || []).map(Number));
    const currentCode = findPrefectureCode(data.currentLocation);
    const fragment = document.createDocumentFragment();

    geojson.features.forEach((feature) => {
      const code = Number(feature.properties.code);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");

      path.setAttribute("d", geometryToPath(feature.geometry));
      path.dataset.code = String(code);
      path.classList.toggle("visited", visited.has(code));
      path.classList.toggle("current", code === currentCode);
      title.textContent = `${PREFECTURES[code] || feature.properties.name}${
        code === currentCode ? "（現在地）" : visited.has(code) ? "（訪問済み）" : ""
      }`;
      path.append(title);
      fragment.append(path);
    });

    svg.replaceChildren(fragment);
    fitMapViewBox(svg);
    svg.dataset.loaded = "true";
    document.querySelector("[data-visited-count]").textContent = String(visited.size);
    if (loading) loading.remove();
  } catch (error) {
    if (loading) loading.textContent = "地図を読み込めませんでした。";
    console.error("日本地図の読み込みに失敗しました。", error);
  }
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px" },
  );

  elements.forEach((element) => observer.observe(element));
}

function setupGallery() {
  const grid = document.querySelector("[data-gallery-grid]");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxContent = document.querySelector("[data-lightbox-content]");
  const closeButton = document.querySelector(".lightbox-close");
  const filters = document.querySelectorAll(".gallery-filter");
  const items = siteData.galleryItems || [];

  if (!grid || items.length === 0) return;

  let activeFilter = "all";

  const renderGallery = () => {
    const filtered = items.filter((item) => activeFilter === "all" || item.type === activeFilter);
    grid.replaceChildren();

    filtered.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gallery-item${item.wide ? " wide" : ""}`;
      button.dataset.type = item.type;
      button.dataset.src = item.src;
      button.setAttribute("aria-label", item.alt);

      if (item.type === "video") {
        const video = document.createElement("video");
        video.src = `${item.src}#t=0.1`;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        button.append(video);

        const badge = document.createElement("span");
        badge.className = "play-badge";
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
      } else {
        const image = document.createElement("img");
        image.src = item.src;
        image.alt = item.alt;
        image.loading = "lazy";
        button.append(image);
      }

      button.addEventListener("click", () => openLightbox(item));
      grid.append(button);
    });
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxContent) return;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightboxContent.replaceChildren();
    document.body.style.overflow = "";
  };

  const openLightbox = (item) => {
    if (!lightbox || !lightboxContent) return;
    lightboxContent.replaceChildren();

    if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      lightboxContent.append(video);
    } else {
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      lightboxContent.append(image);
    }

    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  };

  filters.forEach((filterButton) => {
    filterButton.addEventListener("click", () => {
      activeFilter = filterButton.dataset.filter || "all";
      filters.forEach((button) => {
        const isActive = button === filterButton;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      renderGallery();
    });
  });

  closeButton?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });

  renderGallery();
}

function setupPayPay(data) {
  const block = document.querySelector("[data-paypay-block]");
  const url = data.paypayUrl;
  const qrImage = data.paypayQrImage;

  if (!block || !url) {
    block?.remove();
    return;
  }

  block.querySelectorAll("[data-paypay-link]").forEach((link) => {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  const qr = block.querySelector("[data-paypay-qr]");
  if (qr && qrImage) {
    qr.src = qrImage;
    qr.alt = "PayPayで支援するQRコード";
  }
}

document.querySelectorAll(".support-link").forEach((link) => {
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

updateStatus(siteData);
renderMap(siteData);
setupPayPay(siteData);
loadSheetData();
setupRevealAnimations();
setupGallery();
