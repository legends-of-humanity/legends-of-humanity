const socket = io();

const RESOURCE_ORDER = ['money', 'data', 'ai', 'oil', 'forest', 'labor', 'influence'];
const RESOURCE_META = {
  money: { label: 'Money', icon: '💰', className: 'resource-money' },
  data: { label: 'Data', icon: '📊', className: 'resource-data' },
  ai: { label: 'AI', icon: '🤖', className: 'resource-ai' },
  oil: { label: 'Oil', icon: '🛢️', className: 'resource-oil' },
  forest: { label: 'Forest', icon: '🌲', className: 'resource-forest' },
  labor: { label: 'Labor', icon: '👷', className: 'resource-labor' },
  influence: { label: 'Influence', icon: '📢', className: 'resource-influence' }
};
const STARTING_RESOURCES = Object.freeze({
  money: 5,
  data: 3,
  ai: 1,
  oil: 2,
  forest: 2,
  labor: 3,
  influence: 2
});
const ACTION_COSTS = Object.freeze({
  Build: { money: 2, labor: 1 },
  Reform: { money: 1, influence: 1 },
  Coordinate: { influence: 1, labor: 1 },
  Mobilize: { money: 2, oil: 1 },
  Reveal: { data: 2 },
  Pressure: { influence: 2, money: 1 },
  Stabilize: { money: 1, forest: 1 },
  Extract: { oil: 2 },
  Invest: { money: 3 },
  Protect: { money: 1, labor: 1, forest: 1 },
  Reconcile: { influence: 1, forest: 1, labor: 1 },
  Disrupt: { data: 2, ai: 1 }
});
const ACTION_HELP = Object.freeze({
  Build: '+2 Power',
  Reform: '+2 Legitimacy, -1 Instability',
  Coordinate: '+1 Legitimacy, +1 Harmony',
  Mobilize: '+3 Power, +1 Instability',
  Reveal: '+1 Legitimacy, -1 opponent Legitimacy',
  Pressure: '+1 Power, -1 opponent Legitimacy',
  Stabilize: '+1 Harmony, -2 Instability',
  Extract: '+3 Power, +1 Instability',
  Invest: '+1 Power, +1 Legitimacy',
  Protect: '+1 Power, +1 Harmony, -1 Instability',
  Reconcile: '+1 Legitimacy, +2 Harmony, -1 Instability',
  Disrupt: '-1 opponent Power, -1 opponent Legitimacy, +1 Instability'
});
const ACTIONS = Object.keys(ACTION_COSTS);
const RARITY_WEIGHT = Object.freeze({
  Mythic: 3,
  Legend: 2,
  Relic: 1,
  Archive: 1,
  Signal: 0
});
const ENTITY_ICONS = Object.freeze({
  Person: '◉',
  Organization: '◈',
  Idea: '✦',
  Movement: '✹',
  Technology: '⬢',
  Country: '⬣',
  Resource: '⬡'
});
const REASON_MAP = Object.freeze({
  force: 'Force Victory. Raw board power crossed the win threshold first.',
  influence: 'Influence Victory. Power and legitimacy scaled together into control.',
  innovation: 'Innovation Victory. Knowledge infrastructure outpaced the board.',
  harmony: 'Harmony Victory. Stability, trust, and legitimacy overcame escalation.',
  turn_limit: 'Turn limit reached. Highest total score decided the match.',
  disconnect: 'Opponent disconnected before the match could finish.'
});
const ATLAS = Object.freeze({
  gandhi: {
    oneLine: 'Indian anti-colonial leader who turned nonviolent resistance into a world-scale political force.',
    whyItMatters: 'Gandhi helped redefine resistance, legitimacy, and moral courage in politics.',
    context: 'British colonial rule in India, anti-colonial mass mobilization, and global decolonization movements formed the world in which Gandhi’s influence expanded.',
    contradictions: 'His legacy is globally revered but also debated for political, social, and personal contradictions.',
    related: ['Nonviolence', 'Nelson Mandela', 'Martin Luther King Jr.', 'Anti-colonial struggle'],
    themes: ['Peace'],
    tags: ['nonviolence', 'anti-colonialism', 'peace'],
    judgment: {
      'Peace contribution': 'High',
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Knowledge contribution': 'Medium',
      'Truth contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'Encyclopaedia Britannica — Mahatma Gandhi', url: 'https://www.britannica.com/biography/Mahatma-Gandhi', type: 'reference' },
      { title: 'History.com — Mahatma Gandhi', url: 'https://www.history.com/topics/india/mahatma-gandhi', type: 'reference' }
    ]
  },
  'malcolm-x': {
    oneLine: 'A transformative voice of Black dignity, self-determination, and political clarity.',
    whyItMatters: 'Malcolm X expanded the language of liberation far beyond mainstream respectability.',
    context: 'He emerged during the U.S. civil rights era but widened toward anti-colonial, international, and structural analysis.',
    contradictions: 'He is often flattened into a one-note symbol, obscuring his evolution, strategic intelligence, and moral seriousness.',
    related: ['Civil Rights Movement', 'Freedom of Speech', 'Martin Luther King Jr.', 'Black liberation thought'],
    themes: ['Dignity', 'Truth'],
    tags: ['civil rights', 'dignity', 'truth'],
    judgment: {
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Truth contribution': 'High',
      'Peace contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'High',
      'Harm / controversy': 'Medium'
    },
    sources: [
      { title: 'Britannica — Malcolm X', url: 'https://www.britannica.com/biography/Malcolm-X', type: 'reference' },
      { title: 'The Malcolm X Project at Columbia University', url: 'https://malcolmxproject.columbia.edu/', type: 'archive' }
    ]
  },
  'open-source': {
    oneLine: 'The principle that knowledge and code can be built, shared, and improved collaboratively in public.',
    whyItMatters: 'Open source is one of the strongest coordination models of the digital age.',
    context: 'The open-source ethos emerged through software culture but now influences infrastructure, public knowledge, and collaborative governance.',
    contradictions: 'Open systems can still be underfunded, exploited, or absorbed into private value extraction.',
    related: ['Linux', 'The Internet', 'Open Knowledge Movement', 'Decentralization'],
    themes: ['Knowledge', 'Truth'],
    tags: ['software', 'collaboration', 'internet'],
    judgment: {
      'Knowledge contribution': 'High',
      'Truth contribution': 'Medium',
      'Coordination contribution': 'High',
      'Freedom contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'Medium',
      'Harm / controversy': 'Low-Medium'
    },
    sources: [
      { title: 'Open Source Initiative', url: 'https://opensource.org/', type: 'primary' },
      { title: 'Britannica — Open-source software', url: 'https://www.britannica.com/technology/open-source-software', type: 'reference' }
    ]
  },
  nonviolence: {
    oneLine: 'A moral and political strategy that seeks transformation without reproducing cycles of violent domination.',
    whyItMatters: 'Nonviolence became one of the most powerful civilizational ideas for collective action and peace-oriented resistance.',
    context: 'It appears in multiple philosophical and religious traditions, but became globally influential as a strategic and political force in anti-colonial and civil-rights struggles.',
    contradictions: 'Its effectiveness depends on context, discipline, and the character of the opposing system; it is often romanticized or oversimplified.',
    related: ['Mahatma Gandhi', 'Civil Rights Movement', 'Nelson Mandela', 'Martin Luther King Jr.'],
    themes: ['Peace'],
    tags: ['peace', 'resistance', 'ethics'],
    judgment: {
      'Peace contribution': 'High',
      'Dignity contribution': 'High',
      'Freedom contribution': 'Medium-High',
      'Coordination contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'Medium-High'
    },
    sources: [
      { title: 'Britannica — nonviolence', url: 'https://www.britannica.com/topic/nonviolence', type: 'reference' }
    ]
  },
  'civil-rights-movement': {
    oneLine: 'A mass struggle against racial oppression that reshaped law, legitimacy, and moral consciousness.',
    whyItMatters: 'It demonstrates how organized, sustained moral struggle can force structural change.',
    context: 'The movement emerged against systems of segregation and racial oppression, using litigation, protest, organizing, and moral confrontation to transform law and public legitimacy.',
    contradictions: 'Public memory often sanitizes the movement, flattening its internal tensions, strategic diversity, and unfinished goals.',
    related: ['Rosa Parks', 'Malcolm X', 'Martin Luther King Jr.', 'Nonviolence'],
    themes: ['Dignity', 'Justice'],
    tags: ['justice', 'equality', 'resistance', 'dignity'],
    judgment: {
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Peace contribution': 'Medium',
      'Truth contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'Britannica — civil rights movement', url: 'https://www.britannica.com/event/American-civil-rights-movement', type: 'reference' },
      { title: 'National Archives — Civil Rights Records', url: 'https://www.archives.gov/research/african-americans/individuals/civil-rights.html', type: 'archive' }
    ]
  },
  linux: {
    oneLine: 'An open-source kernel that became critical infrastructure for the digital world.',
    whyItMatters: 'Linux demonstrates how public collaboration can generate world-scale technical infrastructure.',
    context: 'Created in the early 1990s, Linux grew from a software project into a foundational layer for servers, embedded systems, cloud infrastructure, and countless digital services.',
    contradictions: 'Its openness did not prevent concentration of power in the ecosystems built on top of it, nor did it eliminate labor and funding imbalances.',
    related: ['Open Source', 'The Internet', 'Semiconductor Manufacturing'],
    themes: ['Knowledge', 'Truth'],
    tags: ['open source', 'infrastructure', 'computing'],
    judgment: {
      'Knowledge contribution': 'High',
      'Coordination contribution': 'High',
      'Truth contribution': 'Medium',
      'Freedom contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'Medium'
    },
    sources: [
      { title: 'Britannica — Linux', url: 'https://www.britannica.com/technology/Linux', type: 'reference' },
      { title: 'The Linux Kernel Archives', url: 'https://www.kernel.org/', type: 'primary' }
    ]
  },
  'martin-luther-king-jr': {
    oneLine: 'Civil rights leader who fused nonviolent struggle, moral rhetoric, and mass organizing into a transformative public force.',
    whyItMatters: 'MLK helped make civil rights and nonviolent resistance legible as universal democratic and moral struggles.',
    context: 'He emerged as a leading figure in the U.S. civil rights movement through campaigns, speeches, and organizing that confronted segregation, racism, and economic injustice.',
    contradictions: 'Public memory often narrows him into a safe symbol while ignoring his wider critique of militarism, poverty, and structural power.',
    related: ['Mahatma Gandhi', 'Nonviolence', 'Civil Rights Movement', 'Malcolm X', 'Rosa Parks'],
    themes: ['Peace', 'Dignity'],
    tags: ['civil rights', 'nonviolence', 'justice'],
    judgment: {
      'Peace contribution': 'High',
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Truth contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'Medium-High'
    },
    sources: [
      { title: 'Britannica — Martin Luther King, Jr.', url: 'https://www.britannica.com/biography/Martin-Luther-King-Jr', type: 'reference' },
      { title: 'The Martin Luther King, Jr. Research and Education Institute', url: 'https://kinginstitute.stanford.edu/', type: 'archive' }
    ]
  },
  'nelson-mandela': {
    oneLine: 'Anti-apartheid leader whose life became a global symbol of resistance, endurance, and reconciliation.',
    whyItMatters: 'Mandela represents the rare combination of resistance legitimacy and post-conflict reconciliation power.',
    context: 'He emerged from the anti-apartheid struggle in South Africa and later became a global symbol of political endurance and negotiated transition.',
    contradictions: 'His symbolic role can overshadow the broader movement, historical violence, and structural realities surrounding apartheid and transition.',
    related: ['Anti-Apartheid Movement', 'Mahatma Gandhi', 'Nonviolence'],
    themes: ['Peace', 'Dignity'],
    tags: ['anti-apartheid', 'reconciliation', 'leadership'],
    judgment: {
      'Peace contribution': 'High',
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Coordination contribution': 'High',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'Britannica — Nelson Mandela', url: 'https://www.britannica.com/biography/Nelson-Mandela', type: 'reference' },
      { title: 'Nelson Mandela Foundation', url: 'https://www.nelsonmandela.org/', type: 'archive' }
    ]
  },
  'rosa-parks': {
    oneLine: 'Civil rights figure whose refusal to surrender her bus seat became a catalytic act of resistance.',
    whyItMatters: 'Rosa Parks shows how a single act, in the right context, can become history-shaping when connected to organized struggle.',
    context: 'Her act of resistance in Montgomery became a flashpoint within a much larger movement of Black organizing, legal struggle, and strategic protest.',
    contradictions: 'Public memory often simplifies her into an accidental heroine, obscuring her political consciousness and movement context.',
    related: ['Civil Rights Movement', 'Martin Luther King Jr.', 'Malcolm X'],
    themes: ['Dignity', 'Justice'],
    tags: ['civil rights', 'resistance', 'dignity'],
    judgment: {
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Peace contribution': 'Medium',
      'Truth contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'Medium'
    },
    sources: [
      { title: 'Britannica — Rosa Parks', url: 'https://www.britannica.com/biography/Rosa-Parks', type: 'reference' },
      { title: "National Women's History Museum — Rosa Parks", url: 'https://www.womenshistory.org/education-resources/biographies/rosa-parks', type: 'reference' }
    ]
  },
  'the-internet': {
    oneLine: 'A global network system that transformed communication, coordination, publishing, and power.',
    whyItMatters: 'The internet reshaped how humans share knowledge, build communities, coordinate work, spread propaganda, and contest truth.',
    context: 'Built from layered network and computing systems, the internet evolved from research and military origins into global civilian infrastructure with enormous social and political consequences.',
    contradictions: 'It expanded access and coordination while also accelerating surveillance, fragmentation, manipulation, and attention capture.',
    related: ['Open Source', 'Linux', 'Freedom of Speech', 'United Nations'],
    themes: ['Knowledge', 'Coordination'],
    tags: ['network', 'communication', 'infrastructure', 'information'],
    judgment: {
      'Knowledge contribution': 'High',
      'Coordination contribution': 'High',
      'Truth contribution': 'Medium-Low',
      'Freedom contribution': 'Medium-High',
      'Long-term influence': 'Very High',
      'Moral complexity': 'Very High'
    },
    sources: [
      { title: 'Britannica — Internet', url: 'https://www.britannica.com/technology/Internet', type: 'reference' },
      { title: 'Internet Society — History and open internet resources', url: 'https://www.internetsociety.org/internet/history-internet/brief-history-internet/', type: 'reference' }
    ]
  },
  'anti-apartheid-movement': {
    oneLine: 'A long struggle against racial domination in South Africa that reshaped global moral and political legitimacy.',
    whyItMatters: 'The anti-apartheid movement shows how national resistance and international pressure can combine to delegitimize entrenched oppression.',
    context: 'It included local organizers, global solidarity networks, imprisoned leaders, and institutional pressure campaigns across decades.',
    contradictions: 'Its memory can become overly personalized around singular leaders, obscuring the complexity, violence, and mass nature of the struggle.',
    related: ['Nelson Mandela', 'United Nations', 'Nonviolence'],
    themes: ['Dignity', 'Freedom'],
    tags: ['anti-apartheid', 'resistance', 'justice', 'freedom'],
    judgment: {
      'Dignity contribution': 'High',
      'Freedom contribution': 'High',
      'Peace contribution': 'Medium',
      'Coordination contribution': 'High',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'Britannica — apartheid', url: 'https://www.britannica.com/topic/apartheid', type: 'reference' },
      { title: 'South African History Online — Anti-apartheid struggle', url: 'https://www.sahistory.org.za/article/anti-apartheid-struggle-south-africa-1912-1994', type: 'archive' }
    ]
  },
  'freedom-of-speech': {
    oneLine: 'A foundational principle protecting the ability to speak, publish, dissent, and contest power.',
    whyItMatters: 'Freedom of speech is central to democratic contestation, truth-seeking, artistic expression, and resistance to censorship.',
    context: 'The idea evolved across legal, political, philosophical, and media systems, with different societies balancing it differently against harm and order.',
    contradictions: 'It can protect truth-seeking and dissent while also being invoked to shield manipulation, harassment, and destructive speech.',
    related: ['Malcolm X', 'The Internet', 'United Nations'],
    themes: ['Truth', 'Freedom'],
    tags: ['speech', 'rights', 'expression', 'truth'],
    judgment: {
      'Truth contribution': 'High',
      'Freedom contribution': 'High',
      'Dignity contribution': 'Medium',
      'Peace contribution': 'Low-Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'Britannica — freedom of speech', url: 'https://www.britannica.com/topic/freedom-of-speech', type: 'reference' },
      { title: 'UDHR Article 19', url: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights', type: 'primary' }
    ]
  },
  'united-nations': {
    oneLine: 'A global institution created to coordinate states, reduce conflict, and articulate shared norms after world war.',
    whyItMatters: 'The UN represents one of the clearest attempts to formalize global coordination, rights language, and peace-oriented legitimacy at planetary scale.',
    context: 'It emerged after World War II as a response to catastrophic conflict and the need for institutions capable of reducing interstate violence and organizing collective action.',
    contradictions: 'The UN carries strong symbolic and institutional value but is constrained by power politics, veto structures, uneven enforcement, and legitimacy gaps.',
    related: ['Anti-Apartheid Movement', 'Freedom of Speech', 'The Internet', 'China'],
    themes: ['Coordination', 'Peace'],
    tags: ['institution', 'global governance', 'peace', 'coordination'],
    judgment: {
      'Peace contribution': 'Medium-High',
      'Coordination contribution': 'High',
      'Dignity contribution': 'Medium',
      'Truth contribution': 'Medium',
      'Long-term influence': 'High',
      'Moral complexity': 'High'
    },
    sources: [
      { title: 'United Nations — Charter and overview', url: 'https://www.un.org/en/about-us/un-charter', type: 'primary' },
      { title: 'Britannica — United Nations', url: 'https://www.britannica.com/topic/United-Nations', type: 'reference' }
    ]
  }
});

