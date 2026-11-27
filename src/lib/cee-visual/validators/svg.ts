/**
 * SVG validation for 2D diagrams and 3D fallbacks.
 *
 * Policy: reject, don't repair. A file passes only if every element and
 * attribute is on an allowlist; anything that could run code, load something
 * from elsewhere, or navigate is refused with a reason the animator can act on.
 * Students also only ever see SVGs through <img>, where scripts never run, so
 * this is the second line of defence, not the only one.
 *
 * The scanner below is a small, strict XML tokenizer: quoted attributes only,
 * matching tags, no DOCTYPE, entities, CDATA or processing instructions
 * (other than the leading XML declaration).
 */

export const MAX_SVG_BYTES = 2 * 1024 * 1024;

const ALLOWED_ELEMENTS = new Set(
  [
    'svg', 'g', 'defs', 'title', 'desc', 'metadata', 'symbol', 'use', 'switch',
    'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
    'text', 'tspan', 'textPath',
    'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'marker', 'image', 'style',
    'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feDropShadow', 'feFlood',
    'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset',
  ].map((n) => n.toLowerCase())
);

/** Editor metadata that browsers ignore (Inkscape, Illustrator, RDF). */
const INERT_PREFIXES = new Set(['sodipodi', 'inkscape', 'rdf', 'cc', 'dc', 'i', 'x', 'serif']);

const REFUSED_HINT: Record<string, string> = {
  script: 'contains a <script>',
  foreignobject: 'contains <foreignObject> (embedded HTML)',
  a: 'contains a link (<a>)',
  iframe: 'embeds a page',
  embed: 'embeds content',
  object: 'embeds content',
  set: 'uses SMIL <set>, which can rewrite links',
  animate: 'uses SMIL animation; animate with CSS in the player instead',
  animatemotion: 'uses SMIL animation; animate with CSS in the player instead',
  animatetransform: 'uses SMIL animation; animate with CSS in the player instead',
  audio: 'embeds audio',
  video: 'embeds video',
};

