'use strict';
// A small deterministic mission. Saves store commands, so resource totals can be replayed and checked.
const ATLAS_VOYAGE = (() => {
 const width=5,height=4,dock=15,cargo=4,relays=[16,3],auxiliary=1;
 const debris=[5,9,10,14,18,19],radiation=[7,12];
 const routes={
  broadcast:{name:'勘验飞船',capacity:10,shielded:true,brief:'你的飞船可以离港，屏蔽层允许穿过辐射区。电量仍有限，记得为返航留出补能点。',reward:'货箱已送回接驳桥，氧芯列入救援储备。回执中的异常签名已单独保存，尚不能据此指控任何人。'},
  sealed:{name:'维修无人机',capacity:6,shielded:false,brief:'飞船的导航信标仍在担保中。你只能放出六格电量的维修无人机；薄壳无法穿过辐射区，需要沿外侧中继往返。',reward:'货箱由无人机送回，等待期间多了一枚备用氧芯。七天担保仍未解除；你获得了一份不必立即公开的异常回执。'},
  shelter:{name:'低功率无人机',capacity:4,shielded:false,brief:'主电源正在给温室供氧，无人机只能带四格电量。B1 的备用中继需要居民协助接通；独自操作无法完成整段航程。',reward:'氧芯已接入温室，应急储备从七天增至九天。它买来两天协商新补给的时间，仍没有修正外部补给规则。'}
 };
 const coordinate=n=>'ABCDE'[n%width]+(Math.floor(n/width)+1);
 function tile(n){if(n===dock)return '接驳桥';if(n===cargo)return '漂流货箱';if(n===auxiliary)return '备用中继';if(relays.includes(n))return '补能中继';if(debris.includes(n))return '残骸';if(radiation.includes(n))return '辐射区';return '航道';}
 function initial(route,response){const c=routes[route];if(!c)throw Error('未知航行路线');return {position:dock,energy:c.capacity,carrying:false,complete:false,support:route!=='shelter'||response==='share',moves:0,charges:0};}
 function canCharge(v){return v.position===dock||relays.includes(v.position)||v.position===auxiliary&&v.support;}
 function neighbors(n){return Array.from({length:width*height},(_,i)=>i).filter(i=>Math.abs(i%width-n%width)+Math.abs(Math.floor(i/width)-Math.floor(n/width))===1);}
 function apply(v,route,command){
  const c=routes[route];if(!c||!command||typeof command!=='object'||v.complete)return '这次回收已经结束。';
  if(command.kind==='move'){
   const n=command.to;
   if(!Number.isInteger(n)||!neighbors(v.position).includes(n))return '每次只能移动到上下左右相邻的节点。';
   if(debris.includes(n))return '残骸封住了这条航道。';
   if(radiation.includes(n)&&!c.shielded)return '无人机没有辐射屏蔽层。请选择外侧航道。';
   if(v.energy<1)return '电量耗尽。可撤回航行步骤，重新安排补能。';
   v.position=n;v.energy--;v.moves++;
   if(n===dock&&v.carrying)v.complete=true;
  }else if(command.kind==='charge'){
   if(!canCharge(v))return v.position===auxiliary?'备用中继尚未接通。在 B4 联络居民。':'这里只能通行，不能补能。';
   if(v.energy===c.capacity)return '电量已满。';v.energy=c.capacity;v.charges++;
  }else if(command.kind==='support'){
   if(route!=='shelter'||v.position!==16||v.support)return '在 B4 中继联络居民，才能启用备用节点。';v.support=true;
  }else if(command.kind==='collect'){
   if(v.position!==cargo||v.carrying)return '抵达 E1 的货箱后才能回收。';v.carrying=true;
  }else return '无法识别的航行指令。';
  return '';
 }
 function replay(route,response,commands=[]){
  if(!Array.isArray(commands)||commands.length>200)throw Error('航行记录过长或无效');
  const v=initial(route,response);
  for(const command of commands){const error=apply(v,route,command);if(error)throw Error('航行记录不一致：'+error);}
  return v;
 }
 return {width,height,dock,cargo,relays,auxiliary,debris,radiation,routes,coordinate,tile,initial,canCharge,neighbors,apply,replay};
})();
if(typeof module!=='undefined')module.exports=ATLAS_VOYAGE;
