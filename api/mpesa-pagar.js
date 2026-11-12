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

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ erro: "Use POST." })); }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const tel = telefone(b.telefone);
    if (tel.erro) return res.end(JSON.stringify({ erro: tel.erro }));
    if (!b.order_id) return res.end(JSON.stringify({ erro: "Falta o pedido." }));
    const os = await supa("orders?select=*&id=eq." + encodeURIComponent(b.order_id));
    const o = os && os[0];
    if (!o) return res.end(JSON.stringify({ erro: "Pedido não encontrado." }));
    if (/pago|paid|succeeded/i.test(String(o.payment_status || "")) || String(o.escrow_status || "").toLowerCase() === "retido")
      return res.end(JSON.stringify({ erro: "Este pedido já está pago." }));
    if (/cancel/i.test(String(o.status || ""))) return res.end(JSON.stringify({ erro: "Este pedido foi cancelado." }));
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
