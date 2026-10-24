const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const source=JSON.parse(await fs.readFile(path.join(__dirname,'../artifacts/test-save.json'),'utf8'));
 const browser=await chromium.launch();
 try{
  for(const version of [1,2])for(const url of [process.env.ATLAS_URL||'http://127.0.0.1:8766/','file://'+path.resolve(__dirname,'../dist/index.html')]){
   const fixture=structuredClone(source);fixture.version=version;delete fixture.voyages;
   if(version===1){delete fixture.lightLab;delete fixture.aftermath}
   const context=await browser.newContext();await context.addInitScript(s=>localStorage.setItem('silent-atlas-v1',JSON.stringify(s)),fixture);
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url);await p.click('#continue');const restored=await p.evaluate(()=>ATLAS_GAME.state);
   assert.equal(restored.version,3);assert.equal(restored.lightLab.legacy,version===1);
   assert.deepEqual(restored.notes,fixture.notes);assert.deepEqual(restored.deductions,fixture.deductions);assert.equal(restored.ending,fixture.ending);
   assert.deepEqual(restored.voyages,{});assert.deepEqual(restored.aftermath,version===1?{}:fixture.aftermath);
   await p.click('#board');await p.click('[data-case="time"]');await p.click('[data-action="light-lab"]');
   assert.equal(await p.inputValue('#lab-sent'),'10');assert.equal(await p.inputValue('#lab-received'),'17');
   if(version===1)assert.match(await p.locator('.lab-readings').innerText(),/旧版存档没有实验记录/);
   else assert.match(await p.locator('.lab-readings').innerText(),/预测吻合/);
   assert.equal(await p.locator('[data-action="light-test"]').isDisabled(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: v1 and v2 save upgrade in web/offline entries; notes, reasoning, endings and v2 responses preserved.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
