/* FaithSync - Index Page Logic */

function goWeek(n){location.href="semanas.html?week="+n;}

function planStartLabel(){
  if(!ST.planStartDate)return'';
  return 'Plano iniciado em '+new Date(ST.planStartDate).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}

function updatePlanControls(){
  const startBtn=document.getElementById('btn-start-plan');
  const resetBtn=document.getElementById('btn-reset-plan');
  const info=document.getElementById('plan-start-info');
  const histBtn=document.getElementById('btn-history');
  const hasStart=!!ST.planStartDate;
  if(startBtn)startBtn.disabled=hasStart;
  if(resetBtn)resetBtn.disabled=!hasStart;
  if(info){
    info.textContent=planStartLabel();
    info.style.display=hasStart?'inline':'none';
  }
  if(histBtn){
    const hasHistory = ST.weekCompletionHistory && Object.keys(ST.weekCompletionHistory).length > 0;
    histBtn.style.display=hasHistory?'inline-block':'none';
  }
}

async function startPlanToday(){
  const btn=document.getElementById('btn-start-plan');
  if(ST.planStartDate)return;
  ST.planStartDate=new Date().toISOString();
  if(btn)btn.disabled=true;
  const ok=await dbSaveProgress();
  if(!ok){
    ST.planStartDate=null;
    updatePlanControls();
    toast('Nao foi possivel salvar o inicio do plano.');
    return;
  }
  updatePlanControls();
  renderIndex();
}

async function resetCurrentPlan(){
  const ok=confirm('Apagar plano? Todo o progresso, histórico e dias marcados serão removidos. As anotações serão mantidas. Esta ação não pode ser desfeita.');
  if(!ok)return;
  ST.planStartDate=null;
  ST.completedDays={};
  ST.completedComplements={};
  ST.weekCompletionHistory={};
  ST.currentWeek=1;
  const saved=await dbSaveProgress();
  if(saved)location.reload();
  else toast('Nao foi possivel apagar o plano agora.');
}

function wkStatus(wn){
  const dc=!!ST.completedComplements[wn];
  const dd=Object.keys(ST.completedDays).filter(k=>k.startsWith(wn+'-')&&ST.completedDays[k]).length;
  if(dd>=6&&dc)return'done';
  if(dd>0||dc)return'prog';
  return'none';
}

function renderIndex(){
  updatePlanControls();
  const c=document.getElementById('igc');
  if(!c)return;
  c.innerHTML='';
  const dates = typeof calculateWeekDates === 'function' ? calculateWeekDates() || {} : {};
  WEEKS_INDEX.forEach(w=>{
    const d=document.createElement('div');
    const status = wkStatus(w.num);
    const wcClass = status === 'done' ? 'sd' : (status === 'prog' ? 'sp' : '');
    d.className='wc ' + wcClass;
    if(dates[w.num] && dates[w.num].delayed) d.classList.add('wc-delayed');
    d.onclick=()=>goWeek(w.num);
    let dateInfo = '';
    if (dates[w.num]) {
      const isDelayed = dates[w.num].delayed;
      const delayedBadge = isDelayed ? '<span class="badge-delayed" style="margin-left: .5rem;">Atrasada</span>' : '';
      dateInfo = `<div class="wcd">${fmtD(dates[w.num].dateStart)} - ${fmtD(dates[w.num].dateEnd)}${delayedBadge}</div>`;
    }
    d.innerHTML=`
      <div class="wch">
        <div class="wcn">Semana ${w.num}</div>
        <div class="wcs">
          <div class="sdt ${status}"></div>
        </div>
      </div>
      ${dateInfo}
      <div class="wcr">${w.block}</div>
      <div class="wca">Ver &rarr;</div>
    `;
    c.appendChild(d);
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
  const spinner=document.getElementById('spinner');
  const lscr=document.getElementById('lscr');
  const iscr=document.getElementById('iscr');
  const err=document.getElementById('lerr');
  try{
    if(spinner)spinner.style.display='block';
    const {data:{session}}=await sb().auth.getSession();
    if(!session){
      if(lscr)lscr.style.display='flex';
      if(err&&new URLSearchParams(location.search).get('err')==='session'){
        err.textContent='Sessao expirada. Entre novamente.';
      }
      document.body.classList.add('ready');
      return;
    }
    const user=session.user;
    const ok=await dbLoad(user.id);
    if(lscr)lscr.style.display='none';
    if(iscr)iscr.style.display='block';
    const e=document.getElementById('uemail');if(e)e.textContent=user.email;
    setupNav();
    renderPH();
    renderIndex();
    document.body.classList.add('ready');
    if(!ok)toast('Nao foi possivel carregar seus dados agora.');
  }catch(error){
    console.error('initApp:',error);
    if(lscr)lscr.style.display='flex';
    if(iscr)iscr.style.display='none';
    if(err)err.textContent='Nao foi possivel conectar. Verifique sua conexao e tente novamente.';
    document.body.classList.add('ready');
  }finally{
    if(spinner&&!document.body.classList.contains('ready'))spinner.style.display='none';
  }
}

function setupModalHistory() {
  const btn = document.getElementById('btn-history');
  const modal = document.getElementById('modal-history');
  const closeBtn = modal?.querySelector('.modal-close');
  const list = document.getElementById('history-list');
  
  if(btn && modal && list) {
    btn.addEventListener('click', () => {
      list.innerHTML = '';
      if (ST.weekCompletionHistory) {
        const sortedKeys = Object.keys(ST.weekCompletionHistory).map(Number).sort((a,b)=>a-b);
        if (sortedKeys.length === 0) {
          list.innerHTML = '<div class="empty-state">Nenhuma semana concluída ainda.</div>';
        } else {
          sortedKeys.forEach(wk => {
            const entry = ST.weekCompletionHistory[wk];
            const wi = WEEKS_INDEX[wk-1];
            const title = wi ? wi.block : 'Semana';
            
            const compDateObj = new Date(entry.completedAt || entry);
            const compDateStr = fmtDFull(compDateObj);
            const delayedBadge = entry.wasDelayed ? '<span class="badge-delayed" style="margin-left: .5rem;">Atrasada</span>' : '';
            const daysStr = entry.daysElapsed ? `<div style="font-size: .75rem; color: var(--ts); margin-top: .2rem;">Dias até concluir: ${entry.daysElapsed}</div>` : '';
            
            const div = document.createElement('div');
            div.className = 'rb';
            div.innerHTML = `
              <div class="rsrc">Semana ${wk} &mdash; ${title}</div>
              <div class="rcnt">
                <div>Concluída em: ${compDateStr}${delayedBadge}</div>
                ${daysStr}
              </div>
            `;
            list.appendChild(div);
          });
        }
      }
      modal.style.display = 'flex';
    });
    if(closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    modal.addEventListener('click', (e) => {
      if(e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

// Modal Materiais
function setupModalMaterials() {
  const btn = document.getElementById('btn-materials');
  const modal = document.getElementById('modal-materials');
  const closeBtn = modal?.querySelector('.modal-close');
  
  if(btn && modal) {
    btn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
    if(closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    modal.addEventListener('click', (e) => {
      if(e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

// Boot
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('lbtn').addEventListener('click',doLogin);
  document.getElementById('lpw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  const lfrm=document.getElementById('lfrm');if(lfrm)lfrm.addEventListener('submit',e=>{e.preventDefault();doLogin();});
  document.getElementById('btn-start-plan').addEventListener('click',startPlanToday);
  document.getElementById('btn-reset-plan').addEventListener('click',resetCurrentPlan);
  setupModalHistory();
  setupModalMaterials();
  initApp();
});
