function updateThemeImages(theme) {
    const favicon = document.getElementById('favicon');
    const navLogo = document.getElementById('nav-logo');
    if (favicon) {
        favicon.href = theme === 'dark' ? 'images/favicon-dark.png' : 'images/favicon-light.png';
    }
    if (navLogo) {
        navLogo.src = theme === 'dark' ? 'images/logo-dark.png' : 'images/logo-light.png';
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
    
    // updateThemeImages can't be called here easily if DOM isn't parsed yet for nav-logo and favicon,
    // but favicon can be set in HTML and logo too. We will rely on DOMContentLoaded for the initial image sync.
    window.addEventListener('DOMContentLoaded', () => {
        updateThemeImages(initialTheme);
    });
})();
