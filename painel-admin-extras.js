/* painel-admin-extras.js — B-Babilônia: novidades do painel do dono
   🏦 Levantamentos · 👥 Clientes e fornecedores (bloquear/desbloquear) · 👑 Fornecedores PRO · 📊 Relatório financeiro
   🗂️ Categorias (criar, mudar o nome, mover, apagar) · ⭐ Destaques da página inicial · 📢 Enviar aviso · 🚩 Denúncias
   Não altera painel-admin.html: só acrescenta cartões e páginas. */
(function () {
  if (window.__bbAdmExtras) return; window.__bbAdmExtras = 1;
  var tent = 0;
  function arrancar() {
    if (typeof window.sb === "undefined" || !document.getElementById("t-inicio") || typeof window.aba !== "function") { if (++tent < 80) setTimeout(arrancar, 150); return; }
    iniciar();
  }
  arrancar();

  function iniciar() {
    var $ = function (i) { return document.getElementById(i); };
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function k(x) { return String(x || "").toLowerCase(); }
    function sa(x) { return k(x).normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
    function dt(d) { try { return d ? new Date(d).toLocaleDateString("pt-PT") : "—"; } catch (e) { return "—"; } }
    function erroSql(e) { return /function|find|relation|exist/i.test(e.message || "") ? "Falta correr o SQL novo no Supabase." : e.message; }

    var css = document.createElement("style");
    css.textContent = "#t-extra .voltar{display:inline-block;background:#fff;color:#1e3a8a;font-weight:800;border-radius:999px;padding:8px 14px;margin-bottom:12px;box-shadow:0 4px 12px #0f172a22;border:0;font-size:14px}" +
      ".xl{display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #e2e8f0}.xl:first-child{border-top:0}.xl .t{flex:1;min-width:0}.xl .t b{display:block;font-size:14.5px;word-break:break-all}.xl .t small{color:#64748b;font-size:12.5px}" +
      ".xl .bt{padding:8px 11px;font-size:13px;flex:none}.kp{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kp div{background:#f1f5f9;border-radius:12px;padding:10px}.kp span{font-size:12.5px;color:#64748b}.kp b{display:block;font-size:18px;color:#1e3a8a}" +
      ".tb{width:100%;border-collapse:collapse;font-size:13.5px}.tb th,.tb td{padding:7px 5px;border-bottom:1px solid #e2e8f0;text-align:left}.tb th{color:#64748b;font-size:12px}" +
      ".ct{padding:8px 0;border-top:1px solid #eef2f7}.ct .lin{display:flex;align-items:center;gap:6px}.ct .nm{flex:1;min-width:0;font-size:14.5px;border:0;background:none;text-align:left;padding:4px 0;color:#0f172a;font-weight:600}" +
      ".ct .ac{display:flex;gap:4px;flex:none}.ct .ac button{border:0;background:#f1f5f9;border-radius:9px;padding:6px 8px;font-size:13px}.ct .sub{margin-left:16px;border-left:2px solid #e2e8f0;padding-left:8px}" +
      ".xfundo{position:fixed;inset:0;z-index:60;background:#0008;display:flex;align-items:flex-end;justify-content:center}.xjan{background:#fff;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:16px;max-height:88vh;overflow:auto}" +
      ".xjan .op{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eef2f7;background:#fff;padding:11px 6px;font-size:14px}";
    document.head.appendChild(css);

    /* ---------- cartões no início ---------- */
    var ini = $("t-inicio"), grids = ini.querySelectorAll(".grid");
    function cartao(cls, ic, tit, txt, ir, href) {
      return '<a class="c ' + cls + '" href="' + (href || "#") + '"' + (ir ? ' data-x="' + ir + '"' : "") + '><span class="i">' + ic + "</span><b>" + tit + "</b><span>" + txt + "</span></a>";
    }
    if (grids[0] && !ini.querySelector('[data-x="contas"]')) {
      grids[0].insertAdjacentHTML("beforeend",
        cartao("k4", "🏦", "Levantamentos", "Conferir e pagar os pedidos de levantamento", "", "fornecedor-saldo.html") +
        cartao("k3", "👥", "Clientes e fornecedores", "Ver contas, bloquear e desbloquear", "contas") +
        cartao("k9", "👑", "Fornecedores PRO", "Lojas com PRO ativo e retirar o PRO", "pro"));
      var h2 = document.createElement("h2"); h2.textContent = "Gestão da plataforma";
      var g = document.createElement("div"); g.className = "grid";
      g.innerHTML = cartao("k1", "📊", "Relatório financeiro", "Vendas, taxas, retido e libertado", "fin") +
        cartao("k8", "🗂️", "Categorias", "Criar, mudar o nome, mover e apagar", "cats") +
        cartao("k2", "⭐", "Destaques", "Produtos no topo da página inicial", "dest") +
        cartao("k7", "📢", "Enviar aviso", "Aviso a todos os clientes ou fornecedores", "aviso") +
        cartao("k5", "🚩", "Denúncias", "Produtos e lojas denunciados", "", "atendimento.html?f=denuncias");
      var ref = ini.querySelectorAll("h2")[1] || null; /* antes de "Pedidos, disputas e reembolsos" */
      if (ref) { ini.insertBefore(h2, ref); ini.insertBefore(g, ref); } else { ini.appendChild(h2); ini.appendChild(g); }
    }

    /* ---------- página extra ---------- */
    var ex = document.createElement("div"); ex.id = "t-extra"; ex.className = "hide"; $("app").appendChild(ex);
    var aba0 = window.aba;
    window.aba = function (t) { ex.classList.add("hide"); return aba0.apply(this, arguments); };
    function abrir(html) {
      ["t-inicio", "t-produtos", "t-pedidos"].forEach(function (x) { $(x).classList.add("hide"); });
      document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.remove("on"); });
      ex.innerHTML = '<button class="voltar" data-x="voltar">← Voltar ao início</button>' + html; ex.classList.remove("hide"); window.scrollTo(0, 0);
    }
    function corpo(html) { var c = $("x-c"); if (c) c.innerHTML = html; }

    /* contas */
    async function contas(t) {
      abrir('<div class="box"><b>👥 Clientes e fornecedores</b><input id="x-q" placeholder="🔍 Procurar por email ou nome da loja" style="margin-top:10px" value="' + esc(t || "") + '"></div><div class="box" id="x-c"><div class="vz">A carregar…</div></div>');
      var q = $("x-q"), tm; q.oninput = function () { clearTimeout(tm); tm = setTimeout(function () { listaContas(q.value); }, 400); };
      listaContas(t || "");
    }
    async function listaContas(t) {
      var r = await sb.rpc("admin_utilizadores", { p_texto: t || "" });
      if (r.error) { corpo('<div class="msg e">' + esc(erroSql(r.error)) + "</div>"); return; }
      var L = r.data || [];
      corpo('<div class="vz" style="padding:4px">' + L.length + (L.length >= 300 ? "+ (escreva para procurar)" : "") + " contas</div>" + L.map(function (u) {
        return '<div class="xl"><div class="t"><b>' + esc(u.email) + "</b><small>" + (u.loja ? "🏪 " + esc(u.loja) + " (" + esc(u.loja_estado || "") + ") · " : "🛍️ Cliente · ") + "criada " + dt(u.created_at) + " · última entrada " + dt(u.last_sign_in_at) + "</small>" +
          (u.bloqueada ? '<span class="est r">Bloqueada</span>' : "") + "</div>" +
          (u.email === "jovenciofoguete1904@gmail.com" ? "" : '<button class="bt ' + (u.bloqueada ? "v" : "r") + '" data-bl="' + esc(u.id) + '" data-on="' + (u.bloqueada ? "0" : "1") + '">' + (u.bloqueada ? "Desbloquear" : "Bloquear") + "</button>") + "</div>";
      }).join("") || '<div class="vz">Nenhuma conta.</div>');
    }

    /* PRO */
    async function pro() {
      abrir('<div class="box"><b>👑 Fornecedores PRO</b><p style="font-size:13.5px;color:#64748b;margin:6px 0 0">Lojas com o PRO ativo (taxa de 6% por venda concluída).</p></div><div class="box" id="x-c"><div class="vz">A carregar…</div></div>');
      var r = await sb.rpc("admin_pro_lista");
      if (r.error) { corpo('<div class="msg e">' + esc(erroSql(r.error)) + "</div>"); return; }
      var L = r.data || [];
      corpo(L.map(function (l) {
        return '<div class="xl"><div class="t"><b>' + esc(l.nome || "Loja") + "</b><small>" + esc(l.estado || "") + (l.pro_desde ? " · PRO desde " + dt(l.pro_desde) : "") + ' · <a href="https://bbabilonia.com/loja.html?f=' + encodeURIComponent(l.dono_id) + '" target="_blank" rel="noopener">ver loja</a></small></div><button class="bt r" data-tp="' + esc(l.id) + '">Retirar PRO</button></div>';
      }).join("") || '<div class="vz">Nenhuma loja com PRO ativo.</div>');
    }

    /* relatório financeiro */
    async function fin() {
      abrir('<div class="box" id="x-c"><div class="vz">A calcular…</div></div>');
      try { if (!window.pedidos || !window.pedidos.length) await window.carregarPedidos(true); } catch (e) {}
      var P = window.pedidos || [], ehPago = window.pago || function (p) { return /pago|paid/.test(k(p.payment_status)); };
      var M = {}, mes = {};
      P.forEach(function (p) {
        if (!ehPago(p) || /cancel/.test(k(p.status))) return;
        var m = (p.currency || "MZN").toUpperCase(), e = k(p.escrow_status), x = M[m] || (M[m] = { n: 0, vendas: 0, taxa: 0, pro: 0, retido: 0, livre: 0, disputa: 0 });
        var v = Number(p.total || 0); x.n++; x.vendas += v; x.taxa += Number(p.platform_fee || 0); x.pro += Number(p.pro_fee || p.taxa_pro || 0);
        if (p.disputa_estado && ["aberta", "negociacao", "em_analise"].indexOf(p.disputa_estado) > -1) x.disputa += v;
        else if (e === "retido") x.retido += v; else if (/entregue|liberado/.test(e)) x.livre += v;
        var d = new Date(p.created_at), c = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
        mes[c] = mes[c] || {}; mes[c][m] = (mes[c][m] || 0) + v;
      });
      var ms = Object.keys(M), meses = Object.keys(mes).sort().reverse().slice(0, 6);
      corpo("<b>📊 Relatório financeiro</b><p style=\"font-size:12.5px;color:#64748b;margin:4px 0 10px\">Pedidos pagos e não cancelados (últimos " + P.length + " pedidos carregados).</p>" +
        (ms.length ? ms.map(function (m) {
          var x = M[m];
          return '<h2 style="margin:12px 0 6px">' + esc(m) + " · " + x.n + ' pedidos</h2><div class="kp"><div><span>Total vendido</span><b>' + din(x.vendas, m) + "</b></div><div><span>Taxa da plataforma</span><b>" + din(x.taxa, m) + "</b></div>" +
            "<div><span>Taxa PRO (6%)</span><b>" + din(x.pro, m) + "</b></div><div><span>🔒 Retido (aguarda entrega)</span><b>" + din(x.retido, m) + "</b></div>" +
            "<div><span>✅ Libertado aos vendedores</span><b>" + din(x.livre, m) + "</b></div><div><span>⚠️ Em disputa</span><b>" + din(x.disputa, m) + "</b></div></div>";
        }).join("") + '<h2 style="margin:16px 0 6px">Vendas por mês</h2><table class="tb"><tr><th>Mês</th>' + ms.map(function (m) { return "<th>" + esc(m) + "</th>"; }).join("") + "</tr>" +
          meses.map(function (c) { return "<tr><td>" + c + "</td>" + ms.map(function (m) { return "<td>" + din(mes[c][m] || 0, "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>"
          : '<div class="vz">Ainda não há pedidos pagos.</div>'));
    }

    /* categorias */
    var CAT = [], aberta = {}, porPai = {};
    async function carregarCats() {
      CAT = [];
      for (var i = 0; i < 10; i++) { var r = await sb.from("categories").select("id,name,parent_id").order("name").range(i * 1000, i * 1000 + 999); if (r.error) throw r.error; CAT = CAT.concat(r.data || []); if ((r.data || []).length < 1000) break; }
      porPai = {}; CAT.forEach(function (c) { var p = c.parent_id || "raiz"; (porPai[p] = porPai[p] || []).push(c); });
    }
    function caminho(c) { var n = [], x = c, i = 0; while (x && i++ < 10) { n.unshift(x.name); x = CAT.filter(function (y) { return y.id === x.parent_id; })[0]; } return n.join(" › "); }
    function linhaCat(c, comCaminho) {
      var f = (porPai[c.id] || []).length;
      return '<div class="ct" data-c="' + esc(c.id) + '"><div class="lin"><button class="nm" data-abre="' + esc(c.id) + '">' + (f ? (aberta[c.id] ? "▾ " : "▸ ") : "• ") + esc(comCaminho ? caminho(c) : c.name) + (f ? ' <small style="color:#64748b;font-weight:400">(' + f + ")</small>" : "") + "</button>" +
        '<span class="ac"><button data-ca="sub" title="Nova subcategoria">➕</button><button data-ca="nome" title="Mudar o nome">✏️</button><button data-ca="mover" title="Mover">↔️</button><button data-ca="apagar" title="Apagar">🗑️</button></span></div>' +
        (aberta[c.id] && f ? '<div class="sub">' + porPai[c.id].map(function (x) { return linhaCat(x); }).join("") + "</div>" : "") + "</div>";
    }
    function pintarCats() {
      var q = sa(($("x-cq") || {}).value || "").trim();
      if (q.length >= 2) {
        var L = CAT.filter(function (c) { return sa(c.name).indexOf(q) > -1; }).slice(0, 80);
        corpo('<div class="vz" style="padding:4px">' + L.length + " encontradas</div>" + L.map(function (c) { return linhaCat(c, true); }).join(""));
      } else corpo('<div class="vz" style="padding:4px">' + CAT.length + " categorias · " + (porPai.raiz || []).length + " principais</div>" + (porPai.raiz || []).map(function (c) { return linhaCat(c); }).join(""));
    }
    async function cats() {
      abrir('<div class="box"><b>🗂️ Categorias</b><input id="x-cq" placeholder="🔍 Procurar categoria" style="margin-top:10px"><div class="row"><button class="bt" data-ca="nova">➕ Nova categoria principal</button></div><div class="msg" id="x-cm"></div></div><div class="box" id="x-c"><div class="vz">A carregar…</div></div>');
      $("x-cq").oninput = pintarCats;
      try { await carregarCats(); pintarCats(); } catch (e) { corpo('<div class="msg e">' + esc(e.message) + "</div>"); }
    }
    function cmsg(t, bom) { var m = $("x-cm"); if (m) { m.className = "msg" + (bom ? "" : " e"); m.textContent = t; } }
    async function depois(r, ok) { if (r.error) { cmsg(erroSql(r.error)); return; } cmsg(ok, true); await carregarCats(); pintarCats(); }
    function escolherDestino(c) {
      var f = document.createElement("div"); f.className = "xfundo";
      f.innerHTML = '<div class="xjan"><b>Mover "' + esc(c.name) + '" para dentro de…</b><input id="x-mq" placeholder="🔍 Procurar a categoria de destino" style="margin:10px 0"><div id="x-ml"></div><button class="bt l" id="x-mf" style="width:100%;margin-top:8px">Cancelar</button></div>';
      document.body.appendChild(f);
      function lista() {
        var q = sa($("x-mq").value).trim();
        var L = CAT.filter(function (x) { return x.id !== c.id && (!q || sa(x.name).indexOf(q) > -1); }).slice(0, 60);
        $("x-ml").innerHTML = '<button class="op" data-dest="">⬆️ Categoria principal (sem pai)</button>' + L.map(function (x) { return '<button class="op" data-dest="' + esc(x.id) + '">' + esc(caminho(x)) + "</button>"; }).join("");
      }
      $("x-mq").oninput = lista; lista();
      $("x-mf").onclick = function () { f.remove(); };
      f.addEventListener("click", async function (e) {
        if (e.target === f) { f.remove(); return; }
        var b = e.target.closest("[data-dest]"); if (!b) return;
        f.remove(); depois(await sb.rpc("admin_cat_mover", { p_id: c.id, p_pai: b.getAttribute("data-dest") || null }), "Categoria movida.");
      });
    }

    /* destaques */
    async function dest() {
      abrir('<div class="box"><b>⭐ Destaques da página inicial</b><p style="font-size:13.5px;color:#64748b;margin:6px 0 10px">Estes produtos aparecem numa fila no topo da página inicial.</p><div id="x-d"><div class="vz">A carregar…</div></div></div>' +
        '<div class="box"><b>Acrescentar produto</b><input id="x-dq" placeholder="🔍 Procurar produto pelo nome" style="margin-top:10px"><div id="x-c"></div></div>');
      var q = $("x-dq"), tm; q.oninput = function () { clearTimeout(tm); tm = setTimeout(procurarProd, 400); };
      listaDest();
    }
    async function listaDest() {
      var d = await sb.from("destaques").select("produto_id,ordem").order("ordem");
      if (d.error) { $("x-d").innerHTML = '<div class="msg e">' + esc(erroSql(d.error)) + "</div>"; return; }
      var ids = (d.data || []).map(function (x) { return x.produto_id; }), por = {};
      if (ids.length) { var p = await sb.from("products").select("id,name,price,currency,active").in("id", ids); (p.data || []).forEach(function (x) { por[String(x.id)] = x; }); }
      $("x-d").innerHTML = ids.length ? ids.map(function (i) { var p = por[String(i)] || { name: "(produto apagado)" }; return '<div class="xl"><div class="t"><b>' + esc(p.name) + "</b><small>" + (p.price != null ? din(p.price, p.currency) : "") + (p.active === false ? " · oculto (não aparece)" : "") + '</small></div><button class="bt r" data-dt="' + esc(i) + '">Tirar</button></div>'; }).join("") : '<div class="vz">Ainda não escolheu destaques.</div>';
    }
    async function procurarProd() {
      var t = $("x-dq").value.trim(); if (t.length < 2) { corpo(""); return; }
      var r = await sb.from("products").select("id,name,price,currency,active").ilike("name", "%" + t + "%").limit(30);
      corpo((r.data || []).map(function (p) { return '<div class="xl"><div class="t"><b>' + esc(p.name) + "</b><small>" + din(p.price, p.currency) + (p.active === false ? " · oculto" : "") + '</small></div><button class="bt v" data-da="' + esc(p.id) + '">⭐ Pôr</button></div>'; }).join("") || '<div class="vz">Nenhum produto.</div>');
    }

    /* aviso */
    function aviso() {
      abrir('<div class="box"><b>📢 Enviar aviso</b><p style="font-size:13.5px;color:#64748b;margin:6px 0 4px">O aviso aparece no sino 🔔 de cada pessoa (e no telemóvel de quem ativou as notificações).</p>' +
        '<label>Para quem</label><select id="x-ap"><option value="clientes">Todos os clientes</option><option value="fornecedores">Todos os fornecedores</option><option value="todos">Todos (clientes e fornecedores)</option></select>' +
        '<label>Título</label><input id="x-at" maxlength="120" placeholder="Ex.: Novidades na BBabilônia">' +
        '<label>Texto</label><textarea id="x-ax" rows="4" maxlength="1000" placeholder="Escreva o aviso"></textarea>' +
        '<div class="row"><button class="bt" id="x-ae">Enviar aviso</button></div><div class="msg" id="x-am"></div></div>');
      $("x-ae").onclick = async function () {
        var p = $("x-ap"), t = $("x-at").value.trim(), x = $("x-ax").value.trim(), m = $("x-am");
        if (t.length < 2 || x.length < 2) { m.className = "msg e"; m.textContent = "Escreva o título e o texto."; return; }
        if (!confirm("Enviar este aviso a: " + p.options[p.selectedIndex].text + "?")) return;
        this.disabled = true; var r = await sb.rpc("admin_aviso", { p_publico: p.value, p_titulo: t, p_texto: x }); this.disabled = false;
        if (r.error) { m.className = "msg e"; m.textContent = erroSql(r.error); return; }
        m.className = "msg"; m.textContent = "✓ Aviso enviado a " + r.data + " pessoas."; $("x-at").value = ""; $("x-ax").value = "";
      };
    }

    var VISTAS = { contas: contas, pro: pro, fin: fin, cats: cats, dest: dest, aviso: aviso };
    document.addEventListener("click", async function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var x = t.closest("[data-x]");
      if (x) { var v = x.getAttribute("data-x"); if (v === "voltar") { e.preventDefault(); window.aba("inicio"); return; } if (VISTAS[v]) { e.preventDefault(); VISTAS[v](); return; } }
      var bl = t.closest("[data-bl]");
      if (bl) {
        var on = bl.getAttribute("data-on") === "1";
        if (!confirm(on ? "Bloquear esta conta?\nA pessoa deixa de poder entrar." : "Desbloquear esta conta?")) return;
        bl.disabled = true; var r = await sb.rpc("admin_bloquear", { p_user: bl.getAttribute("data-bl"), p_bloquear: on });
        if (r.error) { alert(erroSql(r.error)); bl.disabled = false; return; } listaContas(($("x-q") || {}).value || ""); return;
      }
      var tp = t.closest("[data-tp]");
      if (tp) { if (!confirm("Retirar o PRO a esta loja?")) return; tp.disabled = true; var r2 = await sb.rpc("admin_retirar_pro", { p_loja: tp.getAttribute("data-tp") }); if (r2.error) { alert(erroSql(r2.error)); tp.disabled = false; return; } pro(); return; }
      var da = t.closest("[data-da]"), dd = t.closest("[data-dt]");
      if (da || dd) { (da || dd).disabled = true; var r3 = await sb.rpc("admin_destaque", { p_produto: (da || dd).getAttribute(da ? "data-da" : "data-dt"), p_ligar: !!da }); if (r3.error) { alert(erroSql(r3.error)); (da || dd).disabled = false; return; } listaDest(); if (da) da.textContent = "✓ Posto"; return; }
      var ab = t.closest("[data-abre]");
      if (ab && $("t-extra") && !$("t-extra").classList.contains("hide")) { var id = ab.getAttribute("data-abre"); if ((porPai[id] || []).length) { aberta[id] = !aberta[id]; if ($("x-cq")) $("x-cq").value = ""; pintarCats(); } return; }
      var ca = t.closest("[data-ca]");
      if (ca) {
        var acao = ca.getAttribute("data-ca"), box = ca.closest("[data-c]"), c = box ? CAT.filter(function (y) { return y.id === box.getAttribute("data-c"); })[0] : null;
        if (acao === "nova" || acao === "sub") { var n = prompt(acao === "nova" ? "Nome da nova categoria principal:" : "Nome da nova subcategoria dentro de \"" + c.name + "\":"); if (!n || !n.trim()) return; if (c) aberta[c.id] = true; depois(await sb.rpc("admin_cat_criar", { p_pai: c ? c.id : null, p_nome: n.trim() }), "Categoria criada."); }
        else if (acao === "nome") { var nn = prompt("Nome novo para \"" + c.name + "\":", c.name); if (!nn || !nn.trim() || nn.trim() === c.name) return; depois(await sb.rpc("admin_cat_renomear", { p_id: c.id, p_nome: nn.trim() }), "Nome mudado."); }
        else if (acao === "mover") escolherDestino(c);
        else if (acao === "apagar") { if (!confirm("Apagar a categoria \"" + c.name + "\"?\nSó é possível sem subcategorias e sem produtos.")) return; depois(await sb.rpc("admin_cat_apagar", { p_id: c.id }), "Categoria apagada."); }
      }
    });
  }
})();
