const {chromium}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html';
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await(await browser.newContext()).newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE);await page.selectOption('#language','zh');await page.waitForTimeout(300);
  await page.click('[data-act="begin"]');
  await page.click('[data-act="select"][data-id="su"]');await page.click('[data-act="start"]');await page.waitForTimeout(300);

  // 1) 记录卡里不得有重复 id
  await page.click('.hotspot[data-id="0"]');await page.waitForTimeout(250);
  const dup=await page.evaluate(()=>{const ids={};let bad=0;document.querySelectorAll('[id]').forEach(n=>{ids[n.id]=(ids[n.id]||0)+1;});for(const k in ids)if(ids[k]>1)bad++;return bad;});
  assert.equal(dup,0,'duplicate element ids present');

  // 2) 打开记录卡后，焦点应落在卡内按钮上
  const focusInCard=await page.evaluate(()=>{const a=document.activeElement;return !!a&&!!a.closest('#document');});
  assert.equal(focusInCard,true,'focus did not move into the record card');

  // 3) 右方向键翻到下一份
  const before=await page.evaluate(()=>document.querySelector('.reader-no').textContent);
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);
  const after=await page.evaluate(()=>document.querySelector('.reader-no').textContent);
  assert.notEqual(before,after,'ArrowRight did not turn the page');

  // 4) 左方向键翻回去
  await page.keyboard.press('ArrowLeft');await page.waitForTimeout(250);
  const back=await page.evaluate(()=>document.querySelector('.reader-no').textContent);
  assert.equal(back,before,'ArrowLeft did not turn the page back');

  // 5) Esc 收好记录卡
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>!!document.getElementById('document')),false,'Escape did not close the record card');

  // 6) 幕间卡：带地点、是模态、可按 Enter 关闭
  await page.evaluate(()=>{const r=LIFE.state.runs.su;r.act=0;r.read=[0,1,2];r.investigationDone=true;r.searchDone=true;r.solved=true;r.history=[{choice:0,rested:false,searched:true}];LIFE.render();});
  await page.evaluate(()=>LIFE.actions.next());
  await page.waitForSelector('.act-card',{timeout:6000}).catch(()=>{});
  await page.waitForTimeout(500);
  const cardInfo=await page.evaluate(()=>{const c=document.querySelector('.act-card');return c?{place:c.querySelector('.act-card-place')?.textContent||'',modal:c.getAttribute('aria-modal'),tab:c.tabIndex}:null;});
  assert.ok(cardInfo,'act card missing');
  assert.ok(cardInfo.place.length>0,'act card shows no location');
  assert.equal(cardInfo.modal,'true','act card is not a modal');
  await page.keyboard.press('Enter');await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>!!document.querySelector('.act-card')),false,'Enter did not dismiss the act card');

  // 7) Tab 在记录卡内循环（aria-modal 要求）
  await page.evaluate(()=>{const r=LIFE.state.runs.su;r.act=0;r.solved=false;r.history=[];LIFE.render();});
  await page.click('.hotspot[data-id="0"]');await page.waitForTimeout(250);
  const trapped=await page.evaluate(()=>{const btns=[...document.querySelectorAll('#document button')];btns[btns.length-1].focus();return document.activeElement===btns[btns.length-1];});
  assert.equal(trapped,true,'could not focus last button in card');
  await page.keyboard.press('Tab');
  const cycled=await page.evaluate(()=>{const a=document.activeElement;return !!a&&!!a.closest('#document');});
  assert.equal(cycled,true,'Tab escaped the record card');

  console.log('ok keyboard, duplicate ids, focus management and act-card location');
  assert.deepEqual(errors,[]);
  console.log('no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