let myId = null;
let gameId = null;
let myName = 'You';
let gameState = null;
let myHand = [];
let selectedCards = new Set();
let submittedActions = new Map();
let localResources = cloneResources(STARTING_RESOURCES);
let pendingDeployIds = [];
let pendingDeployCards = [];
let pendingActionCost = null;
let lastProcessedTurn = 1;
let modalCardId = null;

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  renderResourceBar();
  updatePhasePresentation('setup');
  renderLog();
});

function cacheElements() {
  const ids = [
    'player-name', 'btn-join', 'btn-find', 'btn-ready', 'btn-deploy', 'btn-submit-actions',
    'lobby', 'game-screen', 'lobby-status', 'match-status', 'opponent-name', 'opp-name-display',
    'your-name-display', 'turn-num', 'max-turns', 'phase-name', 'phase-instruction',
    'instability', 'instability-fill', 'energy-flow', 'civilian-burden',
    'your-power', 'your-legitimacy', 'your-harmony', 'opp-power', 'opp-legitimacy', 'opp-harmony',
    'board', 'opponent-board', 'hand', 'hand-count', 'resource-bar', 'resource-income',
    'deploy-summary', 'action-summary', 'action-section', 'action-slots', 'game-log',
    'card-modal', 'modal-backdrop', 'modal-close', 'modal-rarity', 'modal-type', 'modal-title',
    'modal-oneliner', 'modal-cost', 'modal-generation', 'modal-why', 'modal-context',
    'modal-contradictions', 'modal-effects', 'modal-related', 'modal-judgment', 'modal-sources',
    'game-over', 'game-over-title', 'game-over-reason'
  ];
  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements['btn-join'].addEventListener('click', joinLobby);
  elements['btn-find'].addEventListener('click', findMatch);
  elements['btn-ready'].addEventListener('click', sendReady);
  elements['btn-deploy'].addEventListener('click', deploySelected);
  elements['btn-submit-actions'].addEventListener('click', submitActions);
  elements['player-name'].addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      if (!myId) {
        joinLobby();
      } else {
        findMatch();
      }
    }
  });
  elements['modal-backdrop'].addEventListener('click', closeModal);
  elements['modal-close'].addEventListener('click', closeModal);
}

