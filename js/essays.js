"use strict";
// Helper function to format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: 'short', // Use short form for the month (e.g., "Jan", "Feb")
        year: 'numeric',
    };
    return date
        .toLocaleDateString('en-US', options)
        .toUpperCase(); // Convert to uppercase for consistency (e.g., "JAN")
}
// Load essays and render the list
function loadEssays() {
    console.log("Loading essays...");
    // Fetch the essays metadata from `essays.json`
    fetch('data/essays.json')
        .then((response) => {
        if (!response.ok) {
            console.error(`Failed to fetch essays.json: ${response.status}`);
            throw new Error('Failed to fetch essays.json');
        }
        return response.json();
    })
        .then((essays) => {
        console.log("Essays fetched successfully:", essays);
        // Find the container to render the essays
        const essaysContainer = document.getElementById('essays-container');
        if (!essaysContainer) {
            console.error("Essays container not found.");
            return;
        }
        // Clear the container
        essaysContainer.innerHTML = '';
        // Render each essay
        essays.forEach((essay) => {
            console.log(`Rendering essay: ${essay.title}`);
            // Create the structure for an essay item
            const essayDiv = document.createElement('div');
            essayDiv.className = 'essay-item';
            // Add the formatted date
            const essayDate = document.createElement('div');
            essayDate.className = 'essay-date';
            essayDate.textContent = formatDate(essay.date);
            // Add the title with a link
            const essayTitle = document.createElement('a');
            essayTitle.href = `essays/${essay.filename.replace('.md', '.html')}`;
            essayTitle.className = 'essay-title';
            essayTitle.textContent = essay.title;
            // Add the snippet
            const essaySnippet = document.createElement('p');
            essaySnippet.className = 'essay-snippet';
            essaySnippet.textContent = essay.snippet;
            // Create a wrapper for title and snippet
            const essayContent = document.createElement('div');
            essayContent.className = 'essay-content';
            essayContent.appendChild(essayTitle);
            essayContent.appendChild(essaySnippet);
            // Append date and content to the essay div
            essayDiv.appendChild(essayDate);
            essayDiv.appendChild(essayContent);
            // Append the essay div to the container
            essaysContainer.appendChild(essayDiv);
        });
    })
        .catch((error) => {
        console.error("Error loading essays:", error);
        const essaysContainer = document.getElementById('essays-container');
        if (essaysContainer) {
            essaysContainer.innerHTML = '<p>Failed to load essays. Please try again later.</p>';
        }
    });
}
// Initialize the page by loading essays when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Starting to load essays...");
    loadEssays();
});
