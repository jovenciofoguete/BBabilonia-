// B-Babilônia - /api/criar-pagamento
// Calcula as taxas, guarda-as no pedido e abre o pagamento por cartão.
const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
const TAXA_PLATAFORMA = Number(process.env.TAXA_PLATAFORMA || 0.05); // 5%
const MZN_POR_USD = Number(process.env.MZN_POR_USD || 64);

const SEM_DECIMAIS = ['jpy', 'krw', 'vnd', 'clp'];
const STRIPE_OK = ['usd', 'eur', 'gbp', 'brl', 'zar', 'cad', 'aud', 'chf'];

function paraUsd(valor, moeda) {
  const m = String(moeda).toLowerCase();
  if (m === 'usd') return valor;
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método inválido' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { order_id, metodo } = body;
    if (!order_id) return res.status(400).json({ erro: 'Falta o pedido' });
    if (metodo === 'cripto') {
      return res.status(503).json({ erro: 'Pagamento por cripto indisponível de momento' });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ erro: 'Falta SUPABASE_SERVICE_ROLE_KEY na Vercel' });
    }

    const rows = await sbFetch('orders?id=eq.' + encodeURIComponent(order_id) + '&select=*');
    const o = rows && rows[0];
    if (!o) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (o.payment_status === 'pago') return res.status(400).json({ erro: 'Pedido já pago' });

    const moeda = o.currency || 'MZN';
    const subtotal = Number(o.subtotal);
    const taxa_plataforma = Math.round(subtotal * TAXA_PLATAFORMA * 100) / 100;
    const taxa_cambio = 0;
    const total = Math.round((subtotal + taxa_plataforma + taxa_cambio) * 100) / 100;

    await sbFetch('orders?id=eq.' + encodeURIComponent(order_id), {
      method: 'PATCH',
      body: JSON.stringify({
        total,
        platform_fee: taxa_plataforma,
        fx_fee: taxa_cambio,
        supplier_amount: subtotal,
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
