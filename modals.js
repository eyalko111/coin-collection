// Item Details Modal, Add/Edit Form Modal, Dropdowns & Confirmation Dialogs (modals.js)

let currentLocationOptions = [];

// --- Location Selector Dropdown ---
function getUniqueCollectionLocations() {
  return Array.from(
    new Set(
      collection
        .map(item => normalizeLocation(item.location))
        .filter(Boolean)
    )
  ).sort((a, b) => hebrewCollator.compare(a, b));
}

function populateLocationSuggestions() {
  currentLocationOptions = getUniqueCollectionLocations();
  renderLocationDropdown();
}

function updateLocationOptions(preselectedLocation = "") {
  currentLocationOptions = getUniqueCollectionLocations();
  const normalized = normalizeLocation(preselectedLocation);

  const locHidden = document.getElementById("form-location");
  const locDisplay = document.getElementById("form-location-display");
  const customWrap = document.getElementById("form-location-custom-wrap");
  const customInput = document.getElementById("form-location-custom-input");

  if (normalized) {
    if (locHidden) locHidden.value = normalized;
    if (locDisplay) {
      locDisplay.textContent = normalized;
      locDisplay.className = "truncate text-slate-900 dark:text-slate-100";
    }
    if (customWrap) customWrap.classList.add("hidden");
    if (customInput) customInput.value = "";
  } else {
    if (locHidden) locHidden.value = "";
    if (locDisplay) {
      locDisplay.textContent = "ללא מיקום";
      locDisplay.className = "truncate text-slate-400";
    }
    if (customWrap) customWrap.classList.add("hidden");
    if (customInput) customInput.value = "";
  }

  renderLocationDropdown();
}

function renderLocationDropdown() {
  const dropdown = document.getElementById("form-location-dropdown");
  if (!dropdown) return;

  const customWrap = document.getElementById("form-location-custom-wrap");
  const isCustomOpen = customWrap && !customWrap.classList.contains("hidden");
  const selectedLoc = isCustomOpen ? "__custom__" : normalizeLocation(document.getElementById("form-location")?.value);

  const itemsHtml = [
    `<button type="button" onclick="selectLocationOption('')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${selectedLoc === '' ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}">
      <span class="truncate">ללא מיקום</span>
      ${selectedLoc === '' ? `<span class="text-xs shrink-0">✓</span>` : ""}
    </button>`,
    ...currentLocationOptions.map(loc => {
      const active = loc === selectedLoc;
      return `
        <button type="button" onclick="selectLocationOption('${escapeJsStr(loc)}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${active ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
          <span class="truncate">${loc}</span>
          ${active ? `<span class="text-xs shrink-0">✓</span>` : ""}
        </button>
      `;
    }),
    `<button type="button" onclick="selectLocationOption('__custom__')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition text-indigo-600 dark:text-indigo-400 font-semibold border-t border-slate-100 dark:border-slate-700">
      <span>+ מיקום אחר (הזנה ידנית)...</span>
    </button>`
  ];

  dropdown.innerHTML = itemsHtml.join("");
}