function joinLobby() {
  const name = elements['player-name'].value.trim();
  if (!name) {
    setStatus('lobby-status', 'Enter a name to join the lobby.');
    return;
  }
  myName = name;
  socket.emit('join_lobby', { name });
  setStatus('lobby-status', 'Joining lobby…');
}

function findMatch() {
  setStatus('match-status', 'Searching for an opponent…');
  socket.emit('find_match');
}

function sendReady() {
  if (!gameId) return;
  socket.emit('ready', { gameId });
  elements['btn-ready'].hidden = true;
  setInstruction('Waiting for both players to ready up.');
}

function toggleCardSelection(cardId) {
  if (gameState && gameState.phase !== 'deploy') {
    return;
  }

  if (selectedCards.has(cardId)) {
    selectedCards.delete(cardId);
  } else {
    if (selectedCards.size >= 2) {
      setStatus('deploy-summary', 'You can deploy at most 2 cards per turn.');
      return;
    }

    const nextCards = myHand.filter((card) => selectedCards.has(card.id) || card.id === cardId);
    const totalCost = nextCards.reduce((acc, card) => addResources(acc, getDeployCost(card)), emptyResources());
    if (!canAfford(localResources, totalCost)) {
      setStatus('deploy-summary', 'Not enough resources for that deployment.');
      return;
    }

    selectedCards.add(cardId);
  }

  renderHand();
  updateDeploySummary();
}

