/* cor-automatica.js — BBabilônia (v2)
   Registo de produto: o "Nome da cor" é preenchido sozinho a partir da foto da cor.
   NOVO: a cor é lida só na peça da CATEGORIA escolhida.
     - Calças, jeans, calções, saias, leggings  -> lê só a zona das calças (meio/baixo da foto)
     - Blusas, t-shirts, camisas, casacos, tops -> lê só a zona da blusa (meio/cima da foto)
     - Calçados                                 -> lê só a zona dos pés (baixo da foto)
     Nestas categorias o resultado é SEMPRE uma só cor (nunca "Multicolor"),
     porque a camisola, os ténis, o chão e o fundo da foto não contam.
     - Vestidos, conjuntos, macacões e outras categorias -> regra antiga:
       1 cor -> nome; 2 cores -> "Preto Branco"; 3 ou mais -> "Multicolor".
   - Se o fornecedor mudar a categoria depois de pôr as fotos, os nomes automáticos
     são refeitos; o que o fornecedor escreveu à mão nunca é alterado.
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
  var NEUTRAS = { 'Branco': 1, 'Cinzento': 1, 'Preto': 1, 'Bege': 1 };

  /* Zonas da foto por tipo de peça (fração da largura/altura).
     unica = devolve sempre uma só cor. */
  var ZONAS = {
    inferior: { x0: 0.12, x1: 0.88, y0: 0.32, y1: 0.86, unica: true },
    superior: { x0: 0.15, x1: 0.85, y0: 0.14, y1: 0.58, unica: true },
    pes:      { x0: 0.05, x1: 0.95, y0: 0.20, y1: 0.95, unica: true },
    inteira:  null,
    geral:    null
  };

  function semAcentos(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Decide o tipo de peça pelo texto da categoria (nome + grupo). */
  function tipoPorTexto(txt) {
    var t = semAcentos(txt);
    if (!t) return 'geral';
    // peças inteiras primeiro (ex.: "Conjunto calça e blusa" é conjunto)
    if (/\b(vestid|conjunt|macac|jardineir|fato|terno|pijam|uniform|bikini|biquini|fato de banho)/.test(t)) return 'inteira';
    if (/\b(calcad|sapat|tenis|sandal|bota|chinel|salto|mocassi|sneaker|pantuf)/.test(t)) return 'pes';
    if (/\b(calca|jean|ganga|calcao|calcoes|short|bermud|saia|legging|cargo|jogger)/.test(t)) return 'inferior';
    if (/\b(blus|t-shirt|tshirt|camis|shirt|casac|jaquet|jacket|blazer|colete|sweat|hoodie|moletom|top|cropped|polo|sueter|cardigan|corpete|regata)/.test(t)) return 'superior';
    return 'geral';
  }

  function textoCategoria() {
    var s = document.getElementById('cat');
    if (!s || !s.value || s.selectedIndex < 0) return '';
    var op = s.options[s.selectedIndex];
    var g = op && op.parentNode && op.parentNode.label ? op.parentNode.label : '';
    // o nome da subcategoria conta mais: vem primeiro e é testado sozinho
    return op ? op.text + ' | ' + g : '';
  }

  function tipoAtual() {
    var s = document.getElementById('cat');
    if (!s || !s.value || s.selectedIndex < 0) return 'geral';
    var op = s.options[s.selectedIndex];
    var t = tipoPorTexto(op.text);                 // 1.º o nome da subcategoria
    if (t !== 'geral') return t;
    var g = op.parentNode && op.parentNode.label ? op.parentNode.label : '';
    return tipoPorTexto(g);                        // 2.º o grupo
  }

  function dist(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  var PELE = { 'Castanho': 1, 'Bege': 1, 'Laranja': 1, 'Rosa': 1 };

  /* Divide a foto em faixas horizontais com a mesma cor dominante
     (ex.: blusa branca | calça azul | ténis brancos). */
  function faixas(px, tirado) {
    var x, y, i, linhas = [];
    var xa = Math.floor(N * 0.2), xb = Math.ceil(N * 0.8), cx = (N - 1) / 2, rx = (xb - xa) / 2;
    for (y = 0; y < N; y++) {
      var c = {}, tot = 0;
      for (x = xa; x < xb; x++) {
        i = y * N + x; if (tirado[i]) continue;
        var k = i * 4, nm = nomePixel(px[k], px[k + 1], px[k + 2]);
        nm = FAMILIA[nm] || nm;
        var d = (x - cx) / rx, w = 1 - 0.7 * d * d;
        c[nm] = (c[nm] || 0) + w; tot += w;
      }
      var best = null, bv = 0;
      Object.keys(c).forEach(function (n) { if (c[n] > bv) { bv = c[n]; best = n; } });
      linhas.push(tot > rx * 0.3 ? best : null); // linha quase vazia (só fundo) = sem cor
    }
    // suaviza: cada linha fica com a cor mais comum das 7 linhas à volta
    var suave = linhas.map(function (_, y) {
      var c = {}, b = null, bv = 0;
      for (var j = Math.max(0, y - 3); j <= Math.min(N - 1, y + 3); j++) if (linhas[j]) c[linhas[j]] = (c[linhas[j]] || 0) + 1;
      Object.keys(c).forEach(function (n) { if (c[n] > bv) { bv = c[n]; b = n; } });
      return b;
    });
    var segs = [];
    suave.forEach(function (n, y) {
      if (!n) return;
      var u = segs[segs.length - 1];
      if (u && u.nome === n && u.y1 === y - 1) u.y1 = y; else segs.push({ nome: n, y0: y, y1: y });
    });
    // junta faixas muito pequenas (menos de 4 linhas) à faixa anterior
    var out = [];
    segs.forEach(function (s) {
      var u = out[out.length - 1];
      if (s.y1 - s.y0 + 1 < 4 && u) { u.y1 = s.y1; return; }
      if (u && u.nome === s.nome) { u.y1 = s.y1; return; }
      out.push(s);
    });
    out.forEach(function (s) { s.len = s.y1 - s.y0 + 1; s.meio = (s.y0 + s.y1) / 2 / N; });
    return out;
  }

  function escolherFaixa(segs, tipo) {
    var grandes = segs.filter(function (s) { return s.len >= N * 0.06; });
    if (!grandes.length) return null;
    if (grandes.length === 1) return grandes[0]; // foto só da peça
    if (tipo === 'superior') {
      // a 1.ª faixa grande de cima que não seja cabelo/cara (só salta pele se houver mais faixas por baixo)
      for (var a = 0; a < grandes.length; a++) {
        var s = grandes[a], resto = grandes.length - a - 1;
        if (resto > 0 && PELE[s.nome] && s.len < N * 0.3) continue;
        if (resto > 0 && s.nome === 'Preto' && s.meio < 0.15 && s.len < N * 0.12 && PELE[(grandes[a + 1] || {}).nome]) continue; // cabelo
        return s;
      }
      return grandes[0];
    }
    if (tipo === 'inferior') {
      // a faixa mais comprida da metade de baixo (sem ser a última pequena = sapatos)
      var cand = grandes.filter(function (s) { return s.meio >= 0.3; });
      if (!cand.length) cand = grandes;
      return cand.slice().sort(function (p, q) { return q.len - p.len; })[0];
    }
    if (tipo === 'pes') return grandes[grandes.length - 1];
    return null;
  }

  /* px: RGBA (Uint8ClampedArray) de N x N; tipo: 'inferior' | 'superior' | 'pes' | 'inteira' | 'geral' */
  function nomearPixels(px, tipo) {
    var zona = ZONAS[tipo] || null;
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
    // limites da zona da peça
    var X0 = 0, X1 = N, Y0 = 0, Y1 = N;
    if (zona) {
      X0 = Math.floor(zona.x0 * N); X1 = Math.ceil(zona.x1 * N); Y0 = Math.floor(zona.y0 * N); Y1 = Math.ceil(zona.y1 * N);
      // tira também o fundo de cada linha (quando as duas pontas da linha têm a mesma cor = parede/chão)
      for (y = 0; y < N; y++) {
        var ed = [];
        for (x = 0; x < N; x++) if ((x < 4 || x >= N - 4) && !tirado[y * N + x]) { var e4 = (y * N + x) * 4; ed.push([px[e4], px[e4 + 1], px[e4 + 2]]); }
        if (ed.length < 6) continue;
        var md = [0, 1, 2].map(function (k) { var a = ed.map(function (p) { return p[k]; }).sort(function (p, q) { return p - q; }); return a[a.length >> 1]; });
        var lisa = ed.filter(function (p) { return dist(p, md) < 25; }).length / ed.length;
        if (lisa < 0.9) continue; // pontas diferentes (ex.: prédio de um lado, céu do outro): não mexe
        for (x = 0; x < N; x++) { var q4 = (y * N + x) * 4; if (!tirado[y * N + x] && dist([px[q4], px[q4 + 1], px[q4 + 2]], md) < 25) tirado[y * N + x] = 3; }
      }
      // procura as faixas de cor da pessoa/peça de cima para baixo (blusa, calça, sapatos)
      var seg = escolherFaixa(faixas(px, tirado), tipo);
      if (seg) { Y0 = seg.y0; Y1 = seg.y1 + 1; }
    }
    var zcx = (X0 + X1 - 1) / 2, zcy = (Y0 + Y1 - 1) / 2;
    var zrx = Math.max(1, (X1 - X0) / 2), zry = Math.max(1, (Y1 - Y0) / 2);

    var conta = {}, total = 0, resto = 0, zonaPx = 0;
    for (y = Y0; y < Y1; y++) for (x = X0; x < X1; x++) {
      i = y * N + x;
      if (!(px[i * 4 + 3] <= 20)) zonaPx++;
      if (tirado[i]) continue;
      resto++;
      var k = i * 4, nm = nomePixel(px[k], px[k + 1], px[k + 2]);
      var w;
      if (zona) {
        // na zona da peça: o centro na horizontal conta muito mais (a peça está no meio)
        var dx = (x - zcx) / zrx, dy = (y - zcy) / zry;
        w = Math.max(0.15, 1 - 0.85 * dx * dx) * (1 - 0.3 * dy * dy);
      } else {
        var cx = (N - 1) / 2, rmax = Math.sqrt(2) * cx;
        var dd = Math.sqrt((x - cx) * (x - cx) + (y - cx) * (y - cx)) / rmax;
        w = 1 - 0.6 * dd * dd;
      }
      conta[nm] = (conta[nm] || 0) + w; total += w;
    }
    // quase tudo era "fundo": o produto tem a mesma cor do fundo
    if (fundo && resto < Math.max(1, zonaPx) * 0.08) return nomePixel(fundo[0], fundo[1], fundo[2]);
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

    if (zona && zona.unica) {
      // uma só peça = uma só cor.
      // Se a maior for neutra (chão cinzento, parede branca) e houver uma cor forte
      // com bastante presença, a cor forte é a da peça.
      var top = lista[0];
      if (NEUTRAS[top.nome]) {
        for (var q = 1; q < lista.length; q++) {
          if (!NEUTRAS[lista[q].nome] && lista[q].s >= 0.28 && lista[q].s >= top.s * 0.6) return lista[q].nome;
        }
      }
      return top.nome;
    }

    var fortes = lista.filter(function (a) { return a.s >= 0.15; });
    var menores = lista.filter(function (a) { return a.s >= 0.07; });
    if (fortes.length >= 3 || (menores.length >= 4 && lista[0].s < 0.55)) return 'Multicolor';
    if (fortes.length === 2) return fortes[0].nome + ' ' + fortes[1].nome;
    return lista[0].nome;
  }

  function nomearImagem(img, tipo) {
    var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    var g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = false; // lê pixels reais (listras finas não se misturam em cinzento)
    g.drawImage(img, 0, 0, N, N);
    return nomearPixels(g.getImageData(0, 0, N, N).data, tipo);
  }

  function nomearURL(url, tipo) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { try { ok(nomearImagem(im, tipo || tipoAtual())); } catch (e) { ok(''); } };
      im.onerror = function () { ok(''); };
      im.src = url;
    });
  }

  window.BBCorAuto = { nomearURL: nomearURL, nomearImagem: nomearImagem, nomearPixels: nomearPixels, nomePixel: nomePixel, tipoPorTexto: tipoPorTexto };

  /* ---- ligação ao formulário do registo (fornecedor-novo.html) ---- */
  if (!document.getElementById('cg') || !document.getElementById('fc')) return;

  function nota() {
    var p = document.getElementById('cor-auto-nota');
    if (!p) {
      var cg = document.getElementById('cg'); p = document.createElement('div');
      p.id = 'cor-auto-nota';
      p.style.cssText = 'font-size:13px;color:#9a9aa2;margin:-2px 0 8px';
      cg.parentNode.insertBefore(p, cg);
    }
    var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
    p.textContent = zh
      ? '颜色名称会根据照片和所选类别自动填写（只识别该类别的商品），可以修改。'
      : 'O nome da cor é preenchido sozinho pela foto, só na peça da categoria escolhida (ex.: categoria Calças = só a cor da calça). Pode corrigir.';
  }
  nota();

  function porNoCampo(c, nome, forcar) {
    try {
      var idx = cores.indexOf(c); if (idx < 0) return;
      var it = document.getElementById('cg').children[idx]; if (!it) return;
      var inp = it.querySelector(':scope > input');
      if (inp && (forcar || !inp.value.trim())) inp.value = nome;
    } catch (e) {}
  }

  // nome ainda é o automático (o fornecedor não escreveu nada à mão)?
  function eAutomatico(c) {
    var n = (c.nome || '').trim();
    return !n || (c.__corAutoNome && n === c.__corAutoNome);
  }

  async function tratar(c) {
    var tipo = tipoAtual();
    c.__corTipo = tipo;
    var nome = await nomearURL(c.prev, tipo);
    if (!nome) return;
    try {
      if (cores.indexOf(c) < 0 || !eAutomatico(c)) return; // removida ou escrita pelo fornecedor
      if (c.__corTipo !== tipo) return;                   // a categoria mudou entretanto
      c.nome = nome;
      c.__corAutoNome = nome;
      porNoCampo(c, nome, true);
      if (typeof refreshTs === 'function') refreshTs();
    } catch (e) {}
  }

  var ultimoTipo = null;
  setInterval(function () {
    try {
      if (typeof cores === 'undefined') return;
      var tipo = tipoAtual();
      var mudou = ultimoTipo !== null && tipo !== ultimoTipo;
      ultimoTipo = tipo;
      cores.forEach(function (c) {
        if (!c.prev) return;
        if (mudou && c.__corAuto && eAutomatico(c)) c.__corAuto = 0; // refaz com a nova categoria
        if (c.__corAuto) return;
        c.__corAuto = 1;
        if (eAutomatico(c)) tratar(c);
      });
    } catch (e) {}
  }, 500);
})();
