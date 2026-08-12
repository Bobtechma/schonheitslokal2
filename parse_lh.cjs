const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./lighthouse_prod_final2.json', 'utf8'));

console.log("--- SCORES ---");
for (const cat in data.categories) {
    console.log(`${data.categories[cat].title}: ${Math.round(data.categories[cat].score * 100)}`);
}

console.log("\n--- METRICS ---");
console.log(`FCP: ${data.audits['first-contentful-paint'].displayValue}`);
console.log(`LCP: ${data.audits['largest-contentful-paint'].displayValue}`);
console.log(`TBT: ${data.audits['total-blocking-time'].displayValue}`);
console.log(`CLS: ${data.audits['cumulative-layout-shift'].displayValue}`);
console.log(`SI: ${data.audits['speed-index'].displayValue}`);

console.log("\n--- FAILED AUDITS ---");
for (const auditId in data.audits) {
    const audit = data.audits[auditId];
    if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'manual' && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
        console.log(`${audit.title} (Score: ${audit.score})`);
    }
}
