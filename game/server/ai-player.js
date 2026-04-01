'use strict';

/**
 * ERD AI Player — Makes intelligent decisions for single-player mode
 * 
 * Strategy profiles:
 * - aggressive: Prioritizes Power, uses Mobilize/Extract/Disrupt
 * - diplomatic: Prioritizes Legitimacy + Harmony, uses Reform/Coordinate/Reconcile
 * - balanced: Adapts based on game state
 * - chaotic: Random but weighted choices (for fun)
 */

const { ACTION_TYPES } = require('./game-engine');

const STRATEGIES = {
  aggressive: {
    preferredActions: ['Mobilize', 'Extract', 'Pressure', 'Disrupt', 'Build'],
    deployPreference: ['Country', 'Resource', 'Technology', 'Movement'],
    description: 'Seeks Force Victory through raw power'
  },
  diplomatic: {
    preferredActions: ['Reconcile', 'Coordinate', 'Reform', 'Stabilize', 'Protect'],
    deployPreference: ['Person', 'Movement', 'Idea', 'Organization'],
    description: 'Seeks Harmony Victory through peace and cooperation'
  },
  balanced: {
    preferredActions: ['Build', 'Invest', 'Coordinate', 'Reveal', 'Stabilize'],
    deployPreference: ['Technology', 'Organization', 'Person', 'Idea'],
    description: 'Adapts strategy based on game state'
  },
  chaotic: {
    preferredActions: ACTION_TYPES,
    deployPreference: ['Event', 'Movement', 'Resource', 'Technology'],
    description: 'Unpredictable wildcard'
  }
};

const AI_NAMES = [
  'Atlas AI', 'Deep Oracle', 'Sage Protocol', 'Echo Mind',
  'Cipher Engine', 'Nova Think', 'Prism Logic', 'Quantum Ghost',
  'Shadow Council', 'Iron Algorithm', 'Peace Engine', 'Truth Machine'
];

/**
 * Create an AI player instance
 */
function createAIPlayer(strategy = 'balanced') {
  const strat = STRATEGIES[strategy] || STRATEGIES.balanced;
  return {
    name: AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)],
    strategy,
    description: strat.description,
    isAI: true
  };
}

/**
 * AI chooses which cards to deploy (0-2 cards)
 */
function aiChooseDeploy(game, aiPlayerId) {
  const player = game.players[aiPlayerId];
  if (!player || player.hand.length === 0) return [];

  const strat = STRATEGIES[getPlayerStrategy(game, aiPlayerId)];
  const hand = [...player.hand];
  
  // Sort hand by strategy preference
  hand.sort((a, b) => {
    const aIdx = strat.deployPreference.indexOf(a.entityType);
    const bIdx = strat.deployPreference.indexOf(b.entityType);
    const aPref = aIdx === -1 ? 99 : aIdx;
    const bPref = bIdx === -1 ? 99 : bIdx;
    return aPref - bPref;
  });

  // Deploy 1-2 cards (prefer 2 early game, 1 late game)
  const count = game.turn <= 2 ? Math.min(2, hand.length) : Math.min(1, hand.length);
  return hand.slice(0, count).map(c => c.id);
}

/**
 * AI chooses actions for each deployed card
 */
function aiChooseActions(game, aiPlayerId) {
  const player = game.players[aiPlayerId];
  if (!player || player.board.length === 0) return [];

  const strategy = getPlayerStrategy(game, aiPlayerId);
  const strat = STRATEGIES[strategy];
  const actions = [];

  for (const card of player.board) {
    const action = pickBestAction(game, aiPlayerId, card, strat);
    actions.push({ cardId: card.id, action });
  }

  return actions;
}

/**
 * Pick the best action for a card given the current game state
 */
function pickBestAction(game, aiPlayerId, card, strat) {
  const player = game.players[aiPlayerId];
  const oppId = game.playersOrder.find(id => id !== aiPlayerId);
  const opp = game.players[oppId];

  // Adaptive strategy: override preferences based on game state
  if (game.shared.instability >= 6) {
    // High instability: prioritize stabilization
    return weightedPick(['Stabilize', 'Protect', 'Reconcile', 'Reform']);
  }

  if (player.values.power >= 8 && player.values.legitimacy < 5) {
    // Close to Force Victory but need legitimacy
    return weightedPick(['Build', 'Mobilize', 'Pressure']);
  }

  if (player.values.harmony >= 6 && game.shared.instability <= 3) {
    // Close to Harmony Victory
    return weightedPick(['Reconcile', 'Stabilize', 'Coordinate']);
  }

  if (opp && opp.values.power > player.values.power + 3) {
    // Opponent has big power lead: disrupt or catch up
    return weightedPick(['Disrupt', 'Pressure', 'Build', 'Mobilize']);
  }

  // Card type affinity
  const typeActions = getTypePreferredActions(card.entityType);
  const combined = [...strat.preferredActions.slice(0, 3), ...typeActions];
  
  return weightedPick(combined);
}

/**
 * Get preferred actions based on card type
 */
function getTypePreferredActions(entityType) {
  const map = {
    Person:       ['Reform', 'Reconcile', 'Coordinate', 'Reveal'],
    Movement:     ['Mobilize', 'Pressure', 'Coordinate'],
    Idea:         ['Reveal', 'Coordinate', 'Reform'],
    Technology:   ['Build', 'Invest', 'Disrupt'],
    Organization: ['Coordinate', 'Stabilize', 'Invest'],
    Corporation:  ['Invest', 'Extract', 'Build'],
    Institution:  ['Stabilize', 'Reform', 'Coordinate'],
    Country:      ['Mobilize', 'Build', 'Extract'],
    Resource:     ['Extract', 'Build', 'Invest'],
    Event:        ['Disrupt', 'Reveal', 'Pressure']
  };
  return map[entityType] || ['Build'];
}

/**
 * Get the effective strategy for the AI player (may adapt mid-game)
 */
function getPlayerStrategy(game, aiPlayerId) {
  const player = game.players[aiPlayerId];
  if (!player._aiStrategy) return 'balanced';

  // Balanced strategy adapts
  if (player._aiStrategy === 'balanced') {
    if (game.turn >= 4) {
      // Late game: evaluate what victory is closest
      const p = player.values;
      if (p.power >= 7) return 'aggressive';
      if (p.harmony >= 5 && p.legitimacy >= 3) return 'diplomatic';
    }
  }

  return player._aiStrategy;
}

/**
 * Weighted random pick from array (earlier items more likely)
 */
function weightedPick(items) {
  if (items.length === 0) return 'Build';
  // Weight: first item 4x, second 3x, third 2x, rest 1x
  const weighted = [];
  items.forEach((item, i) => {
    const weight = Math.max(1, 4 - i);
    for (let j = 0; j < weight; j++) weighted.push(item);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

/**
 * Simulate AI thinking delay (ms)
 */
function aiThinkDelay() {
  return 800 + Math.random() * 1200; // 0.8 - 2.0 seconds
}

module.exports = {
  createAIPlayer,
  aiChooseDeploy,
  aiChooseActions,
  aiThinkDelay,
  STRATEGIES,
  AI_NAMES
};
