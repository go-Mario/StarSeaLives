const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'../..'),ctx=vm.createContext({console,assert});
for(const f of ['content','cases','model'])vm.runInContext(fs.readFileSync(path.join(root,'js/lives/'+f+'.js'),'utf8'),ctx);
const out=vm.runInContext(`(()=>{
 let combinations=0;const settlements=new Set();for(const role of Object.keys(LIVES.roles))for(let mask=0;mask<64;mask++){
  const r=LIFE_MODEL.run(role);for(let a=0;a<6;a++){
   if(LIFE_MODEL.choose(r,0))throw Error('Choice allowed before investigation');
   LIFE_MODEL.read(r,0);LIFE_MODEL.read(r,1);if(a===0){LIFE_MODEL.read(r,2);r.clockAligned=true;r.investigationDone=true;if(!LIFE_MODEL.searchRecord(r,LIVES.searches[role].terms[0]))throw Error('Archive search did not accept a role clue');}LIFE_MODEL.solve(r);
   if(a%2===0){if(!LIFE_MODEL.rest(r)||LIFE_MODEL.rest(r))throw Error('Rest must be idempotent');}
   if(!LIFE_MODEL.choose(r,(mask>>a)&1)||LIFE_MODEL.choose(r,0))throw Error('Duplicate choice');
   LIFE_MODEL.validate({version:1,language:'en',active:role,runs:{[role]:r}});
   LIFE_MODEL.next(r);
  }
  if(r.act!==6||r.history.length!==6||LIFE_MODEL.choose(r,0))throw Error('Ending');
  settlements.add(LIFE_MODEL.world(r).settlement);const state={version:1,language:'zh',active:role,runs:{[role]:r}};
  LIFE_MODEL.decode(JSON.stringify({format:'StellarLives',state}));combinations++;
 }
 const gated=LIFE_MODEL.run('lin');LIFE_MODEL.read(gated,0);LIFE_MODEL.read(gated,1);assert.equal(LIFE_MODEL.solve(gated),false);gated.clockAligned=true;assert.equal(LIFE_MODEL.solve(gated),false);gated.investigationDone=true;assert.equal(LIFE_MODEL.solve(gated),false);LIFE_MODEL.read(gated,2);assert.equal(LIFE_MODEL.searchRecord(gated,'wrong-code'),false);assert.equal(LIFE_MODEL.searchRecord(gated,'m 13'),true);assert.equal(LIFE_MODEL.solve(gated),true);assert.equal(LIFE_MODEL.choose(gated,0),true);assert.equal(gated.history[0].searched,true);assert.equal(LIFE_MODEL.next(gated),true);assert.equal(gated.searchDone,false);const migrated=LIFE_MODEL.run('su');migrated.investigationDone=true;migrated.solved=true;delete migrated.searchDone;LIFE_MODEL.validate({version:1,language:'zh',active:'su',runs:{su:migrated}});assert.equal(migrated.searchDone,true);const courier=LIFE_MODEL.run('xu');assert.equal(LIFE_MODEL.advanceRoute(courier,2).ok,false);for(const n of [0,1,2])LIFE_MODEL.advanceRoute(courier,n);assert.equal(courier.investigationDone,true);
 let bilingual=0;function walk(x){if(!x||typeof x!=='object')return;if('zh' in x||'en' in x){if(typeof x.zh!=='string'||typeof x.en!=='string'||!x.zh||!x.en||/[\\u3400-\\u9fff]/.test(x.en))throw Error('Incomplete translation');bilingual++;}else Object.values(x).forEach(walk);}
 walk(LIVES);walk(SCENES);walk(LIFE_CASES);walk(RIPPLE);walk(SETTLEMENTS);
 for(const role of Object.keys(LIVES.roles)){if(SCENES[role].length!==6||SCENES[role].some(x=>x.docs.length!==2))throw Error('Missing scenes');}
 let damaged=0;for(const mutate of [s=>s.version=9,s=>s.language='xx',s=>s.active='missing',s=>s.runs.lin.act=9,s=>s.runs.lin.read=[9],s=>s.runs.lin.history=[{choice:9,rested:false}],s=>s.runs.lin.cases={bad:0},s=>s.runs.lin.clockAligned='yes',s=>s.runs.lin.investigationDone='yes',s=>s.runs.lin.searchDone='yes',s=>s.runs.lin.routeSteps=[3]]){const s=LIFE_MODEL.fresh();s.runs.lin=LIFE_MODEL.run('lin');mutate(s);try{LIFE_MODEL.validate(s);throw Error('not rejected');}catch(e){if(e.message==='not rejected')throw e;damaged++;}}
 if(settlements.size!==3)throw Error('Missing world outcomes');return {combinations,bilingual,damaged,settlements:[...settlements]};})()`,ctx);
assert.equal(out.combinations,256);assert.equal(out.damaged,11);console.log(out);
