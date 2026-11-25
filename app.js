(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], fmt=n=>Number(n||0).toLocaleString('ru-RU'), esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const W=window.FlowWorkspace,prefs=W.loadPrefs(),cessionSelected=new Set();let maskCache=new Map(),currentStats={},previousStats={},collapsed=false,presentation=false,viewEdit=false,layoutDrag=null,localLayout={},layoutKey='',placementIds=new Set(),placementDraft={},lockedPositions={},distributionCache=new Map();
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
const cleanID=v=>{let t=String(v??'').trim();return /^-?\d+\.0+$/.test(t)?t.replace(/\.0+$/,''):t};
function validSnap(s){return !!(s&&Array.isArray(s.ids)&&s.map&&s.sets&&Number.isInteger(s.n)&&s.n>=0&&s.ids.length===s.n)}
function prepareSnapshot(s){if(!validSnap(s))throw Error('Неверный формат: ожидается снимок с полями ids, map и sets');const idx=new Map(),duplicate=new Set();s.ids.forEach((raw,i)=>{const id=cleanID(raw);if(!id)return;if(idx.has(id)){duplicate.add(id)}else idx.set(id,i)});
 const bitsets={};const decoded={};for(const id of nodeIds){const key=s.map[id];if(key==null)continue;if(typeof s.sets[key]!=='string')throw Error('Отсутствуют данные блока '+id);if(!decoded[key])decoded[key]=base64ToBytes(s.sets[key]);if(decoded[key].length!==Math.ceil(s.n/8))throw Error('Повреждён состав блока '+id);bitsets[id]=decoded[key]}
 return{...s,idx,duplicate,bitsets};}
function membership(s,i){if(!s||i==null||i<0)return[];const out=[];for(const code of nodeIds){const bits=s.bitsets[code];if(bits&&(bits[i>>3]&(1<<(i&7))))out.push(code)}return out;}
function filterOptions(){const d=new Date();return{sum:Number($('#minAmt').value)||0,death:$('#deathFilter').value||'all',limit:Date.UTC(d.getFullYear(),d.getMonth()-5,d.getDate())/86400000,cessions:cessionSelected}}
function masksFor(s){if(!maskCache.has(s)){const o=filterOptions();maskCache.set(s,{normal:W.filterMask(s,o,false),root:W.filterMask(s,o,true)})}return maskCache.get(s)}
function visible(s,i){return !!(s&&i!=null&&i>=0&&masksFor(s).normal[i])}
let draggingView=null,skipPanClick=false,hoveredNode=null,liveLinks=true,motionSpeed=1,structureMotionKey='',routeStarted=0,focusOnly=false,activeRouteKey=null,mapPaths=[],comparisonCounts=new Map();let singleMode=false,rawWarnings="",previous=null,current=null,analysis=null,display='vertical',branch='all',selected='A1',scale=1,playing=false,flowIndex=0,filteredFlows=[],viewPositions={},renderVersion=0;
const canvas=$('#canvas'),board=$('#board'),wrap=$('#canvasWrap'),svg=$('#edges'),layer=$('#nodeLayer'),badges=$('#badgeLayer');
// Compare complete membership sets. A changed parent/base/exclusion makes dependent rules uncertain.
function uncertainRules(before,after){
 const bad=new Set(),deps=new Map();
 for(const code of nodeIds){
  const x=before.sig?.[code],y=after.sig?.[code];
  if(!x||!y||x!==y||!before.bitsets[code]||!after.bitsets[code]||!!before.own?.[code]!==!!after.own?.[code])bad.add(code);
  const d=new Set();
  for(const s of [before,after]){
   const m=s.nodesMeta?.find(n=>n.id===code);
   if(m){for(const id of [...(m.bases||m.parents||[]),...(Array.isArray(m.subtract)?m.subtract:[])])if(id&&id!==code)d.add(id)}
   try{const sig=JSON.parse(s.sig?.[code]||'null');if(Array.isArray(sig)&&sig.length===5){const parents=String(sig[0]||'').split(';'),from=String(sig[1]||'').split(';');for(const id of [...(from.some(Boolean)?from:parents),...(Array.isArray(sig[2])?sig[2]:[])])if(id&&id!==code)d.add(id)}else if(s.demo&&Array.isArray(sig)&&sig[0])d.add(sig[0]);else if(!m&&!s.demo&&code!=='root')bad.add(code)}catch{if(!s.demo)bad.add(code)}
  }deps.set(code,d)
 }
 let more=true;while(more){more=false;for(const [id,d] of deps)if(!bad.has(id)&&[...d].some(x=>bad.has(x)||!nodeMap.has(x))){bad.add(id);more=true}}
 return bad;
}
function analyze(before,after){
 const blockAdded={},blockRemoved={},blockAddedIds={},blockRemovedIds={};
 for(const code of nodeIds){blockAdded[code]=0;blockRemoved[code]=0;blockAddedIds[code]=[];blockRemovedIds[code]=[]}
 const skipped=new Set([...before.duplicate,...after.duplicate]),bad=uncertainRules(before,after);
 const flows=new Map(),ambiguousRows=[],ruleRows=[],addedRows=[],goneRows=[],filterRows=[],entryRows=[],exitRows=[],duplicateRows=[];
 let unchanged=0,missing=0;
 const relevant=(s,i)=>membership(s,i).filter(code=>code==='root'||s.own?.[code]||s.demo);
 const delta=(a,b)=>{const set=new Set(b);return a.filter(x=>!set.has(x))};
 const row=(id,a,b,kind)=>({id,from:a.join(', ')||'—',to:b.join(', ')||'—',kind});
 const all=new Set([...before.idx.keys(),...after.idx.keys()]);
 const bm=masksFor(before),am=masksFor(after);
 for(const id of all){
  const ai=before.idx.get(id),bi=after.idx.get(id),ap=ai!==undefined,bp=bi!==undefined;
  const va=ap&&!!bm.normal[ai],vb=bp&&!!am.normal[bi];
  const ra=ap&&!!bm.root[ai],rb=bp&&!!am.root[bi];
  if(skipped.has(id)){duplicateRows.push(row(id,ap?relevant(before,ai):[],bp?relevant(after,bi):[],'Дублирующийся ID — исключён из сопоставления (показаны блоки первой строки; вне фильтра)'));continue}
  if(!va&&!vb&&!ra&&!rb)continue;
  const a=ap?relevant(before,ai):[],b=bp?relevant(after,bi):[];
  const af=a.filter(x=>x==='root'?ra:va),bf=b.filter(x=>x==='root'?rb:vb);
  for(const code of delta(af,bf)){blockRemoved[code]++;blockRemovedIds[code].push(id)}
  for(const code of delta(bf,af)){blockAdded[code]++;blockAddedIds[code].push(id)}
  if(!ap&&bp){if(vb||rb)addedRows.push(row(id,[],bf,'Новый ID в реестре'));continue}
  if(ap&&!bp){if(va||ra)goneRows.push(row(id,af,[],'ID выбыл из реестра'));continue}
  if(va!==vb||ra!==rb){filterRows.push(row(id,a,b,'Изменилось попадание в фильтр'));continue}
  if(!va&&!vb)continue;
  const exited=delta(a,b),entered=delta(b,a);
  if(!exited.length&&!entered.length){unchanged++;continue}
  if([...exited,...entered].some(x=>bad.has(x))){ruleRows.push(row(id,exited,entered,'Изменены правила / зависимость или нет подписи'));continue}
  // Root and death are real membership changes but not ordinary process stages.
  const eligible=x=>!['root','dead'].includes(x);
  if(exited.length===1&&entered.length===1&&eligible(exited[0])&&eligible(entered[0])){
   const from=exited[0],to=entered[0],key=from+'|'+to;let f=flows.get(key);
   if(!f){f={key,from,to,count:0,ids:[],beforeDebt:0,afterDebt:0,beforeKnown:0,afterKnown:0,source:'membership'};flows.set(key,f)}
   f.count++;f.ids.push(id);const av=before.amt?.[ai],bv=after.amt?.[bi];if(av!=null&&Number.isFinite(Number(av))){f.beforeDebt+=Number(av);f.beforeKnown++}if(bv!=null&&Number.isFinite(Number(bv))){f.afterDebt+=Number(bv);f.afterKnown++}
  }else if(!exited.length){entryRows.push(row(id,[],entered,'Добавился в блоки без установленного источника'))}
  else if(!entered.length){exitRows.push(row(id,exited,[],'Выбыл из блоков без установленного получателя'))}
  else{ambiguousRows.push(row(id,exited,entered,'Несколько изменений состава — маршрут неоднозначен'))}
 }
 for(const s of [before,after])for(const id of s.ids)if(!cleanID(id))missing++;
 const order=[...flows.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
 return{beforeCount:Object.fromEntries(nodeIds.map(id=>[id,previousStats[id]?.count||0])),afterCount:Object.fromEntries(nodeIds.map(id=>[id,currentStats[id]?.count||0])),blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:order,newTotal:addedRows.length,goneTotal:goneRows.length,unchanged,ambiguous:ambiguousRows.length,ruleAffected:ruleRows.length,cleanMoves:order.reduce((s,f)=>s+f.count,0),missing,filterChanged:filterRows.length,skipped:duplicateRows.length,entryRows,exitRows,filterRows,duplicateRows,addedRows,goneRows,ambiguousRows,ruleRows,source:before.file+' → '+after.file};
}
function comparisonGroups(){return [
 ['Новые в реестре',analysis.addedRows,'new'],['Выбыли из реестра',analysis.goneRows,'gone'],['Вход без источника',analysis.entryRows,'entry'],['Выход без получателя',analysis.exitRows,'exit'],['Неоднозначные',analysis.ambiguousRows,'other'],['Правила / нет подписи',analysis.ruleRows,'rules'],['Изменение фильтра',analysis.filterRows,'filter'],['Дубли ID',analysis.duplicateRows,'dup']
]}
function groupRowsForNode(rows,id){return (rows||[]).filter(r=>[r.from,r.to].some(v=>String(v).split(', ').includes(id)))}
function indexCategoryCounts(){comparisonCounts=new Map();if(singleMode)return;for(const [,rows,kind] of comparisonGroups()){const m=new Map();for(const r of rows||[])for(const id of new Set([...String(r.from).split(', '),...String(r.to).split(', ')])){if(nodeMap.has(id))m.set(id,(m.get(id)||0)+1)}comparisonCounts.set(kind,m)}}
function allChangeRows(){const rows=[];for(const f of analysis.flows)for(const id of f.ids)rows.push({id,from:f.from,to:f.to,kind:'Однозначная смена блока'});for(const [,group] of comparisonGroups())for(const row of group||[])rows.push(row);return rows}

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
 for(const el of $$('[data-mode="compare"],[data-action="compare"],[data-action="flows"],[data-action="ambiguous"],#playBtn,#detailBtn,#exportBtn,#focusFlows'))el.disabled=singleMode;
 const both=[current,previous].filter(Boolean);
 $('#minAmt').disabled=both.some(s=>!Array.isArray(s.amt));
 $('#deathFilter').disabled=both.some(s=>!Array.isArray(s.dd));
 if($('#minAmt').disabled)$('#minAmt').value='';
 if($('#deathFilter').disabled)$('#deathFilter').value='all';paintCessions();
}
async function acceptSnapshots(cur,prev,source){
 cancelPlacement(false);linkMode=false;linkFrom=null;
 const saved={current,previous,singleMode,analysis,currentStats,previousStats,display,branch,selected,source:$('#sourceLabel').textContent,rawWarnings};try{
 if(!validSnap(cur)||prev&&!validSnap(prev))throw Error('Не получен корректный рассчитанный снимок.');
 attentionOpen=false;singleMode=!prev;playing=!motionReduced();focusOnly=false;activeRouteKey=null;collapsed=false;$('#collapseBtn').classList.remove('on');$('#collapseBtn').setAttribute('aria-pressed','false');
 setSchema(prev,cur);
 current=prepareSnapshot(cur);previous=prev?prepareSnapshot(prev):current;$('#welcome').hidden=true;$('#minimapBox').hidden=!prefs.minimap;restoreLayout();
 rawWarnings=[cur.warning,prev?.warning].filter(Boolean).join(" · ");
 $('#sourceLabel').textContent=source;
 display=singleMode?'vertical':'compare';branch='all';$('#branchMobile').value='all';if(prefs.restore&&prefs.view){const v=prefs.view;$('#minAmt').value=v.minAmt||'';$('#deathFilter').value=['all','old','recent'].includes(v.death)?v.death:'all';cessionSelected.clear();for(const c of v.cessions||[])cessionSelected.add(c);if(['all','A','B','C'].includes(v.branch)){branch=v.branch;$('#branchMobile').value=branch}}setModeButtons();setBranchButtons();syncCompareControls();await recompute(true);if(prefs.restore&&prefs.view&&display===prefs.view.display){const v=prefs.view;setScale(Number(v.scale)||1);board.scrollLeft=Number(v.left)||0;board.scrollTop=Number(v.top)||0}
 }catch(err){current=saved.current;previous=saved.previous;singleMode=saved.singleMode;analysis=saved.analysis;currentStats=saved.currentStats;previousStats=saved.previousStats;display=saved.display;branch=saved.branch;selected=saved.selected;rawWarnings=saved.rawWarnings;$('#sourceLabel').textContent=saved.source;maskCache.clear();distributionCache.clear();setSchema(previous,current);$('#welcome').hidden=!current?.empty;restoreLayout();syncCompareControls();setModeButtons();indexCategoryCounts();if(analysis){syncFlows();renderDiagram(true);updateDataSummary()}throw err}
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
 for(const [id,color] of [['arrowBase','#a1afc1'],['arrowIn','#a7d6ff'],['arrowOut','#f5cb88']]){
  const m=document.createElementNS(svgNS,'marker');
  for(const [k,v] of Object.entries({id,viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'9',markerHeight:'9',orient:'auto',markerUnits:'userSpaceOnUse'}))m.setAttribute(k,v);
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
 hoveredNode=null;viewPositions=normalizePositions(display==='graph'?originalPositions():verticalPositions());const laneOffset={x:(viewPositions.root?.x||690)-690,y:(viewPositions.root?.y||26)-26};for(const [id,p] of Object.entries({...localLayout[display],...(display==='graph'?lockedPositions:{}),...(display==='graph'&&viewEdit?placementDraft:{})}))if(viewPositions[id]&&Number.isFinite(p.x)&&Number.isFinite(p.y))viewPositions[id]={x:Math.max(CARD_W/2+BOARD_MARGIN,p.x),y:Math.max(BOARD_MARGIN,p.y)};const sz=calcSize(viewPositions);worldSize=sz;canvas.style.width=sz.w+'px';canvas.style.height=sz.h+'px';svg.setAttribute('width',sz.w);svg.setAttribute('height',sz.h);svg.setAttribute('viewBox',`0 0 ${sz.w} ${sz.h}`);svg.replaceChildren();layer.replaceChildren();badges.replaceChildren();
 rebuildAttention();const frag=document.createDocumentFragment();addStructuralEdges();
 for(const n of nodes){const p=viewPositions[n.id];if(!p)continue;const b=document.createElement('button');b.type='button';b.className='node';b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.setProperty('--c',colors[n.k]);b.dataset.id=n.id;if(canMoveCard(n.id)){b.classList.add('placement-card');b.setAttribute('aria-label',n.t+' · новый блок, можно переместить')}
 const a=analysis.afterCount[n.id],before=analysis.beforeCount[n.id],delta=a-before;const title=current?.labels?.[n.id]||n.t;const noRule=n.id!=="root"&&!current?.own?.[n.id]&&!current?.demo;
 const stat=currentStats[n.id]||{},issue=attentionMap.get(n.id);const shown=mapView==='debt'?(stat.known?compactMoney(stat.sum)+(stat.known<stat.count?'*':''):'—'):noRule?'—':fmt(a);b.innerHTML=`<div class="code">${esc(n.id)}</div><div class="node-name">${esc(title)}</div><div class="node-bottom"><span class="mini">${mapView==='debt'?'Долг, ₽':display==='compare'?'Было '+fmt(before):'Договоров'}</span><span class="count">${shown}</span></div>${display==='compare'&&(analysis.blockAdded[n.id]||analysis.blockRemoved[n.id])?`<span class="delta change-pair" title="Добавились / выбыли — уникальные ID, без дублей"><span class="plus">+${fmt(analysis.blockAdded[n.id])}</span><span class="minus">−${fmt(analysis.blockRemoved[n.id])}</span></span>`:''}`;
 if(issue&&mapView==='attention'){const mark=document.createElement('span');mark.className='node-attention';mark.textContent=issue[0].label;mark.title=issue.map(x=>x.label).join(' · ');b.appendChild(mark)}b.title=title+(currentStats[n.id]?.known?' · Долг '+fmt(Math.round(currentStats[n.id].sum))+' ₽':'')+(noRule?' · нет собственного условия расчёта':singleMode?' · строк '+fmt(a):' · было '+fmt(before)+' · стало '+fmt(a));b.addEventListener('click',()=>{if(!viewEdit)chooseNode(n.id,true)});b.addEventListener('dblclick',ev=>{ev.preventDefault();if(!viewEdit)focusBlock(n.id)});b.addEventListener('contextmenu',ev=>{ev.preventDefault();if(!viewEdit)openBlockMenu(ev,n.id)});if(canMoveCard(n.id))b.addEventListener('pointerdown',e=>startCardMove(e,n.id));b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!draggingView){hoveredNode=n.id;highlight()}});b.addEventListener('pointerleave',()=>{if(hoveredNode===n.id){hoveredNode=null;highlight()}});frag.appendChild(b)}layer.appendChild(frag);
 if(display==='vertical'||display==='compare'){for(const {x,title:text} of LANES){const e=document.createElement('div');e.className='lane-head';e.style.left=(x+laneOffset.x)+'px';e.style.top=(562+laneOffset.y)+'px';e.textContent=text;layer.appendChild(e)}}
 $('#boardTitle').textContent=display==='graph'?'Полная схема':display==='compare'?'Сравнение реестров':'Вертикальный обзор';
 $('#boardSub').textContent=nodes.length+' блоков · '+(current?.empty?'ожидание загрузки':current?.demo?'условные данные':singleMode?'локальный расчёт · строки реестра':'строки блоков · переходы по ID');$('#comparisonLabel').textContent=singleMode?(current?.file||'—')+' · '+(current.rulesName||'без предыдущего снимка'):(previous?.file||'—')+' → '+(current?.file||'—');
 setScale(scale);showFlow();highlight();drawMinimap();if(reset){if(display==='graph')fitAll();else if(display==='compare'){fitZoom()}else{const target=window.innerWidth<850?1:Math.min(1,Math.max(.85,(board.clientWidth-24)/sz.w));setScale(target);const p=viewPositions[branch==='all'?'root':branch]||viewPositions.root;board.scrollLeft=Math.max(0,(p?.x||690)*scale-board.clientWidth*.5);board.scrollTop=branch==='all'?0:Math.max(0,(p?.y||0)*scale-32);}}}
