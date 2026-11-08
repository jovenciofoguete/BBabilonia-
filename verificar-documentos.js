/* verificar-documentos.js — B-Babilônia: verificador próprio de documentos das lojas.
   Corre no navegador do administrador (admin-lojas.html), sobre o ficheiro original guardado.
   Procura sinais de documento falsificado, editado ou feito por IA, mesmo sem marca de água:
   - dados escondidos do ficheiro (câmara, programa usado, apps de edição e de IA, C2PA, datas);
   - PDF: alterações depois de criado, programa que o fez, texto escrito por cima da digitalização,
     caixas de texto acrescentadas, letras de vários tipos; analisa também a imagem dentro do PDF;
   - imagem: zonas com nível de compressão diferente (ELA), zonas lisas demais (apagadas/pintadas), partes copiadas e coladas na mesma imagem (carimbos,
     números), tamanho típico de imagens de IA sem dados de câmara, capturas de ecrã;
   - impressão digital do documento (para descobrir o mesmo documento noutra loja).
   Nada é enviado para fora: tudo é calculado no próprio telemóvel/computador.
      - impressão digital da compressão (que aplicativo/câmara gravou o JPEG) comparada com a lista ensinada;
   - miniatura escondida da câmara comparada com a foto (alterada/cortada depois de fotografada).
   Uso: BBVerificaDoc.analisar(blob, nomeDoFicheiro) -> Promise<resultado> */
