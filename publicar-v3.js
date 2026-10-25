(function () {
  var btn = document.getElementById('sv');
  if (!btn) return;
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var URL_TUS = 'https://dsfoqoeawvjafypycldz.supabase.co/storage/v1/upload/resumable';
  var LIMITE = 6 * 1048576;

  function mb(f) { return (f.size / 1048576).toFixed(1) + ' MB'; }

  function carregarTus() {
    return new Promise(function (ok, no) {
      if (window.tus) return ok();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tus-js-client@4.1.0/dist/tus.min.js';
      s.onload = ok;
      s.onerror = function () { no(new Error('não carregou a biblioteca de envio')); };
      document.head.appendChild(s);
    });
  }

  async function grande(file, p, rotulo) {
    await carregarTus();
    var ses = (await sb.auth.getSession()).data.session;
    return new Promise(function (ok, no) {
      var up = new tus.Upload(file, {
        endpoint: URL_TUS,
        retryDelays: [0, 2000, 5000, 10000, 20000],
        headers: { authorization: 'Bearer ' + ses.access_token, apikey: KEY },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'produtos',
          objectName: p,
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600'
        },
        chunkSize: 6 * 1024 * 1024,
        onError: function (e) { no(e); },
        onProgress: function (a, b) {
          msg('A enviar ' + rotulo + ' (' + mb(file) + ') ' + Math.round(a / b * 100) + '%');
        },
        onSuccess: function () { ok(); }
      });
      up.start();
    });
  }

  async function pequeno(file, p) {
    var erro = null;
    for (var t = 0; t < 2; t++) {
      try {
        var r = await sb.storage.from('produtos').upload(p, file);
        if (r.error) throw r.error;
        return;
      } catch (e) { erro = e; }
    }
    throw erro;
  }

  async function enviar(file, rotulo) {
    msg('A enviar ' + rotulo + ' (' + mb(file) + ')…');
    var p = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '-' + file.name.replace(/[^\w.]/g, '_');
    try {
      if (file.size > LIMITE) {
        try { await grande(file, p, rotulo); }
        catch (e1) { await pequeno(file, p); }
      } else {
        await pequeno(file, p);
      }
    } catch (e) {
      throw new Error('falhou o envio de ' + rotulo + ' "' + file.name + '" (' + mb(file) + '): ' + ((e && e.message) || e));
    }
    return sb.storage.from('produtos').getPublicUrl(p).data.publicUrl;
  }

  btn.onclick = async function () {
    if (!$('nome').value || !$('preco').value) return msg('Preencha o nome e o preço.');
    if (!$('catb').classList.contains('hide') && !$('cat').value) return msg('Escolha a categoria.');
    if (!fotos.length && !cores.length) return msg('Adicione pelo menos uma foto.');
    if (cores.some(function (c) { return !c.nome.trim(); })) return msg('Dê um nome a cada cor.');
    $('sv').disabled = true;
    try {
      var imgs = [];
      for (var i = 0; i < fotos.length; i++) {
        imgs.push(await enviar(fotos[i].file, 'foto ' + (i + 1) + ' de ' + fotos.length));
      }
      var cs = [];
      for (var j = 0; j < cores.length; j++) {
        var c = cores[j];
        var u = await enviar(c.file, 'foto da cor "' + c.nome.trim() + '"');
        cs.push({ nome: c.nome.trim(), foto: u, disponivel: c.ok });
        if (imgs.indexOf(u) === -1) imgs.push(u);
      }
      var v = null;
      if (video) v = await enviar(video, 'vídeo');

      msg('A guardar o produto…');
      refreshTs();
      var vars = TamanhosStock.obter();
      var tamUn = Array.from(new Set(vars.map(function (x) { return x.tamanho; })));
      var row = {
        name: $('nome').value,
        price: Number($('preco').value),
        currency: $('moeda').value,
        description: $('desc').value,
        images: imgs,
        image_url: imgs[0],
        video_url: v,
        colors: cs,
        sizes: tamUn,
        variants: vars,
        supplier_id: user.id
      };
      if (!$('catb').classList.contains('hide')) row.category_id = $('cat').value;
      var res = await sb.from('products').insert(row).select('id').single();
      if (res.error) throw new Error('falhou guardar o produto: ' + res.error.message);
      msg('Produto publicado ✓');
      location.href = 'produto-bbabilonia.html?id=' + res.data.id;
    } catch (e) {
      msg('Erro: ' + (e.message || e));
      $('sv').disabled = false;
    }
  };
})();
