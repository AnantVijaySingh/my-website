"use strict";
// Fetch and display the list of essays
function loadEssays() {
    console.log("Starting to load essays..."); // Step 1: Log start of function
    const essaysContainer = document.getElementById('essays-container');
    if (!essaysContainer) {
        console.error("Could not find the essays container."); // Step 2: Check if container exists
        return;
    }
    console.log("Found essays container."); // Step 3: Log container found
    // Fetch essays metadata from `essays.json`
    fetch('data/essays.json')
        .then((response) => {
        console.log("Fetching essays.json..."); // Step 4: Log fetch initiation
        if (!response.ok) {
            console.error(`Failed to fetch essays.json: ${response.status}`); // Step 5: Log HTTP status
            throw new Error('Failed to fetch essays.json');
        }
        console.log("Fetched essays.json successfully."); // Step 6: Log successful fetch
        return response.json(); // Parse JSON
    })
        .then((essays) => {
        console.log("Parsing essays.json:", essays); // Step 7: Log parsed JSON data
        // Clear the container
        essaysContainer.innerHTML = '';
        console.log("Cleared the essays container."); // Step 8: Log container cleared
        // Create a list of essays
        essays.forEach((essay) => {
            console.log(`Rendering essay: ${essay.title}`); // Step 9: Log each essay rendering
            const essayDiv = document.createElement('div');
            const essayTitle = document.createElement('h3');
            const essayDate = document.createElement('p');
            const essaySnippet = document.createElement('p');
            essayTitle.textContent = essay.title;
            essayDate.textContent = `Published: ${essay.date}`;
            essaySnippet.textContent = essay.snippet;
            // Append elements to the essay div
            essayDiv.appendChild(essayTitle);
            essayDiv.appendChild(essayDate);
            essayDiv.appendChild(essaySnippet);
            // Append the essay div to the container
            essaysContainer.appendChild(essayDiv);
            console.log(`Rendered essay: ${essay.title}`); // Step 10: Log successful render
        });
    })
        .catch((error) => {
        console.error("Error occurred while loading essays:", error); // Step 11: Log fetch/render errors
        essaysContainer.innerHTML = '<p>Failed to load essays. Please try again later.</p>';
    });
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Starting loadEssays..."); // Step 0: Log DOM load
    loadEssays();
});
