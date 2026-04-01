'use strict';

const { createGame, dealHands } = require('./game-engine');
const { loadCards } = require('./card-loader');

class Matchmaker {
  constructor() {
    this.lobby = new Map();
    this.queue = [];
    this.games = new Map();
    this.playerToGame = new Map();
  }

  joinLobby(socketId, name) {
    const normalizedName = String(name || '').trim();
    if (!socketId) {
      throw new Error('joinLobby requires a socketId.');
    }
    if (!normalizedName) {
      throw new Error('joinLobby requires a player name.');
    }

    const player = { name: normalizedName, socketId };
    this.lobby.set(socketId, player);
    return player;
  }

  findMatch(socketId) {
    const player = this.lobby.get(socketId);
    if (!player) {
      throw new Error('Player must join the lobby before matchmaking.');
    }

    if (this.playerToGame.has(socketId)) {
      throw new Error('Player is already in a game.');
    }

    if (!this.queue.includes(socketId)) {
      this.queue.push(socketId);
    }

    if (this.queue.length < 2) {
      return null;
    }

    let player1 = null;
    let player2 = null;

    while (this.queue.length > 0 && !player1) {
      const queuedId = this.queue.shift();
      const queuedPlayer = this.lobby.get(queuedId);
      if (queuedPlayer && !this.playerToGame.has(queuedId)) {
        player1 = queuedPlayer;
      }
    }

    while (this.queue.length > 0 && player1 && !player2) {
      const queuedId = this.queue.shift();
      const queuedPlayer = this.lobby.get(queuedId);
      if (queuedPlayer && queuedId !== player1.socketId && !this.playerToGame.has(queuedId)) {
        player2 = queuedPlayer;
      }
    }

    if (!player1 || !player2) {
      if (player1 && !this.queue.includes(player1.socketId)) {
        this.queue.unshift(player1.socketId);
      }
      return null;
    }

    const cards = loadCards();
    const game = dealHands(createGame(player1.socketId, player2.socketId, cards));
    game.playerNames = {
      [player1.socketId]: player1.name,
      [player2.socketId]: player2.name
    };

    this.games.set(game.id, game);
    this.playerToGame.set(player1.socketId, game.id);
    this.playerToGame.set(player2.socketId, game.id);

    return {
      gameId: game.id,
      player1,
      player2,
      game
    };
  }

  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  getGameIdByPlayer(socketId) {
    return this.playerToGame.get(socketId) || null;
  }

  removePlayer(socketId) {
    this.lobby.delete(socketId);
    this.queue = this.queue.filter((queuedId) => queuedId !== socketId);

    const gameId = this.playerToGame.get(socketId);
    if (!gameId) {
      return null;
    }

    const game = this.games.get(gameId) || null;
    this.playerToGame.delete(socketId);

    if (game) {
      for (const playerId of game.playersOrder) {
        this.playerToGame.delete(playerId);
      }
      this.games.delete(gameId);
    }

    return game;
  }
}

module.exports = {
  Matchmaker
};
