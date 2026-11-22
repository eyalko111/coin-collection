// Statistics View, Top Countries, Locations Accordion, Decades & Top 15 Oldest Coins (stats.js)

const UNASSIGNED_LOCATION_KEY = "__UNASSIGNED_LOCATION__";

function getSortedCoinsOldestFirst() {
  return collection
    .filter(i => i.type === "coin" && hasValidYear(i.year))
    .sort((a, b) => {
      const yearDiff = Number(a.year) - Number(b.year);
      if (yearDiff !== 0) return yearDiff;
      return hebrewCollator.compare(a.country, b.country);
    });
}

function openOldestCoinsView() {
  const allCoins = getSortedCoinsOldestFirst();
  const top15Coins = allCoins.slice(0, 15);

  document.getElementById("view-stats").classList.add("hidden");
  document.getElementById("view-collection").classList.add("hidden");
  document.getElementById("view-oldest-coins").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const subtitleEl = document.getElementById("oldest-coins-subtitle");
  if (!top15Coins.length) {
    subtitleEl.textContent = "אין מטבעות עם שנת הנפקה באוסף";
  } else if (allCoins.length > 15) {
    subtitleEl.textContent = `מציג 15 מתוך ${formatDenomination(allCoins.length)} רשומות מטבעות עם שנה`;
  } else {
    subtitleEl.textContent = `מציג ${top15Coins.length} מטבעות עם שנת הנפקה`;
  }

  const listEl = document.getElementById("oldest-coins-list");
  if (!top15Coins.length) {
    listEl.innerHTML = `<div class="text-center py-12 text-xs text-slate-400">אין מטבעות עם שנת הנפקה באוסף</div>`;
    return;
  }

  listEl.innerHTML = top15Coins.map((coin, idx) => {
    const meta = getCountryMeta(coin.country);
    return `
      <div class="py-3 px-1.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-5 text-xs font-bold text-slate-400 shrink-0">${idx + 1}.</span>
          <span class="emoji-flag text-xl shrink-0">${meta.flag}</span>
          <div class="min-w-0">
            <div class="text-sm font-bold text-slate-900 dark:text-white truncate">${coin.country}</div>
            <div class="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span class="font-semibold">${formatDenomination(coin.value)}</span> ${coin.currency}
            </div>
          </div>
        </div>
        <div class="shrink-0 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold">
          ${coin.year}
        </div>
      </div>
    `;
  }).join("");
}

function closeOldestCoinsView() {
  document.getElementById("view-oldest-coins").classList.add("hidden");
  document.getElementById("view-stats").classList.remove("hidden");
  renderStats();
}

function toggleStatsCountry(countryName) {
  expandedStatsCountries[countryName] = !expandedStatsCountries[countryName];
  renderStats();
}

function toggleStatsLocation(locKey) {
  expandedStatsLocations[locKey] = !expandedStatsLocations[locKey];
  renderStats();
}

function toggleStatsLocationCountry(locKey, countryName) {
  const compositeKey = `${locKey}|||${countryName}`;
  expandedStatsLocationCountries[compositeKey] = !expandedStatsLocationCountries[compositeKey];
  renderStats();
}

function toggleStatsDecade(decadeStr) {
  expandedStatsDecades[decadeStr] = !expandedStatsDecades[decadeStr];
  renderStats();
}

