const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const cardPalette='),source.indexOf('const rows=')),context);
const key=context.cardColorKey;
test('card color uses explicit settings before active rule color and semantic defaults',()=>{
 const node={id:'A1o',t:'Удовлетворено',k:'lime'};
 assert.equal(key(node),'green');
 assert.equal(key(node,{}, {A1o:{color:'purple'}}),'purple');
 assert.equal(key(node,{A1o:'red'},{A1o:{color:'purple'}}),'red');
 assert.equal(key(node,{A1o:'invalid'},{A1o:{color:'invalid'}}),'green');
 assert.equal(key({id:'A1n',t:'Отказ',k:'red'}),'red');
 assert.equal(key({id:'U5',t:'Анализ отказа',k:'amber'}),'yellow');
 assert.equal(key({id:'A1c',t:'На рассмотрении в суде',k:'cyan'}),'gray');
 assert.equal(key({id:'A',t:'Судебный акт вынесен'}),'blue');
});
test('spotlight selects only target, direct rule neighbors and actual transition peers',()=>{
 const links=[{from:'parent',to:'x'},{from:'x',to:'child'},{from:'child',to:'grandchild'},{from:'other',to:'other2'}];
 const routes=[{from:'x',to:'destination'},{from:'source',to:'x'},{from:'other',to:'other2'}];
 const peers=context.spotlightPeers('x',links,routes);
 assert.deepEqual([...peers].sort(),['child','destination','parent','source','x']);
 assert.equal(links.length,4);assert.equal(routes.length,3);
});
