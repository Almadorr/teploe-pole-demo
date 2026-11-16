(function(){
"use strict";
var KEY = "tp-data-v1";
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function load(){
  var d = clone(window.DEFAULT_DATA);
  try { var s = localStorage.getItem(KEY); if (s) { var u = JSON.parse(s); for (var k in u) d[k] = u[k]; } } catch(e){}
  if (!d.pages) d.pages = [];
  return d;
}
var D = load();
window.TP = { data: D, KEY: KEY, save: function(){ try{ localStorage.setItem(KEY, JSON.stringify(D)); return true; }catch(e){ return false; } }, reset: function(){ try{ localStorage.removeItem(KEY); }catch(e){} } };

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function $(s, r){ return (r||document).querySelector(s); }
function line(id){ for (var i=0;i<D.lines.length;i++) if (D.lines[i].id===id) return D.lines[i]; return D.lines[0]; }
function prod(id){ for (var i=0;i<D.products.length;i++) if (D.products[i].id===id) return D.products[i]; return null; }
function rub(n){ return Number(n).toLocaleString("ru-RU") + " ₽"; }
function qs(k){ return new URLSearchParams(location.search).get(k); }
function fmtDate(s){ var d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}); }
TP.esc = esc; TP.line = line; TP.rub = rub;

/* ---------- рисунок упаковки ---------- */
var uid = 0;
function shade(hex, p){ var n=parseInt(hex.slice(1),16), r=n>>16, g=n>>8&255, b=n&255; function f(c){ return Math.max(0,Math.min(255,Math.round(c+(p<0?c:255-c)*p))); } return "#"+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1); }
function wrapName(name){
  var w = String(name).replace(/[«»]/g,"").split(" "), a=[], cur="";
  w.forEach(function(x){ if ((cur+" "+x).trim().length > 11 && cur) { a.push(cur); cur = x; } else cur = (cur+" "+x).trim(); });
  if (cur) a.push(cur);
  return a.slice(0,3);
}
function pack(p){
  var c = line(p.line).color, id = "g"+(++uid), dark = shade(c,-.25), light = shade(c,.18);
  var lines = wrapName(p.name), y0 = 160 - (lines.length-1)*11;
  var longest = Math.max.apply(null, lines.map(function(l){ return l.length; }));
  var fs = Math.min(17, Math.floor(128 / (longest * 0.74) * 10) / 10);
  var t = lines.map(function(l,i){ return '<text x="100" y="'+(y0+i*22)+'" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="700" font-size="'+fs+'" fill="#2B2416">'+esc(l)+'</text>'; }).join("");
  return '<svg class="pack" viewBox="0 0 200 280" role="img" aria-label="Упаковка: '+esc(p.name)+'"><defs><linearGradient id="'+id+'" x1="0" x2="1"><stop offset="0" stop-color="'+dark+'"/><stop offset=".35" stop-color="'+light+'"/><stop offset=".7" stop-color="'+c+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient></defs>'
   + '<path d="M22 32Q22 16 38 16H162Q178 16 178 32L188 248Q190 270 168 270H32Q10 270 12 248Z" fill="url(#'+id+')"/>'
   + '<path d="M22 32Q22 16 38 16H162Q178 16 178 32L179 44H21Z" fill="'+dark+'" opacity=".55"/>'
   + '<g stroke="#fff" stroke-opacity=".35" stroke-width="1">'+[26,30,34,38].map(function(y){return '<line x1="30" x2="170" y1="'+y+'" y2="'+y+'"/>';}).join("")+'</g>'
   + '<g transform="translate(100 74)" fill="#FFF5DA"><path d="M0 -20C-6 -12 -6 -4 0 4C6 -4 6 -12 0 -20Z"/><path d="M-3 6C-12 2 -16 -6 -15 -12C-8 -10 -4 -4 -3 6Z"/><path d="M3 6C12 2 16 -6 15 -12C8 -10 4 -4 3 6Z"/><rect x="-1" y="4" width="2" height="16"/></g>'
   + '<text x="100" y="112" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="700" font-size="11" letter-spacing="2" fill="#FFF5DA">ТЁПЛОЕ ПОЛЕ</text>'
   + '<rect x="30" y="124" width="140" height="'+(lines.length*22+30)+'" rx="14" fill="#FFFDF5"/>'
   + t
   + '<text x="100" y="250" text-anchor="middle" font-family="Manrope,sans-serif" font-weight="800" font-size="15" fill="#FFF5DA">'+esc(p.weight)+'</text></svg>';
}
function bowl(color){
  var id="b"+(++uid);
  return '<svg viewBox="0 0 200 140" aria-hidden="true"><defs><radialGradient id="'+id+'"><stop offset="0" stop-color="'+shade(color,.35)+'"/><stop offset="1" stop-color="'+color+'"/></radialGradient></defs>'
   + '<ellipse cx="100" cy="62" rx="82" ry="20" fill="url(#'+id+')"/>'
   + Array.from({length:22},function(_,i){ return '<circle cx="'+(32+((i*37)%136))+'" cy="'+(52+((i*13)%20))+'" r="3" fill="'+shade(color,-.2)+'" opacity=".55"/>'; }).join("")
   + '<path d="M16 62Q20 128 100 128Q180 128 184 62Q160 84 100 84Q40 84 16 62Z" fill="#FFFDF8"/><path d="M16 62Q20 128 100 128Q180 128 184 62" fill="none" stroke="#2B2416" stroke-opacity=".12" stroke-width="2"/>'
   + '<path d="M150 30L186 6" stroke="#8B6A3E" stroke-width="7" stroke-linecap="round"/></svg>';
}
TP.pack = pack;

