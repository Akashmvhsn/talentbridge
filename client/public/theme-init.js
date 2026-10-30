// Apply saved theme before first paint (external file so the CSP allows it)
try {
  var t = localStorage.getItem('tb_theme');
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
