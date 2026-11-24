(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], fmt=n=>Number(n||0).toLocaleString('ru-RU'), esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const colors={root:'#35e0f8',cyan:'#35e0f8',mag:'#f849ae',vio:'#9d89ff',lime:'#79edb1',amber:'#fac97f',red:'#fb7d94'};
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
function validSnap(s){return!!(s&&Array.isArray(s.ids)&&s.map&&s.sets&&Number.isInteger(s.n))}
function prepareSnapshot(s){if(!validSnap(s))throw Error('Неверный формат: ожидается снимок с полями ids, map и sets');const idx=new Map(),duplicate=new Set();s.ids.forEach((raw,i)=>{const id=cleanID(raw);if(!id)return;if(idx.has(id)){duplicate.add(id)}else idx.set(id,i)});
 const bitsets={};const decoded={};for(const id of nodeIds){const key=s.map[id];if(key==null)continue;try{if(!decoded[key])decoded[key]=base64ToBytes(s.sets[key]);bitsets[id]=decoded[key]}catch{}}
 return{...s,idx,duplicate,bitsets};}
function membership(s,i){if(!s||i==null||i<0)return[];const out=[];for(const code of nodeIds){const bits=s.bitsets[code];if(bits&&(bits[i>>3]&(1<<(i&7))))out.push(code)}return out;}
function visible(s,i){if(!s||i==null||i<0)return false;const sum=Number($('#minAmt').value)||0;if(sum){if(!s.amt)return true;const v=s.amt[i];if(v==null||Number(v)<sum)return false}
 const death=$('#deathFilter').value;if(death!=='all'&&Array.isArray(s.dd)){const d=s.dd[i];if(d!=null){const now=new Date(),lim=Date.UTC(now.getFullYear(),now.getMonth()-5,now.getDate())/86400000;const isRecent=Number(d)>=lim;if(death==='old'&&isRecent)return false;if(death==='recent'&&!isRecent)return false}}
 return true;}
