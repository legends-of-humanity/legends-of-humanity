/**
 * Pure ERD game engine with no I/O dependencies.
 */

'use strict';

const ACTION_TYPES = Object.freeze([
  'Build',
  'Reform',
  'Coordinate',
  'Mobilize',
  'Reveal',
  'Pressure',
  'Stabilize',
  'Extract',
  'Invest',
  'Protect',
  'Reconcile',
  'Disrupt'
]);

const ACTION_EFFECTS = Object.freeze({
  Build: {
    self: { power: 1 },
    opponent: {},
    shared: {}
  },
  Reform: {
    self: { legitimacy: 1 },
    opponent: {},
    shared: { instability: -1 }
  },
  Coordinate: {
    self: { legitimacy: 1, harmony: 1 },
    opponent: {},
    shared: {}
  },
  Mobilize: {
    self: { power: 2 },
    opponent: {},
    shared: { instability: 1 }
  },
  Reveal: {
    self: { legitimacy: 1 },
    opponent: { legitimacy: -1 },
    shared: {}
  },
  Pressure: {
    self: { power: 1 },
    opponent: { legitimacy: -1 },
    shared: {}
  },
  Stabilize: {
    self: { harmony: 1 },
    opponent: {},
    shared: { instability: -2 }
  },
  Extract: {
    self: { power: 2 },
    opponent: {},
    shared: { instability: 1 }
  },
  Invest: {
    self: { power: 1, legitimacy: 1 },
    opponent: {},
    shared: {}
  },
  Protect: {
    self: { power: 1, harmony: 1 },
    opponent: {},
    shared: { instability: -1 }
  },
  Reconcile: {
    self: { legitimacy: 1, harmony: 2 },
    opponent: {},
    shared: { instability: -1 }
  },
  Disrupt: {
    self: {},
    opponent: { power: -1, legitimacy: -1 },
    shared: { instability: 1 }
  }
});

const DEPLOY_EFFECTS = Object.freeze({
  gandhi: { legitimacy: 1 },
  china: { power: 1 },
  oil: { power: 1, instability: 1 },
  'nuclear-energy': { power: 1 }
});

const ACTION_AFFINITIES = Object.freeze({
  Person: Object.freeze({
    Reform: { legitimacy: 1 },
    Reconcile: { harmony: 1 }
  }),
  Movement: Object.freeze({
    Mobilize: { power: 1 },
    Pressure: { legitimacyPressure: 1 }
  }),
  Idea: Object.freeze({
    Coordinate: { harmony: 1 },
    Reveal: { legitimacy: 1 }
  }),
  Technology: Object.freeze({
    Build: { power: 1 },
    Invest: { power: 1 },
    Reveal: { legitimacy: 1 }
  }),
  Organization: Object.freeze({
    Coordinate: { legitimacy: 1 },
    Stabilize: { harmony: 1, instabilityReduction: 1 }
  }),
  Country: Object.freeze({
    Mobilize: { power: 1 },
    Extract: { power: 1, instability: 1 }
  }),
  Resource: Object.freeze({
    Extract: { power: 1, instability: 1 },
    Pressure: { power: 1 }
  })
});

const CLUSTER_AFFINITIES = Object.freeze({
  harmony: Object.freeze({
    Coordinate: { harmony: 1 },
    Reconcile: { harmony: 1 },
    Stabilize: { harmony: 1 }
  }),
  legitimacy: Object.freeze({
    Reform: { legitimacy: 1 },
    Reveal: { legitimacy: 1 }
  }),
  knowledge: Object.freeze({
    Build: { power: 1 },
    Invest: { power: 1 },
    Coordinate: { legitimacy: 1 }
  }),
  systems: Object.freeze({
    Build: { power: 1 },
    Stabilize: { instabilityReduction: 1 }
  }),
  power: Object.freeze({
    Mobilize: { power: 1 },
    Extract: { power: 1 }
  }),
  resistance: Object.freeze({
    Pressure: { legitimacyPressure: 1 },
    Reveal: { legitimacy: 1 }
  })
});

const SCORE_KEYS = ['power', 'legitimacy', 'harmony'];

