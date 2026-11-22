// Import, Export (JSON / CSV / Excel), Backup & Reset Management (io.js)

let pendingImportItems = [];

function getTodayDateSlug() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function downloadBlobFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Export Modal & Format Handlers ---
function openExportModal(defaultFormat = null) {
  pendingExportFormat = defaultFormat;
  const modal = document.getElementById("export-modal");
  if (modal) {
    modal.classList.remove("hidden");
  } else if (defaultFormat) {
    executeExport(defaultFormat);
  }
}

function closeExportModal() {
  pendingExportFormat = null;
  document.getElementById("export-modal")?.classList.add("hidden");
}

function getSortedCollectionForExport() {
  const byCountry = {};
  collection.forEach(item => {
    if (!byCountry[item.country]) byCountry[item.country] = [];
    byCountry[item.country].push(item);
  });

  const sortedCountries = Object.keys(byCountry).sort((a, b) => hebrewCollator.compare(a, b));
  const result = [];
  sortedCountries.forEach(cName => {
    result.push(...sortCountryItems(byCountry[cName], cName));
  });
  return result;
}

function executeExport(format) {
  if (!collection.length) {
    showToast("האוסף ריק — אין פריטים לייצוא");
    closeExportModal();
    return;
  }

  const fmt = (format || pendingExportFormat || "json").toLowerCase();
  if (fmt === "json") {
    exportCollectionJSON();
  } else if (fmt === "csv") {
    exportCollectionCSV();
  } else if (fmt === "excel" || fmt === "xls" || fmt === "xlsx") {
    exportCollectionExcel();
  }
  closeExportModal();
}