function setScale(v){
 scale=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number(v)||1));canvas.style.transform='scale('+scale+')';canvas.classList.toggle('zoom-compact',scale<.5);canvas.classList.toggle('zoom-detail',scale>=1.15);
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
function pauseForManualNavigation(){/* The map has no automatic camera; manual navigation never pauses motion. */}
function chooseNode(id,go){
 if(!byId[id])return;attentionOpen=false;if(linkMode){if(!linkFrom){linkFrom=id;selected=id;highlight();setStatus('Источник: '+byId[id].t+' · выберите получателя');return}if(linkFrom===id){setStatus('Выберите другой блок.');return}const from=linkFrom;linkMode=false;linkFrom=null;rulesEditor.open(id,from);return}selected=id;hoveredNode=null;
 if(display==='compare'){
  activeRouteKey=null;showFlow()
 }
 highlight();renderInspector();if(go)$('#inspector').classList.add('open');
}
function highlight(){
 if(!analysis)return;
 const target=hoveredNode||selected,s=$('#search').value.trim().toLowerCase(),incoming=new Set(),outgoing=new Set();
 const links=structuralLinks();for(const e of links){if(e.to===target)incoming.add(e.from);if(e.from===target)outgoing.add(e.to)}if(prefs.chain){let changed=true;while(changed){changed=false;for(const e of links.filter(x=>x.kind==='parent')){if(incoming.has(e.to)&&!incoming.has(e.from)&&e.from!==target){incoming.add(e.from);changed=true}if(outgoing.has(e.from)&&!outgoing.has(e.to)&&e.to!==target){outgoing.add(e.to);changed=true}}}}
 const routes=display==='compare'?displayedRoutes():[],f=routes.find(r=>r.key===activeRouteKey);const sourceIds=new Set(routes.map(r=>r.from)),targetIds=new Set(routes.map(r=>r.to));
 for(const e of $$('.node')){
  const id=e.dataset.id,n=byId[id],txt=(id+' '+(current?.labels?.[id]||n?.t||id)).toLowerCase();
  const okBranch=branch==='all'||branchOf(id)===branch||['root','dead'].includes(id);
  const actual=sourceIds.has(id)||targetIds.has(id);
  const unchanged=display==='compare'&&changedOnly&&!actual&&!analysis.blockAdded[id]&&!analysis.blockRemoved[id]&&analysis.beforeCount[id]===analysis.afterCount[id]&&id!==target;e.classList.toggle('collapsed',unchanged||collapsed&&branch!=='all'&&!okBranch&&!actual);e.classList.toggle('dim',!actual&&id!==target&&!incoming.has(id)&&!outgoing.has(id)&&(!okBranch||(s&&!txt.includes(s))));
  e.classList.toggle('attention-flag',mapView==='attention'&&attentionMap.has(id));e.classList.toggle('connection-in',incoming.has(id));e.classList.toggle('connection-out',outgoing.has(id));e.classList.toggle('connection-focus',id===target);
  e.classList.toggle('route-source',f?.from===id);e.classList.toggle('route-target',f?.to===id);e.classList.toggle('selected',id===selected);e.classList.toggle('flight',actual);e.classList.toggle('flow-origin',sourceIds.has(id));e.classList.toggle('flow-destination',targetIds.has(id));
 }
 for(const e of $$('.base-edge')){
  const into=e.dataset.b===target||prefs.chain&&incoming.has(e.dataset.a)&&incoming.has(e.dataset.b),out=e.dataset.a===target||prefs.chain&&outgoing.has(e.dataset.a)&&outgoing.has(e.dataset.b);
  e.classList.toggle('collapsed',(display==='compare'&&changedOnly&&[e.dataset.a,e.dataset.b].some(id=>!sourceIds.has(id)&&!targetIds.has(id)&&!analysis.blockAdded[id]&&!analysis.blockRemoved[id]&&analysis.beforeCount[id]===analysis.afterCount[id]&&id!==target))||collapsed&&branch!=='all'&&[e.dataset.a,e.dataset.b].some(id=>!['root','dead'].includes(id)&&branchOf(id)!==branch));e.classList.toggle('near',into||out);e.classList.toggle('edge-in',into);e.classList.toggle('edge-out',out);
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
 const compare=display==='compare',premium=prefs.performance==='motion';
 const allowed=liveLinks&&!motionReduced()&&!draggingView&&!viewEdit&&!current?.empty&&(!compare||playing);
 $('#liveLinksBtn').hidden=false;$('#liveLinksBtn').classList.toggle('on',liveLinks);$('#liveLinksBtn').setAttribute('aria-pressed',String(liveLinks));
 $('#motionHint').textContent=compare?'Зелёные — переходы по ID · голубые и янтарные — связи по правилам':'Световые импульсы показывают направление связей, не фактические переходы';
 if(!allowed){removeStructureMotion();return}
 const edges=$$('.base-edge').filter(e=>!e.classList.contains('collapsed'));
 const near=edges.filter(e=>e.classList.contains('near'));
 const other=edges.filter(e=>!e.classList.contains('near')&&(branch==='all'||[e.dataset.a,e.dataset.b].every(id=>['root','dead'].includes(id)||branchOf(id)===branch)));
 // Keep confirmed transitions visually dominant in comparison mode; animate only nearby structural links.
 const limit=compare?(premium?16:8):(premium?64:24);
 const chosen=(compare?near:[...near,...other]).slice(0,limit);
 const signature=chosen.map(e=>[e.dataset.a,e.dataset.b,e.dataset.kind,e.classList.contains('edge-in')?'in':e.classList.contains('edge-out')?'out':'base'].join(':')).join(',');
 const key=[display,target,motionSpeed,premium,branch,signature].join('|');
 if(structureMotionKey===key)return;
 removeStructureMotion();structureMotionKey=key;
 if(!chosen.length)return;
 const g=document.createElementNS(svgNS,'g');g.setAttribute('class','structure-motion');
 chosen.forEach((e,i)=>{
  const d=e.getAttribute('d');if(!d)return;
  const close=e.classList.contains('near'),color=e.classList.contains('edge-in')?'#a7d6ff':e.classList.contains('edge-out')?'#f5cb88':'#b7c5d6';
  const trail=pathEl(d,'signal-trail'+(close?' signal-near':' signal-neutral'),color);
  trail.setAttribute('pathLength','100');trail.style.setProperty('--speed',((close?3.0:4.6)/motionSpeed)+'s');trail.style.setProperty('--delay',(-i*.37)+'s');g.appendChild(trail);
 });
 const actual=svg.querySelector('.map-route');if(actual)svg.insertBefore(g,actual);else svg.appendChild(g);
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

function routeValue(f){return flowMetric==='debt'?Math.abs(f.afterDebt||0):f.count}function routeLabel(f){return flowMetric==='debt'?(f.afterKnown?fmt(Math.round(f.afterDebt))+' ₽'+(f.afterKnown<f.count?'*':''):'— ₽'):fmt(f.count)}function displayedRoutes(){const list=(filteredFlows||[]).filter(f=>!focusOnly||f.from===selected||f.to===selected).sort((a,b)=>routeValue(b)-routeValue(a)||b.count-a.count);return flowLimit?list.slice(0,flowLimit):list}
function routePath(f,reversePair){
 const a=viewPositions[f.from],b=viewPositions[f.to];if(!a||!b)return '';
 const dx=b.x-a.x,dy=b.y-a.y;
 if(!reversePair&&Math.abs(dx)<CARD_W*.65)return bezier(f.from,f.to,viewPositions,true);
 if(Math.abs(dx)<CARD_W*.65){const sign=f.from.localeCompare(f.to)<0?1:-1,sx=a.x+sign*CARD_W/2,ex=b.x+sign*CARD_W/2,sy=a.y+CARD_H*.5,ey=b.y+CARD_H*.5,g=sign>0?Math.max(sx,ex)+25:Math.min(sx,ex)-25;return 'M'+sx+' '+sy+' H'+g+' V'+ey+' H'+(ex+sign*5)}
 const dir=dx>0?1:-1,offset=reversePair?22:0,sx=a.x+dir*CARD_W/2,ex=b.x-dir*(CARD_W/2+5),sy=a.y+CARD_H/2+offset,ey=b.y+CARD_H/2+offset;
 if(Math.abs(dx)>CARD_W*1.45){const g1=sx+dir*22,g2=ex-dir*22,channel=a.y+CARD_H+12+(reversePair?(dir>0?0:9):0);return 'M'+sx+' '+sy+' H'+g1+' V'+channel+' H'+g2+' V'+ey+' H'+ex}
 return 'M'+sx+' '+sy+' C'+(sx+dir*40)+' '+sy+','+(ex-dir*40)+' '+ey+','+ex+' '+ey;
}
function badgeLocation(track,f,placed){
 const a=viewPositions[f.from],b=viewPositions[f.to],fallback={x:(a.x+b.x)/2,y:(a.y+b.y+CARD_H)/2};
 if(typeof track.getTotalLength!=='function')return fallback;
 const len=track.getTotalLength(),cards=Object.values(viewPositions),width=26+routeLabel(f).length*8;
 const inside=(x,y)=>cards.some(p=>Math.abs(x-p.x)<CARD_W/2+width/2+5&&y>p.y-15&&y<p.y+CARD_H+15)||placed.some(p=>Math.abs(x-p.x)<(p.w+width)/2+8&&Math.abs(y-p.y)<27);
 for(const fraction of [.5,.35,.65,.22,.78,.12,.88]){const p=track.getPointAtLength(len*fraction);if(!inside(p.x,p.y)){placed.push({x:p.x,y:p.y,w:width});return p}}
 return null;
}
function renderCategories(){
 const box=$('#changeCategories');box.replaceChildren();
 const note=document.createElement('span');note.className='categories-caption';note.textContent='Другие изменения · все направления';box.appendChild(note);
 for(const [name,rows,kind] of comparisonGroups()){
  const n=rows?.length||0;if(!n)continue;const b=document.createElement('button');b.className='category-chip '+kind;b.innerHTML='<span>'+esc(name)+'</span> <b>'+fmt(n)+'</b>';b.addEventListener('click',()=>openRows(name,'Отдельная категория. Линия между блоками не строится без однозначного соответствия.',rows));box.appendChild(b);
 }
 if(box.children.length===1&&!analysis.missing){box.replaceChildren();return}
 if(analysis.missing){const e=document.createElement('span');e.className='category-chip';e.textContent='Строк без ID: '+fmt(analysis.missing);e.title='Без идентификатора сравнить договор невозможно (оба файла)';box.appendChild(e)}
}
function showFlow(){
 svg.querySelectorAll('.movement-edge,.movement-glow,.movement-track,.marker,.click-edge,.route-defs,.cinematic-route,.map-route').forEach(x=>x.remove());badges.replaceChildren();mapPaths=[];
 const active=display==='compare'&&!singleMode;$('#motionPanel').hidden=!active;$('#routeStory').hidden=true;
 $('#playBtn').textContent=playing?'Ⅱ Движение':'▷ Движение';$('#playBtn').classList.toggle('on',playing);$('#playBtn').setAttribute('aria-pressed',String(playing));
 $('#focusFlows').classList.toggle('on',focusOnly);$('#focusFlows').setAttribute('aria-pressed',String(focusOnly));
 if(!active){highlight();renderInspector();return}
 const routes=displayedRoutes(),f=routes.find(x=>x.key===activeRouteKey);
 $('#flowCount').textContent=fmt(routes.length)+' маршрутов · '+fmt(routes.reduce((s,f)=>s+f.count,0))+' ID'+(flowMetric==='debt'?' · '+fmt(Math.round(routes.reduce((s,f)=>s+(f.afterDebt||0),0)))+' ₽ известных сумм':'');
 $('#flowTitle').textContent=routes.length?('Все линии остаются на схеме. Нажмите линию или число для деталей.'+(routes.length>(prefs.performance==='motion'?100:24)?' Импульсы на крупнейших и выбранном маршруте; все стрелки видны.':'')):'Нет однозначных маршрутов в текущем представлении. Проверьте отдельные категории.';
 $('#flowTitle').title='Сравнение двух снимков, не события в реальном времени.';if(flowMetric==='debt')$('#flowTitle').textContent+=' Сумма на текущую дату; * — известна не для всех ID.';
 renderCategories();
 const defs=document.createElementNS(svgNS,'defs');defs.setAttribute('class','route-defs');
 for(const [id,c] of [['routeArrow','#95e5c9'],['routeArrowSelected','#e5fff5']]){
  const arrow=document.createElementNS(svgNS,'marker');for(const [k,v] of Object.entries({id,viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'10',markerHeight:'10',markerUnits:'userSpaceOnUse',orient:'auto'}))arrow.setAttribute(k,v);
  const p=document.createElementNS(svgNS,'path');p.setAttribute('d','M0 0 L10 5 L0 10 Z');p.setAttribute('fill',c);arrow.appendChild(p);defs.appendChild(arrow)
 }svg.appendChild(defs);
 const keys=new Set(routes.map(f=>f.key)),max=Math.max(1,...routes.map(routeValue)),placed=[];
 const ordered=[...routes].sort((a,b)=>Number(a.key===activeRouteKey)-Number(b.key===activeRouteKey)||a.count-b.count);
 const animate=playing&&!motionReduced();const animatedKeys=new Set(routes.slice(0,prefs.performance==='motion'?100:24).map(f=>f.key));const group=document.createElementNS(svgNS,'g');group.setAttribute('class','map-route');svg.appendChild(group);
 for(const route of ordered){
  const d=routePath(route,keys.has(route.to+'|'+route.from));if(!d)continue;const chosen=route.key===activeRouteKey,width=3.1+4.8*Math.sqrt(routeValue(route)/max);
  const g=document.createElementNS(svgNS,'g');g.setAttribute('class','flow-route'+(chosen?' focused':''));
  g.dataset.key=route.key;g.dataset.from=route.from;g.dataset.to=route.to;
  const track=pathEl(d,'map-track');track.style.setProperty('--route-width',width+'px');track.setAttribute('marker-end','url(#'+(chosen?'routeArrowSelected':'routeArrow')+')');g.appendChild(track);
  if(animate&&(animatedKeys.has(route.key)||chosen)){const pulse=pathEl(d,'map-pulse');pulse.setAttribute('pathLength','100');pulse.style.setProperty('--route-width',Math.max(2.7,width-.6)+'px');pulse.style.setProperty('--speed',(3.1/motionSpeed)+'s');pulse.style.setProperty('--delay',(-((route.from.length*7+route.to.length*11)%13)/5)+'s');g.appendChild(pulse)}
  const hit=pathEl(d,'click-edge');hit.setAttribute('tabindex','0');hit.setAttribute('role','button');hit.setAttribute('aria-label',route.from+' → '+route.to+': '+route.count+' ID');const t=document.createElementNS(svgNS,'title');t.textContent=(byId[route.from]?.t||route.from)+' → '+(byId[route.to]?.t||route.to)+' · '+fmt(route.count);hit.appendChild(t);
  const select=()=>{activeRouteKey=route.key;flowIndex=filteredFlows.indexOf(route);if(!focusOnly)selected=route.to;showFlow();openFlowDetails(route)};
  hit.addEventListener('click',select);hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}});g.appendChild(hit);group.appendChild(g);
  const pt=badgeLocation(track,route,placed);
  if(pt){const badge=document.createElement('button');badge.className='flowbadge map-badge'+(chosen?' focused':'');badge.dataset.key=route.key;badge.style.left=pt.x+'px';badge.style.top=pt.y+'px';badge.textContent='→ '+routeLabel(route);badge.title=t.textContent;badge.addEventListener('click',select);badges.appendChild(badge)}
  mapPaths.push(g)
 }
 if(f){$('#routeStory').hidden=false;updateRouteStory(f,id=>current?.labels?.[id]||byId[id]?.t||id)}
 highlight();renderInspector();
}
function updateRouteStory(f,label){
 $('#storyFrom').textContent=f.from+' · '+label(f.from);$('#storyTo').textContent=f.to+' · '+label(f.to);
 $('#storyMoved').textContent=fmt(f.count)+' договоров';
 $('#storyFromCount').textContent='Весь блок: '+fmt(analysis.beforeCount[f.from])+' → '+fmt(analysis.afterCount[f.from]);
 $('#storyToCount').textContent='Весь блок: '+fmt(analysis.beforeCount[f.to])+' → '+fmt(analysis.afterCount[f.to]);
}

