// Interactive World Map Tab (map.js)

const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const MAP_COLOR_MODE_KEY = "world_coin_map_color_mode";

let worldTopologyCache = null;
let worldFeaturesCache = null;
let selectedMapCountry = null;
let currentMapRegion = "all";
let isMicrostatesOpen = false;
let mapColorMode = localStorage.getItem(MAP_COLOR_MODE_KEY) || "shades"; // "shades" | "uniform"
let mapSvgInstance = null;
let mapZoomBehavior = null;
let mapZoomGroup = null;
let mapProjection = null;
let mapPathGenerator = null;

// ISO 3166-1 numeric code -> Hebrew country name in COUNTRIES_DB
const ISO_NUMERIC_TO_COUNTRY = {
  // אסיה
  "376": "ישראל",
  "860": "אוזבקיסטן",
  "031": "אזרבייג'ן",
  "784": "איחוד האמירויות",
  "360": "אינדונזיה",
  "364": "איראן",
  "004": "אפגניסטן",
  "051": "ארמניה",
  "064": "בהוטן",
  "048": "בחריין",
  "050": "בנגלדש",
  "096": "ברוניי",
  "268": "גאורגיה",
  "356": "הודו",
  "344": "הונג קונג",
  "704": "וייטנאם",
  "158": "טאיוואן",
  "762": "טג'יקיסטן",
  "792": "טורקיה",
  "795": "טורקמניסטן",
  "392": "יפן",
  "400": "ירדן",
  "414": "כווית",
  "418": "לאוס",
  "422": "לבנון",
  "462": "מאלדיביים",
  "496": "מונגוליה",
  "626": "מזרח טימור",
  "104": "מיאנמר",
  "458": "מלזיה",
  "446": "מקאו",
  "524": "נפאל",
  "760": "סוריה",
  "156": "סין",
  "702": "סינגפור",
  "144": "סרי לנקה",
  "512": "עומאן",
  "368": "עיראק",
  "682": "ערב הסעודית",
  "608": "פיליפינים",
  "586": "פקיסטן",
  "398": "קזחסטן",
  "634": "קטאר",
  "417": "קירגיזסטן",
  "116": "קמבודיה",
  "410": "קוריאה הדרומית",
  "408": "קוריאה הצפונית",
  "764": "תאילנד",
  "887": "תימן",

  // אירופה
  "040": "אוסטריה",
  "804": "אוקראינה",
  "380": "איטליה",
  "352": "איסלנד",
  "372": "אירלנד",
  "008": "אלבניה",
  "020": "אנדורה",
  "233": "אסטוניה",
  "100": "בולגריה",
  "070": "בוסניה והרצגובינה",
  "112": "בלארוס",
  "056": "בלגיה",
  "826": "בריטניה",
  "276": "גרמניה",
  "208": "דנמרק",
  "528": "הולנד",
  "348": "הונגריה",
  "336": "ותיקן",
  "300": "יוון",
  "442": "לוקסמבורג",
  "428": "לטביה",
  "440": "ליטא",
  "438": "ליכטנשטיין",
  "498": "מולדובה",
  "499": "מונטנגרו",
  "492": "מונקו",
  "470": "מלטה",
  "807": "מקדוניה הצפונית",
  "578": "נורווגיה",
  "674": "סן מרינו",
  "705": "סלובניה",
  "703": "סלובקיה",
  "724": "ספרד",
  "688": "סרביה",
  "616": "פולין",
  "620": "פורטוגל",
  "246": "פינלנד",
  "203": "צ'כיה",
  "250": "צרפת",
  "196": "קפריסין",
  "191": "קרואטיה",
  "642": "רומניה",
  "643": "רוסיה",
  "752": "שוודיה",
  "756": "שווייץ",

  // אמריקה הצפונית והמרכזית
  "222": "אל סלוודור",
  "840": "ארה״ב",
  "044": "בהאמה",
  "084": "בליז",
  "052": "ברבדוס",
  "388": "ג'מייקה",
  "320": "גואטמלה",
  "332": "האיטי",
  "340": "הונדורס",
  "214": "הרפובליקה הדומיניקנית",
  "780": "טרינידד וטובגו",
  "484": "מקסיקו",
  "558": "ניקרגואה",
  "591": "פנמה",
  "192": "קובה",
  "188": "קוסטה ריקה",
  "124": "קנדה",

  // אמריקה הדרומית
  "858": "אורוגוואי",
  "218": "אקוודור",
  "032": "ארגנטינה",
  "068": "בוליביה",
  "076": "ברזיל",
  "328": "גיאנה",
  "862": "ונצואלה",
  "740": "סורינאם",
  "604": "פרו",
  "600": "פרגוואי",
  "152": "צ'ילה",
  "170": "קולומביה",

  // אפריקה
  "800": "אוגנדה",
  "012": "אלג'יריה",
  "024": "אנגולה",
  "748": "אסוואטיני",
  "232": "אריתריאה",
  "231": "אתיופיה",
  "072": "בוטסואנה",
  "108": "בורונדי",
  "262": "ג'יבוטי",
  "288": "גאנה",
  "324": "גינאה",
  "270": "גמביה",
  "710": "דרום אפריקה",
  "728": "דרום סודאן",
  "180": "הרפובליקה הדמוקרטית של קונגו",
  "716": "זימבבואה",
  "894": "זמביה",
  "384": "חוף השנהב",
  "834": "טנזניה",
  "132": "כף ורדה",
  "434": "לוב",
  "430": "ליבריה",
  "426": "לסוטו",
  "478": "מאוריטניה",
  "480": "מאוריציוס",
  "450": "מדגסקר",
  "508": "מוזמביק",
  "454": "מלאווי",
  "818": "מצרים",
  "504": "מרוקו",
  "566": "ניגריה",
  "516": "נמיביה",
  "678": "סאו טומה ופרינסיפה",
  "729": "סודאן",
  "706": "סומליה",
  "694": "סיירה לאון",
  "690": "סיישל",
  "686": "סנגל",
  "174": "קומורו",
  "120": "קמרון",
  "404": "קניה",
  "646": "רואנדה",
  "788": "תוניסיה",

  // אוקיאניה
  "036": "אוסטרליה",
  "090": "איי שלמה",
  "548": "ונואטו",
  "776": "טונגה",
  "554": "ניו זילנד",
  "882": "סמואה",
  "242": "פיג'י",
  "598": "פפואה גינאה החדשה"
};

