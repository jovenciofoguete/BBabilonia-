/* imagem-analise.js — B-Babilônia
   Parte 2 da pesquisa por imagem: encontra os objetos na foto e compara a forma.
   É carregado sozinho pelo imagem-na-loja.js. Ficheiro novo. */
(function () {
  var F = null, indice = [];
  function caixasDe(base, R, juntar) {
    var gw = 120, gh = Math.max(1, Math.round(120 * R.h / R.w));
    var g = document.createElement("canvas"); g.width = gw; g.height = gh;
    var gx = g.getContext("2d", { willReadFrequently: true }); gx.drawImage(base, R.x, R.y, R.w, R.h, 0, 0, gw, gh);
    var px = gx.getImageData(0, 0, gw, gh).data, cz = new Float32Array(gw * gh), i, x, y;
    for (i = 0; i < gw * gh; i++) cz[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    var borda = new Uint8Array(gw * gh);
    for (y = 1; y < gh - 1; y++) for (x = 1; x < gw - 1; x++) {
      i = y * gw + x;
      if (Math.abs(cz[i + 1] - cz[i - 1]) + Math.abs(cz[i + gw] - cz[i - gw]) > 28) borda[i] = 1;
    }
    for (var r = 0; r < juntar; r++) {
      var n = new Uint8Array(gw * gh);
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        var v = 0;
        for (var dy = -1; dy <= 1 && !v; dy++) for (var dx = -1; dx <= 1; dx++) {
          var xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < gw && yy < gh && borda[yy * gw + xx]) { v = 1; break; }
        }
        n[y * gw + x] = v;
      }
      borda = n;
    }
    var visto = new Uint8Array(gw * gh), caixas = [], fila = new Int32Array(gw * gh);
    for (i = 0; i < gw * gh; i++) {
      if (!borda[i] || visto[i]) continue;
      var ini = 0, fim = 0, x0 = gw, y0 = gh, x1 = 0, y1 = 0; fila[fim++] = i; visto[i] = 1;
      while (ini < fim) {
        var k = fila[ini++], kx = k % gw, ky = (k - kx) / gw;
        if (kx < x0) x0 = kx; if (kx > x1) x1 = kx; if (ky < y0) y0 = ky; if (ky > y1) y1 = ky;
        var viz = [k - 1, k + 1, k - gw, k + gw];
        for (var t = 0; t < 4; t++) {
          var j = viz[t];
          if (j < 0 || j >= gw * gh || visto[j] || !borda[j]) continue;
          if ((j === k - 1 && kx === 0) || (j === k + 1 && kx === gw - 1)) continue;
          visto[j] = 1; fila[fim++] = j;
        }
      }
      var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (bw < 8 || bh < 8 || bw * bh < gw * gh * 0.02) continue;
      if (bw * bh > gw * gh * 0.85) continue;
      var pad = Math.round(Math.max(bw, bh) * 0.06);
      var X0 = Math.max(0, x0 - pad), Y0 = Math.max(0, y0 - pad), X1 = Math.min(gw - 1, x1 + pad), Y1 = Math.min(gh - 1, y1 + pad);
      caixas.push({ x: R.x + Math.round(X0 / gw * R.w), y: R.y + Math.round(Y0 / gh * R.h), w: Math.round((X1 - X0 + 1) / gw * R.w), h: Math.round((Y1 - Y0 + 1) / gh * R.h), objeto: true });
    }
    return caixas;
  }
  function zonas(base) {
    var W = base.width, H = base.height, A = W * H, toda = { x: 0, y: 0, w: W, h: H, inteira: true };
    var obj = caixasDe(base, toda, 2);
    obj.slice().forEach(function (c) {
      if (c.w * c.h < A * 0.1) return;
      caixasDe(base, c, 0).forEach(function (d) { if (d.w * d.h < c.w * c.h * 0.8) obj.push(d); });
    });
    obj.sort(function (a, b) { return b.w * b.h - a.w * a.h; }); obj = obj.slice(0, 16);
    var R = (obj[0] && obj[0].w * obj[0].h >= A * 0.1) ? obj[0] : toda;
    var g = document.createElement("canvas"), gw = 48, gh = Math.max(1, Math.round(48 * H / W));
    g.width = gw; g.height = gh; var gx = g.getContext("2d", { willReadFrequently: true }); gx.drawImage(base, 0, 0, gw, gh);
    var px = gx.getImageData(0, 0, gw, gh).data;
    function variedade(z) {
      var x0 = Math.floor(z.x / W * gw), y0 = Math.floor(z.y / H * gh), x1 = Math.ceil((z.x + z.w) / W * gw), y1 = Math.ceil((z.y + z.h) / H * gh);
      var s = 0, s2 = 0, n = 0;
      for (var y = y0; y < y1 && y < gh; y++) for (var x = x0; x < x1 && x < gw; x++) {
        var k = (y * gw + x) * 4, v = 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]; s += v; s2 += v * v; n++;
      }
      return n ? Math.sqrt(Math.max(0, s2 / n - (s / n) * (s / n))) : 0;
    }
    var grelha = [], m = Math.min(R.w, R.h);
    [0.9, 0.7, 0.5].forEach(function (f) {
      var t = Math.max(1, Math.round(m * f)), passo = Math.max(1, Math.round(t / 2)), xs = [], ys = [], x, y;
      for (x = R.x; x + t <= R.x + R.w; x += passo) xs.push(x); if (xs.length && xs[xs.length - 1] + t < R.x + R.w) xs.push(R.x + R.w - t);
      for (y = R.y; y + t <= R.y + R.h; y += passo) ys.push(y); if (ys.length && ys[ys.length - 1] + t < R.y + R.h) ys.push(R.y + R.h - t);
      ys.forEach(function (yy) { xs.forEach(function (xx) { var z = { x: xx, y: yy, w: t, h: t, grelha: true }; z.v = variedade(z); if (z.v >= 20) grelha.push(z); }); });
    });
    grelha.sort(function (a, b) { return b.v - a.v; });
    return [toda].concat(obj, grelha.slice(0, 12));
  }
  function recorte(base, z, lado) {
    var c = document.createElement("canvas"), e = lado ? lado / Math.max(z.w, z.h) : 1;
    c.width = Math.max(1, Math.round(z.w * e)); c.height = Math.max(1, Math.round(z.h * e));
    c.getContext("2d").drawImage(base, z.x, z.y, z.w, z.h, 0, 0, c.width, c.height);
    return c;
  }
  async function vetores(base, lista) {
    var m = await F.carregarModelo(), L = F.LADO, out = [];
    try {
      for (var i = 0; i < lista.length; i += 8) {
        var parte = lista.slice(i, i + 8), cvs = [];
        parte.forEach(function (z) {
          var cv = F.prepararForma(recorte(base, z, 320));
          var esp = document.createElement("canvas"); esp.width = esp.height = L;
          var e = esp.getContext("2d"); e.translate(L, 0); e.scale(-1, 1); e.drawImage(cv, 0, 0);
          cvs.push(cv, esp);
        });
        var lote = tf.tidy(function () { return tf.stack(cvs.map(function (c) { return tf.browser.fromPixels(c); })); });
        var r = m.infer(lote, true); lote.dispose();
        var d = await r.data(), n = d.length / cvs.length; r.dispose();
        for (var k = 0; k < parte.length; k++) {
          var v = new Float32Array(n), s = 0, j;
          for (j = 0; j < n; j++) { v[j] = (d[(2 * k) * n + j] + d[(2 * k + 1) * n + j]) / 2; s += v[j] * v[j]; }
          s = Math.sqrt(s) || 1; for (j = 0; j < n; j++) v[j] /= s;
          out.push(v);
        }
      }
    } catch (e) {
      out.length = 0;
      for (var q = 0; q < lista.length; q++) out.push(await F.vetor(recorte(base, lista[q], 320)));
    }
    return out;
  }
  function comparar(q) {
    var melhor = new Map();
    indice.forEach(function (it) {
      var s = 0, v = it.v;
      for (var i = 0; i < v.length; i++) s += q[i] * v[i];
      var ant = melhor.get(it.p.id);
      if (!ant || s > ant.nota) melhor.set(it.p.id, { p: it.p, foto: it.foto, nota: s });
    });
    var ord = Array.from(melhor.values()).sort(function (a, b) { return b.nota - a.nota; });
    var topo = ord.length ? ord[0].nota : 0;
    return { topo: topo, res: ord.filter(function (x) { return x.nota >= 0.6 && x.nota >= topo - 0.12; }).slice(0, 40) };
  }
  function sobrepoe(a, b) {
    var ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return ix * iy / Math.min(a.w * a.h, b.w * b.h) > 0.5;
  }
  function dentro(p, g) {
    var ix = Math.max(0, Math.min(p.x + p.w, g.x + g.w) - Math.max(p.x, g.x)), iy = Math.max(0, Math.min(p.y + p.h, g.y + g.h) - Math.max(p.y, g.y));
    return p !== g && p.w * p.h < g.w * g.h && ix * iy > p.w * p.h * 0.8;
  }

  window.BBImgAnalise = { usar: function (f, ind) { F = f; indice = ind; }, zonas: zonas, recorte: recorte, vetores: vetores, comparar: comparar, sobrepoe: sobrepoe, dentro: dentro };
})();
      
