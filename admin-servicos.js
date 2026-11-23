/* admin-servicos.js — BBabilônia (14/11/2026): painel do dono (administrator.bbabilonia.com)
   Cartão "🛠️ Aluguer, serviços e diversos": o dono vê todos os anúncios (de todos os países) e pode remover;
   abre as mensalidades (atd-servicos.html), muda as taxas (em MT) de cada categoria e das categorias novas por tipo,
   e a moeda, o câmbio e os números de pagamento de cada país. Todo o mundo paga a mensalidade (equivalente na sua moeda);
   sem mensalidade paga o anúncio fica escondido.
   Carregado pelo painel-admin-rececao.js. Não altera painel-admin.html nem os outros cartões. */
(function () {
  if (window.__bbAdmServ) return; window.__bbAdmServ = 1;
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function erroSql(e) { var t = String(e && e.message || e); return /function|find|relation|exist/i.test(t) ? "Falta correr o SQL novo (PARTE 16) no Supabase." : t; }
  var L = [], FILTRO = "ativo";

  var tent = 0;
  (function arrancar() {
    var g = document.querySelector("#t-inicio .grid");
    if (typeof window.sb === "undefined" || !g || !$("t-extra")) { if (++tent < 120) setTimeout(arrancar, 150); return; }
    if (!$("bb-card-serv")) {
      var a = document.createElement("a");
      a.id = "bb-card-serv"; a.className = "c k6"; a.href = "#"; a.setAttribute("data-x", "servicos");
      a.innerHTML = '<span class="i">🛠️</span><b>Aluguer, serviços e diversos</b><span>Anúncios, mensalidades e taxas</span><span id="bb-serv-n" style="display:none;margin-top:6px;font-weight:800"></span>';
      var ref = $("bb-card-lev") || g.querySelector('a[href="admin-agentes.html"]');
      if (ref) ref.insertAdjacentElement("afterend", a); else g.appendChild(a);
      contar();
    }
  })();

  async function carregar() {
    var r = await sb.rpc("dono_servicos_lista");
    if (r.error) throw r.error;
    L = r.data || [];
    return L;
  }
  async function contar() {
    try { await carregar(); var n = L.filter(function (x) { return x.estado === "ativo"; }).length, s = $("bb-serv-n");
      if (s) { s.textContent = n + " anúncio(s) ativo(s)"; s.style.display = "block"; } } catch (e) {}
  }

  function pintar() {
    var c = $("serv-l"); if (!c) return;
    var q = ($("serv-q").value || "").toLowerCase().trim();
    var l = L.filter(function (a) {
      if (FILTRO && a.estado !== FILTRO) return false;
      if (!q) return true;
      return [a.titulo, a.categoria, a.pais, a.provincia, a.bairro, a.conta, a.telefone, a.email].join(" ").toLowerCase().indexOf(q) > -1;
    });
    $("serv-t").textContent = l.length + " anúncio(s)";
    c.innerHTML = l.length ? l.map(function (a) {
      var f = (a.fotos || [])[0];
      return '<div class="box" style="display:flex;gap:10px;align-items:flex-start">' + (f ? '<img src="' + esc(f) + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex:none">' : "") +
        '<div style="flex:1;min-width:0"><b>' + esc(a.titulo) + '</b><div style="font-size:13px;color:#64748b">' + esc(a.categoria) + " · " + esc(a.pais) + " · " + esc(a.provincia) + (a.bairro ? " · " + esc(a.bairro) : "") + "</div>" +
        '<div style="font-size:13px;margin-top:4px">👤 ' + esc(a.conta || "-") + (a.telefone ? " · 📞 " + esc(a.telefone) : "") + (a.whatsapp ? " · 💬 " + esc(a.whatsapp) : "") + (a.email ? " · ✉️ " + esc(a.email) : "") + "</div>" +
        (a.descricao ? '<div style="font-size:13px;margin-top:4px">' + esc(String(a.descricao).slice(0, 140)) + "</div>" : "") +
        '<div style="font-size:12px;color:#94a3b8;margin-top:2px">' + esc(new Date(a.criado_em).toLocaleString("pt-PT")) + (a.estado !== "ativo" ? " · removido" : a.visivel ? ' · <b style="color:#059669">👁️ visível</b>' + (a.valido_ate ? " até " + esc(new Date(a.valido_ate).toLocaleDateString("pt-PT")) : "") : ' · <b style="color:#dc2626">🙈 escondido (mensalidade por pagar)</b>') + "</div>" +
        (a.estado === "ativo" ? '<button class="bt" data-rm="' + esc(a.id) + '" type="button" style="margin-top:8px;background:#dc2626">🗑️ Remover</button>' : "") + "</div></div>";
    }).join("") : '<div class="box" style="text-align:center;color:#64748b">Nenhum anúncio.</div>';
  }

  async function abrir() {
    var ex = $("t-extra"); if (!ex) return;
    ["t-inicio", "t-produtos", "t-pedidos"].forEach(function (x) { var e = $(x); if (e) e.classList.add("hide"); });
    document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.remove("on"); });
    ex.innerHTML = '<button class="voltar" data-x="voltar">← Voltar ao início</button>' +
      '<div class="box"><b>🛠️ Aluguer, serviços e diversos</b><p style="font-size:13px;color:#64748b;margin:6px 0 0">Cada anúncio só é visto no país da conta de quem o publicou. Fica escondido até a mensalidade da categoria ser aprovada (todos os países).</p>' +
      '<div style="display:flex;gap:6px;margin-top:10px"><a class="bt" href="atd-servicos.html" style="flex:1;text-align:center;text-decoration:none;background:#059669">💵 Mensalidades e destaques pagos</a><button class="bt" type="button" id="serv-tx" style="flex:1;background:#7c3aed">🏷️ Taxas</button></div><div id="serv-taxas"></div>' +
      '<input id="serv-q" placeholder="Pesquisar (título, conta, província, telefone…)" style="margin-top:10px">' +
      '<div class="row" style="display:flex;gap:6px;margin-top:8px"><button class="bt" type="button" data-f="ativo">Ativos</button><button class="bt" type="button" data-f="removido">Removidos</button><button class="bt" type="button" data-f="">Todos</button></div>' +
      '<p style="font-size:13px;margin:8px 0 0" id="serv-t"></p><div class="msg" id="serv-m"></div></div><div id="serv-l"><div class="box">A carregar…</div></div>';
    ex.classList.remove("hide"); window.scrollTo(0, 0);
    $("serv-q").oninput = pintar;
    $("serv-tx").onclick = taxas;
    try { await carregar(); pintar(); } catch (e) { $("serv-m").textContent = erroSql(e); $("serv-l").innerHTML = ""; }
  }

  /* 🏷️ taxas: cada categoria e as categorias novas por tipo (serviço, venda, aluguer, lugar fixo) */
  async function taxas() {
    var c = $("serv-taxas"); if (!c) return;
    if (c.innerHTML) { c.innerHTML = ""; return; }
    c.innerHTML = '<p style="font-size:13px;margin-top:8px">A carregar…</p>';
    var r = await sb.rpc("dono_servicos_taxas");
    if (r.error) { c.innerHTML = '<p class="msg">' + esc(erroSql(r.error)) + "</p>"; return; }
    var d = r.data || {}, linha = function (rot, attr, v) {
      return '<div style="display:flex;gap:6px;align-items:center;border-top:1px solid #eee;padding:6px 0"><span style="flex:1;font-size:13.5px">' + rot + '</span><input type="number" min="0" value="' + esc(v) + '" style="width:90px;margin:0" ' + attr + '><span style="font-size:12px">MTS</span><button class="bt" type="button" data-tx-ok style="width:auto;margin:0;padding:8px 10px">Gravar</button></div>';
    };
    var gs = {}, ord = [];
    (d.categorias || []).forEach(function (k) { if (!gs[k.grupo]) { gs[k.grupo] = []; ord.push(k.grupo); } gs[k.grupo].push(k); });
    var rp = await sb.rpc("dono_servicos_paises"), PS = rp.error ? [] : (rp.data || []);
    var rg = await sb.rpc("dono_servicos_global"), GL = rg.error ? [] : (rg.data || []);
    var formGlobal = function (g) {
      var cr = /USDC|USDT/i.test(g.moeda);
      return '<div class="box" data-glbox data-id="' + esc(g.id) + '" style="margin-top:8px;padding:10px"><b style="font-size:13.5px">' + esc(g.nome) + "</b>" +
        '<input data-gl="numero" value="' + esc(g.numero || "") + '" placeholder="' + (cr ? "Endereço da carteira USDC" : "Conta / IBAN / número para receber USD") + '" style="margin:4px 0 0">' +
        '<div style="display:flex;gap:6px"><input data-gl="recetor" value="' + esc(g.recetor || "") + '" placeholder="' + (cr ? "Rede (ex.: Polygon, Tron, Ethereum)" : "Nome de quem recebe") + '" style="margin:4px 0 0">' +
        '<input data-gl="cambio" value="' + esc(g.cambio) + '" placeholder="1 MT = ? ' + esc(g.moeda) + '" style="margin:4px 0 0;max-width:120px"></div>' +
        '<button class="bt" type="button" data-gl-ok style="margin-top:6px">Gravar ' + esc(g.nome) + "</button></div>";
    };
    var inp = function (k, v, ph) { return '<input data-pp="' + k + '" value="' + esc(v == null ? "" : v) + '" placeholder="' + ph + '" style="margin:4px 0 0">'; };
    var formPais = function (p) {
      p = p || {};
      return '<div class="box" data-ppbox style="margin-top:8px;padding:10px"><div style="display:flex;gap:6px">' + inp("pais", p.pais, "País (ex.: TZ)") + inp("moeda", p.moeda, "Moeda (ex.: TZS)") + inp("cambio", p.cambio, "1 MT = ?") + "</div>" +
        '<div style="display:flex;gap:6px">' + inp("meio1_nome", p.meio1_nome, "Meio 1 (ex.: M-Pesa)") + inp("meio1_numero", p.meio1_numero, "Número") + inp("meio1_recetor", p.meio1_recetor, "Nome de quem recebe") + "</div>" +
        '<div style="display:flex;gap:6px">' + inp("meio2_nome", p.meio2_nome, "Meio 2 (opcional)") + inp("meio2_numero", p.meio2_numero, "Número") + inp("meio2_recetor", p.meio2_recetor, "Nome de quem recebe") + "</div>" +
        '<button class="bt" type="button" data-pp-ok style="margin-top:6px">Gravar ' + esc(p.pais || "país novo") + "</button></div>";
    };
    c.innerHTML = '<div style="margin-top:10px"><b style="font-size:14px">🌍 Pagamento por país</b><p style="font-size:12.5px;color:#64748b;margin:4px 0 0">As taxas são em MT para todo o mundo. Cada país paga o equivalente na sua moeda: taxa × câmbio (arredondado para cima). Moçambique usa os números do 💵 Levantamento. Sem números, as contas desse país não conseguem pagar.</p>' +
      PS.map(formPais).join("") + formPais(null) + "</div>" +
      '<div style="margin-top:14px"><b style="font-size:14px">💳 Pagamentos internacionais (todos os países)</b><p style="font-size:12.5px;color:#64748b;margin:4px 0 0">Aparecem para todos os países, ao lado dos meios do país. Sem carteira/conta escrita, não aparecem.</p>' + GL.map(formGlobal).join("") + "</div>" +
      '<div style="margin-top:14px"><b style="font-size:14px">Categorias novas (acrescentadas pelos clientes), por tipo</b>' +
      (d.tipos || []).map(function (t) { return linha(esc(t.nome), 'data-tipo="' + esc(t.tipo) + '"', t.taxa); }).join("") +
      ord.map(function (g) { return '<b style="display:block;font-size:14px;margin-top:12px">' + esc(g) + "</b>" + gs[g].map(function (k) { return linha(esc(k.nome) + (k.nova ? ' <small style="color:#7c3aed">(nova)</small>' : ""), 'data-cat="' + k.id + '"', k.taxa); }).join(""); }).join("") +
      '<p class="msg" id="serv-tx-m"></p></div>';
  }

  document.addEventListener("click", async function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var x = t.closest('[data-x="servicos"]');
    if (x) { e.preventDefault(); abrir(); return; }
    var f = t.closest("#t-extra [data-f]");
    if (f && $("serv-l")) { FILTRO = f.getAttribute("data-f"); pintar(); return; }
    var gk = t.closest("#serv-taxas [data-gl-ok]");
    if (gk) {
      var gb = gk.closest("[data-glbox]"), dg = { id: gb.getAttribute("data-id") };
      gb.querySelectorAll("[data-gl]").forEach(function (x) { dg[x.getAttribute("data-gl")] = x.value.trim(); });
      gk.disabled = true;
      var r4 = await sb.rpc("dono_servicos_global_gravar", { d: dg });
      gk.disabled = false;
      if (r4.error) { alert(erroSql(r4.error)); return; }
      gk.textContent = "✓ Gravado"; setTimeout(function () { gk.textContent = "Gravar"; }, 1500);
      return;
    }
    var pp = t.closest("#serv-taxas [data-pp-ok]");
    if (pp) {
      var bx = pp.closest("[data-ppbox]"), d = {};
      bx.querySelectorAll("[data-pp]").forEach(function (x) { d[x.getAttribute("data-pp")] = x.value.trim(); });
      pp.disabled = true;
      var r3 = await sb.rpc("dono_servicos_pais_gravar", { d: d });
      pp.disabled = false;
      if (r3.error) { alert(erroSql(r3.error)); return; }
      pp.textContent = "✓ Gravado"; setTimeout(function () { var c2 = $("serv-taxas"); if (c2) { c2.innerHTML = ""; taxas(); } }, 900);
      return;
    }
    var tx = t.closest("#serv-taxas [data-tx-ok]");
    if (tx) {
      var inp = tx.parentNode.querySelector("input"), m = $("serv-tx-m");
      tx.disabled = true;
      var rr = await sb.rpc("dono_servicos_taxa_mudar", { p_categoria: inp.getAttribute("data-cat") ? Number(inp.getAttribute("data-cat")) : null, p_tipo: inp.getAttribute("data-tipo") || null, p_taxa: Number(inp.value) });
      tx.disabled = false;
      if (rr.error) { alert(erroSql(rr.error)); return; }
      tx.textContent = "✓ Gravado"; setTimeout(function () { tx.textContent = "Gravar"; }, 1500);
      return;
    }
    var rm = t.closest("#serv-l [data-rm]");
    if (rm) {
      if (!confirm("Remover este anúncio? Deixa de aparecer para todos.")) return;
      rm.disabled = true;
      var r = await sb.rpc("dono_servico_remover", { p_id: rm.getAttribute("data-rm") });
      if (r.error) { rm.disabled = false; alert(erroSql(r.error)); return; }
      await carregar(); pintar(); contar();
    }
  });
})();
