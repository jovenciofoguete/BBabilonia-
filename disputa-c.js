/* disputa-c.js — BBabilônia: gestão interna do caso pelos agentes (dono do caso, fila, superiores, notas internas) */
var ATD=null;
async function atdCarregar(d){
 ATD=null;
 var r=await sb.rpc('meu_atendimento');var me=r.data||{};
 if(!me.agente&&!me.supervisor)return;
 var ok=me.supervisor||(me.agente&&me.codigo);
 ATD={me:me,chefe:!!me.chefe,semCodigo:me.agente&&!me.codigo&&!me.supervisor,notas:[],superiores:[],agentes:[]};
 if(!ok)return;
 ATD.pode=!!me.chefe||d.atendente_email===me.email;
 ATD.fila=!ATD.pode&&d.estado==='em_analise'&&!d.atendente_email;
 if(ATD.pode){
  var n=await sb.from('disputa_notas').select('*').eq('disputa_id',d.id).order('created_at');ATD.notas=n.data||[];
  var s=await sb.rpc('lista_superiores');ATD.superiores=s.data||[];
  if(ATD.chefe){var a=await sb.from('agentes').select('*').eq('ativo',true).order('nome');ATD.agentes=a.data||[]}
 }
}
function atdHtml(){
 if(!ATD)return'';
 var d=disp,me=ATD.me,h='<div class="box" id="atd" style="border:2px dashed #93c5fd"><h3>🗂️ Gestão do caso <span style="font-size:12px;color:var(--suave)">(só a equipa vê)</span></h3>';
 if(ATD.fila)return h+'<p class="inf" style="margin-top:0">Este caso está na fila, sem agente.</p><button class="bt v" id="atdPegar">✋ Pegar este caso</button><div class="err" id="atdm"></div></div>';
 var dono=d.atendente_email,ag=ATD.agentes.filter(function(a){return a.email===dono})[0];
 h+='<div class="inf" style="margin-top:0">Responsável: <b>'+esc(dono?(ag?ag.nome:dono):'ninguém (na fila)')+'</b>'+(d.ajuda_pedida?' · 🆘 ajuda pedida':'')+'</div>';
 if(d.atribuida_em&&!d.primeira_resposta_em&&d.estado==='em_analise'){var hr=24-Math.floor((new Date()-new Date(d.atribuida_em))/3600000);h+='<div class="vez" style="margin-top:8px"><b>⏰ Primeira resposta em '+Math.max(0,hr)+' h</b>Se não responder, o caso passa a outro agente.</div>'}
 if(d.estado==='em_analise'){
  h+='<button class="bt l" id="atdAjuda">🆘 Pedir ajuda ao superior</button>';
  h+='<p class="inf" style="margin-top:12px">⬆️ Encaminhar o caso a um superior</p><select id="atdSup" style="width:100%;padding:11px;border:2px solid var(--linha);border-radius:12px;font:inherit;background:var(--fundo);color:var(--texto)"><option value="">O superior com menos casos</option>'+
   ATD.superiores.filter(function(s){return s.email!==me.email}).map(function(s){return'<option value="'+esc(s.email)+'">'+esc(s.nome)+' ('+s.casos+' casos)</option>'}).join('')+'</select>'+
   '<textarea id="atdMot" rows="2" placeholder="Motivo (obrigatório)" style="margin-top:6px"></textarea><button class="bt a" id="atdEnc">⬆️ Encaminhar ao superior</button>';
  if(ATD.chefe)h+='<p class="inf" style="margin-top:12px">Passar a outro agente</p><select id="atdRe" style="width:100%;padding:11px;border:2px solid var(--linha);border-radius:12px;font:inherit;background:var(--fundo);color:var(--texto)"><option value="">Escolha…</option>'+
   ATD.agentes.map(function(a){return'<option value="'+esc(a.email)+'">'+esc(a.nome)+(a.nivel==='superior'?' (superior)':'')+'</option>'}).join('')+'</select>';
  if(dono)h+='<button class="bt l" id="atdFila">↩️ Devolver à fila</button>';
 }
 h+='<h3 style="margin-top:16px">🔒 Notas internas</h3>'+(ATD.notas.length?ATD.notas.map(function(n){return'<div class="msg admin"><div class="av">📝</div><div class="c"><div class="q"><b>'+esc(n.autor_email)+'</b> · '+new Date(n.created_at).toLocaleString()+'</div><p>'+esc(n.texto)+'</p></div></div>'}).join(''):'<p class="inf">Ainda sem notas.</p>')+
  '<textarea id="atdNota" rows="2" placeholder="Nota para a equipa (o cliente e o fornecedor não veem)"></textarea><button class="bt l" id="atdGuardar">Guardar nota</button><div class="err" id="atdm"></div></div>';
 return h;
}
function atdLigar(){
 var m=$('atdm');function erro(e){if(m)m.textContent=e}
 async function chamar(fn,args,depois){var r=await sb.rpc(fn,args);if(r.error){erro(r.error.message);return false}if(depois)depois(r.data);else carregar();return true}
 var b;
 if((b=$('atdPegar')))b.onclick=function(){b.disabled=true;chamar('pegar_caso',{p_id:disp.id}).then(function(ok){if(!ok)b.disabled=false})};
 if((b=$('atdGuardar')))b.onclick=function(){var t=$('atdNota').value.trim();if(t.length<2)return erro('Escreva a nota.');this.disabled=true;chamar('disputa_nota',{p_id:disp.id,p_texto:t})};
 if((b=$('atdAjuda')))b.onclick=function(){var t=prompt('O que precisa do superior?');if(t===null)return;chamar('pedir_ajuda',{p_id:disp.id,p_texto:t},function(){alert('Os superiores foram avisados. O caso continua consigo.');carregar()})};
 if((b=$('atdEnc')))b.onclick=function(){var t=$('atdMot').value.trim();if(t.length<5)return erro('Explique ao superior porque encaminha o caso.');
  if(!confirm('Encaminhar o caso? Deixa de ser seu.'))return;this.disabled=true;
  chamar('encaminhar_superior',{p_id:disp.id,p_email:$('atdSup').value||null,p_motivo:t},function(v){alert(v==='supervisor'?'Não há superiores ativos: o caso foi para o supervisor geral.':'Caso encaminhado a '+v+'.');location.href='atendimento.html'})};
 if((b=$('atdRe')))b.onchange=function(){var v=this.value;if(!v||!confirm('Passar o caso a '+this.options[this.selectedIndex].text+'?')){this.value='';return}chamar('reatribuir_caso',{p_id:disp.id,p_email:v})};
 if((b=$('atdFila')))b.onclick=function(){if(!confirm('Devolver o caso à fila?'))return;chamar('reatribuir_caso',{p_id:disp.id,p_email:null},function(){location.href='atendimento.html'})};
   }
   
