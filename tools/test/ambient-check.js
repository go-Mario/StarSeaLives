const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await(await browser.newContext({viewport:{width:1365,height:900}})).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SS_URL||'http://127.0.0.1:8766/index.html');await page.selectOption('#language','zh');await page.waitForTimeout(400);
 await page.click('[data-act="begin"]');await page.click('[data-act="select"][data-id="su"]');await page.click('[data-act="start"]');await page.waitForTimeout(300);
 // 记录动画开始时间
 const t1=await page.evaluate(()=>{const a=document.querySelector('.amb-dust.a');const an=a.getAnimations()[0];return an?Math.round(an.currentTime):null;});
 await page.waitForTimeout(900);
 // 触发多次重渲染（点击标记、翻页、关闭），模拟真实游玩
 for(let i=0;i<4;i++){await page.click('.hotspot[data-id="0"]');await page.waitForTimeout(120);await page.keyboard.press('ArrowRight');await page.waitForTimeout(120);await page.keyboard.press('Escape');await page.waitForTimeout(120);}
 const t2=await page.evaluate(()=>{const a=document.querySelector('.amb-dust.a');const an=a.getAnimations()[0];return an?Math.round(an.currentTime):null;});
 // 动画必须持续推进（currentTime 增长），且元素仍是同一个（未被重建）
 const sameNode=await page.evaluate(()=>{window.__amb=document.querySelector('.amb-dust.a');return true;});
 await page.click('[data-act="rest"]');await page.waitForTimeout(200);await page.click('[data-act="resume"]');await page.waitForTimeout(200);
 const t3=await page.evaluate(()=>{const a=document.querySelector('.amb-dust.a');const an=a.getAnimations()[0];return {t:an?Math.round(an.currentTime):null,same:a===window.__amb};});
 console.log('anim startTime:',t1,'| after 4 re-renders:',t2,'| after screen change:',t3);
 assert.ok(t1!==null&&t2!==null&&t3.t!==null,'ambient animation missing');
 assert.ok(t2>t1,'ambient animation did not advance across re-renders');
 assert.equal(t3.same,true,'ambient node was rebuilt (would restart the animation)');
 assert.deepEqual(errors,[]);
 console.log('ok ambient layer survives every re-render and keeps running');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
