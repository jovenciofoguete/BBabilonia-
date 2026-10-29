/* BBabilônia — conta-bancaria-3.js (parte 3 de 4 da página conta-bancaria.html) */
/* ---------- sessão (a mesma do painel) ---------- */
function ler() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s && s.access_token) return s; } catch (e) {} return null; }
function guardarS(s) { if (s && !s.expires_at && s.expires_in) s.expires_at = Math.floor(Date.now() / 1000) + s.expires_in; localStorage.setItem(CHAVE, JSON.stringify(s)); return s; }
async function auth(c, corpo) {
  var r = await fetch(SUPA + "/auth/v1/" + c, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  var j = await r.json().catch(function () { return {}; });
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || ("Erro " + r.status));
  return j;
}
async function valida() {
  var s = ler(); if (!s) return null;
  if (s.expires_at && s.expires_at - 60 < Date.now() / 1000 && s.refresh_token) {
    try { s = guardarS(await auth("token?grant_type=refresh_token", { refresh_token: s.refresh_token })); } catch (e) { return null; }
  }
  return s;
}
async function api(c, metodo, corpo) {
  S = (await valida()) || S;
  var r = await fetch(SUPA + "/rest/v1/" + c, { method: metodo || "GET", headers: { apikey: KEY, Authorization: "Bearer " + S.access_token, "Content-Type": "application/json", Prefer: "return=representation" }, body: corpo ? JSON.stringify(corpo) : undefined });
  var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) { var er = new Error((j && j.message) || ("Erro " + r.status)); er.status = r.status; throw er; }
  return j;
}
async function subir(path, f) {
  var r = await fetch(SUPA + "/storage/v1/object/documentos-loja/" + path.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + S.access_token, "Content-Type": f.type || "application/octet-stream", "x-upsert": "false" }, body: f });
  if (!r.ok) { var j = await r.json().catch(function () { return {}; }); throw new Error("Comprovativo: " + (j.message || j.error || ("erro " + r.status))); }
}
async function linkDoc(path) {
  var r = await fetch(SUPA + "/storage/v1/object/sign/documentos-loja/" + path.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + S.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 900 }) });
  var j = await r.json().catch(function () { return {}; });
  var u = j.signedURL || j.signedUrl; if (!u) throw new Error(j.message || "Não foi possível abrir o ficheiro.");
  return /^https?:/.test(u) ? u : SUPA + "/storage/v1" + (u[0] === "/" ? "" : "/") + u;
}

function mostrar(id) { var cg = $("carregar"); if (cg) cg.style.display = "none"; ["v-entrar", "v-info", "v-forn", "v-admin"].forEach(function (v) { $(v).classList.toggle("hide", v !== id); }); }
function info(html) { $("v-info").innerHTML = html; mostrar("v-info"); }

/* ---------- listas com lupa ---------- */
function lista(qId, lId, itens, campo, aoEscolher) {
  function desenhar() {
    var q = k($(qId).value).trim(), sel = escolha[campo];
    var l = itens.filter(function (p) { return !q || k(p.n).indexOf(q) >= 0 || k(p.c) === q; });
    var s = itens.filter(function (p) { return p.c === sel; })[0];
    if (s && l.indexOf(s) < 0) l.unshift(s);
    $(lId).innerHTML = l.slice(0, 300).map(function (p) { return '<div data-c="' + p.c + '" class="' + (p.c === sel ? "on" : "") + '">' + esc(p.n) + (p.c === sel ? " ✓" : "") + "</div>"; }).join("") || '<div style="color:#999">Nada encontrado</div>';
  }
  $(qId).oninput = desenhar;
  $(lId).onclick = function (e) { var d = e.target.closest("[data-c]"); if (!d) return; escolha[campo] = d.getAttribute("data-c"); $(qId).value = ""; desenhar(); if (aoEscolher) aoEscolher(escolha[campo]); };
  return desenhar;
}
var dPT, dPB, dMo;

