'use strict';
const LIFE_AUDIO=(()=>{
 const KEY='SS_LIVES_SOUND';let enabled=false,ctx=null,bus=null,master=null,wet=null;
 try{enabled=localStorage.getItem(KEY)!=='off';}catch(e){enabled=true;}
 /* 合成厅堂混响：只给"事件"一点空间感，绝不拿去烘连续的嗡鸣（那只会变成烦人的低频噪音）。 */
 let irBuf=null;
 function reverb(){
  if(!irBuf){const len=Math.floor(ctx.sampleRate*1.9);irBuf=ctx.createBuffer(2,len,ctx.sampleRate);
   for(let c=0;c<2;c++){const d=irBuf.getChannelData(c);for(let i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}}}
  const cv=ctx.createConvolver();cv.buffer=irBuf;return cv;
 }
 function start(){
  if(!enabled)return false;
  try{
   if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   if(!bus){
    bus=ctx.createGain();bus.gain.value=.22;
    master=ctx.createGain();master.gain.value=1;master.connect(ctx.destination);
    bus.connect(master);
    wet=ctx.createGain();wet.gain.value=.4;const cv=reverb();bus.connect(cv);cv.connect(wet);wet.connect(master);
   }else bus.gain.setTargetAtTime(.22,ctx.currentTime,.12);
   return true;
  }catch(e){enabled=false;try{localStorage.setItem(KEY,'off');}catch(_){}return false;}
 }
 function tone(frequency,duration=.14,volume=.08,delay=0,type='sine',send=.4){
  if(!enabled||!start())return;
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(bus);
  if(send>0&&wet){const s=ctx.createGain();s.gain.value=send;gain.connect(s);s.connect(wet);}
  osc.start(t);osc.stop(t+duration+.03);
 }
 let noiseBuf=null;
 function noise(duration=.12,volume=.05,delay=0,type='bandpass',freq=1800,q=.8,send=.2){
  if(!enabled||!start())return;
  if(!noiseBuf){const len=Math.floor(ctx.sampleRate*.6);noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);const data=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;}
  const t=ctx.currentTime+delay,src=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  src.buffer=noiseBuf;src.loop=true;filter.type=type;filter.frequency.value=freq;filter.Q.value=q;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  src.connect(filter);filter.connect(gain);gain.connect(bus);
  if(send>0&&wet){const s=ctx.createGain();s.gain.value=send;gain.connect(s);s.connect(wet);}
  src.start(t);src.stop(t+duration+.04);
 }
 /* 环境音：不是持续的嗡鸣，而是一小段缓慢的"涨落"——淡入、停留、淡出，然后是真的安静。
    每幕换一个和弦。偶尔有一声很远的铃。氛围该是"有时浮现"，不是"一直在耳边嗡嗡"。 */
 const ACT_CHORDS=[[110,164.8,220],[98,146.8,196],[123.5,185,246.9],[110,164.8,277.2],[87.3,130.8,174.6],[82.4,123.5,207.7]];
 let padChord=null,padTimer=null,padNodes=null;
 function swell(chord){
  const t=ctx.currentTime,g=ctx.createGain();
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.04,t+4.5);g.gain.linearRampToValueAtTime(.04,t+8);g.gain.linearRampToValueAtTime(.0001,t+13);
  const oscs=chord.map(hz=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type='sine';o.frequency.value=hz;o.detune.value=(Math.random()-.5)*6;og.gain.value=1/chord.length;o.connect(og);og.connect(g);o.start(t);o.stop(t+13.2);return o;});
  g.connect(bus);if(wet){const s=ctx.createGain();s.gain.value=.8;g.connect(s);s.connect(wet);}
  padNodes={oscs:oscs,g:g};setTimeout(()=>{if(padNodes&&padNodes.g===g)padNodes=null;},13400);
 }
 function pad(index){
  if(!enabled||!start())return;
  stopPad();padChord=ACT_CHORDS[(index||0)%ACT_CHORDS.length];
  const loop=()=>{if(!enabled||!padChord)return;swell(padChord);if(Math.random()<.45)tone(padChord[2]*2,1.2,.013,7,'sine',1);padTimer=setTimeout(loop,20000+Math.random()*16000);};
  padTimer=setTimeout(loop,2600);
 }
 function stopPad(){if(padTimer){clearTimeout(padTimer);padTimer=null;}padChord=null;
  if(padNodes){const t=ctx.currentTime,p=padNodes;padNodes=null;
   try{p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(.0001,t+1.2);}catch(e){}
   setTimeout(()=>{p.oscs.forEach(o=>{try{o.stop();}catch(e){}});try{p.g.disconnect();}catch(e){}},1400);}}
 function stop(){if(!ctx)return;stopPad();try{bus.gain.setTargetAtTime(.0001,ctx.currentTime,.08);}catch(e){}setTimeout(()=>{if(!enabled&&bus){try{bus.disconnect();}catch(e){}bus=null;}},550);}
 function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch(e){}if(enabled){if(!start())enabled=false;}else{stop();stopPad();}return enabled;}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;try{if(document.hidden)ctx.suspend();else if(enabled)ctx.resume();}catch(e){}});
 return {toggle,pad,get enabled(){return enabled;},
  tap(){noise(.028,.05,0,'highpass',2200,0,0);tone(1180,.04,.026,0,'sine',0);},
  read(){noise(.2,.03,0,'bandpass',1500,.6);tone(523,.12,.028,0,'sine',.3);tone(784,.16,.016,.07,'sine',.5);},
  page(){noise(.15,.035,0,'bandpass',1750,.55);},
  close(){noise(.24,.028,0,'lowpass',850,.7);tone(300,.12,.016,.02,'sine',.25);},
  stamp(){noise(.08,.085,0,'lowpass',380,1,.4);tone(96,.18,.05,0,'sine',.25);},
  solve(){tone(523,.24,.06,0,'sine',.4);tone(659,.24,.045,.09,'sine',.5);tone(784,.3,.04,.18,'sine',.7);},
  /* 顿悟：把线索连起来那一刻——亮、延绵，像一束光落下 */
  insight(){tone(587.33,.5,.06,0,'sine',.9);tone(880,.55,.045,.1,'sine',1);tone(1174.66,.7,.03,.22,'sine',1);noise(.5,.018,.02,'highpass',3000,.5,.7);},
  choose(n){tone(n?392:587,.2,.05,0,'sine',.4);tone(n?494:740,.26,.035,.07,'sine',.5);},
  wrong(){tone(196,.22,.02,0,'triangle',.15);noise(.09,.02,0,'lowpass',500);},
  rest(){noise(.3,.025,0,'lowpass',700,.6);tone(440,.32,.03,0,'sine',.5);tone(587,.42,.02,.12,'sine',.7);},
  enter(){tone(392,.6,.04,0,'sine',.6);tone(523,.7,.03,.14,'sine',.6);tone(659,.9,.022,.3,'sine',.8);}};
})();
