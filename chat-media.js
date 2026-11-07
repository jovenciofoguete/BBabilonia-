/* chat-media.js — BBabilônia
   Carregado pelo chat-novo.html dentro do chat.html. Não altera nenhum ficheiro.
   1) Enviar VÍDEO no chat (no mesmo botão das fotos; até 3 vídeos de cada vez, até 60 s e 50 MB cada).
      Antes de enviar, o vídeo passa pela MESMA verificação das fotos (contactos, links, redes sociais,
      código QR, marca de água): são tiradas imagens do vídeo de 3 em 3 segundos e cada uma é lida pelo
      mesmo filtro das fotos. Se uma tiver contactos, o vídeo NÃO é enviado.
      Enquanto verifica, o vídeo aparece no seu chat com ponto vermelho "A verificar…".
   2) Os vídeos aparecem no chat com leitor (play, som, ecrã inteiro).
   3) Botão "⬇ Guardar" por baixo de cada foto e de cada vídeo: guarda o ficheiro original no telemóvel
      (Transferências). Nunca abre a janela de partilha.
   Fotos e vídeos ficam na pasta privada (o chat-privado.js trata disso), só para quem pode abrir a conversa. */
(function () {
  if (window.__bbChatMedia) return;
  window.__bbChatMedia = 1;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';
  var RE = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/(chat-imagens|chat-privado)\/([^?#]+)/;
  var EXT_VIDEO = /\.(mp4|webm|mov|m4v|3gp)$/i;
  var MAX_VIDEOS = 3, MAX_SEG = 60, MAX_MB = 50, PASSO = 3, MAX_IMAGENS = 21;
  var $ = function (i) { return document.getElementById(i); };

  var st = document.createElement('style');
  st.textContent =
    '.bb-gd{display:inline-flex;align-items:center;gap:5px;margin-top:6px;border:0;border-radius:999px;' +
    'padding:6px 12px;font:600 13px system-ui,sans-serif;background:#0f172a0f;color:#0b57d0;cursor:pointer}' +
    '.bb-gd:disabled{opacity:.55}.bb-gd.ok{color:#047857}.bb-gd.er{color:#c62828}' +
    '.bb-vid{display:block;max-width:100%;width:260px;max-height:340px;border-radius:8px;background:#000}' +
    '.bb-vpend{max-width:82%;padding:9px 12px;border-radius:12px;margin:6px 0 6px auto;font-size:15px;line-height:1.35;background:#dcf8c6;box-shadow:0 1px 2px #0002;width:fit-content}' +
    '.bb-vpend video{display:block;max-width:220px;max-height:260px;border-radius:8px;background:#000;filter:saturate(.7)}' +
    '.bb-vpend .bb-est{display:flex;align-items:center;gap:6px;font-size:12px;color:#555;margin-top:6px}' +
    '.bb-vpend .bb-ponto{width:10px;height:10px;border-radius:50%;background:#e53935;flex:none;animation:bbPiscaV 1s infinite}' +
    '.bb-vpend.bb-recusada{background:#ffebee!important}.bb-vpend.bb-recusada .bb-est{color:#c62828;font-weight:600}' +
    '.bb-vpend.bb-recusada .bb-ponto{animation:none}' +
    '.bb-vpend .bb-x{margin-left:auto;border:0;background:none;color:#c62828;font-size:16px;cursor:pointer}' +
    '@keyframes bbPiscaV{50%{opacity:.25}}';
  document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function aleatorio() { var a = new Uint8Array(8); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function avisar(t) {
    var a = $('aviso'); if (!a) return alert(t);
    setTimeout(function () { a.textContent = t; a.style.display = 'block'; setTimeout(function () { a.style.display = 'none'; }, 5000); }, 80);
  }
  function eVideo(f) { return f && (/^video\//.test(f.type) || EXT_VIDEO.test(f.name || '')); }
  async function tok() {
    if (typeof window.token === 'function') { try { var t = await window.token(); if (t) return t; } catch (e) {} }
    try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); if (s && s.currentSession) s = s.currentSession; return s && s.access_token || null; } catch (e) { return null; }
  }

  /* ---------- links privados ---------- */
  var assinados = {};
  async function assinar(bucket, caminho) {
    var k = bucket + '/' + caminho, c = assinados[k];
    if (c && c.ate > Date.now()) return c.url;
    var t = await tok();
    if (!t) throw new Error('Entre na conta outra vez.');
    var r = await fetch(U + '/storage/v1/object/sign/' + bucket + '/' + caminho, {
      method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 6 * 3600 })
    });
    var j = r.ok ? await r.json() : null, s = j && (j.signedURL || j.signedUrl);
    if (!s) throw new Error('Sem permissão para este ficheiro.');
    var url = /^https?:/.test(s) ? s : U + '/storage/v1' + (s.charAt(0) === '/' ? s : '/' + s);
    assinados[k] = { url: url, ate: Date.now() + (6 * 3600 - 600) * 1000 };
    return url;
  }
  async function linkPara(orig) {
    var m = String(orig || '').match(RE);
    if (!m) return orig;
    if (orig.indexOf('/object/sign/') > -1) return orig;
    return assinar(m[1], m[2]);
  }

  /* ---------- 3) guardar no telemóvel ---------- */
  function extensao(tipo, orig) {
    var m = String(orig || '').split('?')[0].match(/\.([a-z0-9]{2,4})$/i);
    if (/png/.test(tipo)) return 'png';
    if (/webp/.test(tipo)) return 'webp';
    if (/gif/.test(tipo)) return 'gif';
    if (/jpe?g/.test(tipo)) return 'jpg';
    if (/mp4/.test(tipo)) return 'mp4';
    if (/webm/.test(tipo)) return 'webm';
    if (/quicktime/.test(tipo)) return 'mov';
    if (/3gpp/.test(tipo)) return '3gp';
    return m ? m[1].toLowerCase() : 'jpg';
  }
  async function guardar(origem, bt) {
    var txt = bt.innerHTML;
    bt.disabled = true; bt.className = 'bb-gd'; bt.textContent = 'A guardar…';
    try {
      var url = await linkPara(origem);
      var r = await fetch(url);
      if (!r.ok) throw new Error('Não foi possível obter o ficheiro.');
      var blob = await r.blob();
      var nome = 'bbabilonia-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') + '.' + extensao(blob.type, origem);
      var u = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = u; a.download = nome; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 120000);
      bt.className = 'bb-gd ok'; bt.textContent = '✓ Guardado';
    } catch (e) {
      bt.className = 'bb-gd er'; bt.textContent = '✕ ' + ((e && e.message) || 'Falhou');
    }
    setTimeout(function () { bt.disabled = false; bt.className = 'bb-gd'; bt.innerHTML = txt; }, 3500);
  }
  function botaoGuardar(origemFn) {
    var bt = document.createElement('button');
    bt.type = 'button'; bt.className = 'bb-gd'; bt.innerHTML = '⬇ Guardar';
    bt.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); guardar(origemFn(), bt); });
    bt.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    return bt;
  }

  /* ---------- 2) mostrar vídeos e pôr botões ---------- */
  var leitores = {};   // o mesmo leitor é reaproveitado quando o chat volta a desenhar as mensagens
  function caminhoDe(orig) { var m = String(orig || '').match(RE); return m ? m[1] + '/' + m[2] : orig; }
  function leitor(orig) {
    var k = caminhoDe(orig), v = leitores[k];
    if (!v) {
      v = document.createElement('video');
      v.className = 'bb-vid'; v.controls = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.preload = 'metadata';
      v.setAttribute('data-bb-orig', orig);
      v.addEventListener('play', function () { v.__toca = true; });
      v.addEventListener('pause', function () { if (v.isConnected) v.__toca = false; });
      linkPara(orig).then(function (u) { v.src = u; }).catch(function () {});
      leitores[k] = v;
    }
    return v;
  }
  function arrumar() {
    var b = $('msgs');
    if (!b) return;
    var imgs = b.querySelectorAll('.m img.foto');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i], msg = img.closest('.m');
      if (!msg || msg.classList.contains('bb-canc')) continue;
      var orig = img.getAttribute('data-bb-orig') || img.getAttribute('src') || '';
      var bloco = img.closest('a') || img;
      if (EXT_VIDEO.test(orig.split('?')[0])) {
        var v = leitor(orig);
        bloco.parentNode.replaceChild(v, bloco);
        if (v.__toca && v.paused) v.play().catch(function () {});
        if (!(v.nextElementSibling && v.nextElementSibling.classList.contains('bb-gd'))) {
          v.parentNode.insertBefore(botaoGuardar(function () { return v.getAttribute('data-bb-orig'); }), v.nextSibling);
        }
        continue;
      }
      if (bloco.nextElementSibling && bloco.nextElementSibling.classList.contains('bb-gd')) continue;
      (function (im) {
        bloco.parentNode.insertBefore(botaoGuardar(function () {
          var s = im.currentSrc || im.getAttribute('src') || '';
          return s.indexOf('/object/sign/') > -1 ? s : (im.getAttribute('data-bb-orig') || s);
        }), bloco.nextSibling);
      })(img);
    }
  }

  /* ---------- 1) enviar vídeo com verificação ---------- */
  var pendentes = [], fila = [], aTrabalhar = false;
  function descer() { var b = $('msgs'); if (b) b.scrollTop = b.scrollHeight; }
  function repor() { var b = $('msgs'); if (b) pendentes.forEach(function (p) { if (p.el.parentNode !== b) b.appendChild(p.el); }); }
  function criarBalao(f) {
    var el = document.createElement('div'); el.className = 'bb-vpend';  // sem a classe .m (não mexe na contagem das mensagens)
    var u = URL.createObjectURL(f);
    el.innerHTML = '<video muted playsinline preload="metadata" src="' + u + '"></video><div class="bb-est"><span class="bb-ponto"></span><span class="bb-txt">A verificar o vídeo… (ainda não enviado)</span></div>';
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
  function estadoBalao(p, t) { var x = p.el.querySelector('.bb-txt'); if (x) x.textContent = t; }
  function recusar(p, motivo) {
    p.el.classList.add('bb-recusada');
    p.el.querySelector('.bb-est').innerHTML = '<span class="bb-ponto"></span><span>❌ Não enviado: ' + esc(motivo) + '</span><button type="button" class="bb-x" title="Remover">✕</button>';
    p.el.querySelector('.bb-x').onclick = function () { tirar(p); };
    setTimeout(function () { tirar(p); }, 20000);
  }

  function esperar(el, ev, ms) {
    return new Promise(function (ok, erro) {
      var t = setTimeout(function () { limpar(); erro(new Error('tempo')); }, ms);
      function f() { limpar(); ok(); }
      function e() { limpar(); erro(new Error('erro')); }
      function limpar() { clearTimeout(t); el.removeEventListener(ev, f); el.removeEventListener('error', e); }
      el.addEventListener(ev, f); el.addEventListener('error', e);
    });
  }
  function assinatura(c) {   // miniatura 16x16 em cinzento, para saltar imagens repetidas
    var s = document.createElement('canvas'); s.width = 16; s.height = 16;
    var x = s.getContext('2d'); x.drawImage(c, 0, 0, 16, 16);
    var d = x.getImageData(0, 0, 16, 16).data, r = [];
    for (var i = 0; i < d.length; i += 4) r.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    return r;
  }
  function diferenca(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }

  /* tira imagens do vídeo (JPG) para o filtro das fotos ler */
  async function imagensDoVideo(f, progresso) {
    var url = URL.createObjectURL(f), v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.src = url;
    try {
      await esperar(v, 'loadedmetadata', 20000);
      var dur = v.duration;
      if (!isFinite(dur) || !dur) { v.currentTime = 1e7; await esperar(v, 'seeked', 10000); dur = v.currentTime; }
      if (!dur) throw new Error('ler');
      if (dur > MAX_SEG + 0.5) return { erro: 'o vídeo pode ter no máximo ' + MAX_SEG + ' segundos.' };
      try { await v.play(); v.pause(); } catch (e) {}
      var tempos = [];
      for (var t = 0.2; t < dur; t += PASSO) tempos.push(t);
      tempos.push(Math.max(0, dur - 0.2));
      if (tempos.length > MAX_IMAGENS) {
        var n = MAX_IMAGENS, out = [];
        for (var i = 0; i < n; i++) out.push(0.2 + (dur - 0.4) * i / (n - 1));
        tempos = out;
      }
      var lista = [], ant = null, base = Date.now();
      for (var j = 0; j < tempos.length; j++) {
        progresso('A preparar o vídeo… ' + Math.round((j / tempos.length) * 100) + '%');
        v.currentTime = tempos[j];
        await esperar(v, 'seeked', 10000);
        var w = v.videoWidth, h = v.videoHeight;
        if (!w || !h) throw new Error('ler');
        var e = Math.min(1, 1280 / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * e); c.height = Math.round(h * e);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        var a = assinatura(c);
        if (ant && diferenca(a, ant) < 4 && j < tempos.length - 1) continue;   // igual à anterior: não precisa de ler outra vez
        ant = a;
        var blob = await new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.92); });
        if (!blob) throw new Error('ler');
        lista.push(new File([blob], 'video-' + base + '-' + j + '.jpg', { type: 'image/jpeg', lastModified: base + j }));
      }
      return { imagens: lista };
    } finally {
      v.removeAttribute('src'); try { v.load(); } catch (e) {}
      URL.revokeObjectURL(url);
    }
  }

  async function verificarVideo(f, p) {
    if (f.size > MAX_MB * 1024 * 1024) return { ok: false, motivo: 'o vídeo é maior que ' + MAX_MB + ' MB.' };
    if (!window.FiltroImagem || typeof window.FiltroImagem.verificar !== 'function') return { ok: false, motivo: 'não foi possível verificar o vídeo.' };
    var r;
    try { r = await imagensDoVideo(f, function (t) { estadoBalao(p, t + ' (ainda não enviado)'); }); }
    catch (e) { return { ok: false, motivo: 'não foi possível ler este vídeo neste telemóvel. Grave em MP4 e tente outra vez.' }; }
    if (r.erro) return { ok: false, motivo: r.erro };
    for (var i = 0; i < r.imagens.length; i++) {
      estadoBalao(p, 'A verificar o vídeo… ' + (i + 1) + '/' + r.imagens.length + ' (ainda não enviado)');
      var v = await window.FiltroImagem.verificar(r.imagens[i], function () {});
      if (!v || !v.ok) {
        var m = (v && v.motivo) || 'não foi possível verificar.';
        return { ok: false, motivo: m.replace(/Imagem recusada/g, 'Vídeo recusado').replace(/a imagem/g, 'o vídeo') };
      }
    }
    return { ok: true };
  }

  function tipoVideo(f) {
    if (/^video\//.test(f.type)) return f.type;
    var m = (f.name || '').match(EXT_VIDEO), e = m ? m[1].toLowerCase() : 'mp4';
    return e === 'mov' ? 'video/quicktime' : e === 'webm' ? 'video/webm' : e === '3gp' ? 'video/3gpp' : 'video/mp4';
  }
  async function enviarUm(p) {
    var f = p.f;
    var r = await verificarVideo(f, p);
    if (!r.ok) return recusar(p, r.motivo);
    estadoBalao(p, 'Aprovado, a enviar o vídeo…');
    var t = await tok(), tipo = tipoVideo(f), ext = extensao(tipo, f.name);
    var caminho = window.conv.id + '/' + Date.now() + '-' + aleatorio() + '.' + ext;
    var up = await fetch(U + '/storage/v1/object/chat-imagens/' + caminho, {   // o chat-privado.js manda para a pasta privada
      method: 'POST',
      headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': tipo, 'x-upsert': 'false' },
      body: f
    });
    if (!up.ok) {
      var txt = ''; try { txt = await up.text(); } catch (e) {}
      if (/mime|type/i.test(txt)) return recusar(p, 'falta correr o SQL dos vídeos no Supabase.');
      if (/size|large|maximum/i.test(txt)) return recusar(p, 'o vídeo é grande demais para o armazenamento.');
      return recusar(p, 'falhou o envio. Verifique a internet e tente outra vez.');
    }
    await window.mandar({ conversa_id: window.conv.id, remetente_id: window.eu, tipo: 'imagem', texto: '', anexo_url: U + '/storage/v1/object/public/chat-imagens/' + caminho });
    tirar(p);
    descer();
  }
  async function trabalhar() {
    if (aTrabalhar) return;
    aTrabalhar = true;
    while (fila.length) {
      var p = fila.shift();
      try { await enviarUm(p); } catch (e) { recusar(p, (e && e.message) || 'erro ao enviar.'); }
    }
    aTrabalhar = false;
  }
  function receberVideos(lista) {
    if (!window.conv) return;
    if (lista.length > MAX_VIDEOS) { avisar('Pode enviar no máximo ' + MAX_VIDEOS + ' vídeos de cada vez. Vão ser enviados os primeiros ' + MAX_VIDEOS + '.'); lista = lista.slice(0, MAX_VIDEOS); }
    lista.forEach(function (f) { fila.push(criarBalao(f)); });
    trabalhar();
  }

  /* o mesmo botão das fotos passa a aceitar vídeos: as fotos seguem para o envio de fotos que já existe */
  function embrulhar(inp) {
    var antes = inp.onchange;
    if (!antes || antes.__bbV) return;
    var novo = function (e) {
      var todos = Array.prototype.slice.call(inp.files || []);
      var videos = todos.filter(eVideo), fotos = todos.filter(function (f) { return !eVideo(f); });
      if (!videos.length) return antes.call(this, e);
      if (fotos.length) {
        try {
          var dt = new DataTransfer(); fotos.forEach(function (f) { dt.items.add(f); });
          inp.files = dt.files; antes.call(this, e);
        } catch (x) { avisar('Envie as fotos e os vídeos em separado.'); }
      }
      inp.value = '';
      receberVideos(videos);
    };
    novo.__bbV = 1;
    inp.onchange = novo;
  }

  var n = 0;
  (function ligar() {
    var inp = $('ficheiro'), b = $('msgs');
    if (!inp || !b || typeof window.mandar !== 'function') { if (++n < 200) setTimeout(ligar, 150); return; }
    inp.setAttribute('accept', 'image/jpeg,image/png,image/webp,video/*');
    inp.setAttribute('multiple', '');
    var lab = $('anexar');
    if (lab) lab.title = 'Enviar foto ou vídeo';
    // o envio de fotos (chat-fotos.js) pode ligar-se depois deste ficheiro: confirma durante uns segundos
    var k = 0, ti = setInterval(function () {
      embrulhar(inp);
      var e = lab && lab.querySelector('.bb-t'); if (e && e.textContent !== ' Foto/Vídeo') e.textContent = ' Foto/Vídeo';
      if (++k > 40) clearInterval(ti);
    }, 250);
    embrulhar(inp);
    var tm = null;
    new MutationObserver(function () { if (pendentes.length) repor(); clearTimeout(tm); tm = setTimeout(arrumar, 60); }).observe(b, { childList: true });
    arrumar();
  })();
})();
