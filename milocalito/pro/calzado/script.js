// MODO DEMO - NO WA REAL
let cart = JSON.parse(localStorage.getItem("leonCart")||"[]");

const menu = document.getElementById("leonMenu");
const drawer = document.getElementById("leonDrawer");
const track = document.getElementById("leonTrack");
const slider = document.querySelector(".leon-slider");

document.getElementById("openMenu").onclick = (e)=>{
  e.stopPropagation();
  menu.classList.toggle("open");
  drawer.classList.remove("open");
};
document.getElementById("openCart").onclick = (e)=>{
  e.stopPropagation();
  drawer.classList.add("open");
  menu.classList.remove("open");
  render();
};
document.getElementById("closeCart").onclick = ()=> drawer.classList.remove("open");
document.getElementById("drawerBg").onclick = ()=> drawer.classList.remove("open");

document.querySelectorAll('.leon-menu a').forEach(a=>{
  a.addEventListener('click', ()=> menu.classList.remove("open"));
});
document.addEventListener("click",(e)=>{
  if(menu &&!menu.contains(e.target) &&!e.target.closest("#openMenu")) menu.classList.remove("open");
  const panel = drawer?.querySelector(".leon-drawer-panel");
  if(panel &&!panel.contains(e.target) &&!e.target.closest("#openCart") &&!e.target.closest("[data-add]")) drawer.classList.remove("open");
});

function save(){ localStorage.setItem("leonCart", JSON.stringify(cart)); }
function render(){
  const list=document.getElementById("leonCartList");
  const totalEl=document.getElementById("leonTotal");
  const countEl=document.getElementById("leonCount");
  const countText=document.getElementById("leonCountText");
  let total=0;
  const qty=cart.reduce((s,i)=>s+i.q,0);
  if(countEl) countEl.textContent=qty;
  if(countText) countText.textContent=`${qty} producto${qty!==1?'s':''}`;
  if(!list||!totalEl) return;
  if(!cart.length){ list.innerHTML=`<div style="color:#6B7280;text-align:center;padding:20px 0">Vacío - agrega calzado fino</div>`; totalEl.textContent="0"; return; }
  list.innerHTML=cart.map((it,i)=>{
    total+=it.p*it.q;
    return `<div class="leon-cart-item"><span>${it.n} x${it.q} - $${(it.p*it.q).toLocaleString("es-MX")}</span><span><button onclick="chg(${i},-1)">-</button> <button onclick="chg(${i},1)">+</button> <button onclick="del(${i})">x</button></span></div>`;
  }).join("");
  totalEl.textContent=total.toLocaleString("es-MX");
}
window.chg=(i,d)=>{ cart[i].q+=d; if(cart[i].q<=0) cart.splice(i,1); save(); render(); };
window.del=(i)=>{ cart.splice(i,1); save(); render(); };

document.addEventListener("click",(e)=>{
  const b=e.target.closest("[data-add]"); if(!b) return;
  const name=b.dataset.add; const price=parseInt(b.dataset.price);
  const ex=cart.find(x=>x.n===name); if(ex) ex.q++; else cart.push({n:name,p:price,q:1});
  save(); render(); drawer.classList.add("open");
});

document.getElementById("btnClear").onclick=()=>{ cart=[]; save(); render(); };

// --- MODAL DEMO ---
const modal=document.getElementById("demoModal");
const modalTxt=document.getElementById("demoTexto");
function openDemo(html){ if(!modal) return; if(modalTxt) modalTxt.innerHTML=html; modal.classList.add("active"); }
function closeDemo(){ modal?.classList.remove("active"); }
document.getElementById("demoClose")?.addEventListener("click",closeDemo);
document.getElementById("demoEntendido")?.addEventListener("click",closeDemo);
modal?.addEventListener("click",e=>{ if(e.target===modal) closeDemo(); });

document.getElementById("btnPagar").onclick=()=>{
  if(!cart.length){ openDemo("Tu carrito está vacío.<br><br>Agrega un par de Zapaterías León primero 👞"); return; }
  const nombre=document.getElementById("leonName").value||"Cliente Demo";
  const pay=document.querySelector('input[name="pay"]:checked')?.value||"Transferencia";
  let total=0; let detalleHTML=""; let detalleTxt="";
  cart.forEach(it=>{ total+=it.p*it.q; detalleHTML+=`• ${it.n} x${it.q} - $${it.p*it.q}<br>`; detalleTxt+=`• ${it.n} x${it.q}\n`; });
  openDemo(
    `🔒 MODO DEMO - ZAPATERÍAS LEÓN<br><br>`+
    `<b>Cliente:</b> ${nombre}<br>`+
    `<b>Pago:</b> ${pay} ${pay==='Transferencia'?'-5%':''}<br><br>`+
    detalleHTML+
    `<br><b>Total: $${total.toLocaleString("es-MX")}</b><br><br>`+
    `En la tienda real aquí se cobraría con Mercado Pago / te mandaría a WhatsApp con:<br>`+
    `<i>"${detalleTxt}Total $${total} - ${pay}"</i><br><br>`+
    `No se cobró nada real.`
  );
  // NO vaciamos para que vean demo
};

document.querySelectorAll(".btn-demo, #btnUbiWa, .soc-wa").forEach(b=>{
  b.addEventListener("click",e=>{
    e.preventDefault();
    openDemo("En la tienda real aquí se abriría WhatsApp de Zapaterías León.<br><br>En esta <b>DEMO</b> está desactivado para no spamear.<br><br>📍 Zona Piel, León GTO - Blvd. Hilario Medina 123<br>🚚 Envío nacional 24-48h");
  });
});

if(track && slider){
  slider.addEventListener("mouseenter", ()=> track.classList.add("paused"));
  slider.addEventListener("mouseleave", ()=> track.classList.remove("paused"));
  slider.addEventListener("touchstart", ()=> track.classList.add("paused"), {passive:true});
  slider.addEventListener("touchend", ()=> setTimeout(()=> track.classList.remove("paused"), 1200));
}

const hero = document.querySelector(".leon-hero-impact");
const title = document.querySelector(".leon-hero-title");
const subs = document.querySelector(".leon-hero-subs");
const topText = document.querySelector(".leon-hero-side.top");
const bottomText = document.querySelector(".leon-hero-side.bottom");
const btn = document.querySelector(".leon-hero-btn");
function replayHero(){
  [title, subs, topText, bottomText, btn].forEach(el=>{
    if(!el) return;
    el.classList.remove("animate-title","animate-sub","animate-top","animate-bottom","animate-btn");
    void el.offsetWidth;
  });
  if(title) title.classList.add("animate-title");
  if(subs) subs.classList.add("animate-sub");
  if(topText) topText.classList.add("animate-top");
  if(bottomText) bottomText.classList.add("animate-bottom");
  if(btn) btn.classList.add("animate-btn");
}
if(hero){
  replayHero();
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) replayHero(); });
  },{threshold:0.5});
  observer.observe(hero);
  document.querySelectorAll('.leon-menu a[href="#top"]').forEach(a=>{
    a.addEventListener("click", ()=> setTimeout(replayHero, 200));
  });
}
render();