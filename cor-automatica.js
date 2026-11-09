/* cor-automatica.js — BBabilônia (v3)
   Registo de produto: o "Nome da cor" é preenchido sozinho a partir da foto da cor.
   A cor é lida SÓ no objeto (nunca no fundo) e SÓ na peça da CATEGORIA escolhida:
     - Calças, jeans, calções, saias, leggings  -> só a cor da calça (ténis, blusa e chão não contam)
     - Blusas, t-shirts, camisas, casacos, tops -> só a cor da blusa
     - Calçados                                 -> só a cor dos sapatos
     - Vestidos, conjuntos e outras categorias  -> a cor do objeto inteiro (sem o fundo)
   v3 (correção): o fundo às riscas (parede com listras), relva/chão e cantos da foto já não
   entram no nome (antes saía "Cinzento Preto", "Cinzento Roxo"…). Tecidos brilhantes (cetim)
   já não viram "Cinzento": branco brilhante = Branco, preto brilhante = Preto.
   Duas fotos com a mesma cor automática ficam "Preto", "Preto 2" (para os tamanhos e o stock
   de cada foto não se juntarem).
   O que o fornecedor escreveu à mão nunca é alterado. Não altera o fornecedor-novo.html. */
(function () {
  if (window.__bbCorAuto) return; window.__bbCorAuto = 1;

  var N = 128; // a foto é reduzida a 128x128 só para ler as cores (a foto original não muda)

  function hsv(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var v = mx / 255, c = (mx - mn) / 255, h = 0;
    if (mx !== mn) {
      var d = mx - mn;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: h, c: c, v: v, mn: mn };
  }

  function nomePixel(r, g, b) {
    var o = hsv(r, g, b), h = o.h, c = o.c, v = o.v, mn = o.mn;
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
  var CINZA = { 'Branco': 1, 'Cinzento': 1, 'Preto': 1 };   // tons de um tecido branco/cinza/preto (brilho e sombra)
  var PELE = { 'Castanho': 1, 'Bege': 1, 'Laranja': 1, 'Rosa': 1 };

  /* Zonas por tipo de peça (fração da largura/altura). */
  var ZONAS = {
    inferior: { x0: 0.12, x1: 0.88, y0: 0.32, y1: 0.86 },
    superior: { x0: 0.15, x1: 0.85, y0: 0.14, y1: 0.58 },
    pes:      { x0: 0.05, x1: 0.95, y0: 0.20, y1: 0.95 }
  };

  function semAcentos(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Decide o tipo de peça pelo texto da categoria (nome + grupo). */
  function tipoPorTexto(txt) {
    var t = semAcentos(txt);
    if (!t) return 'geral';
    if (/\b(vestid|conjunt|macac|jardineir|fato|terno|pijam|uniform|bikini|biquini|fato de banho)/.test(t)) return 'inteira';
    if (/\b(calcad|sapat|tenis|sandal|bota|chinel|salto|mocassi|sneaker|pantuf)/.test(t)) return 'pes';
    if (/\b(calca|jean|ganga|calcao|calcoes|short|bermud|saia|legging|cargo|jogger)/.test(t)) return 'inferior';
    if (/\b(blus|t-shirt|tshirt|camis|shirt|casac|jaquet|jacket|blazer|colete|sweat|hoodie|moletom|top|cropped|polo|sueter|cardigan|corpete|regata)/.test(t)) return 'superior';
    return 'geral';
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
  function rgb(px, i) { var k = i * 4; return [px[k], px[k + 1], px[k + 2]]; }

  /* ---------- FUNDO ----------
     As cores das margens da foto (parede, riscas da parede, relva, chão, cantos) formam uma
     paleta de fundo; tudo o que tem essas cores e está ligado às margens é fundo.
     Devolve tirado[i] != 0 para pixels de fundo. */
  function tirarFundo(px) {
    var x, y, i, M = 4, borda = [];
    var tirado = new Uint8Array(N * N);
    for (i = 0; i < N * N; i++) if (px[i * 4 + 3] <= 20) tirado[i] = 1; // transparente
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      if (x < M || y < M || x >= N - M || y >= N - M) { i = y * N + x; if (!tirado[i]) borda.push(i); }
    }
    // paleta de fundo: grupos de cores das margens
    var grupos = [];
    borda.forEach(function (i) {
      var c = rgb(px, i), g = null, bd = 1e9;
      for (var a = 0; a < grupos.length; a++) { var d = dist(c, grupos[a].m); if (d < bd) { bd = d; g = grupos[a]; } }
      if (!(g && bd < 30)) { g = { n: 0, s: [0, 0, 0], m: c.slice(), lados: [0, 0, 0, 0] }; grupos.push(g); }
      g.n++; for (var k = 0; k < 3; k++) g.s[k] += c[k]; g.m = g.s.map(function (s) { return s / g.n; });
      var bx = i % N, by = (i / N) | 0;
      if (bx < M) g.lados[0]++; if (bx >= N - M) g.lados[1]++; if (by < M) g.lados[2]++; if (by >= N - M) g.lados[3]++;
    });
    // é fundo a cor que rodeia a foto (aparece em 3 ou 4 lados) ou que ocupa grande parte das margens;
    // o objeto que toca só em cima/em baixo (pescoço do manequim, barra do vestido) não é fundo
    var pal = grupos.filter(function (g) {
      if (g.n < borda.length * 0.03) return false;
      var lados = g.lados.filter(function (n) { return n >= 3; }).length;
      return lados >= 3 || g.n >= borda.length * 0.35;
    }).map(function (g) { return { m: g.m, d: [] }; });
    // tolerância de cada cor de fundo = quanto essa cor varia nas margens
    // (fundo liso -> apertada, para não comer ténis brancos num fundo branco; fundo com textura -> larga)
    borda.forEach(function (i) {
      var c = rgb(px, i), g = null, bd = 1e9;
      pal.forEach(function (p) { var d = dist(c, p.m); if (d < bd) { bd = d; g = p; } });
      if (g && bd < 40) g.d.push(bd);
    });
    pal.forEach(function (p) { p.d.sort(function (a, b) { return a - b; }); var s = p.d.length ? p.d[Math.floor(p.d.length * 0.85)] : 0; p.tol = Math.max(10, Math.min(34, s * 1.6 + 8)); });
    function eFundo(c, lim) { for (var a = 0; a < pal.length; a++) if (dist(c, pal[a].m) < Math.min(lim, pal[a].tol)) return true; return false; }

    function encher(tol) {
      var t = new Uint8Array(tirado), pilha = borda.slice();
      while (pilha.length) {
        var p = pilha.pop(); if (t[p] === 2) continue;
        if (t[p] !== 1 && !eFundo(rgb(px, p), tol)) continue;
        t[p] = 2;
        var x0 = p % N, y0 = (p / N) | 0;
        if (x0 > 0) pilha.push(p - 1); if (x0 < N - 1) pilha.push(p + 1);
        if (y0 > 0) pilha.push(p - N); if (y0 < N - 1) pilha.push(p + N);
      }
      var fica = 0; for (var q = 0; q < N * N; q++) if (!t[q]) fica++;
      return { t: t, fica: fica };
    }
    // tenta com tolerância normal; se "comer" quase tudo (objeto da cor do fundo), aperta
    var r = encher(34);
    if (r.fica < N * N * 0.06) r = encher(18);
    if (r.fica < N * N * 0.03) r = encher(9);
    if (r.fica < N * N * 0.03) return { t: tirado, pal: pal }; // não dá para separar: lê a foto toda
    tirado = r.t;

    // limpa restos: pixels soltos com cor de fundo rodeados de fundo
    for (y = 1; y < N - 1; y++) for (x = 1; x < N - 1; x++) {
      i = y * N + x; if (tirado[i]) continue;
      var viz = (tirado[i - 1] ? 1 : 0) + (tirado[i + 1] ? 1 : 0) + (tirado[i - N] ? 1 : 0) + (tirado[i + N] ? 1 : 0);
      if (viz >= 3 && eFundo(rgb(px, i), 34)) tirado[i] = 3;
    }
    return { t: tirado, pal: pal };
  }

  /* Divide o objeto em faixas horizontais com a mesma cor dominante
     (ex.: blusa branca | calça preta | ténis brancos). */
  function faixas(px, tirado) {
    var x, y, i, linhas = [];
    // largura do objeto (para pesar o centro)
    var xa = N, xb = 0;
    for (i = 0; i < N * N; i++) if (!tirado[i]) { x = i % N; if (x < xa) xa = x; if (x > xb) xb = x; }
    if (xb <= xa) { xa = Math.floor(N * 0.2); xb = Math.ceil(N * 0.8); }
    var cx = (xa + xb) / 2, rx = Math.max(1, (xb - xa) / 2);
    for (y = 0; y < N; y++) {
      var c = {}, tot = 0;
      for (x = xa; x <= xb; x++) {
        i = y * N + x; if (tirado[i]) continue;
        var nm = nomePixel(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        nm = FAMILIA[nm] || nm;
        var d = (x - cx) / rx, w = 1 - 0.7 * d * d;
        c[nm] = (c[nm] || 0) + w; tot += w;
      }
      var best = null, bv = 0;
      Object.keys(c).forEach(function (n) { if (c[n] > bv) { bv = c[n]; best = n; } });
      linhas.push(tot > 1.5 ? best : null);
    }
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
      for (var a = 0; a < grandes.length; a++) {
        var s = grandes[a], resto = grandes.length - a - 1;
        if (resto > 0 && PELE[s.nome] && s.len < N * 0.3) continue;              // cara/pescoço
        if (resto > 0 && s.meio < 0.15 && s.len < N * 0.12) continue;              // cabelo
        return s;
      }
      return grandes[0];
    }
    if (tipo === 'inferior') {
      var cand = grandes.filter(function (s) { return s.meio >= 0.3 && !(PELE[s.nome] && s.len < N * 0.2); });
      // a última faixa pequena em baixo são os sapatos
      var ult = grandes[grandes.length - 1];
      if (cand.length > 1 && ult.meio > 0.75 && ult.len < N * 0.2) cand = cand.filter(function (s) { return s !== ult; });
      if (!cand.length) cand = grandes;
      return cand.slice().sort(function (p, q) { return q.len - p.len; })[0];
    }
    if (tipo === 'pes') return grandes[grandes.length - 1];
    return null;
  }

  /* Conta as cores dos pixels do objeto dentro de [X0,X1)x[Y0,Y1), mais peso no centro. */
  function contar(px, tirado, X0, X1, Y0, Y1) {
    var x, y, i, conta = {}, total = 0, vCinza = [];
    var zcx = (X0 + X1 - 1) / 2, zcy = (Y0 + Y1 - 1) / 2;
    var zrx = Math.max(1, (X1 - X0) / 2), zry = Math.max(1, (Y1 - Y0) / 2);
    for (y = Y0; y < Y1; y++) for (x = X0; x < X1; x++) {
      i = y * N + x; if (tirado[i]) continue;
      var k = i * 4, nm = nomePixel(px[k], px[k + 1], px[k + 2]);
      var dx = (x - zcx) / zrx, dy = (y - zcy) / zry;
      var w = Math.max(0.15, 1 - 0.85 * dx * dx) * (1 - 0.3 * dy * dy);
      if (CINZA[nm]) { vCinza.push([Math.max(px[k], px[k + 1], px[k + 2]) / 255, w]); nm = 'Cinza*'; }
      conta[nm] = (conta[nm] || 0) + w; total += w;
    }
    return { conta: conta, total: total, vCinza: vCinza };
  }

  /* Tecido branco/cinza/preto: decide pela luz do tecido (o brilho do cetim não é "cinzento"). */
  function nomeCinza(lista) {
    if (!lista.length) return 'Cinzento';
    lista.sort(function (a, b) { return a[0] - b[0]; });
    var tot = 0; lista.forEach(function (p) { tot += p[1]; });
    function perc(q) { var s = 0; for (var a = 0; a < lista.length; a++) { s += lista[a][1]; if (s >= tot * q) return lista[a][0]; } return lista[lista.length - 1][0]; }
    var med = perc(0.5), alto = perc(0.8);
    if (alto >= 0.84 && med >= 0.62) return 'Branco';
    if (med <= 0.30) return 'Preto';
    return 'Cinzento';
  }

  /* px: RGBA (Uint8ClampedArray) de N x N; tipo: 'inferior' | 'superior' | 'pes' | 'inteira' | 'geral' */
  function nomearPixels(px, tipo) {
    var zona = ZONAS[tipo] || null;
    var f = tirarFundo(px), tirado = f.t;
    var X0 = 0, X1 = N, Y0 = 0, Y1 = N, i;
    // caixa do objeto
    var bx0 = N, bx1 = -1, by0 = N, by1 = -1;
    for (i = 0; i < N * N; i++) if (!tirado[i]) { var x = i % N, y = (i / N) | 0; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (bx1 < 0) return '';
    X0 = bx0; X1 = bx1 + 1; Y0 = by0; Y1 = by1 + 1;
    if (zona) {
      var seg = escolherFaixa(faixas(px, tirado), tipo);
      if (seg) { Y0 = seg.y0; Y1 = seg.y1 + 1; }
      else { // sem faixas claras: usa a zona fixa dentro da caixa do objeto
        var h = Y1 - Y0; Y0 = Math.floor(by0 + zona.y0 * h); Y1 = Math.ceil(by0 + zona.y1 * h);
      }
    }
    var r = contar(px, tirado, X0, X1, Y0, Y1);
    if (!r.total) return '';
    var fam = {};
    Object.keys(r.conta).forEach(function (nm) {
      var fa = FAMILIA[nm] || nm;
      if (!fam[fa]) fam[fa] = { s: 0, melhor: nm, mv: 0 };
      fam[fa].s += r.conta[nm];
      if (r.conta[nm] > fam[fa].mv) { fam[fa].mv = r.conta[nm]; fam[fa].melhor = nm; }
    });
    var lista = Object.keys(fam).map(function (fa) {
      var nome = fam[fa].melhor === 'Cinza*' ? nomeCinza(r.vCinza) : fam[fa].melhor;
      return { nome: nome, s: fam[fa].s / r.total };
    }).sort(function (a, b) { return b.s - a.s; });

    if (zona) return lista[0].nome; // uma só peça (calça, blusa, sapatos) = uma só cor

    // objeto inteiro (vestido, conjunto, outros): 1 cor; 2 cores fortes -> "Preto Branco"; 3+ -> Multicolor
    // pele (braços, cara) e cor parecida com o fundo não contam como 2.ª cor
    var top = lista[0];
    // Cinza* é o tecido branco/cinza/preto: com 2 tons fortes (escuro e claro) é "Preto Branco"
    if (top.nome !== 'Multicolor' && fam['Cinza*'] && fam['Cinza*'].s / r.total >= 0.6) {
      var esc = 0, cla = 0, tv = 0;
      r.vCinza.forEach(function (p) { tv += p[1]; if (p[0] <= 0.3) esc += p[1]; else if (p[0] >= 0.8) cla += p[1]; });
      if (tv && esc / tv >= 0.3 && cla / tv >= 0.3) return esc >= cla ? 'Preto Branco' : 'Branco Preto';
    }
    // pele (braços, cara) e sombra cinzenta do tecido não contam como 2.ª cor
    var outras = lista.slice(1).filter(function (a) { return (!PELE[a.nome] || PELE[top.nome]) && a.nome !== 'Cinzento'; });
    var fortes = [top].concat(outras.filter(function (a) { return a.s >= 0.25; }));
    var medias = [top].concat(outras.filter(function (a) { return a.s >= 0.12; }));
    if (fortes.length >= 3 || medias.length >= 4) return 'Multicolor';
    if (fortes.length === 2 && fortes[1].nome !== top.nome) return top.nome + ' ' + fortes[1].nome;
    return top.nome;
  }

  function nomearImagem(img, tipo) {
    var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    var g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'medium'; // mistura riscas finas do fundo numa cor só
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
      ? '颜色名称会根据照片和所选类别自动填写（只识别该类别的商品，不含背景），可以修改。'
      : 'O nome da cor é preenchido sozinho pela foto: só a cor do objeto (sem o fundo) e só da peça da categoria escolhida (ex.: categoria Calças = só a cor da calça). Pode corrigir.';
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

  function eAutomatico(c) {
    var n = (c.nome || '').trim();
    return !n || (c.__corAutoNome && n === c.__corAutoNome);
  }

  // duas fotos com a mesma cor: "Preto", "Preto 2", "Preto 3"
  function nomeUnico(c, nome) {
    var usados = {};
    cores.forEach(function (o) { if (o !== c && o.nome) usados[String(o.nome).trim().toLowerCase()] = 1; });
    if (!usados[nome.toLowerCase()]) return nome;
    for (var n = 2; n < 100; n++) if (!usados[(nome + ' ' + n).toLowerCase()]) return nome + ' ' + n;
    return nome;
  }

  async function tratar(c) {
    var tipo = tipoAtual();
    c.__corTipo = tipo;
    var nome = await nomearURL(c.prev, tipo);
    if (!nome) return;
    try {
      if (cores.indexOf(c) < 0 || !eAutomatico(c)) return;
      if (c.__corTipo !== tipo) return;
      nome = nomeUnico(c, nome);
      c.nome = nome;
      c.__corAutoNome = nome;
      porNoCampo(c, nome, true);
      if (typeof refreshTs === 'function') refreshTs();
    } catch (e) {}
  }

  var ultimoTipo = null, fila = Promise.resolve();
  setInterval(function () {
    try {
      if (typeof cores === 'undefined') return;
      var tipo = tipoAtual();
      var mudou = ultimoTipo !== null && tipo !== ultimoTipo;
      ultimoTipo = tipo;
      cores.forEach(function (c) {
        if (!c.prev) return;
        if (mudou && c.__corAuto && eAutomatico(c)) { c.__corAuto = 0; if (c.nome === c.__corAutoNome) c.nome = ''; }
        if (c.__corAuto) return;
        c.__corAuto = 1;
        if (eAutomatico(c)) fila = fila.then(function () { return tratar(c); }); // uma de cada vez: "Preto 2" fica certo
      });
    } catch (e) {}
  }, 500);
})();