/* ---------- campos conforme o país do banco ---------- */
function camposPais(p, valores) {
  valores = valores || {};
  var def = CAMPOS[p] || GERAL, t = ibanTipo(p);
  $("campoIban").classList.toggle("hide", t === "nao");
  $("lbIban").textContent = t === "obrig" ? "IBAN *" : "IBAN (se o seu banco tiver)";
  var len = IBAN_LEN[p] || IBAN_LOCAL[p];
  $("dIban").textContent = t === "nao" ? "" : ("Começa por " + (["GP","MQ","GF","RE","YT","PF","NC"].indexOf(p) >= 0 ? "FR" : p) + (len ? " e tem " + len + " caracteres." : "."));
  $("campoConta").classList.toggle("hide", t === "obrig");
  $("lbConta").textContent = def.conta + (t === "obrig" || def.sem ? "" : (t === "opc" || t === "local" ? " * (se não tiver IBAN)" : " *"));
  $("extras").innerHTML = def.x.map(function (c) {
    var v = valores[c[0]] || "";
    var campo = Array.isArray(c[2])
      ? '<select class="cp" data-x="' + c[0] + '"><option value="">— Escolha —</option>' + c[2].map(function (o) { return '<option' + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>"
      : '<input class="cp" data-x="' + c[0] + '" value="' + esc(v) + '">';
    return '<label class="lb">' + esc(c[1]) + (c[3] ? " *" : "") + "</label>" + campo;
  }).join("");
  if (!escolha.moeda && MOEDA_PAIS[p]) { escolha.moeda = MOEDA_PAIS[p]; dMo(); }
}

/* ---------- FORNECEDOR ---------- */
var EST = { verificacao: ['<span class="bdg b-av">Em verificação</span>', "A equipa da BBabilônia está a confirmar os dados com o comprovativo. Até lá os pagamentos ficam parados."],
  confirmada: ['<span class="bdg b-ok">Confirmada ✓</span>', "Os seus pagamentos são enviados para esta conta."],
  rejeitada: ['<span class="bdg b-er">Rejeitada</span>', "Corrija os dados e guarde de novo."] };
function desenharEstado() {
  if (!conta) { $("estadoCx").innerHTML = '<h2>Loja: ' + esc(loja.nome) + '</h2><div class="aviso">Ainda não registou a conta para receber. Sem conta confirmada não é possível receber pagamentos.</div>'; return; }
  var e = EST[conta.estado] || [esc(conta.estado), ""];
  $("estadoCx").innerHTML = '<h2>Loja: ' + esc(loja.nome) + "</h2>Estado: " + e[0] + '<div class="aviso ' + (conta.estado === "confirmada" ? "ok" : conta.estado === "rejeitada" ? "er" : "") + '">' + e[1] + (conta.estado === "rejeitada" && conta.motivo ? "<br><b>Motivo:</b> " + esc(conta.motivo) : "") + "</div>";
}
function preencher() {
  var c = conta || {};
  $("titular").value = loja.nome;
  $("tipoTit").value = c.tipo_titular || loja.tipo || "empresa";
  escolha.pt = c.pais_titular || loja.pais || ""; escolha.pb = c.pais_banco || loja.pais || ""; escolha.moeda = c.moeda || "";
  $("moradaTit").value = c.morada_titular || ""; $("banco").value = c.banco || ""; $("moradaBan").value = c.morada_banco || "";
  $("swift").value = c.swift || ""; $("iban").value = c.iban || ""; $("conta").value = c.numero_conta || "";
  $("interBanco").value = c.intermediario_banco || ""; $("interSwift").value = c.intermediario_swift || "";
  document.querySelectorAll('input[name="usd"]').forEach(function (r) { r.checked = conta ? (r.value === (c.aceita_usd ? "1" : "0")) : false; });
  dPT(); dMo(); dPB(); camposPais(escolha.pb, c.codigos);
  $("dComp").textContent = conta ? "Se mudar os dados da conta, envie o comprovativo da conta nova (extrato ou declaração do banco com o nome do titular e o número da conta)." : (temComp ? "Já enviou o comprovativo ao criar a loja. Pode enviar outro se for de outra conta (opcional)." : "Envie o comprovativo da conta (extrato ou declaração do banco com o nome do titular e o número da conta). *");
}
function lerForm() {
  var p = escolha.pb, def = CAMPOS[p] || GERAL, t = ibanTipo(p), codigos = {}, erro = null;
  var usd = document.querySelector('input[name="usd"]:checked');
  var d = { loja_id: loja.id, tipo_titular: $("tipoTit").value, titular: loja.nome, morada_titular: $("moradaTit").value.trim(), pais_titular: escolha.pt,
    banco: $("banco").value.trim(), morada_banco: $("moradaBan").value.trim(), pais_banco: p, swift: limpa($("swift").value),
    iban: t === "nao" ? null : (limpa($("iban").value) || null), numero_conta: t === "obrig" ? null : ($("conta").value.trim() || null),
    moeda: escolha.moeda, aceita_usd: usd ? usd.value === "1" : null, intermediario_banco: $("interBanco").value.trim() || null, intermediario_swift: limpa($("interSwift").value) || null };
  def.x.forEach(function (c) {
    var el = document.querySelector('[data-x="' + c[0] + '"]'), v = el ? el.value.trim() : "";
    if (c[2] instanceof RegExp && v) { var vl = limpa(v); if (!c[2].test(vl)) erro = erro || ("Verifique: " + c[1]); else v = vl; }
    if (c[3] && !v) erro = erro || ("Falta: " + c[1]);
    if (v) codigos[c[0]] = v;
  });
  d.codigos = codigos;
  if (!d.pais_titular) return { e: "Escolha o país do titular." };
  if (!d.morada_titular) return { e: "Escreva a morada completa do titular." };
  if (!p) return { e: "Escolha o país do banco." };
  if (!d.banco) return { e: "Escreva o nome do banco." };
  if (!d.morada_banco) return { e: "Escreva a morada do banco ou agência." };
  if (!swiftOk(d.swift)) return { e: "O código SWIFT/BIC não é válido (8 ou 11 letras/números)." };
  if (t === "obrig" && !d.iban) return { e: "Escreva o IBAN (obrigatório em " + nomeP(p) + ")." };
  if (d.iban) {
    var pref = ["GP","MQ","GF","RE","YT","PF","NC"].indexOf(p) >= 0 ? "FR" : p, len = IBAN_LEN[p] || IBAN_LOCAL[p];
    if (d.iban.slice(0, 2) !== pref) return { e: "O IBAN tem de começar por " + pref + " (país do banco)." };
    if (len && d.iban.length !== len) return { e: "O IBAN de " + nomeP(p) + " tem " + len + " caracteres (escreveu " + d.iban.length + ")." };
    if (!ibanOk(d.iban)) return { e: "O IBAN não está correto. Confira número a número." };
  }
  if (!d.iban && !d.numero_conta && !codigos.clabe) return { e: "Escreva o número de conta" + (t !== "nao" ? " ou o IBAN." : ".") };
  if (!d.numero_conta && codigos.clabe) d.numero_conta = codigos.clabe;
  if (erro) return { e: erro };
  if (!d.moeda) return { e: "Escolha a moeda da conta." };
  if (d.aceita_usd === null) return { e: "Diga se a conta aceita receber dólares (USD)." };
  if (d.intermediario_swift && !swiftOk(d.intermediario_swift)) return { e: "O SWIFT do banco intermediário não é válido." };
  return { d: d };
}
function mudouConta(d) {
  if (!conta) return true;
  var cs = ["tipo_titular", "morada_titular", "pais_titular", "banco", "morada_banco", "pais_banco", "iban", "numero_conta", "swift", "moeda", "aceita_usd", "intermediario_banco", "intermediario_swift"];
  return cs.some(function (c) { return (d[c] == null ? "" : String(d[c])) !== (conta[c] == null ? "" : String(conta[c])); }) || JSON.stringify(d.codigos || {}) !== JSON.stringify(conta.codigos || {});
}
$("bGuardar").onclick = async function () {
  var m = $("fMsg"); m.className = "msg"; m.textContent = "";
  var r = lerForm(); if (r.e) { m.textContent = r.e; return; }
  var d = r.d, f = $("comp").files[0], mudou = mudouConta(d);
  if (!mudou && !f) { m.className = "msg ok"; m.textContent = "Nada mudou."; return; }
  if (swiftPais(d.swift) !== d.pais_banco && !confirm("O SWIFT " + d.swift + " é de " + nomeP(swiftPais(d.swift)) + ", mas escolheu o banco em " + nomeP(d.pais_banco) + ". Continuar assim?")) return;
  if (conta && mudou && !f) { m.textContent = "Mudou os dados da conta: envie o comprovativo da conta nova."; return; }
  if (!conta && !temComp && !f) { m.textContent = "Envie o comprovativo da conta bancária."; return; }
  if (conta && conta.estado === "confirmada" && mudou && !confirm("Ao mudar a conta, ela volta a \"Em verificação\" e os pagamentos param até a BBabilônia confirmar. Continuar?")) return;
  var b = this; b.disabled = true;
  try {
    if (f) {
      m.className = "msg ok"; m.textContent = "A enviar o comprovativo…";
      var p = S.user.id + "/" + Date.now() + "-banco-" + Math.random().toString(36).slice(2) + "-" + f.name.replace(/[^\w.]/g, "_");
      await subir(p, f);
      await api("loja_documentos", "POST", { loja_id: loja.id, tipo: "banco", ficheiro: p });
      temComp = true;
    }
    m.className = "msg ok"; m.textContent = "A guardar…";
    if (mudou) {
      var res = conta ? await api("contas_bancarias?id=eq." + conta.id, "PATCH", d) : await api("contas_bancarias", "POST", d);
      conta = res && res[0] || conta;
    }
    $("comp").value = ""; desenharEstado(); preencher();
    m.className = "msg ok"; m.textContent = mudou ? "Guardado. Estado: Em verificação — a BBabilônia vai confirmar com o comprovativo." : "Comprovativo enviado.";
    window.scrollTo(0, 0);
  } catch (e) { m.className = "msg"; m.textContent = "Erro: " + e.message; }
  finally { b.disabled = false; }
};

async function iniciarForn() {
  var r = await api("lojas?select=*&dono_id=eq." + S.user.id + "&limit=1"); loja = r && r[0];
  if (!loja) return info('<h2>Ainda não tem loja</h2><p style="margin:8px 0">Primeiro crie a sua loja e espere a aprovação.</p><a class="bt p" style="display:block;text-align:center;text-decoration:none" href="loja-criar.html">Criar a minha loja</a>');
  if (k(loja.estado).indexOf("aprov") !== 0) return info('<h2>Loja: ' + esc(loja.nome) + '</h2><div class="aviso">A conta para receber só pode ser registada depois de a loja ser aprovada. Estado atual: <b>' + esc(loja.estado) + "</b></div>");
  var c = await api("contas_bancarias?select=*&loja_id=eq." + loja.id + "&limit=1"); conta = c && c[0] || null;
  try { temComp = (await api("loja_documentos?select=id&tipo=eq.banco&loja_id=eq." + loja.id)).length > 0; } catch (e) { temComp = false; }
  dPT = lista("qPaisTit", "lPaisTit", PAISES, "pt");
  dPB = lista("qPaisBan", "lPaisBan", PAISES, "pb", function (p) { camposPais(p); });
  dMo = lista("qMoeda", "lMoeda", MOEDAS, "moeda");
  desenharEstado(); preencher(); mostrar("v-forn");
}