// Fallback name matching for territories without standard ISO numeric IDs in world-atlas
const ENGLISH_NAME_TO_COUNTRY = {
  "Kosovo": "קוסובו",
  "Israel": "ישראל",
  "Palestine": "ישראל",
  "West Bank": "ישראל",
  "Gaza": "ישראל",
  "Cyprus": "קפריסין",
  "N. Cyprus": "קפריסין",
  "Northern Cyprus": "קפריסין",
  "Somaliland": "סומליה",
  "Taiwan": "טאיוואן",
  "Hong Kong": "הונג קונג",
  "Macao": "מקאו",
  "Macau": "מקאו"
};

// Microstates & small islands drawer list (includes Hong Kong)
const MICROSTATES_LIST = [
  "אנדורה",
  "בחריין",
  "ברבדוס",
  "הונג קונג",
  "ותיקן",
  "טונגה",
  "כף ורדה",
  "לוקסמבורג",
  "ליכטנשטיין",
  "מאוריציוס",
  "מאלדיביים",
  "מונקו",
  "מלטה",
  "מקאו",
  "סאו טומה ופרינסיפה",
  "סיישל",
  "סינגפור",
  "סמואה",
  "סן מרינו",
  "קומורו"
];

const MAP_REGIONS = [
  { id: "all", label: "כל העולם", center: [12, 14], scale: 1.58 },
  { id: "middle_east", label: "ישראל והמזה״ת", center: [34, 30], scale: 7 },
  { id: "אירופה", label: "אירופה", center: [15, 53], scale: 4.2 },
  { id: "אסיה", label: "אסיה", center: [88, 32], scale: 2.65 },
  { id: "אמריקה הצפונית", label: "אמריקה הצפונית", center: [-96, 38], scale: 2.7 },
  { id: "אמריקה הדרומית", label: "אמריקה הדרומית", center: [-60, -16], scale: 3.05 },
  { id: "אפריקה", label: "אפריקה", center: [20, 2], scale: 2.75 },
  { id: "אוקיאניה", label: "אוקיאניה", center: [142, -25], scale: 3.65 }
];