function toggleLocationDropdown() {
  const dropdown = document.getElementById("form-location-dropdown");
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains("hidden");
  closeCountryDropdown();
  closeCurrencyDropdown();
  if (isHidden) {
    currentLocationOptions = getUniqueCollectionLocations();
    renderLocationDropdown();
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}

function closeLocationDropdown() {
  document.getElementById("form-location-dropdown")?.classList.add("hidden");
}

function selectLocationOption(val) {
  const locHidden = document.getElementById("form-location");
  const locDisplay = document.getElementById("form-location-display");
  const customWrap = document.getElementById("form-location-custom-wrap");
  const customInput = document.getElementById("form-location-custom-input");

  if (val === "__custom__") {
    if (locDisplay) {
      locDisplay.textContent = "מיקום אחר (הזנה ידנית)";
      locDisplay.className = "truncate text-slate-900 dark:text-slate-100";
    }
    if (customWrap) customWrap.classList.remove("hidden");
    if (customInput) {
      customInput.value = "";
      customInput.focus();
    }
    if (locHidden) locHidden.value = "";
  } else if (!val) {
    if (locHidden) locHidden.value = "";
    if (locDisplay) {
      locDisplay.textContent = "ללא מיקום";
      locDisplay.className = "truncate text-slate-400";
    }
    if (customWrap) customWrap.classList.add("hidden");
    if (customInput) customInput.value = "";
  } else {
    if (locHidden) locHidden.value = val;
    if (locDisplay) {
      locDisplay.textContent = val;
      locDisplay.className = "truncate text-slate-900 dark:text-slate-100";
    }
    if (customWrap) customWrap.classList.add("hidden");
    if (customInput) customInput.value = "";
  }

  closeLocationDropdown();
}

function onCustomLocationInputChange() {
  const customInput = document.getElementById("form-location-custom-input");
  const locHidden = document.getElementById("form-location");
  if (locHidden && customInput) {
    locHidden.value = normalizeLocation(customInput.value);
  }
}

// --- Item Details Modal (Centered Read-Only Info Popup) ---
function openItemDetailsModal(itemId) {
  const item = collection.find(x => x.id === itemId);
  if (!item) return;

  const meta = getCountryMeta(item.country);
  const isCoin = item.type === "coin";
  const qty = Number(item.quantity) || 1;
  const loc = normalizeLocation(item.location);

  const flagEl = document.getElementById("details-flag");
  if (flagEl) flagEl.textContent = meta.flag;

  const countryEl = document.getElementById("details-country");
  if (countryEl) countryEl.textContent = item.country;

  const typeBadgeEl = document.getElementById("details-type-badge");
  if (typeBadgeEl) {
    typeBadgeEl.textContent = isCoin ? "מטבע" : "שטר";
    typeBadgeEl.className = isCoin
      ? "inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
      : "inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300";
  }

  const valCurrEl = document.getElementById("details-value-currency");
  if (valCurrEl) {
    valCurrEl.textContent = `${formatDenomination(item.value)} ${item.currency}`;
  }

  const yearEl = document.getElementById("details-year");
  if (yearEl) yearEl.textContent = formatYearText(item.year);

  const qtyEl = document.getElementById("details-quantity");
  if (qtyEl) qtyEl.textContent = formatDenomination(qty);

  const locEl = document.getElementById("details-location");
  if (locEl) {
    locEl.textContent = loc || "ללא מיקום מוגדר";
    locEl.className = loc
      ? "font-semibold text-slate-800 dark:text-slate-100 truncate text-left"
      : "font-normal text-slate-400 dark:text-slate-500 truncate text-left";
  }

  document.getElementById("item-details-modal")?.classList.remove("hidden");
}

function closeItemDetailsModal() {
  document.getElementById("item-details-modal")?.classList.add("hidden");
}

// --- Add / Edit Item Modal ---
function setFormType(type) {
  const hiddenType = document.getElementById("form-type");
  if (hiddenType) hiddenType.value = type;

  document.querySelectorAll(".form-type-pill").forEach(btn => {
    if (btn.dataset.formType === type) {
      btn.className = "form-type-pill flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs transition";
    } else {
      btn.className = "form-type-pill flex-1 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 transition";
    }
  });
}

function adjustFormQuantity(delta) {
  const input = document.getElementById("form-quantity");
  if (!input) return;
  const current = parseInt(input.value, 10) || 1;
  const next = Math.max(1, current + delta);
  input.value = next;
}

function openItemModal(itemId = null, prefillCountry = "") {
  closeCountryDropdown();
  closeCurrencyDropdown();
  closeLocationDropdown();

  const modal = document.getElementById("item-modal");
  if (!modal) return;

  const titleEl = document.getElementById("item-modal-title");
  const idInput = document.getElementById("form-item-id");
  const countryHidden = document.getElementById("form-country");
  const countryInput = document.getElementById("form-country-input");
  const valueInput = document.getElementById("form-value");
  const yearInput = document.getElementById("form-year");
  const qtyInput = document.getElementById("form-quantity");
  const addActions = document.getElementById("form-add-actions");
  const editActions = document.getElementById("form-edit-actions");

  if (itemId) {
    const item = collection.find(x => x.id === itemId);
    if (!item) return;

    originalEditingItem = { ...item };
    if (titleEl) titleEl.textContent = "עריכת פריט";
    if (idInput) idInput.value = item.id;
    setFormType(item.type || "coin");

    if (countryHidden) countryHidden.value = item.country;
    if (countryInput) countryInput.value = item.country;
    updateFormSeriesInfoButton(item.country);
    updateCurrencyOptionsForCountry(item.country, item.currency);

    if (valueInput) valueInput.value = formatDenomination(item.value);
    if (yearInput) yearInput.value = hasValidYear(item.year) ? item.year : "";
    if (qtyInput) qtyInput.value = Number(item.quantity) || 1;
    updateLocationOptions(normalizeLocation(item.location));

    if (addActions) addActions.classList.add("hidden");
    if (editActions) editActions.classList.remove("hidden");
  } else {
    originalEditingItem = null;
    if (titleEl) titleEl.textContent = "הוספת פריט חדש";
    if (idInput) idInput.value = "";
    setFormType("coin");

    const initialCountry = prefillCountry || "";
    if (countryHidden) countryHidden.value = initialCountry;
    if (countryInput) countryInput.value = initialCountry;
    updateFormSeriesInfoButton(initialCountry);
    updateCurrencyOptionsForCountry(initialCountry, "");

    if (valueInput) valueInput.value = "";
    if (yearInput) yearInput.value = "";
    if (qtyInput) qtyInput.value = 1;
    updateLocationOptions("");

    if (addActions) addActions.classList.remove("hidden");
    if (editActions) editActions.classList.add("hidden");
  }

  modal.classList.remove("hidden");
}

function closeItemModal() {
  closeCountryDropdown();
  closeCurrencyDropdown();
  closeLocationDropdown();
  originalEditingItem = null;
  document.getElementById("item-modal")?.classList.add("hidden");
}

// --- Country Searchable Dropdown ---
function onCountryInputFocus() {
  closeCurrencyDropdown();
  closeLocationDropdown();
  const input = document.getElementById("form-country-input");
  renderCountryDropdown(input ? input.value : "");
}

function onCountryInputChange() {
  const input = document.getElementById("form-country-input");
  const val = input ? input.value : "";
  const trimmed = val.trim();

  const hidden = document.getElementById("form-country");
  if (hidden) hidden.value = trimmed;

  const exactMatch = COUNTRIES_DB.find(c => c.name === trimmed);
  if (exactMatch) {
    updateFormSeriesInfoButton(exactMatch.name);
    updateCurrencyOptionsForCountry(exactMatch.name, document.getElementById("form-currency")?.value || "");
  } else {
    updateFormSeriesInfoButton(trimmed);
    updateCurrencyOptionsForCountry(trimmed, document.getElementById("form-currency")?.value || "");
  }

  renderCountryDropdown(val);
}

function renderCountryDropdown(query) {
  const dropdown = document.getElementById("form-country-dropdown");
  if (!dropdown) return;

  const q = (query || "").trim().toLowerCase();
  const matches = COUNTRIES_DB.filter(c =>
    !q ||
    c.name.toLowerCase().includes(q) ||
    (c.continent && c.continent.toLowerCase().includes(q))
  );

  let html = matches.slice(0, 60).map(c => `
    <button type="button" onclick="selectCountryOption('${escapeJsStr(c.name)}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition text-slate-800 dark:text-slate-100">
      <div class="flex items-center gap-2 min-w-0">
        <span class="emoji-flag text-base shrink-0">${c.flag}</span>
        <span class="font-medium truncate">${c.name}</span>
        ${c.former ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shrink-0">מדינת עבר</span>` : ""}
      </div>
      <span class="text-[11px] text-slate-400 shrink-0">${c.continent}</span>
    </button>
  `).join("");

  const trimmed = (query || "").trim();
  const hasExact = COUNTRIES_DB.some(c => c.name === trimmed);
  if (trimmed && !hasExact) {
    html += `
      <button type="button" onclick="selectCountryOption('${escapeJsStr(trimmed)}')" class="w-full px-3 py-2 text-right text-xs flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 transition text-indigo-600 dark:text-indigo-400 font-semibold border-t border-slate-100 dark:border-slate-700">
        <span>+ השתמש במדינה מותאמת: "${trimmed}"</span>
      </button>
    `;
  }

  if (!html) {
    html = `<div class="px-3 py-3 text-xs text-slate-400 text-center">לא נמצאו מדינות תואמות</div>`;
  }

  dropdown.innerHTML = html;
  dropdown.classList.remove("hidden");
}

function selectCountryOption(countryName) {
  const hidden = document.getElementById("form-country");
  const input = document.getElementById("form-country-input");
  if (hidden) hidden.value = countryName;
  if (input) input.value = countryName;

  closeCountryDropdown();
  updateFormSeriesInfoButton(countryName);
  updateCurrencyOptionsForCountry(countryName, "");
}

function closeCountryDropdown() {
  document.getElementById("form-country-dropdown")?.classList.add("hidden");
}

// --- Currency Selector Dropdown ---
function updateCurrencyOptionsForCountry(countryName, preselectedCurrency = "") {
  const meta = COUNTRIES_DB.find(c => c.name === countryName);
  currentCurrencyOptions = meta && Array.isArray(meta.currencies) ? [...meta.currencies] : [];

  const currHidden = document.getElementById("form-currency");
  const currDisplay = document.getElementById("form-currency-display");
  const customWrap = document.getElementById("form-currency-custom-wrap");
  const customInput = document.getElementById("form-currency-custom-input");

  let chosen = preselectedCurrency;
  if (!chosen && currentCurrencyOptions.length > 0) {
    chosen = currentCurrencyOptions[0];
  }

  if (chosen && (currentCurrencyOptions.length === 0 || !currentCurrencyOptions.includes(chosen))) {
    if (currHidden) currHidden.value = chosen;
    if (currDisplay) currDisplay.textContent = currentCurrencyOptions.length > 0 ? "מטבע אחר (הזנה ידנית)" : chosen;
    if (customWrap) customWrap.classList.remove("hidden");
    if (customInput) customInput.value = chosen;
  } else {
    if (currHidden) currHidden.value = chosen || "";
    if (currDisplay) currDisplay.textContent = chosen || "בחר מטבע...";
    if (customWrap) {
      customWrap.classList.toggle("hidden", currentCurrencyOptions.length > 0);
    }
    if (customInput) customInput.value = "";
  }

  renderCurrencyDropdown();
}

function renderCurrencyDropdown() {
  const dropdown = document.getElementById("form-currency-dropdown");
  if (!dropdown) return;

  const selectedCurr = document.getElementById("form-currency")?.value || "";
  const itemsHtml = currentCurrencyOptions.map(curr => {
    const active = curr === selectedCurr;
    return `
      <button type="button" onclick="selectCurrencyOption('${escapeJsStr(curr)}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${active ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
        <span class="truncate">${curr}</span>
        ${active ? `<span class="text-xs shrink-0">✓</span>` : ""}
      </button>
    `;
  });

  itemsHtml.push(`
    <button type="button" onclick="selectCurrencyOption('__custom__')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition text-indigo-600 dark:text-indigo-400 font-semibold border-t border-slate-100 dark:border-slate-700">
      <span>+ מטבע אחר (הזנה ידנית)...</span>
    </button>
  `);

  dropdown.innerHTML = itemsHtml.join("");
}

function toggleCurrencyDropdown() {
  const dropdown = document.getElementById("form-currency-dropdown");
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains("hidden");
  closeCountryDropdown();
  closeLocationDropdown();
  if (isHidden) {
    renderCurrencyDropdown();
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}

function closeCurrencyDropdown() {
  document.getElementById("form-currency-dropdown")?.classList.add("hidden");
}

function selectCurrencyOption(val) {
  const currHidden = document.getElementById("form-currency");
  const currDisplay = document.getElementById("form-currency-display");
  const customWrap = document.getElementById("form-currency-custom-wrap");
  const customInput = document.getElementById("form-currency-custom-input");

  if (val === "__custom__") {
    if (currDisplay) currDisplay.textContent = "מטבע אחר (הזנה ידנית)";
    if (customWrap) customWrap.classList.remove("hidden");
    if (customInput) {
      customInput.value = "";
      customInput.focus();
    }
    if (currHidden) currHidden.value = "";
  } else {
    if (currHidden) currHidden.value = val;
    if (currDisplay) currDisplay.textContent = val;
    if (customWrap) customWrap.classList.add("hidden");
    if (customInput) customInput.value = "";
  }

  closeCurrencyDropdown();
}

function onCustomCurrencyInputChange() {
  const customInput = document.getElementById("form-currency-custom-input");
  const currHidden = document.getElementById("form-currency");
  if (currHidden && customInput) {
    currHidden.value = customInput.value.trim();
  }
}

// --- Form Parsing, Validation & Mutation Helpers ---
function isSameItemIdentity(a, b) {
  return (
    a.type === b.type &&
    a.country === b.country &&
    a.currency === b.currency &&
    Number(a.value) === Number(b.value) &&
    normalizeYear(a.year) === normalizeYear(b.year)
  );
}

function hasItemBeenModified(orig, updated) {
  if (!orig || !updated) return true;
  return (
    orig.type !== updated.type ||
    orig.country !== updated.country ||
    orig.currency !== updated.currency ||
    Number(orig.value) !== Number(updated.value) ||
    normalizeYear(orig.year) !== normalizeYear(updated.year) ||
    (Number(orig.quantity) || 1) !== (Number(updated.quantity) || 1) ||
    normalizeLocation(orig.location) !== normalizeLocation(updated.location)
  );
}

function buildValidatedCandidateFromForm() {
  const id = (document.getElementById("form-item-id")?.value || "").trim();
  const type = document.getElementById("form-type")?.value || "coin";
  const rawCountry = (document.getElementById("form-country")?.value || document.getElementById("form-country-input")?.value || "").trim();
  const customCurrEl = document.getElementById("form-currency-custom-input");
  const customWrapEl = document.getElementById("form-currency-custom-wrap");
  const isCustomCurrVisible = customWrapEl && !customWrapEl.classList.contains("hidden");
  const rawCurrency = isCustomCurrVisible && customCurrEl && customCurrEl.value.trim()
    ? customCurrEl.value.trim()
    : (document.getElementById("form-currency")?.value || "").trim();

  const parsedValue = parseDenomination(document.getElementById("form-value")?.value);
  const rawYear = (document.getElementById("form-year")?.value || "").trim();
  const parsedYear = rawYear === "" ? null : normalizeYear(rawYear);
  const parsedQty = Math.max(1, parseInt(document.getElementById("form-quantity")?.value, 10) || 1);

  const customLocEl = document.getElementById("form-location-custom-input");
  const customLocWrapEl = document.getElementById("form-location-custom-wrap");
  const isCustomLocVisible = customLocWrapEl && !customLocWrapEl.classList.contains("hidden");
  const parsedLoc = isCustomLocVisible && customLocEl
    ? normalizeLocation(customLocEl.value)
    : normalizeLocation(document.getElementById("form-location")?.value);

  if (!rawCountry) {
    showToast("יש לבחור או להזין מדינה");
    return null;
  }
  if (!rawCurrency) {
    showToast("יש לבחור או להזין שם מטבע");
    return null;
  }
  if (isNaN(parsedValue) || parsedValue <= 0) {
    showToast("יש להזין ערך נקוב תקין גדול מ-0");
    return null;
  }
  if (rawYear !== "" && parsedYear === null) {
    showToast("שנת הנפקה לא תקינה");
    return null;
  }

  return {
    id: id || String(Date.now()),
    type,
    country: rawCountry,
    currency: rawCurrency,
    value: parsedValue,
    year: parsedYear,
    quantity: parsedQty,
    location: parsedLoc
  };
}

function finalizeCollectionMutation(toastMsg, targetCountry = "") {
  saveCollection();
  updateFilterDropdowns();
  renderCollection();
  if (currentTab === "stats") {
    renderStats();
  }
  if (currentTab === "map") {
    if (typeof updateMapPolygonStyles === "function") updateMapPolygonStyles();
    if (typeof updateMapSelectionPill === "function") updateMapSelectionPill();
    if (typeof renderMicrostatesDrawer === "function") renderMicrostatesDrawer();
    if (typeof renderSelectedMapCountryDetails === "function") renderSelectedMapCountryDetails();
  }
  if (toastMsg) showToast(toastMsg);
  if (targetCountry && currentTab === "collection") {
    scrollToCountryBlock(targetCountry);
  }
}

// --- Add Mode Submit ---
function handleItemFormSubmit(event) {
  if (event) event.preventDefault();

  const id = (document.getElementById("form-item-id")?.value || "").trim();
  if (id) {
    onEditSaveClick();
    return;
  }

  const candidate = buildValidatedCandidateFromForm();
  if (!candidate) return;

  const existingMatch = collection.find(x => isSameItemIdentity(x, candidate));
  if (existingMatch) {
    pendingDuplicate = {
      mode: "add",
      existingId: existingMatch.id,
      newItem: candidate
    };
    openDuplicateModal(existingMatch, candidate);
    return;
  }

  collection.push(candidate);
  closeItemModal();
  finalizeCollectionMutation("הפריט נוסף לאוסף", candidate.country);
}

// --- Edit Mode 3-Button Handlers & Unified Confirmation Modal ---
function onEditSaveClick() {
  const id = (document.getElementById("form-item-id")?.value || "").trim();
  if (!id) return;

  const candidate = buildValidatedCandidateFromForm();
  if (!candidate) return;

  if (!hasItemBeenModified(originalEditingItem, candidate)) {
    closeItemModal();
    showToast("לא בוצעו שינויים בפריט");
    return;
  }

  const typeLabel = candidate.type === "coin" ? "המטבע" : "השטר";
  openEditConfirmModal({
    type: "save",
    candidate,
    title: "אישור שמירת שינויים",
    desc: `האם לשמור את השינויים שביצעת ב${typeLabel} ${formatDenomination(candidate.value)} ${candidate.currency} (${candidate.country}, ${formatYearText(candidate.year)})?`,
    btnText: "שמור שינויים",
    btnClass: "flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
  });
}

function onEditSaveAsNewClick() {
  const candidate = buildValidatedCandidateFromForm();
  if (!candidate) return;

  const newCopy = {
    ...candidate,
    id: String(Date.now())
  };

  const typeLabel = newCopy.type === "coin" ? "מטבע" : "שטר";
  openEditConfirmModal({
    type: "save-as-new",
    candidate: newCopy,
    title: "שמירה כפריט חדש",
    desc: `האם להוסיף ${typeLabel} חדש של ${formatDenomination(newCopy.value)} ${newCopy.currency} (${newCopy.country}, ${formatYearText(newCopy.year)}) מבלי לשנות את הפריט המקורי?`,
    btnText: "שמור כחדש",
    btnClass: "flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
  });
}

function onEditDeleteClick() {
  const id = (document.getElementById("form-item-id")?.value || "").trim();
  if (!id) return;

  const item = collection.find(x => x.id === id) || originalEditingItem;
  if (!item) return;

  const typeLabel = item.type === "coin" ? "המטבע" : "השטר";
  openEditConfirmModal({
    type: "delete",
    itemId: id,
    title: "אישור מחיקת פריט",
    desc: `האם אתה בטוח שברצונך למחוק לצמיתות את ${typeLabel} ${formatDenomination(item.value)} ${item.currency} (${item.country}, ${formatYearText(item.year)})?`,
    btnText: "כן, מחק פריט",
    btnClass: "flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
  });
}

function openEditConfirmModal(actionConfig) {
  pendingEditAction = actionConfig;
  const modal = document.getElementById("edit-confirm-modal");
  if (!modal) {
    confirmPendingEditAction();
    return;
  }

  const titleEl = document.getElementById("edit-confirm-title");
  if (titleEl) titleEl.textContent = actionConfig.title;

  const descEl = document.getElementById("edit-confirm-desc");
  if (descEl) descEl.textContent = actionConfig.desc;

  const btnEl = document.getElementById("edit-confirm-btn");
  if (btnEl) {
    btnEl.textContent = actionConfig.btnText;
    btnEl.className = actionConfig.btnClass;
  }

  modal.classList.remove("hidden");
}

function closeEditConfirmModal() {
  pendingEditAction = null;
  document.getElementById("edit-confirm-modal")?.classList.add("hidden");
}

// Compatibility alias in case Escape handler references closeDeleteConfirmModal
function closeDeleteConfirmModal() {
  closeEditConfirmModal();
}

function confirmPendingEditAction() {
  if (!pendingEditAction) return;
  const action = pendingEditAction;
  closeEditConfirmModal();

  if (action.type === "save") {
    const candidate = action.candidate;
    const idx = collection.findIndex(x => x.id === candidate.id);
    if (idx === -1) return;

    const existingDuplicate = collection.find(x => x.id !== candidate.id && isSameItemIdentity(x, candidate));
    if (existingDuplicate) {
      pendingDuplicate = {
        mode: "edit-merge",
        editingId: candidate.id,
        existingId: existingDuplicate.id,
        newItem: candidate
      };
      openDuplicateModal(existingDuplicate, candidate);
      return;
    }

    collection[idx] = candidate;
    closeItemModal();
    finalizeCollectionMutation("השינויים נשמרו בהצלחה", candidate.country);
    return;
  }

  if (action.type === "save-as-new") {
    const newCopy = action.candidate;
    const existingMatch = collection.find(x => isSameItemIdentity(x, newCopy));
    if (existingMatch) {
      pendingDuplicate = {
        mode: "add",
        existingId: existingMatch.id,
        newItem: newCopy
      };
      openDuplicateModal(existingMatch, newCopy);
      return;
    }

    collection.push(newCopy);
    closeItemModal();
    finalizeCollectionMutation("נשמר כפריט חדש באוסף", newCopy.country);
    return;
  }

  if (action.type === "delete") {
    collection = collection.filter(x => x.id !== action.itemId);
    closeItemModal();
    finalizeCollectionMutation("הפריט נמחק מהאוסף", "");
  }
}

// --- Duplicate Confirmation Modal ---
function openDuplicateModal(existingItem, newItem) {
  const modal = document.getElementById("duplicate-modal");
  if (!modal) {
    confirmDuplicateMerge();
    return;
  }

  const descEl = document.getElementById("duplicate-modal-desc");
  if (descEl) {
    const typeLabel = newItem.type === "coin" ? "מטבע" : "שטר";
    const yearLabel = formatYearText(newItem.year);
    const existingQty = Number(existingItem.quantity) || 1;
    descEl.textContent = `כבר קיים באוסף ${typeLabel} של ${formatDenomination(newItem.value)} ${newItem.currency} (${newItem.country}, ${yearLabel}) בכמות ${existingQty}. כיצד תרצה להמשיך?`;
  }

  modal.classList.remove("hidden");
}

function closeDuplicateModal() {
  pendingDuplicate = null;
  document.getElementById("duplicate-modal")?.classList.add("hidden");
}

function confirmDuplicateMerge() {
  if (!pendingDuplicate) return;
  const { mode, editingId, existingId, newItem } = pendingDuplicate;
  const target = collection.find(x => x.id === existingId);

  if (target) {
    target.quantity = (Number(target.quantity) || 1) + (Number(newItem.quantity) || 1);
    if (!normalizeLocation(target.location) && normalizeLocation(newItem.location)) {
      target.location = normalizeLocation(newItem.location);
    }
  }

  if (mode === "edit-merge" && editingId) {
    collection = collection.filter(x => x.id !== editingId);
  }

  const countryToScroll = newItem.country;
  closeDuplicateModal();
  closeItemModal();
  finalizeCollectionMutation("הכמות אוחדה עם הפריט הקיים", countryToScroll);
}

function confirmDuplicateSeparate() {
  if (!pendingDuplicate) return;
  const { mode, editingId, newItem } = pendingDuplicate;

  if (mode === "edit-merge" && editingId) {
    const idx = collection.findIndex(x => x.id === editingId);
    if (idx !== -1) collection[idx] = newItem;
  } else {
    collection.push(newItem);
  }

  const countryToScroll = newItem.country;
  closeDuplicateModal();
  closeItemModal();
  finalizeCollectionMutation("נשמר כפריט נפרד באוסף", countryToScroll);
}