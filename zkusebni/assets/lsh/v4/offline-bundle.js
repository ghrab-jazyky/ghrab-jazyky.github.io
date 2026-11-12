/* R5N — source-preserving offline ZIP for 20 older Conversation Lab HTML cards.
 * No credential, remote endpoint, analytics, student data or privileged operation.
 * Browser must use HTTPS to verify CSP SHA-256 before packaging. */
(function (global) {
  'use strict';
  const ROOT = '/zkusebni/';
  const DEPENDENCIES = Object.freeze([
    'assets/lsh/v2/lock.js',
    'assets/lsh/v3/card-bridge.css',
    'assets/lsh/v3/model.js',
    'assets/lsh/v3/store.js',
    'assets/lsh/v3/card-bridge.js'
  ]);
  const SOURCE_RE = /^konverzace\/([a-z0-9-]+)\/$/;
  const TOKEN = 'const clbPreset = new URLSearchParams(window.location.search);';
  const MAGIC = 0x04034b50;
  const encode = s => new TextEncoder().encode(s);
  function check(ok, message) { if (!ok) throw Error(message); }
  function crc32(bytes) {
    let crc = -1;
    for (const val of bytes) {
      crc ^= val;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }
  function zip(items) {
    check(items.length > 0 && items.length <= 15, 'Invalid ZIP entry count');
    let offset = 0, centralBytes = 0;
    const chunks = [], directory = [], names = new Set();
    for (const item of items) {
      check(typeof item.name === 'string' && /^[a-z0-9_./-]+$/i.test(item.name) &&
        !item.name.startsWith('/') && !item.name.split('/').includes('..') && !names.has(item.name), 'Invalid archive path');
      names.add(item.name);
      const name = encode(item.name), body = item.bytes;
      check(body instanceof Uint8Array && body.length <= 6 * 1024 * 1024, 'Archive component too large');
      const crc = crc32(body);
      const local = new Uint8Array(30 + name.length), ld = new DataView(local.buffer);
      ld.setUint32(0, MAGIC, true); ld.setUint16(4, 20, true); ld.setUint16(6, 0x0800, true);
      ld.setUint32(14, crc, true); ld.setUint32(18, body.length, true);
      ld.setUint32(22, body.length, true); ld.setUint16(26, name.length, true);
      local.set(name, 30);
      const central = new Uint8Array(46 + name.length), cd = new DataView(central.buffer);
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, body.length, true);
      cd.setUint32(24, body.length, true); cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true); central.set(name, 46);
      chunks.push(local, body); directory.push(central);
      offset += local.length + body.length;
      centralBytes += central.length;
    }
    const end = new Uint8Array(22), ed = new DataView(end.buffer);
    ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, items.length, true);
    ed.setUint16(10, items.length, true);
    ed.setUint32(12, centralBytes, true); ed.setUint32(16, offset, true);
    return new Blob([...chunks, ...directory, end], { type: 'application/zip' });
  }
  async function digestBase64(source) {
    check(global.crypto && crypto.subtle, 'Pro vytvoření ZIP je vyžadováno zabezpečené HTTPS.');
    const hash = await crypto.subtle.digest('SHA-256', encode(source));
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
  function matchesExactly(input, marker) {
    return input.split(marker).length === 2;
  }
  async function fetchLocal(path) {
    check(/^(?:assets\/lsh\/(?:v2|v3)\/[a-z0-9.-]+|konverzace\/[a-z0-9-]+\/)$/i.test(path), 'Nepovolená cesta ke zdroji.');
    const base = new URL(ROOT, location.origin), url = new URL(path, base);
    check(url.origin === location.origin && url.pathname.startsWith(base.pathname), 'Nepovolený původ.');
    const response = await fetch(url.href, { cache: 'no-store' });
    check(response.ok, 'Chybí soubor offline balíčku: ' + path);
    const binary = new Uint8Array(await response.arrayBuffer());
    check(binary.byteLength < 6 * 1024 * 1024, 'Příliš velký soubor v balíčku.');
    return binary;
  }
  async function createBundle(entry, chosen) {
    check(entry && entry.offlineBundle === 'clb-v1' && !entry.selfContainedHtml && entry.skill === 'konverzace',
      'Tento typ karty nepodporuje offline ZIP.');
    const match = SOURCE_RE.exec(entry.studentPath);
    check(match && entry.id === 'cl-' + match[1], 'Neplatné ID nebo cesta karty.');
    const sourceUrl = new URL(entry.studentPath, new URL(ROOT, location.origin));
    const selectedUrl = new URL(chosen);
    check(selectedUrl.origin === location.origin && selectedUrl.pathname === sourceUrl.pathname, 'Odlišná URL karty.');
    const params = selectedUrl.searchParams, fixed = params.get('zamek') === '1';
    if (fixed) {
      check(params.getAll('lang').length === 1 && ['en','es','de','fr'].includes(params.get('lang')) &&
        params.getAll('level').length === 1 && ['A1','A2','B1','B2','C1','C2'].includes(params.get('level')),
      'Neplatná pevná jazyková/úrovňová varianta.');
    } else {
      check(params.getAll('lang').length === 0 && params.getAll('level').length === 0 &&
        params.getAll('zamek').length === 0, 'Neplatná volná varianta.');
    }
    check(params.getAll('practice').length === 1 && params.get('practice') === '1', 'Neplatný režim.');
    const sourceBytes = await fetchLocal(entry.studentPath);
    const original = new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
    check(original.includes('data-lsh-topic-id="' + entry.id + '"') && matchesExactly(original, TOKEN), 'Nekompatibilní konverzační HTML.');
    const resources = [...original.matchAll(/<(?:script|link|img|source|video|audio)[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(x => x[1]);
    const expected = DEPENDENCIES.map(x => '../../' + x);
    check(resources.length === expected.length && resources.every((x,i) => x === expected[i]),
      'Karta vyžaduje nepodporovanou externí závislost.');
    const scripts = [...original.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
    check(scripts.length === 1, 'Neočekávaný počet inline skriptů.');
    const csp = [...original.matchAll(/sha256-([A-Za-z0-9+/]{43}=)/g)];
    check(csp.length === 1, 'Neočekávaná Content Security Policy.');
    const beforeHash = await digestBase64(scripts[0][1]);
    check(beforeHash === csp[0][1], 'Originál neodpovídá CSP SHA-256; balíček nelze bezpečně vytvořit.');
    const substitution = 'const clbPreset = new URLSearchParams(' + JSON.stringify(selectedUrl.search).replace(/</g, '\\u003c') + ');';
    const revisedScript = scripts[0][1].replace(TOKEN, substitution);
    const newHash = await digestBase64(revisedScript);
    let offline = original.replace(scripts[0][0], '<script>' + revisedScript + '</script>');
    offline = offline.replace('sha256-' + beforeHash, 'sha256-' + newHash);
    check(offline !== original && offline.includes('sha256-' + newHash), 'CSP přepočet selhal.');
    const files = [{ name: entry.studentPath + 'index.html', bytes: encode(offline) }];
    for (const dep of DEPENDENCIES) {
      let content = await fetchLocal(dep);
      if (dep === 'assets/lsh/v2/lock.js') {
        const js = new TextDecoder('utf-8', { fatal: true }).decode(content);
        const marker = 'new URLSearchParams(window.location.search)';
        check(matchesExactly(js, marker), 'Offline lock.js nemá očekávané rozhraní.');
        content = encode(js.replace(marker, 'new URLSearchParams(' + JSON.stringify(selectedUrl.search) + ')'));
      }
      files.push({ name: dep, bytes: content });
    }
    const readme = [
      'LANGUAGE SKILLS HUB — OFFLINE CONVERSATION',
      'Téma: ' + entry.title,
      'Režim: PROCVIČOVÁNÍ — ' + (fixed ? params.get('lang').toUpperCase() + ' / ' + params.get('level') + ' (pevná varianta)' : 'volná varianta'),
      '',
      '1. Rozbalte celý ZIP, nikoli pouze index.html.',
      '2. Otevřete konverzace/' + match[1] + '/index.html v prohlížeči.',
      '3. Složku assets ponechte vedle složky konverzace.',
      '4. Všechny texty a úlohy fungují lokálně. Ukládání osobního slovníčku',
      '   může být prohlížečem při otevření souboru file:// omezeno.',
      '5. Nejde o klasifikovaný test ani uzamčení proti manipulaci.',
      '6. Původní veřejné studentské HTML v GitHubu zůstalo nezměněné.',
      ''
    ].join('\r\n');
    files.push({ name: 'NAVOD.txt', bytes: encode(readme) });
    return { blob: zip(files), name: 'LSH_' + entry.id + '_' +
      (fixed ? params.get('lang') + '-' + params.get('level') + '_fixed' : 'free') + '_practice_OFFLINE.zip' };
  }
  async function download(entry, url) {
    const result = await createBundle(entry, url);
    const blobUrl = URL.createObjectURL(result.blob), a = document.createElement('a');
    a.href = blobUrl; a.download = result.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return result.name;
  }
  global.LSH_OFFLINE_BUNDLE = Object.freeze({ download, createBundle });
})(window);