function focusRoute(f){
 const a=viewPositions[f?.from],b=viewPositions[f?.to];if(!a||!b)return;
 const left=Math.min(a.x,b.x)-CARD_W/2-24,right=Math.max(a.x,b.x)+CARD_W/2+24,top=Math.min(a.y,b.y)-24,bottom=Math.max(a.y,b.y)+CARD_H+24;
 const desired=Math.min(1.2,(board.clientWidth-20)/Math.max(1,right-left),(board.clientHeight-20)/Math.max(1,bottom-top));
 setScale(Math.max(.25,Math.min(scale,desired)));
 board.scrollTo({left:Math.max(0,(left+right)*scale/2-board.clientWidth/2),top:Math.max(0,(top+bottom)*scale/2-board.clientHeight/2),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function renderRouteList(){
 const list=$('#routesList'),q=$('#routeSearch').value.trim().toLowerCase();list.replaceChildren();const label=id=>current?.labels?.[id]||byId[id]?.t||id;
 for(const [i,f] of filteredFlows.entries()){
  if(q&&!(f.from+' '+f.to+' '+label(f.from)+' '+label(f.to)).toLowerCase().includes(q))continue;
  const b=document.createElement('button');b.className='flowrow route-option'+(f.key===activeRouteKey?' active':'');b.type='button';b.innerHTML='<span><span class="flowlist-title">'+esc(f.from)+' → '+esc(f.to)+'</span><span class="flowlist-sub">'+esc(label(f.from))+' → '+esc(label(f.to))+'</span></span><b>'+fmt(f.count)+'</b>';b.addEventListener('click',()=>{$('#routesDialog').close();selectFlow(i,true)});list.appendChild(b)
 }
}
function openRoutes(){
 $('#routesSummary').textContent='По всем направлениям: '+fmt(analysis.cleanMoves)+' ID с однозначной сменой блоков. В списке: '+fmt(filteredFlows.length)+' маршрутов. Новые, выбывшие и неопределённые случаи вынесены отдельно.';
 $('#routeSearch').value='';renderRouteList();$('#routesDialog').showModal()
}
function flowsForBranch(){return analysis?.flows.filter(f=>branch==='all'||branchOf(f.from)===branch||branchOf(f.to)===branch)||[]}
function syncFlows(){filteredFlows=flowsForBranch();flowIndex=Math.max(0,Math.min(filteredFlows.length-1,flowIndex));showFlow()}
function selectFlow(i,focus=true){if(!filteredFlows.length){flowIndex=0;activeRouteKey=null;showFlow();return}flowIndex=((i%filteredFlows.length)+filteredFlows.length)%filteredFlows.length;const f=filteredFlows[flowIndex];activeRouteKey=f.key;focusOnly=false;if(display==='compare')selected=f.to;showFlow();if(focus&&display==='compare')focusRoute(f)}
function renderInspector(){if(!analysis||!byId[selected])return;if(attentionOpen){renderAttention();return}renderInspectorLegacy();enhanceInspector()}
function renderInspectorLegacy(){if(!analysis)return;const n=byId[selected],from=analysis.beforeCount[selected],to=analysis.afterCount[selected],delta=to-from;if(singleMode){const noRule=selected!=='root'&&!current.own?.[selected];$('#inspectorBody').innerHTML=`<div class="selected-block" style="--sel:${colors[n.k]}"><small># ${esc(n.id)}</small><h2>${esc(current.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Нет собственного критерия')}</p></div><div class="sect"><h3>Текущий реестр</h3><h2>${noRule?'—':fmt(to)}</h2><p>${noRule?'Блок не имеет собственного условия или исключения.':'Строк по действующим правилам'}</p></div><div class="sect"><h3>Сравнение</h3><p>Загрузите предыдущий реестр, чтобы увидеть переходы.</p>${rawWarnings?'<p>'+esc(rawWarnings)+'</p>':''}</div>`;attachBlockTools(n);return;}const incoming=analysis.flows.filter(f=>f.to===selected),outgoing=analysis.flows.filter(f=>f.from===selected);let h=`<div class="selected-block" style="--sel:${colors[n.k]}"><small>Блок ${esc(n.id)}</small><h2>${esc(current?.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Условия отображаются как ориентир из исходной схемы. Авторитетный расчёт — только в исходном снимке.')}</p></div><div class="inspector-metrics"><div><b>${fmt(from)}</b><small>Было</small></div><div><b>${fmt(to)}</b><small>Стало</small></div><div><b style="color:${delta>=0?'var(--green)':'var(--red)'}">${delta>0?'+':''}${fmt(delta)}</b><small>Изменение</small></div></div>`;
 h+=`<div class="sect"><h3>Изменения состава блока</h3><div class="info">Добавились: <b style="color:var(--green)">${fmt(analysis.blockAdded[selected])}</b><br/>Выбыли: <b style="color:var(--red)">${fmt(analysis.blockRemoved[selected])}</b><br/>Разница показывает изменение численности, а не обязательно переход на следующий этап.</div><button class="btn" data-blockdetails>Посмотреть ID</button></div>`;
 h+=`<div class="sect"><h3>Подтверждённые переходы</h3>`;
 const listed=[...incoming,...outgoing].sort((a,b)=>b.count-a.count);h+=listed.length?listed.map(f=>`<button class="flowrow ${activeRouteKey===f.key?'active':''}" data-flowkey="${esc(f.key)}"><span><span class="flowlist-title">${esc(f.from)} → ${esc(f.to)}</span><span class="flowlist-sub">${esc(byId[f.from]?.t||f.from)} → ${esc(byId[f.to]?.t||f.to)}</span></span><b>${fmt(f.count)}</b></button>`).join(''):'<div class="empty">Однозначных переходов для блока не выявлено. Возможно, изменился только состав или несколько блоков одновременно.</div>';
 h+=`</div><div class="sect"><h3>Другие изменения блока</h3>`;for(const [name,rows,kind] of comparisonGroups()){const n=comparisonCounts.get(kind)?.get(selected)||0;if(n)h+='<button class="flowrow" data-category="'+kind+'"><span>'+esc(name)+'</span><b>'+fmt(n)+'</b></button>'}h+=`</div><div class="sect"><h3>Как рассчитано</h3><p>В исходном коде «Брать из блока», исключения и правила И/ИЛИ влияют на расчёт. Эти значения получены из уже рассчитанных наборов. При множественном изменении блоков переход не выдумывается.</p></div>`;
 $('#inspectorBody').innerHTML=h;attachBlockTools(n);$('#inspectorBody').querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{const item=comparisonGroups().find(x=>x[2]===b.dataset.category);if(item)openRows(item[0]+' · '+n.t,'Отдельные изменения состава, без предположения о маршруте.',groupRowsForNode(item[1],n.id))}));$('#inspectorBody').querySelector('[data-blockdetails]')?.addEventListener('click',()=>openBlockDetails(selected));$('#inspectorBody').querySelectorAll('[data-flowkey]').forEach(el=>el.addEventListener('click',()=>{const f=analysis.flows.find(x=>x.key===el.dataset.flowkey);if(!f)return;display='compare';setModeButtons();renderDiagram();let ix=filteredFlows.findIndex(x=>x.key===f.key);if(ix<0){branch='all';setBranchButtons();syncFlows();ix=filteredFlows.findIndex(x=>x.key===f.key)}selectFlow(ix);$('#inspector').classList.remove('open')}));}
function setModeButtons(){$$('[data-mode]').forEach(b=>{b.classList.toggle('on',b.dataset.mode===display);b.setAttribute('aria-pressed',String(b.dataset.mode===display))});$$('[data-workspace]').forEach(b=>b.classList.toggle('active',b.dataset.workspace===(display==='compare'?'changes':'funnel')));document.body.dataset.mode=display;}
function setBranchButtons(){$$('[data-branch]').forEach(b=>b.classList.toggle('active',b.dataset.branch===branch));}
function setMode(m){if(viewEdit&&m!=='graph')cancelPlacement(false);if(linkMode&&m!=='graph'){linkMode=false;linkFrom=null}attentionOpen=false;if(singleMode&&m==='compare'){setStatus('Для сравнения требуется предыдущий реестр');return}display=m;setModeButtons();renderDiagram(true);if(m==='compare'){activeRouteKey=null;focusOnly=false;showFlow();fitZoom()}saveViewSoon()}
function setStatus(s){$('#status').textContent=s}
function openRows(title,note,rows,getAll){$('#detailsTitle').textContent=title;$('#detailsNote').textContent=note;detailAll=rows;detailPage=0;$('#detailSearch').value='';$('#detailSort').value='original';refreshDetailRows();if(!$('#detailsDialog').open)$('#detailsDialog').showModal();}
function openFlowDetails(f){openRows(`Переход ${f.from} → ${f.to} · ${fmt(f.count)} ID`,'Однозначная смена принадлежности по двум снимкам. Промежуточные этапы и время движения неизвестны. Сумма по этим ID: было '+(f.beforeKnown?fmt(Math.round(f.beforeDebt))+' ₽ ('+fmt(f.beforeKnown)+' ID)':'—')+'; стало '+(f.afterKnown?fmt(Math.round(f.afterDebt))+' ₽ ('+fmt(f.afterKnown)+' ID)':'—')+'.',f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})),()=>f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})));}
function openBlockDetails(code){const add=analysis.blockAddedIds[code].map(id=>({id,from:'—',to:code,kind:'Добавился в блок'})),rem=analysis.blockRemovedIds[code].map(id=>({id,from:code,to:'—',kind:'Выбыл из блока'}));openRows(`Изменения блока ${code}`,'Все сопоставленные изменения состава доступны в списке; дубли исключены.',add.concat(rem));}
function csvSafe(v){const raw=String(v??''),s=/^[=+@-]/.test(raw)&&!/^[-+]?\d+(\.\d+)?$/.test(raw)?"'"+raw:raw;return/[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function downloadRows(rows,name){const head=['ID договора','Блок до','Блок после','Категория','Сумма долга + ГП','Дата смерти','Цессия'];const lines=[head,...rows.map(r=>[r.id,r.from,r.to,r.kind,r.amount??'',r.death??'',r.cession??''])].map(row=>row.map(csvSafe).join(';')).join('\r\n');const b=new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
function exportAll(){downloadRows(allChangeRows(),'NEON_FLOW_изменения.csv')}
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
async function applyImports(){try{const cur=imported.new?.snapshot||imported.old?.snapshot;const prev=imported.old&&imported.new?imported.old.snapshot:imported.new?.previous||imported.old?.previous;if(!cur)throw Error('Выберите текущий снимок.');await acceptSnapshots(cur,prev,'Загруженные снимки');$('#uploadDialog').close();}catch(e){$('#loadInfo').textContent='Ошибка сравнения: '+e.message}}
async function recompute(reset=false){if(!previous||!current)return;const start=performance.now(),job=++computeJob;maskCache.clear();distributionCache.clear();attentionDiagnostics=[];attentionChecked=false;attentionChecking=false;attentionError='';if(current.n+(singleMode?0:previous.n)>=100000&&typeof Worker!=='undefined'){document.body.classList.add('computing');setStatus('Сравнение и статистика · локальный фоновый поток…');try{const r=await runAnalysis('compare',{current:W.cleanSnapshot(current),previous:singleMode?null:W.cleanSnapshot(previous),ids:nodeIds.slice(),opts:filterOptions()});if(job!==computeJob)return;currentStats=r.currentStats;previousStats=r.previousStats;analysis=r.analysis}catch(e){if(job!==computeJob)return;setStatus('Ошибка фонового расчёта: '+e.message);throw e}finally{if(job===computeJob)document.body.classList.remove('computing')}}else{currentStats=W.allStats(current,masksFor(current),nodeIds);previousStats=previous===current?currentStats:W.allStats(previous,masksFor(previous),nodeIds);analysis=singleMode?emptySingleAnalysis(current):analyze(previous,current);}indexCategoryCounts();if(reset)flowIndex=0;syncFlows();renderDiagram(reset);if(reset&&display==='compare')fitZoom();renderInspector();updateDataSummary();if(current.empty){setStatus('Загрузите реестр для начала работы.');return}if(singleMode){setStatus('Текущий реестр рассчитан локально · '+fmt(current.n)+' строк · '+(rawWarnings?'Предупреждения: '+rawWarnings:'для сравнения загрузите предыдущий реестр'));return;}setStatus(`${current.demo?'Демо':'Реальные наборы'} · ${fmt(analysis.cleanMoves)} однозначных изменений · ${fmt(analysis.ambiguous)} неоднозначных · ${fmt(analysis.ruleAffected)} затронуты правилами · дублей ID исключено ${fmt(analysis.skipped)} · обработано за ${((performance.now()-start)/1000).toFixed(1)} с`)}
let timer=null;function turnDemo(){cancelPlacement(false);linkMode=false;linkFrom=null;attentionOpen=false;mapView='count';$('#mapView').value='count';singleMode=false;rawWarnings='';playing=!motionReduced();focusOnly=false;activeRouteKey=null;setSchema();const pair=makeDemo();previous=prepareSnapshot(pair[0]);current=prepareSnapshot(pair[1]);$('#welcome').hidden=true;$('#minAmt').value='';$('#deathFilter').value='all';cessionSelected.clear();restoreLayout();syncCompareControls();$('#sourceLabel').textContent='Демо · условные данные';display='vertical';branch='all';collapsed=false;$('#branchMobile').value='all';setBranchButtons();setModeButtons();recompute(true)}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
function chooseBranch(value){branch=value;saveViewSoon();$('#branchMobile').value=value;setBranchButtons();flowIndex=0;syncFlows();highlight();if(display==='compare'){activeRouteKey=null;showFlow();fitZoom();return}const p=viewPositions[value==='all'?'root':value];if(p)board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,(p.y-22)*scale),behavior:'smooth'});}
$$('[data-branch]').forEach(b=>b.addEventListener('click',()=>chooseBranch(b.dataset.branch)));$('#branchMobile').addEventListener('change',e=>chooseBranch(e.target.value));
$$('[data-action=compare]').forEach(b=>b.addEventListener('click',()=>setMode('compare')));
$('#zoomIn').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(scale*1.15)});$('#zoomOut').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(scale/1.15)});$('#zoomFit').addEventListener('click',()=>{pauseForManualNavigation();fitZoom()});$('#zoomAll').addEventListener('click',()=>{pauseForManualNavigation();fitAll()});$('#zoomReset').addEventListener('click',()=>{pauseForManualNavigation();zoomAt(1)});bindCanvasNavigation();$('#search').addEventListener('input',highlight);$('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim().toLowerCase();if(!q)return;const n=nodes.find(n=>(n.id+' '+n.t).toLowerCase().includes(q));if(n){pauseForManualNavigation();const p=viewPositions[n.id];if(p)board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,p.y*scale-board.clientHeight/2),behavior:'smooth'});chooseNode(n.id,true)}else if(current?.idx?.has(cleanID(e.target.value)))openContract(cleanID(e.target.value));else setStatus('Блок или точный ID не найден.')}});
// Filters are committed together in the filter dialog.
$('#playBtn').addEventListener('click',()=>{playing=!playing;showFlow()});$('#liveLinksBtn').addEventListener('click',()=>{liveLinks=!liveLinks;highlight()});$('#motionSpeed').addEventListener('change',e=>{motionSpeed=Math.max(.7,Math.min(2,Number(e.target.value)||1));showFlow()});$('#focusFlows').addEventListener('click',()=>{focusOnly=!focusOnly;activeRouteKey=null;showFlow()});$('#routesBtn').addEventListener('click',openRoutes);$('#inspectToggle').addEventListener('click',()=>$('#inspector').classList.toggle('open'));
$('#routeSearch').addEventListener('input',renderRouteList);
$('#detailBtn').addEventListener('click',()=>{const f=filteredFlows.find(x=>x.key===activeRouteKey);if(f)openFlowDetails(f)});$('#exportBtn').addEventListener('click',exportAll);$('#detailsCsv').addEventListener('click',()=>downloadRows(detailFiltered.map(enrichRow),'NEON_FLOW_детали.csv'));$('#closeInspector').addEventListener('click',()=>$('#inspector').classList.remove('open'));
$('#loadBtn').addEventListener('click',()=>{$('#dataDialog').close();$('#uploadDialog').showModal()});$('#choosePrior').addEventListener('click',()=>$('#priorFile').click());$('#chooseCurrent').addEventListener('click',()=>$('#currentFile').click());$('#priorFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'old')});$('#currentFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'new')});$('#applyFiles').addEventListener('click',applyImports);$('#demoBtn').addEventListener('click',()=>{$('#dataDialog').close();turnDemo()});
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
window.addEventListener('keydown',e=>{if(e.key==='Escape')$('#inspector').classList.remove('open');if(e.target.closest('input,select,textarea,dialog,button'))return;const steps={ArrowLeft:[-160,0],ArrowRight:[160,0],ArrowUp:[0,-160],ArrowDown:[0,160]};if(steps[e.key]){e.preventDefault();pauseForManualNavigation();board.scrollLeft+=steps[e.key][0];board.scrollTop+=steps[e.key][1]}});
// No timed route changes or camera jumps. Animation is continuous on the map.
window.addEventListener('resize',()=>{if(board.clientWidth&&board.clientHeight)setScale(scale)});if(typeof ResizeObserver!=='undefined'){const boardResize=new ResizeObserver(()=>{if(board.clientWidth&&board.clientHeight)setScale(scale)});boardResize.observe(board)}

let rawActive=false,rawAbort=null,rawCancelled=false,rawDraft=null,lastRaw=null;
const rawDialog=$('#rawDialog'),rawRun=$('#rawRun'),rawInfo=$('#rawInfo');
function refreshRaw(){const use=!!(rawDraft&&$('#rawUseDraft').checked);$('#rawDraftLabel').hidden=!rawDraft;$('#rawRules').disabled=rawActive||use;$('#rawUseDraft').disabled=rawActive;rawRun.disabled=rawActive||(!use&&!$('#rawRules').files[0])||!$('#rawCurrent').files[0];$('#rawCancel').hidden=!rawActive;$('#rawClose').disabled=rawActive}
function calculateRaw(rules,registry,draft=null){
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
  frame.onload=()=>{if(!ended)frame.contentWindow.postMessage({type:'neon-calculate-raw',request,rules,registry,rulesConfig:draft?.config||null,rulesName:draft?.name||'',reasons:$('#rawReasons').checked},location.origin)};
  frame.onerror=()=>fail('Не удалось загрузить локальный движок.');
  timeout=setTimeout(()=>fail('Превышено время расчёта. Проверьте файл и ресурсы браузера.'),20*60*1000);
  frame.src='engine.html?v=4.10.1-fix';document.body.appendChild(frame);
 });
}
$('#rawLoadBtn').addEventListener('click',()=>{$('#dataDialog').close();rawDialog.showModal();refreshRaw()});
for(const id of ['rawRules','rawCurrent','rawPrevious','rawUseDraft'])$('#'+id).addEventListener('change',refreshRaw);
$('#rawClose').addEventListener('click',()=>{if(!rawActive)rawDialog.close()});
rawDialog.addEventListener('cancel',e=>{if(rawActive)e.preventDefault()});
$('#rawCancel').addEventListener('click',()=>{rawCancelled=true;rawAbort?.()});
rawRun.addEventListener('click',async()=>{
 if(rawActive)return;
 const rules=$('#rawRules').files[0],cur=$('#rawCurrent').files[0],prev=$('#rawPrevious').files[0],draft=rawDraft&&$('#rawUseDraft').checked?rawDraft:null;
 if((!rules&&!draft)||!cur)return;
 rawActive=true;rawCancelled=false;refreshRaw();
 try{
  let a=null;rawInfo.textContent='Загружаю текущий реестр…';const b=await calculateRaw(rules,cur,draft);const date=$('#rawCurrentDate').value,priorDate=$('#rawPreviousDate').value;if(date)b.observedAt=date+'T12:00:00Z';if(prev&&date&&priorDate&&priorDate>=date)throw Error('Дата предыдущего реестра должна быть раньше текущего.');if(rawCancelled)throw Error('Расчёт отменён.');if(draft&&lastRaw?.ver===current?.ver&&lastRaw.cur===cur){rawInfo.textContent='Проверяю последствия правок…';const changes=await runAnalysis('preview',{previous:W.cleanSnapshot(current),current:b});if(!await confirmPreview(changes))throw Error('Применение отменено; прежние результаты сохранены.')}if(prev){rawInfo.textContent='Загружаю предыдущий реестр…';a=await calculateRaw(rules,prev,draft);if(priorDate)a.observedAt=priorDate+'T12:00:00Z'}if(rawCancelled)throw Error('Расчёт отменён.');const fresh=(draft?.placementIds||[]).filter(id=>!byId[id]&&b.map?.[id]!=null);await acceptSnapshots(b,a,'Excel · '+(draft?.name||rules.name));lastRaw={ver:b.ver,cur,prev};if(prefs.autoHistory){try{if(a?.observedAt)await saveHistorySnapshot(a);await saveHistorySnapshot(b)}catch(e){setStatus('Расчёт завершён, но история не сохранена: '+e.message)}}
  rawDialog.close();if(fresh.length){draft.placementIds=[];beginPlacement(fresh)}
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
 for(const id of ['idCheckBtn','reportBtn','filtersBtn','inspectToggle','diagnoseBtn','contractHistoryBtn'])$('#'+id).disabled=!!current.empty;
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
 section.innerHTML='<h3>Состав блока</h3><div class="info">Сумма долга + ГП: <b>'+ (stats.known?fmt(Math.round(stats.sum))+' ₽':'—')+'</b><br>Договоров с суммой: '+fmt(stats.known)+' из '+fmt(stats.count)+(debtDelta!==null?'<br>Изменение суммы: '+(debtDelta>0?'+':'')+fmt(Math.round(debtDelta))+' ₽':'')+(share!==null?'<br>Отношение к числу строк родителя: '+share.toLocaleString('ru-RU',{maximumFractionDigits:1})+'%':'')+'</div><button class="btn" data-members>Список договоров</button><button class="btn" data-export-block>Выгрузить Excel по блоку</button><button class="btn" data-distribution>Куда уходят должники</button><button class="btn" data-aging>Контроль застоя</button><button class="btn" data-block-history>Динамика блока</button><button class="btn" data-edit-rules>Редактировать правила</button>';
 root.appendChild(section);
 section.querySelector('[data-members]').addEventListener('click',()=>openRows(n.t+' · договоры','Состав текущего блока. Поиск и экспорт работают по всей выборке.',blockRowsFor(n.id)));
 section.querySelector('[data-export-block]').addEventListener('click',()=>rowExport(blockRowsFor(n.id),'Блок_'+n.id+'.xlsx'));
 section.querySelector('[data-distribution]').addEventListener('click',()=>showDistribution(n));
 section.querySelector('[data-aging]').addEventListener('click',()=>openAging(n.id));section.querySelector('[data-block-history]').addEventListener('click',openHistory);section.querySelector('[data-edit-rules]').addEventListener('click',()=>rulesEditor.open(n.id));
}
function showDistribution(n){
 let section=$('#distributionBox');if(section)section.remove();
 section=document.createElement('div');section.id='distributionBox';section.className='sect';$('#inspectorBody').appendChild(section);
 const kids=nodes.filter(k=>(current.own?.[k.id]||current.demo)&&(k.parents||[k.p]).includes(n.id)&&(k.bases||k.parents||[k.p]).includes(n.id));
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
 historyEntries=entries;const other=$('#historyOther');other.replaceChildren(new Option('Без второго блока',''));for(const n of nodes)if(n.id!==selected)other.appendChild(new Option(n.t,n.id));drawPeriod();
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
 if(!singleMode){const changes=[['ID договора','Откуда','Куда','Категория']];for(const r of allChangeRows())changes.push([r.id,r.from,r.to,r.kind]);sheets.push({name:'Изменения',rows:changes})}
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
function restoreLayout(){layoutKey='neon-layout-v4:'+String(current?.rulesName||'default');try{localLayout=JSON.parse(localStorage.getItem(layoutKey)||'{}')}catch{localLayout={}}try{lockedPositions=JSON.parse(localStorage.getItem('neon-layout-v4:locked-placements')||'{}');if(!lockedPositions||typeof lockedPositions!=='object'||Array.isArray(lockedPositions))lockedPositions={}}catch{lockedPositions={}}}
function canMoveCard(id){return viewEdit&&display==='graph'&&placementIds.has(id)&&!linkMode}
function startCardMove(e,id){
 if(!canMoveCard(id)||e.button!==0)return;e.stopPropagation();e.preventDefault();const p=viewPositions[id];if(!p)return;layoutDrag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,px:p.x,py:p.y};try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
}
window.addEventListener('pointermove',e=>{if(!layoutDrag||layoutDrag.pointer!==e.pointerId||!canMoveCard(layoutDrag.id))return;const m=layoutDrag,p={x:Math.max(CARD_W/2+BOARD_MARGIN,m.px+(e.clientX-m.x)/scale),y:Math.max(BOARD_MARGIN,m.py+(e.clientY-m.y)/scale)};viewPositions[m.id]=p;const next=calcSize(viewPositions);if(next.w>worldSize.w||next.h>worldSize.h){worldSize={w:Math.max(next.w,worldSize.w),h:Math.max(next.h,worldSize.h)};canvas.style.width=worldSize.w+'px';canvas.style.height=worldSize.h+'px';svg.setAttribute('width',worldSize.w);svg.setAttribute('height',worldSize.h);svg.setAttribute('viewBox','0 0 '+worldSize.w+' '+worldSize.h);setScale(scale)}const el=$$('.node').find(n=>n.dataset.id===m.id);if(el){el.style.left=p.x+'px';el.style.top=p.y+'px'}svg.querySelectorAll('.direction-defs,.base-edge').forEach(x=>x.remove());addStructuralEdges();highlight()});
function overlapsCard(id,p,positions){return Object.entries(positions).some(([other,q])=>other!==id&&Math.abs(q.x-p.x)<CARD_W+8&&Math.abs(q.y-p.y)<CARD_H+8)}
function finishCardMove(e){if(!layoutDrag||layoutDrag.pointer!==e.pointerId)return;const m=layoutDrag,id=m.id;layoutDrag=null;if(!canMoveCard(id))return;const p=viewPositions[id];if(e.type==='pointercancel'||overlapsCard(id,p,viewPositions)){placementDraft[id]={x:m.px,y:m.py};setStatus('Перемещение отменено: оставьте свободное место между карточками.')}else placementDraft[id]={x:p.x,y:p.y};renderDiagram(false)}
window.addEventListener('pointerup',finishCardMove);window.addEventListener('pointercancel',finishCardMove);
function updatePlacementUI(){document.body.classList.toggle('layout-edit',viewEdit);$('#placementControls').hidden=!viewEdit;$('#placementCount').textContent=placementIds.size+' новых блоков · перетащите только выделенные карточки'}
function cancelPlacement(redraw=true){if(!viewEdit)return;viewEdit=false;placementIds.clear();placementDraft={};layoutDrag=null;updatePlacementUI();if(redraw){renderDiagram(false);setStatus('Размещение отменено. Все блоки закреплены.')}}
function beginPlacement(ids){const fresh=ids.filter(id=>current?.map?.[id]!=null&&byId[id]);if(!fresh.length)return;cancelPlacement(false);linkMode=false;linkFrom=null;for(const id of fresh){delete lockedPositions[id];for(const key of Object.keys(localLayout))if(localLayout[key]&&typeof localLayout[key]==='object')delete localLayout[key][id]}setMode('graph');placementIds=new Set(fresh);placementDraft={};viewEdit=true;selected=fresh[0];updatePlacementUI();renderDiagram(false);const p=viewPositions[selected];if(p){setScale(Math.max(.55,Math.min(1,scale)));board.scrollLeft=Math.max(0,p.x*scale-board.clientWidth/2);board.scrollTop=Math.max(0,(p.y+CARD_H/2)*scale-board.clientHeight/2)}setStatus('Размещение новых блоков: остальные закреплены. Нажмите «Закрепить новые блоки».')}
function confirmPlacement(){if(!viewEdit||layoutDrag)return;const next={...lockedPositions};for(const id of placementIds){const p=viewPositions[id];if(!p||overlapsCard(id,p,viewPositions)){setStatus('Новый блок перекрывает соседний. Переместите его в свободное место.');return}next[id]={x:p.x,y:p.y}}try{localStorage.setItem('neon-layout-v4:locked-placements',JSON.stringify(next))}catch{setStatus('Не удалось сохранить расположение. Освободите место в хранилище браузера.');return}lockedPositions=next;cancelPlacement(false);renderDiagram(false);setStatus('Новые блоки закреплены. Перемещение карточек запрещено.')}

let viewTimer=null;function saveViewSoon(){if(!prefs.restore||!current||current.empty)return;clearTimeout(viewTimer);viewTimer=setTimeout(()=>{prefs.view={scale,left:board.scrollLeft,top:board.scrollTop,branch,display,minAmt:$('#minAmt').value,death:$('#deathFilter').value,cessions:[...cessionSelected]};W.savePrefs()},180)}
function applyPrefs(){
 $('#perfMode').value=prefs.performance==='motion'?'motion':'fast';$('#autoHistoryToggle').checked=!!prefs.autoHistory;$('#chainToggle').checked=!!prefs.chain;document.body.dataset.theme=prefs.theme;document.body.classList.toggle('show-codes',prefs.codes);$('#themeSelect').value=prefs.theme;$('#codesToggle').checked=prefs.codes;$('#minimapToggle').checked=prefs.minimap;$('#restoreViewToggle').checked=prefs.restore;$('#minimapBox').hidden=!prefs.minimap;liveLinks=prefs.live;W.savePrefs()
}
function openData(){updateDataSummary();$('#dataDialog').showModal()}
$('#dataBtn').addEventListener('click',openData);$('#welcomeData').addEventListener('click',openData);$('#welcomeDemo').addEventListener('click',turnDemo);
$$('[data-workspace=funnel]').forEach(b=>b.addEventListener('click',()=>setMode('vertical')));
const rulesEditor=window.FlowRules.create({
 context:()=>({key:current?.empty||current?.demo?'baseline':String(current?.ver||current?.file||'snapshot'),config:current?.rulesConfig||null,columns:current?.rulesColumns||[],name:current?.rulesName||'',legacy:!!current&&!current.empty&&!current.demo&&!current.rulesConfig}),
 apply:(config)=>{
  rawDraft={config,name:'Локальные правила · '+new Date().toLocaleString('ru-RU'),placementIds:Object.keys(config).filter(id=>!id.startsWith('__')&&!byId[id])};
  const matching=lastRaw&&lastRaw.ver===current?.ver&&$('#rawCurrent').files[0]===lastRaw.cur&&($('#rawPrevious').files[0]||undefined)===(lastRaw.prev||undefined);
  if(!matching){$('#rawCurrent').value='';$('#rawPrevious').value=''}
  $('#rawUseDraft').checked=true;rawDialog.showModal();refreshRaw();
  rawInfo.textContent=matching?'Правки сохранены локально. Пересчёт двух реестров использует одинаковые правила.':'Правки сохранены. Выберите исходный реестр для пересчёта; прежние цифры пока не изменены.';
  if(matching)rawRun.click();
 }
});
$('#rulesBtn').addEventListener('click',()=>rulesEditor.open(selected));
$('#filtersBtn').addEventListener('click',()=>{paintCessions();$('#filtersDialog').showModal()});$('#cessionSearch').addEventListener('input',paintCessions);$('#filtersApply').addEventListener('click',()=>{$('#filtersDialog').close();recompute().catch(e=>setStatus('Фильтры не рассчитаны: '+e.message));saveViewSoon()});$('#filtersReset').addEventListener('click',()=>{$('#minAmt').value='';$('#deathFilter').value='all';cessionSelected.clear();paintCessions();recompute().catch(e=>setStatus('Фильтры не рассчитаны: '+e.message));saveViewSoon()});
$('#settingsBtn').addEventListener('click',()=>$('#settingsDialog').showModal());$('#themeSelect').addEventListener('change',e=>{prefs.theme=e.target.value;applyPrefs()});$('#codesToggle').addEventListener('change',e=>{prefs.codes=e.target.checked;applyPrefs()});$('#minimapToggle').addEventListener('change',e=>{prefs.minimap=e.target.checked;applyPrefs();drawMinimap()});$('#restoreViewToggle').addEventListener('change',e=>{prefs.restore=e.target.checked;if(!prefs.restore)prefs.view=null;applyPrefs()});$('#liveLinksBtn').addEventListener('click',()=>{prefs.live=liveLinks;W.savePrefs()});
$('#collapseBtn').addEventListener('click',()=>{collapsed=!collapsed;$('#collapseBtn').setAttribute('aria-pressed',String(collapsed));$('#collapseBtn').classList.toggle('on',collapsed);highlight()});
$('#branchMobile').addEventListener('change',()=>{$('#collapseBtn').disabled=branch==='all';if(branch==='all'){collapsed=false;$('#collapseBtn').classList.remove('on');$('#collapseBtn').setAttribute('aria-pressed','false');highlight()}});
$('#fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.body.classList.toggle('fullscreen-fallback')}});
$('#presentBtn').addEventListener('click',()=>{presentation=!presentation;document.body.classList.toggle('presentation',presentation);$('#presentBtn').textContent=presentation?'Вернуть панели':'На весь экран';if(presentation){$('#inspector').classList.remove('open');requestAnimationFrame(fitAll)}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&presentation){presentation=false;document.body.classList.remove('presentation');$('#presentBtn').textContent='На весь экран'}});
$('#minimap').addEventListener('click',e=>{pauseForManualNavigation();const svg=$('#minimap'),r=svg.getBoundingClientRect(),sz=worldSize,ratio=Math.min(r.width/sz.w,r.height/sz.h);if(!ratio)return;const x=(e.clientX-r.left-(r.width-sz.w*ratio)/2)/ratio,y=(e.clientY-r.top-(r.height-sz.h*ratio)/2)/ratio;board.scrollLeft=x*scale-board.clientWidth/2;board.scrollTop=y*scale-board.clientHeight/2});
board.addEventListener('scroll',()=>{updateMinimapViewport();saveViewSoon()});
$('#historyBtn').addEventListener('click',openHistory);$('#historyOpen').addEventListener('click',async()=>{try{const after=await W.get($('#historyAfter').value),before=$('#historyBefore').value?await W.get($('#historyBefore').value):null;if(!after)throw Error('Выберите текущий снимок');await acceptSnapshots(after.snapshot,before&&before.id!==after.id?before.snapshot:null,'Локальная история');$('#historyDialog').close()}catch(e){$('#historyStatus').textContent=e.message}});
$('#saveSnapBtn').addEventListener('click',async()=>{try{await saveHistorySnapshot(current);$('#dataSummary').textContent='Снимок сохранён в этом браузере. '+current.file}catch(e){$('#dataSummary').textContent='Ошибка: '+e.message}});
$('#downloadSnapBtn').addEventListener('click',()=>{if(realData()){const snap=W.cleanSnapshot(current);if(!singleMode)snap.previous=W.cleanSnapshot(previous);W.download(new Blob([JSON.stringify(snap)],{type:'application/json'}),'NEON_FLOW_снимок.json')}});
$('#reportBtn').addEventListener('click',report);
$('#idCheckBtn').addEventListener('click',()=>{$('#dataDialog').close();$('#idsDialog').showModal()});$('#idRun').addEventListener('click',()=>{const rows=[];for(const id of new Set($('#idText').value.split(/[;\r\n\t]+/).map(cleanID).filter(Boolean))){const i=current.idx.get(id);rows.push({id,from:'—',to:i==null?'—':membership(current,i).filter(code=>code==='root'||current.own?.[code]).join('; '),kind:i==null?'Не найден':current.duplicate.has(id)?'Дублируется ID; показана первая строка':'Найден'})}$('#idsDialog').close();openRows('Проверка ID','Проверка по текущему снимку, без фильтров.',rows)});
$('#placementSave').addEventListener('click',confirmPlacement);$('#placementCancel').addEventListener('click',()=>cancelPlacement());
function startEmpty(){
 setSchema();const map={},sets={},own={},labels={},sig={};for(const n of nodes){map[n.id]=n.id;sets[n.id]='';own[n.id]=1;labels[n.id]=n.t;sig[n.id]='empty'}
 const s={v:1,n:0,ids:[],map,sets,own,labels,sig,file:'Реестр не загружен',amt:[],dd:[],empty:true};
 singleMode=true;current=prepareSnapshot(s);previous=current;applyPrefs();restoreLayout();syncCompareControls();setModeButtons();recompute(true);$('#welcome').hidden=false;
}

let linkMode=false,linkFrom=null,computeJob=0,flowMetric='count',flowLimit=0,changedOnly=false,historyEntries=[],diagnosticRows=[],agingRows=[];
function runAnalysis(action,payload){return new Promise((resolve,reject)=>{let worker;try{worker=new Worker('analysis-worker.js?v=4.9')}catch(e){reject(e);return}const timer=setTimeout(()=>finish(Error('Превышено время анализа')),20*60*1000);function finish(error,result){clearTimeout(timer);worker.terminate();error?reject(error):resolve(result)}worker.onmessage=e=>e.data.ok?finish(null,e.data.result):finish(Error(e.data.error));worker.onerror=e=>finish(Error(e.message||'Ошибка фонового анализа'));try{worker.postMessage({action,...payload})}catch(e){finish(e)}})}
function tableRows(target,rows,fields){target.replaceChildren();for(const r of rows){const tr=document.createElement('tr');for(const key of fields){const td=document.createElement('td');td.textContent=typeof key==='function'?key(r):r[key]??'—';tr.appendChild(td)}target.appendChild(tr)}}
function exportTable(name,headers,rows){return W.exportXlsx([{name:'Отчёт',rows:[headers,...rows]}],name)}
function saveHistorySnapshot(s){const prepared=s.bitsets?s:prepareSnapshot(s),counts={},debts={};for(const id of Object.keys(prepared.bitsets)){if(id!=='root'&&!prepared.own?.[id])continue;const stat=W.blockStats(prepared,id,null);counts[id]=stat.count;debts[id]={sum:stat.known?stat.sum:null,known:stat.known,count:stat.count}}return W.save(prepared,counts,debts)}
function closeData(){if($('#dataDialog').open)$('#dataDialog').close()}
$('#diagnoseBtn').addEventListener('click',async()=>{if(!current||current.empty)return;closeData();$('#diagnosticDialog').showModal();$('#diagnosticStatus').textContent='Проверяю в фоновом потоке…';$('#diagnosticRows').replaceChildren();$('#diagnosticExport').disabled=true;try{diagnosticRows=await runAnalysis('diagnose',{current:W.cleanSnapshot(current),previous:!singleMode,analysis:singleMode?null:{beforeCount:analysis.beforeCount,blockAdded:analysis.blockAdded,blockRemoved:analysis.blockRemoved},nodes,opts:filterOptions()});tableRows($('#diagnosticRows'),diagnosticRows,['type','code',r=>r.count==null?'—':fmt(r.count),'note']);$('#diagnosticStatus').textContent='Проверок / замечаний: '+fmt(diagnosticRows.length)+'. Пересечения и разница строк/ID не обязательно ошибки.';$('#diagnosticExport').disabled=false}catch(e){$('#diagnosticStatus').textContent=e.message}});
$('#diagnosticExport').addEventListener('click',()=>exportTable('Диагностика.xlsx',['Проверка','Блок','Количество','Пояснение'],diagnosticRows.map(r=>[r.type,r.code,r.count??'',r.note])).catch(e=>$('#diagnosticStatus').textContent=e.message));
function openContract(id=''){closeData();if(!$('#contractDialog').open)$('#contractDialog').showModal();$('#contractId').value=id;$('#contractTimeline').replaceChildren();$('#contractStatus').textContent='История по локальным снимкам, без восстановления неизвестных промежуточных событий.';if(id)$('#contractRun').click()}
$('#contractHistoryBtn').addEventListener('click',()=>openContract());
$('#contractRun').addEventListener('click',async()=>{const id=cleanID($('#contractId').value);if(!id||!current||current.empty){$('#contractStatus').textContent='Введите ID и загрузите реестр.';return}$('#contractRun').disabled=true;$('#contractStatus').textContent='Читаю историю…';try{const records=await runAnalysis('timeline',{current:W.cleanSnapshot(current),previous:!singleMode&&previous.observedAt?W.cleanSnapshot(previous):null,id}),box=$('#contractTimeline');box.replaceChildren();const seen=new Set();for(const r of records){const k=JSON.stringify(r);if(seen.has(k))continue;seen.add(k);const row=document.createElement('div');row.className='history-event';const title=document.createElement('strong');title.textContent=(r.at?new Date(r.at).toLocaleString('ru-RU'):'Дата неизвестна')+' · '+r.file;const p=document.createElement('p');p.textContent=r.duplicate?'Дубли ID — состав не определён':!r.exists?'Нет в снимке':r.blocks.map(b=>b.name+' ['+b.id+']').join(' · ');const amount=document.createElement('span');amount.textContent=r.amount==null?'Сумма неизвестна':fmt(r.amount)+' ₽';row.append(title,p,amount);box.appendChild(row)}$('#contractStatus').textContent='ID '+id+' · '+seen.size+' наблюдений. Смена правил может менять принадлежность без фактической работы.'}catch(e){$('#contractStatus').textContent=e.message}finally{$('#contractRun').disabled=false}});
async function openAging(code){$('#agingDialog').showModal();$('#agingStatus').textContent='Проверяю сохранённые снимки…';$('#agingBuckets').replaceChildren();$('#agingExport').disabled=true;try{const r=await runAnalysis('aging',{current:W.cleanSnapshot(current),code,opts:filterOptions()});agingRows=r.rows;$('#agingStatus').textContent=(byId[code]?.t||code)+' · '+r.used+' предыдущих сопоставимых снимков. Дни между первой и последней непрерывной фиксацией; это не точный срок нахождения. Дубли исключены.';for(const [name,min,max] of [['Только текущий снимок',-1,-1],['До 7 дней',0,7],['8–14 дней',8,14],['15–30 дней',15,30],['31–60 дней',31,60],['Более 60 дней',61,Infinity]]){const group=r.rows.filter(x=>min<0?x.observations===1:x.observations>1&&x.days>=min&&x.days<=max),b=document.createElement('button');b.className='distribution-row';b.textContent=name+' · '+fmt(group.length);b.addEventListener('click',()=>{$('#agingDialog').close();openRows(name,'Период между наблюдениями; не фактическая дата начала этапа.',group.map(x=>({id:x.id,from:code,to:code,kind:x.observations===1?'Стаж неизвестен':x.days+' дней / '+x.observations+' снимков',amount:x.amount})))});$('#agingBuckets').appendChild(b)}$('#agingExport').disabled=false}catch(e){$('#agingStatus').textContent=e.message}}
$('#agingExport').addEventListener('click',()=>exportTable('Контроль застоя.xlsx',['ID','Дней наблюдения','Снимков','Сумма'],agingRows.map(r=>[r.id,r.observations>1?r.days:'Неизвестно',r.observations,r.amount??''])).catch(e=>$('#agingStatus').textContent=e.message));
function confirmPreview(rows){return new Promise(resolve=>{const dlg=$('#previewDialog'),changed=rows.filter(r=>r.added||r.removed||r.ruleChanged||r.before!==r.after);tableRows($('#previewRows'),changed,[r=>r.name+' ['+r.id+']',r=>r.before??'—',r=>r.after??'—',r=>'+'+fmt(r.added)+' / −'+fmt(r.removed),r=>(r.beforeDebt==null?'—':fmt(Math.round(r.beforeDebt)))+' / '+(r.afterDebt==null?'—':fmt(Math.round(r.afterDebt)))]);$('#previewStatus').textContent='Затронуто блоков: '+changed.length+'. Суммы только по известным значениям, строки разных блоков могут пересекаться.';let result=false;$('#previewConfirm').onclick=()=>{result=true;dlg.close()};$('#previewReject').onclick=()=>dlg.close();dlg.addEventListener('close',()=>resolve(result),{once:true});dlg.showModal()})}
function drawPeriod(){const from=$('#historyStart').value,to=$('#historyEnd').value,metric=$('#historyMetric').value,other=$('#historyOther').value,entries=historyEntries.filter(e=>{const day=String(e.at).slice(0,10);return (!from||day>=from)&&(!to||day<=to)});const box=$('#historyChart');box.replaceChildren();const ids=[selected,...(other?[other]:[])],get=(e,id)=>metric==='debt'?e.debts?.[id]?.sum:e.counts?.[id],values=entries.flatMap(e=>ids.map(id=>get(e,id))).filter(Number.isFinite);$('#historyChartTitle').textContent='Динамика · '+(metric==='debt'?'долг':'строки');if(!values.length){box.textContent='Нет данных за период. Для старых снимков суммы могли не сохраняться.';return}const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 160');const min=Math.min(...values),max=Math.max(...values);ids.forEach((id,j)=>{let prev=null;entries.forEach((e,i)=>{const v=get(e,id);if(!Number.isFinite(v)){prev=null;return}const x=30+i*540/Math.max(1,entries.length-1),y=130-(v-min)/Math.max(1,max-min)*100;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',4);c.setAttribute('fill',j?'#d5b17d':'#8ab7da');const t=document.createElementNS(ns,'title');t.textContent=String(e.at)+' · '+fmt(Math.round(v));c.appendChild(t);if(prev){const l=document.createElementNS(ns,'line');for(const [k,val] of Object.entries({x1:prev.x,y1:prev.y,x2:x,y2:y,stroke:j?'#d5b17d':'#8ab7da','stroke-width':2}))l.setAttribute(k,val);svg.appendChild(l)}svg.appendChild(c);prev={x,y}})});box.appendChild(svg);for(const id of ids){const p=document.createElement('p'),vals=entries.map(e=>get(e,id)).filter(Number.isFinite);p.textContent=(byId[id]?.t||id)+': '+(vals.length?fmt(Math.round(vals[0]))+' → '+fmt(Math.round(vals.at(-1)))+' · изменение '+fmt(Math.round(vals.at(-1)-vals[0])):'нет данных');box.appendChild(p)}}
for(const id of ['historyStart','historyEnd','historyMetric','historyOther'])$('#'+id).addEventListener('change',drawPeriod);
$('#flowMetric').addEventListener('change',e=>{flowMetric=e.target.value;showFlow()});$('#flowLimit').addEventListener('change',e=>{flowLimit=Number(e.target.value);showFlow()});$('#changedOnly').addEventListener('click',()=>{changedOnly=!changedOnly;$('#changedOnly').setAttribute('aria-pressed',String(changedOnly));$('#changedOnly').classList.toggle('on',changedOnly);highlight()});
$('#linkModeBtn').addEventListener('click',()=>{if(current.empty){setStatus('Сначала загрузите реестр или демо.');return}$('#settingsDialog').close();cancelPlacement();if(display!=='graph')setMode('graph');linkMode=true;linkFrom=null;setStatus('Создание связи: нажмите исходный блок, затем блок назначения. Esc — отмена.')});window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&linkMode){linkMode=false;linkFrom=null;setStatus('Создание связи отменено.')}else if(ev.key==='Escape'&&viewEdit&&!document.querySelector('dialog[open]'))cancelPlacement()});
$('#autoHistoryToggle').addEventListener('change',e=>{prefs.autoHistory=e.target.checked;W.savePrefs()});$('#chainToggle').addEventListener('change',e=>{prefs.chain=e.target.checked;W.savePrefs();highlight()});
$('#backupBtn').addEventListener('click',()=>{const settings={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='neon-workspace-v4'||k.startsWith('neon-layout-v4:')||k.startsWith('neon-rules-v44-'))settings[k]=localStorage.getItem(k)}W.download(new Blob([JSON.stringify({type:'neon-settings-v1',settings},null,2)],{type:'application/json'}),'NEON_настройки.json')});
$('#restoreBackupBtn').addEventListener('click',()=>$('#backupFile').click());$('#backupFile').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;const data=JSON.parse(await f.text());if(data.type!=='neon-settings-v1'||!data.settings||typeof data.settings!=='object')throw Error('Неверный формат');const pairs=Object.entries(data.settings);if(pairs.some(([k,v])=>!(k==='neon-workspace-v4'||k.startsWith('neon-layout-v4:')||k.startsWith('neon-rules-v44-'))||typeof v!=='string'))throw Error('Недопустимые параметры');if(!confirm('Восстановить локальные настройки? После этого перезагрузите страницу.'))return;for(const [k,v] of pairs)localStorage.setItem(k,v);$('#dataSummary').textContent='Настройки восстановлены. Перезагрузите страницу для применения.'}catch(err){$('#dataSummary').textContent=err.message}finally{e.target.value=''}});

