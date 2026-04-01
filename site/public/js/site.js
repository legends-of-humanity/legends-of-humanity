let allEntities = [];
let currentPage = 'home';

// --- NAVIGATION ---
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById('page-' + page).style.display = 'block';
  currentPage = page;
  if (page === 'home') loadHome();
  if (page === 'atlas') loadAtlas();
  if (page === 'vote') loadProposals();
}

// --- HOME ---
async function loadHome() {
  const stats = await fetch('/api/stats').then(r => r.json());
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-proposals').textContent = stats.proposals;

  // Featured cards
  if (allEntities.length === 0) {
    const data = await fetch('/api/entities').then(r => r.json());
    allEntities = data.entities;
  }
  const featured = allEntities.filter(e => e.rarity === 'Legend' || e.rarity === 'Mythic').slice(0, 6);
  const el = document.getElementById('featured-cards');
  el.innerHTML = featured.map(e => renderEntityCard(e)).join('');
}

// --- ATLAS ---
async function loadAtlas() {
  const data = await fetch('/api/entities').then(r => r.json());
  allEntities = data.entities;
  renderAtlas(allEntities);
}

function searchAtlas() {
  const q = document.getElementById('atlas-search').value.toLowerCase();
  const type = document.getElementById('atlas-type').value;
  let filtered = allEntities;
  if (q) filtered = filtered.filter(e =>
    (e.name||'').toLowerCase().includes(q) ||
    (e.oneLine||'').toLowerCase().includes(q) ||
    (e.tags||[]).some(t => t.toLowerCase().includes(q))
  );
  if (type) filtered = filtered.filter(e => e.entityType === type);
  renderAtlas(filtered);
}

function renderAtlas(entities) {
  const el = document.getElementById('atlas-results');
  el.innerHTML = entities.map(e => renderEntityCard(e)).join('');
}

function renderEntityCard(e) {
  const tags = (e.tags || []).slice(0, 3).map(t => `<span class="ec-tag">${t}</span>`).join('');
  return `<div class="entity-card" onclick="showEntity('${e.id}')">
    <div class="ec-type">${e.entityType || ''}${e.category ? ' · ' + e.category : ''}</div>
    <div class="ec-name">${e.name}</div>
    <div class="ec-oneline">${e.oneLine || e.summary || ''}</div>
    <div class="ec-tags">${tags}</div>
    <div class="ec-rarity ${e.rarity || ''}">${e.rarity || ''}</div>
  </div>`;
}

