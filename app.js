(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], fmt=n=>Number(n||0).toLocaleString('ru-RU'), esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const W=window.FlowWorkspace,prefs=W.loadPrefs(),cessionSelected=new Set();let maskCache=new Map(),currentStats={},previousStats={},collapsed=false,presentation=false,viewEdit=false,layoutDrag=null,localLayout={},layoutKey='',distributionCache=new Map();
const colors={root:'#93afd9',cyan:'#8ab7da',mag:'#b9a3dc',vio:'#9ea9db',lime:'#83cbb4',amber:'#d6b88d',red:'#d996a3'};
const rows=[["root",null,"Все должники",920,25,210,"root","Вся база договоров"],["dead","root","Умершие",920,143,210,"root","Есть дата смерти"],["A","dead","Судебный акт вынесен",640,285,210,"mag","Дата или номер исполнительного документа заполнены"],["B","dead","Судебного акта нет",1370,285,205,"vio","Дата и номер исполнительного документа отсутствуют"],["C","dead","Исполнительная надпись нотариуса",2010,285,210,"lime","Тип исполнительного документа: нотариальная надпись"],["A1","A","Правопреемство на стороне должника",625,405,210,"cyan","Замена взыскателя или должника; проверка ИНН взыскателя"],["A1s","A1","На подачу",625,555,180,"amber","Подготовка заявления"],["A1c","A1s","На рассмотрении в суде",625,665,190,"cyan","Рабочий статус: наследство / контроль"],["A1r","A1c","Результат",625,775,185,"vio","Итог рассмотрения заявления"],["A1n","A1r","Отказ",510,875,157,"red","Есть определение об отказе"],["A1o","A1r","Удовлетворено",730,875,165,"lime","Есть определение о замене должника"],["A1na","A1n","Архив",490,1010,135,"red","Закрыто после отказа"],["A1nb","A1n","Обжалуем",655,1010,145,"amber","Обжалование отказа",true],["A2","A","Правопреемство на стороне взыскателя",270,405,215,"cyan","Замена взыскателя не установлена"],["A2s","A2","На подачу",270,555,183,"amber","Имущество по обогащению"],["A2c","A2s","На рассмотрении в суде",270,665,190,"cyan","Рабочий статус: замена взыскателя"],["A2r","A2c","Результат",270,775,185,"vio","Итог рассмотрения заявления"],["A2n","A2r","Отказ",145,875,150,"red","Определение об отказе"],["A2o","A2r","Удовлетворено",340,875,170,"lime","Определение о замене взыскателя"],["A2na","A2n","Архив",122,1010,130,"red","В архив"],["A2nb","A2n","Обжалуем",285,1010,145,"amber","Обжалование отказа",true],["Bm","B","СИД пропущен (архив)",1100,405,174,"red","Срок займа более 3 лет назад"],["Ba","B","СИД не пропущен",1390,405,178,"cyan","Срок займа менее 3 лет назад"],["Bc","B","Парсинг данных",1620,405,174,"amber","Проверка пропусков данных"],["I","Ba","Иск к наследникам / наследственной массе",1400,545,205,"cyan","Проверка КД, имущества, суммы по АПП"],["Is","I","На подачу",1400,660,183,"amber","Подготовка искового заявления"],["Ic","Is","На рассмотрении в суде",1400,760,190,"cyan","Рабочий статус: иск к наследству"],["Ir","Ic","Результат",1400,855,170,"vio","Итог рассмотрения иска"],["Iw","Ir","Без рассмотрения",1170,1000,170,"red","По инициативе взыскателя / имущества нет",true],["In","Ir","Отказ",1400,1000,145,"red","Отказ в удовлетворении"],["Io","Ir","Удовлетворено",1610,1000,170,"lime","Положительное решение суда"],["Ina","In","Архив",1330,1100,130,"red","Отказ — архив"],["Inb","In","Обжалуем",1485,1100,135,"amber","Обжалование решения",true],["U14","C","СИД пропущен (архив)",1840,405,175,"red","Срок займа больше 3 лет назад"],["U15","C","СИД не пропущен",2060,405,175,"cyan","Срок займа меньше 3 лет назад"],["U16","C","Парсинг данных",2275,405,175,"amber","Срок займа отсутствует"],["U10","A","СА отменён",930,405,155,"red","Судебный акт отменён"],["U4","A","Парсинг данных",66,405,160,"amber","Не хватает сведений"],["U3","A2","Нет имущества",50,545,150,"red","Не обнаружено имущество"],["U7","A2","Парсинг данных",50,660,160,"amber","Дополнительная проверка"],["U8","A2","Долг по ИП менее 100 т.р.",52,775,170,"amber","Сумма по ИП до 100 000 ₽"],["U9","A2","На обогащение",52,1010,165,"amber","Направление на обогащение"],["U6","A1","Парсинг данных",865,545,165,"amber","Неполные данные по ветке"],["U1","A1n","Анализ для подачи иска к наследникам",880,1010,185,"amber","Оценка перспектив иска"],["U2","A1c","Долго в суде",860,775,170,"mag","Длительное рассмотрение"],["U5","A2n","Анализ отказа в замене взыскателя",70,1100,192,"amber","Причина отказа / следующие действия"],["U11","I","Нет КД",1660,755,145,"red","Кредитный договор отсутствует"],["U12","I","Сумма по АПП менее 100 т.р.",1680,655,184,"red","Сумма по АПП ниже порога"],["U13","I","Нет имущества",1660,860,148,"red","Не обнаружено имущество"]];
const nodes=rows.map(([id,p,t,x,y,w,k,rule,q])=>({id,p,t,x,y,w,k,rule,q:!!q}));
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
const nodeIds=nodes.map(n=>n.id);const nodeMap=new Map(nodes.map(n=>[n.id,n]));const baselineNodes=nodes.map(n=>({...n}));
const branchOf=id=>{let n=byId[id],i=0;while(n&&n.p&&i++<30){if(['A','B','C'].includes(n.id))return n.id;n=byId[n.p]}return ['A','B','C'].includes(id)?id:'all'};
const linkSet=id=>{const r=new Set([id]);let p=byId[id];for(let i=0;p?.p&&i<20;i++){r.add(p.p);p=byId[p.p]}for(const n of nodes)if(n.p===id)r.add(n.id);return r};
let seed=31415926;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
const match=(id,r)=>{switch(id){case'root':return true;case'dead':return r.dead;case'A':return r.dead&&r.type==='A';case'B':return r.dead&&r.type==='B';case'C':return r.dead&&r.type==='C';case'A1':return match('A',r)&&r.route==='A1';case'A2':return match('A',r)&&r.route==='A2';case'A1s':return match('A1',r)&&r.phase===0;case'A1c':return match('A1',r)&&r.phase===1;case'A1r':return match('A1',r)&&r.phase>=2;case'A1n':return match('A1',r)&&r.phase===3;case'A1o':return match('A1',r)&&r.phase===4;case'A1na':return match('A1n',r)&&!r.appeal;case'A1nb':return match('A1n',r)&&r.appeal;case'A2s':return match('A2',r)&&r.phase===0;case'A2c':return match('A2',r)&&r.phase===1;case'A2r':return match('A2',r)&&r.phase>=2;case'A2n':return match('A2',r)&&r.phase===3;case'A2o':return match('A2',r)&&r.phase===4;case'A2na':return match('A2n',r)&&!r.appeal;case'A2nb':return match('A2n',r)&&r.appeal;case'Bm':return match('B',r)&&r.old;case'Ba':return match('B',r)&&!r.old;case'Bc':return match('B',r)&&r.parse;case'I':return match('Ba',r)&&r.asset;case'Is':return match('I',r)&&r.phase===0;case'Ic':return match('I',r)&&r.phase===1;case'Ir':return match('I',r)&&r.phase>=2;case'Iw':return match('I',r)&&r.phase===5;case'In':return match('I',r)&&r.phase===3;case'Io':return match('I',r)&&r.phase===4;case'Ina':return match('In',r)&&!r.appeal;case'Inb':return match('In',r)&&r.appeal;case'U14':return match('C',r)&&r.old;case'U15':return match('C',r)&&!r.old&&!r.parse;case'U16':return match('C',r)&&r.parse;case'U10':return match('A',r)&&r.ex;case'U4':return match('A',r)&&r.parse;case'U3':return match('A2',r)&&!r.asset;case'U7':return match('A2',r)&&r.parse;case'U8':return match('A2',r)&&r.amt<100000;case'U9':return match('A2',r)&&r.asset&&r.amt>100000;case'U6':return match('A1',r)&&r.parse;case'U1':return match('A1n',r)&&r.asset;case'U2':return match('A1c',r)&&r.old;case'U5':return match('A2n',r)&&r.asset;case'U11':return match('I',r)&&!r.contract;case'U12':return match('I',r)&&r.amt<100000;case'U13':return match('I',r)&&!r.asset;default:return false}};
function demoRow(i){const r=rnd();return{id:'TEST-'+String(i+1).padStart(6,'0'),dead:rnd()>.035,age:Math.floor(rnd()*95),amt:Math.floor(5000+Math.pow(rnd(),2)*2600000),type:r<.48?'A':r<.77?'B':'C',route:rnd()<.56?'A1':'A2',phase:Math.floor(rnd()*5),asset:rnd()<.6,contract:rnd()>.14,old:rnd()<.47,appeal:rnd()<.23,parse:rnd()<.17,ex:rnd()<.07}};
function makeDemo(){seed=31415926;const a=Array.from({length:3800},(_,i)=>demoRow(i));const b=a.map(r=>({...r}));for(let i=0;i<b.length;i++){
 const r=b[i];if(i%17===0){r.phase=(r.phase+1)%5;}
 if(i%41===0){r.type=r.type==='A'?'B':r.type==='B'?'C':'A'}
 if(i%47===0){r.asset=!r.asset;r.old=!r.old}
 if(i%53===0){r.route=r.route==='A1'?'A2':'A1'}
 if(i%67===0){r.parse=!r.parse}
}
const previous=a.filter((_,i)=>i%127!==0),current=b.filter((_,i)=>i%131!==0).concat(Array.from({length:118},(_,i)=>demoRow(3800+i)));
const build=(records,label)=>{const n=records.length,sets={},map={},own={},labels={},sig={};let ids=[],amt=[],dd=[];
 const bins=Object.fromEntries(nodes.map(nd=>[nd.id,new Uint8Array(Math.ceil(n/8))]));
 records.forEach((r,i)=>{ids.push(r.id);amt.push(r.amt);dd.push(r.dead?Math.floor(Date.now()/86400000)-Math.round(r.age*30.44):null);for(const nd of nodes){if(match(nd.id,r))bins[nd.id][i>>3]|=1<<(i&7)}});
 for(const nd of nodes){const k=nd.id;sets[k]=bytesToBase64(bins[k]);map[k]=k;labels[k]=nd.t;sig[k]=JSON.stringify([nd.p,nd.rule]);if(!['root','dead','A','B','C','A1r','A2r','Ir','Is','In','Io','Ina'].includes(k))own[k]=1}
 return{v:1,ver:label,at:new Date(Date.now()-(label==='demo-old'?86400000:0)).toISOString(),file:label==='demo-old'?'ДЕМО_вчера.xlsx':'ДЕМО_сегодня.xlsx',n,ids,amt,dd,sets,map,own,labels,sig,demo:true};};
 return [build(previous,'demo-old'),build(current,'demo-new')];}
