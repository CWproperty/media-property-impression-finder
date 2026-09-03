let DATA=null;const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=n=>n==null||Number.isNaN(n)?"—":new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(n);
const ctr=n=>n==null||Number.isNaN(n)?"—":((n<=1?n*100:n).toFixed(2)+"%");
fetch("data.json").then(r=>r.json()).then(d=>{DATA=d;init()}).catch(()=>document.body.innerHTML="<div style='padding:40px;font-family:Arial'><h2>Data file not found</h2><p>Keep data.json in the same folder as index.html.</p></div>");
function init(){ $("updated").textContent=DATA.updated;
[...new Set(DATA.rows.map(r=>r.state))].filter(Boolean).sort().forEach(s=>{let o=document.createElement("option");o.value=s;o.textContent=s;$("state").appendChild(o)});
DATA.properties.forEach(p=>{let o=document.createElement("option");o.value=p;o.textContent=p;$("property").appendChild(o)});
[...new Set(DATA.rows.map(r=>r.city))].sort().forEach(c=>{let o=document.createElement("option");o.value=c;$("cities").appendChild(o)});
$("search").onclick=search;$("reset").onclick=()=>location.reload();$("city").onkeydown=e=>{if(e.key==="Enter")search()}}
function search(){let city=$("city").value.trim(),state=$("state").value,prop=$("property").value;if(!city)return;
let rows=DATA.rows.filter(r=>r.city.toLowerCase()===city.toLowerCase()&&(!state||r.state===state));
if(prop)rows=rows.filter(r=>r.property===prop);$("empty").hidden=!!rows.length;$("results").hidden=!rows.length;if(!rows.length){$("empty").innerHTML="<div>!</div><h2>No impression data available</h2><p>"+esc(city)+" could not be found for the selected filters.</p>";return}
$("heading").textContent=rows[0].city+" – Media Properties";render(rows)}
function render(rows){let max=Math.max(...rows.map(r=>r.impressions||0),1);
$("cards").innerHTML=rows.map(r=>`<div class="card property-card ${r.impressions===max?"top":""}"><div class="property">${esc(r.property)}</div><div class="big">${fmt(r.impressions)}</div><div class="unit">MONTHLY IMPRESSIONS</div><div class="metrics"><div class="metric"><span>Viewable</span><b>${fmt(r.viewable)}</b></div><div class="metric"><span>Clicks</span><b>${fmt(r.clicks)}</b></div><div class="metric"><span>CTR</span><b>${ctr(r.ctr)}</b></div></div></div>`).join("");
$("tbody").innerHTML=rows.map(r=>`<tr><td><b>${esc(r.property)}</b></td><td>${fmt(r.impressions)}</td><td>${fmt(r.viewable)}</td><td>${fmt(r.clicks)}</td><td>${ctr(r.ctr)}</td></tr>`).join("");
let text=rows.map(r=>`${r.city} – ${r.property}: ${fmt(r.impressions)} monthly impressions | Viewable: ${fmt(r.viewable)} | Clicks: ${fmt(r.clicks)} | CTR: ${ctr(r.ctr)}`).join("\\n");$("copy").onclick=()=>navigator.clipboard?.writeText(text).then(()=>alert("Results copied"))}
