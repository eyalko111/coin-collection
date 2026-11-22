// Item Details Modal, Add/Edit Form Modal, Dropdowns & Duplicate/Delete Dialogs (modals.js)

let pendingDeleteId = null;

// --- Location Datalist Suggestions ---
function populateLocationSuggestions() {
  const datalist = document.getElementById("location-suggestions");
  if (!datalist) return;
  const uniqueLocations = Array.from(
    new Set(
      collection
        .map(item => normalizeLocation(item.location))
        .filter(Boolean)
    )
  ).sort((a, b) => hebrewCollator.compare(a, b));

  datalist.innerHTML = uniqueLocations
    .map(loc => `<option value="${escapeHtmlAttr(loc)}"></option>`)
    .join("");
}

// --- Item Details Modal (Read-Only View) ---
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
      ? "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
      : "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300";
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
      ? "text-sm font-semibold text-slate-800 dark:text-slate-100"
      : "text-sm font-normal text-slate-400 dark:text-slate-500";
  }

  const editBtn = document.getElementById("details-edit-btn");
  if (editBtn) {
    editBtn.onclick = () => {
      closeItemDetailsModal();
      openItemModal(item.id);
    };
  }

  const deleteBtn = document.getElementById("details-delete-btn");
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeItemDetailsModal();
      requestDeleteItem(item.id);
    };
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
  populateLocationSuggestions();
  closeCountryDropdown();
  closeCurrencyDropdown();

  const modal = document.getElementById("item-modal");
  if (!modal) return;

  const titleEl = document.getElementById("item-modal-title");
  const idInput = document.getElementById("form-item-id");
  const countryHidden = document.getElementById("form-country");
  const countryInput = document.getElementById("form-country-input");
  const valueInput = document.getElementById("form-value");
  const yearInput = document.getElementById("form-year");
  const qtyInput = document.getElementById("form-quantity");
  const locInput = document.getElementById("form-location");
  const deleteBtn = document.getElementById("btn-delete-item");

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
    if (locInput) locInput.value = normalizeLocation(item.location);
    if (deleteBtn) deleteBtn.classList.remove("hidden");
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
    if (locInput) locInput.value = "";
    if (deleteBtn) deleteBtn.classList.add("hidden");
  }

  modal.classList.remove("hidden");
}

function closeItemModal() {
  closeCountryDropdown();
  closeCurrencyDropdown();
  originalEditingItem = null;
  document.getElementById("item-modal")?.classList.add("hidden");
}

// --- Country Searchable Dropdown ---
function onCountryInputFocus() {
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

// --- Save / Duplicate / Edit Handling ---
function isSameItemIdentity(a, b) {
  return (
    a.type === b.type &&
    a.country === b.country &&
    a.currency === b.currency &&
    Number(a.value) === Number(b.value) &&
    normalizeYear(a.year) === normalizeYear(b.year)
  );
}

function finalizeCollectionMutation(toastMsg, targetCountry = "") {
  saveCollection();
  updateFilterDropdowns();
  renderCollection();
  if (currentTab === "stats") {
    renderStats();
  }
  if (toastMsg) showToast(toastMsg);
  if (targetCountry) {
    scrollToCountryBlock(targetCountry);
  }
}

function handleItemFormSubmit(event) {
  if (event) event.preventDefault();

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
  const parsedLoc = normalizeLocation(document.getElementById("form-location")?.value);

  if (!rawCountry) {
    showToast("יש לבחור או להזין מדינה");
    return;
  }
  if (!rawCurrency) {
    showToast("יש לבחור או להזין שם מטבע");
    return;
  }
  if (isNaN(parsedValue) || parsedValue <= 0) {
    showToast("יש להזין ערך נקוב תקין גדול מ-0");
    return;
  }
  if (rawYear !== "" && parsedYear === null) {
    showToast("שנת הנפקה לא תקינה");
    return;
  }

  const candidate = {
    id: id || String(Date.now()),
    type,
    country: rawCountry,
    currency: rawCurrency,
    value: parsedValue,
    year: parsedYear,
    quantity: parsedQty,
    location: parsedLoc
  };

  // Editing an existing record
  if (id) {
    const idx = collection.findIndex(x => x.id === id);
    if (idx === -1) return;

    const existingDuplicate = collection.find(x => x.id !== id && isSameItemIdentity(x, candidate));
    if (existingDuplicate) {
      pendingDuplicate = {
        mode: "edit-merge",
        editingId: id,
        existingId: existingDuplicate.id,
        newItem: candidate
      };
      openDuplicateModal(existingDuplicate, candidate);
      return;
    }

    collection[idx] = candidate;
    closeItemModal();
    finalizeCollectionMutation("הפריט עודכן בהצלחה", candidate.country);
    return;
  }

  // Adding a new record — check for duplicate
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

// --- Duplicate Confirmation Modal ---
function openDuplicateModal(existingItem, newItem) {
  const modal = document.getElementById("duplicate-modal");
  if (!modal) {
    // Fallback if modal element is absent: merge directly
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

// --- Delete Item Flow ---
function deleteCurrentEditingItem() {
  const id = (document.getElementById("form-item-id")?.value || "").trim();
  if (!id) return;
  closeItemModal();
  requestDeleteItem(id);
}

function requestDeleteItem(itemId) {
  const item = collection.find(x => x.id === itemId);
  if (!item) return;

  const modal = document.getElementById("delete-confirm-modal");
  if (!modal) {
    if (confirm(`למחוק את ${formatDenomination(item.value)} ${item.currency} (${item.country})?`)) {
      executeDeleteItem(itemId);
    }
    return;
  }

  pendingDeleteId = itemId;
  const descEl = document.getElementById("delete-confirm-desc");
  if (descEl) {
    const typeLabel = item.type === "coin" ? "המטבע" : "השטר";
    descEl.textContent = `האם אתה בטוח שברצונך למחוק את ${typeLabel} ${formatDenomination(item.value)} ${item.currency} (${item.country}, ${formatYearText(item.year)})?`;
  }
  modal.classList.remove("hidden");
}

function closeDeleteConfirmModal() {
  pendingDeleteId = null;
  document.getElementById("delete-confirm-modal")?.classList.add("hidden");
}

function confirmDeleteItem() {
  if (!pendingDeleteId) return;
  const idToDelete = pendingDeleteId;
  closeDeleteConfirmModal();
  executeDeleteItem(idToDelete);
}

function executeDeleteItem(itemId) {
  collection = collection.filter(x => x.id !== itemId);
  finalizeCollectionMutation("הפריט נמחק מהאוסף", "");
}