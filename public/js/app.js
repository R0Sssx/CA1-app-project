(function () {
  'use strict';

  document.querySelectorAll('.delete-log-form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var confirmed = window.confirm('Delete this log? This cannot be undone.');
      if (!confirmed) {
        event.preventDefault();
      }
    });
  });
})();
