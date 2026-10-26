(function(){
var d=document;
function $(i){return d.getElementById(i)}
var cat=$('cat'),catb=$('catb'),sv=$('sv');
if(!cat||!sv||!catb||typeof registoDe!=='function')return;
var box=d.createElement('div');box.id='reg-campos';
catb.parentNode.insertBefore(box,catb.nextSibling);
var campos=[],ultimo='';
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function lista(o){
 if(typeof o==='string')return o.split(/[,;]/).map(function(s){return s.trim()}).filter(Boolean);
 return Array.isArray(o)?o:null}
function nc(c){
 if(typeof c==='string'){
  var p=c.split('|'),n=p[0];
  return{n:n.replace(/\*/g,'').trim(),r:/\*/.test(n),o:p[1]?lista(p[1]):null}}
 if(c&&typeof c==='object'){
  var n=c.nome||c.name||c.n||c.label||c.titulo||'';
  var o=c.op||c.opcoes||c.options||c.o||c.valores||c.lista||c.items||null;
  var k;
  if(!n){for(k in c){if(typeof c[k]==='string'){n=c[k];break}}}
  if(!o){for(k in c){if(Array.isArray(c[k])){o=c[k];break}}}
  var req=c.obr||c.req||c.required||c.r||c.obrigatorio||/\*/.test(n);
  return{n:String(n).replace(/\*/g,'').trim(),r:!!req,o:lista(o)}}
 return null}
function achar(){
 var o=cat.options[cat.selectedIndex];
 if(!o||!o.value)return null;
 var g=o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:'';
 if(g==='Outras categorias')g='';
 var partes=g?g.split(' › ').concat(o.textContent):[o.textContent];
 var seps=[' > ',' › ','/',' - ',' '],r=null;
 for(var i=0;i<seps.length;i++){
  try{r=registoDe(partes.join(seps[i]))}catch(e){r=null}
  if(r&&r.id!=='outros')return r}
 return r}
function draw(){
 var r=achar();
 if(!r||!r.campos){box.innerHTML='';campos=[];return}
 campos=r.campos.map(nc).filter(function(x){return x&&x.n});
 box.innerHTML=campos.length?'<h3>Detalhes do produto</h3>'+campos.map(function(c,i){
  var l='<label>'+esc(c.n)+(c.r?' *':'')+'</label>';
  if(c.o&&c.o.length)return l+'<select data-i="'+i+'"><option value="">— Escolha —</option>'+c.o.map(function(x){return'<option>'+esc(x)+'</option>'}).join('')+'</select>';
  return l+'<input data-i="'+i+'">'}).join(''):''}
function vals(){
 var v={};
 box.querySelectorAll('[data-i]').forEach(function(e){
  var c=campos[e.getAttribute('data-i')];
  if(c&&e.value.trim())v[c.n]=e.value.trim()});
 return v}
function tick(){if(cat.value!==ultimo){ultimo=cat.value;draw()}}
cat.addEventListener('change',tick);
setInterval(tick,600);
var oc=sv.onclick;
sv.onclick=function(e){
 var els=box.querySelectorAll('[data-i]');
 for(var i=0;i<els.length;i++){
  var c=campos[els[i].getAttribute('data-i')];
  if(c&&c.r&&!els[i].value.trim()){
   $('m').textContent='Preencha: '+c.n;els[i].focus();return}}
 return oc?oc.call(this,e):undefined};
if(typeof sb!=='undefined'){
 var of=sb.from.bind(sb);
 sb.from=function(t){
  var q=of(t);
  if(t==='products'&&q.insert){
   var oi=q.insert.bind(q);
   q.insert=function(row,o){
    try{var v=vals();if(Object.keys(v).length)row.specs=Object.assign({},row.specs||{},v)}catch(e){}
    return oi(row,o)}}
  return q}}
draw();
})();
