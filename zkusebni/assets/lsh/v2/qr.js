/* Conversation Lab QR encoder, standalone offline, byte mode, ECC level M.
 * Original implementation based on the QR Code Model 2 encoding specification.
 * No network dependencies, no tracking, no external API requests.
 */
(function (host) {
  'use strict';
  const ECC = [0,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26];
  const BLOCKS = [0,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];
  const utf8 = text => Array.from(new TextEncoder().encode(text));
  const rawBits = ver => {
    let n = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const a = Math.floor(ver / 7) + 2;
      n -= (25 * a - 10) * a - 55;
      if (ver >= 7) n -= 36;
    }
    return n;
  };
  const capacity = ver => Math.floor(rawBits(ver) / 8) - ECC[ver] * BLOCKS[ver];
  function multiply(a, b) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((b >>> i) & 1) * a;
    }
    return z;
  }
  function divisor(degree) {
    const r = Array(degree).fill(0);
    r[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        r[j] = multiply(r[j], root);
        if (j + 1 < degree) r[j] ^= r[j + 1];
      }
      root = multiply(root, 2);
    }
    return r;
  }
  function remainder(data, degree) {
    const div = divisor(degree);
    const result = Array(degree).fill(0);
    for (const b of data) {
      const factor = b ^ result.shift();
      result.push(0);
      for (let i = 0; i < degree; i++) result[i] ^= multiply(div[i], factor);
    }
    return result;
  }
  function codewords(text) {
    const bytes = utf8(text);
    let version = 0;
    for (let v = 1; v <= 20; v++) {
      const countBits = v <= 9 ? 8 : 16;
      if (bytes.length < (1 << countBits) && 4 + countBits + 8 * bytes.length <= capacity(v) * 8) {
        version = v;
        break;
      }
    }
    if (!version) throw new RangeError('QR link is too long');
    const bits = [];
    const append = (value, count) => {
      for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    };
    append(4, 4);
    append(bytes.length, version <= 9 ? 8 : 16);
    bytes.forEach(b => append(b, 8));
    const limit = capacity(version) * 8;
    append(0, Math.min(4, limit - bits.length));
    while (bits.length % 8) bits.push(0);
    let pad = 0;
    while (bits.length < limit) append((pad++ % 2) === 0 ? 0xec : 0x11, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    }
    const blocks = BLOCKS[version], eccLen = ECC[version];
    const raw = Math.floor(rawBits(version) / 8);
    const shortBlocks = blocks - raw % blocks;
    const shortDataLen = Math.floor(raw / blocks) - eccLen;
    const grouped = [];
    let offset = 0;
    for (let i = 0; i < blocks; i++) {
      const len = shortDataLen + (i < shortBlocks ? 0 : 1);
      const dat = data.slice(offset, offset + len);
      offset += len;
      const ecc = remainder(dat, eccLen);
      if (i < shortBlocks) dat.push(0);
      grouped.push(dat.concat(ecc));
    }
    if (offset !== data.length) throw new Error('QR data partition mismatch');
    const result = [];
    for (let i = 0; i < grouped[0].length; i++) {
      for (let j = 0; j < grouped.length; j++) {
        if (i !== shortDataLen || j >= shortBlocks) result.push(grouped[j][i]);
      }
    }
    if (result.length !== raw) throw new Error('QR codeword partition mismatch');
    return { version, result };
  }
  function matrix(text) {
    const { version, result: data } = codewords(text);
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => Array(size).fill(false));
    const fixed = Array.from({ length: size }, () => Array(size).fill(false));
    function set(x, y, value) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      modules[y][x] = !!value;
      fixed[y][x] = true;
    }
    // Timing patterns
    for (let i = 0; i < size; i++) {
      set(6, i, i % 2 === 0);
      set(i, 6, i % 2 === 0);
    }
    function finder(cx, cy) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          set(cx + dx, cy + dy, dist !== 2 && dist !== 4);
        }
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    if (version >= 2) {
      const count = Math.floor(version / 7) + 2;
      const step = version === 32 ? 26 : Math.ceil((size - 13) / (count * 2 - 2)) * 2;
      const pos = [6];
      for (let p = size - 7; pos.length < count; p -= step) pos.splice(1, 0, p);
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
          if ((i === 0 && j === 0) || (i === 0 && j === count - 1) || (i === count - 1 && j === 0)) continue;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
            set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
    const bit = (val, i) => ((val >>> i) & 1) !== 0;
    function format(mask) {
      // ECC M = 0; format payload = mask ID.
      const input = mask;
      let rem = input;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const encoded = ((input << 10) | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) set(8, i, bit(encoded, i));
      set(8, 7, bit(encoded, 6)); set(8, 8, bit(encoded, 7)); set(7, 8, bit(encoded, 8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(encoded, i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(encoded, i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(encoded, i));
      set(8, size - 8, true);
    }
    format(0); // reserve format modules before data placement
    if (version >= 7) {
      let rem = version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const encoded = (version << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, bit(encoded, i)); set(b, a, bit(encoded, i));
      }
    }
    let index = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          if (fixed[y][x]) continue;
          const v = index < data.length * 8 && bit(data[index >>> 3], 7 - (index & 7));
          index++;
          modules[y][x] = v !== ((x + y) % 2 === 0); // QR mask 0
        }
      }
    }
    return modules;
  }
  function svg(text) {
    const mat = matrix(text), n = mat.length, NS = 'http://www.w3.org/2000/svg';
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('xmlns', NS);
    el.setAttribute('viewBox', `0 0 ${n + 8} ${n + 8}`);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'QR code');
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', String(n + 8));
    bg.setAttribute('height', String(n + 8));
    bg.setAttribute('fill', '#ffffff');
    el.appendChild(bg);
    const path = document.createElementNS(NS, 'path');
    const chunks = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
      if (mat[y][x]) chunks.push(`M${x + 4},${y + 4}h1v1h-1z`);
    path.setAttribute('d', chunks.join(''));
    path.setAttribute('fill', '#101c32');
    el.appendChild(path);
    return el;
  }
  const api = Object.freeze({matrix, svg});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else host.CLBQRCode = api;
})(typeof window !== 'undefined' ? window : this);