let singleMode=false,rawWarnings="",previous=null,current=null,analysis=null,display='vertical',branch='all',selected='A1',scale=.7,playing=true,flowIndex=0,filteredFlows=[],viewPositions={},renderVersion=0;
const canvas=$('#canvas'),board=$('#board'),wrap=$('#canvasWrap'),svg=$('#edges'),layer=$('#nodeLayer'),badges=$('#badgeLayer');
function analyze(before,after){const beforeCount={},afterCount={},blockAdded={},blockRemoved={},blockAddedIds={},blockRemovedIds={};for(const code of nodeIds){beforeCount[code]=0;afterCount[code]=0;blockAdded[code]=0;blockRemoved[code]=0;blockAddedIds[code]=[];blockRemovedIds[code]=[];}
const skipped=new Set([...(before?.duplicate||[]),...(after?.duplicate||[])]);let newTotal=0,goneTotal=0,unchanged=0,ambiguous=0,ruleAffected=0,cleanMoves=0,missing=0,filterChanged=0;
const flows=new Map(),ambiguousRows=[],ruleRows=[],addedRows=[],goneRows=[];
const addSample=(dict,key,id)=>{dict[key].push(id)};
const all=new Set([...(before?.idx?.keys()||[]),...(after?.idx?.keys()||[])]);
 for(const id of all){if(skipped.has(id))continue;const ai=before?.idx.get(id),bi=after?.idx.get(id);const aPresent=ai!==undefined&&ai!==null,bPresent=bi!==undefined&&bi!==null;
 const va=aPresent&&visible(before,ai),vb=bPresent&&visible(after,bi);
 if(!va&&!vb)continue;
 const comparable=code=>code==="root"||before?.own?.[code]||after?.own?.[code];const a=va?membership(before,ai).filter(comparable):[],b=vb?membership(after,bi).filter(comparable):[];
 for(const code of a)beforeCount[code]++;
 for(const code of b)afterCount[code]++;
 const as=new Set(a),bs=new Set(b),exited=a.filter(x=>!bs.has(x)),entered=b.filter(x=>!as.has(x));
 for(const code of exited){blockRemoved[code]++;addSample(blockRemovedIds,code,id)}
 for(const code of entered){blockAdded[code]++;addSample(blockAddedIds,code,id)}
 if(!aPresent&&bPresent){newTotal++;addedRows.push({id,from:'—',to:b.join(', '),kind:'Новый в реестре'});continue}
 if(aPresent&&!bPresent){goneTotal++;goneRows.push({id,from:a.join(', '),to:'—',kind:'Выбыл из реестра'});continue}
 if(va!==vb){filterChanged++;continue}
 if(!exited.length&&!entered.length){unchanged++;continue}
 const changedSig=[...exited,...entered].some(x=>(before?.sig?.[x]||'')!==(after?.sig?.[x]||''));
 if(changedSig){ruleAffected++;ruleRows.push({id,from:exited.join(', '),to:entered.join(', '),kind:'Изменены правила'});continue}
 const eligible=x=>(before?.own?.[x]||after?.own?.[x])&& !['root','dead'].includes(x);
 const src=exited.filter(eligible),dst=entered.filter(eligible);
 if(src.length===1&&dst.length===1&&exited.length===1&&entered.length===1&&src[0]!==dst[0]){
  const key=src[0]+'|'+dst[0];let f=flows.get(key);if(!f){f={key,from:src[0],to:dst[0],count:0,ids:[],source:'membership'};flows.set(key,f)}f.count++;f.ids.push(id);cleanMoves++;
 }else{ambiguous++;ambiguousRows.push({id,from:exited.join(', ')||'остался',to:entered.join(', ')||'остался',kind:'Несколько/нет однозначного маршрута'})}
 }
 const order=[...flows.values()].sort((a,b)=>b.count-a.count);return{beforeCount,afterCount,blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:order,newTotal,goneTotal,unchanged,ambiguous,ruleAffected,cleanMoves,missing,filterChanged,skipped:skipped.size,addedRows,goneRows,ambiguousRows,ruleRows,source:before?.file+' → '+after?.file};}

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
   result.set(id,{...(old||fallback),...(m?{p:m.p,t:m.t,rule:m.rule,q:m.q,parents:m.parents,extra:m.extra,returns:m.returns}:{}),k:color,t:s.labels?.[id]||m?.t||old?.t||id});
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
 for(const id of nodeIds){beforeCount[id]=0;afterCount[id]=0;blockAdded[id]=0;blockRemoved[id]=0;blockAddedIds[id]=[];blockRemovedIds[id]=[]}
 const entries=nodeIds.filter(id=>id!=="root"&&s.bitsets[id]&&s.own?.[id]).map(id=>[id,s.bitsets[id]]);
 const rb=s.bitsets.root,sum=Number($('#minAmt').value)||0;
 for(let i=0;i<s.n;i++){
  if(sum&&(!s.amt||s.amt[i]==null||Number(s.amt[i])<sum))continue;
  if(!rb||(rb[i>>3]&(1<<(i&7))))afterCount.root++;
  if(!visible(s,i))continue;
  const byte=i>>3,bit=1<<(i&7);
  for(const [id,arr] of entries)if(arr[byte]&bit)afterCount[id]++;
 }
 Object.assign(beforeCount,afterCount);
 return {beforeCount,afterCount,blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:[],newTotal:0,goneTotal:0,unchanged:0,ambiguous:0,ruleAffected:0,cleanMoves:0,missing:0,filterChanged:0,skipped:s.duplicate.size,addedRows:[],goneRows:[],ambiguousRows:[],ruleRows:[],source:s.file};
}
function syncCompareControls(){
 for(const el of $('[data-mode="compare"],[data-action="compare"],[data-action="flows"],[data-action="ambiguous"],#playBtn,#prevBtn,#nextBtn,#flowSlider,#detailBtn,#exportBtn'))el.disabled=singleMode;
 const both=[current,previous].filter(Boolean);
 $('#minAmt').disabled=both.some(s=>!Array.isArray(s.amt));
 $('#deathFilter').disabled=both.some(s=>!Array.isArray(s.dd));
 if($('#minAmt').disabled)$('#minAmt').value='';
 if($('#deathFilter').disabled)$('#deathFilter').value='all';
}
function acceptSnapshots(cur,prev,source){
 if(!validSnap(cur))throw Error("Не получен рассчитанный снимок.");
 singleMode=!prev;
 setSchema(prev,cur);
 current=prepareSnapshot(cur);previous=prev?prepareSnapshot(prev):current;
 rawWarnings=[cur.warning,prev?.warning].filter(Boolean).join(" · ");
 $('#sourceLabel').textContent=source;
 display=singleMode?'vertical':'compare';branch='all';$('#branchMobile').value='all';setModeButtons();setBranchButtons();syncCompareControls();recompute(true);
}

function verticalPositions(){const pos={root:{x:890,y:42},dead:{x:890,y:155},A:{x:480,y:310},B:{x:1070,y:310},C:{x:1640,y:310}};
 const cols=[{x:235,items:['A2','A2s','A2c','A2r','A2n','A2o','A2na','A2nb','U5','U3','U7','U8','U9','U4']},{x:615,items:['A1','A1s','A1c','A1r','A1n','A1o','A1na','A1nb','U1','U2','U6','U10']},{x:1070,items:['Bm','Ba','Bc','I','Is','Ic','Ir','Iw','In','Io','Ina','Inb','U11','U12','U13']},{x:1640,items:['U14','U15','U16']}];
 for(const col of cols)col.items.forEach((id,j)=>{if(byId[id])pos[id]={x:col.x,y:530+j*119}});for(const n of nodes){if(pos[n.id])continue;const p=pos[n.p],x=p?.x||({A:615,B:1070,C:1640}[branchOf(n.id)]||890);let y=Math.max(530,...Object.values(pos).filter(v=>v.x===x).map(v=>v.y+119));pos[n.id]={x,y}}return pos;}
