// Core State, Storage, Utilities & Sorting (app.js)
const STORAGE_KEY = "world_coin_collection_v1";

let collection = [];
let currentTab = "collection";
let currentTypeFilter = "all";
let currentGroupMode = "alpha";
let selectedContinentFilter = "all";
let selectedCountryFilter = "all";
let selectedDecadeFilter = "all";

let collapsedContinents = {};
let collapsedCountries = {};
let isAllCollapsed = false;

let expandedStatsCountries = {};
let expandedStatsLocations = {};
let expandedStatsLocationCountries = {};
let expandedStatsDecades = {};

let pendingDuplicate = null;
let pendingExportFormat = null;
let currentCurrencyOptions = [];
let originalEditingItem = null;
let pendingEditAction = null;

const SAMPLE_DATA = [
  { id: "1", type: "coin", country: "ישראל", currency: "לירה ישראלית", value: 5, year: 1978, quantity: 1, location: "" },
  { id: "2", type: "coin", country: "ישראל", currency: "אגורות (לירה)", value: 50, year: 1975, quantity: 2, location: "" },
  { id: "3", type: "coin", country: "ישראל", currency: "שקל חדש", value: 5, year: 2015, quantity: 1, location: "" },
  { id: "4", type: "coin", country: "ישראל", currency: "אגורות", value: 50, year: 1992, quantity: 3, location: "" },
  { id: "5", type: "banknote", country: "ישראל", currency: "שקל חדש", value: 20, year: 2017, quantity: 1, location: "" },
  { id: "6", type: "coin", country: "יפן", currency: "ין יפני", value: 500, year: 2019, quantity: 1, location: "" },
  { id: "7", type: "coin", country: "יפן", currency: "ין יפני", value: 100, year: 2012, quantity: 2, location: "" },
  { id: "8", type: "coin", country: "גרמניה", currency: "מארק גרמני", value: 2, year: 1988, quantity: 1, location: "" },
  { id: "9", type: "coin", country: "גרמניה", currency: "אירו", value: 2, year: 2002, quantity: 1, location: "" },
  { id: "10", type: "banknote", country: "ארה״ב", currency: "דולר אמריקאי", value: 1, year: 2013, quantity: 2, location: "" }
];

// String Escaping & Formatting Helpers
function escapeJsStr(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function escapeHtmlAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function formatDenomination(val) {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val).trim().replace(/,/g, "");
  const num = Number(str);
  if (isNaN(num)) return String(val);
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function parseDenomination(rawStr) {
  if (rawStr === null || rawStr === undefined) return NaN;
  const cleaned = String(rawStr).trim().replace(/,/g, "");
  if (cleaned === "") return NaN;
  return parseFloat(cleaned);
}

function onValueFieldFocus(el) {
  if (!el) return;
  el.value = el.value.replace(/,/g, "");
}

function onValueFieldBlur(el) {
  if (!el) return;
  const num = parseDenomination(el.value);
  if (!isNaN(num) && num >= 0) {
    el.value = formatDenomination(num);
  }
}

function hasValidYear(y) {
  return y !== null && y !== undefined && y !== "" && !isNaN(Number(y));
}

function normalizeYear(y) {
  return hasValidYear(y) ? Number(y) : null;
}

function formatYearText(y) {
  return hasValidYear(y) ? String(y) : "ללא שנה";
}

function normalizeLocation(loc) {
  return String(loc || "").trim();
}

function formatQuantitySummary(coinsCount, notesCount) {
  const parts = [];
  if (coinsCount > 0) {
    parts.push(coinsCount === 1 ? "מטבע 1" : `${formatDenomination(coinsCount)} מטבעות`);
  }
  if (notesCount > 0) {
    parts.push(notesCount === 1 ? "שטר 1" : `${formatDenomination(notesCount)} שטרות`);
  }
  return parts.join(", ");
}

// Country & Historical Series Metadata
function getCountryMeta(name) {
  return COUNTRIES_DB.find(c => c.name === name) || {
    name,
    continent: "אחר",
    flag: "🏳️",
    former: false,
    currencies: []
  };
}

function getSeriesRank(countryName, currencyName, year) {
  const info = SERIES_INFO_DB[countryName];
  if (!info || info.eraOnly || !info.ranges || !info.currencies) return 0;
  const c = (currencyName || "").trim();
  if (!info.currencies.includes(c)) return 0;
  if (!hasValidYear(year)) return 99;
  const y = Number(year);
  for (let i = 0; i < info.ranges.length; i++) {
    if (y <= info.ranges[i].maxYear) {
      return i + 1;
    }
  }
  return info.ranges.length;
}

function getItemEraSignature(item, countryName) {
  const era = getEraRank(countryName, item.currency);
  const series = item.type === "coin" ? getSeriesRank(countryName, item.currency, item.year) : 0;
  return `${item.type}|${era}|${series}`;
}

// 6-Level Internal Sorting per Country
function sortCountryItems(items, countryName) {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "coin" ? -1 : 1;
    }
    const eraA = getEraRank(countryName, a.currency);
    const eraB = getEraRank(countryName, b.currency);
    if (eraA !== eraB) {
      return eraA - eraB;
    }
    const seriesA = getSeriesRank(countryName, a.currency, a.year);
    const seriesB = getSeriesRank(countryName, b.currency, b.year);
    if (seriesA !== seriesB) {
      return seriesA - seriesB;
    }
    const unitA = getUnitRank(countryName, a.currency);
    const unitB = getUnitRank(countryName, b.currency);
    if (unitA !== unitB) {
      return unitA - unitB;
    }
    const valA = Number(a.value) || 0;
    const valB = Number(b.value) || 0;
    if (valA !== valB) {
      return valB - valA;
    }
    const hasA = hasValidYear(a.year);
    const hasB = hasValidYear(b.year);
    if (hasA !== hasB) {
      return hasA ? -1 : 1;
    }
    if (hasA && hasB) {
      return Number(a.year) - Number(b.year);
    }
    return 0;
  });
}

