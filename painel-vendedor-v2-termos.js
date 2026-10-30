/* painel-vendedor-v2-termos.js — B-Babilônia: painel do vendedor em chinês CERTO (não só tradução automática).
   Todos os textos do painel (títulos, botões, separadores, janelas, avisos e erros) têm a tradução chinesa escrita à mão,
   com os termos usados pelos vendedores no Alibaba. Só o que é escrito pelas pessoas (nomes de produtos, de clientes,
   comentários) continua com a tradução automática. Os termos estão em zh-termos-1.js … zh-termos-3.js, carregados daqui.
   Também corrige as traduções erradas que já estavam guardadas no telemóvel. Só funciona quando o idioma é chinês.
   Não altera os outros ficheiros. */
(function () {
  if (window.__bbZhTermos) return; window.__bbZhTermos = 1;
  function prefs() { try { return JSON.parse(localStorage.getItem("bb_prefs") || "{}") || {}; } catch (e) { return {}; } }
  var L = String(prefs().idioma || navigator.language || "pt").split("-")[0].toLowerCase();
  if (L !== "zh") return;

  var PARTES = 3, E = {}, ANTIGO = {}, LETRA = /[A-Za-zÀ-ÿ]/;
  var TIPOS = {"Empresa": "企业", "Individual": "个人", "Particular": "个人", "Fabricante": "生产商", "Distribuidor": "经销商", "Loja": "店铺"};
  /* frases com números, datas e nomes */
  var NIV = { "Novo": "新手", "Bronze": "铜牌", "Prata": "银牌", "Ouro": "金牌", "Diamante": "钻石" };
  var PAPEL = { "Gerente": "经理", "Vendedor": "销售员", "Assistente de vendas": "销售助理" };
  var ABAS = { "Todas": "全部", "Todos": "全部", "Por enviar": "待发货", "Enviadas": "已发货", "Entregues": "已送达", "Aguarda pagamento": "待付款", "Canceladas": "已取消",
    "Por responder": "待回复", "Respondidas": "已回复", "Publicados": "已上架", "Ocultos": "已下架", "Sem stock": "无库存" };
  var PAISES = null;
  function pais(n) {
    if (!PAISES) {
      PAISES = {};
      try {
        var pt = new Intl.DisplayNames(["pt"], { type: "region" }), zh = new Intl.DisplayNames(["zh-Hans"], { type: "region" }), A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < 26; i++) for (var j = 0; j < 26; j++) { var c = A[i] + A[j]; try { var a = pt.of(c), b = zh.of(c); if (a && b && a !== c) PAISES[a] = b; } catch (e) {} }
      } catch (e) {}
    }
    return PAISES[n] || n;
  }
  function tempo(t) {
    var m;
    if (t === "menos de 1 hora") return "不到1小时";
    if ((m = t.match(/^~(\d+) (hora|horas)$/))) return "约" + m[1] + "小时";
    if ((m = t.match(/^~(\d+) (dia|dias)$/))) return "约" + m[1] + "天";
    return null;
  }
  var R = [
    [/^Olá, (.+)$/, function (m) { return "您好，" + m[1]; }],
    [/^\+(\d+) hoje$/, function (m) { return "今日 +" + m[1]; }],
    [/^\+(\d+) novas?$/, function (m) { return "+" + m[1] + " 条新消息"; }],
    [/^(\d+) avaliaç(?:ão|ões)$/, function (m) { return m[1] + " 条评价"; }],
    [/^(\d+) avaliaç(?:ão|ões) por responder\.$/, function (m) { return m[1] + " 条评价待回复。"; }],
    [/^(\d+) documentos? enviados?$/, function (m) { return "已提交 " + m[1] + " 份资料"; }],
    [/^(\d+) pedidos?$/, function (m) { return m[1] + " 个订单"; }],
    [/^(\d+) pedidos pagos$/, function (m) { return m[1] + " 个已付款订单"; }],
    [/^(\d+) visitas?$/, function (m) { return m[1] + " 次访问"; }],
    [/^(\d+) nos últimos 7 dias$/, function (m) { return "最近7天 " + m[1] + " 次"; }],
    [/^(\d+) nos últimos 7 dias (.+)$/, function (m) { return "最近7天 " + m[1] + " 次 " + m[2]; }],
    [/^(\d+) vendas concluídas$/, function (m) { return m[1] + " 笔已完成交易"; }],
    [/^(\d+) de (\d+) vendas concluídas$/, function (m) { return "已完成 " + m[1] + " / " + m[2] + " 笔交易"; }],
    [/^(\d+) de (\d+) dias$/, function (m) { return m[1] + " / " + m[2] + " 天"; }],
    [/^(\d+) de (\d+)$/, function (m) { return m[1] + " / " + m[2]; }],
    [/^([\d.,]+)% \(máximo ([\d.,]+)%\)$/, function (m) { return m[1] + "%（最高 " + m[2] + "%）"; }],
    [/^([\d.,]+|—)%? \(mínimo ([\d.,]+)%\)$/, function (m) { return m[1] + (m[1] === "—" ? "" : "%") + "（最低 " + m[2] + "%）"; }],
    [/^([\d.,]+|sem nota) \(mínimo ([\d.,]+)\)( · conta a partir de 3 avaliações)?$/, function (m) { return (m[1] === "sem nota" ? "暂无评分" : m[1]) + "（最低 " + m[2] + "）" + (m[3] ? " · 满3条评价后计算" : ""); }],
    [/^(\d+)% respondidas em 24 h$/, function (m) { return "24小时内回复率 " + m[1] + "%"; }],
    [/^(.+?) \(máximo (\d+) horas\)$/, function (m) { var t = tempo(m[1]) || (m[1] === "—" ? "—" : null); return t ? t + "（最多 " + m[2] + " 小时）" : null; }],
    [/^(menos de 1 hora|~\d+ (?:horas?|dias?))$/, function (m) { return tempo(m[1]); }],
    [/^1 e 2 estrelas \((\d+)\)$/, function (m) { return "1星和2星（" + m[1] + "）"; }],
    [/^(Todas|Todos|Por enviar|Enviadas|Entregues|Aguarda pagamento|Canceladas|Por responder|Respondidas|Publicados|Ocultos|Sem stock) \((\d+)\)$/, function (m) { return ABAS[m[1]] + "（" + m[2] + "）"; }],
    [/^A sua resposta · (.+)$/, function (m) { return "您的回复 · " + m[1]; }],
    [/^Ativo desde (.+)\. Taxa:$/, function (m) { return "开通日期：" + m[1] + "。费率："; }],
    [/^Tem (\d+) vendas concluídas\. Taxa:$/, function (m) { return "您已完成 " + m[1] + " 笔交易。费率："; }],
    [/^Faltam (\d+) vendas? para ativar$/, function (m) { return "还差 " + m[1] + " 笔交易即可开通"; }],
    [/^🔒 Faltam (\d+) vendas?$/, function (m) { return "🔒 还差 " + m[1] + " 笔交易"; }],
    [/^Precisa de 10 vendas concluídas para ativar o PRO\. Tem (\d+)\.$/, function (m) { return "需要完成10笔交易才能开通 PRO，您目前有 " + m[1] + " 笔。"; }],
    [/^ID da loja: (\S+?)(?: · Tipo: (.+?))?(?: · País: (.+))?$/, function (m) { return "店铺ID：" + m[1] + (m[2] ? " · 类型：" + (TIPOS[m[2]] || m[2]) : "") + (m[3] ? " · 国家：" + pais(m[3]) : ""); }],
    [/^Nível (Novo|Bronze|Prata|Ouro|Diamante)(?: · ⭐ ([\d,]+))?$/, function (m) { return NIV[m[1]] + "等级" + (m[2] ? " · ⭐ " + m[2] : ""); }],
    [/^(Novo|Bronze|Prata|Ouro|Diamante) \(o seu nível\)$/, function (m) { return NIV[m[1]] + "（您的等级）"; }],
    [/^Para chegar a (\S+) (Novo|Bronze|Prata|Ouro|Diamante)$/, function (m) { return "升级到 " + m[1] + " " + NIV[m[2]]; }],
    [/^(\d+)\+ vendas · nota ([\d,]+)\+ · responde em até (\d+) h(?: · disputas até (\d+)%)?(?: · loja com (\d+)\+ dias)?$/, function (m) {
      return m[1] + "+ 笔交易 · 评分 " + m[2] + "+ · " + m[3] + " 小时内回复" + (m[4] ? " · 纠纷率不超过 " + m[4] + "%" : "") + (m[5] ? " · 开店 " + m[5] + "+ 天" : ""); }],
    [/^Sub-conta de funcionário · (.+)$/, function (m) { return "员工子账户 · " + m[1]; }],
    [/^(\S+@\S+) · (Gerente|Vendedor|Assistente de vendas)$/, function (m) { return m[1] + " · " + PAPEL[m[2]]; }],
    [/^(\S+@\S+) · (Gerente|Vendedor|Assistente de vendas) · Desativado$/, function (m) { return m[1] + " · " + PAPEL[m[2]] + " · 已停用"; }],
    [/^👤 (Gerente|Vendedor|Assistente de vendas)$/, function (m) { return "👤 " + PAPEL[m[1]]; }],
    [/^Preço \(([A-Z]{3})\)$/, function (m) { return "价格（" + m[1] + "）"; }],
    [/^([\d.,]+ [A-Z]{3}) · Stock (\d+)$/, function (m) { return m[1] + " · 库存 " + m[2]; }],
    [/^([\d.,]+ [A-Z]{3}) ·(?: (\d\d\/\d\d\/\d{4}) ·)?(?: (\d+) artigos?)?$/, function (m) { return m[1] + " ·" + (m[2] ? " " + m[2] + " ·" : "") + (m[3] != null ? " " + m[3] + " 件商品" : ""); }],
    [/^(.+) fica disponível depois de a loja ser aprovada$/, function (m) { var x = E[m[1]] || m[1]; return "店铺通过审核后即可使用「" + x + "」"; }],
    [/^Erro (\d+)$/, function (m) { return "错误 " + m[1]; }],
    [/^#([0-9A-F]{6,}) · (.+)$/, function (m) { return m[0]; }]
  ];

  function juntar() { var l = window.BBZHT || []; while (l.length) { var p = l.shift(); if (p && typeof p === "object") for (var k in p) if (typeof p[k] === "string") E[k] = p[k]; } }
  function tr(t) {
    if (!t) return null;
    if (Object.prototype.hasOwnProperty.call(E, t)) return E[t];
    for (var i = 0; i < R.length; i++) { var m = t.match(R[i][0]); if (m) { try { var r = R[i][1](m); if (r != null) return r; } catch (e) {} } }
    return null;
  }
  function simp(t) { return window.BBSimplificado ? window.BBSimplificado(t) : t; }
  window.BBTermos = tr;

  /* 1) traduções guardadas no telemóvel: troca as erradas pelas certas e lembra-se das erradas para as corrigir no ecrã */
  function corrigirCache() {
    try {
      var CH = "bb_trad_zh", g = JSON.parse(localStorage.getItem(CH) || "{}") || {}, alt = false;
      Object.keys(g).forEach(function (k) {
        var n = tr(k); if (n == null) return;
        if (g[k] !== n) { ANTIGO[g[k]] = n; ANTIGO[simp(g[k])] = n; g[k] = n; alt = true; }
      });
      if (alt) localStorage.setItem(CH, JSON.stringify(g));
    } catch (e) {}
  }
  window.addEventListener("pagehide", corrigirCache);
  document.addEventListener("visibilitychange", corrigirCache);

  /* 2) ecrã: texto em português ou tradução antiga errada → tradução certa */
  function certo(v) {
    var t = v.trim(); if (!t) return null;
    var n = ANTIGO[t]; if (n == null && LETRA.test(t)) n = tr(t);
    return n != null && n !== t ? v.replace(t, n) : null;
  }
  function no(n) { if (n.nodeType !== 3) return; var p = n.parentNode; if (p && (p.tagName === "SCRIPT" || p.tagName === "STYLE")) return; var v = certo(n.nodeValue); if (v != null) n.nodeValue = v; }
  function atr(el) { ["placeholder", "title", "aria-label"].forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v) { var w = certo(v); if (w != null) el.setAttribute(a, w); } }); }
  function tudo(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) return no(raiz);
    if (raiz.nodeType !== 1 || raiz.tagName === "SCRIPT" || raiz.tagName === "STYLE") return;
    atr(raiz); raiz.querySelectorAll("[placeholder],[title],[aria-label]").forEach(atr);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), x; while ((x = w.nextNode())) no(x);
  }
  function titulo() { var v = certo(document.title); if (v != null) document.title = v; }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.type === "characterData") no(m.target); else if (m.type === "attributes") atr(m.target); else m.addedNodes.forEach(tudo); });
    titulo();
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });

  /* 3) janelas de confirmação e avisos do navegador */
  function msg(t) { if (typeof t !== "string") return t; var n = tr(t); if (n != null) return n; var NL = String.fromCharCode(10); return t.split(NL).map(function (l) { var x = tr(l.trim()); return x != null ? x : l; }).join(NL); }
  ["confirm", "alert", "prompt"].forEach(function (f) { var o = window[f]; if (!o) return; window[f] = function (a, b) { return o.call(window, msg(a), b); }; });

  /* 4) traduções novas: os textos do painel saem daqui; só o resto vai ao tradutor automático */
  var prontas = null, fimPartes;
  prontas = new Promise(function (ok) { fimPartes = ok; setTimeout(ok, 3000); });
  var f0 = window.fetch;
  if (f0) window.fetch = function (url, op) {
    var u = typeof url === "string" ? url : (url && url.url) || "", self = this, args = arguments;
    if (u.indexOf("/api/traduzir") < 0 || !op || typeof op.body !== "string") return f0.apply(self, args);
    var b; try { b = JSON.parse(op.body); } catch (e) { return f0.apply(self, args); }
    if (!b || !Array.isArray(b.textos)) return f0.apply(self, args);
    return prontas.then(function () {
      var saida = b.textos.map(function (t) { return tr(String(t).trim()); }), fora = [], idx = [];
      saida.forEach(function (v, k) { if (v == null) { idx.push(k); fora.push(b.textos[k]); } });
      setTimeout(corrigirCache, 500);
      function resposta() { return new Response(JSON.stringify({ textos: saida.map(function (v, k) { return v == null ? b.textos[k] : v; }) }), { status: 200, headers: { "Content-Type": "application/json" } }); }
      if (!fora.length) return resposta();
      var op2 = Object.assign({}, op, { body: JSON.stringify(Object.assign({}, b, { textos: fora })) });
      return f0.call(self, url, op2).then(function (r) {
        if (!r.ok) return r;
        return r.json().then(function (j) { if (j && Array.isArray(j.textos)) idx.forEach(function (k, n) { if (j.textos[n] != null) saida[k] = String(j.textos[n]); }); return resposta(); });
      });
    });
  };

  /* carregar as 3 partes dos termos; cada parte que chega corrige logo o ecrã */
  var chegaram = 0;
  function depois() { juntar(); corrigirCache(); tudo(document.body); titulo(); if (++chegaram >= PARTES) fimPartes(); }
  for (var i = 1; i <= PARTES; i++) {
    var s = document.createElement("script");
    s.src = "zh-termos-" + i + ".js?v=1";
    s.onload = s.onerror = depois;
    document.head.appendChild(s);
  }
})();
