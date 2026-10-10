const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('app.html','utf8'),js=fs.readFileSync('app.js','utf8');
assert(html.includes('class="product-pending" hidden'),'compatibility destination container missing');
assert(!js.includes('document.querySelector("main").classList.remove("product-pending")'),'session finalization must not require removed main element');
assert(js.includes('document.querySelector(".product-pending")?.classList.remove("product-pending")'),'session finalization must tolerate hidden compatibility container');
console.log('session destination container contract passed');