/**
 * Create a new game state object.
 *
 * @param {string} player1Id
 * @param {string} player2Id
 * @param {Array<Object>} cards Full microset card list.
 * @returns {Object}
 */
function createGame(player1Id, player2Id, cards) {
  if (!player1Id || !player2Id) {
    throw new Error('createGame requires two player ids.');
  }

  if (player1Id === player2Id) {
    throw new Error('Players must be unique.');
  }

  if (!Array.isArray(cards) || cards.length < 16) {
    throw new Error('createGame requires the 16-card microset.');
  }

  const normalizedCards = cards.map(cloneCard);
  const cardIndex = {};

  for (const card of normalizedCards) {
    if (!card.id) {
      throw new Error('Every card must have an id.');
    }
    cardIndex[card.id] = card;
  }

  return {
    id: buildGameId(player1Id, player2Id),
    phase: 'setup',
    turn: 1,
    maxTurns: 6,
    winner: null,
    reason: null,
    playersOrder: [player1Id, player2Id],
    availableCards: normalizedCards,
    cardIndex,
    players: {
      [player1Id]: createPlayerState(player1Id),
      [player2Id]: createPlayerState(player2Id)
    },
    shared: {
      instability: 0,
      energyFlow: 4,
      civilianBurden: 0
    },
    lastResolution: null,
    log: []
  };
}

/**
 * Deal 8 random cards to each player from the 16-card microset.
 *
 * @param {Object} game
 * @returns {Object}
 */
function dealHands(game) {
  assertGame(game);

  if (game.phase !== 'setup') {
    throw new Error('Hands can only be dealt during setup.');
  }

  const shuffled = shuffle(game.availableCards.map(cloneCard));
  if (shuffled.length < 16) {
    throw new Error('dealHands requires at least 16 cards.');
  }

  const [player1Id, player2Id] = game.playersOrder;
  game.players[player1Id].hand = shuffled.slice(0, 8);
  game.players[player2Id].hand = shuffled.slice(8, 16);
  game.players[player1Id].board = [];
  game.players[player2Id].board = [];
  game.phase = 'deploy';
  game.log.push('Hands dealt. Deploy phase started.');

  return game;
}

/**
 * Move cards from a player's hand onto the board.
 *
 * @param {Object} game
 * @param {string} playerId
 * @param {string[]} cardIds
 * @returns {Object}
 */
function deployCards(game, playerId, cardIds) {
  assertGame(game);
  const player = getPlayer(game, playerId);

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return game;
  }

  if (cardIds.length > 2 || player.deployedThisTurn + cardIds.length > 2) {
    throw new Error('A player may deploy at most 2 cards per turn.');
  }

  const uniqueCardIds = new Set(cardIds);
  if (uniqueCardIds.size !== cardIds.length) {
    throw new Error('Duplicate card ids are not allowed in deployCards.');
  }

  for (const cardId of cardIds) {
    const handIndex = player.hand.findIndex((card) => card.id === cardId);
    if (handIndex === -1) {
      throw new Error(`Card ${cardId} is not in player hand.`);
    }

    const [card] = player.hand.splice(handIndex, 1);
    player.board.push(card);
    player.deployedThisTurn += 1;
    applyDeployEffect(game, player, card);
    game.log.push(`${playerId} deployed ${card.name}.`);
  }

  if (game.phase === 'setup' || game.phase === 'draw') {
    game.phase = 'deploy';
  }

  return game;
}

/**
 * Queue a player's actions for the current action phase.
 *
 * @param {Object} game
 * @param {string} playerId
 * @param {Array<{cardId: string, action: string}>} actions
 * @returns {Object}
 */