/* ---------- шапка и подвал ---------- */
var logo = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#3F5A2A"/><g fill="#F3D58A" transform="translate(20 21)"><path d="M0 -14C-4 -8 -4 -3 0 2C4 -3 4 -8 0 -14Z"/><path d="M-2 4C-9 1 -11 -4 -10 -8C-5 -7 -3 -3 -2 4Z"/><path d="M2 4C9 1 11 -4 10 -8C5 -7 3 -3 2 4Z"/><rect x="-1" y="2" width="2" height="11"/></g></svg>';
function layout(){
  var page = document.body.getAttribute("data-page");
  var items = [["index","index.html","Главная"],["products","products.html","Продукция"],["quality","quality.html","О бренде"],["recipes","recipes.html","Рецепты"],["where","where.html","Где купить"],["contacts","contacts.html","Контакты"]];
  D.pages.forEach(function(p){ items.push(["p-"+p.id,"page.html?id="+encodeURIComponent(p.id),p.title]); });
  var cur = page === "page" ? "p-"+qs("id") : page === "product" ? "products" : page;
  var top = $("#top");
  if (top) {
    top.className = "top";
    top.innerHTML = '<div class="demo-note">Демо-версия сайта. Бренд «Тёплое поле» вымышленный — сделан как пример работы.</div><div class="wrap"><a class="logo" href="index.html">'+logo+esc(D.brand.name)+'</a><nav class="nav" id="nav">'
      + items.map(function(i){ return '<a href="'+i[1]+'"'+(i[0]===cur?' class="on" aria-current="page"':'')+'>'+esc(i[2])+'</a>'; }).join("")
      + '</nav><button class="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button></div>';
    var b = $(".burger", top), n = $("#nav");
    b.addEventListener("click", function(){ var o = n.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
  }
  var f = $("#foot");
  if (f) {
    f.className = "foot";
    f.innerHTML = '<div class="wrap"><div><a class="logo" href="index.html">'+logo+esc(D.brand.name)+'</a><p>'+esc(D.brand.slogan)+'</p></div>'
      + '<div><h4>Разделы</h4>'+items.slice(1).map(function(i){ return '<a href="'+i[1]+'">'+esc(i[2])+'</a>'; }).join("")+'</div>'
      + '<div><h4>Связаться</h4><a href="tel:'+esc(D.brand.phone.replace(/[^+\d]/g,""))+'">'+esc(D.brand.phone)+'</a><a href="mailto:'+esc(D.brand.email)+'">'+esc(D.brand.email)+'</a><a href="admin.html">Кабинет управления →</a></div>'
      + '<div class="copy">© '+new Date().getFullYear()+' '+esc(D.brand.name)+'. Демо-сайт, все данные вымышленные.</div></div>';
  }
}

/* ---------- кусочки страниц ---------- */
function prodCard(p){
  return '<a class="prod rv" href="product.html?id='+encodeURIComponent(p.id)+'"><div class="ph">'+(p.isNew?'<span class="chip new">Новинка</span>':'')+pack(p)+'</div><h3>'+esc(p.name)+'</h3><small>'+esc(line(p.line).name)+' · '+esc(p.weight)+'</small><div class="price">'+rub(p.price)+'</div></a>';
}
function recCard(r){
  var p = prod(r.product) || D.products[0];
  return '<button class="rec rv" data-rec="'+esc(r.id)+'"><div class="pic" style="background:'+shade(line(p.line).color,.75)+'">'+bowl(line(p.line).color)+'</div><div class="body"><h3>'+esc(r.name)+'</h3><div class="meta"><span>⏱ '+r.time+' мин</span><span>🍽 '+r.portions+' порц.</span><span>'+esc(r.level)+'</span></div></div></button>';
}
function newsList(list){
  return list.map(function(n){ return '<article class="rv"><time>'+esc(fmtDate(n.date))+'</time><h3>'+esc(n.title)+'</h3><p>'+esc(n.text)+'</p></article>'; }).join("");
}
function shopsList(){
  return D.shops.map(function(s){ var ext = /^https?:/.test(s.url); return '<a class="shop rv" href="'+esc(s.url)+'"'+(ext?' target="_blank" rel="noopener"':'')+'><span><b>'+esc(s.name)+'</b><small>'+esc(s.type)+'</small></span><span class="arr">↗</span></a>'; }).join("");
}
function recipeModal(){
  var m = document.createElement("div"); m.className = "modal"; m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true");
  m.innerHTML = '<div class="box"><button class="x" aria-label="Закрыть">×</button><div class="in"></div></div>';
  document.body.appendChild(m);
  function close(){ m.classList.remove("open"); document.body.style.overflow=""; }
  m.addEventListener("click", function(e){ if (e.target===m || e.target.classList.contains("x")) close(); });
  document.addEventListener("keydown", function(e){ if (e.key==="Escape") close(); });
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-rec]"); if (!b) return;
    var r = D.recipes.filter(function(x){ return x.id===b.getAttribute("data-rec"); })[0]; if (!r) return;
    var p = prod(r.product);
    $(".in", m).innerHTML = '<span class="eyebrow">Рецепт · '+r.time+' мин · '+r.portions+' порц.</span><h2>'+esc(r.name)+'</h2><div class="cols2"><div><h4>Понадобится</h4><ul>'+r.ingredients.map(function(i){return '<li>'+esc(i)+'</li>';}).join("")+'</ul>'
      + (p ? '<a class="btn" href="product.html?id='+encodeURIComponent(p.id)+'">'+esc(p.name)+' →</a>' : '')+'</div><div><h4>Как готовить</h4><ol>'+r.steps.map(function(i){return '<li>'+esc(i)+'</li>';}).join("")+'</ol></div></div>';
    m.classList.add("open"); document.body.style.overflow="hidden"; $(".x", m).focus();
  });
}

