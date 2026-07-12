/* Все для ученого — логика карты (v2). DATA определён во встроенном <script> выше. */
const TIERS=["Высший уровень","Законы (профильный)","Постановления Правительства","Приказы министерств","Стандарты"];
const TIER_COLOR={"Высший уровень":"var(--c1)","Законы (профильный)":"var(--c2)","Постановления Правительства":"var(--c3)","Приказы министерств":"var(--c4)","Стандарты":"var(--c9)"};
const CVAR={c1:"var(--c1)",c2:"var(--c2)",c3:"var(--c3)",c4:"var(--c4)",c9:"var(--c9)"};
function host(u){try{const h=new URL(u).hostname.replace("www.","");if(h.includes("adilet"))return["adilet","adilet"];if(h.includes("prg"))return["prg","prg.kz"];if(h.includes("gov.kz"))return["gov","gov.kz"];if(h.includes("akorda"))return["gov","akorda"];if(h.includes("primeminister"))return["gov","pm.kz"];if(h.includes("zakon"))return["other","zakon.kz"];return["other",h.split(".")[0]]}catch(e){return["other","ссылка"]}}
const state={q:"",tiers:new Set(),srcs:new Set()};
const $=s=>document.querySelector(s);
let curView="map";
const totalDocs=DATA.reduce((s,d)=>s+d.items.length,0);
function scrollToEl(el){const y=el.getBoundingClientRect().top+window.pageYOffset-140;window.scrollTo({top:y,behavior:"smooth"});}
function setHash(h){try{history.replaceState(null,"",h);}catch(e){}}

/* ---------- сохранение состояния ---------- */
const LS="vu-state-v2";
function saveState(){try{localStorage.setItem(LS,JSON.stringify({
  view:curView,q:state.q,tiers:[...state.tiers],srcs:[...state.srcs],
  open:[...document.querySelectorAll(".sec.open")].map(s=>s.id),
  check:[...document.querySelectorAll("#checklist input")].map(b=>b.checked)
}));}catch(e){}}
function loadState(){try{return JSON.parse(localStorage.getItem(LS)||"{}");}catch(e){return{};}}
const SAVED=loadState();

/* ---------- статистика ---------- */
const totalLinks=new Set(DATA.flatMap(d=>d.items.flatMap(i=>i.links.map(u=>u.split("#")[0])))).size;
const mnvo=DATA.find(d=>d.num==="4").items.length;
const laws=DATA.find(d=>d.num==="6").items.length+DATA.find(d=>d.num==="7").items.length;
const govr=DATA.find(d=>d.num==="3").items.length;
[["Разделов",DATA.length],["Документов",totalDocs],["Ссылок",totalLinks],["Приказов МНВО",mnvo],["Кодексов и законов",laws],["Постановлений",govr]].forEach(([l,n])=>{
  const d=document.createElement("div");d.className="stat";d.innerHTML=`<div class="n">${n}</div><div class="l">${l}</div>`;$("#stats").appendChild(d);
});

/* ---------- пирамида ---------- */
const tierCounts={};TIERS.forEach(t=>tierCounts[t]=DATA.filter(d=>d.tier===t).reduce((s,d)=>s+d.items.length,0));
const maxW=100,minW=44;
$("#pyramid").innerHTML=TIERS.map((t,i)=>{
  const w=minW+(maxW-minW)*(i/(TIERS.length-1));
  return `<div class="prow" role="button" tabindex="0" aria-pressed="false" data-tier="${t}"><div class="pbar" style="width:${w}%;background:${TIER_COLOR[t]}">${tierCounts[t]}</div><div class="pl">${t}</div></div>`;
}).join("");
document.querySelectorAll(".prow").forEach(r=>r.onclick=()=>{toggleTier(r.dataset.tier);});

