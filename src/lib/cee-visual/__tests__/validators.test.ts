import { describe, expect, it } from 'vitest';
import { DEFAULT_GLB_LIMITS, imageSize, inspectGlb, validateGlb } from '../validators/glb';
import { box, buildGlb, cone, packMeshes, sphere } from '../validators/glbWriter';
import { checkManifest } from '../validators/manifest';
import { validateSvg } from '../validators/svg';
import { manifest3d } from './fixtures';

const fixtureGlb = () => {
  const { json, bin } = packMeshes([
    box('fixture-cube', 1, [0.2, 0.4, 0.8], [-1.5, 0, 0]),
    sphere('fixture-sphere', 0.6, [0.9, 0.6, 0.2]),
    cone('fixture-cone', 0.5, 1.2, [0.3, 0.7, 0.4], [1.5, 0, 0]),
  ]);
  return { json, bin, bytes: buildGlb(json, bin) };
};

const codes = (r: { errors: { code: string }[] }) => r.errors.map((e) => e.code);

describe('inspectGlb', () => {
  it('accepts a well-formed embedded GLB and reports its parts', () => {
    const r = inspectGlb(fixtureGlb().bytes);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.nodeNames).toEqual(['fixture-cube', 'fixture-sphere', 'fixture-cone']);
    expect(r.stats).toMatchObject({ nodes: 3, meshes: 3, materials: 3 });
    expect(r.stats.triangles).toBeGreaterThan(1000);
  });

  it('rejects a buffer that points to an external file', () => {
    const { json, bin } = fixtureGlb();
    (json.buffers as Record<string, unknown>[])[0].uri = 'https://evil.example/payload.bin';
    expect(codes(inspectGlb(buildGlb(json, bin)))).toContain('EXTERNAL_URI');
  });

  it('rejects images loaded by URI, including data: URIs', () => {
    for (const uri of ['https://evil.example/x.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)']) {
      const { json, bin } = fixtureGlb();
      json.images = [{ uri }];
      expect(codes(inspectGlb(buildGlb(json, bin)))).toContain('EXTERNAL_URI');
    }
  });

  it('rejects compression that needs a WebAssembly decoder, and unknown extensions', () => {
    const { json, bin } = fixtureGlb();
    json.extensionsUsed = ['KHR_draco_mesh_compression', 'VENDOR_magic'];
    const c = codes(inspectGlb(buildGlb(json, bin)));
    expect(c).toContain('EXTENSION_NEEDS_DECODER');
    expect(c).toContain('EXTENSION_NOT_ALLOWED');
  });

  it('rejects files that are not GLB, are truncated, or carry extra chunks', () => {
    expect(codes(inspectGlb(new TextEncoder().encode('{"asset":{"version":"2.0"}} padding padding')))).toEqual(['NOT_GLB']);
    const good = fixtureGlb().bytes;
    expect(codes(inspectGlb(good.subarray(0, good.length - 8)))).toEqual(['LENGTH_MISMATCH']);
    const { json, bin } = fixtureGlb();
    expect(codes(inspectGlb(buildGlb(json, bin, [{ type: 0x12345678, data: new Uint8Array(4) }])))).toEqual(['CHUNK_UNEXPECTED']);
  });

  it('enforces size, triangle and node limits', () => {
    const bytes = fixtureGlb().bytes;
    expect(codes(inspectGlb(bytes, { ...DEFAULT_GLB_LIMITS, maxBytes: 100 }))).toEqual(['TOO_LARGE']);
    expect(codes(inspectGlb(bytes, { ...DEFAULT_GLB_LIMITS, maxTriangles: 10 }))).toContain('TOO_MANY_TRIANGLES');
    expect(codes(inspectGlb(bytes, { ...DEFAULT_GLB_LIMITS, maxNodes: 2 }))).toContain('TOO_MANY_NODES');
  });

  it('rejects a bufferView that reads past the buffer', () => {
    const { json, bin } = fixtureGlb();
    (json.bufferViews as Record<string, number>[])[0].byteLength = 10_000_000;
    expect(codes(inspectGlb(buildGlb(json, bin)))).toContain('BUFFER_VIEW_INVALID');
  });

  it('warns about duplicate node names', () => {
    const { json, bin } = packMeshes([box('same', 1, [1, 0, 0]), box('same', 1, [0, 1, 0])]);
    const r = inspectGlb(buildGlb(json, bin));
    expect(r.duplicateNodeNames).toEqual(['same']);
    expect(r.ok).toBe(true);
  });
});

describe('validateGlb (with the Khronos validator)', () => {
  it('passes the dev fixture with no spec errors', async () => {
    const r = await validateGlb(fixtureGlb().bytes);
    expect(r.errors).toEqual([]);
    expect(r.khronos?.errors).toBe(0);
  }, 30000);

  it('reports spec errors our structural check does not look for', async () => {
    const { json, bin } = fixtureGlb();
    (json.accessors as Record<string, unknown>[])[0].min = [99, 99, 99]; // bounds no longer match the data
    const r = await validateGlb(buildGlb(json, bin));
    expect(codes(r)).toContain('GLTF_SPEC');
    expect(r.khronos?.errors).toBeGreaterThan(0);
  }, 30000);
});

describe('imageSize', () => {
  it('reads PNG dimensions', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 512);
    new DataView(png.buffer).setUint32(20, 256);
    expect(imageSize(png)).toEqual({ width: 512, height: 256, mime: 'image/png' });
  });
});