function exportCollectionJSON() {
  if (!collection.length) {
    showToast("האוסף ריק — אין פריטים לייצוא");
    return;
  }

  const sortedItems = getSortedCollectionForExport().map(item => ({
    id: item.id,
    type: item.type,
    country: item.country,
    currency: item.currency,
    value: Number(item.value),
    year: normalizeYear(item.year),
    quantity: Number(item.quantity) || 1,
    location: normalizeLocation(item.location)
  }));

  const payload = {
    app: "World Coin & Banknote Collection",
    version: 1,
    exportedAt: new Date().toISOString(),
    totalRecords: sortedItems.length,
    totalItems: sortedItems.reduce((s, x) => s + x.quantity, 0),
    items: sortedItems
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  downloadBlobFile(jsonStr, `coin-collection-${getTodayDateSlug()}.json`, "application/json;charset=utf-8");
  showToast("קובץ הגיבוי (JSON) יוצא בהצלחה");
}

function escapeCsvCell(val) {
  const str = val === null || val === undefined ? "" : String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCollectionCSV() {
  if (!collection.length) {
    showToast("האוסף ריק — אין פריטים לייצוא");
    return;
  }

  const sortedItems = getSortedCollectionForExport();
  const headers = ["סוג", "מדינה", "יבשת", "מטבע", "ערך נקוב", "שנת הנפקה", "כמות", "מיקום"];

  const rows = sortedItems.map(item => {
    const meta = getCountryMeta(item.country);
    return [
      item.type === "coin" ? "מטבע" : "שטר",
      item.country,
      meta.continent || "אחר",
      item.currency,
      item.value,
      hasValidYear(item.year) ? item.year : "ללא שנה",
      Number(item.quantity) || 1,
      normalizeLocation(item.location)
    ].map(escapeCsvCell).join(",");
  });

  const csvContent = "\uFEFF" + [headers.map(escapeCsvCell).join(","), ...rows].join("\r\n");
  downloadBlobFile(csvContent, `coin-collection-${getTodayDateSlug()}.csv`, "text/csv;charset=utf-8");
  showToast("קובץ ה-CSV יוצא בהצלחה");
}

function escapeXmlHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportCollectionExcel() {
  if (!collection.length) {
    showToast("האוסף ריק — אין פריטים לייצוא");
    return;
  }

  const sortedItems = getSortedCollectionForExport();
  const headers = ["סוג", "מדינה", "יבשת", "מטבע", "ערך נקוב", "שנת הנפקה", "כמות", "מיקום"];

  const tableRowsHtml = sortedItems.map(item => {
    const meta = getCountryMeta(item.country);
    const typeLabel = item.type === "coin" ? "מטבע" : "שטר";
    const yearLabel = hasValidYear(item.year) ? item.year : "ללא שנה";
    const qty = Number(item.quantity) || 1;
    const loc = normalizeLocation(item.location);

    return `
      <tr>
        <td>${escapeXmlHtml(typeLabel)}</td>
        <td>${escapeXmlHtml(item.country)}</td>
        <td>${escapeXmlHtml(meta.continent || "אחר")}</td>
        <td>${escapeXmlHtml(item.currency)}</td>
        <td style="mso-number-format:'#,##0.####';">${escapeXmlHtml(item.value)}</td>
        <td>${escapeXmlHtml(yearLabel)}</td>
        <td style="mso-number-format:'0';">${escapeXmlHtml(qty)}</td>
        <td>${escapeXmlHtml(loc)}</td>
      </tr>
    `;
  }).join("");

  const htmlWorkbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 11pt; }
        th { background-color: #4f46e5; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 10px; text-align: right; }
        td { border: 1px solid #cbd5e1; padding: 5px 10px; text-align: right; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${escapeXmlHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  downloadBlobFile("\uFEFF" + htmlWorkbook, `coin-collection-${getTodayDateSlug()}.xls`, "application/vnd.ms-excel;charset=utf-8");
  showToast("קובץ ה-Excel יוצא בהצלחה");
}

// --- Import Handlers (JSON & CSV) ---
function triggerImportFile() {
  const input = document.getElementById("import-file-input");
  if (!input) return;
  input.value = "";
  input.click();
}

function handleImportFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rawText = String(e.target?.result || "");
      const fileName = file.name.toLowerCase();
      let parsedItems = [];

      if (fileName.endsWith(".json") || rawText.trim().startsWith("{") || rawText.trim().startsWith("[")) {
        parsedItems = parseImportedJSON(rawText);
      } else if (fileName.endsWith(".csv")) {
        parsedItems = parseImportedCSV(rawText);
      } else {
        throw new Error("פורמט קובץ לא נתמך. יש לבחור קובץ JSON או CSV.");
      }

      if (!parsedItems.length) {
        showToast("לא נמצאו פריטים תקינים בקובץ");
        return;
      }

      pendingImportItems = parsedItems;
      openImportConfirmModal(parsedItems);
    } catch (err) {
      showToast(err?.message || "שגיאה בקריאת הקובץ");
    }
  };
  reader.onerror = () => showToast("שגיאה בטעינת הקובץ");
  reader.readAsText(file, "UTF-8");
}

function normalizeImportedType(rawType) {
  const t = String(rawType || "").trim().toLowerCase();
  if (t === "banknote" || t === "note" || t === "notes" || t === "שטר" || t === "שטרות") {
    return "banknote";
  }
  return "coin";
}

