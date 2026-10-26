import { mkdir, writeFile, copyFile, cp } from 'node:fs/promises';
import { pages } from './pages.mjs';

const base = 'https://jxewonkim.github.io/inhwa-support/';
// 페이지 언어별 문구와 링크만 사용해 영어 메뉴에서 한국어 페이지로 넘어가지 않게 한다.
const locales = {
  ko: {
    home: 'index.html', homeLabel: 'INHWA 안내 홈', navLabel: '주요 메뉴',
    skip: '본문으로 건너뛰기', operator: 'INHWA(인화) · 운영 SCIJERRY', contact: '문의 · 개인정보 보호 담당:',
    nav: [['index.html','안내'],['support.html','고객지원'],['privacy.html','개인정보처리방침'],['terms.html','이용약관']]
  },
  en: {
    home: 'support-en.html', homeLabel: 'INHWA support home', navLabel: 'Main navigation',
    skip: 'Skip to content', operator: 'INHWA · Operated by SCIJERRY', contact: 'Support and privacy contact:',
    nav: [['support-en.html','Support'],['privacy-en.html','Privacy Policy'],['terms-en.html','Terms of Use']]
  }
};
await mkdir('docs', { recursive: true });
for (const page of pages) {
  // 각 페이지의 언어 설정을 꺼내 공통 HTML 틀의 언어와 메뉴에 적용한다.
  const locale = locales[page.locale];
  const document = `<!doctype html>
<html lang="${page.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${page.title} | INHWA · SCIJERRY</title><meta name="description" content="${page.description}"><link rel="canonical" href="${base}${page.file === 'index.html' ? '' : page.file}"><link rel="stylesheet" href="styles.css"><link rel="icon" href="assets/companion.png"></head>
<body><a class="skip" href="#main">${locale.skip}</a><header><div class="wrap header-row"><a class="brand" href="${locale.home}" aria-label="${locale.homeLabel}"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>INHWA</a><nav aria-label="${locale.navLabel}">${locale.nav.map(([file,label])=>`<a href="${file}"${file === page.file ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></div></header>
<main id="main" class="wrap ${page.file === 'index.html' ? '' : 'legal'}"><div class="page-heading"><h1><span>${page.title}</span></h1><img class="companion" src="assets/companion.png" alt="" width="112" height="112"></div>${page.body}</main>
<footer><div class="wrap"><p>${locale.operator}</p><p>${locale.contact} <a href="mailto:scijerry.official@gmail.com">scijerry.official@gmail.com</a></p><p>© 2026 SCIJERRY</p></div></footer></body></html>\n`;
  await writeFile(`docs/${page.file}`, document);
}
await copyFile('styles.css', 'docs/styles.css');
await cp('assets', 'docs/assets', { recursive: true });
await writeFile('docs/.nojekyll', '');
console.log(`Built ${pages.length} static pages. No dependencies, tracking scripts or external assets.`);