function renderCountryItemsMiniListHtml(rawItems, countryName, options = {}) {
  const { includeCountry = false } = options;
  const sortedItems = sortCountryItems(rawItems, countryName);
  const coinsCount = sortedItems.filter(x => x.type === "coin").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const notesCount = sortedItems.filter(x => x.type === "banknote").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const summaryText = formatQuantitySummary(coinsCount, notesCount);

  let hasCoinEraTransition = false;
  for (let i = 1; i < sortedItems.length; i++) {
    if (sortedItems[i].type === "coin" && sortedItems[i - 1].type === "coin") {
      if (getItemEraSignature(sortedItems[i - 1], countryName) !== getItemEraSignature(sortedItems[i], countryName)) {
        hasCoinEraTransition = true;
        break;
      }
    }
  }

  return `
    <div class="text-[11px] text-slate-500 dark:text-slate-400 pb-1">${summaryText}</div>
    <div class="divide-y divide-slate-100 dark:divide-slate-900">
      ${sortedItems.map((item, itemIdx) => {
        const isCoin = item.type === "coin";
        const itemCountryName = item.country || countryName;
        const cMeta = includeCountry ? getCountryMeta(itemCountryName) : null;
        const yearHtml = hasValidYear(item.year)
          ? `<span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${item.year}</span>`
          : `<span class="text-[11px] text-slate-400 dark:text-slate-500">ללא שנה</span>`;

        let dividerClass = "";
        if (itemIdx > 0) {
          const prevItem = sortedItems[itemIdx - 1];
          if (isCoin && prevItem.type === "coin") {
            if (getItemEraSignature(prevItem, itemCountryName) !== getItemEraSignature(item, itemCountryName)) {
              dividerClass = "era-divider";
            }
          } else if (!isCoin && prevItem.type === "coin" && hasCoinEraTransition) {
            dividerClass = "type-divider";
          }
        }

        return `
          <div class="py-2 flex items-center justify-between gap-2 ${dividerClass}">
            <div class="flex items-center gap-2 min-w-0">
              ${includeCountry ? `
                <span class="emoji-flag text-base shrink-0">${cMeta.flag}</span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-100 shrink-0">${itemCountryName}</span>
              ` : ""}
              <span class="w-[44px] text-center shrink-0 text-[11px] font-semibold py-0.5 rounded ${isCoin ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}">
                ${isCoin ? 'מטבע' : 'שטר'}
              </span>
              <div class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                <span class="font-bold">${formatDenomination(item.value)}</span> ${item.currency}
              </div>
            </div>
            <div class="shrink-0">
              ${yearHtml}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderStats() {
  const container = document.getElementById("stats-container");
  if (!container) return;

  const totalCoins = collection.filter(i => i.type === "coin").reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const totalNotes = collection.filter(i => i.type === "banknote").reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const totalItems = totalCoins + totalNotes;
  const totalCountries = new Set(collection.map(i => i.country)).size;

  const sortedCoins = getSortedCoinsOldestFirst();
  const oldestCoin = sortedCoins.length ? sortedCoins[0] : null;
  const oldestMeta = oldestCoin ? getCountryMeta(oldestCoin.country) : null;

  // Top Countries Aggregation
  const byCountry = {};
  collection.forEach(i => {
    byCountry[i.country] = (byCountry[i.country] || 0) + (Number(i.quantity) || 1);
  });
  const topCountries = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Locations Aggregation (Named locations + Unassigned row at bottom if any)
  const namedLocationsMap = {};
  const unassignedItems = [];
  collection.forEach(i => {
    const loc = normalizeLocation(i.location);
    if (loc) {
      if (!namedLocationsMap[loc]) namedLocationsMap[loc] = [];
      namedLocationsMap[loc].push(i);
    } else {
      unassignedItems.push(i);
    }
  });

  const sortedNamedLocations = Object.entries(namedLocationsMap)
    .map(([locName, items]) => ({
      key: locName,
      label: locName,
      isUnassigned: false,
      items,
      totalQty: items.reduce((s, x) => s + (Number(x.quantity) || 1), 0)
    }))
    .sort((a, b) => {
      if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
      return hebrewCollator.compare(a.label, b.label);
    });

  const locationEntries = [...sortedNamedLocations];
  if (unassignedItems.length > 0) {
    locationEntries.push({
      key: UNASSIGNED_LOCATION_KEY,
      label: "ללא מיקום מוגדר",
      isUnassigned: true,
      items: unassignedItems,
      totalQty: unassignedItems.reduce((s, x) => s + (Number(x.quantity) || 1), 0)
    });
  }

  const namedLocationsCount = sortedNamedLocations.length;
  const locationsHeaderBadge = namedLocationsCount === 1
    ? "מיקום 1"
    : `${formatDenomination(namedLocationsCount)} מיקומים`;

  // Decades Aggregation
  const byDecade = {};
  collection.forEach(i => {
    if (hasValidYear(i.year)) {
      const d = Math.floor(Number(i.year) / 10) * 10;
      if (!byDecade[d]) byDecade[d] = [];
      byDecade[d].push(i);
    }
  });
  const decadesList = Object.entries(byDecade)
    .map(([dec, items]) => ({
      decade: dec,
      items,
      totalQty: items.reduce((s, x) => s + (Number(x.quantity) || 1), 0)
    }))
    .sort((a, b) => Number(b.decade) - Number(a.decade));

  const oldestCoinCardHtml = oldestCoin ? `
    <button type="button" onclick="openOldestCoinsView()" class="w-full text-right p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="emoji-flag text-3xl shrink-0">${oldestMeta.flag}</span>
        <div class="min-w-0">
          <div class="text-[11px] font-bold text-amber-800 dark:text-amber-300">המטבע הכי ישן באוסף</div>
          <div class="text-sm font-bold text-slate-900 dark:text-white truncate">
            ${oldestCoin.country} • <span class="font-semibold">${formatDenomination(oldestCoin.value)} ${oldestCoin.currency}</span>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">שנת הנפקה: <span class="font-bold">${oldestCoin.year}</span></div>
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-white/80 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-xl border border-amber-200/70 dark:border-amber-800/50">
        <span>ל-15 הישנים</span>
        <span>←</span>
      </div>
    </button>
  ` : `
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
      אין מטבעות עם שנת הנפקה להצגת המטבע הכי ישן.
    </div>
  `;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Top Summary Counters -->
      <div class="grid grid-cols-3 gap-2.5">
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${formatDenomination(totalItems)}</div>
          <div class="text-xs text-slate-500 mt-0.5">סה״כ פריטים</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${formatDenomination(totalCoins)}</div>
          <div class="text-xs text-slate-500 mt-0.5">מטבעות</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatDenomination(totalNotes)}</div>
          <div class="text-xs text-slate-500 mt-0.5">שטרות</div>
        </div>
      </div>

      ${oldestCoinCardHtml}

      <!-- Top 10 Countries -->
      <section class="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50 space-y-3">
        <div class="flex items-center justify-between pb-1.5 border-b border-indigo-200/70 dark:border-indigo-800/50">
          <h3 class="font-extrabold text-[15px] text-indigo-950 dark:text-indigo-200">המדינות המובילות (עד 10)</h3>
          <span class="text-xs text-indigo-700/75 dark:text-indigo-300/75">מתוך ${totalCountries} מדינות</span>
        </div>
        <div class="space-y-2">
          ${topCountries.map(([cName, count], idx) => {
            const meta = getCountryMeta(cName);
            const isExpanded = !!expandedStatsCountries[cName];
            const countLabel = count === 1 ? "פריט 1" : `${formatDenomination(count)} פריטים`;

            let expandedHtml = "";
            if (isExpanded) {
              const countryItems = collection.filter(i => i.country === cName);
              expandedHtml = `
                <div class="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  ${renderCountryItemsMiniListHtml(countryItems, cName)}
                </div>
              `;
            }

            return `
              <div class="rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 overflow-hidden transition">
                <button type="button" onclick="toggleStatsCountry('${escapeJsStr(cName)}')" class="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-right hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-4 text-xs text-slate-400 font-semibold shrink-0">${idx + 1}.</span>
                    <span class="emoji-flag text-lg shrink-0">${meta.flag}</span>
                    <span class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${cName}</span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                      ${countLabel}
                    </span>
                    <svg class="w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>
                ${expandedHtml}
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <!-- Locations in Collection (3-Level Nested Accordion) -->
      <section class="p-4 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-900/50 space-y-3">
        <div class="flex items-center justify-between pb-1.5 border-b border-violet-200/70 dark:border-violet-800/50">
          <h3 class="font-extrabold text-[15px] text-violet-950 dark:text-violet-200">מיקומים באוסף</h3>
          <span class="text-xs text-violet-700/75 dark:text-violet-300/75">${locationsHeaderBadge}</span>
        </div>
        ${locationEntries.length ? `
          <div class="space-y-2">
            ${locationEntries.map((locEntry, idx) => {
              const isLocExpanded = !!expandedStatsLocations[locEntry.key];
              const countLabel = locEntry.totalQty === 1 ? "פריט 1" : `${formatDenomination(locEntry.totalQty)} פריטים`;
              const safeLocKey = escapeJsStr(locEntry.key);

              let locExpandedHtml = "";
              if (isLocExpanded) {
                const byLocCountry = {};
                locEntry.items.forEach(item => {
                  if (!byLocCountry[item.country]) byLocCountry[item.country] = [];
                  byLocCountry[item.country].push(item);
                });

                const sortedLocCountries = Object.entries(byLocCountry)
                  .map(([cName, cItems]) => ({
                    country: cName,
                    items: cItems,
                    qty: cItems.reduce((s, x) => s + (Number(x.quantity) || 1), 0)
                  }))
                  .sort((a, b) => {
                    if (b.qty !== a.qty) return b.qty - a.qty;
                    return hebrewCollator.compare(a.country, b.country);
                  });

                locExpandedHtml = `
                  <div class="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/60 dark:bg-slate-900/40">
                    <div class="text-[11px] text-slate-500 dark:text-slate-400">
                      ${sortedLocCountries.length === 1 ? "מדינה 1 במיקום זה" : `${formatDenomination(sortedLocCountries.length)} מדינות במיקום זה`}
                    </div>
                    <div class="space-y-1.5">
                      ${sortedLocCountries.map(cEntry => {
                        const cMeta = getCountryMeta(cEntry.country);
                        const compositeKey = `${locEntry.key}|||${cEntry.country}`;
                        const isCountryInLocExpanded = !!expandedStatsLocationCountries[compositeKey];
                        const cCountLabel = cEntry.qty === 1 ? "פריט 1" : `${formatDenomination(cEntry.qty)} פריטים`;
                        const safeCountryJs = escapeJsStr(cEntry.country);

                        let itemsInLocHtml = "";
                        if (isCountryInLocExpanded) {
                          itemsInLocHtml = `
                            <div class="px-2.5 pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                              ${renderCountryItemsMiniListHtml(cEntry.items, cEntry.country)}
                            </div>
                          `;
                        }

                        return `
                          <div class="rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 overflow-hidden">
                            <button type="button" onclick="toggleStatsLocationCountry('${safeLocKey}', '${safeCountryJs}')" class="w-full px-2.5 py-2 flex items-center justify-between gap-2 text-right hover:bg-slate-50 dark:hover:bg-slate-900/70 transition">
                              <div class="flex items-center gap-2 min-w-0">
                                <span class="emoji-flag text-base shrink-0">${cMeta.flag}</span>
                                <span class="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">${cEntry.country}</span>
                              </div>
                              <div class="flex items-center gap-1.5 shrink-0">
                                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  ${cCountLabel}
                                </span>
                                <svg class="w-3 h-3 text-slate-400 transition-transform ${isCountryInLocExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                              </div>
                            </button>
                            ${itemsInLocHtml}
                          </div>
                        `;
                      }).join("")}
                    </div>
                  </div>
                `;
              }

              const rankBadgeHtml = locEntry.isUnassigned
                ? `<span class="w-4 text-xs text-slate-400 font-semibold shrink-0">—</span>`
                : `<span class="w-4 text-xs text-slate-400 font-semibold shrink-0">${idx + 1}.</span>`;

              const titleClass = locEntry.isUnassigned
                ? "font-medium text-sm text-slate-500 dark:text-slate-400 truncate"
                : "font-semibold text-sm text-slate-800 dark:text-slate-100 truncate";

              const badgeClass = locEntry.isUnassigned
                ? "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                : "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300";

              return `
                <div class="rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 overflow-hidden transition">
                  <button type="button" onclick="toggleStatsLocation('${safeLocKey}')" class="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-right hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                    <div class="flex items-center gap-2 min-w-0">
                      ${rankBadgeHtml}
                      <span class="${titleClass}">${locEntry.label}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="${badgeClass}">${countLabel}</span>
                      <svg class="w-3.5 h-3.5 text-slate-400 transition-transform ${isLocExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </button>
                  ${locExpandedHtml}
                </div>
              `;
            }).join("")}
          </div>
        ` : `<p class="text-xs text-slate-400">אין פריטים באוסף</p>`}
      </section>

      <!-- Decades Breakdown (Expandable Accordion) -->
      <section class="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-3">
        <div class="flex items-center justify-between pb-1.5 border-b border-emerald-200/70 dark:border-emerald-800/50">
          <h3 class="font-extrabold text-[15px] text-emerald-950 dark:text-emerald-200">התפלגות לפי עשורים</h3>
        </div>
        ${decadesList.length ? `
          <div class="space-y-2">
            ${decadesList.map(decEntry => {
              const isDecExpanded = !!expandedStatsDecades[decEntry.decade];
              const countLabel = decEntry.totalQty === 1 ? "פריט 1" : `${formatDenomination(decEntry.totalQty)} פריטים`;

              let decExpandedHtml = "";
              if (isDecExpanded) {
                const sortedDecItems = [...decEntry.items].sort((a, b) => {
                  const yearDiff = Number(a.year) - Number(b.year);
                  if (yearDiff !== 0) return yearDiff;
                  const countryDiff = hebrewCollator.compare(a.country, b.country);
                  if (countryDiff !== 0) return countryDiff;
                  if (a.type !== b.type) return a.type === "coin" ? -1 : 1;
                  return (Number(b.value) || 0) - (Number(a.value) || 0);
                });

                const coinsCount = sortedDecItems.filter(x => x.type === "coin").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
                const notesCount = sortedDecItems.filter(x => x.type === "banknote").reduce((s, x) => s + (Number(x.quantity) || 1), 0);
                const summaryText = formatQuantitySummary(coinsCount, notesCount);

                decExpandedHtml = `
                  <div class="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 pb-1">${summaryText}</div>
                    <div class="divide-y divide-slate-100 dark:divide-slate-900">
                      ${sortedDecItems.map(item => {
                        const isCoin = item.type === "coin";
                        const cMeta = getCountryMeta(item.country);
                        return `
                          <div class="py-2 flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                              <span class="w-[44px] text-center shrink-0 text-[11px] font-semibold py-0.5 rounded ${isCoin ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}">
                                ${isCoin ? 'מטבע' : 'שטר'}
                              </span>
                              <span class="emoji-flag text-base shrink-0">${cMeta.flag}</span>
                              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 shrink-0">${item.country}</span>
                              <div class="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                <span class="font-bold">${formatDenomination(item.value)}</span> ${item.currency}
                              </div>
                            </div>
                            <div class="shrink-0">
                              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${item.year}</span>
                            </div>
                          </div>
                        `;
                      }).join("")}
                    </div>
                  </div>
                `;
              }

              return `
                <div class="rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 overflow-hidden transition">
                  <button type="button" onclick="toggleStatsDecade('${decEntry.decade}')" class="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-right hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                    <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">שנות ה-${decEntry.decade}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">${countLabel}</span>
                      <svg class="w-3.5 h-3.5 text-slate-400 transition-transform ${isDecExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </button>
                  ${decExpandedHtml}
                </div>
              `;
            }).join("")}
          </div>
        ` : `<p class="text-xs text-slate-400">אין פריטים עם שנת הנפקה</p>`}
      </section>
    </div>
  `;
}