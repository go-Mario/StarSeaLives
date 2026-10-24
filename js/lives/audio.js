'use strict';
const LIFE_AUDIO=(()=>{
 const KEY='SS_LIVES_SOUND';let enabled=false,ctx=null,bus=null,master=null,wet=null,ambient=[],motifTimer=null;
 try{enabled=localStorage.getItem(KEY)!=='off';}catch(e){enabled=true;}
 /* 一段合成的厅堂混响（指数衰减噪声脉冲）。空间感是"沉浸"的一半——
    没有它，所有声音都贴在屏幕上，像电子表。 */
 let irBuf=null;
 function reverb(){
  if(!irBuf){const len=Math.floor(ctx.sampleRate*2.4);irBuf=ctx.createBuffer(2,len,ctx.sampleRate);
   for(let c=0;c<2;c++){const d=irBuf.getChannelData(c);for(let i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}}}
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
    bus.connect(master);                                   // 干声
    wet=ctx.createGain();wet.gain.value=.5;                // 湿声（混响送回）
    const cv=reverb();bus.connect(cv);cv.connect(wet);wet.connect(master);
   }else bus.gain.setTargetAtTime(.22,ctx.currentTime,.12);
   if(!ambient.length){
    // 低频嗡鸣（舱体共振）
    for(const [hz,volume] of [[55,.016],[82.4,.008]]){const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sine';osc.frequency.value=hz;filter.type='lowpass';filter.frequency.value=170;gain.gain.value=volume;osc.connect(filter);filter.connect(gain);gain.connect(bus);osc.start();ambient.push(osc);}
    // 一层极轻的"空气"：滤波噪声，像通风与远处设备的白噪，让房间不停下来
    const air=ctx.createBufferSource(),ag=ctx.createGain(),af=ctx.createBiquadFilter();air.loop=true;
    const alen=Math.floor(ctx.sampleRate*3),ab=ctx.createBuffer(1,alen,ctx.sampleRate),ad=ab.getChannelData(0);
    for(let i=0;i<alen;i++)ad[i]=Math.random()*2-1;air.buffer=ab;
    af.type='bandpass';af.frequency.value=520;af.Q.value=.5;ag.gain.value=.012;
    air.connect(af);af.connect(ag);ag.connect(bus);air.start();ambient.push(air);
   }
   if(!motifTimer)motifTimer=setTimeout(motif,9000);
   return true;
  }catch(e){enabled=false;try{localStorage.setItem(KEY,'off');}catch(_){}return false;}
 }
 function tone(frequency,duration=.14,volume=.08,delay=0,type='sine',send=.5){
  if(!enabled||!start())return;
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(bus);
  if(send>0&&wet){const s=ctx.createGain();s.gain.value=send;gain.connect(s);s.connect(wet);}
  osc.start(t);osc.stop(t+duration+.025);
 }
 /* 噪声质感：纸张的摩擦、盖章的闷响，都靠它。 */
 let noiseBuf=null;
 function noise(duration=.12,volume=.05,delay=0,type='bandpass',freq=1800,q=.8,send=.25){
  if(!enabled||!start())return;
  if(!noiseBuf){const len=Math.floor(ctx.sampleRate*.6);noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);const data=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;}
  const t=ctx.currentTime+delay,src=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  src.buffer=noiseBuf;src.loop=true;filter.type=type;filter.frequency.value=freq;filter.Q.value=q;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.01);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  src.connect(filter);filter.connect(gain);gain.connect(bus);
  if(send>0&&wet){const s=ctx.createGain();s.gain.value=send;gain.connect(s);s.connect(wet);}
  src.start(t);src.stop(t+duration+.04);
 }
 /* 每一幕的环境乐：三个音的和弦垫，慢速滤波起伏，外加很稀疏的钟声。 */
 const ACT_CHORDS=[[110,164.8,220],[98,146.8,196],[123.5,185,246.9],[110,164.8,277.2],[87.3,130.8,174.6],[82.4,123.5,207.7]];
 /* 一段忧郁的五声动机，偶尔在空气里浮现——给世界一个"声音"，而不只是底噪 */
 const MOTIF=[[0,392],[3,440],[5,523.25],[3,440],[0,392],[-2,349.23]];
 let padNodes=null;
 function pad(index){
  if(!enabled||!start())return;
  stopPad();
  const chord=ACT_CHORDS[(index||0)%ACT_CHORDS.length];
  const t=ctx.currentTime,g=ctx.createGain(),lp=ctx.createBiquadFilter();
  lp.type='lowpass';lp.frequency.setValueAtTime(420,t);lp.frequency.linearRampToValueAtTime(760,t+9);lp.frequency.linearRampToValueAtTime(430,t+18);
  const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.07;lg.gain.value=140;lfo.connect(lg);lg.connect(lp.frequency);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.05,t+3.5);
  const oscs=chord.map(hz=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type='sine';o.frequency.value=hz;o.detune.value=(Math.random()-.5)*7;og.gain.value=1/chord.length;o.connect(og);og.connect(lp);o.start(t);return o;});
  lp.connect(g);g.connect(bus);lfo.start(t);
  padNodes={oscs:oscs.concat([lfo]),g:g};
  const ring=()=>{if(!enabled||!padNodes)return;tone(chord[2]*2,.9,.016,0,'sine',1);setTimeout(ring,16000+Math.random()*12000);};
  setTimeout(ring,6000);
 }
 function motif(){
  if(!enabled||!start()){motifTimer=null;return;}
  const base=110;let when=0;
  for(const [step,hz] of MOTIF){tone(hz,.9,.028,when,'sine',1);tone(hz*2,.5,.01,when,'sine',1);when+=.62;}
  motifTimer=setTimeout(motif,34000+Math.random()*26000);
 }
 function stopPad(){if(!padNodes)return;const t=ctx.currentTime,p=padNodes;padNodes=null;
  try{p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(.0001,t+1.6);}catch(e){}
  setTimeout(()=>{p.oscs.forEach(o=>{try{o.stop();}catch(e){}});try{p.g.disconnect();}catch(e){}},1900);}
 function stop(){if(!ctx)return;stopPad();if(motifTimer){clearTimeout(motifTimer);motifTimer=null;}const old=ambient.splice(0);for(const osc of old){try{osc.stop();}catch(e){}}try{bus.gain.setTargetAtTime(.0001,ctx.currentTime,.08);}catch(e){}setTimeout(()=>{if(!enabled&&bus){try{bus.disconnect();}catch(e){}bus=null;}},550);}
 function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch(e){}if(enabled){if(!start())enabled=false;}else{stop();stopPad();}return enabled;}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;try{if(document.hidden)ctx.suspend();else if(enabled)ctx.resume();}catch(e){}});
 return {toggle,pad,get enabled(){return enabled;},
  /* 通用点击：短促的机械"嗒" */
  tap(){noise(.028,.05,0,'highpass',2200,0,0);tone(1180,.04,.026,0,'sine',0);},
  /* 翻开一份记录：纸张滑动 */
  read(){noise(.2,.03,0,'bandpass',1500,.6);tone(523,.12,.028,0,'sine',.4);tone(784,.16,.018,.07,'sine',.6);},
  page(){noise(.15,.035,0,'bandpass',1750,.55);},
  close(){noise(.24,.028,0,'lowpass',850,.7);tone(300,.12,.016,.02,'sine',.3);},
  stamp(){noise(.08,.085,0,'lowpass',380,1,.4);tone(96,.18,.05,0,'sine',.3);},
  solve(){tone(523,.24,.06,0,'sine',.5);tone(659,.24,.045,.09,'sine',.6);tone(784,.3,.04,.18,'sine',.8);},
  /* 顿悟：把线索连起来那一刻——比普通"解决"更亮、更延绵，像一束光落下 */
  insight(){tone(587.33,.5,.06,0,'sine',1);tone(880,.55,.045,.1,'sine',1);tone(1174.66,.7,.032,.22,'sine',1);noise(.5,.02,.02,'highpass',3000,.5,.8);},
  choose(n){tone(n?392:587,.2,.05,0,'sine',.5);tone(n?494:740,.26,.035,.07,'sine',.6);},
  wrong(){tone(196,.22,.02,0,'triangle',.2);noise(.09,.02,0,'lowpass',500);},
  rest(){noise(.3,.025,0,'lowpass',700,.6);tone(440,.32,.03,0,'sine',.6);tone(587,.42,.02,.12,'sine',.8);},
  enter(){tone(392,.6,.04,0,'sine',.7);tone(523,.7,.03,.14,'sine',.7);tone(659,.9,.022,.3,'sine',.9);}};
})();
