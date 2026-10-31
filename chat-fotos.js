/* chat-fotos.js — BBabilônia
   Envio de fotos no chat (carregado pelo chat-novo.html dentro do chat.html; não altera nenhum ficheiro):
   - pode escolher até 9 fotos de cada vez;
   - cada foto aparece logo no seu chat, com um ponto vermelho "A verificar…";
   - a foto só chega à outra pessoa depois de verificada (sem contactos, links, redes sociais, código QR);
   - se tiver contactos, NÃO é enviada: fica a indicação "Não enviada" com o motivo, só para si. */
(function () {
  if (window.__bbChatFotos) return;
  window.__bbChatFotos = 1;

  var MAX = 9;
  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var $ = function (i) { return document.getElementById(i); };
  var fila = [], aTrabalhar = false, pendentes = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function aleatorio() {
    var a = new Uint8Array(8); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function avisar(t) {
    var a = $('aviso');
    if (!a) return alert(t);
    setTimeout(function () { a.textContent = t; a.style.display = 'block'; setTimeout(function () { a.style.display = 'none'; }, 5000); }, 80);
  }

  /* estilo: balão pendente com ponto vermelho; a miniatura flutuante do filtro deixa de ser precisa */
  var st = document.createElement('style');
  st.textContent =
    '#bb-mini{display:none!important}' +
    '.bb-pend{max-width:82%;padding:9px 12px;border-radius:12px;margin:6px 0 6px auto;font-size:15px;line-height:1.35;background:#dcf8c6;box-shadow:0 1px 2px #0002;width:fit-content}' +
    '.bb-pend img{display:block;max-width:220px;max-height:260px;border-radius:8px;filter:saturate(.7)}' +
    '.bb-pend .bb-est{display:flex;align-items:center;gap:6px;font-size:12px;color:#555;margin-top:6px}' +
    '.bb-pend .bb-ponto{width:10px;height:10px;border-radius:50%;background:#e53935;flex:none;animation:bbPisca 1s infinite}' +
    '.bb-pend.bb-recusada{background:#ffebee!important}' +
    '.bb-pend.bb-recusada .bb-est{color:#c62828;font-weight:600}' +
    '.bb-pend.bb-recusada .bb-ponto{animation:none}' +
    '.bb-pend .bb-x{margin-left:auto;border:0;background:none;color:#c62828;font-size:16px;cursor:pointer}' +
    '@keyframes bbPisca{50%{opacity:.25}}';
  document.head.appendChild(st);

  /* os balões pendentes ficam sempre no fim da conversa (o chat volta a desenhar as mensagens a cada atualização) */
  function repor() {
    var b = $('msgs');
    if (!b) return;
    // só volta a pôr os que o chat tirou (assim não fica a repetir sem parar)
    pendentes.forEach(function (p) { if (p.el.parentNode !== b) b.appendChild(p.el); });
  }
  function descer() { var b = $('msgs'); if (b) b.scrollTop = b.scrollHeight; }

  function criarBalao(f) {
    var el = document.createElement('div');
    el.className = 'bb-pend';  // não usa a classe .m para não baralhar a contagem das mensagens (tradução, apagar)
    var u = URL.createObjectURL(f);
    el.innerHTML = '<img alt="" src="' + u + '"><div class="bb-est"><span class="bb-ponto"></span><span class="bb-txt">A verificar… (ainda não enviada)</span></div>';
    var p = { el: el, url: u, f: f };
    pendentes.push(p);
    var b = $('msgs'); if (b) b.appendChild(el);
    descer();
    return p;
  }
  function tirar(p) {
    var i = pendentes.indexOf(p); if (i > -1) pendentes.splice(i, 1);
    if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
    try { URL.revokeObjectURL(p.url); } catch (e) {}
  }
  function estadoBalao(p, txt) { var t = p.el.querySelector('.bb-txt'); if (t) t.textContent = txt; }
  function recusar(p, motivo) {
    p.el.classList.add('bb-recusada');
    p.el.querySelector('.bb-est').innerHTML = '<span class="bb-ponto"></span><span>❌ Não enviada: ' + esc(motivo) + '</span><button type="button" class="bb-x" title="Remover">✕</button>';
    p.el.querySelector('.bb-x').onclick = function () { tirar(p); };
    setTimeout(function () { tirar(p); }, 20000);
  }

  async function enviarUma(p) {
    var f = p.f;
    if (!window.FiltroImagem) return recusar(p, 'não foi possível verificar a imagem.');
    var r = await window.FiltroImagem.verificar(f, function () {});
    if (!r || !r.ok) return recusar(p, (r && r.motivo) || 'não foi possível verificar.');
    estadoBalao(p, 'Aprovada, a enviar…');
    var t = typeof window.token === 'function' ? await window.token() : null;
    var ext = f.type === 'image/png' ? 'png' : (f.type === 'image/webp' ? 'webp' : 'jpg');
    var caminho = window.conv.id + '/' + Date.now() + '-' + aleatorio() + '.' + ext;
    var up = await fetch(U + '/storage/v1/object/chat-imagens/' + caminho, {
      method: 'POST',
      headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': f.type, 'x-upsert': 'false' },
      body: f
    });
    if (!up.ok) return recusar(p, 'falhou o envio. Verifique a internet e tente outra vez.');
    await window.mandar({ conversa_id: window.conv.id, remetente_id: window.eu, tipo: 'imagem', texto: '', anexo_url: U + '/storage/v1/object/public/chat-imagens/' + caminho });
    tirar(p);
    descer();
  }

  async function trabalhar() {
    if (aTrabalhar) return;
    aTrabalhar = true;
    while (fila.length) {
      var p = fila.shift();
      try { await enviarUma(p); } catch (e) { recusar(p, (e && e.message) || 'erro ao enviar.'); }
    }
    aTrabalhar = false;
  }

  function escolhidas() {
    var inp = $('ficheiro');
    var lista = Array.prototype.slice.call(inp.files || []).filter(function (f) { return /^image\//.test(f.type); });
    inp.value = '';
    if (!lista.length || !window.conv) return;
    if (lista.length > MAX) { avisar('Pode enviar no máximo ' + MAX + ' fotos de cada vez. Vão ser enviadas as primeiras ' + MAX + '.'); lista = lista.slice(0, MAX); }
    lista.forEach(function (f) { fila.push(criarBalao(f)); });
    trabalhar();
  }

  var n = 0;
  (function ligar() {
    var inp = $('ficheiro'), b = $('msgs');
    if (!inp || !b || typeof window.mandar !== 'function') { if (++n < 200) setTimeout(ligar, 150); return; }
    inp.setAttribute('multiple', '');
    inp.onchange = escolhidas;              // substitui o envio de uma só foto (o resto do chat fica igual)
    new MutationObserver(function () { if (pendentes.length) repor(); }).observe(b, { childList: true });
  })();
})();
