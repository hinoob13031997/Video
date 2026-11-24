'use strict';
self.window=self;importScripts('workspace.js');
const W=self.FlowWorkspace,cleanID=v=>{let t=String(v??'').trim();return /^-?\d+\.0+$/.test(t)?t.replace(/\.0+$/,''):t};
let nodeIds=[],nodeMap=new Map(),currentStats={},previousStats={},options,cache=new Map();
function masksFor(s){if(!cache.has(s))cache.set(s,{normal:W.filterMask(s,options),root:W.filterMask(s,options,true)});return cache.get(s)}
function membership(s,i){return nodeIds.filter(id=>W.has(s,id,i))}
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
function emptySingleAnalysis(s){
 const beforeCount={},afterCount={},blockAdded={},blockRemoved={},blockAddedIds={},blockRemovedIds={};
 for(const id of nodeIds){beforeCount[id]=afterCount[id]=currentStats[id]?.count||0;blockAdded[id]=blockRemoved[id]=0;blockAddedIds[id]=[];blockRemovedIds[id]=[]}
 return {beforeCount,afterCount,blockAdded,blockRemoved,blockAddedIds,blockRemovedIds,flows:[],newTotal:0,goneTotal:0,unchanged:0,ambiguous:0,ruleAffected:0,cleanMoves:0,missing:0,filterChanged:0,skipped:s.duplicate.size,addedRows:[],goneRows:[],ambiguousRows:[],ruleRows:[],source:s.file};
}