function bytesToBase64(u){let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)}
function base64ToBytes(str){const s=atob(str);const out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
const cleanID=v=>String(v??'').trim().replace(/\.0+$/,'');
function validSnap(s){return !!(s&&Array.isArray(s.ids)&&s.map&&s.sets&&Number.isInteger(s.n)&&s.n>=0&&s.ids.length===s.n)}
function prepareSnapshot(s){if(!validSnap(s))throw Error('Неверный формат: ожидается снимок с полями ids, map и sets');const idx=new Map(),duplicate=new Set();s.ids.forEach((raw,i)=>{const id=cleanID(raw);if(!id)return;if(idx.has(id)){duplicate.add(id)}else idx.set(id,i)});
 const bitsets={};const decoded={};for(const id of nodeIds){const key=s.map[id];if(key==null)continue;if(typeof s.sets[key]!=='string')throw Error('Отсутствуют данные блока '+id);if(!decoded[key])decoded[key]=base64ToBytes(s.sets[key]);if(decoded[key].length!==Math.ceil(s.n/8))throw Error('Повреждён состав блока '+id);bitsets[id]=decoded[key]}
 return{...s,idx,duplicate,bitsets};}
function membership(s,i){if(!s||i==null||i<0)return[];const out=[];for(const code of nodeIds){const bits=s.bitsets[code];if(bits&&(bits[i>>3]&(1<<(i&7))))out.push(code)}return out;}
function filterOptions(){const d=new Date();return{sum:Number($('#minAmt').value)||0,death:$('#deathFilter').value||'all',limit:Date.UTC(d.getFullYear(),d.getMonth()-5,d.getDate())/86400000,cessions:cessionSelected}}
function masksFor(s){if(!maskCache.has(s)){const o=filterOptions();maskCache.set(s,{normal:W.filterMask(s,o,false),root:W.filterMask(s,o,true)})}return maskCache.get(s)}
function visible(s,i){return !!(s&&i!=null&&i>=0&&masksFor(s).normal[i])}
let draggingView=null,skipPanClick=false,hoveredNode=null,liveLinks=true,motionSpeed=1,structureMotionKey='',routeStarted=0;let singleMode=false,rawWarnings="",previous=null,current=null,analysis=null,display='vertical',branch='all',selected='A1',scale=1,playing=false,flowIndex=0,filteredFlows=[],viewPositions={},renderVersion=0;
const canvas=$('#canvas'),board=$('#board'),wrap=$('#canvasWrap'),svg=$('#edges'),layer=$('#nodeLayer'),badges=$('#badgeLayer');
function analyze(before,after){const beforeCount={},afterCount={},blockAdded={},blockRemoved={},blockAddedIds={},blockRemovedIds={};for(const code of nodeIds){beforeCount[code]=0;afterCount[code]=0;blockAdded[code]=0;blockRemoved[code]=0;blockAddedIds[code]=[];blockRemovedIds[code]=[];}
const skipped=new Set([...(before?.duplicate||[]),...(after?.duplicate||[])]);let newTotal=0,goneTotal=0,unchanged=0,ambiguous=0,ruleAffected=0,cleanMoves=0,missing=0,filterChanged=0;
const flows=new Map(),ambiguousRows=[],ruleRows=[],addedRows=[],goneRows=[];
const addSample=(dict,key,id)=>{dict[key].push(id)};
const all=new Set([...(before?.idx?.keys()||[]),...(after?.idx?.keys()||[])]);
 for(const id of all){if(skipped.has(id))continue;const ai=before?.idx.get(id),bi=after?.idx.get(id);const aPresent=ai!==undefined&&ai!==null,bPresent=bi!==undefined&&bi!==null;
 const va=aPresent&&visible(before,ai),vb=bPresent&&visible(after,bi);
 if(!va&&!vb)continue;
 const comparable=code=>code==='root'||before?.own?.[code]||after?.own?.[code];const a=va?membership(before,ai).filter(comparable):[],b=vb?membership(after,bi).filter(comparable):[];
 // Current totals are counted separately, with the original row-based filters.
 const as=new Set(a),bs=new Set(b),exited=a.filter(x=>!bs.has(x)),entered=b.filter(x=>!as.has(x));
 for(const code of exited){blockRemoved[code]++;addSample(blockRemovedIds,code,id)}
 for(const code of entered){blockAdded[code]++;addSample(blockAddedIds,code,id)}
 if(!aPresent&&bPresent){newTotal++;addedRows.push({id,from:'—',to:b.join(', '),kind:'Новый в реестре'});continue}
 if(aPresent&&!bPresent){goneTotal++;goneRows.push({id,from:a.join(', '),to:'—',kind:'Выбыл из реестра'});continue}
 if(va!==vb){filterChanged++;continue}
 if(!exited.length&&!entered.length){unchanged++;continue}
 const changedSig=[...exited,...entered].some(x=>!before?.sig?.[x]||!after?.sig?.[x]||before.sig[x]!==after.sig[x]);
 if(changedSig){ruleAffected++;ruleRows.push({id,from:exited.join(', '),to:entered.join(', '),kind:'Изменены правила'});continue}
 const eligible=x=>(before?.own?.[x]||after?.own?.[x])&& !['root','dead'].includes(x);
 const src=exited.filter(eligible),dst=entered.filter(eligible);
 if(src.length===1&&dst.length===1&&exited.length===1&&entered.length===1&&src[0]!==dst[0]){
  const key=src[0]+'|'+dst[0];let f=flows.get(key);if(!f){f={key,from:src[0],to:dst[0],count:0,ids:[],source:'membership'};flows.set(key,f)}f.count++;f.ids.push(id);cleanMoves++;
 }else{ambiguous++;ambiguousRows.push({id,from:exited.join(', ')||'остался',to:entered.join(', ')||'остался',kind:'Несколько/нет однозначного маршрута'})}
 }
 const order=[...flows.values()].sort((a,b)=>b.count-a.count);return{beforeCount:Object.fromEntries(nodeIds.map(id=>[id,previousStats[id]?.count||0])),afterCount:Object.fromEntries(nodeIds.map(id=>[id,currentStats[id]?.count||0])),blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:order,newTotal,goneTotal,unchanged,ambiguous,ruleAffected,cleanMoves,missing,filterChanged,skipped:skipped.size,addedRows,goneRows,ambiguousRows,ruleRows,source:before?.file+' → '+after?.file};}

function setSchema(...snaps){
 const custom=snaps.filter(Boolean).some(s=>Array.isArray(s.nodesMeta));
 const known=new Map(baselineNodes.map(n=>[n.id,{...n}]));
 const result=new Map();
 if(!custom)baselineNodes.forEach(n=>result.set(n.id,{...n}));
 for(const s of snaps.filter(Boolean)){
  const map=new Map((s.nodesMeta||[]).map(m=>[m.id,m]));
  for(const id of Object.keys(s.map||{})){
   const m=map.get(id),old=known.get(id)||result.get(id);
   const kind=m?.k, color=old?.k||({root:'root',group:'vio',stage:'cyan',result:'lime',final:'amber'}[kind]||'cyan');
   const fallback={id,p:id==='root'?null:'dead',t:s.labels?.[id]||id,x:2400+(result.size%4)*230,y:500+Math.floor(result.size/4)*110,w:180,k:color,rule:'',q:false};
   result.set(id,{...(old||fallback),...(m?{p:m.p,t:m.t,rule:m.rule,q:m.q,parents:m.parents,bases:m.bases,extra:m.extra,returns:m.returns,criteria:m.criteria,logic:m.logic,subtract:m.subtract,from:m.from,x:Number.isFinite(m.x)?m.x:old?.x||fallback.x,y:Number.isFinite(m.y)?m.y:old?.y||fallback.y}:{}),k:color,t:s.labels?.[id]||m?.t||old?.t||id});
  }
 }
 if(!result.has("root"))result.set("root",{...known.get("root")});
 nodes.splice(0,nodes.length,...result.values());
 for(const key of Object.keys(byId))delete byId[key];
 nodeMap.clear();nodeIds.splice(0,nodeIds.length);
 for(const n of nodes){byId[n.id]=n;nodeMap.set(n.id,n);nodeIds.push(n.id)}
 if(!byId[selected])selected=byId.dead?"dead":"root";
 const nav=document.querySelector('[data-branch="all"] b');if(nav)nav.textContent=nodes.length;
}
function emptySingleAnalysis(s){
 const beforeCount={},afterCount={},blockAdded={},blockRemoved={},blockAddedIds={},blockRemovedIds={};
 for(const id of nodeIds){beforeCount[id]=afterCount[id]=currentStats[id]?.count||0;blockAdded[id]=blockRemoved[id]=0;blockAddedIds[id]=[];blockRemovedIds[id]=[]}
 return {beforeCount,afterCount,blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:[],newTotal:0,goneTotal:0,unchanged:0,ambiguous:0,ruleAffected:0,cleanMoves:0,missing:0,filterChanged:0,skipped:s.duplicate.size,addedRows:[],goneRows:[],ambiguousRows:[],ruleRows:[],source:s.file};
}
function syncCompareControls(){
 for(const el of $$('[data-mode="compare"],[data-action="compare"],[data-action="flows"],[data-action="ambiguous"],#playBtn,#prevBtn,#nextBtn,#flowSlider,#detailBtn,#exportBtn'))el.disabled=singleMode;
 const both=[current,previous].filter(Boolean);
 $('#minAmt').disabled=both.some(s=>!Array.isArray(s.amt));
 $('#deathFilter').disabled=both.some(s=>!Array.isArray(s.dd));
 if($('#minAmt').disabled)$('#minAmt').value='';
 if($('#deathFilter').disabled)$('#deathFilter').value='all';paintCessions();
}
function acceptSnapshots(cur,prev,source){
 if(!validSnap(cur)||prev&&!validSnap(prev))throw Error('Не получен корректный рассчитанный снимок.');
 singleMode=!prev;playing=false;collapsed=false;$('#collapseBtn').classList.remove('on');$('#collapseBtn').setAttribute('aria-pressed','false');
 setSchema(prev,cur);
 current=prepareSnapshot(cur);previous=prev?prepareSnapshot(prev):current;$('#welcome').hidden=true;$('#minimapBox').hidden=!prefs.minimap;restoreLayout();
 rawWarnings=[cur.warning,prev?.warning].filter(Boolean).join(" · ");
 $('#sourceLabel').textContent=source;
 display=singleMode?'vertical':'compare';branch='all';$('#branchMobile').value='all';if(prefs.restore&&prefs.view){const v=prefs.view;$('#minAmt').value=v.minAmt||'';$('#deathFilter').value=['all','old','recent'].includes(v.death)?v.death:'all';cessionSelected.clear();for(const c of v.cessions||[])cessionSelected.add(c);if(['all','A','B','C'].includes(v.branch)){branch=v.branch;$('#branchMobile').value=branch}}setModeButtons();setBranchButtons();syncCompareControls();recompute(true);if(prefs.restore&&prefs.view&&display===prefs.view.display){const v=prefs.view;setScale(Number(v.scale)||1);board.scrollLeft=Number(v.left)||0;board.scrollTop=Number(v.top)||0}
}

const CARD_W=272,CARD_H=158,ROW_STEP=198,LANES=[{x:180,title:'Замена взыскателя',items:['A2','A2s','A2c','A2r','A2n','A2o','A2na','A2nb','U5','U3','U7','U8','U9','U4']},{x:520,title:'Замена должника',items:['A1','A1s','A1c','A1r','A1n','A1o','A1na','A1nb','U1','U2','U6','U10']},{x:860,title:'Без судебного акта',items:['Bm','Ba','Bc','I','Is','Ic','Ir','Iw','In','Io','Ina','Inb','U11','U12','U13']},{x:1200,title:'Нотариальная надпись',items:['U14','U15','U16']}];
function verticalPositions(){
 const pos={root:{x:690,y:26},dead:{x:690,y:204},A:{x:350,y:398},B:{x:860,y:398},C:{x:1200,y:398}};
 for(const lane of LANES)lane.items.filter(id=>byId[id]).forEach((id,j)=>pos[id]={x:lane.x,y:610+j*ROW_STEP});
 for(const n of nodes){if(pos[n.id])continue;const p=pos[n.p],x=p?.x||({A:520,B:860,C:1200}[branchOf(n.id)]||690);const y=Math.max(610,...Object.values(pos).filter(v=>v.x===x).map(v=>v.y+ROW_STEP));pos[n.id]={x,y}}
 return pos;
}
function originalPositions(){
 const pos={},used=[];
 for(const n of [...nodes].sort((a,b)=>a.y-b.y||a.x-b.x)){
  const p={x:n.x*2.05+160,y:n.y*2.05+36};
  while(used.some(q=>Math.abs(q.x-p.x)<CARD_W+12&&Math.abs(q.y-p.y)<CARD_H+12)){
   p.y=Math.max(...used.filter(q=>Math.abs(q.x-p.x)<CARD_W+12&&Math.abs(q.y-p.y)<CARD_H+12).map(q=>q.y+CARD_H+18));
  }
  pos[n.id]=p;used.push(p);
 }
 return pos;
}
const MIN_ZOOM=.05,MAX_ZOOM=2.5,BOARD_MARGIN=96;let worldSize={w:1,h:1};
function calcSize(p){let maxX=0,maxY=0;for(const v of Object.values(p)){maxX=Math.max(maxX,v.x+CARD_W/2);maxY=Math.max(maxY,v.y+CARD_H)}return{w:Math.ceil(maxX+BOARD_MARGIN),h:Math.ceil(maxY+BOARD_MARGIN)}}
function normalizePositions(p){const values=Object.values(p);if(!values.length)return p;const dx=Math.max(0,BOARD_MARGIN-Math.min(...values.map(v=>v.x-CARD_W/2))),dy=Math.max(0,BOARD_MARGIN-Math.min(...values.map(v=>v.y)));if(dx||dy)for(const v of values){v.x+=dx;v.y+=dy}return p}
function bezier(from,to,positions,compare=false){
 const a=positions[from],b=positions[to];if(!a||!b)return '';
 const dx=b.x-a.x,dy=b.y-a.y,midY=(a.y+b.y)/2,dir=dx>=0?1:-1;
 const nearColumn=Math.abs(dx)<CARD_W*.65;
 if(nearColumn&&Math.abs(dy)>CARD_H+ROW_STEP*.6){
  // Long jumps avoid intervening cards by using the gutter on their right.
  const sy=a.y+CARD_H*.5,ey=b.y+CARD_H*.5,sx=a.x+CARD_W/2,ex=b.x+CARD_W/2,gutter=Math.max(sx,ex)+24;
  const sign=dy>0?1:-1,r=12;
  return 'M'+sx+' '+sy+' H'+(gutter-r)+' Q'+gutter+' '+sy+' '+gutter+' '+(sy+sign*r)+' V'+(ey-sign*r)+' Q'+gutter+' '+ey+' '+(gutter-r)+' '+ey+' H'+(ex+3);
 }
 if(nearColumn&&Math.abs(dy)>CARD_H){
  const down=dy>0,sy=a.y+(down?CARD_H:0),ey=b.y+(down?-4:CARD_H+4),mid=(sy+ey)/2;
  return 'M'+a.x+' '+sy+' C'+a.x+' '+mid+','+b.x+' '+mid+','+b.x+' '+ey;
 }
 if(dy>CARD_H+25&&!compare){
  const sy=a.y+CARD_H,ey=b.y-4,m=(sy+ey)/2;return 'M'+a.x+' '+sy+' C'+a.x+' '+m+','+b.x+' '+m+','+b.x+' '+ey;
 }
 const sx=a.x+dir*CARD_W/2,ex=b.x-dir*(CARD_W/2+4),sy=a.y+CARD_H/2,ey=b.y+CARD_H/2;
 const bend=Math.max(22,Math.abs(ex-sx)*.34);return 'M'+sx+' '+sy+' C'+(sx+dir*bend)+' '+sy+','+(ex-dir*bend)+' '+ey+','+ex+' '+ey;
}
function addDirectionMarkers(){
 const defs=document.createElementNS(svgNS,'defs');defs.setAttribute('class','direction-defs');
 for(const [id,color] of [['arrowBase','#8796aa'],['arrowIn','#91bbef'],['arrowOut','#e3b980']]){
  const m=document.createElementNS(svgNS,'marker');
  for(const [k,v] of Object.entries({id,viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto',markerUnits:'userSpaceOnUse'}))m.setAttribute(k,v);
  const p=document.createElementNS(svgNS,'path');p.setAttribute('d','M0 0 L10 5 L0 10 Z');p.setAttribute('fill',color);m.appendChild(p);defs.appendChild(m);
 }
 svg.appendChild(defs);
}
function structuralLinks(){
 const result=[],seen=new Set();
 for(const n of nodes){
  const groups=[[n.parents||[n.p],'parent'],[n.extra||[],'extra'],[n.returns||(!n.parents&&n.id==='A1'?['A2o']:[]),'return']];
  for(const [sources,kind] of groups)for(const from of new Set(sources)){
   if(!from||from===n.id||!byId[from])continue;const key=from+'>'+n.id+'|'+kind;
   if(seen.has(key))continue;seen.add(key);result.push({from,to:n.id,kind});
  }
 }
 return result;
}
function addStructuralEdges(){
 addDirectionMarkers();
 const frag=document.createDocumentFragment();
 for(const edge of structuralLinks()){
  const d=bezier(edge.from,edge.to,viewPositions);if(!d)continue;
  const p=pathEl(d,'base-edge'+(edge.kind==='extra'?' extra-edge':edge.kind==='return'?' return-edge':''));
  p.dataset.a=edge.from;p.dataset.b=edge.to;p.dataset.kind=edge.kind;p.setAttribute('marker-end','url(#arrowBase)');frag.appendChild(p);
 }
 svg.appendChild(frag);
}
const svgNS='http://www.w3.org/2000/svg';function pathEl(d,clazz,ec){const p=document.createElementNS(svgNS,'path');p.setAttribute('d',d);p.setAttribute('class',clazz);if(ec)p.style.setProperty('--ec',ec);return p}
function renderDiagram(reset=false){if(!analysis)return;structureMotionKey='';
 hoveredNode=null;viewPositions=normalizePositions(display==='graph'?originalPositions():verticalPositions());const laneOffset={x:(viewPositions.root?.x||690)-690,y:(viewPositions.root?.y||26)-26};for(const [id,p] of Object.entries(localLayout[display]||{}))if(viewPositions[id]&&Number.isFinite(p.x)&&Number.isFinite(p.y))viewPositions[id]={x:Math.max(CARD_W/2+BOARD_MARGIN,p.x),y:Math.max(BOARD_MARGIN,p.y)};const sz=calcSize(viewPositions);worldSize=sz;canvas.style.width=sz.w+'px';canvas.style.height=sz.h+'px';svg.setAttribute('width',sz.w);svg.setAttribute('height',sz.h);svg.setAttribute('viewBox',`0 0 ${sz.w} ${sz.h}`);svg.replaceChildren();layer.replaceChildren();badges.replaceChildren();
 const frag=document.createDocumentFragment();addStructuralEdges();
 for(const n of nodes){const p=viewPositions[n.id];if(!p)continue;const b=document.createElement('button');b.type='button';b.className='node';b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.setProperty('--c',colors[n.k]);b.dataset.id=n.id;
 const a=analysis.afterCount[n.id],before=analysis.beforeCount[n.id],delta=a-before;const title=current?.labels?.[n.id]||n.t;const noRule=n.id!=="root"&&!current?.own?.[n.id]&&!current?.demo;
 b.innerHTML=`<div class="code">${esc(n.id)}</div><div class="node-name">${esc(title)}</div><div class="node-bottom"><span class="mini">${display==='compare'?'Было '+fmt(before):'Договоров'}</span><span class="count">${noRule?'—':fmt(a)}</span></div>${delta&&display==='compare'?`<span class="delta ${delta<0?'neg':''}">${delta>0?'+':''}${fmt(delta)}</span>`:''}`;
 b.title=title+(noRule?' · нет собственного условия расчёта':singleMode?' · строк '+fmt(a):' · было '+fmt(before)+' · стало '+fmt(a));b.addEventListener('click',()=>{if(!viewEdit)chooseNode(n.id,true)});b.addEventListener('pointerdown',e=>startCardMove(e,n.id));b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!draggingView){hoveredNode=n.id;highlight()}});b.addEventListener('pointerleave',()=>{if(hoveredNode===n.id){hoveredNode=null;highlight()}});frag.appendChild(b)}layer.appendChild(frag);
 if(display==='vertical'||display==='compare'){for(const {x,title:text} of LANES){const e=document.createElement('div');e.className='lane-head';e.style.left=(x+laneOffset.x)+'px';e.style.top=(562+laneOffset.y)+'px';e.textContent=text;layer.appendChild(e)}}
 $('#boardTitle').textContent=display==='graph'?'Полная схема':display==='compare'?'Сравнение реестров':'Вертикальный обзор';
 $('#boardSub').textContent=nodes.length+' блоков · '+(current?.empty?'ожидание загрузки':current?.demo?'условные данные':singleMode?'локальный расчёт · строки реестра':'строки блоков · переходы по ID');$('#comparisonLabel').textContent=singleMode?(current?.file||'—')+' · '+(current.rulesName||'без предыдущего снимка'):(previous?.file||'—')+' → '+(current?.file||'—');
 setScale(scale);showFlow();highlight();drawMinimap();if(reset){if(display==='graph')fitAll();else{const target=window.innerWidth<850?1:Math.min(1,Math.max(.85,(board.clientWidth-24)/sz.w));setScale(target);const p=viewPositions[branch==='all'?'root':branch]||viewPositions.root;board.scrollLeft=Math.max(0,(p?.x||690)*scale-board.clientWidth*.5);board.scrollTop=branch==='all'?0:Math.max(0,(p?.y||0)*scale-32);}}}
function setScale(v){
 scale=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number(v)||1));canvas.style.transform='scale('+scale+')';
 // The scroll surface is sized in scaled world coordinates, not the transformed element's layout box.
 const width=Math.max(board.clientWidth,Math.ceil(worldSize.w*scale)),height=Math.max(board.clientHeight,Math.ceil(worldSize.h*scale));
 wrap.style.width=width+'px';wrap.style.height=height+'px';
 $('#zoomVal').textContent=Math.round(scale*100)+'%';updateMinimapViewport();
}
function zoomAt(v,x=board.clientWidth/2,y=board.clientHeight/2){
 const prev=scale,wx=(board.scrollLeft+x)/prev,wy=(board.scrollTop+y)/prev;
 setScale(v);board.scrollLeft=wx*scale-x;board.scrollTop=wy*scale-y;updateMinimapViewport();saveViewSoon();
}
function fitZoom(){const v=(board.clientWidth-20)/Math.max(1,worldSize.w);setScale(Math.min(1,v));board.scrollLeft=0;board.scrollTop=0;}
function fitAll(){const w=Math.max(1,board.clientWidth-20),h=Math.max(1,board.clientHeight-20);setScale(Math.min(1,w/worldSize.w,h/worldSize.h));board.scrollLeft=0;board.scrollTop=0;updateMinimapViewport();saveViewSoon();}
function pauseForManualNavigation(){if(display==='compare'&&playing){playing=false;showFlow()}}
function chooseNode(id,go){
 if(!byId[id])return;selected=id;hoveredNode=null;
 if(display==='compare'){
  pauseForManualNavigation();
  const ix=filteredFlows.findIndex(f=>f.from===id||f.to===id);
  if(ix>=0){flowIndex=ix;showFlow()}
 }
 highlight();renderInspector();if(go)$('#inspector').classList.add('open');
}
function highlight(){
 if(!analysis)return;
 const target=hoveredNode||selected,s=$('#search').value.trim().toLowerCase(),incoming=new Set(),outgoing=new Set();
 for(const e of structuralLinks()){if(e.to===target)incoming.add(e.from);if(e.from===target)outgoing.add(e.to)}
 const f=display==='compare'?filteredFlows[flowIndex]:null;
 for(const e of $$('.node')){
  const id=e.dataset.id,n=byId[id],txt=(id+' '+(current?.labels?.[id]||n?.t||id)).toLowerCase();
  const okBranch=branch==='all'||branchOf(id)===branch||['root','dead'].includes(id);
  const actual=!!f&&(id===f.from||id===f.to);
  e.classList.toggle('collapsed',collapsed&&branch!=='all'&&!okBranch&&!actual);e.classList.toggle('dim',!actual&&id!==target&&!incoming.has(id)&&!outgoing.has(id)&&(!okBranch||(s&&!txt.includes(s))));
  e.classList.toggle('connection-in',incoming.has(id));e.classList.toggle('connection-out',outgoing.has(id));e.classList.toggle('connection-focus',id===target);
  e.classList.toggle('route-source',f?.from===id);e.classList.toggle('route-target',f?.to===id);e.classList.toggle('selected',id===selected);e.classList.toggle('flight',actual);
 }
 for(const e of $$('.base-edge')){
  const into=e.dataset.b===target,out=e.dataset.a===target;
  e.classList.toggle('collapsed',collapsed&&branch!=='all'&&[e.dataset.a,e.dataset.b].some(id=>!['root','dead'].includes(id)&&branchOf(id)!==branch));e.classList.toggle('near',into||out);e.classList.toggle('edge-in',into);e.classList.toggle('edge-out',out);
  e.setAttribute('marker-end','url(#'+(into?'arrowIn':out?'arrowOut':'arrowBase')+')');
 }
 syncStructuralMotion(target);
}
function motionReduced(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function removeStructureMotion(){svg.querySelectorAll('.structure-motion').forEach(e=>e.remove());structureMotionKey=''}
function motionPacket(group,d,color,duration,offset,radius){
 const dot=document.createElementNS(svgNS,'circle');
 dot.setAttribute('r',String(radius));dot.setAttribute('fill',color);dot.setAttribute('class','signal-packet');
 const anim=document.createElementNS(svgNS,'animateMotion');
 anim.setAttribute('dur',duration+'s');anim.setAttribute('path',d);anim.setAttribute('repeatCount','indefinite');anim.setAttribute('begin','indefinite');dot.appendChild(anim);group.appendChild(dot);
 return ()=>{if(typeof anim.beginElementAt==='function')anim.beginElementAt(-offset);else anim.setAttribute('begin','0s')};
}
function syncStructuralMotion(target){
 const allowed=liveLinks&&display!=='compare'&&!motionReduced()&&!draggingView&&!viewEdit&&!current?.empty;
 $('#liveLinksBtn').hidden=false;$('#liveLinksBtn').classList.toggle('on',liveLinks);$('#liveLinksBtn').setAttribute('aria-pressed',String(liveLinks));
 $('#motionHint').textContent=display==='compare'?'Движение только по подтверждённым ID':'Анимация связей по правилам, не перемещение договоров';
 if(!allowed){removeStructureMotion();return}
 const links=structuralLinks().filter(e=>(e.from===target||e.to===target)&&(!collapsed||branch==='all'||[e.from,e.to].every(id=>['root','dead'].includes(id)||branchOf(id)===branch))).slice(0,20);
 const key=display+'|'+target+'|'+motionSpeed+'|'+links.map(e=>e.from+'>'+e.to).join(',');
 if(structureMotionKey===key)return;
 removeStructureMotion();structureMotionKey=key;
 const g=document.createElementNS(svgNS,'g');g.setAttribute('class','structure-motion');const start=[];
 links.forEach((e,i)=>{
  const d=bezier(e.from,e.to,viewPositions);if(!d)return;
  const color=e.to===target?'#91bbef':'#e3b980';
  const trail=pathEl(d,'signal-trail',color);trail.setAttribute('pathLength','100');trail.style.setProperty('--speed',(2.8/motionSpeed)+'s');trail.style.setProperty('--delay',(-i*.25)+'s');g.appendChild(trail);
  start.push(motionPacket(g,d,color,2.8/motionSpeed,(i*.3)%(2.8/motionSpeed),3.2));
 });
 svg.appendChild(g);start.forEach(fn=>fn());
}
function bindCanvasNavigation(){
 board.addEventListener('wheel',e=>{
  e.preventDefault();pauseForManualNavigation();const r=board.getBoundingClientRect();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?board.clientHeight:1);
  zoomAt(scale*Math.exp(-delta*.0016),e.clientX-r.left-board.clientLeft,e.clientY-r.top-board.clientTop);
 },{passive:false});
 board.addEventListener('pointerdown',e=>{
  if(layoutDrag||e.pointerType==='touch'||(e.button!==0&&e.button!==1))return;
  const r=board.getBoundingClientRect();
  if(e.clientX>=r.left+board.clientLeft+board.clientWidth||e.clientY>=r.top+board.clientTop+board.clientHeight)return;
  skipPanClick=false;draggingView={id:e.pointerId,x:e.clientX,y:e.clientY,left:board.scrollLeft,top:board.scrollTop,moved:false};
  if(e.button===1)e.preventDefault();
 });
 window.addEventListener('pointermove',e=>{
  const p=draggingView;if(!p||p.id!==e.pointerId)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.moved&&Math.hypot(dx,dy)<5)return;
  if(!p.moved){p.moved=true;skipPanClick=true;hoveredNode=null;board.classList.add('panning');try{board.setPointerCapture(e.pointerId)}catch{}pauseForManualNavigation();highlight()}
  board.scrollLeft=p.left-dx;board.scrollTop=p.top-dy;if(e.cancelable)e.preventDefault();
 },{passive:false});
 const end=e=>{
  if(!draggingView||(e.pointerId!==undefined&&e.pointerId!==draggingView.id))return;
  const p=draggingView;draggingView=null;board.classList.remove('panning');try{if(board.hasPointerCapture(p.id))board.releasePointerCapture(p.id)}catch{}
  if(p.moved)skipPanClick=true;highlight();
 };
 window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);window.addEventListener('blur',end);
 board.addEventListener('click',e=>{if(skipPanClick&&e.detail){e.preventDefault();e.stopImmediatePropagation();skipPanClick=false}},{capture:true});
 board.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
}

