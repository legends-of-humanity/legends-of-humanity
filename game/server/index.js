'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const { Matchmaker } = require('./matchmaker');
const {
  deployCards,
  executeActions,
  resolvePhase,
  checkVictory,
  advanceTurn
} = require('./game-engine');

const PORT = 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const matchmaker = new Matchmaker();
const phaseState = new Map();

app.use(express.static(path.resolve(__dirname, '../public')));

io.on('connection', (socket) => {
  logEvent('client', socket.id, 'connection', {});

  socket.on('join_lobby', (payload = {}) => {
    logEvent('client', socket.id, 'join_lobby', payload);

    try {
      const player = matchmaker.joinLobby(socket.id, payload.name);
      emitToSocket(socket, 'lobby_joined', { playerId: player.socketId });
    } catch (error) {
      emitError(socket, error);
    }
  });

  socket.on('find_match', () => {
    logEvent('client', socket.id, 'find_match', {});

    try {
      const match = matchmaker.findMatch(socket.id);
      if (!match) {
        return;
      }

      const { game, gameId, player1, player2 } = match;
      initializePhaseState(gameId);

      const socket1 = io.sockets.sockets.get(player1.socketId);
      const socket2 = io.sockets.sockets.get(player2.socketId);

      if (!socket1 || !socket2) {
        throw new Error('Matched players must both be connected.');
      }

      socket1.join(gameId);
      socket2.join(gameId);

      emitToSocket(socket1, 'match_found', {
        gameId,
        opponent: player2.name,
        yourHand: clone(game.players[player1.socketId].hand)
      });

      emitToSocket(socket2, 'match_found', {
        gameId,
        opponent: player1.name,
        yourHand: clone(game.players[player2.socketId].hand)
      });
    } catch (error) {
      emitError(socket, error);
    }
  });

  socket.on('ready', (payload = {}) => {
    logEvent('client', socket.id, 'ready', payload);

    try {
      const game = requireGameForPlayer(socket.id, payload.gameId);
      const state = getOrCreatePhaseState(game.id);
      state.ready.add(socket.id);

      if (state.ready.size === game.playersOrder.length) {
        game.phase = 'deploy';
        state.deploy.clear();
        state.actions.clear();
        emitToGame(game.id, 'phase_change', {
          phase: game.phase,
          gameState: buildBroadcastState(game)
        });
      }
    } catch (error) {
      emitError(socket, error);
    }
  });

  socket.on('deploy_cards', (payload = {}) => {
    logEvent('client', socket.id, 'deploy_cards', payload);

    try {
      const game = requireGameForPlayer(socket.id, payload.gameId);
      const state = getOrCreatePhaseState(game.id);

      if (game.phase !== 'deploy') {
        throw new Error('Cards can only be deployed during the deploy phase.');
      }

      const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds : [];
      deployCards(game, socket.id, cardIds);
      state.deploy.add(socket.id);

      if (state.deploy.size === game.playersOrder.length) {
        game.phase = 'action';
        state.deploy.clear();
        state.actions.clear();
        emitToGame(game.id, 'phase_change', {
          phase: game.phase,
          gameState: buildBroadcastState(game)
        });
      }
    } catch (error) {
      emitError(socket, error);
    }
  });

  socket.on('choose_actions', (payload = {}) => {
    logEvent('client', socket.id, 'choose_actions', payload);

    try {
      const game = requireGameForPlayer(socket.id, payload.gameId);
      const state = getOrCreatePhaseState(game.id);

      if (game.phase !== 'action') {
        throw new Error('Actions can only be chosen during the action phase.');
      }

      executeActions(game, socket.id, payload.actions);
      state.actions.add(socket.id);

      if (state.actions.size === game.playersOrder.length) {
        resolvePhase(game);

        const victory = checkVictory(game);
        emitToGame(game.id, 'turn_result', {
          changes: clone(game.lastResolution ? game.lastResolution.changes : {}),
          log: game.log.slice(),
          gameState: buildBroadcastState(game)
        });

        if (victory.finished) {
          emitToGame(game.id, 'game_over', {
            winner: victory.winnerId,
            reason: victory.reason,
            finalState: buildBroadcastState(game)
          });
          cleanupGame(game.id);
          return;
        }

        advanceTurn(game);
        state.actions.clear();
        state.deploy.clear();
        state.ready.clear();

        emitToGame(game.id, 'phase_change', {
          phase: game.phase,
          gameState: buildBroadcastState(game)
        });
      }
    } catch (error) {
      emitError(socket, error);
    }
  });

  socket.on('disconnect', (reason) => {
    logEvent('client', socket.id, 'disconnect', { reason });

    const game = matchmaker.removePlayer(socket.id);
    if (game) {
      phaseState.delete(game.id);
      socket.to(game.id).emit('game_over', {
        winner: game.playersOrder.find((playerId) => playerId !== socket.id) || null,
        reason: 'disconnect',
        finalState: buildBroadcastState(game)
      });
      logEvent('server', socket.id, 'game_over', {
        gameId: game.id,
        reason: 'disconnect'
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`ERD game server listening at http://localhost:${PORT}`);
});

function initializePhaseState(gameId) {
  phaseState.set(gameId, {
    ready: new Set(),
    deploy: new Set(),
    actions: new Set()
  });
}

function getOrCreatePhaseState(gameId) {
  if (!phaseState.has(gameId)) {
    initializePhaseState(gameId);
  }
  return phaseState.get(gameId);
}

function requireGameForPlayer(socketId, requestedGameId) {
  const actualGameId = matchmaker.getGameIdByPlayer(socketId);
  if (!actualGameId) {
    throw new Error('Player is not in an active game.');
  }

  if (requestedGameId && requestedGameId !== actualGameId) {
    throw new Error('Player is not part of the requested game.');
  }

  const game = matchmaker.getGame(actualGameId);
  if (!game) {
    throw new Error('Game not found.');
  }

  return game;
}

function cleanupGame(gameId) {
  const game = matchmaker.getGame(gameId);
  if (!game) {
    phaseState.delete(gameId);
    return;
  }

  for (const playerId of game.playersOrder) {
    matchmaker.removePlayer(playerId);
  }
  phaseState.delete(gameId);
}

function buildBroadcastState(game) {
  const players = {};

  for (const playerId of game.playersOrder) {
    const player = game.players[playerId];
    players[playerId] = {
      id: playerId,
      name: game.playerNames ? game.playerNames[playerId] : playerId,
      handCount: player.hand.length,
      board: clone(player.board),
      values: clone(player.values),
      pendingActions: clone(player.pendingActions)
    };
  }

  return {
    id: game.id,
    phase: game.phase,
    turn: game.turn,
    maxTurns: game.maxTurns,
    winner: game.winner,
    reason: game.reason,
    playersOrder: game.playersOrder.slice(),
    players,
    shared: clone(game.shared),
    lastResolution: clone(game.lastResolution),
    log: game.log.slice()
  };
}

function emitToSocket(socket, eventName, payload) {
  logEvent('server', socket.id, eventName, payload);
  socket.emit(eventName, payload);
}

function emitToGame(gameId, eventName, payload) {
  logEvent('server', gameId, eventName, payload);
  io.to(gameId).emit(eventName, payload);
}

function emitError(socket, error) {
  const payload = { message: error instanceof Error ? error.message : String(error) };
  emitToSocket(socket, 'error', payload);
}

function logEvent(direction, target, eventName, payload) {
  console.log(`[${direction}] ${eventName} ${target} ${JSON.stringify(payload)}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
