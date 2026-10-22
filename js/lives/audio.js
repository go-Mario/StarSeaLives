'use strict';
const LIFE_AUDIO=(()=>{
 const KEY='SS_LIVES_SOUND';let enabled=false,ctx=null,bus=null,ambient=[];
 try{enabled=localStorage.getItem(KEY)!=='off';}catch(e){enabled=true;}
 function start(){
  if(!enabled)return false;
  try{
   if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   if(!bus){bus=ctx.createGain();bus.gain.value=.22;bus.connect(ctx.destination);}else bus.gain.setTargetAtTime(.22,ctx.currentTime,.12)
   if(!ambient.length){for(const [hz,volume] of [[55,.018],[82.4,.009]]){const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sine';osc.frequency.value=hz;filter.type='lowpass';filter.frequency.value=170;gain.gain.value=volume;osc.connect(filter);filter.connect(gain);gain.connect(bus);osc.start();ambient.push(osc);}}
   return true;
  }catch(e){enabled=false;try{localStorage.setItem(KEY,'off');}catch(_){}return false;}
 }
 function tone(frequency,duration=.14,volume=.08,delay=0,type='sine'){
  if(!enabled||!start())return;
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(bus);osc.start(t);osc.stop(t+duration+.025);
 }
 /* 每一幕的环境乐：三个音的和弦垫，慢速滤波起伏，外加很稀疏的钟声。
     全部实时合成，音量压得很低，只为让房间“有空气”。 */
 const ACT_CHORDS=[[110,164.8,220],[98,146.8,196],[123.5,185,246.9],[110,164.8,277.2],[87.3,130.8,174.6],[82.4,123.5,207.7]];
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
  /* 稀疏钟声 */
  const ring=()=>{if(!enabled||!padNodes)return;tone(chord[2]*2,.9,.018,0,'sine');setTimeout(ring,16000+Math.random()*12000);};
  setTimeout(ring,6000);
 }
 function stopPad(){if(!padNodes)return;const t=ctx.currentTime,p=padNodes;padNodes=null;
  try{p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(.0001,t+1.6);}catch(e){}
  setTimeout(()=>{p.oscs.forEach(o=>{try{o.stop();}catch(e){}});try{p.g.disconnect();}catch(e){}},1900);}
 function stop(){if(!ctx)return;stopPad();const old=ambient.splice(0);for(const osc of old){try{osc.stop();}catch(e){}}try{bus.gain.setTargetAtTime(.0001,ctx.currentTime,.08);}catch(e){}setTimeout(()=>{if(!enabled&&bus){try{bus.disconnect();}catch(e){}bus=null;}},550);}
 function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch(e){}if(enabled){if(!start())enabled=false;}else{stop();stopPad();}return enabled;}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;try{if(document.hidden)ctx.suspend();else if(enabled)ctx.resume();}catch(e){}});
 return {toggle,pad,get enabled(){return enabled;},tap(){tone(880,.055,.04);tone(1175,.08,.026,.04);},read(){tone(523,.12,.035);tone(784,.16,.025,.08);},solve(){tone(523,.24,.07);tone(659,.24,.05,.09);tone(784,.3,.05,.18);},choose(n){tone(n?392:587,.2,.055);tone(n?494:740,.26,.04,.07);},wrong(){tone(196,.22,.022,0,'triangle');},rest(){tone(440,.32,.035);tone(587,.42,.025,.12);},enter(){tone(392,.6,.05);tone(523,.7,.04,.14);tone(659,.9,.03,.3);}};
})();
