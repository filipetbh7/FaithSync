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
  document.getElementById('btnP').disabled=wn<=1;
  document.getElementById('btnN').disabled=wn>=TOTAL_WEEKS;
  document.getElementById('wknum').textContent='Semana '+wn;
  document.getElementById('wkttl').textContent=(WEEKS_DATA[wn]&&WEEKS_DATA[wn].title)||'Semana '+wn;
  document.getElementById('wksub').textContent=fmtD(wi.ds)+' - '+fmtD(wi.de)+' | '+wi.range;
  renderPH(wn);

  const wk=WEEKS_DATA[wn];
  const mc=document.getElementById('mc');

  if(!wk){
    mc.innerHTML='<div class="phbox"><div style="font-size:1.3rem;color:var(--igd);margin-bottom:.7rem">*</div>'+
      '<div style="font-size:.82rem;letter-spacing:.15em;color:var(--td)">SEMANA '+wn+' | '+wi.block+'</div>'+
      '<div style="margin-top:.7rem;font-size:.84rem;color:var(--td);font-style:italic">'+wi.range+'<br><br>Este conte&uacute;do ser&aacute; adicionado em breve.</div>'+
      '<button class="abtn" id="btnBack" style="margin-top:1.2rem">&larr; Voltar ao &Iacute;ndice</button></div>';
    const bb=document.getElementById('btnBack');
    if(bb)bb.onclick=()=>location.href='index.html';
    return;
  }

  let h='';
  h+='<div class="sh">Leitura Di&aacute;ria | 15 minutos por dia</div>';
  h+='<div class="dgrd">';
  wk.days.forEach((day,i)=>{
    const key=wn+'-'+i;
    const ck=!!ST.completedDays[key];
    const td=isToday(day.date);
    h+='<div class="dc'+(ck?' ck':'')+(td?' td':'')+'" data-key="'+key+'">';
    h+='<div class="dch"><div><div class="dlbl">'+esc(day.dayOfWeek)+'</div><div class="ddt">'+fmtD(day.date)+'</div></div>';
    h+='<div class="dchk'+(ck?' ck':'')+'" data-key="'+key+'"></div></div>';
    h+='<div class="dr">'+esc(day.reading)+(day.verses?' <span style="color:var(--td);font-size:.82em">'+esc(day.verses)+'</span>':'')+'</div>';
    h+='<div class="dctx">'+esc(day.context)+'</div>';
    h+=(td?'<div class="dbdg td">Hoje</div>':ck?'<div class="dbdg">Lido</div>':'');
    h+='</div>';
  });
  h+='</div>';

  h+='<div class="sh">Visual da Semana</div>';
  h+='<div class="vcnt"><div class="vttl">Os Quatro Imp&eacute;rios de Daniel | Mapa Temporal</div>'+wk.visual+'</div>';

  const cd=!!ST.completedComplements[wn];
  h+='<div class="sh">Complementa&ccedil;&atilde;o Semanal | ~1 hora | '+fmtD(wk.complement.date)+'</div>';
  h+='<div class="ccard"><div class="cchdr"><div class="cttl">Estudo Complementar - '+esc(wk.title)+'</div>';
  h+='<div style="display:flex;align-items:center;gap:.7rem"><div class="cdt">'+fmtDFull(wk.complement.date)+'</div>';
  h+='<div class="dchk'+(cd?' ck':'')+'" data-comp="'+wn+'"></div></div></div>';
  h+='<p class="cintro">'+esc(wk.complement.intro)+'</p><div class="rgrd">';
  wk.complement.resources.forEach(r=>{
    h+='<div class="rb '+r.type+'"><div class="rsrc">'+esc(r.title)+'</div><div class="rcnt"><ul>';
    r.items.forEach(x=>{h+='<li>'+esc(x)+'</li>';});
    h+='</ul></div></div>';
  });
  h+='</div></div>';

  h+='<div class="sh">Reflex&atilde;o da Semana</div>';
  h+='<div class="rfcard"><div class="rforn">"</div><div class="rfq">'+esc(wk.reflection.verse)+'</div>';
  h+='<div class="rfref">'+esc(wk.reflection.reference)+'</div><div class="rfq2">* '+esc(wk.reflection.question)+'</div></div>';

  h+='<div class="sh">Anota&ccedil;&otilde;es da Semana</div>';
  h+='<textarea class="ntxt" id="ntxt" data-week="'+wn+'" placeholder="Insights, perguntas, vers&iacute;culos marcantes...">'+esc(NT_NOTES[wn]||'')+'</textarea>';

  h+='<div class="abar">';
  h+='<button class="abtn sv" id="btnSv">Salvar</button>';
  h+='<button class="abtn" id="btnExp">&#8595; Backup Local</button>';
  h+='<button class="abtn" id="btnImp">&#8593; Restaurar Backup</button>';
  h+='<input type="file" id="fImp" accept=".json" style="display:none">';
  h+='<button class="abtn danger" id="btnRst">Reiniciar Semana</button>';
  h+='</div>';

  mc.innerHTML=h;
  attachWeekHandlers();
}

function attachWeekHandlers(){
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
  document.getElementById('btnP').onclick=()=>navWk(-1);
  document.getElementById('btnN').onclick=()=>navWk(1);
}

let _nt=null,_np=null;

async function togDay(key){
  ST.completedDays[key]=!ST.completedDays[key];
  renderWk(CW);
  const ok=await dbSave();
  toast(ok?(ST.completedDays[key]?'Leitura marcada':'Marcacao removida'):'Erro - use botao Salvar');
}

async function togComp(wn){
  ST.completedComplements[wn]=!ST.completedComplements[wn];
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
      if(d.state)ST=Object.assign({},ST,d.state);
      if(d.notes){
        for(const k in d.notes){await dbSaveNote(parseInt(k),d.notes[k]);}
      }
      const ok=await dbSave();
      if(ok){renderWk(CW);toast('Backup restaurado com sucesso');}
      else toast('Erro ao salvar no servidor — tente novamente');
    }catch(err){
      console.error('doImport error:',err);
      toast('Arquivo invalido ou corrompido');
    }
  };
  r.readAsText(file);
}

function doReset(){
  if(confirm('Reiniciar marcacoes desta semana? Anotacoes mantidas.')){
    if(WEEKS_DATA[CW]){
      WEEKS_DATA[CW].days.forEach((_,i)=>{delete ST.completedDays[CW+'-'+i];});
    }
    delete ST.completedComplements[CW];
    dbSave();renderWk(CW);
    toast('Semana reiniciada');
  }
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
  renderWk(getWkFromURL());
}

init();