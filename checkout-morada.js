(function(){
var U="https://dsfoqoeawvjafypycldz.supabase.co";
var K="sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
var SK="sb-dsfoqoeawvjafypycldz-auth-token";
var TIPOS={"Envio interno":"Entrega interna","Envio externo":"Entrega internacional (externa)"};
var S=null;
try{S=JSON.parse(localStorage.getItem(SK))}catch(e){}
window.moradaEscolhida=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

var box=document.createElement("div");
box.id="box-morada";
box.style.cssText="background:#fff;border:2px solid #e63946;border-radius:12px;padding:14px;margin:12px;font-family:system-ui,Arial,sans-serif;color:#222;font-size:15px";
if(document.body.firstChild)document.body.insertBefore(box,document.body.firstChild);else document.body.appendChild(box);

function setv(re,v){
  var l=document.querySelectorAll("input,textarea");
  for(var n=0;n<l.length;n++){
    var i=l[n];if(box.contains(i)||i.type=="hidden"&&false)continue;
    var k=((i.id||"")+" "+(i.name||"")).toLowerCase();
    if(re.test(k)){i.value=v;i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}))}
  }
}
function escolher(m){
  window.moradaEscolhida=m;
  try{localStorage.setItem("morada_entrega",JSON.stringify(m))}catch(e){}
  var end=[m.endereco,m.cidade,m.distrito,m.provincia,m.pais,m.codigo_postal].filter(Boolean).join(", ");
  if(m.marca)end+=" | Marca: "+m.marca;
  setv(/nome|name/,m.nome||"");
  setv(/tel|phone/,m.telefone||"");
  var em=m.email||(S&&S.user&&S.user.email)||"";
  if(em)setv(/mail/,em);
  setv(/morada|address|endereco|endereço/,end);
}

function H(){return{apikey:K,Authorization:"Bearer "+((S&&S.access_token)||K)}}

function login(msg){
  box.innerHTML='<b>Entre na sua conta para escolher a morada de entrega</b>'
   +'<input id="bm-e" type="email" placeholder="Email" style="width:100%;padding:11px;margin-top:10px;border:1px solid #ccc;border-radius:8px;font-size:15px">'
   +'<input id="bm-p" type="password" placeholder="Palavra-passe" style="width:100%;padding:11px;margin-top:8px;border:1px solid #ccc;border-radius:8px;font-size:15px">'
   +'<div id="bm-m" style="color:#b00020;font-size:14px;margin-top:6px">'+esc(msg||"")+'</div>'
   +'<button id="bm-b" style="margin-top:8px;width:100%;padding:12px;border:0;border-radius:8px;background:#e63946;color:#fff;font-size:15px;font-weight:600">Entrar</button>';
  document.getElementById("bm-b").onclick=function(){
    fetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},
      body:JSON.stringify({email:document.getElementById("bm-e").value.trim(),password:document.getElementById("bm-p").value})})
    .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
    .then(function(x){
      if(!x.ok){login("Email ou palavra-passe errados.");return}
      S=x.j;localStorage.setItem(SK,JSON.stringify(S));carregar();
    }).catch(function(){login("Sem ligação à internet.")});
  };
}

function carregar(){
  box.innerHTML="A carregar as suas moradas…";
  fetch(U+"/rest/v1/moradas?select=*",{headers:H()}).then(function(r){
    if(r.status==401){S=null;localStorage.removeItem(SK);login("Sessão expirada. Entre outra vez.");return null}
    return r.json();
  }).then(function(d){
    if(!d)return;
    if(!d.length){
      box.innerHTML='<b>Ainda não tem moradas guardadas.</b><br><a href="moradas-v3.html" style="color:#e63946;font-weight:600">+ Criar endereço de entrega</a>';
      return;
    }
    var html='<b>Escolha a morada de entrega</b>';
    d.forEach(function(m,i){
      html+='<label style="display:block;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:10px">'
       +'<input type="radio" name="bm-r" value="'+i+'" style="margin-right:8px">'
       +'<b>'+esc(m.nome)+'</b> <small style="color:#666">'+esc(TIPOS[m.tipo]||m.tipo)+'</small><br>'
       +esc(m.endereco)+'<br>'+esc([m.cidade,m.distrito,m.provincia,m.pais].filter(Boolean).join(", "))+' '+esc(m.codigo_postal||"")
       +(m.marca?'<br>Marca: '+esc(m.marca):'')+'</label>';
    });
    html+='<a href="moradas-v3.html" style="display:inline-block;margin-top:12px;color:#e63946;font-weight:600">Criar ou editar moradas</a>';
    box.innerHTML=html;
    var rs=box.querySelectorAll('input[name="bm-r"]');
    for(var n=0;n<rs.length;n++)rs[n].onchange=function(){escolher(d[this.value])};
  }).catch(function(){box.innerHTML="Sem ligação à internet. Não pode pagar sem escolher a morada."});
}

/* bloqueia o pagamento enquanto não houver morada escolhida */
function bloquear(e){
  if(window.moradaEscolhida)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  alert("Escolha uma morada de entrega antes de pagar");
  box.scrollIntoView({behavior:"smooth"});
}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("button,a,input[type=submit],input[type=button]");
  if(!b||box.contains(b))return;
  var t=((b.textContent||"")+" "+(b.value||"")).toLowerCase();
  if(/pagar|finalizar|enviar pedido|confirmar/.test(t))bloquear(e);
},true);
document.addEventListener("submit",function(e){if(!box.contains(e.target))bloquear(e)},true);


/* esconde os campos antigos (nome, telefone, país, morada): agora só se escolhe a morada guardada */
function esconder(){
  var re=/^(nome completo|telefone|país|pais|morada de entrega|email.*)\s*\*?$/i;
  var els=document.querySelectorAll("label,div,p,span,h3,h4");
  for(var n=0;n<els.length;n++){
    var e=els[n];
    if(box.contains(e))continue;
    if(e.childNodes.length==1&&e.firstChild.nodeType==3&&re.test(e.textContent.trim())){
      e.style.display="none";
      var nx=e.nextElementSibling;
      if(nx&&/^(INPUT|TEXTAREA|SELECT)$/.test(nx.tagName))nx.style.display="none";
    }
  }
  var l=document.querySelectorAll("input,textarea,select");
  for(var m=0;m<l.length;m++){
    var i=l[m];
    if(box.contains(i)||/radio|checkbox|button|submit|hidden/.test(i.type||""))continue;
    var k=((i.id||"")+" "+(i.name||"")).toLowerCase();
    if(/nome|name|tel|phone|pais|country|morada|address|endereco|mail/.test(k)){
      i.style.display="none";
      if(i.parentElement&&i.parentElement.tagName=="LABEL")i.parentElement.style.display="none";
      var pv=i.previousElementSibling;
      if(pv&&pv.tagName=="LABEL")pv.style.display="none";
    }
  }
}
esconder();setTimeout(esconder,600);setTimeout(esconder,1800);
if(S&&S.access_token)carregar();else login("");
})();