function executeActions(game, playerId, actions) {
  assertGame(game);
  const player = getPlayer(game, playerId);

  if (!Array.isArray(actions)) {
    throw new Error('executeActions requires an actions array.');
  }

  const seenCardIds = new Set();
  const validatedActions = actions.map((entry) => {
    if (!entry || typeof entry.cardId !== 'string' || typeof entry.action !== 'string') {
      throw new Error('Each action must include cardId and action.');
    }

    if (!ACTION_EFFECTS[entry.action]) {
      throw new Error(`Unsupported action: ${entry.action}`);
    }

    if (seenCardIds.has(entry.cardId)) {
      throw new Error(`Card ${entry.cardId} cannot act twice in one turn.`);
    }
    seenCardIds.add(entry.cardId);

    const card = player.board.find((boardCard) => boardCard.id === entry.cardId);
    if (!card) {
      throw new Error(`Card ${entry.cardId} is not deployed for player ${playerId}.`);
    }

    return {
      cardId: entry.cardId,
      action: entry.action
    };
  });

  player.pendingActions = validatedActions;
  game.phase = 'action';
  game.log.push(`${playerId} submitted ${validatedActions.length} actions.`);

  return game;
}

/**
 * Resolve all queued actions, synergies, and shared-state effects.
 *
 * @param {Object} game
 * @returns {Object}
 */
function resolvePhase(game) {
  assertGame(game);
  game.phase = 'resolution';

  const changes = {};

  for (const playerId of game.playersOrder) {
    changes[playerId] = createResolutionBucket();
  }

  const instabilityBefore = game.shared.instability;

  for (const playerId of game.playersOrder) {
    const player = game.players[playerId];
    const opponent = game.players[getOpponentId(game, playerId)];

    for (const entry of player.pendingActions) {
      const card = player.board.find((boardCard) => boardCard.id === entry.cardId);
      const delta = buildActionDelta(card, entry.action);

      if (entry.action === 'Reveal' && hasSynergy(player.board, 'freedom-of-speech', 'the-internet')) {
        scaleDelta(delta, 2);
        game.log.push(`${playerId} doubled Reveal via Freedom of Speech + The Internet.`);
      }

      if (isTechnologyCard(card) && player.modifiers.nextTechnologyActionBonus > 0) {
        applyTechnologyBonus(delta, player.modifiers.nextTechnologyActionBonus);
        player.modifiers.nextTechnologyActionBonus = 0;
        game.log.push(`${playerId} consumed a Technology action bonus with ${card.name}.`);
      }

      applyDelta(player, opponent, game.shared, delta, changes[playerId]);
      game.log.push(`${playerId} resolved ${entry.action} with ${card.name}.`);
    }
  }

  for (const playerId of game.playersOrder) {
    applySynergies(game, playerId, changes[playerId]);
  }

  for (const playerId of game.playersOrder) {
    const player = game.players[playerId];
    player.pendingActions = [];
  }

  clampState(game);
  game.lastResolution = {
    turn: game.turn,
    instabilityBefore,
    instabilityAfter: game.shared.instability,
    changes
  };

  return game;
}

/**
 * Check whether the game has reached a victory condition.
 *
 * @param {Object} game
 * @returns {{finished: boolean, winnerId: string|null, reason: string|null}}
 */
function checkVictory(game) {
  assertGame(game);

  const resolvedWinners = [];

  for (const playerId of game.playersOrder) {
    const player = game.players[playerId];
    const innovationCount = player.board.filter(isInnovationCard).length;

    if (player.values.power >= 10) {
      resolvedWinners.push({ playerId, reason: 'force' });
    }

    if (player.values.legitimacy >= 10 && player.values.power >= 5) {
      resolvedWinners.push({ playerId, reason: 'influence' });
    }

    if (innovationCount >= 3 && player.values.power >= 7) {
      resolvedWinners.push({ playerId, reason: 'innovation' });
    }

    if (
      player.values.harmony >= 8 &&
      game.shared.instability <= 2 &&
      player.values.legitimacy >= 5
    ) {
      resolvedWinners.push({ playerId, reason: 'harmony' });
    }
  }

  if (resolvedWinners.length > 0) {
    const winner = breakTie(game, resolvedWinners.map((entry) => entry.playerId));
    const reason = resolvedWinners.find((entry) => entry.playerId === winner).reason;
    game.winner = winner;
    game.reason = reason;
    game.phase = 'finished';
    game.log.push(`${winner} won by ${reason}.`);
    return { finished: true, winnerId: winner, reason };
  }

  if (game.turn >= game.maxTurns) {
    const winner = breakTie(game, game.playersOrder);
    game.winner = winner;
    game.reason = 'turn_limit';
    game.phase = 'finished';
    game.log.push(`${winner} won on turn limit.`);
    return { finished: true, winnerId: winner, reason: 'turn_limit' };
  }

  return { finished: false, winnerId: null, reason: null };
}

