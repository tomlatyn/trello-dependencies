const t = window.TrelloPowerUp.iframe();

// Display names for dependency types
const DEPENDENCY_DISPLAY_NAMES = {
  'blocks': 'Blocks',
  'is-blocked-by': 'Is Blocked By',
  'is-related-to': 'Is Related To',
  'is-duplicate-to': 'Is Duplicate To',
  'is-child-to': 'Is Child To',
  'is-parent-to': 'Is Parent To'
};

// Reverse dependency mapping
const REVERSE_DEPENDENCY_MAP = {
  'blocks': 'is-blocked-by',
  'is-blocked-by': 'blocks',
  'is-related-to': 'is-related-to',
  'is-duplicate-to': 'is-duplicate-to',
  'is-child-to': 'is-parent-to',
  'is-parent-to': 'is-child-to'
};

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
const dependenciesList = document.getElementById('dependencies-list');

// Resize iframe to fit content
function resizeToContent() {
  setTimeout(function() {
    var body = document.body;
    var html = document.documentElement;

    // Calculate maximum height of content
    var height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    height += 20; // Add padding buffer

    // Tell Trello to resize iframe to fit content
    t.sizeTo('body').catch(function(error) {
      console.log('Resize failed, trying alternative:', error);
      t.sizeTo('#dependencies-list');
    });
  }, 50); // Small delay to allow DOM to settle
}

// Load and display dependencies
async function loadDependencies() {
  try {
    const card = await t.card('id', 'url');
    currentCardId = card.id;

    const dependencies = await t.get(currentCardId, 'shared', 'dependencies') || [];

    if (dependencies.length === 0) {
      dependenciesList.innerHTML = '<div class="no-dependencies">No dependencies yet</div>';
      resizeToContent();
      return;
    }

    // Build the base URL from current card URL (remove the card-specific part)
    const baseUrl = card.url.split('/c/')[0];

    dependenciesList.innerHTML = dependencies.map(dep => {
      // Construct full Trello card URL
      const cardUrl = `${baseUrl}/c/${dep.cardId}`;

      return `
        <div class="dependency-item">
          <div class="dependency-info">
            <span class="dependency-type">${DEPENDENCY_DISPLAY_NAMES[dep.type]}</span>
            <a href="${cardUrl}" class="card-link ${dep.resolved ? 'resolved' : ''}" data-card-url="${cardUrl}">
              ${escapeHtml(dep.cardName)}
            </a>
          </div>
          <div class="dependency-actions">
            <button class="btn-resolve ${dep.resolved ? 'active' : ''}" data-dep-id="${dep.id}" title="${dep.resolved ? 'Unresolve' : 'Resolve'}">
              ✓
            </button>
            <button class="btn-remove" data-dep-id="${dep.id}" data-linked-card-id="${dep.cardId}" title="Remove">
              ×
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners
    attachEventListeners();

    // Resize iframe to fit content
    resizeToContent();
  } catch (error) {
    console.error('Error loading dependencies:', error);
  }
}

// Attach event listeners to buttons and links
function attachEventListeners() {
  // Card links - use t.navigate() to navigate to the card
  document.querySelectorAll('.card-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const cardUrl = this.dataset.cardUrl;
      t.navigate({ url: cardUrl });
    });
  });

  // Resolve buttons
  document.querySelectorAll('.btn-resolve').forEach(btn => {
    btn.addEventListener('click', async function() {
      const depId = this.dataset.depId;
      await toggleResolve(depId);
    });
  });

  // Remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async function() {
      const depId = this.dataset.depId;
      const linkedCardId = this.dataset.linkedCardId;
      await removeDependency(depId, linkedCardId);
    });
  });
}

// Toggle resolve status
async function toggleResolve(depId) {
  const dependencies = await t.get(currentCardId, 'shared', 'dependencies') || [];
  const dep = dependencies.find(d => d.id === depId);

  if (dep) {
    const newResolvedState = !dep.resolved;
    dep.resolved = newResolvedState;
    await t.set(currentCardId, 'shared', 'dependencies', dependencies);

    // Update the linked card's reverse dependency
    const linkedCardId = dep.cardId;
    const linkedCardDeps = await t.get(linkedCardId, 'shared', 'dependencies') || [];
    const reverseDep = linkedCardDeps.find(d => d.cardId === currentCardId);

    if (reverseDep) {
      reverseDep.resolved = newResolvedState;
      await t.set(linkedCardId, 'shared', 'dependencies', linkedCardDeps);
    }

    loadDependencies();
  }
}

// Remove dependency from both cards
async function removeDependency(depId, linkedCardId) {
  // Show native confirmation dialog
  if (!confirm('Are you sure you want to remove this dependency?\n\nThis will also remove the reverse dependency from the linked card.')) {
    return;
  }

  // Get dependencies from current card
  const currentCardDeps = await t.get(currentCardId, 'shared', 'dependencies') || [];

  // Find the dependency to remove
  const depToRemove = currentCardDeps.find(d => d.id === depId);

  if (!depToRemove) return;

  // Remove from current card
  const filteredCurrentDeps = currentCardDeps.filter(d => d.id !== depId);

  if (filteredCurrentDeps.length === 0) {
    await t.remove(currentCardId, 'shared', 'dependencies');
  } else {
    await t.set(currentCardId, 'shared', 'dependencies', filteredCurrentDeps);
  }

  // Remove reverse dependency from linked card
  const linkedCardDeps = await t.get(linkedCardId, 'shared', 'dependencies') || [];
  const filteredLinkedDeps = linkedCardDeps.filter(d => d.cardId !== currentCardId);

  if (filteredLinkedDeps.length === 0) {
    await t.remove(linkedCardId, 'shared', 'dependencies');
  } else {
    await t.set(linkedCardId, 'shared', 'dependencies', filteredLinkedDeps);
  }

  // Reload dependencies
  loadDependencies();
}

// Helper function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
loadDependencies();

// Listen for updates - this will be called when data changes
t.render(function() {
  return loadDependencies();
});