function originalPositions(){return Object.fromEntries(nodes.map(n=>[n.id,{x:n.x+100,y:n.y+100}]));}
function calcSize(p){let maxX=0,maxY=0;for(const v of Object.values(p)){maxX=Math.max(maxX,v.x+190);maxY=Math.max(maxY,v.y+110)}return{w:maxX+85,h:maxY+90}}
function bezier(from,to,positions,compare=false){const a=positions[from],b=positions[to];if(!a||!b)return'';
 const ax=a.x,ay=a.y+88,bx=b.x,by=b.y;
 if(compare){const sy=a.y+40,ey=b.y+38;const d=Math.max(120,Math.abs(bx-ax)*.4);return`M${ax} ${sy} C${ax+d} ${sy},${bx-d} ${ey},${bx} ${ey}`}
 const yGap=by-ay;
 if(yGap>=30){const mid=Math.max(20,Math.min(75,yGap*.48));return`M${ax} ${ay} C${ax} ${ay+mid},${bx} ${by-mid},${bx} ${by}`}
 const mid=(ax+bx)/2;return`M${ax} ${ay} C${ax} ${ay+58},${mid} ${ay+86},${mid} ${ay+60} S${bx} ${by-50},${bx} ${by}`;
}
const svgNS='http://www.w3.org/2000/svg';function pathEl(d,clazz,ec){const p=document.createElementNS(svgNS,'path');p.setAttribute('d',d);p.setAttribute('class',clazz);if(ec)p.style.setProperty('--ec',ec);return p}
function renderDiagram(reset=false){if(!analysis)return;
 viewPositions=display==='graph'?originalPositions():verticalPositions();const sz=calcSize(viewPositions);canvas.style.width=sz.w+'px';canvas.style.height=sz.h+'px';svg.setAttribute('width',sz.w);svg.setAttribute('height',sz.h);svg.setAttribute('viewBox',`0 0 ${sz.w} ${sz.h}`);svg.replaceChildren();layer.replaceChildren();badges.replaceChildren();
 const frag=document.createDocumentFragment(),fedges=document.createDocumentFragment();for(const n of nodes){const groups=[[n.parents||[n.p],"base-edge"],[n.extra||[],"base-edge extra-edge"],[n.returns||[],"base-edge return-edge"]];for(const [froms,cls] of groups)for(const src of new Set(froms)){if(!src||src===n.id)continue;const d=bezier(src,n.id,viewPositions);if(!d)continue;const path=pathEl(d,cls);path.dataset.a=src;path.dataset.b=n.id;fedges.appendChild(path)}}svg.appendChild(fedges);
 for(const n of nodes){const p=viewPositions[n.id];if(!p)continue;const b=document.createElement('button');b.type='button';b.className='node';b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.setProperty('--c',colors[n.k]);b.dataset.id=n.id;
 const a=analysis.afterCount[n.id],before=analysis.beforeCount[n.id],delta=a-before;const title=current?.labels?.[n.id]||n.t;const noRule=n.id!=="root"&&!current?.own?.[n.id]&&!current?.demo;
 b.innerHTML=`<div class="code"># ${esc(n.id)} / ${esc(n.k.toUpperCase())}</div><div class="node-name">${esc(title)}</div><div class="node-bottom"><span class="mini">${display==='compare'?'БЫЛО '+fmt(before):'ДОГОВОРОВ'}</span><span class="count">${noRule?'—':fmt(a)}</span></div>${delta?`<span class="delta ${delta<0?'neg':''}">${delta>0?'+':''}${fmt(delta)}</span>`:''}`;
 b.title=title+(noRule?' · нет собственного условия расчёта':singleMode?' · строк '+fmt(a):' · было '+fmt(before)+' · стало '+fmt(a));b.addEventListener('click',()=>chooseNode(n.id,true));frag.appendChild(b)}layer.appendChild(frag);
 if(display==='vertical'||display==='compare'){for(const [x,text] of [[235,'01 / ЗАМЕНА ВЗЫСКАТЕЛЯ'],[615,'02 / ЗАМЕНА ДОЛЖНИКА'],[1070,'03 / БЕЗ СУДЕБНОГО АКТА'],[1640,'04 / НОТАРИАЛЬНАЯ НАДПИСЬ']]){const e=document.createElement('div');e.className='lane-head';e.style.left=x+'px';e.style.top='450px';e.textContent=text;layer.appendChild(e)}}
 $('#boardTitle').textContent=display==='graph'?'Полная схема · свободная раскладка':display==='compare'?'Сравнение публикаций · маршруты':'Вертикальная воронка · 4 дорожки';
 $('#boardSub').textContent=nodes.length+' блоков · '+(current?.demo?'синтетические данные':singleMode?'локальный расчёт, строки реестра':'сравнение уникальных ID');$('#comparisonLabel').textContent=singleMode?(current?.file||'—')+' · '+(current.rulesName||'без предыдущего снимка'):(previous?.file||'—')+' → '+(current?.file||'—');
 setScale(scale);showFlow();highlight();if(reset){setScale(window.innerWidth<850?.82:.76);const focal=window.innerWidth<850?890:(display==='graph'?(byId.A?.x||890)+100:615);board.scrollLeft=Math.max(0,focal*scale-board.clientWidth*.5);board.scrollTop=0;}}
