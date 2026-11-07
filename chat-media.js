/* chat-media.js — BBabilônia (versão 2)
   Carregado pelo chat-novo.html dentro do chat.html. Não altera nenhum ficheiro.
   1) Enviar VÍDEO no chat (no mesmo botão das fotos; até 3 vídeos de cada vez, até 60 s e 50 MB cada).
      Antes de enviar, o vídeo passa pela MESMA verificação das fotos (contactos, links, redes sociais,
      código QR, marca de água): são tiradas imagens do vídeo de 3 em 3 segundos e cada uma é lida pelo
      mesmo filtro das fotos. Se uma tiver contactos, o vídeo NÃO é enviado.
      Enquanto verifica, o vídeo aparece no seu chat com ponto vermelho "A verificar…".
   2) Os vídeos aparecem no chat com leitor (play, som, ecrã inteiro).
   3) Botão "⬇ Guardar" por baixo de cada foto e de cada vídeo: guarda o ficheiro original no telemóvel
      (Transferências). Nunca abre a janela de partilha.
   4) Mais rápido a abrir: no chat aparece a miniatura (foto pequena) e a capa do vídeo; os links privados
      são pedidos todos de uma vez e ficam guardados 6 h no telemóvel. O original abre ao tocar / Guardar.
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

  /* ---------- links privados (rápidos) ----------
     - pede os links de muitas fotos/vídeos num só pedido (antes era um pedido por foto, de 1,2 em 1,2 s);
     - guarda os links no telemóvel durante 6 h: ao voltar à conversa as fotos abrem logo (do cache);
     - mostra a MINIATURA (pequena) no chat; o original só é descarregado ao tocar ou ao Guardar. */
  var VALIDADE = 6 * 3600, CK = 'bb_links_chat_v1';
  var cache = {};
  try {
    var guardado = JSON.parse(localStorage.getItem(CK) || '{}') || {}, agora0 = Date.now();
    Object.keys(guardado).forEach(function (k) { if (guardado[k] && guardado[k].a > agora0) cache[k] = guardado[k]; });
  } catch (e) {}
  var tGuardar = null;
  function guardarCache() {
    clearTimeout(tGuardar);
    tGuardar = setTimeout(function () {
      try {
        var ks = Object.keys(cache), agora = Date.now(), out = {};
        ks.forEach(function (k) { if (cache[k].a > agora) out[k] = cache[k]; });
        ks = Object.keys(out);
        if (ks.length > 600) ks.sort(function (x, y) { return out[x].a - out[y].a; }).slice(0, ks.length - 600).forEach(function (k) { delete out[k]; });
        localStorage.setItem(CK, JSON.stringify(out));
      } catch (e) {}
    }, 300);
  }
  function minDe(caminho) {   // c1/123-abc.png -> c1/min-123-abc.jpg
    var i = caminho.lastIndexOf('/'), dir = caminho.slice(0, i + 1), nome = caminho.slice(i + 1);
    return dir + 'min-' + nome.replace(/\.[^.]+$/, '') + '.jpg';
  }
  function partes(url) { var m = String(url || '').match(RE); return m ? { b: m[1], p: decodeURIComponent(m[2]) } : null; }
  function absoluto(s) { return /^https?:/.test(s) ? s : U + '/storage/v1' + (s.charAt(0) === '/' ? s : '/' + s); }

  var faltam = {}, aPedir = {}, tPedir = null, depois = [];
  function pedir(b, p) {
    var k = b + '/' + p;
    if (aPedir[k] || (cache[k] && cache[k].a > Date.now())) return;
    aPedir[k] = 1;
    (faltam[b] = faltam[b] || []).push(p);
    clearTimeout(tPedir);
    tPedir = setTimeout(enviarPedidos, 20);
  }
  async function enviarPedidos() {
    var lotes = faltam; faltam = {};
    var t = await tok();
    var tarefas = [];
    Object.keys(lotes).forEach(function (b) {
      var lista = lotes[b];
      for (var i = 0; i < lista.length; i += 100) {
        (function (paths) {
          tarefas.push((async function () {
            var res = null;
            if (t) {
              try {
                var r = await fetch(U + '/storage/v1/object/sign/' + b, {
                  method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ expiresIn: VALIDADE, paths: paths })
                });
                res = r.ok ? await r.json() : null;
              } catch (e) {}
            }
            var mapa = {};
            (Array.isArray(res) ? res : []).forEach(function (x) { if (x && x.path) mapa[x.path] = x; });
            paths.forEach(function (p) {
              var k = b + '/' + p, x = mapa[p];
              delete aPedir[k];
              if (!res) return;                                   // sem resposta: tenta outra vez mais tarde
              var s = x && !x.error && (x.signedURL || x.signedUrl);
              cache[k] = s ? { u: absoluto(s), a: Date.now() + (VALIDADE - 900) * 1000 }
                           : { u: '', a: Date.now() + 3600 * 1000 };   // não existe (ex.: foto antiga sem miniatura)
            });
          })());
        })(lista.slice(i, i + 100));
      }
    });
    await Promise.all(tarefas);
    guardarCache();
    arrumar();
    var d = depois; depois = []; d.forEach(function (f) { try { f(); } catch (e) {} });
  }
  function doCache(b, p) { var c = cache[b + '/' + p]; return c && c.a > Date.now() ? c : null; }
  /* link do ficheiro original (para Guardar) */
  function linkPara(orig) {
    var x = partes(orig);
    if (!x) return Promise.resolve(orig);
    var c = doCache(x.b, x.p);
    if (c && c.u) return Promise.resolve(c.u);
    if (c && !c.u) return Promise.reject(new Error('Sem permissão para este ficheiro.'));
    return new Promise(function (ok, erro) {
      depois.push(function () { var c2 = doCache(x.b, x.p); if (c2 && c2.u) ok(c2.u); else erro(new Error('Não foi possível obter o ficheiro.')); });
      pedir(x.b, x.p);
    });
  }

  /* miniatura JPG (máx. 640 px) feita no telemóvel de quem envia */
  function miniatura(blob) {
    return new Promise(function (ok) {
      try {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () {
          var w = im.naturalWidth, h = im.naturalHeight, e = Math.min(1, 640 / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w * e)); c.height = Math.max(1, Math.round(h * e));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(u);
          c.toBlob(function (b) { ok(b); }, 'image/jpeg', 0.8);
        };
        im.onerror = function () { URL.revokeObjectURL(u); ok(null); };
        im.src = u;
      } catch (e) { ok(null); }
    });
  }
  var SUBIR = U + '/storage/v1/object/chat-imagens/';
  function cabecalhoAuth(o) {
    var h = o && o.headers;
    if (!h) return null;
    if (typeof h.get === 'function') return h.get('Authorization');
    return h.Authorization || h.authorization || null;
  }
  /* cada foto enviada no chat leva também a sua miniatura (o chat-privado.js põe as duas na pasta privada) */
  var fetchAntes = window.fetch;
  window.fetch = function (r, o) {
    var u = typeof r === 'string' ? r : (r && r.url) || '';
    var metodo = String((o && o.method) || 'GET').toUpperCase();
    if (metodo === 'POST' && u.indexOf(SUBIR) === 0 && o && o.body instanceof Blob && /^image\/(jpeg|png|webp)$/.test(o.body.type)) {
      var caminho = u.slice(SUBIR.length).split('?')[0], nome = caminho.split('/').pop();
      if (!/^(min-|link-)/.test(nome)) {
        var auth = cabecalhoAuth(o);
        var principal = fetchAntes.apply(this, arguments);
        var mini = miniatura(o.body).then(function (b) {
          if (!b) return null;
          return fetchAntes(SUBIR + minDe(caminho), {
            method: 'POST',
            headers: { apikey: K, Authorization: auth || ('Bearer ' + K), 'Content-Type': 'image/jpeg', 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
            body: b
          });
        }).catch(function () { return null; });
        return Promise.all([principal, mini]).then(function (x) { return x[0]; });
      }
    }
    return fetchAntes.apply(this, arguments);
  };

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

  /* ---------- 2) mostrar fotos (miniatura) e vídeos, e pôr botões ---------- */
  var leitores = {};   // o mesmo leitor é reaproveitado quando o chat volta a desenhar as mensagens
  function leitor(orig) {
    var x = partes(orig), k = x ? x.b + '/' + x.p : orig, v = leitores[k];
    if (!v) {
      v = document.createElement('video');
      v.className = 'bb-vid'; v.controls = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.preload = 'none';
      v.setAttribute('data-bb-orig', orig);
      v.addEventListener('play', function () { v.__toca = true; });
      v.addEventListener('pause', function () { if (v.isConnected) v.__toca = false; });
      leitores[k] = v;
    }
    if (x) {
      var cv = doCache(x.b, x.p), cm = doCache(x.b, minDe(x.p));
      if (!cv) pedir(x.b, x.p);
      if (!cm) pedir(x.b, minDe(x.p));
      if (cm && cm.u && v.getAttribute('poster') !== cm.u) v.setAttribute('poster', cm.u);
      if (cm && !cm.u && v.preload !== 'metadata') v.preload = 'metadata';   // vídeo antigo sem capa
      if (cv && cv.u && v.getAttribute('src') !== cv.u) v.src = cv.u;
    } else if (!v.getAttribute('src')) v.src = orig;
    return v;
  }
  function porFoto(img, url) {
    if (img.getAttribute('src') === url) return;
    img.removeAttribute('data-bb-orig');   // o fotos-privadas.js deixa esta foto (já tem link privado)
    img.decoding = 'async';
    img.setAttribute('src', url);
  }
  function foto(img) {
    var full = img.getAttribute('data-bb-full');
    if (!full) {
      full = img.getAttribute('data-bb-orig') || img.getAttribute('src') || '';
      if (!partes(full)) return;
      img.setAttribute('data-bb-full', full);
    }
    var x = partes(full); if (!x) return;
    var mp = minDe(x.p), cm = doCache(x.b, mp), cf = doCache(x.b, x.p);
    if (cm && cm.u) return porFoto(img, cm.u);                 // miniatura: abre depressa
    if (cm && !cm.u) { if (cf && cf.u) return porFoto(img, cf.u); if (!cf) pedir(x.b, x.p); return; }
    pedir(x.b, mp); if (!cf) pedir(x.b, x.p);
  }
  function arrumar() {
    var b = $('msgs');
    if (!b) return;
    var imgs = b.querySelectorAll('.m img.foto');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i], msg = img.closest('.m');
      if (!msg || msg.classList.contains('bb-canc')) continue;
      var orig = img.getAttribute('data-bb-full') || img.getAttribute('data-bb-orig') || img.getAttribute('src') || '';
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
      foto(img);
      if (bloco.nextElementSibling && bloco.nextElementSibling.classList.contains('bb-gd')) continue;
      (function (im) {
        bloco.parentNode.insertBefore(botaoGuardar(function () {
          return im.getAttribute('data-bb-full') || im.getAttribute('data-bb-orig') || im.getAttribute('src') || '';
        }), bloco.nextSibling);
      })(img);
    }
    var vs = b.querySelectorAll('.m video.bb-vid');            // atualiza capa/link dos vídeos já mostrados
    for (var j = 0; j < vs.length; j++) leitor(vs[j].getAttribute('data-bb-orig'));
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
    p.capa = r.imagens[0] || null;
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
    var capa = p.capa ? miniatura(p.capa).then(function (b) {   // capa pequena do vídeo (abre depressa no chat)
      if (!b) return null;
      return fetch(SUBIR + minDe(caminho), {
        method: 'POST',
        headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': 'image/jpeg', 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
        body: b
      });
    }).catch(function () { return null; }) : Promise.resolve(null);
    var up = await fetch(SUBIR + caminho, {   // o chat-privado.js manda para a pasta privada
      method: 'POST',
      headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': tipo, 'x-upsert': 'false' },
      body: f
    });
    await capa;
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
    new MutationObserver(function () { if (pendentes.length) repor(); arrumar(); }).observe(b, { childList: true });
    arrumar();
  })();
})();
