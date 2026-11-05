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
    if (!entry) return null;
    const def = defaultVariant(entry);
    const lang = match[2] ? match[2].toLowerCase() : def.lang;
    const level = match[3] || def.level;
    if (!hasVariant(entry, lang, level)) return null;
    return {entry, lang, level, locked: !!match[4], normalized};
  }
  function validateManifest(m) {
    assert(m && typeof m === 'object' && !Array.isArray(m), 'Manifest must be object');
    assert(m.schemaVersion === 1, 'Unsupported schema version');
    assert(m.environment === 'staging', 'E2 requires staging manifest');
    assert(m.demoOnly === false, 'E2 expects explicit real preview items');
    assert(typeof m.manifestVersion === 'string' && m.manifestVersion.length > 0, 'Missing manifest version');
    assert(m.releaseStatus === 'E2_CANDIDATE_NOT_APPROVED_FOR_PUBLICATION', 'Invalid candidate status');
    assert(Array.isArray(m.topics) && m.topics.length >= 19 && m.topics.length <= 80, 'Invalid topic count');
    const ids = new Set(), codes = new Set(), slugs = new Set();
    let realConversationCount = 0;
    for (const t of m.topics) {
      assert(t && typeof t === 'object', 'Bad topic');
      assert(typeof t.id === 'string' && SLUG_RE.test(t.id), 'Bad ID');
      assert(SKILLS.includes(t.skill) && SLUG_RE.test(t.slug), 'Bad topic skill or slug');
      assert(typeof t.shortCode === 'string' && t.shortCode.length === 4 && [...t.shortCode].every(c => ALPHABET.includes(c)), 'Bad short code');
      assert(!ids.has(t.id), 'Duplicate ID'); ids.add(t.id);
      assert(!codes.has(t.shortCode), 'Duplicate short code'); codes.add(t.shortCode);
      assert(!slugs.has(t.skill + '/' + t.slug), 'Duplicate skill/slug'); slugs.add(t.skill + '/' + t.slug);
      safeCardPath(t);
      assert(typeof t.title === 'string' && t.title.trim().length > 0 && t.title.length <= 150, 'Invalid title');
      assert(typeof t.summary === 'string' && t.summary.trim().length > 0 && t.summary.length <= 350, 'Invalid summary');
      assert(Array.isArray(t.tags) && t.tags.every(v => typeof v === 'string' && v.length < 70), 'Invalid tags');
      assert(t.hasTeacherKey === false && t.teacherKeyUrl === null, 'Public teacher keys are forbidden');
      assert(typeof t.version === 'string' && t.version.length > 0, 'Missing version');
      assert(t.publishedAt === null || (typeof t.publishedAt === 'string' && !Number.isNaN(Date.parse(t.publishedAt))), 'Bad publishedAt');
      assert(Number.isInteger(t.durationMinutes) && t.durationMinutes > 0 && t.durationMinutes < 120, 'Invalid duration');
      assert(LEVELS.includes(t.defaultLevel), 'Bad defaultLevel');
      assert(Array.isArray(t.variants) && t.variants.length > 0 && t.variants.length <= 24, 'Invalid variants');
      const seen = new Set();
      for (const v of t.variants) {
        assert(v && LANGS.includes(v.lang) && LEVELS.includes(v.level), 'Unsupported language/level');
        const key = v.lang + ':' + v.level;
        assert(!seen.has(key), 'Duplicate variant'); seen.add(key);
      }
      assert(t.variants.some(v => v.lang === 'en' && v.level === t.defaultLevel), 'English default missing');
      if (t.demo === true) {
        assert(t.status === 'PUBLIKOVANO', 'Invalid E1 fixture status');
        assert(t.demoContent && typeof t.demoContent === 'object', 'Fixture content missing');
        for (const v of t.variants) {
          const content = t.demoContent[v.lang+':'+v.level];
          assert(content && typeof content.heading === 'string' && typeof content.text === 'string', 'Fixture variant missing');
        }
      } else {
        assert(t.skill === 'konverzace' && t.status === 'ROZPRACOVANO' && t.publishedAt === null, 'Only unpublished Conversation preview is allowed at E2');
        assert(['digital','learning','life','society'].includes(t.category), 'Invalid category');
        assert(t.variants.length === 24, 'Conversation must have 24 variants');
        assert(!('demoContent' in t), 'Real cards cannot contain fixture text');
        realConversationCount++;
      }
    }
    assert(realConversationCount === 21, 'E2 requires exactly 21 actual Conversation cards');
    return true;
  }
  return Object.freeze({LANGS, LEVELS, SKILLS, ALPHABET, validBasePath, siteRoot, safeCardPath, hasVariant, defaultVariant, studentUrl, normalizeStudentParams, formatShortCode, resolveShortCode, validateManifest});
});
