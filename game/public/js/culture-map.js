/**
 * ERD Cultural Mapping
 * Maps entities to their cultural visual style and portrait emoji
 */

const CULTURE_MAP = {
  // Persons
  'gandhi':                 { culture: 'india',      emoji: '🙏', accent: 'Nonviolent revolutionary' },
  'martin-luther-king-jr':  { culture: 'americas',   emoji: '✊🏿', accent: 'Dream of equality' },
  'nelson-mandela':         { culture: 'africa',     emoji: '✊🏾', accent: 'Ubuntu — I am because we are' },
  'malcolm-x':              { culture: 'americas',   emoji: '🔥', accent: 'By any means necessary' },
  'rosa-parks':             { culture: 'americas',   emoji: '🪑', accent: 'Quiet courage' },
  
  // Ideas
  'nonviolence':            { culture: 'india',      emoji: '☮️', accent: 'Strength without force' },
  'freedom-of-speech':      { culture: 'global',     emoji: '📢', accent: 'The first freedom' },
  'open-source':            { culture: 'tech',       emoji: '🔓', accent: 'Knowledge wants to be free' },
  'decentralization':       { culture: 'tech',       emoji: '🕸️', accent: 'No single point of failure' },

  // Movements
  'civil-rights-movement':  { culture: 'americas',   emoji: '✊', accent: 'We shall overcome' },
  'anti-apartheid-movement':{ culture: 'africa',     emoji: '🏴', accent: 'Freedom in our lifetime' },
  'open-knowledge-movement':{ culture: 'tech',       emoji: '📖', accent: 'Open access for all' },

  // Technology
  'linux':                  { culture: 'tech',       emoji: '🐧', accent: 'World runs on it' },
  'the-internet':           { culture: 'tech',       emoji: '🌐', accent: 'Connecting everything' },
  'nuclear-energy':         { culture: 'global',     emoji: '⚛️', accent: 'Power and peril' },
  'ai-infrastructure':      { culture: 'tech',       emoji: '🤖', accent: 'The new electricity' },

  // Countries
  'china':                  { culture: 'eastasia',   emoji: '🐉', accent: 'Middle Kingdom rising' },
  'taiwan':                 { culture: 'eastasia',   emoji: '🔧', accent: 'Silicon shield' },
  'united-arab-emirates':   { culture: 'middleeast', emoji: '🏙️', accent: 'Desert to metropolis' },

  // Organizations
  'united-nations':         { culture: 'global',     emoji: '🏛️', accent: 'Forum of nations' },

  // Resources
  'oil':                    { culture: 'nature',     emoji: '🛢️', accent: 'Black gold' },
  'semiconductor-manufacturing': { culture: 'tech',  emoji: '💾', accent: 'Tiny chips, huge power' },
  'rare-earths':            { culture: 'nature',     emoji: '⛏️', accent: '17 elements rule the world' },

  // Power Structures
  'ps-artificial-intelligence':  { culture: 'tech',      emoji: '🧠', accent: 'Who controls the AI?' },
  'ps-surveillance-capitalism':  { culture: 'tech',      emoji: '👁️', accent: 'You are the product' },
  'ps-cryptocurrency-bitcoin':   { culture: 'tech',      emoji: '₿', accent: 'Trust the math' },
  'ps-social-media-algorithms':  { culture: 'tech',      emoji: '📱', accent: 'Attention is currency' },
  'ps-lobbying':                 { culture: 'europe',    emoji: '💼', accent: 'Money talks' },
  'ps-tax-havens':               { culture: 'global',    emoji: '🏝️', accent: 'Hidden wealth' },
  'ps-rare-earth-minerals':      { culture: 'nature',    emoji: '⛏️', accent: 'Dirty foundation of clean energy' },
  'ps-lithium':                  { culture: 'nature',    emoji: '🔋', accent: 'White gold rush' },
  'ps-swift-banking-system':     { culture: 'europe',    emoji: '🏦', accent: 'Financial kill switch' },
  'ps-credit-rating-agencies':   { culture: 'global',    emoji: '📊', accent: '3 companies rule the debt market' },
  'ps-climate-activism':         { culture: 'movement',  emoji: '🌍', accent: 'No Planet B' },
  'ps-open-source-movement':     { culture: 'tech',      emoji: '🐧', accent: 'Built by everyone' },
  'ps-whistleblowing':           { culture: 'global',    emoji: '🔔', accent: 'Truth at any cost' },
  'ps-citizen-journalism':       { culture: 'movement',  emoji: '📸', accent: 'Everyone has a camera' },
  'ps-data-privacy-movement':    { culture: 'tech',      emoji: '🔒', accent: 'Your data, your rights' },
  'ps-universal-basic-income':   { culture: 'global',    emoji: '💵', accent: 'Just give people money' },
};

// Default cultures by entity type
const TYPE_CULTURE_DEFAULTS = {
  Person:       'global',
  Movement:     'movement',
  Idea:         'global',
  Technology:   'tech',
  Organization: 'global',
  Corporation:  'tech',
  Institution:  'europe',
  Country:      'global',
  Resource:     'nature',
  Event:        'movement'
};

const TYPE_EMOJI_DEFAULTS = {
  Person: '👤', Movement: '✊', Idea: '💡', Technology: '⚡',
  Organization: '🏛️', Corporation: '🏢', Institution: '🏦',
  Country: '🌍', Resource: '💎', Event: '⚡'
};

function getCulture(card) {
  const mapped = CULTURE_MAP[card.id];
  if (mapped) return mapped.culture;
  return TYPE_CULTURE_DEFAULTS[card.entityType] || 'global';
}

function getEmoji(card) {
  const mapped = CULTURE_MAP[card.id];
  if (mapped) return mapped.emoji;
  return TYPE_EMOJI_DEFAULTS[card.entityType] || '🃏';
}

function getAccent(card) {
  const mapped = CULTURE_MAP[card.id];
  if (mapped) return mapped.accent;
  return card.summary || card.oneLine || '';
}
