// Declare global variables
window.selectedCategories = window.selectedCategories || new Map();
window.handleKeywordSelection = handleKeywordSelection; 

const maxKeywords = 5;

// Render categories from previously saved categories
function renderCategories(existingSelection = {}) {
    const container = document.getElementById("categories-container");
    container.innerHTML = "";

    Object.entries(categories).forEach(([category, keywords]) => {
        const categoryCard = document.createElement("div");
        categoryCard.className = "card mb-3 shadow-sm";

        const selectedKeywords = new Set(existingSelection[category] || []); 

        categoryCard.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">${category}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    ${keywords.map(keyword => `
                        <div class="col-md-6 col-lg-4 mb-2">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input"
                                    id="${keyword}" name="project[keywords][]"
                                    value="${keyword}" data-category="${category}" 
                                    ${selectedKeywords.has(keyword) ? "checked" : ""}
                                    onchange="handleKeywordSelection(event)">
                                <label class="form-check-label" for="${keyword}">${keyword}</label>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;

        container.appendChild(categoryCard);
    });

    updateKeywordCounter();
}




// Handle user keyword selection
function handleKeywordSelection(event) {
    const keyword = event.target.value;
    const category = event.target.dataset.category;
    const isChecked = event.target.checked;

    // Calculate total selected keywords dynamically
    const totalSelected = Array.from(window.selectedCategories.values()).reduce((sum, keywords) => sum + keywords.size, 0);

    if (isChecked && totalSelected >= maxKeywords) {
        event.target.checked = false; // Prevent exceeding max limit
        alert(`You can only select up to ${maxKeywords} keywords.`);
        return;
    }

    if (!window.selectedCategories.has(category)) {
        window.selectedCategories.set(category, new Set());
    }

    const categorySet = window.selectedCategories.get(category);

    isChecked ? categorySet.add(keyword) : categorySet.delete(keyword);

    // If category is empty after deletion, remove it from `window.selectedCategories`
    if (categorySet.size === 0) {
        window.selectedCategories.delete(category);
    }

    // Update UI with the latest count
    updateKeywordCounter();
}



// Get total selected keywords count
function updateKeywordCounter() {
    if (!window.selectedCategories) return; // Ensure map exists
    const totalSelected = Array.from(window.selectedCategories.values())
        .reduce((sum, keywords) => sum + keywords.size, 0);
    document.getElementById("selected-count").textContent = `${totalSelected}/${maxKeywords}`;
}

// Retrieve selected categories & keywords for backend submission
function getSelectedCategoriesForSubmission() {
    const categoryData = {};
    window.selectedCategories.forEach((keywords, category) => {
        categoryData[category] = Array.from(keywords);
    });
    return categoryData; // Returns an object
}


// Initialize the categories rendering on page load
document.addEventListener("DOMContentLoaded", function (){

    window.selectedCategories = new Map(Object.entries(existingSelection).map(([category, keywords]) => [category, new Set(keywords)])); // Retrieve previously saved categories to be changed and submitted again

    renderCategories(existingSelection); // Render previously saved categories (passed from new.ejs)
    
    updateKeywordCounter(); // Update the counter after loading saved categories
});