(function () {
  'use strict';
  if (window.BBVerificaDoc) return;

  var MAXPX = 16e6;          // acima disto a imagem é reduzida (e a ELA não corre)
  var CEL = 16;              // tamanho das células do mapa

  /* ---------------- utilitários ---------------- */
  function latin1(b, s, e) {
    s = s || 0; e = Math.min(e == null ? b.length : e, b.length);
    try { return new TextDecoder('latin1').decode(b.subarray(s, e)); }
    catch (x) { var r = ''; for (var i = s; i < e; i += 8192) r += String.fromCharCode.apply(null, b.subarray(i, Math.min(e, i + 8192))); return r; }
  }
  function utf8(b, s, e) { try { return new TextDecoder('utf-8').decode(b.subarray(s, e)); } catch (x) { return latin1(b, s, e); } }
  function idx(b, pat, from) {           // procura bytes ASCII
    var n = pat.length, c0 = pat.charCodeAt(0);
    for (var i = from || 0; i <= b.length - n; i++) {
      if (b[i] !== c0) continue;
      var ok = true; for (var j = 1; j < n; j++) if (b[i + j] !== pat.charCodeAt(j)) { ok = false; break; }
      if (ok) return i;
    }
    return -1;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  async function sha256(buf) {
    try { var h = await crypto.subtle.digest('SHA-256', buf); return Array.prototype.map.call(new Uint8Array(h), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
    catch (e) { return ''; }
  }
  async function inflar(bytes) {
    if (typeof DecompressionStream === 'undefined') return null;
    try {
      var ds = new DecompressionStream('deflate');
      var r = new Response(new Blob([bytes]).stream().pipeThrough(ds));
      return new Uint8Array(await r.arrayBuffer());
    } catch (e) { return null; }
  }

  function a85(b) {
    var out = [], t = 0, n = 0, i = 0;
    if (b[0] === 0x3C && b[1] === 0x7E) i = 2;
    for (; i < b.length; i++) {
      var c = b[i];
      if (c === 0x7E) break;                       // ~> fim
      if (c <= 32) continue;
      if (c === 0x7A && n === 0) { out.push(0, 0, 0, 0); continue; }
      if (c < 33 || c > 117) continue;
      t = t * 85 + (c - 33); n++;
      if (n === 5) { out.push((t >>> 24) & 255, (t >>> 16) & 255, (t >>> 8) & 255, t & 255); t = 0; n = 0; }
    }
    if (n > 1) { for (var k = n; k < 5; k++) t = t * 85 + 84; var bs = [(t >>> 24) & 255, (t >>> 16) & 255, (t >>> 8) & 255, t & 255]; for (k = 0; k < n - 1; k++) out.push(bs[k]); }
    return new Uint8Array(out);
  }
  function ahx(b) {
    var h = latin1(b).replace(/[^0-9a-fA-F]/g, ''), o = new Uint8Array(Math.ceil(h.length / 2));
    for (var i = 0; i < o.length; i++) o[i] = parseInt((h.substr(i * 2, 2) + '0').slice(0, 2), 16);
    return o;
  }
  function filtros(dict) {
    var m = /\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/.exec(dict);
    if (!m) return [];
    return (m[1].match(/\/[A-Za-z0-9]+/g) || []).map(function (x) { return x.slice(1); });
  }
  /* aplica os filtros do PDF; devolve {b: bytes, jpeg: true/false} ou null se não suportado */
  async function descomprimir(bytes, fl) {
    var b = bytes;
    for (var i = 0; i < fl.length; i++) {
      var f = fl[i];
      if (f === 'ASCII85Decode' || f === 'A85') b = a85(b);
      else if (f === 'ASCIIHexDecode' || f === 'AHx') b = ahx(b);
      else if (f === 'FlateDecode' || f === 'Fl') { b = await inflar(b); if (!b) return null; }
      else if (f === 'DCTDecode' || f === 'DCT') return i === fl.length - 1 ? { b: b, jpeg: true } : null;
      else return null;
    }
    return { b: b, jpeg: false };
  }

  /* ---------------- programas conhecidos ---------------- */
  var IA = [
    ['trainedAlgorithmicMedia', 'marcado como criado por IA'], ['compositeWithTrainedAlgorithmicMedia', 'marcado como editado com IA'],
    ['Midjourney'], ['DALL-E', 'DALL·E (OpenAI)'], ['DALL·E'], ['OpenAI'], ['ChatGPT'], ['GPT-4o'], ['Sora'],
    ['Stable Diffusion'], ['stable-diffusion', 'Stable Diffusion'], ['ComfyUI'], ['Automatic1111'], ['NovelAI'], ['InvokeAI'],
    ['Adobe Firefly'], ['Firefly'], ['Imagen'], ['Gemini'], ['Google AI'], ['SynthID'], ['Ideogram'], ['Leonardo.Ai'], ['Flux.1', 'FLUX'],
    ['Kling'], ['Doubao', 'Doubao (豆包)'], ['豆包'], ['Jimeng', 'Jimeng (即梦)'], ['即梦'], ['Tongyi', 'Tongyi (通义)'], ['通义万相'],
    ['ERNIE'], ['文心一格'], ['Hunyuan'], ['混元'], ['Bing Image Creator'], ['Microsoft Designer'], ['Grok'], ['Aurora'], ['Recraft'], ['Krea']
  ];
  var EDITORES = [
    ['Adobe Photoshop', 'Photoshop'], ['Photoshop'], ['Lightroom'], ['GIMP'], ['Canva'], ['PicsArt'], ['Picsart'], ['Snapseed'],
    ['Meitu', 'Meitu (美图)'], ['美图'], ['Xingtu', 'Xingtu (醒图)'], ['醒图'], ['Pixlr'], ['Photopea'], ['Paint.NET'], ['Fotor'],
    ['PhotoDirector'], ['Polarr'], ['VSCO'], ['InShot'], ['CapCut'], ['剪映'], ['Remini'], ['Facetune'], ['PhotoRoom'], ['Affinity Photo'],
    ['CorelDRAW'], ['Corel PHOTO-PAINT'], ['Adobe Illustrator'], ['Illustrator'], ['Inkscape'], ['Pixelmator'], ['Luminar'], ['Fotojet'],
    ['BeFunky'], ['Polotno'], ['Kittl'], ['Figma'], ['Sketch'], ['Microsoft Paint'], ['MSPaint'], ['Paint 3D'], ['ACDSee'], ['XnView'], ['IrfanView']
  ];
  var PDF_EDIT = ['iLovePDF', 'Smallpdf', 'Sejda', 'PDFescape', 'PDF-XChange', 'PhantomPDF', 'Foxit', 'PDFelement', 'Wondershare', 'Nitro',
    'Soda PDF', 'PDF Candy', 'pdfFiller', 'DocFly', 'PDF24', 'PDF Expert', 'Xodo', 'LightPDF', 'PDFgear', 'WPS PDF', '福昕', '万兴'];
  var PDF_DIGITAL = ['Microsoft', 'Word', 'Excel', 'PowerPoint', 'WPS', 'LibreOffice', 'OpenOffice', 'Google Docs', 'Canva', 'Photoshop',
    'Illustrator', 'InDesign', 'Pages', 'Keynote', 'CorelDRAW', 'Affinity', 'Figma'];
  var PDF_SCAN = ['CamScanner', 'Adobe Scan', 'Microsoft Lens', 'Office Lens', 'Genius Scan', 'Scanbot', 'TurboScan', 'Tiny Scanner', '扫描全能王'];

  function procurar(lista, txt) {
    var achados = [];
    lista.forEach(function (x) {
      var p = x[0], re = /^[A-Za-z]/.test(p) ? new RegExp('(^|[^A-Za-z])' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Za-z]|$)', 'i') : null;
      if (re ? re.test(txt) : txt.indexOf(p) > -1) {
        var n = x[1] || p; if (achados.indexOf(n) < 0) achados.push(n);
      }
    });
    return achados;
  }
  function contem(lista, s) { s = String(s || ''); for (var i = 0; i < lista.length; i++) if (s.toLowerCase().indexOf(lista[i].toLowerCase()) > -1) return lista[i]; return ''; }

  /* ---------------- leitura de JPEG ---------------- */
  function lerExif(b, s, e) {
    var r = {}; if (s + 8 > e) return r;
    var le = b[s] === 0x49;
    function u16(p) { return le ? b[p] | (b[p + 1] << 8) : (b[p] << 8) | b[p + 1]; }
    function u32(p) { return le ? (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0 : ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0; }
    function ifd(off, nomes) {
      var p = s + off; if (p + 2 > e) return 0;
      var n = u16(p); p += 2;
      for (var i = 0; i < n && p + 12 <= e; i++, p += 12) {
        var tag = u16(p), tipo = u16(p + 2), cnt = u32(p + 4), vo = p + 8;
        if (tag === 0x8769) { ifd(u32(vo), nomes); continue; }
        if (tag === 0x927C) { r.makernote = true; continue; }
        if (tag === 0x8825) { r.gps = true; continue; }
        var nome = nomes[tag]; if (!nome) continue;
        if (tipo === 2) { var o = cnt > 4 ? s + u32(vo) : vo; if (o + cnt <= e) r[nome] = latin1(b, o, o + cnt).replace(/\0+$/, '').trim(); }
        else if (tipo === 3) r[nome] = u16(vo);
        else if (tipo === 4) r[nome] = u32(vo);
      }
      return p + 4 <= e ? u32(p) : 0;
    }
    try {
      var prox = ifd(u32(s + 4), { 0x010F: 'marca', 0x0110: 'modelo', 0x0131: 'programa', 0x0132: 'dataAlterada', 0x013B: 'autor',
        0x9003: 'dataOriginal', 0x9004: 'dataDigital', 0xA002: 'largura', 0xA003: 'altura', 0x0112: 'orientacao', 0xA430: 'dono', 0xA434: 'lente' });
      if (prox) {                                   // IFD1: miniatura guardada pela câmara
        ifd(prox, { 0x0201: 'thumbOff', 0x0202: 'thumbLen' });
        if (r.thumbOff && r.thumbLen && s + r.thumbOff + r.thumbLen <= e && b[s + r.thumbOff] === 0xFF && b[s + r.thumbOff + 1] === 0xD8)
          r.miniatura = [s + r.thumbOff, s + r.thumbOff + r.thumbLen];
      }
    } catch (x) {}
    return r;
  }
  function lerJPEG(b) {
    var o = { tipo: 'jpeg', txt: '', apps: [], dqt: [], marcas: [], dht: '', amostragem: '' }, i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      var m = b[i + 1];
      if (m === 0xFF) { i++; continue; }
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      if (m === 0xD9 || m === 0xDA) break;
      var len = (b[i + 2] << 8) | b[i + 3], s = i + 4, e = Math.min(i + 2 + len, b.length);
      if (o.marcas[o.marcas.length - 1] !== m.toString(16)) o.marcas.push(m.toString(16));
      if (m === 0xC4) o.dht += latin1(b, s, e);
      if (m >= 0xE0 && m <= 0xEF) {
        o.apps.push(m);
        var t = utf8(b, s, e); o.txt += ' ' + t;
        if (m === 0xE1 && t.slice(0, 4) === 'Exif') o.exif = lerExif(b, s + 6, e);
        if (m === 0xEB) o.jumbf = true;              // C2PA / credenciais de conteúdo
        if (m === 0xED) o.photoshopIRB = true;
        if (m === 0xEE && t.slice(0, 5) === 'Adobe') o.adobe = true;
      } else if (m === 0xDB) {
        var p = s;
        while (p < e) {
          var pq = b[p] >> 4, tq = b[p] & 15, tab = []; p++;
          for (var k = 0; k < 64; k++) { tab.push(pq ? (b[p] << 8) | b[p + 1] : b[p]); p += pq ? 2 : 1; }
          o.dqt[tq] = tab;
        }
      } else if (m === 0xC0 || m === 0xC1 || m === 0xC2) {
        o.h = (b[s + 1] << 8) | b[s + 2]; o.w = (b[s + 3] << 8) | b[s + 4]; o.progressivo = m === 0xC2;
        var nc = b[s + 5], am = []; for (var ci = 0; ci < nc; ci++) am.push(b[s + 7 + ci * 3].toString(16)); o.amostragem = am.join('.');
      } else if (m === 0xFE) { var c = utf8(b, s, e); o.txt += ' ' + c; o.comentario = c; }
      i = i + 2 + len;
    }
    return o;
  }
  var IJG = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
  var ZZ = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
    35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
  function qualidade(tab) {           // estima a qualidade JPEG pela tabela de luminância
    if (!tab) return null;
    var nat = new Array(64); for (var k = 0; k < 64; k++) nat[ZZ[k]] = tab[k];
    var melhor = null, erro = 1e9;
    for (var q = 1; q <= 100; q++) {
      var esc2 = q < 50 ? 5000 / q : 200 - 2 * q, err = 0, exata = true;
      for (var j = 0; j < 64; j++) { var v = Math.max(1, Math.min(255, Math.floor((IJG[j] * esc2 + 50) / 100))); err += Math.abs(v - nat[j]); if (v !== nat[j]) exata = false; }
      if (err < erro) { erro = err; melhor = { q: q, padrao: exata }; }
    }
    return melhor;
  }

  /* ---------------- impressão digital do aplicativo que gravou o JPEG ----------------
     Cada aplicativo/câmara grava com tabelas de compressão próprias. "tabelas" = tabelas de quantização + amostragem;
     "forte" = tabelas + Huffman + ordem dos blocos do ficheiro (mais exata). */
  function fnv(str, seed) { var h = seed >>> 0; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  function hash(str) { return fnv(str, 2166136261) + fnv(str, 3735928559); }
  function assinaturaJPEG(o) {
    if (!o || o.tipo !== 'jpeg' || !o.dqt.length) return null;
    var t = o.dqt.map(function (x) { return x ? x.join(',') : ''; }).join('/') + '|' + o.amostragem;
    var tab = hash(t), q = qualidade(o.dqt[0]);
    var apps = o.marcas.filter(function (m) { return /^e/.test(m); }).join('.');
    return { tabelas: tab, forte: hash(tab + '|' + hash(o.dht) + '|' + (o.progressivo ? 'p' : 'b') + '|' + apps), qualidade: q ? q.q : null, padrao: !!(q && q.padrao) };
  }
  var ASSIN = [];                       // lista de aplicativos ensinados (tabela assinaturas_apps)
  var NOMES_TIPO = { editor: 'aplicativo de edição', ia: 'gerador de IA', mensagem: 'aplicativo de mensagens', camera: 'câmara', scanner: 'aplicativo de digitalização' };
  function identificarApp(a, sinais, info) {
    if (!a) return;
    var forte = ASSIN.filter(function (x) { return x.forte === a.forte; }), tab = ASSIN.filter(function (x) { return x.tabelas === a.tabelas; });
    var lista = forte.length ? forte : tab, exato = !!forte.length;
    if (!lista.length) {
      info.push('Impressão digital da compressão: ' + a.forte + (a.padrao ? ' (tabela padrão usada por muitos aplicativos)' : '') + ' — ainda não está na lista de aplicativos conhecidos.');
      return;
    }
    var porTipo = {}; lista.forEach(function (x) { (porTipo[x.tipo] = porTipo[x.tipo] || []).push(x.app); });
    Object.keys(porTipo).forEach(function (tp) {
      var nomes = porTipo[tp].filter(function (v, i, arr) { return arr.indexOf(v) === i; });
      var txt = (exato ? 'Gravado com ' : 'Compressão igual à de ') + (nomes.length > 1 ? 'um destes: ' : '') + nomes.join(', ') + ' (' + (NOMES_TIPO[tp] || tp) + ').';
      if (tp === 'ia') sinais.push({ p: exato ? 10 : 6, t: txt });
      else if (tp === 'editor') sinais.push({ p: exato ? 6 : 4, t: txt });
      else info.push(txt);
    });
  }

  /* miniatura escondida da câmara: se a foto foi editada e a miniatura ficou, as duas não batem certo */
  async function compararMiniatura(b, o, im, sinais, info) {
    var mi = o.exif && o.exif.miniatura; if (!mi) return;
    var t; try { t = await descodificar(new Blob([b.subarray(mi[0], mi[1])], { type: 'image/jpeg' })); } catch (e) { return; }
    if (t.w < 40 || t.h < 30) return;
    // tirar barras pretas que algumas câmaras põem na miniatura
    var Yt = cinzento(t.dados, t.w * t.h), x0 = 0, x1 = t.w - 1, y0 = 0, y1 = t.h - 1;
    function linhaPreta(y) { for (var x = 0; x < t.w; x++) if (Yt[y * t.w + x] > 18) return false; return true; }
    function colPreta(x) { for (var y = y0; y <= y1; y++) if (Yt[y * t.w + x] > 18) return false; return true; }
    while (y0 < y1 && linhaPreta(y0)) y0++; while (y1 > y0 && linhaPreta(y1)) y1--;
    while (x0 < x1 && colPreta(x0)) x0++; while (x1 > x0 && colPreta(x1)) x1--;
    var tw = x1 - x0 + 1, th = y1 - y0 + 1, ra = im.w0 / im.h0, rt = tw / th;
    if (Math.abs(ra / rt - 1) > 0.06 && Math.abs(ra * rt - 1) > 0.06) {
      sinais.push({ p: 5, t: 'A miniatura escondida da câmara tem outra proporção: a foto foi cortada ou alterada depois de tirada.' });
      return;
    }
    if (Math.abs(ra / rt - 1) > 0.06) return;      // miniatura rodada: não compara
    // compara no tamanho da própria miniatura (até 160 px), com um leve desfoque igual nos dois
    var W = Math.min(160, tw), H = Math.max(8, Math.round(W / ra));
    function reduzir(src, sx, sy, sw, sh) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      if (sw > W * 2) {                                   // reduzir por etapas (evita serrilhado)
        var t2 = document.createElement('canvas'); t2.width = W * 2; t2.height = H * 2;
        var g2 = t2.getContext('2d'); g2.imageSmoothingQuality = 'high'; g2.drawImage(src, sx, sy, sw, sh, 0, 0, W * 2, H * 2);
        g.drawImage(t2, 0, 0, W * 2, H * 2, 0, 0, W, H);
      } else g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
      var Y0 = cinzento(g.getImageData(0, 0, W, H).data, W * H), Y = new Float32Array(W * H), m = 0, d = 0, k, x, y;
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) {          // desfoque 3x3
        var sm = 0, n = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) { sm += Y0[yy * W + xx]; n++; } }
        Y[y * W + x] = sm / n;
      }
      for (k = 0; k < Y.length; k++) m += Y[k]; m /= Y.length;
      for (k = 0; k < Y.length; k++) d += (Y[k] - m) * (Y[k] - m); d = Math.sqrt(d / Y.length) || 1;
      for (k = 0; k < Y.length; k++) Y[k] = (Y[k] - m) / d;
      return Y;
    }
    var A = reduzir(im.cv, 0, 0, im.w, im.h), B = reduzir(t.cv, x0, y0, tw, th);
    var cel = [], tot = 0, CS = 8;
    for (var cy = 0; cy + CS <= H; cy += CS / 2) for (var cx = 0; cx + CS <= W; cx += CS / 2) {
      var s2 = 0; for (var yy3 = 0; yy3 < CS; yy3++) for (var xx3 = 0; xx3 < CS; xx3++) { var k2 = (cy + yy3) * W + cx + xx3; s2 += Math.abs(A[k2] - B[k2]); }
      cel.push(s2 / (CS * CS));
    }
    for (var k3 = 0; k3 < A.length; k3++) tot += Math.abs(A[k3] - B[k3]);
    var medio = tot / A.length, md = mediana(cel), mx = Math.max.apply(null, cel);
    if (window.BBDEBUG) window.BBDEBUG.miniatura = { medio: medio, md: md, mx: mx, W: W, H: H };
    if (medio > 0.45) sinais.push({ p: 8, t: 'A miniatura escondida da câmara mostra outra imagem: o documento foi alterado depois de fotografado.' });
    else if (mx > 0.6 && mx > md * 4) sinais.push({ p: 7, t: 'A miniatura escondida da câmara é diferente numa parte do documento: essa parte foi alterada depois de fotografada.' });
    else info.push('A miniatura escondida da câmara bate certo com a foto.');
  }

  /* ---------------- PNG / WEBP ---------------- */
  async function lerPNG(b) {
    var o = { tipo: 'png', txt: '' }, p = 8;
    o.w = ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0; o.h = ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0;
    while (p + 8 <= b.length) {
      var len = ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0, tp = latin1(b, p + 4, p + 8), s = p + 8, e = Math.min(s + len, b.length);
      if (tp === 'tEXt' || tp === 'iTXt') o.txt += ' ' + utf8(b, s, e);
      else if (tp === 'zTXt') { var z = idx(b, '\0', s); if (z > -1 && z < e) { o.txt += ' ' + latin1(b, s, z); var d = await inflar(b.subarray(z + 2, e)); if (d) o.txt += ' ' + utf8(d, 0, d.length); } }
      else if (tp === 'eXIf') o.exif = lerExif(b, s, e);
      else if (tp === 'caBX') o.jumbf = true;
      else if (tp === 'IEND') break;
      p = e + 4;
    }
    return o;
  }
  function lerWEBP(b) {
    var o = { tipo: 'webp', txt: '' }, p = 12;
    while (p + 8 <= b.length) {
      var tp = latin1(b, p, p + 4), len = b[p + 4] | (b[p + 5] << 8) | (b[p + 6] << 16) | (b[p + 7] << 24), s = p + 8, e = Math.min(s + len, b.length);
      if (tp === 'EXIF') { var q = latin1(b, s, s + 6).indexOf('Exif') === 0 ? s + 6 : s; o.exif = lerExif(b, q, e); o.txt += ' ' + latin1(b, s, e); }
      else if (tp === 'XMP ') o.txt += ' ' + utf8(b, s, e);
      p = e + (len & 1);
    }
    return o;
  }

  /* ---------------- descodificar imagem ---------------- */
  async function descodificar(blob) {
    var bmp = null;
    try { bmp = await createImageBitmap(blob, { imageOrientation: 'none', colorSpaceConversion: 'none', premultiplyAlpha: 'none' }); }
    catch (e) { try { bmp = await createImageBitmap(blob); } catch (e2) { bmp = null; } }
    if (!bmp) {
      bmp = await new Promise(function (ok, er) {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () { ok(im); }; im.onerror = function () { er(new Error('Não foi possível abrir a imagem.')); };
        im.src = u;
      });
    }
    var w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight, f = 1;
    if (w0 * h0 > MAXPX) f = Math.sqrt(MAXPX / (w0 * h0));
    var w = Math.max(1, Math.round(w0 * f)), h = Math.max(1, Math.round(h0 * f));
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(bmp, 0, 0, w, h);
    return { cv: cv, w: w, h: h, w0: w0, h0: h0, reduzida: f < 1, dados: cx.getImageData(0, 0, w, h).data };
  }
  function cinzento(d, n) { var Y = new Float32Array(n); for (var i = 0, j = 0; i < n; i++, j += 4) Y[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]; return Y; }


  /* ---------------- dupla compressão desalinhada (cortada/colada e guardada outra vez) ----------------
     Se a imagem já foi JPEG antes, foi cortada (ou montada) e voltou a ser guardada, a grelha 8x8 antiga fica
     escondida noutra posição. Procura essa grelha antiga nas 63 posições possíveis. */
  var COS = (function () { var c = []; for (var u = 0; u < 5; u++) { c[u] = []; for (var x = 0; x < 8; x++) c[u][x] = (u ? Math.sqrt(2 / 8) : Math.sqrt(1 / 8)) * Math.cos((2 * x + 1) * u * Math.PI / 16); } return c; })();
  var FREQ = []; for (var fu = 0; fu < 5; fu++) for (var fv = 0; fv < 5; fv++) if (fu + fv > 0 && fu + fv <= 6) FREQ.push([fu, fv]);
  function aleat(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function pontuacaoGrelha(Y, w, h, ox, oy, nb) {
    var rnd = aleat(1 + ox * 8 + oy), bx = Math.floor((w - ox - 8) / 8), by = Math.floor((h - oy - 8) / 8);
    if (bx < 4 || by < 4) return 0;
    var cols = FREQ.map(function () { return []; }), B = new Float64Array(64), T = new Float64Array(40);
    for (var t = 0, tent = 0; t < nb && tent < nb * 4; tent++) {
      var x0 = ox + 8 * Math.floor(rnd() * bx), y0 = oy + 8 * Math.floor(rnd() * by), m = 0, m2 = 0;
      for (var yy = 0; yy < 8; yy++) for (var xx = 0; xx < 8; xx++) { var v = Y[(y0 + yy) * w + x0 + xx] - 128; B[yy * 8 + xx] = v; m += v; m2 += v * v; }
      m /= 64; if (m2 / 64 - m * m < 4) continue;      // bloco liso não serve
      t++;
      for (var u = 0; u < 5; u++) for (var yy2 = 0; yy2 < 8; yy2++) { var sm = 0; for (var x = 0; x < 8; x++) sm += COS[u][x] * B[yy2 * 8 + x]; T[u * 8 + yy2] = sm; }
      for (var f = 0; f < FREQ.length; f++) { var uu = FREQ[f][1], vv = FREQ[f][0], c = 0; for (var y = 0; y < 8; y++) c += COS[vv][y] * T[uu * 8 + y]; cols[f].push(c); }
    }
    var tot = 0;
    for (f = 0; f < FREQ.length; f++) {
      var cs = cols[f], melhor = 0;
      for (var q = 2; q <= 24; q++) {
        var re = 0, im = 0, n = 0, lim = 0.75 * q;
        for (var i = 0; i < cs.length; i++) { var a = cs[i]; if (a >= lim || a <= -lim) { var ang = 2 * Math.PI * a / q; re += Math.cos(ang); im += Math.sin(ang); n++; } }
        if (n >= 60) { var sc = Math.sqrt(re * re + im * im) / n; if (sc > melhor) melhor = sc; }
      }
      tot += melhor;
    }
    return tot / FREQ.length;
  }
  function grelhaAntiga(Y, w, h) {
    // usa o centro da imagem (até 1400x1400) para ser rápido no telemóvel
    var cw = Math.min(w, 1400), ch = Math.min(h, 1400), x0 = Math.floor((w - cw) / 16) * 8, y0 = Math.floor((h - ch) / 16) * 8;
    var Z = new Float32Array(cw * ch); for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) Z[y * cw + x] = Y[(y0 + y) * w + x0 + x];
    var S = [], outros = [];
    for (var oy = 0; oy < 8; oy++) for (var ox = 0; ox < 8; ox++) { var sc = pontuacaoGrelha(Z, cw, ch, ox, oy, 2500); S.push({ ox: ox, oy: oy, s: sc }); if (ox || oy) outros.push(sc); }
    var md = mediana(outros), mad = mediana(outros.map(function (v) { return Math.abs(v - md); })) || 0.005;
    var melhor = S.filter(function (z) { return (z.ox || z.oy) && !((z.ox === 0 || z.ox === 4) && (z.oy === 0 || z.oy === 4)); }).sort(function (a, b) { return b.s - a.s; })[0];
    return { melhor: melhor, s00: S[0].s, md: md, mad: mad, achou: melhor && melhor.s > md + Math.max(0.08, 8 * mad) };
  }

  /* ---------------- regiões ligadas ---------------- */
  function regioes(flag, gw, gh, minimo) {
    var vis = new Uint8Array(gw * gh), out = [];
    for (var i = 0; i < gw * gh; i++) {
      if (!flag[i] || vis[i]) continue;
      var pilha = [i], cel = []; vis[i] = 1;
      while (pilha.length) {
        var c = pilha.pop(); cel.push(c);
        var cx = c % gw, cy = (c / gw) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(function (d) {
          var nx = cx + d[0], ny = cy + d[1]; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) return;
          var k = ny * gw + nx; if (flag[k] && !vis[k]) { vis[k] = 1; pilha.push(k); }
        });
      }
      if (cel.length >= minimo) out.push(cel);
    }
    return out;
  }
  function mediana(a) { if (!a.length) return 0; var s = Array.prototype.slice.call(a).sort(function (x, y) { return x - y; }); return s[s.length >> 1]; }

  /* ---------------- análise dos pixéis ---------------- */
  async function analisarPixeis(blob, im, eJPEG, sinais, mapa) {
    var w = im.w, h = im.h, n = w * h, Y = cinzento(im.dados, n);
    var gw = Math.ceil(w / CEL), gh = Math.ceil(h / CEL), G = new Float32Array(gw * gh), M = new Float32Array(gw * gh), cnt = new Float32Array(gw * gh);
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      var i = y * w + x, c = ((y / CEL) | 0) * gw + ((x / CEL) | 0);
      G[c] += Math.abs(Y[i + 1] - Y[i - 1]) + Math.abs(Y[i + w] - Y[i - w]); M[c] += Y[i]; cnt[c]++;
    }
    for (var k = 0; k < gw * gh; k++) if (cnt[k]) { G[k] /= cnt[k]; M[k] /= cnt[k]; }
    var texturadas = 0; for (k = 0; k < gw * gh; k++) if (G[k] > 4) texturadas++;

    /* 1) grelha JPEG antiga escondida noutra posição: foi cortada/montada e guardada de novo */
    if (eJPEG && !im.reduzida) {
      var ga = grelhaAntiga(Y, w, h);
      if (window.BBDEBUG) window.BBDEBUG.grelha = ga;
      if (ga.achou) sinais.push({ p: 4, t: 'A imagem já tinha sido guardada antes e depois foi cortada ou montada e guardada outra vez (grelha antiga na posição ' + ga.melhor.ox + ',' + ga.melhor.oy + ').' });
    }

    /* 2) ELA: zonas com nível de compressão diferente */
    if (eJPEG && !im.reduzida) {
      var re = await new Promise(function (ok) { im.cv.toBlob(ok, 'image/jpeg', 0.9); });
      if (re) {
        var im2 = await descodificar(re), d1 = im.dados, d2 = im2.dados, E = new Float32Array(gw * gh);
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          i = (y * w + x) * 4; c = ((y / CEL) | 0) * gw + ((x / CEL) | 0);
          E[c] += Math.abs(0.299 * (d1[i] - d2[i]) + 0.587 * (d1[i + 1] - d2[i + 1]) + 0.114 * (d1[i + 2] - d2[i + 2]));
        }
        var rat = [], RA = new Float32Array(gw * gh);
        for (k = 0; k < gw * gh; k++) if (cnt[k]) { E[k] /= cnt[k]; RA[k] = E[k] / (Math.sqrt(G[k]) + 1); if (G[k] > 4) rat.push(RA[k]); }
        var md = mediana(rat), mad = mediana(rat.map(function (v) { return Math.abs(v - md); })) || 0.01;
        var fe = new Uint8Array(gw * gh);
        for (k = 0; k < gw * gh; k++) if (G[k] > 4 && RA[k] > md + 7 * mad && E[k] > 0.8 && M[k] > 8 && M[k] < 247) fe[k] = 1;
        var rge = regioes(fe, gw, gh, 6), ce = 0; rge.forEach(function (r) { ce += r.length; });
        if (rge.length && ce < texturadas * 0.25) {
          sinais.push({ p: 4, t: 'Há ' + rge.length + ' zona(s) com nível de compressão diferente do resto (ELA): texto ou partes podem ter sido trocados (marcadas a vermelho).' });
          rge.forEach(function (r) { r.forEach(function (c) { mapa.push({ x: (c % gw) * CEL, y: ((c / gw) | 0) * CEL, w: CEL, h: CEL, cor: 'v' }); }); });
        }
      }
    }

    /* 3) zonas lisas demais (apagadas ou pintadas digitalmente) */
    var N = new Float32Array(gw * gh), lis = [];
    for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
      i = y * w + x; c = ((y / CEL) | 0) * gw + ((x / CEL) | 0);
      N[c] += Math.abs(4 * Y[i] - Y[i - 1] - Y[i + 1] - Y[i - w] - Y[i + w]);
    }
    // limite de "papel liso" relativo à própria foto (papel fotografado tem grão: não pode ser um número fixo)
    var gp = []; for (k = 0; k < gw * gh; k++) if (cnt[k] > CEL * CEL * 0.6 && M[k] > 20 && M[k] < 235) gp.push(G[k]);
    gp.sort(function (a, b) { return a - b; });
    var GL = Math.max(6, Math.min(16, (gp.length ? gp[Math.floor(gp.length * 0.2)] : 0) * 1.6));
    for (k = 0; k < gw * gh; k++) { if (cnt[k]) N[k] /= cnt[k]; if (cnt[k] > CEL * CEL * 0.6 && G[k] < GL && M[k] > 20 && M[k] < 235) lis.push(N[k]); }
    var n0 = mediana(lis);
    if (lis.length > 40 && n0 > 1.2) {
      var fz = new Uint8Array(gw * gh);
      for (k = 0; k < gw * gh; k++) if (cnt[k] > CEL * CEL * 0.6 && G[k] < GL && M[k] > 20 && M[k] < 235 && N[k] < n0 * 0.2) fz[k] = 1;
      var valida = function (k) { return cnt[k] > CEL * CEL * 0.6 && G[k] < GL && M[k] > 20 && M[k] < 235; };
      // só conta se à volta houver papel com grão normal (num documento escaneado todo branco não conta)
      var rgz = regioes(fz, gw, gh, 6).filter(function (r) {
        var dentro = {}; r.forEach(function (c) { dentro[c] = 1; });
        var anel = {}, vals = [];
        r.forEach(function (c) {
          var cx2 = c % gw, cy2 = (c / gw) | 0;
          for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
            var nx = cx2 + dx, ny = cy2 + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
            var kk = ny * gw + nx; if (dentro[kk] || anel[kk]) continue; anel[kk] = 1;
            if (valida(kk)) vals.push(N[kk]);
          }
        });
        return vals.length >= 6 && mediana(vals) >= n0 * 0.5;
      }), cz = 0; rgz.forEach(function (r) { cz += r.length; });
      if (rgz.length && cz < lis.length * 0.3) {
        sinais.push({ p: 3, t: 'Há ' + rgz.length + ' zona(s) lisas demais, sem o grão natural da foto: algo pode ter sido apagado ou pintado por cima (marcadas a amarelo).' });
        rgz.forEach(function (r) { r.forEach(function (c) { mapa.push({ x: (c % gw) * CEL, y: ((c / gw) | 0) * CEL, w: CEL, h: CEL, cor: 'a' }); }); });
      }
    }

    /* 4) cópia-colagem dentro da mesma imagem (carimbos, assinaturas, números repetidos) */
    copiaColagem(im, sinais, mapa);

    /* 5) impressão digital (dHash) */
    var cv9 = document.createElement('canvas'); cv9.width = 9; cv9.height = 8;
    var c9 = cv9.getContext('2d'); c9.imageSmoothingQuality = 'high'; c9.drawImage(im.cv, 0, 0, 9, 8);
    var d9 = c9.getImageData(0, 0, 9, 8).data, bits = '';
    for (y = 0; y < 8; y++) for (x = 0; x < 8; x++) { var a1 = (y * 9 + x) * 4, a2 = a1 + 4; bits += (d9[a1] + d9[a1 + 1] + d9[a1 + 2]) > (d9[a2] + d9[a2 + 1] + d9[a2 + 2]) ? '1' : '0'; }
    var hx = ''; for (k = 0; k < 64; k += 4) hx += parseInt(bits.slice(k, k + 4), 2).toString(16);
    return hx;
  }

  function copiaColagem(im, sinais, mapa) {
    var L = 720, f = Math.min(1, L / Math.max(im.w, im.h)), w = Math.max(16, Math.round(im.w * f)), h = Math.max(16, Math.round(im.h * f));
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im.cv, 0, 0, w, h);
    var Y = cinzento(cx.getImageData(0, 0, w, h).data, w * h);
    var B = 16, S = 1, Q = 9, mapaH = {}, blocos = [], gx = w - B + 1;
    // imagem integral: soma de qualquer quadrado 4x4 num instante
    var W1 = w + 1, I = new Float64Array(W1 * (h + 1));
    for (var yy0 = 0; yy0 < h; yy0++) { var lin = 0; for (var xx0 = 0; xx0 < w; xx0++) { lin += Y[yy0 * w + xx0]; I[(yy0 + 1) * W1 + xx0 + 1] = I[yy0 * W1 + xx0 + 1] + lin; } }
    function s4(x, y) { return (I[(y + 4) * W1 + x + 4] - I[y * W1 + x + 4] - I[(y + 4) * W1 + x] + I[y * W1 + x]) / 16; }
    var v = new Array(16);
    for (var y = 0; y + B <= h; y += S) for (var x = 0; x + B <= w; x += S) {
      var soma = 0, soma2 = 0;
      for (var c = 0; c < 16; c++) { var t = s4(x + (c & 3) * 4, y + (c >> 2) * 4); v[c] = t; soma += t; soma2 += t * t; }
      var mu = soma / 16, dp = Math.sqrt(Math.max(0, soma2 / 16 - mu * mu));
      if (dp < 9) continue;                         // fundo liso: ignora
      var key = ''; for (c = 0; c < 16; c++) key += Math.round((v[c] - mu) / Q) + ',';
      var id = blocos.length; blocos.push({ x: x, y: y, gi: y * gx + x });
      (mapaH[key] = mapaH[key] || []).push(id);
    }
    var votos = {};
    Object.keys(mapaH).forEach(function (k) {
      var l = mapaH[k]; if (l.length < 2 || l.length > 8) return;     // padrões muito repetidos não contam
      for (var a = 0; a < l.length; a++) for (var b = a + 1; b < l.length; b++) {
        var p = blocos[l[a]], q = blocos[l[b]], dx = q.x - p.x, dy = q.y - p.y;
        if (dx * dx + dy * dy < 40 * 40) continue;
        if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; var tt = p; p = q; q = tt; }
        var kk = dx + ',' + dy;
        (votos[kk] = votos[kk] || []).push([p, q]);
      }
    });
    var achou = 0, usados = {};
    var ordem = Object.keys(votos).sort(function (a, b) { return votos[b].length - votos[a].length; });
    if (window.BBDEBUG) window.BBDEBUG.votos = ordem.slice(0, 15).map(function (k) { return [k, votos[k].length]; });
    ordem.forEach(function (k) {
      if (usados[k] || votos[k].length < 25) return;
      // junta os deslocamentos vizinhos (±1 px) do mesmo carimbo
      var xy = k.split(',').map(Number), pares = [];
      for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
        var k2 = (xy[0] + ox) + ',' + (xy[1] + oy);
        if (votos[k2] && !usados[k2]) { pares = pares.concat(votos[k2]); usados[k2] = 1; }
      }
      if (pares.length < 100) return;
      // só conta um bloco contínuo grande (um carimbo ou assinatura), não letras soltas espalhadas
      var por = {}; pares.forEach(function (pq) { por[pq[0].gi] = pq; });
      var vis = {}, melhor = [];
      Object.keys(por).forEach(function (g0) {
        if (vis[g0]) return;
        var pilha = [+g0], comp = []; vis[g0] = 1;
        while (pilha.length) {
          var g = pilha.pop(); comp.push(por[g]);
          for (var dy2 = -6; dy2 <= 6; dy2++) for (var dx2 = -6; dx2 <= 6; dx2++) { var n2 = g + dy2 * gx + dx2; if (por[n2] && !vis[n2]) { vis[n2] = 1; pilha.push(n2); } }
        }
        if (comp.length > melhor.length) melhor = comp;
      });
      if (melhor.length < 80) return;
      var xs = melhor.map(function (p) { return p[0].x; }), ys = melhor.map(function (p) { return p[0].y; });
      var lx = Math.max.apply(null, xs) - Math.min.apply(null, xs), ly = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      if (window.BBDEBUG) (window.BBDEBUG.comp = window.BBDEBUG.comp || []).push([k, pares.length, melhor.length, lx, ly]);
      if (lx < 20 || ly < 40 || lx > w * 0.6 || ly > h * 0.6) return;   // mais alto que uma linha de texto (palavras repetidas não contam)
      achou++;
      melhor.forEach(function (pq) { pq.forEach(function (b) { mapa.push({ x: b.x / f, y: b.y / f, w: B / f, h: B / f, cor: 'r' }); }); });
    });
    if (achou) sinais.push({ p: 7, t: 'Há partes copiadas e coladas dentro do próprio documento (' + achou + ' cópia(s)): carimbo, assinatura ou números duplicados (marcadas a roxo).' });
  }

  /* ---------------- metadados de imagem ---------------- */
  var DIM_IA = ['1024x1024', '1024x1536', '1536x1024', '1024x1792', '1792x1024', '896x1152', '1152x896', '832x1216', '1216x832', '768x1344', '1344x768',
    '640x1536', '1536x640', '2048x2048', '1456x816', '816x1456', '1232x928', '928x1232', '2912x1632', '1632x2912', '2048x1152', '1152x2048', '512x512', '768x768', '1280x1280', '1664x928', '928x1664'];
  var DIM_ECRA = ['1080x1920', '1080x2340', '1080x2400', '1170x2532', '1179x2556', '1284x2778', '1290x2796', '1125x2436', '1242x2688', '750x1334', '828x1792', '720x1600', '1440x3200', '1440x3088', '1080x2412', '1220x2712', '1260x2800'];
  function metadadosImagem(o, w, h, sinais, info) {
    var ex = o.exif || {}, txt = o.txt || '';
    var ia = procurar(IA, txt + ' ' + (ex.programa || ''));
    if (o.jumbf || /c2pa|contentcredentials|jumbf/i.test(txt)) {
      info.push('Tem credenciais de conteúdo (C2PA): o ficheiro regista os programas por onde passou.');
      if (/trainedAlgorithmicMedia|generative|genAI|ai[_ ]generated/i.test(txt)) ia.push('C2PA indica conteúdo gerado por IA');
    }
    if (/\bparameters\b[\s\S]{0,40}(Steps|Sampler|CFG|Seed)|"prompt"\s*:|negative_prompt|"workflow"\s*:/i.test(txt)) ia.push('instruções de geração (prompt) guardadas no ficheiro');
    if (ia.length) sinais.push({ p: 10, t: 'O ficheiro tem marcas de imagem criada ou alterada por IA: ' + ia.slice(0, 4).join(', ') + '.' });
    var ed = procurar(EDITORES, txt + ' ' + (ex.programa || '') + ' ' + (o.comentario || ''));
    if (o.photoshopIRB && ed.indexOf('Photoshop') < 0) ed.push('Photoshop/Adobe');
    if (ed.length) sinais.push({ p: 4, t: 'Passou por programa de edição: ' + ed.slice(0, 4).join(', ') + '.' });
    if (ex.marca || ex.modelo) info.push('Câmara: ' + [ex.marca, ex.modelo].filter(Boolean).join(' ') + (ex.dataOriginal ? ' · foto tirada a ' + ex.dataOriginal : ''));
    if (ex.programa && !ed.length) info.push('Programa registado: ' + ex.programa);
    if (ex.dataOriginal && ex.dataAlterada) {
      var t1 = Date.parse(ex.dataOriginal.replace(/^(\d+):(\d+):(\d+)/, '$1-$2-$3')), t2 = Date.parse(ex.dataAlterada.replace(/^(\d+):(\d+):(\d+)/, '$1-$2-$3'));
      if (!isNaN(t1) && !isNaN(t2) && Math.abs(t2 - t1) > 120000) sinais.push({ p: 2, t: 'Foto tirada a ' + ex.dataOriginal + ' mas alterada a ' + ex.dataAlterada + '.' });
    }
    var semCamara = !ex.marca && !ex.modelo && !ex.dataOriginal;
    var dim = w + 'x' + h;
    if (semCamara && DIM_IA.indexOf(dim) > -1) sinais.push({ p: 3, t: 'Tamanho típico de imagens geradas por IA (' + dim + ') e sem dados de câmara.' });
    if (o.tipo === 'png' && semCamara) {
      if (DIM_ECRA.indexOf(dim) > -1 || DIM_ECRA.indexOf(h + 'x' + w) > -1) sinais.push({ p: 3, t: 'É uma captura de ecrã (' + dim + '), não uma foto nem digitalização do documento.' });
      else sinais.push({ p: 1, t: 'Imagem PNG sem dados de câmara: foi exportada por um programa ou app, não tirada diretamente.' });
    } else if (o.tipo === 'jpeg' && semCamara) {
      info.push('Sem dados de câmara (normal se veio pelo WhatsApp ou foi reenviada; também acontece quando é editada).');
    }
    if (o.tipo === 'jpeg' && o.dqt && o.dqt[0]) {
      var q = qualidade(o.dqt[0]);
      if (q) info.push('Qualidade de compressão ≈ ' + q.q + (q.padrao ? ' (tabela padrão de programa/app)' : ' (tabela própria de câmara/telemóvel)'));
    }
  }

  /* ---------------- PDF ---------------- */
  function dataPDF(s) { var m = /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(s || ''); if (!m) return null; return Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1, +m[4] || 0, +m[5] || 0, +m[6] || 0); }
  function textoPDF(s) {
    if (!s) return '';
    s = s.trim();
    if (/^<[0-9a-f\s]+>$/i.test(s)) {
      var hx = s.replace(/[<>\s]/g, ''), out = '';
      if (/^feff/i.test(hx)) { for (var i = 4; i + 4 <= hx.length; i += 4) out += String.fromCharCode(parseInt(hx.substr(i, 4), 16)); }
      else for (var j = 0; j + 2 <= hx.length; j += 2) out += String.fromCharCode(parseInt(hx.substr(j, 2), 16));
      return out;
    }
    s = s.replace(/^\(|\)$/g, '');
    if (s.charCodeAt(0) === 0xFE && s.charCodeAt(1) === 0xFF) { var r = ''; for (var k = 2; k + 1 < s.length; k += 2) r += String.fromCharCode((s.charCodeAt(k) << 8) | s.charCodeAt(k + 1)); return r; }
    return s.replace(/\\([()\\])/g, '$1');
  }
  async function analisarPDF(b, sinais, info) {
    var T = latin1(b), res = { imagem: null };
    function campo(nome) {
      var m = new RegExp('/' + nome + '\\s*(\\((?:\\\\.|[^\\\\)])*\\)|<[0-9A-Fa-f\\s]+>)').exec(T);
      var x = new RegExp('<(?:pdf|xmp):' + (nome === 'Creator' ? 'CreatorTool' : nome) + '>([^<]*)<').exec(T);
      return (m ? textoPDF(m[1]) : '') || (x ? x[1] : '');
    }
    var prod = campo('Producer'), cria = campo('Creator');
    if (prod || cria) info.push('Feito com: ' + [cria, prod].filter(Boolean).join(' · '));
    var ia = procurar(IA, prod + ' ' + cria);
    if (ia.length) sinais.push({ p: 10, t: 'O PDF tem marcas de IA: ' + ia.join(', ') + '.' });
    var ed = contem(PDF_EDIT, prod + ' ' + cria);
    if (ed) sinais.push({ p: 3, t: 'O PDF passou por um editor de PDF (' + ed + '): pode ter sido alterado.' });
    var dg = contem(PDF_DIGITAL, prod + ' ' + cria), sc = contem(PDF_SCAN, prod + ' ' + cria);
    if (dg && !sc) sinais.push({ p: 3, t: 'O PDF foi feito num programa de escrever/desenhar (' + dg + '), não é digitalização do documento original nem foi emitido por sistema oficial.' });
    if (sc) info.push('Digitalizado com app de digitalização (' + sc + ').');

    var eofs = (T.match(/%%EOF/g) || []).length;
    if (/\/Linearized/.test(T.slice(0, 2048))) eofs--;
    if (eofs > 1) sinais.push({ p: 3, t: 'O PDF foi gravado ' + eofs + ' vezes: foi alterado depois de criado.' });
    var dc = dataPDF(campo('CreationDate')), dm = dataPDF(campo('ModDate'));
    if (dc && dm && Math.abs(dm - dc) > 60000) sinais.push({ p: 2, t: 'Data de criação (' + new Date(dc).toISOString().slice(0, 16).replace('T', ' ') + ') diferente da data de alteração (' + new Date(dm).toISOString().slice(0, 16).replace('T', ' ') + ').' });
    if (/\/Subtype\s*\/FreeText/.test(T)) sinais.push({ p: 4, t: 'O PDF tem caixas de texto acrescentadas por cima (anotações).' });
    else if (/\/Subtype\s*\/(Square|Ink|Stamp|Highlight)/.test(T)) sinais.push({ p: 2, t: 'O PDF tem marcas/desenhos acrescentados por cima (anotações).' });

    var fontes = {}; (T.match(/\/BaseFont\s*\/([A-Za-z0-9+\-_,.#]+)/g) || []).forEach(function (f) {
      var nm = f.replace(/\/BaseFont\s*\//, '').replace(/^[A-Z]{6}\+/, '').replace(/[-,](Bold|Italic|Oblique|Regular|BoldItalic|Medium|Light).*$/i, '');
      fontes[nm] = 1;
    });
    var nf = Object.keys(fontes).length;
    if (nf) info.push('Tipos de letra: ' + Object.keys(fontes).slice(0, 6).join(', ') + (nf > 6 ? '…' : ''));

    // objetos: imagens e conteúdo das páginas
    var reObj = /(\d+)\s+\d+\s+obj\b/g, m, imagens = [], textoVisivel = 0, textoOculto = 0, conteudos = 0, lidos = 0;
    while ((m = reObj.exec(T))) {
      var ini = m.index + m[0].length, st = T.indexOf('stream', ini), fim = T.indexOf('endobj', ini);
      if (fim < 0) break;
      if (st < 0 || st > fim) continue;
      var dict = T.slice(ini, st);
      var ds = st + 6; if (T[ds] === '\r') ds++; if (T[ds] === '\n') ds++;
      var lm = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict), de = lm ? ds + (+lm[1]) : T.indexOf('endstream', ds);
      if (de < ds || de > b.length) de = T.indexOf('endstream', ds);
      if (/\/Subtype\s*\/Image/.test(dict)) {
        var wi = +((/\/Width\s+(\d+)/.exec(dict) || [])[1] || 0), hi = +((/\/Height\s+(\d+)/.exec(dict) || [])[1] || 0);
        var fli = filtros(dict);
        if (fli.indexOf('DCTDecode') > -1 || fli.indexOf('DCT') > -1) imagens.push({ s: ds, e: de, px: wi * hi, w: wi, h: hi, fl: fli });
        else imagens.push({ px: wi * hi, outra: true, w: wi, h: hi });
        reObj.lastIndex = fim; continue;
      }
      if (/\/Subtype\s*\/(Type1C|CIDFontType0C|OpenType)|\/Length1|\/Length2|\/Type\s*\/(XRef|ObjStm|EmbeddedFile|Metadata)/.test(dict)) { reObj.lastIndex = fim; continue; }
      if (lidos < 40 && de - ds < 6e6) {
        var dsc = await descomprimir(b.subarray(ds, de), filtros(dict)), tx = dsc && !dsc.jpeg ? latin1(dsc.b) : '';
        lidos++;
        if (tx && /\bBT\b[\s\S]*?\bET\b/.test(tx)) {
          conteudos++;
          var blocos = tx.match(/\bBT\b[\s\S]*?\bET\b/g) || [];
          blocos.forEach(function (bl) {
            if (!/\bT[jJ]\b|'|"/.test(bl)) return;
            if (/\b3\s+Tr\b/.test(bl) || /\b7\s+Tr\b/.test(bl)) textoOculto++; else textoVisivel++;
          });
        }
      }
      reObj.lastIndex = fim;
    }
    var grande = imagens.filter(function (x) { return x.px >= 400000; });
    if (grande.length) {
      if (textoVisivel > 0) sinais.push({ p: 4, t: 'Há texto digital visível escrito por cima da digitalização (' + textoVisivel + ' bloco(s)): nomes, números ou datas podem ter sido trocados.' });
      else if (textoOculto > 0) info.push('Tem texto invisível de reconhecimento (OCR): normal em apps de digitalização.');
      if (nf >= 3 && textoVisivel > 0) sinais.push({ p: 2, t: 'Usa ' + nf + ' tipos de letra diferentes por cima da digitalização.' });
      var jpg = grande.filter(function (x) { return !x.outra && x.s != null; }).sort(function (a, c) { return c.px - a.px; })[0];
      if (jpg) { var dj = await descomprimir(b.subarray(jpg.s, jpg.e), jpg.fl); if (dj && dj.jpeg) res.imagem = new Blob([dj.b], { type: 'image/jpeg' }); }
      info.push('Tem ' + grande.length + ' imagem(ns) digitalizada(s)' + (jpg ? ' (a maior foi analisada abaixo)' : ''));
    } else if (!imagens.length) {
      info.push('O PDF não tem imagem digitalizada: é um documento só digital (texto). Confirme o número no registo oficial.');
    }
    return res;
  }

  /* ---------------- desenho do mapa ---------------- */
  function desenharMapa(im, mapa) {
    var L = 1100, f = Math.min(1, L / Math.max(im.w, im.h)), w = Math.round(im.w * f), h = Math.round(im.h * f);
    var a = document.createElement('canvas'); a.width = w; a.height = h;
    var ca = a.getContext('2d'); ca.drawImage(im.cv, 0, 0, w, h);
    var original = a.toDataURL('image/jpeg', 0.85);
    if (!mapa.length) return { original: original, mapa: null };
    ca.fillStyle = 'rgba(0,0,0,0.25)'; ca.fillRect(0, 0, w, h);
    var cores = { v: 'rgba(255,30,30,0.55)', a: 'rgba(255,200,0,0.55)', r: 'rgba(170,60,255,0.55)' };
    mapa.forEach(function (z) { ca.fillStyle = cores[z.cor] || cores.v; ca.fillRect(z.x * f, z.y * f, Math.max(2, z.w * f), Math.max(2, z.h * f)); });
    return { original: original, mapa: a.toDataURL('image/jpeg', 0.85) };
  }

  /* ---------------- análise completa ---------------- */
  async function analisarImagem(blob, b, sinais, info, prefixo) {
    var o = null;
    if (b[0] === 0xFF && b[1] === 0xD8) o = lerJPEG(b);
    else if (b[0] === 0x89 && b[1] === 0x50) o = await lerPNG(b);
    else if (latin1(b, 0, 4) === 'RIFF' && latin1(b, 8, 12) === 'WEBP') o = lerWEBP(b);
    else o = { tipo: 'outro', txt: latin1(b, 0, Math.min(b.length, 65536)) };
    var s0 = sinais.length;
    var im = await descodificar(blob);
    metadadosImagem(o, im.w0, im.h0, sinais, info);
    var assin = assinaturaJPEG(o);
    identificarApp(assin, sinais, info);
    if (o.tipo === 'jpeg') await compararMiniatura(b, o, im, sinais, info);
    var mapa = [];
    var dh = await analisarPixeis(blob, im, o.tipo === 'jpeg', sinais, mapa);
    if (im.reduzida) info.push('Imagem muito grande: a análise de compressão (ELA) não foi feita.');
    if (prefixo) for (var i = s0; i < sinais.length; i++) sinais[i].t = prefixo + sinais[i].t;
    var d = desenharMapa(im, mapa);
    return { dhash: dh, original: d.original, mapa: d.mapa, w: im.w0, h: im.h0, assinatura: assin };
  }

  async function analisar(blob, nome) {
    var buf = await blob.arrayBuffer(), b = new Uint8Array(buf), sinais = [], info = [], r = { dhash: '', original: null, mapa: null };
    var ext = String(nome || '').split('.').pop().toLowerCase();
    var tipo = latin1(b, 0, 5) === '%PDF-' ? 'pdf' : (b[0] === 0xFF && b[1] === 0xD8) ? 'jpeg' : (b[0] === 0x89 && b[1] === 0x50) ? 'png' : (latin1(b, 8, 12) === 'WEBP') ? 'webp' : 'outro';
    var esperado = { pdf: ['pdf'], jpeg: ['jpg', 'jpeg', 'jfif'], png: ['png'], webp: ['webp'] }[tipo];
    if (esperado && ext && ext !== nome && esperado.indexOf(ext) < 0 && ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'heic'].indexOf(ext) > -1)
      sinais.push({ p: 2, t: 'O nome diz .' + ext + ' mas o ficheiro é ' + tipo.toUpperCase() + ': foi convertido ou disfarçado.' });
    try {
      if (tipo === 'pdf') {
        var p = await analisarPDF(b, sinais, info);
        if (p.imagem) {
          var bi = new Uint8Array(await p.imagem.arrayBuffer());
          r = await analisarImagem(p.imagem, bi, sinais, info, 'Imagem dentro do PDF: ');
        }
      } else if (tipo === 'outro') {
        info.push('Formato que não dá para analisar a fundo (ex.: HEIC). Peça foto em JPG ou PDF.');
      } else {
        r = await analisarImagem(blob, b, sinais, info, '');
      }
    } catch (e) { info.push('Parte da análise falhou: ' + (e && e.message || e)); }
    var pontos = sinais.reduce(function (a, s) { return a + s.p; }, 0);
    sinais.sort(function (a, c) { return c.p - a.p; });
    return {
      tipo: tipo, pontos: pontos, nivel: pontos >= 7 ? 'suspeito' : pontos >= 3 ? 'atencao' : 'ok',
      sinais: sinais, info: info, dhash: r.dhash || '', sha: await sha256(buf),
      original: r.original, mapa: r.mapa, largura: r.w, altura: r.h, assinatura: r.assinatura || null
    };
  }

  function distancia(a, b) {
    if (!a || !b || a.length !== b.length) return 99;
    var d = 0; for (var i = 0; i < a.length; i++) { var x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } }
    return d;
  }

  /* cartão com o resultado (HTML) */
  var NIV = { ok: ['#2e9d62', '✅ Sem sinais fortes de falsificação'], atencao: ['#d69e00', '⚠️ Atenção: rever com cuidado'], suspeito: ['#e53950', '🚨 Suspeito: provável edição ou falsificação'] };
  function cartao(r) {
    var n = NIV[r.nivel], h = '<div class="bbv" style="border:1px solid ' + n[0] + ';border-radius:12px;padding:10px;margin:8px 0;background:#0005">';
    h += '<b style="color:' + n[0] + '">' + n[1] + '</b> <small style="color:#9a9aa2">(' + r.pontos + ' pontos)</small>';
    if (r.sinais.length) h += '<ul style="margin:8px 0 0;padding-left:18px">' + r.sinais.map(function (s) { return '<li style="margin:4px 0;color:' + (s.p >= 4 ? '#ff8a9a' : '#ffd36b') + '">' + esc(s.t) + '</li>'; }).join('') + '</ul>';
    if (r.info.length) h += '<details style="margin-top:6px"><summary style="color:#9a9aa2;font-size:13px">Detalhes do ficheiro</summary><ul style="margin:6px 0 0;padding-left:18px;color:#bbb;font-size:13px">' + r.info.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
    if (r.original) {
      h += '<div style="margin-top:8px">' + (r.mapa ? '<button type="button" class="bbv-t" style="padding:7px 10px;font-size:13px;margin-bottom:6px">Mostrar documento sem marcas</button>' : '') +
        '<img class="bbv-i" src="' + (r.mapa || r.original) + '" data-a="' + (r.mapa || '') + '" data-b="' + r.original + '" style="width:100%;border-radius:8px;display:block">' +
        (r.mapa ? '<div style="font-size:12px;color:#9a9aa2;margin-top:4px">Vermelho: zonas coladas/trocadas · Amarelo: zonas apagadas/pintadas · Roxo: partes copiadas</div>' : '') + '</div>';
    }
    h += '<div style="font-size:12px;color:#9a9aa2;margin-top:6px">Isto é uma ajuda, não uma prova. Confirme sempre no registo oficial e, se houver dúvida, peça videochamada com o documento original.</div></div>';
    var d = document.createElement('div'); d.innerHTML = h;
    var bt = d.querySelector('.bbv-t'), im = d.querySelector('.bbv-i');
    if (bt) bt.onclick = function () { var ver = im.src === im.getAttribute('data-a'); im.src = ver ? im.getAttribute('data-b') : im.getAttribute('data-a'); bt.textContent = ver ? 'Mostrar zonas suspeitas' : 'Mostrar documento sem marcas'; };
    return d.firstChild;
  }

  async function assinatura(blob) {
    var b = new Uint8Array(await blob.arrayBuffer());
    if (!(b[0] === 0xFF && b[1] === 0xD8)) return null;
    return assinaturaJPEG(lerJPEG(b));
  }
  function definirAssinaturas(l) { ASSIN = Array.isArray(l) ? l : []; }

  window.BBVerificaDoc = { analisar: analisar, distancia: distancia, cartao: cartao, assinatura: assinatura, definirAssinaturas: definirAssinaturas, _t: { descodificar: descodificar, cinzento: cinzento } };
})();
