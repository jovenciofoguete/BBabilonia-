/* pedidos-escolher.js — aba dos pedidos para escolher o pedido em causa (cliente e atendimento) */
(function(){
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function arr(x){if(typeof x==='string'){try{x=JSON.parse(x)}catch(e){x=[]}}return Array.isArray(x)?x:[]}
 function k(x){return String(x||'').toLowerCase()}
 function din(v,m){return Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+(m||'MZN')}
 function pago(p){return/pago|paid|succeeded|confirmado|retido|liberado/.test(k(p.payment_status))||/pago|paid/.test(k(p.status))}
 function cancelado(p){return/cancel/.test(k(p.status))}
 function enviado(p){return/enviad|shipped|transito/.test(k(p.status))}
 function recebido(p){return/entregue|recebid|delivered|conclu/.test(k(p.status))||/entregue|liberado/.test(k(p.escrow_status))}
 var ABAS=[['todos','Todos',function(){return true}],['naopago','💳 Não pagos',function(p){return!pago(p)&&!cancelado(p)}],
  ['pendente','📦 Pendentes',function(p){return pago(p)&&!enviado(p)&&!recebido(p)&&!cancelado(p)}],['enviado','🚚 Enviados',function(p){return enviado(p)&&!recebido(p)}],
  ['recebido','🏠 Recebidos',function(p){return recebido(p)}],['disputa','⚠️ Com disputa',function(p){return!!p.disputa_estado}]];
 function etiqueta(p){
  if(p.disputa_estado)return'<span class="pe-e r">⚠️ Disputa</span>';if(cancelado(p))return'<span class="pe-e n">Cancelado</span>';
  if(recebido(p))return'<span class="pe-e ok">Recebido</span>';if(enviado(p))return'<span class="pe-e">Enviado</span>';
  if(pago(p))return'<span class="pe-e ok">Pago</span><span class="pe-e">A aguardar envio</span>';return'<span class="pe-e n">Não pago</span>'}
 function cartao(p,botao,sel){var l=arr(p.items),i=l[0]||{};
  return'<div class="pe-c'+(sel?' on':'')+'"><div class="pe-t"><span>#'+esc(String(p.id).slice(0,8))+' · '+new Date(p.created_at).toLocaleDateString('pt-PT')+'</span><b>'+din(p.total,p.currency)+'</b></div>'+
   '<div class="pe-i">'+(i.foto?'<img src="'+esc(i.foto)+'" alt="" loading="lazy">':'<div class="pe-sf">📦</div>')+'<div><div class="pe-n">'+esc(i.nome||i.name||'Produto')+'</div><small>'+
   (l.length>1?'+ '+(l.length-1)+' produto(s) · ':'')+'× '+esc(i.qtd||1)+'</small><div>'+etiqueta(p)+'</div></div></div>'+
   (botao?'<button type="button" class="pe-b" data-pe="'+esc(p.id)+'">'+(sel?'✔ Escolhido':esc(botao))+'</button>':'')+'</div>'}
 var css=document.createElement('style');
 css.textContent='.pe-f{position:fixed;inset:0;background:#0008;z-index:50;display:flex;align-items:flex-end;justify-content:center}'+
  '.pe-p{background:var(--fundo,#f3f0fb);color:var(--texto,#1b1740);width:100%;max-width:640px;max-height:88vh;border-radius:20px 20px 0 0;display:flex;flex-direction:column}'+
  '.pe-h{display:flex;align-items:center;gap:8px;padding:14px 14px 8px}.pe-h b{flex:1;font-size:16px}.pe-h button{border:0;background:var(--papel,#fff);color:inherit;width:36px;height:36px;border-radius:50%;font-size:18px}'+
  '.pe-q{margin:0 14px 8px;width:calc(100% - 28px)!important}.pe-a{display:flex;gap:6px;overflow-x:auto;padding:0 14px 8px;flex:none}'+
  '.pe-a button{flex:none;border:0;border-radius:18px;padding:8px 12px;font:inherit;font-size:13px;font-weight:700;background:var(--papel,#fff);color:var(--suave,#6b6590)}.pe-a button.on{background:#0ea5e9;color:#fff}'+
  '.pe-l{overflow-y:auto;padding:4px 14px calc(16px + env(safe-area-inset-bottom,0px))}.pe-c{background:var(--papel,#fff);border-radius:14px;padding:12px;margin-bottom:10px;border:2px solid transparent}.pe-c.on{border-color:#10b981}'+
  '.pe-t{display:flex;justify-content:space-between;font-size:12.5px;color:var(--suave,#6b6590)}.pe-t b{color:var(--texto,#1b1740);font-size:14px}'+
  '.pe-i{display:flex;gap:10px;align-items:center;margin-top:8px}.pe-i img,.pe-sf{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:22px}'+
  '.pe-n{font-weight:700;font-size:14.5px}.pe-i small{color:var(--suave,#6b6590);font-size:12.5px}'+
  '.pe-e{display:inline-block;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:12px;background:#fef3c7;color:#92400e;margin:4px 4px 0 0}.pe-e.ok{background:#d1fae5;color:#065f46}.pe-e.n{background:#e5e7eb;color:#374151}.pe-e.r{background:#fee2e2;color:#991b1b}'+
  '.pe-b{display:block;width:100%;margin-top:10px;padding:11px;border:0;border-radius:12px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(90deg,#10b981,#0ea5e9)}.pe-b:disabled{opacity:.5}'+
  '.pe-x{color:#dc2626;font-size:14px;padding:0 14px}.pe-v{text-align:center;color:var(--suave,#6b6590);padding:26px 0}';
 document.head.appendChild(css);
 window.EscolherPedido={cartao:function(p){return cartao(p,null,false)},
  abrir:function(o){var aba='todos',busca='',f=document.createElement('div');f.className='pe-f';
   f.innerHTML='<div class="pe-p"><div class="pe-h"><b>'+esc(o.titulo||'📦 Escolha o pedido')+'</b><button type="button" aria-label="Fechar">✕</button></div>'+
    '<input class="pe-q" type="search" placeholder="Procurar por número ou produto" style="padding:11px;border:2px solid var(--linha,#e7e3f3);border-radius:12px;font:inherit;font-size:16px;background:var(--papel,#fff);color:inherit">'+
    '<div class="pe-a"></div><div class="pe-x"></div><div class="pe-l"></div></div>';
   document.body.appendChild(f);document.body.style.overflow='hidden';
   function fechar(){f.remove();document.body.style.overflow=''}
   f.onclick=function(e){if(e.target===f)fechar()};f.querySelector('.pe-h button').onclick=fechar;
   f.querySelector('.pe-q').oninput=function(){busca=k(this.value).trim();pintar()};
   function pintar(){var L=o.lista||[];
    f.querySelector('.pe-a').innerHTML=ABAS.map(function(a){var n=L.filter(a[2]).length;return(a[0]==='todos'||n)?'<button type="button" data-a="'+a[0]+'" class="'+(a[0]===aba?'on':'')+'">'+a[1]+' ('+n+')</button>':''}).join('');
    f.querySelectorAll('.pe-a button').forEach(function(b){b.onclick=function(){aba=b.dataset.a;pintar()}});
    var fn=ABAS.filter(function(a){return a[0]===aba})[0][2],v=L.filter(fn).filter(function(p){if(!busca)return true;
     return k(p.id).indexOf(busca.replace('#',''))>-1||arr(p.items).some(function(i){return k(i.nome||i.name).indexOf(busca)>-1})});
    f.querySelector('.pe-l').innerHTML=v.length?v.map(function(p){return cartao(p,'botao' in o?o.botao:'Escolher este pedido',String(p.id)===String(o.atual||''))}).join(''):'<div class="pe-v">'+(L.length?'Nenhum pedido aqui.':'Esta conta ainda não tem pedidos.')+'</div>';
    f.querySelectorAll('[data-pe]').forEach(function(b){b.onclick=async function(){var p=L.filter(function(x){return String(x.id)===b.dataset.pe})[0];
     b.disabled=true;b.textContent='A guardar…';f.querySelector('.pe-x').textContent='';
     try{await o.ao(p);fechar()}catch(e){f.querySelector('.pe-x').textContent=String((e&&e.message)||e).replace(/^.*?exception:\s*/i,'');b.disabled=false;b.textContent=o.botao||'Escolher este pedido'}}});
   }
   pintar();
  }};
})();
  
