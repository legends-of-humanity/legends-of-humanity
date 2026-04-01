'use strict';

const fs = require('fs');
const path = require('path');

const MICROSET_PATH = path.resolve(__dirname, '../../data/microset.json');

let cachedCards = null;

function loadCards() {
  if (cachedCards) {
    return cachedCards;
  }

  const raw = fs.readFileSync(MICROSET_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  validateMicroset(parsed);

  cachedCards = parsed.cards.map(cloneCard);
  return cachedCards;
}

function validateMicroset(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('microset.json must contain an object root.');
  }

  if (!Array.isArray(data.cards)) {
    throw new Error('microset.json must contain a cards array.');
  }

  const seenIds = new Set();

  data.cards.forEach((card, index) => {
    validateCard(card, index, seenIds);
  });
}

function validateCard(card, index, seenIds) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    throw new Error(`Card at index ${index} must be an object.`);
  }

  const requiredStringFields = ['id', 'name', 'entityType', 'rarity', 'cluster', 'summary'];
  for (const field of requiredStringFields) {
    if (typeof card[field] !== 'string' || card[field].trim() === '') {
      throw new Error(`Card at index ${index} is missing required string field "${field}".`);
    }
  }

  if (!Array.isArray(card.effects)) {
    throw new Error(`Card "${card.id}" must contain an effects array.`);
  }

  card.effects.forEach((effect, effectIndex) => {
    if (typeof effect !== 'string' || effect.trim() === '') {
      throw new Error(`Card "${card.id}" has invalid effect at index ${effectIndex}.`);
    }
  });

  if (seenIds.has(card.id)) {
    throw new Error(`Duplicate card id found: ${card.id}`);
  }
  seenIds.add(card.id);
}

function cloneCard(card) {
  return JSON.parse(JSON.stringify(card));
}

module.exports = {
  loadCards
};
