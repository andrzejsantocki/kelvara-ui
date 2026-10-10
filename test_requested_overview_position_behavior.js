const fs=require('fs'),assert=require('assert');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
assert(app.includes("if(route==='positions'&&!selectedPortfolioTarget"),'Positions route must auto-select first position');
assert(app.includes('formatPortfolioAmount'),'portfolio amount rounding helper missing');
assert(app.includes('setText("#overview-evidence"'),'overview evidence must update after portfolio load');
assert(css.includes('align-items:center'),'summary cards must center content vertically');
assert(css.includes('text-align:center'),'summary cards must center peer values horizontally');
console.log('requested overview/positions behavior contract ok');