function showFlow(){
 svg.querySelectorAll('.movement-edge,.movement-glow,.movement-track,.marker,.click-edge,.route-defs,.cinematic-route').forEach(x=>x.remove());badges.replaceChildren();for(const n of $$('.node'))n.classList.remove('motion-source','motion-target');
 const f=filteredFlows[flowIndex],active=display==='compare'&&!singleMode;
 $('#motionPanel').hidden=!active;$('#routeStory').hidden=!active||!f;$('#replayRoute').disabled=!active||!f;$('#motionSpeed').disabled=!active||!f;
 $('#flowSlider').max=Math.max(0,filteredFlows.length-1);$('#flowSlider').value=flowIndex;
 $('#flowCount').textContent=filteredFlows.length?(flowIndex+1)+' / '+filteredFlows.length:'0';
 const label=id=>current?.labels?.[id]||byId[id]?.t||id;
 $('#flowTitle').textContent=f?f.from+' → '+f.to+' · '+label(f.from)+' → '+label(f.to)+' · '+fmt(f.count)+' договоров':'Однозначных переходов не обнаружено';
 $('#flowTitle').title=$('#flowTitle').textContent;
 $('#playBtn').textContent=playing?'Ⅱ Пауза':'▷ Воспроизвести';$('#playBtn').classList.toggle('on',playing);
 for(const id of ['prevBtn','nextBtn','flowSlider','detailBtn','playBtn'])$('#'+id).disabled=!active||!f;
 if(!active||!f){highlight();renderInspector();return}
 updateRouteStory(f,label);routeStarted=performance.now();
 const d=bezier(f.from,f.to,viewPositions,true);if(!d)return;
 const col='#a2e4cc',defs=document.createElementNS(svgNS,'defs');defs.setAttribute('class','route-defs');
 const arrow=document.createElementNS(svgNS,'marker');for(const [k,v] of Object.entries({id:'routeArrow',viewBox:'0 0 10 10',refX:'8.5',refY:'5',markerWidth:'9',markerHeight:'9',markerUnits:'userSpaceOnUse',orient:'auto-start-reverse'}))arrow.setAttribute(k,v);
 const tip=document.createElementNS(svgNS,'path');tip.setAttribute('d','M 0 1 L 9 5 L 0 9 Z');tip.setAttribute('fill',col);arrow.appendChild(tip);defs.appendChild(arrow);svg.appendChild(defs);
 svg.appendChild(pathEl(d,'movement-glow',col));const track=pathEl(d,'movement-track',col);track.setAttribute('marker-end','url(#routeArrow)');svg.appendChild(track);
 const motionAllowed=playing&&!motionReduced();
 if(motionAllowed){
  const g=document.createElementNS(svgNS,'g');g.setAttribute('class','cinematic-route');
  const trail=pathEl(d,'signal-trail real-trail',col);trail.setAttribute('pathLength','100');trail.style.setProperty('--speed',(3.6/motionSpeed)+'s');g.appendChild(trail);
  const fire=[];const dur=3.6/motionSpeed;
  for(let i=0;i<4;i++)fire.push(motionPacket(g,d,i===0?'#edfff7':'#a2e4cc',dur,i*dur*.10,i===0?5.5:3.2));
  svg.appendChild(g);fire.forEach(fn=>fn());
  for(const n of $$('.node')){if(n.dataset.id===f.from){n.style.setProperty('--cycle',dur+'s');n.classList.add('motion-source')}if(n.dataset.id===f.to){n.style.setProperty('--cycle',dur+'s');n.classList.add('motion-target')}}
 }
 const hit=pathEl(d,'click-edge');hit.addEventListener('click',()=>{selected=f.to;renderInspector();openFlowDetails(f)});svg.appendChild(hit);
 const a=viewPositions[f.from],b=viewPositions[f.to],badge=document.createElement('button');badge.className='flowbadge';
 let x=(a.x+b.x)/2,y=(a.y+b.y+CARD_H)/2;if(typeof track.getTotalLength==='function'){const pt=track.getPointAtLength(track.getTotalLength()*.5);x=pt.x;y=pt.y}
 badge.style.left=x+'px';badge.style.top=y+'px';badge.textContent='→ '+fmt(f.count);badge.title='Открыть список ID';badge.addEventListener('click',()=>openFlowDetails(f));badges.appendChild(badge);highlight();renderInspector();
}
function updateRouteStory(f,label){
 const story=$('#routeStory');story.classList.remove('running');
 $('#storyFrom').textContent=f.from+' · '+label(f.from);
 $('#storyTo').textContent=f.to+' · '+label(f.to);
 $('#storyMoved').textContent=fmt(f.count)+' договоров';
 $('#storyFromCount').textContent='Весь блок: '+fmt(analysis.beforeCount[f.from])+' → '+fmt(analysis.afterCount[f.from]);
 $('#storyToCount').textContent='Весь блок: '+fmt(analysis.beforeCount[f.to])+' → '+fmt(analysis.afterCount[f.to]);
 story.style.setProperty('--cycle',(3.6/motionSpeed)+'s');
 if(playing&&!motionReduced()){void story.offsetWidth;story.classList.add('running')}
}
function focusRoute(f){
 const a=viewPositions[f?.from],b=viewPositions[f?.to];if(!a||!b)return;
 const left=Math.min(a.x,b.x)-CARD_W/2-24,right=Math.max(a.x,b.x)+CARD_W/2+24,top=Math.min(a.y,b.y)-24,bottom=Math.max(a.y,b.y)+CARD_H+24;
 const desired=Math.min(1.2,(board.clientWidth-20)/Math.max(1,right-left),(board.clientHeight-20)/Math.max(1,bottom-top));
 setScale(Math.max(.25,Math.min(scale,desired)));
 board.scrollTo({left:Math.max(0,(left+right)*scale/2-board.clientWidth/2),top:Math.max(0,(top+bottom)*scale/2-board.clientHeight/2),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function openRoutes(){
 $('#routesSummary').textContent='По всем направлениям: '+fmt(analysis.cleanMoves)+' однозначных переходов · '+fmt(analysis.newTotal)+' новых ID · '+fmt(analysis.goneTotal)+' выбывших ID. В текущем списке: '+fmt(filteredFlows.length)+' маршрутов, '+fmt(filteredFlows.reduce((s,f)=>s+f.count,0))+' договоров. Показаны только однозначные изменения состава блоков.';
 const list=$('#routesList');list.replaceChildren();const label=id=>current?.labels?.[id]||byId[id]?.t||id;
 filteredFlows.forEach((f,i)=>{const b=document.createElement('button');b.className='flowrow route-option'+(i===flowIndex?' active':'');b.type='button';b.innerHTML='<span><span class="flowlist-title">'+esc(f.from)+' → '+esc(f.to)+'</span><span class="flowlist-sub">'+esc(label(f.from))+' → '+esc(label(f.to))+'</span></span><b>'+fmt(f.count)+'</b>';b.addEventListener('click',()=>{$('#routesDialog').close();setMode('compare');selectFlow(i,true)});list.appendChild(b)});
 $('#routesDialog').showModal();
}
function flowsForBranch(){return analysis?.flows.filter(f=>branch==='all'||branchOf(f.from)===branch||branchOf(f.to)===branch)||[]}
function syncFlows(){filteredFlows=flowsForBranch();flowIndex=Math.max(0,Math.min(filteredFlows.length-1,flowIndex));showFlow()}
function selectFlow(i,focus=true){if(!filteredFlows.length){flowIndex=0;showFlow();return}flowIndex=((i%filteredFlows.length)+filteredFlows.length)%filteredFlows.length;if(display==='compare')selected=filteredFlows[flowIndex].to;showFlow();if(focus&&display==='compare')focusRoute(filteredFlows[flowIndex]);}
function renderInspector(){if(!analysis)return;const n=byId[selected],from=analysis.beforeCount[selected],to=analysis.afterCount[selected],delta=to-from;if(singleMode){const noRule=selected!=='root'&&!current.own?.[selected];$('#inspectorBody').innerHTML=`<div class="selected-block" style="--sel:${colors[n.k]}"><small># ${esc(n.id)}</small><h2>${esc(current.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Нет собственного критерия')}</p></div><div class="sect"><h3>Текущий реестр</h3><h2>${noRule?'—':fmt(to)}</h2><p>${noRule?'Блок не имеет собственного условия или исключения.':'Строк по действующим правилам'}</p></div><div class="sect"><h3>Сравнение</h3><p>Загрузите предыдущий реестр, чтобы увидеть переходы.</p>${rawWarnings?'<p>'+esc(rawWarnings)+'</p>':''}</div>`;attachBlockTools(n);return;}const incoming=analysis.flows.filter(f=>f.to===selected).slice(0,8),outgoing=analysis.flows.filter(f=>f.from===selected).slice(0,8);let h=`<div class="selected-block" style="--sel:${colors[n.k]}"><small>Блок ${esc(n.id)}</small><h2>${esc(current?.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Условия отображаются как ориентир из исходной схемы. Авторитетный расчёт — только в исходном снимке.')}</p></div><div class="inspector-metrics"><div><b>${fmt(from)}</b><small>Было</small></div><div><b>${fmt(to)}</b><small>Стало</small></div><div><b style="color:${delta>=0?'var(--green)':'var(--red)'}">${delta>0?'+':''}${fmt(delta)}</b><small>Изменение</small></div></div>`;
 h+=`<div class="sect"><h3>Изменения состава блока</h3><div class="info">Добавились: <b style="color:var(--green)">${fmt(analysis.blockAdded[selected])}</b><br/>Выбыли: <b style="color:var(--red)">${fmt(analysis.blockRemoved[selected])}</b><br/>Разница показывает изменение численности, а не обязательно переход на следующий этап.</div><button class="btn" data-blockdetails>Посмотреть ID</button></div>`;
 h+=`<div class="sect"><h3>Подтверждённые переходы</h3>`;
 const listed=[...incoming,...outgoing].sort((a,b)=>b.count-a.count).slice(0,12);h+=listed.length?listed.map(f=>`<button class="flowrow ${filteredFlows[flowIndex]?.key===f.key?'active':''}" data-flowkey="${esc(f.key)}"><span><span class="flowlist-title">${esc(f.from)} → ${esc(f.to)}</span><span class="flowlist-sub">${esc(byId[f.from]?.t||f.from)} → ${esc(byId[f.to]?.t||f.to)}</span></span><b>${fmt(f.count)}</b></button>`).join(''):'<div class="empty">Однозначных переходов для блока не выявлено. Возможно, изменился только состав или несколько блоков одновременно.</div>';
 h+=`</div><div class="sect"><h3>Как рассчитано</h3><p>В исходном коде «Брать из блока», исключения и правила И/ИЛИ влияют на расчёт. Эти значения получены из уже рассчитанных наборов. При множественном изменении блоков переход не выдумывается.</p></div>`;
 $('#inspectorBody').innerHTML=h;attachBlockTools(n);$('#inspectorBody').querySelector('[data-blockdetails]')?.addEventListener('click',()=>openBlockDetails(selected));$('#inspectorBody').querySelectorAll('[data-flowkey]').forEach(el=>el.addEventListener('click',()=>{const f=analysis.flows.find(x=>x.key===el.dataset.flowkey);if(!f)return;display='compare';setModeButtons();renderDiagram();let ix=filteredFlows.findIndex(x=>x.key===f.key);if(ix<0){branch='all';setBranchButtons();syncFlows();ix=filteredFlows.findIndex(x=>x.key===f.key)}selectFlow(ix);$('#inspector').classList.remove('open')}));}
function setModeButtons(){$$('[data-mode]').forEach(b=>{b.classList.toggle('on',b.dataset.mode===display);b.setAttribute('aria-pressed',String(b.dataset.mode===display))});$$('[data-workspace]').forEach(b=>b.classList.toggle('active',b.dataset.workspace===(display==='compare'?'changes':'funnel')));document.body.dataset.mode=display;}
function setBranchButtons(){$$('[data-branch]').forEach(b=>b.classList.toggle('active',b.dataset.branch===branch));}
function setMode(m){if(singleMode&&m==='compare'){setStatus('Для сравнения требуется предыдущий реестр');return}display=m;setModeButtons();renderDiagram(true);if(m==='compare'&&filteredFlows.length)selectFlow(flowIndex,true);saveViewSoon()}
function setStatus(s){$('#status').textContent=s}
function openRows(title,note,rows,getAll){$('#detailsTitle').textContent=title;$('#detailsNote').textContent=note;const body=$('#detailsRows');body.replaceChildren();const arr=rows.slice(0,200);arr.forEach((r,i)=>{const tr=document.createElement('tr');for(const v of [i+1,r.id,r.from,r.to,r.kind]){const td=document.createElement('td');td.textContent=v;tr.appendChild(td)}body.appendChild(tr)});window.__downloadRows=getAll||(()=>rows);$('#detailsDialog').showModal();}
function openFlowDetails(f){openRows(`Переход ${f.from} → ${f.to} · ${fmt(f.count)} ID`,'Обнаружена однозначная смена принадлежности к двум блокам. Это не обязательно физический «переход по стрелке» в рабочем процессе.',f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})),()=>f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})));}
function openBlockDetails(code){const add=analysis.blockAddedIds[code].map(id=>({id,from:'—',to:code,kind:'Добавился в блок'})),rem=analysis.blockRemovedIds[code].map(id=>({id,from:code,to:'—',kind:'Выбыл из блока'}));openRows(`Изменения блока ${code}`,'Первые 200 записей показаны на экране. CSV содержит весь список однозначно сопоставленных ID; дубли исключены из сравнения.',add.concat(rem));}
function csvSafe(v){const raw=String(v??''),s=/^[=+@-]/.test(raw)&&!/^[-+]?\d+(\.\d+)?$/.test(raw)?"'"+raw:raw;return/[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function downloadRows(rows,name){const head=['ID договора','Блок до','Блок после','Категория','Сумма долга + ГП','Дата смерти','Цессия'];const lines=[head,...rows.map(r=>[r.id,r.from,r.to,r.kind,r.amount??'',r.death??'',r.cession??''])].map(row=>row.map(csvSafe).join(';')).join('\r\n');const b=new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
function exportAll(){const rows=analysis.flows.flatMap(f=>f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})));for(const group of [analysis.ambiguousRows,analysis.ruleRows,analysis.addedRows,analysis.goneRows])for(const row of group)rows.push(row);downloadRows(rows,'NEON_FLOW_изменения.csv');}
function parseCSV(text){const delimiter=text.split(/\r?\n/,1)[0].includes(';')?';':',';const rows=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){v+='"';i++}else if(c==='"')q=false;else v+=c}else if(c==='"')q=true;else if(c===delimiter){row.push(v);v=''}else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>x!==''))rows.push(row);row=[];v=''}else v+=c}if(v||row.length){row.push(v);rows.push(row)}return rows;}
function excelCol(c){let n=0;for(const x of c)n=n*26+x.charCodeAt(0)-64;return n-1}
async function parseXlsx(file){if(typeof JSZip==='undefined')throw Error('Не найдена библиотека JSZip');if(file.size>35*1024*1024)throw Error('Для больших Excel лучше использовать data.bin из оригинального сайта: этот тестовый парсер ограничен 35 МБ.');const zip=await JSZip.loadAsync(file);const get=async name=>{const f=zip.file(name);return f?await f.async('string'):null};const ss=await get('xl/sharedStrings.xml');const parser=new DOMParser(),shared=[];if(ss){const doc=parser.parseFromString(ss,'application/xml');for(const si of [...doc.getElementsByTagName('si')]){shared.push([...si.getElementsByTagName('t')].map(x=>x.textContent).join(''))}}
 const workbook=await get('xl/workbook.xml'),rels=await get('xl/_rels/workbook.xml.rels');if(!workbook||!rels)throw Error('Файл XLSX без структуры workbook');const wd=parser.parseFromString(workbook,'application/xml'),rd=parser.parseFromString(rels,'application/xml');const relMap={};for(const r of [...rd.getElementsByTagName('Relationship')])relMap[r.getAttribute('Id')]=r.getAttribute('Target');const sheets=[...wd.getElementsByTagName('sheet')];const pick=sheets.find(x=>/реестр/i.test(x.getAttribute('name')||''))||sheets[0];if(!pick)throw Error('В книге нет листов');const rid=pick.getAttribute('r:id')||pick.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let target=relMap[rid]||'';target=target.replace(/^\//,'').replace(/^xl\//,'');target='xl/'+target.replace(/^\.\.\//,'');const xml=await get(target);if(!xml)throw Error('Не найден лист '+target);const doc=parser.parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('Ошибка разбора XML XLSX');const rows=[];for(const row of [...doc.getElementsByTagName('row')]){let a=[];for(const c of [...row.getElementsByTagName('c')]){const ref=c.getAttribute('r'),col=ref?excelCol((ref.match(/^[A-Z]+/)||[''])[0]):a.length;const t=c.getAttribute('t');const v=c.getElementsByTagName('v')[0];let val=v?.textContent??'';if(t==='s')val=shared[Number(val)]??'';if(t==='inlineStr')val=[...c.getElementsByTagName('t')].map(n=>n.textContent).join('');a[col]=val}if(a.length)rows.push(a)}return rows;}
function parseDateDays(v){if(v==null||v==='')return null;const str=String(v).trim();if(/^\d+(\.\d+)?$/.test(str)){const n=Number(str);if(n>10000&&n<200000)return Math.round(n+Date.UTC(1899,11,30)/86400000);return null}const ru=str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);const d=ru?new Date(Date.UTC(+ru[3],+ru[2]-1,+ru[1])):new Date(str);return Number.isFinite(d.getTime())?Math.floor(d.getTime()/86400000):null}
function snapshotFromRows(rows,fileName){const head=rows.findIndex(r=>r&&r.some(x=>/^(блок|код блока)$/i.test(String(x||'').trim())));if(head<0)throw Error('Нужна таблица с колонкой «Блок» или «Код блока». Сырой реестр нельзя достоверно пересчитать без исходного движка правил.');const hdr=rows[head].map(x=>String(x??'').trim().toLowerCase().replace(/[.\s]+/g,' '));const find=(names)=>hdr.findIndex(x=>names.some(v=>x===v||x.startsWith(v+' ')));const cCode=find(['код блока','блок']),cId=find(['id договора внутренний','внутренний id договора','id договора','номер договора']),cPath=find(['путь']),cAmt=find(['сумма долга + гп остаток','сумма долга']),cDate=find(['дата смерти']);if(cId<0)throw Error('Не найдена колонка ID договора.');const seen=new Map(),missed=new Set();const active={};for(const n of nodes)active[n.id]=new Set();const ids=[],amt=[],dd=[];let skipped=0;
 const titleMatch=Object.fromEntries(nodes.map(n=>[n.id,(n.t||'').trim().toLowerCase()]));
 for(let ri=head+1;ri<rows.length;ri++){const row=rows[ri];if(!row)continue;const id=cleanID(row[cId]);if(!id)continue;const literal=String(row[cCode]??'').trim();let code=nodeMap.has(literal)?literal:null;if(!code){const m=literal.match(/\(([A-Za-z]\w*)\)\s*$/);if(m&&nodeMap.has(m[1]))code=m[1]}
 if(!code){const candidates=nodes.filter(n=>titleMatch[n.id]===literal.toLowerCase());if(candidates.length===1)code=candidates[0].id;else if(candidates.length>1&&cPath>=0){const path=String(row[cPath]??'').toLowerCase();const matches=candidates.filter(n=>{let p=n,parts=[];while(p&&parts.length<12){parts.push(p.t.toLowerCase());p=byId[p.p]}return parts.slice(1).some(t=>path.includes(t))});if(matches.length===1)code=matches[0].id}}
 if(!code){skipped++;missed.add(literal);continue}let i=seen.get(id);if(i==null){i=ids.length;seen.set(id,i);ids.push(id);amt.push(cAmt>=0?(String(row[cAmt]??'').trim()===''?null:(Number(String(row[cAmt]).replace(/\s/g,'').replace(',','.'))||0)):null);dd.push(cDate>=0?parseDateDays(row[cDate]):null)}active[code].add(i)}
 if(!ids.length)throw Error('Не удалось определить ни одного блока. Используйте код блока (например A1s), название с кодом или data.bin. Пропущенные: '+[...missed].slice(0,3).join(', '));
 const n=ids.length;for(let i=0;i<n;i++)active.root.add(i);const sets={},map={},own={},labels={},sig={};for(const nd of nodes){const bits=new Uint8Array(Math.ceil(n/8));for(const i of active[nd.id])bits[i>>3]|=1<<(i&7);sets[nd.id]=bytesToBase64(bits);map[nd.id]=nd.id;own[nd.id]=active[nd.id].size?1:0;labels[nd.id]=nd.t;sig[nd.id]='export-'+nd.id}
 return{v:1,file:fileName,n,ids,amt:cAmt>=0?amt:null,dd:cDate>=0?dd:null,sets,map,own,labels,sig,at:new Date().toISOString(),warning:skipped?`Не сопоставлено ${fmt(skipped)} строк с блоками: ${[...missed].slice(0,5).join(', ')}`:''};}
async function readInput(file){const lower=file.name.toLowerCase();let raw;if(lower.endsWith('.bin')){if(typeof DecompressionStream==='undefined')throw Error('Браузер не поддерживает распаковку gzip');const bytes=await file.arrayBuffer();const text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();raw=JSON.parse(text)}else if(lower.endsWith('.json'))raw=JSON.parse(await file.text());else if(lower.endsWith('.csv'))raw=snapshotFromRows(parseCSV((await file.text()).replace(/^\ufeff/,'')),file.name);else if(lower.endsWith('.xlsx'))raw=snapshotFromRows(await parseXlsx(file),file.name);else throw Error('Поддерживаются .bin, .json, .csv, .xlsx');
 if(validSnap(raw))return{snapshot:raw,previous:validSnap(raw.previous)?raw.previous:null};if(validSnap(raw.current))return{snapshot:raw.current,previous:validSnap(raw.previous)?raw.previous:null};throw Error('Неверная структура публикации: нужны ids, map, sets');}
let imported={old:null,new:null};async function loadChoice(file,which){const textEl=$(which==='old'?'#priorInfo':'#currentInfo');const loading=$('#loadInfo');loading.textContent='Чтение: '+file.name+'…';$('#applyFiles').disabled=true;try{const result=await readInput(file);imported[which]=result;textEl.textContent=`✓ ${file.name} · ${fmt(result.snapshot.n)} строк${result.previous?' · есть предыдущая публикация':''}${result.snapshot.warning?' · '+result.snapshot.warning:''}`;loading.textContent='Файл обработан локально.';$('#applyFiles').disabled=!(imported.new||imported.old)}catch(e){imported[which]=null;textEl.textContent='Ошибка: '+e.message;loading.textContent='Данные не изменены';$('#applyFiles').disabled=!(imported.new||imported.old)}}
async function applyImports(){try{const cur=imported.new?.snapshot||imported.old?.snapshot;const prev=imported.old&&imported.new?imported.old.snapshot:imported.new?.previous||imported.old?.previous;if(!cur)throw Error('Выберите текущий снимок.');acceptSnapshots(cur,prev,'Загруженные снимки');$('#uploadDialog').close();}catch(e){$('#loadInfo').textContent='Ошибка сравнения: '+e.message}}
function recompute(reset=false){if(!previous||!current)return;const start=performance.now();maskCache.clear();distributionCache.clear();currentStats=W.allStats(current,masksFor(current),nodeIds);previousStats=previous===current?currentStats:W.allStats(previous,masksFor(previous),nodeIds);analysis=singleMode?emptySingleAnalysis(current):analyze(previous,current);if(reset)flowIndex=0;syncFlows();renderDiagram(reset);if(reset&&display==='compare'&&filteredFlows.length)selectFlow(flowIndex,true);renderInspector();updateDataSummary();if(current.empty){setStatus('Загрузите реестр для начала работы.');return}if(singleMode){setStatus('Текущий реестр рассчитан локально · '+fmt(current.n)+' строк · '+(rawWarnings?'Предупреждения: '+rawWarnings:'для сравнения загрузите предыдущий реестр'));return;}setStatus(`${current.demo?'Демо':'Реальные наборы'} · ${fmt(analysis.cleanMoves)} однозначных изменений · ${fmt(analysis.ambiguous)} неоднозначных · ${fmt(analysis.ruleAffected)} затронуты правилами · дублей ID исключено ${fmt(analysis.skipped)} · обработано за ${((performance.now()-start)/1000).toFixed(1)} с`)}
let timer=null;function turnDemo(){singleMode=false;rawWarnings='';playing=false;setSchema();const pair=makeDemo();previous=prepareSnapshot(pair[0]);current=prepareSnapshot(pair[1]);$('#welcome').hidden=true;$('#minAmt').value='';$('#deathFilter').value='all';cessionSelected.clear();restoreLayout();syncCompareControls();$('#sourceLabel').textContent='Демо · условные данные';display='vertical';branch='all';collapsed=false;$('#branchMobile').value='all';setBranchButtons();setModeButtons();recompute(true)}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
function chooseBranch(value){branch=value;saveViewSoon();$('#branchMobile').value=value;setBranchButtons();flowIndex=0;syncFlows();highlight();if(display==='compare'&&filteredFlows.length){selectFlow(0,true);return}const p=viewPositions[value==='all'?'root':value];if(p)board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,(p.y-22)*scale),behavior:'smooth'});}
$$('[data-branch]').forEach(b=>b.addEventListener('click',()=>chooseBranch(b.dataset.branch)));$('#branchMobile').addEventListener('change',e=>chooseBranch(e.target.value));
$$('[data-action=compare]').forEach(b=>b.addEventListener('click',()=>setMode('compare')));
$$('[data-action=ambiguous]').forEach(b=>b.addEventListener('click',()=>openRows('Сложные и неоднозначные изменения',`Неоднозначных: ${fmt(analysis.ambiguous)} · правила: ${fmt(analysis.ruleAffected)} · фильтр: ${fmt(analysis.filterChanged)}`,[...analysis.ambiguousRows,...analysis.ruleRows])));
$$('[data-action=flows]').forEach(b=>b.addEventListener('click',()=>{setMode('compare');if(filteredFlows.length)openFlowDetails(filteredFlows[flowIndex]);else openRows('Неоднозначные случаи',`Неоднозначных: ${fmt(analysis.ambiguous)}, изменения правил: ${fmt(analysis.ruleAffected)}`,[...analysis.ambiguousRows,...analysis.ruleRows])}));
$('#zoomIn').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(scale*1.15)});$('#zoomOut').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(scale/1.15)});$('#zoomFit').addEventListener('click',()=>{pauseForManualNavigation();fitZoom()});$('#zoomAll').addEventListener('click',()=>{pauseForManualNavigation();fitAll()});$('#zoomReset').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(1)});bindCanvasNavigation();$('#search').addEventListener('input',highlight);$('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim().toLowerCase();if(!q)return;const n=nodes.find(n=>(n.id+' '+n.t).toLowerCase().includes(q));if(n){pauseForManualNavigation();const p=viewPositions[n.id];if(p)board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,p.y*scale-board.clientHeight/2),behavior:'smooth'});chooseNode(n.id,false)}}});
// Filters are committed together in the filter dialog.
$('#playBtn').addEventListener('click',()=>{playing=!playing;showFlow()});$('#liveLinksBtn').addEventListener('click',()=>{liveLinks=!liveLinks;highlight()});$('#motionSpeed').addEventListener('change',e=>{motionSpeed=Math.max(.7,Math.min(2,Number(e.target.value)||1));showFlow()});$('#replayRoute').addEventListener('click',()=>{playing=true;showFlow();focusRoute(filteredFlows[flowIndex])});$('#routesBtn').addEventListener('click',openRoutes);$('#inspectToggle').addEventListener('click',()=>$('#inspector').classList.toggle('open'));
$('#prevBtn').addEventListener('click',()=>selectFlow(flowIndex-1));$('#nextBtn').addEventListener('click',()=>selectFlow(flowIndex+1));$('#flowSlider').addEventListener('input',e=>selectFlow(Number(e.target.value),false));
$('#detailBtn').addEventListener('click',()=>{const f=filteredFlows[flowIndex];if(f)openFlowDetails(f);else openRows('Неоднозначные изменения',`Неоднозначных: ${fmt(analysis.ambiguous)}`,analysis.ambiguousRows)});$('#exportBtn').addEventListener('click',exportAll);$('#detailsCsv').addEventListener('click',()=>downloadRows((window.__downloadRows||(()=>[]))(),'NEON_FLOW_детали.csv'));$('#closeInspector').addEventListener('click',()=>$('#inspector').classList.remove('open'));
$('#loadBtn').addEventListener('click',()=>{$('#dataDialog').close();$('#uploadDialog').showModal()});$('#choosePrior').addEventListener('click',()=>$('#priorFile').click());$('#chooseCurrent').addEventListener('click',()=>$('#currentFile').click());$('#priorFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'old')});$('#currentFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'new')});$('#applyFiles').addEventListener('click',applyImports);$('#demoBtn').addEventListener('click',()=>{$('#dataDialog').close();turnDemo()});
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
window.addEventListener('keydown',e=>{if(e.key==='Escape')$('#inspector').classList.remove('open');if(e.target.closest('input,select,textarea,dialog,button'))return;if(display==='compare'&&!e.shiftKey&&e.key==='ArrowRight'){selectFlow(flowIndex+1);return}if(display==='compare'&&!e.shiftKey&&e.key==='ArrowLeft'){selectFlow(flowIndex-1);return}const steps={ArrowLeft:[-160,0],ArrowRight:[160,0],ArrowUp:[0,-160],ArrowDown:[0,160]};if(steps[e.key]){e.preventDefault();pauseForManualNavigation();board.scrollLeft+=steps[e.key][0];board.scrollTop+=steps[e.key][1]}});
let playInterval=window.setInterval(()=>{if(!playing||motionReduced()||draggingView||document.hidden||!analysis||!filteredFlows.length)return;if(display==='compare'&&!document.querySelector('dialog[open]')&&performance.now()-routeStarted>=5500/motionSpeed)selectFlow(flowIndex+1,true)},250);
window.addEventListener('resize',()=>{if(board.clientWidth&&board.clientHeight)setScale(scale)});if(typeof ResizeObserver!=='undefined'){const boardResize=new ResizeObserver(()=>{if(board.clientWidth&&board.clientHeight)setScale(scale)});boardResize.observe(board)}

let rawActive=false,rawAbort=null,rawCancelled=false;
const rawDialog=$('#rawDialog'),rawRun=$('#rawRun'),rawInfo=$('#rawInfo');
function refreshRaw(){rawRun.disabled=rawActive||!$('#rawRules').files[0]||!$('#rawCurrent').files[0];$('#rawCancel').hidden=!rawActive;$('#rawClose').disabled=rawActive}
function calculateRaw(rules,registry){
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.title='Изолированный локальный вычислитель';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:1200px;height:800px;visibility:hidden;pointer-events:none;';
  const request='raw-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  let ended=false,timeout;
  function cleanup(){if(ended)return false;ended=true;clearTimeout(timeout);window.removeEventListener('message',receive);frame.remove();rawAbort=null;return true}
  function fail(message){if(cleanup())reject(Error(message))}
  function receive(e){
   if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.request!==request)return;
   const m=e.data;
   if(m.type==='neon-raw-progress')rawInfo.textContent=registry.name+' · '+m.message;
   else if(m.type==='neon-raw-error')fail(m.message);
   else if(m.type==='neon-raw-result'){if(cleanup())resolve(m.snapshot)}
  }
  rawAbort=()=>fail('Расчёт отменён.');
  window.addEventListener('message',receive);
  frame.onload=()=>{if(!ended)frame.contentWindow.postMessage({type:'neon-calculate-raw',request,rules,registry,reasons:$('#rawReasons').checked},location.origin)};
  frame.onerror=()=>fail('Не удалось загрузить локальный движок.');
  timeout=setTimeout(()=>fail('Превышено время расчёта. Проверьте файл и ресурсы браузера.'),20*60*1000);
  frame.src='engine.html?v=4-workspace';document.body.appendChild(frame);
 });
}
$('#rawLoadBtn').addEventListener('click',()=>{$('#dataDialog').close();rawDialog.showModal();refreshRaw()});
for(const id of ['rawRules','rawCurrent','rawPrevious'])$('#'+id).addEventListener('change',refreshRaw);
$('#rawClose').addEventListener('click',()=>{if(!rawActive)rawDialog.close()});
rawDialog.addEventListener('cancel',e=>{if(rawActive)e.preventDefault()});
$('#rawCancel').addEventListener('click',()=>{rawCancelled=true;rawAbort?.()});
rawRun.addEventListener('click',async()=>{
 if(rawActive)return;
 const rules=$('#rawRules').files[0],cur=$('#rawCurrent').files[0],prev=$('#rawPrevious').files[0];
 if(!rules||!cur)return;
 rawActive=true;rawCancelled=false;refreshRaw();
 try{
  let a=null;
  if(prev){rawInfo.textContent='Загружаю предыдущий реестр…';a=await calculateRaw(rules,prev)}
  if(rawCancelled)throw Error('Расчёт отменён.');
  rawInfo.textContent='Загружаю текущий реестр…';
  const b=await calculateRaw(rules,cur);
  if(rawCancelled)throw Error('Расчёт отменён.');
  acceptSnapshots(b,a,'Excel · '+rules.name);
  rawDialog.close();
 }catch(e){rawInfo.textContent='Ошибка: '+e.message+' · Данные не изменены.'}
 finally{rawActive=false;refreshRaw()}
});


