const api = globalThis.browser || globalThis.chrome;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function recommendations(sorted) {
  const ideas = {
    Technology: ['Compare two tools you use','Explore a beginner-friendly project'], Sports: ['Learn the stats behind a recent match','Explore training techniques'],
    Gaming: ['Discover an indie game genre','Explore game design and storytelling'], Travel: ['Build a weekend itinerary','Compare sustainable travel options'],
    Food: ['Try a recipe from a new cuisine','Learn a practical cooking technique'], Finance: ['Learn a budgeting method','Compare long-term investing basics'],
    Science: ['Explore a recent scientific discovery','Learn the basics behind a big question'], Education: ['Find a short course to build a skill','Try a hands-on tutorial'],
    Entertainment: ['Explore a new artist or film genre','Read about how a favorite work was made'], Health: ['Explore evidence-based wellness habits','Learn a new mobility routine'],
    Shopping: ['Compare product durability and repairability','Learn what specs matter most'], Design: ['Explore a design case study','Try a small interface redesign'],
    Business: ['Study a business case study','Explore a practical productivity framework'], General: ['Explore a topic you have been curious about','Try a beginner guide to a new skill']
  };
  if (!sorted.length) return '<p class="muted">Your suggestions will appear after a few pages.</p>';
  return sorted.slice(0,2).map(([topic]) => `<div class="suggestion"><strong>${esc(topic)}</strong><span>${esc((ideas[topic] || ideas.General)[0])}</span><a target="_blank" rel="noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(topic+' guide')}">Explore topic ↗</a></div>`).join('');
}
async function render() {
  const {enabled=true, visits=[], aiEnabled=false} = await api.storage.local.get({enabled:true,visits:[],aiEnabled:false});
  $('statusDot').classList.toggle('off',!enabled); $('statusText').textContent=enabled?'Tracking is on':'Tracking is paused';
  $('toggleBtn').textContent=enabled?'Pause':'Resume'; $('visitCount').textContent=`${visits.length} visits`;
  const counts={}; visits.forEach(v=>(v.topics||['General']).forEach(t=>counts[t]=(counts[t]||0)+1));
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  $('topics').innerHTML=sorted.length?sorted.map(([name,count])=>`<div class="topic"><div class="topic-line"><span>${esc(name)}</span><b>${count}</b></div><div class="bar"><span style="width:${Math.max(5,count/sorted[0][1]*100)}%"></span></div></div>`).join(''):'<p class="muted">Browse a few pages to discover your interests.</p>';
  $('recommendations').innerHTML=recommendations(sorted);
  $('aiBadge').textContent=aiEnabled?'AI classification enabled':'Local classification';
  $('recent').innerHTML=visits.slice(-5).reverse().map(v=>`<div class="visit"><div class="favicon">◉</div><div class="visit-text"><strong>${esc(v.title||v.domain)}</strong><span>${esc(v.domain)} · ${(v.topics||[]).map(esc).join(', ')} · ${esc(v.classifier||'Local')}</span></div></div>`).join('')||'<p class="muted">No browsing activity recorded yet.</p>';
}
$('toggleBtn').addEventListener('click',async()=>{const {enabled=true}=await api.storage.local.get({enabled:true});await api.storage.local.set({enabled:!enabled});render();});
$('clearBtn').addEventListener('click',async()=>{if(confirm('Delete all locally stored browsing activity?')){await api.storage.local.set({visits:[]});render();}});
render();
