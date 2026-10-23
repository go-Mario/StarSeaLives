const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/acts');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE);await page.selectOption('#language','zh');await page.waitForTimeout(400);
 await page.click('[data-act="begin"]');
 await page.click('[data-act="select"][data-id="su"]');await page.click('[data-act="start"]');await page.waitForTimeout(400);
 for(let act=0;act<6;act++){
  await page.evaluate(a=>{const r=LIFE.state.runs.su;r.act=a;r.read=[0,1,2];r.investigationDone=true;r.searchDone=true;r.solved=false;r.history=[];for(let i=0;i<a;i++)r.history.push({choice:i%2,searched:true,rested:false});LIFE.render();},act);
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(OUT,'act'+act+'.png'),clip:await page.locator('.scene').boundingBox()});
 }
 // 校验：场景必须完整渲染（含 caption 与浮尘），证明 return 未被截断
 const ok=await page.evaluate(()=>{const s=document.querySelector('.scene');return !!s&&!!s.querySelector('.scene-caption')&&s.querySelectorAll('circle').length>20;});
 console.log('scene complete:',ok,'| page errors:',errors.length?errors:'none');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});