// Series & Eras Info Modal (ⓘ)
function openSeriesInfoModal(countryName) {
  const info = SERIES_INFO_DB[countryName];
  if (!info) return;
  const meta = getCountryMeta(countryName);
  const rows = info.infoRows || info.ranges || [];
  document.getElementById("series-info-flag").textContent = meta.flag;
  document.getElementById("series-info-title").textContent = info.eraOnly
    ? `${countryName} — תקופות מטבע`
    : `${countryName} — סדרות מטבע`;
  document.getElementById("series-info-subtitle").textContent = info.eraOnly
    ? "מיון כרונולוגי לפי תקופות מטבע"
    : "מיון אוטומטי לפי סדרות ושנת הנפקה";
  document.getElementById("series-info-desc").textContent = info.description;
  document.getElementById("series-info-list").innerHTML = rows.map((r, idx) => `
    <div class="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
      <div class="flex items-start gap-2 min-w-0">
        <span class="w-4 text-slate-400 font-bold shrink-0">${idx + 1}.</span>
        <span class="font-semibold text-slate-800 dark:text-slate-100 leading-snug">${r.label}</span>
      </div>
      <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] shrink-0">${r.years}</span>
    </div>
  `).join("");
  document.getElementById("series-info-note").textContent = info.note || "";
  document.getElementById("series-info-modal").classList.remove("hidden");
}

function closeSeriesInfoModal() {
  document.getElementById("series-info-modal").classList.add("hidden");
}

function openCurrentFormCountrySeriesInfo() {
  const cName = document.getElementById("form-country").value.trim();
  if (cName && SERIES_INFO_DB[cName]) {
    openSeriesInfoModal(cName);
  }
}

function updateFormSeriesInfoButton(countryName) {
  const btn = document.getElementById("btn-form-series-info");
  if (!btn) return;
  btn.classList.toggle("hidden", !SERIES_INFO_DB[countryName]);
}

// Persistence, Theme, Toast & Main Tab Navigation
function saveCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("coin_theme", isDark ? "dark" : "light");
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

function switchTab(tab) {
  const oldestViewHidden = document.getElementById("view-oldest-coins").classList.contains("hidden");
  if (currentTab === tab && oldestViewHidden) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  currentTab = tab;
  document.getElementById("view-oldest-coins").classList.add("hidden");
  const isCol = tab === "collection";
  document.getElementById("view-collection").classList.toggle("hidden", !isCol);
  document.getElementById("view-stats").classList.toggle("hidden", isCol);

  document.getElementById("tab-collection").className = isCol
    ? "flex-1 py-2.5 text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 transition"
    : "flex-1 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 transition";

  document.getElementById("tab-stats").className = !isCol
    ? "flex-1 py-2.5 text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 transition"
    : "flex-1 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 transition";

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (!isCol) renderStats();
}

function init() {
  const savedTheme = localStorage.getItem("coin_theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      collection = Array.isArray(parsed)
        ? parsed.map(item => ({ ...item, location: normalizeLocation(item.location) }))
        : [...SAMPLE_DATA];
    } catch (e) {
      collection = [...SAMPLE_DATA];
    }
  } else {
    collection = [...SAMPLE_DATA];
    saveCollection();
  }

  updateFilterDropdowns();
  renderCollection();

  document.addEventListener("click", (e) => {
    const countryWrap = document.getElementById("form-country-input")?.closest(".relative")?.parentElement;
    if (countryWrap && !countryWrap.contains(e.target)) {
      closeCountryDropdown();
    }
    const currWrap = document.getElementById("form-currency-trigger")?.closest(".relative");
    if (currWrap && !currWrap.contains(e.target)) {
      closeCurrencyDropdown();
    }
    if (!e.target.closest("[data-filter-wrap]")) {
      closeAllFilterDropdowns();
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}