const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/atlas/model.js'),C=require('../js/atlas/content.js');
function solveLab(s){M.lightTest(s,1,1);M.lightTest(s,7,7);assert.equal(M.reconstruct(s,10,17,0,'flight'),'ok')}
function ready(){const s=M.fresh();s.power=true;for(const id of Object.keys(C.evidence))M.collect(s,id);s.signal=true;solveLab(s);for(const d of C.deductions)assert.equal(M.deduce(s,d.id,d.pair,d.claim),'ok');M.travel(s,'archive');M.travel(s,'core');return s;}
test('fresh save round trip and immutable prior game namespace',()=>assert.deepEqual(M.decode(JSON.stringify(M.fresh())).evidence,[]));
test('deductions require discovered evidence, correct pairing and supported claim',()=>{for(const d of C.deductions){const s=M.fresh();assert.equal(M.deduce(s,d.id,d.pair,d.claim),'evidence');for(const id of d.pair)M.collect(s,id);assert.equal(M.deduce(s,d.id,d.pair,'incorrect'),'claim');assert.equal(M.deduce(s,d.id,[d.pair[0],d.pair[0]],d.claim),'evidence');if(d.id==='time'){s.signal=true;assert.equal(M.deduce(s,d.id,d.pair,d.claim),'experiment');solveLab(s)}assert.equal(M.deduce(s,d.id,d.pair,d.claim),'ok');assert.equal(M.deduce(s,d.id,d.pair,d.claim),'done')}});
test('gates cannot bypass power or reasoning; each ending is reachable',()=>{const s=M.fresh();assert.equal(M.travel(s,'archive'),false);assert.equal(M.travel(s,'core'),false);assert.equal(M.finish(s,'sealed'),false);for(const id of Object.keys(C.endings)){const r=ready();assert.equal(M.finish(r,id),true);assert.equal(M.decode(JSON.stringify(r)).ending,id)}});
test('wrong states, missing evidence, duplicate IDs, malicious keys are rejected',()=>{const s=ready();for(const mutate of [s=>s.x=Infinity,s=>s.evidence=[],s=>s.deductions.push('time'),s=>s.heard=[9],s=>s.power=false,s=>s.signal=false,s=>s.notes.ending=3,s=>s.room='unknown',s=>s.settings.motion='yes']){const r=JSON.parse(JSON.stringify(s));mutate(r);assert.throws(()=>M.decode(JSON.stringify(r)))}assert.throws(()=>M.decode('{"__proto__":{}}'));assert.throws(()=>M.decode('a'.repeat(300001)))});
test('all 262144 circuit orientations evaluated; reciprocal ports are necessary',()=>{let solutions=0;for(let n=0;n<4**9;n++){let v=n;const a=Array.from({length:9},()=>{const r=v%4;v=Math.floor(v/4);return r});if(M.connected(a))solutions++}assert.ok(solutions>0);assert.equal(M.connected([0,1,1,0,1,0,2,0,3]),false);assert.equal(M.connected([0,1,1,1,0,1,2,0,3]),true);assert.equal(M.connected([0,0,0,0,0,0,0,0,0]),false);console.log('Circuit solutions:',solutions)});
test('signal tuning is bounded and daily recommendations rotate without date gating',()=>{assert.equal(M.signalQuality(143.7,3),100);assert.ok(M.signalQuality(143,3)<100);assert.equal(M.signalQuality(180,0),0);const set=new Set();for(let i=0;i<7;i++)set.add(M.dailyIndex(new Date(2026,9,25+i)));assert.equal(set.size,7)});
test('every evidence item and exit has a valid source and room; no unreachable content',()=>{for(const [id,r] of Object.entries(C.rooms)){for(const e of r.exits)assert.ok(C.rooms[e[0]],id);for(const o of r.objects)assert.equal(o.length>=5,true)}for(const id of Object.keys(C.evidence))assert.ok(Object.values(C.rooms).some(r=>r.objects.some(o=>o[0]===id)));for(const d of C.deductions)for(const id of d.pair)assert.ok(C.evidence[id])});

test('light laboratory rejects fixed-delay predictions and reversed events; saves partial observations',()=>{
 const s=M.fresh();assert.equal(M.lightTest(s,1,1),null);M.collect(s,'clock');M.collect(s,'signal');s.signal=true;
 assert.equal(M.reconstruct(s,10,17,0,'flight'),'trials');
 assert.deepEqual(M.lightTest(s,1,7),{distance:1,predicted:7,actual:1});
 M.lightTest(s,7,7);assert.equal(M.reconstruct(s,10,17,0,'flight'),'trials');
 assert.equal(M.decode(JSON.stringify(s)).lightLab.trials.length,2);
 M.lightTest(s,1,1);assert.equal(s.lightLab.trials.length,2);
 assert.equal(M.reconstruct(s,17,10,0,'flight'),'timeline');
 assert.equal(M.reconstruct(s,10,17,7,'flight'),'timeline');
 assert.equal(M.reconstruct(s,10,17,0,'clock'),'hypothesis');
 assert.equal(M.reconstruct(s,10,17,0,'flight'),'ok');
 assert.equal(M.lightTest(s,1,7),null);assert.equal(M.validate(s).lightLab.solved,true);
});
test('legacy completed and partial saves migrate without erasing notes or blocking progress',()=>{
 for(const source of [M.fresh(),ready()]){
  source.notes.ending='我的旧手记';const old={...source,version:1};delete old.lightLab;delete old.aftermath;
  const restored=M.decode(JSON.stringify(old));assert.equal(restored.version,2);assert.equal(restored.notes.ending,'我的旧手记');
  assert.deepEqual(restored.deductions,source.deductions);assert.equal(restored.lightLab.legacy,source.deductions.includes('time'));
  assert.deepEqual(M.decode(JSON.stringify(restored)),restored);
 }
});
test('route responses are persistent, exclusive within a route and independent across routes',()=>{
 const s=ready();assert.equal(M.respond(s,'account'),false);assert.equal(M.objects(s).some(o=>o[0]==='aftercare'),false);
 for(const [id,a] of Object.entries(C.aftermath)){
  M.finish(s,id);assert.equal(M.objects(s).some(o=>o[0]==='aftercare'),true);
  const first=a.options[0].id;assert.equal(M.respond(s,first),true);assert.equal(M.respond(s,a.options[1].id),false);assert.equal(s.aftermath[id],first);
 }
 assert.deepEqual(M.decode(JSON.stringify(s)).aftermath,{broadcast:'account',sealed:'repair',shelter:'share'});
 for(const [id,a] of Object.entries(C.aftermath)){const t=ready();M.finish(t,id);assert.equal(M.respond(t,a.options[1].id),true);assert.equal(M.decode(JSON.stringify(t)).aftermath[id],a.options[1].id)}
});
test('tampered laboratory and epilogue records cannot produce valid progress',()=>{
 for(const mutate of [s=>s.lightLab.trials=[],s=>s.lightLab.trials[0].actual=7,s=>s.lightLab.solved=false,s=>s.lightLab.trials.push({...s.lightLab.trials[0]}),s=>s.aftermath={sealed:'account'},s=>s.aftermath={sealed:'repair'}]){const s=ready();mutate(s);assert.throws(()=>M.decode(JSON.stringify(s)))}
});
