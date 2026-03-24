// Card detail badges feature handler
function cardDetailBadgesHandler(t) {
  // Always show the Dependencies badge that opens the add dependency popup
  return [{
    title: 'Dependencies',
    text: 'Add Dependency',
    color: 'red',
    callback: function(t) {
      return t.popup({
        title: 'Add Dependency',
        url: './views/add-dependency.html',
        height: 700
      });
    }
  }];
}
