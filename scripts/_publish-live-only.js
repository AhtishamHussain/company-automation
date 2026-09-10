const w=require('/tmp/all-workflows.json');
const a=Array.isArray(w)?w:[w];
const {execSync}=require('child_process');
let ok=0, fail=0;
for (const x of a.filter(i => String(i.name||'').startsWith('Live |'))) {
  try {
    console.log('publish', x.id, x.name);
    execSync('n8n publish:workflow --id=' + x.id, { stdio: 'inherit' });
    ok++;
  } catch { fail++; }
}
console.log('PUBLISHED_LIVE ok=' + ok + ' fail=' + fail);
