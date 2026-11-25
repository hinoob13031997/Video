(()=>{'use strict';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
const copy=o=>JSON.parse(JSON.stringify(o)),codes=s=>[...new Set(String(s||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean))];
const STORAGE='neon-rules-v44-draft',HISTORY='neon-rules-v44-history';
function rpc(action,config,extra={}){
 return new Promise((resolve,reject)=>{
  const frame=el('iframe');frame.title='Локальный движок правил';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.style.cssText='position:fixed;left:-12000px;top:0;width:1200px;height:800px;visibility:hidden;pointer-events:none';
  const request='rule-'+Date.now()+'-'+Math.random().toString(36).slice(2);let done=false,timer;
  const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',receive);frame.remove();err?reject(err):resolve(value)};
  function receive(e){if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.request!==request)return;if(e.data.type==='neon-rules-result')finish(null,e.data);if(e.data.type==='neon-rules-error')finish(Error(e.data.message))}
  window.addEventListener('message',receive);frame.onload=()=>frame.contentWindow.postMessage({type:'neon-rules',request,action,config,...extra},location.origin);frame.onerror=()=>finish(Error('Не удалось открыть локальный движок.'));
  timer=setTimeout(()=>finish(Error('Движок не ответил. Проверьте доступ к библиотеке Excel.')),90000);
  frame.src='engine.html?v=4.10.1-fix';document.body.appendChild(frame);
 });
}
function create(options){
 let state=null,contextKey='',selected='',adding=false,dirty=false,busy=false,legacy=false,history=[],warnings=[],source='',contextColumns=[];
 const dialog=$('rulesDialog'),form=$('ruleForm'),notice=$('ruleNotice');
 try{const h=JSON.parse(localStorage.getItem(HISTORY)||'[]');if(Array.isArray(h))history=h.filter(x=>x?.config).slice(-20)}catch{}
 const buttons=['ruleImport','ruleExport','ruleUndo','ruleHistory','ruleValidate','ruleApply','ruleAdd','ruleDelete','ruleDiscard','ruleSave'];
 function status(text,kind=''){notice.textContent=text;notice.className='rule-notice'+(kind?' '+kind:'')}
 function setBusy(v){busy=v;for(const id of buttons)$(id).disabled=v||!state||legacy&&!['ruleImport','ruleHistory'].includes(id);$('ruleImport').disabled=v;$('ruleHistory').disabled=v;$('ruleClose').disabled=v;$('ruleSearch').disabled=v;form.inert=v;if(!v){$('ruleUndo').disabled=legacy||!history.length;$('ruleDelete').disabled=legacy||adding||!!node()?.protected||!node();$('ruleSave').disabled=legacy||!state;$('ruleDiscard').disabled=legacy||!state}}
 function node(){return state?.nodes.find(n=>n.id===selected)}
 function setWarnings(list){warnings=list||[];const box=$('ruleWarnings');box.textContent=warnings.length?'Замечания движка:\n'+warnings.join('\n'):'';box.hidden=!warnings.length}
 function saveLocal(){try{localStorage.setItem(STORAGE,JSON.stringify({key:contextKey,config:state.config,source}));localStorage.setItem(HISTORY,JSON.stringify(history));return true}catch{return false}}
 function remember(label){if(!state)return;history.push({at:new Date().toISOString(),label,config:copy(state.config),source});if(history.length>20)history.shift()}
 async function task(fn){if(busy)return false;setBusy(true);try{await fn();return true}catch(e){status('Ошибка: '+e.message,'error');return false}finally{setBusy(false)}}
 function abandon(){return !dirty||confirm('Несохранённый ввод будет потерян. Продолжить?')}
 function paintList(){
  const q=$('ruleSearch').value.toLowerCase().trim(),box=$('ruleNodes');box.replaceChildren();
  if(!state)return;
  for(const n of state.nodes){if(q&&!(n.id+' '+n.t).toLowerCase().includes(q))continue;const b=el('button','rule-node'+(!adding&&n.id===selected?' active':''));b.type='button';b.append(el('span','',n.t),el('small','',n.id+' · '+(n.data.c||[]).filter(c=>c.r).length+' условий'));b.addEventListener('click',()=>{if(busy||!abandon())return;selected=n.id;adding=false;dirty=false;paint();status('Редактирование блока '+n.id)});box.appendChild(b)}
 }
 function field(parent,label,id,value='',help='',type='text',choices=null){
  const wrap=el('label','rule-field');wrap.append(el('span','',label));const input=el(choices?'select':type==='textarea'?'textarea':'input');if(id)input.id=id;
  if(choices){for(const [v,t] of choices){const o=el('option','',t);o.value=v;input.appendChild(o)}}
  else if(type==='textarea')input.rows=3;else input.type=type;
  input.value=value??'';wrap.appendChild(input);if(help)wrap.appendChild(el('span','help',help));parent.appendChild(wrap);return input;
 }
 function section(title,help=''){const s=el('section','rule-section');s.appendChild(el('h3','',title));if(help)s.appendChild(el('p','rule-caption',help));form.appendChild(s);return s}
 function datalist(){
  const l=el('datalist');l.id='rulesColumnOptions';
  for(const v of new Set([...(contextColumns||[]),...(state.columns||[]),...state.nodes.flatMap(n=>(n.data.c||[]).flatMap(x=>[x.r?.col,x.r?.cmp]).filter(Boolean))])){const o=el('option');o.value=v;l.appendChild(o)}form.appendChild(l);
 }
 function criterion(x={t:'',r:null}){
  const box=el('div','rule-criterion'),r=x.r||{};
  const desc=field(box,'Описание критерия','',x.t);desc.parentNode.classList.add('rule-desc');desc.classList.add('crit-desc');
  const col=field(box,'Колонка','',r.col||'');col.classList.add('crit-col');col.setAttribute('list','rulesColumnOptions');
  const op=field(box,'Условие','',r.op||'','', 'text',[['','Только описание'],...state.ops]);op.classList.add('crit-op');
  const val=field(box,'Значение','',r.val??'');val.classList.add('crit-val');
  const cmp=field(box,'Сравнить с колонкой','',r.cmp||'');cmp.classList.add('crit-cmp');cmp.setAttribute('list','rulesColumnOptions');
  const del=el('button','btn','×');del.type='button';del.title='Удалить критерий';del.addEventListener('click',()=>{box.remove();dirty=true});box.appendChild(del);
  function sync(){const no=!op.value,empty=['filled','empty'].includes(op.value),compare=['eq','ne','lt','le','gt','ge'].includes(op.value);col.disabled=no;val.disabled=no||empty||(compare&&!!cmp.value.trim());cmp.disabled=!compare}
  op.addEventListener('change',sync);cmp.addEventListener('input',sync);sync();$('ruleCriteria').appendChild(box);
 }
 function paintForm(){
  form.replaceChildren();if(!state){form.appendChild(el('p','rule-caption','Загрузите таблицу правил для редактирования.'));return}
  const n=node();if(!adding&&!n)return;
  const d=adding?{c:[],l:'',from:'',sub:[],links:[],rets:[],q:[],n:'',color:''}:n.data;
  const head=section(adding?'Новый блок':n.t),grid=el('div','rule-grid');head.appendChild(grid);
  const id=field(grid,'Код блока','ruleCode',adding?'':n.id,'Уникальный код, не меняется после создания.');id.readOnly=!adding;
  field(grid,'Название','ruleName',adding?'':n.t);
  const kind=field(grid,'Тип блока','ruleKind',adding?'stage':n.k,'','text',Object.entries(state.kinds));kind.disabled=!adding&&!n.custom;
  field(grid,'Цвет','ruleColor',d.color||'','Цвет в исходной таблице правил.','text',[['','По умолчанию'],...state.colors]);
  datalist();
  const rel=section('Связи и источники','Коды разделяйте точкой с запятой. Родители определяют объединение выборок; дополнительные стрелки и пунктир не участвуют в расчёте.'),g=el('div','rule-grid');rel.appendChild(g);
  const root=!adding&&n.id==='root';
  for(const [label,id,value,help] of [
   ['Родители','ruleParents',adding?(selected||'dead'):(n.parents||[]).join('; '),'Обязательны для всех блоков, кроме корня.'],
   ['Брать из блока','ruleFrom',d.from||'','Заменяет родительскую выборку. Пусто — использовать родителей.'],
   ['Вычесть блоки','ruleSub',(d.sub||[]).join('; '),'Исключить договоры, входящие в эти блоки.'],
   ['Дополнительные стрелки от','ruleLinks',(d.links||[]).join('; '),'Только визуальная связь.'],
   ['Пунктир от','ruleReturns',(adding?[]:n.returns||[]).join('; '),'Возврат, только визуальная связь.']
  ]){const f=field(g,label,id,value,help);f.disabled=root&&['ruleParents','ruleFrom','ruleSub'].includes(id)}
  const criteria=section('Критерии отбора',root?'Корень представляет весь входной реестр. Его критерии не выполняются исходным движком.':'Описание без условия не участвует в расчёте. Для списков используйте «;», для возраста даты — число лет.');
  field(criteria,'Объединение условий','ruleLogic',d.l==='or'?'or':'and','','text',[['and','И — все условия'],['or','ИЛИ — хотя бы одно']]);
  const list=el('div');list.id='ruleCriteria';criteria.appendChild(list);for(const x of d.c||[])criterion(x);
  const add=el('button','btn','+ Критерий');add.type='button';add.addEventListener('click',()=>{criterion();dirty=true});add.disabled=root;criteria.appendChild(add);
  const notes=section('Заметки и вопросы');field(notes,'Заметка','ruleNotes',d.n||'','','textarea');field(notes,'Вопросы / замечания','ruleQuestions',(d.q||[]).join('\n'),'Каждый вопрос с новой строки.','textarea');
 }
 function paint(){paintList();paintForm();$('ruleDelete').disabled=busy||legacy||adding||!!node()?.protected||!node();$('ruleUndo').disabled=busy||legacy||!history.length;form.inert=busy||legacy}
 function patch(){return {id:$('ruleCode').value,name:$('ruleName').value,kind:$('ruleKind').value,color:$('ruleColor').value,parents:codes($('ruleParents').value),from:codes($('ruleFrom').value),sub:codes($('ruleSub').value),links:codes($('ruleLinks').value),rets:codes($('ruleReturns').value),logic:$('ruleLogic').value,notes:$('ruleNotes').value,questions:$('ruleQuestions').value,criteria:[...$('ruleCriteria').querySelectorAll('.rule-criterion')].map(b=>{const get=c=>b.querySelector('.crit-'+c),op=get('op').value,cmp=get('cmp'),val=get('val');return{t:get('desc').value,r:op?{col:get('col').value,op,val:val.disabled?'':val.value,cmp:cmp.disabled?'':cmp.value}:null}})}}
 async function savePatch(validate=false){
  if(!state||legacy)return false;
  if(!dirty&&!adding){if(validate)return task(async()=>{const r=await rpc('validate',state.config);setWarnings(r.warnings);status(r.warnings.length?'Проверка завершена с замечаниями.':'Проверка структуры пройдена.','ok')});return true}
  const p=patch();return task(async()=>{
   const result=await rpc(adding?'add':'edit',state.config,{patch:p});setWarnings(result.warnings);
   if(validate){status('Правка прошла проверку структуры. Для применения сохраните её.','ok');return}
   remember((adding?'Добавлен ':'Изменён ')+p.id);state=result.state;selected=p.id;adding=false;dirty=false;source='Локальный черновик';$('ruleSource').textContent=source;const saved=saveLocal();paint();status(saved?'Правка сохранена локально. Показатели изменятся после пересчёта.':'Правка сохранена в памяти вкладки. Браузер не разрешил постоянное хранение.','ok')
  })
 }
 function historyView(){
  const box=$('ruleHistoryBox');box.replaceChildren();box.hidden=false;
  if(!history.length){box.appendChild(el('p','rule-caption','История пока пуста.'));return}
  history.slice().reverse().forEach((h,index)=>{const row=el('div','rule-history-row');row.appendChild(el('span','',new Date(h.at).toLocaleString('ru-RU')+' · '+h.label));const b=el('button','btn','Восстановить');b.disabled=busy;b.addEventListener('click',()=>restoreHistory(history.length-1-index));row.appendChild(b);box.appendChild(row)})
 }
 async function restoreHistory(index){if(busy||!abandon()||!history[index])return;const h=history[index];await task(async()=>{const r=await rpc('read',h.config);if(state)remember('До восстановления: '+h.label);state=r.state;legacy=false;adding=false;dirty=false;selected=state.nodes.some(n=>n.id===selected)?selected:state.nodes[0].id;source='Восстановленная версия правил';$('ruleSource').textContent=source;saveLocal();setWarnings(r.warnings);paint();historyView();status('Версия восстановлена. Пересчёт ещё не выполнен.','ok')})}
 function prefillLink(from){const input=$('ruleLinks');if(!input||!state.nodes.some(n=>n.id===from))return;input.value=[...new Set([...codes(input.value),from])].join('; ');dirty=true;status('Добавлена визуальная стрелка от '+from+'. Чтобы изменить расчёт, настройте родителей. Сохраните правку.');}
 async function open(id,from){
  if(busy)return;
  const ctx=options.context(),key=ctx.key;contextColumns=ctx.columns||[];
  if(!dialog.open)dialog.showModal();
  if(state&&contextKey===key&&!legacy){if(!abandon())return;selected=state.nodes.some(n=>n.id===id)?id:selected;adding=false;dirty=false;paint();setBusy(false);if(from)prefillLink(from);return}
  state=null;contextKey=key;selected=id;adding=false;dirty=false;legacy=ctx.legacy;form.replaceChildren();$('ruleNodes').replaceChildren();$('ruleHistoryBox').hidden=true;setWarnings([]);
  if(legacy){$('ruleSource').textContent='Снимок без полной конфигурации';status('В этом снимке нет полной таблицы правил. Импортируйте исходный Excel с правилами, чтобы не редактировать неверную версию.');setBusy(false);return}
  status('Читаю правила из локального движка…');await task(async()=>{
   let config=ctx.config;source=ctx.name||'Исходная структура';
   try{const draft=JSON.parse(localStorage.getItem(STORAGE)||'null');if(draft?.key===key&&draft.config){config=draft.config;source=draft.source||'Локальный черновик'}}catch{}
   const r=await rpc('read',config);state=r.state;selected=state.nodes.some(n=>n.id===id)?id:state.nodes[0].id;$('ruleSource').textContent=source;setWarnings(r.warnings);paint();status('Выберите блок. Изменения не публикуются и не влияют на цифры до пересчёта.');if(from)prefillLink(from)
  })
 }
 form.addEventListener('input',()=>{dirty=true});form.addEventListener('change',()=>{dirty=true});
 $('ruleSearch').addEventListener('input',paintList);
 $('ruleClose').addEventListener('click',()=>{if(!busy&&abandon()){dirty=false;dialog.close()}});
 dialog.addEventListener('cancel',e=>{if(busy||!abandon())e.preventDefault();else dirty=false});
 $('ruleAdd').addEventListener('click',()=>{if(!state||!abandon())return;adding=true;dirty=true;paint();$('ruleCode').focus();status('Создание нового блока')});
 $('ruleDiscard').addEventListener('click',()=>{adding=false;dirty=false;paint();status('Несохранённый ввод сброшен.')});
 $('ruleSave').addEventListener('click',()=>savePatch(false));
 $('ruleValidate').addEventListener('click',()=>savePatch(true));
 $('ruleDelete').addEventListener('click',async()=>{if(!node()||node().protected||!abandon()||!confirm('Удалить блок '+selected+'? Его дочерние блоки будут перенесены к родителю, ссылки очищены.'))return;await task(async()=>{const r=await rpc('delete',state.config,{id:selected});remember('Удалён '+selected);state=r.state;selected=state.nodes.find(n=>n.id==='dead')?.id||state.nodes[0].id;adding=false;dirty=false;source='Локальный черновик';$('ruleSource').textContent=source;saveLocal();setWarnings(r.warnings);paint();status('Блок удалён из черновика. Для изменения схемы выполните пересчёт.','ok')})});
 $('ruleImport').addEventListener('click',()=>{if(abandon())$('ruleFile').click()});
 $('ruleFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;e.target.value='';await task(async()=>{const r=await rpc('import',state?.config||null,{file:f});if(state)remember('До импорта '+f.name);state=r.state;legacy=false;source=f.name;$('ruleSource').textContent=source;selected=state.nodes.some(n=>n.id===selected)?selected:state.nodes[0].id;adding=false;dirty=false;saveLocal();setWarnings(r.warnings);paint();status('Таблица импортирована в черновик. Проверьте замечания и пересчитайте реестр.','ok')})});
 $('ruleExport').addEventListener('click',async()=>{if(!await savePatch(false))return;await task(async()=>{const r=await rpc('export',state.config);window.FlowWorkspace.download(new Blob([r.bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Таблица правил NEON FLOW.xlsx');status('Таблица правил сформирована.','ok')})});
 $('ruleApply').addEventListener('click',async()=>{if(!await savePatch(false)||legacy||!state)return;if(warnings.some(x=>/^(Цикл расчёта|Источник ниже блока|Недействительная ссылка):/.test(x))){status('Сначала устраните ошибки расчётных связей, указанные в замечаниях.','error');return}if(warnings.length&&!confirm('У правил есть замечания. Применить сохранённую конфигурацию?'))return;dialog.close();options.apply(copy(state.config))});
 $('ruleUndo').addEventListener('click',async()=>{if(!history.length||!abandon())return;await task(async()=>{const h=history.at(-1),r=await rpc('read',h.config);history.pop();state=r.state;adding=false;dirty=false;selected=state.nodes.some(n=>n.id===selected)?selected:state.nodes[0].id;source='Восстановленная версия';$('ruleSource').textContent=source;saveLocal();setWarnings(r.warnings);paint();status('Последняя сохранённая правка отменена. Пересчитайте реестр для применения.','ok')})});
 $('ruleHistory').addEventListener('click',()=>{if($('ruleHistoryBox').hidden)historyView();else $('ruleHistoryBox').hidden=true});
 return{open}
}
window.FlowRules={create};
})();