/* inicio-v2.js — correções da página inicial (não altera o index.html)
   1) categorias com o mesmo nome aparecem todas, com o grupo à frente (ex.: "Mulher · Acessórios")
   2) foto: usa image_url ou, se não houver, a primeira foto da coluna images
   3) só mostra produtos de lojas aprovadas (quando a lista de lojas pode ser lida) */
(function(){
  function fotoDe(p){
    if(p.image_url) return p.image_url;
    var im = p.images;
    if(typeof im === "string"){ try{ im = JSON.parse(im); }catch(e){ return im; } }
    if(Array.isArray(im) && im.length){
      var a = im[0];
      return typeof a === "string" ? a : (a && (a.url || a.foto || a.src)) || "";
    }
    return "";
  }

  function paiDe(c){ return categorias.find(function(x){ return x.id === c.parent_id; }); }

  /* nomes repetidos: mostra o grupo à frente */
  function rotulo(c, repetidos){
    var nome = nomeDe(c).trim();
    if(!repetidos[nome.toLowerCase()]) return nome;
    var pai = paiDe(c);
    return pai ? nomeDe(pai) + " · " + nome : nome;
  }

  listaTopo = function(){
    var vistos = {}, lista = [], conta = {}, repetidos = {};
    categorias.forEach(function(c){
      var k = nomeDe(c).trim().toLowerCase();
      conta[k] = (conta[k] || 0) + 1;
      if(conta[k] > 1) repetidos[k] = true;
    });
    function juntar(c){ if(!vistos[c.id]){ vistos[c.id] = 1; lista.push(c); } }
    PRIORIDADE.forEach(function(re){
      categorias.filter(function(c){ return re.test(nomeDe(c)); })
        .sort(function(a,b){ return nivel(a) - nivel(b); })
        .slice(0, 4).forEach(juntar);
    });
    categorias.filter(function(c){ return c.parent_id == null; }).forEach(juntar);
    categorias.filter(function(c){ return nivel(c) === 1; }).forEach(juntar);
    lista.forEach(function(c){ c._rotulo = rotulo(c, repetidos); });
    return lista;
  };

  desenharCategorias = function(){
    var nav = $("cats"), lista = listaTopo();
    nav.innerHTML = "";
    var todas = document.createElement("button");
    todas.textContent = "Tudo"; todas.setAttribute("aria-pressed", catAtual === null);
    todas.onclick = function(){ escolher(null); };
    nav.appendChild(todas);
    lista.forEach(function(c){
      var b = document.createElement("button");
      b.textContent = c._rotulo || nomeDe(c);
      b.setAttribute("aria-pressed", catAtual === c.id);
      b.onclick = function(){ escolher(c.id); };
      nav.appendChild(b);
    });
  };

  /* põe a foto certa nos produtos que só têm a coluna images */
  function corrigirFotos(){
    produtos.forEach(function(p){ if(!p.image_url){ var f = fotoDe(p); if(f) p.image_url = f; } });
  }

  /* lojas aprovadas */
  var aprovados = null;
  function donoDe(p){ return p.loja_id || p.user_id || p.fornecedor_id || p.supplier_id || p.owner_id || null; }
  function filtrarLojas(){
    if(!aprovados) return;
    produtos = produtos.filter(function(p){
      var d = donoDe(p);
      return !d || aprovados[d];   /* produtos sem dono (do admin) continuam a aparecer */
    });
  }
  function carregarLojas(){
    return get("lojas", "select=*").then(function(ls){
      if(!ls || !ls.length) return;                 /* lista não pública: não filtra */
      var mapa = {}, todos = {};
      ls.forEach(function(l){
        var ids = [l.id, l.user_id, l.owner_id, l.dono_id].filter(Boolean);
        ids.forEach(function(i){ todos[i] = 1; });
        if(String(l.estado || l.status || "").toLowerCase().indexOf("aprovad") === 0)
          ids.forEach(function(i){ mapa[i] = 1; });
      });
      /* produtos de alguém sem loja registada (ex.: admin) continuam visíveis */
      aprovados = new Proxy(mapa, { get: function(m, k){ return m[k] || !todos[k]; } });
    }).catch(function(){});
  }

  var desenharOriginal = desenhar;
  desenhar = function(){ corrigirFotos(); filtrarLojas(); desenharOriginal(); };

  carregarLojas().then(function(){
    if(produtos.length){ desenharCategorias(); desenhar(); }
  });
  if(produtos.length){ desenharCategorias(); desenhar(); }
})();
