const t = window.TrelloPowerUp.iframe();

// Dependency type mappings for reverse relationships
const REVERSE_DEPENDENCY_MAP = {
  'blocks': 'is-blocked-by',
  'is-blocked-by': 'blocks',
  'is-related-to': 'is-related-to',
  'is-duplicate-to': 'is-duplicate-to',
  'is-child-to': 'is-parent-to',
  'is-parent-to': 'is-child-to'
};

// Display names for dependency types
const DEPENDENCY_DISPLAY_NAMES = {
  'blocks': 'Blocks',
  'is-blocked-by': 'Is Blocked By',
  'is-related-to': 'Is Related To',
  'is-duplicate-to': 'Is Duplicate To',
  'is-child-to': 'Is Child To',
  'is-parent-to': 'Is Parent To'
};

let allCards = [];
let allLists = [];
let currentCardId = '';

// Theme handling
function applyTheme() {
  const context = t.getContext();
  const theme = context ? (context.theme || context.initialTheme || 'light') : 'light';

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

applyTheme();

t.subscribeToThemeChanges(function(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

// DOM elements
const dependencyTypeSelect = document.getElementById('dependency-type');
const cardSearchInput = document.getElementById('card-search');
const cardsList = document.getElementById('cards-list');

// Initialize
async function init() {
  const [cards, lists, card] = await Promise.all([
    t.cards('all'),
    t.lists('all'),
    t.card('id')
  ]);

  currentCardId = card.id;
  allLists = lists;

  // Filter out the current card from the list
  allCards = cards.filter(c => c.id !== currentCardId);

  // Show all cards initially
  searchCards('');
}

// Search and display cards
function searchCards(query) {
  let matchingCards;

  if (!query.trim()) {
    // Show all cards sorted by date created (newest first)
    matchingCards = [...allCards].sort((a, b) => {
      // Trello card IDs are time-based, so we can sort by ID
      // Newer cards have larger IDs
      return b.id.localeCompare(a.id);
    });
  } else {
    const lowerQuery = query.toLowerCase();
    matchingCards = allCards
      .filter(card => card.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        // Sort search results by date created (newest first)
        return b.id.localeCompare(a.id);
      });
  }

  if (matchingCards.length === 0) {
    cardsList.innerHTML = '<div class="no-cards">No cards found</div>';
    return;
  }

  cardsList.innerHTML = matchingCards.map(card => {
    const list = allLists.find(l => l.id === card.idList);
    const listName = list ? list.name : 'Unknown List';

    return `
      <div class="card-item" data-card-id="${card.id}" data-card-name="${escapeHtml(card.name)}">
        <div class="card-name">${escapeHtml(card.name)}</div>
        <div class="card-list">in list <strong>${escapeHtml(listName)}</strong></div>
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.card-item').forEach(item => {
    item.addEventListener('click', function() {
      const cardId = this.dataset.cardId;
      const cardName = this.dataset.cardName;
      addDependency(cardId, cardName);
    });
  });
}

// Add dependency to both cards
async function addDependency(linkedCardId, linkedCardName) {
  const dependencyType = dependencyTypeSelect.value;
  const reverseType = REVERSE_DEPENDENCY_MAP[dependencyType];

  // Get current card info
  const currentCard = await t.card('name');

  // Create dependency object for current card
  const currentCardDependency = {
    id: generateId(),
    type: dependencyType,
    cardId: linkedCardId,
    cardName: linkedCardName,
    resolved: false
  };

  // Create reverse dependency object for linked card
  const linkedCardDependency = {
    id: generateId(),
    type: reverseType,
    cardId: currentCardId,
    cardName: currentCard.name,
    resolved: false
  };

  // Get existing dependencies
  const currentCardDeps = await t.get(currentCardId, 'shared', 'dependencies') || [];
  const linkedCardDeps = await t.get(linkedCardId, 'shared', 'dependencies') || [];

  // Add new dependencies
  currentCardDeps.push(currentCardDependency);
  linkedCardDeps.push(linkedCardDependency);

  // Save to both cards
  await Promise.all([
    t.set(currentCardId, 'shared', 'dependencies', currentCardDeps),
    t.set(linkedCardId, 'shared', 'dependencies', linkedCardDeps)
  ]);

  // Close popup
  t.closePopup();
}

// Helper functions
function generateId() {
  return 'dep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
cardSearchInput.addEventListener('input', function() {
  searchCards(this.value);
});

// Initialize
init();
