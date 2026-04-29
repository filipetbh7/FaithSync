/* FaithSync - semanas Page Logic */
let CW=32;

function getWkFromURL(){
  const p=new URLSearchParams(location.search);
  return parseInt(p.get('week'))||ST.currentWeek||32;
}

function navWk(d){
  const n=CW+d;
  if(n<1||n>TOTAL_WEEKS)return;
  CW=n;
  ST.currentWeek=n;
  dbSave();
  history.replaceState(null,'','semanas.html?week='+n);
  renderWk(n);
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderWk(wn){
  CW=wn;
  const wi=WEEKS_INDEX[wn-1];
  const mc=document.getElementById('mc');
  if(!wi||!mc)return false;
  renderWeekHeader(wn,wi);
  const wk=WEEKS_DATA[wn];
  if(!wk||!Array.isArray(wk.days)||!wk.days.length){
    mc.innerHTML=renderEmptyWeek(wn,wi,wk);
    attachWeekNavHandlers();
    return true;
  }
  mc.innerHTML=renderDays(wk)+renderVisual(wk)+renderComplement(wk)+renderReflection(wk)+renderNoteSection(wn);
  attachWeekHandlers();
  return true;
}

function renderWeekHeader(wn,wi){
  document.getElementById('btnP').disabled=wn<=1;
  document.getElementById('btnN').disabled=wn>=TOTAL_WEEKS;
  document.getElementById('wknum').textContent='Semana '+wn;
  document.getElementById('wkttl').textContent=(WEEKS_DATA[wn]&&WEEKS_DATA[wn].title)||'Semana '+wn;
  
  const weekDates = calculateWeekDates();
  let subText = wi.range;
  if (weekDates && weekDates[wn]) {
    subText = fmtD(weekDates[wn].dateStart) + ' - ' + fmtD(weekDates[wn].dateEnd) + ' | ' + wi.range;
  }
  document.getElementById('wksub').textContent=subText;
  
  const bannerContainer = document.getElementById('delay-banner-container');
  if (bannerContainer) {
    if (weekDates && weekDates[wn] && weekDates[wn].delayed) {
      bannerContainer.innerHTML = '<div class="delay-banner">⚠ Semana em atraso — marque o domingo quando possível</div>';
    } else {
      bannerContainer.innerHTML = '';
    }
  }
  
  renderPH(wn);
}

function renderEmptyWeek(wn,wi,wk){
  const range=(wk&&wk.range)||wi.range;
  return '<div class="empty-state">'+
    '<p>Conte&uacute;do desta semana ainda n&atilde;o dispon&iacute;vel.</p>'+
    '<p>Semana <strong>'+wn+'</strong> &mdash; <em>'+esc(range)+'</em></p>'+
    '<p>O conte&uacute;do ser&aacute; adicionado progressivamente.</p>'+
    '</div>';
}

function renderDays(wk){
  let h='';
  h+='<div class="sh">Leitura Di&aacute;ria | 15 minutos por dia</div>';
  h+='<div class="dgrd">';
  const weekDates = calculateWeekDates();
  wk.days.forEach((day,i)=>{
    const key=CW+'-'+i;
    const ck=!!ST.completedDays[key];
    
    let actualDate = null;
    if (weekDates && weekDates[CW]) {
      actualDate = new Date(weekDates[CW].dateStart);
      actualDate.setDate(actualDate.getDate() + i);
    }
    
    const td=actualDate ? isToday(actualDate) : false;
    h+='<div class="dc'+(ck?' ck':'')+(td?' td':'')+'" data-key="'+key+'">';
    h+='<div class="dch"><div><div class="dlbl">'+esc(day.dayOfWeek)+'</div><div class="ddt">'+(actualDate?fmtD(actualDate):'')+'</div></div>';
    h+='<div class="dchk'+(ck?' ck':'')+'" data-key="'+key+'"></div></div>';
    h+='<div class="dr">'+esc(day.reading)+(day.verses?' <span style="color:var(--td);font-size:.82em">'+esc(day.verses)+'</span>':'')+'</div>';
    h+='<div class="dctx">'+esc(day.context)+'</div>';
    h+=(td?'<div class="dbdg td">Hoje</div>':ck?'<div class="dbdg">Lido</div>':'');
    h+='</div>';
  });
  h+='</div>';
  return h;
}

function renderVisual(wk){
  let h='';
  h+='<div class="sh">Visual da Semana</div>';
  h+='<div class="vcnt"><div class="vttl">Os Quatro Imp&eacute;rios de Daniel | Mapa Temporal</div>'+wk.visual+'</div>';
  return h;
}

function renderComplement(wk){
  let h='';
  const cd=!!ST.completedComplements[CW];
  const weekDates = calculateWeekDates();
  let compDate = null;
  if (weekDates && weekDates[CW]) {
    compDate = new Date(weekDates[CW].dateStart);
    compDate.setDate(compDate.getDate() + 6);
  }
  
  h+='<div class="sh">Complementa&ccedil;&atilde;o Semanal | ~1 hora' + (compDate ? ' | '+fmtD(compDate) : '') + '</div>';
  h+='<div class="ccard"><div class="cchdr"><div class="cttl">Estudo Complementar - '+esc(wk.title)+'</div>';
  h+='<div style="display:flex;align-items:center;gap:.7rem"><div class="cdt">'+(compDate?fmtDFull(compDate):'')+'</div>';
  h+='<div class="dchk'+(cd?' ck':'')+'" data-comp="'+CW+'"></div></div></div>';
  h+='<p class="cintro">'+esc(wk.complement.intro)+'</p><div class="rgrd">';
  wk.complement.resources.forEach(r=>{
    h+='<div class="rb '+r.type+'"><div class="rsrc">'+esc(r.title)+'</div><div class="rcnt"><ul>';
    r.items.forEach(x=>{h+='<li>'+esc(x)+'</li>';});
    h+='</ul></div></div>';
  });
  h+='</div></div>';
  return h;
}

function renderReflection(wk){
  let h='';
  h+='<div class="sh">Reflex&atilde;o da Semana</div>';
  h+='<div class="rfcard"><div class="rforn">"</div><div class="rfq">'+esc(wk.reflection.verse)+'</div>';
  h+='<div class="rfref">'+esc(wk.reflection.reference)+'</div><div class="rfq2">* '+esc(wk.reflection.question)+'</div></div>';
  return h;
}

function renderNoteSection(wn){
  let h='';
  h+='<div class="sh">Anota&ccedil;&otilde;es da Semana</div>';
  h+='<textarea class="ntxt" id="ntxt" data-week="'+wn+'" placeholder="Insights, perguntas, vers&iacute;culos marcantes...">'+esc(NT_NOTES[wn]||'')+'</textarea>';

  h+='<div class="abar">';
  h+='<button class="abtn sv" id="btnSv">Salvar</button>';
  h+='<button class="abtn" id="btnExp">&#8595; Backup Local</button>';
  h+='<button class="abtn" id="btnImp">&#8593; Restaurar Backup</button>';
  h+='<input type="file" id="fImp" accept=".json" style="display:none">';
  h+='<button class="abtn danger" id="btnRst">Reiniciar Semana</button>';
  h+='</div>';
  return h;
}

function attachWeekHandlers(){
  attachWeekNavHandlers();
  document.querySelectorAll('[data-key]').forEach(el=>{
    el.onclick=(ev)=>{ev.stopPropagation();togDay(el.dataset.key);};
  });
  document.querySelectorAll('[data-comp]').forEach(el=>{
    el.onclick=(ev)=>{ev.stopPropagation();togComp(parseInt(el.dataset.comp));};
  });
  const nt=document.getElementById('ntxt');
  if(nt){
    nt.oninput=()=>{
      const wn=parseInt(nt.dataset.week);
      clearTimeout(_nt);
      _np={wn:wn,txt:nt.value};
      _nt=setTimeout(async()=>{await dbSaveNote(wn,nt.value);_np=null;},1500);
    };
  }
  const bSv=document.getElementById('btnSv');if(bSv)bSv.onclick=doSave;
  const bEx=document.getElementById('btnExp');if(bEx)bEx.onclick=doExport;
  const bIm=document.getElementById('btnImp');if(bIm)bIm.onclick=()=>document.getElementById('fImp').click();
  const fI=document.getElementById('fImp');if(fI)fI.onchange=doImport;
  const bR=document.getElementById('btnRst');if(bR)bR.onclick=doReset;
}

function attachWeekNavHandlers(){
  const btnP=document.getElementById('btnP');
  const btnN=document.getElementById('btnN');
  if(btnP)btnP.onclick=()=>navWk(-1);
  if(btnN)btnN.onclick=()=>navWk(1);
}

let _nt=null,_np=null;

async function togDay(key){
  ST.completedDays[key]=!ST.completedDays[key];
  const wn = parseInt(key.split('-')[0]);
  checkWeekCompletion(wn);
  renderWk(CW);
  const ok=await dbSave();
  toast(ok?(ST.completedDays[key]?'Leitura marcada':'Marcacao removida'):'Erro - use botao Salvar');
}

async function togComp(wn){
  ST.completedComplements[wn]=!ST.completedComplements[wn];
  checkWeekCompletion(wn);
  renderWk(wn);
  const ok=await dbSave();
  toast(ok?(ST.completedComplements[wn]?'Complementacao concluida':'Marcacao removida'):'Erro - use botao Salvar');
}

async function doSave(){
  const btn=document.getElementById('btnSv');
  if(btn){btn.textContent='Salvando...';btn.disabled=true;}
  if(_np){clearTimeout(_nt);await dbSaveNote(_np.wn,_np.txt);_np=null;}
  const ok=await dbSave();
  if(btn){
    btn.disabled=false;
    if(ok){btn.classList.add('svok');btn.textContent='Salvo';setTimeout(()=>{btn.classList.remove('svok');btn.textContent='Salvar';},2500);}
    else{btn.textContent='Erro!';setTimeout(()=>btn.textContent='Salvar',3000);}
  }
}

function doExport(){
  const ts=new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
  const payload={
    version:1,
    exportedAt:new Date().toISOString(),
    state:ST,
    notes:NT_NOTES
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='faithsync_backup_'+ts+'.json';
  a.click();URL.revokeObjectURL(url);
  toast('Backup salvo: faithsync_backup_'+ts+'.json');
}

async function doImport(ev){
  const file=ev.target.files[0];
  if(!file)return;
  if(!confirm('Restaurar backup? O progresso atual no servidor sera substituido.'))return;
  const r=new FileReader();
  r.onload=async(e)=>{
    try{
      const d=JSON.parse(e.target.result);
      const check=validateImport(d);
      if(!check.valid){toast(check.reason);return;}
      if(Object.prototype.hasOwnProperty.call(d,'state')){
        const safeState=validateImportState(d.state);
        ST=Object.assign({},ST,safeState);
      }
      const notesResult=await importValidNotes(d.notes);
      const ok=await dbSave();
      if(ok){
        renderWk(CW);
        if(notesResult.ignored>0)toast('Backup restaurado. '+notesResult.ignored+' anotacao(oes) ignorada(s) por dados invalidos.');
        else toast('Backup restaurado com sucesso');
      }
      else toast('Erro ao salvar no servidor — tente novamente');
    }catch(err){
      console.error('doImport error:',err);
      toast('Arquivo invalido ou corrompido');
    }
  };
  r.readAsText(file);
}

function validateImport(d){
  if(!d||typeof d!=='object'||Array.isArray(d))return {valid:false,reason:'Arquivo invalido ou corrompido'};
  if(!Object.prototype.hasOwnProperty.call(d,'version'))return {valid:false,reason:'Arquivo invalido: versao do backup ausente'};
  const hasState=Object.prototype.hasOwnProperty.call(d,'state');
  const hasNotes=Object.prototype.hasOwnProperty.call(d,'notes');
  if(!hasState&&!hasNotes)return {valid:false,reason:'Arquivo nao contem dados para restaurar'};
  if(hasState&&(!d.state||typeof d.state!=='object'||Array.isArray(d.state)))return {valid:false,reason:'Arquivo invalido: estado do backup corrompido'};
  if(hasNotes&&(!d.notes||typeof d.notes!=='object'||Array.isArray(d.notes)))return {valid:false,reason:'Arquivo invalido: anotacoes do backup corrompidas'};
  return {valid:true};
}

function validateImportState(state){
  const safe={};
  if(state.completedDays&&typeof state.completedDays==='object'&&!Array.isArray(state.completedDays)){
    safe.completedDays=state.completedDays;
  }
  if(state.completedComplements&&typeof state.completedComplements==='object'&&!Array.isArray(state.completedComplements)){
    safe.completedComplements=state.completedComplements;
  }
  if(Number.isInteger(state.currentWeek)&&state.currentWeek>=1&&state.currentWeek<=TOTAL_WEEKS){
    safe.currentWeek=state.currentWeek;
  }
  return safe;
}

async function importValidNotes(notes){
  let ignored=0;
  if(!notes)return {ignored:ignored};
  for(const k in notes){
    if(!Object.prototype.hasOwnProperty.call(notes,k))continue;
    const wn=Number(k);
    if(!Number.isInteger(wn)||wn<1||wn>TOTAL_WEEKS||typeof notes[k]!=='string'){
      ignored++;
      continue;
    }
    await dbSaveNote(wn,notes[k]);
  }
  return {ignored:ignored};
}

function doReset(){
  if(confirm('Reiniciar marcacoes desta semana? Anotacoes mantidas.')){
    if(WEEKS_DATA[CW]){
      WEEKS_DATA[CW].days.forEach((_,i)=>{delete ST.completedDays[CW+'-'+i];});
    }
    delete ST.completedComplements[CW];
    if(ST.weekCompletionHistory) delete ST.weekCompletionHistory[CW];
    dbSave();renderWk(CW);
    toast('Semana reiniciada');
  }
}

async function init(){
  const sp=document.getElementById('spinner');
  const pc=document.getElementById('page-content');
  try{
    if(sp)sp.style.display='block';
    setupNav();
    const user=await getUser();
    if(!user)return;
    const ok=await dbLoad(user.id);
    if(!renderWk(getWkFromURL()))throw new Error('Semana nao encontrada');
    if(pc)pc.style.display='block';
    document.body.classList.add('ready');
    const e=document.getElementById('uemail');if(e)e.textContent=user.email;
    if(!ok)toast('Erro ao carregar dados. Verifique sua conexao.');
  }catch(err){
    console.error('init semanas:',err);
    showInitError('Nao foi possivel carregar esta semana. Tente novamente em instantes.');
  }finally{
    if(sp&&!document.body.classList.contains('ready'))sp.style.display='none';
  }
}

function showInitError(msg){
  const pc=document.getElementById('page-content');
  const mc=document.getElementById('mc');
  if(pc)pc.style.display='block';
  document.body.classList.add('ready');
  if(mc)mc.innerHTML='<div class="phbox"><div style="font-size:1.3rem;color:var(--igd);margin-bottom:.7rem">*</div>'+
    '<div style="font-size:.82rem;letter-spacing:.15em;color:var(--td)">ERRO AO CARREGAR</div>'+
    '<div style="margin-top:.7rem;font-size:.84rem;color:var(--td);font-style:italic">'+esc(msg)+'</div>'+
    '<button class="abtn" id="btnBack" style="margin-top:1.2rem">&larr; Voltar ao &Iacute;ndice</button></div>';
  const bb=document.getElementById('btnBack');
  if(bb)bb.onclick=()=>location.href='index.html';
  toast(msg);
}

init();
