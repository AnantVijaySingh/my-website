function initializeDarkMode() {
    const toggleSwitch = document.getElementById('switch') as HTMLInputElement;
    const body = document.body;

    // Load the saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (toggleSwitch) {
            toggleSwitch.checked = true;
        }
    }

    // Add event listener to toggle
    toggleSwitch?.addEventListener('change', () => {
        const isDark = toggleSwitch?.checked;
        body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeDarkMode);