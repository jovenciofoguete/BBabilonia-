/* BBabilônia — conta-bancaria-4.js (parte 4 de 4 da página conta-bancaria.html) */
/* ---------- ADMIN ---------- */
async function iniciarAdmin() {
  $("tit").textContent = "Contas bancárias dos fornecedores"; $("sub").textContent = "Confirme cada conta com o comprovativo antes de pagar.";
  document.querySelector(".voltar").href = "admin-lojas.html";
  mostrar("v-admin"); $("admLista").innerHTML = '<div class="cx">A carregar…</div>';
  var cs = await api("contas_bancarias?select=*&order=updated_at.desc&limit=1000") || [];
  var ids = cs.map(function (c) { return c.loja_id; }), lojas = {}, docs = {};
  if (ids.length) {
    (await api("lojas?select=id,nome,pais,estado&id=in.(" + ids.join(",") + ")") || []).forEach(function (l) { lojas[l.id] = l; });
    (await api("loja_documentos?select=loja_id,ficheiro,created_at&tipo=eq.banco&loja_id=in.(" + ids.join(",") + ")&order=created_at.desc") || []).forEach(function (d) { (docs[d.loja_id] = docs[d.loja_id] || []).push(d); });
  }
  adm.lista = cs.map(function (c) { c._loja = lojas[c.loja_id] || {}; c._docs = docs[c.loja_id] || []; return c; });
  desenharAdmin();
}
function linha(n, v) { return v ? "<b>" + n + "</b><span>" + esc(v) + "</span>" : ""; }
function desenharAdmin() {
  var q = k($("qAdm").value).trim();
  var l = adm.lista.filter(function (c) { return c.estado === adm.aba && (!q || k([c._loja.nome, c.banco, nomeP(c.pais_banco), c.swift, c.titular].join(" ")).indexOf(q) >= 0); });
  $("admLista").innerHTML = l.map(function (c) {
    var cod = Object.keys(c.codigos || {}).map(function (x) { return linha(x.replace(/_/g, " "), c.codigos[x]); }).join("");
    var igual = k(c.titular).replace(/\s+/g, " ").trim() === k(c._loja.nome).replace(/\s+/g, " ").trim();
    return '<div class="cx"><h2>' + esc(c._loja.nome || "Loja") + ' <span class="bdg ' + (c.aceita_usd ? "b-ok" : "b-er") + '">' + (c.aceita_usd ? "Aceita USD" : "Não aceita USD") + "</span></h2>" +
      '<div class="dl">' + linha("Titular", c.titular) + linha("Tipo", c.tipo_titular) + linha("Morada titular", c.morada_titular) + linha("País titular", nomeP(c.pais_titular)) +
      linha("Banco", c.banco) + linha("Morada banco", c.morada_banco) + linha("País banco", nomeP(c.pais_banco)) + linha("SWIFT/BIC", c.swift) + linha("IBAN", c.iban) + linha("Nº conta", c.numero_conta) + cod +
      linha("Moeda", c.moeda) + linha("Intermediário", c.intermediario_banco) + linha("SWIFT interm.", c.intermediario_swift) + linha("Atualizada", new Date(c.updated_at).toLocaleString()) + "</div>" +
      (igual ? "" : '<div class="aviso er">O nome do titular não é igual ao da loja.</div>') +
      (c._docs.length ? c._docs.map(function (d, i) { return '<button class="bt" data-doc="' + esc(d.ficheiro) + '">📄 Ver comprovativo' + (c._docs.length > 1 ? " " + (i + 1) + (i === 0 ? " (mais recente)" : "") : "") + "</button>"; }).join("") : '<div class="aviso er">Sem comprovativo bancário.</div>') +
      (c.estado !== "confirmada" ? '<button class="bt v" data-ok="' + c.id + '">✓ Confirmar conta</button>' : "") +
      (c.estado !== "rejeitada" ? '<button class="bt x" data-rej="' + c.id + '">✕ Rejeitar</button>' : "") +
      (c.motivo ? '<div class="dica">Motivo: ' + esc(c.motivo) + "</div>" : "") + "</div>";
  }).join("") || '<div class="cx" style="text-align:center;color:#6b7280">Nenhuma conta nesta lista.</div>';
}
$("abas").onclick = function (e) { var b = e.target.closest("button"); if (!b) return; adm.aba = b.getAttribute("data-a"); document.querySelectorAll("#abas button").forEach(function (x) { x.classList.toggle("on", x === b); }); desenharAdmin(); };
$("qAdm").oninput = desenharAdmin;
$("admLista").onclick = async function (e) {
  var t = e.target.closest("button"); if (!t) return;
  try {
    if (t.hasAttribute("data-doc")) { var w = window.open("", "_blank"); var u = await linkDoc(t.getAttribute("data-doc")); if (w) w.location = u; else location.href = u; return; }
    var id = t.getAttribute("data-ok") || t.getAttribute("data-rej"), corpo;
    if (t.hasAttribute("data-ok")) { if (!confirm("Confirma que os dados batem certo com o comprovativo?")) return; corpo = { estado: "confirmada", motivo: null }; }
    else { var mo = prompt("Motivo da rejeição (o fornecedor vai ver):"); if (!mo) return; corpo = { estado: "rejeitada", motivo: mo.trim() }; }
    t.disabled = true; await api("contas_bancarias?id=eq." + id, "PATCH", corpo); await iniciarAdmin();
  } catch (er) { alert("Erro: " + er.message); t.disabled = false; }
};

/* ---------- arranque ---------- */
async function iniciar() {
  S = await valida();
  if (!S || !S.user) return mostrar("v-entrar");
  try { if (k(S.user.email) === ADMIN) await iniciarAdmin(); else await iniciarForn(); }
  catch (e) {
    if (e.status === 401) { localStorage.removeItem(CHAVE); return mostrar("v-entrar"); }
    if (/contas_bancarias/.test(e.message)) return info('<div class="aviso er">Falta correr o SQL da conta bancária no Supabase.</div>');
    info('<div class="aviso er">Erro: ' + esc(e.message) + "</div>");
  }
}
$("bEntrar").onclick = async function () {
  var m = $("entMsg"); m.textContent = "";
  try { guardarS(await auth("token?grant_type=password", { email: $("em").value.trim(), password: $("pw").value })); iniciar(); }
  catch (e) { m.textContent = /invalid/i.test(e.message) ? "Email ou palavra-passe errados." : e.message; }
};
iniciar();
                                                                                   
