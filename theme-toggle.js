// Dark/Light mode toggle for phone-container
document.addEventListener('DOMContentLoaded', function() {
  const lightOption = document.getElementById('lightOption');
  const darkOption = document.getElementById('darkOption');
  const phoneContainer = document.getElementById('phoneContainer');
  const themeIconBtn = document.getElementById('themeIconBtn');

  // Check for saved theme preference or default to light
  const currentTheme = localStorage.getItem('phoneTheme') || 'light';

  // Apply initial theme
  function setTheme(theme) {
    phoneContainer.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      phoneContainer.style.background = '#000';
      if (darkOption) darkOption.classList.add('active');
      if (lightOption) lightOption.classList.remove('active');
      if (themeIconBtn) themeIconBtn.textContent = '☀️';
      localStorage.setItem('phoneTheme', 'dark');
    } else {
      phoneContainer.style.background = '#fff';
      if (lightOption) lightOption.classList.add('active');
      if (darkOption) darkOption.classList.remove('active');
      if (themeIconBtn) themeIconBtn.textContent = '🌙';
      localStorage.setItem('phoneTheme', 'light');
    }
  }

  // Set initial theme
  setTheme(currentTheme);

  // Drawer light/dark buttons
  if (lightOption) {
    lightOption.addEventListener('click', function() { setTheme('light'); });
  }
  if (darkOption) {
    darkOption.addEventListener('click', function() { setTheme('dark'); });
  }

  // Desktop icon toggle — one click flips theme
  if (themeIconBtn) {
    themeIconBtn.addEventListener('click', function() {
      const current = localStorage.getItem('phoneTheme') || 'light';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }
});
