'use strict';
const LIFE_MODEL=(()=>{
 const roles=Object.keys(LIVES.roles);
 const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
 function fresh(){return {version:1,language:'zh',active:null,runs:{}};}
 function run(role){if(!roles.includes(role))throw Error('role');return {role,act:0,read:[],solved:false,clockAligned:false,investigationDone:false,searchDone:false,routeSteps:[],history:[],rested:false,cases:{}};}
 function validate(s){
  if(!plain(s)||s.version!==1||!['zh','en'].includes(s.language)||!plain(s.runs)||(s.active!==null&&!roles.includes(s.active)))throw Error('format');
  for(const [id,r] of Object.entries(s.runs)){
   if(!roles.includes(id)||!plain(r)||r.role!==id||!integer(r.act,0,6)||!Array.isArray(r.read)||r.read.some(n=>!integer(n,0,2))||new Set(r.read).size!==r.read.length||typeof r.solved!=='boolean'||typeof r.rested!=='boolean'||!Array.isArray(r.history)||!plain(r.cases))throw Error('progress');
   // Migrate saves from the first lives preview, which predates the clock interaction.
   if(r.clockAligned===undefined)r.clockAligned=false;
   if(typeof r.clockAligned!=='boolean')throw Error('clock');
   if(r.investigationDone===undefined)r.investigationDone=false;
   if(typeof r.investigationDone!=='boolean')throw Error('investigation');
   // A saved first-scene solution predates the archive search; preserve its completed state.
   if(r.searchDone===undefined)r.searchDone=(r.act===0&&r.solved);
   if(typeof r.searchDone!=='boolean')throw Error('search');
   if(r.routeSteps===undefined)r.routeSteps=[];
   if(!Array.isArray(r.routeSteps)||r.routeSteps.length>3||r.routeSteps.some(n=>!integer(n,0,2)))throw Error('route');
   if(![r.act,Math.min(6,r.act+1)].includes(r.history.length)||r.history.length>6)throw Error('timeline');
   if(r.history.some(h=>!plain(h)||!integer(h.choice,0,1)||typeof h.rested!=='boolean'||(h.searched!==undefined&&typeof h.searched!=='boolean')))throw Error('history');
   if(Object.entries(r.cases).some(([k,v])=>!(/^[0-5]$/.test(k))||!integer(v,0,1)))throw Error('case');
   if(r.act<6&&r.history.length>r.act&&!r.solved)throw Error('decision');
   if(r.act===0&&r.solved&&(!r.investigationDone||!r.searchDone))throw Error('investigation');
  }
  if(s.active&&!s.runs[s.active])throw Error('active');return s;
 }
 function decode(raw){if(raw.length>2*1024*1024)throw Error('size');const s=JSON.parse(raw,(k,v)=>{if(['__proto__','prototype','constructor'].includes(k))throw Error('key');return v;});return validate(s.format==='StellarLives'?s.state:s);}
 function read(r,n){if(r.act>=6||r.history.length>r.act||!integer(n,0,2))return false;if(!r.read.includes(n))r.read.push(n);return true;}
 function searchRecord(r,query){if(!r||r.role==null||r.act!==0||r.solved||!r.investigationDone||!r.read.includes(2)||r.searchDone)return false;const normalize=s=>String(s??'').toLocaleLowerCase().trim().replace(/[\s　]+/g,'');const accepted=LIVES.searches[r.role].terms.map(normalize);if(!accepted.includes(normalize(query)))return false;r.searchDone=true;return true;}
 function solve(r){if(r.act>=6||r.history.length>r.act||r.read.length<2||(r.act===0&&(!r.investigationDone||!r.searchDone)))return false;r.solved=true;return true;}
 function advanceRoute(r,stop){if(!r||r.role!=='xu'||r.act!==0||r.investigationDone||!integer(stop,0,2))return {ok:false,done:false,count:0};const expected=[0,1,2][r.routeSteps.length];if(stop!==expected){r.routeSteps=[];return {ok:false,done:false,count:0};}r.routeSteps.push(stop);if(r.routeSteps.length===3)r.investigationDone=true;return {ok:true,done:r.investigationDone,count:r.routeSteps.length};}
 function choose(r,n){if(!r.solved||r.act>=6||r.history.length!==r.act||!integer(n,0,1))return false;r.history.push({choice:n,rested:r.rested,searched:r.searchDone});return true;}
 function next(r){if(r.act>=6||r.history.length!==r.act+1)return false;r.act++;r.read=[];r.solved=false;r.rested=false;r.searchDone=false;return true;}
 function rest(r){if(r.act>=6||r.history.length>r.act||r.rested)return false;r.rested=true;return true;}
 function world(r){const done=i=>r.history[i]?.choice===0;return {traceable:done(0)||done(1),investigated:done(2),consent:done(3),settlement:r.history.length<5?null:!done(4)?'households':(done(0)||done(1))&&done(2)?'charter':'provisional'};}
 function outcome(r){const publicCount=r.history.filter(h=>h.choice===0).length,breaks=r.history.filter(h=>h.rested).length;return {publicCount,breaks,kind:publicCount>=4?'witness':publicCount<=2?'keeper':'bridge'};}
 return {fresh,run,validate,decode,read,searchRecord,solve,advanceRoute,choose,next,rest,outcome,world};
})();
