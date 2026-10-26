/* sino-avisos.js — BBabilônia
   Sino 🔔 flutuante com o número de avisos por ler. Toque → avisos.html.
   Só aparece com sessão iniciada. Não mexe em nada da página. */
(function(){
var d=document;
if(window.BBSino)return;window.BBSino=1;
if((location.pathname.split("/").pop()||"")==="avisos.html")return;
var URL_SB="https://dsfoqoeawvjafypycldz.supabase.co",CHAVE="sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
var KEY="sb-dsfoqoeawvjafypycldz-auth-token",btn=null;

function sessao(){try{var s=JSON.parse(localStorage.getItem(KEY)||"null");return s&&s.access_token?s:null}catch(e){return null}}
async function token(){
  var s=sessao();if(!s)return null;
  if(!s.expires_at||s.expires_at*1000>Date.now()+30000)return s;
  if(window.supabase)return null; /* a própria página renova a sessão */
  try{
    var r=await fetch(URL_SB+"/auth/v1/token?grant_type=refresh_token",{method:"POST",
      headers:{apikey:CHAVE,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:s.refresh_token})});
    if(!r.ok)return null;
    var n=await r.json();if(!n.expires_at)n.expires_at=Math.floor(Date.now()/1000)+(n.expires_in||3600);
    localStorage.setItem(KEY,JSON.stringify(n));return n;
  }catch(e){return null}
}
function criar(){
  var css=d.createElement("style");
  css.textContent=".bb-sino{position:fixed;right:14px;z-index:8999;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;"+
   "background:linear-gradient(135deg,#10b981,#0ea5e9 60%,#2563eb);color:#fff;box-shadow:0 8px 20px #0ea5e966;text-decoration:none}"+
   ".bb-sino svg{width:26px;height:26px}"+
   ".bb-sino i{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#ef4444;color:#fff;font:800 12px system-ui,sans-serif;font-style:normal;"+
   "display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}";
  d.head.appendChild(css);
  btn=d.createElement("a");btn.className="bb-sino";btn.href="avisos.html";btn.setAttribute("aria-label","Avisos");btn.style.display="none";
  btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><i style="display:none"></i>';
  d.body.appendChild(btn);
}
function posicao(){btn.style.bottom=d.querySelector(".bb-nav")?"calc(98px + env(safe-area-inset-bottom,0px))":"calc(20px + env(safe-area-inset-bottom,0px))"}
async function contar(){
  var s=await token();
  if(!s){btn.style.display=sessao()?btn.style.display:"none";return}
  btn.style.display="flex";posicao();
  try{
    var r=await fetch(URL_SB+"/rest/v1/avisos?select=id&lido=not.is.true&user_id=eq."+encodeURIComponent(s.user&&s.user.id||""),
      {method:"HEAD",headers:{apikey:CHAVE,Authorization:"Bearer "+s.access_token,Prefer:"count=exact"}});
    var n=Number(String(r.headers.get("content-range")||"").split("/")[1])||0,b=btn.querySelector("i");
    b.textContent=n>99?"99+":n;b.style.display=n?"flex":"none";
  }catch(e){}
}
function iniciar(){criar();contar();setInterval(function(){if(!d.hidden)contar()},30000);d.addEventListener("visibilitychange",function(){if(!d.hidden)contar()})}
if(d.body)iniciar();else d.addEventListener("DOMContentLoaded",iniciar);
})();
  
