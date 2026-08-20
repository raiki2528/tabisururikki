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

let leafletMap = null;
let geoJsonLayer = null;
let prefectureGeoJson = null;

function getPrefectureStyle(code, visited, currentCode) {
  if (code === currentCode) {
    return {
      fillColor: "#c45c26",
      fillOpacity: 0.92,
      color: "#ffffff",
      weight: 2.5,
    };
  }
  if (visited.has(code)) {
    return {
      fillColor: "#1a4d3a",
      fillOpacity: 0.82,
      color: "#ffffff",
      weight: 1.8,
    };
  }
  return {
    fillColor: "#ece7df",
    fillOpacity: 1,
    color: "#b8b0a4",
    weight: 1.2,
  };
}

function renderPrefectureChips(data) {
  const chipList = document.querySelector("[data-pref-chip-list]");
  const currentChip = document.querySelector("[data-current-chip]");
  const visited = (data.visitedPrefectureCodes || []).map(Number);
  const currentName = data.currentLocation || "旅の途中";

  if (currentChip) currentChip.textContent = currentName;

  if (!chipList) return;

  chipList.replaceChildren();
  visited
    .filter((code) => PREFECTURES[code] && PREFECTURES[code] !== currentName)
    .sort((a, b) => a - b)
    .forEach((code) => {
      const chip = document.createElement("span");
      chip.className = "pref-chip visited";
      chip.textContent = PREFECTURES[code];
      chipList.append(chip);
    });
}

async function renderMap(data) {
  const container = document.querySelector("#japan-map-leaflet");
  const loading = document.querySelector("[data-map-loading]");
  if (!container || typeof L === "undefined") return;

  try {
    if (!prefectureGeoJson) {
      prefectureGeoJson = window.PREFECTURE_GEOJSON;
      if (!prefectureGeoJson) {
        const response = await fetch("./pref.geojson");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        prefectureGeoJson = await response.json();
      }
    }

    const visited = new Set((data.visitedPrefectureCodes || []).map(Number));
    const currentCode = findPrefectureCode(data.currentLocation);

    if (!leafletMap) {
      leafletMap = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 10,
        minZoom: 4,
      }).addTo(leafletMap);
    }

    if (geoJsonLayer) {
      leafletMap.removeLayer(geoJsonLayer);
    }

    geoJsonLayer = L.geoJSON(prefectureGeoJson, {
      style: (feature) => getPrefectureStyle(Number(feature.properties.code), visited, currentCode),
      onEachFeature: (feature, layer) => {
        const code = Number(feature.properties.code);
        const name = PREFECTURES[code] || feature.properties.name;
        const status =
          code === currentCode ? "現在地" : visited.has(code) ? "訪問済み" : "これから";
        layer.bindPopup(`<strong>${name}</strong><br>${status}`);
      },
    }).addTo(leafletMap);

    leafletMap.fitBounds(geoJsonLayer.getBounds(), { padding: [16, 16] });

    document.querySelectorAll("[data-visited-count]").forEach((element) => {
      element.textContent = String(visited.size);
    });
    renderPrefectureChips(data);
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

function findPrefectureCode(name) {
  return Number(
    Object.entries(PREFECTURES).find(([, prefectureName]) => prefectureName === name)?.[0] || 0,
  );
}

const INSTAGRAM_STORAGE_KEY = "riki_support_instagram";

function normalizeInstagram(value) {
  let normalized = String(value || "").trim();
  const fromUrl = normalized.match(/(?:instagram\.com\/|instagr\.am\/)([A-Za-z0-9._]+)/i);
  if (fromUrl) normalized = fromUrl[1];

  return normalized
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9._]/g, "")
    .slice(0, 30);
}

function showInstagramError(message) {
  const error = document.querySelector("[data-instagram-error]");
  if (!error) return;
  if (message) {
    error.textContent = message;
    error.hidden = false;
    return;
  }
  error.hidden = true;
}

