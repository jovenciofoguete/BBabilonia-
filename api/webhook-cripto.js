// api/webhook-cripto.js
// Recebe o aviso do NOWPayments quando o cliente paga e marca o pedido como pago.

const crypto = require('crypto');

const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';

function sortObject(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(sortObject);
  return Object.keys(o).sort().reduce((r, k) => {
    r[k] = sortObject(o[k]);
    return r;
  }, {});
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Metodo nao permitido');

  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) return res.status(500).send('Configuracao em falta');

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  // 1) Confirmar que o aviso vem mesmo do NOWPayments
  const sig = String(req.headers['x-nowpayments-sig'] || '');
  const expected = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(sortObject(body)))
    .digest('hex');
  if (sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).send('Assinatura invalida');
  }

  // 2) So o pagamento concluido marca o pedido como pago
  if (body.payment_status !== 'finished') {
    return res.status(200).send('Ignorado: ' + body.payment_status);
  }

  // 3) O order_id enviado ao NOWPayments e o id do pedido
  const orderId = String(body.order_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return res.status(400).send('order_id invalido');
  }

  const r = await fetch(SUPABASE_URL + '/rest/v1/orders?id=eq.' + encodeURIComponent(orderId), {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ payment_status: 'pago' })
  });

  const data = await r.json().catch(() => null);
  if (!r.ok) {
    console.error('Erro Supabase', r.status, data);
    return res.status(500).send('Erro ao atualizar pedido');
  }
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Pedido nao encontrado', orderId);
    return res.status(404).send('Pedido nao encontrado');
  }

  return res.status(200).send('OK');
};
