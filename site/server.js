'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const { createAIPlayer, aiChooseDeploy, aiChooseActions, aiThinkDelay } = require('../game/server/ai-player');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// JSON body parsing
app.use(express.json());

// Static files
app.use(express.static(path.resolve(__dirname, 'public')));

// --- DATA LAYER ---
const DATA_DIR = path.resolve(__dirname, '../data');

function loadJSON(filename) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
  return JSON.parse(raw);
}

function saveJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

// Load entities
function getAllEntities() {
  const core = loadJSON('entities.json');
  // Load any additional entity files that exist
  let extras = [];
  const extraFiles = ['power_structures.json', 'world_strategy_entities.json'];
  for (const f of extraFiles) {
    try {
      const raw = loadJSON(f);
      const arr = Array.isArray(raw) ? raw : (raw.entities || []);
      extras = extras.concat(arr);
    } catch(e) { /* file doesn't exist, that's ok */ }
  }
  return [...core, ...extras];
}

// Votes storage (simple JSON file)
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
function loadVotes() {
  try { return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf8')); } catch(e) { return {}; }
}
function saveVotes(votes) { saveJSON('votes.json', votes); }

// Proposals storage
const PROPOSALS_FILE = path.join(DATA_DIR, 'proposals.json');
function loadProposals() {
  try { return JSON.parse(fs.readFileSync(PROPOSALS_FILE, 'utf8')); } catch(e) { return []; }
}
function saveProposals(proposals) {
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals, null, 2), 'utf8');
}

// --- API ROUTES ---

// Get all entities
app.get('/api/entities', (req, res) => {
  try {
    const entities = getAllEntities();
    const q = (req.query.q || '').toLowerCase();
    const type = req.query.type || '';
    const theme = req.query.theme || '';
    let filtered = entities;
    if (q) filtered = filtered.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.oneLine || '').toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q))
    );
    if (type) filtered = filtered.filter(e => e.entityType === type);
    if (theme) filtered = filtered.filter(e => (e.themes || []).includes(theme));
    res.json({ count: filtered.length, entities: filtered });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Share page for entity (generates OG meta tags for social preview)
