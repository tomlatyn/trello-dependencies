function cardBadgesHandler(t) {
  return t.card('id')
    .then(function(card) {
      return t.get(card.id, 'shared', 'dependencies');
    })
    .then(function(dependencies) {
      // If there are no dependencies, don't show a badge
      if (!dependencies || dependencies.length === 0) {
        return [];
      }

      // Count unresolved dependencies
      const unresolvedCount = dependencies.filter(function(dep) {
        return !dep.resolved;
      }).length;

      // Only show badge if there are unresolved dependencies
      if (unresolvedCount === 0) {
        return [];
      }

      return [{
        text: unresolvedCount.toString(),
        color: 'red',
        icon: './images/icon.png'
      }];
    });
}
