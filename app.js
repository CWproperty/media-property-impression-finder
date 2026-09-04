let DATA=null;
const $=id=>document.getElementById(id);
const selectedStates=new Set(),selectedCities=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=n=>n==null||Number.isNaN(n)?"—":new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(n);
const ctr=n=>n==null||Number.isNaN(n)?"—":((n<=1?n*100:n).toFixed(2)+"%");
fetch("data.json").then(r=>r.json()).then(d=>{DATA=d;init()}).catch(()=>document.body.innerHTML="<div style='padding:40px;font-family:Arial'><h2>data.json not found</h2><p>Keep index.html, style.css, app.js and data.json together.</p></div>");

function init(){
  $("updated").textContent=DATA.updated;
  DATA.properties.forEach(p=>$("property").add(new Option(p,p)));
  renderStateMenu();
  $("stateBtn").onclick=e=>{e.stopPropagation();toggleMenu("stateMenu")};
  $("cityBtn").onclick=e=>{e.stopPropagation();if(!selectedStates.size)return;toggleMenu("cityMenu")};
  $("check").onclick=search;
  $("reset").onclick=()=>location.reload();
  document.addEventListener("click",e=>{
    if(!$("stateBox").contains(e.target))$("stateMenu").classList.remove("open");
    if(!$("cityBox").contains(e.target))$("cityMenu").classList.remove("open");
  });
}
function toggleMenu(id){$("stateMenu").classList.toggle("open",id==="stateMenu");$("cityMenu").classList.toggle("open",id==="cityMenu");}
function renderStateMenu(){
  const states=[...new Set(DATA.rows.map(r=>r.state).filter(Boolean))].sort();
  $("stateMenu").innerHTML=`<div class="menu-tools"><button type="button" id="stateAll">Select All</button><button type="button" id="stateClear">Clear</button></div>`+
    states.map(s=>`<label class="check-row"><input type="checkbox" value="${esc(s)}" ${selectedStates.has(s)?"checked":""}> <span>${esc(s)}</span></label>`).join("");
  $("stateMenu").querySelectorAll("input").forEach(cb=>cb.onchange=()=>{
    cb.checked?selectedStates.add(cb.value):selectedStates.delete(cb.value);
    updateStateButton(); updateCities(true);
  });
  $("stateAll").onclick=e=>{e.stopPropagation();states.forEach(s=>selectedStates.add(s));renderStateMenu();updateCities(false);};
  $("stateClear").onclick=e=>{e.stopPropagation();selectedStates.clear();selectedCities.clear();renderStateMenu();updateCities(false);};
  updateStateButton();
}
function updateStateButton(){
  const a=[...selectedStates];
  $("stateBtn").innerHTML=a.length?`${a.length} state${a.length>1?"s":""} selected <span>⌄</span>`:`Select State <span>⌄</span>`;
}
function updateCities(preserve=true){
  const allowed=[...new Set(DATA.rows.filter(r=>!selectedStates.size||selectedStates.has(r.state)).map(r=>r.city))].sort();
  const old=new Set(selectedCities);
  [...selectedCities].forEach(c=>{if(!allowed.includes(c))selectedCities.delete(c)});
  if(!selectedStates.size){selectedCities.clear();$("cityBtn").classList.add("disabled");$("cityBtn").innerHTML='Select State first <span>⌄</span>';}
  else {$("cityBtn").classList.remove("disabled");renderCityMenu(allowed,old);updateCityButton();}
}
function renderCityMenu(cities,old){
  $("cityMenu").innerHTML=`<div class="menu-tools"><button type="button" id="cityAll">Select All</button><button type="button" id="cityClear">Clear</button></div><input class="menu-search" id="citySearch" placeholder="Search city...">`+
    `<div id="cityRows">${cities.map(c=>`<label class="check-row city-row" data-city="${esc(c.toLowerCase())}"><input type="checkbox" value="${esc(c)}" ${selectedCities.has(c)?"checked":""}> <span>${esc(c)}</span></label>`).join("")}</div>`;
  $("cityMenu").querySelectorAll(".check-row input").forEach(cb=>cb.onchange=()=>{cb.checked?selectedCities.add(cb.value):selectedCities.delete(cb.value);updateCityButton()});
  $("cityAll").onclick=e=>{e.stopPropagation();cities.forEach(c=>selectedCities.add(c));renderCityMenu(cities,new Set());updateCityButton()};
  $("cityClear").onclick=e=>{e.stopPropagation();selectedCities.clear();renderCityMenu(cities,new Set());updateCityButton()};
  $("citySearch").oninput=()=>{let q=$("citySearch").value.toLowerCase();$("cityRows").querySelectorAll(".city-row").forEach(r=>r.style.display=r.dataset.city.includes(q)?"flex":"none")};
}
function updateCityButton(){
  const a=[...selectedCities];
  $("cityBtn").innerHTML=a.length?`${a.length} cit${a.length>1?"ies":"y"} selected <span>⌄</span>`:`Select City <span>⌄</span>`;
}
function search(){
  const prop=$("property").value;
  if(!selectedStates.size||!selectedCities.size||!prop){alert("Please tick at least one State, one City and select a Media Property.");return}
  const rows=DATA.rows.filter(r=>selectedStates.has(r.state)&&selectedCities.has(r.city)&&r.property===prop);
  $("selection").hidden=false;
  $("selection").innerHTML=`<b>Selected:</b> ${selectedStates.size} state${selectedStates.size>1?"s":""} • ${selectedCities.size} cit${selectedCities.size>1?"ies":"y"} • ${esc(prop)}`;
  if(!rows.length){$("empty").hidden=false;$("results").hidden=true;return}
  $("empty").hidden=true;$("results").hidden=false;
  $("location").textContent=[...selectedStates].join(", ");
  $("heading").textContent=selectedCities.size===1?[...selectedCities][0]+" – "+prop:selectedCities.size+" Cities – "+prop;
  render(rows);
}
function render(rows){
  const max=Math.max(...rows.map(r=>r.impressions||0),1);
  $("cards").innerHTML=rows.map(r=>`<div class="card property-card ${r.impressions===max?"top":""}">
  <div class="property">${esc(r.city)}</div><div class="unit">${esc(r.state)} • ${esc(r.property)}</div>
  <div class="big">${fmt(r.impressions)}</div><div class="unit">MONTHLY IMPRESSIONS</div>
  <div class="metrics"><div class="metric"><span>Viewable</span><b>${fmt(r.viewable)}</b></div><div class="metric"><span>Clicks</span><b>${fmt(r.clicks)}</b></div><div class="metric"><span>CTR</span><b>${ctr(r.ctr)}</b></div></div></div>`).join("");
  $("tbody").innerHTML=rows.map(r=>`<tr><td>${esc(r.state)}</td><td><b>${esc(r.city)}</b></td><td>${esc(r.property)}</td><td>${fmt(r.impressions)}</td><td>${fmt(r.viewable)}</td><td>${fmt(r.clicks)}</td><td>${ctr(r.ctr)}</td></tr>`).join("");
  const text=rows.map(r=>`${r.state} – ${r.city} – ${r.property}: ${fmt(r.impressions)} monthly impressions | Viewable: ${fmt(r.viewable)} | Clicks: ${fmt(r.clicks)} | CTR: ${ctr(r.ctr)}`).join("\\n");
  $("copy").onclick=()=>navigator.clipboard?.writeText(text).then(()=>alert("Results copied"));
}
