/* pais-cliente.js — BBabilônia (14/11/2026)
   Nenhum cliente compra sem escolher o seu país (todos os países).
   - checkout.html: caixa "🌍 O seu país" obrigatória (lista com 🔍 pesquisa); sem ela não continua para o pagamento.
     Também carrega o checkout-levantamento.js (Moçambique: pagamento por levantamento M-Pesa / e-Mola).
   - pagar-link-v2.html: a mesma caixa; sem ela não continua.
   - chat (chat.html dentro do chat-novo.html): sem país, "Compartilhar endereço de entrega" fica inativo
     e aparece a caixa para escolher o país.
   - pais.html: página só para escolher o país.
   O país fica guardado na conta (Supabase: meu_pais / meu_pais_definir), neste telemóvel e no 🌐 País / Idioma / Moeda
   do menu (bb_prefs): o país confirmado no 🌐 já conta; o adivinhado pelo idioma do telemóvel não conta.
   A base de dados (PARTE 10) também recusa compras e endereços sem país. Não mexe em mais nada. */
(function () {
  if (window.BBPais) return;
  var d = document, $ = function (i) { return d.getElementById(i); };
  var U = 'https://dsfoqoeawvjafypycldz.supabase.co', K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token', LK = 'bb_pais';

  /* mesmos nomes do moradas-v3.html; os 3 países principais primeiro */
  var LISTA = 'AF:Afeganistão|ZA:África do Sul|AL:Albânia|DE:Alemanha|AD:Andorra|AO:Angola|AG:Antígua e Barbuda|SA:Arábia Saudita|DZ:Argélia|AR:Argentina|AM:Arménia|AU:Austrália|AT:Áustria|AZ:Azerbaijão|BS:Baamas|BD:Bangladesh|BB:Barbados|BH:Bahrein|BE:Bélgica|BZ:Belize|BJ:Benim|BY:Bielorrússia|BO:Bolívia|BA:Bósnia e Herzegovina|BW:Botsuana|BR:Brasil|BN:Brunei|BG:Bulgária|BF:Burquina Faso|BI:Burundi|BT:Butão|CV:Cabo Verde|CM:Camarões|KH:Camboja|CA:Canadá|QA:Catar|KZ:Cazaquistão|TD:Chade|CL:Chile|CN:China|CY:Chipre|CO:Colômbia|KM:Comores|CG:Congo|CD:Congo (RDC)|KR:Coreia do Sul|CI:Costa do Marfim|CR:Costa Rica|HR:Croácia|CU:Cuba|DK:Dinamarca|DJ:Jibuti|DM:Dominica|EG:Egito|SV:El Salvador|AE:Emirados Árabes Unidos|EC:Equador|ER:Eritreia|SK:Eslováquia|SI:Eslovénia|ES:Espanha|US:Estados Unidos|EE:Estónia|SZ:Essuatíni|ET:Etiópia|FJ:Fiji|PH:Filipinas|FI:Finlândia|FR:França|GA:Gabão|GM:Gâmbia|GH:Gana|GE:Geórgia|GD:Granada|GR:Grécia|GT:Guatemala|GY:Guiana|GN:Guiné|GQ:Guiné Equatorial|GW:Guiné-Bissau|HT:Haiti|HN:Honduras|HK:Hong Kong|HU:Hungria|YE:Iémen|MH:Ilhas Marshall|SB:Ilhas Salomão|IN:Índia|ID:Indonésia|IR:Irão|IQ:Iraque|IE:Irlanda|IS:Islândia|IL:Israel|IT:Itália|JM:Jamaica|JP:Japão|JO:Jordânia|XK:Kosovo|KW:Kuwait|LA:Laos|LS:Lesoto|LV:Letónia|LB:Líbano|LR:Libéria|LY:Líbia|LI:Listenstaine|LT:Lituânia|LU:Luxemburgo|MO:Macau|MK:Macedónia do Norte|MG:Madagáscar|MY:Malásia|MW:Malawi|MV:Maldivas|ML:Mali|MT:Malta|MA:Marrocos|MU:Maurícia|MR:Mauritânia|MX:México|MM:Mianmar|FM:Micronésia|MZ:Moçambique|MD:Moldávia|MC:Mónaco|MN:Mongólia|ME:Montenegro|NA:Namíbia|NR:Nauru|NP:Nepal|NI:Nicarágua|NE:Níger|NG:Nigéria|NO:Noruega|NZ:Nova Zelândia|OM:Omã|NL:Países Baixos|PW:Palau|PS:Palestina|PA:Panamá|PG:Papua-Nova Guiné|PK:Paquistão|PY:Paraguai|PE:Peru|PL:Polónia|PR:Porto Rico|PT:Portugal|KE:Quénia|KG:Quirguistão|KI:Quiribati|GB:Reino Unido|CF:República Centro-Africana|CZ:República Checa|DO:República Dominicana|RO:Roménia|RW:Ruanda|RU:Rússia|WS:Samoa|LC:Santa Lúcia|KN:São Cristóvão e Nevis|SM:São Marinho|ST:São Tomé e Príncipe|VC:São Vicente e Granadinas|SN:Senegal|SL:Serra Leoa|RS:Sérvia|SG:Singapura|SY:Síria|SO:Somália|LK:Sri Lanka|SD:Sudão|SS:Sudão do Sul|SE:Suécia|CH:Suíça|SR:Suriname|TH:Tailândia|TW:Taiwan|TJ:Tajiquistão|TZ:Tanzânia|TL:Timor-Leste|TG:Togo|TO:Tonga|TT:Trinidad e Tobago|TN:Tunísia|TM:Turquemenistão|TR:Turquia|TV:Tuvalu|UA:Ucrânia|UG:Uganda|UY:Uruguai|UZ:Usbequistão|VU:Vanuatu|VA:Vaticano|VE:Venezuela|VN:Vietname|ZM:Zâmbia|ZW:Zimbabué';
  var NOME = {}, CODS = [];
  LISTA.split('|').forEach(function (s) { var c = s.slice(0, 2); NOME[c] = s.slice(3); CODS.push(c); });
  var TOPO = ['MZ', 'TZ', 'ZA'];

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* códigos fora da lista (os mesmos do 🌐 País / Idioma / Moeda do menu-babilonia.js) aceites pelo nome do telemóvel */
  var DN = null; try { DN = new Intl.DisplayNames(['pt'], { type: 'region' }); } catch (e) {}
  function valido(c) {
    c = String(c || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(c)) return false;
    if (NOME[c]) return true;
    try { var n = DN && DN.of(c); if (n && n !== c) { NOME[c] = n; return true; } } catch (e) {}
    return false;
  }
  /* 🌐 do menu (bb_prefs): só conta o país que o cliente confirmou, nunca o adivinhado pelo idioma do telemóvel */
  function lerPrefs() { try { return JSON.parse(localStorage.getItem('bb_prefs') || 'null') || null; } catch (e) { return null; } }
  function paisPrefs() { var p = lerPrefs(); return p && p.escolhido && valido(p.pais) ? String(p.pais).toUpperCase() : ''; }
  function gravarPrefs(c) {
    try {
      var p = lerPrefs() || {}; if (p.pais === c && p.escolhido) return;
      p.pais = c; p.escolhido = true; if (!p.moeda) p.moeda = 'USD';
      localStorage.setItem('bb_prefs', JSON.stringify(p));
      try { window.dispatchEvent(new CustomEvent('bb-prefs', { detail: p })); } catch (e) {}
    } catch (e) {}
  }
  function local() { try { var c = localStorage.getItem(LK); if (valido(c)) return c.toUpperCase(); } catch (e) {} return paisPrefs(); }
  function lerSK() { try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); return s && s.access_token ? s : null; } catch (e) { return null; } }
  /* usa a ligação da própria página, que renova a sessão sozinha:
     checkout/link → sb (Supabase da página); chat → api() do chat; pais.html → fetch com renovação */
  function temSB() { return typeof sb !== 'undefined' && sb && sb.auth && typeof sb.rpc === 'function'; }
  function temAPI() { return typeof api === 'function' && !temSB(); }
  async function sessao() {
    if (temSB()) { try { var r = await sb.auth.getSession(); return !!(r && r.data && r.data.session); } catch (e) { return false; } }
    return !!lerSK();
  }
  async function renovar() {
    var s = lerSK(); if (!s || !s.refresh_token) return null;
    var r = await fetch(U + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || !j.access_token) return null;
    var n = { access_token: j.access_token, refresh_token: j.refresh_token, token_type: j.token_type || 'bearer', expires_in: j.expires_in, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: j.user || s.user };
    try { localStorage.setItem(SK, JSON.stringify(n)); } catch (e) {}
    return n;
  }
  async function rpc(nome, corpo) {
    if (temSB()) {
      if (!(await sessao())) throw new Error('sem-sessao');
      var r0 = await sb.rpc(nome, corpo || {});
      if (r0.error) throw new Error(r0.error.message || 'Erro');
      return r0.data;
    }
    if (temAPI()) { if (!lerSK()) throw new Error('sem-sessao'); return await api('rpc/' + nome, 'POST', corpo || {}); }
    var s = lerSK(); if (!s) throw new Error('sem-sessao');
    if (s.expires_at && s.expires_at * 1000 < Date.now() + 30000) s = (await renovar()) || s;
    async function chamar(tok) { return fetch(U + '/rest/v1/rpc/' + nome, { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo || {}) }); }
    var r = await chamar(s.access_token);
    if (r.status === 401) { var n = await renovar(); if (n) r = await chamar(n.access_token); }
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) throw new Error((j && j.message) || ('Erro ' + r.status));
    return j;
  }

  var atual = local(), naConta = false, prontos = [];
  /* lê o país da conta (se tiver sessão); se a conta não tem e este telemóvel tem, guarda na conta.
     Se falhar (sessão a renovar, sem internet), tenta outra vez. */
  async function lerConta() {
    if (!(await sessao())) return atual;
    try {
      var c = await rpc('meu_pais');
      if (valido(c)) { atual = c.toUpperCase(); naConta = true; try { localStorage.setItem(LK, atual); } catch (e) {} gravarPrefs(atual); }
      else if (atual) { await rpc('meu_pais_definir', { p_pais: atual }); naConta = true; }
      return atual;
    } catch (e) { throw e; }
  }
  var carregado = new Promise(function (ok) {
    var n = 0;
    (function tenta() {
      lerConta().then(function (c) { ok(c); prontos.forEach(function (f) { try { f(c); } catch (e) {} }); },
        function () { if (++n === 1) ok(atual); if (n < 6) setTimeout(tenta, 1500 * n); });
    })();
  });

  async function definir(c) {
    c = String(c || '').toUpperCase();
    if (!valido(c)) throw new Error('Escolha o seu país na lista.');
    atual = c; try { localStorage.setItem(LK, c); } catch (e) {}
    gravarPrefs(c);
    if (await sessao()) { await rpc('meu_pais_definir', { p_pais: c }); naConta = true; }
    prontos.forEach(function (f) { try { f(c); } catch (e) {} });
    return c;
  }

  function opcoes(sel) {
    if (sel && valido(sel) && CODS.indexOf(sel) < 0) CODS.push(sel);
    var h = '<option value="">— Escolha o seu país —</option><optgroup label="Principais">' +
      TOPO.map(function (c) { return '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + esc(NOME[c]) + '</option>'; }).join('') +
      '</optgroup><optgroup label="Todos os países">' +
      CODS.filter(function (c) { return TOPO.indexOf(c) < 0; }).map(function (c) { return '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + esc(NOME[c]) + '</option>'; }).join('') + '</optgroup>';
    return h;
  }

  /* 🔍 janela com pesquisa, igual ao 🌐 País / Idioma / Moeda: o botão abre a lista e escreve-se para procurar */
  function semAc(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  var cssJ = d.createElement('style');
  cssJ.textContent = '.bbp-campo{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;padding:12px;border:2px solid #FF6A00;border-radius:12px;font-size:16px;background:#fff;color:#1b1740;font-family:inherit;cursor:pointer;margin:0}' +
    '.bbp-campo b{font-weight:400}.bbp-campo.vazio span{color:#64748b}' +
    '.bbp-fundo{position:fixed;inset:0;z-index:99990;background:rgba(17,14,34,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif}' +
    '.bbp-jan{background:#fff;color:#1b1740;border-radius:22px;width:100%;max-width:420px;height:min(640px,calc(100vh - 32px));display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px #0006;color-scheme:light}' +
    '.bbp-topo{display:flex;align-items:center;gap:10px;padding:14px 14px 8px;font-size:17px}.bbp-volta{border:0;background:#f1f1f1;width:36px;height:36px;border-radius:50%;font-size:24px;line-height:1;color:#222;margin:0;padding:0}' +
    '.bbp-busca{margin:0 14px 8px;display:flex;align-items:center;gap:6px;border:2px solid #FF6A00;border-radius:999px;padding:0 12px}.bbp-busca input{flex:1;border:0;padding:11px 0;font-size:16px;background:transparent;color:#222;min-width:0;margin:0;width:auto}.bbp-busca input:focus{outline:none}' +
    '.bbp-itens{flex:1;overflow-y:auto;padding:0 6px 10px}.bbp-grupo{font-size:12.5px;font-weight:800;color:#64748b;padding:10px 10px 4px}' +
    '.bbp-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;border:0;border-bottom:1px solid #eee;background:#fff;padding:13px 10px;font-size:15px;color:#222;margin:0;border-radius:0;font-weight:400}' +
    '.bbp-item i{font-style:normal;color:#888;font-size:13px}.bbp-item.on{background:#FFF4EC;font-weight:700}.bbp-item.on i{color:#FF6A00}.bbp-nada{text-align:center;color:#888;padding:30px}';
  d.head.appendChild(cssJ);
  function janela(atualSel, escolher) {
    if (d.querySelector('.bbp-fundo')) return;
    var f = d.createElement('div'); f.className = 'bbp-fundo';
    f.innerHTML = '<div class="bbp-jan" role="dialog" aria-label="O seu país"><div class="bbp-topo"><button type="button" class="bbp-volta" aria-label="Fechar">‹</button><b>🌍 O seu país (onde está)</b></div>' +
      '<div class="bbp-busca"><span>🔍</span><input type="search" placeholder="Pesquisar país" autocomplete="off" aria-label="Pesquisar país"></div><div class="bbp-itens"></div></div>';
    var inp = f.querySelector('input'), box = f.querySelector('.bbp-itens');
    var todos = CODS.slice().sort(function (a, b) { return NOME[a].localeCompare(NOME[b], 'pt'); });
    function item(c) { return '<button type="button" class="bbp-item' + (c === atualSel ? ' on' : '') + '" data-c="' + c + '"><span>' + esc(NOME[c]) + '</span><i>' + c + '</i></button>'; }
    function pinta() {
      var q = semAc(inp.value.trim());
      var ok = function (c) { return !q || semAc(NOME[c]).indexOf(q) >= 0 || semAc(c).indexOf(q) >= 0; };
      var top = TOPO.filter(ok), resto = todos.filter(function (c) { return TOPO.indexOf(c) < 0 && ok(c); });
      box.innerHTML = (top.length || resto.length)
        ? (top.length ? '<div class="bbp-grupo">Principais</div>' + top.map(item).join('') : '') + (resto.length ? '<div class="bbp-grupo">Todos os países</div>' + resto.map(item).join('') : '')
        : '<p class="bbp-nada">Nada encontrado</p>';
    }
    function fechar() { f.remove(); }
    box.onclick = function (e) { var b = e.target.closest('.bbp-item'); if (!b) return; fechar(); escolher(b.getAttribute('data-c')); };
    f.querySelector('.bbp-volta').onclick = fechar;
    f.addEventListener('click', function (e) { if (e.target === f) fechar(); });
    inp.oninput = pinta; pinta();
    d.body.appendChild(f);
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
  }
  /* botão "— Escolha o seu país — 🔍" ligado a um select escondido (o valor fica no select) */
  function campo(selId) {
    var w = d.createElement('div');
    w.innerHTML = '<button type="button" class="bbp-campo vazio" id="' + selId + '-b"><span>— Escolha o seu país —</span><b>🔍</b></button><select id="' + selId + '" hidden aria-hidden="true">' + opcoes('') + '</select>';
    var b = w.firstChild, s = w.lastChild;
    function mostra() { var c = s.value; b.querySelector('span').textContent = c ? NOME[c] : '— Escolha o seu país —'; b.classList.toggle('vazio', !c); }
    b.onclick = function () { janela(s.value, function (c) { if (!s.querySelector('option[value="' + c + '"]')) s.innerHTML = opcoes(c); s.value = c; mostra(); s.dispatchEvent(new Event('change')); }); };
    s.mostra = mostra;
    return { b: b, s: s, mostra: mostra };
  }

  /* caixa reutilizável: título + lista + mensagem; guarda ao escolher */
  function caixa(id, tema) {
    var claro = tema !== 'escuro';
    var cx = d.createElement('div'); cx.id = id; cx.className = 'bb-pais-cx';
    cx.style.cssText = 'margin:10px 0;padding:12px;border-radius:12px;border:2px solid ' + (claro ? '#0ea5e9;background:#f0f9ff;color:#0f172a' : '#d9a93f;background:#1d2335;color:#e9ecf2');
    cx.innerHTML = '<label for="' + id + '-s-b" style="display:block;font-weight:800;font-size:15px;margin:0 0 6px;color:inherit">🌍 O seu país (onde está) *</label>' +
      '<div id="' + id + '-m" style="font-size:13.5px;margin-top:6px;min-height:18px"></div>';
    var cp = campo(id + '-s'); cx.insertBefore(cp.b, cx.lastChild); cx.insertBefore(cp.s, cx.lastChild);
    var s = cp.s, m = cx.querySelector('#' + id + '-m');
    if (atual) { s.innerHTML = opcoes(atual); s.value = atual; cp.mostra(); }
    function msg(t, erro) { m.textContent = t || ''; m.style.color = erro ? '#ef4444' : (claro ? '#047857' : '#2e9d62'); }
    s.addEventListener('change', function () {
      if (!s.value) { msg('Escolha o seu país.', true); return; }
      msg('A guardar…');
      definir(s.value).then(function () { msg('✔ País guardado: ' + NOME[s.value]); }, function (e) {
        msg(e.message === 'sem-sessao' ? '✔ País escolhido: ' + NOME[s.value] : (e.message || 'Não foi possível guardar.'), e.message !== 'sem-sessao');
      });
    });
    carregado.then(function (c) { if (c && !s.value) { s.innerHTML = opcoes(c); s.value = c; cp.mostra(); } if (c) msg('✔ ' + NOME[c]); });
    prontos.push(function (c) { if (c && s.value !== c) { s.innerHTML = opcoes(c); s.value = c; cp.mostra(); msg('✔ ' + NOME[c]); cp.b.style.borderColor = ''; } });
    s.addEventListener('change', function () { cp.b.style.borderColor = ''; });
    cx.marcarErro = function () { msg('Escolha o seu país antes de continuar.', true); cp.b.style.borderColor = '#ef4444'; cx.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { cp.b.focus(); } catch (e) {} };
    return cx;
  }

  window.addEventListener('bb-prefs', function (e) {
    var c = e && e.detail && e.detail.escolhido && String(e.detail.pais || '').toUpperCase();
    if (c && valido(c) && c !== atual) definir(c).catch(function () {});
  });

  window.BBPais = { nome: function (c) { return NOME[c] || ''; }, obter: function () { return atual; }, carregado: carregado, definir: definir, caixa: caixa, valido: valido, aoMudar: function (f) { prontos.push(f); } };

  /* trava um botão (clique e Enter) enquanto não houver país; corre antes dos outros scripts da página */
  function travar(seletor, cx, depois) {
    window.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest(seletor) : null;
      if (!b) return;
      if (valido(atual)) { if (depois) depois(); return; }
      e.preventDefault(); e.stopImmediatePropagation(); cx.marcarErro();
    }, true);
  }

  /* ---------- checkout.html ---------- */
  if ($('continuar') && $('pag') && $('dados')) {
    var cxC = caixa('bb-pais', 'escuro');
    $('dados').insertBefore(cxC, $('dados').firstChild);
    travar('#continuar', cxC);
    /* 💵 Moçambique: pagamento dos produtos por levantamento (checkout-levantamento.js) */
    (function () { var sl = d.createElement('script'); sl.src = 'checkout-levantamento.js?v=1'; d.body.appendChild(sl); })();
    /* o pedido leva o país do cliente (o checkout grava com o sb da própria página) */
    try {
      if (typeof sb !== 'undefined' && sb && typeof sb.from === 'function' && !sb.__bbPais) {
        sb.__bbPais = 1;
        var from0 = sb.from.bind(sb);
        sb.from = function (t) {
          var q = from0(t);
          if (t === 'orders' && q && typeof q.insert === 'function') {
            var ins0 = q.insert.bind(q);
            q.insert = function (linha) {
              var p = atual;
              if (Array.isArray(linha)) linha = linha.map(function (x) { return Object.assign({ cliente_pais: p }, x); });
              else if (linha && typeof linha === 'object') linha = Object.assign({ cliente_pais: p }, linha);
              return ins0.apply(null, [linha].concat([].slice.call(arguments, 1)));
            };
          }
          return q;
        };
      }
    } catch (e) {}
    return;
  }

  /* ---------- pagar-link-v2.html ---------- */
  if ($('cont') && $('payBox')) {
    var cxL = caixa('bb-pais', 'claro');
    var h2 = $('payBox').querySelector('h2');
    if (h2) h2.insertAdjacentElement('afterend', cxL); else $('payBox').insertBefore(cxL, $('payBox').firstChild);
    /* o link exige conta: o país tem de estar guardado na conta antes de criar o pedido */
    window.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('#cont,#bb-mpb') : null;
      if (!b) return;
      if (valido(atual) && naConta) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!valido(atual)) { cxL.marcarErro(); return; }
      definir(atual).then(function () { b.click(); }, function () { cxL.marcarErro(); });
    }, true);
    return;
  }

  /* ---------- chat ---------- */
  if ($('partilhar') && $('rodape')) {
    var css = d.createElement('style');
    css.textContent = '#partilhar.bb-sem-pais{opacity:.4;pointer-events:none;cursor:not-allowed;text-decoration:none}' +
      '#bb-pais-chat{display:none;margin:0 0 6px;padding:8px 10px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74;font-size:13.5px}' +
      '#bb-pais-chat .m{font-size:12.5px;margin-top:4px;min-height:16px}';
    d.head.appendChild(css);
    var box = d.createElement('div'); box.id = 'bb-pais-chat';
    box.innerHTML = '<div style="margin-bottom:6px">📍 Para partilhar o endereço de entrega, escolha primeiro <b>o seu país</b>:</div><div class="m" id="bb-pais-chat-m"></div>';
    var cpc = campo('bb-pais-chat-s'); box.insertBefore(cpc.b, box.lastChild); box.insertBefore(cpc.s, box.lastChild);
    var p = $('partilhar'); p.parentNode.insertBefore(box, p);
    var sc = cpc.s, mc = $('bb-pais-chat-m');
    sc.addEventListener('change', function () {
      if (!sc.value) return;
      mc.style.color = '#555'; mc.textContent = 'A guardar…';
      definir(sc.value).then(function () { mc.textContent = ''; ver(); try { if (window.BBMzRever) window.BBMzRever(); } catch (e) {} },
        function (e) { mc.style.color = '#d93025'; mc.textContent = e.message === 'sem-sessao' ? 'Entre na sua conta para guardar o país.' : (e.message || 'Não foi possível guardar.'); });
    });
    /* clique no botão sem país (segurança extra) */
    p.addEventListener('click', function (e) { if (!naConta) { e.preventDefault(); e.stopImmediatePropagation(); box.style.display = 'block'; } }, true);
    function ver() {
      var c = (typeof conv !== 'undefined') ? conv : null, euId = (typeof eu !== 'undefined') ? eu : null;
      var souCliente = !!(c && String(c.cliente_id) === String(euId));
      var mz = d.body.classList.contains('bb-mz');
      var falta = souCliente && !naConta;
      p.classList.toggle('bb-sem-pais', falta);
      p.title = falta ? 'Escolha primeiro o seu país' : '';
      box.style.display = falta && !mz ? 'block' : 'none';
    }
    carregado.then(ver); setInterval(ver, 600); ver();
  }
})();