function setScale(v){scale=Math.max(.26,Math.min(1.55,Math.round(v*100)/100));canvas.style.transform=`scale(${scale})`;wrap.style.width=(canvas.offsetWidth*scale)+'px';wrap.style.height=(canvas.offsetHeight*scale)+'px';$('#zoomVal').textContent=Math.round(scale*100)+'%';}
function fitZoom(){const v=Math.min((board.clientWidth-14)/canvas.offsetWidth,(board.clientHeight-14)/Math.min(canvas.offsetHeight,1000));setScale(Math.max(.26,Math.min(.95,v)));board.scrollLeft=0;board.scrollTop=0;}
function chooseNode(id,go){if(!byId[id])return;selected=id;highlight();renderInspector();if(go){const p=viewPositions[id];if(p){board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,p.y*scale-board.clientHeight/2),behavior:'smooth'})}if(window.matchMedia('(max-width:850px)').matches)$('#inspector').classList.add('open');}}
function highlight(){if(!analysis)return;const s=$('#search').value.trim().toLowerCase(),near=linkSet(selected);$$('.node').forEach(e=>{const id=e.dataset.id,n=byId[id],txt=(id+' '+(current?.labels?.[id]||n?.t||id)).toLowerCase();const okBranch=branch==='all'||branchOf(id)===branch||['root','dead'].includes(id);e.classList.toggle('dim',!okBranch||(s&&!txt.includes(s)));e.classList.toggle('selected',id===selected);e.classList.toggle('flight',!!filteredFlows[flowIndex]&&(id===filteredFlows[flowIndex].from||id===filteredFlows[flowIndex].to)&&display==='compare')});$$('.base-edge').forEach(e=>e.classList.toggle('near',near.has(e.dataset.a)&&near.has(e.dataset.b)))}
function showFlow(){svg.querySelectorAll('.movement-edge,.movement-glow,.marker,.click-edge').forEach(x=>x.remove());badges.replaceChildren();const f=filteredFlows[flowIndex];$('#flowSlider').max=Math.max(0,filteredFlows.length-1);$('#flowSlider').value=flowIndex;$('#flowCount').textContent=filteredFlows.length?`${flowIndex+1}/${filteredFlows.length} · ${fmt(f?.count||0)}`:'0';$('#flowTitle').textContent=f?`${f.from} → ${f.to} · ${byId[f.from]?.t||f.from} → ${byId[f.to]?.t||f.to}`:'Однозначных пар пока нет';
 if(!f){highlight();renderInspector();return}const d=bezier(f.from,f.to,viewPositions,true);if(!d)return;const col='#6ef9cb';svg.appendChild(pathEl(d,'movement-glow',col));svg.appendChild(pathEl(d,'movement-edge',col));const click=pathEl(d,'click-edge');click.addEventListener('click',()=>{selected=f.to;renderInspector();openFlowDetails(f)});svg.appendChild(click);const circ=document.createElementNS(svgNS,'circle');circ.setAttribute('r','6');circ.setAttribute('class','marker');circ.style.setProperty('--ec',col);const anim=document.createElementNS(svgNS,'animateMotion');anim.setAttribute('dur','2.7s');anim.setAttribute('repeatCount','indefinite');anim.setAttribute('path',d);circ.appendChild(anim);svg.appendChild(circ);circ.dataset.particle='1';if(!playing){$$('.movement-edge').forEach(e=>e.style.animationPlayState='paused');anim.setAttribute('dur','99999s')}
 const a=viewPositions[f.from],b=viewPositions[f.to],x=(a.x+b.x)/2,y=(a.y+b.y)/2;const badge=document.createElement('button');badge.className='flowbadge';badge.style.left=x+'px';badge.style.top=y+'px';badge.textContent='→ '+fmt(f.count)+' ID';badge.title='Открыть ID договоров';badge.addEventListener('click',()=>openFlowDetails(f));badges.appendChild(badge);highlight();renderInspector();}
