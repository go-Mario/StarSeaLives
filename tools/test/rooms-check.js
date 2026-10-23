const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/rooms');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();
 await page.goto(BASE);await page.selectOption('#language','zh');await page.waitForTimeout(300);
 await page.click('[data-act="begin"]');await page.waitForTimeout(250);
 for(const role of ['lin','su','xu','jian']){
  await page.click('[data-act="select"][data-id="'+role+'"]');
  await page.click('[data-act="start"]');await page.waitForTimeout(350);
  await page.screenshot({path:path.join(OUT,'room-'+role+'.png'),clip:await page.locator('.scene').boundingBox()});
  await page.click('[data-act="home"]');await page.waitForTimeout(150);
 }
 console.log('room shots ready');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});