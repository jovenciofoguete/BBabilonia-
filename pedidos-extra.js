/* pedidos-extra.js — BBabilônia (ficheiro novo; não altera os outros)
   1) Meu Babilônia (conta.html): botão "📢 Publicar o que procuro" → pedidos-publicos.html
   2) Painel do vendedor: caixa "📢 Pedidos dos clientes" → pedidos-publicos.html (ver o que procuram e fazer ofertas)
   3) Os meus pedidos (pedidos.html): "📍 Rastreamento em tempo real" no detalhe do pedido enviado
      (mostra o percurso do pacote pelo 17TRACK, gratuito, qualquer transportadora; e botão para abrir o rastreamento completo) */
(function () {
  if (window.__bbPedidosExtra) return;
  window.__bbPedidosExtra = 1;
  var d = document, pg = location.pathname.split('/').pop() || '';

  /* ---------- 1) Meu Babilônia ---------- */
  function conta() {
    var g = d.querySelector('#painel .grid');
    if (!g || d.getElementById('bb-rfq-t')) return;
    var a = d.createElement('a');
    a.id = 'bb-rfq-t'; a.className = 't t5'; a.href = 'pedidos-publicos.html';
    a.innerHTML = '<span class="e2">📢</span><b>Publicar o que procuro</b>';
    var sair = d.getElementById('sair');
    if (sair && sair.parentNode === g) g.insertBefore(a, sair); else g.appendChild(a);
  }

  /* ---------- 2) Painel do vendedor ---------- */
  function painel() {
    ['v-inicio', 'v-mensagens'].forEach(function (id) {
      var s = d.getElementById(id);
      if (!s || s.classList.contains('hide') || !s.children.length || s.querySelector('.bb-rfq-v')) return;
      var c = d.createElement('div');
      c.className = 'cx bb-rfq-v';
      c.innerHTML = '<a class="bt g" href="pedidos-publicos.html" style="background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff">📢 Pedidos dos clientes: veja o que procuram e faça ofertas</a>';
      s.appendChild(c);
    });
  }

  /* ---------- 3) Rastreamento em tempo real ---------- */
  var LINGUAS = { pt: 'pt', en: 'en', zh: 'zh-cn', fr: 'fr', es: 'es', ru: 'ru', de: 'de', it: 'it', ja: 'ja', ko: 'ko', ar: 'ar', tr: 'tr', pl: 'pl', nl: 'nl', uk: 'uk' };
  function lingua() {
    var l = 'pt';
    try { l = String((JSON.parse(localStorage.getItem('bb_prefs') || '{}') || {}).idioma || navigator.language || 'pt').split('-')[0].toLowerCase(); } catch (e) {}
    return LINGUAS[l] || 'en';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function linkTransportadora(t, n) {
    t = String(t || '').toLowerCase(); n = encodeURIComponent(n);
    if (/dhl/.test(t)) return ['DHL', 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=' + n];
    if (/fedex|tnt/.test(t)) return ['FedEx', 'https://www.fedex.com/fedextrack/?trknbr=' + n];
    if (/\bups\b/.test(t)) return ['UPS', 'https://www.ups.com/track?tracknum=' + n];
    if (/aramex/.test(t)) return ['Aramex', 'https://www.aramex.com/track/results?ShipmentNumber=' + n];
    return null;
  }
  var script17 = null;
  function carregar17() {
    if (window.YQV5) return Promise.resolve(true);
    if (script17) return script17;
    script17 = new Promise(function (ok) {
      var s = d.createElement('script');
      s.src = 'https://www.17track.net/externalcall.js';
      s.onload = function () { ok(!!window.YQV5); };
      s.onerror = function () { ok(false); };
      d.head.appendChild(s);
      setTimeout(function () { ok(!!window.YQV5); }, 12000);
    });
    return script17;
  }
  function pedidoAberto() {
    try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; }
  }
  function rastreio() {
    var det = d.getElementById('det');
    if (!det || det.classList.contains('hide')) return;
    var p = pedidoAberto();
    if (!p || !p.rastreio) return;
    var velho = d.getElementById('bb-rv');
    if (velho && velho.getAttribute('data-id') === String(p.id) && det.contains(velho)) return;
    var caixa = null, hs = det.querySelectorAll('.box h3');
    for (var i = 0; i < hs.length; i++) if (/Envio/.test(hs[i].textContent)) { caixa = hs[i].parentNode; break; }
    if (!caixa) return;
    var num = String(p.rastreio).trim(), lt = linkTransportadora(p.transportadora, num);
    var b = d.createElement('div');
    b.className = 'box'; b.id = 'bb-rv'; b.setAttribute('data-id', String(p.id));
    b.innerHTML = '<h3>📍 Rastreamento em tempo real</h3>' +
      '<div class="dl"><span>Onde está o pacote agora, atualizado pela transportadora.</span></div>' +
      '<div id="bb-yq" style="min-height:90px;margin-top:8px;border-radius:12px;overflow:hidden"><div class="dl"><span>A carregar o rastreamento…</span></div></div>' +
      '<a class="pag" style="margin-top:10px" target="_blank" rel="noopener" href="https://t.17track.net/' + lingua() + '#nums=' + encodeURIComponent(num) + '">🔎 Abrir o rastreamento completo</a>' +
      (lt ? '<a class="pag" style="margin-top:8px;background:#0e7490" target="_blank" rel="noopener" href="' + esc(lt[1]) + '">🚚 Ver no site da ' + esc(lt[0]) + '</a>' : '');
    if (velho) velho.remove();
    caixa.parentNode.insertBefore(b, caixa.nextSibling);
    carregar17().then(function (ok) {
      var box = d.getElementById('bb-yq');
      if (!box || !d.getElementById('bb-rv') || d.getElementById('bb-rv').getAttribute('data-id') !== String(p.id)) return;
      if (!ok || !window.YQV5 || typeof window.YQV5.trackSingle !== 'function') {
        box.innerHTML = '<div class="dl"><span>Não foi possível mostrar aqui. Toque em “Abrir o rastreamento completo”.</span></div>';
        return;
      }
      box.innerHTML = '';
      try {
        window.YQV5.trackSingle({ YQ_ContainerId: 'bb-yq', YQ_Height: 560, YQ_Fc: '0', YQ_Lang: lingua(), YQ_Num: num });
      } catch (e) {
        box.innerHTML = '<div class="dl"><span>Não foi possível mostrar aqui. Toque em “Abrir o rastreamento completo”.</span></div>';
      }
    });
  }

  function correr() {
    if (pg === 'conta.html') conta();
    else if (pg === 'pedidos.html') rastreio();
    else if (/^painel-vendedor/.test(pg) || d.getElementById('v-inicio')) painel();
  }
  var t = null;
  function iniciar() {
    correr();
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(correr, 60); }).observe(d.body, { childList: true, subtree: true });
  }
  if (d.body) iniciar(); else d.addEventListener('DOMContentLoaded', iniciar);
})();