function flowsForBranch(){return analysis?.flows.filter(f=>branch==='all'||branchOf(f.from)===branch||branchOf(f.to)===branch)||[]}
function syncFlows(){filteredFlows=flowsForBranch();flowIndex=Math.max(0,Math.min(filteredFlows.length-1,flowIndex));showFlow()}
function selectFlow(i,focus=true){if(!filteredFlows.length){flowIndex=0;showFlow();return}flowIndex=((i%filteredFlows.length)+filteredFlows.length)%filteredFlows.length;showFlow();if(focus&&display==='compare'){const f=filteredFlows[flowIndex],p=viewPositions[f.to];if(p)board.scrollTo({left:Math.max(0,p.x*scale-board.clientWidth/2),top:Math.max(0,p.y*scale-board.clientHeight/2),behavior:'smooth'})}}
function renderInspector(){if(!analysis)return;const n=byId[selected],from=analysis.beforeCount[selected],to=analysis.afterCount[selected],delta=to-from;if(singleMode){const noRule=selected!=='root'&&!current.own?.[selected];$('#inspectorBody').innerHTML=`<div class="selected-block" style="--sel:${colors[n.k]}"><small># ${esc(n.id)}</small><h2>${esc(current.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Нет собственного критерия')}</p></div><div class="sect"><h3>ТЕКУЩИЙ РЕЕСТР</h3><h2>${noRule?'—':fmt(to)}</h2><p>${noRule?'Блок не имеет собственного условия или исключения.':'Строк по действующим правилам'}</p></div><div class="sect"><h3>СРАВНЕНИЕ</h3><p>Загрузите предыдущий реестр, чтобы увидеть переходы.</p>${rawWarnings?'<p>'+esc(rawWarnings)+'</p>':''}</div>`;return;}const incoming=analysis.flows.filter(f=>f.to===selected).slice(0,8),outgoing=analysis.flows.filter(f=>f.from===selected).slice(0,8);let h=`<div class="selected-block" style="--sel:${colors[n.k]}"><small># ${esc(n.id)} / ${esc(n.k.toUpperCase())}</small><h2>${esc(current?.labels?.[n.id]||n.t)}</h2><p>${esc(n.rule||'Условия отображаются как ориентир из исходной схемы. Авторитетный расчёт — только в исходном снимке.')}</p></div><div class="inspector-metrics"><div><b>${fmt(from)}</b><small>БЫЛО</small></div><div><b>${fmt(to)}</b><small>СТАЛО</small></div><div><b style="color:${delta>=0?'var(--green)':'var(--red)'}">${delta>0?'+':''}${fmt(delta)}</b><small>ИЗМЕНЕНИЕ</small></div></div>`;
 h+=`<div class="sect"><h3>ИЗМЕНЕНИЯ СОСТАВА БЛОКА</h3><div class="info">Добавились: <b style="color:var(--green)">${fmt(analysis.blockAdded[selected])}</b><br/>Выбыли: <b style="color:var(--red)">${fmt(analysis.blockRemoved[selected])}</b><br/>Разница показывает изменение численности, а не обязательно переход на следующий этап.</div><button class="btn" data-blockdetails>ПОСМОТРЕТЬ ID В ИЗМЕНЕНИЯХ</button></div>`;
 h+=`<div class="sect"><h3>ПОДТВЕРЖДЁННЫЕ СМЕНЫ ПРИНАДЛЕЖНОСТИ</h3>`;
 const listed=[...incoming,...outgoing].sort((a,b)=>b.count-a.count).slice(0,12);h+=listed.length?listed.map(f=>`<button class="flowrow ${filteredFlows[flowIndex]?.key===f.key?'active':''}" data-flowkey="${esc(f.key)}"><span><span class="flowlist-title">${esc(f.from)} → ${esc(f.to)}</span><span class="flowlist-sub">${esc(byId[f.from]?.t||f.from)} → ${esc(byId[f.to]?.t||f.to)}</span></span><b>${fmt(f.count)}</b></button>`).join(''):'<div class="empty">Однозначных переходов для блока не выявлено. Возможно, изменился только состав или несколько блоков одновременно.</div>';
 h+=`</div><div class="sect"><h3>ОГРАНИЧЕНИЯ</h3><p>В исходном коде «Брать из блока», исключения и правила И/ИЛИ влияют на расчёт. Эти значения получены из уже рассчитанных наборов. При множественном изменении блоков переход не выдумывается.</p></div>`;
 $('#inspectorBody').innerHTML=h;$('#inspectorBody').querySelector('[data-blockdetails]')?.addEventListener('click',()=>openBlockDetails(selected));$('#inspectorBody').querySelectorAll('[data-flowkey]').forEach(el=>el.addEventListener('click',()=>{const f=analysis.flows.find(x=>x.key===el.dataset.flowkey);if(!f)return;display='compare';setModeButtons();renderDiagram();let ix=filteredFlows.findIndex(x=>x.key===f.key);if(ix<0){branch='all';setBranchButtons();syncFlows();ix=filteredFlows.findIndex(x=>x.key===f.key)}selectFlow(ix);$('#inspector').classList.remove('open')}));}
