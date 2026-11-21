/* api/mpesa-pagar.js — BBabilônia (12/11/2026)
   Pagamento M-Pesa com "USSD Push": o cliente toca em Pagar e no telemóvel aparece só o pedido do PIN do M-Pesa.
   O dinheiro entra no M-Pesa da BBabilônia e o pedido fica pago com o valor RETIDO (escrow), como no resto da plataforma.
   Moçambique (+258): API M-Pesa da Vodacom Moçambique.  Tanzânia (+255): API M-Pesa (OpenAPI) da Vodacom Tanzânia.
   Variáveis na Vercel (Settings → Environment Variables):
     SUPABASE_SERVICE_ROLE_KEY            (já existe)
     MPESA_MZ_API_KEY, MPESA_MZ_PUBLIC_KEY, MPESA_MZ_SERVICE_PROVIDER_CODE, MPESA_MZ_AMBIENTE (sandbox | producao)
     MPESA_TZ_API_KEY, MPESA_TZ_PUBLIC_KEY, MPESA_TZ_SERVICE_PROVIDER_CODE, MPESA_TZ_AMBIENTE (sandbox | producao)
     MPESA_TAXA_PLATAFORMA (% da plataforma, por omissão 5)   MPESA_TAXA_REDE (% da taxa M-Pesa paga pelo cliente, por omissão 0) */
import crypto from "crypto";

export const config = { maxDuration: 120 };

const SUPA = process.env.SUPABASE_URL || "https://dsfoqoeawvjafypycldz.supabase.co";

function env(n, d) { const v = process.env[n]; return v === undefined || v === "" ? d : v; }
function pem(k) {
  k = String(k || "").trim();
  if (k.includes("BEGIN")) return k;
  const b = k.replace(/\s+/g, "");
  return "-----BEGIN PUBLIC KEY-----\n" + (b.match(/.{1,64}/g) || []).join("\n") + "\n-----END PUBLIC KEY-----";
}
/* token Vodacom: texto cifrado com a chave pública (RSA PKCS#1 v1.5), em base64 */
function cifrar(texto, chavePublica) {
  return crypto.publicEncrypt({ key: pem(chavePublica), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(String(texto))).toString("base64");
}
function telefone(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (/^0[67]\d{8}$/.test(d)) d = "255" + d.slice(1);
  if (/^8[2-7]\d{7}$/.test(d)) d = "258" + d;
  if (/^258(84|85)\d{7}$/.test(d)) return { pais: "MZ", msisdn: d };
  if (/^255[67]\d{8}$/.test(d)) return { pais: "TZ", msisdn: d };
  if (/^2588[2367]\d{7}$/.test(d)) return { erro: "Este número não é M-Pesa (em Moçambique o M-Pesa começa por 84 ou 85)." };
  return { erro: "Escreva o número M-Pesa (Moçambique 84/85…, Tanzânia 07…)." };
}
async function supa(caminho, metodo, corpo) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SUPA + "/rest/v1/" + caminho, {
    method: metodo || "GET",
    headers: { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json", Prefer: "return=representation" },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) throw new Error((j && j.message) || ("Supabase " + r.status));
  return j;
}
async function cambio(valor, de, para) {
  de = String(de || para).toUpperCase(); if (de === para) return valor;
  const r = await fetch("https://open.er-api.com/v6/latest/USD"); const j = await r.json();
  if (!j || !j.rates || !j.rates[de] || !j.rates[para]) throw new Error("Não foi possível converter " + de + " para " + para + ".");
  return valor / j.rates[de] * j.rates[para];
}
function ref(id) { return (String(id).replace(/[^0-9a-z]/gi, "").slice(0, 8) + Date.now().toString(36)).toUpperCase().slice(0, 20); }

async function c2bMZ(msisdn, valor, referencia, terceiro) {
  const k = env("MPESA_MZ_API_KEY"), pk = env("MPESA_MZ_PUBLIC_KEY"), sp = env("MPESA_MZ_SERVICE_PROVIDER_CODE");
  if (!k || !pk || !sp) return { ativo: false };
  const host = env("MPESA_MZ_HOST", env("MPESA_MZ_AMBIENTE", "sandbox") === "producao" ? "https://api.vm.co.mz:18352" : "https://api.sandbox.vm.co.mz:18352");
  const r = await fetch(host + "/ipg/v1x/c2bPayment/singleStage/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + cifrar(k, pk), Origin: env("MPESA_MZ_ORIGIN", "developer.mpesa.vm.co.mz") },
    body: JSON.stringify({ input_TransactionReference: referencia, input_CustomerMSISDN: msisdn, input_Amount: String(valor), input_ThirdPartyReference: terceiro, input_ServiceProviderCode: sp })
  });
  const j = await r.json().catch(() => ({}));
  return { ativo: true, ok: j.output_ResponseCode === "INS-0", codigo: j.output_ResponseCode, texto: j.output_ResponseDesc, transacao: j.output_TransactionID || j.output_ConversationID };
}
async function c2bTZ(msisdn, valor, referencia, terceiro) {
  const k = env("MPESA_TZ_API_KEY"), pk = env("MPESA_TZ_PUBLIC_KEY"), sp = env("MPESA_TZ_SERVICE_PROVIDER_CODE");
  if (!k || !pk || !sp) return { ativo: false };
  const base = env("MPESA_TZ_HOST", "https://openapi.m-pesa.com") + "/" + (env("MPESA_TZ_AMBIENTE", "sandbox") === "producao" ? "openapi" : "sandbox") + "/ipg/v2/vodacomTZN";
  const s = await fetch(base + "/getSession/", { headers: { Authorization: "Bearer " + cifrar(k, pk), Origin: "*" } });
  const sj = await s.json().catch(() => ({}));
  if (!sj.output_SessionID) return { ativo: true, ok: false, codigo: sj.output_ResponseCode, texto: sj.output_ResponseDesc || "Sessão M-Pesa recusada." };
  await new Promise(ok => setTimeout(ok, Number(env("MPESA_TZ_ESPERA_MS", 3000))));
  const r = await fetch(base + "/c2bPayment/singleStage/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + cifrar(sj.output_SessionID, pk), Origin: "*" },
    body: JSON.stringify({ input_Amount: String(valor), input_Country: "TZN", input_Currency: "TZS", input_CustomerMSISDN: msisdn, input_ServiceProviderCode: sp,
      input_ThirdPartyConversationID: terceiro, input_TransactionReference: referencia, input_PurchasedItemsDesc: "BBabilonia" })
  });
  const j = await r.json().catch(() => ({}));
  return { ativo: true, ok: j.output_ResponseCode === "INS-0", codigo: j.output_ResponseCode, texto: j.output_ResponseDesc, transacao: j.output_TransactionID || j.output_ConversationID };
}

