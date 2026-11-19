/* api/mpesa-transporte.js — BBabilônia (19/11/2026)
   Pagamento do TRANSPORTE por M-Pesa, igual ao do produto: o cliente toca em Pagar e no telemóvel aparece só o pedido do PIN.
   Quando o M-Pesa confirma, o transporte fica "pago" sozinho (sem provas e sem agente a confirmar) e a BBabilônia entrega o pedido na transportadora.
   SÓ MOÇAMBIQUE (números 84/85, pedidos de clientes de Moçambique); os outros países pagam o transporte pelo método internacional.
   Usa as MESMAS variáveis da Vercel do api/mpesa-pagar.js (MPESA_MZ_*, SUPABASE_SERVICE_ROLE_KEY). Não precisa de nenhuma nova.
   Só o próprio cliente do pedido pode pagar (verifica a sessão). O valor vem da cotação guardada no servidor, nunca do telemóvel.
   MPESA_TAXA_REDE (% da taxa M-Pesa paga pelo cliente, por omissão 0). */
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
function cifrar(texto, chavePublica) {
  return crypto.publicEncrypt({ key: pem(chavePublica), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(String(texto))).toString("base64");
}
function telefone(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (/^0[67]\d{8}$/.test(d)) d = "255" + d.slice(1);
  if (/^8[2-7]\d{7}$/.test(d)) d = "258" + d;
  if (/^258(84|85)\d{7}$/.test(d)) return { pais: "MZ", msisdn: d };
  if (/^255[67]\d{8}$/.test(d)) return { erro: "O pagamento automático M-Pesa do transporte só existe em Moçambique. Nos outros países o transporte paga-se pelo método internacional." };
  if (/^2588[2367]\d{7}$/.test(d)) return { erro: "Este número não é M-Pesa (em Moçambique o M-Pesa começa por 84 ou 85)." };
  return { erro: "Escreva o número M-Pesa de Moçambique (84 ou 85…)." };
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
async function utilizador(token) {
  if (!token) return null;
  const r = await fetch(SUPA + "/auth/v1/user", { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + token } });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.id ? j : null;
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
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  const fim = (o) => res.end(JSON.stringify(o));
  if (req.method !== "POST") { res.statusCode = 405; return fim({ erro: "Use POST." }); }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const tel = telefone(b.telefone);
    if (tel.erro) return fim({ erro: tel.erro });
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
    const moeda = "MZN";
    const base = Number(c.valor_envio || 0) + Number(c.taxa_servico || 0);
    if (!(base > 0)) return fim({ erro: "Valor do transporte inválido." });
    const tr = Number(env("MPESA_TAXA_REDE", 0)) / 100;
    const subtotal = await cambio(base, c.moeda || o.currency || "MZN", moeda);
    const taxaRede = subtotal * tr;
    const total = Math.ceil(subtotal + taxaRede);
    const resumo = { moeda, subtotal: Math.round(subtotal * 100) / 100, taxa_rede: Math.round(taxaRede * 100) / 100, total };
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
  } catch (e) {
    res.statusCode = 200;
    return fim({ erro: "Erro no pagamento M-Pesa: " + (e && e.message || e) });
  }
}