/* ---------- боковая навигация ---------- */
const nav=$("#nav");
TIERS.forEach(t=>{
  const secs=DATA.filter(d=>d.tier===t);if(!secs.length)return;
  const g=document.createElement("div");g.className="navgrp";g.textContent=t;nav.appendChild(g);
  secs.forEach(s=>{
    const a=document.createElement("div");a.className="navlink";a.dataset.sec=s.num;a.setAttribute("role","button");a.tabIndex=0;
    a.innerHTML=`<span class="dot" style="background:${CVAR[s.color]}"></span><span>${s.num}. ${s.title}</span><span class="cc">${s.items.length}</span>`;
    a.onclick=()=>{setView("map");const el=document.getElementById("sec"+s.num);el.classList.remove("hidden");el.classList.add("open");el.querySelector(".sec-h").setAttribute("aria-expanded","true");saveState();setHash("#sec"+s.num);setTimeout(()=>scrollToEl(el),60);};
    nav.appendChild(a);
  });
});

/* ---------- чипы уровней ---------- */
const tc=$("#tierChips");tc.innerHTML='<span class="lbl">Уровень</span>';
TIERS.forEach(t=>{const c=document.createElement("span");c.className="chip";c.dataset.tier=t;c.setAttribute("role","button");c.tabIndex=0;c.setAttribute("aria-pressed","false");
  c.innerHTML=`<span class="cd" style="background:${TIER_COLOR[t]}"></span>${t}`;c.onclick=()=>toggleTier(t);tc.appendChild(c);});
/* ---------- чипы источников ---------- */
const sc=$("#srcChips");sc.innerHTML='<span class="lbl">Источник</span>';
[["adilet","adilet.zan.kz"],["prg","prg.kz"],["gov","gov.kz / akorda"],["other","прочие"]].forEach(([k,lbl])=>{
  const c=document.createElement("span");c.className="chip";c.dataset.src=k;c.setAttribute("role","button");c.tabIndex=0;c.setAttribute("aria-pressed","false");c.textContent=lbl;c.onclick=()=>toggleSrc(k);sc.appendChild(c);});

function toggleTier(t){state.tiers.has(t)?state.tiers.delete(t):state.tiers.add(t);syncChips();render();saveState();}
function toggleSrc(s){state.srcs.has(s)?state.srcs.delete(s):state.srcs.add(s);syncChips();render();saveState();}
function syncChips(){
  document.querySelectorAll(".chip[data-tier]").forEach(el=>{const on=state.tiers.has(el.dataset.tier);el.classList.toggle("on",on);el.setAttribute("aria-pressed",on);});
  document.querySelectorAll(".prow[data-tier]").forEach(el=>{const on=state.tiers.has(el.dataset.tier);el.classList.toggle("on",on);el.setAttribute("aria-pressed",on);});
  document.querySelectorAll(".chip[data-src]").forEach(el=>{const on=state.srcs.has(el.dataset.src);el.classList.toggle("on",on);el.setAttribute("aria-pressed",on);});
}

