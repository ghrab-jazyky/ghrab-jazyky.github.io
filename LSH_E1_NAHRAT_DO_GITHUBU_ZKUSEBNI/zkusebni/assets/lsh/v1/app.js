/* Language Skills Hub E1: build-free static UI with two synthetic sample topics. */
(function () {
  'use strict';
  const CONFIG = window.LSH_CONFIG;
  const CORE = window.LSH_CORE;
  const QR = window.CLBQRCode;
  const LANG_NAMES = Object.freeze({en: 'Angli\u010dtina', es: '\u0160pan\u011bl\u0161tina', de: 'N\u011bm\u010dina', fr: 'Francouz\u0161tina'});
  const $ = id => document.getElementById(id);
  const page = document.body.dataset.page;
  let manifestPromise;
  let toastTimer = null;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }
  function append(parent, ...nodes) { nodes.forEach(node => parent.appendChild(node)); return parent; }
  function option(select, value, label) { const o = new Option(label, value); select.add(o); }
  function siteURL(path = '') { return new URL(path, CORE.siteRoot(location.origin, CONFIG.basePath)).href; }
  function announce(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function applyTheme(value) {
    const theme = value === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    const button = $('themeToggle');
    if (button) {
      button.textContent = theme === 'dark' ? '\u2600' : '\u263e';
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      button.title = theme === 'dark' ? 'P\u0159epnout na sv\u011btl\u00fd motiv' : 'P\u0159epnout na tmav\u00fd motiv';
    }
  }
  function initTheme() {
    let theme;
    try { theme = localStorage.getItem('lsh-e1-theme'); } catch (_) { theme = null; }
    applyTheme(theme);
    $('themeToggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('lsh-e1-theme', next); } catch (_) { /* theme still changes */ }
    });
  }
  async function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(siteURL(CONFIG.manifestPath), {cache:'no-store'})
        .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
        .then(data => { CORE.validateManifest(data); return data; });
    }
    return manifestPromise;
  }
  function studentURL(entry, lang, level, locked) {
    return CORE.studentUrl(entry, lang, level, locked, location.origin, CONFIG.basePath);
  }
  function button(text, className, callback) {
    const b = element('button', className, text);
    b.type = 'button';
    b.addEventListener('click', callback);
    return b;
  }
  function getLangs(entry) { return CORE.LANGS.filter(l => entry.variants.some(v => v.lang === l)); }
  function getLevels(entry, lang) { return CORE.LEVELS.filter(l => CORE.hasVariant(entry, lang, l)); }
  function setStatus(el, message, error = false) {
    el.textContent = message;
    el.classList.toggle('error', error);
  }
  async function copyText(value) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(value); return true; } catch (_) { /* fallback */ }
    }
    const temporary = element('textarea');
    temporary.value = value;
    temporary.setAttribute('readonly', '');
    temporary.classList.add('clipboard-helper');
    document.body.appendChild(temporary);
    temporary.select();
    let success = false;
    try { success = document.execCommand('copy'); } catch (_) { success = false; }
    temporary.remove();
    return success;
  }
  function initShare() {
    const dialog = $('shareDialog');
    const lang = $('shareLang'), level = $('shareLevel'), lock = $('shareLock');
    const urlInput = $('shareUrl'), shortOutput = $('shareShortCode'), qrSlot = $('qrSlot');
    const status = $('shareStatus');
    let topic = null;

    function fillLevels(preferred) {
      const choices = getLevels(topic, lang.value);
      level.replaceChildren();
      for (const l of choices) option(level, l, l);
      level.value = choices.includes(preferred) ? preferred : choices[0];
    }
    function refresh() {
      if (!topic) return;
      try {
        const url = studentURL(topic, lang.value, level.value, lock.checked);
        const code = CORE.formatShortCode(topic, lang.value, level.value, lock.checked);
        urlInput.value = url;
        shortOutput.value = code;
        shortOutput.textContent = code;
        $('previewBtn').href = url;
        qrSlot.replaceChildren(QR.svg(url));
        setStatus(status, '');
      } catch (error) {
        urlInput.value = '';
        shortOutput.textContent = '\u2014';
        qrSlot.replaceChildren();
        setStatus(status, 'Sd\u00edlen\u00ed se nepoda\u0159ilo sestavit.', true);
        console.error('E1 share:', error);
      }
    }
    $('shareClose').addEventListener('click', () => dialog.close());
    lang.addEventListener('change', () => { fillLevels(); refresh(); });
    level.addEventListener('change', refresh);
    lock.addEventListener('change', refresh);
    urlInput.addEventListener('focus', () => urlInput.select());
    $('copyLinkBtn').addEventListener('click', async () => {
      if (!urlInput.value) return;
      const ok = await copyText(urlInput.value);
      setStatus(status, ok ? 'Odkaz zkop\u00edrov\u00e1n.' : 'Kop\u00edrov\u00e1n\u00ed selhalo. Vyberte text odkazu ru\u010dn\u011b.', !ok);
      if (ok) announce('Odkaz zkop\u00edrov\u00e1n.');
    });
    $('copyCodeBtn').addEventListener('click', async () => {
      if (!topic) return;
      const value = shortOutput.textContent;
      const ok = await copyText(value);
      setStatus(status, ok ? 'Kr\u00e1tk\u00fd k\u00f3d zkop\u00edrov\u00e1n.' : 'Kop\u00edrov\u00e1n\u00ed k\u00f3du selhalo. Opi\u0161te jej ru\u010dn\u011b.', !ok);
      if (ok) announce('Kr\u00e1tk\u00fd k\u00f3d zkop\u00edrov\u00e1n.');
    });
    $('downloadQRBtn').addEventListener('click', () => {
      const svg = qrSlot.querySelector('svg');
      if (!svg) { setStatus(status, 'QR k\u00f3d nen\u00ed dostupn\u00fd.', true); return; }
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], {type: 'image/svg+xml;charset=utf-8'});
      const blobURL = URL.createObjectURL(blob);
      const anchor = element('a');
      anchor.href = blobURL;
      anchor.download = 'LSH_E1_' + CORE.formatShortCode(topic, lang.value, level.value, lock.checked) + '.svg';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobURL), 1500);
      setStatus(status, 'QR obr\u00e1zek p\u0159ipraven ke sta\u017een\u00ed.');
    });
    return function open(topicEntry) {
      topic = topicEntry;
      $('shareTopicName').textContent = topic.title;
      lang.replaceChildren();
      for (const l of getLangs(topic)) option(lang, l, LANG_NAMES[l]);
      const defaults = CORE.defaultVariant(topic);
      lang.value = defaults.lang;
      fillLevels(defaults.level);
      lock.checked = false;
      refresh();
      dialog.showModal();
      lang.focus();
    };
  }
  function renderTopic(topic, openShare) {
    const article = element('article','topic-card');
    const main = element('div','topic-main');
    const badges = element('div','topic-badges');
    append(badges, element('span','demo-chip','DEMO'), element('span','skill-tag',topic.skill.toUpperCase()));
    const title = element('h3',null,topic.title);
    const summary = element('p',null,topic.summary);
    const chips = element('div','variant-chips');
    for (const v of topic.variants) append(chips, element('span','variant-chip',v.lang.toUpperCase()+' \u00b7 '+v.level));
    append(main,badges,title,summary,chips);
    const actions = element('div','topic-actions');
    const def = CORE.defaultVariant(topic);
    const preview = element('a','button outline','N\u00e1hled karty');
    preview.href = studentURL(topic,def.lang,def.level,false);
    preview.target='_blank'; preview.rel='noopener';
    const share = button('Sd\u00edlet student\u016fm', 'button primary', () => openShare(topic));
    share.setAttribute('aria-label', 'Sd\u00edlet: ' + topic.title);
    append(actions,preview,share);
    append(article,main,actions);
    return article;
  }
  async function initCatalog() {
    const list = $('topicList'), count = $('catalogCount');
    const empty = $('catalogEmpty'), clear = $('clearFilters'), search = $('topicSearch');
    const langFilter = $('langFilter'), levelFilter = $('levelFilter');
    const kind = page;
    try {
      const m = await loadManifest();
      const topics = m.topics.filter(t => t.skill === kind);
      const availableLangs = CORE.LANGS.filter(l => topics.some(t => t.variants.some(v => v.lang === l)));
      const availableLevels = CORE.LEVELS.filter(l => topics.some(t => t.variants.some(v => v.level === l)));
      for (const l of availableLangs) option(langFilter,l,LANG_NAMES[l]);
      for (const l of availableLevels) option(levelFilter,l,l);
      const share = initShare();
      function render() {
        const q = search.value.trim().toLocaleLowerCase('cs');
        const language = langFilter.value, level = levelFilter.value;
        const filtered = topics.filter(t => {
          const matchesText = !q || (t.title+' '+t.summary+' '+t.tags.join(' ')).toLocaleLowerCase('cs').includes(q);
          const matchesVariant = t.variants.some(v => (!language || v.lang === language) && (!level || v.level === level));
          return matchesText && matchesVariant;
        });
        list.replaceChildren(...filtered.map(t => renderTopic(t,share)));
        count.textContent = 'Zobrazeno '+filtered.length+' z '+topics.length+' t\u00e9mat.';
        empty.hidden = filtered.length > 0;
        if (filtered.length === 0) {
          const noTopics = topics.length === 0;
          $('emptyTitle').textContent = noTopics ? 'Katalog teprve p\u0159ipravujeme' : '\u017d\u00e1dn\u00e9 t\u00e9ma neodpov\u00edd\u00e1 filtr\u016fm';
          $('emptyDescription').textContent = noTopics ? 'V E1 zat\u00edm nejsou k dispozici testovac\u00ed poslechov\u00e9 karty.' : 'Zm\u011b\u0148te jazyk, \u00farove\u0148 nebo hledan\u00fd v\u00fdraz.';
          clear.hidden = noTopics;
        }
      }
      $('filterForm').addEventListener('submit',e=>e.preventDefault());
      $('filterForm').addEventListener('reset',()=>setTimeout(render,0));
      clear.addEventListener('click',()=>{$('filterForm').reset();render();});
      search.addEventListener('input',render);
      langFilter.addEventListener('change',render);
      levelFilter.addEventListener('change',render);
      render();
    } catch (error) {
      console.error('E1 catalog:',error);
      count.textContent = 'Katalog se nepoda\u0159ilo na\u010d\u00edst.';
      list.replaceChildren(element('p','form-status error','Otev\u0159ete str\u00e1nku znovu nebo zkontrolujte datov\u00fd manifest.'));
    }
  }
  async function initStudent() {
    const article = $('studentArticle'), errorPanel = $('studentError');
    const langSelect = $('studentLang'), levelSelect = $('studentLevel');
    try {
      const m = await loadManifest();
      const entry = m.topics.find(t => t.cardPath + 'index.html' === document.body.dataset.path);
      if (!entry) throw new Error('Student fixture not present in manifest');
      const initial = CORE.normalizeStudentParams(entry,new URLSearchParams(location.search));
      let current = initial;
      $('studentTitle').textContent = entry.title;
      $('studentDescription').textContent = entry.summary;
      $('studentBack').href = siteURL(entry.skill+'/');
      for (const l of getLangs(entry)) option(langSelect,l,LANG_NAMES[l]);
      function fillLevels(preferred) {
        const choices = getLevels(entry,langSelect.value);
        levelSelect.replaceChildren();
        for (const l of choices) option(levelSelect,l,l);
        levelSelect.value = choices.includes(preferred) ? preferred : choices[0];
      }
      function render(changeHistory) {
        const key = current.lang+':'+current.level;
        const copy = entry.demoContent[key];
        if (!copy) throw new Error('Variant missing from demoContent');
        $('studentDemoHeading').textContent = copy.heading;
        $('studentDemoText').textContent = copy.text;
        article.lang = current.lang;
        const locked = current.locked;
        langSelect.disabled = locked;
        levelSelect.disabled = locked;
        $('studentLockHint').textContent = locked ? '\ud83d\udd12 Jazyk a \u00farove\u0148 jsou uzam\u010deny u\u010ditelem (pouze v rozhran\u00ed).' : 'Jazyk a \u00farove\u0148 lze zm\u011bnit.';
        if (changeHistory) history.replaceState(null,'',studentURL(entry,current.lang,current.level,locked));
      }
      langSelect.value = current.lang;
      fillLevels(current.level);
      render(false);
      langSelect.addEventListener('change', () => {
        if (current.locked) return;
        fillLevels();
        current = {lang:langSelect.value,level:levelSelect.value,locked:false};
        render(true);
      });
      levelSelect.addEventListener('change', () => {
        if (current.locked) return;
        current = {lang:langSelect.value,level:levelSelect.value,locked:false};
        render(true);
      });
      // A tampered query never enters DOM, and invalid parameters are ignored.
      // Explicit valid links are left unchanged to preserve already shared URLs.
    } catch (error) {
      console.error('E1 fixture:',error);
      article.hidden = true;
      errorPanel.hidden = false;
      $('studentErrorText').textContent = 'Testovac\u00ed karta nebyla nalezena nebo je po\u0161kozen manifest.';
    }
  }
  async function initCode() {
    const input = $('codeInput'), status = $('codeError');
    try {
      const manifest = await loadManifest();
      function openCode(raw) {
        const decoded = CORE.resolveShortCode(raw,manifest);
        if (!decoded) { setStatus(status, 'Neplatn\u00fd k\u00f3d nebo nedostupn\u00e1 jazykov\u00e1 varianta.',true); return; }
        const url = studentURL(decoded.entry,decoded.lang,decoded.level,decoded.locked);
        // Replace, rather than add a cross-origin redirect. studentURL is strictly same-origin.
        location.assign(url);
      }
      $('codeForm').addEventListener('submit',event=>{event.preventDefault();openCode(input.value);});
      const params = new URLSearchParams(location.search);
      if (params.has('c')) {
        const value = params.getAll('c').length === 1 ? params.get('c') : '';
        input.value = value.slice(0,12);
        openCode(value);
      }
    } catch (error) {
      console.error('E1 code:',error);
      setStatus(status, 'K\u00f3dy nyn\u00ed nelze ov\u011b\u0159it. Zkuste to znovu p\u0159i p\u0159ipojen\u00ed.',true);
    }
  }
  function run() {
    if (!CONFIG || !CORE || !QR) { console.error('E1: required local modules missing');return; }
    try { CORE.siteRoot(location.origin,CONFIG.basePath); }
    catch (error) { console.error('E1 invalid configuration',error);return; }
    initTheme();
    if (CORE.validBasePath(CONFIG.basePath) && !location.pathname.startsWith(CONFIG.basePath)) {
      console.warn('E1 is not being served under the configured basePath; sharing links use the configured path.');
    }
    if (CORE.SKILLS.includes(page)) initCatalog();
    else if (page==='student') initStudent();
    else if (page==='code') initCode();
  }
  run();
})();
