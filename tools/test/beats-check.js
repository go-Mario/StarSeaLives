// Captures the dramatic beats of the game at desktop size so they can be eyeballed.
const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/beats');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();
 await page.goto(BASE);await page.selectOption('#language','en');
 await page.click('[data-act="begin"]');
 await page.click('[data-act="select"][data-id="lin"]');await page.click('[data-act="start"]');
 await page.waitForTimeout(300);
 // The chapter card that opens the act.
 await page.screenshot({path:path.join(OUT,'a-act-card.png'),fullPage:true});
 // The first conclusion round: wrong answer, then the right one, then the stamp.
 const roleIdx=0,act=0;
 const correct=(3-((act+roleIdx)%3))%3;
 // Finish the investigation the way the game expects: read two records, run the
 // role task, then search the archive.
 await page.click('.hotspot[data-id="0"]');await page.click('[data-act="nextDoc"]');await page.click('[data-act="nextDoc"]');await page.click('.reader-foot [data-act="closeDoc"]');
 await page.click('.hotspot[data-id="2"]');await page.click('.reader-foot [data-act="closeDoc"]');
 await page.locator('#clockShift').fill('84');await page.click('[data-act="alignClock"]');
 await page.locator('#archiveQuery').fill('M-13');await page.click('[data-act="searchRecord"]');
 await page.waitForTimeout(300);
 await page.screenshot({path:path.join(OUT,'b-investigation.png'),fullPage:true});
 await page.click('[data-act="deduce"][data-id="'+((correct+1)%3)+'"]');
 await page.waitForTimeout(400);
 await page.screenshot({path:path.join(OUT,'b-wrong.png'),fullPage:true});
 await page.click('[data-act="deduce"][data-id="'+correct+'"]');
 await page.waitForTimeout(600);
 await page.screenshot({path:path.join(OUT,'c-right.png'),fullPage:true});
 // The chapter card that closes the act.
 await page.click('[data-act="choose"][data-id="0"]');
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(OUT,'d-act-end.png'),fullPage:true});
 await ctx.close();
 console.log('beat shots ready in',OUT);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
