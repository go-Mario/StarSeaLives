const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html';
/* 审计：可访问名称、标题层级、重复 id、语言属性、对比度、只读屏幕的隐藏内容 */
(async()=>{
 const browser=await chromium.launch();
 const problems=[];
 try{
  for(const [language,w,h] of [['zh',1365,900],['en',390,844]]){
   const page=await(await browser.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'})).newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE);await page.selectOption('#language',language);await page.waitForTimeout(300);
   const screens=[['cover',async()=>{}],['home',async()=>page.click('[data-act="begin"]')],
    ['select',async()=>page.click('[data-act="select"][data-id="jian"]')],
    ['play',async()=>page.click('[data-act="start"]')],
    ['reader',async()=>page.click('.hotspot[data-id="1"]')],
    ['rest',async()=>{await page.click('.reader-foot [data-act="closeDoc"]');await page.click('[data-act="rest"]');}],
    ['journal',async()=>{await page.click('[data-act="resume"]');await page.click('[data-act="journal"]');}],
    ['settings',async()=>page.click('[data-act="settings"]')],
    ['cases',async()=>{await page.click('[data-act="resume"]');await page.click('[data-act="cases"]');}]];
   for(const [name,go] of screens){
    await go();await page.waitForTimeout(250);
    const r=await page.evaluate(()=>{
     const out={noName:[],dupId:0,headingSkips:[],langOk:true,lowContrast:[],hiddenText:[]};
     document.querySelectorAll('[id]').forEach(n=>{if(document.querySelectorAll('[id="'+n.id+'"]').length>1)out.dupId++;});
     // 可访问名称：aria-label / aria-labelledby / 文本 / title
     document.querySelectorAll('button,a[href],select,input,summary,[tabindex="0"]').forEach(el=>{
      const name=(el.getAttribute('aria-label')||el.textContent||el.getAttribute('title')||'').trim();
      if(!name&&el.tagName!=='INPUT'===false)out.noName.push(el.tagName+'.'+(el.className||'').toString().slice(0,30));
     });
     // 标题层级
     const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(x=>+x.tagName[1]);
     for(let i=1;i<hs.length;i++)if(hs[i]-hs[i-1]>1)out.headingSkips.push(hs[i-1]+'->'+hs[i]);
     out.langOk=document.documentElement.lang===(typeof LIFE!=='undefined'&&LIFE.state.language==='en'?'en':'zh-CN');
     // 对比度（近似）：取颜色与背景，只报明显偏低的
     const lum=c=>{const [r,g,b]=c.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;};
     const bgOf=el=>{let n=el;while(n&&n!==document.documentElement){const c=getComputedStyle(n).backgroundColor;if(c&&c!=='rgba(0, 0, 0, 0)'&&!c.startsWith('rgba(0, 0, 0, 0'))return c;n=n.parentElement;}return 'rgb(13, 23, 33)';};
     document.querySelectorAll('p,span,h1,h2,h3,button,label,small,b,i').forEach(el=>{
      if(!el.textContent.trim()||el.children.length)return;
      const st=getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden'||+st.opacity===0)return;
      if(parseFloat(st.fontSize)<9)out.hiddenText.push((el.textContent||'').trim().slice(0,20));
      try{const f=lum(st.color),b=lum(bgOf(el));const ratio=(Math.max(f,b)+.05)/(Math.min(f,b)+.05);
       if(ratio<2.6&&el.textContent.trim().length>2)out.lowContrast.push({t:el.textContent.trim().slice(0,22),ratio:+ratio.toFixed(2)});}catch(e){}
     });
     return out;
    });
    if(r.dupId)problems.push(language+'/'+name+': '+r.dupId+' duplicate ids');
    if(r.noName.length)problems.push(language+'/'+name+': no accessible name: '+r.noName.slice(0,3).join(', '));
    if(r.headingSkips.length)problems.push(language+'/'+name+': heading skips '+r.headingSkips.slice(0,3).join(', '));
    if(!r.langOk)problems.push(language+'/'+name+': html lang wrong');
    if(r.hiddenText.length)problems.push(language+'/'+name+': sub-9px text: '+[...new Set(r.hiddenText)].slice(0,3).join(', '));
    if(r.lowContrast.length)problems.push(language+'/'+name+': low contrast '+JSON.stringify(r.lowContrast.slice(0,3)));
    if(errors.length)problems.push(language+'/'+name+': page errors '+errors.join('; '));
   }
   await page.context().close();
  }
  if(problems.length){console.log('FOUND '+problems.length+' issue(s):');problems.slice(0,25).forEach(p=>console.log(' - '+p));}
  else console.log('audit clean: 9 screens x 2 languages, no issues');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