function resolveHebrewCountryFromFeature(feature) {
  if (!feature) return null;
  const rawId = feature.id !== undefined && feature.id !== null ? String(feature.id).padStart(3, "0") : "";
  if (rawId && ISO_NUMERIC_TO_COUNTRY[rawId]) {
    return ISO_NUMERIC_TO_COUNTRY[rawId];
  }
  const propName = feature.properties && feature.properties.name ? String(feature.properties.name).trim() : "";
  if (propName && ENGLISH_NAME_TO_COUNTRY[propName]) {
    return ENGLISH_NAME_TO_COUNTRY[propName];
  }
  return null;
}

function getCountryCollectionStats(countryName) {
  const target = String(countryName || "").trim();
  const items = collection.filter(i => String(i.country || "").trim() === target);
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const coinsQty = items.filter(i => i.type === "coin").reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const notesQty = items.filter(i => i.type === "banknote").reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  return { items, totalQty, coinsQty, notesQty };
}

function buildProcessedWorldFeatures(topology) {
  if (worldFeaturesCache) return worldFeaturesCache;

  const countriesObj = topology.objects.countries;
  const allGeometries = countriesObj.geometries || [];

  const isIsraelPart = (g) => {
    const id = g.id !== undefined && g.id !== null ? String(g.id).padStart(3, "0") : "";
    const name = g.properties && g.properties.name ? String(g.properties.name).trim() : "";
    return id === "376" || id === "275" || name === "Israel" || name === "Palestine" || name === "West Bank" || name === "Gaza";
  };

  const isCyprusPart = (g) => {
    const id = g.id !== undefined && g.id !== null ? String(g.id).padStart(3, "0") : "";
    const name = g.properties && g.properties.name ? String(g.properties.name).trim() : "";
    return id === "196" || name === "Cyprus" || name === "N. Cyprus" || name === "Northern Cyprus";
  };

  const isAntarctica = (g) => {
    const id = g.id !== undefined && g.id !== null ? String(g.id).padStart(3, "0") : "";
    const name = g.properties && g.properties.name ? String(g.properties.name).trim() : "";
    return id === "010" || name === "Antarctica";
  };

  const israelGeoms = allGeometries.filter(isIsraelPart);
  const cyprusGeoms = allGeometries.filter(isCyprusPart);
  const regularGeoms = allGeometries.filter(g => !isIsraelPart(g) && !isCyprusPart(g) && !isAntarctica(g));

  const features = regularGeoms.map(g => {
    const feat = topojson.feature(topology, g);
    feat.hebrewCountry = resolveHebrewCountryFromFeature(g);
    return feat;
  });

  if (israelGeoms.length > 0) {
    const mergedIsraelGeom = topojson.merge(topology, israelGeoms);
    features.push({
      type: "Feature",
      id: "376",
      properties: { name: "Israel" },
      geometry: mergedIsraelGeom,
      hebrewCountry: "ישראל"
    });
  }

  if (cyprusGeoms.length > 0) {
    const mergedCyprusGeom = topojson.merge(topology, cyprusGeoms);
    features.push({
      type: "Feature",
      id: "196",
      properties: { name: "Cyprus" },
      geometry: mergedCyprusGeom,
      hebrewCountry: "קפריסין"
    });
  }

  worldFeaturesCache = features;
  return features;
}

async function ensureWorldAtlasLoaded() {
  if (worldTopologyCache) return worldTopologyCache;
  const response = await fetch(WORLD_ATLAS_URL);
  if (!response.ok) {
    throw new Error("Failed to load world map data");
  }
  worldTopologyCache = await response.json();
  return worldTopologyCache;
}

function setMapRegion(regionId) {
  currentMapRegion = regionId;
  if (isMicrostatesOpen) {
    isMicrostatesOpen = false;
    renderMicrostatesDrawer();
  }
  renderMapRegionPills();
  applyRegionZoom(true);
}