function deploySelected() {
  if (!gameId || selectedCards.size === 0 || !gameState || gameState.phase !== 'deploy') {
    return;
  }

  const cards = myHand.filter((card) => selectedCards.has(card.id));
  const totalCost = cards.reduce((acc, card) => addResources(acc, getDeployCost(card)), emptyResources());
  if (!canAfford(localResources, totalCost)) {
    setStatus('deploy-summary', 'Deployment cost exceeds your current resources.');
    return;
  }

  pendingDeployIds = cards.map((card) => card.id);
  pendingDeployCards = cards.map((card) => ({ ...card }));
  localResources = subtractResources(localResources, totalCost);
  myHand = myHand.filter((card) => !selectedCards.has(card.id));
  socket.emit('deploy_cards', { gameId, cardIds: pendingDeployIds.slice() });
  selectedCards.clear();
  setInstruction('Deployment submitted. Waiting for the opponent.');
  renderAll();
}

function submitActions() {
  if (!gameId || !gameState || gameState.phase !== 'action') {
    return;
  }

  const selects = elements['action-slots'].querySelectorAll('select');
  const actions = [];
  let totalCost = emptyResources();

  for (const select of selects) {
    if (!select.value) continue;
    const cost = ACTION_COSTS[select.value];
    totalCost = addResources(totalCost, cost);
    actions.push({ cardId: select.dataset.cardId, action: select.value });
  }

  if (!canAfford(localResources, totalCost)) {
    setStatus('action-summary', 'Selected actions cost more than your available resources.');
    return;
  }

  localResources = subtractResources(localResources, totalCost);
  submittedActions = new Map(actions.map((entry) => [entry.cardId, entry.action]));
  pendingActionCost = totalCost;
  socket.emit('choose_actions', { gameId, actions });
  setInstruction('Actions locked. Waiting for resolution.');
  renderAll();
}

