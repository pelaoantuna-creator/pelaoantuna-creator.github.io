/* Puente para usar la app fuera de claude.ai (iPad / web app).
   - 'db': base de datos local en IndexedDB (solo en este dispositivo, nada sale de él).
   - 'downloads': guarda/comparte archivos con la hoja de compartir de iOS.
   - Botones «Copia de seguridad» e «Importar copia» en la portada. */
(function(){
  var DBN='ef-adaptada',ST='docs',_db=null;
  function idb(){return _db||(_db=new Promise(function(ok,ko){var r=indexedDB.open(DBN,1);
    r.onupgradeneeded=function(){r.result.createObjectStore(ST)};r.onsuccess=function(){ok(r.result)};r.onerror=function(){ko(r.error)}}))}
  function tx(mode,fn){return idb().then(function(d){return new Promise(function(ok,ko){var t=d.transaction(ST,mode),s=t.objectStore(ST),res;
    res=fn(s);t.oncomplete=function(){ok(res&&'result' in res?res.result:undefined)};t.onerror=t.onabort=function(){ko(t.error)}})})}
  function allDocs(){return idb().then(function(d){return new Promise(function(ok,ko){var out={},c=d.transaction(ST).objectStore(ST).openCursor();
    c.onsuccess=function(){var k=c.result;if(k){out[k.key]=k.value;k.continue()}else ok(out)};c.onerror=function(){ko(c.error)}})})}
  var clone=function(o){return o==null?o:JSON.parse(JSON.stringify(o))};
  var DB={
    doc:function(p){return{
      get:function(){return tx('readonly',function(s){return s.get(p)}).then(function(v){return{id:p.split('/').pop(),exists:v!==undefined,data:function(){return clone(v)}}})},
      set:function(d){return tx('readwrite',function(s){s.put(clone(d),p)})},
      delete:function(){return tx('readwrite',function(s){s.delete(p)})}}},
    collection:function(c){return{get:function(){return allDocs().then(function(all){
      var docs=Object.keys(all).filter(function(k){return k.indexOf(c+'/')===0&&k.indexOf('/',c.length+1)<0})
        .map(function(k){var v=all[k];return{id:k.slice(c.length+1),data:function(){return clone(v)}}});
      return{empty:!docs.length,size:docs.length,docs:docs}})}}}
  };

  function b64(s){return btoa(unescape(encodeURIComponent(s)))}
  async function save(o){
    var name=o.filename,data=o.data,C=window.Capacitor,P=C&&C.Plugins;
    if(P&&P.Filesystem&&P.Share){var r=await P.Filesystem.writeFile({path:name,data:typeof data==='string'?b64(data):data,directory:'CACHE'});await P.Share.share({title:name,files:[r.uri]});return}
    var blob=data instanceof Blob?data:new Blob([data],{type:/\.json$/.test(name)?'application/json':'text/plain;charset=utf-8'});
    var f=new File([blob],name,{type:blob.type});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return}
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);
  }
  var DL={save:function(o){return save(o).catch(function(e){if(e&&(e.name==='AbortError'||/cancel/i.test(e.message||'')))throw{code:'declined'};throw e})}};
  window.claude={use:async function(cap){if(cap==='db'){await idb();return DB}if(cap==='downloads')return DL;throw new Error('no disponible')}};
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

  /* ---- copia de seguridad / importar ---- */
  function say(m){try{if(typeof toast==='function'){toast(m);return}}catch(e){}alert(m)}
  async function backup(){
    var docs=await allDocs();
    if(!Object.keys(docs).some(function(k){return k.indexOf('clases/')===0})){say('Todavía no hay datos guardados que copiar');return}
    var d=new Date(),f='ef-adaptada-copia-'+d.toISOString().slice(0,10)+'.json';
    try{await DL.save({filename:f,data:JSON.stringify({app:'ef-adaptada',v:1,fecha:d.toISOString(),docs:docs})});try{localStorage.setItem('ef.lastBackup',String(Date.now()))}catch(e){}status();say('Copia lista: guárdala en Archivos')}
    catch(e){if(!(e&&e.code==='declined'))say('No se pudo crear la copia')}
  }
  async function restore(file){
    var j;try{j=JSON.parse(await file.text())}catch(e){say('Ese archivo no es una copia válida');return}
    if(!j||j.app!=='ef-adaptada'||!j.docs||typeof j.docs!=='object'){say('Ese archivo no es una copia de EF Adaptada');return}
    var n=Object.keys(j.docs).filter(function(k){return k.indexOf('clases/')===0}).length;
    if(!confirm('Se importarán '+n+' clases con su alumnado, fotos y sesiones.\n\nLo que haya ahora en este iPad se sustituirá. ¿Continuar?'))return;
    await tx('readwrite',function(s){s.clear();Object.keys(j.docs).forEach(function(k){if(typeof k==='string'&&/^[\w-]+\/[\w.:@+~-]+$/.test(k))s.put(j.docs[k],k)})});
    try{Object.keys(localStorage).forEach(function(k){if(/^oca2?\./.test(k))localStorage.removeItem(k)});localStorage.setItem('ef.lastBackup',String(Date.now()))}catch(e){}
    location.reload();
  }
  function status(){var el=document.querySelector('.nbar .nst');if(!el)return;var t=0;try{t=+localStorage.getItem('ef.lastBackup')||0}catch(e){}
    var days=t?Math.floor((Date.now()-t)/864e5):null;
    el.textContent=t?(days===0?'Última copia: hoy':'Última copia: hace '+days+(days===1?' día':' días')):'Aún no has hecho ninguna copia';
    el.classList.toggle('old',!t||days>=7)}
  function ui(){
    var css=document.createElement('style');
    css.textContent='.nbar{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px;opacity:.85}'+
      '.nbar .nst{flex-basis:100%;text-align:center;font:700 .85rem/1.2 "Atkinson Hyperlegible",system-ui,sans-serif;color:#d8ecdf}.nbar .nst.old{color:#F7C929}.nbar .nst.old::before{content:"⚠ "}.nbar button{min-height:40px;padding:4px 14px;border-radius:99px;border:2px solid #3a2416;background:rgba(251,241,215,.92);font:700 .85rem/1 "Atkinson Hyperlegible",system-ui,sans-serif;color:#3a2416;cursor:pointer}';
    document.head.appendChild(css);
    var bar=document.createElement('div');bar.className='nbar';
    bar.innerHTML='<span class="nst"></span><button type="button" data-n="b">Copia de seguridad</button><button type="button" data-n="i">Importar copia</button><input type="file" accept=".json,application/json" hidden>';
    var inp=bar.querySelector('input');
    bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.n==='b')backup();else{inp.value='';inp.click()}});
    inp.addEventListener('change',function(){if(inp.files[0])restore(inp.files[0])});
    var h=document.querySelector('#scr-home .home')||document.querySelector('#scr-home');(h||document.body).appendChild(bar);status();
    allDocs().then(function(d){var t=0;try{t=+localStorage.getItem('ef.lastBackup')||0}catch(e){}if(Object.keys(d).some(function(k){return k.indexOf('clases/')===0})&&(!t||Date.now()-t>7*864e5))setTimeout(function(){say('Recuerda: haz una copia de seguridad (botón al final de la portada)')},2500)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui);else ui();
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
})();
