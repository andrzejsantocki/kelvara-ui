const assert=require('assert'),fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
for(const token of ['.topbar{height:76px','.wordmark','.wallet-control','.wallet-chip','.avatar.has-identicon','#f7f7f5','#e2e2de','border-radius:999px']) assert(css.includes(token),`missing ${token}`);
console.log('product header CSS contract passed');
