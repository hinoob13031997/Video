const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const code=read('app.js');
const pure=code.slice(code.indexOf('function collectDraftNodes('),code.indexOf('function refreshDraftPositions('))+code.slice(code.indexOf('function overlapsCard('),code.indexOf('function finishCardMove('));
const context=vm.createContext({CARD_W:272,CARD_H:158,BOARD_MARGIN:96});
vm.runInContext(pure,context);
const plain=x=>JSON.parse(JSON.stringify(x));
test('draft preview contains only new IDs and keeps all parent links',()=>{
 const config={__nodes:[{id:'A',p:'dead',t:'Старый'},{id:'N_abc',p:'A',t:'Новый'},{id:'constructor',p:'A',t:'invalid'}],
 A:{c:[]},N_abc:{uname:'Проверка наследников',ps:['B','A'],links:['C'],rets:['D'],c:[]}};
 const active=new Set(['root','dead','A','B']);
 const result=context.collectDraftNodes(config,active);
 assert.equal(result.size,1);
 assert.deepEqual(plain(result.get('N_abc')),{id:'N_abc',t:'Проверка наследников',parents:['A','B'],links:['C'],returns:['D'],configured:false});
 assert.deepEqual([...active],['root','dead','A','B']); // analysis still uses only these IDs
 config.N_abc.c=[{r:{col:'Рабочий статус',op:'eq',val:'Контроль'}}];
 assert.equal(context.collectDraftNodes(config,active).get('N_abc').configured,true);
 active.add('N_abc');assert.equal(context.collectDraftNodes(config,active).size,0);
});
test('auto-placed draft avoids collisions, and confirmed position is retained',()=>{
 const pos={A:{x:600,y:96},B:{x:600,y:292},C:{x:904,y:292}};
 const first=context.draftPosition('N_1',pos,['A'],null);
 assert.equal(context.overlapsCard('N_1',first,pos),false);
 assert.deepEqual(plain(pos),{A:{x:600,y:96},B:{x:600,y:292},C:{x:904,y:292}});
 assert.deepEqual(plain(context.draftPosition('N_1',pos,['A'],{x:1300,y:500})),{x:1300,y:500});
 assert.equal(context.overlapsCard('N_1',context.draftPosition('N_1',pos,['A'],pos.B),pos),false)
});
function mockRules(ctx={key:'baseline',config:null,columns:[],legacy:false},storage=new Map()){
 const elements=new Map(),events=new Map(),calls=[];
 const get=id=>{if(!elements.has(id))elements.set(id,{addEventListener:(event,fn)=>events.set(id+':'+event,fn)});return elements.get(id)};
 const base={config:{__nodes:[],root:{c:[]},dead:{c:[]}},nodes:[{id:'root',t:'Все договоры'},{id:'dead',t:'Умершие'}]};
 let lastSaved=null;
 async function rpc(action,config,extra){
  calls.push({action,config,extra});
  if(action==='read')return {state:structuredClone(base),warnings:[]};
  if(action==='add'){const p=extra.patch;return {state:{config:{...structuredClone(config),__nodes:[...config.__nodes,{id:p.id,p:p.parents[0],t:p.name}], [p.id]:{c:p.criteria}},nodes:[...base.nodes,{id:p.id,t:p.name,data:{c:[]}}]},warnings:[]}}
  throw Error('Unexpected action '+action);
 }
 const src=read('rules-editor.js');
 const c={document:{getElementById:get},window:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},__rpc:rpc,console,structuredClone};
 vm.runInContext(src.replace(src.slice(src.indexOf('function rpc('),src.indexOf('function create(options)')),'const rpc=__rpc;\n'),vm.createContext(c));
 const editor=c.window.FlowRules.create({context:()=>ctx,onDraft:(key,config)=>lastSaved={key,config}});
 return {editor,calls,storage,get lastSaved(){return lastSaved}};
}
test('quick create generates code, saves name and parent without criteria, and does not calculate',async()=>{
 const mock=mockRules(),result=await mock.editor.quickCreate('  Проверка наследников  ','dead');
 assert.match(result.id,/^N_[a-z0-9]+_[a-z0-9]+$/);assert.equal(result.saved,true);
 assert.deepEqual(mock.calls.map(c=>c.action),['read','add']);
 const patch=mock.calls[1].extra.patch;assert.equal(patch.name,'Проверка наследников');
 assert.deepEqual(plain(patch.parents),['dead']);assert.deepEqual(plain(patch.criteria),[]);
 assert.equal(mock.lastSaved.key,'baseline');assert.equal(mock.lastSaved.config.__nodes[0].id,result.id);
 assert.equal(JSON.parse(mock.storage.get('neon-rules-v44-draft')).config.__nodes[0].id,result.id);
 assert.equal(mock.editor.draftConfig().__nodes[0].id,result.id);
 await assert.rejects(mock.editor.quickCreate('  ','dead'),/Введите название/);
});
test('legacy snapshots cannot silently create drafts using unrelated baseline rules',async()=>{
 const mock=mockRules({key:'legacy',legacy:true,config:null});
 await assert.rejects(mock.editor.quickParents(),/импортируйте/);
 assert.equal(mock.calls.length,0);
});
