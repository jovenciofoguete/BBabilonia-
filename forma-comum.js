/* forma-comum.js — B-Babilônia
   Código partilhado da pesquisa por imagem (compara FORMA/MODELO, nunca cor nem fundo).
   Usado por busca-imagem-v2.html e gerar-formas.html, para o vetor ser sempre igual. */
(function(){
  const SUPA_URL = "https://dsfoqoeawvjafypycldz.supabase.co";
  const SUPA_KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  const LADO = 224;
  let modelo = null, aCarregar = null;

  function carregarModelo(){
    if(modelo) return Promise.resolve(modelo);
    if(!aCarregar){
      aCarregar = mobilenet.load({version:2, alpha:1.0}).then(async m => {
        modelo = m;
        const t = m.infer(tf.zeros([LADO,LADO,3]), true); await t.data(); t.dispose(); // aquecer
        return m;
      });
    }
    return aCarregar;
  }

  function carregarImg(src){
    return new Promise((ok, falha) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => ok(im);
      im.onerror = () => falha(new Error("Não abriu a imagem"));
      im.src = src;
    });
  }

  /* tira o fundo (cor das bordas), corta à volta do objeto, põe em cinzento */
  function prepararForma(im){
    const W = 160, H = Math.max(1, Math.round(160 * im.height / im.width));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", {willReadFrequently:true});
    x.drawImage(im, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), p = d.data;
    let r=0,g=0,b=0,n=0;
    const somar = i => { r+=p[i]; g+=p[i+1]; b+=p[i+2]; n++; };
    for(let i=0;i<W;i++){ somar(i*4); somar(((H-1)*W+i)*4); }
    for(let j=0;j<H;j++){ somar((j*W)*4); somar((j*W+W-1)*4); }
    r/=n; g/=n; b/=n;
    let minX=W,minY=H,maxX=0,maxY=0;
    for(let j=0;j<H;j++) for(let i=0;i<W;i++){
      const k=(j*W+i)*4;
      if(Math.abs(p[k]-r)+Math.abs(p[k+1]-g)+Math.abs(p[k+2]-b) < 60){ p[k]=p[k+1]=p[k+2]=255; }
      else{
        const v = Math.min(200, 0.299*p[k]+0.587*p[k+1]+0.114*p[k+2]);
        p[k]=p[k+1]=p[k+2]=v;
        if(i<minX)minX=i; if(i>maxX)maxX=i; if(j<minY)minY=j; if(j>maxY)maxY=j;
      }
    }
    x.putImageData(d,0,0);
    if(maxX-minX < 8 || maxY-minY < 8){ minX=0; minY=0; maxX=W-1; maxY=H-1; }
    const out = document.createElement("canvas"); out.width = out.height = LADO;
    const o = out.getContext("2d");
    o.fillStyle="#fff"; o.fillRect(0,0,LADO,LADO);
    const bw=maxX-minX+1, bh=maxY-minY+1, esc=(LADO*0.9)/Math.max(bw,bh);
    o.drawImage(c, minX, minY, bw, bh, (LADO-bw*esc)/2, (LADO-bh*esc)/2, bw*esc, bh*esc);
    return out;
  }

  /* vetor da forma (média normal + espelho), em Float32Array normalizado */
  async function vetor(im){
    const m = await carregarModelo();
    const cv = prepararForma(im);
    const esp = document.createElement("canvas"); esp.width = esp.height = LADO;
    const e = esp.getContext("2d"); e.translate(LADO,0); e.scale(-1,1); e.drawImage(cv,0,0);
    const t1 = m.infer(cv, true), t2 = m.infer(esp, true);
    const a = await t1.data(), b = await t2.data();
    t1.dispose(); t2.dispose();
    const v = new Float32Array(a.length); let s = 0;
    for(let i=0;i<a.length;i++){ v[i]=(a[i]+b[i])/2; s+=v[i]*v[i]; }
    s = Math.sqrt(s)||1; for(let i=0;i<v.length;i++) v[i]/=s;
    return v;
  }

  /* guarda pequeno: 1 byte por número, em texto (≈1,7 KB por foto) */
  function codificar(v){
    let mx = 0; for(const a of v) if(Math.abs(a)>mx) mx=Math.abs(a);
    mx = mx||1;
    const q = new Int8Array(v.length);
    for(let i=0;i<v.length;i++) q[i] = Math.round(v[i]/mx*127);
    let bin = ""; const u = new Uint8Array(q.buffer);
    for(let i=0;i<u.length;i++) bin += String.fromCharCode(u[i]);
    return btoa(bin);
  }
  function descodificar(txt){
    const bin = atob(txt), u = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
    const q = new Int8Array(u.buffer), v = new Float32Array(q.length);
    let s=0; for(let i=0;i<q.length;i++){ v[i]=q[i]; s+=q[i]*q[i]; }
    s = Math.sqrt(s)||1; for(let i=0;i<v.length;i++) v[i]/=s;
    return v;
  }

  function fotosDe(prod){
    const lista = [];
    const juntar = u => { if(typeof u==="string" && u.startsWith("http") && !lista.includes(u)) lista.push(u); };
    juntar(prod.image_url);
    let imgs = prod.images;
    if(typeof imgs === "string"){ try{ imgs = JSON.parse(imgs); }catch(e){ imgs = [imgs]; } }
    if(Array.isArray(imgs)) imgs.forEach(it => juntar(typeof it==="string" ? it : (it && (it.url||it.foto||it.image||it.src))));
    return lista.slice(0,3);
  }

  window.FormaBB = { SUPA_URL, SUPA_KEY, carregarModelo, carregarImg, vetor, codificar, descodificar, fotosDe };
})();
                                
