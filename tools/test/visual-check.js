const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/visual');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 for(const [language,width,height] of [['zh',1365,900],['en',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage();
  await page.goto(BASE);await page.selectOption('#language',language);
  // reducedMotion:reduce disables entrance animations so we see the settled layout
  await page.waitForTimeout(400);
  await page.screenshot({path:path.join(OUT,language+'-1-cover.png'),fullPage:true});
  await page.click('[data-act="begin"]');await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,language+'-2-home.png'),fullPage:true});
  await page.click('[data-act="select"][data-id="su"]');await page.waitForTimeout(200);
  await page.screenshot({path:path.join(OUT,language+'-3-select.png'),fullPage:true});
  await page.click('[data-act="start"]');await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,language+'-4-scene.png'),fullPage:true});
  await page.click('.hotspot[data-id="0"]');await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,language+'-5-reader.png'),fullPage:false});
  await page.click('[data-act="nextDoc"]');await page.waitForTimeout(200);
  await page.screenshot({path:path.join(OUT,language+'-6-reader2.png'),fullPage:false});
  await page.click('.reader-foot [data-act="closeDoc"]');await page.waitForTimeout(200);
  await page.click('.hotspot[data-id="2"]');await page.waitForTimeout(150);await page.click('.reader-foot [data-act="closeDoc"]');
  await page.click('[data-act="dispatchMeal"][data-id="allergy"]');await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,language+'-7-archive.png'),fullPage:true});
  await page.locator('#archiveQuery').fill(language==='zh'?'十三':'thirteen');await page.click('[data-act="searchRecord"]');await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,language+'-8-found.png'),fullPage:true});
  await ctx.close();
 }
 console.log('visual shots ready in',OUT);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});