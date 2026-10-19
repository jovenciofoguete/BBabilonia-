// api/webhook-stripe.js
// Recebe o aviso do Stripe quando o cliente paga com cartão, confirma a assinatura,
// marca o pedido como pago (valor do fornecedor retido até à entrega)
// e cria as notificações para o cliente e para o fornecedor.
const crypto = require('crypto');

const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    req.on('data', (c) => partes.push(c));
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

function assinaturaValida(corpo, cabecalho, segredo) {
  if (!cabecalho || !segredo) return false;
  const itens = Object.fromEntries(
    cabecalho.split(',').map((p) => p.split('=').map((s) => s.trim()))
  );
  if (!itens.t || !itens.v1) return false;
  const esperado = crypto
    .createHmac('sha256', segredo)
    .update(`${itens.t}.${corpo.toString('utf8')}`)
    .digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(itens.v1);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  // rejeita avisos com mais de 5 minutos
  return Math.abs(Date.now() / 1000 - Number(itens.t)) < 300;
}

async function supabase(caminho, metodo, corpo) {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    method: metodo,
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

async function marcarPago(pedidoId, referencia) {
  const rows = await supabase(
    `orders?id=eq.${pedidoId}&select=id,status,payment_status`,
    'GET'
  );
  const pedido = rows && rows[0];
  if (!pedido) return;
  // aviso repetido: já está pago, não faz nada outra vez
  if (pedido.status === 'paid' || pedido.payment_status === 'pago') return;

  // 1) marca o pedido como pago (valor do fornecedor fica retido)
  await supabase(`orders?id=eq.${pedidoId}`, 'PATCH', {
    status: 'paid',
    payment_method: 'cartao',
    payment_reference: referencia,
  });

  // a criar-pagamento.js lê payment_status; se a coluna existir, atualiza
  try {
    await supabase(`orders?id=eq.${pedidoId}`, 'PATCH', { payment_status: 'pago' });
  } catch (e) {
    console.error('payment_status não atualizado:', e.message);
  }

  // 2) notificações (cliente + fornecedor); se falhar, o pagamento fica confirmado na mesma
  try {
    await supabase('notifications', 'POST', [
      {
        order_id: pedidoId,
        tipo: 'pagamento_cliente',
        mensagem: 'Pagamento recebido com sucesso. Obrigado pela compra!',
      },
      {
        order_id: pedidoId,
        tipo: 'pagamento_fornecedor',
        mensagem:
          'Novo pagamento recebido. O valor fica retido até marcar o pedido como entregue.',
      },
    ]);
  } catch (e) {
    console.error('Notificação falhou:', e.message);
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const corpo = await lerCorpo(req);
  const ok = assinaturaValida(
    corpo,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  );
  if (!ok) return res.status(400).send('Assinatura inválida');

  const evento = JSON.parse(corpo.toString('utf8'));

  try {
    // Pagamento criado pela criar-pagamento.js (PaymentIntent)
    if (evento.type === 'payment_intent.succeeded') {
      const pi = evento.data.object;
      const pedidoId = pi.metadata && pi.metadata.order_id;
      if (pedidoId) await marcarPago(pedidoId, pi.id);
    }

    // Pagamento por Checkout Session (mantido por compatibilidade)
    if (evento.type === 'checkout.session.completed') {
      const sessao = evento.data.object;
      const pedidoId =
        (sessao.metadata && sessao.metadata.order_id) || sessao.client_reference_id;
      if (pedidoId && sessao.payment_status === 'paid') {
        await marcarPago(pedidoId, sessao.payment_intent || sessao.id);
      }
    }

    return res.status(200).json({ recebido: true });
  } catch (e) {
    console.error('Webhook erro:', e.message);
    return res.status(500).send('Erro ao processar');
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
