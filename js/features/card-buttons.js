function cardButtonsHandler(t) {
  return [{
    icon: './images/icon.png',
    text: 'Dependencies SM',
    callback: function(t) {
      return t.popup({
        title: 'Add Dependency',
        url: './views/add-dependency.html',
        height: 600
      });
    }
  }];
}