function renderMapRegionPills() {
  const bar = document.getElementById("map-region-pills");
  if (!bar) return;

  bar.innerHTML = MAP_REGIONS.map(reg => {
    const isActive = currentMapRegion === reg.id;
    return `
      <button type="button" onclick="setMapRegion('${reg.id}')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
        isActive
          ? "bg-indigo-600 text-white shadow-xs"
          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
      }">
        ${reg.label}
      </button>
    `;
  }).join("");
}

function setMapColorMode(mode) {
  if (mode !== "shades" && mode !== "uniform") return;
  mapColorMode = mode;
  localStorage.setItem(MAP_COLOR_MODE_KEY, mode);
  renderMapLegend();
  updateMapPolygonStyles();
}

function renderMapLegend() {
  const legendBar = document.getElementById("map-legend-bar");
  if (!legendBar) return;

  const isShades = mapColorMode === "shades";

  const legendItemsHtml = isShades
    ? `
      <div class="flex items-center gap-2 flex-wrap">
        <span class="inline-flex items-center gap-1">
          <span>0</span>
          <span class="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-block"></span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span>4-1</span>
          <span class="w-2.5 h-2.5 rounded-xs bg-indigo-300 dark:bg-indigo-800 inline-block"></span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span>14-5</span>
          <span class="w-2.5 h-2.5 rounded-xs bg-indigo-400 dark:bg-indigo-700 inline-block"></span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span>+15</span>
          <span class="w-2.5 h-2.5 rounded-xs bg-indigo-500 dark:bg-indigo-900 inline-block"></span>
        </span>
      </div>
    `
    : `
      <div class="flex items-center gap-2.5 flex-wrap">
        <span class="inline-flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-xs bg-indigo-400 dark:bg-indigo-700 inline-block"></span>
          <span>מדינה באוסף</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-block"></span>
          <span>טרם נאסף</span>
        </span>
      </div>
    `;

  legendBar.innerHTML = `
    <div class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200/80 dark:border-slate-800 shrink-0">
      <button type="button" onclick="setMapColorMode('shades')" class="px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
        isShades
          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }">גוונים</button>
      <button type="button" onclick="setMapColorMode('uniform')" class="px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
        !isShades
          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }">אחיד</button>
    </div>
    ${legendItemsHtml}
  `;
}

function applyRegionZoom(animate = true) {
  if (!mapSvgInstance || !mapZoomBehavior || !mapProjection) return;
  const reg = MAP_REGIONS.find(r => r.id === currentMapRegion) || MAP_REGIONS[0];
  const width = 800;
  const height = 430;

  const projectedCenter = mapProjection(reg.center);
  if (!projectedCenter) return;

  const k = reg.scale;
  const tx = width / 2 - k * projectedCenter[0];
  const ty = height / 2 - k * projectedCenter[1];
  const transform = d3.zoomIdentity.translate(tx, ty).scale(k);

  if (animate) {
    mapSvgInstance.transition().duration(420).call(mapZoomBehavior.transform, transform);
  } else {
    mapSvgInstance.call(mapZoomBehavior.transform, transform);
  }
}

function zoomMapByFactor(factor) {
  if (!mapSvgInstance || !mapZoomBehavior) return;
  mapSvgInstance.transition().duration(220).call(mapZoomBehavior.scaleBy, factor);
}

function resetMapZoom() {
  currentMapRegion = "all";
  selectedMapCountry = null;
  isMicrostatesOpen = false;
  renderMapRegionPills();
  updateMapSelectionPill();
  updateMapPolygonStyles();
  renderMicrostatesDrawer();
  renderSelectedMapCountryDetails();
  applyRegionZoom(true);
}

function toggleMicrostatesDrawer() {
  isMicrostatesOpen = !isMicrostatesOpen;
  renderMicrostatesDrawer();
}

function selectMapCountry(countryName) {
  if (!countryName) {
    clearMapSelection();
    return;
  }
  selectedMapCountry = countryName;
  updateMapSelectionPill();
  updateMapPolygonStyles();
  renderMicrostatesDrawer();
  renderSelectedMapCountryDetails();
}

