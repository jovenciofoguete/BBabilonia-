// api/webhook-cripto.js
// Recebe o aviso do NOWPayments quando o cliente paga em cripto, confirma a
// assinatura, marca o pedido como pago (valor do fornecedor retido até à
// entrega) e cria as notificações para o cliente e para o fornecedor.

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

async function supabase(caminho, metodo, corpo) {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + caminho, {
    method: metodo,
    headers: {
      apikey: chave,
      Authorization: 'Bearer ' + chave,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const texto = await r.text();
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + texto);
  return texto ? JSON.parse(texto) : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Metodo nao permitido');

  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).send('Configuracao em falta');
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  // 1) Confirmar que o aviso vem mesmo do NOWPayments
  const sig = String(req.headers['x-nowpayments-sig'] || '');
  const esperado = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(sortObject(body)))
    .digest('hex');
  if (sig.length !== esperado.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) {
    return res.status(401).send('Assinatura invalida');
  }

  // 2) So o pagamento concluido marca o pedido como pago
  if (body.payment_status !== 'finished') {
    return res.status(200).send('Ignorado: ' + body.payment_status);
  }

  // 3) O order_id enviado ao NOWPayments e o id do pedido
  const pedidoId = String(body.order_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) {
    return res.status(400).send('order_id invalido');
  }

  try {
    const rows = await supabase('orders?id=eq.' + pedidoId + '&select=id,status,payment_status', 'GET');
    const pedido = rows && rows[0];
    if (!pedido) return res.status(404).send('Pedido nao encontrado');

    // Aviso repetido: ja esta pago, nao faz nada outra vez
    if (pedido.status === 'paid' || pedido.payment_status === 'pago') {
      return res.status(200).send('Ja processado');
    }

    // 4) Marca como pago (igual ao cartao: valor do fornecedor fica retido)
    await supabase('orders?id=eq.' + pedidoId, 'PATCH', {
      status: 'paid',
      payment_method: 'cripto',
      payment_reference: String(body.payment_id || '')
    });

    // A criar-pagamento.js le payment_status; se a coluna existir, atualiza
    try {
      await supabase('orders?id=eq.' + pedidoId, 'PATCH', { payment_status: 'pago' });
    } catch (e) {
      console.error('payment_status nao atualizado:', e.message);
    }

    // 5) Notificacoes (cliente + fornecedor); se falhar, o pagamento fica confirmado na mesma
    try {
      await supabase('notifications', 'POST', [
        {
          order_id: pedidoId,
          tipo: 'pagamento_cliente',
          mensagem: 'Pagamento recebido com sucesso. Obrigado pela compra!'
        },
        {
          order_id: pedidoId,
          tipo: 'pagamento_fornecedor',
          mensagem: 'Novo pagamento recebido. O valor fica retido ate marcar o pedido como entregue.'
        }
      ]);
    } catch (e) {
      console.error('Notificacao falhou:', e.message);
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook erro:', e.message);
    return res.status(500).send('Erro ao processar');
  }
};