let mapView='count',attentionOpen=false,attentionMap=new Map(),detailAll=[],detailFiltered=[],detailPage=0,detailTimer=null,detailSize=100,menu=null;
function compactMoney(n){const v=Math.abs(n),unit=v>=1e9?[1e9,' млрд']:v>=1e6?[1e6,' млн']:v>=1e3?[1e3,' тыс.']:[1,''];return (n/unit[0]).toLocaleString('ru-RU',{maximumFractionDigits:unit[0]===1?0:1})+unit[1]}
let attentionDiagnostics=[],attentionChecking=false,attentionChecked=false,attentionError='';
function rebuildAttention(){
 attentionMap=new Map();if(!current||current.empty||!analysis){$('#attentionBtn').textContent='Внимание';$('#attentionBtn').disabled=true;return}
 const add=(id,label,count,kind)=>{if(!attentionMap.has(id))attentionMap.set(id,[]);attentionMap.get(id).push({label,count,kind})};
 for(const n of nodes){const id=n.id,s=currentStats[id]||{},old=analysis.beforeCount[id]||0,now=analysis.afterCount[id]||0;
 if(s.noRule)continue;
 if(!singleMode&&id!=='root'&&old>=20&&Math.abs(now-old)/old>=.30)add(id,'Изменение ≥ 30%',now-old,'delta');
 if(!singleMode)for(const [key,label] of [['other','Неоднозначный маршрут'],['rules','Изменены правила'],['filter','Изменён фильтр']]){const count=comparisonCounts.get(key)?.get(id)||0;if(count)add(id,label,count,key)}
 if(s.count>s.known&&Array.isArray(current.amt))add(id,'Неизвестная сумма',s.count-s.known,'amount');
 }
 for(const d of attentionDiagnostics){if(!byId[d.code]||!d.count)continue;if(d.type==='Не попали в дочерние')add(d.code,'Не прошли дальше',d.count,'lost');if(d.type==='Пересечение дочерних')add(d.code,'Пересечение дочерних',d.count,'overlap')}
 $('#attentionBtn').disabled=false;$('#attentionBtn').textContent='Внимание'+(attentionMap.size?' · '+fmt(attentionMap.size):'');$('#attentionBtn').classList.toggle('on',attentionOpen||mapView==='attention');
}
function focusBlock(id){if(!byId[id])return;const p=viewPositions[id];if(!p)return;if(branch!=='all'&&branchOf(id)!==branch&&!['root','dead'].includes(id)){branch='all';$('#branchMobile').value='all';setBranchButtons();syncFlows()}setScale(Math.min(1.2,Math.max(.8,scale)));board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth*.5),top:Math.max(0,(p.y+CARD_H/2)*scale-board.clientHeight*.45),behavior:'smooth'});chooseNode(id,true)}
function renderAttention(){
 const root=$('#inspectorBody');root.replaceChildren();$('#inspectorLabel').textContent='Зоны внимания';
 const info=document.createElement('div');info.className='info';info.textContent=attentionMap.size?attentionMap.size+' блоков с признаками для проверки. Это не автоматически ошибки. Застой проверяется по истории. Непопадание в дочерние блоки проверяется дополнительным анализом.':'По текущим быстрым проверкам замечаний нет. Это не заменяет полную диагностику.';root.appendChild(info);const check=document.createElement('button');check.className='btn';check.textContent=attentionChecking?'Проверяю дочерние блоки…':attentionChecked?'Дочерние блоки проверены':'Проверить распределение по блокам';check.disabled=attentionChecking||attentionChecked;check.addEventListener('click',checkAttention);root.appendChild(check);if(attentionError){const p=document.createElement('p');p.className='attention-note';p.textContent=attentionError;root.appendChild(p)}
 for(const [id,issues] of attentionMap){const n=byId[id],b=document.createElement('button');b.className='attention-item';const title=document.createElement('strong');title.textContent=n?.t||id;b.appendChild(title);for(const r of issues){const p=document.createElement('small');p.textContent=r.label+(r.count==null?'':' · '+(r.kind==='delta'&&r.count>0?'+':'')+fmt(r.count));b.appendChild(p)}b.addEventListener('click',()=>{attentionOpen=false;focusBlock(id)});root.appendChild(b)}
 const diag=document.createElement('button');diag.className='btn';diag.textContent='Полная диагностика';diag.addEventListener('click',()=>$('#diagnoseBtn').click());root.appendChild(diag)
}
async function checkAttention(){if(attentionChecking||attentionChecked||!current||current.empty)return;const job=computeJob;attentionChecking=true;attentionError='';if(attentionOpen)renderAttention();try{const rows=await runAnalysis('diagnose',{current:W.cleanSnapshot(current),previous:false,analysis:null,nodes,opts:filterOptions()});if(job!==computeJob)return;attentionDiagnostics=rows;attentionChecked=true}catch(e){if(job===computeJob)attentionError='Проверка не выполнена: '+e.message}finally{if(job===computeJob){attentionChecking=false;renderDiagram(false)}}}
function enhanceInspector(){
 $('#inspectorLabel').textContent='Выбранный блок';const root=$('#inspectorBody'),n=byId[selected],id=n.id,stat=currentStats[id]||{},issues=attentionMap.get(id)||[];
 // Keep original data and handlers; surface work actions first, collapse technical detail.
 const old=root.querySelector('.block-tools');if(old){const controls=document.createElement('div');controls.className='quick-actions';const title=document.createElement('h3');title.textContent='Что делать';controls.appendChild(title);
 const actions=[['data-members','Договоры'],['data-distribution','Распределение'],['data-aging','Проверить застой'],['data-export-block','Excel'],['data-block-history','Динамика'],['data-edit-rules','Правила']];
 for(const [attr,label] of actions){const b=old.querySelector('['+attr+']');if(b){b.textContent=label;controls.appendChild(b)}}
 const head=root.querySelector('.selected-block');if(head){const s=document.createElement('div');s.className='quick-total';s.textContent=stat.noRule?'Не рассчитан':fmt(stat.count||0)+' строк'+(stat.known?' · '+compactMoney(stat.sum)+' ₽'+(stat.known<stat.count?'*':''):'');head.appendChild(s);head.after(controls)}else root.prepend(controls);
 const detail=document.createElement('details');detail.className='technical-info';const summary=document.createElement('summary');summary.textContent='Состав и пояснения';detail.appendChild(summary);old.before(detail);detail.appendChild(old)
 }
 if(issues.length){const p=document.createElement('div');p.className='attention-note';p.textContent='Проверить: '+issues.map(r=>r.label+(r.count==null?'':' ('+fmt(r.count)+')')).join(' · ');const controls=root.querySelector('.quick-actions');controls?.after(p);if(issues.some(r=>r.kind==='lost'||r.kind==='overlap')){const b=document.createElement('button');b.className='btn';b.textContent='Открыть распределение и причины';b.addEventListener('click',()=>showDistribution(n));p.appendChild(b)}}
 if(!singleMode){const p=document.createElement('div');p.className='quick-directions';for(const [label,flows] of [['Куда ушли',analysis.flows.filter(f=>f.from===id)],['Откуда пришли',analysis.flows.filter(f=>f.to===id)]]){const section=document.createElement('section');const heading=document.createElement('h3');heading.textContent=label+' · '+fmt(flows.reduce((s,f)=>s+f.count,0));section.appendChild(heading);for(const f of flows.sort((a,b)=>b.count-a.count)){const b=document.createElement('button');b.className='flowrow';const other=f.from===id?f.to:f.from;b.innerHTML='<span>'+esc(byId[other]?.t||other)+'</span><b>'+fmt(f.count)+'</b>';b.addEventListener('click',()=>openFlowDetails(f));section.appendChild(b)}if(!flows.length){const t=document.createElement('small');t.textContent='Нет однозначных переходов';section.appendChild(t)}p.appendChild(section)}const note=root.querySelector('.attention-note')||root.querySelector('.quick-actions');note?.after(p);for(const section of [...root.querySelectorAll('.sect')]){if(section.querySelector('[data-flowkey]')||section.querySelector('h3')?.textContent==='Подтверждённые переходы')section.hidden=true;if(section.querySelector('h3')?.textContent==='Как рассчитано'){const d=document.createElement('details');d.className='technical-info';const s=document.createElement('summary');s.textContent='Как рассчитано';d.appendChild(s);section.before(d);d.appendChild(section)}}}
}
function enrichRow(r){let amount=r.amount;const i=current?.idx?.get(cleanID(r.id));if((amount==null||amount==='')&&i!==undefined&&!current.duplicate.has(cleanID(r.id))&&r.kind!=='ID выбыл из реестра')amount=current.amt?.[i]??'';if((amount==null||amount==='')&&r.kind==='ID выбыл из реестра'){const j=previous?.idx?.get(cleanID(r.id));if(j!==undefined&&!previous.duplicate.has(cleanID(r.id)))amount=previous.amt?.[j]??''}return {...r,amount}}
function refreshDetailRows(){const q=$('#detailSearch').value.trim().toLowerCase(),sort=$('#detailSort').value;detailFiltered=q?detailAll.filter(r=>[r.id,r.from,r.to,r.kind].some(x=>String(x??'').toLowerCase().includes(q))):detailAll;if(sort!=='original'){detailFiltered=detailFiltered.slice();if(sort==='id')detailFiltered.sort((x,y)=>String(x.id).localeCompare(String(y.id),'ru',{numeric:true}));else detailFiltered.sort((x,y)=>Number(enrichRow(y).amount||0)-Number(enrichRow(x).amount||0))}detailPage=0;paintDetailPage()}
function paintDetailPage(){const pages=Math.max(1,Math.ceil(detailFiltered.length/detailSize));detailPage=Math.min(pages-1,Math.max(0,detailPage));const body=$('#detailsRows');body.replaceChildren();const start=detailPage*detailSize;detailFiltered.slice(start,start+detailSize).forEach((raw,i)=>{const r=enrichRow(raw),tr=document.createElement('tr');for(const [col,v] of [start+i+1,r.id,r.from,r.to,r.amount==null||r.amount===''?'—':fmt(Number(r.amount)),r.kind].entries()){const td=document.createElement('td');td.textContent=v??'—';if(col===1&&r.id!=null){const b=document.createElement('button');b.className='id-link';b.textContent=r.id;b.addEventListener('click',()=>{$('#detailsDialog').close();openContract(r.id)});td.replaceChildren(b)}tr.appendChild(td)}body.appendChild(tr)});$('#detailPage').textContent=fmt(detailFiltered.length)+' строк · '+(detailPage+1)+' / '+pages;$('#detailPrev').disabled=detailPage===0;$('#detailNext').disabled=detailPage>=pages-1}
function openBlockMenu(ev,id){menu?.remove();menu=document.createElement('div');menu.className='block-menu';const items=[['Открыть блок',()=>focusBlock(id)],['Договоры',()=>openRows(byId[id].t,'Состав блока по текущей выборке.',blockRowsFor(id))],['Выгрузить Excel',()=>rowExport(blockRowsFor(id),'Блок_'+id+'.xlsx')],['Распределение',()=>{chooseNode(id,true);showDistribution(byId[id])}],['Правила',()=>rulesEditor.open(id)]];for(const [label,fn] of items){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>{menu?.remove();menu=null;fn()});menu.appendChild(b)}document.body.appendChild(menu);menu.style.left=Math.max(4,Math.min(ev.clientX,innerWidth-menu.offsetWidth-4))+'px';menu.style.top=Math.max(4,Math.min(ev.clientY,innerHeight-menu.offsetHeight-4))+'px'}
$('#mapView').addEventListener('change',e=>{mapView=e.target.value;document.body.dataset.mapview=mapView;attentionOpen=false;if(mapView==='debt'){flowMetric='debt';$('#flowMetric').value='debt'}else{flowMetric='count';$('#flowMetric').value='count'}renderDiagram(false)});
$('#attentionBtn').addEventListener('click',()=>{attentionOpen=true;mapView='attention';$('#mapView').value=mapView;document.body.dataset.mapview=mapView;renderDiagram(false);$('#inspector').classList.add('open');checkAttention()});
$('#flowAdvanced').addEventListener('click',()=>{const open=$('#motionPanel').classList.toggle('advanced-open');$('#flowAdvanced').setAttribute('aria-expanded',String(open))});
$('#detailSearch').addEventListener('input',()=>{clearTimeout(detailTimer);detailTimer=setTimeout(refreshDetailRows,200)});$('#detailSort').addEventListener('change',refreshDetailRows);$('#detailPrev').addEventListener('click',()=>{detailPage--;paintDetailPage()});$('#detailNext').addEventListener('click',()=>{detailPage++;paintDetailPage()});$('#detailsXlsx').addEventListener('click',()=>exportTable('Договоры_выборка.xlsx',['ID','Из блока','В блок','Сумма долга','Категория'],detailFiltered.map(raw=>{const r=enrichRow(raw);return[r.id,r.from,r.to,r.amount??'',r.kind]})).catch(e=>setStatus(e.message)));
$('#perfMode').addEventListener('change',e=>{prefs.performance=e.target.value;W.savePrefs();structureMotionKey='';showFlow()});
$('#pinInspector').addEventListener('click',()=>{prefs.pinInspector=!prefs.pinInspector;$('#pinInspector').setAttribute('aria-pressed',String(prefs.pinInspector));document.body.classList.toggle('inspector-pinned',prefs.pinInspector);W.savePrefs()});
const grip=$('#inspectorGrip');function setPanelWidth(w){w=Math.max(320,Math.min(740,Math.min(innerWidth-20,w)));document.body.style.setProperty('--inspector-width',w+'px');prefs.inspectorWidth=w;W.savePrefs()}
grip.addEventListener('pointerdown',e=>{e.preventDefault();grip.setPointerCapture(e.pointerId)});grip.addEventListener('pointermove',e=>{if(grip.hasPointerCapture(e.pointerId))setPanelWidth(innerWidth-e.clientX)});grip.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setPanelWidth((prefs.inspectorWidth||410)+(e.key==='ArrowLeft'?20:-20))}});
document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)){menu.remove();menu=null}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){menu.remove();menu=null}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search').focus()}});
document.body.classList.toggle('inspector-pinned',!!prefs.pinInspector);$('#pinInspector').setAttribute('aria-pressed',String(!!prefs.pinInspector));if(prefs.inspectorWidth)document.body.style.setProperty('--inspector-width',prefs.inspectorWidth+'px');
startEmpty();
})();
