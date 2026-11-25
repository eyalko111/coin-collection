// Collection View, Search, Filters, Grouping & Dividers (collection.js)

const EU_VIRTUAL_COUNTRY = "האיחוד האירופי";
const EU_VIRTUAL_FLAG = "🇪🇺";
const EU_CURRENCIES = ["אירו", "אירו סנט"];

function isEuCurrencyItem(item) {
  const curr = (item?.currency || "").trim();
  return EU_CURRENCIES.includes(curr);
}

function sortEuVirtualItems(items) {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "coin" ? -1 : 1;
    }
    const unitA = (a.currency || "").trim() === "אירו" ? 0 : 1;
    const unitB = (b.currency || "").trim() === "אירו" ? 0 : 1;
    if (unitA !== unitB) {
      return unitA - unitB;
    }
    const valA = Number(a.value) || 0;
    const valB = Number(b.value) || 0;
    if (valA !== valB) {
      return valB - valA;
    }
    const countryCmp = hebrewCollator.compare(a.country || "", b.country || "");
    if (countryCmp !== 0) {
      return countryCmp;
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

function closeAllFilterDropdowns(exceptType = null) {
  ["continent", "country", "decade"].forEach(type => {
    if (type !== exceptType) {
      document.getElementById(`filter-${type}-menu`)?.classList.add("hidden");
    }
  });
}

function toggleFilterDropdown(type) {
  const menu = document.getElementById(`filter-${type}-menu`);
  if (!menu) return;
  const isHidden = menu.classList.contains("hidden");
  closeAllFilterDropdowns(type);
  if (isHidden) {
    updateFilterDropdowns();
    menu.classList.remove("hidden");
  } else {
    menu.classList.add("hidden");
  }
}

function setTriggerActiveStyle(triggerId, isActive) {
  const el = document.getElementById(triggerId);
  if (!el) return;
  if (isActive) {
    el.className = "w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 outline-none flex items-center justify-between gap-1 text-right transition";
  } else {
    el.className = "w-full px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-transparent focus:border-indigo-500 outline-none flex items-center justify-between gap-1 text-right transition";
  }
}

function updateFilterDropdowns() {
  const contMenu = document.getElementById("filter-continent-menu");
  const contOptions = [
    { value: "all", label: "כל היבשות" },
    ...CONTINENT_ORDER.map(c => ({ value: c, label: c }))
  ];
  contMenu.innerHTML = contOptions.map(opt => {
    const active = opt.value === selectedContinentFilter;
    return `
      <button type="button" onclick="selectFilterOption('continent', '${escapeJsStr(opt.value)}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${active ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
        <span class="truncate">${opt.label}</span>
        ${active ? `<span class="text-xs shrink-0">✓</span>` : ""}
      </button>
    `;
  }).join("");
  document.getElementById("filter-continent-display").textContent =
    selectedContinentFilter === "all" ? "כל היבשות" : selectedContinentFilter;
  setTriggerActiveStyle("filter-continent-trigger", selectedContinentFilter !== "all");

  const countriesInCollection = Array.from(new Set(collection.map(i => i.country)))
    .filter(cName => selectedContinentFilter === "all" || getCountryMeta(cName).continent === selectedContinentFilter)
    .sort((a, b) => hebrewCollator.compare(a, b));

  if (selectedCountryFilter !== "all" && !countriesInCollection.includes(selectedCountryFilter)) {
    selectedCountryFilter = "all";
  }

  const countryMenu = document.getElementById("filter-country-menu");
  const countryItemsHtml = [
    `<button type="button" onclick="selectFilterOption('country', 'all')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${selectedCountryFilter === 'all' ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
      <span class="truncate">כל המדינות</span>
      ${selectedCountryFilter === 'all' ? `<span class="text-xs shrink-0">✓</span>` : ""}
    </button>`,
    ...countriesInCollection.map(cName => {
      const meta = getCountryMeta(cName);
      const active = cName === selectedCountryFilter;
      return `
        <button type="button" onclick="selectFilterOption('country', '${escapeJsStr(cName)}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${active ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="emoji-flag text-sm shrink-0">${meta.flag}</span>
            <span class="truncate">${cName}</span>
          </div>
          ${active ? `<span class="text-xs shrink-0">✓</span>` : ""}
        </button>
      `;
    })
  ].join("");
  countryMenu.innerHTML = countryItemsHtml;

  if (selectedCountryFilter === "all") {
    document.getElementById("filter-country-display").textContent = "כל המדינות";
  } else {
    const meta = getCountryMeta(selectedCountryFilter);
    document.getElementById("filter-country-display").textContent = `${meta.flag} ${selectedCountryFilter}`;
  }
  setTriggerActiveStyle("filter-country-trigger", selectedCountryFilter !== "all");

  const decades = Array.from(new Set(
    collection
      .filter(i => hasValidYear(i.year))
      .map(i => Math.floor(Number(i.year) / 10) * 10)
  )).sort((a, b) => b - a);

  if (selectedDecadeFilter !== "all" && !decades.map(String).includes(selectedDecadeFilter)) {
    selectedDecadeFilter = "all";
  }

  const decadeMenu = document.getElementById("filter-decade-menu");
  const decadeOptions = [
    { value: "all", label: "כל העשורים" },
    ...decades.map(d => ({ value: String(d), label: `שנות ה-${d}` }))
  ];
  decadeMenu.innerHTML = decadeOptions.map(opt => {
    const active = opt.value === selectedDecadeFilter;
    return `
      <button type="button" onclick="selectFilterOption('decade', '${opt.value}')" class="w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700/70 transition ${active ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}">
        <span class="truncate">${opt.label}</span>
        ${active ? `<span class="text-xs shrink-0">✓</span>` : ""}
      </button>
    `;
  }).join("");
  document.getElementById("filter-decade-display").textContent =
    selectedDecadeFilter === "all" ? "כל העשורים" : `שנות ה-${selectedDecadeFilter}`;
  setTriggerActiveStyle("filter-decade-trigger", selectedDecadeFilter !== "all");
}

function selectFilterOption(type, value) {
  if (type === "continent") {
    selectedContinentFilter = value;
  } else if (type === "country") {
    selectedCountryFilter = value;
  } else if (type === "decade") {
    selectedDecadeFilter = value;
  }
  closeAllFilterDropdowns();
  updateFilterDropdowns();
  renderCollection();
}

function setTypeFilter(type) {
  currentTypeFilter = type;
  document.querySelectorAll(".type-pill").forEach(btn => {
    if (btn.dataset.type === type) {
      btn.className = "type-pill py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-xs transition";
    } else {
      btn.className = "type-pill py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition";
    }
  });
  renderCollection();
}

function setGroupMode(mode) {
  currentGroupMode = mode;
  document.querySelectorAll(".group-pill").forEach(btn => {
    if (btn.dataset.group === mode) {
      btn.className = "group-pill px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs transition";
    } else {
      btn.className = "group-pill px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition";
    }
  });
  renderCollection();
}

function updateCollapseToggleButton() {
  const labelEl = document.getElementById("label-toggle-collapse");
  const iconEl = document.getElementById("icon-toggle-collapse");
  if (!labelEl || !iconEl) return;
  if (isAllCollapsed) {
    labelEl.textContent = "פתח הכול";
    iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>`;
  } else {
    labelEl.textContent = "כווץ הכול";
    iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M18 15l-6-6-6 6"/>`;
  }
}

function toggleCollapseAll() {
  if (isAllCollapsed) {
    expandAll();
  } else {
    collapseAll();
  }
}

function collapseAll() {
  CONTINENT_ORDER.forEach(c => {
    collapsedContinents[c] = true;
  });
  collection.forEach(item => {
    const meta = getCountryMeta(item.country);
    if (meta && meta.continent) {
      collapsedContinents[meta.continent] = true;
    }
    collapsedCountries[item.country] = true;
  });
  collapsedCountries[EU_VIRTUAL_COUNTRY] = true;
  isAllCollapsed = true;
  updateCollapseToggleButton();
  renderCollection();
}

function expandAll() {
  collapsedContinents = {};
  collapsedCountries = {};
  isAllCollapsed = false;
  updateCollapseToggleButton();
  renderCollection();
}

function clearSearch() {
  document.getElementById("search-input").value = "";
  renderCollection();
}

function renderCountryBlockHtml(cName, rawItems, isEuVirtual = false) {
  const meta = isEuVirtual
    ? { name: EU_VIRTUAL_COUNTRY, flag: EU_VIRTUAL_FLAG, former: false }
    : getCountryMeta(cName);
  const items = isEuVirtual ? sortEuVirtualItems(rawItems) : sortCountryItems(rawItems, cName);
  const coinsCount = items.filter(x => x.type === "coin").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const notesCount = items.filter(x => x.type === "banknote").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const summaryText = formatQuantitySummary(coinsCount, notesCount);
  const isCountryCollapsed = !!collapsedCountries[cName];
  const safeNameAttr = escapeHtmlAttr(cName);
  const safeNameJs = escapeJsStr(cName);
  const hasSeriesInfo = !isEuVirtual && !!SERIES_INFO_DB[cName];

  // Check whether this country has at least one coin era/series transition
  let hasCoinEraTransition = false;
  if (!isEuVirtual) {
    for (let i = 1; i < items.length; i++) {
      if (items[i].type === "coin" && items[i - 1].type === "coin") {
        if (getItemEraSignature(items[i - 1], cName) !== getItemEraSignature(items[i], cName)) {
          hasCoinEraTransition = true;
          break;
        }
      }
    }
  }

  let block = `
    <div class="mb-5" data-country-block="${safeNameAttr}">
      <div data-country-header class="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 transition-all duration-500">
        <div onclick="toggleCountry('${safeNameJs}')" class="flex items-center gap-2.5 text-right flex-1 min-w-0 cursor-pointer">
          <span class="emoji-flag text-2xl shrink-0">${meta.flag}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-sm text-slate-900 dark:text-white">${cName}</span>
              ${hasSeriesInfo ? `<button type="button" onclick="event.stopPropagation(); openSeriesInfoModal('${safeNameJs}')" title="הסבר תקופות וסדרות במדינה זו" aria-label="הסבר תקופות וסדרות" class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900 transition">i</button>` : ""}
              ${meta.former ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">מדינת עבר</span>` : ""}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${summaryText}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          ${isEuVirtual ? "" : `<button type="button" onclick="openItemModal(null, '${safeNameJs}')" title="הוסף פריט ל${safeNameAttr}" class="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center hover:bg-indigo-50 transition">+</button>`}
          <button type="button" onclick="toggleCountry('${safeNameJs}')" class="p-1 text-slate-400">
            <svg class="w-4 h-4 transition-transform ${isCountryCollapsed ? 'rotate-90' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>
  `;

  if (!isCountryCollapsed) {
    block += `<div class="divide-y divide-slate-100 dark:divide-slate-900 px-1">`;
    items.forEach((item, idx) => {
      const isCoin = item.type === "coin";
      const qty = Number(item.quantity) || 1;
      const formattedValue = formatDenomination(item.value);
      const yearHtml = hasValidYear(item.year)
        ? `<span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${item.year}</span>`
        : `<span class="text-[11px] text-slate-400 dark:text-slate-500">ללא שנה</span>`;

      let dividerClass = "";
      if (!isEuVirtual && idx > 0) {
        const prevItem = items[idx - 1];
        if (isCoin && prevItem.type === "coin") {
          if (getItemEraSignature(prevItem, cName) !== getItemEraSignature(item, cName)) {
            dividerClass = "era-divider";
          }
        } else if (!isCoin && prevItem.type === "coin" && hasCoinEraTransition) {
          dividerClass = "type-divider";
        }
      }

      const originFlagHtml = isEuVirtual
        ? `<span class="emoji-flag text-base shrink-0">${getCountryMeta(item.country).flag}</span>`
        : "";

      const originCountryBadgeHtml = isEuVirtual
        ? `<span class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[90px]">${item.country}</span>`
        : "";

      const safeItemId = escapeJsStr(item.id);
      const editBtnHtml = isEuVirtual
        ? `<span aria-hidden="true" class="p-1.5 -ml-1 rounded-lg text-slate-300 dark:text-slate-700 pointer-events-none inline-flex items-center justify-center">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z"/></svg>
          </span>`
        : `<button type="button" onclick="event.stopPropagation(); openItemModal('${safeItemId}')" title="ערוך פריט" aria-label="ערוך פריט" class="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z"/></svg>
          </button>`;

      block += `
        <div onclick="openItemDetailsModal('${safeItemId}')" class="py-2.5 px-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/50 rounded-lg transition ${dividerClass}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-[44px] text-center shrink-0 text-[11px] font-semibold py-0.5 rounded ${isCoin ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}">
              ${isCoin ? 'מטבע' : 'שטר'}
            </span>
            ${originFlagHtml}
            <div class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              <span class="font-bold">${formattedValue}</span> ${item.currency}
              ${qty > 1 ? `<span class="mr-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">×${qty}</span>` : ""}
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${originCountryBadgeHtml}
            ${yearHtml}
            ${editBtnHtml}
          </div>
        </div>
      `;
    });
    block += `</div>`;
  }

  block += `</div>`;
  return block;
}

