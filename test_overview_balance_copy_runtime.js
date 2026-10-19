const assert=require('assert'),fs=require('fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
assert(app.includes("mapped.symbol==='Underlying token'?'':` ${mapped.symbol}`"),'unknown token label must be omitted');
assert.match(app,/usd\.className='overview-position-usd'/,'USD value needs a dedicated line');
assert.match(css,/\.overview-position-balance\{[^}]*flex-direction:column/,'balance cell must stack amount and USD value');
assert.match(css,/\.overview-position-usd\{[^}]*margin-top:[^;}]+/,'USD value needs spacing below amount');
console.log('overview balance copy passed');
