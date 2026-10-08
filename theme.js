function updateThemeImages(theme) {
    const favicon = document.getElementById('favicon');
    const navLogo = document.getElementById('nav-logo');
    if (favicon) {
        favicon.href = theme === 'dark' ? 'images/favicon-dark.svg' : 'images/favicon-light.svg';
        favicon.type = 'image/svg+xml';
    }
    if (navLogo) {
        navLogo.src = theme === 'dark' ? 'images/logo-dark.svg' : 'images/logo-light.svg';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeImages(newTheme);
        });
    }
});

// Immediately apply theme to avoid flash
(function() {
    const savedTheme = localStorage.getItem('theme');
    let initialTheme = 'dark'; // Default
    if (savedTheme) {
        initialTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        initialTheme = 'light';
    }
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    window.addEventListener('DOMContentLoaded', () => {
        updateThemeImages(initialTheme);
    });
})();
