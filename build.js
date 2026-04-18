#!/usr/bin/env node
/*
 * Minimal build step — no framework, no HTML rewrite.
 *
 * What it does:
 *   1. Minifies script.js, supabase.js, admin/admin.js → .min.js (sibling files)
 *   2. Minifies index.css, admin/admin.css (if present) → .min.css
 *   3. Computes a short content hash and writes it to ./.build-version
 *   4. Rewrites the ?v=N query string in every HTML file's <script src> / <link href>
 *      so browsers cache-bust automatically after a deploy.
 *
 * What it does NOT do:
 *   - Change your deploy pipeline. You still deploy the repo root.
 *   - Require ES modules. Scripts stay classic <script> tags.
 *   - Delete originals — .min.js / .min.css sit alongside.
 *
 * Run:  npm run build
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const watch = process.argv.includes('--watch');

const JS_TARGETS = [
  'i18n-data.js',
  'script.js',
  'supabase.js',
  'admin/admin.js',
  'setup_data.js',
];

const CSS_TARGETS = [
  'index.css',
];

function hash(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

async function minifyJs(esbuild, file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  const res = await esbuild.build({
    entryPoints: [abs],
    write: false,
    minify: true,
    target: ['es2018'],
    bundle: false,
    legalComments: 'none',
    logLevel: 'warning',
  });
  const out = res.outputFiles[0].text;
  const outPath = abs.replace(/\.js$/, '.min.js');
  fs.writeFileSync(outPath, out);
  return { file, bytes: out.length, original: fs.statSync(abs).size };
}

async function minifyCss(esbuild, file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  const res = await esbuild.build({
    entryPoints: [abs],
    write: false,
    minify: true,
    loader: { '.css': 'css' },
    logLevel: 'warning',
  });
  const out = res.outputFiles[0].text;
  const outPath = abs.replace(/\.css$/, '.min.css');
  fs.writeFileSync(outPath, out);
  return { file, bytes: out.length, original: fs.statSync(abs).size };
}

function bumpCacheVersion(version) {
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith('.html')) files.push(full);
    }
  }
  walk(ROOT);

  let changed = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const next = src
      .replace(/(\.(?:js|css))\?v=[^"'\s]+/g, `$1?v=${version}`)
      .replace(/(i18n-data\.js|script\.js|index\.css|supabase\.js|admin\/admin\.js|admin\/admin\.css)(["'])/g, `$1?v=${version}$2`);
    // second regex only adds ?v=... when missing; avoid double-append
    const final = next.replace(/(\?v=[^"'\s]+)\?v=[^"'\s]+/g, '$1');
    if (final !== src) {
      fs.writeFileSync(f, final);
      changed++;
    }
  }
  return { files: files.length, changed };
}

async function run() {
  const esbuild = require('esbuild');
  const kb = (n) => (n / 1024).toFixed(1) + ' KB';

  console.log('▸ Minifying JS…');
  const jsResults = (await Promise.all(JS_TARGETS.map((f) => minifyJs(esbuild, f)))).filter(Boolean);
  for (const r of jsResults) console.log(`  ${r.file}  ${kb(r.original)} → ${kb(r.bytes)}`);

  console.log('▸ Minifying CSS…');
  const cssResults = (await Promise.all(CSS_TARGETS.map((f) => minifyCss(esbuild, f)))).filter(Boolean);
  for (const r of cssResults) console.log(`  ${r.file}  ${kb(r.original)} → ${kb(r.bytes)}`);

  // Content-addressed version from the minified bundle
  const allBytes = Buffer.concat(
    [...jsResults, ...cssResults]
      .map((r) => fs.readFileSync(path.join(ROOT, r.file.replace(/\.(js|css)$/, '.min.$1'))))
  );
  const version = hash(allBytes);
  fs.writeFileSync(path.join(ROOT, '.build-version'), version + '\n');
  console.log(`▸ Content version: ${version}`);

  const { files, changed } = bumpCacheVersion(version);
  console.log(`▸ Updated cache-bust in ${changed}/${files} HTML files`);
  console.log('✓ Build complete.');
}

if (watch) {
  console.log('Watch mode: rebuilding on changes…');
  const watcher = () => run().catch((e) => console.error(e));
  watcher();
  for (const f of [...JS_TARGETS, ...CSS_TARGETS]) {
    const abs = path.join(ROOT, f);
    if (fs.existsSync(abs)) fs.watchFile(abs, { interval: 500 }, watcher);
  }
} else {
  run().catch((e) => { console.error(e); process.exit(1); });
}