function scrollToSupportPlans() {
  document.querySelector(".return-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setSupportUnlocked(unlocked) {
  document.querySelectorAll(".support-action").forEach((element) => {
    element.classList.toggle("is-locked", !unlocked);
    element.setAttribute("aria-disabled", unlocked ? "false" : "true");
    if (element.tagName === "A") {
      element.tabIndex = unlocked ? 0 : -1;
    }
  });

  const lockedNotice = document.querySelector("[data-support-locked]");
  if (lockedNotice) lockedNotice.hidden = unlocked;
}

async function logSupporterInstagram(username) {
  const normalized = normalizeInstagram(username);
  if (!normalized) return;

  // 方法A: Googleフォーム（匿名でも確実に動く）
  if (siteData.supporterFormAction && siteData.supporterFormEntry) {
    try {
      const body = new URLSearchParams();
      body.set(siteData.supporterFormEntry, normalized);
      await fetch(siteData.supporterFormAction, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      return;
    } catch (error) {
      console.warn("Googleフォームへの送信に失敗しました。", error);
    }
  }

  // 方法B: GAS Webアプリ
  const baseUrl = siteData.supporterLogUrl;
  if (!baseUrl) return;

  const params = new URLSearchParams({
    action: "logSupporter",
    instagram: normalized,
    source: "support-gate",
  });
  const url = `${baseUrl}?${params.toString()}`;

  const beacon = new Image();
  beacon.referrerPolicy = "no-referrer";
  beacon.src = url;

  try {
    const response = await fetch(url, { method: "GET", mode: "cors" });
    if (!response.ok) {
      console.warn("支援者ログ: HTTP", response.status);
      return;
    }
    const result = await response.json();
    if (!result.ok) console.warn("支援者ログ:", result.error);
  } catch (error) {
    console.warn(
      "GASへの記録に失敗しました。Googleフォーム設定（supporterFormAction）を使うか、GASの「アクセス: 全員」を確認してください。",
      error,
    );
  }
}

function applyInstagramUsername(username, options = {}) {
  const { scrollToPlans = false } = options;
  const normalized = normalizeInstagram(username);
  const form = document.querySelector("[data-instagram-form]");
  const success = document.querySelector("[data-instagram-success]");
  const display = document.querySelector("[data-instagram-display]");
  const input = document.querySelector("[data-instagram-input]");

  if (!normalized) {
    sessionStorage.removeItem(INSTAGRAM_STORAGE_KEY);
    setSupportUnlocked(false);
    form?.removeAttribute("hidden");
    if (success) success.hidden = true;
    showInstagramError("Instagramのユーザー名を入力してください。");
    return false;
  }

  showInstagramError("");
  sessionStorage.setItem(INSTAGRAM_STORAGE_KEY, normalized);
  if (input) input.value = normalized;
  if (display) display.textContent = `@${normalized}`;
  if (success) success.hidden = false;
  form?.setAttribute("hidden", "hidden");
  setSupportUnlocked(true);
  logSupporterInstagram(normalized);
  if (scrollToPlans) scrollToSupportPlans();
  return true;
}

function setupSupportGate() {
  const form = document.querySelector("[data-instagram-form]");
  const input = document.querySelector("[data-instagram-input]");
  const changeButton = document.querySelector("[data-instagram-change]");
  if (!form || !input) return;

  document.querySelectorAll(".support-action").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (!element.classList.contains("is-locked")) return;

      event.preventDefault();
      document.querySelector("[data-support-gate]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    });
  });

  input.addEventListener("input", () => {
    if (normalizeInstagram(input.value)) showInstagramError("");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = normalizeInstagram(input.value);
    if (!username) {
      showInstagramError("Instagramのユーザー名を入力してください。");
      input.focus();
      return;
    }
    applyInstagramUsername(username, { scrollToPlans: true });
  });

  changeButton?.addEventListener("click", () => {
    form.removeAttribute("hidden");
    document.querySelector("[data-instagram-success]")?.setAttribute("hidden", "hidden");
    showInstagramError("");
    setSupportUnlocked(false);
    input.focus();
  });

  const saved = sessionStorage.getItem(INSTAGRAM_STORAGE_KEY);
  if (saved) {
    applyInstagramUsername(saved);
  } else {
    setSupportUnlocked(false);
  }
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
setupSupportGate();
loadSheetData();
setupRevealAnimations();
setupGallery();