function renderCollection() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const searchNumericClean = search.replace(/,/g, "");
  document.getElementById("clear-search-btn").classList.toggle("hidden", !search);

  const totalItems = collection.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const uniqueCountries = new Set(collection.map(i => i.country)).size;
  document.getElementById("header-subtitle").textContent =
    `${formatDenomination(totalItems)} פריטים • ${uniqueCountries} מדינות`;

  const filtered = collection.filter(item => {
    if (currentTypeFilter !== "all" && item.type !== currentTypeFilter) return false;
    const meta = getCountryMeta(item.country);
    if (selectedContinentFilter !== "all" && meta.continent !== selectedContinentFilter) return false;
    if (selectedCountryFilter !== "all" && item.country !== selectedCountryFilter) return false;
    if (selectedDecadeFilter !== "all") {
      if (!hasValidYear(item.year)) return false;
      const dec = Math.floor(Number(item.year) / 10) * 10;
      if (String(dec) !== selectedDecadeFilter) return false;
    }
    if (search) {
      const yearStr = hasValidYear(item.year) ? String(item.year) : "ללא שנה";
      const formattedVal = formatDenomination(item.value);
      const locStr = normalizeLocation(item.location);
      const hay = `${item.country} ${item.currency} ${item.value} ${formattedVal} ${yearStr} ${locStr}`.toLowerCase();
      if (!hay.includes(search) && !hay.replace(/,/g, "").includes(searchNumericClean)) return false;
    }
    return true;
  });

  const container = document.getElementById("collection-container");
  const collapseBar = document.getElementById("collapse-controls-bar");

  if (filtered.length === 0) {
    collapseBar.classList.add("hidden");
    container.innerHTML = `
      <div class="text-center py-14 text-slate-400 dark:text-slate-500">
        <p class="text-sm font-medium">לא נמצאו פריטים תואמים</p>
        <p class="text-xs mt-1">נסה לשנות את הסינון או להוסיף פריט חדש</p>
      </div>
    `;
    return;
  }

  collapseBar.classList.remove("hidden");
  updateCollapseToggleButton();

  const euItems = selectedCountryFilter === "all"
    ? filtered.filter(isEuCurrencyItem)
    : [];

  if (currentGroupMode === "alpha") {
    const byCountry = {};
    filtered.forEach(item => {
      if (!byCountry[item.country]) byCountry[item.country] = [];
      byCountry[item.country].push(item);
    });
    const entries = Object.keys(byCountry).map(cName => ({
      name: cName,
      items: byCountry[cName],
      isEuVirtual: false
    }));
    if (euItems.length > 0) {
      entries.push({
        name: EU_VIRTUAL_COUNTRY,
        items: euItems,
        isEuVirtual: true
      });
    }
    entries.sort((a, b) => hebrewCollator.compare(a.name, b.name));
    container.innerHTML = entries
      .map(entry => renderCountryBlockHtml(entry.name, entry.items, entry.isEuVirtual))
      .join("");
    return;
  }

  // Group by Continent -> Country
  const byContinent = {};
  filtered.forEach(item => {
    const meta = getCountryMeta(item.country);
    const cont = meta.continent;
    if (!byContinent[cont]) byContinent[cont] = {};
    if (!byContinent[cont][item.country]) byContinent[cont][item.country] = [];
    byContinent[cont][item.country].push(item);
  });

  const orderedContinents = Object.keys(byContinent).sort((a, b) => {
    const ia = CONTINENT_ORDER.indexOf(a);
    const ib = CONTINENT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  let html = "";
  orderedContinents.forEach(cont => {
    const countriesObj = byContinent[cont];
    const countryNames = Object.keys(countriesObj).sort((a, b) => hebrewCollator.compare(a, b));
    const contTotal = Object.values(countriesObj).flat().reduce((s, x) => s + (Number(x.quantity) || 1), 0);
    const isContCollapsed = !!collapsedContinents[cont];

    html += `
      <section class="mb-6">
        <button type="button" onclick="toggleContinent('${escapeJsStr(cont)}')" class="w-full flex items-center justify-between py-2 px-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 mb-3">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 transition-transform ${isContCollapsed ? 'rotate-90' : ''}" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            <span>${cont}</span>
            <span class="text-[11px] font-normal text-slate-400">(${countryNames.length} מדינות)</span>
          </div>
          <span class="text-[11px] font-medium">${formatDenomination(contTotal)} פריטים</span>
        </button>
    `;

    if (!isContCollapsed) {
      const entries = countryNames.map(cName => ({
        name: cName,
        items: countriesObj[cName],
        isEuVirtual: false
      }));
      if (cont === "אירופה" && euItems.length > 0) {
        entries.push({
          name: EU_VIRTUAL_COUNTRY,
          items: euItems,
          isEuVirtual: true
        });
        entries.sort((a, b) => hebrewCollator.compare(a.name, b.name));
      }
      entries.forEach(entry => {
        html += renderCountryBlockHtml(entry.name, entry.items, entry.isEuVirtual);
      });
    }

    html += `</section>`;
  });

  container.innerHTML = html;
}

function scrollToCountryBlock(countryName) {
  if (!countryName) return;
  const collectionView = document.getElementById("view-collection");
  if (collectionView.classList.contains("hidden")) return;

  setTimeout(() => {
    const blocks = Array.from(document.querySelectorAll("[data-country-block]"));
    const targetBlock = blocks.find(el => el.dataset.countryBlock === countryName);
    if (!targetBlock) return;

    const headerHeight = document.getElementById("app-header")?.offsetHeight || 105;
    const targetTop = targetBlock.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });

    const headerBar = targetBlock.querySelector("[data-country-header]");
    if (headerBar) {
      headerBar.classList.add("ring-2", "ring-indigo-500/70");
      setTimeout(() => {
        headerBar.classList.remove("ring-2", "ring-indigo-500/70");
      }, 1600);
    }
  }, 70);
}

function toggleContinent(cont) {
  collapsedContinents[cont] = !collapsedContinents[cont];
  if (!collapsedContinents[cont]) {
    isAllCollapsed = false;
  }
  renderCollection();
}

function toggleCountry(cName) {
  collapsedCountries[cName] = !collapsedCountries[cName];
  if (!collapsedCountries[cName]) {
    isAllCollapsed = false;
  }
  renderCollection();
}