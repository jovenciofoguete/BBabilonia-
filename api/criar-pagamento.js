// B-Babilônia - /api/criar-pagamento
// Calcula as taxas, guarda-as no pedido e abre o pagamento por cartão.
// (19/11/2026) Fornecedor de Moçambique + cliente de Moçambique: cartão e cripto são RECUSADOS aqui no servidor (só M-Pesa).
// (19/11/2026) Câmbio MZN→USD ao vivo em cada pagamento (se falhar, usa MZN_POR_USD).
const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
const TAXA_PLATAFORMA = Number(process.env.TAXA_PLATAFORMA || 0.05); // 5%
const MZN_POR_USD = Number(process.env.MZN_POR_USD || 64);

const SEM_DECIMAIS = ['jpy', 'krw', 'vnd', 'clp'];
const STRIPE_OK = ['usd', 'eur', 'gbp', 'brl', 'zar', 'cad', 'aud', 'chf'];

let TAXAS_VIVO = null;
async function taxasVivo() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(function () { ctl.abort(); }, 4000);
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j && j.rates && Number(j.rates.MZN) > 1) TAXAS_VIVO = j.rates;
  } catch (e) { TAXAS_VIVO = null; }
}
function paraUsd(valor, moeda) {
  const m = String(moeda).toLowerCase();
  if (m === 'usd') return valor;
  if (TAXAS_VIVO && TAXAS_VIVO[String(moeda).toUpperCase()] > 0) return valor / TAXAS_VIVO[String(moeda).toUpperCase()];
  if (m === 'mzn') return valor / MZN_POR_USD;
  return valor;
}

async function sbFetch(path, opts) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, opts, {
    headers: Object.assign({
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }, (opts && opts.headers) || {})
  }));
  const t = await r.text();
  if (!r.ok) throw new Error('Supabase: ' + t);
  return t ? JSON.parse(t) : null;
}

