/* chat-perguntas.js — BBabilônia
   No chat (dentro do chat.html, carregado pelo chat-novo.html):
   - CLIENTE: perguntas prontas "📦 Tem este produto?" e "🎨 Pode personalizar?",
     "🧾 Personalização" (tabela por design: cor escrita, tamanho, quantidade) e
     "📐 Medidas" (vestido de noiva ou terno/fato, em cm).
   - FORNECEDOR: respostas prontas "✅ Sim, tenho", "🎨 Sim, posso personalizar em X dias"
     e "❌ Não podemos ajudar com isso".
   As mensagens são enviadas pela função normal do chat (passam pelo filtro anti-contactos e pela tradução).
   Ficheiro novo: não altera o chat.html. */
(function () {
  if (window.__bbPerguntas) return; window.__bbPerguntas = 1;
  var d = document, $ = function (i) { return d.getElementById(i); };
  if (!$('rodape') || !$('linha')) return;

  var DIAS = [2, 4, 7, 15, 22, 30, 45, 60];
  var MEDIDAS = {
    noiva: { nome: 'Vestido de noiva', campos: ['Altura', 'Ombros', 'Busto / peito', 'Barriga', 'Cintura', 'Anca', 'Ombro até aos pés', 'Ombro até à cintura', 'Cintura até aos pés', 'Comprimento da manga', 'Largura da manga', 'Boca da manga'] },
    terno: { nome: 'Terno / fato', campos: ['Altura', 'Ombros', 'Peito', 'Barriga', 'Cintura', 'Anca', 'Comprimento do braço', 'Largura do braço', 'Pulso', 'Pescoço', 'Comprimento do casaco', 'Comprimento da calça', 'Entrepernas', 'Coxa'] }
  };

  var css = d.createElement('style');
  css.textContent =
    '#bb-pq{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}#bb-pq::-webkit-scrollbar{display:none}' +
    '#bb-pq button{flex:none;border:1px solid #0ea5e9;background:#f0f9ff;color:#0369a1;border-radius:18px;padding:7px 12px;font-size:13.5px;font-weight:700}' +
    '#bb-pq select{flex:none;border:1px solid #0ea5e9;border-radius:18px;padding:6px 8px;font-size:13.5px;background:#fff;color:#0369a1}' +
    '#bb-pqm{display:none;position:fixed;inset:0;background:#000a;z-index:30;align-items:flex-end}' +
    '#bb-pqm .cx{background:#fff;color:#222;width:100%;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px}' +
    '#bb-pqm h3{margin:0 0 6px;font-size:18px}#bb-pqm p.s{margin:0 0 8px;font-size:13px;color:#64748b}' +
    '#bb-pqm label{display:block;font-size:13.5px;font-weight:700;color:#334155;margin:10px 0 4px}' +
    '#bb-pqm input,#bb-pqm select{width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:16px;font-family:inherit}' +
    '#bb-pqm .ln{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;align-items:end;margin-top:6px}' +
    '#bb-pqm .ln button{border:0;background:#fee2e2;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:15px}' +
    '#bb-pqm .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '#bb-pqm .err{color:#dc2626;font-size:14px;min-height:18px;margin-top:8px}' +
    '#bb-pqm .bt{display:flex;gap:8px;margin-top:12px}#bb-pqm .bt button{flex:1;padding:13px;border:0;border-radius:12px;font-size:15px;font-weight:800}' +
    '#bb-pqm .ok{background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff}#bb-pqm .no{background:#e2e8f0;color:#0f172a}' +
    '#bb-pqm .mais{margin-top:8px;border:1px dashed #0ea5e9;background:#f0f9ff;color:#0369a1;border-radius:10px;padding:9px;width:100%;font-weight:700}';
  d.head.appendChild(css);

  var barra = d.createElement('div'); barra.id = 'bb-pq';
  $('linha').parentNode.insertBefore(barra, $('linha'));
  var modal = d.createElement('div'); modal.id = 'bb-pqm';
  modal.innerHTML = '<div class="cx"></div>';
  d.body.appendChild(modal);
  var cx = modal.firstChild;
  modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
  function fechar() { modal.style.display = 'none'; cx.innerHTML = ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function enviar(texto) {
    if (!window.conv || typeof window.mandar !== 'function') return Promise.reject(new Error('Abra uma conversa primeiro.'));
    return window.mandar({ conversa_id: window.conv.id, remetente_id: window.eu, tipo: 'texto', texto: texto });
  }
  function enviarComAviso(texto, botao) {
    if (botao) botao.disabled = true;
    return enviar(texto).catch(function (e) { alert(e.message || String(e)); })
      .then(function () { if (botao) botao.disabled = false; });
  }

  function papel() {
    var c = window.conv; if (!c) return '';
    if (String(c.cliente_id) === String(window.eu)) return 'cliente';
    if (String(c.vendedor_id) === String(window.eu)) return 'vendedor';
    return '';
  }

  var feito = '';
  function montar() {
    var vista = $('chat') && $('chat').style.display !== 'none';
    var p = vista ? papel() : '';
    if (p === feito) return;
    feito = p;
    if (!p) { barra.innerHTML = ''; barra.style.display = 'none'; return; }
    barra.style.display = 'flex';
    if (p === 'cliente') {
      barra.innerHTML = '<button data-a="tem">📦 Tem este produto?</button><button data-a="pode">🎨 Pode personalizar?</button>' +
        '<button data-a="tabela">🧾 Personalização</button><button data-a="medidas">📐 Medidas</button>';
    } else {
      barra.innerHTML = '<button data-a="sim">✅ Sim, tenho</button>' +
        '<select data-a="dias"><option value="">🎨 Posso personalizar em…</option>' + DIAS.map(function (n) { return '<option value="' + n + '">' + n + ' dias</option>'; }).join('') + '</select>' +
        '<button data-a="nao">❌ Não podemos ajudar com isso</button>';
    }
  }
  setInterval(montar, 500); montar();

  barra.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'tem') enviarComAviso('📦 Você tem este produto?', b);
    else if (a === 'pode') enviarComAviso('🎨 Pode personalizar este produto?', b);
    else if (a === 'sim') enviarComAviso('✅ Sim, tenho este produto.', b);
    else if (a === 'nao') enviarComAviso('❌ Não podemos ajudar com isso.', b);
    else if (a === 'tabela') abrirTabela();
    else if (a === 'medidas') abrirMedidas('noiva');
  });
  barra.addEventListener('change', function (e) {
    var s = e.target; if (s.getAttribute('data-a') !== 'dias' || !s.value) return;
    var n = s.value; s.value = '';
    enviarComAviso('🎨 Sim, posso personalizar em ' + n + ' dias.', s);
  });

  /* ---------- tabela de personalização (por design) ---------- */
  function linha(i) {
    return '<div class="ln" data-l="' + i + '"><div><label>Cor (escreva)</label><input data-c placeholder="Ex.: Vermelho escuro"></div>' +
      '<div><label>Tamanho</label><input data-t placeholder="Ex.: M"></div>' +
      '<div><label>Quantidade</label><input data-q type="number" min="1" inputmode="numeric" value="1"></div>' +
      '<button type="button" data-rm aria-label="Tirar">×</button></div>';
  }
  function abrirTabela() {
    cx.innerHTML = '<h3>🧾 Personalização</h3><p class="s">Uma linha por design. Escreva a cor por palavras (sem números). Para a imagem de referência, envie a foto com 📎.</p>' +
      '<div id="bb-lns">' + linha(0) + '</div><button type="button" class="mais" id="bb-mais">+ Mais um design</button>' +
      '<label>Observações (opcional)</label><input id="bb-obs" maxlength="200" placeholder="Ex.: bordado dourado na manga">' +
      '<div class="err" id="bb-err"></div><div class="bt"><button class="no" id="bb-f">Fechar</button><button class="ok" id="bb-ok">Enviar ao fornecedor</button></div>';
    modal.style.display = 'flex';
    var n = 1;
    $('bb-mais').onclick = function () { $('bb-lns').insertAdjacentHTML('beforeend', linha(n++)); };
    $('bb-lns').onclick = function (e) {
      var r = e.target.closest('[data-rm]'); if (!r) return;
      if ($('bb-lns').children.length > 1) r.parentNode.remove();
    };
    $('bb-f').onclick = fechar;
    $('bb-ok').onclick = function () {
      var err = $('bb-err'), partes = [], linhas = $('bb-lns').querySelectorAll('.ln');
      err.textContent = '';
      for (var i = 0; i < linhas.length; i++) {
        var c = linhas[i].querySelector('[data-c]').value.trim(), t = linhas[i].querySelector('[data-t]').value.trim(), q = parseInt(linhas[i].querySelector('[data-q]').value, 10);
        if (!c) return (err.textContent = 'Escreva a cor do design ' + (i + 1) + '.');
        if (/\d/.test(c)) return (err.textContent = 'A cor do design ' + (i + 1) + ' deve ser escrita só com palavras, sem números.');
        if (!q || q < 1) return (err.textContent = 'Escreva a quantidade do design ' + (i + 1) + '.');
        partes.push('Design ' + (i + 1) + ': cor ' + c + (t ? ', tamanho ' + t : '') + ', ' + q + ' un.');
      }
      var obs = $('bb-obs').value.trim();
      var texto = '🧾 Pedido de personalização — ' + partes.join(' | ') + (obs ? ' | Observações: ' + obs : '');
      var b = this; b.disabled = true;
      enviar(texto).then(fechar).catch(function (e) { err.textContent = e.message || String(e); b.disabled = false; });
    };
  }

  /* ---------- tabela de medidas (cm) ---------- */
  function abrirMedidas(tipo) {
    var M = MEDIDAS[tipo];
    cx.innerHTML = '<h3>📐 Medidas</h3><p class="s">Escreva as medidas em centímetros (cm). Deixe vazio o que não souber.</p>' +
      '<label>Peça</label><select id="bb-tipo">' + Object.keys(MEDIDAS).map(function (k) { return '<option value="' + k + '"' + (k === tipo ? ' selected' : '') + '>' + MEDIDAS[k].nome + '</option>'; }).join('') + '</select>' +
      '<div class="g2">' + M.campos.map(function (c, i) { return '<div><label>' + esc(c) + ' (cm)</label><input data-m="' + i + '" type="number" min="1" max="300" step="0.5" inputmode="decimal"></div>'; }).join('') + '</div>' +
      '<div class="err" id="bb-err"></div><div class="bt"><button class="no" id="bb-f">Fechar</button><button class="ok" id="bb-ok">Enviar ao fornecedor</button></div>';
    modal.style.display = 'flex';
    $('bb-tipo').onchange = function () { abrirMedidas(this.value); };
    $('bb-f').onclick = fechar;
    $('bb-ok').onclick = function () {
      var err = $('bb-err'), partes = [];
      cx.querySelectorAll('[data-m]').forEach(function (inp) {
        var v = inp.value.trim(); if (!v) return;
        var n = Number(v.replace(',', '.'));
        partes.push({ n: M.campos[+inp.getAttribute('data-m')], v: n });
      });
      if (!partes.length) return (err.textContent = 'Escreva pelo menos uma medida.');
      var mau = partes.filter(function (p) { return !(p.v > 0 && p.v <= 300); })[0];
      if (mau) return (err.textContent = 'A medida "' + mau.n + '" não está certa (entre 1 e 300 cm).');
      var texto = '📐 Medidas para ' + M.nome.toLowerCase() + ': ' + partes.map(function (p) { return p.n + ' ' + String(p.v).replace('.', ',') + ' cm'; }).join(' · ');
      var b = this; b.disabled = true;
      enviar(texto).then(fechar).catch(function (e) { err.textContent = e.message || String(e); b.disabled = false; });
    };
  }
})();
