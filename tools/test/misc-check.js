const {chromium}=require('playwright'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html',OUT=path.join(__dirname,'out/misc');
(async()=>{require('node:fs').mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
try{
 const ctx=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE);await page.selectOption('#language','zh');await page.waitForTimeout(300);
 await page.click('[data-act="begin"]');
 await page.click('[data-act="select"][data-id="su"]');await page.click('[data-act="start"]');await page.waitForTimeout(300);
 // 记录卡
 await page.click('.hotspot[data-id="0"]');await page.waitForTimeout(350);
 await page.screenshot({path:path.join(OUT,'reader.png')});
 await page.click('.reader-foot [data-act="closeDoc"]');await page.waitForTimeout(200);
 // 休息舱主页 + 翻牌
 await page.click('[data-act="rest"]');await page.waitForTimeout(300);
 await page.screenshot({path:path.join(OUT,'rest.png'),fullPage:true});
 await page.click('[data-act="restGame"][data-id="memory"]');await page.waitForTimeout(300);
 await page.screenshot({path:path.join(OUT,'memory.png'),fullPage:true});
 await page.click('[data-act="rest"]');await page.click('[data-act="restGame"][data-id="breathe"]');await page.waitForTimeout(400);
 await page.screenshot({path:path.join(OUT,'breathe.png'),fullPage:true});
 await page.click('[data-act="rest"]');
 // 手记（需先回到游戏界面，侧栏里才有入口）
 await page.click('[data-act="resume"]');await page.waitForTimeout(250);
 await page.click('[data-act="journal"]');await page.waitForTimeout(300);
 await page.screenshot({path:path.join(OUT,'journal.png'),fullPage:true});
 await page.click('[data-act="resume"]');
 // 设置
 await page.click('[data-act="settings"]');await page.waitForTimeout(300);
 await page.screenshot({path:path.join(OUT,'settings.png'),fullPage:true});
 await page.click('[data-act="resume"]');
 // 快进到结局
 await page.evaluate(()=>{const s=LIFE.state;s.active='su';s.runs.su=LIFE_MODEL.run('su');for(let a=0;a<6;a++){s.runs.su.history.push({choice:a%2,searched:true,rested:a%2===0});s.runs.su.act=a+1;}});
 await page.evaluate(()=>LIFE.render());await page.waitForTimeout(400);
 await page.screenshot({path:path.join(OUT,'ending.png'),fullPage:true});
 console.log('misc shots ready, page errors:',errors.length?errors:'none');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});