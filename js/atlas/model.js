'use strict';
const ATLAS_MODEL = (()=>{
 const C=typeof ATLAS_CONTENT!=='undefined'?ATLAS_CONTENT:require('./content.js');
 const unique=(a,valid)=>Array.isArray(a)&&a.length<=valid.length&&new Set(a).size===a.length&&a.every(v=>valid.includes(v));
 function fresh(){return {version:2,lightLab:{trials:[],solved:false,legacy:false},aftermath:{},room:'dock',x:210,y:430,visited:['dock'],evidence:[],deductions:[],power:false,signal:false,echo:false,ending:null,heard:[],notes:{},events:[],settings:{sound:false,motion:true},startedAt:Date.now()};}
 function record(s,type,value){s.events.push({type,value,at:Date.now()});s.events=s.events.slice(-250);}
 function collect(s,id){if(!C.evidence[id]||s.evidence.includes(id))return false;s.evidence.push(id);record(s,'evidence',id);return true;}
 function deduce(s,id,selected,claim){const d=C.deductions.find(d=>d.id===id);if(!d||s.deductions.includes(id))return 'done';if(!Array.isArray(selected)||selected.length!==2||!d.pair.every(x=>selected.includes(x)&&s.evidence.includes(x)))return 'evidence';if(d.claim!==claim)return 'claim';if(id==='time'&&!s.lightLab.solved)return 'experiment';s.deductions.push(id);record(s,'deduction',id);return 'ok';}
 function gate(s,room){if(room==='archive'&&!s.power)return '档案库的门没有供电。先检查中庭配电柜。';if(room==='core'&&(s.deductions.length!==3||!s.signal))return '核心要求三条经证据支持的推论，以及完整求救帧。打开证据连线整理发现。';return '';}
 function travel(s,room){if(!C.rooms[room]||gate(s,room))return false;s.room=room;s.x=180;s.y=430;if(!s.visited.includes(room))s.visited.push(room);record(s,'room',room);return true;}
 function finish(s,id){if(s.room!=='core'||s.deductions.length!==3||!C.endings[id])return false;s.ending=id;record(s,'ending',id);return true;}
 // Ports: north, east, south, west. Trace reciprocal ports from input to output.
 const bases=[[1,2],[1,3],[2,3],[0,2],[1,3],[0,2],[0,1],[1,3],[0,3]];
 function connected(rot){if(!Array.isArray(rot)||rot.length!==9)return false;const ports=bases.map((p,i)=>p.map(d=>(d+rot[i])%4));const queue=[3],seen=new Set();if(!ports[3].includes(3))return false;while(queue.length){const n=queue.shift();if(seen.has(n))continue;seen.add(n);if(n===5&&ports[n].includes(1))return true;for(const d of ports[n]){const x=n%3+[0,1,0,-1][d],y=Math.floor(n/3)+[-1,0,1,0][d];if(x<0||x>2||y<0||y>2)continue;const j=y*3+x;if(ports[j].includes((d+2)%4))queue.push(j);}}return false;}
 function signalQuality(freq,phase,targetFreq=143.7,targetPhase=3){return Math.max(0,Math.round(100-Math.abs(Number(freq)-targetFreq)*4-Math.abs(Number(phase)-targetPhase)*12));}
 function objects(s){return C.rooms[s.room].objects.filter(o=>(o[5]!=='echo'||s.echo)&&(o[5]!=='ending'||s.ending));}
 function lightTest(s,distance,predicted){
  if(s.lightLab.solved||!s.evidence.includes('clock')||![1,4,7].includes(distance)||!Number.isInteger(predicted)||predicted<0||predicted>20)return null;
  const trial={distance,predicted,actual:distance};
  s.lightLab.trials=s.lightLab.trials.filter(t=>t.distance!==distance);s.lightLab.trials.push(trial);
  record(s,'light-test',distance+':'+predicted);return trial;
 }
 function reconstruct(s,sent,received,offset,hypothesis){
  if(!['clock','signal'].every(id=>s.evidence.includes(id)))return 'evidence';
  if(s.lightLab.trials.filter(t=>t.predicted===t.actual).length<2)return 'trials';
  if(sent!==10||received!==17||offset!==0)return 'timeline';
  if(hypothesis!=='flight')return 'hypothesis';
  s.lightLab.solved=true;record(s,'puzzle','light-reconstruction');return 'ok';
 }
 function respond(s,id){const a=C.aftermath[s.ending];if(s.room!=='core'||!a||!a.options.some(o=>o.id===id)||s.aftermath[s.ending])return false;s.aftermath[s.ending]=id;record(s,'aftermath',s.ending+':'+id);return true;}
 function validate(s){
  if(!s||s.version!==2||!C.rooms[s.room]||!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<95||s.x>905||s.y<275||s.y>550)throw Error('无法识别的存档位置');
  if(!unique(s.visited,Object.keys(C.rooms))||!s.visited.includes(s.room)||!unique(s.evidence,Object.keys(C.evidence))||!unique(s.deductions,C.deductions.map(d=>d.id))||!unique(s.heard,C.transmissions.map((_,i)=>i)))throw Error('存档记录无效');
  if(['power','signal','echo'].some(k=>typeof s[k]!=='boolean')||s.ending!==null&&!C.endings[s.ending])throw Error('存档状态无效');
  if(s.deductions.some(id=>!C.deductions.find(d=>d.id===id).pair.every(e=>s.evidence.includes(e)))||s.signal!==s.evidence.includes('signal')||s.visited.includes('archive')&&!s.power||s.visited.includes('core')&&(s.deductions.length<3||!s.signal)||s.ending&&(!s.visited.includes('core')||s.deductions.length<3))throw Error('存档进度不一致');
  const l=s.lightLab;
  if(!l||typeof l.solved!=='boolean'||typeof l.legacy!=='boolean'||!Array.isArray(l.trials)||l.trials.length>3||new Set(l.trials.map(t=>t?.distance)).size!==l.trials.length||l.trials.some(t=>!t||![1,4,7].includes(t.distance)||t.actual!==t.distance||!Number.isInteger(t.predicted)||t.predicted<0||t.predicted>20))throw Error('光行时实验记录无效');
  if(l.trials.length&&!s.evidence.includes('clock')||l.solved&&(!['clock','signal'].every(id=>s.evidence.includes(id))||!l.legacy&&l.trials.filter(t=>t.actual===t.predicted).length<2)||s.deductions.includes('time')&&!l.solved||l.legacy&&!s.deductions.includes('time'))throw Error('光行时进度不一致');
  if(!s.aftermath||typeof s.aftermath!=='object'||Array.isArray(s.aftermath)||Object.entries(s.aftermath).some(([id,choice])=>!C.aftermath[id]?.options.some(o=>o.id===choice))||Object.keys(s.aftermath).length&&!s.ending)throw Error('结局回访记录无效');
  if(!s.settings||typeof s.settings.sound!=='boolean'||typeof s.settings.motion!=='boolean'||!Number.isFinite(s.startedAt))throw Error('存档设置无效');
  if(!s.notes||typeof s.notes!=='object'||Array.isArray(s.notes)||Object.entries(s.notes).some(([k,v])=>!/^([0-6]|ending)$/.test(k)||typeof v!=='string'||v.length>2000))throw Error('手记无效');
  if(!Array.isArray(s.events)||s.events.length>250||s.events.some(e=>!e||typeof e.type!=='string'||typeof e.value!=='string'||!Number.isFinite(e.at)))throw Error('调查记录无效');return s;
 }
 function decode(raw){if(typeof raw!=='string'||raw.length>300000)throw Error('存档过大');const s=JSON.parse(raw,(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('非法字段');return v;});if(s&&s.version===1){s.version=2;s.lightLab={trials:[],solved:Array.isArray(s.deductions)&&s.deductions.includes('time'),legacy:Array.isArray(s.deductions)&&s.deductions.includes('time')};s.aftermath={};}return validate(s);}
 function dailyIndex(date=new Date()){return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)%C.transmissions.length;}
 return {objects,lightTest,reconstruct,respond,fresh,record,collect,deduce,gate,travel,finish,bases,connected,signalQuality,validate,decode,dailyIndex};
})();
if(typeof module!=='undefined')module.exports=ATLAS_MODEL;
