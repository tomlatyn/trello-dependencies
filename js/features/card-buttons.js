function cardButtonsHandler(t) {
  return [{
    icon: './images/icon.png',
    text: 'Add Dependency',
    callback: function(t) {
      return t.popup({
        title: 'Add Dependency',
        url: './views/add-dependency.html',
        height: 350
      });
    }
  }];
}