function renderAll() {
  renderValues();
  renderResourceBar();
  renderBoards();
  renderHand();
  renderActionSlots();
  renderLog();
  renderButtons();
}

function renderBoards() {
  renderLane(elements['board'], getMyBoard(), 'Your board is ready for the first deploy.');
  renderLane(elements['opponent-board'], getOpponentBoard(), 'Opponent cards will appear here.');
}

function renderLane(container, cards, emptyMessage) {
  container.innerHTML = '';
  if (!cards.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-lane';
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }

  cards.forEach((card) => {
    container.appendChild(createCardElement(card, resolveCardContext(card)));
  });
}

function renderHand() {
  const hand = elements['hand'];
  hand.innerHTML = '';
  elements['hand-count'].textContent = myHand.length;

  if (!myHand.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-lane';
    empty.textContent = 'Your hand is empty.';
    hand.appendChild(empty);
    updateDeploySummary();
    return;
  }

  myHand.forEach((card) => {
    const context = resolveCardContext(card);
    const cardEl = createCardElement(card, context);
    hand.appendChild(cardEl);
  });

  updateDeploySummary();
}

function renderValues() {
  if (!gameState) return;
  const me = getMe();
  const opp = getOpponent();

  elements['turn-num'].textContent = gameState.turn || 1;
  elements['max-turns'].textContent = gameState.maxTurns || 6;
  elements['phase-name'].textContent = titleCase(gameState.phase || 'setup');
  elements['your-name-display'].textContent = me?.name || myName;
  elements['opp-name-display'].textContent = opp?.name || elements['opponent-name'].textContent || 'Opponent';
  elements['opponent-name'].textContent = opp?.name || elements['opponent-name'].textContent || 'Opponent';

  elements['your-power'].textContent = me?.values?.power ?? 0;
  elements['your-legitimacy'].textContent = me?.values?.legitimacy ?? 0;
  elements['your-harmony'].textContent = me?.values?.harmony ?? 0;
  elements['opp-power'].textContent = opp?.values?.power ?? 0;
  elements['opp-legitimacy'].textContent = opp?.values?.legitimacy ?? 0;
  elements['opp-harmony'].textContent = opp?.values?.harmony ?? 0;

  const instability = gameState.shared?.instability ?? 0;
  elements['instability'].textContent = instability;
  elements['energy-flow'].textContent = gameState.shared?.energyFlow ?? 0;
  elements['civilian-burden'].textContent = gameState.shared?.civilianBurden ?? 0;
  elements['instability-fill'].style.width = `${Math.min((instability / 10) * 100, 100)}%`;

  updatePhasePresentation(gameState.phase || 'setup');
}

function renderResourceBar() {
  const nextYield = getGenerationForBoard(getMyBoard());
  elements['resource-income'].textContent = `Next yield: ${formatResourceList(nextYield) || 'none'}`;
  const bar = elements['resource-bar'];
  bar.innerHTML = '';

  RESOURCE_ORDER.forEach((key) => {
    const meta = RESOURCE_META[key];
    const chip = document.createElement('div');
    chip.className = `resource-chip ${meta.className}`;
    chip.innerHTML = `
      <div class="resource-top">
        <span>${meta.icon}</span>
        <span class="resource-count">${localResources[key] ?? 0}</span>
      </div>
      <div class="resource-name">${meta.label}</div>
      <div class="resource-income-note">+${nextYield[key] ?? 0} next turn</div>
    `;
    bar.appendChild(chip);
  });
}

