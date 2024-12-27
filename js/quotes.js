"use strict";
// Function to load and render quotes
function loadQuotes() {
    console.log("Loading quotes...");
    fetch('data/quotes.json')
        .then((response) => {
        if (!response.ok) {
            console.error(`Failed to fetch quotes.json: ${response.status}`);
            throw new Error('Failed to fetch quotes.json');
        }
        return response.json();
    })
        .then((quotes) => {
        console.log("Quotes fetched successfully:", quotes);
        const quotesContainer = document.getElementById('quotes-container');
        if (!quotesContainer) {
            console.error("Quotes container not found.");
            return;
        }
        quotesContainer.innerHTML = '';
        quotes.forEach((quote) => {
            console.log(`Rendering quote: ${quote.text}`);
            const quoteDiv = document.createElement('div');
            quoteDiv.className = 'quote-item';
            const quoteText = document.createElement('p');
            quoteText.className = 'quote-text';
            quoteText.textContent = quote.text;
            const quoteMeta = document.createElement('div');
            quoteMeta.className = 'quote-meta';
            const quoteAuthor = document.createElement('p');
            quoteAuthor.className = 'quote-author';
            quoteAuthor.textContent = quote.author ? `${quote.author}` : '';
            const iconsContainer = document.createElement('div');
            iconsContainer.className = 'quote-icons';
            const copyIcon = document.createElement('button');
            copyIcon.className = 'quote-copy';
            copyIcon.innerHTML = '📋';
            copyIcon.title = 'Copy Quote';
            copyIcon.addEventListener('click', () => {
                navigator.clipboard.writeText(quote.text);
                showToast('Quote copied to clipboard!');
            });
            const shareIcon = document.createElement('button');
            shareIcon.className = 'quote-share';
            shareIcon.innerHTML = '🔗';
            shareIcon.title = 'Share Quote';
            shareIcon.addEventListener('click', () => {
                const shareUrl = `${window.location.href}?quote=${encodeURIComponent(quote.text)}`;
                navigator.clipboard.writeText(shareUrl);
                showToast('Share link copied to clipboard!');
            });
            iconsContainer.appendChild(copyIcon);
            iconsContainer.appendChild(shareIcon);
            quoteMeta.appendChild(quoteAuthor);
            quoteMeta.appendChild(iconsContainer);
            quoteDiv.appendChild(quoteText);
            quoteDiv.appendChild(quoteMeta);
            quotesContainer.appendChild(quoteDiv);
        });
    })
        .catch((error) => {
        console.error("Error loading quotes:", error);
        const quotesContainer = document.getElementById('quotes-container');
        if (quotesContainer) {
            quotesContainer.innerHTML = '<p>Failed to load quotes. Please try again later.</p>';
        }
    });
}
// Toast notification function
function showToast(message) {
    // Create the toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    // Append the toast to the body
    document.body.appendChild(toast);
    // Remove the toast after 2 seconds
    setTimeout(() => {
        toast.remove();
    }, 2000);
}
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Starting to load quotes...");
    loadQuotes();
});
