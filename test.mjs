import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { pages } from './pages.mjs';

test('일곱 페이지 모두 문서 언어·모바일·본문·현재 메뉴·운영 연락처를 제공한다', async () => {
  assert.equal(pages.length,7);
  // 각 페이지의 locale이 실제 HTML 언어에도 적용되는지 함께 확인한다.
  for (const page of pages) {
    const html = await readFile(`docs/${page.file}`, 'utf8');
    assert.ok(!html.includes('jxewon.kim@gmail.com'), `${page.file}: old support email`);
    for (const token of [`lang="${page.locale}"`,'name="viewport"','id="main"','aria-current="page"','SCIJERRY','mailto:scijerry.official@gmail.com']) assert.ok(html.includes(token), `${page.file}: ${token}`);
    assert.equal([...html.matchAll(/<h1>/g)].length,1);
    assert.ok(!/<script|<iframe|<form|TODO|\[HTTPS|출시 책임자 확정/i.test(html));
  }
});
test('모든 내부 링크·스타일·앵커가 존재한다', async () => {
  for (const page of pages) {
    const html = await readFile(`docs/${page.file}`, 'utf8');
    for (const [,link] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(https:|mailto:)/.test(link)) continue;
      const [file, fragment] = link.split('#');
      await access(`docs/${file || page.file}`);
      if (fragment) assert.ok((await readFile(`docs/${file || page.file}`,'utf8')).includes(`id="${fragment}"`),link);
    }
  }
});
test('공개 산출물은 안내 HTML과 스타일만 포함한다',async()=>{
  assert.deepEqual((await readdir('docs')).sort(),['.nojekyll','assets','index.html','privacy-en.html','privacy.html','styles.css','support-en.html','support.html','terms-en.html','terms.html']);
  assert.deepEqual((await readdir('docs/assets')).sort(), ['Gaegu-OFL.txt','Gaegu-Regular.ttf','companion.png']);
  for(const file of await readdir('docs')) {
    if (file === 'assets') continue;
    const data = await readFile(`docs/${file}`,'utf8');
    assert.ok(!/BEGIN .*PRIVATE KEY|supabase\.co(?:[/:"\s]|$)|eyJ[a-zA-Z0-9_-]{25}|\/Users\//.test(data),file);
  }
});
test('인화 팔레트와 로컬 캐릭터·손글씨 자산을 사용한다', async () => {
  const css = await readFile('docs/styles.css', 'utf8');
  for (const hex of ['#F4F4F4', '#FFF5D6', '#BDD4E1', '#B3B4B6']) assert.ok(css.includes(hex));
  for (const page of pages) {
    const html = await readFile(`docs/${page.file}`, 'utf8');
    assert.ok(html.includes('class="companion"'));
    assert.ok(!html.includes('class="eyebrow"'));
  }
});
test('삭제 범위와 미구현 신고 기능을 과장하지 않는다', async()=>{
  const privacy=await readFile('docs/privacy.html','utf8');
  const support=await readFile('docs/support.html','utf8');
  assert.ok(privacy.includes('30일'));
  assert.ok(privacy.includes('스페이스 나가기'));
  assert.ok(privacy.includes('종단간 암호화 서비스라는 뜻은 아닙니다'));
  assert.ok(support.includes('자동 숨김이나 사용자 차단을 실행하는 기능은 아닙니다'));
});

test('영어 페이지는 영어 메뉴·접근성 문구·정규 URL로 서로 연결된다', async () => {
  // 한국어 홈을 새로 번역하지 않고 요청된 세 영어 페이지 안에서 이동한다.
  const englishFiles = ['privacy-en.html','support-en.html','terms-en.html'];
  assert.deepEqual(pages.filter(page => page.locale === 'en').map(page => page.file).sort(), englishFiles);
  for (const file of englishFiles) {
    const html = await readFile(`docs/${file}`, 'utf8');
    assert.ok(html.includes('<html lang="en">'),file);
    assert.ok(html.includes(`<link rel="canonical" href="https://jxewonkim.github.io/inhwa-support/${file}">`),file);
    assert.ok(html.includes('Skip to content'),file);
    assert.ok(html.includes('aria-label="Main navigation"'),file);
    assert.ok(html.includes('Support and privacy contact:'),file);
    assert.ok(!/[가-힣]/.test(html),`${file}: untranslated Korean`);
    for (const target of englishFiles) assert.ok(html.includes(`href="${target}"`),`${file}: ${target}`);
    assert.ok(!/href="(?:index|support|privacy|terms)\.html(?:#|")/.test(html),`${file}: Korean page link`);
  }
});
test('영어 번역은 한국어 원문의 모든 문단·목록·섹션·외부 링크를 유지한다', () => {
  // 태그의 순서와 앵커를 비교해 약관이나 FAQ 일부만 번역하는 회귀를 막는다.
  for (const name of ['privacy','terms','support']) {
    const original = pages.find(page => page.file === `${name}.html`);
    const translated = pages.find(page => page.file === `${name}-en.html`);
    assert.ok(translated,`${name}: English translation`);
    assert.equal(original.locale,'ko');
    assert.equal(translated.locale,'en');
    assert.deepEqual(translated.body.match(/<\/?[a-z][a-z0-9]*/gi),original.body.match(/<\/?[a-z][a-z0-9]*/gi),name);
    assert.deepEqual([...translated.body.matchAll(/id="([^"]+)"/g)].map(match => match[1]),[...original.body.matchAll(/id="([^"]+)"/g)].map(match => match[1]),name);
    assert.deepEqual([...translated.body.matchAll(/href="(https:[^"]+)"/g)].map(match => match[1]),[...original.body.matchAll(/href="(https:[^"]+)"/g)].map(match => match[1]),name);
  }
});
test('영어 법적 안내도 삭제·신고·국외 처리·이용자 권리의 제한을 유지한다', async () => {
  const privacy = await readFile('docs/privacy-en.html','utf8');
  const terms = await readFile('docs/terms-en.html','utf8');
  const support = await readFile('docs/support-en.html','utf8');
  // 삭제 영수증, 국외 처리, 법적 책임과 이메일 신고의 범위를 축약하지 않는다.
  for (const token of ['30 days','Before acknowledgment','minimum identifiers','outside Korea','end-to-end encryption','legal representative','without consent','Separate consent']) assert.ok(privacy.includes(token),token);
  for (const token of ['original rights holder','advertising','gross negligence','Email reports alone do not','blocking is different from removing']) assert.ok(terms.includes(token),token);
  for (const token of ['active invitation codes','cannot be recovered','does not automatically hide content or block users','request a review','police']) assert.ok(support.includes(token),token);
});
test('한국어와 영어 개인정보의 외부 서비스 절에 카카오 검색 전달·미저장을 명시한다', async () => {
  // 약 1km 단위의 위치와 검색어를 전달한다는 문구는 요청된 한국어 그대로 둔다.
  const disclosures = [
    ['privacy.html','장소를 검색하면 검색어와 대략적인 위치(약 1km 단위)가 검색 결과를 받기 위해 카카오(카카오맵 로컬 API)로 전달되며, 인화는 이를 저장하지 않습니다.'],
    ['privacy-en.html','When you search for a place, your search term and approximate location (in units of about 1 km) are sent to Kakao (KakaoMap Local API) to receive search results, and INHWA does not store them.']
  ];
  for (const [file,disclosure] of disclosures) {
    const html = await readFile(`docs/${file}`,'utf8');
    const providers = html.match(/<section id="providers">([\s\S]*?)<\/section>/);
    assert.ok(providers,`${file}: providers section`);
    assert.ok(providers[1].includes(disclosure),`${file}: Kakao disclosure`);
  }
});
