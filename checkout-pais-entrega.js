/* checkout-pais-entrega.js — BBabilônia
   No checkout: se o fornecedor de algum produto do carrinho NÃO envia para o país do endereço escolhido,
   mostra "Este fornecedor não manda para o seu país" e pede para selecionar ou registar o endereço
   do agente de transporte no mesmo país do vendedor. O botão de continuar fica bloqueado até corrigir.
   Regras: loja com "Envia para todo o mundo" aceita tudo; país da própria loja (entrega interna) é sempre aceite.
   Se não for possível confirmar (sem internet, produto sem loja), não bloqueia: o checkout funciona como antes.
   Ficheiro novo: não altera o checkout.html nem o checkout-morada.js. */
(function () {
  if (window.__bbPaisEntrega) return; window.__bbPaisEntrega = 1;
  var U = 'https://dsfoqoeawvjafypycldz.supabase.co', K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var $ = function (i) { return document.getElementById(i); };
  if (!$('continuar') || !$('pais')) return;

  /* mesmos nomes de países do moradas-v3.html (o endereço guarda o nome, a loja guarda o código) */
  var LISTA = 'AF:Afeganistão|ZA:África do Sul|AL:Albânia|DE:Alemanha|AD:Andorra|AO:Angola|AG:Antígua e Barbuda|SA:Arábia Saudita|DZ:Argélia|AR:Argentina|AM:Arménia|AU:Austrália|AT:Áustria|AZ:Azerbaijão|BS:Baamas|BD:Bangladesh|BB:Barbados|BH:Bahrein|BE:Bélgica|BZ:Belize|BJ:Benim|BY:Bielorrússia|BO:Bolívia|BA:Bósnia e Herzegovina|BW:Botsuana|BR:Brasil|BN:Brunei|BG:Bulgária|BF:Burquina Faso|BI:Burundi|BT:Butão|CV:Cabo Verde|CM:Camarões|KH:Camboja|CA:Canadá|QA:Catar|KZ:Cazaquistão|TD:Chade|CL:Chile|CN:China|CY:Chipre|CO:Colômbia|KM:Comores|CG:Congo|CD:Congo (RDC)|KR:Coreia do Sul|CI:Costa do Marfim|CR:Costa Rica|HR:Croácia|CU:Cuba|DK:Dinamarca|DJ:Jibuti|DM:Dominica|EG:Egito|SV:El Salvador|AE:Emirados Árabes Unidos|EC:Equador|ER:Eritreia|SK:Eslováquia|SI:Eslovénia|ES:Espanha|US:Estados Unidos|EE:Estónia|SZ:Essuatíni|ET:Etiópia|FJ:Fiji|PH:Filipinas|FI:Finlândia|FR:França|GA:Gabão|GM:Gâmbia|GH:Gana|GE:Geórgia|GD:Granada|GR:Grécia|GT:Guatemala|GY:Guiana|GN:Guiné|GQ:Guiné Equatorial|GW:Guiné-Bissau|HT:Haiti|HN:Honduras|HK:Hong Kong|HU:Hungria|YE:Iémen|MH:Ilhas Marshall|SB:Ilhas Salomão|IN:Índia|ID:Indonésia|IR:Irão|IQ:Iraque|IE:Irlanda|IS:Islândia|IL:Israel|IT:Itália|JM:Jamaica|JP:Japão|JO:Jordânia|XK:Kosovo|KW:Kuwait|LA:Laos|LS:Lesoto|LV:Letónia|LB:Líbano|LR:Libéria|LY:Líbia|LI:Listenstaine|LT:Lituânia|LU:Luxemburgo|MO:Macau|MK:Macedónia do Norte|MG:Madagáscar|MY:Malásia|MW:Malawi|MV:Maldivas|ML:Mali|MT:Malta|MA:Marrocos|MU:Maurícia|MR:Mauritânia|MX:México|MM:Mianmar|FM:Micronésia|MZ:Moçambique|MD:Moldávia|MC:Mónaco|MN:Mongólia|ME:Montenegro|NA:Namíbia|NR:Nauru|NP:Nepal|NI:Nicarágua|NE:Níger|NG:Nigéria|NO:Noruega|NZ:Nova Zelândia|OM:Omã|NL:Países Baixos|PW:Palau|PS:Palestina|PA:Panamá|PG:Papua-Nova Guiné|PK:Paquistão|PY:Paraguai|PE:Peru|PL:Polónia|PR:Porto Rico|PT:Portugal|KE:Quénia|KG:Quirguistão|KI:Quiribati|GB:Reino Unido|CF:República Centro-Africana|CZ:República Checa|DO:República Dominicana|RO:Roménia|RW:Ruanda|RU:Rússia|WS:Samoa|LC:Santa Lúcia|KN:São Cristóvão e Nevis|SM:São Marinho|ST:São Tomé e Príncipe|VC:São Vicente e Granadinas|SN:Senegal|SL:Serra Leoa|RS:Sérvia|SG:Singapura|SY:Síria|SO:Somália|LK:Sri Lanka|SD:Sudão|SS:Sudão do Sul|SE:Suécia|CH:Suíça|SR:Suriname|TH:Tailândia|TW:Taiwan|TJ:Tajiquistão|TZ:Tanzânia|TL:Timor-Leste|TG:Togo|TO:Tonga|TT:Trinidad e Tobago|TN:Tunísia|TM:Turquemenistão|TR:Turquia|TV:Tuvalu|UA:Ucrânia|UG:Uganda|UY:Uruguai|UZ:Usbequistão|VU:Vanuatu|VA:Vaticano|VE:Venezuela|VN:Vietname|ZM:Zâmbia|ZW:Zimbabué';
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  var COD = {}, NOME = {};
  LISTA.split('|').forEach(function (s) { var c = s.slice(0, 2), n = s.slice(3); COD[norm(n)] = c; NOME[c] = n; });
  try {   // também os nomes do loja-criar.html (Intl, em português) e em inglês
    var dn = new Intl.DisplayNames(['pt'], { type: 'region' }), de = new Intl.DisplayNames(['en'], { type: 'region' });
    Object.keys(NOME).forEach(function (c) { COD[norm(dn.of(c))] = COD[norm(dn.of(c))] || c; COD[norm(de.of(c))] = COD[norm(de.of(c))] || c; });
  } catch (e) {}
  ['mozambique:MZ', 'eua:US', 'usa:US', 'china continental:CN', 'south africa:ZA', 'uk:GB'].forEach(function (x) { var p = x.split(':'); COD[p[0]] = p[1]; });
  function codigo(nome) { var n = norm(nome); if (!n) return ''; if (/^[a-z]{2}$/.test(n)) return n.toUpperCase(); return COD[n] || ''; }
  function nomePais(c) { return NOME[c] || c; }
  function lista(x) {
    if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { x = x.replace(/[{}"]/g, '').split(','); } }
    return Array.isArray(x) ? x.map(function (v) { return String(v).trim().toUpperCase(); }).filter(Boolean) : [];
  }
  function sim(v) { return v === true || v === 'true' || v === 't' || v === 1; }

  var lojas = null, aCarregar = null;
  function token() {
    try { var s = JSON.parse(localStorage.getItem('sb-dsfoqoeawvjafypycldz-auth-token') || 'null'); return (s && s.access_token) || K; } catch (e) { return K; }
  }
  function carregarLojas() {
    if (aCarregar) return aCarregar;
    aCarregar = (async function () {
      var itens = []; try { itens = JSON.parse(localStorage.getItem('carrinho') || '[]') || []; } catch (e) {}
      var ids = Array.from(new Set(itens.map(function (i) { return i.id || i.produto_id || i.product_id; }).filter(Boolean)));
      if (!ids.length) return [];
      var h = { apikey: K, Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' };
      var urlP = U + '/rest/v1/products?select=id,name,supplier_id&id=in.(' + ids.map(encodeURIComponent).join(',') + ')';
      var r = await fetch(urlP, { headers: h });
      if (r.status === 401) { h.Authorization = 'Bearer ' + K; r = await fetch(urlP, { headers: h }); }   // sessão expirada: lê como visitante
      if (!r.ok) return null;
      var prods = await r.json();
      var donos = Array.from(new Set(prods.map(function (p) { return p.supplier_id; }).filter(Boolean).map(String)));
      if (!donos.length) return [];
      var r2 = await fetch(U + '/rest/v1/rpc/envio_lojas', { method: 'POST', headers: h, body: JSON.stringify({ donos: donos }) });
      if (!r2.ok) return null;
      var ls = await r2.json();
      return (ls || []).map(function (l) {
        return {
          dono: String(l.dono_id), nome: l.nome || 'Fornecedor', pais: String(l.pais || '').toUpperCase(),
          mundo: sim(l.envia_mundo), paises: lista(l.paises_entrega),
          produtos: prods.filter(function (p) { return String(p.supplier_id) === String(l.dono_id); }).map(function (p) { return p.name; })
        };
      });
    })().catch(function () { return null; }).then(function (res) {
      if (res === null) setTimeout(function () { aCarregar = null; }, 5000);   // falhou (ex.: sem internet): tenta outra vez daqui a 5 s
      return res;
    });
    return aCarregar;
  }

  /* devolve a lista de lojas que NÃO enviam para o país escolhido */
  function recusam(paisCod) {
    if (!lojas || !paisCod) return [];
    return lojas.filter(function (l) {
      if (l.mundo) return false;
      if (l.pais && l.pais === paisCod) return false;          // mesmo país do vendedor (agente ou entrega interna)
      if (!l.paises.length && !l.pais) return false;           // loja sem dados: não bloqueia
      return l.paises.indexOf(paisCod) < 0;
    });
  }

  var caixa = document.createElement('div');
  caixa.id = 'bb-pais-aviso';
  caixa.style.cssText = 'display:none;background:#3a1418;border:1px solid #ff7a7a;color:#ffd7d7;border-radius:10px;padding:12px;margin:12px 0;font-size:15px;line-height:1.45';
  var dados = $('dados'); if (dados && dados.parentNode) dados.parentNode.insertBefore(caixa, dados); else document.body.appendChild(caixa);

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mostrar(rec, paisTxt) {
    if (!rec.length) { caixa.style.display = 'none'; caixa.innerHTML = ''; return; }
    caixa.innerHTML = rec.map(function (l) {
      return '<b>🚫 Este fornecedor não manda para o seu país' + (paisTxt ? ' (' + esc(paisTxt) + ')' : '') + '.</b><br>' +
        '<span>Fornecedor: ' + esc(l.nome) + (l.produtos.length ? ' — ' + esc(l.produtos.join(', ')) : '') + '</span><br>' +
        'Selecione ou registe o endereço do seu <b>agente de transporte</b> no mesmo país do vendedor' + (l.pais ? ' (<b>' + esc(nomePais(l.pais)) + '</b>)' : '') + '.';
    }).join('<hr style="border:0;border-top:1px solid #ff7a7a55;margin:10px 0">') +
      '<br><a href="/moradas-v3.html" style="display:inline-block;margin-top:10px;color:#fff;background:#d9a93f;color:#111;font-weight:700;padding:9px 14px;border-radius:8px;text-decoration:none">+ Registar endereço do agente</a>';
    caixa.style.display = 'block';
  }

  var ultimo = null;
  async function verificar() {
    lojas = await carregarLojas();
    var txt = $('pais').value;
    var rec = recusam(codigo(txt));
    var chave = txt + '|' + rec.length;
    if (chave !== ultimo) { ultimo = chave; mostrar(rec, txt); }
    return rec;
  }
  setInterval(function () { if ($('dados') && !$('dados').hidden) verificar(); }, 800);
  verificar();

  /* bloqueia o "Continuar para o pagamento" enquanto o país não for aceite */
  var liberado = false;
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#continuar') : null;
    if (!b || liberado) return;
    e.preventDefault(); e.stopImmediatePropagation();
    verificar().then(function (rec) {
      if (rec.length) { caixa.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      liberado = true;
      try { b.click(); } finally { liberado = false; }
    });
  }, true);
})();
  