// Workspace controller: local history, block inspection, presentation and settings.
function realData(){return !!current&&!current.demo&&!current.empty}
function updateDataSummary(){
 const msg=current.empty?'Реестр не загружен':(current.demo?'Демо · ':'')+current.file+' · '+fmt(current.n)+' строк'+(singleMode?'':' · сравнение с '+previous.file);
 $('#dataSummary').textContent=msg+(current.empty?'':' · В выборке: '+fmt(analysis.afterCount.root)+' строк, умершие: '+fmt(analysis.afterCount.dead))+(!singleMode?' · Переходы: '+fmt(analysis.cleanMoves)+' · Новые ID: '+fmt(analysis.newTotal)+' · Выбыли: '+fmt(analysis.goneTotal):'')+(rawWarnings?' · '+rawWarnings:'');
 $('#rulesSummary').textContent=current.rulesName?'Активная таблица: '+current.rulesName:'Правила из исходной структуры / снимка.';
 for(const id of ['saveSnapBtn','downloadSnapBtn'])$('#'+id).disabled=!realData();
 for(const id of ['idCheckBtn','reportBtn','filtersBtn','inspectToggle'])$('#'+id).disabled=!!current.empty;
 $('#collapseBtn').disabled=branch==='all';
 $('#filterInfo').textContent='Количество строк во всех блоках, включая дубли. Сравнение маршрутов — по уникальным ID.';
 const count=Number($('#minAmt').value)>0?1:0;$('#filtersBtn').textContent='Фильтры'+(count+($('#deathFilter').value!=='all'?1:0)+cessionSelected.size?' · '+(count+($('#deathFilter').value!=='all'?1:0)+cessionSelected.size):'');
}
function paintCessions(){
 const box=$('#cessionOptions'),q=W.norm($('#cessionSearch').value),labels=new Map();
 if(current&&previous&&[current,previous].every(s=>Array.isArray(s.cessions))){for(const snap of new Set([current,previous]))for(const name of snap.cessions){const k=W.norm(name);if(!labels.has(k))labels.set(k,name||'Не указано')}}
 for(const key of cessionSelected)if(!labels.has(key))cessionSelected.delete(key);
 box.replaceChildren();if(!labels.size){box.textContent='В этом наборе цессии недоступны.';return}
 for(const [k,label] of [...labels].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'ru'))){if(q&&!W.norm(label).includes(q))continue;const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=cessionSelected.has(k);input.addEventListener('change',()=>{if(input.checked)cessionSelected.add(k);else cessionSelected.delete(k)});row.appendChild(input);row.appendChild(document.createTextNode(label));box.appendChild(row)}
}
function blockRowsFor(code,s=current){
 if(code!=='root'&&!s.own?.[code]&&!s.demo)return [];const out=[],mask=code==='root'?masksFor(s).root:masksFor(s).normal;
 for(let i=0;i<s.n;i++)if(mask[i]&&W.has(s,code,i))out.push({id:s.ids[i],from:'—',to:code,kind:'В блоке',amount:s.amt?.[i]??'',death:s.dd?.[i]==null?'':new Date(s.dd[i]*86400000).toISOString().slice(0,10),cession:s.cessions?.[i]??''});
 return out;
}
function rowExport(rows,name){W.exportXlsx([{name:'Договоры',rows:[['ID договора','Блок','Сумма долга + ГП','Дата смерти','Цессия','Категория'],...rows.map(r=>[r.id,r.to,r.amount??'',r.death??'',r.cession??'',r.kind])]}],name).catch(e=>setStatus('Ошибка Excel: '+e.message))}
function subsetRows(indexes,code,kind){return indexes.map(i=>({id:current.ids[i],from:code,to:'—',kind,amount:current.amt?.[i]??'',death:current.dd?.[i]==null?'':new Date(current.dd[i]*86400000).toISOString().slice(0,10),cession:current.cessions?.[i]??''}))}
function attachBlockTools(n){
 const root=$('#inspectorBody'),section=document.createElement('div');section.className='sect block-tools';const stats=currentStats[n.id]||{count:0,sum:0,known:0};
 const p=byId[n.p],ps=p?currentStats[p.id]:null,share=ps?.count&&!stats.noRule?stats.count/ps.count*100:null,prev=previousStats[n.id],debtDelta=!singleMode&&stats.known&&prev?.known?stats.sum-prev.sum:null;
 section.innerHTML='<h3>Состав блока</h3><div class="info">Сумма долга + ГП: <b>'+ (stats.known?fmt(Math.round(stats.sum))+' ₽':'—')+'</b><br>Договоров с суммой: '+fmt(stats.known)+' из '+fmt(stats.count)+(debtDelta!==null?'<br>Изменение суммы: '+(debtDelta>0?'+':'')+fmt(Math.round(debtDelta))+' ₽':'')+(share!==null?'<br>Отношение к числу строк родителя: '+share.toLocaleString('ru-RU',{maximumFractionDigits:1})+'%':'')+'</div><button class="btn" data-members>Список договоров</button><button class="btn" data-export-block>Выгрузить Excel по блоку</button><button class="btn" data-distribution>Куда уходят должники</button><button class="btn" data-block-history>Динамика блока</button>';
 root.appendChild(section);
 section.querySelector('[data-members]').addEventListener('click',()=>openRows(n.t+' · договоры','Показано до 200 строк; экспорт CSV содержит весь список.',blockRowsFor(n.id)));
 section.querySelector('[data-export-block]').addEventListener('click',()=>rowExport(blockRowsFor(n.id),'Блок_'+n.id+'.xlsx'));
 section.querySelector('[data-distribution]').addEventListener('click',()=>showDistribution(n));
 section.querySelector('[data-block-history]').addEventListener('click',openHistory);
}
function showDistribution(n){
 let section=$('#distributionBox');if(section)section.remove();
 section=document.createElement('div');section.id='distributionBox';section.className='sect';$('#inspectorBody').appendChild(section);
 const kids=nodes.filter(k=>(k.parents||[k.p]).includes(n.id)&&(k.bases||k.parents||[k.p]).includes(n.id));
 if(!kids.length){section.textContent='Нет дочерних блоков, рассчитываемых из выбранного.';return}
 const m=masksFor(current);let d=distributionCache.get(n.id);if(!d){d=W.distribution(current,n.id,kids,m.normal,m.root,base64ToBytes);distributionCache.set(n.id,d)}
 const h=document.createElement('h3');h.textContent='Куда уходят должники · '+fmt(d.total);section.appendChild(h);const note=document.createElement('p');note.textContent='Распределение по правилам на дату текущего снимка; блоки могут пересекаться. Нажмите направление для списка ID.';section.appendChild(note);
 const make=(title,count,rows,kind,to)=>{const b=document.createElement('button');b.className='distribution-row';b.innerHTML='<span>'+esc(title)+'</span><b>'+fmt(count)+'</b><i style="--fraction:'+Math.min(100,d.total?100*count/d.total:0)+'%"></i>';b.addEventListener('click',()=>{const records=subsetRows(rows,n.id,kind);if(to)for(const r of records)r.to=to;openRows(title,'Пересечение множеств текущего реестра. Это не изменение между датами.',records)});section.appendChild(b)};
 for(const k of d.children)make(k.name,k.count,k.rows,'Попал в дочерний блок',k.id);
 make('Не попали никуда',d.lost.length,d.lost,'Не прошёл ни в один блок');make('В нескольких блоках',d.multi.length,d.multi,'Пересечение');if(d.hidden.length)make('Скрыты фильтром даты',d.hidden.length,d.hidden,'Скрыт фильтром');
 if(d.lost.length){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Причины непопадания';details.appendChild(summary);for(const [reason,rows] of d.groups){const b=document.createElement('button');b.className='flowrow';b.innerHTML='<span>'+esc(reason)+'</span><b>'+fmt(rows.length)+'</b>';b.addEventListener('click',()=>openRows(reason,'Причина рассчитана исходным движком, если сохранена в снимке.',subsetRows(rows,n.id,reason)));details.appendChild(b)}section.appendChild(details)}
 section.scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function openHistory(){
 if($('#dataDialog').open)$('#dataDialog').close();
 if(!$('#historyDialog').open)$('#historyDialog').showModal();const status=$('#historyStatus');status.textContent='Читаю локальную историю…';
 try{const entries=(await W.list()).sort((a,b)=>String(a.at).localeCompare(String(b.at))),list=$('#historyList'),before=$('#historyBefore'),after=$('#historyAfter');list.replaceChildren();before.replaceChildren();after.replaceChildren();
 const empty=document.createElement('option');empty.value='';empty.textContent='Без сравнения';before.appendChild(empty);
 for(const e of entries){const label=new Date(e.at).toLocaleString('ru-RU')+' · '+e.file;
 for(const el of [before,after]){const o=document.createElement('option');o.value=e.id;o.textContent=label;el.appendChild(o)}
 const row=document.createElement('div');row.className='history-row';const info=document.createElement('div');info.textContent=label+' · '+fmt(e.n)+' строк';const del=document.createElement('button');del.className='btn';del.textContent='Удалить';del.addEventListener('click',async()=>{if(confirm('Удалить локальный снимок?')){await W.remove(e.id);openHistory()}});row.appendChild(info);row.appendChild(del);list.appendChild(row)}
 after.value=entries.at(-1)?.id||'';before.value=entries.at(-2)?.id||'';$('#historyOpen').disabled=!entries.length;status.textContent=entries.length?'Снимков: '+entries.length:'Нет сохранённых снимков. Используйте «Сохранить снимок» в разделе «Данные».';
 drawHistory(entries);
 }catch(e){status.textContent='Ошибка локального хранилища: '+e.message}
}
function drawHistory(entries){
 const chart=$('#historyChart');chart.replaceChildren();const title=byId[selected]?.t||selected;$('#historyChartTitle').textContent='Динамика · '+title;
 const vals=entries.filter(e=>Number.isFinite(e.counts?.[selected])).map(e=>({at:e.at,n:e.counts[selected]}));if(!vals.length){chart.textContent='Нет данных для выбранного блока.';return}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 160');svg.setAttribute('aria-label','Динамика количества строк');const min=Math.min(...vals.map(x=>x.n)),max=Math.max(...vals.map(x=>x.n)),pts=vals.map((v,i)=>({x:30+(vals.length===1?270:i*540/(vals.length-1)),y:120-(v.n-min)/Math.max(1,max-min)*86,v}));
 const line=document.createElementNS(ns,'polyline');line.setAttribute('points',pts.map(p=>p.x+','+p.y).join(' '));line.setAttribute('class','history-line');svg.appendChild(line);
 for(const p of pts){const c=document.createElementNS(ns,'circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r','4');c.setAttribute('class','history-dot');const t=document.createElementNS(ns,'title');t.textContent=new Date(p.v.at).toLocaleString('ru-RU')+': '+fmt(p.v.n);c.appendChild(t);svg.appendChild(c)}
 chart.appendChild(svg);const text=document.createElement('p');text.textContent='Первый: '+fmt(vals[0].n)+' · Последний: '+fmt(vals.at(-1).n)+' · Изменение: '+fmt(vals.at(-1).n-vals[0].n);chart.appendChild(text);
}
async function report(){
 if(!current||current.empty)return;const button=$('#reportBtn');button.disabled=true;
 try{
 const summary=[['Код','Блок','Было, строк','Стало, строк','Изменение, строк','Долг было','Долг стало','Сумма известна, строк']];
 for(const n of nodes){const a=previousStats[n.id]||{},b=currentStats[n.id]||{};summary.push([n.id,n.t,singleMode||a.noRule?'':a.count||0,b.noRule?'Нет правил':b.count||0,singleMode||a.noRule||b.noRule?'':(b.count||0)-(a.count||0),singleMode?'':a.known?a.sum:'',b.known?b.sum:'',b.known||0])}
 const meta=[['Параметр','Значение'],['Текущий',current.file],['Предыдущий',singleMode?'—':previous.file],['Демо',current.demo?'Да':'Нет'],['Фильтр долга',Number($('#minAmt').value)||0],['Дата смерти',$('#deathFilter').value],['Цессии',[...cessionSelected].join('; ')],['Дубли исключены из сравнения',analysis.skipped],['Предупреждения',rawWarnings||'—']];
 const sheets=[{name:'Блоки',rows:summary},{name:'Параметры',rows:meta}];
 if(!singleMode){const changes=[['ID договора','Откуда','Куда','Категория']];for(const f of analysis.flows)for(const id of f.ids)changes.push([id,f.from,f.to,'Однозначная смена блока']);for(const list of [analysis.ambiguousRows,analysis.ruleRows,analysis.addedRows,analysis.goneRows])for(const r of list)changes.push([r.id,r.from,r.to,r.kind]);sheets.push({name:'Изменения',rows:changes})}
 await W.exportXlsx(sheets,'NEON_FLOW_отчёт.xlsx');setStatus('Отчёт Excel сформирован');
 }catch(e){setStatus('Ошибка отчёта: '+e.message)}finally{button.disabled=false}
}
function drawMinimap(){
 const el=$('#minimap');if(!el)return;el.replaceChildren();if(!Object.keys(viewPositions).length)return;
 const sz=worldSize,ns='http://www.w3.org/2000/svg';el.setAttribute('viewBox','0 0 '+sz.w+' '+sz.h);
 for(const [id,p] of Object.entries(viewPositions)){const r=document.createElementNS(ns,'rect');r.setAttribute('x',p.x-CARD_W/2);r.setAttribute('y',p.y);r.setAttribute('width',CARD_W);r.setAttribute('height',CARD_H);r.setAttribute('rx','16');r.setAttribute('class','mini-node');el.appendChild(r)}
 const v=document.createElementNS(ns,'rect');v.id='minimapView';v.setAttribute('class','mini-view');el.appendChild(v);updateMinimapViewport();
}
function updateMinimapViewport(){const v=$('#minimapView');if(!v)return;v.setAttribute('x',String(board.scrollLeft/scale));v.setAttribute('y',String(board.scrollTop/scale));v.setAttribute('width',String(board.clientWidth/scale));v.setAttribute('height',String(board.clientHeight/scale))}
function restoreLayout(){layoutKey='neon-layout-v4:'+String(current?.rulesName||'default');try{localLayout=JSON.parse(localStorage.getItem(layoutKey)||'{}')}catch{localLayout={}}}
function startCardMove(e,id){
 if(!viewEdit||display==='compare'||e.button!==0)return;e.stopPropagation();e.preventDefault();const p=viewPositions[id];if(!p)return;layoutDrag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,px:p.x,py:p.y};try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
}
window.addEventListener('pointermove',e=>{if(!layoutDrag||layoutDrag.pointer!==e.pointerId)return;const m=layoutDrag,p={x:Math.max(CARD_W/2+BOARD_MARGIN,m.px+(e.clientX-m.x)/scale),y:Math.max(BOARD_MARGIN,m.py+(e.clientY-m.y)/scale)};viewPositions[m.id]=p;const next=calcSize(viewPositions);if(next.w>worldSize.w||next.h>worldSize.h){worldSize={w:Math.max(next.w,worldSize.w),h:Math.max(next.h,worldSize.h)};canvas.style.width=worldSize.w+'px';canvas.style.height=worldSize.h+'px';svg.setAttribute('width',worldSize.w);svg.setAttribute('height',worldSize.h);svg.setAttribute('viewBox','0 0 '+worldSize.w+' '+worldSize.h);setScale(scale)}const el=$$('.node').find(n=>n.dataset.id===m.id);if(el){el.style.left=p.x+'px';el.style.top=p.y+'px'}svg.querySelectorAll('.direction-defs,.base-edge').forEach(x=>x.remove());addStructuralEdges();highlight()});
function finishCardMove(e){if(!layoutDrag||layoutDrag.pointer!==e.pointerId)return;const id=layoutDrag.id;layoutDrag=null;(localLayout[display]||={})[id]=viewPositions[id];try{localStorage.setItem(layoutKey,JSON.stringify(localLayout))}catch{}renderDiagram(false)}window.addEventListener('pointerup',finishCardMove);window.addEventListener('pointercancel',finishCardMove);
let viewTimer=null;function saveViewSoon(){if(!prefs.restore||!current||current.empty)return;clearTimeout(viewTimer);viewTimer=setTimeout(()=>{prefs.view={scale,left:board.scrollLeft,top:board.scrollTop,branch,display,minAmt:$('#minAmt').value,death:$('#deathFilter').value,cessions:[...cessionSelected]};W.savePrefs()},180)}
function applyPrefs(){
 document.body.dataset.theme=prefs.theme;document.body.classList.toggle('show-codes',prefs.codes);$('#themeSelect').value=prefs.theme;$('#codesToggle').checked=prefs.codes;$('#minimapToggle').checked=prefs.minimap;$('#restoreViewToggle').checked=prefs.restore;$('#minimapBox').hidden=!prefs.minimap;liveLinks=prefs.live;W.savePrefs()
}
function openData(){updateDataSummary();$('#dataDialog').showModal()}
$('#dataBtn').addEventListener('click',openData);$('#welcomeData').addEventListener('click',openData);$('#welcomeDemo').addEventListener('click',turnDemo);
$$('[data-workspace=funnel]').forEach(b=>b.addEventListener('click',()=>setMode('vertical')));
$('#rulesBtn').addEventListener('click',()=>$('#rulesDialog').showModal());$('#rulesImportBtn').addEventListener('click',()=>{$('#rulesDialog').close();rawDialog.showModal();refreshRaw()});
$('#filtersBtn').addEventListener('click',()=>{paintCessions();$('#filtersDialog').showModal()});$('#cessionSearch').addEventListener('input',paintCessions);$('#filtersApply').addEventListener('click',()=>{$('#filtersDialog').close();recompute();saveViewSoon()});$('#filtersReset').addEventListener('click',()=>{$('#minAmt').value='';$('#deathFilter').value='all';cessionSelected.clear();paintCessions();recompute();saveViewSoon()});
$('#settingsBtn').addEventListener('click',()=>$('#settingsDialog').showModal());$('#themeSelect').addEventListener('change',e=>{prefs.theme=e.target.value;applyPrefs()});$('#codesToggle').addEventListener('change',e=>{prefs.codes=e.target.checked;applyPrefs()});$('#minimapToggle').addEventListener('change',e=>{prefs.minimap=e.target.checked;applyPrefs();drawMinimap()});$('#restoreViewToggle').addEventListener('change',e=>{prefs.restore=e.target.checked;if(!prefs.restore)prefs.view=null;applyPrefs()});$('#liveLinksBtn').addEventListener('click',()=>{prefs.live=liveLinks;W.savePrefs()});
$('#collapseBtn').addEventListener('click',()=>{collapsed=!collapsed;$('#collapseBtn').setAttribute('aria-pressed',String(collapsed));$('#collapseBtn').classList.toggle('on',collapsed);highlight()});
$('#branchMobile').addEventListener('change',()=>{$('#collapseBtn').disabled=branch==='all';if(branch==='all'){collapsed=false;$('#collapseBtn').classList.remove('on');$('#collapseBtn').setAttribute('aria-pressed','false');highlight()}});
$('#fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.body.classList.toggle('fullscreen-fallback')}});
$('#presentBtn').addEventListener('click',()=>{presentation=!presentation;document.body.classList.toggle('presentation',presentation);$('#presentBtn').textContent=presentation?'Выйти из показа':'Показ';if(presentation){playing=true;showFlow();focusRoute(filteredFlows[flowIndex])}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&presentation){presentation=false;document.body.classList.remove('presentation');$('#presentBtn').textContent='Показ'}});
$('#minimap').addEventListener('click',e=>{pauseForManualNavigation();const svg=$('#minimap'),r=svg.getBoundingClientRect(),sz=worldSize,ratio=Math.min(r.width/sz.w,r.height/sz.h);if(!ratio)return;const x=(e.clientX-r.left-(r.width-sz.w*ratio)/2)/ratio,y=(e.clientY-r.top-(r.height-sz.h*ratio)/2)/ratio;board.scrollLeft=x*scale-board.clientWidth/2;board.scrollTop=y*scale-board.clientHeight/2});
board.addEventListener('scroll',()=>{updateMinimapViewport();saveViewSoon()});
$('#historyBtn').addEventListener('click',openHistory);$('#historyOpen').addEventListener('click',async()=>{try{const after=await W.get($('#historyAfter').value),before=$('#historyBefore').value?await W.get($('#historyBefore').value):null;if(!after)throw Error('Выберите текущий снимок');acceptSnapshots(after.snapshot,before&&before.id!==after.id?before.snapshot:null,'Локальная история');$('#historyDialog').close()}catch(e){$('#historyStatus').textContent=e.message}});
$('#saveSnapBtn').addEventListener('click',async()=>{try{const counts=Object.fromEntries(nodeIds.filter(id=>id==='root'||current.own?.[id]).map(id=>[id,W.blockStats(current,id,null).count]));await W.save(current,counts);$('#dataSummary').textContent='Снимок сохранён в этом браузере. '+current.file}catch(e){$('#dataSummary').textContent='Ошибка: '+e.message}});
$('#downloadSnapBtn').addEventListener('click',()=>{if(realData()){const snap=W.cleanSnapshot(current);if(!singleMode)snap.previous=W.cleanSnapshot(previous);W.download(new Blob([JSON.stringify(snap)],{type:'application/json'}),'NEON_FLOW_снимок.json')}});
$('#reportBtn').addEventListener('click',report);
$('#idCheckBtn').addEventListener('click',()=>{$('#dataDialog').close();$('#idsDialog').showModal()});$('#idRun').addEventListener('click',()=>{const rows=[];for(const id of new Set($('#idText').value.split(/[;\r\n\t]+/).map(cleanID).filter(Boolean))){const i=current.idx.get(id);rows.push({id,from:'—',to:i==null?'—':membership(current,i).filter(code=>code==='root'||current.own?.[code]).join('; '),kind:i==null?'Не найден':current.duplicate.has(id)?'Дублируется ID; показана первая строка':'Найден'})}$('#idsDialog').close();openRows('Проверка ID','Проверка по текущему снимку, без фильтров.',rows)});
const edit=document.createElement('button');edit.className='btn';edit.textContent='Положение блоков';edit.addEventListener('click',()=>{viewEdit=!viewEdit;document.body.classList.toggle('layout-edit',viewEdit);edit.classList.toggle('on',viewEdit);$('#settingsDialog').close();if(viewEdit&&display==='compare')setMode('graph');highlight()});$('#settingsDialog .modal-body').appendChild(edit);
const resetLayout=document.createElement('button');resetLayout.className='btn';resetLayout.textContent='Сбросить расположение';resetLayout.addEventListener('click',()=>{localLayout={};try{localStorage.removeItem(layoutKey)}catch{}renderDiagram(true)});$('#settingsDialog .modal-body').appendChild(resetLayout);
function startEmpty(){
 setSchema();const map={},sets={},own={},labels={},sig={};for(const n of nodes){map[n.id]=n.id;sets[n.id]='';own[n.id]=1;labels[n.id]=n.t;sig[n.id]='empty'}
 const s={v:1,n:0,ids:[],map,sets,own,labels,sig,file:'Реестр не загружен',amt:[],dd:[],empty:true};
 singleMode=true;current=prepareSnapshot(s);previous=current;applyPrefs();restoreLayout();syncCompareControls();setModeButtons();recompute(true);$('#welcome').hidden=false;
}
startEmpty();
})();
