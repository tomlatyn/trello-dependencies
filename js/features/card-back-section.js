function cardBackSectionHandler(t) {
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
        const card = await t.card('id');
        const currentCardId = card.id;

        // Get all dependencies for this card
        const dependencies = await t.get(currentCardId, 'shared', 'dependencies') || [];

        // Remove reverse dependencies from all linked cards
        for (const dep of dependencies) {
          const linkedCardDeps = await t.get(dep.cardId, 'shared', 'dependencies') || [];
          const filtered = linkedCardDeps.filter(d => d.cardId !== currentCardId);
          await t.set(dep.cardId, 'shared', 'dependencies', filtered);
        }

        // Remove all dependencies from current card
        await t.remove(currentCardId, 'shared', 'dependencies');

        return t.closePopup();
      }
    }
  }];
}
