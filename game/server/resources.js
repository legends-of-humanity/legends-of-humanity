'use strict';

/**
 * ERD Resource System
 * 7 resource types that drive the entire economy
 */

const RESOURCE_TYPES = Object.freeze([
  'money', 'data', 'ai', 'oil', 'forest', 'labor', 'influence'
]);

const RESOURCE_ICONS = Object.freeze({
  money: '💰', data: '📊', ai: '🤖', oil: '🛢️',
  forest: '🌲', labor: '👷', influence: '📢'
});

const STARTING_RESOURCES = Object.freeze({
  money: 5, data: 3, ai: 1, oil: 2, forest: 2, labor: 3, influence: 2
});

/**
 * Deploy costs by entity type + rarity multiplier
 */
const BASE_DEPLOY_COSTS = Object.freeze({
  Person:       { money: 1, influence: 1 },
  Movement:     { labor: 1, influence: 1 },
  Idea:         { data: 1 },
  Technology:   { data: 2, ai: 1 },
  Organization: { money: 2, influence: 1 },
  Corporation:  { money: 3, data: 1 },
  Institution:  { money: 2, labor: 1 },
  Country:      { money: 3 },
  Resource:     { money: 2 },
  Event:        { influence: 1 }
});

const RARITY_MULTIPLIERS = Object.freeze({
  Signal: 0.5, Archive: 0.8, Relic: 1.0, Legend: 1.5, Mythic: 2.0
});

/**
 * Resources generated per turn by deployed cards
 */
const BASE_GENERATION = Object.freeze({
  Person:       { influence: 1 },
  Movement:     { influence: 1, labor: 1 },
  Idea:         { data: 1, influence: 1 },
  Technology:   { data: 1, ai: 1 },
  Organization: { money: 1, influence: 1 },
  Corporation:  { money: 2, data: 1 },
  Institution:  { money: 1, labor: 1 },
  Country:      { money: 2, labor: 1 },
  Resource:     { money: 1, oil: 1 },
  Event:        {}
});

/**
 * Special generation overrides for specific cards
 */
const CARD_GENERATION_OVERRIDES = Object.freeze({
  'oil':              { money: 1, oil: 3 },
  'china':            { money: 3, labor: 2 },
  'open-source':      { data: 2, labor: 1 },
  'the-internet':     { data: 2, influence: 2 },
  'linux':            { data: 1, ai: 1 },
  'nuclear-energy':   { money: 1, oil: 2 },
  'gandhi':           { influence: 3, labor: 1 },
  'civil-rights-movement': { influence: 2, labor: 2 },
  'freedom-of-speech': { influence: 2, data: 1 }
});

/**
 * Action costs — what each action requires
 */
const ACTION_COSTS = Object.freeze({
  Build:      { money: 2, labor: 1 },
  Reform:     { money: 1, influence: 1 },
  Coordinate: { influence: 1, labor: 1 },
  Mobilize:   { money: 2, oil: 1 },
  Reveal:     { data: 2 },
  Pressure:   { influence: 2, money: 1 },
  Stabilize:  { money: 1, forest: 1 },
  Extract:    { oil: 2 },
  Invest:     { money: 3 },
  Protect:    { money: 1, labor: 1, forest: 1 },
  Reconcile:  { influence: 1, forest: 1, labor: 1 },
  Disrupt:    { data: 2, ai: 1 },
  Research:   { data: 1, ai: 1 },
  Automate:   { ai: 3 }
});

/**
 * Create initial resource state for a player
 */
function createResourceState() {
  return { ...STARTING_RESOURCES };
}

/**
 * Get deploy cost for a card
 */
function getDeployCost(card) {
  const base = BASE_DEPLOY_COSTS[card.entityType] || { money: 1 };
  const mult = RARITY_MULTIPLIERS[card.rarity] || 1.0;
  const cost = {};
  for (const [key, val] of Object.entries(base)) {
    cost[key] = Math.ceil(val * mult);
  }
  return cost;
}

/**
 * Get per-turn generation for a card
 */
function getGeneration(card) {
  if (CARD_GENERATION_OVERRIDES[card.id]) {
    return { ...CARD_GENERATION_OVERRIDES[card.id] };
  }
  return { ...(BASE_GENERATION[card.entityType] || {}) };
}

/**
 * Get action cost
 */
function getActionCost(actionName) {
  return { ...(ACTION_COSTS[actionName] || {}) };
}

/**
 * Check if player can afford a cost
 */
function canAfford(resources, cost) {
  for (const [key, val] of Object.entries(cost)) {
    if ((resources[key] || 0) < val) return false;
  }
  return true;
}

/**
 * Deduct cost from resources (mutates)
 */
function deductCost(resources, cost) {
  for (const [key, val] of Object.entries(cost)) {
    resources[key] = Math.max(0, (resources[key] || 0) - val);
  }
}

/**
 * Add generation to resources (mutates)
 */
function addGeneration(resources, gen) {
  for (const [key, val] of Object.entries(gen)) {
    resources[key] = (resources[key] || 0) + val;
  }
}

/**
 * Generate resources from all deployed cards
 */
function generateFromBoard(resources, board) {
  for (const card of board) {
    addGeneration(resources, getGeneration(card));
  }
}

/**
 * Format cost as emoji string
 */
function formatCost(cost) {
  return Object.entries(cost)
    .map(([k, v]) => `${RESOURCE_ICONS[k] || k}${v}`)
    .join(' ');
}

module.exports = {
  RESOURCE_TYPES,
  RESOURCE_ICONS,
  STARTING_RESOURCES,
  ACTION_COSTS,
  createResourceState,
  getDeployCost,
  getGeneration,
  getActionCost,
  canAfford,
  deductCost,
  addGeneration,
  generateFromBoard,
  formatCost
};
