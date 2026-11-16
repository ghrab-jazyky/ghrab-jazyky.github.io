/* Language Skills Hub – teacher-facing release notes UI (Stage C).
 * Presentation only: no fetching, localStorage, navigation or startup hooks.
 * Untrusted content is always assigned through textContent.
 */
(function (global) {
  'use strict';
  const AREA = Object.freeze({
    hub: 'Celá aplikace',
    conversation: 'Conversation Lab',
    reading: 'Reading Lab',
    listening: 'Listening Lab'
  });
  const CATEGORY = Object.freeze({
    functionality: 'Funkčnost',
    content: 'Nový obsah',
    language: 'Jazyková správnost',
    methodology: 'Metodika',
    interface: 'Ovládání a vzhled',
    testing: 'Testování'
  });
  const dateFormatter = new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
  const el = (name, className, value) => {
    const item = document.createElement(name);
    if (className) item.className = className;
    if (value !== undefined) item.textContent = String(value);
    return item;
  };
  function displayDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Datum neuvedeno';
    const dt = new Date(value + 'T00:00:00Z');
    return Number.isFinite(dt.getTime()) && dt.toISOString().slice(0, 10) === value
      ? dateFormatter.format(dt) : 'Datum neuvedeno';
  }
  function countWord(n, one, few, many) {
    return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
  }
  function renderCatalog(dialog, data) {
    if (!dialog || typeof dialog.querySelector !== 'function') throw new TypeError('Missing catalog element');
    const list = dialog.querySelector('[data-wn-release-list]');
    const summary = dialog.querySelector('[data-wn-count]');
    if (!list || !summary) throw new Error('Catalog UI is incomplete');
    list.replaceChildren();
    const releases = Array.isArray(data && data.releases)
      ? data.releases.filter(r => r && typeof r === 'object' && Array.isArray(r.changes)) : [];
    const sorted = [...releases].sort((a, b) => Number(b.sequence || 0) - Number(a.sequence || 0));
    const changeTotal = sorted.reduce((n, r) => n + r.changes.length, 0);
    summary.textContent = `${sorted.length} ${countWord(sorted.length, 'vydání', 'vydání', 'vydání')} · ` +
      `${changeTotal} ${countWord(changeTotal, 'změna', 'změny', 'změn')}`;
    if (sorted.length === 0) {
      const empty = el('div', 'wn-empty');
      empty.append(el('strong', 'wn-empty-title', 'Zatím žádné zveřejněné novinky'));
      empty.append(el('p', 'wn-empty-text', 'Přehled doplním, až budou připravené a schválené důležité změny. Mezitím můžeš normálně pokračovat do laboratoří.'));
      list.append(empty);
      return {releases: 0, changes: 0};
    }
    for (const release of sorted) {
      const article = el('article', 'wn-release');
      const seq = Number.isSafeInteger(release.sequence) && release.sequence > 0 ? release.sequence : '?';
      article.setAttribute('data-wn-sequence', String(seq));
      const meta = el('div', 'wn-release-meta');
      meta.append(el('span', 'wn-release-tag', `Vydání ${seq}`));
      const date = el('time', 'wn-release-date', displayDate(release.publishedAt));
      if (typeof release.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(release.publishedAt)) {
        date.setAttribute('datetime', release.publishedAt);
      }
      meta.append(date);
      article.append(meta);
      article.append(el('h3', 'wn-release-title', release.title || 'Bez názvu'));
      const changes = el('ul', 'wn-change-list');
      for (const item of release.changes) {
        if (!item || typeof item !== 'object') continue;
        const li = el('li', 'wn-change');
        const badges = el('div', 'wn-change-badges');
        const area = Object.hasOwn(AREA, item.area) ? item.area : 'hub';
        badges.append(el('span', 'wn-area', AREA[area]));
        const category = el('span', 'wn-category', Object.hasOwn(CATEGORY, item.category) ? CATEGORY[item.category] : 'Změna');
        badges.append(category);
        li.append(badges);
        li.append(el('h4', 'wn-change-title', item.title || 'Změna'));
        li.append(el('p', 'wn-change-description', item.description || ''));
        if (item.teacherBenefit) {
          const benefit = el('p', 'wn-benefit');
          benefit.append(el('strong', null, 'Přínos pro výuku: '));
          benefit.append(document.createTextNode(String(item.teacherBenefit)));
          li.append(benefit);
        }
        changes.append(li);
      }
      article.append(changes);
      list.append(article);
    }
    return {releases: sorted.length, changes: changeTotal};
  }
  global.LSHWhatsNewView = Object.freeze({renderCatalog, displayDate});
})(window);
