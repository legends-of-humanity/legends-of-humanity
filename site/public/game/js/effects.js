/**
 * ERD Battle Effects System
 * Triggers visual effects based on game actions
 */

const EFFECT_MAP = {
  Build:      ['growth'],
  Reform:     ['harmony'],
  Coordinate: ['harmony'],
  Mobilize:   ['oil', 'fire'],
  Reveal:     ['reveal', 'data'],
  Pressure:   ['pressure', 'lightning'],
  Stabilize:  ['growth', 'harmony'],
  Extract:    ['oil'],
  Invest:     ['invest'],
  Protect:    ['growth'],
  Reconcile:  ['harmony'],
  Disrupt:    ['lightning', 'data'],
  Research:   ['data'],
  Automate:   ['data', 'lightning']
};

let effectOverlay = null;

function initEffects() {
  effectOverlay = document.createElement('div');
  effectOverlay.className = 'effect-overlay';
  effectOverlay.id = 'effect-overlay';
  document.body.appendChild(effectOverlay);
}

function playEffect(actionName, options = {}) {
  if (!effectOverlay) initEffects();
  const effects = EFFECT_MAP[actionName] || [];
  effects.forEach((effect, i) => {
    setTimeout(() => triggerEffect(effect), i * 200);
  });
}

function triggerEffect(effectName) {
  const el = document.createElement('div');
  el.className = 'effect-' + effectName;
  effectOverlay.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function playScoreFloat(element, value, type) {
  const float = document.createElement('div');
  float.className = 'score-float ' + (value > 0 ? 'positive' : 'negative');
  float.textContent = (value > 0 ? '+' : '') + value;
  const rect = element.getBoundingClientRect();
  float.style.left = rect.left + rect.width / 2 + 'px';
  float.style.top = rect.top + 'px';
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1500);
}

function playVictoryEffect(won) {
  if (won) {
    // Confetti!
    const colors = ['#c9a84c', '#51cf66', '#4dabf7', '#ff6b6b', '#9b59b6', '#fff'];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
      }, i * 50);
    }
  }
}

function playActionEffects(actions) {
  if (!Array.isArray(actions)) return;
  actions.forEach((entry, i) => {
    setTimeout(() => playEffect(entry.action), i * 400);
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEffects);
} else {
  initEffects();
}
