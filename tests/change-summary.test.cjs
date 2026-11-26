// Summary uses comparison results as-is; neither display filters nor route limits alter exports.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const functions=source.slice(source.indexOf('function comparisonGroups()'),source.indexOf('function groupRowsForNode('))+
 source.slice(source.indexOf('function blockLabel('),source.indexOf('function flowsForBranch('));
const fixture=()=>({
 source:'yesterday.xlsx → today.xlsx',cleanMoves:2,newTotal:1,goneTotal:1,unchanged:5,missing:3,
 addedRows:[{id:'NEW'}],goneRows:[{id:'GONE'}],ambiguousRows:[{id:'AMBIG'}],entryRows:[{id:'ENTRY'}],exitRows:[],ruleRows:[],filterRows:[],duplicateRows:[{id:'DUP'}],
 beforeCount:{A:10,B:5,C:8},afterCount:{A:9,B:6,C:8},blockAdded:{A:1,B:2,C:0},blockRemoved:{A:2,B:1,C:0},
 flows:[{from:'A',to:'B',count:2,beforeKnown:1,beforeDebt:100,afterKnown:0,afterDebt:0}]
});
function setup(){
 const analysis=fixture(),buttons=[{},{}];let exported,status;
 const context={analysis,nodeIds:['A','B','C'],current:{labels:{A:'Подготовка',B:'Суд'}},byId:{C:{t:'Архив'}},singleMode:false,branch:'A',flowLimit:1,focusOnly:true,
 $:(selector)=>buttons[selector==='#summaryDownload'?0:1],setStatus:s=>status=s,
 W:{exportXlsx:async(sheets,name)=>{assert.ok(buttons.every(b=>b.disabled));exported={sheets,name}}}};
 vm.createContext(context);vm.runInContext(functions,context);
 return {context,buttons,get exported(){return exported},get status(){return status}};
}
test('summary separates confirmed movements, registry arrivals/departures, and other IDs',()=>{
 const {context}=setup();const result=vm.runInContext('summaryMetrics()',context);
 assert.deepEqual(JSON.parse(JSON.stringify(result.map(row=>[row[1],row[2]]))),[[2,'move'],[1,'new'],[1,'gone'],[3,'other']]);
 const rows=vm.runInContext('summaryBlockRows()',context);
 assert.deepEqual(JSON.parse(JSON.stringify(rows)),[['A','Подготовка',10,9,1,2],['B','Суд',5,6,2,1]]);
});
test('summary download contains three sheets, all routes, no contract IDs, and unknown debt remains blank',async()=>{
 const result=setup();await vm.runInContext('downloadChangeSummary()',result.context);
 const {sheets,name}=result.exported;
 assert.equal(name,'Сводка_изменений.xlsx');
 assert.deepEqual(Array.from(sheets,s=>s.name),['Сводка','Переходы','Блоки']);
 assert.deepEqual(JSON.parse(JSON.stringify(sheets[1].rows[1])),['A','Подготовка','B','Суд',2,100,1,'',0]);
 assert.equal(sheets[2].rows.length,3);assert.ok(sheets[0].rows.some(r=>r[0].startsWith('Без ID')&&r[1]===3));
 assert.ok(!JSON.stringify(sheets).includes('AMBIG'));assert.ok(result.buttons.every(b=>!b.disabled));assert.equal(result.status,undefined);
});
test('single registry cannot produce a comparison report',async()=>{
 const result=setup();result.context.singleMode=true;await vm.runInContext('downloadChangeSummary()',result.context);
 assert.equal(result.exported,undefined);
});
