/* imagem-filtro.js - BBabilonia
   Recusa imagens com codigo QR, contactos, links, redes sociais ou marca de agua legivel.
   Precisa do filtro-contactos.js carregado antes. */
(function () {
  'use strict';

  var JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  var TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var MAXLADO = 1800;
  var worker = null;

  var EXTRA = /\b(wx|vx|ig|fb|tel|phone|contact|contato|contacto|whats|follow us|siga-nos|add us)\s*[:=]\s*\S{3,}/;
  var CTX_MEDIDA = /tamanh|medida|size|bust|waist|hip|chest|shoulder|length|cintura|peito|ombro|altura|comprimento|cm\b|inch/;

  function carregar(src, pronto) {
    return new Promise(function (ok, erro) {
      if (pronto()) return ok();
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { if (pronto()) ok(); else erro(new Error('lib')); };
      s.onerror = function () { erro(new Error('lib')); };
      document.head.appendChild(s);
    });
  }

  function abrir(file) {
    return new Promise(function (ok, erro) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, m = Math.max(w, h);
        var alvo = m > MAXLADO ? MAXLADO : (m < 1000 ? 1500 : m);
        var e = alvo / m;
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * e));
        c.height = Math.max(1, Math.round(h * e));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); erro(new Error('img')); };
      img.src = url;
    });
  }

  function realcar(c) {
    var o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    var x = o.getContext('2d');
    x.drawImage(c, 0, 0);
    var im = x.getImageData(0, 0, o.width, o.height), d = im.data, min = 255, max = 0, i, g;
    for (i = 0; i < d.length; i += 4) {
      g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    var f = max > min ? 255 / (max - min) : 1;
    for (i = 0; i < d.length; i += 4) {
      g = (d[i] - min) * f;
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    x.putImageData(im, 0, 0);
    return o;
  }

  async function temQR(c) {
    if (window.BarcodeDetector) {
      try {
        var det = new window.BarcodeDetector({ formats: ['qr_code'] });
        var r = await det.detect(c);
        if (r && r.length) return true;
      } catch (e) {}
    }
    await carregar(JSQR, function () { return typeof window.jsQR === 'function'; });
    var W = c.width, H = c.height, ctx = c.getContext('2d');
    var areas = [[0, 0, W, H], [0, 0, W >> 1, H >> 1], [W >> 1, 0, W - (W >> 1), H >> 1],
      [0, H >> 1, W >> 1, H - (H >> 1)], [W >> 1, H >> 1, W - (W >> 1), H - (H >> 1)]];
    for (var i = 0; i < areas.length; i++) {
      var a = areas[i], im = ctx.getImageData(a[0], a[1], a[2], a[3]);
      if (window.jsQR(im.data, im.width, im.height, { inversionAttempts: 'attemptBoth' })) return true;
    }
    var p = document.createElement('canvas');
    p.width = Math.max(1, W >> 1); p.height = Math.max(1, H >> 1);
    p.getContext('2d').drawImage(c, 0, 0, p.width, p.height);
    var im2 = p.getContext('2d').getImageData(0, 0, p.width, p.height);
    return !!window.jsQR(im2.data, im2.width, im2.height, { inversionAttempts: 'attemptBoth' });
  }

  async function lerTexto(c) {
    await carregar(TESS, function () { return typeof window.Tesseract !== 'undefined'; });
    if (!worker) worker = await window.Tesseract.createWorker('eng');
    var r = await worker.recognize(c);
    return (r && r.data && r.data.text) || '';
  }

  function textoSuspeito(texto) {
    texto = String(texto || '');
    var prefixo = CTX_MEDIDA.test(texto.toLowerCase()) ? 'tamanho ' : '';
    var linhas = texto.split(/\r?\n/);
    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i].trim();
      if (l.length < 3) continue;
      if (window.FiltroContactos) {
        var r = window.FiltroContactos.verificar(prefixo + l);
        if (!r.ok) return r.motivo;
      }
      if (EXTRA.test(l.toLowerCase())) return 'Não pode enviar contactos ou redes sociais.';
    }
    return '';
  }

  async function verificar(file, progresso) {
    progresso = progresso || function () {};
    try {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, motivo: 'Só são aceites imagens JPG, PNG ou WEBP.' };
      if (file.size > 5 * 1024 * 1024) return { ok: false, motivo: 'A imagem é maior que 5 MB.' };
      progresso('A abrir a imagem...');
      var c = await abrir(file);
      progresso('A procurar códigos QR...');
      if (await temQR(c)) return { ok: false, motivo: 'Imagem recusada: contém código QR.' };
      progresso('A ler o texto da imagem (pode demorar)...');
      var m = textoSuspeito(await lerTexto(realcar(c)));
      if (!m) { progresso('A confirmar a leitura...'); m = textoSuspeito(await lerTexto(c)); }
      if (m) return { ok: false, motivo: 'Imagem recusada: contém contactos, links, redes sociais ou marca de água. (' + m + ')' };
      return { ok: true, motivo: '' };
    } catch (e) {
      return { ok: false, motivo: 'Não foi possível verificar a imagem. Verifique a internet e tente outra vez.' };
    }
  }

  var api = { verificar: verificar, textoSuspeito: textoSuspeito };
  if (typeof window !== 'undefined') window.FiltroImagem = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
