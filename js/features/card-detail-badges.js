// Card detail badges feature handler
function cardDetailBadgesHandler(t) {
  // Always show the Dependencies badge that opens the add dependency popup
  return [{
    title: 'Dependencies',
    text: 'Set dependency',
    color: 'green',
    callback: function(t) {
      return t.popup({
        title: 'Add Dependency',
        url: './views/add-dependency.html',
        height: 500
      });
    }
  }];
}