function prepare(s){const idx=new Map(),duplicate=new Set(),bitsets={},decoded={};s.ids.forEach((v,i)=>{const id=cleanID(v);if(!id)return;if(idx.has(id))duplicate.add(id);else idx.set(id,i)});for(const [id,key] of Object.entries(s.map||{})){if(!decoded[key]){const b=atob(s.sets[key]);decoded[key]=Uint8Array.from(b,c=>c.charCodeAt(0))}bitsets[id]=decoded[key]}return{...s,idx,duplicate,bitsets}}
const own=(s,id)=>id==='root'||s.own?.[id]||s.demo;
function diagnostic(s,prev,nodes,a,opts){
 const rows=[],mask=W.filterMask(s,opts),rootMask=W.filterMask(s,opts,true),stats=W.allStats(s,{normal:mask,root:rootMask},nodes.map(n=>n.id));
 const add=(type,code,count,note)=>rows.push({type,code,count,note});
 add('Дубли ID','root',s.duplicate.size,'Уникальные повторяющиеся ID; все строки реестра.');
 add('Строки без ID','root',s.ids.reduce((n,id)=>n+!cleanID(id),0),'Невозможно сопоставить между снимками.');
 const missingCols=new Set(),cols=Array.isArray(s.rulesColumns)?new Set(s.rulesColumns.map(W.norm)):null;
 for(const n of nodes){const id=n.id;if(!own(s,id)){add('Нет собственного правила',id,null,'Не означает нулевой состав.');continue}
 const st=stats[id];if(!st.count)add('Пустой блок',id,0,'Проверьте условия и применённые фильтры.');
 if(st.count>st.known)add('Неизвестная сумма',id,st.count-st.known,'Не включена в сумму долга.');
 const kids=nodes.filter(k=>own(s,k.id)&&(k.parents||[k.p]).includes(id)&&(k.bases||k.parents||[k.p]).includes(id));
 if(kids.length){let lost=0,multi=0,hidden=0;const bm=id==='root'?rootMask:mask;for(let i=0;i<s.n;i++){if(!bm[i]||!W.has(s,id,i))continue;if(!mask[i]){hidden++;continue}let hits=0;for(const k of kids)if(W.has(s,k.id,i))hits++;if(!hits)lost++;if(hits>1)multi++}if(lost)add('Не попали в дочерние',id,lost,'Не обязательно ошибка: этапы могут не покрывать всю выборку.');if(multi)add('Пересечение дочерних',id,multi,'Строки с двумя и более дочерними блоками; возможно предусмотрено правилами.');if(hidden)add('Скрыты фильтром',id,hidden,'Не считаются потерянными.')}
 const cfg=s.rulesConfig?.[id];if(cfg){const rs=(cfg.c||[]).map(x=>x.r).filter(Boolean);for(const r of rs)for(const c of [r.col,r.cmp])if(c&&cols&&!cols.has(W.norm(c)))missingCols.add(id+' · '+c);
 if(cfg.l!=='or'){const pairs=new Map();for(const r of rs){const c=W.norm(r.col),op=r.op,v=W.norm(r.val);if(!pairs.has(c))pairs.set(c,[]);pairs.get(c).push({op,v,cmp:r.cmp})}for(const [c,p] of pairs){const eq=p.filter(r=>r.op==='eq'&&!r.cmp);if(new Set(eq.map(r=>r.v)).size>1||p.some(r=>r.op==='filled')&&p.some(r=>r.op==='empty'))add('Возможный конфликт',id,null,'Проверьте условия И для '+c)}}}
 if(prev&&a){const b=a.beforeCount[id]||0,d=st.count-b;if(b>=20&&Math.abs(d)/b>=.3)add('Резкое изменение',id,d,'Порог диагностики: 30% при базе от 20 строк.');const diff=d-((a.blockAdded[id]||0)-(a.blockRemoved[id]||0));if(diff)add('Разница строк и ID',id,diff,'Число строк не равно балансу уникальных ID; проверьте дубли, пропуски и фильтры.')}
 }
 for(const c of missingCols)add('Проверьте колонку',c,null,'Не найдена по нормализованному названию; возможен псевдоним.');
 return rows
}
function stamp(s){const t=Date.parse(s.observedAt||s.at||'');return Number.isFinite(t)?t:null}
async function timeline(s,id,previous){const entries=await W.list(),records=[];for(const meta of entries.sort((a,b)=>String(a.at).localeCompare(String(b.at)))){const e=await W.get(meta.id);if(!e?.snapshot)continue;const p=prepare(e.snapshot);records.push(historyPoint(p,id))}if(previous)records.push(historyPoint(previous,id));records.push(historyPoint(s,id));return records.sort((a,b)=>(a.at||0)-(b.at||0))}
function historyPoint(s,id){const i=s.idx.get(id);return{at:stamp(s),file:s.file,duplicate:s.duplicate.has(id),exists:i!==undefined,blocks:i===undefined||s.duplicate.has(id)?[]:Object.keys(s.bitsets).filter(k=>own(s,k)&&W.has(s,k,i)).map(k=>({id:k,name:s.labels?.[k]||k,sig:s.sig?.[k]||null})),amount:i===undefined||s.duplicate.has(id)?null:s.amt?.[i]??null}}
async function aging(s,code,opts){
 const at=stamp(s);if(at===null)throw Error('У текущего снимка нет даты расчёта.');
 if(!own(s,code)||!s.bitsets[code])throw Error('Блок не имеет рассчитанного состава.');
 const mask=W.filterMask(s,opts,code==='root'),candidates=new Map(),active=new Map();
 for(const [id,i] of s.idx)if(mask[i]&&!s.duplicate.has(id)&&W.has(s,code,i)){candidates.set(id,{id,i,start:at,observations:1});active.set(id,candidates.get(id))}
 const sig=s.sig?.[code],signature=JSON.stringify(Object.entries(s.sig||{}).sort());const entries=(await W.list()).filter(x=>Date.parse(x.at)<at).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));let last=at,used=0;
 for(const e of entries){if(!active.size)break;const stored=await W.get(e.id);if(!stored?.snapshot)continue;const p=prepare(stored.snapshot),t=stamp(p);if(t===null||t>=last)continue;if(!sig||p.sig?.[code]!==sig||!p.bitsets[code]||!own(p,code))break;
 // Also compare all rule signatures conservatively, so changed bases cannot inflate duration.
 if(JSON.stringify(Object.entries(p.sig||{}).sort())!==signature)break;
 used++;last=t;for(const [id,r] of active){const i=p.idx.get(id);if(i===undefined||p.duplicate.has(id)||!W.has(p,code,i)){active.delete(id);continue}r.start=t;r.observations++}
 }
 return{used,at,rows:[...candidates.values()].map(r=>({id:r.id,days:Math.floor((at-r.start)/86400000),observations:r.observations,start:r.start,amount:s.amt?.[r.i]??null}))}
}
function preview(a,b){const ids=[...new Set([...Object.keys(a.map),...Object.keys(b.map)])];if(a.n!==b.n||a.ids.some((x,i)=>cleanID(x)!==cleanID(b.ids[i])))throw Error('Исходные строки изменились; сравнение правок недостоверно.');
 return ids.map(id=>{const x=own(a,id)&&a.bitsets[id]?W.blockStats(a,id,null):null,y=own(b,id)&&b.bitsets[id]?W.blockStats(b,id,null):null;let added=0,removed=0;for(let i=0;i<a.n;i++){const u=!!x&&W.has(a,id,i),v=!!y&&W.has(b,id,i);if(v&&!u)added++;if(u&&!v)removed++}return{id,name:b.labels?.[id]||a.labels?.[id]||id,before:x?.count??null,after:y?.count??null,beforeDebt:x?.known?x.sum:null,afterDebt:y?.known?y.sum:null,added,removed,ruleChanged:a.sig?.[id]!==b.sig?.[id]}})}
self.onmessage=async e=>{try{const m=e.data;let result;if(m.action==='compare'){nodeIds=m.ids;nodeMap=new Map(nodeIds.map(x=>[x,1]));options=m.opts;cache.clear();const b=prepare(m.current),a=m.previous?prepare(m.previous):b;currentStats=W.allStats(b,masksFor(b),nodeIds);previousStats=a===b?currentStats:W.allStats(a,masksFor(a),nodeIds);result={currentStats,previousStats,analysis:a===b?emptySingleAnalysis(b):analyze(a,b)}}else if(m.action==='diagnose')result=diagnostic(prepare(m.current),m.previous,m.nodes,m.analysis,m.opts);else if(m.action==='timeline')result=await timeline(prepare(m.current),m.id,m.previous?prepare(m.previous):null);else if(m.action==='aging')result=await aging(prepare(m.current),m.code,m.opts);else if(m.action==='preview')result=preview(prepare(m.previous),prepare(m.current));else throw Error('Неизвестная команда');self.postMessage({ok:true,result})}catch(err){self.postMessage({ok:false,error:err.message})}};
