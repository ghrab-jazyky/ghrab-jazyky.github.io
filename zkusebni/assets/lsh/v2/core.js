/* LSH E1: pure manifest, URL, and short-code functions. No persistence, no network. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LSH_CORE = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const LANGS = Object.freeze(['en', 'es', 'de', 'fr']);
  const LEVELS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  const SKILLS = Object.freeze(['konverzace', 'cteni', 'poslech']);
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const SHORT_RE = new RegExp('^([' + ALPHABET + ']{4})(?:-(EN|ES|DE|FR)(A1|A2|B1|B2|C1|C2)(Z)?)?$');
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function assert(test, message) { if (!test) throw new Error(message); }
  function validBasePath(basePath) {
    return typeof basePath === 'string' && /^\/(?:[a-z0-9-]+\/)*$/.test(basePath);
  }
  function siteRoot(origin, basePath) {
    assert(validBasePath(basePath), 'Invalid basePath');
    const url = new URL(origin);
    assert((url.protocol === 'https:' || url.protocol === 'http:') && !!url.host && !url.username && !url.password, 'Invalid origin');
    return new URL(basePath, url.origin);
  }
  function safeCardPath(entry) {
    assert(entry && SKILLS.includes(entry.skill), 'Invalid skill');
    assert(typeof entry.cardPath === 'string' && new RegExp('^' + entry.skill + '/[a-z0-9-]+/$').test(entry.cardPath), 'Invalid cardPath');
    assert(entry.cardPath === entry.skill + '/' + entry.slug + '/', 'cardPath does not match slug');
    return entry.cardPath;
  }
  function hasVariant(entry, lang, level) {
    return !!entry && Array.isArray(entry.variants) && entry.variants.some(v => v.lang === lang && v.level === level);
  }
  function defaultVariant(entry) {
    const en = entry.variants.find(v => v.lang === 'en' && v.level === entry.defaultLevel);
    return en || entry.variants[0];
  }
  function studentUrl(entry, lang, level, locked, origin, basePath) {
    assert(LANGS.includes(lang) && LEVELS.includes(level) && hasVariant(entry, lang, level), 'Unsupported variant');
    const target = new URL(safeCardPath(entry), siteRoot(origin, basePath));
    target.searchParams.set('lang', lang);
    target.searchParams.set('level', level);
    if (locked) target.searchParams.set('zamek', '1');
    return target.href;
  }
  function normalizeStudentParams(entry, searchParams) {
    const def = defaultVariant(entry);
    const candidateLang = searchParams.getAll('lang').length === 1 ? searchParams.get('lang') : null;
    const candidateLevel = searchParams.getAll('level').length === 1 ? searchParams.get('level') : null;
    const lang = LANGS.includes(candidateLang) ? candidateLang : def.lang;
    const level = LEVELS.includes(candidateLevel) ? candidateLevel : def.level;
    const variant = hasVariant(entry, lang, level) ? {lang, level} :
      (entry.variants.find(v => v.lang === lang) || def);
    const locked = searchParams.getAll('zamek').length === 1 && searchParams.get('zamek') === '1';
    return {lang: variant.lang, level: variant.level, locked};
  }
  function formatShortCode(entry, lang, level, locked) {
    assert(SHORT_RE.test(entry.shortCode), 'Invalid topic short code');
    assert(hasVariant(entry, lang, level), 'Unsupported variant');
    return entry.shortCode + '-' + lang.toUpperCase() + level + (locked ? 'Z' : '');
  }
  function resolveShortCode(raw, manifest) {
    if (typeof raw !== 'string' || raw.length > 12) return null;
    const normalized = raw.trim().toUpperCase();
    const match = SHORT_RE.exec(normalized);
    if (!match) return null;
    const entry = manifest.topics.find(t => t.shortCode === match[1]);
    if (!entry || !isEntryShareable(entry, manifest)) return null;
    const def = defaultVariant(entry);
    const lang = match[2] ? match[2].toLowerCase() : def.lang;
    const level = match[3] || def.level;
    if (!hasVariant(entry, lang, level)) return null;
    return {entry, lang, level, locked: !!match[4], normalized};
  }
  // A public GitHub Pages catalog cannot keep drafts confidential. As a defense in depth,
  // the unified teacher selector lists Reading/Listening only after explicit publication.
  // The legacy Conversation set remains visible as a clearly labelled technical pilot.
  function isUnifiedSelectable(t) {
    if (!t || !SKILLS.includes(t.skill) || t.demo === true || t.status === 'STAZENO') return false;
    if (t.skill === 'konverzace') return true;
    return t.status === 'PUBLIKOVANO' && typeof t.publishedAt === 'string' &&
      t.publishedAt.length >= 10 && !Number.isNaN(Date.parse(t.publishedAt));
  }
  function validateManifest(m) {
    assert(m && typeof m === 'object' && !Array.isArray(m), 'Manifest must be an object');
    assert(m.schemaVersion === 1, 'Unsupported schema version');
    assert(['staging', 'production'].includes(m.environment), 'Invalid environment');
    assert(typeof m.demoOnly === 'boolean', 'Invalid demoOnly');
    assert(typeof m.manifestVersion === 'string' && m.manifestVersion.length > 0, 'Missing manifest version');
    assert(typeof m.releaseStatus === 'string' && m.releaseStatus.length > 0, 'Missing release status');
    assert(Array.isArray(m.topics) && m.topics.length <= 400, 'Invalid topics array');
    if (m.environment === 'production') assert(m.demoOnly === false, 'Demo-only manifest cannot be published');
    const ids = new Set(), codes = new Set(), slugs = new Set();
    const statuses = ['ROZPRACOVANO', 'ZKONTROLOVANO', 'PUBLIKOVANO', 'STAZENO'];
    const isDate = value => typeof value === 'string' && value.length >= 10 && !Number.isNaN(Date.parse(value));
    const isDuration = value => Number.isInteger(value) ? value > 0 && value <= 180 :
      value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).length > 0 && Object.keys(value).every(level =>
        LEVELS.includes(level) && Number.isInteger(value[level]) && value[level] > 0 && value[level] <= 180);
    for (const t of m.topics) {
      assert(t && typeof t === 'object' && !Array.isArray(t), 'Invalid topic');
      assert(typeof t.id === 'string' && SLUG_RE.test(t.id), 'Invalid topic ID');
      assert(SKILLS.includes(t.skill) && typeof t.slug === 'string' && SLUG_RE.test(t.slug), 'Invalid skill/slug');
      assert(typeof t.shortCode === 'string' && t.shortCode.length === 4 &&
        [...t.shortCode].every(c => ALPHABET.includes(c)), 'Invalid shortCode');
      assert(!ids.has(t.id), 'Duplicate topic ID'); ids.add(t.id);
      assert(!codes.has(t.shortCode), 'Duplicate shortCode'); codes.add(t.shortCode);
      const scopedSlug = t.skill + '/' + t.slug;
      assert(!slugs.has(scopedSlug), 'Duplicate skill/slug'); slugs.add(scopedSlug);
      safeCardPath(t);
      assert(typeof t.title === 'string' && t.title.trim().length > 0 && t.title.length <= 160, 'Invalid topic title');
      assert(typeof t.summary === 'string' && t.summary.trim().length > 0 && t.summary.length <= 500, 'Invalid summary');
      assert(Array.isArray(t.tags) && t.tags.every(tag => typeof tag === 'string' && tag.length <= 100), 'Invalid tags');
      assert(typeof t.version === 'string' && t.version.length > 0, 'Invalid version');
      assert(statuses.includes(t.status), 'Invalid topic status');
      assert(t.publishedAt === null || isDate(t.publishedAt), 'Invalid publishedAt');
      assert(isDuration(t.durationMinutes), 'Invalid durationMinutes');
      assert(LEVELS.includes(t.defaultLevel), 'Invalid defaultLevel');
      assert(Array.isArray(t.variants) && t.variants.length > 0 && t.variants.length <= 24, 'Invalid variants');
      const variants = new Set();
      for (const v of t.variants) {
        assert(v && LANGS.includes(v.lang) && LEVELS.includes(v.level), 'Invalid variant');
        const key = v.lang + ':' + v.level;
        assert(!variants.has(key), 'Duplicate variant'); variants.add(key);
      }
      assert(t.variants.some(v => v.lang === 'en' && v.level === t.defaultLevel), 'Missing English default');
      assert(typeof t.hasTeacherKey === 'boolean', 'Invalid hasTeacherKey');
      // GitHub Pages is public: never expose even a pointer to a restricted teacher key.
      // Teacher-only materials are kept in a separate private GitHub repository.
      assert(t.hasTeacherKey === false && t.teacherKeyUrl === null,
        'Public manifest must never contain teacher keys or private URLs');
      if ('contentNote' in t)
        assert(t.contentNote === null || (typeof t.contentNote === 'string' && t.contentNote.length <= 1000), 'Invalid contentNote');
      if ('media' in t)
        assert(t.media === null || (t.media && typeof t.media === 'object' && !Array.isArray(t.media)), 'Invalid media');
      if (t.demo === true) {
        assert(m.environment === 'staging', 'Demo cards are staging only');
        assert(t.demoContent && typeof t.demoContent === 'object' && !Array.isArray(t.demoContent), 'Missing demoContent');
        assert(Object.keys(t.demoContent).length === variants.size, 'Incomplete demo variants');
        for (const key of variants) {
          const item = t.demoContent[key];
          assert(item && typeof item.heading === 'string' && typeof item.text === 'string', 'Missing demo content');
        }
      } else {
        assert(m.demoOnly === false, 'Real card in demoOnly manifest');
        assert(!('demoContent' in t), 'Demo content on real card');
        if (t.skill === 'konverzace') {
          assert(t.variants.length === 24, 'Conversation card must have 24 variants');
          assert(typeof t.category === 'string' && SLUG_RE.test(t.category), 'Invalid Conversation category');
        }
      }
      if (m.environment === 'production') {
        assert(t.demo !== true, 'Demo content in production');
        assert(['PUBLIKOVANO', 'STAZENO'].includes(t.status), 'Unapproved production topic');
        assert(isDate(t.publishedAt), 'Production topic lacks publishedAt');
      }
    }
    return true;
  }
  return Object.freeze({LANGS, LEVELS, SKILLS, ALPHABET, validBasePath, siteRoot, safeCardPath, hasVariant, defaultVariant, studentUrl, normalizeStudentParams, formatShortCode, resolveShortCode, isUnifiedSelectable, validateManifest});
});