export interface SvgReport {
  ok: boolean;
  errors: { code: string; message: string }[];
  stats: { bytes: number; elements: number };
  viewBox: string | null;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(lt|gt|amp|quot|apos);/g, (_, n) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" })[n as 'lt']);

/** Collapse whitespace/control chars that browsers ignore inside URL schemes. */
const squash = (s: string) => decodeEntities(s).replace(/[\u0000- \u007f-\u009f]+/g, '').toLowerCase();

const DANGEROUS_SCHEME = /(javascript|vbscript|livescript|data:text\/html|data:application|data:image\/svg)/;

function cssProblems(css: string): string | null {
  const c = squash(css);
  if (c.includes('@import')) return 'CSS @import loads another file';
  if (c.includes('expression(')) return 'CSS expression()';
  if (c.includes('behavior:') || c.includes('-moz-binding')) return 'CSS behaviour binding';
  if (DANGEROUS_SCHEME.test(c)) return 'a script URL in CSS';
  // url(...) may only point inside the document.
  for (const m of c.matchAll(/url\(([^)]*)\)/g)) {
    const target = m[1].replace(/['"]/g, '');
    if (!target.startsWith('#')) return `CSS url(${m[1].slice(0, 60)}) points outside the file`;
  }
  return null;
}

const SAFE_IMAGE_DATA = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/;

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
/** Namespaces that would turn an "inert" prefix into live markup. */
const LIVE_NAMESPACES = new Set([SVG_NS, XLINK_NS, 'http://www.w3.org/1999/xhtml', 'http://www.w3.org/1998/math/mathml']);

function namespaceProblem(attr: string, rawValue: string): string | null {
  const value = rawValue.trim().toLowerCase();
  if (attr === 'xmlns') return value === SVG_NS ? null : `the default namespace must be ${SVG_NS}`;
  const prefix = attr.slice(6).toLowerCase();
  if (prefix === 'svg') return value === SVG_NS ? null : 'xmlns:svg must be the SVG namespace';
  if (prefix === 'xlink') return value === XLINK_NS ? null : 'xmlns:xlink must be the XLink namespace';
  if (!INERT_PREFIXES.has(prefix)) return `namespace prefix ${prefix} is not allowed`;
  return LIVE_NAMESPACES.has(value) ? `xmlns:${prefix} is bound to a live namespace` : null;
}

function attributeProblem(element: string, name: string, rawValue: string): string | null {
  if (name === 'xmlns' || name.startsWith('xmlns:')) return namespaceProblem(name, rawValue);
  const local = name.toLowerCase();
  const bare = local.includes(':') ? local.split(':')[1] : local;
  const value = squash(rawValue);

  if (bare.startsWith('on')) return `event handler ${name}`;
  if (DANGEROUS_SCHEME.test(value)) return `${name} contains a script URL`;

  if (bare === 'href' || bare === 'src') {
    if (value.startsWith('#')) return null;
    if (element === 'image' && SAFE_IMAGE_DATA.test(value)) return null;
    return `${name}="${rawValue.slice(0, 60)}" points outside the file`;
  }
  if (bare === 'style') return cssProblems(rawValue);
  if (/url\(/.test(value)) {
    for (const m of value.matchAll(/url\(([^)]*)\)/g)) {
      if (!m[1].replace(/['"]/g, '').startsWith('#')) return `${name} uses url() outside the file`;
    }
  }
  return null;
}

export function validateSvg(input: Uint8Array | string): SvgReport {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input).length : input.length;
  const r: SvgReport = { ok: false, errors: [], stats: { bytes, elements: 0 }, viewBox: null };
  const err = (code: string, message: string) => {
    if (r.errors.length < 20) r.errors.push({ code, message });
  };

  if (bytes > MAX_SVG_BYTES) {
    err('TOO_LARGE', `SVG is ${(bytes / 1048576).toFixed(1)} MB; the limit is 2 MB.`);
    return r;
  }

  let text: string;
  try {
    text = typeof input === 'string' ? input : new TextDecoder('utf-8', { fatal: true }).decode(input);
  } catch {
    err('NOT_UTF8', 'SVG must be UTF-8 text.');
    return r;
  }
  text = text.replace(/^﻿/, '');

  const stack: string[] = [];
  let i = 0;
  let sawRoot = false;
  let rootClosed = false;
  const n = text.length;

  while (i < n) {
    const lt = text.indexOf('<', i);
    if (lt === -1) {
      if (text.slice(i).trim() && (!sawRoot || rootClosed)) err('TEXT_OUTSIDE_ROOT', 'Text found outside the <svg> element.');
      break;
    }
    if (text.slice(i, lt).trim() && (!sawRoot || rootClosed)) err('TEXT_OUTSIDE_ROOT', 'Text found outside the <svg> element.');
    // Content of <style> is checked as CSS by the closing tag handler below.
    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4);
      if (end === -1) {
        err('MALFORMED', 'Unclosed comment.');
        return r;
      }
      i = end + 3;
      continue;
    }
    if (text.startsWith('<?', lt)) {
      const end = text.indexOf('?>', lt);
      const pi = end === -1 ? '' : text.slice(lt + 2, end);
      if (end === -1 || sawRoot || !/^xml\s/i.test(pi)) {
        err('PROCESSING_INSTRUCTION', 'Only a leading <?xml …?> declaration is allowed (no stylesheets or other instructions).');
        return r;
      }
      i = end + 2;
      continue;
    }
    if (text.startsWith('<!', lt)) {
      const what = /^<!\[CDATA\[/i.test(text.slice(lt, lt + 9)) ? 'CDATA sections' : 'DOCTYPE or ENTITY declarations';
      err('DECLARATION', `${what} are not allowed. Re-export as plain SVG.`);
      return r;
    }

    const closing = text[lt + 1] === '/';
    let j = lt + (closing ? 2 : 1);
    const nameMatch = /^[A-Za-z_][\w.:-]*/.exec(text.slice(j, j + 100));
    if (!nameMatch) {
      err('MALFORMED', `Unexpected "<" at character ${lt}.`);
      return r;
    }
    const name = nameMatch[0];
    const lname = name.toLowerCase();
    j += name.length;

    if (closing) {
      const gt = text.indexOf('>', j);
      if (gt === -1 || text.slice(j, gt).trim()) {
        err('MALFORMED', `Bad closing tag </${name}>.`);
        return r;
      }
      if (stack.pop() !== name) {
        err('MALFORMED', `Closing tag </${name}> does not match.`);
        return r;
      }
      if (stack.length === 0) rootClosed = true;
      i = gt + 1;
      continue;
    }

    // Element name policy.
    const prefix = lname.includes(':') ? lname.split(':')[0] : null;
    const localName = prefix ? lname.split(':')[1] : lname;
    if (rootClosed) err('MULTIPLE_ROOTS', 'Content found after the closing </svg>.');
    if (!sawRoot) {
      if (localName !== 'svg') {
        err('NOT_SVG', 'The root element must be <svg>.');
        return r;
      }
      sawRoot = true;
    }
    if (REFUSED_HINT[localName]) err('ELEMENT_REFUSED', `The file ${REFUSED_HINT[localName]}.`);
    else if (prefix === null || prefix === 'svg' ? !ALLOWED_ELEMENTS.has(localName) : !INERT_PREFIXES.has(prefix)) {
      err('ELEMENT_NOT_ALLOWED', `<${name}> is not allowed in diagrams.`);
    }
    r.stats.elements++;

    // Attributes: name="value" or name='value', nothing else.
    let selfClosing = false;
    for (;;) {
      const ws = /^\s*/.exec(text.slice(j))![0];
      j += ws.length;
      if (text.startsWith('/>', j)) {
        selfClosing = true;
        j += 2;
        break;
      }
      if (text[j] === '>') {
        j += 1;
        break;
      }
      if (j >= n) {
        err('MALFORMED', `Unclosed tag <${name}>.`);
        return r;
      }
      if (!ws) {
        err('MALFORMED', `Attributes of <${name}> must be separated by spaces.`);
        return r;
      }
      const am = /^([A-Za-z_][\w.:-]*)\s*=\s*(["'])/.exec(text.slice(j, j + 300));
      if (!am) {
        err('MALFORMED', `Bad attribute in <${name}>. Values must be quoted.`);
        return r;
      }
      const attr = am[1];
      const quote = am[2];
      const valueStart = j + am[0].length;
      const valueEnd = text.indexOf(quote, valueStart);
      if (valueEnd === -1) {
        err('MALFORMED', `Unclosed attribute ${attr} in <${name}>.`);
        return r;
      }
      const value = text.slice(valueStart, valueEnd);
      if (value.includes('<')) err('MALFORMED', `Attribute ${attr} contains "<".`);
      const problem = attributeProblem(localName, attr, value);
      if (problem) err('ATTRIBUTE_REFUSED', `<${name}>: ${problem}.`);
      if (localName === 'svg' && stack.length === 0 && attr === 'viewBox') r.viewBox = value;
      j = valueEnd + 1;
    }

    if (localName === 'style' && !selfClosing) {
      const end = text.indexOf('</', j);
      const css = end === -1 ? '' : text.slice(j, end);
      const problem = cssProblems(css);
      if (problem) err('STYLE_REFUSED', `<style> has ${problem}.`);
      if (/<!\[CDATA\[/i.test(css)) err('DECLARATION', 'CDATA sections are not allowed. Re-export as plain SVG.');
      else if (css.includes('<')) err('MALFORMED', '<style> contains markup.');
      stack.push(name);
      i = end === -1 ? n : end;
      continue;
    }

    if (!selfClosing) stack.push(name);
    else if (stack.length === 0) rootClosed = true;
    i = j;
  }

  if (!sawRoot) err('NOT_SVG', 'No <svg> element found.');
  if (stack.length > 0) err('MALFORMED', `Unclosed element <${stack[stack.length - 1]}>.`);
  r.ok = r.errors.length === 0;
  return r;
}