function renderActionSlots() {
  const active = Boolean(gameState && gameState.phase === 'action');
  elements['action-section'].hidden = !active;
  elements['btn-submit-actions'].hidden = !active;

  if (!active) {
    return;
  }

  const slots = elements['action-slots'];
  slots.innerHTML = '';
  const board = getMyBoard();

  if (!board.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-lane';
    empty.textContent = 'Deploy cards before choosing actions.';
    slots.appendChild(empty);
    setStatus('action-summary', 'No deployed cards available.');
    return;
  }

  board.forEach((card) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'action-card';
    const select = document.createElement('select');
    select.className = 'action-select';
    select.dataset.cardId = card.id;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose an action';
    select.appendChild(placeholder);

    ACTIONS.forEach((action) => {
      const option = document.createElement('option');
      option.value = action;
      option.textContent = `${action} • ${formatResourceList(ACTION_COSTS[action])}`;
      if (submittedActions.get(card.id) === action) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    const costRow = document.createElement('div');
    costRow.className = 'action-cost';
    const helper = document.createElement('div');
    helper.className = 'action-helper';
    helper.textContent = 'Pick an action to see its cost and outcome.';

    select.addEventListener('change', () => {
      const cost = ACTION_COSTS[select.value] || emptyResources();
      helper.textContent = select.value ? ACTION_HELP[select.value] : 'Pick an action to see its cost and outcome.';
      renderCostPills(costRow, cost, localResources);
      updateActionSummary();
    });

    wrapper.innerHTML = `
      <h4>${card.name}</h4>
      <p class="action-meta">${card.entityType} · ${card.cluster}</p>
    `;
    wrapper.appendChild(select);
    wrapper.appendChild(costRow);
    wrapper.appendChild(helper);
    slots.appendChild(wrapper);

    if (select.value) {
      const cost = ACTION_COSTS[select.value] || emptyResources();
      renderCostPills(costRow, cost, localResources);
      helper.textContent = ACTION_HELP[select.value];
    }
  });

  updateActionSummary();
}

function renderLog() {
  const log = elements['game-log'];
  log.innerHTML = '';
  const messages = gameState?.log?.length ? gameState.log : ['Waiting for the first match event.'];
  messages.slice(-14).forEach((entry) => {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = entry;
    log.appendChild(line);
  });
}

function renderButtons() {
  if (!gameState) {
    elements['btn-deploy'].hidden = true;
    elements['btn-submit-actions'].hidden = true;
    elements['btn-ready'].hidden = true;
    return;
  }

  const phase = gameState?.phase || 'setup';
  elements['btn-deploy'].hidden = phase !== 'deploy';
  elements['btn-submit-actions'].hidden = phase !== 'action';
  elements['btn-ready'].hidden = phase !== 'setup';

  elements['btn-deploy'].disabled = selectedCards.size === 0 || !canAfford(localResources, getSelectedDeployCost());
  elements['btn-submit-actions'].disabled = false;

  if (phase === 'deploy') {
    setInstruction('Select up to 2 cards, review the cost, then deploy them to your board.');
  } else if (phase === 'action') {
    setInstruction('Each deployed card may queue one action. Costs are paid from your resource bar.');
  } else if (phase === 'resolution') {
    setInstruction('Resolution in progress. Watch scores and instability shift.');
  }
}

function createCardElement(card, context) {
  const el = document.createElement('article');
  const selected = context.location === 'hand' && selectedCards.has(card.id);
  const unaffordable = context.location === 'hand' && !canAfford(localResources, getDeployCost(card));
  const pending = pendingDeployIds.includes(card.id);
  el.className = `game-card rarity-${card.rarity}${selected ? ' selected' : ''}${unaffordable ? ' unaffordable' : ''}${pending ? ' pending' : ''}`;

  const selectButton = context.location === 'hand'
    ? `<button class="card-select${selected ? ' active' : ''}" data-select-card="${card.id}" type="button">${selected ? 'Selected' : 'Select'}</button>`
    : '';

  const costText = formatResourceList(getDeployCost(card));
  const generationText = formatResourceList(getGeneration(card));
  el.innerHTML = `
    <div class="card-head">
      <div class="card-rarity">${card.rarity}</div>
      ${selectButton}
    </div>
    <div>
      <div class="card-portrait">${ENTITY_ICONS[card.entityType] || '◆'}</div>
      <div class="card-title">${card.name}</div>
      <div class="card-subtitle">${card.entityType} · ${card.cluster}</div>
      <div class="card-divider"></div>
      <div class="info-row"><strong>Deploy</strong><span>${costText}</span></div>
      <div class="info-row"><strong>Gives</strong><span>${generationText}</span></div>
      <p class="card-summary">${getOneLine(card)}</p>
    </div>
    <div class="card-footer">
      <span class="card-tag">Tap for atlas</span>
      <button class="detail-btn" data-detail-card="${card.id}" type="button">Details</button>
    </div>
  `;

  if (context.location === 'hand') {
    const selectEl = el.querySelector('[data-select-card]');
    selectEl.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleCardSelection(card.id);
    });
  }

  const detailButton = el.querySelector('[data-detail-card]');
  detailButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openCardModal(card);
  });
  el.addEventListener('click', () => openCardModal(card));
  return el;
}

function updateDeploySummary() {
  const cost = getSelectedDeployCost();
  if (!selectedCards.size) {
    setStatus('deploy-summary', 'Select up to 2 cards to deploy.');
    return;
  }
  const afford = canAfford(localResources, cost);
  setStatus('deploy-summary', `${selectedCards.size} selected • ${formatResourceList(cost)}${afford ? '' : ' • not affordable'}`);
}

function updateActionSummary() {
  const selects = elements['action-slots'].querySelectorAll('select');
  let total = emptyResources();
  let count = 0;

  selects.forEach((select) => {
    if (!select.value) return;
    total = addResources(total, ACTION_COSTS[select.value]);
    count += 1;
  });

  if (!count) {
    setStatus('action-summary', 'Choose actions for any deployed cards you want to activate.');
    return;
  }

  const affordable = canAfford(localResources, total);
  setStatus('action-summary', `${count} action${count === 1 ? '' : 's'} queued • ${formatResourceList(total)}${affordable ? '' : ' • not affordable'}`);
}

function openCardModal(card) {
  modalCardId = card.id;
  const atlas = getAtlasEntry(card);
  elements['modal-rarity'].textContent = card.rarity;
  elements['modal-type'].textContent = card.entityType;
  elements['modal-title'].textContent = card.name;
  elements['modal-oneliner'].textContent = atlas.oneLine || card.summary;
  renderCostPills(elements['modal-cost'], getDeployCost(card));
  renderCostPills(elements['modal-generation'], getGeneration(card));
  elements['modal-why'].textContent = atlas.whyItMatters || card.summary;
  elements['modal-context'].textContent = atlas.context || `Cluster: ${card.cluster}.`;
  elements['modal-contradictions'].textContent = atlas.contradictions || 'No atlas contradiction note available for this entry yet.';
  renderList(elements['modal-effects'], card.effects?.length ? card.effects : [card.summary]);
  renderChips(elements['modal-related'], atlas.related?.length ? atlas.related : (atlas.tags || []));
  renderJudgment(elements['modal-judgment'], atlas.judgment || {});
  renderSources(elements['modal-sources'], atlas.sources || []);
  elements['card-modal'].hidden = false;
}