/* ---------- рендер разделов ---------- */
function linkChips(links){
  if(!links.length)return '<span class="nolink">нет ссылки</span>';
  let html=links.map(u=>{const[cls,lbl]=host(u);return `<a class="lnk ${cls}" href="${u}" target="_blank" rel="noopener">🔗 ${lbl}</a>`;}).join("");
  const label=links.length>1?`Копировать все ссылки (${links.length})`:"Копировать ссылку";
  html+=`<button class="copy" title="${label}" aria-label="${label}" data-urls="${links.join(" ")}">⧉</button>`;
  return html;
}
const secWrap=$("#sections");
function build(){
  secWrap.innerHTML="";
  DATA.forEach(s=>{
    const el=document.createElement("section");el.className="sec";el.id="sec"+s.num;el.style.setProperty("--sc",CVAR[s.color]);
    el.dataset.tier=s.tier;el.dataset.title=s.title.toLowerCase();
    el.innerHTML=`<div class="sec-h" role="button" tabindex="0" aria-expanded="false" aria-controls="secb${s.num}"><div class="snum">${s.num}</div><div class="st" role="heading" aria-level="2">${s.title}</div>
      <span class="stier">${s.tier}</span><span class="scount">${s.items.length} док. · с.${s.page}</span>
      <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m9 18 6-6-6-6"/></svg></div>
      <div class="sec-b" id="secb${s.num}">${s.items.map((it,i)=>`<div class="doc" data-links='${JSON.stringify(it.links.map(u=>host(u)[0]))}' data-title="${it.t.toLowerCase().replace(/"/g,'&quot;')}">
        <span class="dn">${i+1}</span><div class="dt">${it.t}</div>
        <div class="drow"><span class="pg">с. ${it.p}</span>${linkChips(it.links)}</div></div>`).join("")}</div>`;
    const h=el.querySelector(".sec-h");
    h.onclick=()=>{const open=el.classList.toggle("open");h.setAttribute("aria-expanded",open);saveState();};
    secWrap.appendChild(el);
  });
  secWrap.querySelectorAll(".copy").forEach(b=>b.onclick=e=>{e.stopPropagation();const urls=(b.dataset.urls||"").split(" ").filter(Boolean);navigator.clipboard.writeText(urls.join("\n"));b.textContent="✓";b.classList.add("done");setTimeout(()=>{b.textContent="⧉";b.classList.remove("done");},1200);});
}
build();

/* ---------- поиск и фильтры ---------- */
function render(){
  const q=state.q.trim().toLowerCase();let anyVis=false,visCount=0;
  document.querySelectorAll(".sec").forEach(sec=>{
    const tierOk=state.tiers.size===0||state.tiers.has(sec.dataset.tier);
    const secTitleMatch=q&&sec.dataset.title.includes(q);
    let secHasVisible=false;
    sec.querySelectorAll(".doc").forEach(doc=>{
      const dt=doc.querySelector(".dt");const raw=dt.textContent;
      const textOk=!q||raw.toLowerCase().includes(q)||secTitleMatch;
      const srcs=JSON.parse(doc.dataset.links||"[]");
      const srcOk=state.srcs.size===0||srcs.some(s=>state.srcs.has(s));
      const vis=tierOk&&textOk&&srcOk;
      doc.classList.toggle("hidden",!vis);
      dt.innerHTML=(q&&raw.toLowerCase().includes(q))?raw.replace(new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","ig"),"<mark>$1</mark>"):raw;
      if(vis){secHasVisible=true;visCount++;}
    });
    const showSec=tierOk&&secHasVisible;
    sec.classList.toggle("hidden",!showSec);
    if(showSec){anyVis=true;if(q||state.srcs.size){sec.classList.add("open");sec.querySelector(".sec-h").setAttribute("aria-expanded","true");}}
  });
  $("#nores").classList.toggle("hidden",anyVis);
  document.querySelectorAll(".navlink").forEach(n=>{const sec=document.getElementById("sec"+n.dataset.sec);n.style.display=sec.classList.contains("hidden")?"none":"";});
  const active=!!(state.q||state.tiers.size||state.srcs.size);
  $("#fcount").textContent=active?`Показано ${visCount} из ${totalDocs} документов`:`Всего ${totalDocs} документов в ${DATA.length} разделах`;
  $("#resetBtn").classList.toggle("hidden",!active);
}
function resetAll(){state.q="";state.tiers.clear();state.srcs.clear();$("#search").value="";syncChips();render();saveState();$("#search").focus();}
$("#resetBtn").onclick=resetAll;$("#resetBtn2").onclick=resetAll;
$("#search").addEventListener("input",e=>{state.q=e.target.value;render();saveState();});
$("#expandAll").onclick=()=>{document.querySelectorAll(".sec:not(.hidden)").forEach(s=>{s.classList.add("open");s.querySelector(".sec-h").setAttribute("aria-expanded","true");});saveState();};
$("#collapseAll").onclick=()=>{document.querySelectorAll(".sec").forEach(s=>{s.classList.remove("open");s.querySelector(".sec-h").setAttribute("aria-expanded","false");});saveState();};

/* ---------- клавиатура для role=button ---------- */
document.addEventListener("keydown",e=>{
  if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches(".prow,.chip,.sec-h,.navlink")){e.preventDefault();e.target.click();}
});

