// Browser regression checks. Tooling is development-only; the app has no dependencies.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const {pathToFileURL} = require('url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || process.env.TEMP + '/how-often-test-tools/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const source = fs.readFileSync(path.join(root, 'games/game1_frequency_machine.html'), 'utf8');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'game1-design-baseline.json')));
assert.equal(hash(source.match(/<style>([\s\S]*?)<\/style>/)[1].split('\n/* Larger shoulder portraits;')[0]), baseline.originalStyle);
assert.equal(hash(Buffer.from(source.match(/background:url\("data:image\/png;base64,([^"\)]+)/)[1], 'base64')), baseline.background);
const subjects = ['Alice', 'Sam', 'Alice and Sam', 'WE', 'I'];
const activities = ['clean teeth','read a book','ride a bike','feed the fish','have a shower','eat burgers','play basketball','play computer games'];
const frequencies = ['always','usually','often','sometimes','rarely','never','once a week','twice a week','every day'];
const errors = [], external = [];
function track(page) {
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
  page.on('request', r => {if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:')) external.push(r.url());});
  page.on('response', r => {if(r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url());});
}
async function layout(page) {
  const issues = await page.evaluate(() => {
    const issues = [], rect = el => el.getBoundingClientRect();
    const overlap = (a,b) => a.left < b.right-.1 && a.right > b.left+.1 && a.top < b.bottom-.1 && a.bottom > b.top+.1;
    if (document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth) issues.push('Page overflow');
    if ([...document.querySelectorAll('.screen')].filter(el => !el.hidden).length !== 1) issues.push('Multiple screens');
    const app = rect(document.querySelector('#app'));
    if (app.left < -.1 || app.top < -.1 || app.right > innerWidth+.1 || app.bottom > innerHeight+.1) issues.push('App outside viewport');
    if (!document.querySelector('#game2').hidden) {
      const panel = rect(document.querySelector('#language-panel'));
      for (const mount of document.querySelectorAll('.wheel-mount')) {
        const m = rect(mount), s = rect(mount.querySelector('svg'));
        if(s.left < m.left-.1 || s.right > m.right+.1 || s.top < m.top-.1 || s.bottom > m.bottom+.1) issues.push('Wheel outside frame');
        if(overlap(s,panel)) issues.push('Panel overlaps wheel');
      }
      for (const selector of ['#language-panel','#round-hint','.round-controls']) {
        const r = rect(document.querySelector(selector));
        if(r.bottom > innerHeight+.1 || r.top < 0) issues.push(selector+' outside viewport');
      }
      const labels = [...document.querySelectorAll('#frequency-wheel text')].map(rect);
      for(let i=0;i<labels.length;i++) for(let j=i+1;j<labels.length;j++) if(overlap(labels[i],labels[j])) issues.push('Frequency overlap');
      for(const el of document.querySelectorAll('#language-panel p')) if(rect(el).bottom > panel.bottom-3) issues.push('Text clipped');
    }
    return issues;
  });
  assert.deepEqual(issues, []);
}
async function geometry(page) {
  const issues = await page.evaluate(() => {
    const issues=[];
    for (const type of ['who','activity','frequency']) {
      const groups=[...document.querySelectorAll(`#${type}-wheel [data-item]`)];
      const radius=type==='who'?103:113, clearance=Math.min(radius*Math.sin(Math.PI/groups.length),161-radius);
      groups.forEach(group => group.querySelectorAll('image,tspan').forEach(el => {
        const b=el.getBBox();
        for(const x of [b.x,b.x+b.width]) for(const y of [b.y,b.y+b.height])
          if(Math.hypot(x,y)>clearance+.01) issues.push(`${type}/${group.dataset.item}: ${Math.hypot(x,y)} > ${clearance}`);
      }));
    }
    return issues;
  });
  assert.deepEqual(issues, []);
}
async function round(page,p,a,f) {
  await page.evaluate(async ({p,a,f}) => {
    const queue=[(p+.1)/5,(a+.1)/8,(f+.1)/9], original=Math.random;
    Math.random=()=>queue.shift();
    const $=s=>document.querySelector(s);
    const wait=async()=>{for(let i=0;i<100;i++){if(!$('#spin-pair').disabled)return;await new Promise(r=>setTimeout(r,5));}throw Error('Spin did not finish');};
    try {
      $('#spin-pair').click();
      if(!$('#spin-pair').disabled || !$('#spin-frequency').disabled) throw Error('Spins not locked');
      await wait();
      if($('#question-text').textContent.startsWith('How often ')) throw Error('Question revealed automatically');
      if($('#show-question').disabled || !$('#show-answer').disabled) throw Error('Reveal button availability');
      $('#show-question').click();
      if(!$('#question-text').textContent.startsWith('How often ')) throw Error('Question not revealed on click');
      if($('#answer-text').textContent.endsWith('week.')) throw Error('Stale answer');
      $('#spin-frequency').click();
      if(!$('#show-answer').disabled) throw Error('Answer available during spin');
      await wait();
      if(!$('#answer-text').textContent.includes('press SHOW ANSWER')) throw Error('Answer revealed automatically');
      if($('#show-answer').disabled) throw Error('Reveal answer is disabled');
      $('#show-answer').click();
    } finally {Math.random=original;}
  },{p,a,f});
  const subject=['Alice','Sam','Alice and Sam','We','I'][p], qSubject=p===3?'we':subject, poss=['her','his','their','our','my'][p];
  const base=[`clean ${poss} teeth`,'read a book','ride a bike','feed the fish','have a shower','eat burgers','play basketball','play computer games'];
  const third=[`cleans ${poss} teeth`,'reads a book','rides a bike','feeds the fish','has a shower','eats burgers','plays basketball','plays computer games'];
  const phrase=p<2?third[a]:base[a], freq=frequencies[f];
  assert.equal(await page.locator('#question-text').textContent(),`How often ${p<2?'does':'do'} ${qSubject} ${base[a]}?`);
  assert.equal(await page.locator('#answer-text').textContent(),f<6?`${subject} ${freq} ${phrase}.`:`${subject} ${phrase} ${freq}.`);
  const distances=await page.evaluate(({p,a,f}) => ['who','activity','frequency'].map((type,i)=> {
    const g=document.querySelectorAll(`#${type}-wheel [data-item]`)[[p,a,f][i]], svg=g.ownerSVGElement;
    const centre=new DOMPoint(0,0).matrixTransform(g.getCTM());
    const top=new DOMPoint(190,190-(type==='who'?103:113)).matrixTransform(svg.getCTM());
    return Math.hypot(centre.x-top.x,centre.y-top.y);
  }),{p,a,f});
  distances.forEach(n=>assert.ok(n<.02,'Pointer alignment '+n));
  await layout(page);
}
async function game1Grammar(frame) {
  const rows=await frame.evaluate(async()=> {
    const saved=cur,rows=[];
    for(let p=0;p<people.length;p++) for(let a=0;a<acts.length;a++) for(let f=0;f<freqs.length;f++) {
      cur={p:people[p],a:acts[a],f:freqs[f]};
      rows.push({p,a,f:freqs[f],text:sentence()});
    }
    for(const p of people) if(p.img){const img=new Image();img.src=p.img;await img.decode();}
    for(const a of acts){const img=new Image();img.src=a.img;await img.decode();}
    cur=saved;render();
    return rows;
  });
  assert.equal(rows.length,630);
  for(const {p,a,f,text} of rows) {
    const subject=['Alice','Sam','Alice and Sam','We','I'][p],poss=['her','his','their','our','my'][p];
    const base=[`clean ${poss} teeth`,'get up late','go swimming','feed the fish','have a shower','eat burgers','play basketball','play computer games','read a book','ride a bike','play football','listen to music','play the piano','do homework'];
    const third=[`cleans ${poss} teeth`,'gets up late','goes swimming','feeds the fish','has a shower','eats burgers','plays basketball','plays computer games','reads a book','rides a bike','plays football','listens to music','plays the piano','does homework'];
    const phrase=p<2?third[a]:base[a];
    assert.equal(text,['always','usually','often','sometimes','rarely','never'].includes(f)?`${subject} ${f} ${phrase}.`:`${subject} ${phrase} ${f}.`);
  }
}
(async()=> {
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    for(const viewport of [{width:1366,height:768},{width:1920,height:1080}]) {
      const page=await browser.newPage({viewport});track(page);
      await page.goto(pathToFileURL(path.join(root,'index.html')).href);await layout(page);
      assert.equal(await page.locator('#home').innerText().then(s=>s.includes('Present Simple Games')),false);
      await page.screenshot({path:path.join(__dirname,`home-v4-${viewport.width}.png`)});
      await page.locator('.card-one').click();
      const frame=page.frames().find(f=>f.url().includes('game1_frequency_machine')) || await new Promise(resolve=>page.on('framenavigated',f=>{if(f.url().includes('game1_frequency_machine'))resolve(f);}));
      await frame.locator('#who img').waitFor();
      if(viewport.width===1366){await game1Grammar(frame);console.log('PASS: Game 1 all 630 sentences, 14 activities, all portrait/activity images loaded');}
      await frame.locator('#spin').click();assert.equal(await frame.locator('#show').isDisabled(),true);await page.waitForTimeout(1450);await frame.locator('#show').click();assert.match(await frame.locator('#display').textContent(),/\.$/);
      await frame.evaluate(()=>{cur={p:people[4],a:acts[1],f:'usually'};render();document.querySelector('#show').click();});
      await page.screenshot({path:path.join(__dirname,`game1-v4-${viewport.width}.png`)});await layout(page);
      const clockOffset=await frame.evaluate(()=>{
        const r=document.querySelector('#act img').getBoundingClientRect(), box=document.querySelector('#act .inner').getBoundingClientRect();
        return [Math.abs(r.left+r.width*382.5/1536-(box.left+box.width/2)),Math.abs(r.top+r.height*448.5/1024-(box.top+box.height/2))];
      });
      clockOffset.forEach(n=>assert.ok(n<2,'Clock is not visually centred: '+n));
      const saved=await frame.locator('#display').textContent();
      await page.locator('.navigation [data-screen=home]').click();await page.locator('.card-two').click();
      assert.equal(await page.locator('.round-controls button').count(),2);
      assert.equal(await page.locator('#who-result,#activity-result,#frequency-result').count(),0);
      const activityBox=await page.locator('#activity-wheel').boundingBox(),whoBox=await page.locator('#who-wheel').boundingBox();
      assert.ok(activityBox.width/whoBox.width>1.29);
      assert.equal(await page.locator('#activity-wheel text').count(),0);
      assert.equal(await page.locator('#spin-frequency').isDisabled(),true);
      assert.deepEqual(await page.locator('#who-wheel [data-item]').evaluateAll(es=>es.map(e=>e.dataset.item)),subjects);
      assert.deepEqual(await page.locator('#activity-wheel [data-item]').evaluateAll(es=>es.map(e=>e.dataset.item)),activities);
      assert.deepEqual(await page.locator('#frequency-wheel [data-item]').evaluateAll(es=>es.map(e=>e.dataset.item)),frequencies);
      assert.deepEqual(await page.locator('#who-wheel image').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['alice','sam','pair'].map(x=>`assets/generated/${x}-portrait.png`));
      await layout(page);await geometry(page);
      await page.screenshot({path:path.join(__dirname,`game2-v4-${viewport.width}.png`)});
      await page.emulateMedia({reducedMotion:'reduce'});await round(page,4,2,7);
      await page.screenshot({path:path.join(__dirname,`answer-v4-${viewport.width}.png`)});
      await page.locator('.navigation [data-screen=game1]').click();assert.equal(await frame.locator('#display').textContent(),saved);
      await page.locator('.navigation [data-screen=game2]').click();assert.equal(await page.locator('#answer-text').textContent(),'I ride a bike twice a week.');
      if(viewport.width===1366) {
        for(let p=0;p<5;p++) {
          for(let a=0;a<8;a++) for(let f=0;f<9;f++) await round(page,p,a,f);
          console.log('PASS: Game 2 grammar / two spins / pointers / layout for '+subjects[p]);
        }
      }
      // Same subject/activity can receive a different frequency without starting over.
      const oldQuestion=await page.locator('#question-text').textContent();
      await page.locator('#spin-frequency').click();await page.waitForFunction(()=>!document.querySelector('#spin-pair').disabled);
      assert.equal(await page.locator('#show-answer').getAttribute('aria-expanded'),'false');
      assert.match(await page.locator('#answer-text').textContent(),/press SHOW ANSWER/);
      assert.equal(await page.locator('#question-text').textContent(),oldQuestion);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.locator('#spin-pair').click();await page.waitForTimeout(500);await layout(page);
      await page.locator('.navigation [data-screen=home]').click();await page.waitForTimeout(1400);await page.locator('.navigation [data-screen=game2]').click();
      assert.equal(await page.locator('#spin-frequency').isEnabled(),true);
      await page.locator('#spin-frequency').click();await page.waitForTimeout(1800);await layout(page);
      await page.locator('.navigation [data-screen=home]').click();await page.locator('.card-two').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('#game2').hidden);
      await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.locator('#fullscreen').click();await page.waitForFunction(()=>!document.fullscreenElement);
      console.log(`PASS: ${viewport.width}x${viewport.height} file://, navigation, full screen, keyboard, normal animation, geometry, no scrolling`);
      await page.close();
    }
    const server=http.createServer((req,res)=> {
      const decoded=decodeURIComponent(req.url.split('?')[0]);
      const target=path.join(root,decoded.replace(/^\/demo-project\//,''));
      try {
        res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(target)]||'application/octet-stream');
        res.end(fs.readFileSync(target));
      } catch {res.writeHead(404);res.end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});track(page);
      await page.goto(`http://127.0.0.1:${server.address().port}/demo-project/index.html#game2`);await round(page,4,0,0);
      await page.locator('.navigation [data-screen=game1]').click();await page.frameLocator('#game1-frame').locator('#show').click();
      await page.locator('.navigation [data-screen=home]').click();await layout(page);await page.close();
      console.log('PASS: GitHub Pages-style subdirectory, direct link, local generated assets');
    } finally {server.close();}
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS: no JS errors, failed assets or external requests. Game 1 original design/background unchanged.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
