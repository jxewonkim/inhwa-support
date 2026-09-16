import { mkdir, writeFile, copyFile, cp } from 'node:fs/promises';
import { pages } from './pages.mjs';

const base = 'https://jxewonkim.github.io/inhwa-support/';
const nav = [['index.html','안내'],['support.html','고객지원'],['privacy.html','개인정보처리방침'],['terms.html','이용약관']];
await mkdir('docs', { recursive: true });
for (const page of pages) {
  const document = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${page.title} | INHWA · SCIJERRY</title><meta name="description" content="${page.description}"><link rel="canonical" href="${base}${page.file === 'index.html' ? '' : page.file}"><link rel="stylesheet" href="styles.css"><link rel="icon" href="assets/companion.png"></head>
<body><a class="skip" href="#main">본문으로 건너뛰기</a><header><div class="wrap header-row"><a class="brand" href="index.html" aria-label="INHWA 안내 홈"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>INHWA</a><nav aria-label="주요 메뉴">${nav.map(([file,label])=>`<a href="${file}"${file === page.file ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></div></header>
<main id="main" class="wrap ${page.file === 'index.html' ? '' : 'legal'}"><div class="page-heading"><h1><span>${page.title}</span></h1><img class="companion" src="assets/companion.png" alt="" width="112" height="112"></div>${page.body}</main>
<footer><div class="wrap"><p>INHWA(인화) · 운영 SCIJERRY</p><p>문의 · 개인정보 보호 담당: <a href="mailto:scijerry.oiffcial@gmail.com">scijerry.oiffcial@gmail.com</a></p><p>© 2026 SCIJERRY</p></div></footer></body></html>\n`;
  await writeFile(`docs/${page.file}`, document);
}
await copyFile('styles.css', 'docs/styles.css');
await cp('assets', 'docs/assets', { recursive: true });
await writeFile('docs/.nojekyll', '');
console.log(`Built ${pages.length} static pages. No dependencies, tracking scripts or external assets.`);