function clearMapSelection() {
  selectedMapCountry = null;
  updateMapSelectionPill();
  updateMapPolygonStyles();
  renderMicrostatesDrawer();
  renderSelectedMapCountryDetails();
}

function updateMapSelectionPill() {
  const pill = document.getElementById("map-selected-pill");
  if (!pill) return;

  if (!selectedMapCountry) {
    pill.classList.add("hidden");
    pill.innerHTML = "";
    return;
  }

  const meta = getCountryMeta(selectedMapCountry);
  const stats = getCountryCollectionStats(selectedMapCountry);
  const countBadge = stats.totalQty > 0
    ? `<span class="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">${formatDenomination(stats.totalQty)}</span>`
    : `<span class="text-[11px] text-slate-400 dark:text-slate-500">0 פריטים</span>`;

  pill.classList.remove("hidden");
  pill.innerHTML = `
    <span class="emoji-flag text-base shrink-0">${meta.flag}</span>
    <span class="text-xs font-bold text-slate-900 dark:text-white truncate">${selectedMapCountry}</span>
    ${countBadge}
    <button type="button" onclick="event.stopPropagation(); clearMapSelection();" title="נקה בחירה" aria-label="נקה בחירה" class="mr-0.5 w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 flex items-center justify-center text-[11px] font-bold shrink-0 transition">✕</button>
  `;
}

function getCountryPolygonFill(hebrewCountry, isDark) {
  if (!hebrewCountry) {
    return isDark ? "#1e293b" : "#e2e8f0";
  }
  const stats = getCountryCollectionStats(hebrewCountry);
  const hasItems = stats.totalQty > 0;
  const isSelected = selectedMapCountry === hebrewCountry;

  // Rule: If selected country has NO items in collection, do NOT fill its area — only highlight its border!
  if (isSelected && hasItems) {
    return isDark ? "#6366f1" : "#4f46e5";
  }
  if (hasItems) {
    if (mapColorMode === "uniform") {
      return isDark ? "#3730a3" : "#818cf8";
    }
    if (stats.totalQty >= 15) return isDark ? "#312e81" : "#6366f1";
    if (stats.totalQty >= 5) return isDark ? "#3730a3" : "#818cf8";
    return isDark ? "#3b429f" : "#a5b4fc";
  }
  return isDark ? "#1e293b" : "#e2e8f0";
}

function getCountryPolygonStroke(hebrewCountry, isDark) {
  const isSelected = hebrewCountry && selectedMapCountry === hebrewCountry;
  if (isSelected) {
    const stats = getCountryCollectionStats(hebrewCountry);
    if (stats.totalQty > 0) {
      return isDark ? "#e0e7ff" : "#1e1b4b";
    }
    // Distinct clear border outline when selected country has 0 items
    return isDark ? "#f59e0b" : "#d97706";
  }
  return isDark ? "#334155" : "#cbd5e1";
}

function getCountryPolygonStrokeWidth() {
  return 0.315;
}

function updateMapPolygonStyles() {
  if (!mapZoomGroup) return;
  const isDark = document.documentElement.classList.contains("dark");

  mapZoomGroup.selectAll("path.country-shape")
    .attr("fill", d => getCountryPolygonFill(d.hebrewCountry, isDark))
    .attr("stroke", d => getCountryPolygonStroke(d.hebrewCountry, isDark))
    .attr("stroke-width", () => getCountryPolygonStrokeWidth());

  // Bring selected country path to front so its border is never clipped by neighbor borders
  if (selectedMapCountry) {
    mapZoomGroup.selectAll("path.country-shape")
      .filter(d => d.hebrewCountry === selectedMapCountry)
      .raise();
  }
}