/**
 * Advance to the next turn or finish the game if a victory condition is met.
 *
 * @param {Object} game
 * @returns {Object}
 */
function advanceTurn(game) {
  assertGame(game);

  const victory = checkVictory(game);
  if (victory.finished) {
    return game;
  }

  game.turn += 1;
  game.phase = 'deploy';

  for (const playerId of game.playersOrder) {
    const player = game.players[playerId];
    player.deployedThisTurn = 0;
    player.pendingActions = [];
  }

  game.log.push(`Turn ${game.turn} started.`);
  return game;
}

/**
 * @param {string} playerId
 * @returns {Object}
 */
function createPlayerState(playerId) {
  return {
    id: playerId,
    hand: [],
    board: [],
    values: {
      power: 0,
      legitimacy: 0,
      harmony: 0
    },
    pendingActions: [],
    deployedThisTurn: 0,
    modifiers: {
      nextTechnologyActionBonus: 0
    }
  };
}

/**
 * @param {Object} card
 * @returns {Object}
 */
function cloneCard(card) {
  return JSON.parse(JSON.stringify(card));
}

/**
 * @param {Object} game
 * @param {Object} player
 * @param {Object} card
 * @returns {void}
 */
function applyDeployEffect(game, player, card) {
  const deployEffect = DEPLOY_EFFECTS[card.id];
  if (!deployEffect) {
    return;
  }

  if (deployEffect.power) {
    player.values.power += deployEffect.power;
  }
  if (deployEffect.legitimacy) {
    player.values.legitimacy += deployEffect.legitimacy;
  }
  if (deployEffect.harmony) {
    player.values.harmony += deployEffect.harmony;
  }
  if (deployEffect.instability) {
    game.shared.instability += deployEffect.instability;
  }
}

/**
 * @param {Object} card
 * @param {string} action
 * @returns {{self: Object, opponent: Object, shared: Object}}
 */
function buildActionDelta(card, action) {
  const base = cloneDelta(ACTION_EFFECTS[action]);
  const entityAffinity = ACTION_AFFINITIES[card.entityType];

  if (entityAffinity && entityAffinity[action]) {
    mergeAffinity(base, entityAffinity[action]);
  }

  for (const token of getClusterTokens(card.cluster)) {
    const clusterAffinity = CLUSTER_AFFINITIES[token];
    if (clusterAffinity && clusterAffinity[action]) {
      mergeAffinity(base, clusterAffinity[action]);
    }
  }

  return base;
}

/**
 * @param {{self: Object, opponent: Object, shared: Object}} delta
 * @param {Object} affinity
 * @returns {void}
 */
function mergeAffinity(delta, affinity) {
  if (affinity.power) {
    delta.self.power = (delta.self.power || 0) + affinity.power;
  }
  if (affinity.legitimacy) {
    delta.self.legitimacy = (delta.self.legitimacy || 0) + affinity.legitimacy;
  }
  if (affinity.harmony) {
    delta.self.harmony = (delta.self.harmony || 0) + affinity.harmony;
  }
  if (affinity.instability) {
    delta.shared.instability = (delta.shared.instability || 0) + affinity.instability;
  }
  if (affinity.instabilityReduction) {
    delta.shared.instability = (delta.shared.instability || 0) - affinity.instabilityReduction;
  }
  if (affinity.legitimacyPressure) {
    delta.opponent.legitimacy = (delta.opponent.legitimacy || 0) - affinity.legitimacyPressure;
  }
}

/**
 * @param {Object} player
 * @param {Object} opponent
 * @param {Object} shared
 * @param {{self: Object, opponent: Object, shared: Object}} delta
 * @param {Object} bucket
 * @returns {void}
 */
function applyDelta(player, opponent, shared, delta, bucket) {
  applyPlayerDelta(player, delta.self, bucket.self);
  applyPlayerDelta(opponent, delta.opponent, bucket.opponent);

  if (delta.shared.instability) {
    shared.instability += delta.shared.instability;
    bucket.shared.instability += delta.shared.instability;
  }
}

