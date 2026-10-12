import { mkdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['style.css', 'app.js', 'recipes.json']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
let html = await readFile('index.html', 'utf8');
// Vercel supplies the production hostname during its build; no secret is needed.
const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (deploymentHost) {
  const siteUrl = new URL(`https://${deploymentHost}`).origin;
  html = html.replaceAll('content="/assets/social-preview.png"', `content="${siteUrl}/assets/social-preview.png"`);
  html = html.replace('</head>', `<meta property="og:url" content="${siteUrl}/">\n<link rel="canonical" href="${siteUrl}/">\n</head>`);
}
await writeFile('dist/index.html', html);
console.log('Built static site in dist/');