// --- ENTITY DETAIL ---
async function showEntity(id) {
  const e = await fetch('/api/entities/' + id).then(r => r.json());
  if (e.error) return;
  const detail = document.getElementById('entity-detail');
  const sources = (e.sources || []).map(s =>
    `<a class="detail-source" href="${s.url}" target="_blank">📎 ${s.title}</a>`
  ).join('');

  const powerProfile = e.power_profile ? `
    <div class="detail-section">
      <h4>Power Profile</h4>
      ${e.power_profile.net_worth_usd ? `<p>💰 Net Worth: $${(e.power_profile.net_worth_usd/1e9).toFixed(1)}B</p>` : ''}
      ${e.power_profile.revenue_usd ? `<p>📈 Revenue: $${(e.power_profile.revenue_usd/1e9).toFixed(1)}B</p>` : ''}
      ${e.power_profile.power_type ? `<p>⚡ Power Type: ${Array.isArray(e.power_profile.power_type) ? e.power_profile.power_type.join(', ') : e.power_profile.power_type}</p>` : ''}
      ${e.power_profile.influence_regions ? `<p>🌍 Influence: ${e.power_profile.influence_regions.join(', ')}</p>` : ''}
    </div>` : '';

  const accountability = e.accountability ? `
    <div class="detail-section">
      <h4>Accountability</h4>
      <p>Transparency Score: ${'🟢'.repeat(e.accountability.transparency_score || 0)}${'⚫'.repeat(5 - (e.accountability.transparency_score || 0))} (${e.accountability.transparency_score || '?'}/5)</p>
      <p>Source Quality: ${e.accountability.source_quality || 'unknown'}</p>
    </div>` : '';

  detail.innerHTML = `
    <h2>${e.name}</h2>
    <div class="detail-type">${e.entityType || ''}${e.rarity ? ' · ' + e.rarity : ''}${e.cluster ? ' · ' + e.cluster : ''}</div>
    <div class="vote-inline">
      <button onclick="voteEntity('${e.id}','up')">👍</button>
      <span class="vote-score">${e._votes || 0}</span>
      <button onclick="voteEntity('${e.id}','down')">👎</button>
    </div>
    ${e.oneLine ? `<div class="detail-section"><h4>Summary</h4><p>${e.oneLine}</p></div>` : ''}
    ${e.whyItMatters ? `<div class="detail-section"><h4>Why It Matters</h4><p>${e.whyItMatters}</p></div>` : ''}
    ${e.context ? `<div class="detail-section"><h4>Context</h4><p>${e.context}</p></div>` : ''}
    ${e.contradictions ? `<div class="detail-section"><h4>Contradictions</h4><p>${e.contradictions}</p></div>` : ''}
    ${powerProfile}
    ${accountability}
    ${sources ? `<div class="detail-section"><h4>Sources</h4>${sources}</div>` : ''}
    <div class="detail-section"><h4>Help Improve</h4><p>See an error? Have a better source? <a href="https://github.com/legends-of-humanity/legends-of-humanity" target="_blank">Contribute on GitHub</a>.</p></div>
  `;
  document.getElementById('entity-modal').style.display = 'flex';
}

async function voteEntity(id, direction) {
  const res = await fetch('/api/entities/' + id + '/vote', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ direction })
  }).then(r => r.json());
  document.querySelector('.vote-score').textContent = res.votes;
}

// --- PROPOSALS ---
function showProposalForm() {
  const form = document.getElementById('proposal-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function submitProposal() {
  const data = {
    name: document.getElementById('prop-name').value,
    entityType: document.getElementById('prop-type').value,
    reason: document.getElementById('prop-reason').value,
    submittedBy: document.getElementById('prop-by').value || 'anonymous'
  };
  if (!data.name) return;
  await fetch('/api/proposals', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  document.getElementById('prop-name').value = '';
  document.getElementById('prop-reason').value = '';
  document.getElementById('proposal-form').style.display = 'none';
  loadProposals();
}

async function loadProposals() {
  const proposals = await fetch('/api/proposals').then(r => r.json());
  const el = document.getElementById('proposals-list');
  if (proposals.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:#555;padding:32px">No proposals yet. Be the first!</div>';
    return;
  }
  el.innerHTML = proposals.sort((a,b) => (b.upvotes-b.downvotes) - (a.upvotes-a.downvotes)).map(p => `
    <div class="proposal">
      <div class="proposal-votes">
        <button onclick="voteProposal('${p.id}','up')">▲</button>
        <span class="vote-count">${p.upvotes - p.downvotes}</span>
        <button onclick="voteProposal('${p.id}','down')">▼</button>
      </div>
      <div class="proposal-body">
        <div class="prop-name">${p.name}</div>
        <div class="prop-type">${p.entityType} · by ${p.submittedBy} · ${new Date(p.submittedAt).toLocaleDateString()}</div>
        <div class="prop-reason">${p.reason}</div>
      </div>
    </div>
  `).join('');
}

async function voteProposal(id, direction) {
  await fetch('/api/proposals/' + id + '/vote', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ direction })
  });
  loadProposals();
}

// --- GAME ---
function launchGame() {
  const frame = document.getElementById('game-frame');
  frame.style.display = 'block';
  frame.src = '/game/';
}

function launchGameAI(difficulty) {
  const frame = document.getElementById('game-frame');
  frame.style.display = 'block';
  frame.src = '/game/?ai=' + difficulty;
}

// --- INIT ---
loadHome();
