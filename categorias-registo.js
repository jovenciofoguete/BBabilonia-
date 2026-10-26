/* categorias-registo.js — BBabilônia (versão 2)
   Registo de produto: cada categoria pede só o que é dela (lista em categorias-detalhes.js),
   tamanhos certos por categoria (ou nenhum) e stock sempre. Não altera fornecedor-novo.html. */
(function(){
var d=document;
function $(i){return d.getElementById(i)}
var cat=$('cat'),catb=$('catb'),sv=$('sv'),ts=$('ts');
if(!cat||!catb||!sv||!ts||$('reg-campos'))return;

function iniciar(){
var box=d.createElement('div');box.id='reg-campos';
catb.parentNode.insertBefore(box,catb.nextSibling);
var css=d.createElement('style');
css.textContent='#reg-campos h3{margin:22px 0 8px}#reg-campos .chips{display:flex;flex-wrap:wrap;gap:8px}'+
'#reg-campos .chip{padding:9px 14px;border-radius:20px}#reg-campos .chip.on{background:var(--ac,#ff4d6a);border-color:var(--ac,#ff4d6a);color:#fff}'+
'.ts-tipo{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.ts-tipo button{flex:1;padding:10px;border-radius:8px;font-size:14px}'+
'.ts-cor{border-radius:10px;padding:10px;margin-bottom:12px}.ts-cor h4{margin:0 0 8px;font-size:16px}'+
'.ts-grade{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ts-item label{display:block;font-size:13px;font-weight:600;margin:0 0 2px}'+
'.ts-item input{width:100%;padding:8px;font-size:16px;border-radius:6px}.ts-nota{font-size:13px;margin:0 0 10px}'+
'#ts .ts-extra{display:flex;gap:8px;margin-top:10px}#ts .ts-extra input{flex:1;padding:8px}#ts .ts-extra button{padding:8px 12px}';
d.head.appendChild(css);

var mapa={},perfil=null,ultimo=null,vals={},opcs={};
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function caminho(id){var o=[],n=0,c=mapa[id];while(c&&n++<6){o.unshift(c.name);c=mapa[c.parent_id]}return o.join(' > ')}

/* ---------- campos da categoria ---------- */
function guardarVals(){
  box.querySelectorAll('[data-n]').forEach(function(e){vals[e.getAttribute('data-n')]=e.value});
}
function campoHtml(c){
  var v=vals[c.nome]||'';
  var l='<label>'+esc(c.nome)+(c.obrig?' *':'')+'</label>';
  if(c.sug.length)return l+'<select data-n="'+esc(c.nome)+'"><option value="">— Escolha —</option>'+
    c.sug.map(function(x){return'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>'}).join('')+'</select>';
  return l+'<input data-n="'+esc(c.nome)+'" value="'+esc(v)+'">';
}
function desenhar(){
  guardarVals();
  if(!perfil){box.innerHTML='';return}
  var h='<h3>Detalhes do produto</h3>';
  if(perfil.cond)h+=campoHtml({nome:'Condição',obrig:true,sug:['Novo','Usado','Usado e recondicionado']});
  perfil.spec.forEach(function(c){h+=campoHtml(c)});
  perfil.opc.forEach(function(o,i){
    var sel=opcs[o.nome]||[];
    h+='<label>'+esc(o.nome)+(o.obrig?' *':'')+' — toque nas que tem (o cliente escolhe)</label><div class="chips">'+
      o.sug.map(function(x){return'<button type="button" class="chip'+(sel.indexOf(x)>-1?' on':'')+'" data-o="'+i+'">'+esc(x)+'</button>'}).join('')+'</div>';
  });
  box.innerHTML=h;
  box.querySelectorAll('.chip').forEach(function(b){
    b.onclick=function(){
      var o=perfil.opc[b.getAttribute('data-o')],a=opcs[o.nome]=opcs[o.nome]||[],k=a.indexOf(b.textContent);
      if(k>-1)a.splice(k,1);else a.push(b.textContent);
      b.classList.toggle('on');
    };
  });
}

/* ---------- tamanhos e stock (substitui o antigo) ---------- */
var E={tipos:['unico'],tipo:'unico',cores:[],stock:{},extra:{}};
function lista(){return BB_TAMANHOS[E.tipo].l.concat(E.extra[E.tipo]||[])}
function coresUsadas(){return E.cores.length?E.cores:['Única']}
function desenharTs(){
  var h='<div class="ts-box">';
  if(E.tipos.length>1)h+='<div class="ts-tipo">'+E.tipos.map(function(t){
    return'<button type="button" data-tipo="'+t+'" class="'+(t===E.tipo?'on':'')+'">'+esc(BB_TAMANHOS[t].nome)+'</button>'}).join('')+'</div>';
  if(E.tipo==='unico')h+='<p class="ts-nota">Escreva a quantidade disponível'+(E.cores.length?' de cada cor':'')+'. Com 0 não aparece ao cliente.</p>';
  else h+='<p class="ts-nota">'+esc(BB_TAMANHOS[E.tipo].nome)+': escreva o stock de cada tamanho. Vazio ou 0 não aparece ao cliente.</p>';
  coresUsadas().forEach(function(cor,i){
    h+='<div class="ts-cor"><h4>'+esc(cor==='Única'?(E.tipo==='unico'?'Quantidade em stock':'Stock'):cor)+'</h4><div class="ts-grade">';
    lista().forEach(function(t){
      var v=(E.stock[cor]&&E.stock[cor][t])||'';
      h+='<div class="ts-item"><label>'+esc(t||'Quantidade')+'</label><input type="number" min="0" inputmode="numeric" data-c="'+i+'" data-t="'+esc(t)+'" value="'+v+'"></div>';
    });
    h+='</div></div>';
  });
  if(E.tipo!=='unico')h+='<div class="ts-extra"><input id="ts-novo" placeholder="Outro tamanho (ex.: 6XL)"><button type="button" id="ts-add">+ Tamanho</button></div>';
  ts.innerHTML=h+'</div>';
  ts.querySelectorAll('.ts-tipo button').forEach(function(b){b.onclick=function(){E.tipo=b.getAttribute('data-tipo');desenharTs()}});
  ts.querySelectorAll('input[data-c]').forEach(function(inp){
    inp.oninput=function(){
      var cor=coresUsadas()[inp.getAttribute('data-c')],t=inp.getAttribute('data-t');
      E.stock[cor]=E.stock[cor]||{};E.stock[cor][t]=Math.max(0,parseInt(inp.value,10)||0);
    };
  });
  var ad=$('ts-add');
  if(ad)ad.onclick=function(){
    var v=$('ts-novo').value.trim().toUpperCase();if(!v)return;
    var a=E.extra[E.tipo]=E.extra[E.tipo]||[];
    if(lista().indexOf(v)<0)a.push(v);
    desenharTs();
  };
}
window.TamanhosStock={
  montar:function(){desenharTs()},
  definirCores:function(c){E.cores=(c||[]).slice();desenharTs()},
  definirTipos:function(t){E.tipos=t&&t.length?t:['unico'];if(E.tipos.indexOf(E.tipo)<0)E.tipo=E.tipos[0];desenharTs()},
  obter:function(){
    var out=[];
    coresUsadas().forEach(function(cor){
      lista().forEach(function(t){
        var q=E.stock[cor]&&E.stock[cor][t];
        if(q>0)out.push({cor:cor,tamanho:t,stock:q});
      });
    });
    return out;
  }
};
try{if(typeof cores!=='undefined')E.cores=cores.filter(function(c){return c.ok&&c.nome.trim()}).map(function(c){return c.nome.trim()})}catch(e){}
desenharTs();

/* ---------- mudar de categoria ---------- */
function tick(){
  if(cat.value===ultimo||!Object.keys(mapa).length)return;
  ultimo=cat.value;
  perfil=cat.value?registoPerfil(caminho(cat.value)):null;
  desenhar();
  TamanhosStock.definirTipos(perfil?perfil.tam:['unico']);
}
cat.addEventListener('change',tick);
setInterval(tick,600);
sb.from('categories').select('id,name,parent_id').limit(2000).then(function(r){
  (r.data||[]).forEach(function(c){mapa[c.id]=c});tick();
});

/* ---------- verificar antes de publicar ---------- */
function aviso(t,el){$('m').textContent=t;if(el)el.focus()}
var orig=sv.onclick;
sv.onclick=function(e){
  if(!cat.value)return aviso('Escolha a categoria.');
  if(!perfil)return aviso('A carregar a categoria… toque outra vez.');
  guardarVals();
  var els=box.querySelectorAll('[data-n]');
  for(var i=0;i<els.length;i++){
    var n=els[i].getAttribute('data-n'),c=n==='Condição'?{obrig:true}:perfil.spec.filter(function(x){return x.nome===n})[0];
    if(c&&c.obrig&&!els[i].value.trim())return aviso('Preencha: '+n,els[i]);
  }
  for(var j=0;j<perfil.opc.length;j++){
    var o=perfil.opc[j];
    if(o.obrig&&!(opcs[o.nome]||[]).length)return aviso('Escolha pelo menos uma opção em: '+o.nome);
  }
  try{if(typeof refreshTs==='function')refreshTs()}catch(x){}
  if(!TamanhosStock.obter().length)return aviso(E.tipo==='unico'?'Escreva a quantidade em stock.':'Escreva o stock de pelo menos um tamanho.');
  return orig?orig.call(this,e):undefined;
};

/* ---------- juntar os detalhes ao produto guardado ---------- */
var of=sb.from.bind(sb);
sb.from=function(t){
  var q=of(t);
  if(t==='products'&&q.insert){
    var oi=q.insert.bind(q);
    q.insert=function(row,o){
      try{
        guardarVals();
        var sp={};
        var nomes=perfil?(perfil.cond?['Condição']:[]).concat(perfil.spec.map(function(x){return x.nome})):[];
        nomes.forEach(function(k){if(vals[k]&&String(vals[k]).trim())sp[k]=String(vals[k]).trim()});
        row.specs=Object.assign({},row.specs||{},sp);
        var op={};
        if(perfil)perfil.opc.forEach(function(x){if((opcs[x.nome]||[]).length)op[x.nome]=opcs[x.nome].slice()});
        if(Object.keys(op).length)row.opcoes=op;
        (row.variants||[]).forEach(function(v){if(v.cor==='Única'&&!v.foto&&row.image_url)v.foto=row.image_url});
      }catch(e){}
      return oi(row,o);
    };
  }
  return q;
};
}

if(typeof registoPerfil==='function')iniciar();
else{var s=d.createElement('script');s.src='categorias-detalhes.js?v=2';s.onload=iniciar;d.body.appendChild(s)}
})();
