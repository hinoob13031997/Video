const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
function harness(){
 let result;const self={postMessage:m=>result=m};
 const ctx=vm.createContext({self,atob,console});ctx.importScripts=()=>vm.runInContext(read('workspace.js'),ctx);ctx.window=self;vm.runInContext(read('analysis-worker.js'),ctx);
 return {self,run:async(action,params)=>{result=null;await self.onmessage({data:{action,...params}});assert.ok(result?.ok,result?.error);return result.result}}
}
const sig={root:JSON.stringify(['','',[],'',[]]),dead:JSON.stringify(['root','',[],'',[]]),A:JSON.stringify(['dead','',[],'',[]]),B:JSON.stringify(['dead','',[],'',[]])};
const snap=(at,a,b)=>({n:3,ids:['x','y','z'],file:'test',at,amt:[100,200,300],map:{root:'r',dead:'r',A:'a',B:'b'},sets:{r:'Bw==',a,b},own:{root:1,dead:1,A:1,B:1},labels:{root:'Все',dead:'Умершие',A:'A',B:'B'},sig});
const before=snap('2026-11-01T12:00:00Z','Aw==','BA=='),after=snap('2026-11-24T12:00:00Z','Ag==','BQ=='),opts={sum:0,death:'all',cessions:new Set(),limit:0},ids=['root','dead','A','B'];
test('worker comparison and preview',async()=>{const {run}=harness(),r=await run('compare',{current:after,previous:before,ids,opts});assert.equal(r.analysis.cleanMoves,1);assert.equal(r.analysis.flows[0].from,'A');assert.equal(r.analysis.flows[0].to,'B');assert.equal(r.analysis.flows[0].afterDebt,100);const p=await run('preview',{current:after,previous:before});assert.equal(p.find(x=>x.id==='A').removed,1);assert.equal(p.find(x=>x.id==='B').added,1);const d=await run('diagnose',{current:after,previous:true,analysis:r.analysis,nodes:[{id:'root'},{id:'dead',p:'root'},{id:'A',p:'dead'},{id:'B',p:'dead'}],opts});assert.ok(Array.isArray(d));});
test('observed aging and timeline',async()=>{const {run,self}=harness();self.FlowWorkspace.list=async()=>[{id:'before',at:before.at}];self.FlowWorkspace.get=async()=>({snapshot:before});const age=await run('aging',{current:after,code:'A',opts});assert.equal(age.rows.length,1);assert.equal(age.rows[0].id,'y');assert.equal(age.rows[0].days,23);assert.equal(age.rows[0].observations,2);const t=await run('timeline',{current:after,id:'x'});assert.equal(t.length,2);assert.ok(t[1].blocks.some(x=>x.id==='B'));});
test('single snapshot has no transitions',async()=>{const {run}=harness(),r=await run('compare',{current:after,previous:null,ids,opts});assert.equal(r.analysis.afterCount.A,1);assert.equal(r.analysis.flows.length,0);});