/* ---------- scroll spy ---------- */
const observer=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){document.querySelectorAll(".navlink").forEach(n=>n.classList.toggle("active",n.dataset.sec===e.target.id.replace("sec","")));}});},{rootMargin:"-140px 0px -70% 0px"});
document.querySelectorAll(".sec").forEach(s=>observer.observe(s));

/* ---------- тема ---------- */
const themeBtn=$("#theme");
function setTheme(t){document.documentElement.dataset.theme=t;themeBtn.textContent=t==="dark"?"☀️":"🌙";themeBtn.setAttribute("aria-label",t==="dark"?"Светлая тема":"Тёмная тема");try{localStorage.setItem("vu-theme",t);}catch(e){}}
themeBtn.onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
try{const s=localStorage.getItem("vu-theme");if(s)setTheme(s);}catch(e){}

/* ===== Инструмент предложений / правок ===== */
const SUBMIT_EMAIL="zakir86kz@gmail.com";
const ovl=$("#ovl");let mode="fix";
const fDoc=$("#fDoc");
DATA.forEach(s=>{const og=document.createElement("optgroup");og.label=`${s.num}. ${s.title}`;
  s.items.forEach((it,i)=>{const o=document.createElement("option");o.value=`${s.num}.${i+1}`;
    o.textContent=`${s.num}.${i+1} — ${it.t.length>70?it.t.slice(0,70)+"…":it.t}`;og.appendChild(o);});
  fDoc.appendChild(og);});