/* 19/11/2026 — pagamento do TRANSPORTE por M-Pesa (só Moçambique). Vem neste mesmo ficheiro porque o plano grátis da Vercel só permite 12 funções.
   O cliente toca em Pagar, confirma o PIN, e a cotação do transporte passa a "paga" sozinha (função SQL envio_pago_automatico).
   Chamada: { tipo: "transporte", order_id, telefone, acao?: "cotar" } com a sessão do cliente em Authorization: Bearer. */
async function utilizador(token) {
  if (!token) return null;
  const r = await fetch(SUPA + "/auth/v1/user", { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + token } });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.id ? j : null;
}
async function transporte(req, res, b, tel) {
  const fim = (o) => res.end(JSON.stringify(o));
  if (tel.pais !== "MZ") return fim({ erro: "O pagamento automático M-Pesa do transporte só existe em Moçambique (números 84 ou 85). Nos outros países o transporte paga-se pelo método internacional." });
  if (!b.order_id) return fim({ erro: "Falta o pedido." });
  const aut = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || "").replace(/^Bearer\s+/i, "");
  const u = await utilizador(aut);
  if (!u) return fim({ erro: "Entre de novo na sua conta e tente outra vez." });
  const os = await supa("orders?select=id,customer_id,customer_email,currency,status,cliente_pais&id=eq." + encodeURIComponent(b.order_id));
  const o = os && os[0];
  if (!o) return fim({ erro: "Pedido não encontrado." });
  const meu = String(o.customer_id || "") === String(u.id) || (o.customer_email && u.email && String(o.customer_email).toLowerCase() === String(u.email).toLowerCase());
  if (!meu) return fim({ erro: "Este pedido não é da sua conta." });
  if (/cancel/i.test(String(o.status || ""))) return fim({ erro: "Este pedido foi cancelado." });
  if (o.cliente_pais && String(o.cliente_pais).toUpperCase() !== "MZ") return fim({ erro: "O pagamento automático M-Pesa do transporte só existe para pedidos de Moçambique. Os outros países pagam pelo método internacional." });
  const cs = await supa("cotacoes_envio?select=*&order_id=eq." + encodeURIComponent(o.id));
  const c = cs && cs[0];
  if (!c) return fim({ erro: "Ainda não há cotação de transporte para este pedido." });
  if (c.estado !== "aguarda_pagamento") return fim({ erro: c.estado === "pago_cliente" ? "As provas já foram enviadas; a BBabilônia está a confirmar." : "O transporte deste pedido já está pago." });
  const base = Number(c.valor_envio || 0) + Number(c.taxa_servico || 0);
  if (!(base > 0)) return fim({ erro: "Valor do transporte inválido." });
  const tr = Number(env("MPESA_TAXA_REDE", 0)) / 100;
  const subtotal = await cambio(base, c.moeda || o.currency || "MZN", "MZN");
  const taxaRede = subtotal * tr;
  const total = Math.ceil(subtotal + taxaRede);
  const resumo = { moeda: "MZN", subtotal: Math.round(subtotal * 100) / 100, taxa_rede: Math.round(taxaRede * 100) / 100, total };
  if (b.acao === "cotar") return fim(resumo);
  const referencia = ref(o.id + "t"), terceiro = ref(o.id + "tx");
  const r = await c2bMZ(tel.msisdn, total, referencia, terceiro);
  if (!r.ativo) return fim({ erro: "O pagamento M-Pesa de Moçambique ainda não está ativo (faltam as chaves da Vodacom).", ...resumo });
  if (!r.ok) {
    const motivo = { "INS-5": "Pagamento cancelado no telemóvel.", "INS-6": "Pagamento recusado.", "INS-9": "O tempo para pôr o PIN terminou.", "INS-2006": "Saldo M-Pesa insuficiente.", "INS-2051": "Número M-Pesa inválido.", "INS-10": "Pagamento repetido." }[r.codigo];
    return fim({ erro: motivo || ("M-Pesa não concluiu o pagamento" + (r.texto ? ": " + r.texto : ".") + (r.codigo ? " (" + r.codigo + ")" : "")), codigo: r.codigo });
  }
  const refPag = String(r.transacao || referencia);
  try {
    await supa("rpc/envio_pago_automatico", "POST", { p_order: o.id, p_ref: refPag, p_meio: "mpesa", p_valor: total });
  } catch (e) {
    return fim({ erro: "O M-Pesa recebeu o pagamento (referência " + refPag + ") mas não ficou registado. Não pague outra vez: fale com o atendimento e diga esta referência. " + (e && e.message || "") });
  }
  return fim({ ok: true, referencia: refPag, ...resumo });
}

