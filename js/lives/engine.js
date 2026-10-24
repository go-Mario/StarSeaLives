'use strict';
const LIFE=(()=>{
 const KEY='SS_ORDINARY_LIVES_v1',BACKUP=KEY+'.backup';
 const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state=LIFE_MODEL.fresh(),blocked=false,deduceLock=false,storageProblem='',screen='title',selected=null,documentIndex=null,tab='scene',caseIndex=null,hint='',restMode=null,memory=null,confirmAction=null,lastScreen=null,lastDocIndex=null,docFresh=false;
 try{
  const raw=localStorage.getItem(KEY),backup=localStorage.getItem(BACKUP);
  if(raw!==null||backup!==null){
   try{if(raw===null)throw Error('missing');state=LIFE_MODEL.decode(raw);}
   catch(e){try{if(backup===null)throw Error('missing');state=LIFE_MODEL.decode(backup);storageProblem='recovered';}
    catch(e){blocked=true;storageProblem='damaged';}}
  }
 }catch(e){storageProblem='storage';}
 const t=x=>typeof x==='string'?x:x[state.language];
 const T=(zh,en)=>state.language==='zh'?zh:en;
 const E=x=>esc(t(x));
 const current=()=>state.active?state.runs[state.active]:null;
 function notify(text){$('notice').textContent=text;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('notice').textContent='',4500);}
 function persist(candidate=state,override=false){
  if(blocked&&!override)return false;
  try{const previous=localStorage.getItem(KEY);if(previous){try{LIFE_MODEL.decode(previous);localStorage.setItem(BACKUP,previous);}catch(e){}}
   localStorage.setItem(KEY,JSON.stringify(candidate));if(storageProblem!=='recovered')storageProblem='';return true;
  }catch(e){storageProblem='storage';notify(T('保存失败，当前进度仍在。请到设置导出备份。','Save failed. Your current progress is still here. Export a backup in Settings.'));return false;}
 }
 function warning(){if(!storageProblem)return '';const m={damaged:T('原存档无法读取，自动保存已暂停，原数据没有覆盖。请在设置导入有效备份或明确重置。','The save could not be read. Automatic saving is paused and original data is preserved. Import a valid backup or explicitly reset in Settings.'),recovered:T('已从上一份自动备份恢复，可能缺少最后一次操作。建议导出备份。','Recovered the previous automatic backup. Your last action may be missing. Export a backup.'),storage:T('浏览器没有成功保存。当前进度只在此窗口保留，请导出备份。','Browser storage has failed. Progress is available in this window; please export a backup.')}[storageProblem];return '<div class="warning" role="alert">'+m+'</div>';}
 function button(label,act,id='',cls='button'){return '<button class="'+cls+'" data-act="'+act+'" data-id="'+esc(id)+'">'+label+'</button>';}
 function header(){return '<header class="topbar"><button class="brand" data-act="home">'+E(LIVES.title)+'</button><div class="top-right">'+(current()?button(T('我的人生','My life'),'resume','','quiet'):'')+button(T('音效：'+(LIFE_AUDIO.enabled?'开':'关'),'Sound: '+(LIFE_AUDIO.enabled?'on':'off')),'sound','','quiet')+button(T('设置与存档','Settings & saves'),'settings','','quiet')+'<label><span class="sr-only">'+T('语言','Language')+'</span><select id="language" aria-label="'+T('语言','Language')+'"><option value="zh"'+(state.language==='zh'?' selected':'')+'>中文</option><option value="en"'+(state.language==='en'?' selected':'')+'>English</option></select></label></div></header>';}
 function portrait(id,old=false){const r=LIVES.roles[id],hair=old?'#b7b4aa':id==='su'?'#40312d':'#24292c',coat=r.color;return '<svg class="portrait" viewBox="0 0 140 180" aria-hidden="true"><path d="M6 180v-31q4-35 64-35t64 35v31" fill="'+coat+'"/><path d="M57 97h26v27H57" fill="#b48b6e"/><path d="M36 55q0-35 34-35t34 35v30q-4 29-34 32-30-3-34-32z" fill="'+(id==='su'?'#b98262':'#c49a78')+'"/><path d="M32 61Q25 13 70 12q45 1 40 49l-15-17-53 8z" fill="'+hair+'"/>'+(id==='su'?'<path d="M35 43q-20 49 4 69M103 39q23 47 0 77" stroke="'+hair+'" stroke-width="10" fill="none"/>':'')+'<path d="M47 69h12m22 0h12M61 94q9 5 18 0" fill="none" stroke="#554438" stroke-width="2.5"/>'+(id==='jian'?'<g stroke="#292f32" stroke-width="2" fill="none"><rect x="40" y="60" width="25" height="20" rx="7"/><rect x="76" y="60" width="25" height="20" rx="7"/><path d="M65 67h11"/></g>':'')+'<path d="M70 124v56" stroke="#26353e" stroke-width="3"/><path d="M25 149h20v10H25" fill="#e5d3a8"/>'+(old?'<path d="M43 88l10 4m34 0 10-4" stroke="#94735e" fill="none"/>':'')+'</svg>';}
 function orbital(){let stars='';for(let i=0;i<65;i++)stars+='<circle cx="'+((i*149)%650)+'" cy="'+((i*97)%440)+'" r="'+(i%4===0?1.4:.7)+'" fill="#c0cbd0" opacity="'+(.15+(i%5)*.14)+'"/>';return '<svg class="orbital" viewBox="0 0 650 470" role="img" aria-label="'+T('归港空间站与远处的地球','Homeward Station above a distant Earth')+'"><defs><radialGradient id="planet"><stop stop-color="#87b6bc"/><stop offset=".6" stop-color="#355d72"/><stop offset="1" stop-color="#11202e"/></radialGradient></defs>'+stars+'<circle cx="410" cy="245" r="159" fill="url(#planet)"/><path d="M290 170q130-75 253 75m-260-5q170-60 264 54" fill="none" stroke="#b6d3c5" opacity=".19" stroke-width="13"/><g transform="translate(295 250) rotate(-25)"><ellipse rx="245" ry="77" fill="none" stroke="#7c969b" stroke-width="3"/><ellipse rx="226" ry="59" fill="none" stroke="#3d5b68" stroke-width="13"/><path d="M-245 0H245M0-77V77" stroke="#9baba9" stroke-width="5"/><rect x="-73" y="-20" width="146" height="40" rx="8" fill="#a7ada1"/><rect x="-57" y="-10" width="114" height="20" fill="#263e4c"/><g stroke="#cfb783" stroke-width="5"><path d="M-44-8v16m22-16v16m22-16v16m22-16v16m22-16v16"/></g></g><path d="M54 400h80m-40-9v18" stroke="#bcad8c"/><text x="145" y="404" fill="#b9c3c5" font-size="10" letter-spacing="3">'+T('归港站 / 2077','HOMEWARD / 2077')+'</text></svg>';}
 function home(){return '<section class="hero"><div><h1>'+T('宇宙很大。<br>先过好<br>这一生。','A vast universe.<br>A life of<br>your own.')+'</h1><p class="lead">'+E(LIVES.premise)+'</p></div><div class="hero-art">'+orbital()+'<div class="hero-caption">'+T('归港站 / 有人正等着下班','Homeward Station / Someone is waiting for a shift to end')+'</div></div></section><section><div class="section-title"><h2>'+T('从谁的人生开始？','Whose life will you live?')+'</h2><p>'+T('每个人都是主角。每次只知道 ta 能知道的事。','Each person is a protagonist. You know only what they can know.')+'</p></div><div class="roles">'+Object.entries(LIVES.roles).map(([id,r])=>'<button class="role" data-act="select" data-id="'+id+'"><div class="job">'+E(r.job)+'</div>'+portrait(id)+'<h2>'+E(r.name)+'</h2><p class="tag">'+E(r.tag)+'</p><span class="enter">'+(state.runs[id]?T('继续 / 回看这段人生','Continue / revisit this life'):T('走进 ta 的故事','Step into this life'))+' →</span></button>').join('')+'</div><p class="footer">'+T('四位主角，六个相互牵连的事件，五十年的生活。游玩时长随阅读与探索而异。角色存档分别保留，重玩另一人会开启另一种可能。','Four protagonists. Six connected events. Fifty years of life. Take your time reading and exploring. Each character has a separate save; another life explores another possibility.')+'</p></section>';}
 function selection(){const r=LIVES.roles[selected],saved=state.runs[selected];return '<div class="intro-grid">'+portrait(selected)+'<div class="intro-copy"><div class="eyebrow">'+E(r.job)+' · '+T('起点年龄 ','Age at the beginning: ')+(2077-r.born)+'</div><h1>'+E(r.name)+'</h1><p>'+E(r.bio)+'</p><p class="inset">'+E(r.want)+'</p><p class="muted compact">'+T('选择后，整条故事都从这个人的视角展开。其他人的生活会通过你能接触到的记录、来信和相遇进入故事。','Once chosen, the story stays with this person. Other lives enter through records, messages and encounters available to you.')+'</p><div class="actions">'+button(saved?T('继续这段人生','Continue this life'):T('从 2077 年开始','Begin in 2077'),'start',selected)+(saved?button(T('重新开始','Start again'),'restart',selected,'button alt'):'')+button(T('返回','Back'),'home','','quiet')+'</div></div></div>';}
 /* 四间房：每个人物在自己的空间里醒来。back 画在桌面之后（墙面/高处的家当），
   front 画在桌面之后（桌面上的东西）。共用元素：舷窗与地球、光柱、桌面、地面。 */
const ROOMS={
 // 林渡 · 维修间：工具柜、管阀、圆形检修舱门、拆开的继电器
 lin:{back:'<g><rect x="900" y="50" width="280" height="200" rx="6" fill="#16242e" stroke="#2c4351" stroke-width="5"/>'
  +'<rect x="916" y="80" width="248" height="34" rx="3" fill="#1e3038"/><rect x="916" y="126" width="248" height="34" rx="3" fill="#1e3038"/><rect x="916" y="172" width="248" height="34" rx="3" fill="#1e3038"/>'
  +'<circle cx="1040" cy="97" r="7" fill="#dfbd87" opacity=".85"/><circle cx="1040" cy="143" r="7" fill="#7f9aa4" opacity=".5"/><circle cx="1040" cy="189" r="7" fill="#7f9aa4" opacity=".5"/></g>'
  +'<g fill="none" stroke="#3d5a68" stroke-width="9" opacity=".8"><path d="M904 300v196"/><path d="M938 268v228"/><path d="M972 322v174"/></g>'
  +'<g fill="#5d7f8c"><rect x="896" y="300" width="17" height="24" rx="3"/><rect x="930" y="268" width="17" height="24" rx="3"/><rect x="964" y="322" width="17" height="24" rx="3"/></g>'
  +'<g><circle cx="1124" cy="432" r="74" fill="#101d26" stroke="#48646f" stroke-width="12"/><circle cx="1124" cy="432" r="46" fill="none" stroke="#2f4a56" stroke-width="6"/><circle cx="1124" cy="432" r="11" fill="#dfbd87" opacity=".7"/><path d="M1098 432h52M1124 406v52" stroke="#48646f" stroke-width="5"/></g>',
  front:'<g><rect x="240" y="402" width="236" height="68" rx="5" fill="#26343d" stroke="#41585f" stroke-width="4"/>'
  +'<rect x="258" y="416" width="92" height="40" rx="3" fill="#152229"/><circle cx="288" cy="436" r="9" fill="#3f6b74"/><path d="M318 424h60M318 436h46M318 448h52" stroke="#4d8ea0" stroke-width="5" opacity=".7"/>'
  +'<path d="M356 402v-32h20v32" fill="none" stroke="#7f9aa4" stroke-width="5"/></g>'
  +'<g><rect x="520" y="434" width="124" height="36" rx="4" fill="#8a4a3a" stroke="#5d3128" stroke-width="4"/><path d="M540 434v-24h28v24" fill="none" stroke="#8a4a3a" stroke-width="6"/><rect x="546" y="398" width="46" height="14" rx="3" fill="#a05a48"/></g>'
  +'<g><path d="M712 470v-56" stroke="#7f9aa4" stroke-width="6"/><path d="M686 414h52l-7 36h-38z" fill="#3d5963"/></g>'
  +'<g><rect x="216" y="430" width="46" height="40" rx="7" fill="#c9b48c"/><path d="M262 444h16a12 12 0 0 1 0 24h-16" fill="none" stroke="#c9b48c" stroke-width="7"/></g>'},
 // 苏弥 · 食堂：出餐窗与蒸汽、吊灯、墙上菜单板、柜台上叠起的饭盒
 su:{back:'<g><rect x="898" y="54" width="284" height="150" rx="6" fill="#1d2a2c" stroke="#3b5450" stroke-width="5"/>'
  +'<rect x="914" y="70" width="252" height="118" rx="3" fill="#26383a"/>'
  +'<path d="M950 150c-8-14 8-22 0-36s10-20 2-32M1010 150c-8-14 8-22 0-36s10-20 2-32M1070 150c-8-14 8-22 0-36s10-20 2-32" stroke="#c9d6cf" stroke-width="4" opacity=".28" fill="none"/></g>'
  +'<g fill="none" stroke="#48605a" stroke-width="4"><rect x="898" y="240" width="284" height="90" rx="4"/><path d="M898 285h284"/></g>'
  +'<g fill="#cbb48c" opacity=".85"><rect x="920" y="256" width="120" height="10" rx="2"/><rect x="920" y="300" width="180" height="10" rx="2"/><rect x="1040" y="256" width="90" height="10" rx="2"/></g>'
  +'<g><rect x="930" y="380" width="220" height="124" rx="6" fill="#22322f" stroke="#3d5a52" stroke-width="5"/><circle cx="1040" cy="442" r="26" fill="none" stroke="#5f8a7c" stroke-width="5"/><path d="M1040 428v28l18 10" stroke="#5f8a7c" stroke-width="5" fill="none"/></g>'
  +'<g><path d="M980 54v-18" stroke="#48605a" stroke-width="4"/><path d="M1100 54v-18" stroke="#48605a" stroke-width="4"/>'
  +'<path d="M962 36h36l-8 20h-20z" fill="#c9a45e" opacity=".8"/><path d="M1082 36h36l-8 20h-20z" fill="#c9a45e" opacity=".8"/></g>',
  front:'<g><rect x="300" y="398" width="240" height="72" rx="5" fill="#2b3a38" stroke="#48605a" stroke-width="4"/>'
  +'<g fill="#d9cfae"><rect x="318" y="376" width="66" height="24" rx="3"/><rect x="392" y="370" width="66" height="30" rx="3"/><rect x="466" y="382" width="66" height="18" rx="3"/></g>'
  +'<path d="M340 370c-6-12 6-18 0-30M420 364c-6-12 6-18 0-30M494 376c-6-12 6-18 0-30" stroke="#e2e8dd" stroke-width="4" opacity=".3" fill="none"/></g>'
  +'<g><rect x="600" y="428" width="96" height="42" rx="6" fill="#3a4a45" stroke="#54706a" stroke-width="4"/><path d="M600 440h96" stroke="#6d8a80" stroke-width="4"/></g>'
  +'<g><rect x="200" y="434" width="52" height="36" rx="6" fill="#b8542f"/><path d="M214 434v-16h24v16" fill="none" stroke="#b8542f" stroke-width="6"/></g>'
  +'<g><rect x="740" y="392" width="130" height="78" rx="4" fill="#20291f" stroke="#3d5340" stroke-width="4" transform="rotate(-3 805 431)"/>'
  +'<path d="M756 412h96M756 428h74M756 444h88" stroke="#7f9a72" stroke-width="5" opacity=".6" transform="rotate(-3 805 431)"/></g>'},
 // 许照 · 泊位：货架与货箱、拉线钉板、分拣台上的包裹与手持扫描仪
 xu:{back:'<g><rect x="898" y="52" width="284" height="188" rx="4" fill="#1a2530" stroke="#334a5c" stroke-width="5"/>'
  +'<path d="M898 126h284M898 200h284M1040 52v188" stroke="#334a5c" stroke-width="5"/>'
  +'<g fill="#4a6a4e"><rect x="912" y="70" width="112" height="46" rx="3"/><rect x="1054" y="70" width="114" height="46" rx="3"/></g>'
  +'<g fill="#7a5c46"><rect x="912" y="142" width="112" height="46" rx="3"/></g><g fill="#5d6f5a"><rect x="1054" y="142" width="114" height="46" rx="3"/></g>'
  +'<g stroke="#8a9aa4" stroke-width="3" opacity=".7" fill="none"><path d="M912 70h112M1054 70h114M912 142h112M1054 142h114"/></g></g>'
  +'<g><rect x="898" y="276" width="284" height="160" rx="4" fill="#16202b" stroke="#3a4f60" stroke-width="5"/>'
  +'<g stroke="#d7a45e" stroke-width="2" opacity=".8" fill="none"><path d="M920 300l150 40M920 300l40 100M1070 340l-90 60"/></g>'
  +'<g fill="#dfbd87"><circle cx="920" cy="300" r="6"/><circle cx="1070" cy="340" r="6"/><circle cx="960" cy="400" r="6"/></g>'
  +'<g fill="#c9d2d6" opacity=".55"><rect x="1030" y="290" width="60" height="14" rx="2"/><rect x="1030" y="384" width="60" height="14" rx="2"/></g></g>'
  +'<g><rect x="898" y="470" width="284" height="34" rx="3" fill="#22323f" stroke="#3a4f60" stroke-width="4"/></g>',
  front:'<g><rect x="250" y="396" width="250" height="74" rx="5" fill="#25333f" stroke="#3f5768" stroke-width="4"/>'
  +'<g fill="#7a5c46"><rect x="270" y="356" width="86" height="42" rx="3"/><rect x="364" y="366" width="66" height="32" rx="3"/></g>'
  +'<g fill="#4a6a4e"><rect x="440" y="370" width="46" height="28" rx="3"/></g>'
  +'<g stroke="#5d7f8c" stroke-width="4" fill="none"><path d="M270 356v42M364 366v32"/></g></g>'
  +'<g><rect x="560" y="424" width="72" height="46" rx="6" fill="#2f4451" stroke="#4f6f7c" stroke-width="4"/><rect x="576" y="436" width="40" height="22" rx="2" fill="#7fd0b0" opacity=".8"/></g>'
  +'<g><path d="M700 470v-58" stroke="#7f9aa4" stroke-width="7"/><path d="M672 412h56l-8 30h-40z" fill="#3d5963"/><path d="M664 442h72v26h-72z" fill="#2c4450"/></g>'
  +'<g><rect x="180" y="432" width="48" height="38" rx="7" fill="#c9b48c"/><path d="M228 446h16a12 12 0 0 1 0 24h-16" fill="none" stroke="#c9b48c" stroke-width="7"/></g>'},
 // 简 · 法律援助办公室：卷宗架、公告板、桌上叠起的案卷、钢笔与印章
 jian:{back:'<g><rect x="898" y="50" width="284" height="196" rx="4" fill="#1e232c" stroke="#3a4250" stroke-width="5"/>'
  +'<path d="M898 116h284M898 182h284M1040 50v196" stroke="#3a4250" stroke-width="4"/>'
  +'<g fill="#6d5a46"><rect x="912" y="64" width="112" height="44" rx="2"/><rect x="1054" y="128" width="114" height="44" rx="2"/></g>'
  +'<g fill="#8a6a4e"><rect x="1054" y="64" width="114" height="44" rx="2"/><rect x="912" y="128" width="112" height="44" rx="2"/></g>'
  +'<g stroke="#c9b48c" stroke-width="3" opacity=".7" fill="none"><path d="M912 86h112M1054 86h114M912 150h112M1054 150h114"/></g></g>'
  +'<g><rect x="898" y="282" width="284" height="152" rx="4" fill="#20262f" stroke="#3f4756" stroke-width="5"/>'
  +'<g stroke="#c9b48c" stroke-width="3" opacity=".5" fill="none"><path d="M898 358h284M1040 282v152"/></g>'
  +'<g fill="#cfd6da" opacity=".5"><rect x="918" y="300" width="100" height="12" rx="2"/><rect x="918" y="376" width="140" height="12" rx="2"/><rect x="1060" y="300" width="80" height="12" rx="2"/></g></g>'
  +'<g><rect x="898" y="468" width="284" height="36" rx="3" fill="#262c36" stroke="#3f4756" stroke-width="4"/></g>',
  front:'<g><rect x="290" y="380" width="230" height="90" rx="4" fill="#e6ddc8" transform="rotate(-2 405 425)"/>'
  +'<path d="M308 402h190M308 420h150M308 438h176" stroke="#9aa08c" stroke-width="5" transform="rotate(-2 405 425)"/>'
  +'<g fill="#e6ddc8"><rect x="330" y="350" width="150" height="30" rx="3" transform="rotate(3 405 365)"/></g>'
  +'<path d="M330 350h150M330 364h110" stroke="#9aa08c" stroke-width="5" transform="rotate(3 405 365)"/></g>'
  +'<g><rect x="580" y="418" width="86" height="52" rx="5" fill="#2b3340" stroke="#46505f" stroke-width="4"/><rect x="594" y="432" width="58" height="24" rx="2" fill="#dfbd87" opacity=".55"/></g>'
  +'<g><path d="M700 470v-62" stroke="#8a94a0" stroke-width="6"/><path d="M694 408h12l-6 16z" fill="#dfbd87"/></g>'
  +'<g><rect x="190" y="436" width="46" height="34" rx="6" fill="#c9b48c"/><path d="M236 448h14a11 11 0 0 1 0 22h-14" fill="none" stroke="#c9b48c" stroke-width="6"/></g>'}};
/* 窗外五十年：同一扇窗，地球慢慢改变相位、受光、大小与距离。
   lit=受光中心(.0左→1右)  land=陆地不透明度  r=地球半径  dx/dy=窗内偏移
   extra=这一幕地球上多出来的东西（污染斑块 / 夜面灯火） */
const ACT_VIEW=[
 {sky:['#0a121b','#12222f','#0a141d'],e:['#3d6a7d','#15303f','#0a1a26'],lit:.30,r:150,dx:0,dy:0,land:.40,beam:'#ffe9bf',beamOp:.30,shaft:'M170 490 L840 190 L1200 150 L1200 720 L170 720 Z',tint:'#2a4655',mote:'#ffe9bf',extra:'',prop:''},
 {sky:['#0b141d','#182833','#0b1620'],e:['#54879a','#1d3c4c','#0c2130'],lit:.55,r:144,dx:16,dy:-10,land:.44,beam:'#e2ecf4',beamOp:.24,shaft:'M170 500 L820 205 L1200 175 L1200 720 L170 720 Z',tint:'#33505c',mote:'#e2ecf4',extra:'',prop:'<g><rect x="798" y="152" width="68" height="88" rx="3" fill="#d9d2c0" transform="rotate(2 832 196)"/><path d="M806 170h50M806 184h44M806 198h50M806 212h34" stroke="#8a8f7d" stroke-width="4" transform="rotate(2 832 196)"/><path d="M830 152v-9" stroke="#8a8f7d" stroke-width="3"/><circle cx="832" cy="140" r="4" fill="#b8542f"/></g>'},
 {sky:['#0c1512','#1a2620','#0b1512'],e:['#5c8a72','#1e3630','#0b1e1c'],lit:.44,r:150,dx:-14,dy:8,land:.34,beam:'#d8e6c8',beamOp:.20,shaft:'M170 505 L840 200 L1200 160 L1200 720 L170 720 Z',tint:'#3f5a48',mote:'#d8e6c8',extra:'<path d="M392 236c34-14 66 0 78 20s-12 42-40 46-50-12-52-30 6-26 14-36z" fill="#7a6242" opacity=".55"/>',prop:'<g><rect x="796" y="162" width="72" height="94" rx="3" fill="#cfd6c4" transform="rotate(-3 832 209)"/><path d="M804 182h54M804 198h48M804 214h56M804 230h38" stroke="#7d8a76" stroke-width="4" transform="rotate(-3 832 209)"/><path d="M832 240l11 8-11 8-11-8z" fill="#8a4a3a" opacity=".85"/></g>'},
 {sky:['#090f18','#141e2c','#080d14'],e:['#466f86','#152a3a','#09161f'],lit:.24,r:140,dx:22,dy:12,land:.30,beam:'#cfd9e8',beamOp:.16,shaft:'M170 512 L850 210 L1200 185 L1200 720 L170 720 Z',tint:'#3a4260',mote:'#cfd9e8',extra:'',prop:'<g><rect x="804" y="178" width="58" height="72" rx="2" fill="#b9c2c6" stroke="#8a949a" stroke-width="3"/><rect x="812" y="186" width="42" height="48" fill="#9fb0ae"/><path d="M814 230l11-13 8 10 8-8 9 11z" fill="#7f9a92"/><circle cx="852" cy="194" r="4" fill="#dfbd87"/></g>'},
 {sky:['#140f0c','#2a1c12','#120c08'],e:['#c9925e','#5a3a24','#1c1209'],lit:.62,r:168,dx:-6,dy:-6,land:.38,beam:'#ffd9a0',beamOp:.44,shaft:'M170 470 L830 175 L1200 130 L1200 720 L170 720 Z',tint:'#6b4a2e',mote:'#ffd9a0',extra:'<g fill="#ffe6b0">'+[[248,262,3.2],[268,238,2.4],[300,286,2.8],[336,252,2.2],[318,320,3],[268,300,2.4],[352,292,2.6],[286,346,2.2],[232,296,2.4],[368,246,2.2]].map(([x,y,rr])=>'<circle cx="'+x+'" cy="'+y+'" r="'+rr+'" opacity=".8"/>').join('')+'</g>',prop:'<g stroke="#c9b48c" stroke-width="2" fill="none"><path d="M810 180h60"/><path d="M810 216h60"/><path d="M810 252h60"/></g><g fill="#e0d6bd"><rect x="814" y="184" width="15" height="22" rx="2"/><rect x="814" y="220" width="13" height="22" rx="2"/><rect x="814" y="256" width="16" height="22" rx="2"/></g>'},
 {sky:['#070b11','#0f1620','#06090e'],e:['#7e93a0','#2b3a44','#101a20'],lit:.5,r:112,dx:0,dy:0,land:.16,beam:'#c6d2dc',beamOp:.10,shaft:'M170 520 L860 215 L1200 195 L1200 720 L170 720 Z',tint:'#4a5560',mote:'#c6d2dc',extra:'',prop:'<g><rect x="802" y="172" width="66" height="86" rx="3" fill="#3d4a52" stroke="#6f8189" stroke-width="3"/><rect x="810" y="180" width="50" height="62" fill="#2b3a42"/><path d="M816 232h38" stroke="#8fa0a8" stroke-width="3"/><circle cx="835" cy="202" r="9" fill="none" stroke="#a8b6bc" stroke-width="2"/></g>'}];
function sceneArt(r){
 const d=SCENES[r.role][r.act],act=LIVES.acts[r.act];
 const labels=[d.docs[0].name,d.docs[1].name,B('交叉核对','Cross-check')];
 const V=ACT_VIEW[r.act];
 const tint=V.tint;
 // 星星固定生成：位置与亮度每次渲染完全一致，避免亮度反复抖动
 const stars=[[72,84,1.6,.62],[168,52,1.1,.45],[286,120,1.9,.7],[404,66,1.2,.5],[520,38,1.5,.6],[640,96,1.1,.4],[742,58,1.7,.66],[860,110,1.2,.44],[968,70,1.5,.58],[1084,132,1.1,.42],[1132,54,1.8,.68],[120,168,1.2,.48],[330,190,1.0,.4],[900,196,1.3,.5],[1046,176,1.1,.44]]
  .map(([x,y,rr,o])=>'<circle cx="'+x+'" cy="'+y+'" r="'+rr+'" opacity="'+o+'"/>').join('');
 return '<div class="scene">'
  +'<svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
  +'<defs>'
  +'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+V.sky[0]+'"/><stop offset=".55" stop-color="'+V.sky[1]+'"/><stop offset="1" stop-color="'+V.sky[2]+'"/></linearGradient>'
  +'<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0c1a24"/><stop offset=".6" stop-color="#15303e"/><stop offset="1" stop-color="#1d4256"/></linearGradient>'
  +'<radialGradient id="earthg" cx="'+V.lit+'" cy=".34"><stop stop-color="'+V.e[0]+'"/><stop offset=".55" stop-color="'+V.e[1]+'"/><stop offset="1" stop-color="'+V.e[2]+'"/></radialGradient>'
  +'<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+V.beam+'" stop-opacity="'+V.beamOp+'"/><stop offset="1" stop-color="'+V.beam+'" stop-opacity="0"/></linearGradient>'
  +'<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4a3f30"/><stop offset="1" stop-color="#241d15"/></linearGradient>'
  +'<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0f1a23"/><stop offset="1" stop-color="#070d13"/></linearGradient>'
  +'</defs>'
  +'<rect width="1200" height="720" fill="url(#sky)"/>'
  +'<g fill="#e8f0f2">'+stars+'</g>'
  +'<g><rect x="150" y="70" width="620" height="420" rx="52" fill="url(#glass)"/>'
  +'<circle cx="'+(470+V.dx)+'" cy="'+(300+V.dy)+'" r="'+V.r+'" fill="url(#earthg)"/>'
  +'<g transform="translate('+V.dx+','+V.dy+')" opacity="'+V.land+'">'
  +'<path d="M330 250c40-22 78-8 96 14s-6 52-38 62-70-6-84-28 4-38 26-48z" fill="#4e7a63" opacity=".55"/>'
  +'<path d="M512 348c30-12 58 2 66 22s-14 44-40 46-52-14-54-32 18-26 28-36z" fill="#456e5c" opacity=".45"/></g>'
  +V.extra
  +'<ellipse cx="'+(470+V.dx)+'" cy="'+(300+V.dy)+'" rx="'+V.r+'" ry="26" fill="#0a121b" opacity=".25"/>'
  +'<rect x="150" y="70" width="620" height="420" rx="52" fill="none" stroke="#5d7a86" stroke-width="16"/>'
  +'<path d="M150 250h620M150 310h620M300 70v420M620 70v420" stroke="#22333d" stroke-width="7" opacity=".8"/>'
  +'<circle cx="228" cy="148" r="5" fill="#dfbd87" opacity=".8"/></g>'
  +'<path d="'+V.shaft+'" fill="url(#beam)"/>' // 光柱角度与强度随幕变化
  +'<g fill="'+V.mote+'">'+[[520,300,2.4,.10],[640,255,1.8,.13],[760,330,2.9,.08],[880,230,2,.11],[980,380,2.5,.09],[430,420,1.7,.12],[700,430,2.2,.08],[1050,300,1.9,.10]].map(([x,y,rr,o])=>'<circle cx="'+x+'" cy="'+y+'" r="'+rr+'" opacity="'+o+'"/>').join('')+'</g>' // 浮尘固定位置，不随时间抖动
  // 这一幕在墙上多出来的东西：房间里慢慢积累的五十年
  +V.prop
  +'<rect x="880" y="0" width="320" height="720" fill="#0e1a24"/>'
  +ROOMS[r.role].back
  +'<path d="M60 470h1080v34H60z" fill="url(#desk)"/>'
  +'<path d="M60 504h1080v216H60z" fill="#0c151d"/>'
  +'<rect x="60" y="470" width="1080" height="34" fill="none" stroke="#6b5a42" stroke-width="2" opacity=".6"/>'
  +ROOMS[r.role].front
  +'<rect y="504" width="1200" height="216" fill="url(#floor)"/>'
  +'<path d="M170 720 L840 504 L1200 504 L1200 720 Z" fill="#ffe9bf" opacity=".05"/>'
  +'<path d="M0 560h1200M0 620h1200" stroke="#1b2b35" stroke-width="3" opacity=".7"/>'
  +'<path d="M880 720c0-90 20-140 60-160h180c40 20 60 70 60 160z" fill="#0a1016" opacity=".92"/>'
  +'</svg>'
  +'<div class="scene-caption">'+E(act.place)+'<br>'+E(act.weather)+'</div>'
  +'<div class="scene-tint" style="--tint:'+tint+'"></div>'
  +'<div class="scene-grain" aria-hidden="true"></div>'
  /* 三个标记统一落在桌面近沿：记录是档案，不是房间里的物件。
     六幕的地球右缘最宽 52.7%、下缘最低 64.2%，所以这些位置都避开了舷窗。 */
  +labels.map((label,i)=>'<button class="hotspot '+(r.read.includes(i)?'read':'')+'" style="left:'+([22,52,82][i])+'%;top:'+([70,74,68][i])+'%" data-act="read" data-id="'+i+'"><i>'+(r.read.includes(i)?'✓':'0'+(i+1))+'</i>'+E(label)+'</button>').join('')
  +'</div>';
 }
function clockPuzzle(r){
  if(r.act!==0||r.role!=='lin'||!r.read.includes(2))return '';
  if(r.investigationDone)return archiveSearch(r);
  return '<div class="clock-lab"><div class="eyebrow">'+T('设备校时 · 归港站','DEVICE CALIBRATION · HOMEWARD')+'</div><h3>'+T('让两条记录对上','Bring the two records into alignment')+'</h3><p>'+T('门禁记录：03:18:44。食堂终端：03:17:20。拖动旋钮，找出门禁时钟快了多少秒。','Door reader: 03:18:44. Canteen terminal: 03:17:20. Adjust the dial to find how many seconds the door clock runs ahead.')+'</p><div class="clock-readings"><span>'+T('校正后门禁时间','Door reader after correction')+'<b id="adjustedTime">03:18:44</b></span><span>'+T('食堂终端','Canteen terminal')+'<b>03:17:20</b></span></div><label class="clock-slider">'+T('校正秒数','Seconds to correct')+' <output id="clockShiftOut">0</output> s<input id="clockShift" type="range" min="0" max="120" value="0" aria-label="'+T('校正门禁时钟的秒数','Seconds to correct the door clock')+'"></label><button class="button alt" data-act="alignClock">'+T('对齐两条记录','Align the records')+'</button>'+(r.clockAligned?'<p role="status">'+T('时间吻合。现在可以继续调查。','The times match. Continue the investigation.')+'</p>':'')+'</div>';
 }
 function archiveSearch(r){
  const a=LIVES.searches[r.role];
  if(r.searchDone)return '<section class="archive-search archive-found" aria-live="polite"><div class="eyebrow">'+E(a.system)+' · '+T('检索命中 2 条','2 records found')+'</div><h3>'+T('一条线索，落在两份记录里','One clue, corroborated by two records')+'</h3><div class="archive-hits">'+a.hits.map(x=>'<article class="archive-hit"><h4>'+E(x.title)+'</h4><p>'+E(x.detail)+'</p><small>'+E(x.source)+'</small></article>').join('')+'</div><p class="archive-foot">'+T('已记入人物手记。记录显示来源与范围，不会自动证明当事人的全部经历。','Added to the life journal. Sources and limits are shown; a record does not prove every part of someone’s life.')+'</p></section>';
  return '<section class="archive-search"><div class="eyebrow">'+E(a.system)+'</div><h3>'+T('再查一处站内记录','Check one more station record')+'</h3><p>'+E(a.prompt)+'</p><form class="archive-form" data-form="archive"><label for="archiveQuery">'+T('用你看到的编号或词语检索','Search with a code or term from the records')+'</label><div class="archive-entry"><input id="archiveQuery" type="search" maxlength="40" autocomplete="off" placeholder="'+E(a.placeholder)+'"><button class="button" data-act="searchRecord" type="button">'+T('检索','Search')+'</button></div></form><p class="archive-hint">'+T('没有命中也没关系。回看两份材料，试试它们共同提到的编号或地点。','No penalty for a miss. Revisit the records and try a code or place that appears in both.')+'</p>'+(hint?'<p role="status" class="hint">'+esc(hint)+'</p>':'')+'</section>';
 }
 function openingAction(r){
  if(r.act!==0||!r.read.includes(2))return '';
  if(r.role==='lin')return clockPuzzle(r);
  if(r.investigationDone)return archiveSearch(r);
  if(r.role==='su')return '<div class="role-action"><div class="eyebrow">'+T('后厨 · 十三份早餐','CANTEEN · THIRTEEN MEALS')+'</div><h3>'+T('出餐前，先保留哪张标签？','Before dispatch, which label must stay?')+'</h3><p>'+T('姓名被撕掉了，饭盒底仍有医护舱标签和过敏提示。选择一项，再确认出餐。','Names were removed. The boxes still carry a medical-compartment label and allergy notices. Choose what to preserve before dispatch.')+'</p><div class="action-options"><button class="choice" data-act="dispatchMeal" data-id="names">'+T('把姓名写回标签','Restore the names to the labels')+'</button><button class="choice" data-act="dispatchMeal" data-id="allergy">'+T('保留过敏提示，送往医护舱','Keep allergy notices; send the meals to the medical bay')+'</button><button class="choice" data-act="dispatchMeal" data-id="erase">'+T('撕掉全部标签，避免留下痕迹','Remove every label to leave no trace')+'</button></div></div>';
  if(r.role==='xu')return '<div class="role-action"><div class="eyebrow">'+T('离线路线缓存 · 第九泊位','OFFLINE ROUTE CACHE · BERTH NINE')+'</div><h3>'+T('按送件顺序复原这条路','Rebuild the delivery route in order')+'</h3><p>'+T('依次点选：出发点、经过的舱段、最终投递点。错了可以重来，不扣分。','Tap the start, the stop along the way, then the destination. You can retry without penalty.')+'</p><ol class="route-progress">'+[0,1,2].map(i=>'<li class="'+(i<r.routeSteps.length?'done':'')+'">'+T(['第九泊位','医护舱','十三份餐券的收件舱'][i],['Berth Nine','Medical compartment','Meal-voucher recipient'][i])+'</li>').join('')+'</ol><div class="action-options">'+[T('第九泊位','Berth Nine'),T('医护舱','Medical compartment'),T('收件舱','Recipient compartment')].map((x,i)=>'<button class="button alt" data-act="routeStep" data-id="'+i+'">'+x+'</button>').join('')+'</div></div>';
  return '<div class="role-action"><div class="eyebrow">'+T('法律援助 · 家属授权','LEGAL AID · FAMILY INSTRUCTIONS')+'</div><h3>'+T('下一步怎样做，才符合她的请求？','Which next step respects her instructions?')+'</h3><p>'+T('她同意紧急求助，但暂不愿公开乔安的病情。','She consents to urgent help, but not public disclosure of Jo An’s condition.')+'</p><div class="action-options"><button class="choice" data-act="triage" data-id="public">'+T('先公开全部病情，争取关注','Publish the full medical details to draw attention')+'</button><button class="choice" data-act="triage" data-id="care">'+T('先协调保密救治，再按授权核对身份','Arrange confidential care first, then verify identity within consent')+'</button><button class="choice" data-act="triage" data-id="delay">'+T('等所有人意见一致后再联系医院','Wait for unanimous agreement before contacting the hospital')+'</button></div></div>';
 }
 function ripple(r){if(r.act===0)return '';const prev=LIVES.acts[r.act-1].flag;return t(RIPPLE[prev][r.history[r.act-1].choice]);}
 function aside(r){const role=LIVES.roles[r.role];return '<aside class="side">'+portrait(r.role,r.act>=4)+'<div class="eyebrow">'+T('你所扮演的人','Your perspective')+'</div><h2>'+E(role.name)+'</h2><p>'+E(role.job)+'<br>'+E(role.person)+'</p><div style="clear:both"></div><p>'+E(role.want)+'</p><div class="progress">'+LIVES.acts.map((_,i)=>'<i class="'+(i<r.history.length?'done':'')+'"></i>').join('')+'</div><p>'+T('这一年已查看 ','Records examined this year: ')+r.read.length+' / 3</p><div class="note-list">'+r.read.map(i=>button(E(i===2?B('交叉核对','Cross-check'):SCENES[r.role][r.act].docs[i].name),'read',i,'')).join('')+'</div><hr>'+button(T('人物手记','Life journal'),'journal','','button alt')+button(T('下班 / 休息舱','Off duty / rest cabin'),'rest','','button alt')+(r.role==='jian'?button(T('另一条主线 · 六份卷宗','The other thread · six case files'),'cases','','button alt'):'')+'<p class="compact">'+T('休息不会锁住剧情；没有体力付费或倒计时。','Rest never gates the story. No energy purchases or countdowns.')+'</p></aside>';}
 function lateClue(r){const w=LIFE_MODEL.world(r);return t(LIVES.acts[r.act].clue)+(r.act===4?"\n\n"+(w.traceable&&w.investigated?T('你以前保存的身份线索和供水材料已经能互相核对。这次可以争取把共同证据变成安置规则。','Your earlier identity trail and water records can now corroborate one another. This time, shared evidence can support a resettlement rule.'):T('你手里的旧记录仍不完整。可以先争取临时席位，但不能把尚未核实的部分写成已经证明。','The older records available to you are still incomplete. You can seek provisional places, but cannot present unverified parts as proven.')):"");}
 function gateHint(r){
  const a=LIVES.acts[r.act];
  if(r.read.length<2)return T('还差 '+(2-r.read.length)+' 份材料：点场景里的标记，或托盘上的空卡。','Still '+(2-r.read.length)+' record(s) short: tap a marker in the scene or an empty card in the tray.');
  if(r.act===0&&!r.investigationDone)return T('材料齐了。完成上面这一步，才能继续。','You have the records. Finish the step above to continue.');
  if(r.act===0&&!r.searchDone)return T('现在用找到的编号或地点，去检索站内记录。','Now use the code or place you found to search the station archive.');
  return T('可以连起来了。挑一个材料能支持的理解。','You can connect them now. Pick the reading the records support.');
 }
 function clueTray(r){
  const d=SCENES[r.role][r.act];
  const names=[d.docs[0].name,d.docs[1].name,B('交叉核对','Cross-check')];
  const read=r.read.length;
  return '<div class="tray" role="group" aria-label="'+T('线索托盘','Evidence tray')+'">'
   +'<span class="tray-label">'+T('线索','Evidence')+'<b>'+read+'/3</b></span>'
   +'<div class="tray-cards">'+names.map((n,i)=>'<button class="tray-card '+(r.read.includes(i)?'got':'')+'" data-act="read" data-id="'+i+'"><i>'+(r.read.includes(i)?'✓':'0'+(i+1))+'</i><span>'+E(n)+'</span></button>').join('')+'</div>'
   +'</div>';
 }
 /* 记录卡上的档案地点：每个人经手的记录，落款在不同舱段 */
const ROOM_PLACE={lin:B('第三环 · 检修通道','Ring Three · Maintenance access'),su:B('第三环 · 食堂','Ring Three · Canteen'),xu:B('第九泊位 · 分拣台','Berth Nine · Sorting bench'),jian:B('第三环 · 法援办公室','Ring Three · Legal aid office')};
function readerCard(r,idx){
  const d=SCENES[r.role][r.act],title=E(idx===2?B('交叉核对','Cross-check'):d.docs[idx].name),text=idx===2?esc(lateClue(r)):E(d.docs[idx].text);
  const source=idx===2?B('两份记录放在一起','Two records side by side'):B('现场取得','Taken from the scene');
  // 档案要素：编号由年份 + 人物序号 + 记录序号生成，稳定可复现
  const roleIdx=['lin','su','xu','jian'].indexOf(r.role);
  const ref='HW-'+LIVES.acts[r.act].year+'-'+String(roleIdx*3+idx+1).padStart(3,'0');
  return '<div class="reader'+(docFresh?' fresh':'')+'" id="document" role="dialog" aria-modal="true" aria-label="'+title+'">'
   +'<div class="reader-back" data-act="closeDoc"></div>'
   +'<article class="reader-card paper">'
   +'<header class="doc-head">'
   +'<svg class="doc-seal" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="none" stroke="#8a7a56" stroke-width="1.6"/><circle cx="22" cy="22" r="15.5" fill="none" stroke="#8a7a56" stroke-width=".9" opacity=".7"/><path d="M22 9l2.6 6.2 6.6.5-5.1 4.2 1.6 6.4L22 23l-5.7 3.3 1.6-6.4-5.1-4.2 6.6-.5z" fill="#9a7b3e" opacity=".85"/><circle cx="22" cy="22" r="2.4" fill="#6f5c34"/></svg>'
   +'<span class="doc-station"><b>'+T('归港站 · 生活记录','HOMEWARD STATION · LIFE RECORD')+'</b><i>'+T('本记录只描述当事人能够接触到的部分','This record covers only what the person could reach')+'</i></span>'
   +'<span class="reader-no">'+(idx===2?'03':'0'+(idx+1))+' / 03</span></header>'
   +'<div class="doc-meta"><span>'+T('编号 ','Ref. ')+ref+'</span><i></i><span>'+E(ROOM_PLACE[r.role])+'</span></div>'
   +'<h2>'+title+'</h2><p class="reader-text">'+text+'</p>'
   +'<div class="reader-foot"><span class="doc-src">'+E(source)+'</span><span class="doc-actions"><button class="button ghost" data-act="nextDoc">'+T('下一份','Next record')+'</button><button class="button alt" data-act="closeDoc">'+T('收好这份记录','Put this record away')+'</button></span></div></article></div>';
 }
 function play(){const r=current();if(r.act>=6)return ending();const a=LIVES.acts[r.act],d=SCENES[r.role][r.act],role=LIVES.roles[r.role],canDeduce=r.read.length>=2&&(r.act!==0||(r.investigationDone&&r.searchDone));let body='';
 if(r.history.length>r.act){const c=r.history[r.act].choice===0?d.a:d.b;body='<section class="paper"><div class="eyebrow">'+T('这一年的选择','The choice you made')+'</div><h2>'+E(c.title)+'</h2><p>'+E(c.result)+'</p>'+(r.act===4?'<p class="ripple">'+E(SETTLEMENTS[LIFE_MODEL.world(r).settlement])+'</p>':'')+'<p class="ripple">'+E(a.reveal)+'</p>'+button(r.act===5?T('走向余生','The years that followed'):T('继续生活 · ','Life goes on · ')+LIVES.acts[r.act+1].year,'next')+'</section>';}
 else if(r.solved){body='<section class="paper"><div class="eyebrow">'+T('真相之后，生活还在继续','Life continues after the discovery')+'</div><h2>'+E(a.question)+'</h2><p>'+E(a.reveal)+'</p><p class="muted">'+T('你能决定的是自己下一步怎样做。两条路都留下一些东西，也失去一些东西。','You can decide what you do next. Each path preserves something and gives something up.')+'</p>'+[d.a,d.b].map((c,i)=>'<button class="choice" data-act="choose" data-id="'+i+'"><b>'+E(c.title)+'</b><span>'+E(c.detail)+'</span></button>').join('')+'</section>';}
 else{body='<section class="paper" id="scene-body"><div class="eyebrow">'+T('你的现场','Your part of the scene')+'</div><p>'+E(d.opening)+'</p>'+(r.act?'<p class="ripple">'+esc(ripple(r))+'</p>':'')+(documentIndex===null?'<p class="muted">'+T('点击场景里的标记，查看你能接触到的材料。','Explore the marked places to examine records available to you.')+'</p>':'<p class="doc-open">'+T('正在阅读：','Now reading: ')+E(documentIndex===2?B('交叉核对','Cross-check'):d.docs[documentIndex].name)+'</p>')+openingAction(r)+'<hr><h2>'+E(a.question)+'</h2>'+(canDeduce?'<p class="muted">'+T('试着把线索连起来。不确定时可以继续查看，没有惩罚。','Connect the clues. You can keep exploring; an uncertain answer carries no penalty.')+'</p>'+'<div class="conclusions">'+deductions(r).map((x,i)=>'<button class="choice" data-act="deduce" data-id="'+i+'"><i>'+T('推断 ','Infer ')+(i+1)+'</i>'+E(x.text)+'</button>').join('')+'</div>':'<p class="gate-hint">'+gateHint(r)+'</p>')+(hint&&!(r.act===0&&r.investigationDone&&!r.searchDone)?'<p role="status" class="hint">'+esc(hint)+'</p>':'')+'</section>';}
 const reader=documentIndex===null?'':readerCard(r,documentIndex);
  return '<div class="chapter-head"><div><div class="eyebrow">'+a.year+' · '+T('第 ','Chapter ')+(r.act+1)+T(' 幕','')+'</div><h1>'+E(a.title)+'</h1></div><div class="age">'+E(role.name)+' · '+(a.year-role.born)+' '+T('岁','years old')+'</div></div><div class="layout"><main>'+(!r.solved&&r.history.length===r.act?sceneArt(r)+clueTray(r):'')+body+'</main>'+aside(r)+'</div>'+reader;}
 function deductions(r){const a=LIVES.acts[r.act],items=[{text:a.answer,correct:true},...a.wrong.map(text=>({text,correct:false}))];for(let i=0;i<(r.act+Object.keys(LIVES.roles).indexOf(r.role))%3;i++)items.push(items.shift());return items;}
 function journal(){const r=current();return '<section class="journal"><div class="eyebrow">'+E(LIVES.roles[r.role].name)+'</div><h1>'+T('我走过的年岁','The years I have lived')+'</h1><p class="muted">'+T('这里只记下你亲历的事，不展示其他人的秘密或尚未发生的结局。','Only what you have lived through appears here—not others’ secrets or futures you have not reached.')+'</p>'+(!r.history.length?'<p>'+T('第一篇还没有写完。','The first entry is still being written.')+'</p>':'')+r.history.map((h,i)=>{const a=LIVES.acts[i],c=h.choice===0?SCENES[r.role][i].a:SCENES[r.role][i].b;return '<article class="timeline-entry"><small>'+a.year+'</small><h2>'+E(a.title)+'</h2><p>'+E(c.result)+'</p>'+(h.searched?'<p class="archive-note">'+T('站内检索：','Archive search: ')+E(LIVES.searches[r.role].system)+' · '+E(LIVES.searches[r.role].hits[0].title)+'</p>':'')+(h.rested?'<p>'+T('那一年，你也为自己留过一段休息。','That year, you made some time to rest, too.')+'</p>':'')+'</article>';}).join('')+button(T('回到我的人生','Return to my life'),'resume')+'</section>';}
 function ending(){const r=current(),role=LIVES.roles[r.role],o=LIFE_MODEL.outcome(r),titles={witness:B('让名字留下的人','The one who kept the names'),keeper:B('给人留灯的人','The one who left a light on'),bridge:B('在两岸之间的人','The one between the shores')},texts={witness:B('你一次次让私下发生的事进入公共记录。后来的人不必再从一片空白开始。但有些晚饭、班次和相聚，没有等到你。','Again and again, you brought private events into the public record. Those who followed did not begin with blank pages. Some dinners, departures and reunions did not wait for you.'),keeper:B('你把很多时间留给眼前的人。有人记得一碗饭、一趟陪伴，或者一扇开过的门。公共档案仍有缺口，你没有办法独自填平。','You gave much of your time to the person in front of you. Someone remembers a meal, a journey or a door that opened. The public archive still has gaps you could not fill alone.'),bridge:B('你没有始终站在同一边。有时保存记录，有时照顾生活。后来的人从你的矛盾里，读到了一个真实的人。','You did not always stand on the same side. Sometimes you preserved the record; sometimes you tended a life. Those who came later found a real person in your contradictions.')},last={lin:B('2137 年，林渡去世。家人把那把旧钥匙留了下来，没有把它磨亮。','Lin Du died in 2137. The family kept the old key without polishing it.'),su:B('2135 年，苏弥去世。店里仍留着一张不需要预约的桌子。','Su Mi died in 2135. The canteen still keeps one table that needs no reservation.'),xu:B('2140 年，许照去世。旧路线图被阿棠的家人装进相框，折痕没有压平。','Xu Zhao died in 2140. A Tang’s family framed the route map, creases intact.'),jian:B('2138 年，简去世。那支钢笔又换了一个笔尖，仍有人用它记下当事人真正想说的话。','Jian died in 2138. The pen received another nib. Someone still uses it to record what clients actually want to say.')};return '<section class="ending">'+portrait(r.role,true)+'<div class="eyebrow">'+T('一生的尾声','A life, in closing')+' · '+E(role.name)+'</div><h1>'+E(titles[o.kind])+'</h1><blockquote>'+E(role.want)+'</blockquote><p>'+E(texts[o.kind])+'</p><p>'+T('你为自己留下了 '+o.breaks+' 段休息。它们没有改变新闻标题，却改变了这些日子怎样被记住。','You made room for '+o.breaks+' breaks. They did not change the headlines. They changed how those days were remembered.')+'</p><p>'+E(last[r.role])+'</p><div class="paper"><div class="eyebrow">'+T('世界留下的痕迹','What remains in the world')+'</div><p>'+E(SETTLEMENTS[LIFE_MODEL.world(r).settlement])+'</p>'+r.history.slice(0,5).map((h,i)=>'<p>'+E(RIPPLE[LIVES.acts[i].flag][h.choice])+'</p>').join('')+'</div><p class="muted">'+T('这不是一个总分。你的六次选择、私人生活和留下的公共痕迹，共同构成这条人生。','This is not a final score. Your six choices, private life and public traces make up this life.')+'</p><div class="actions">'+button(T('翻看一生的手记','Read the life journal'),'journal')+button(T('另一个人的一生','Another person’s life'),'home','','button alt')+button(T('休息舱','Rest cabin'),'rest','','button alt')+(r.role==='jian'?button(T('六份卷宗','Six case files'),'cases','','button alt'):'')+'</div></section>';}
 function settings(){return '<section class="settings"><h1>'+T('设置与存档','Settings & saves')+'</h1>'+warning()+'<p>'+T('所有当前玩法均有完整中文与英文。语言切换不会改变人物、线索或选择。','All current playable content is available in Chinese and English. Switching language does not change characters, clues or choices.')+'</p><h2>'+T('把人生带走','Take your lives with you')+'</h2><p>'+T('进度保存在本浏览器。不同设备、浏览器和本地文件不会自动同步。导出文件包含四位人物已有的进度。','Progress is stored in this browser. Devices, browsers and local files do not sync automatically. An export contains saved progress for all four characters.')+'</p><div class="actions">'+button(T('导出备份','Export backup'),'export')+button(T('导入备份','Import backup'),'import','','button alt')+'</div><h2>'+T('重新开始','Start over')+'</h2><p>'+T('新版人生使用独立存档，不覆盖旧版庭审进度。可以在人物选择页单独重玩一位角色。下面的按钮会清空本版四位人物的进度；旧版庭审存档不受影响。','This edition uses a separate save and preserves previous tribunal progress. Restart one character from their selection page. The button below resets all four lives in this edition. The previous tribunal edition’s saves are unaffected.')+'</p>'+button(T('清空本版进度','Reset this edition'),'reset','','button danger')+'<h2>'+T('关于这个世界','About this world')+'</h2><p>'+T('这是原创虚构故事。法律卷宗为旧版六案的叙事改编，不是法律意见。当前为 2D 单机版，没有账号、广告、付费体力或多人联机。','This is original fiction. The legal files adapt the previous six cases and are not legal advice. This is a 2D single-player edition, without accounts, ads, paid energy or multiplayer.')+'</p>'+button(T('返回','Back'),'resume','','button alt')+'</section>';}
 function cases(){const r=current();if(r.role!=='jian')return '';return '<section class="journal"><div class="eyebrow">'+T('简的另一条主线','Jian’s other thread')+'</div><h1>'+T('人间的卷宗','Lives in the case files')+'</h1><p>'+T('陈岚保留的六份重演卷宗。从地面的污染，到谁能替人类回信。这里有法律，也有卷宗之外的人。按任意顺序阅读，不会改变你当前的年份。','Six reconstructions kept by Chen Lan: from contamination on Earth to who may answer for humanity. Law lives here, alongside people beyond the files. Read in any order; your current year does not change.')+'</p><div class="legal-list">'+LIFE_CASES.map((c,i)=>'<button data-act="case" data-id="'+i+'"><span>'+c.year+' · '+(r.cases[i]!==undefined?T('已有记录','Recorded'):T('未读','Unread'))+'</span><h2>'+E(c.title)+'</h2><span>'+T('进入卷宗','Open file')+' →</span></button>').join('')+'</div>'+button(T('回到我的人生','Return to my life'),'resume','','button alt')+'</section>';}
 function casePage(){const c=LIFE_CASES[caseIndex],r=current(),done=r.cases[caseIndex]!==undefined;return '<section class="case-body"><div class="eyebrow">'+c.year+' · '+T('历史卷宗重演','Historical reconstruction')+'</div><h1>'+E(c.title)+'</h1><div class="paper"><p>'+E(c.intro)+'</p><h2>'+T('先看看发生了什么','First, look at what happened')+'</h2><ul>'+c.clues.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul>'+(done?'<h2>'+E(c.choices[r.cases[caseIndex]])+'</h2><p>'+E(c.results[r.cases[caseIndex]])+'</p>':'<h2>'+E(c.prompt)+'</h2>'+c.choices.map((x,i)=>'<button class="choice" data-act="caseChoice" data-id="'+i+'">'+E(x)+'</button>').join(''))+'<details><summary>'+T('想再了解一点','A little more context')+'</summary><p>'+E(c.note)+'</p></details>'+button(T('回到六份卷宗','Back to the six files'),'cases','','button alt')+'</div></section>';}
 function rest(){const r=current(),available=r.act<6&&r.history.length===r.act&&!r.rested;if(!restMode)return '<section class="journal"><div class="eyebrow">'+T('副线 · 不影响主线解锁','Side activities · never required for progress')+'</div><h1>'+T('今天可以慢一点','You can slow down today')+'</h1><p>'+E(LIVES.roles[r.role].rest)+'</p>'+button(available?T('给自己放一段假','Take a little time off'):T('这段休息已经留下','This break is already part of your life'),'takeRest','','button'+(available?'':' alt'))+'<div class="rest-grid">'+[['dock',B('空间站对接','Station docking'),B('用方向按钮把小船送到泊位。不计时。','Guide the ship to its berth with the direction buttons. No timer.')],['memory',B('星窗翻牌','Stars at the window'),B('配成四对。不计时，翻错也没关系。','Match four pairs. No timer. No penalty.')],['tune',B('调到同一个频道','Find the same frequency'),B('把三个旋钮调到窗边便签上的数字。','Match three dials to the note by the window.')],['breathe',B('看一会儿星星','Stay with the stars'),B('跟着光圈慢慢呼吸，随时离开。','Breathe with the circle. Leave whenever you like.')]].map(([id,name,desc])=>'<button data-act="restGame" data-id="'+id+'"><h2>'+E(name)+'</h2><span>'+E(desc)+'</span></button>').join('')+'</div><p>'+button(T('回到我的人生','Return to my life'),'resume','','button alt')+'</p></section>';
 let body='';if(restMode==='breathe')body='<div class="breath-orb '+(rest.paused?'':'moving')+'">'+T('慢慢来','Take your time')+'</div>'+button(rest.paused?T('继续','Resume'):T('暂停','Pause'),'breath','','button alt');
 if(restMode==='memory')body='<p>'+T('找到相同的四对星符。','Find four matching pairs of star signs.')+'</p><div class="memory">'+memory.cards.map((v,i)=>'<button data-act="flip" data-id="'+i+'" class="'+(memory.matched.includes(i)?'matched':'')+'" aria-label="'+T('卡片 ','Card ')+(i+1)+'">'+(memory.open.includes(i)||memory.matched.includes(i)?['✦','☾','☉','✧'][v]:'·')+'</button>').join('')+'</div>'+(memory.matched.length===8?'<p role="status">'+T('星星都回到了自己的位置。','All the stars have found their place.')+'</p>':'');
 if(restMode==='dock')body='<p>'+T('把小船移到金色泊位。支持方向键与屏幕按钮；没有燃料惩罚。','Move the ship into the golden berth. Use arrow keys or the buttons; there is no fuel penalty.')+'</p><svg class="dock-map" viewBox="0 0 100 100" role="img" aria-label="'+T('对接练习，小船与目标泊位','Docking practice, ship and target berth')+'"><rect width="100" height="100" rx="4" fill="#0a1522"/><path d="M80 10v40H65V10z" fill="#3d5963"/><rect x="63" y="25" width="12" height="10" fill="none" stroke="#e8c88b"/><circle cx="15" cy="24" r=".4" fill="white"/><circle cx="42" cy="60" r=".7" fill="white"/><path d="M'+rest.ship[0]+' '+(rest.ship[1]-3)+'l4 6-4-2-4 2z" fill="#d3dfd7"/></svg><p role="status">'+(rest.ship[0]===70&&rest.ship[1]===30?T('对接完成。欢迎回家。','Docking complete. Welcome home.'):T('位置 ','Position ')+rest.ship.join(' / '))+'</p><div class="dock-controls">'+[['up','↑'],['left','←'],['down','↓'],['right','→']].map(([id,arrow])=>'<button class="button alt" data-act="dockMove" data-id="'+id+'" aria-label="'+T({up:'向上',left:'向左',down:'向下',right:'向右'}[id],id)+'">'+arrow+'</button>').join('')+'</div>';
 if(restMode==='tune')body='<p>'+T('窗边便签：24 / 68 / 41。没有倒计时。','The note reads: 24 / 68 / 41. There is no timer.')+'</p><div class="tuning">'+[24,68,41].map((v,i)=>'<label>'+T('旋钮 ','Dial ')+(i+1)+'<output id="dialOut'+i+'">'+rest.dials[i]+'</output><input type="range" min="0" max="100" value="'+rest.dials[i]+'" data-dial="'+i+'" aria-label="'+T('旋钮 ','Dial ')+(i+1)+'"></label>').join('')+'</div><p id="tuneStatus" role="status">'+(rest.dials.every((v,i)=>v===[24,68,41][i])?T('频道接通了。有人说：晚上好。','A connection. Someone says: good evening.'):'')+'</p>';
 return '<section class="rest-center"><h1>'+T('休息舱','Rest cabin')+'</h1>'+body+'<p>'+button(T('返回休息舱','Back to the cabin'),'rest','','button alt')+'</p></section>';}
 function titleScreen(){
  const r=current(),role=r?LIVES.roles[r.role]:null;
  return '<section class="cover">'+(warning()||'')
   +'<div class="cover-sky" aria-hidden="true"><i class="cover-stars"></i><i class="cover-stars far"></i><span class="cover-planet"></span><span class="cover-rim"></span></div>'
   +'<div class="cover-inner">'
   +'<p class="cover-kicker">'+T('2077 · 归港空间站','2077 · HOMEWARD STATION')+'</p>'
   +'<h1 class="cover-title">'+T('人间星海','Ordinary Lives')+'</h1>'
   +'<p class="cover-sub">'+T('一座空间站，四个人，五十年。<br>你只知道 ta 能知道的事。','One station. Four people. Fifty years.<br>You know only what they can know.')+'</p>'
   +'<div class="cover-menu">'
   +(role?button(T('继续 '+role.name+' 的人生','Continue as '+role.name),'resume','','button'):button(T('开始','Begin'),'begin','','button'))
   +(role?button(T('换一个人','Choose another life'),'begin','','button alt'):'')
   +button(T('设置与存档','Settings & saves'),'settings','','button alt')
   +'</div>'
   +'<div class="cover-foot">'
   +button(T('音效：'+(LIFE_AUDIO.enabled?'开':'关'),'Sound: '+(LIFE_AUDIO.enabled?'on':'off')),'sound','','quiet')
   +'<label><span class="sr-only">'+T('语言','Language')+'</span><select id="language" aria-label="'+T('语言','Language')+'"><option value="zh"'+(state.language==='zh'?' selected':'')+'>中文</option><option value="en"'+(state.language==='en'?' selected':'')+'>English</option></select></label>'
   +'</div></div></section>';
 }
 function progressStrip(){
  const r=current();if(!r||r.act>=6)return '';
  const read=r.read.length;
  const goal=read<2?T('读两份材料','Read two records'):(r.act===0&&(!r.investigationDone||!r.searchDone)?T('完成本幕调查','Finish the investigation'):T('做出判断','Make your call'));
  return '<div class="strip"><span class="strip-act">'+T('第 ','Act ')+(r.act+1)+T('/6 幕','/6')+'</span>'
   +'<span class="strip-dots">'+[0,1,2,3,4,5].map(i=>'<i class="'+(i<r.act?'done':i===r.act?'now':'')+'"></i>').join('')+'</span>'
   +'<span class="strip-goal">'+goal+'</span>'
   +'<span class="strip-read">'+T('材料 ','Records ')+read+'/2</span></div>';
 }
 /* 幕间转场卡：年份 + 幕题，短暂停留，点击可立即收起 */
 function actCard(){
  const r=current();if(!r||r.act>=6)return;
  const a=LIVES.acts[r.act],V=ACT_VIEW[r.act];
  const card=document.createElement('div');
  card.className='act-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',a.year+' · '+t(a.title));card.tabIndex=0;
  card.style.setProperty('--act-tint',V.tint);card.style.setProperty('--act-beam',V.beam);
  const stars=[[120,90,1.6],[300,60,1.1],[520,120,1.5],[760,50,1.7],[980,100,1.3],[1100,70,1.4],[200,200,1.0],[640,180,1.2],[880,210,1.1]].map(([x,y,rr])=>'<circle cx="'+x+'" cy="'+y+'" r="'+rr+'" opacity=".5"/>').join('');
  card.innerHTML='<svg class="act-card-sky" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
   +'<defs><radialGradient id="actEarthG" cx="'+V.lit+'" cy=".34"><stop stop-color="'+V.e[0]+'"/><stop offset=".55" stop-color="'+V.e[1]+'"/><stop offset="1" stop-color="'+V.e[2]+'"/></radialGradient></defs>'
   +'<rect width="1200" height="720" fill="#070b11"/><g fill="#e8f0f2">'+stars+'</g>'
   +'<circle cx="'+(470+V.dx)+'" cy="'+(300+V.dy)+'" r="'+V.r+'" fill="url(#actEarthG)" opacity=".92"/>'
   +'<ellipse cx="'+(470+V.dx)+'" cy="'+(300+V.dy)+'" rx="'+V.r+'" ry="24" fill="#070b11" opacity=".3"/>'
   +'<path d="'+V.shaft+'" fill="'+V.beam+'" opacity="'+V.beamOp+'"/>'
   +'</svg><div class="act-card-tint"></div><div class="act-card-veil"></div>'
   +'<div class="act-card-inner"><span class="act-card-year">'+a.year+'</span><span class="act-card-act">'+T('第 ','Chapter ')+(r.act+1)+T(' 幕','')+'</span><h2>'+E(a.title)+'</h2><span class="act-card-place">'+E(a.place)+'</span><span class="act-card-tap">'+T('点击继续','Tap to continue')+'</span></div>';
  const app=$('app');app.appendChild(card);
  let done=false;
  const close=()=>{if(done)return;done=true;card.classList.add('out');setTimeout(()=>card.remove(),420);};
  card.addEventListener('click',close);
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='Escape'){e.preventDefault();close();}});
  setTimeout(()=>card.focus({preventScroll:true}),60);
  setTimeout(close,2100);
 }
 function render(focus=true){const prev=window.scrollY;const enter=screen!==lastScreen;lastScreen=screen;
  // 记录卡只在"首次打开"时滑入；同一张卡内翻页(nextDoc)时不再重复位移，避免抖动
  docFresh=(documentIndex!==lastDocIndex);lastDocIndex=documentIndex;
  document.documentElement.lang=state.language==='zh'?'zh-CN':'en';document.title=T('星海公约 · 人间星海','Stellar Covenant · Ordinary Lives');const isTitle=screen==='title';let content=isTitle?titleScreen():screen==='home'?home():screen==='select'?selection():screen==='settings'?settings():screen==='journal'?journal():screen==='cases'?cases():screen==='case'?casePage():screen==='rest'?rest():play();$('app').innerHTML=isTitle?'<div class="cover-wrap'+(enter?' enter':'')+'">'+content+'</div>':'<div class="wrap'+(enter?' enter':'')+'">'+header()+(screen==='settings'?'':warning())+(screen==='play'?progressStrip():'')+content+'</div>';if(focus){window.scrollTo(0,0);const h=$('app').querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}else window.scrollTo(0,prev);}
 function ask(message,fn){confirmAction=fn;const modal=document.createElement('div');modal.className='modal-back';modal.id='confirmModal';modal.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"><h2 id="confirmTitle">'+T('请确认','Please confirm')+'</h2><p>'+esc(message)+'</p><div class="actions">'+button(T('取消','Cancel'),'cancel','','button alt')+button(T('确认','Confirm'),'confirm')+'</div></section>';$('app').appendChild(modal);modal.querySelector('[data-act="cancel"]').focus();}
 function closeAsk(){const m=$('confirmModal');if(m)m.remove();confirmAction=null;}
 function resume(){if(!current()){screen='home';}else{screen='play';LIFE_AUDIO.pad(current().act);}documentIndex=null;hint='';restMode=null;render();}
 function start(id){if(!LIVES.roles[id])return;if(!state.runs[id])state.runs[id]=LIFE_MODEL.run(id);state.active=id;persist();LIFE_AUDIO.enter();LIFE_AUDIO.pad(0);resume();}
 function exportSave(){const data=JSON.stringify({format:'StellarLives',exportedAt:new Date().toISOString(),state},null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Stellar-Covenant-Lives.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 const acts={closeDoc:()=>{documentIndex=null;LIFE_AUDIO.close();render(false);},
 nextDoc:()=>{const r=current(),nxt=(documentIndex+1)%3;if(!r.read.includes(nxt)){LIFE_MODEL.read(r,nxt);persist();}documentIndex=nxt;LIFE_AUDIO.page();render(false);},begin:()=>{screen='home';LIFE_AUDIO.enter();render();},home:()=>{screen='home';render();},settings:()=>{screen='settings';render();},sound:()=>{LIFE_AUDIO.toggle();render(false);},alignClock:()=>{const r=current();if(!r||r.role!=='lin'||r.act!==0||!r.read.includes(2))return;const v=Number($('clockShift')?.value);if(v!==84){LIFE_AUDIO.wrong();hint=T('时钟仍有偏差，继续微调；不会扣分。','The clocks are still apart. Keep adjusting; there is no penalty.');render(false);return;}r.clockAligned=true;r.investigationDone=true;LIFE_AUDIO.solve();persist();render(false);},searchRecord:()=>{const r=current(),query=$('archiveQuery')?.value;if(LIFE_MODEL.searchRecord(r,query)){hint='';LIFE_AUDIO.solve();persist();}else{hint=T('没有找到匹配记录。回看工牌、订单或路线上的编号和地点；可以反复试，不扣分。','No matching record. Recheck the code or place on the badge, order, or route. You can try again without penalty.');LIFE_AUDIO.wrong();}render(false);},dispatchMeal:id=>{const r=current();if(!r||r.role!=='su'||r.act!==0||!r.read.includes(2))return;if(id==='allergy'){r.investigationDone=true;hint='';LIFE_AUDIO.solve();persist();}else{hint=T('再看一眼饭盒上留下的提示：什么信息是安全出餐必需的？','Look again at the labels on the boxes: what information is essential for a safe meal?');LIFE_AUDIO.wrong();}render(false);},triage:id=>{const r=current();if(!r||r.role!=='jian'||r.act!==0||!r.read.includes(2))return;if(id==='care'){r.investigationDone=true;hint='';LIFE_AUDIO.solve();persist();}else{hint=T('她已经说清楚了眼下最急的事，也划定了哪些内容暂不公开。','She has stated what is urgent and what must remain private for now.');LIFE_AUDIO.wrong();}render(false);},routeStep:id=>{const r=current(),result=LIFE_MODEL.advanceRoute(r,Number(id));if(result.done){hint='';LIFE_AUDIO.solve();persist();}else if(!result.ok){hint=T('顺序不对，缓存没有丢；从第九泊位重新拼。','That order does not fit. The cache is safe; rebuild from Berth Nine.');LIFE_AUDIO.wrong();persist();}else{hint='';LIFE_AUDIO.read();persist();}render(false);},select:id=>{selected=id;screen='select';render();},start,restart:id=>ask(T('只重置这个人物的一生？其他人物不受影响。建议先导出备份。','Restart only this character’s life? Other lives are unaffected. Export a backup first.'),()=>{state.runs[id]=LIFE_MODEL.run(id);start(id);}),resume,
 read:id=>{const r=current(),n=Number(id);if(LIFE_MODEL.read(r,n)){LIFE_AUDIO.read();documentIndex=n;hint='';persist();render(false);const el=$('document');if(el){el.tabIndex=-1;el.focus({preventScroll:true});}const btn=document.querySelector('.reader-foot [data-act="closeDoc"]');if(btn)btn.focus({preventScroll:true});}},
 deduce:id=>{const r=current(),item=deductions(r)[Number(id)];if(!item||r.read.length<2||deduceLock)return;
   if(item.correct){deduceLock=true;LIFE_AUDIO.stamp();setTimeout(()=>LIFE_AUDIO.solve(),130);const el=document.querySelector('[data-act="deduce"][data-id="'+id+'"]');
    if(el){el.classList.add('right');const box=el.closest('.conclusions');if(box)box.classList.add('stamped');const st=document.createElement('span');st.className='stamp';st.textContent=T('材料支持','Supported');el.appendChild(st);}
    // 留足时间让玩家读到"材料支持"的盖章：这是每一幕的"啊，对了"时刻
    setTimeout(function(){deduceLock=false;LIFE_MODEL.solve(r);hint='';persist();render(false);},1150);}
   else{LIFE_AUDIO.wrong();hint=T('这一步还超出了材料能说明的范围。再看一眼“交叉核对”，或者换一个理解。','That goes beyond what the records support. Revisit the cross-check or try another interpretation.');
    render(false);const el=document.querySelector('[data-act="deduce"][data-id="'+id+'"]');if(el){el.classList.add('wrong');setTimeout(function(){el.classList.remove('wrong');},400);}}},
 choose:id=>{if(LIFE_MODEL.choose(current(),Number(id))){LIFE_AUDIO.choose(Number(id));persist();render();}},next:()=>{if(LIFE_MODEL.next(current())){LIFE_AUDIO.enter();LIFE_AUDIO.pad(current().act);documentIndex=null;persist();render();actCard();}},journal:()=>{screen='journal';render();},rest:()=>{screen='rest';restMode=null;render();},takeRest:()=>{if(LIFE_MODEL.rest(current())){LIFE_AUDIO.rest();persist();render(false);notify(T('这段休息已记入你这一年的生活。','This break is now part of your year.'));}},
 restGame:id=>{restMode=id;rest.ship=[25,75];rest.paused=false;rest.dials=[0,0,0];if(id==='memory'){const cards=[0,0,1,1,2,2,3,3];for(let i=cards.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}memory={cards,open:[],matched:[]};}render();},
 dockMove:id=>{if(restMode!=='dock')return;const delta={up:[0,-5],left:[-5,0],down:[0,5],right:[5,0]}[id];if(!delta)return;rest.ship=rest.ship.map((v,i)=>Math.max(5,Math.min(95,v+delta[i])));render(false);},
 flip:id=>{const i=Number(id);if(!memory||!Number.isInteger(i)||i<0||i>7||memory.matched.includes(i)||memory.open.includes(i))return;if(memory.open.length===2)memory.open=[];memory.open.push(i);if(memory.open.length===2&&memory.cards[memory.open[0]]===memory.cards[i]){memory.matched.push(...memory.open);memory.open=[];}render(false);},breath:()=>{rest.paused=!rest.paused;render(false);},
 cases:()=>{if(current()?.role!=='jian')return;screen='cases';render();},case:id=>{const n=Number(id);if(!LIFE_CASES[n]||current()?.role!=='jian')return;caseIndex=n;screen='case';render();},caseChoice:id=>{const r=current(),n=Number(id);if(screen!=='case'||r.role!=='jian'||![0,1].includes(n)||r.cases[caseIndex]!==undefined)return;r.cases[caseIndex]=n;persist();render(false);},export:exportSave,import:()=>$('saveFile').click(),
 reset:()=>ask(T('清空本版所有人物进度？旧版存档保留。此操作会替换本版自动备份。','Reset every life in this edition? Previous-edition saves remain. This replaces this edition’s automatic backup.'),()=>{const next=LIFE_MODEL.fresh();next.language=state.language;if(persist(next,true)){state=next;blocked=false;storageProblem='';try{localStorage.removeItem(BACKUP);}catch(e){}screen='home';render();}}),
 cancel:()=>{closeAsk();render(false);},confirm:()=>{const fn=confirmAction;closeAsk();if(fn)fn();}};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled&&acts[b.dataset.act]){acts[b.dataset.act](b.dataset.id);if(b.dataset.act==='sound')LIFE_AUDIO.tap();}});
 document.addEventListener('change',e=>{if(e.target.id==='language'){state.language=e.target.value;persist();hint='';render(false);}});
 document.addEventListener('submit',e=>{if(e.target.dataset.form==='archive'){e.preventDefault();acts.searchRecord();}});
 document.addEventListener('input',e=>{if(e.target.id==='clockShift'){const n=Number(e.target.value);$('clockShiftOut').textContent=n;const sec=11924-n,h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),v=sec%60;$('adjustedTime').textContent=[h,m,v].map(x=>String(x).padStart(2,'0')).join(':');}if(e.target.dataset.dial!==undefined){const i=+e.target.dataset.dial;rest.dials[i]=+e.target.value;$('dialOut'+i).textContent=e.target.value;$('tuneStatus').textContent=rest.dials.every((v,j)=>v===[24,68,41][j])?T('频道接通了。有人说：晚上好。','A connection. Someone says: good evening.'):'';}});
 document.addEventListener('keydown',e=>{if(screen==='rest'&&restMode==='dock'&&/^Arrow/.test(e.key)&&!e.target.matches('input,select')){e.preventDefault();acts.dockMove(e.key.slice(5).toLowerCase());}
  /* 记录卡：Esc 收好，左右方向键翻页，Tab 在卡内循环（aria-modal 要求焦点受限） */
  const reader=$('document');
  if(reader&&!e.target.matches('input,select,textarea')){
   if(e.key==='Escape'){e.preventDefault();acts.closeDoc();}
   else if(e.key==='ArrowRight'){e.preventDefault();acts.nextDoc();}
   else if(e.key==='ArrowLeft'){e.preventDefault();const r=current(),prev=(documentIndex+2)%3;if(r.read.includes(prev))documentIndex=prev;LIFE_AUDIO.page();render(false);}
   else if(e.key==='Tab'){
    const bs=[...reader.querySelectorAll('button')];
    if(bs.length){const first=bs[0],last=bs[bs.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  }
  if($('confirmModal')){if(e.key==='Escape'){e.preventDefault();acts.cancel();}if(e.key==='Tab'){const bs=$('confirmModal').querySelectorAll('button');if(e.shiftKey&&document.activeElement===bs[0]){e.preventDefault();bs[1].focus();}else if(!e.shiftKey&&document.activeElement===bs[1]){e.preventDefault();bs[0].focus();}}}});
 $('saveFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('size');const next=LIFE_MODEL.decode(await file.text());ask(T('用这份备份替换本版人物进度？建议先导出当前进度。','Replace this edition’s lives with this backup? Export current progress first.'),()=>{if(persist(next,true)){state=next;blocked=false;storageProblem='';resume();}});}catch(err){notify(T('无法导入：请选择本版导出的有效存档（不超过 2 MB）。原进度未改变。','Import failed. Choose a valid save exported by this edition, no larger than 2 MB. Current progress is unchanged.'));}finally{e.target.value='';}});
 render();
 return {get state(){return state;},get blocked(){return blocked;},get screen(){return screen;},start,render,actions:acts};
})();