const nSec=$("#nSec");
DATA.forEach(s=>{const o=document.createElement("option");o.value=s.num;o.textContent=`${s.num}. ${s.title}`;nSec.appendChild(o);});
function openM(){ovl.classList.add("show");}
function closeM(){ovl.classList.remove("show");}
$("#fab").onclick=openM;$("#mClose").onclick=closeM;
ovl.addEventListener("click",e=>{if(e.target===ovl)closeM();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ovl.classList.contains("show"))closeM();});
$("#mSeg").querySelectorAll("button").forEach(b=>b.onclick=()=>{
  mode=b.dataset.mode;
  $("#mSeg").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
  $("#fixFields").style.display=mode==="fix"?"":"none";
  $("#newFields").style.display=mode==="new"?"":"none";
});
function docByKey(k){const[sn,idx]=k.split(".");const s=DATA.find(d=>d.num===sn);return s?{sec:s,item:s.items[+idx-1]}:null;}
function buildMsg(){
  const name=$("#sName").value.trim(),mail=$("#sMail").value.trim();
  let subject,body;
  if(mode==="fix"){
    const k=$("#fDoc").value,ctx=docByKey(k);
    if(!ctx||!$("#fVal").value.trim())return null;
    subject=`[Все для ученого] Исправление — п. ${k}`;
    body=`ТИП: Исправление\n`+
      `Документ: ${k} — ${ctx.item.t}\n`+
      `Раздел: ${ctx.sec.num}. ${ctx.sec.title}\n`+
      `Текущая ссылка: ${ctx.item.links.join(", ")||"—"}\n`+
      `Стр. в оригинале: ${ctx.item.p}\n`+
      `Что не так: ${$("#fType").value}\n`+
      `Правильное значение / комментарий:\n${$("#fVal").value.trim()}\n`;
  }else{
    const title=$("#nTitle").value.trim();
    if(!title)return null;
    const sec=DATA.find(d=>d.num===$("#nSec").value);
    subject=`[Все для ученого] Новый документ — ${title.slice(0,50)}`;
    body=`ТИП: Новый документ\n`+
      `Раздел: ${sec.num}. ${sec.title}\n`+
      `Название: ${title}\n`+
      `Ссылка(и): ${$("#nLink").value.trim()||"—"}\n`+
      `Стр. в оригинале: ${$("#nPage").value.trim()||"—"}\n`+
      `Комментарий:\n${$("#nNote").value.trim()||"—"}\n`;
  }
  body+=`\n— — —\nАвтор предложения: ${name||"—"}${mail?" <"+mail+">":""}\nОтправлено из карты «Все для ученого»`;
  return{subject,body};
}
function validate(){
  if(mode==="fix"&&!$("#fVal").value.trim()){$("#fVal").focus();return false;}
  if(mode==="new"&&!$("#nTitle").value.trim()){$("#nTitle").focus();return false;}
  return true;
}
$("#mSend").onclick=()=>{
  if(!validate())return;const m=buildMsg();if(!m)return;
  window.location.href=`mailto:${SUBMIT_EMAIL}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
};
$("#mCopy").onclick=()=>{
  if(!validate())return;const m=buildMsg();if(!m)return;
  const txt=`Кому: ${SUBMIT_EMAIL}\nТема: ${m.subject}\n\n${m.body}`;
  navigator.clipboard.writeText(txt).then(()=>{const b=$("#mCopy");b.textContent="✓ Скопировано";b.classList.add("ok");setTimeout(()=>{b.textContent="⧉ Скопировать";b.classList.remove("ok");},1600);});
};

/* ===== Вкладки: Карта / Гранты + deep-linking ===== */
const views={map:$("#viewMap"),grants:$("#viewGrants")};
function setView(v,noScroll){
  curView=v;
  $("#tabs").querySelectorAll("button").forEach(x=>{const on=x.dataset.view===v;x.classList.toggle("on",on);x.setAttribute("aria-selected",on);});
  views.map.style.display=v==="map"?"":"none";
  views.grants.style.display=v==="grants"?"":"none";
  if(v==="grants")setHash("#grants");else if(location.hash==="#grants")setHash("#map");
  if(!noScroll)window.scrollTo({top:0,behavior:"smooth"});
  saveState();
}
$("#tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>setView(b.dataset.view));

/* ===== Восстановление состояния ===== */
if(SAVED.tiers)SAVED.tiers.forEach(t=>state.tiers.add(t));
if(SAVED.srcs)SAVED.srcs.forEach(s=>state.srcs.add(s));
if(SAVED.q){state.q=SAVED.q;$("#search").value=SAVED.q;}
syncChips();
if(SAVED.open&&SAVED.open.length){SAVED.open.forEach(id=>{const el=document.getElementById(id);if(el){el.classList.add("open");el.querySelector(".sec-h").setAttribute("aria-expanded","true");}});}
else{const first=document.querySelector(".sec");if(first){first.classList.add("open");first.querySelector(".sec-h").setAttribute("aria-expanded","true");}}
render();

/* начальная вкладка: hash > сохранённое > карта */
let initView="map";
if(location.hash==="#grants")initView="grants";
else if(location.hash.indexOf("#sec")===0)initView="map";
else if(SAVED.view)initView=SAVED.view;
setView(initView,true);
if(location.hash.indexOf("#sec")===0){const el=document.querySelector(location.hash);if(el&&el.classList.contains("sec")){el.classList.remove("hidden");el.classList.add("open");el.querySelector(".sec-h").setAttribute("aria-expanded","true");setTimeout(()=>scrollToEl(el),250);}}

/* ===== Чек-лист: восстановление + прогресс ===== */
(function(){
  const boxes=[...document.querySelectorAll("#checklist input")];
  if(SAVED.check)boxes.forEach((b,i)=>{if(SAVED.check[i])b.checked=true;});
  const bar=$("#gpBar");
  function upd(){const d=boxes.filter(b=>b.checked).length;bar.style.width=(d/boxes.length*100)+"%";boxes.forEach(b=>b.closest(".citem").classList.toggle("done",b.checked));saveState();}
  boxes.forEach(b=>b.addEventListener("change",upd));upd();
})();
