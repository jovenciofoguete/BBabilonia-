/* cor-automatica.js — BBabilônia
   Registo de produto: o "Nome da cor" é preenchido sozinho a partir da foto da cor.
   Regra: 1 cor -> o nome dela (ex.: "Preto")
          2 cores -> as duas (ex.: "Preto Branco", "Verde Azul"; também listras)
          3 ou mais -> "Multicolor"
   - Ignora o fundo da foto (cor das margens) e dá mais peso ao centro.
   - Só preenche nomes vazios: o que o fornecedor escrever nunca é alterado.
   - O fornecedor pode sempre corrigir o nome.
   Não altera o fornecedor-novo.html: só se liga às listas que já existem. */
(function () {
  if (window.__bbCorAuto) return; window.__bbCorAuto = 1;

  var N = 128; // a foto é reduzida a 128x128 só para ler as cores (a foto original não muda)

  function nomePixel(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var v = mx / 255, c = (mx - mn) / 255, h = 0;
    if (mx !== mn) {
      var d = mx - mn;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    if (v < 0.17) return 'Preto';
    if (c < 0.10) return v > 0.85 ? 'Branco' : (v < 0.27 ? 'Preto' : 'Cinzento');
    if (c < 0.20 && v > 0.65 && h >= 15 && h < 65) return v > 0.93 && c < 0.13 ? 'Branco' : 'Bege';
    if (c < 0.16) return v > 0.85 ? 'Branco' : (v < 0.3 ? 'Preto' : 'Cinzento');
    if (h < 12 || h >= 345) {
      if (v > 0.8 && mn > 150) return 'Rosa';
      return v < 0.5 ? 'Vinho' : 'Vermelho';
    }
    if (h < 40) {
      if (v < 0.62) return 'Castanho';
      if (c < 0.35 && v > 0.7) return 'Bege';
      return 'Laranja';
    }
    if (h < 68) {
      if (c < 0.3 && v > 0.7) return 'Bege';
      if (v < 0.5) return h > 55 ? 'Verde' : 'Castanho';
      return 'Amarelo';
    }
    if (h < 165) return 'Verde';
    if (h < 250) return v < 0.42 ? 'Azul-marinho' : 'Azul';
    if (h < 290) return 'Roxo';
    return v < 0.45 ? 'Roxo' : 'Rosa';
  }

  var FAMILIA = { 'Azul-marinho': 'Azul', 'Vinho': 'Vermelho' };

  function dist(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /* px: RGBA (Uint8ClampedArray) de N x N */
  function nomearPixels(px) {
    var i, x, y, borda = [];
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) { i = (y * N + x) * 4; if (px[i + 3] > 20) borda.push([px[i], px[i + 1], px[i + 2]]); }
    }
    // cor do fundo = mediana das margens
    var fundo = null, tol = 26;
    if (borda.length) {
      var med = [0, 1, 2].map(function (k) { var a = borda.map(function (p) { return p[k]; }).sort(function (p, q) { return p - q; }); return a[a.length >> 1]; });
      var ds = borda.map(function (p) { return dist(p, med); }).sort(function (p, q) { return p - q; });
      var perto = ds.filter(function (d) { return d < 40; }).length;
      if (perto / borda.length >= 0.6) {
        fundo = med;
        // tolerância conforme o "ruído" do fundo: fundo liso = tolerância pequena
        // (assim uma parte branca do produto num fundo cinzento claro não é tirada)
        tol = Math.max(12, Math.min(40, ds[Math.floor(ds.length * 0.8)] * 1.6 + 8));
      }
    }
    // tira o fundo ligado às margens (preenchimento a partir das bordas)
    var tirado = new Uint8Array(N * N), transp = 0;
    for (i = 0; i < N * N; i++) if (px[i * 4 + 3] <= 20) { tirado[i] = 1; transp++; }
    if (fundo) {
      var pilha = [];
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (x === 0 || y === 0 || x === N - 1 || y === N - 1) pilha.push(y * N + x);
      while (pilha.length) {
        var p = pilha.pop(); if (tirado[p] === 2) continue;
        var j = p * 4;
        if (tirado[p] !== 1 && dist([px[j], px[j + 1], px[j + 2]], fundo) >= tol) continue;
        tirado[p] = 2;
        var px0 = p % N, py0 = (p / N) | 0;
        if (px0 > 0) pilha.push(p - 1); if (px0 < N - 1) pilha.push(p + 1);
        if (py0 > 0) pilha.push(p - N); if (py0 < N - 1) pilha.push(p + N);
      }
    }
    var conta = {}, total = 0, resto = 0, cx = (N - 1) / 2, rmax = Math.sqrt(2) * cx;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      i = y * N + x; if (tirado[i]) continue;
      resto++;
      var k = i * 4, nm = nomePixel(px[k], px[k + 1], px[k + 2]);
      var dd = Math.sqrt((x - cx) * (x - cx) + (y - cx) * (y - cx)) / rmax;
      var w = 1 - 0.6 * dd * dd;
      conta[nm] = (conta[nm] || 0) + w; total += w;
    }
    // quase tudo era "fundo": o produto tem a mesma cor do fundo
    if (fundo && resto < (N * N - transp) * 0.08) return nomePixel(fundo[0], fundo[1], fundo[2]);
    if (!total) return '';
    // junta tons da mesma família (Azul + Azul-marinho, Vermelho + Vinho)
    var fam = {};
    Object.keys(conta).forEach(function (nm) {
      var f = FAMILIA[nm] || nm;
      if (!fam[f]) fam[f] = { s: 0, melhor: nm, mv: 0 };
      fam[f].s += conta[nm];
      if (conta[nm] > fam[f].mv) { fam[f].mv = conta[nm]; fam[f].melhor = nm; }
    });
    var lista = Object.keys(fam).map(function (f) { return { nome: fam[f].melhor, s: fam[f].s / total }; })
      .sort(function (a, b) { return b.s - a.s; });
    var fortes = lista.filter(function (a) { return a.s >= 0.15; });
    var menores = lista.filter(function (a) { return a.s >= 0.07; });
    if (fortes.length >= 3 || (menores.length >= 4 && lista[0].s < 0.55)) return 'Multicolor';
    if (fortes.length === 2) return fortes[0].nome + ' ' + fortes[1].nome;
    return lista[0].nome;
  }

  function nomearImagem(img) {
    var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    var g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = false; // lê pixels reais (listras finas não se misturam em cinzento)
    g.drawImage(img, 0, 0, N, N);
    return nomearPixels(g.getImageData(0, 0, N, N).data);
  }

  function nomearURL(url) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { try { ok(nomearImagem(im)); } catch (e) { ok(''); } };
      im.onerror = function () { ok(''); };
      im.src = url;
    });
  }

  window.BBCorAuto = { nomearURL: nomearURL, nomearImagem: nomearImagem, nomearPixels: nomearPixels, nomePixel: nomePixel };

  /* ---- ligação ao formulário do registo (fornecedor-novo.html) ---- */
  if (!document.getElementById('cg') || !document.getElementById('fc')) return;

  function nota() {
    if (document.getElementById('cor-auto-nota')) return;
    var cg = document.getElementById('cg'), p = document.createElement('div');
    p.id = 'cor-auto-nota';
    p.style.cssText = 'font-size:13px;color:#9a9aa2;margin:-2px 0 8px';
    p.textContent = (document.documentElement.lang || '').indexOf('zh') === 0
      ? '颜色名称会根据照片自动填写，可以修改。'
      : 'O nome da cor é preenchido sozinho pela foto (2 cores: ex. "Preto Branco"; 3 ou mais: "Multicolor"). Pode corrigir.';
    cg.parentNode.insertBefore(p, cg);
  }
  nota();

  function porNoCampo(c, nome) {
    try {
      var idx = cores.indexOf(c); if (idx < 0) return;
      var it = document.getElementById('cg').children[idx]; if (!it) return;
      var inp = it.querySelector(':scope > input');
      if (inp && !inp.value.trim()) inp.value = nome;
    } catch (e) {}
  }

  async function tratar(c) {
    var nome = await nomearURL(c.prev);
    if (!nome) return;
    try {
      if (cores.indexOf(c) < 0 || (c.nome && c.nome.trim())) return; // removida ou já escrita pelo fornecedor
      c.nome = nome;
      porNoCampo(c, nome);
      if (typeof refreshTs === 'function') refreshTs();
    } catch (e) {}
  }

  setInterval(function () {
    try {
      if (typeof cores === 'undefined') return;
      cores.forEach(function (c) {
        if (c.__corAuto || !c.prev) return;
        c.__corAuto = 1;
        if (!c.nome || !c.nome.trim()) tratar(c);
      });
    } catch (e) {}
  }, 500);
})();
