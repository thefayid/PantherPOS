
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
const unsafeDateRegex = /new Date\(\)(?![ .]*\.(toISOString|toLocale|split|slice|getTime|substring|replace|format|toString|set|get|getFullYear|getMonth|getDate|getHours|getMinutes|getSeconds))/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (unsafeDateRegex.test(line)) {
            console.log(`${file}:${i + 1}: ${line.trim()}`);
        }
    });
});
