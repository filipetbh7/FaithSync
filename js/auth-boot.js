(function () {
  try {
    var hasAuthToken = false;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i) || '';
      if (key.indexOf('sb-') === 0 && key.indexOf('-auth-token') > 0 && localStorage.getItem(key)) {
        hasAuthToken = true;
        break;
      }
    }
    if (!hasAuthToken) return;
    document.documentElement.classList.add('auth-probe');
    setTimeout(function () {
      document.documentElement.classList.remove('auth-probe');
    }, 3500);
  } catch (error) {
    document.documentElement.classList.remove('auth-probe');
  }
}());
