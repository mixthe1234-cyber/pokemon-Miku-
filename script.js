const API="https://pokeapi.co/api/v2";
const grid=document.querySelector("#grid"), search=document.querySelector("#search"), filters=document.querySelector("#filters"), status=document.querySelector("#status"), more=document.querySelector("#loadMore");
let all=[], filtered=[], visible=20, activeType="all", favorites=JSON.parse(localStorage.getItem("goFavorites")||"[]");

const pretty=n=>n.split("-").map(x=>x[0].toUpperCase()+x.slice(1)).join(" ");
const typePL=t=>t;

async function load(){
 try{
   const res=await fetch(API+"/pokemon?limit=1025");
   const data=await res.json();
   status.textContent=`Wczytano ${data.count} Pokémonów • kliknij kartę, aby zobaczyć dane`;
   all=data.results.map((x,i)=>({id:i+1,name:x.name,url:x.url}));
   await hydrate();
 }catch(e){status.textContent="Nie udało się pobrać danych. Sprawdź połączenie z internetem."; more.style.display="none"}
}
async function hydrate(){
 // Pobieramy pierwsze 60 rekordów, resztę strona dociąga przy przewijaniu/ładowaniu.
 const batch=all.slice(0,60);
 const results=await Promise.all(batch.map(x=>fetch(x.url).then(r=>r.json()).catch(()=>null)));
 all=all.map((x,i)=>results[i]?({...x,types:results[i].types.map(t=>t.type.name),sprite:results[i].sprites.other?.["official-artwork"]?.front_default||results[i].sprites.front_default,stats:results[i].stats}):x);
 apply();
}
function apply(){
 const q=search.value.toLowerCase().trim();
 filtered=all.filter(p=>(activeType==="all"||p.types?.includes(activeType))&&(!q||p.name.includes(q)||String(p.id)===q));
 render();
}
function render(){
 const list=filtered.slice(0,visible);
 grid.innerHTML=list.map(p=>`
 <article class="card" onclick="showPokemon(${p.id})">
  <button class="fav" onclick="event.stopPropagation();toggleFav(${p.id})">${favorites.includes(p.id)?"★":"☆"}</button>
  <div class="sprite">${p.sprite?`<img loading="lazy" src="${p.sprite}" alt="${pretty(p.name)}">`:"<span>◌</span>"}</div>
  <h3>${pretty(p.name)}</h3><div class="num">#${String(p.id).padStart(4,"0")}</div>
  <div class="types">${(p.types||[]).map(t=>`<span class="type">${t}</span>`).join("")}</div>
 </article>`).join("");
 more.style.display=filtered.length>visible?"block":"none";
}
function toggleFav(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem("goFavorites",JSON.stringify(favorites));render()}
window.showPokemon=async id=>{
 const p=all.find(x=>x.id===id);
 if(!p)return;
 if(!p.stats){const d=await fetch(API+"/pokemon/"+id).then(r=>r.json());p.types=d.types.map(t=>t.type.name);p.sprite=d.sprites.other?.["official-artwork"]?.front_default||d.sprites.front_default;p.stats=d.stats}
 const stats=p.stats.map(s=>`${pretty(s.stat.name)}: ${s.base_stat}`).join(" • ");
 toast(`${pretty(p.name)} #${String(p.id).padStart(4,"0")} — ${stats}`);
}
filters.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;document.querySelectorAll("#filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeType=b.dataset.type;visible=20;apply()});
search.addEventListener("input",()=>{visible=20;apply()});
more.addEventListener("click",()=>{visible+=20;render()});
document.querySelector("#theme").onclick=()=>{document.body.classList.toggle("light");document.querySelector("#theme").textContent=document.body.classList.contains("light")?"☀":"☾"};
document.querySelector("#mobileMenu").onclick=()=>{const n=document.querySelector("#navLinks");n.style.display=n.style.display==="flex"?"":"flex";if(n.style.display==="flex"){n.style.position="absolute";n.style.top="74px";n.style.left="0";n.style.right="0";n.style.padding="20px 6%";n.style.background="#060810";n.style.flexDirection="column"}};
let toastTimer;window.toast=msg=>{const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2500)};
load();