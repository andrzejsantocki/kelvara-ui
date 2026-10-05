const assert=require("assert"),fs=require("fs");
const html=fs.readFileSync("app.html","utf8"),js=fs.readFileSync("app.js","utf8");
assert(html.includes("id=\"workspace-journey\""),"workspace journey landmark");
assert(js.includes("function renderOverview"));
assert(!js.includes("classList.toggle(\"hidden\",!Boolean(p))"),"stale copied position hack");
assert(html.includes("aria-selected=\"false\""),"tab semantics");
console.log("workspace journey runtime passed");
