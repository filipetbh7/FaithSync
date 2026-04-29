/* FaithSync - anotacoes Page Logic */
function renderNotes(){
  const c=document.getElementById('nl');
  const wks=Object.keys(NT_NOTES).map(k=>parseInt(k)).filter(n=>NT_NOTES[n]&&NT_NOTES[n].trim()).sort((a,b)=>a-b);
  if(!wks.length){c.innerHTML='<div class="npemp">Nenhuma anotacao registrada ainda.<br>As anotacoes das semanas aparecerao aqui.</div>';return;}
  let h='';
  wks.forEach(wn=>{
    const wi=WEEKS_INDEX[wn-1];if(!wi)return;
    h+='<div class="ne" data-week="'+wn+'">';
    h+='<div class="neh" data-week="'+wn+'">';
    h+='<div><div class="newk">Semana '+wn+' | '+esc(wi.block)+'</div><div class="ner">'+esc(wi.range)+'</div><div class="ned">'+fmtD(wi.ds)+' - '+fmtD(wi.de)+'</div></div>';
    h+='<button class="nel" data-week="'+wn+'">Ir a semana &rarr;</button>';
    h+='</div><div class="neb">'+esc(NT_NOTES[wn])+'</div></div>';
  });
  c.innerHTML=h;
  document.querySelectorAll('.neh,.nel').forEach(el=>{
    el.onclick=(ev)=>{ev.stopPropagation();location.href='semanas.html?week='+el.dataset.week;};
  });
}

async function init(){
  setupNav();
  const user=await getUser();
  if(!user){location.href='index.html';return;}
  await dbLoad(user.id);
  // Reveal page content, hide spinner
  const sp=document.getElementById('spinner');if(sp)sp.style.display='none';
  const pc=document.getElementById('page-content');if(pc)pc.style.display='block';
  document.body.classList.add('ready');
  const e=document.getElementById('uemail');if(e)e.textContent=user.email;
  renderPH();
  renderNotes();
}

init();