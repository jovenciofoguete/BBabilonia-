/* menu-babilonia.js — BBabilônia
   1) Menu fixo em baixo: Início, Chat, Carrinho, Meu Babilônia
   2) Na primeira visita: janela País / Idioma / Moeda
      Sem escolha: idioma do telemóvel e moeda USD.
   Não mexe no cabeçalho de cima. Escolhas guardadas em localStorage "bb_prefs". */
(function(){
var d=document;
if(window.BBPrefs)return;
var PAISES="AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");
var LINGUAS="af ak am ar as az be bg bm bn bo br bs ca ce cs cy da de dz ee el en eo es et eu fa ff fi fil fo fr fy ga gd gl gu gv ha he hi hr ht hu hy ia id ig ii is it ja jv ka ki kk kl km kn ko ks ku kw ky lb lg ln lo lt lu lv mg mi mk ml mn mr ms mt my nb nd ne nl nn no ny om or os pa pl ps pt qu rm rn ro ru rw sa sd se sg si sk sl sn so sq sr st su sv sw ta te tg th ti tk tl tn to tr ts tt ug uk ur uz ve vi wo xh yi yo zh zu".split(" ");
var MOEDAS_BASE="AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL".split(" ");
function ler(){try{return JSON.parse(localStorage.getItem("bb_prefs")||"null")}catch(e){return null}}
function gravar(p){try{localStorage.setItem("bb_prefs",JSON.stringify(p))}catch(e){}}
var tel=(navigator.languages&&navigator.languages[0])||navigator.language||"pt";
var regTel=(tel.split("-")[1]||"").toUpperCase();
function nomes(tipo,codigos){
  var dn=null;try{dn=new Intl.DisplayNames([tel,"pt"],{type:tipo})}catch(e){}
  return codigos.map(function(c){var n=c;try{n=dn?dn.of(c)||c:c}catch(e){}return{c:c,n:n}})
    .sort(function(a,b){return a.n.localeCompare(b.n)});
}
function moedas(){
  var l=MOEDAS_BASE;
  try{if(Intl.supportedValuesOf){var s=Intl.supportedValuesOf("currency");if(s&&s.length>l.length)l=s}}catch(e){}
  return nomes("currency",l);
}
function pref(){
  var p=ler()||{};
  return{pais:p.pais||regTel||"",idioma:p.idioma||tel,moeda:p.moeda||"USD",escolhido:!!p.escolhido};
}
window.BBPrefs={ler:pref,abrir:janela};
try{d.documentElement.lang=pref().idioma}catch(e){}

var css=d.createElement("style");
css.textContent=
".bb-nav{position:fixed;left:0;right:0;bottom:0;z-index:9000;display:flex;background:#fff;border-radius:0;border-top:1px solid #e5e7eb;padding:8px 4px calc(8px + env(safe-area-inset-bottom,0px));box-shadow:0 -2px 10px #0000000f;font-family:system-ui,sans-serif}"+
".bb-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;color:#6b6590;font-size:11.5px;font-weight:600;text-decoration:none;position:relative}"+
".bb-nav a span.b{width:40px;height:32px;border-radius:12px;display:flex;align-items:center;justify-content:center}"+
".bb-nav a.on{color:#0ea5e9}.bb-nav a.on span.b{background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff;box-shadow:0 4px 12px #0ea5e966}"+
".bb-nav svg{width:22px;height:22px}"+
".bb-nav .n{position:absolute;top:-6px;left:calc(50% + 8px);min-width:19px;height:19px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}"+
"@media (prefers-color-scheme:dark){.bb-nav{background:#1d1838;border-top-color:#2e2852}.bb-nav a{color:#a9a2cf}.bb-nav .n{border-color:#1d1838}}"+
"body{padding-bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}"+
".bb-fundo{position:fixed;inset:0;z-index:9500;background:rgba(17,14,34,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif}"+
".bb-jan{background:#fff;color:#1b1740;border-radius:22px;width:100%;max-width:420px;position:relative;overflow:hidden;box-shadow:0 20px 50px #0006}"+
".bb-jan h3{margin:0;padding:20px 20px 18px;font-size:19px;color:#fff;background:linear-gradient(135deg,#10b981,#0ea5e9 55%,#2563eb)}"+
".bb-jan h3 small{display:block;font-size:13px;font-weight:400;opacity:.9;margin-top:4px}"+
".bb-jan .cp{padding:4px 20px 20px}"+
".bb-jan label{display:block;font-size:14px;font-weight:700;color:#6b6590;margin:14px 0 5px}"+
".bb-jan select{width:100%;padding:13px;border:2px solid #ebe7f6;border-radius:12px;font-size:15px;background:#faf8ff;color:#1b1740}"+
".bb-jan select:focus{outline:none;border-color:#0ea5e9}"+
".bb-jan button.ok{width:100%;margin-top:20px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff;font-size:16px;font-weight:800;box-shadow:0 6px 16px #0ea5e955}"+
".bb-jan{color-scheme:light}.bb-campo{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;padding:13px;border:2px solid #FF6A00;border-radius:12px;font-size:15px;background:#fff;color:#1b1740}"+
".bb-campo b{font-weight:400;font-size:15px}"+
".bb-lista{height:min(640px,calc(100vh - 32px));display:flex;flex-direction:column}"+
".bb-topo{display:flex;align-items:center;gap:10px;padding:14px 14px 8px;font-size:17px}.bb-volta{border:0;background:#f1f1f1;width:36px;height:36px;border-radius:50%;font-size:24px;line-height:1;color:#222}"+
".bb-busca{margin:0 14px 8px;display:flex;align-items:center;gap:6px;border:2px solid #FF6A00;border-radius:999px;padding:0 12px}.bb-busca input{flex:1;border:0;padding:11px 0;font-size:16px;background:transparent;color:#222;min-width:0}.bb-busca input:focus{outline:none}"+
".bb-itens{flex:1;overflow-y:auto;padding:0 6px 10px}.bb-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;border:0;border-bottom:1px solid #eee;background:#fff;padding:13px 10px;font-size:15px;color:#222}"+
".bb-item i{font-style:normal;color:#888;font-size:13px}.bb-item.on{background:#FFF4EC;font-weight:700}.bb-item.on i{color:#FF6A00}.bb-nada{text-align:center;color:#888;padding:30px}"+
".bb-jan .x{position:absolute;top:12px;right:14px;border:0;background:#ffffff33;color:#fff;width:32px;height:32px;border-radius:50%;font-size:20px;line-height:1}";
d.head.appendChild(css);

var ICON={
 inicio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
 chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
 carrinho:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
 conta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
};
function menu(){
  if(d.querySelector(".bb-nav"))return;
  var pg=location.pathname.split("/").pop()||"index.html";
  var itens=[["index.html","Início","inicio"],["chat-novo2.html","Chat","chat"],["carrinho.html","Carrinho","carrinho"],["conta.html","Meu Babilônia","conta"]];
  var n=0;try{JSON.parse(localStorage.getItem("carrinho")||"[]").forEach(function(i){n+=Number(i.qtd)||0})}catch(e){}
  var nav=d.createElement("nav");nav.className="bb-nav";
  nav.innerHTML=itens.map(function(i){
    return'<a href="'+i[0]+'"'+(pg===i[0]?' class="on"':'')+'><span class="b">'+ICON[i[2]]+'</span>'+(i[2]==="carrinho"&&n?'<span class="n">'+n+'</span>':'')+i[1]+'</a>'}).join("");
  d.body.appendChild(nav);
}
function janela(){
  if(d.querySelector(".bb-fundo"))return;
  var p=pref(),f=d.createElement("div");f.className="bb-fundo";
  var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var L={pais:nomes("region",PAISES),idioma:nomes("language",LINGUAS),moeda:moedas()};
  var T={pais:"País onde está",idioma:"Idioma",moeda:"Moeda"};
  var v={pais:p.pais,idioma:p.idioma.split("-")[0],moeda:p.moeda};
  function nomeDe(k){var o=L[k].filter(function(x){return x.c===v[k]})[0];return o?(o.n+(o.n!==o.c?" ("+o.c+")":"")):"— Escolha —"}
  function sem(t){return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
  function principal(){
    f.innerHTML='<div class="bb-jan"><button class="x" aria-label="Fechar">×</button><h3>País / Idioma / Moeda<small>Cada um é independente: pode escolher qualquer combinação</small></h3><div class="cp">'+
     ["pais","idioma","moeda"].map(function(k){return'<label>'+T[k]+'</label><button type="button" class="bb-campo" data-k="'+k+'"><span>'+esc(nomeDe(k))+'</span><b>🔍</b></button>'}).join("")+
     '<button class="ok">Confirmar</button></div></div>';
    f.querySelectorAll(".bb-campo").forEach(function(b){b.onclick=function(){lista(b.getAttribute("data-k"))}});
    f.querySelector(".ok").onclick=function(){fechar(true)};
    f.querySelector(".x").onclick=function(){fechar(false)};
  }
  function lista(k){
    f.innerHTML='<div class="bb-jan bb-lista"><div class="bb-topo"><button type="button" class="bb-volta" aria-label="Voltar">‹</button><b>'+T[k]+'</b></div>'+
     '<div class="bb-busca"><span>🔍</span><input type="search" placeholder="Pesquisar '+T[k].toLowerCase()+'" autocomplete="off"></div><div class="bb-itens"></div></div>';
    var inp=f.querySelector("input"),box=f.querySelector(".bb-itens");
    function pinta(){
      var q=sem(inp.value.trim());
      var r=L[k].filter(function(o){return !q||sem(o.n).indexOf(q)>=0||sem(o.c).indexOf(q)>=0});
      box.innerHTML=r.length?r.map(function(o){return'<button type="button" class="bb-item'+(o.c===v[k]?" on":"")+'" data-c="'+o.c+'"><span>'+esc(o.n)+'</span><i>'+o.c+'</i></button>'}).join(""):'<p class="bb-nada">Nada encontrado</p>';
    }
    box.onclick=function(e){var b=e.target.closest(".bb-item");if(!b)return;v[k]=b.getAttribute("data-c");principal()};
    inp.oninput=pinta;f.querySelector(".bb-volta").onclick=principal;
    pinta();setTimeout(function(){try{inp.focus()}catch(e){}},50);
  }
  function fechar(guardar){
    var g={pais:p.pais,idioma:p.idioma,moeda:p.moeda,escolhido:true};
    if(guardar){g.pais=v.pais;g.idioma=v.idioma;g.moeda=v.moeda||"USD"}
    gravar(g);try{d.documentElement.lang=g.idioma}catch(e){}
    f.remove();
    try{window.dispatchEvent(new CustomEvent("bb-prefs",{detail:g}))}catch(e){}
  }
  d.body.appendChild(f);principal();
}
/* Câmbio: taxas do dia (base USD), guardadas 12 horas no telemóvel */
var TX=null;
function taxas(){
  if(TX)return TX;
  TX=new Promise(function(ok){
    try{var c=JSON.parse(localStorage.getItem("bb_taxas")||"null");if(c&&Date.now()-c.t<432e5&&c.r){ok(c.r);return}}catch(e){}
    fetch("https://open.er-api.com/v6/latest/USD").then(function(r){return r.json()}).then(function(j){
      if(j&&j.rates){try{localStorage.setItem("bb_taxas",JSON.stringify({t:Date.now(),r:j.rates}))}catch(e){}ok(j.rates)}else ok(null)
    }).catch(function(){try{var c=JSON.parse(localStorage.getItem("bb_taxas")||"null");ok(c&&c.r||null)}catch(e){ok(null)}});
  });
  return TX;
}
window.BBPrefs.taxas=taxas;
/* converte um valor da moeda do produto para a moeda escolhida; sem taxa devolve o original */
window.BBPrefs.converter=function(valor,de,r){
  var para=pref().moeda||"USD";de=(de||"MZN").toUpperCase();
  if(!r||de===para||!r[de]||!r[para])return{valor:Number(valor)||0,moeda:de};
  return{valor:(Number(valor)||0)/r[de]*r[para],moeda:para};
};
function iniciar(){menu();taxas();if(!pref().escolhido)janela()}
if(d.body)iniciar();else d.addEventListener("DOMContentLoaded",iniciar);
})();
/* sino de avisos */(function(){if(document.querySelector("script[src*=\"sino-avisos.js\"]"))return;var s=document.createElement("script");s.src="sino-avisos.js";document.head.appendChild(s)})();
/* separador "Disputa e reembolso" nos pedidos */(function(){var p=location.pathname.split("/").pop();if(p!=="conta.html"&&p!=="pedidos.html")return;if(document.querySelector("script[src*=\"pedidos-disputa.js\"]"))return;var s=document.createElement("script");s.src="pedidos-disputa.js";document.head.appendChild(s)})();