function setModeButtons(){$$('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===display));}
function setBranchButtons(){$$('[data-branch]').forEach(b=>b.classList.toggle('active',b.dataset.branch===branch));}
function setMode(m){if(singleMode&&m==='compare'){setStatus('Для сравнения требуется предыдущий реестр');return}display=m;setModeButtons();renderDiagram(true);if(m==='compare'&&filteredFlows.length)selectFlow(flowIndex,true)}
function setStatus(s){$('#status').textContent=s}
function openRows(title,note,rows,getAll){$('#detailsTitle').textContent=title;$('#detailsNote').textContent=note;const body=$('#detailsRows');body.replaceChildren();const arr=rows.slice(0,200);arr.forEach((r,i)=>{const tr=document.createElement('tr');for(const v of [i+1,r.id,r.from,r.to,r.kind]){const td=document.createElement('td');td.textContent=v;tr.appendChild(td)}body.appendChild(tr)});window.__downloadRows=getAll||(()=>rows);$('#detailsDialog').showModal();}
function openFlowDetails(f){openRows(`Переход ${f.from} → ${f.to} · ${fmt(f.count)} ID`,'Обнаружена однозначная смена принадлежности к двум блокам. Это не обязательно физический «переход по стрелке» в рабочем процессе.',f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})),()=>f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})));}
function openBlockDetails(code){const add=analysis.blockAddedIds[code].map(id=>({id,from:'—',to:code,kind:'Добавился в блок'})),rem=analysis.blockRemovedIds[code].map(id=>({id,from:code,to:'—',kind:'Выбыл из блока'}));openRows(`Изменения блока ${code}`,'Показана часть ID. Для больших блоков пока сохранены первые 150 каждого типа. Полный список возможен при подключении оригинального механизма экспорта.',add.concat(rem));}
function csvSafe(v){const s=String(v??'');return/[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function downloadRows(rows,name){const head=['ID договора','Блок до','Блок после','Категория'];const lines=[head,...rows.map(r=>[r.id,r.from,r.to,r.kind])].map(row=>row.map(csvSafe).join(';')).join('\r\n');const b=new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
function exportAll(){const rows=analysis.flows.flatMap(f=>f.ids.map(id=>({id,from:f.from,to:f.to,kind:'Однозначная смена блока'})));rows.push(...analysis.ambiguousRows,...analysis.ruleRows,...analysis.addedRows,...analysis.goneRows);downloadRows(rows,'NEON_FLOW_изменения.csv');}
function parseCSV(text){const delimiter=text.split(/\r?\n/,1)[0].includes(';')?';':',';const rows=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){v+='"';i++}else if(c==='"')q=false;else v+=c}else if(c==='"')q=true;else if(c===delimiter){row.push(v);v=''}else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>x!==''))rows.push(row);row=[];v=''}else v+=c}if(v||row.length){row.push(v);rows.push(row)}return rows;}
function excelCol(c){let n=0;for(const x of c)n=n*26+x.charCodeAt(0)-64;return n-1}
async function parseXlsx(file){if(typeof JSZip==='undefined')throw Error('Не найдена библиотека JSZip');if(file.size>35*1024*1024)throw Error('Для больших Excel лучше использовать data.bin из оригинального сайта: этот тестовый парсер ограничен 35 МБ.');const zip=await JSZip.loadAsync(file);const get=async name=>{const f=zip.file(name);return f?await f.async('string'):null};const ss=await get('xl/sharedStrings.xml');const parser=new DOMParser(),shared=[];if(ss){const doc=parser.parseFromString(ss,'application/xml');for(const si of [...doc.getElementsByTagName('si')]){shared.push([...si.getElementsByTagName('t')].map(x=>x.textContent).join(''))}}
 const workbook=await get('xl/workbook.xml'),rels=await get('xl/_rels/workbook.xml.rels');if(!workbook||!rels)throw Error('Файл XLSX без структуры workbook');const wd=parser.parseFromString(workbook,'application/xml'),rd=parser.parseFromString(rels,'application/xml');const relMap={};for(const r of [...rd.getElementsByTagName('Relationship')])relMap[r.getAttribute('Id')]=r.getAttribute('Target');const sheets=[...wd.getElementsByTagName('sheet')];const pick=sheets.find(x=>/реестр/i.test(x.getAttribute('name')||''))||sheets[0];if(!pick)throw Error('В книге нет листов');const rid=pick.getAttribute('r:id')||pick.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let target=relMap[rid]||'';target=target.replace(/^\//,'').replace(/^xl\//,'');target='xl/'+target.replace(/^\.\.\//,'');const xml=await get(target);if(!xml)throw Error('Не найден лист '+target);const doc=parser.parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('Ошибка разбора XML XLSX');const rows=[];for(const row of [...doc.getElementsByTagName('row')]){let a=[];for(const c of [...row.getElementsByTagName('c')]){const ref=c.getAttribute('r'),col=ref?excelCol((ref.match(/^[A-Z]+/)||[''])[0]):a.length;const t=c.getAttribute('t');const v=c.getElementsByTagName('v')[0];let val=v?.textContent??'';if(t==='s')val=shared[Number(val)]??'';if(t==='inlineStr')val=[...c.getElementsByTagName('t')].map(n=>n.textContent).join('');a[col]=val}if(a.length)rows.push(a)}return rows;}
function parseDateDays(v){if(v==null||v==='')return null;const str=String(v).trim();if(/^\d+(\.\d+)?$/.test(str)){const n=Number(str);if(n>10000&&n<200000)return Math.round(n+Date.UTC(1899,11,30)/86400000);return null}const ru=str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);const d=ru?new Date(Date.UTC(+ru[3],+ru[2]-1,+ru[1])):new Date(str);return Number.isFinite(d.getTime())?Math.floor(d.getTime()/86400000):null}
function snapshotFromRows(rows,fileName){const head=rows.findIndex(r=>r&&r.some(x=>/^(блок|код блока)$/i.test(String(x||'').trim())));if(head<0)throw Error('Нужна таблица с колонкой «Блок» или «Код блока». Сырой реестр нельзя достоверно пересчитать без исходного движка правил.');const hdr=rows[head].map(x=>String(x??'').trim().toLowerCase().replace(/[.\s]+/g,' '));const find=(names)=>hdr.findIndex(x=>names.some(v=>x===v||x.startsWith(v+' ')));const cCode=find(['код блока','блок']),cId=find(['id договора внутренний','внутренний id договора','id договора','номер договора']),cPath=find(['путь']),cAmt=find(['сумма долга + гп остаток','сумма долга']),cDate=find(['дата смерти']);if(cId<0)throw Error('Не найдена колонка ID договора.');const seen=new Map(),missed=new Set();const active={};for(const n of nodes)active[n.id]=new Set();const ids=[],amt=[],dd=[];let skipped=0;
 const titleMatch=Object.fromEntries(nodes.map(n=>[n.id,(n.t||'').trim().toLowerCase()]));
 for(let ri=head+1;ri<rows.length;ri++){const row=rows[ri];if(!row)continue;const id=cleanID(row[cId]);if(!id)continue;const literal=String(row[cCode]??'').trim();let code=nodeMap.has(literal)?literal:null;if(!code){const m=literal.match(/\(([A-Za-z]\w*)\)\s*$/);if(m&&nodeMap.has(m[1]))code=m[1]}
 if(!code){const candidates=nodes.filter(n=>titleMatch[n.id]===literal.toLowerCase());if(candidates.length===1)code=candidates[0].id;else if(candidates.length>1&&cPath>=0){const path=String(row[cPath]??'').toLowerCase();const matches=candidates.filter(n=>{let p=n,parts=[];while(p&&parts.length<12){parts.push(p.t.toLowerCase());p=byId[p.p]}return parts.slice(1).some(t=>path.includes(t))});if(matches.length===1)code=matches[0].id}}
 if(!code){skipped++;missed.add(literal);continue}let i=seen.get(id);if(i==null){i=ids.length;seen.set(id,i);ids.push(id);amt.push(cAmt>=0?Number(String(row[cAmt]).replace(/\s/g,'').replace(',','.'))||null:null);dd.push(cDate>=0?parseDateDays(row[cDate]):null)}active[code].add(i)}
 if(!ids.length)throw Error('Не удалось определить ни одного блока. Используйте код блока (например A1s), название с кодом или data.bin. Пропущенные: '+[...missed].slice(0,3).join(', '));
 const n=ids.length,sets={},map={},own={},labels={},sig={};for(const nd of nodes){const bits=new Uint8Array(Math.ceil(n/8));for(const i of active[nd.id])bits[i>>3]|=1<<(i&7);sets[nd.id]=bytesToBase64(bits);map[nd.id]=nd.id;own[nd.id]=active[nd.id].size?1:0;labels[nd.id]=nd.t;sig[nd.id]='export-'+nd.id}
 return{v:1,file:fileName,n,ids,amt,dd,sets,map,own,labels,sig,at:new Date().toISOString(),warning:skipped?`Не сопоставлено ${fmt(skipped)} строк с блоками: ${[...missed].slice(0,5).join(', ')}`:''};}
async function readInput(file){const lower=file.name.toLowerCase();let raw;if(lower.endsWith('.bin')){if(typeof DecompressionStream==='undefined')throw Error('Браузер не поддерживает распаковку gzip');const bytes=await file.arrayBuffer();const text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();raw=JSON.parse(text)}else if(lower.endsWith('.json'))raw=JSON.parse(await file.text());else if(lower.endsWith('.csv'))raw=snapshotFromRows(parseCSV((await file.text()).replace(/^\ufeff/,'')),file.name);else if(lower.endsWith('.xlsx'))raw=snapshotFromRows(await parseXlsx(file),file.name);else throw Error('Поддерживаются .bin, .json, .csv, .xlsx');
 if(validSnap(raw))return{snapshot:raw,previous:validSnap(raw.previous)?raw.previous:null};if(validSnap(raw.current))return{snapshot:raw.current,previous:validSnap(raw.previous)?raw.previous:null};throw Error('Неверная структура публикации: нужны ids, map, sets');}
let imported={old:null,new:null};async function loadChoice(file,which){const textEl=$(which==='old'?'#priorInfo':'#currentInfo');const loading=$('#loadInfo');loading.textContent='Чтение: '+file.name+'…';$('#applyFiles').disabled=true;try{const result=await readInput(file);imported[which]=result;textEl.textContent=`✓ ${file.name} · ${fmt(result.snapshot.n)} строк${result.previous?' · есть предыдущая публикация':''}${result.snapshot.warning?' · '+result.snapshot.warning:''}`;loading.textContent='Файл обработан локально.';$('#applyFiles').disabled=!(imported.new||imported.old)}catch(e){imported[which]=null;textEl.textContent='Ошибка: '+e.message;loading.textContent='Данные не изменены';$('#applyFiles').disabled=!(imported.new||imported.old)}}
async function applyImports(){try{const cur=imported.new?.snapshot||imported.old?.snapshot;const prev=imported.old&&imported.new?imported.old.snapshot:imported.new?.previous||imported.old?.previous;if(!cur)throw Error('Выберите текущий снимок.');acceptSnapshots(cur,prev,'Загруженные снимки');$('#uploadDialog').close();}catch(e){$('#loadInfo').textContent='Ошибка сравнения: '+e.message}}
function recompute(reset=false){if(!previous||!current)return;const start=performance.now();analysis=singleMode?emptySingleAnalysis(current):analyze(previous,current);$('#metricAllCaption').textContent=singleMode?'Строк в выборке':'Уникальных ID';$('#metricAll').textContent=fmt(singleMode?analysis.afterCount.root:current.idx.size-current.duplicate.size);$('#metricDead').textContent=fmt(analysis.afterCount.dead);$('#metricFlow').textContent=singleMode?'—':fmt(analysis.cleanMoves);$('#metricNew').textContent=singleMode?'—':fmt(analysis.newTotal);$('#metricGone').textContent=singleMode?'—':fmt(analysis.goneTotal);if(reset)flowIndex=0;syncFlows();renderDiagram(reset);renderInspector();if(singleMode){setStatus('Текущий реестр рассчитан локально · '+fmt(current.n)+' строк · '+(rawWarnings?'Предупреждения: '+rawWarnings:'для сравнения загрузите предыдущий реестр'));return;}setStatus(`${current.demo?'Демо':'Реальные наборы'} · ${fmt(analysis.cleanMoves)} однозначных изменений · ${fmt(analysis.ambiguous)} неоднозначных · ${fmt(analysis.ruleAffected)} затронуты правилами · обработано за ${((performance.now()-start)/1000).toFixed(1)} с`)}
let timer=null;function turnDemo(){singleMode=false;rawWarnings='';setSchema();const pair=makeDemo();previous=prepareSnapshot(pair[0]);current=prepareSnapshot(pair[1]);syncCompareControls();$('#sourceLabel').textContent='Источники: демоданные';$('#minAmt').value='';$('#deathFilter').value='all';display='vertical';branch='all';$('#branchMobile').value='all';setBranchButtons();setModeButtons();recompute(true)}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$$('[data-branch]').forEach(b=>b.addEventListener('click',()=>{branch=b.dataset.branch;$('#branchMobile').value=branch;setBranchButtons();flowIndex=0;syncFlows();highlight()}));$('#branchMobile').addEventListener('change',e=>{branch=e.target.value;setBranchButtons();flowIndex=0;syncFlows();highlight()});
$$('[data-action=compare]').forEach(b=>b.addEventListener('click',()=>setMode('compare')));
$$('[data-action=ambiguous]').forEach(b=>b.addEventListener('click',()=>openRows('Сложные и неоднозначные изменения',`Неоднозначных: ${fmt(analysis.ambiguous)} · правила: ${fmt(analysis.ruleAffected)} · фильтр: ${fmt(analysis.filterChanged)}`,[...analysis.ambiguousRows,...analysis.ruleRows])));
$$('[data-action=flows]').forEach(b=>b.addEventListener('click',()=>{setMode('compare');if(filteredFlows.length)openFlowDetails(filteredFlows[flowIndex]);else openRows('Неоднозначные случаи',`Неоднозначных: ${fmt(analysis.ambiguous)}, изменения правил: ${fmt(analysis.ruleAffected)}`,[...analysis.ambiguousRows,...analysis.ruleRows])}));
$('#zoomIn').addEventListener('click',()=>setScale(scale+.1));$('#zoomOut').addEventListener('click',()=>setScale(scale-.1));$('#zoomFit').addEventListener('click',fitZoom);$('#search').addEventListener('input',highlight);
$('#deathFilter').addEventListener('change',()=>recompute());$('#minAmt').addEventListener('change',()=>recompute());
$('#playBtn').addEventListener('click',()=>{playing=!playing;$('#playBtn').textContent=playing?'Ⅱ ПАУЗА':'▷ ПУСК';$('#playBtn').classList.toggle('on',playing);showFlow()});
$('#prevBtn').addEventListener('click',()=>selectFlow(flowIndex-1));$('#nextBtn').addEventListener('click',()=>selectFlow(flowIndex+1));$('#flowSlider').addEventListener('input',e=>selectFlow(Number(e.target.value),false));
$('#detailBtn').addEventListener('click',()=>{const f=filteredFlows[flowIndex];if(f)openFlowDetails(f);else openRows('Неоднозначные изменения',`Неоднозначных: ${fmt(analysis.ambiguous)}`,analysis.ambiguousRows)});$('#exportBtn').addEventListener('click',exportAll);$('#detailsCsv').addEventListener('click',()=>downloadRows((window.__downloadRows||(()=>[]))(),'NEON_FLOW_детали.csv'));$('#closeInspector').addEventListener('click',()=>$('#inspector').classList.remove('open'));
$('#loadBtn').addEventListener('click',()=>$('#uploadDialog').showModal());$('#choosePrior').addEventListener('click',()=>$('#priorFile').click());$('#chooseCurrent').addEventListener('click',()=>$('#currentFile').click());$('#priorFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'old')});$('#currentFile').addEventListener('change',e=>{if(e.target.files[0])loadChoice(e.target.files[0],'new')});$('#applyFiles').addEventListener('click',applyImports);$('#demoBtn').addEventListener('click',turnDemo);
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
window.addEventListener('keydown',e=>{if(e.key==='Escape')$('#inspector').classList.remove('open');if(e.target.closest('input,select,dialog'))return;if(e.key==='ArrowRight')selectFlow(flowIndex+1);if(e.key==='ArrowLeft')selectFlow(flowIndex-1)});
let playInterval=window.setInterval(()=>{if(!playing||document.hidden||!analysis||!filteredFlows.length)return;if(display==='compare')selectFlow(flowIndex+1,false)},3700);
window.addEventListener('resize',()=>{if(canvas.offsetWidth&&board.clientWidth)fitZoom()});

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
  frame.onload=()=>{if(!ended)frame.contentWindow.postMessage({type:'neon-calculate-raw',request,rules,registry},location.origin)};
  frame.onerror=()=>fail('Не удалось загрузить локальный движок.');
  timeout=setTimeout(()=>fail('Превышено время расчёта. Проверьте файл и ресурсы браузера.'),20*60*1000);
  frame.src='engine.html';document.body.appendChild(frame);
 });
}
$('#rawLoadBtn').addEventListener('click',()=>{rawDialog.showModal();refreshRaw()});
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
  acceptSnapshots(b,a,'Локальный Excel · '+rules.name);
  rawDialog.close();
 }catch(e){rawInfo.textContent='Ошибка: '+e.message+' · Данные не изменены.'}
 finally{rawActive=false;refreshRaw()}
});

turnDemo();
})();