/**
 * @param {Object} player
 * @param {Object} delta
 * @param {Object} bucket
 * @returns {void}
 */
function applyPlayerDelta(player, delta, bucket) {
  for (const key of SCORE_KEYS) {
    if (delta[key]) {
      player.values[key] += delta[key];
      bucket[key] += delta[key];
    }
  }
}

/**
 * @param {Object} game
 * @param {string} playerId
 * @param {Object} bucket
 * @returns {void}
 */
function applySynergies(game, playerId, bucket) {
  const player = game.players[playerId];
  const board = player.board;

  if (hasSynergy(board, 'gandhi', 'nonviolence')) {
    player.values.harmony += 1;
    bucket.synergy.harmony += 1;
    game.log.push(`${playerId} gained +1 Harmony from Gandhi + Nonviolence.`);
  }

  if (hasSynergy(board, 'martin-luther-king-jr', 'civil-rights-movement')) {
    player.values.legitimacy += 1;
    bucket.synergy.legitimacy += 1;
    game.log.push(`${playerId} gained +1 Legitimacy from MLK + Civil Rights Movement.`);
  }

  if (
    hasSynergy(board, 'nelson-mandela', 'anti-apartheid-movement') &&
    player.values.legitimacy >= 5 &&
    game.shared.instability > 0
  ) {
    game.shared.instability -= 1;
    player.values.harmony += 1;
    bucket.synergy.harmony += 1;
    bucket.shared.instability -= 1;
    game.log.push(`${playerId} converted 1 Instability into Harmony with Mandela + Anti-Apartheid.`);
  }

  if (hasSynergy(board, 'open-source', 'linux')) {
    player.modifiers.nextTechnologyActionBonus += 1;
    bucket.synergy.technologyBonus += 1;
    game.log.push(`${playerId} stored +1 for the next Technology action via Open Source + Linux.`);
  }

  if (hasSynergy(board, 'china', 'oil')) {
    player.values.power += 2;
    game.shared.instability += 1;
    bucket.synergy.power += 2;
    bucket.shared.instability += 1;
    game.log.push(`${playerId} gained +2 Power and +1 Instability from China + Oil.`);
  }

  if (hasSynergy(board, 'freedom-of-speech', 'the-internet')) {
    bucket.synergy.revealMultiplier = 2;
  }
}

/**
 * @returns {Object}
 */
function createResolutionBucket() {
  return {
    self: { power: 0, legitimacy: 0, harmony: 0 },
    opponent: { power: 0, legitimacy: 0, harmony: 0 },
    shared: { instability: 0 },
    synergy: {
      power: 0,
      legitimacy: 0,
      harmony: 0,
      technologyBonus: 0,
      revealMultiplier: 1
    }
  };
}

/**
 * @param {{self: Object, opponent: Object, shared: Object}} delta
 * @returns {{self: Object, opponent: Object, shared: Object}}
 */
function cloneDelta(delta) {
  return {
    self: Object.assign({}, delta.self),
    opponent: Object.assign({}, delta.opponent),
    shared: Object.assign({}, delta.shared)
  };
}

/**
 * @param {{self: Object, opponent: Object, shared: Object}} delta
 * @param {number} multiplier
 * @returns {void}
 */
function scaleDelta(delta, multiplier) {
  for (const section of ['self', 'opponent', 'shared']) {
    for (const key of Object.keys(delta[section])) {
      delta[section][key] *= multiplier;
    }
  }
}

/**
 * @param {{self: Object, opponent: Object, shared: Object}} delta
 * @param {number} bonus
 * @returns {void}
 */
function applyTechnologyBonus(delta, bonus) {
  if (delta.self.power > 0) {
    delta.self.power += bonus;
    return;
  }
  if (delta.self.legitimacy > 0) {
    delta.self.legitimacy += bonus;
    return;
  }
  if (delta.self.harmony > 0) {
    delta.self.harmony += bonus;
    return;
  }
  if (delta.opponent.legitimacy < 0) {
    delta.opponent.legitimacy -= bonus;
    return;
  }
  if (delta.opponent.power < 0) {
    delta.opponent.power -= bonus;
    return;
  }
  delta.shared.instability = (delta.shared.instability || 0) - bonus;
}

