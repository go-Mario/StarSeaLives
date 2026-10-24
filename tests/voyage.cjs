const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const URL=process.env.ATLAS_URL||'http://127.0.0.1:8766/';
(async()=>{
 const source=JSON.parse(await fs.readFile(path.join(__dirname,'../artifacts/test-save.json'),'utf8'));
 const browser=await chromium.launch(),errors=[];
 try{
  for(const [route,response] of [['broadcast','account'],['sealed','repair'],['shelter','rest'],['shelter','share']]){
   // A previously UI-completed prologue is a checkpoint, not a new prologue playthrough.
   const fixture={...source,version:3,room:'dock',x:530,y:400,ending:route,voyages:{},aftermath:{[route]:response}};
   const context=await browser.newContext({viewport:{width:1440,height:960}});
   await context.addInitScript(f=>{if(!localStorage.getItem('silent-atlas-v1'))localStorage.setItem('silent-atlas-v1',JSON.stringify(f))},fixture);
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(URL);await p.click('#continue');
   async function openMission(){await p.click('[data-object="shiplog"]');await p.waitForFunction(()=>document.querySelector('#panel').open);await p.click('[data-action="voyage"]')}
   async function move(n){await p.click(`[data-orbit="${n}"]`)}
   async function charge(){await p.click('[data-action="voyage-charge"]')}
   await openMission();await move(4);assert.match(await p.locator('#voyage-feedback').innerText(),/相邻/);
   await p.focus('#orbit-15');await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).position),16);
   if(route==='broadcast'){
    for(const n of [17,12,7,2,3])await move(n);await charge();await move(4);
   }else{
    await move(17);await move(12);assert.match(await p.locator('#voyage-feedback').innerText(),/屏蔽/);await p.click('[data-action="voyage-undo"]');
    if(route==='shelter'&&response==='rest'){assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).support),false);await p.click('[data-action="voyage-support"]')}
    for(const n of [11,6,1])await move(n);
    await p.screenshot({path:path.resolve(__dirname,`../artifacts/voyage-${route}-${response}.png`)});
    if(route==='shelter')await charge();
    await p.reload();await p.click('#continue');await openMission();assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).position),1);
    for(const n of [2,3])await move(n);if(route==='sealed')await charge();await move(4);
   }
   await p.click('[data-action="voyage-collect"]');assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).complete),false);
   await p.click('[data-action="voyage-undo"]');assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).carrying),false);await p.click('[data-action="voyage-collect"]');
   await move(3);if(route!=='broadcast')await charge();
   if(route==='broadcast'){for(const n of [2,7,12,17,16,15])await move(n)}
   else{for(const n of [2,1])await move(n);if(route==='shelter')await charge();for(const n of [6,11,16,15])await move(n)}
   assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).complete),true);assert.match(await p.locator('#panel-body').innerText(),/零号灯塔/);
   await p.click('[data-action="ship-log"]');if(route==='shelter')assert.match(await p.locator('#panel-body').innerText(),/九天/);
   await p.click('[data-action="voyage"]');await p.click('[data-action="voyage-reset"]');await p.click('[data-action="voyage"]');assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).complete),true);
   await p.click('[data-action="voyage-reset"]');await p.click('[data-action="voyage-reset-confirm"]');assert.equal(await p.evaluate(()=>ATLAS_MODEL.voyageState(ATLAS_GAME.state).carrying),false);
   await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.querySelector('#panel').scrollWidth<=document.querySelector('#panel').clientWidth),true);await p.screenshot({path:path.resolve(__dirname,`../artifacts/voyage-mobile-${route}.png`)});
   await p.click('#close-panel');await p.click('#settings');const saved=p.waitForEvent('download');await p.click('[data-action="export"]');const file=path.resolve(__dirname,'../artifacts/voyage-save.json');await(await saved).saveAs(file);await p.setInputFiles('#import-file',file);await p.click('#confirm-import');assert.equal(await p.evaluate(()=>ATLAS_GAME.state.aftermath[ATLAS_GAME.state.ending]),response);
   await context.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: route-specific missions, radiation, keyboard movement, recharge, assistance, cargo/return, undo, reset confirmation, reload, import/export and mobile.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