app.get('/entity/:id', (req, res) => {
  const entities = getAllEntities();
  const entity = entities.find(e => e.id === req.params.id);
  if (!entity) return res.redirect('/');
  const name = entity.name || 'Unknown';
  const desc = entity.oneLine || entity.summary || 'An entity in the ERD atlas.';
  const type = entity.entityType || 'Entity';
  const rarity = entity.rarity || '';
  const artUrl = `/game/art/${entity.id}.png`;
  res.send(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${name} — ERD: Legends of Humanity</title>
    <meta property="og:title" content="${name} · ${rarity} ${type}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="https://legends-of-humanity.onrender.com${artUrl}">
    <meta property="og:url" content="https://legends-of-humanity.onrender.com/entity/${entity.id}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${name} — ERD">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="https://legends-of-humanity.onrender.com${artUrl}">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#08080d;color:#d4d0c8;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px;text-align:center}
    .card{max-width:400px}.card img{width:100%;border-radius:12px;margin-bottom:16px}h1{color:#c9a84c;font-size:24px}p{color:#888;margin:8px 0}
    a{color:#c9a84c;display:inline-block;margin-top:16px;padding:12px 24px;border:1px solid #c9a84c;border-radius:8px;text-decoration:none}a:hover{background:#c9a84c;color:#08080d}</style>
  </head><body><div class="card">
    <img src="${artUrl}" alt="${name}" onerror="this.style.display='none'">
    <h1>${name}</h1>
    <p>${rarity} · ${type}</p>
    <p>${desc}</p>
    <a href="/">Explore the Atlas →</a>
    <a href="/game/?ai=balanced">Play Now →</a>
  </div></body></html>`);
});

// Get single entity
app.get('/api/entities/:id', (req, res) => {
  const entities = getAllEntities();
  const entity = entities.find(e => e.id === req.params.id);
  if (!entity) return res.status(404).json({ error: 'Entity not found' });
  const votes = loadVotes();
  entity._votes = votes[entity.id] || 0;
  res.json(entity);
});

// Vote on entity
app.post('/api/entities/:id/vote', (req, res) => {
  const votes = loadVotes();
  const id = req.params.id;
  const dir = req.body.direction === 'down' ? -1 : 1;
  votes[id] = (votes[id] || 0) + dir;
  saveVotes(votes);
  res.json({ id, votes: votes[id] });
});

// Get proposals
app.get('/api/proposals', (req, res) => {
  res.json(loadProposals());
});

// Submit proposal
app.post('/api/proposals', (req, res) => {
  const proposals = loadProposals();
  const p = {
    id: 'prop-' + Date.now().toString(36),
    name: req.body.name || '',
    entityType: req.body.entityType || 'Person',
    reason: req.body.reason || '',
    submittedBy: req.body.submittedBy || 'anonymous',
    submittedAt: new Date().toISOString(),
    upvotes: 0,
    downvotes: 0,
    status: 'pending'
  };
  proposals.push(p);
  saveProposals(proposals);
  res.json(p);
});

// Vote on proposal
app.post('/api/proposals/:id/vote', (req, res) => {
  const proposals = loadProposals();
  const p = proposals.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Proposal not found' });
  if (req.body.direction === 'up') p.upvotes++;
  else p.downvotes++;
  saveProposals(proposals);
  res.json(p);
});

// Leaderboard data
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
function loadLeaderboard() {
  try { return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8')); }
  catch(e) { return { players: {}, matches: [] }; }
}
function saveLeaderboard(lb) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(lb, null, 2), 'utf8');
}
function recordMatch(winner, loser, reason, turns) {
  const lb = loadLeaderboard();
  // Init players
  [winner, loser].forEach(name => {
    if (!lb.players[name]) lb.players[name] = { name, elo: 1000, wins: 0, losses: 0, favVictory: null, victoryTypes: {} };
  });
  // Update stats
  lb.players[winner].wins++;
  lb.players[loser].losses++;
  lb.players[winner].victoryTypes[reason] = (lb.players[winner].victoryTypes[reason] || 0) + 1;
  // ELO calculation
  const K = 32;
  const eloW = lb.players[winner].elo;
  const eloL = lb.players[loser].elo;
  const expected = 1 / (1 + Math.pow(10, (eloL - eloW) / 400));
  lb.players[winner].elo = Math.round(eloW + K * (1 - expected));
  lb.players[loser].elo = Math.round(eloL + K * (0 - (1 - expected)));
  // Fav victory
  const vt = lb.players[winner].victoryTypes;
  lb.players[winner].favVictory = Object.entries(vt).sort((a,b) => b[1] - a[1])[0]?.[0] || reason;
  // Record match
  lb.matches.unshift({ player1: winner, player2: loser, winner, reason, turns, timestamp: Date.now() });
  if (lb.matches.length > 100) lb.matches = lb.matches.slice(0, 100);
  saveLeaderboard(lb);
}

app.get('/api/leaderboard', (req, res) => {
  res.json(loadLeaderboard());
});

// Stats
app.get('/api/stats', (req, res) => {
  const entities = getAllEntities();
  const types = {};
  entities.forEach(e => { types[e.entityType] = (types[e.entityType] || 0) + 1; });
  res.json({ total: entities.length, byType: types, proposals: loadProposals().length });
});

// --- GAME (Socket.IO) ---
// Import game modules from game/ directory
const gameEngine = require('../game/server/game-engine');
const { Matchmaker } = require('../game/server/matchmaker');
const matchmaker = new Matchmaker();
const phaseState = new Map();

io.on('connection', (socket) => {
  socket.on('join_lobby', (payload = {}) => {
    try {
      const player = matchmaker.joinLobby(socket.id, payload.name);
      socket.emit('lobby_joined', { playerId: player.socketId });
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // --- PLAY VS AI ---
  socket.on('play_ai', (payload = {}) => {
    try {
      const aiProfile = createAIPlayer(payload.difficulty || 'balanced');
      const aiId = 'ai-' + Date.now().toString(36);
      // Join lobby as AI
      matchmaker.joinLobby(aiId, aiProfile.name);
      matchmaker.joinLobby(socket.id, payload.name || 'Player');
      // Force match
      matchmaker.findMatch(socket.id); // adds to queue
      const match = matchmaker.findMatch(aiId); // pairs them
      if (!match) { socket.emit('error', { message: 'AI match failed' }); return; }
      const { game, gameId } = match;
      game._aiPlayerId = aiId;
      game._aiStrategy = aiProfile.strategy;
      game.players[aiId]._aiStrategy = aiProfile.strategy;
      phaseState.set(gameId, { ready: new Set(), deploy: new Set(), actions: new Set(), aiId });
      socket.join(gameId);
      socket.emit('match_found', {
        gameId, opponent: aiProfile.name + ' (' + aiProfile.description + ')',
        yourHand: JSON.parse(JSON.stringify(game.players[socket.id].hand)),
        isAI: true
      });
      // AI auto-ready
      const state = phaseState.get(gameId);
      state.ready.add(aiId);
      state.ready.add(socket.id);
      game.phase = 'deploy';
      socket.emit('phase_change', { phase: 'deploy', gameState: broadcastState(game) });
      // AI deploys after delay
      setTimeout(() => aiTakeTurn(gameId, 'deploy'), aiThinkDelay());
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('find_match', () => {
    try {
      const match = matchmaker.findMatch(socket.id);
      if (!match) return;
      const { game, gameId, player1, player2 } = match;
      phaseState.set(gameId, { ready: new Set(), deploy: new Set(), actions: new Set() });
      const s1 = io.sockets.sockets.get(player1.socketId);
      const s2 = io.sockets.sockets.get(player2.socketId);
      if (s1 && s2) {
        s1.join(gameId); s2.join(gameId);
        s1.emit('match_found', { gameId, opponent: player2.name, yourHand: JSON.parse(JSON.stringify(game.players[player1.socketId].hand)) });
        s2.emit('match_found', { gameId, opponent: player1.name, yourHand: JSON.parse(JSON.stringify(game.players[player2.socketId].hand)) });
      }
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('ready', (payload = {}) => {
    try {
      const gid = matchmaker.getGameIdByPlayer(socket.id);
      if (!gid) return;
      const game = matchmaker.getGame(gid);
      const state = phaseState.get(gid);
      if (!state) return;
      state.ready.add(socket.id);
      if (state.ready.size >= 2) {
        game.phase = 'deploy';
        io.to(gid).emit('phase_change', { phase: 'deploy', gameState: broadcastState(game) });
      }
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('deploy_cards', (payload = {}) => {
    try {
      const gid = matchmaker.getGameIdByPlayer(socket.id);
      const game = matchmaker.getGame(gid);
      const state = phaseState.get(gid);
      if (!game || !state) return;
      const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds : [];
      if (cardIds.length > 0) gameEngine.deployCards(game, socket.id, cardIds);
      state.deploy.add(socket.id);
      if (state.deploy.size >= 2) {
        game.phase = 'action';
        state.deploy.clear();
        io.to(gid).emit('phase_change', { phase: 'action', gameState: broadcastState(game) });
        // Trigger AI action phase
        if (state.aiId) setTimeout(() => aiTakeTurn(gid, 'action'), aiThinkDelay());
      } else if (state.aiId && !state.deploy.has(state.aiId)) {
        // Trigger AI deploy
        setTimeout(() => aiTakeTurn(gid, 'deploy'), aiThinkDelay());
      }
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('choose_actions', (payload = {}) => {
    try {
      const gid = matchmaker.getGameIdByPlayer(socket.id);
      const game = matchmaker.getGame(gid);
      const state = phaseState.get(gid);
      if (!game || !state) return;
      gameEngine.executeActions(game, socket.id, payload.actions || []);
      state.actions.add(socket.id);
      if (state.actions.size >= 2) {
        gameEngine.resolvePhase(game);
        const victory = gameEngine.checkVictory(game);
        io.to(gid).emit('turn_result', { changes: {}, log: game.log.slice(), gameState: broadcastState(game) });
        if (victory.finished) {
          io.to(gid).emit('game_over', { winner: victory.winnerId, reason: victory.reason, finalState: broadcastState(game) });
          // Record match for leaderboard
          try {
            const winnerName = (game.playerNames || {})[victory.winnerId] || victory.winnerId;
            const loserId = game.playersOrder.find(id => id !== victory.winnerId);
            const loserName = (game.playerNames || {})[loserId] || loserId;
            recordMatch(winnerName, loserName, victory.reason, game.turn);
          } catch(e) { console.error('Leaderboard record error:', e.message); }
        } else {
          gameEngine.advanceTurn(game);
          state.actions.clear(); state.deploy.clear();
          io.to(gid).emit('phase_change', { phase: game.phase, gameState: broadcastState(game) });
          // Trigger AI deploy for next turn
          if (state.aiId) setTimeout(() => aiTakeTurn(gid, 'deploy'), aiThinkDelay());
        }
      }
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('disconnect', () => {
    const game = matchmaker.removePlayer(socket.id);
    if (game) {
      phaseState.delete(game.id);
      const winner = game.playersOrder.find(id => id !== socket.id);
      socket.to(game.id).emit('game_over', { winner, reason: 'disconnect', finalState: broadcastState(game) });
    }
  });
});

function broadcastState(game) {
  const players = {};
  game.playersOrder.forEach(pid => {
    const p = game.players[pid];
    players[pid] = { id: pid, name: (game.playerNames||{})[pid]||pid, handCount: p.hand.length, board: JSON.parse(JSON.stringify(p.board)), values: {...p.values} };
  });
  return { id: game.id, phase: game.phase, turn: game.turn, maxTurns: game.maxTurns, winner: game.winner, reason: game.reason, playersOrder: game.playersOrder, players, shared: {...game.shared}, log: game.log.slice(-20) };
}

// --- AI TURN LOGIC ---
function aiTakeTurn(gameId, phase) {
  try {
    const game = matchmaker.getGame(gameId);
    const state = phaseState.get(gameId);
    if (!game || !state || !state.aiId) return;
    const aiId = state.aiId;

    if (phase === 'deploy') {
      const cardIds = aiChooseDeploy(game, aiId);
      if (cardIds.length > 0) {
        gameEngine.deployCards(game, aiId, cardIds);
        game.log.push(`AI deployed ${cardIds.length} card(s).`);
      }
      state.deploy.add(aiId);
      // Check if both deployed
      if (state.deploy.size >= 2) {
        game.phase = 'action';
        state.deploy.clear();
        io.to(gameId).emit('phase_change', { phase: 'action', gameState: broadcastState(game) });
        setTimeout(() => aiTakeTurn(gameId, 'action'), aiThinkDelay());
      }
    } else if (phase === 'action') {
      const actions = aiChooseActions(game, aiId);
      if (actions.length > 0) {
        gameEngine.executeActions(game, aiId, actions);
      }
      state.actions.add(aiId);
      // Check if both acted
      if (state.actions.size >= 2) {
        gameEngine.resolvePhase(game);
        const victory = gameEngine.checkVictory(game);
        io.to(gameId).emit('turn_result', { changes: {}, log: game.log.slice(), gameState: broadcastState(game) });
        if (victory.finished) {
          io.to(gameId).emit('game_over', { winner: victory.winnerId, reason: victory.reason, finalState: broadcastState(game) });
          try {
            const winnerName = (game.playerNames || {})[victory.winnerId] || victory.winnerId;
            const loserId = game.playersOrder.find(id => id !== victory.winnerId);
            const loserName = (game.playerNames || {})[loserId] || loserId;
            recordMatch(winnerName, loserName, victory.reason, game.turn);
          } catch(e) { console.error('AI leaderboard error:', e.message); }
        } else {
          gameEngine.advanceTurn(game);
          state.actions.clear(); state.deploy.clear();
          io.to(gameId).emit('phase_change', { phase: game.phase, gameState: broadcastState(game) });
          setTimeout(() => aiTakeTurn(gameId, 'deploy'), aiThinkDelay());
        }
      }
    }
  } catch(e) { console.error('AI turn error:', e.message); }
}

server.listen(PORT, () => {
  const entities = getAllEntities();
  console.log(`\n  🌍 ERD: Legends of Humanity\n  📡 http://localhost:${PORT}\n  📊 ${entities.length} entities loaded\n  🎮 Game server ready\n`);
});
