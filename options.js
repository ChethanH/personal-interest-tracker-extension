const api = globalThis.browser || globalThis.chrome;
const $ = id => document.getElementById(id);
const normalize = s => s.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'').replace(/:\d+$/,'');
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function render() {
 const {enabled=true,excludedDomains=[],aiEnabled=false,aiApiKey='',aiModel='gpt-4o-mini'}=await api.storage.local.get({enabled:true,excludedDomains:[],aiEnabled:false,aiApiKey:'',aiModel:'gpt-4o-mini'});
 $('enabled').checked=enabled; $('aiEnabled').checked=aiEnabled; $('apiKey').value=aiApiKey; $('model').value=aiModel;
 $('domains').innerHTML=excludedDomains.map(d=>`<div class="domain"><span>${esc(d)}</span><button data-domain="${esc(d)}" aria-label="Remove ${esc(d)}">Remove</button></div>`).join('')||'<p class="muted">No excluded websites.</p>';
 $('domains').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',async()=>{const current=await api.storage.local.get({excludedDomains:[]});await api.storage.local.set({excludedDomains:current.excludedDomains.filter(d=>d!==btn.dataset.domain)});render();}));
}
$('enabled').addEventListener('change',async e=>{await api.storage.local.set({enabled:e.target.checked});$('message').textContent=e.target.checked?'Tracking enabled.':'Tracking paused.';});
$('saveAI').addEventListener('click',async()=>{const key=$('apiKey').value.trim(),model=$('model').value.trim()||'gpt-4o-mini',enabled=$('aiEnabled').checked;if(enabled&&!key){$('aiMessage').textContent='Add an API key or turn AI classification off.';return;}if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(model)){$('aiMessage').textContent='Enter a valid model name.';return;}await api.storage.local.set({aiEnabled:enabled,aiApiKey:key,aiModel:model});$('aiMessage').textContent=enabled?'AI settings saved. New pages may incur API charges.':'AI disabled. Local classification remains active.';});
$('excludeForm').addEventListener('submit',async e=>{e.preventDefault();const domain=normalize($('domainInput').value);if(!/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain)||!domain.includes('.')){$('message').textContent='Enter a valid domain, such as example.com.';return;}const {excludedDomains=[]}=await api.storage.local.get({excludedDomains:[]});if(!excludedDomains.includes(domain))await api.storage.local.set({excludedDomains:[...excludedDomains,domain]});$('domainInput').value='';$('message').textContent=`${domain} excluded.`;render();});
$('deleteAll').addEventListener('click',async()=>{if(confirm('Permanently delete all activity stored by Interest Tracker?')){await api.storage.local.set({visits:[]});$('message').textContent='All extension activity deleted.';}});
render();
