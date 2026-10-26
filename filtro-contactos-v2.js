(function(){
var MARCAS=["whatsapp","facebook","instagram","telegram","tiktok","wechat","weixin","xianyu","gofish","pinduoduo","lazada","shopee","taobao","alibaba","aliexpress","yupoo","reddit","youtube","twitter","snapchat","messenger","linkedin","pinterest","skype","viber","douyin","weibo","kakao","botim","zalo","dhgate","amazon","ebay","mercadolivre"];
var JUNTAS=["whatsapp","facebook","instagram","telegram","pinduoduo","aliexpress","snapchat","messenger","tiktok","xianyu","wechat","youtube","taobao","yupoo"];
var EXATAS=["link","links","site","sites","website","web","url","contacto","contactos","contato","contatos","contact","telefone","telemovel","celular","fone","tlf","tlm","whats","zap","wpp","email","mail","gmail","hotmail","outlook","grupo","grupos","convite","convido","convidar","insta","olx","temu","discord"];
var FRASES=["nossa plataforma","outra plataforma","fora da plataforma","ponto com","manda mensagem","me chama","chama no","me adiciona","adiciona me","me liga","fale comigo","me procura","procure no","procura no","te convido"];
var NUMEROS="zero um dois tres quatro cinco seis sete oito nove one two three four five six seven eight nine".split(" ");
var UNID=/(?:usd|mzn|us\$|\$|mt)\s*\d[\d.]*|\d+(?:\.\d+)?\s*(?:cm|mm|kg|g|mts|mt|m|ml|l|usd|mzn|us\$|pcs|pc|pecas|unidades|un|dias|tn|ton|w|kw|v|gb|tb|ghz|mah|polegadas|meticais|dolares)(?![a-z])|\d+(?:\.\d+)?\s*[%$]/gi;
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function leet(w){return w.replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s").replace(/\$/g,"s").replace(/@/g,"a");}
function skel(w){return w.replace(/[aeiou]/g,"").replace(/(.)\1+/g,"$1");}
function lev(a,b){var p=[],i,j;for(j=0;j<=b.length;j++)p[j]=j;for(i=1;i<=a.length;i++){var c=[i];for(j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[b.length];}
function parecida(w){
 if(w.length<4)return false;
 for(var i=0;i<MARCAS.length;i++){var m=MARCAS[i];
  if(w===m)return true;
  if(w[0]!==m[0])continue;
  if(m.length>=6&&lev(w,m)<=(m.length>=8?2:1))return true;
  var a=skel(w),b=skel(m);
  if(a.length>=4&&b.length>=4&&Math.abs(w.length-m.length)<=3){
   if(a===b)return true;
   if(a.length>=5&&b.length>=5&&lev(a,b)<=1)return true;}
 }return false;}
function tamanhosOk(a){var prev=-1;for(var i=0;i<a.length;i++){var n=parseFloat(a[i]);if(isNaN(n)||a[i].split(".")[0].length>3||n<=prev||(prev>=0&&n-prev>20))return false;prev=n;}return true;}
function numerosMal(txt){
 var s=txt.replace(/(\d),(\d)/g,"$1.$2").replace(UNID,"");
 if(/\+\s*\d/.test(s))return true;
 if(/\d{6,}/.test(s))return true;
 var ch=s.match(/\d+(?:\s*[#.\-\/()_*]\s*\d+)+/g)||[];
 for(var i=0;i<ch.length;i++){var c=ch[i];
  if(/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}$/.test(c))continue;
  if(c.replace(/\D/g,"").length<6)continue;
  if(/^[\d\-\/ ]+$/.test(c)&&tamanhosOk(c.split(/[\s\-\/]+/)))continue;
  return true;}
 var runs=s.match(/\d+(?:\.\d+)?(?:[\s,]+\d+(?:\.\d+)?)+/g)||[];
 for(var k=0;k<runs.length;k++){
  if(runs[k].replace(/\D/g,"").length<7)continue;
  if(!tamanhosOk(runs[k].split(/[\s,]+/)))return true;}
 return false;}
function juntou(c){if(c.length<5)return false;for(var q=0;q<JUNTAS.length;q++)if(c.indexOf(JUNTAS[q])>-1)return true;return false;}
function proibido(txt){
 if(!txt)return false;
 var t=norm(txt).replace(/\s+/g," ");
 if(/https?:|www\.|\b[a-z0-9-]+\.(com|net|org|app|cn|mz|link|vip|shop|xyz|info|biz)\b|\b[a-z0-9-]+\.(me|co|io|ly|top)\//.test(t))return true;
 if(/@\w/.test(t)||/\b1688\b/.test(t))return true;
 if(/微信|电话|手机|加我|拼多多|闲鱼|淘宝|抖音|扫码|二维码|微博/.test(txt))return true;
 if(numerosMal(txt))return true;
 var tt=" "+t.replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ")+" ";
 for(var f=0;f<FRASES.length;f++)if(tt.indexOf(" "+FRASES[f]+" ")>-1)return true;
 var ws=t.split(/[^a-z0-9@$]+/),seq=0,cur="";
 for(var i=0;i<ws.length;i++){
  var w=ws[i];if(!/[a-z]/.test(w))continue;
  w=leet(w).replace(/[^a-z]/g,"");
  if(EXATAS.indexOf(w)>-1||parecida(w))return true;
  if(NUMEROS.indexOf(w)>-1){seq++;if(seq>=5)return true;}else seq=0;
  if(w.length<=2)cur+=w;else{if(juntou(cur))return true;cur="";}
 }
 return juntou(cur);}
var SEL='input[placeholder^="Escreva"],textarea[placeholder^="Escreva"],input[placeholder*="ensagem"],textarea[placeholder*="ensagem"]';
function campo(){return document.querySelector(SEL);}
function eEnviar(el){var b=el&&el.closest?el.closest("button,[role=button],input[type=submit],input[type=button]"):null;return !!b&&(b.value||b.textContent||"").trim()==="Enviar";}
function botao(){var b=document.querySelectorAll("button,[role=button],input[type=submit],input[type=button]");for(var i=0;i<b.length;i++)if(eEnviar(b[i]))return b[i];return null;}
var aviso=null,desativei=false;
function verificar(){
 var inp=campo();
 if(!inp){if(aviso)aviso.style.display="none";return;}
 var mau=proibido(inp.value),btn=botao();
 if(!aviso||!aviso.isConnected){aviso=document.createElement("div");
  aviso.style.cssText="display:none;position:fixed;left:8px;right:8px;z-index:99999;background:#fff;color:#c00;font-size:14px;padding:6px 10px;border-radius:8px";
  aviso.textContent="Não pode enviar contactos, links, redes sociais ou meios fora da plataforma.";
  document.body.appendChild(aviso);}
 aviso.style.bottom=(window.innerHeight-inp.getBoundingClientRect().top+6)+"px";
 aviso.style.display=mau?"block":"none";
 if(btn){if(mau){btn.disabled=true;desativei=true;}else if(desativei){btn.disabled=false;desativei=false;}}}
function parar(e){e.preventDefault();e.stopImmediatePropagation();}
document.addEventListener("click",function(e){if(eEnviar(e.target)){var i=campo();if(i&&proibido(i.value))parar(e);}},true);
["keydown","keypress","keyup"].forEach(function(ev){document.addEventListener(ev,function(e){
 if((e.key==="Enter"||e.keyCode===13)&&e.target===campo()&&proibido(e.target.value))parar(e);},true);});
document.addEventListener("beforeinput",function(e){
 if((e.inputType==="insertLineBreak"||e.inputType==="insertParagraph")&&e.target===campo()&&proibido(e.target.value))parar(e);},true);
document.addEventListener("submit",function(e){var i=campo();if(i&&proibido(i.value))parar(e);},true);
document.addEventListener("input",verificar,true);
setInterval(verificar,300);
})();