/**
 * @param {Object[]} board
 * @param {string} leftId
 * @param {string} rightId
 * @returns {boolean}
 */
function hasSynergy(board, leftId, rightId) {
  const ids = new Set(board.map((card) => card.id));
  return ids.has(leftId) && ids.has(rightId);
}

/**
 * @param {string} cluster
 * @returns {string[]}
 */
function getClusterTokens(cluster) {
  return String(cluster || '')
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(Boolean);
}

/**
 * @param {Object} card
 * @returns {boolean}
 */
function isTechnologyCard(card) {
  return card.entityType === 'Technology';
}

/**
 * @param {Object} card
 * @returns {boolean}
 */
function isInnovationCard(card) {
  return isTechnologyCard(card) || getClusterTokens(card.cluster).includes('knowledge');
}

/**
 * @param {Object} game
 * @param {string[]} playerIds
 * @returns {string}
 */
function breakTie(game, playerIds) {
  return playerIds
    .slice()
    .sort((leftId, rightId) => comparePlayers(game.players[leftId], game.players[rightId], leftId, rightId))[0];
}

/**
 * @param {Object} left
 * @param {Object} right
 * @param {string} leftId
 * @param {string} rightId
 * @returns {number}
 */
function comparePlayers(left, right, leftId, rightId) {
  const leftTotal = getScore(left);
  const rightTotal = getScore(right);
  if (leftTotal !== rightTotal) {
    return rightTotal - leftTotal;
  }
  if (left.values.power !== right.values.power) {
    return right.values.power - left.values.power;
  }
  if (left.values.legitimacy !== right.values.legitimacy) {
    return right.values.legitimacy - left.values.legitimacy;
  }
  if (left.values.harmony !== right.values.harmony) {
    return right.values.harmony - left.values.harmony;
  }
  return leftId.localeCompare(rightId);
}

/**
 * @param {Object} player
 * @returns {number}
 */
function getScore(player) {
  return player.values.power + player.values.legitimacy + player.values.harmony;
}

/**
 * @param {Object} game
 * @returns {void}
 */
function clampState(game) {
  for (const playerId of game.playersOrder) {
    const values = game.players[playerId].values;
    for (const key of SCORE_KEYS) {
      values[key] = Math.max(0, values[key]);
    }
  }

  game.shared.instability = Math.max(0, game.shared.instability);
}

/**
 * @param {Object} game
 * @param {string} playerId
 * @returns {Object}
 */
function getPlayer(game, playerId) {
  const player = game.players && game.players[playerId];
  if (!player) {
    throw new Error(`Unknown player: ${playerId}`);
  }
  return player;
}

/**
 * @param {Object} game
 * @param {string} playerId
 * @returns {string}
 */
function getOpponentId(game, playerId) {
  const opponentId = game.playersOrder.find((id) => id !== playerId);
  if (!opponentId) {
    throw new Error(`Missing opponent for player ${playerId}`);
  }
  return opponentId;
}

/**
 * @param {Object} game
 * @returns {void}
 */
function assertGame(game) {
  if (!game || !game.players || !Array.isArray(game.playersOrder)) {
    throw new Error('Invalid game object.');
  }
}

/**
 * @param {Object[]} items
 * @returns {Object[]}
 */
function shuffle(items) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }
  return result;
}

/**
 * @param {string} player1Id
 * @param {string} player2Id
 * @returns {string}
 */
function buildGameId(player1Id, player2Id) {
  return [
    'game',
    Date.now().toString(36),
    sanitizeId(player1Id),
    sanitizeId(player2Id)
  ].join('-');
}

/**
 * @param {string} value
 * @returns {string}
 */
function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]+/g, '').slice(0, 12) || 'player';
}

module.exports = {
  ACTION_TYPES,
  createGame,
  dealHands,
  deployCards,
  executeActions,
  resolvePhase,
  checkVictory,
  advanceTurn
};
