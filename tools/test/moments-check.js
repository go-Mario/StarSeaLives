const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/moments');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1365,height:900}}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE);await page.selectOption('#language','zh');await page.waitForTimeout(400);
 await page.click('[data-act="begin"]');
 await page.click('[data-act="select"][data-id="lin"]');await page.click('[data-act="start"]');await page.waitForTimeout(500);
 // 推断面板（材料齐了但还没推断时的样子）
 await page.evaluate(()=>{const r=LIFE.state.runs.lin;r.read=[0,1,2];r.investigationDone=true;r.searchDone=true;LIFE.render();});
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(OUT,'deduce-panel.png'),fullPage:true});
 // 推断正确：盖章（在 1150ms 窗口内截图）
 await page.click('[data-act="deduce"][data-id="0"]');await page.waitForTimeout(450);
 await page.screenshot({path:path.join(OUT,'deduce-right.png'),fullPage:true});
 // 推断错误：抖动
 await page.evaluate(()=>{LIFE.state.runs.lin.solved=false;LIFE.render();});
 await page.click('[data-act="deduce"][data-id="1"]');await page.waitForTimeout(200);
 await page.screenshot({path:path.join(OUT,'deduce-wrong.png'),fullPage:true});
 // 幕间转场卡：走正常流程（选择 -> next）
 await page.evaluate(()=>{LIFE.state.runs.lin.solved=false;LIFE.render();});
 await page.click('[data-act="deduce"][data-id="0"]');
 await page.waitForTimeout(1300);
 await page.click('[data-act="choose"][data-id="0"]');
 await page.waitForTimeout(300);
 await page.click('[data-act="next"]');
 await page.waitForSelector('.act-card',{timeout:6000}).catch(()=>{});
 await page.waitForTimeout(600);
 await page.screenshot({path:path.join(OUT,'act-card.png')});
 console.log('moment shots ready, errors:',errors.length?errors:'none');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});