function closeModal() {
  modalCardId = null;
  elements['card-modal'].hidden = true;
}

function renderCostPills(container, resourceMap, available = null) {
  container.innerHTML = '';
  const keys = RESOURCE_ORDER.filter((key) => (resourceMap[key] || 0) > 0);
  if (!keys.length) {
    const pill = document.createElement('span');
    pill.className = 'cost-pill';
    pill.textContent = 'None';
    container.appendChild(pill);
    return;
  }

  keys.forEach((key) => {
    const pill = document.createElement('span');
    const insufficient = available && (available[key] ?? 0) < (resourceMap[key] ?? 0);
    pill.className = `cost-pill${insufficient ? ' unaffordable' : ''}`;
    pill.textContent = `${RESOURCE_META[key].icon} ${resourceMap[key]}`;
    container.appendChild(pill);
  });
}

function renderList(container, items) {
  container.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    container.appendChild(li);
  });
}

function renderChips(container, items) {
  container.innerHTML = '';
  items.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = item;
    container.appendChild(chip);
  });
}

function renderJudgment(container, judgment) {
  container.innerHTML = '';
  const entries = Object.entries(judgment);
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'judgment-item';
    empty.textContent = 'No judgment grid available.';
    container.appendChild(empty);
    return;
  }

  entries.forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'judgment-item';
    item.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
    container.appendChild(item);
  });
}

function renderSources(container, sources) {
  container.innerHTML = '';
  if (!sources.length) {
    const empty = document.createElement('div');
    empty.className = 'source-item';
    empty.textContent = 'No sources available for this card yet.';
    container.appendChild(empty);
    return;
  }

  sources.forEach((source) => {
    const item = document.createElement('div');
    item.className = 'source-item';
    item.innerHTML = `
      <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a>
      <div>${source.type || 'source'}</div>
    `;
    container.appendChild(item);
  });
}

function updatePhasePresentation(phase) {
  document.body.dataset.phase = phase;
  document.body.classList.remove('phase-setup', 'phase-deploy', 'phase-action', 'phase-resolution');
  document.body.classList.add(`phase-${phase}`);
  document.querySelectorAll('[data-phase-node]').forEach((node) => {
    node.classList.toggle('active', node.dataset.phaseNode === phase);
  });
}

function syncLocalStateFromGame(nextGameState) {
  if (!nextGameState) return;

  const previousTurn = lastProcessedTurn;
  const nextTurn = nextGameState.turn || previousTurn;

  if (nextTurn > previousTurn) {
    localResources = addResources(localResources, getGenerationForBoard(getMyBoard()));
    pendingActionCost = null;
    submittedActions.clear();
  }

  lastProcessedTurn = nextTurn;
  gameState = nextGameState;

  const myBoardIds = new Set(getMyBoard().map((card) => card.id));
  pendingDeployIds = pendingDeployIds.filter((id) => !myBoardIds.has(id));
  pendingDeployCards = pendingDeployCards.filter((card) => !myBoardIds.has(card.id));
}

function getMe() {
  return gameState?.players?.[myId] || null;
}

function getOpponent() {
  if (!gameState?.playersOrder?.length) return null;
  const opponentId = gameState.playersOrder.find((id) => id !== myId);
  return opponentId ? gameState.players[opponentId] : null;
}

function getMyBoard() {
  const board = getMe()?.board ? [...getMe().board] : [];
  const pending = pendingDeployCards.slice();
  return [...board, ...pending];
}

function getOpponentBoard() {
  return getOpponent()?.board ? [...getOpponent().board] : [];
}

function getSelectedDeployCost() {
  return myHand
    .filter((card) => selectedCards.has(card.id))
    .reduce((acc, card) => addResources(acc, getDeployCost(card)), emptyResources());
}

function resolveCardContext(card) {
  if (myHand.some((handCard) => handCard.id === card.id)) {
    return { location: 'hand' };
  }
  if (getMyBoard().some((boardCard) => boardCard.id === card.id)) {
    return { location: 'my-board' };
  }
  return { location: 'opponent-board' };
}

function getAtlasEntry(card) {
  return ATLAS[card.id] || {
    oneLine: card.summary,
    whyItMatters: card.summary,
    context: `Entity type: ${card.entityType}. Cluster: ${card.cluster}.`,
    contradictions: 'This card does not yet have a full atlas contradiction entry.',
    related: splitCluster(card.cluster),
    tags: splitCluster(card.cluster),
    judgment: {},
    sources: []
  };
}

function getOneLine(card) {
  return getAtlasEntry(card).oneLine || card.summary;
}

function getDeployCost(card) {
  const tokens = splitCluster(card.cluster);
  const rarityWeight = RARITY_WEIGHT[card.rarity] || 0;
  const cost = emptyResources();

  const typeCosts = {
    Country: { money: 2, labor: 1 },
    Technology: { data: 1, ai: 1, money: 1 },
    Resource: { money: 2 },
    Movement: { influence: 1, labor: 1 },
    Organization: { money: 2, influence: 1 },
    Person: { influence: 1, labor: 1 },
    Idea: { data: 1, influence: 1 }
  };
  addResources(cost, typeCosts[card.entityType] || {});

  if (rarityWeight >= 3) {
    if (card.entityType === 'Technology') cost.ai += 1;
    else if (card.entityType === 'Movement') cost.influence += 1;
    else cost.money += 1;
  } else if (rarityWeight >= 2) {
    if (card.entityType === 'Person' || card.entityType === 'Organization') cost.influence += 1;
    else cost.money += 1;
  }

  if (tokens.includes('knowledge') || tokens.includes('truth')) cost.data += 1;
  if (tokens.includes('systems')) cost.ai += 1;
  if (tokens.includes('power') || card.id === 'oil') cost.oil += card.id === 'oil' ? 1 : 0;
  if (tokens.includes('harmony') || tokens.includes('peace')) cost.forest += 1;
  if (tokens.includes('dignity') || tokens.includes('resistance') || tokens.includes('justice')) cost.labor += 1;
  if (tokens.includes('freedom') || tokens.includes('legitimacy')) cost.influence += 1;

  return pruneZeros(cost);
}