function renderMicrostatesDrawer() {
  const container = document.getElementById("map-microstates-box");
  if (!container) return;

  const sortedMicrostates = [...MICROSTATES_LIST].sort((a, b) => hebrewCollator.compare(a, b));
  const ownedMicroCount = sortedMicrostates.filter(name => getCountryCollectionStats(name).totalQty > 0).length;

  const listHtml = isMicrostatesOpen ? `
    <div class="px-3 pb-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-1.5">
      ${sortedMicrostates.map(name => {
        const meta = getCountryMeta(name);
        const stats = getCountryCollectionStats(name);
        const hasItems = stats.totalQty > 0;
        const isSelected = selectedMapCountry === name;

        let pillClass = "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400";
        if (isSelected && hasItems) {
          pillClass = "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs";
        } else if (isSelected && !hasItems) {
          pillClass = "bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-amber-500 dark:border-amber-400 font-bold";
        } else if (hasItems) {
          pillClass = "bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 font-semibold";
        }

        return `
          <button type="button" onclick="selectMapCountry('${escapeJsStr(name)}')" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition ${pillClass}">
            <span class="emoji-flag text-sm shrink-0">${meta.flag}</span>
            <span>${name}</span>
            ${hasItems ? `<span class="text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'}">${formatDenomination(stats.totalQty)}</span>` : ""}
          </button>
        `;
      }).join("")}
    </div>
  ` : "";

  container.innerHTML = `
    <div class="rounded-2xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <button type="button" onclick="toggleMicrostatesDrawer()" class="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-right hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-100">מדינות זעירות</span>
          ${isMicrostatesOpen && ownedMicroCount > 0 ? `<span class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">(${ownedMicroCount} באוסף)</span>` : ""}
        </div>
        <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isMicrostatesOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      ${listHtml}
    </div>
  `;
}

function renderSelectedMapCountryDetails() {
  const container = document.getElementById("map-country-details");
  if (!container) return;

  if (!selectedMapCountry) {
    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        לחץ על מדינה במפה או בחר מתוך רשימת המדינות הזעירות לצפייה בפרטים
      </div>
    `;
    return;
  }

  const meta = getCountryMeta(selectedMapCountry);
  const stats = getCountryCollectionStats(selectedMapCountry);
  const safeCountryJs = escapeJsStr(selectedMapCountry);

  if (stats.totalQty === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="emoji-flag text-3xl shrink-0">${meta.flag}</span>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-slate-900 dark:text-white truncate">${selectedMapCountry}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">${meta.continent}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">אין פריטים</span>
        </div>
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span class="text-xs text-slate-500 dark:text-slate-400">עדיין לא נוספו מטבעות או שטרות ממדינה זו.</span>
          <button type="button" onclick="openItemModal(null, '${safeCountryJs}')" class="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition">
            + הוסף פריט
          </button>
        </div>
      </div>
    `;
    return;
  }

  const sortedItems = sortCountryItems(stats.items, selectedMapCountry);
  const summaryText = formatQuantitySummary(stats.coinsQty, stats.notesQty);

  container.innerHTML = `
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
      <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="emoji-flag text-3xl shrink-0">${meta.flag}</span>
          <div class="min-w-0">
            <h3 class="text-base font-bold text-slate-900 dark:text-white truncate">${selectedMapCountry}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">${meta.continent} • ${summaryText}</p>
          </div>
        </div>
        <button type="button" onclick="openItemModal(null, '${safeCountryJs}')" class="shrink-0 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition">
          + הוסף
        </button>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-800/80">
        ${sortedItems.map(item => {
          const isCoin = item.type === "coin";
          const qty = Number(item.quantity) || 1;
          const yearHtml = hasValidYear(item.year)
            ? `<span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${item.year}</span>`
            : `<span class="text-[11px] text-slate-400 dark:text-slate-500">ללא שנה</span>`;

          return `
            <div onclick="openItemDetailsModal('${escapeJsStr(item.id)}')" class="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-1 transition">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-[44px] text-center shrink-0 text-[11px] font-semibold py-0.5 rounded ${isCoin ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}">
                  ${isCoin ? 'מטבע' : 'שטר'}
                </span>
                <div class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  <span class="font-bold">${formatDenomination(item.value)}</span> ${item.currency}
                  ${qty > 1 ? `<span class="mr-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">×${qty}</span>` : ""}
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-2">
                ${yearHtml}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

async function renderWorldMap() {
  const container = document.getElementById("map-container");
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-3">
      <!-- Region Filter Pills -->
      <div id="map-region-pills" class="flex items-center gap-1.5 overflow-x-auto pb-1"></div>

      <!-- Interactive Map Canvas -->
      <div class="relative rounded-2xl bg-sky-50/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden select-none">
        <!-- Floating Selected Country Pill (Top-Right) -->
        <div id="map-selected-pill" class="hidden absolute top-2.5 right-2.5 z-20 max-w-[72%] px-2.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5"></div>

        <!-- Zoom Controls (Bottom-Left) -->
        <div class="absolute bottom-2.5 left-2.5 z-20 flex flex-col gap-1">
          <button type="button" onclick="zoomMapByFactor(1.45)" title="התקרב" aria-label="התקרב" class="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-xs font-bold text-base flex items-center justify-center hover:bg-white transition">+</button>
          <button type="button" onclick="zoomMapByFactor(0.68)" title="התרחק" aria-label="התרחק" class="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-xs font-bold text-base flex items-center justify-center hover:bg-white transition">−</button>
          <button type="button" onclick="resetMapZoom()" title="איפוס תצוגה" aria-label="איפוס תצוגה" class="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-xs text-xs font-bold flex items-center justify-center hover:bg-white transition">⟲</button>
        </div>

        <div id="map-svg-wrapper" class="w-full aspect-[16/9] min-h-[250px] flex items-center justify-center">
          <span class="text-xs text-slate-400">טוען מפת עולם...</span>
        </div>
      </div>

      <!-- Legend & Color Mode Switch -->
      <div id="map-legend-bar" class="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400"></div>

      <!-- Collapsible Microstates Drawer (Minimized by Default) -->
      <div id="map-microstates-box"></div>

      <!-- Selected Country Details Card -->
      <div id="map-country-details"></div>
    </div>
  `;

  renderMapRegionPills();
  renderMapLegend();
  renderMicrostatesDrawer();
  updateMapSelectionPill();
  renderSelectedMapCountryDetails();

  const wrapper = document.getElementById("map-svg-wrapper");
  if (!wrapper) return;

  if (typeof d3 === "undefined" || typeof topojson === "undefined") {
    wrapper.innerHTML = `<div class="p-4 text-center text-xs text-rose-500">ספריות המפה לא נטענו. ודא חיבור לאינטרנט ורענן את הדף.</div>`;
    return;
  }

  try {
    const topology = await ensureWorldAtlasLoaded();
    const features = buildProcessedWorldFeatures(topology);
    const width = 800;
    const height = 430;

    wrapper.innerHTML = "";
    mapProjection = d3.geoNaturalEarth1()
      .scale(148)
      .translate([width / 2, height / 2 + 12]);

    mapPathGenerator = d3.geoPath().projection(mapProjection);

    mapSvgInstance = d3.select(wrapper)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "w-full h-full block touch-none cursor-grab active:cursor-grabbing");

    mapZoomGroup = mapSvgInstance.append("g");

    const isDark = document.documentElement.classList.contains("dark");

    mapZoomGroup.selectAll("path.country-shape")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "country-shape transition-colors duration-150")
      .attr("d", mapPathGenerator)
      .attr("vector-effect", "non-scaling-stroke")
      .attr("fill", d => getCountryPolygonFill(d.hebrewCountry, isDark))
      .attr("stroke", d => getCountryPolygonStroke(d.hebrewCountry, isDark))
      .attr("stroke-width", () => getCountryPolygonStrokeWidth())
      .attr("stroke-linejoin", "round")
      .style("cursor", d => (d.hebrewCountry ? "pointer" : "default"))
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.hebrewCountry) {
          if (isMicrostatesOpen) {
            isMicrostatesOpen = false;
          }
          selectMapCountry(d.hebrewCountry);
        }
      });

    mapZoomBehavior = d3.zoom()
      .scaleExtent([1, 14])
      .translateExtent([[-120, -80], [width + 120, height + 80]])
      .on("zoom", (event) => {
        mapZoomGroup.attr("transform", event.transform);
      });

    mapSvgInstance.call(mapZoomBehavior);
    applyRegionZoom(false);
    updateMapPolygonStyles();
  } catch (err) {
    wrapper.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">לא ניתן לטעון את המפה כרגע. בדוק חיבור רשת ונסה שוב.</div>`;
  }
}