/* 19/11/2026 — PAGAR O FORNECEDOR de Moçambique por M-Pesa (B2C), sozinho, sem ele pedir levantamento.
   O pagamento é criado pelo Supabase quando o atendimento confirma o produto (tabela levantamentos, auto = true).
   Chamada: { tipo: "pagar_fornecedor", levantamento_id } com a sessão do fornecedor ou do atendimento em Authorization: Bearer.
   O valor e o número vêm SEMPRE da base de dados (nunca do pedido). Cada pagamento só pode ser tentado uma vez de cada vez (reserva)
   e, se não ficar claro se o dinheiro saiu, fica "a pagar" e NÃO repete (evita pagar a dobrar). e-Mola e sem chaves B2C: fica para o dono pagar à mão. */
async function b2cMZ(msisdn, valor, referencia, terceiro) {
  const k = env("MPESA_MZ_API_KEY"), pk = env("MPESA_MZ_PUBLIC_KEY"), sp = env("MPESA_MZ_SERVICE_PROVIDER_CODE");
  if (!k || !pk || !sp || env("MPESA_MZ_B2C", "sim") === "nao") return { ativo: false };
  const host = env("MPESA_MZ_HOST", env("MPESA_MZ_AMBIENTE", "sandbox") === "producao" ? "https://api.vm.co.mz:18345" : "https://api.sandbox.vm.co.mz:18345");
  const r = await fetch(host + "/ipg/v1x/b2cPayment/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + cifrar(k, pk), Origin: env("MPESA_MZ_ORIGIN", "developer.mpesa.vm.co.mz") },
    body: JSON.stringify({ input_TransactionReference: referencia, input_CustomerMSISDN: msisdn, input_Amount: String(valor), input_ThirdPartyReference: terceiro, input_ServiceProviderCode: sp })
  });
  const j = await r.json().catch(() => ({}));
  return { ativo: true, ok: j.output_ResponseCode === "INS-0", codigo: j.output_ResponseCode, texto: j.output_ResponseDesc, transacao: j.output_TransactionID || j.output_ConversationID };
}
async function pagarFornecedor(req, res, b) {
  const fim = (o) => res.end(JSON.stringify(o));
  const id = String(b.levantamento_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fim({ erro: "Falta o pagamento." });
  const aut = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || "").replace(/^Bearer\s+/i, "");
  const u = await utilizador(aut);
  if (!u) return fim({ erro: "Entre de novo na sua conta." });
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rp = await fetch(SUPA + "/rest/v1/rpc/levantamento_auto_pode", { method: "POST", headers: { apikey: k, Authorization: "Bearer " + aut, "Content-Type": "application/json" }, body: JSON.stringify({ p_id: id }) });
  if (!rp.ok || (await rp.json().catch(() => false)) !== true) return fim({ erro: "Este pagamento não é seu." });
  const r = await supa("rpc/levantamento_auto_reservar", "POST", { p_id: id });
  if (!r) return fim({ ja: true, texto: "Este pagamento já foi tratado." });
  const marcar = (estado, referencia, erro) => supa("rpc/levantamento_auto_marcar", "POST", { p_id: id, p_estado: estado, p_ref: referencia || null, p_erro: erro || null });
  if (r.tipo !== "mpesa") {
    const nome = ({ banco: "transferência bancária (SWIFT)", cripto: "USDT", emola: "e-Mola" })[String(r.tipo || "").toLowerCase()] || "este meio";
    await marcar("manual", null, "Pagamento por " + nome + ": a BBabilônia paga à mão");
    return fim({ manual: true, texto: "Pagamento por " + nome + ": a BBabilônia envia e o fornecedor vê a referência." });
  }
  const tel = telefone(r.numero);
  if (tel.erro || tel.pais !== "MZ") { await marcar("manual", null, tel.erro || "Número M-Pesa inválido"); return fim({ manual: true, texto: "Número M-Pesa inválido: a BBabilônia trata à mão." }); }
  let valor;
  try { valor = Math.round((await cambio(Number(r.valor), r.moeda, "MZN")) * 100) / 100; } catch (e) { await marcar("falhou", null, "Câmbio: " + (e && e.message)); return fim({ erro: "Não foi possível converter a moeda. Tenta outra vez mais tarde." }); }
  if (!(valor > 0)) { await marcar("manual", null, "Valor inválido"); return fim({ manual: true }); }
  const referencia = ref(id + "p"), terceiro = ref(id + "px");
  let m;
  try { m = await b2cMZ(tel.msisdn, valor, referencia, terceiro); }
  catch (e) { return fim({ erro: "Sem resposta do M-Pesa. Não se repete sozinho para não pagar a dobrar: a BBabilônia verifica." }); }
  if (!m.ativo) { await marcar("manual", null, "Pagamentos M-Pesa B2C ainda não ativos"); return fim({ manual: true, texto: "O pagamento automático ainda não está ativo: a BBabilônia paga à mão." }); }
  if (!m.ok) {
    await marcar("falhou", null, (m.codigo || "") + " " + (m.texto || ""));
    return fim({ erro: "M-Pesa não concluiu o pagamento" + (m.codigo ? " (" + m.codigo + ")" : "") + ". Vai tentar de novo.", codigo: m.codigo });
  }
  const refPag = String(m.transacao || referencia);
  try { await marcar("pago", refPag); }
  catch (e) { return fim({ ok: true, referencia: refPag, aviso: "Pago, mas ficou por registar. Não repetir." }); }
  return fim({ ok: true, referencia: refPag, valor, moeda: "MZN" });
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ erro: "Use POST." })); }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (b.tipo === "pagar_fornecedor") return await pagarFornecedor(req, res, b);
    const tel = telefone(b.telefone);
    if (tel.erro) return res.end(JSON.stringify({ erro: tel.erro }));
    if (b.tipo === "transporte") return await transporte(req, res, b, tel);
    if (!b.order_id) return res.end(JSON.stringify({ erro: "Falta o pedido." }));
    const os = await supa("orders?select=*&id=eq." + encodeURIComponent(b.order_id));
    const o = os && os[0];
    if (!o) return res.end(JSON.stringify({ erro: "Pedido não encontrado." }));
    if (/pago|paid|succeeded/i.test(String(o.payment_status || "")) || String(o.escrow_status || "").toLowerCase() === "retido")
      return res.end(JSON.stringify({ erro: "Este pedido já está pago." }));
    if (/cancel/i.test(String(o.status || ""))) return res.end(JSON.stringify({ erro: "Este pedido foi cancelado." }));
    /* (19/11/2026) M-Pesa só para fornecedores de Moçambique; se não der para confirmar, recusa */
    let fmz = false; try { fmz = (await supa("rpc/bb_mpesa_pedido", "POST", { p_order: o.id })) === true; } catch (e) { fmz = false; }
    if (!fmz) return res.end(JSON.stringify({ erro: "O M-Pesa só está disponível para fornecedores de Moçambique. Pague por cartão (Visa/Mastercard) ou por cripto (USDT)." }));
    const moeda = tel.pais === "MZ" ? "MZN" : "TZS";
    const base = Number(o.total || o.subtotal || 0);
    if (!(base > 0)) return res.end(JSON.stringify({ erro: "Valor do pedido inválido." }));
    const tp = Number(env("MPESA_TAXA_PLATAFORMA", 5)) / 100, tr = Number(env("MPESA_TAXA_REDE", 0)) / 100;
    const subtotal = await cambio(base, o.currency || moeda, moeda);
    const taxaPlat = subtotal * tp, taxaRede = (subtotal + taxaPlat) * tr;
    const total = Math.ceil(subtotal + taxaPlat + taxaRede);
    const resumo = { moeda, subtotal: Math.round(subtotal * 100) / 100, taxa_plataforma: Math.round(taxaPlat * 100) / 100, taxa_rede: Math.round(taxaRede * 100) / 100, total };
    if (b.acao === "cotar") return res.end(JSON.stringify(resumo));
    const referencia = ref(o.id), terceiro = ref(o.id + "x");
    const r = tel.pais === "MZ" ? await c2bMZ(tel.msisdn, total, referencia, terceiro) : await c2bTZ(tel.msisdn, total, referencia, terceiro);
    if (!r.ativo) return res.end(JSON.stringify({ erro: "O pagamento M-Pesa " + (tel.pais === "MZ" ? "de Moçambique" : "da Tanzânia") + " ainda não está ativo (faltam as chaves da Vodacom).", ...resumo }));
    if (!r.ok) {
      const motivo = { "INS-5": "Pagamento cancelado no telemóvel.", "INS-6": "Pagamento recusado.", "INS-9": "O tempo para pôr o PIN terminou.", "INS-2006": "Saldo M-Pesa insuficiente.", "INS-2051": "Número M-Pesa inválido.", "INS-10": "Pagamento repetido." }[r.codigo];
      return res.end(JSON.stringify({ erro: motivo || ("M-Pesa não concluiu o pagamento" + (r.texto ? ": " + r.texto : ".") + (r.codigo ? " (" + r.codigo + ")" : "")), codigo: r.codigo }));
    }
    await supa("orders?id=eq." + encodeURIComponent(o.id), "PATCH", { payment_status: "pago", escrow_status: "retido", payment_method: "mpesa", payment_reference: String(r.transacao || referencia) });
    try { await supa("orders?id=eq." + encodeURIComponent(o.id), "PATCH", { platform_fee: resumo.taxa_plataforma }); } catch (e) {}
    const link = o.link_id || o.link_pagamento_id;
    if (link) { try { await supa("links_pagamento?id=eq." + encodeURIComponent(link), "PATCH", { estado: "pago" }); } catch (e) {} }
    return res.end(JSON.stringify({ ok: true, referencia: r.transacao || referencia, ...resumo }));
  } catch (e) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ erro: "Erro no pagamento M-Pesa: " + (e && e.message || e) }));
  }
}