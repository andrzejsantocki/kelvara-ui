const assert=require("assert"),fs=require("fs");
const html=fs.readFileSync("app.html","utf8"),js=fs.readFileSync("app.js","utf8");
assert(!html.includes("Workspace ready"),"visible workspace ready helper leak");
assert(!html.includes('class="sr-only"'),"undefined sr-only helper");
assert(js.includes("function renderOverview"));
assert(!js.includes("classList.toggle(\"hidden\",!Boolean(p))"),"stale copied position hack");
assert(html.includes("aria-selected=\"false\""),"tab semantics");
assert(html.includes('id="evacuation-title">Prepare manual exit'),"manual exit modal copy");
console.log("workspace journey runtime passed");
