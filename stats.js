// Statistics Screen, Top 15 Oldest Coins, Storage Locations & Decades Breakdown (stats.js)

function renderStats() {
  const container = document.getElementById("stats-container");
  if (!container) return;

  if (!collection.length) {
    container.innerHTML = `
      <div class="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">אין נתונים להצגת סטטיסטיקות</p>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">הוסף מטבעות או שטרות כדי לראות פילוחים.</p>
      </div>
    `;
    return;
  }

  let totalCoins = 0;
  let totalBanknotes = 0;
  const countryStats = {};
  const locationStats = {};
  const decadeStats = {};
  const datedCoins = [];

  collection.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const isCoin = item.type === "coin";
    const isNote = item.type === "banknote";

    if (isCoin) totalCoins += qty;
    if (isNote) totalBanknotes += qty;

    if (!countryStats[item.country]) {
      countryStats[item.country] = {
        country: item.country,
        totalQty: 0,
        coinsQty: 0,
        notesQty: 0,
        recordsCount: 0,
        items: []
      };
    }
    countryStats[item.country].totalQty += qty;
    if (isCoin) countryStats[item.country].coinsQty += qty;
    if (isNote) countryStats[item.country].notesQty += qty;
    countryStats[item.country].recordsCount += 1;
    countryStats[item.country].items.push(item);

    const locKey = normalizeLocation(item.location) || "__NO_LOCATION__";
    if (!locationStats[locKey]) {
      locationStats[locKey] = {
        key: locKey,
        label: normalizeLocation(item.location) || "ללא מיקום מוגדר",
        isUnassigned: locKey === "__NO_LOCATION__",
        totalQty: 0,
        coinsQty: 0,
        notesQty: 0,
        countries: {}
      };
    }
    locationStats[locKey].totalQty += qty;
    if (isCoin) locationStats[locKey].coinsQty += qty;
    if (isNote) locationStats[locKey].notesQty += qty;

    if (!locationStats[locKey].countries[item.country]) {
      locationStats[locKey].countries[item.country] = {
        country: item.country,
        totalQty: 0,
        coinsQty: 0,
        notesQty: 0,
        items: []
      };
    }
    locationStats[locKey].countries[item.country].totalQty += qty;
    if (isCoin) locationStats[locKey].countries[item.country].coinsQty += qty;
    if (isNote) locationStats[locKey].countries[item.country].notesQty += qty;
    locationStats[locKey].countries[item.country].items.push(item);

    const decadeKey = hasValidYear(item.year)
      ? `${Math.floor(Number(item.year) / 10) * 10}s`
      : "__NO_YEAR__";

    if (!decadeStats[decadeKey]) {
      decadeStats[decadeKey] = {
        key: decadeKey,
        label: decadeKey === "__NO_YEAR__" ? "ללא שנה" : decadeKey,
        isNoYear: decadeKey === "__NO_YEAR__",
        sortDecade: decadeKey === "__NO_YEAR__" ? Infinity : Math.floor(Number(item.year) / 10) * 10,
        totalQty: 0,
        coinsQty: 0,
        notesQty: 0,
        items: []
      };
    }
    decadeStats[decadeKey].totalQty += qty;
    if (isCoin) decadeStats[decadeKey].coinsQty += qty;
    if (isNote) decadeStats[decadeKey].notesQty += qty;
    decadeStats[decadeKey].items.push(item);

    if (isCoin && hasValidYear(item.year)) {
      datedCoins.push(item);
    }
  });

  const totalItems = totalCoins + totalBanknotes;
  const sortedCountries = Object.values(countryStats).sort((a, b) => {
    if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
    return hebrewCollator.compare(a.country, b.country);
  });

  const topCountries = sortedCountries.slice(0, 10);
  const maxCountryQty = topCountries.length ? topCountries[0].totalQty : 1;

  datedCoins.sort((a, b) => {
    const yearDiff = Number(a.year) - Number(b.year);
    if (yearDiff !== 0) return yearDiff;
    return hebrewCollator.compare(a.country, b.country);
  });

  const oldestCoin = datedCoins.length ? datedCoins[0] : null;
  const oldestYear = oldestCoin ? Number(oldestCoin.year) : null;
  const oldestCoinsAtMinYear = oldestCoin
    ? datedCoins.filter(c => Number(c.year) === oldestYear)
    : [];

  const oldestCoinCardHtml = oldestCoin
    ? `
      <div onclick="openOldestCoinsView()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') openOldestCoinsView()" class="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-amber-800 dark:text-amber-300">המטבע הכי ישן באוסף</span>
          <span class="text-[11px] font-semibold text-amber-700 dark:text-amber-400">לרשימת 15 הישנים ←</span>
        </div>
        <div class="mt-1.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="emoji-flag text-xl shrink-0">${getCountryMeta(oldestCoin.country).flag}</span>
            <span class="text-sm font-bold text-slate-900 dark:text-white truncate">
              ${formatDenomination(oldestCoin.value)} ${oldestCoin.currency} — ${oldestCoin.country}
            </span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-extrabold shrink-0">
            ${oldestYear}
          </span>
        </div>
        ${oldestCoinsAtMinYear.length > 1 ? `
          <p class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            קיימים ${oldestCoinsAtMinYear.length} מטבעות משנת ${oldestYear}
          </p>
        ` : ""}
      </div>
    `
    : `
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">המטבע הכי ישן באוסף</span>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">אין מטבעות עם שנת הנפקה</p>
      </div>
    `;

  const topCountriesHtml = topCountries.map((c, idx) => {
    const meta = getCountryMeta(c.country);
    const pct = Math.max(8, Math.round((c.totalQty / maxCountryQty) * 100));
    const isExpanded = !!expandedStatsCountries[c.country];
    const sortedItems = sortCountryItems(c.items, c.country);

    const breakdownHtml = isExpanded ? `
      <div class="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
        ${sortedItems.map(item => {
          const typeBadge = item.type === "coin" ? "מטבע" : "שטר";
          const qty = Number(item.quantity) || 1;
          const loc = normalizeLocation(item.location);
          return `
            <div onclick="event.stopPropagation(); openItemModal('${escapeJsStr(item.id)}')" class="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">${typeBadge}</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200 truncate">${formatDenomination(item.value)} ${item.currency}</span>
                <span class="text-slate-400 text-[11px] shrink-0">(${formatYearText(item.year)})</span>
                ${loc ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 truncate max-w-[95px]">📍 ${loc}</span>` : ""}
              </div>
              <span class="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">×${formatDenomination(qty)}</span>
            </div>
          `;
        }).join("")}
      </div>
    ` : "";

    return `
      <div onclick="toggleStatsCountry('${escapeJsStr(c.country)}')" class="py-1.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/40 rounded-lg px-1 transition">
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-4 text-slate-400 font-bold shrink-0">${idx + 1}.</span>
            <span class="emoji-flag text-base shrink-0">${meta.flag}</span>
            <span class="font-semibold text-slate-800 dark:text-slate-100 truncate">${c.country}</span>
            <span class="text-[11px] text-slate-400 shrink-0">${isExpanded ? "▾" : "▸"}</span>
          </div>
          <span class="font-bold text-slate-700 dark:text-slate-200 shrink-0">${formatDenomination(c.totalQty)} פריטים</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
          <div class="h-full rounded-full bg-indigo-500 transition-all duration-300" style="width: ${pct}%"></div>
        </div>
        ${breakdownHtml}
      </div>
    `;
  }).join("");

  const sortedLocations = Object.values(locationStats).sort((a, b) => {
    if (a.isUnassigned && !b.isUnassigned) return 1;
    if (!a.isUnassigned && b.isUnassigned) return -1;
    if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
    return hebrewCollator.compare(a.label, b.label);
  });

  const locationsHtml = sortedLocations.map(loc => {
    const isExpanded = !!expandedStatsLocations[loc.key];
    const countriesList = Object.values(loc.countries).sort((a, b) => {
      if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
      return hebrewCollator.compare(a.country, b.country);
    });

    const countriesAccordionHtml = isExpanded ? `
      <div class="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
        ${countriesList.map(cObj => {
          const cMeta = getCountryMeta(cObj.country);
          const cKey = `${loc.key}__${cObj.country}`;
          const isCountryExpanded = !!expandedStatsLocationCountries[cKey];
          const sortedCountryItems = sortCountryItems(cObj.items, cObj.country);

          const itemsHtml = isCountryExpanded ? `
            <div class="mt-1.5 mr-4 space-y-1 border-r-2 border-slate-200 dark:border-slate-700 pr-2">
              ${sortedCountryItems.map(item => {
                const typeBadge = item.type === "coin" ? "מטבע" : "שטר";
                const qty = Number(item.quantity) || 1;
                return `
                  <div onclick="event.stopPropagation(); openItemModal('${escapeJsStr(item.id)}')" class="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">${typeBadge}</span>
                      <span class="font-medium text-slate-800 dark:text-slate-200 truncate">${formatDenomination(item.value)} ${item.currency}</span>
                      <span class="text-slate-400 text-[11px] shrink-0">(${formatYearText(item.year)})</span>
                    </div>
                    <span class="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">×${formatDenomination(qty)}</span>
                  </div>
                `;
              }).join("")}
            </div>
          ` : "";

          return `
            <div class="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 p-2">
              <div onclick="event.stopPropagation(); toggleStatsLocationCountry('${escapeJsStr(loc.key)}', '${escapeJsStr(cObj.country)}')" class="flex items-center justify-between gap-2 cursor-pointer text-xs">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-[11px] text-slate-400 shrink-0">${isCountryExpanded ? "▾" : "▸"}</span>
                  <span class="emoji-flag text-sm shrink-0">${cMeta.flag}</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-100 truncate">${cObj.country}</span>
                </div>
                <span class="font-semibold text-slate-600 dark:text-slate-300 shrink-0">${formatDenomination(cObj.totalQty)} פריטים</span>
              </div>
              ${itemsHtml}
            </div>
          `;
        }).join("")}
      </div>
    ` : "";

    return `
      <div onclick="toggleStatsLocation('${escapeJsStr(loc.key)}')" class="py-1.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/40 rounded-lg px-1 transition">
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-[11px] text-slate-400 shrink-0">${isExpanded ? "▾" : "▸"}</span>
            <span class="${loc.isUnassigned ? "text-slate-400 dark:text-slate-500 font-medium" : "font-bold text-slate-800 dark:text-slate-100"} truncate">
              ${loc.isUnassigned ? loc.label : `📍 ${loc.label}`}
            </span>
          </div>
          <span class="font-bold text-slate-700 dark:text-slate-200 shrink-0">${formatDenomination(loc.totalQty)} פריטים</span>
        </div>
        ${countriesAccordionHtml}
      </div>
    `;
  }).join("");

  const sortedDecades = Object.values(decadeStats).sort((a, b) => {
    if (a.isNoYear && !b.isNoYear) return 1;
    if (!a.isNoYear && b.isNoYear) return -1;
    return a.sortDecade - b.sortDecade;
  });

  const maxDecadeQty = sortedDecades.reduce((max, d) => Math.max(max, d.totalQty), 1);

  const decadesHtml = sortedDecades.map(d => {
    const pct = Math.max(6, Math.round((d.totalQty / maxDecadeQty) * 100));
    const isExpanded = !!expandedStatsDecades[d.key];
    const sortedDecadeItems = [...d.items].sort((a, b) => {
      const cCmp = hebrewCollator.compare(a.country, b.country);
      if (cCmp !== 0) return cCmp;
      if (a.type !== b.type) return a.type === "coin" ? -1 : 1;
      return (Number(b.value) || 0) - (Number(a.value) || 0);
    });

    const decadeItemsHtml = isExpanded ? `
      <div class="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
        ${sortedDecadeItems.map(item => {
          const meta = getCountryMeta(item.country);
          const typeBadge = item.type === "coin" ? "מטבע" : "שטר";
          const qty = Number(item.quantity) || 1;
          return `
            <div onclick="event.stopPropagation(); openItemModal('${escapeJsStr(item.id)}')" class="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="emoji-flag text-sm shrink-0">${meta.flag}</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200 truncate">${item.country}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">${typeBadge}</span>
                <span class="text-slate-700 dark:text-slate-300 truncate">${formatDenomination(item.value)} ${item.currency}</span>
                <span class="text-slate-400 text-[11px] shrink-0">(${formatYearText(item.year)})</span>
              </div>
              <span class="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">×${formatDenomination(qty)}</span>
            </div>
          `;
        }).join("")}
      </div>
    ` : "";

    return `
      <div onclick="toggleStatsDecade('${escapeJsStr(d.key)}')" class="py-1.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/40 rounded-lg px-1 transition">
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-bold ${d.isNoYear ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}">${d.label}</span>
            <span class="text-[11px] text-slate-400">${isExpanded ? "▾" : "▸"}</span>
          </div>
          <span class="font-semibold text-slate-600 dark:text-slate-300 shrink-0">${formatDenomination(d.totalQty)} פריטים</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all duration-300" style="width: ${pct}%"></div>
        </div>
        ${decadeItemsHtml}
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-2.5">
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 text-center">
            <div class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">${formatDenomination(totalItems)}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">סה״כ פריטים</div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 text-center">
            <div class="text-xl font-extrabold text-amber-600 dark:text-amber-400">${formatDenomination(totalCoins)}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">מטבעות</div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 text-center">
            <div class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">${formatDenomination(totalBanknotes)}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">שטרות</div>
          </div>
        </div>

        ${oldestCoinCardHtml}
      </div>

      <section class="p-3.5 rounded-2xl bg-indigo-50/35 dark:bg-indigo-950/15 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
        <h3 class="text-[15px] font-extrabold text-indigo-950 dark:text-indigo-200 pb-1.5 border-b border-indigo-200/70 dark:border-indigo-800/50">המדינות המובילות</h3>
        <div class="space-y-1.5">${topCountriesHtml}</div>
      </section>

      <section class="p-3.5 rounded-2xl bg-violet-50/35 dark:bg-violet-950/15 border border-violet-200/60 dark:border-violet-900/40 space-y-2">
        <h3 class="text-[15px] font-extrabold text-violet-950 dark:text-violet-200 pb-1.5 border-b border-violet-200/70 dark:border-violet-800/50">מיקומים באוסף</h3>
        <div class="space-y-1.5">${locationsHtml}</div>
      </section>

      <section class="p-3.5 rounded-2xl bg-emerald-50/35 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
        <h3 class="text-[15px] font-extrabold text-emerald-950 dark:text-emerald-200 pb-1.5 border-b border-emerald-200/70 dark:border-emerald-800/50">התפלגות לפי עשורים</h3>
        <div class="space-y-1.5">${decadesHtml}</div>
      </section>
    </div>
  `;
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
  const cKey = `${locKey}__${countryName}`;
  expandedStatsLocationCountries[cKey] = !expandedStatsLocationCountries[cKey];
  renderStats();
}

function toggleStatsDecade(decadeKey) {
  expandedStatsDecades[decadeKey] = !expandedStatsDecades[decadeKey];
  renderStats();
}

function openOldestCoinsView() {
  const datedCoins = collection
    .filter(item => item.type === "coin" && hasValidYear(item.year))
    .sort((a, b) => {
      const yearDiff = Number(a.year) - Number(b.year);
      if (yearDiff !== 0) return yearDiff;
      return hebrewCollator.compare(a.country, b.country);
    });

  const top15 = datedCoins.slice(0, 15);
  const subtitleEl = document.getElementById("oldest-coins-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = datedCoins.length
      ? `מוצגים ${top15.length} מתוך ${datedCoins.length} מטבעות מתוארכים`
      : "אין מטבעות מתוארכים באוסף";
  }

  const listEl = document.getElementById("oldest-coins-list");
  if (listEl) {
    if (!top15.length) {
      listEl.innerHTML = `
        <div class="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
          אין מטבעות עם שנת הנפקה להצגה
        </div>
      `;
    } else {
      listEl.innerHTML = top15.map((item, idx) => {
        const meta = getCountryMeta(item.country);
        const qty = Number(item.quantity) || 1;
        const loc = normalizeLocation(item.location);
        return `
          <div onclick="openItemModal('${escapeJsStr(item.id)}')" class="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-5 text-xs font-bold text-slate-400 shrink-0">${idx + 1}.</span>
              <span class="emoji-flag text-xl shrink-0">${meta.flag}</span>
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 dark:text-white truncate">
                  ${formatDenomination(item.value)} ${item.currency} — ${item.country}
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>שנה: <strong class="text-amber-700 dark:text-amber-300">${Number(item.year)}</strong></span>
                  ${qty > 1 ? `<span>• כמות: ${formatDenomination(qty)}</span>` : ""}
                  ${loc ? `<span>• 📍 ${loc}</span>` : ""}
                </div>
              </div>
            </div>
            <span class="text-slate-400 text-xs shrink-0">עריכה ←</span>
          </div>
        `;
      }).join("");
    }
  }

  document.getElementById("view-collection").classList.add("hidden");
  document.getElementById("view-stats").classList.add("hidden");
  document.getElementById("view-oldest-coins").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeOldestCoinsView() {
  document.getElementById("view-oldest-coins").classList.add("hidden");
  if (currentTab === "stats") {
    document.getElementById("view-stats").classList.remove("hidden");
    renderStats();
  } else {
    document.getElementById("view-collection").classList.remove("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}