/* ---------- страницы ---------- */
var pages = {
  index: function(){
    var hp = ["grechka","multi","spagetti"].map(prod).filter(Boolean);
    while (hp.length < 3 && D.products[hp.length]) hp.push(D.products[hp.length]);
    $("#hero-packs").innerHTML = hp.map(pack).join("");
    $("#slogan").textContent = D.brand.slogan;
    $("#about").textContent = D.brand.about;
    $("#stats").innerHTML = D.stats.map(function(s){ return '<div class="stat rv"><b data-count="'+s.value+'" data-suf="'+esc(s.suffix)+'">0</b><span>'+esc(s.label)+'</span></div>'; }).join("");
    $("#lines").innerHTML = D.lines.map(function(l){
      var p = D.products.filter(function(x){return x.line===l.id;})[0] || {name:l.name,line:l.id,weight:""};
      return '<a class="line-card rv" style="background:'+l.color+'" href="products.html?line='+l.id+'"><h3>'+esc(l.name)+'</h3><p>'+esc(l.text)+'</p>'+pack(p)+'</a>';
    }).join("");
    $("#new").innerHTML = D.products.filter(function(p){return p.isNew;}).map(prodCard).join("");
    $("#recipes").innerHTML = D.recipes.slice(0,4).map(recCard).join("");
    $("#news").innerHTML = newsList(D.news.slice(0,3));
    $("#shops").innerHTML = shopsList();
    var t = D.lines.map(function(l){return '<b>'+esc(l.name)+'</b> ✦';}).join("") + '<b>Без ГМО</b> ✦<b>Своё поле</b> ✦';
    $("#ticker").innerHTML = '<div>'+t+t+t+t+'</div>';
    recipeModal();
  },
  products: function(){
    var cur = qs("line") || "all", f = $("#filters"), g = $("#grid");
    function draw(){
      f.innerHTML = [["all","Все"]].concat(D.lines.map(function(l){return [l.id,l.name];})).map(function(x){ return '<button data-l="'+x[0]+'" class="'+(x[0]===cur?"on":"")+'">'+esc(x[1])+'</button>'; }).join("");
      var list = D.products.filter(function(p){ return cur==="all" || p.line===cur; });
      g.innerHTML = list.map(prodCard).join("") || "<p>В этой линейке пока нет товаров.</p>";
      var l = cur==="all" ? null : line(cur);
      $("#line-text").textContent = l ? l.text : "Четыре линейки: крупы, хлопья, мука и макароны. Выберите, что нужно.";
      reveal();
    }
    f.addEventListener("click", function(e){ var b = e.target.closest("button"); if (!b) return; cur = b.getAttribute("data-l"); history.replaceState(null,"",cur==="all"?"products.html":"products.html?line="+cur); draw(); });
    draw();
  },
  product: function(){
    var p = prod(qs("id")) || D.products[0], l = line(p.line);
    document.title = p.name + " — " + D.brand.name;
    var max = Math.max(p.protein, p.fat, p.carbs, 1);
    $("#pdp").innerHTML = '<div class="ph">'+pack(p)+'</div><div><div class="crumbs"><a href="products.html">Продукция</a> / <a href="products.html?line='+l.id+'">'+esc(l.name)+'</a></div>'
      + (p.isNew?'<span class="chip new">Новинка</span> ':'')+'<span class="chip">'+esc(l.name)+'</span><h1 style="font-size:clamp(28px,4vw,46px);margin-top:12px">'+esc(p.name)+'</h1><p class="lead">'+esc(p.text)+'</p>'
      + '<div class="facts"><div class="fact"><b>'+esc(p.weight)+'</b><span>вес</span></div><div class="fact"><b>'+p.kcal+'</b><span>ккал / 100 г</span></div><div class="fact"><b>'+esc(p.cook)+'</b><span>варить</span></div><div class="fact"><b>'+rub(p.price)+'</b><span>рекоменд. цена</span></div></div>'
      + '<h4>Пищевая ценность на 100 г</h4><div class="bars">'
      + [["Белки",p.protein,"#5E7F3A"],["Жиры",p.fat,"#E3A833"],["Углеводы",p.carbs,"#C9762B"]].map(function(b){ return '<div class="bar"><div><span>'+b[0]+'</span><span>'+b[1]+' г</span></div><i><em style="background:'+b[2]+'" data-w="'+(b[1]/max*100)+'"></em></i></div>'; }).join("")
      + '</div><div class="buy-row">'+D.shops.slice(0,3).map(function(s){ return '<a class="btn'+(s===D.shops[0]?'':' ghost')+'" href="'+esc(s.url)+'" target="_blank" rel="noopener">Купить на '+esc(s.name)+'</a>'; }).join("")+'</div></div>';
    setTimeout(function(){ document.querySelectorAll(".bar em").forEach(function(e){ e.style.width = e.getAttribute("data-w")+"%"; }); }, 200);
    var rel = D.recipes.filter(function(r){return r.product===p.id;});
    $("#rel-recipes").innerHTML = rel.length ? rel.map(recCard).join("") : D.recipes.slice(0,3).map(recCard).join("");
    $("#more").innerHTML = D.products.filter(function(x){return x.line===p.line && x.id!==p.id;}).concat(D.products.filter(function(x){return x.line!==p.line;})).slice(0,4).map(prodCard).join("");
    recipeModal();
  },
  quality: function(){},
  recipes: function(){
    var g = $("#grid"), f = $("#filters"), cur = "all";
    function draw(){
      f.innerHTML = [["all","Все рецепты"]].concat(D.lines.map(function(l){return [l.id,l.name];})).map(function(x){ return '<button data-l="'+x[0]+'" class="'+(x[0]===cur?"on":"")+'">'+esc(x[1])+'</button>'; }).join("");
      var list = D.recipes.filter(function(r){ var p = prod(r.product); return cur==="all" || (p && p.line===cur); });
      g.innerHTML = list.map(recCard).join("") || "<p>Рецептов для этой линейки пока нет — скоро добавим.</p>";
      reveal();
    }
    f.addEventListener("click", function(e){ var b = e.target.closest("button"); if (!b) return; cur = b.getAttribute("data-l"); draw(); });
    draw(); recipeModal();
  },
  where: function(){ $("#shops").innerHTML = shopsList(); },
  contacts: function(){
    $("#c-phone").textContent = D.brand.phone; $("#c-email").textContent = D.brand.email; $("#c-addr").textContent = D.brand.address;
    $("#form").addEventListener("submit", function(e){ e.preventDefault(); this.innerHTML = '<h3>Спасибо!</h3><p>Это демо — сообщение никуда не отправилось. На настоящем сайте заявка придёт на почту или в Телеграм.</p>'; });
  },
  page: function(){
    var p = D.pages.filter(function(x){return x.id===qs("id");})[0];
    $("#ptitle").textContent = p ? p.title : "Страница не найдена";
    $("#ptext").textContent = p ? p.text : "Её могли удалить в кабинете управления.";
    if (p) document.title = p.title + " — " + D.brand.name;
  }
};

/* ---------- анимации ---------- */
var io = "IntersectionObserver" in window ? new IntersectionObserver(function(es){
  es.forEach(function(e){ if (!e.isIntersecting) return; e.target.classList.add("in"); io.unobserve(e.target);
    e.target.querySelectorAll("[data-count]").forEach(count); });
},{threshold:.15}) : null;
function count(el){
  var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suf")||"", t0 = performance.now(), yr = to > 1900 && to < 2100;
  (function step(t){ var k = Math.min(1,(t-t0)/1400), v = Math.round(to*(1-Math.pow(1-k,3))); el.textContent = (yr? v : v.toLocaleString("ru-RU")) + suf; if (k<1) requestAnimationFrame(step); })(t0);
}
function reveal(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){ if (io) io.observe(el); else { el.classList.add("in"); el.querySelectorAll("[data-count]").forEach(count); } }); }
TP.reveal = reveal;

layout();
var pg = document.body.getAttribute("data-page");
if (pages[pg]) pages[pg]();
reveal();
})();
