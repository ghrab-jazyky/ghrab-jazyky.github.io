/* Language Skills Hub E3A – canonical local-only data model.
   No network, cookies, analytics or credentials; staged module, not a release. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LSH_MODEL = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const LANGUAGES = Object.freeze(['en','es','de','fr']);
  const LEVELS = Object.freeze(['A1','A2','B1','B2','C1','C2']);
  const SKILLS = Object.freeze(['konverzace','cteni','poslech']);
  const BOX_DAYS = Object.freeze([1,3,7,14,30]);
  const MAX_WORDS = 5000, MAX_IMPORT_BYTES = 3 * 1024 * 1024;
  const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const SENSE_RE = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
  const TASK_RE = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/;
  const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
  function assert(test, message) { if (!test) throw new Error(message); }
  function iso(input) {
    const d = input === undefined ? new Date() : new Date(input);
    assert(!Number.isNaN(d.getTime()), 'Invalid date');
    return d.toISOString();
  }
  function textField(value, limit, required, key) {
    const v = value === null || value === undefined ? '' : value;
    assert(typeof v === 'string', 'Invalid ' + key);
    const s = v.trim();
    assert(s.length <= limit && (!required || s.length > 0), 'Invalid ' + key + ' length');
    return s;
  }
  function timestamp(value, optional, key) {
    if (optional && (value === null || value === undefined)) return null;
    assert(typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value), 'Invalid timestamp ' + key);
    return iso(value);
  }
  function normalizeSources(items) {
    assert(items === undefined || Array.isArray(items), 'Invalid sources');
    const byKey = new Map();
    for (const item of (items || [])) {
      assert(isObject(item) && SKILLS.includes(item.skill) &&
        typeof item.topicId === 'string' && ID_RE.test(item.topicId), 'Invalid source');
      const savedAt = timestamp(item.savedAt, false, 'source.savedAt');
      const key = item.skill + ':' + item.topicId;
      if (!byKey.has(key) || byKey.get(key).savedAt > savedAt)
        byKey.set(key, {skill:item.skill, topicId:item.topicId, savedAt});
    }
    assert(byKey.size <= 100, 'Too many sources');
    return [...byKey.values()].sort((a,b) => a.savedAt.localeCompare(b.savedAt));
  }
  function normalizeReviews(items) {
    assert(items === undefined || Array.isArray(items), 'Invalid reviews');
    assert((items || []).length <= 20, 'Too many review entries');
    return (items || []).map(r => {
      assert(isObject(r) && ['umim','s-obtizemi','neumim'].includes(r.rating) &&
        Number.isInteger(r.fromBox) && r.fromBox >= 1 && r.fromBox <= 5 &&
        Number.isInteger(r.toBox) && r.toBox >= 1 && r.toBox <= 5, 'Invalid review');
      return {rating:r.rating, fromBox:r.fromBox, toBox:r.toBox, at:timestamp(r.at,false,'review.at')};
    }).sort((a,b) => a.at.localeCompare(b.at));
  }
  function createManualId(cryptoSource) {
    assert(cryptoSource && typeof cryptoSource.randomUUID === 'function', 'Secure identifier generator unavailable');
    const value = cryptoSource.randomUUID();
    assert(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(value), 'Invalid generated UUID');
    return 'manual:' + value;
  }
  function normalizeWord(input, now) {
    assert(isObject(input), 'Word must be an object');
    const time = iso(now);
    assert(LANGUAGES.includes(input.language), 'Invalid word language');
    const senseId = input.senseId === null || input.senseId === undefined ? null : input.senseId;
    assert(senseId === null || (typeof senseId === 'string' &&
      senseId.length <= 120 && SENSE_RE.test(senseId)), 'Invalid senseId');
    const id = senseId === null ? input.id : input.language + ':' + senseId;
    if (senseId === null) {
      assert(typeof id === 'string' && /^manual:[a-zA-Z0-9-]{16,85}$/.test(id), 'Invalid manual word ID');
    } else assert(input.id === undefined || input.id === id, 'senseId and word ID mismatch');
    const box = input.box === undefined ? 1 : input.box;
    assert(Number.isInteger(box) && box >= 1 && box <= 5, 'Invalid box');
    const date = d => new Date(d).toISOString();
    const dueAt = input.dueAt ? timestamp(input.dueAt,false,'dueAt') :
      date(new Date(time).getTime() + BOX_DAYS[box-1] * 86400000);
    const createdAt = input.createdAt ? timestamp(input.createdAt,false,'createdAt') : time;
    const updatedAt = input.updatedAt ? timestamp(input.updatedAt,false,'updatedAt') : time;
    const flag = (v,key) => { assert(v === undefined || typeof v === 'boolean', 'Invalid '+key); return v === true; };
    assert(input.level === undefined || input.level === null || LEVELS.includes(input.level), 'Invalid level');
    return {
      id, senseId, language:input.language,
      term:textField(input.term,160,true,'term'),
      translationCs:textField(input.translationCs,700,false,'translationCs'),
      explanation:textField(input.explanation,700,false,'explanation'),
      context:textField(input.context,1000,false,'context'),
      note:textField(input.note,1200,false,'note'),
      level:input.level || null,
      sources:normalizeSources(input.sources),
      favorite:flag(input.favorite,'favorite'),
      box, dueAt, reviews:normalizeReviews(input.reviews),
      translationHidden:flag(input.translationHidden,'translationHidden'),
      createdAt, updatedAt
    };
  }
  function mergeWords(left, right, now) {
    const a = normalizeWord(left,now), b = normalizeWord(right,now);
    assert(a.id === b.id && a.language === b.language && a.senseId === b.senseId, 'Cannot merge unrelated words');
    if (a.senseId !== null)
      assert(a.term.toLocaleLowerCase() === b.term.toLocaleLowerCase(), 'Conflicting term for the same senseId');
    const pick = (x,y) => x || y;
    return normalizeWord({
      ...a, term:a.term,
      translationCs:pick(a.translationCs,b.translationCs),
      explanation:pick(a.explanation,b.explanation),
      context:pick(a.context,b.context),
      note:pick(a.note,b.note),
      level:pick(a.level,b.level),
      favorite:a.favorite || b.favorite,
      translationHidden:a.translationHidden || b.translationHidden,
      box:Math.max(a.box,b.box),
      dueAt:a.dueAt < b.dueAt ? a.dueAt : b.dueAt,
      sources:[...a.sources,...b.sources],
      reviews:[...a.reviews,...b.reviews].sort((x,y) => x.at.localeCompare(y.at)).slice(-20),
      createdAt:a.createdAt < b.createdAt ? a.createdAt : b.createdAt,
      updatedAt:iso(now)
    },now);
  }
  function reviewWord(input, rating, when) {
    assert(['umim','s-obtizemi','neumim'].includes(rating), 'Invalid rating');
    const at = iso(when), word = normalizeWord(input, at);
    const box = rating === 'umim' ? Math.min(5,word.box+1) : rating === 'neumim' ? 1 : word.box;
    return normalizeWord({
      ...word, box,
      dueAt:new Date(new Date(at).getTime() + BOX_DAYS[box-1] * 86400000).toISOString(),
      reviews:[...word.reviews, {rating,fromBox:word.box,toBox:box,at}].slice(-20),
      updatedAt:at
    },at);
  }
  function patchWord(input, patch, when) {
    assert(isObject(patch), 'Invalid word changes');
    const fields = ['term','translationCs','explanation','context','note','favorite','translationHidden','level'];
    const change = {};
    for (const k of fields) if (Object.prototype.hasOwnProperty.call(patch,k)) change[k] = patch[k];
    return normalizeWord({...input,...change,updatedAt:iso(when)},when);
  }
  function answerKey(skill,topicId,language,level) {
    assert(['cteni','poslech'].includes(skill), 'Only Reading/Listening have answer state');
    assert(typeof topicId === 'string' && ID_RE.test(topicId) &&
      LANGUAGES.includes(language) && LEVELS.includes(level), 'Invalid answer key');
    return skill + ':' + topicId + ':' + language + ':' + level;
  }
  function normalizeAnswers(input, now) {
    assert(isObject(input), 'Invalid answers snapshot');
    const id=answerKey(input.skill,input.topicId,input.language,input.level);
    assert(input.id === undefined || input.id === id, 'Answer key mismatch');
    const version=textField(input.dataVersion,120,true,'dataVersion');
    assert(isObject(input.answers), 'Invalid answers map');
    const entries=Object.entries(input.answers);
    assert(entries.length <= 250, 'Too many answers');
    const answers=Object.create(null);
    for (const [taskId,response] of entries) {
      assert(TASK_RE.test(taskId) && isObject(response), 'Invalid answer item');
      const v=response.value;
      assert(v === null || v === undefined || typeof v === 'boolean' ||
        (typeof v === 'string' && v.length <= 4000) ||
        (Array.isArray(v) && v.length <= 100 && v.every(x => typeof x === 'string' && x.length <= 600)),
        'Invalid answer value');
      const checked=response.checked === true, revealed=response.revealed === true;
      const firstAttempt=response.firstAttempt === undefined ? null : response.firstAttempt;
      assert(firstAttempt === null || typeof firstAttempt === 'boolean' ||
        (typeof firstAttempt === 'string' && firstAttempt.length <= 4000) ||
        (Array.isArray(firstAttempt) && firstAttempt.length <= 100 &&
          firstAttempt.every(x => typeof x === 'string' && x.length <= 600)),
        'Invalid firstAttempt');
      const correct=response.correct === null || response.correct === undefined ? null : response.correct;
      assert(correct === null || typeof correct === 'boolean', 'Invalid correctness');
      answers[taskId]={value:v === undefined ? null : v, checked, firstAttempt, revealed, correct};
    }
    const activePart=input.activePart === null || input.activePart === undefined ? null :
      textField(input.activePart,100,false,'activePart');
    const normalized={id,skill:input.skill,topicId:input.topicId,language:input.language,level:input.level,
      dataVersion:version,answers,activePart,updatedAt:iso(now)};
    assert(JSON.stringify(normalized).length <= 220000, 'Answer snapshot too large');
    return normalized;
  }
  function reconcileAnswers(snapshot, validTaskIds, currentDataVersion, now) {
    assert(Array.isArray(validTaskIds) && validTaskIds.length <= 250 &&
      validTaskIds.every(id => typeof id === 'string' && TASK_RE.test(id)), 'Invalid current task IDs');
    const previous=normalizeAnswers(snapshot,now);
    const allowed=new Set(validTaskIds);
    const kept=Object.create(null);
    const removed=[];
    for (const [id,answer] of Object.entries(previous.answers)) {
      if (allowed.has(id)) kept[id]=answer; else removed.push(id);
    }
    const result=normalizeAnswers({...previous, answers:kept, dataVersion:currentDataVersion},now);
    return {snapshot:result, removedTaskIds:removed, changed:removed.length>0 || previous.dataVersion!==currentDataVersion};
  }
  function utf8Size(string) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(string).length;
    return unescape(encodeURIComponent(string)).length;
  }
  function validateImport(raw, now) {
    assert(typeof raw === 'string' && utf8Size(raw) <= MAX_IMPORT_BYTES, 'Import exceeds 3 MB limit');
    let parsed;
    try { parsed=JSON.parse(raw); } catch (_) { throw new Error('Invalid JSON backup'); }
    assert(isObject(parsed) && parsed.kind === 'lsh-slovnicek' &&
      parsed.schemaVersion === 1 && Array.isArray(parsed.words) && parsed.words.length <= MAX_WORDS,
      'Unsupported or oversized backup');
    timestamp(parsed.exportedAt,false,'exportedAt');
    const ids=new Set();
    const words=parsed.words.map(w => {
      const word=normalizeWord(w,now);
      assert(!ids.has(word.id), 'Duplicate word in backup');
      ids.add(word.id);
      return word;
    });
    return words;
  }
  function serializeExport(words, when) {
    assert(Array.isArray(words) && words.length <= MAX_WORDS, 'Too many words to export');
    const normalized=words.map(w => normalizeWord(w,when));
    return JSON.stringify({kind:'lsh-slovnicek',schemaVersion:1,exportedAt:iso(when),words:normalized},null,2);
  }
  function combineImport(current, incoming, replace, now) {
    assert(Array.isArray(current) && Array.isArray(incoming), 'Invalid import lists');
    const words = new Map();
    if (!replace) for (const x of current) {
      const n=normalizeWord(x,now);
      words.set(n.id,n);
    }
    for (const x of incoming) {
      const word=normalizeWord(x,now);
      words.set(word.id,words.has(word.id) ? mergeWords(words.get(word.id),word,now) : word);
      assert(words.size <= MAX_WORDS, 'Import would exceed 5000 words');
    }
    return [...words.values()];
  }
  return Object.freeze({
    LANGUAGES, LEVELS, SKILLS, BOX_DAYS, MAX_WORDS, MAX_IMPORT_BYTES,
    createManualId, normalizeWord, mergeWords, reviewWord, patchWord,
    answerKey, normalizeAnswers, reconcileAnswers, validateImport, serializeExport, combineImport, utf8Size
  });
});