describe('checkManifest', () => {
  const model = () => inspectGlb(fixtureGlb().bytes);

  it('accepts a manifest whose nodes all exist', () => {
    expect(checkManifest(manifest3d(), model())).toMatchObject({ ok: true, errors: [] });
  });

  it('rejects hotspots, layers and highlights that name missing nodes', () => {
    const m = manifest3d();
    m.hotspots[0].targetNode = 'left-ventricle';
    m.model!.layers[0].nodeNames = ['fixture-cube', 'nope'];
    m.sequences[0].steps[2].highlight = ['ghost'];
    const r = checkManifest(m, model());
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.code)).toEqual(['NODE_NOT_IN_MODEL', 'NODE_NOT_IN_MODEL', 'NODE_NOT_IN_MODEL']);
  });

  it('rejects a 3D manifest with no model, and a schema-invalid manifest', () => {
    expect(checkManifest(manifest3d(), null).errors[0].code).toBe('MODEL_MISSING');
    expect(checkManifest({ schemaVersion: '1.0' }, model()).errors[0].code).toBe('MANIFEST_SCHEMA');
  });
});

describe('committed dev fixture', () => {
  it('model, fallback and manifest all pass validation together', async () => {
    const { readFileSync } = await import('node:fs');
    const { fixtureManifest, fixtureLesson } = await import('../devFixture');
    const { LessonContent } = await import('../schemas');
    const glb = await validateGlb(new Uint8Array(readFileSync('public/cee-dev-fixture/fixture.glb')));
    expect(glb.errors).toEqual([]);
    expect(checkManifest(fixtureManifest, glb).errors).toEqual([]);
    expect(validateSvg(new Uint8Array(readFileSync('public/cee-dev-fixture/fallback.svg'))).errors).toEqual([]);
    expect(LessonContent.safeParse(fixtureLesson).success).toBe(true);
  }, 30000);
});

describe('validateSvg', () => {
  const svg = (inner: string, attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"${attrs}>${inner}</svg>`;

  it('accepts a plain diagram with gradients, text, styles and internal references', () => {
    const r = validateSvg(
      `<?xml version="1.0" encoding="UTF-8"?>\n<!-- diagram -->\n` +
        svg(
          `<defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs>` +
            `<style>.a{fill:url(#g)}</style><g class="a"><rect width="5" height="5" fill="url(#g)"/>` +
            `<use href="#g"/><text x="1" y="9">Label &amp; more</text></g>`,
          ' xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:version="1.3"'
        )
    );
    expect(r.errors).toEqual([]);
    expect(r.viewBox).toBe('0 0 10 10');
  });

  const attacks: Record<string, string> = {
    script: svg('<script>alert(1)</script>'),
    'event handler': svg('<rect onload="alert(1)"/>'),
    'event handler, odd case': svg('<rect OnClick="x()"/>'),
    'javascript href': svg('<use href="javascript:alert(1)"/>'),
    'entity-encoded javascript href': svg('<use href="&#106;avascript:alert(1)"/>'),
    'whitespace-split javascript href': svg('<use href="java&#x09;script:alert(1)"/>'),
    'external use': svg('<use href="https://evil.example/s.svg#x"/>'),
    'xlink external image': svg('<image xlink:href="https://evil.example/t.png"/>', ' xmlns:xlink="http://www.w3.org/1999/xlink"'),
    'svg inside data uri': svg('<image href="data:image/svg+xml;base64,PHN2Zz4="/>'),
    foreignObject: svg('<foreignObject><div>hi</div></foreignObject>'),
    link: svg('<a href="#x"><rect/></a>'),
    'smil set': svg('<set attributeName="href" to="javascript:alert(1)"/>'),
    iframe: svg('<iframe src="https://evil.example"/>'),
    doctype: `<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>${svg('<text>&x;</text>')}`,
    cdata: svg('<style><![CDATA[ .a{} ]]></style>'),
    'xml stylesheet': `<?xml-stylesheet href="https://evil.example/x.css"?>${svg('')}`,
    'css import': svg('<style>@import url(https://evil.example/x.css);</style>'),
    'css external url': svg('<rect style="fill:url(https://evil.example/x)"/>'),
    'css expression': svg('<rect style="width:expression(alert(1))"/>'),
    'unquoted attribute': svg('<rect width=5/>'),
    'mismatched tags': '<svg xmlns="http://www.w3.org/2000/svg"><g></svg>',
    'not svg': '<html><body/></html>',
    'prefix bound to xhtml': svg('<x:script>alert(1)</x:script><x:meta/>', ' xmlns:x="http://www.w3.org/1999/xhtml"'),
    'inert prefix bound to xhtml': svg('<inkscape:meta/>', ' xmlns:inkscape="http://www.w3.org/1999/xhtml"'),
    'wrong default namespace': '<svg xmlns="http://www.w3.org/1999/xhtml"></svg>',
    'unknown element': svg('<marquee/>'),
    'content after root': `${svg('')}<script>alert(1)</script>`,
  };

  for (const [name, file] of Object.entries(attacks)) {
    it(`rejects: ${name}`, () => {
      const r = validateSvg(file);
      expect(r.ok).toBe(false);
      expect(r.errors.length).toBeGreaterThan(0);
    });
  }

  it('rejects files over 2 MB and non-UTF-8 bytes', () => {
    expect(validateSvg(svg(`<desc>${'x'.repeat(2 * 1024 * 1024)}</desc>`)).errors[0].code).toBe('TOO_LARGE');
    expect(validateSvg(new Uint8Array([0x3c, 0xff, 0xfe, 0x3e])).errors[0].code).toBe('NOT_UTF8');
  });
});
