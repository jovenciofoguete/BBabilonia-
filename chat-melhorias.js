/* chat-melhorias.js — BBabilônia (versão 2)
   Carregado pelo chat-novo.html dentro do chat.html (depois dos outros ficheiros do chat). Não altera nenhum ficheiro.
   1) Bloqueia "chamada"/"chamadas" em qualquer mensagem ("seu número" sozinho continua a passar).
   2) Envio mais rápido: a verificação por tradução espera no máximo 3 segundos (antes podia ficar presa).
   3) O chat fica sempre na última mensagem (também depois de as fotos carregarem), a não ser que a pessoa
      tenha subido para ler mensagens antigas.
   4) Apagar mensagem: carregar sem largar numa mensagem sua → "Apagar para todos".
      Versão 2: só até 2 minutos depois de enviar; a mensagem apagada desaparece (sem "Mensagem apagada"). */
(function () {
  if (window.__bbChatMelhorias) return;
  window.__bbChatMelhorias = 1;

  var BLOQ = 'Não pode pedir ou enviar contactos (número, telefone, email) fora da plataforma.';
  var LIMITE = 2 * 60 * 1000;   // 2 minutos para apagar
  var TARDE = 'Já não pode apagar: só até 2 minutos depois de enviar.';
  var $ = function (i) { return document.getElementById(i); };

  function normal(t) {
    t = String(t || '').toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t;
  }

  /* ---------- 1) "chamada" bloqueada ---------- */
  var CHAMADA = /\bchamadas?\b/;
  function protegerEnvio() {
    if (typeof window.mandar !== 'function' || window.mandar.__bbM) return;
    var antes = window.mandar;
    var novo = async function (msg) {
      if (msg && msg.tipo === 'texto' && msg.texto && CHAMADA.test(normal(msg.texto))) {
        // o chat volta a verificar o texto logo a seguir e esconderia o aviso: mostra-o um instante depois
        setTimeout(function () { aviso(BLOQ); }, 80);
        throw new Error(BLOQ);
      }
      enviando = Date.now();
      colado = true;
      return antes.apply(this, arguments);
    };
    novo.__bbM = 1;
    window.mandar = novo;
  }

  /* ---------- 2) tradução no envio: no máximo 3 segundos ---------- */
  var enviando = 0;
  var fetchOriginal = window.fetch;
  window.fetch = function (url, opts) {
    var u = String((url && url.url) || url || '');
    var traducao = /translate\.googleapis\.com|api\.mymemory\.translated\.net/.test(u);
    if (!traducao || Date.now() - enviando > 15000) return fetchOriginal.apply(this, arguments);
    var original = '';
    try { original = decodeURIComponent((u.match(/[?&]q=([^&]*)/) || [])[1] || '').replace(/\+/g, ' '); } catch (e) {}
    var falso = /mymemory/.test(u)
      ? JSON.stringify({ responseData: { translatedText: original } })
      : JSON.stringify([[[original, original]], null, '']);
    return Promise.race([
      fetchOriginal.apply(this, arguments),
      new Promise(function (ok) {
        setTimeout(function () { ok(new Response(falso, { status: 200, headers: { 'Content-Type': 'application/json' } })); }, 3000);
      })
    ]);
  };

  /* ---------- 3) ficar na última mensagem ---------- */
  var colado = true;
  function box() { return $('msgs'); }
  function noFundo(b) { return b.scrollHeight - b.scrollTop - b.clientHeight < 120; }
  function descer() { var b = box(); if (b && colado) b.scrollTop = b.scrollHeight; }
  function vigiarRolagem() {
    var b = box();
    if (!b || b.__bbR) return !!b;
    b.__bbR = 1;
    var tocar = false;
    b.addEventListener('touchstart', function () { tocar = true; }, { passive: true });
    b.addEventListener('touchend', function () { setTimeout(function () { tocar = false; }, 400); }, { passive: true });
    b.addEventListener('wheel', function () { tocar = true; setTimeout(function () { tocar = false; }, 400); }, { passive: true });
    b.addEventListener('scroll', function () { if (tocar) colado = noFundo(b); }, { passive: true });
    // fotos que acabam de carregar mudam a altura: volta a descer se estava no fim
    b.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IMG') descer(); }, true);
    // o chat volta a desenhar as mensagens a cada atualização
    new MutationObserver(function () { descer(); setTimeout(descer, 60); }).observe(b, { childList: true });
    var env = $('enviar');
    if (env) env.addEventListener('click', function () { colado = true; }, true);
    return true;
  }

  /* ---------- 4) apagar mensagem (até 2 minutos) ---------- */
  var menu = null;
  function fecharMenu() { if (menu) { menu.remove(); menu = null; } }
  function aviso(t) {
    var a = $('aviso');
    if (a) { a.textContent = t; a.style.display = 'block'; setTimeout(function () { a.style.display = 'none'; }, 4000); }
    else alert(t);
  }
  async function idDaMensagem(el) {
    var b = box(), els = Array.prototype.slice.call(b.querySelectorAll('.m'));
    var i = els.indexOf(el);
    if (i < 0 || !window.conv || typeof window.api !== 'function') return null;
    var lista = await window.api('mensagens?select=id,remetente_id,created_at&conversa_id=eq.' + window.conv.id + '&order=created_at.asc');
    if (!lista || lista.length !== els.length) return null;
    return lista[i];
  }
  function passou(m) {
    var t = Date.parse(m && m.created_at);
    return !isNaN(t) && Date.now() - t > LIMITE;
  }
  /* antes de abrir o menu: confirma a hora; depois dos 2 minutos só mostra o aviso */
  async function talvezAbrir(el, x, y) {
    try {
      var m = await idDaMensagem(el);
      if (m && passou(m)) { aviso(TARDE); return; }
      abrirMenu(el, x, y, m);
    } catch (e) { abrirMenu(el, x, y, null); }
  }
  function abrirMenu(el, x, y, m0) {
    fecharMenu();
    menu = document.createElement('div');
    menu.id = 'bb-apagar';
    menu.style.cssText = 'position:fixed;z-index:99999;background:#fff;border-radius:12px;box-shadow:0 4px 18px #0004;overflow:hidden;font:15px system-ui,sans-serif';
    menu.innerHTML = '<button type="button" data-a="apagar" style="display:block;width:100%;padding:14px 22px;border:0;background:#fff;color:#c00;font:inherit;text-align:left">🗑️ Apagar para todos</button>' +
      '<button type="button" data-a="nao" style="display:block;width:100%;padding:12px 22px;border:0;border-top:1px solid #eee;background:#fff;color:#333;font:inherit;text-align:left">Cancelar</button>';
    document.body.appendChild(menu);
    var w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y - h - 10, window.innerHeight - h - 8)) + 'px';
    menu.onclick = async function (e) {
      var a = e.target && e.target.getAttribute('data-a');
      if (a === 'nao') return fecharMenu();
      if (a !== 'apagar') return;
      e.target.disabled = true; e.target.textContent = 'A apagar…';
      try {
        var m = m0 || await idDaMensagem(el);
        if (!m) throw new Error('Atualize a conversa e tente outra vez.');
        if (passou(m)) throw new Error(TARDE);
        await window.api('rpc/apagar_mensagem', 'POST', { p_id: String(m.id) });
        fecharMenu();
        el.remove();               // desaparece logo, sem "Mensagem apagada"
        window.ultimo = '';
        if (typeof window.carregar === 'function') await window.carregar(true);
      } catch (err) {
        fecharMenu();
        aviso(/apagar_mensagem/.test(err.message) ? 'Falta correr o SQL de apagar mensagens no Supabase.' : (err.message || 'Não foi possível apagar.'));
      }
    };
  }
  function vigiarApagar() {
    var b = box();
    if (!b || b.__bbA) return;
    b.__bbA = 1;
    var t = null, alvo = null, px = 0, py = 0;
    function minha(e) {
      var el = e.target && e.target.closest && e.target.closest('.m');
      if (!el || !el.classList.contains('eu')) return null;
      return el;
    }
    b.addEventListener('touchstart', function (e) {
      alvo = minha(e); if (!alvo) return;
      px = e.touches[0].clientX; py = e.touches[0].clientY;
      clearTimeout(t);
      t = setTimeout(function () { if (alvo) talvezAbrir(alvo, px, py); }, 550);
    }, { passive: true });
    b.addEventListener('touchmove', function (e) {
      if (Math.abs(e.touches[0].clientX - px) > 10 || Math.abs(e.touches[0].clientY - py) > 10) clearTimeout(t);
    }, { passive: true });
    b.addEventListener('touchend', function () { clearTimeout(t); }, { passive: true });
    b.addEventListener('contextmenu', function (e) {
      var el = minha(e); if (!el) return;
      e.preventDefault(); clearTimeout(t); talvezAbrir(el, e.clientX, e.clientY);
    });
    document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target)) fecharMenu(); }, true);
    var st = document.createElement('style');
    st.textContent = '#msgs .m.eu{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';
    document.head.appendChild(st);
  }

  /* liga tudo (o chat pode ainda estar a abrir) */
  var n = 0;
  (function ligar() {
    protegerEnvio();
    var ok = vigiarRolagem();
    vigiarApagar();
    if (!ok || typeof window.mandar !== 'function') { if (++n < 200) setTimeout(ligar, 150); return; }
    // volta a confirmar mais tarde (outros ficheiros do chat podem trocar o envio depois)
    setTimeout(protegerEnvio, 1500); setTimeout(protegerEnvio, 5000);
  })();
})();
