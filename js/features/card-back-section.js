function cardBackSectionHandler(t) {
  return t.card('id')
    .then(function(card) {
      return t.get(card.id, 'shared', 'dependencies');
    })
    .then(function(dependencies) {
      // Don't show the section if there are no dependencies
      if (!dependencies || dependencies.length === 0) {
        return [];
      }

      return [{
        title: 'Dependencies',
        icon: './images/icon.png',
        content: {
          type: 'iframe',
          url: t.signUrl('./views/card-back-section.html'),
          height: 200
        },
        action: {
          text: 'Remove All',
          callback: async function(t) {
            // Show confirmation dialog
            const confirmed = await t.confirm({
              message: 'Are you sure you want to remove all dependencies from this card?',
              confirmText: 'Remove All',
              onConfirm: async function(t) {
                return true;
              },
              confirmStyle: 'danger'
            });

            if (!confirmed) {
              return;
            }

            const card = await t.card('id');
            const currentCardId = card.id;

            // Get all dependencies for this card
            const dependencies = await t.get(currentCardId, 'shared', 'dependencies') || [];

            // Remove reverse dependencies from all linked cards
            for (const dep of dependencies) {
              const linkedCardDeps = await t.get(dep.cardId, 'shared', 'dependencies') || [];
              const filtered = linkedCardDeps.filter(d => d.cardId !== currentCardId);

              if (filtered.length === 0) {
                await t.remove(dep.cardId, 'shared', 'dependencies');
              } else {
                await t.set(dep.cardId, 'shared', 'dependencies', filtered);
              }
            }

            // Remove all dependencies from current card
            await t.remove(currentCardId, 'shared', 'dependencies');
          }
        }
      }];
    });
}
