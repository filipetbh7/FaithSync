/* FaithSync - Index Page Logic */

function goWeek(n){location.href="semanas.html?week="+n;}

function wkStatus(wn){
  const dc=!!ST.completedComplements[wn];
  const dd=Object.keys(ST.completedDays).filter(k=>k.startsWith(wn+'-')&&ST.completedDays[k]).length;
  if(dd>=6&&dc)return'done';
  if(dd>0||dc)return'prog';
  return'none';
}

function renderIndex(){
  const c=document.getElementById('igc');
  const sl={none:'Não iniciado',prog:'Em andamento',done:'Concluído'};
  let html='',cb='';
  WEEKS_INDEX.forEach(w=>{
    if(w.block!==cb){cb=w.block;if(html)html+='</div>';html+='<div class="ibl">'+w.block+'</div><div class="igrd">';}
    const s=wkStatus(w.num);
    const sc=s==='prog'?'sp':s==='done'?'sd':'';
    html+='<div class="wc '+(w.hasContent?'hc ':'')+sc+'" data-week="'+w.num+'">'
      +'<div class="wch"><div class="wcn">Semana '+w.num+'</div>'
      +'<div class="wcs"><div class="sdt '+s+'"></div><span class="sdlbl">'+sl[s]+'</span></div></div>'
      +'<div class="wcd">'+fmtD(w.ds)+' – '+fmtD(w.de)+'</div>'
      +'<div class="wcr">'+w.range+'</div>'
      +'<div class="wcb">'+w.block+(w.hasContent?' · Disponível':'')+'</div>'
      +'<div class="wca">→</div></div>';
  });
  if(html)html+='</div>';
  c.innerHTML=html;
  // Attach click handlers via event delegation
  document.querySelectorAll('[data-week]').forEach(el=>{
    el.addEventListener('click',()=>goWeek(el.dataset.week));
  });
}

async function doLogin(){
  const email=document.getElementById('lem').value.trim();
  const pass=document.getElementById('lpw').value;
  const err=document.getElementById('lerr');
  const btn=document.getElementById('lbtn');
  err.textContent='';
  btn.textContent='Entrando...';
  btn.disabled=true;
  const {error}=await sb().auth.signInWithPassword({email,password:pass});
  if(error){
    err.textContent='E-mail ou senha incorretos.';
    btn.textContent='Entrar';
    btn.disabled=false;
  } else {
    initApp();
  }
}

async function initApp(){
  const {data:{session}}=await sb().auth.getSession();
  const spinner=document.getElementById('spinner');
  const lscr=document.getElementById('lscr');
  const iscr=document.getElementById('iscr');
  if(!session){
    if(spinner)spinner.style.display='none';
    if(lscr)lscr.style.display='flex';
    document.body.classList.add('ready');
    return;
  }
  const user=session.user;
  await dbLoad(user.id);
  if(spinner)spinner.style.display='none';
  if(lscr)lscr.style.display='none';
  if(iscr)iscr.style.display='block';
  document.body.classList.add('ready');
  const e=document.getElementById('uemail');if(e)e.textContent=user.email;
  setupNav();
  renderPH();
  renderIndex();
}

// Boot
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('lbtn').addEventListener('click',doLogin);
  document.getElementById('lpw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  initApp();
});
