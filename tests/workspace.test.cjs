// Run locally: node --test tests/workspace.test.cjs
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const context={window:{},localStorage:{getItem:()=>null,setItem(){}},console};
vm.runInNewContext(read('workspace.js'),context);
const W=context.window.FlowWorkspace;
test('scripts compile; HTML IDs are unique',()=>{
 for(const file of ['app.js','workspace.js'])new vm.Script(read(file));
 for(const m of read('engine.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
 const ids=[...read('index.html').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of read('app.js').matchAll(/\$\('#([a-zA-Z][\w-]*)'\)/g))assert.ok(ids.includes(m[1])||['distributionBox','minimapView'].includes(m[1]),'Missing '+m[1]);
});
const s={n:5,amt:[100,0,null,300,200],dd:[100,300,null,300,null],cessions:['a','b','a','a','a'],own:{dead:1,x:1,y:1},bitsets:{root:new Uint8Array([31]),dead:new Uint8Array([15]),x:new Uint8Array([3]),y:new Uint8Array([6]),unruled:new Uint8Array([15])}};
test('death, debt, cession filters; root exempt from death filter',()=>{
 const o={sum:50,death:'recent',limit:200,cessions:new Set(['a'])};
 assert.deepEqual([...W.filterMask(s,o)],[0,0,0,1,1]);assert.deepEqual([...W.filterMask(s,o,true)],[1,0,0,1,1]);
});
test('block totals, amount zero and missing, no-rule flag',()=>{
 const normal=new Uint8Array(5).fill(1),out=W.allStats(s,{normal,root:normal},['root','dead','unruled']);
 assert.equal(out.root.count,5);assert.equal(out.root.sum,600);assert.equal(out.root.known,4);assert.equal(out.unruled.noRule,true);
});
test('distribution counts intersections and lost independently',()=>{
 const mask=new Uint8Array(5).fill(1),r=W.distribution(s,'dead',[{id:'x',t:'X'},{id:'y',t:'Y'}],mask,mask,()=>{throw Error('Unexpected reason decode')});
 assert.equal(r.total,4);assert.equal(r.children[0].count,2);assert.equal(r.children[1].count,2);assert.equal(r.lost.length,1);assert.equal(r.multi.length,1);
});
test('large local filter mask',()=>{
 const n=607117,large={n,amt:Array(n).fill(100000),dd:Array(n).fill(null)};const o={sum:100000,death:'all',cessions:new Set()};
 const mask=W.filterMask(large,o);assert.equal(mask.length,n);assert.equal(mask[0]+mask[n-1],2);
});
