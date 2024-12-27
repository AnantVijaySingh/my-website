"use strict";
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
            // Add the date
            const essayDate = document.createElement('span');
            essayDate.className = 'essay-date';
            essayDate.textContent = essay.date;
            // Add the title with a link
            const essayLink = document.createElement('a');
            essayLink.href = `essays/${essay.filename.replace('.md', '.html')}`;
            essayLink.className = 'essay-title';
            essayLink.textContent = essay.title;
            // Add the snippet
            const essaySnippet = document.createElement('p');
            essaySnippet.className = 'essay-snippet';
            essaySnippet.textContent = essay.snippet;
            // Append elements to the essay div
            essayDiv.appendChild(essayDate);
            essayDiv.appendChild(essayLink);
            essayDiv.appendChild(essaySnippet);
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
