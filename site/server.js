'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

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
  const worldRaw = loadJSON('world_strategy_entities.json');
  const world = Array.isArray(worldRaw) ? worldRaw : (worldRaw.entities || []);
  let power = [];
  try { power = loadJSON('power_structures.json'); } catch(e) {}
  return [...core, ...world, ...power];
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
        } else {
          gameEngine.advanceTurn(game);
          state.actions.clear(); state.deploy.clear();
          io.to(gid).emit('phase_change', { phase: game.phase, gameState: broadcastState(game) });
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

server.listen(PORT, () => {
  const entities = getAllEntities();
  console.log(`\n  🌍 ERD: Legends of Humanity\n  📡 http://localhost:${PORT}\n  📊 ${entities.length} entities loaded\n  🎮 Game server ready\n`);
});
