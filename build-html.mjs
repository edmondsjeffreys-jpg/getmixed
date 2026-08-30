import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const ts = createRequire(import.meta.url)('typescript');

let code = readFileSync('wsop-trainer.tsx', 'utf8');
code = code.replace(/^\s*import\s*\{[^}]*\}\s*from\s*["']react["'];?\s*\n/m, '');
code = code.replace(/export\s+default\s+function\s+App\s*\(/, 'function App(');

// PRE-COMPILE the full runtime script at build time -> shipped file is plain ready-to-run JS
// (no Babel CDN, no in-browser transform on the phone). Faster + reliable loads on mobile.
const fullSource = `
const { useState, useEffect, useRef, useMemo } = React;

${code}

const boot = document.getElementById('boot');
if (boot) boot.remove();
ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
`;

const compiled = ts.transpileModule(fullSource, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None,
    removeComments: true,
    sourceMap: false,
  },
}).outputText;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0A1F18" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<title>Get Mixed</title>
<script>
  // Analytics runs on the live domain only, so a staging copy on github.io
  // stays out of the GA4 property and test sessions never pollute real numbers.
  // gtag is always defined either way, so no call site can throw.
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  if (location.hostname === 'getmixed.ca' || location.hostname === 'www.getmixed.ca') {
    var gaTag = document.createElement('script');
    gaTag.async = true;
    gaTag.src = 'https://www.googletagmanager.com/gtag/js?id=G-FCYV1NGPS6';
    document.head.appendChild(gaTag);
    gtag('js', new Date());
    gtag('config', 'G-FCYV1NGPS6');
  }
</script>
<style>
  html, body { margin:0; padding:0; background:#0A1F18; color:#F0E9D6;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    -webkit-text-size-adjust:100%; }
  #root { min-height:100vh; }
  #boot { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:14px; color:#C9A24B; font-size:15px; letter-spacing:2px; }
  #boot .ring { width:34px; height:34px; border:3px solid #C9A24B33; border-top-color:#C9A24B;
    border-radius:50%; animation:spin 0.9s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>
</head>
<body>
  <div id="root"></div>
  <div id="boot"><div class="ring"></div><div>DEALING IN…</div></div>

  <!-- React from CDN. App code is PRE-COMPILED at build time (no Babel, no in-browser transform). -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <script>
${compiled}
  </script>

</body>
</html>
`;
writeFileSync('index.html', html);
console.log('index.html written —', html.length, 'bytes (pre-compiled, no Babel CDN)');
