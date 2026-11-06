<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Importar loja • BBabilônia</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<style>
:root{--az:#1565c0;--vd:#2e7d32;--ln:#d6dde6;--mu:#5f6b7a;--er:#c62828}
*{box-sizing:border-box}
body{margin:0;background:#f4f7fb;color:#1b2430;font:16px system-ui,sans-serif;padding:16px 16px 70px;max-width:620px;margin:auto}
h1{font-size:22px;margin:4px 0 4px;color:var(--az)}
.sub{color:var(--mu);margin:0 0 14px;font-size:14px}
.cx{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:14px;margin-bottom:14px}
.cx h3{margin:0 0 6px;font-size:16px}
.num{display:inline-block;width:26px;height:26px;border-radius:50%;background:var(--az);color:#fff;text-align:center;line-height:26px;font-size:14px;margin-right:6px}
.nota{color:var(--mu);font-size:13px;margin:6px 0}
label{display:block;margin:10px 0 4px;color:var(--mu);font-size:14px}
input,select{width:100%;padding:12px;border-radius:10px;border:1px solid var(--ln);background:#fff;font:inherit}
button{padding:12px 16px;border-radius:10px;border:1px solid var(--ln);background:#fff;font:inherit;cursor:pointer}
.b{width:100%;margin-top:8px}
.az{background:var(--az);border-color:var(--az);color:#fff;font-weight:600}
.vd{background:var(--vd);border-color:var(--vd);color:#fff;font-weight:600;height:52px}
button:disabled{opacity:.5}
.hide{display:none}
#m{margin-top:10px;font-weight:600;color:var(--az)}
.barra{height:10px;background:#e3e8ef;border-radius:6px;overflow:hidden;margin-top:8px}
.barra i{display:block;height:100%;width:0;background:var(--vd)}
.lin{display:flex;gap:10px;align-items:center;border-top:1px solid var(--ln);padding:8px 0}
.lin img{width:52px;height:52px;object-fit:cover;border-radius:8px;background:#eef2f7;flex:none}
.lin .t{flex:1;min-width:0}
.lin b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lin small{color:var(--mu)}
.ok{color:var(--vd)}.er{color:var(--er)}
.res{font-size:14px}
</style></head><body>
<div class="cx">
<h3><span class="num">2</span>Escolher o ficheiro de produtos</h3>
<button class="b" id="bf">📄 Escolher Excel ou CSV</button>
<p class="nota" id="nf"></p>
</div>
<div class="cx">
<h3><span class="num">3</span>Fotos do telemóvel (opcional)</h3>
<p class="nota">Só se no ficheiro escreveu nomes de fotos em vez de links. Pode escolher muitas de uma vez. As fotos não perdem qualidade.</p>
<button class="b" id="bfo">🖼 Escolher fotos</button>
<p class="nota" id="nfo"></p>
</div>
<div class="cx">
<h3><span class="num">4</span>Categoria para os produtos sem categoria</h3>
<p class="nota">Produtos cuja categoria do ficheiro não existir na BBabilônia vão para esta.</p>
<select id="catp"><option value="">— A carregar categorias… —</option></select>
</div>
<div class="cx">
<h3><span class="num">5</span>Rever e importar</h3>
<div id="resumo" class="res nota">Ainda não escolheu o ficheiro.</div>
<div id="lista"></div>
<button class="b vd" id="imp" disabled>Importar todos os produtos</button>
<div class="barra"><i id="bar"></i></div>
<div id="m"></div>
</div>
</div>
<input type="file" id="ff" accept=".csv,.xlsx,.xls,.txt,text/csv" hidden>
<input type="file" id="ffo" accept="image/*" multiple hidden>
<p id="ver" class="nota" style="text-align:center">A carregar a página…</p>
<script>window.onerror=function(m,s,l){var d=document.getElementById("erro");if(d)d.textContent="Erro: "+m+" (linha "+l+")"};</script>
<script src="importar-loja-v3.js?v=1"></script>
<script src="fornecedor-aprovacao-v3.js"></script>
</body></html>
<!-- fim importar-loja-v3 -->
  
