/* fornecedor-filtro.js — BBabilônia
   Anti-contactos no REGISTO DE PRODUTO (fornecedor-novo.html e registar-produto.html).
   - Cada foto do produto e cada foto de cor é verificada logo que é escolhida:
     código QR (WeChat, WhatsApp…), links/sites, contactos, @contas, marca de água escrita,
     texto chinês de contacto (微信, 电话…). A foto recusada sai da lista e aparece o motivo.
   - O vídeo é verificado em 5 imagens tiradas ao longo do vídeo (mesmas regras).
   - Ao publicar: nome, descrição, nomes das cores e restantes campos de texto não podem ter
     contactos, links, email ou redes sociais; e não publica enquanto houver ficheiros por verificar.
   Usa os filtros que já existem (filtro-contactos.js, imagem-filtro.js, imagem-rapida.js, chat-traducao.js).
   Não altera o fornecedor-novo.html nem o publicar-v3.js: só acrescenta a verificação. */
(function () {
  if (window.__bbFornFiltro) return; window.__bbFornFiltro = 1;
  if (!document.getElementById('sv') || !document.getElementById('ff')) return;

  var AVISO_CONTA = ' Se continuar a tentar, a conta pode ser bloqueada para sempre.';
  var pendentes = [];          // verificações em curso
  var recusados = [];          // ficheiros recusados (File)
  var libsP = null;

  function carregarScript(src) {
    return new Promise(function (ok) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = ok; s.onerror = ok;   // se falhar, continua (o publicar bloqueia sem filtro)
      document.body.appendChild(s);
    });
  }
  function libs() {
    if (!libsP) {
      libsP = (async function () {
        if (!window.FiltroContactos) await carregarScript('filtro-contactos.js');
        if (!window.FiltroImagem) await carregarScript('imagem-filtro.js');
        if (!window.__bbRapida) await carregarScript('imagem-rapida.js');
        if (typeof window.BBPedeContacto !== 'function') await carregarScript('chat-traducao.js');
        // espera o imagem-rapida ligar-se ao imagem-filtro (faz isso sozinho até 10 s)
        for (var i = 0; i < 50 && !(window.FiltroImagem && window.FiltroImagem.verificar && window.__bbRapida); i++) {
          await new Promise(function (r) { setTimeout(r, 200); });
        }
      })();
    }
    return libsP;
  }
  libs();

  function aviso(t) {
    try { if (typeof msg === 'function') return msg(t); } catch (e) {}
    var m = document.getElementById('m'); if (m) m.textContent = t;
  }

  /* tira o ficheiro recusado das listas do fornecedor-novo.html e redesenha */
  function retirar(file) {
    try {
      if (typeof fotos !== 'undefined') for (var i = fotos.length - 1; i >= 0; i--) if (fotos[i].file === file) fotos.splice(i, 1);
      if (typeof cores !== 'undefined') for (var j = cores.length - 1; j >= 0; j--) if (cores[j].file === file) cores.splice(j, 1);
      if (typeof video !== 'undefined' && video === file) {
        video = null;
        var vn = document.getElementById('vn'); if (vn) vn.textContent = '';
      }
      if (typeof draw === 'function') draw();
    } catch (e) {}
  }

  /* fotos grandes (mais de 5 MB) ou noutro formato: verifica uma cópia reduzida.
     A foto ORIGINAL é a que é publicada, sem perder qualidade. */
  function copiaParaVerificar(file) {
    if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= 5 * 1024 * 1024) return Promise.resolve(file);
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight, m = Math.max(w, h) || 1, e = Math.min(1, 1800 / m);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * e)); c.height = Math.max(1, Math.round(h * e));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          ok(b ? new File([b], file.name.replace(/\.\w+$/, '') + '-verificar.jpg', { type: 'image/jpeg', lastModified: file.lastModified }) : null);
        }, 'image/jpeg', 0.92);
      };
      im.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      im.src = url;
    });
  }

  async function verificarImagem(file) {
    await libs();
    if (!window.FiltroImagem || !window.FiltroImagem.verificar) return { ok: false, motivo: 'Não foi possível verificar a imagem. Verifique a internet e tente outra vez.' };
    var copia = await copiaParaVerificar(file);
    if (!copia) return { ok: false, motivo: 'Formato de foto não suportado. Use JPG, PNG ou WEBP.' };
    return window.FiltroImagem.verificar(copia);
  }

  /* tira 5 imagens do vídeo e verifica cada uma */
  function framesDoVideo(file) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), v = document.createElement('video'), out = [], pos = [0.05, 0.25, 0.5, 0.75, 0.95], k = 0;
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      var fim = function () { URL.revokeObjectURL(url); ok(out); };
      var tempo = setTimeout(fim, 30000);
      v.onerror = function () { clearTimeout(tempo); fim(); };
      v.onloadedmetadata = function () {
        if (!v.duration || !isFinite(v.duration)) { clearTimeout(tempo); return fim(); }
        v.currentTime = v.duration * pos[0];
      };
      v.onseeked = function () {
        try {
          var c = document.createElement('canvas'), m = Math.max(v.videoWidth, v.videoHeight) || 1, e = Math.min(1, 1280 / m);
          c.width = Math.max(1, Math.round(v.videoWidth * e)); c.height = Math.max(1, Math.round(v.videoHeight * e));
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            if (b) out.push(new File([b], 'frame' + k + '.jpg', { type: 'image/jpeg', lastModified: Date.now() + k }));
            k++;
            if (k < pos.length) v.currentTime = v.duration * pos[k]; else { clearTimeout(tempo); fim(); }
          }, 'image/jpeg', 0.9);
        } catch (e) { clearTimeout(tempo); fim(); }
      };
    });
  }
  async function verificarVideo(file) {
    var fr = await framesDoVideo(file);
    if (!fr.length) return { ok: false, motivo: 'Não foi possível verificar o vídeo. Tente outro formato (MP4).' };
    for (var i = 0; i < fr.length; i++) {
      var r = await verificarImagem(fr[i]);
      if (!r.ok) return { ok: false, motivo: r.motivo.replace('Imagem recusada', 'Vídeo recusado') };
    }
    return { ok: true, motivo: '' };
  }

  function verificarFicheiro(file, tipo) {
    var p = (tipo === 'video' ? verificarVideo(file) : verificarImagem(file)).then(function (r) {
      if (!r.ok) {
        recusados.push(file);
        retirar(file);
        // o aviso de bloqueio da conta só aparece quando há contactos/links/QR (não por formato ou falta de internet)
        aviso((tipo === 'video' ? 'Vídeo' : 'Foto') + ' "' + file.name + '" não foi aceite: ' + r.motivo +
          (/recusad/i.test(r.motivo) ? AVISO_CONTA : ''));
      }
      return r;
    }).catch(function () {
      recusados.push(file); retirar(file);
      aviso('Não foi possível verificar "' + file.name + '". Escolha o ficheiro outra vez.');
    }).then(function () {
      pendentes = pendentes.filter(function (x) { return x !== p; });
    });
    pendentes.push(p);
  }

  /* apanha os ficheiros antes de o fornecedor-novo.html os guardar (fase de captura) */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'file' || !t.files || !t.files.length) return;
    var tipo = t.id === 'fv' ? 'video' : 'imagem';
    var lista = Array.prototype.slice.call(t.files);
    aviso('A verificar ' + (tipo === 'video' ? 'o vídeo' : (lista.length > 1 ? 'as fotos' : 'a foto')) + '…');
    lista.forEach(function (f) { verificarFicheiro(f, tipo); });
    // quando acabar a verificação, se tudo passou, limpa a mensagem
    Promise.all(pendentes.slice()).then(function () {
      var m = document.getElementById('m');
      if (m && /^A verificar/.test(m.textContent)) m.textContent = '';
    });
  }, true);
  // a imagem-rapida.js também mostra o motivo por cima; aqui a mensagem fica no próprio formulário

  /* textos do formulário: nome, descrição, cores e campos extra do registo */
  function textoProibido() {
    var form = document.getElementById('form') || document.body;
    var campos = form.querySelectorAll('input[type=text],input:not([type]),textarea');
    for (var i = 0; i < campos.length; i++) {
      var v = (campos[i].value || '').trim();
      if (!v) continue;
      if (window.FiltroContactos && !window.FiltroContactos.verificar(v).ok) return v;
      if (typeof window.BBPedeContacto === 'function' && window.BBPedeContacto(v)) return v;
    }
    return '';
  }

  var liberado = false;
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#sv') : null;
    if (!b || liberado) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (b.disabled) return;
    (async function () {
      await libs();
      if (pendentes.length) {
        aviso('A verificar as fotos e o vídeo… o produto é publicado logo a seguir.');
        await Promise.all(pendentes.slice());
      }
      // ficheiros recusados que ainda estejam na lista (segurança)
      recusados.forEach(retirar);
      var t = textoProibido();
      if (t) {
        aviso('Não pode publicar: o texto "' + t.slice(0, 60) + '" tem contactos, links, email ou redes sociais.' + AVISO_CONTA);
        return;
      }
      if (!window.FiltroImagem || !window.FiltroContactos) {
        aviso('Não foi possível carregar a verificação. Verifique a internet e tente outra vez.');
        return;
      }
      liberado = true;
      try { b.click(); } finally { liberado = false; }
    })();
  }, true);
})();
