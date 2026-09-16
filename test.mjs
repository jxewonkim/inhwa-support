import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { pages } from './pages.mjs';

test('네 페이지 모두 한국어·모바일·본문·현재 메뉴·운영 연락처를 제공한다', async () => {
  assert.equal(pages.length,4);
  for (const page of pages) {
    const html = await readFile(`docs/${page.file}`, 'utf8');
    assert.ok(!html.includes('jxewon.kim@gmail.com'), `${page.file}: old support email`);
    for (const token of ['lang="ko"','name="viewport"','id="main"','aria-current="page"','SCIJERRY','mailto:scijerry.oiffcial@gmail.com']) assert.ok(html.includes(token), `${page.file}: ${token}`);
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
  assert.deepEqual((await readdir('docs')).sort(),['.nojekyll','index.html','privacy.html','styles.css','support.html','terms.html']);
  for(const file of await readdir('docs')) {
    const data = await readFile(`docs/${file}`,'utf8');
    assert.ok(!/BEGIN .*PRIVATE KEY|supabase\.co(?:[/:"\s]|$)|eyJ[a-zA-Z0-9_-]{25}|\/Users\//.test(data),file);
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
