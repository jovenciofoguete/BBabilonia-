/* imagem-analise.js — B-Babilônia
   Parte 2 da pesquisa por imagem: encontra os objetos na foto e compara a forma.
   01/11/2026: separa cada produto da foto (por cor), mesmo encostados uns aos outros,
   para aparecerem um a um na fila de cima, como nas outras plataformas.
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
  /* ---------- separar cada produto da foto (por cor), mesmo quando estão encostados ---------- */
  function lab(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    var x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    var f = function (t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; };
    x = f(x); y = f(y); z = f(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function dist(P, i, c) { var a = P[i] - c[0], b = P[i + 1] - c[1], d = P[i + 2] - c[2]; return 0.25 * a * a + b * b + d * d; }   // a luz/sombra conta pouco
  function kmeans(P, idx, k, voltas) {
    var cs = [], n = idx.length, sem = 7, i, j;
    if (!n) return cs;
    function rnd() { sem = (sem * 16807) % 2147483647; return sem / 2147483647; }
    var p0 = idx[Math.floor(n / 2)] * 3; cs.push([P[p0], P[p0 + 1], P[p0 + 2]]);
    var dmin = new Float32Array(n).fill(1e9);
    while (cs.length < k) {                 // k-means++ (sempre igual para a mesma foto)
      var tot = 0, c = cs[cs.length - 1];
      for (i = 0; i < n; i++) { var dd = dist(P, idx[i] * 3, c); if (dd < dmin[i]) dmin[i] = dd; tot += dmin[i]; }
      if (tot <= 0) break;
      var alvo = rnd() * tot; for (i = 0; i < n - 1 && (alvo -= dmin[i]) > 0; i++);
      var q = idx[i] * 3; cs.push([P[q], P[q + 1], P[q + 2]]);
    }
    for (var v = 0; v < voltas; v++) {
      var s = cs.map(function () { return [0, 0, 0, 0]; });
      for (i = 0; i < n; i++) {
        var o = idx[i] * 3, m = 0, best = 1e18;
        for (j = 0; j < cs.length; j++) { var e = dist(P, o, cs[j]); if (e < best) { best = e; m = j; } }
        s[m][0] += P[o]; s[m][1] += P[o + 1]; s[m][2] += P[o + 2]; s[m][3]++;
      }
      cs = cs.map(function (c, j) { return s[j][3] ? [s[j][0] / s[j][3], s[j][1] / s[j][3], s[j][2] / s[j][3], s[j][3]] : c; });
    }
    return cs;
  }
  function porCor(base) {
    var W = base.width, H = base.height, gw = W >= H ? 160 : Math.max(1, Math.round(160 * W / H)), gh = W >= H ? Math.max(1, Math.round(160 * H / W)) : 160;
    var g = document.createElement("canvas"); g.width = gw; g.height = gh;
    var gx = g.getContext("2d", { willReadFrequently: true }); gx.drawImage(base, 0, 0, gw, gh);
    var px = gx.getImageData(0, 0, gw, gh).data, N = gw * gh, P = new Float32Array(N * 3), i, j, x, y;
    for (i = 0; i < N; i++) { var L = lab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); P[i * 3] = L[0]; P[i * 3 + 1] = L[1]; P[i * 3 + 2] = L[2]; }

    /* 1) fundo: cores das bordas que aparecem em pelo menos 2 lados da foto */
    var borda = [], lado = [];
    for (x = 0; x < gw; x++) { borda.push(x); lado.push(0); borda.push((gh - 1) * gw + x); lado.push(1); }
    for (y = 1; y < gh - 1; y++) { borda.push(y * gw); lado.push(2); borda.push(y * gw + gw - 1); lado.push(3); }
    var cb = kmeans(P, borda, 8, 6), conta = cb.map(function () { return [0, 0, 0, 0, 0]; });
    borda.forEach(function (p, t) {
      var m = 0, best = 1e18;
      for (j = 0; j < cb.length; j++) { var e = dist(P, p * 3, cb[j]); if (e < best) { best = e; m = j; } }
      conta[m][lado[t]]++; conta[m][4]++;
    });
    var fundo = cb.filter(function (c, j) {
      var lados = conta[j].slice(0, 4).filter(function (n) { return n > 2; }).length;
      // fundo = cor que está em cima da foto (parede, céu) ou em 3 lados; um produto encostado a um canto não conta
      return conta[j][4] >= borda.length * 0.06 && (lados >= 3 || conta[j][0] >= gw * 0.15);
    });
    if (!fundo.length) { var mx = 0; conta.forEach(function (c, j) { if (c[4] > conta[mx][4]) mx = j; }); fundo = [cb[mx]]; }
    function dFundo(p) { var b = 1e18; for (var t = 0; t < fundo.length; t++) b = Math.min(b, dist(P, p * 3, fundo[t])); return Math.sqrt(b); }
    var aresta = new Uint8Array(N);          // contornos (mudança forte de luz), para um produto branco não se perder na parede branca
    for (y = 1; y < gh - 1; y++) for (x = 1; x < gw - 1; x++) {
      i = y * gw + x;
      var gxL = Math.abs(P[(i + 1) * 3] - P[(i - 1) * 3]), gyL = Math.abs(P[(i + gw) * 3] - P[(i - gw) * 3]);
      if (gxL + gyL > 9) aresta[i] = 1;
    }
    var bg = new Uint8Array(N), fila = new Int32Array(N), ini = 0, fim = 0;
    borda.forEach(function (p) { if (!bg[p] && dFundo(p) < 16) { bg[p] = 1; fila[fim++] = p; } });
    while (ini < fim) {
      var k = fila[ini++], kx = k % gw, viz = [kx > 0 ? k - 1 : -1, kx < gw - 1 ? k + 1 : -1, k - gw, k + gw];
      for (var t = 0; t < 4; t++) {
        var q = viz[t]; if (q < 0 || q >= N || bg[q]) continue;
        if (aresta[q]) continue;                 // não atravessa a linha do contorno de um produto
        var dq = dFundo(q);
        if (dq < 15 || (dq < 20 && Math.sqrt(dist(P, q * 3, [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]])) < 2)) { bg[q] = 1; fila[fim++] = q; }
      }
    }
    var fg = [];
    for (i = 0; i < N; i++) if (!bg[i]) fg.push(i);
    if (fg.length < N * 0.03) return [];

    /* 2) cada cor do que não é fundo */
    var amostra = fg.length > 6000 ? fg.filter(function (p, t) { return t % Math.ceil(fg.length / 6000) === 0; }) : fg;
    var cc = kmeans(P, amostra, 7, 8).filter(function (c) { return c[3] === undefined || c[3] > 0; });
    var lab1 = new Int16Array(N).fill(-1);
    fg.forEach(function (p) {
      var m = 0, best = 1e18;
      for (j = 0; j < cc.length; j++) { var e = dist(P, p * 3, cc[j]); if (e < best) { best = e; m = j; } }
      lab1[p] = m;
    });
    for (var it = 0; it < 2; it++) {          // alisar: cada ponto fica com a cor da maioria à volta
      var l2 = lab1.slice();
      for (y = 1; y < gh - 1; y++) for (x = 1; x < gw - 1; x++) {
        i = y * gw + x; if (lab1[i] < 0) continue;
        var cnt = {}, bm = lab1[i], bc = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var w = lab1[i + dy * gw + dx]; if (w < 0) continue;
          cnt[w] = (cnt[w] || 0) + 1; if (cnt[w] > bc) { bc = cnt[w]; bm = w; }
        }
        if (bc >= 5) l2[i] = bm;
      }
      lab1 = l2;
    }

    /* 3) pedaços ligados da mesma cor */
    var comp = new Int32Array(N).fill(-1), C = [];
    for (i = 0; i < N; i++) {
      if (lab1[i] < 0 || comp[i] >= 0) continue;
      var c = { id: C.length, sL: 0, sa: 0, sb: 0, area: 0, x0: gw, y0: gh, x1: 0, y1: 0, viz: {}, per: 0, vivo: true, pai: -1 };
      ini = 0; fim = 0; fila[fim++] = i; comp[i] = c.id;
      while (ini < fim) {
        var k2 = fila[ini++], ax = k2 % gw, ay = (k2 - ax) / gw;
        c.area++; c.sL += P[k2 * 3]; c.sa += P[k2 * 3 + 1]; c.sb += P[k2 * 3 + 2]; if (ax < c.x0) c.x0 = ax; if (ax > c.x1) c.x1 = ax; if (ay < c.y0) c.y0 = ay; if (ay > c.y1) c.y1 = ay;
        var vz = [ax > 0 ? k2 - 1 : -1, ax < gw - 1 ? k2 + 1 : -1, k2 - gw, k2 + gw];
        for (var t2 = 0; t2 < 4; t2++) {
          var q2 = vz[t2]; if (q2 < 0 || q2 >= N) continue;
          if (lab1[q2] === lab1[i]) { if (comp[q2] < 0) { comp[q2] = c.id; fila[fim++] = q2; } }
        }
      }
      C.push(c);
    }
    for (i = 0; i < N; i++) {                 // fronteiras entre pedaços
      if (comp[i] < 0) continue;
      var ix = i % gw, nb = [ix < gw - 1 ? i + 1 : -1, i + gw < N ? i + gw : -1];
      for (var t3 = 0; t3 < 2; t3++) {
        var q3 = nb[t3]; if (q3 < 0) continue;
        if (comp[q3] >= 0 && comp[q3] !== comp[i]) { var a1 = C[comp[i]], b1 = C[comp[q3]]; a1.viz[b1.id] = (a1.viz[b1.id] || 0) + 1; b1.viz[a1.id] = (b1.viz[a1.id] || 0) + 1; }
        if (comp[q3] !== comp[i]) { C[comp[i]].per++; if (comp[q3] >= 0) C[comp[q3]].per++; }
      }
    }
    function juntar(a, b) {                   // a passa a fazer parte de b
      a.vivo = false; a.pai = b.id; b.area += a.area; b.sL += a.sL; b.sa += a.sa; b.sb += a.sb;
      b.x0 = Math.min(b.x0, a.x0); b.y0 = Math.min(b.y0, a.y0); b.x1 = Math.max(b.x1, a.x1); b.y1 = Math.max(b.y1, a.y1);
      for (var o in a.viz) { o = +o; if (o === b.id) continue; var oc = C[o]; b.viz[o] = (b.viz[o] || 0) + a.viz[o]; oc.viz[b.id] = (oc.viz[b.id] || 0) + a.viz[o]; delete oc.viz[a.id]; }
      b.per = b.per + a.per - 2 * (b.viz[a.id] || 0); delete b.viz[a.id];
    }
    var minA = N * 0.004, mudou = true, voltas = 0;
    while (mudou && voltas++ < 400) {
      mudou = false;
      var vivos = C.filter(function (c) { return c.vivo; }).sort(function (a, b) { return a.area - b.area; });
      for (var v = 0; v < vivos.length; v++) {
        var a = vivos[v], melhor = null, mb = 0;
        for (var o in a.viz) { if (a.viz[o] > mb && C[o].vivo) { mb = a.viz[o]; melhor = C[o]; } }
        if (a.area < minA) { if (melhor) juntar(a, melhor); else a.vivo = false; mudou = true; break; }
        // pedaço pequeno colado a um grande (cabeça, braço, flor do vestido) faz parte do grande
        if (melhor && a.area < melhor.area * 0.35 && mb >= Math.max(3, a.per * 0.2)) { juntar(a, melhor); mudou = true; break; }
        // a mesma cor com luz/sombra diferente (o mesmo vestido partido em dois) volta a ser um só
        for (var o2 in a.viz) {
          var b2 = C[o2]; if (!b2.vivo || a.viz[o2] < Math.max(4, Math.min(a.per, b2.per) * 0.08)) continue;
          var dL = a.sL / a.area - b2.sL / b2.area, da = a.sa / a.area - b2.sa / b2.area, db = a.sb / a.area - b2.sb / b2.area;
          var dc = Math.sqrt(0.1 * dL * dL + da * da + db * db);
          if (dc < 14 || (dc < 24 && a.viz[o2] >= Math.min(a.per, b2.per) * 0.2)) { juntar(a, b2); mudou = true; break; }
        }
        if (mudou) break;
      }
    }
    // caixa de cada produto sem as tiras finas coladas (pescoço do manequim, cabide, sombra)
    function raiz(i) { var c = C[i]; while (c.pai >= 0) c = C[c.pai]; return c; }
    var colN = {}, linN = {};
    for (i = 0; i < N; i++) {
      if (comp[i] < 0) continue;
      var rc = raiz(comp[i]); if (!rc.vivo) continue;
      var cx = i % gw, cy = (i - cx) / gw;
      (colN[rc.id] = colN[rc.id] || new Int32Array(gw))[cx]++;
      (linN[rc.id] = linN[rc.id] || new Int32Array(gh))[cy]++;
    }
    function aparar(h, lo, hi) {
      var m = 0, t; for (t = lo; t <= hi; t++) m = Math.max(m, h[t]);
      var lim = Math.max(1, m * 0.15);
      while (lo < hi && h[lo] < lim) lo++; while (hi > lo && h[hi] < lim) hi--;
      return [lo, hi];
    }
    C.forEach(function (c) {
      if (!c.vivo || !colN[c.id]) return;
      var ax2 = aparar(colN[c.id], c.x0, c.x1), ay2 = aparar(linN[c.id], c.y0, c.y1);
      c.x0 = ax2[0]; c.x1 = ax2[1]; c.y0 = ay2[0]; c.y1 = ay2[1];
    });
    var objs = [];
    C.forEach(function (c) {
      if (!c.vivo) return;
      var bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
      if (c.area < N * 0.012 || bw < 6 || bh < 6) return;
      if (c.area < bw * bh * 0.18) return;                          // espalhado: não é um objeto
      var lados = (c.x0 === 0) + (c.y0 === 0) + (c.x1 === gw - 1) + (c.y1 === gh - 1);
      if (lados >= 3 || bw * bh > N * 0.85) return;               // é o fundo
      var pad = Math.round(Math.max(bw, bh) * 0.05);
      var X0 = Math.max(0, c.x0 - pad), Y0 = Math.max(0, c.y0 - pad), X1 = Math.min(gw - 1, c.x1 + pad), Y1 = Math.min(gh - 1, c.y1 + pad);
      objs.push({ x: Math.round(X0 / gw * W), y: Math.round(Y0 / gh * H), w: Math.round((X1 - X0 + 1) / gw * W), h: Math.round((Y1 - Y0 + 1) / gh * H), objeto: true, cor: true, area: c.area / N, m: [c.sL / c.area, c.sa / c.area, c.sb / c.area] });
    });
    // um pedaço dentro de outro com a mesma cor é parte dele (prega, dobra): fica só o maior
    objs.sort(function (a, b) { return b.area - a.area; });
    var fica = [];
    objs.forEach(function (o) {
      var dentroDe = fica.some(function (g) {
        var ix = Math.max(0, Math.min(o.x + o.w, g.x + g.w) - Math.max(o.x, g.x)), iy = Math.max(0, Math.min(o.y + o.h, g.y + g.h) - Math.max(o.y, g.y));
        if (ix * iy < o.w * o.h * 0.7) return false;
        var dL = o.m[0] - g.m[0], da = o.m[1] - g.m[1], db = o.m[2] - g.m[2];
        return Math.sqrt(0.1 * dL * dL + da * da + db * db) < 20;
      });
      if (!dentroDe) fica.push(o);
    });
    return fica;
  }
  function iou(a, b) {
    var ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    var i = ix * iy; return i / (a.w * a.h + b.w * b.h - i);
  }
  function zonas(base) {
    var W = base.width, H = base.height, A = W * H, toda = { x: 0, y: 0, w: W, h: H, inteira: true };
    var cor = []; try { cor = porCor(base); } catch (e) { cor = []; }
    var obj = caixasDe(base, toda, 2);
    obj.slice().forEach(function (c) {
      if (c.w * c.h < A * 0.1) return;
      caixasDe(base, c, 0).forEach(function (d) { if (d.w * d.h < c.w * c.h * 0.8) obj.push(d); });
    });
    // primeiro os produtos separados por cor; depois as caixas antigas que não repetem nenhum
    var lista = cor.slice().sort(function (a, b) { return b.area - a.area; }).slice(0, 12);
    obj.sort(function (a, b) { return b.w * b.h - a.w * a.h; });
    obj.forEach(function (c) { if (lista.length < 16 && !lista.some(function (d) { return iou(c, d) > 0.45; })) lista.push(c); });
    return [toda].concat(lista);
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
      