function getGeneration(card) {
  const tokens = splitCluster(card.cluster);
  const generation = emptyResources();

  switch (card.entityType) {
    case 'Country':
      generation.money += 2;
      generation.labor += 1;
      break;
    case 'Technology':
      generation.data += 1;
      generation.ai += 1;
      break;
    case 'Resource':
      if (card.id === 'oil' || tokens.includes('power')) generation.oil += 2;
      else generation.forest += 2;
      generation.money += 1;
      break;
    case 'Movement':
      generation.influence += 1;
      generation.labor += 1;
      break;
    case 'Organization':
      generation.money += 1;
      generation.influence += 1;
      break;
    case 'Person':
      generation.influence += 1;
      if (tokens.includes('knowledge') || tokens.includes('truth')) generation.data += 1;
      else if (tokens.includes('power')) generation.money += 1;
      else if (tokens.includes('harmony') || tokens.includes('peace')) generation.forest += 1;
      else generation.labor += 1;
      break;
    case 'Idea':
      generation.data += 1;
      generation.influence += 1;
      break;
    default:
      break;
  }

  if (card.rarity === 'Mythic') {
    const firstKey = RESOURCE_ORDER.find((key) => generation[key] > 0);
    if (firstKey) generation[firstKey] += 1;
  }

  return pruneZeros(generation);
}

function getGenerationForBoard(board) {
  return board.reduce((acc, card) => addResources(acc, getGeneration(card)), emptyResources());
}

function splitCluster(cluster) {
  return String(cluster || '')
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(Boolean);
}

function canAfford(resources, cost) {
  return RESOURCE_ORDER.every((key) => (resources[key] || 0) >= (cost[key] || 0));
}

function addResources(base, delta) {
  RESOURCE_ORDER.forEach((key) => {
    base[key] = (base[key] || 0) + (delta[key] || 0);
  });
  return base;
}

function subtractResources(base, delta) {
  const next = cloneResources(base);
  RESOURCE_ORDER.forEach((key) => {
    next[key] = Math.max(0, (next[key] || 0) - (delta[key] || 0));
  });
  return next;
}

function emptyResources() {
  return {
    money: 0,
    data: 0,
    ai: 0,
    oil: 0,
    forest: 0,
    labor: 0,
    influence: 0
  };
}

function cloneResources(source) {
  return RESOURCE_ORDER.reduce((acc, key) => {
    acc[key] = source[key] || 0;
    return acc;
  }, {});
}

function pruneZeros(resourceMap) {
  const next = emptyResources();
  RESOURCE_ORDER.forEach((key) => {
    next[key] = resourceMap[key] || 0;
  });
  return next;
}

function formatResourceList(resourceMap) {
  return RESOURCE_ORDER
    .filter((key) => (resourceMap[key] || 0) > 0)
    .map((key) => `${RESOURCE_META[key].icon}${resourceMap[key]}`)
    .join(' ');
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function setStatus(id, message) {
  if (elements[id]) {
    elements[id].textContent = message;
  }
}

function setInstruction(message) {
  elements['phase-instruction'].textContent = message;
}

socket.on('lobby_joined', (data) => {
  myId = data.playerId;
  elements['btn-join'].disabled = true;
  elements['btn-find'].hidden = false;
  setStatus('lobby-status', 'Lobby joined. Find a match when ready.');
});

socket.on('match_found', (data) => {
  gameId = data.gameId;
  myHand = Array.isArray(data.yourHand) ? data.yourHand.slice() : [];
  localResources = cloneResources(STARTING_RESOURCES);
  selectedCards.clear();
  submittedActions.clear();
  pendingDeployIds = [];
  pendingDeployCards = [];
  pendingActionCost = null;
  lastProcessedTurn = 1;

  elements['opponent-name'].textContent = data.opponent || 'Opponent';
  elements['lobby'].hidden = true;
  elements['game-screen'].hidden = false;
  elements['btn-ready'].hidden = true;
  setInstruction('Match found. Waiting for both players to enter deploy phase.');
  renderAll();
  socket.emit('ready', { gameId });
});

socket.on('phase_change', (data) => {
  syncLocalStateFromGame(data.gameState);
  renderAll();
});

socket.on('turn_result', (data) => {
  syncLocalStateFromGame(data.gameState);
  renderAll();
});

socket.on('game_over', (data) => {
  syncLocalStateFromGame(data.finalState);
  renderAll();
  elements['game-over-title'].textContent = data.winner === myId ? 'Victory' : 'Defeat';
  elements['game-over-reason'].textContent = REASON_MAP[data.reason] || data.reason || 'Match ended.';
  elements['game-over'].hidden = false;
});

socket.on('error', (data) => {
  const message = data?.message || 'Unknown error.';
  setStatus('lobby-status', `Error: ${message}`);
  setStatus('match-status', `Error: ${message}`);
  setStatus('deploy-summary', `Error: ${message}`);
  setStatus('action-summary', `Error: ${message}`);
  console.error('Server error:', message);
});