// (23/11/2026) Fora de Moçambique: destaque de produto, mensalidade e destaque de serviços pagos por cartão em USD.
// Fica aprovado sozinho quando o Stripe confirma (webhook-stripe.js → pagamento_cartao_pago). Ninguém aprova à mão.
const TIPOS_CARTAO = ['destaque', 'servico_mensalidade', 'servico_destaque'];
async function utilizadorDe(req) {
  const tok = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + tok } });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.id ? j : null;
}
async function pagarCartaoExtra(req, res, b) {
  const u = await utilizadorDe(req);
  if (!u) return res.status(401).json({ erro: 'Entre de novo na sua conta e tente outra vez.' });
  const args = {
    p_user: u.id, p_tipo: b.tipo,
    p_categoria: b.tipo === 'servico_mensalidade' ? (parseInt(b.categoria_id, 10) || null) : null,
    p_periodo: b.periodo === 'ano' ? 'ano' : 'mes',
    p_anuncio: b.tipo === 'servico_destaque' ? (String(b.anuncio_id || '') || null) : null,
    p_dias: b.tipo === 'servico_mensalidade' ? null : (parseInt(b.dias, 10) || null),
    p_produto: b.tipo === 'destaque' ? (String(b.produto_id || '') || null) : null
  };
  let c;
  try { c = await sbFetch('rpc/pagamento_cartao_calcular', { method: 'POST', body: JSON.stringify(args) }); }
  catch (e) { return res.status(500).json({ erro: 'Ainda falta correr o SQL dos pagamentos por cartão no Supabase.' }); }
  if (!c || c.erro) return res.status(400).json({ erro: (c && c.erro) || 'Não foi possível calcular o valor.' });
  let usd = Number(c.usd);
  if (!(usd > 0)) { await taxasVivo(); usd = paraUsd(Number(c.valor_mt || 0), 'MZN'); }
  usd = Math.max(0.5, Math.ceil(usd * 100) / 100);
  if (b.acao === 'cotar') return res.json({ moeda: 'USD', total: usd });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
    return res.status(503).json({ erro: 'O pagamento por cartão ainda não está ativo. Estará disponível em breve.', moeda: 'USD', total: usd });
  }
  const form = new URLSearchParams();
  form.append('amount', String(Math.round(usd * 100)));
  form.append('currency', 'usd');
  form.append('automatic_payment_methods[enabled]', 'true');
  form.append('description', 'BBabilonia ' + b.tipo);
  form.append('receipt_email', u.email || '');
  form.append('metadata[tipo]', b.tipo);
  form.append('metadata[user]', u.id);
  ['p_categoria', 'p_periodo', 'p_anuncio', 'p_dias', 'p_produto'].forEach(function (k) { if (args[k] != null) form.append('metadata[' + k.slice(2) + ']', String(args[k])); });
  const r = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form
  });
  const d = await r.json();
  if (!r.ok) return res.status(502).json({ erro: 'Stripe: ' + ((d.error && d.error.message) || 'erro') });
  return res.json({ moeda: 'USD', total: usd, client_secret: d.client_secret, publishable_key: process.env.STRIPE_PUBLISHABLE_KEY });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método inválido' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (TIPOS_CARTAO.includes(body.tipo)) return await pagarCartaoExtra(req, res, body);
    const { order_id, metodo } = body;
    if (!order_id) return res.status(400).json({ erro: 'Falta o pedido' });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ erro: 'Falta SUPABASE_SERVICE_ROLE_KEY na Vercel' });
    }

    const rows = await sbFetch('orders?id=eq.' + encodeURIComponent(order_id) + '&select=*');
    const o = rows && rows[0];
    if (!o) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (o.payment_status === 'pago') return res.status(400).json({ erro: 'Pedido já pago' });

    // Fornecedor de Moçambique + cliente de Moçambique: só M-Pesa (cartão e cripto recusados)
    if (String(o.cliente_pais || '').toUpperCase() === 'MZ') {
      let fmz = false;
      for (let i = 0; i < 2 && !fmz; i++) {
        try { fmz = (await sbFetch('rpc/bb_mpesa_pedido', { method: 'POST', body: JSON.stringify({ p_order: order_id }) })) === true; break; } catch (e) { fmz = false; }
      }
      if (fmz) return res.status(403).json({ erro: 'O fornecedor é de Moçambique e você também: pague por M-Pesa. Cartão e cripto não são aceites neste pedido.' });
    }
    if (metodo === 'cripto') {
      return res.status(503).json({ erro: 'Pagamento por cripto indisponível de momento' });
    }

    const moeda = o.currency || 'MZN';
    const subtotal = Number(o.subtotal);
    // (23/11/2026) a % vem do painel do dono (💲 Taxas e planos → taxa no pagamento) e é calculada sobre o preço do
    // FORNECEDOR (sem a taxa que já está no preço do produto): fornecedor 1000 → cliente vê 1060 → taxa 5% de 1000 = 50
    let tx = null;
    try { tx = await sbFetch('rpc/bb_taxa_pagamento', { method: 'POST', body: JSON.stringify({ p_order: order_id }) }); } catch (e) { tx = null; }
    const baseForn = Number((tx && tx.base) || subtotal);
    const pct = tx && tx.pct != null ? Number(tx.pct) / 100 : TAXA_PLATAFORMA;
    const taxa_plataforma = Math.round(baseForn * pct * 100) / 100;
    const taxa_cambio = 0;
    const total = Math.round((subtotal + taxa_plataforma + taxa_cambio) * 100) / 100;

    await sbFetch('orders?id=eq.' + encodeURIComponent(order_id), {
      method: 'PATCH',
      body: JSON.stringify({
        total,
        platform_fee: taxa_plataforma,
        fx_fee: taxa_cambio,
        supplier_amount: baseForn,
        payment_method: metodo
      })
    });

    const base = { subtotal, moeda, taxa_plataforma, taxa_cambio, total };

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
      return res.status(500).json({ erro: 'Pagamento por cartão ainda não configurado' });
    }
    let moedaStripe = String(moeda).toLowerCase();
    let valorStripe = total;
    if (!STRIPE_OK.includes(moedaStripe)) {
      await taxasVivo();
      valorStripe = paraUsd(total, moeda);
      moedaStripe = 'usd';
    }
    const minor = SEM_DECIMAIS.includes(moedaStripe) ? Math.round(valorStripe) : Math.round(valorStripe * 100);
    const form = new URLSearchParams();
    form.append('amount', String(minor));
    form.append('currency', moedaStripe);
    form.append('automatic_payment_methods[enabled]', 'true');
    form.append('metadata[order_id]', order_id);
    form.append('receipt_email', o.customer_email || '');
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ erro: 'Stripe: ' + ((d.error && d.error.message) || 'erro') });
    await sbFetch('orders?id=eq.' + encodeURIComponent(order_id), {
      method: 'PATCH', body: JSON.stringify({ payment_ref: d.id })
    });
    return res.json(Object.assign(base, {
      client_secret: d.client_secret,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY
    }));
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
};