function normalizeImportedItem(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const country = String(raw.country || "").trim();
  const currency = String(raw.currency || "").trim();
  const value = parseDenomination(raw.value);

  if (!country || !currency || isNaN(value) || value <= 0) {
    return null;
  }

  const rawYearStr = raw.year === null || raw.year === undefined ? "" : String(raw.year).trim();
  const year = rawYearStr === "" || rawYearStr === "ללא שנה" ? null : normalizeYear(rawYearStr);
  const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);
  const location = normalizeLocation(raw.location);

  return {
    id: raw.id ? String(raw.id) : `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    type: normalizeImportedType(raw.type),
    country,
    currency,
    value,
    year,
    quantity,
    location
  };
}

function parseImportedJSON(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const data = JSON.parse(clean);
  const rawList = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : null);
  if (!rawList) {
    throw new Error("מבנה קובץ ה-JSON אינו תקין");
  }
  return rawList
    .map((entry, idx) => normalizeImportedItem(entry, idx))
    .filter(Boolean);
}

function parseCsvRows(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

function parseImportedCSV(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new Error("קובץ ה-CSV ריק או חסר שורות נתונים");
  }

  const headerMap = {
    "סוג": "type",
    "type": "type",
    "מדינה": "country",
    "country": "country",
    "מטבע": "currency",
    "currency": "currency",
    "ערך": "value",
    "ערך נקוב": "value",
    "value": "value",
    "שנה": "year",
    "שנת הנפקה": "year",
    "year": "year",
    "כמות": "quantity",
    "quantity": "quantity",
    "מיקום": "location",
    "location": "location"
  };

  const headers = rows[0].map(h => headerMap[h.trim().toLowerCase()] || null);
  const items = [];

  for (let r = 1; r < rows.length; r++) {
    const obj = {};
    rows[r].forEach((cell, cIdx) => {
      const key = headers[cIdx];
      if (key) obj[key] = cell;
    });
    const normalized = normalizeImportedItem(obj, r);
    if (normalized) items.push(normalized);
  }

  return items;
}

// --- Import Confirmation Modal (Merge vs. Replace) ---
function openImportConfirmModal(items) {
  const modal = document.getElementById("import-modal");
  if (!modal) {
    confirmImportMerge();
    return;
  }

  const totalUnits = items.reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const descEl = document.getElementById("import-modal-desc");
  if (descEl) {
    descEl.textContent = `נמצאו ${formatDenomination(items.length)} רשומות (${formatDenomination(totalUnits)} פריטים). כיצד תרצה לייבא אותן?`;
  }
  modal.classList.remove("hidden");
}

function closeImportConfirmModal() {
  pendingImportItems = [];
  document.getElementById("import-modal")?.classList.add("hidden");
}

function confirmImportMerge() {
  if (!pendingImportItems.length) return;
  let mergedCount = 0;
  let addedCount = 0;

  pendingImportItems.forEach((incoming, idx) => {
    const existing = collection.find(x => isSameItemIdentity(x, incoming));
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + (Number(incoming.quantity) || 1);
      if (!normalizeLocation(existing.location) && normalizeLocation(incoming.location)) {
        existing.location = normalizeLocation(incoming.location);
      }
      mergedCount++;
    } else {
      const uniqueId = collection.some(x => x.id === incoming.id)
        ? `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`
        : incoming.id;
      collection.push({ ...incoming, id: uniqueId });
      addedCount++;
    }
  });

  closeImportConfirmModal();
  finalizeCollectionMutation(`הייבוא הושלם: ${addedCount} נוספו, ${mergedCount} אוחדו`, "");
}

function confirmImportReplace() {
  if (!pendingImportItems.length) return;
  const seenIds = new Set();
  collection = pendingImportItems.map((item, idx) => {
    let id = item.id;
    if (!id || seenIds.has(id)) {
      id = `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(id);
    return { ...item, id };
  });

  closeImportConfirmModal();
  finalizeCollectionMutation(`האוסף הוחלף (${formatDenomination(collection.length)} רשומות)`, "");
}

// --- Reset / Clear Collection ---
function openResetModal() {
  const modal = document.getElementById("reset-modal");
  if (modal) {
    modal.classList.remove("hidden");
  } else if (confirm("האם למחוק את כל הפריטים באוסף?")) {
    confirmResetCollection();
  }
}

function closeResetModal() {
  document.getElementById("reset-modal")?.classList.add("hidden");
}

function confirmResetCollection() {
  collection = [];
  closeResetModal();
  finalizeCollectionMutation("האוסף נוקה לחלוטין", "");
}

function restoreSampleCollection() {
  collection = SAMPLE_DATA.map(item => ({ ...item, location: normalizeLocation(item.location) }));
  closeResetModal();
  finalizeCollectionMutation("נטענו נתוני הדוגמה מחדש", "");
}