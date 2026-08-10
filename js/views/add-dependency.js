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
let currentCardDependencies = [];

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
const confirmBtn = document.getElementById('confirm-btn');
const snackbar = document.getElementById('snackbar');
const depPreviewCurrent = document.getElementById('dep-preview-current');
const depPreviewTarget = document.getElementById('dep-preview-target');
const depPreviewTypeBadge = document.getElementById('dep-preview-type-badge');

let selectedCardId = null;
let selectedCardName = null;
let currentCardName = '';

// Initialize
async function init() {
  const [cards, lists, card] = await Promise.all([
    t.cards('all'),
    t.lists('all'),
    t.card('id', 'name')
  ]);

  currentCardId = card.id;
  currentCardName = card.name;
  allLists = lists;

  currentCardDependencies = await t.get(currentCardId, 'shared', 'dependencies') || [];

  depPreviewCurrent.textContent = card.name;
  updateDepPreview();

  // Filter out the current card from the list
  allCards = cards.filter(c => c.id !== currentCardId);

  // Show all cards initially
  searchCards('');
}

// Check a relationship by its type and its reverse type. Dependencies are
// stored on both cards, so either direction represents the same relationship.
function dependencyTypesMatch(existingType, requestedType) {
  return existingType === requestedType || existingType === REVERSE_DEPENDENCY_MAP[requestedType];
}

function hasDependencyForCard(dependencies, linkedCardId, dependencyType) {
  return dependencies.some(dep => {
    return dep.cardId === linkedCardId && dependencyTypesMatch(dep.type, dependencyType);
  });
}

function isCardUnavailable(cardId, dependencyType) {
  return !!dependencyType && hasDependencyForCard(currentCardDependencies, cardId, dependencyType);
}

// Disable dependency types that already exist for the selected target card.
function updateDependencyTypeOptions() {
  Array.from(dependencyTypeSelect.options).forEach(option => {
    if (!option.value) return;

    const baseLabel = option.dataset.baseLabel || DEPENDENCY_DISPLAY_NAMES[option.value] || option.textContent;
    const unavailable = !!selectedCardId && isCardUnavailable(selectedCardId, option.value);

    option.dataset.baseLabel = baseLabel;
    option.disabled = unavailable;
    option.textContent = unavailable ? `${baseLabel} (already exists)` : baseLabel;

    if (unavailable) {
      option.setAttribute('aria-disabled', 'true');
    } else {
      option.removeAttribute('aria-disabled');
    }

    // Keep the form valid if data changed while the popup was open.
    if (unavailable && option.selected) {
      dependencyTypeSelect.value = '';
    }
  });
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

  const selectedDependencyType = dependencyTypeSelect.value;

  cardsList.innerHTML = matchingCards.map(card => {
    const list = allLists.find(l => l.id === card.idList);
    const listName = list ? list.name : 'Unknown List';
    const unavailable = isCardUnavailable(card.id, selectedDependencyType);
    const selected = card.id === selectedCardId;
    const stateClass = [
      'card-item',
      unavailable ? 'disabled' : '',
      selected ? 'selected' : ''
    ].filter(Boolean).join(' ');

    return `
      <div class="${stateClass}" data-card-id="${card.id}" data-card-name="${escapeHtml(card.name)}"${unavailable ? ' aria-disabled="true"' : ''}>
        <div class="card-name">${escapeHtml(card.name)}</div>
        <div class="card-list">in list <strong>${escapeHtml(listName)}</strong></div>
        ${unavailable ? '<div class="card-status">Dependency already exists</div>' : ''}
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.card-item').forEach(item => {
    item.addEventListener('click', function() {
      if (this.classList.contains('disabled')) return;

      // Deselect previously selected
      document.querySelectorAll('.card-item.selected').forEach(el => el.classList.remove('selected'));
      this.classList.add('selected');

      selectedCardId = this.dataset.cardId;
      selectedCardName = this.dataset.cardName;

      updateDependencyTypeOptions();

      // Clear error state on card list when a card is selected
      cardsList.closest('.cards-list-container').classList.remove('error');

      updateDepPreview();
    });
  });
}

// Add dependency to both cards
async function addDependency(linkedCardId, linkedCardName) {
  const dependencyType = dependencyTypeSelect.value;
  const reverseType = REVERSE_DEPENDENCY_MAP[dependencyType];

  // Re-read both cards immediately before writing, so two open popups cannot
  // create the same dependency after the initial availability check.
  const [currentCard, currentCardDeps, linkedCardDeps] = await Promise.all([
    t.card('name'),
    t.get(currentCardId, 'shared', 'dependencies'),
    t.get(linkedCardId, 'shared', 'dependencies')
  ]);

  const existingCurrentCardDeps = currentCardDeps || [];
  const existingLinkedCardDeps = linkedCardDeps || [];
  const dependencyAlreadyExists = hasDependencyForCard(existingCurrentCardDeps, linkedCardId, dependencyType)
    || hasDependencyForCard(existingLinkedCardDeps, currentCardId, dependencyType);

  if (dependencyAlreadyExists) {
    currentCardDependencies = existingCurrentCardDeps;
    updateDependencyTypeOptions();
    searchCards(cardSearchInput.value);
    showSnackbar('This dependency already exists between these cards.');
    return false;
  }

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

  // Add new dependencies
  existingCurrentCardDeps.push(currentCardDependency);
  existingLinkedCardDeps.push(linkedCardDependency);

  // Save to both cards
  await Promise.all([
    t.set(currentCardId, 'shared', 'dependencies', existingCurrentCardDeps),
    t.set(linkedCardId, 'shared', 'dependencies', existingLinkedCardDeps)
  ]);

  // Close popup
  t.closePopup();
  return true;
}

// Update the dependency preview widget
function updateDepPreview() {
  const type = dependencyTypeSelect.value;

  depPreviewTypeBadge.textContent = type ? DEPENDENCY_DISPLAY_NAMES[type] : '—';

  if (selectedCardName) {
    depPreviewTarget.textContent = selectedCardName;
    depPreviewTarget.classList.remove('dep-preview-placeholder');
  } else {
    depPreviewTarget.textContent = 'select a card…';
    depPreviewTarget.classList.add('dep-preview-placeholder');
  }
}

// Show snackbar message
function showSnackbar(message) {
  snackbar.textContent = message;
  snackbar.classList.add('show');
  setTimeout(() => snackbar.classList.remove('show'), 3000);
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

dependencyTypeSelect.addEventListener('change', function() {
  this.classList.remove('error');
  searchCards(cardSearchInput.value);
  updateDepPreview();
});


confirmBtn.addEventListener('click', async function() {
  const dependencyType = dependencyTypeSelect.value;
  const hasCard = !!selectedCardId;
  const hasType = !!dependencyType;

  // Clear previous error states
  dependencyTypeSelect.classList.remove('error');
  cardsList.closest('.cards-list-container').classList.remove('error');

  if (!hasCard && !hasType) {
    dependencyTypeSelect.classList.add('error');
    cardsList.closest('.cards-list-container').classList.add('error');
    showSnackbar('Please select a dependency type and a card.');
    return;
  }
  if (!hasType) {
    dependencyTypeSelect.classList.add('error');
    showSnackbar('Please select a dependency type.');
    return;
  }
  if (!hasCard) {
    cardsList.closest('.cards-list-container').classList.add('error');
    showSnackbar('Please select a card to link.');
    return;
  }

  await addDependency(selectedCardId, selectedCardName);
});

// Initialize
init();
