const assert=require('assert'),fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
assert.match(css,/\.selected-protection-actions \.secondary\s*\{[^}]*grid-column:2[^}]*justify-self:stretch/,'View safeguards must occupy the right column');
assert.match(css,/@media\(max-width:720px\)[\s\S]*\.selected-protection-actions \.secondary\s*\{[^}]*grid-column:1/,'mobile button must return to the single column');
console.log('protection safeguards alignment passed');
