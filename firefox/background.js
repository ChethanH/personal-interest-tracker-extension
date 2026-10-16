// Interest Tracker v2: local-first tracking with opt-in OpenAI classification.
const DEFAULTS = {
  enabled: true, visits: [], excludedDomains: [], aiEnabled: false,
  aiApiKey: '', aiModel: 'gpt-4o-mini'
};
const api = globalThis.browser || globalThis.chrome;
async function state() { return await api.storage.local.get(DEFAULTS); }
function isTrackable(url) {
  try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}
const RULES = {
  Technology: /technology|software|programming|javascript|python|\bai\b|machine learning|developer|github|computer|cloud computing|cybersecurity/i,
  Sports: /sports?|football|soccer|cricket|basketball|tennis|olympics|formula 1/i,
  Gaming: /gaming|video games?|playstation|xbox|nintendo|steam game|esports/i,
  Travel: /travel|tourism|flight|hotel|destination|backpacking|vacation/i,
  Food: /food|recipe|cooking|restaurant|baking|coffee|cuisine/i,
  Finance: /finance|investing|stocks?|banking|budget|personal finance|cryptocurrency/i,
  Science: /science|space|astronomy|physics|biology|research|nature/i,
  Education: /education|course|tutorial|university|learning|lesson|study guide/i,
  Entertainment: /movie|movies|music|tv show|celebrity|entertainment|streaming/i,
  Health: /fitness|exercise|wellness|nutrition|health|workout|meditation/i,
  Shopping: /shopping|product review|buying guide|price comparison|deals/i,
  Design: /design|typography|illustration|ux\b|ui\b|graphic design|architecture/i,
  Business: /business|startup|entrepreneur|marketing|management|leadership/i
};
function localTopics(text) {
  const matches = Object.entries(RULES).filter(([,re]) => re.test(text)).map(([topic]) => topic);
  return matches.length ? matches.slice(0, 3) : ['General'];
}
async function classifyWithAI(title, domain, settings) {
  // Only page title and domain are sent. No page body, full URL, query string, or user input.
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: {
      'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.aiApiKey}`
    },
    body: JSON.stringify({
      model: settings.aiModel || 'gpt-4o-mini', temperature: 0,
      max_tokens: 100,
      messages: [
        {role:'system', content:'Classify a webpage into 1 to 3 broad interest topics. Return only a JSON array of short topic names, no explanation. Use neutral general-interest categories; do not infer sensitive personal traits.'},
        {role:'user', content: JSON.stringify({title: title.slice(0,180), domain})}
      ]
    })
  });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const parsed = JSON.parse(content.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
  if (!Array.isArray(parsed)) throw new Error('Unexpected AI response');
  const topics = parsed.filter(x => typeof x === 'string').map(x => x.trim()).filter(x => x && x.length <= 40).slice(0,3);
  return topics.length ? [...new Set(topics)] : ['General'];
}
async function enrichVisit(visitId, title, domain, settings) {
  try {
    const topics = await classifyWithAI(title, domain, settings);
    const current = await state();
    const visits = current.visits.map(v => v.id === visitId ? {...v, topics, classifier:'AI'} : v);
    await api.storage.local.set({visits});
  } catch (error) {
    // Keep the local classification on errors; never log credentials or page details.
    const current = await state();
    const visits = current.visits.map(v => v.id === visitId ? {...v, classifier:'Local fallback'} : v);
    await api.storage.local.set({visits});
  }
}
async function recordTab(tabId) {
  let tab; try { tab = await api.tabs.get(tabId); } catch { return; }
  if (!tab || !isTrackable(tab.url || '')) return;
  const data = await state(); if (!data.enabled) return;
  let url; try { url = new URL(tab.url); } catch { return; }
  if (data.excludedDomains.some(d => url.hostname === d || url.hostname.endsWith('.' + d))) return;
  const title = (tab.title || '').slice(0,180);
  const recent = data.visits.find(v => v.domain === url.hostname && v.title === title && Date.now() - v.time < 30000);
  if (recent) return;
  const visit = {id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, domain:url.hostname, title,
    topics:localTopics(`${title} ${url.hostname.replace(/[.-]/g,' ')}`), classifier:'Local', time:Date.now()};
  await api.storage.local.set({visits:[...data.visits,visit].slice(-2000)});
  if (data.aiEnabled && data.aiApiKey) void enrichVisit(visit.id, title, url.hostname, data);
}
api.tabs.onActivated.addListener(({tabId}) => { void recordTab(tabId); });
api.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.title) void recordTab(tabId);
});
