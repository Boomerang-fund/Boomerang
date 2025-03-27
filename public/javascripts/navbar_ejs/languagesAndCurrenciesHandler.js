
function setLanguage(language) {
    // Send the POST request
    fetch("/set-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
    })
    .then((response) => response.json())
    .then((data) => {
        // Update the dropdown button text immediately
        document.getElementById("languageDropdown").innerText = language.toUpperCase();

        // Updating dynamic text - TODO: Add more dynamic multilanguage if needed
        // Card: Project title
        document.querySelectorAll(".card-title").forEach((el) => {
            if (el.hasAttribute("title-multilangauge-map")) {
                const languageMap = JSON.parse(el.getAttribute("title-multilangauge-map"));
                el.textContent = languageMap[language] || languageMap["th"];
            }
        });

        // Card: Project description
        document.querySelectorAll(".card-text").forEach((el) => {
            if (el.hasAttribute("description-multilangauge-map")) {
                const languageMap = JSON.parse(el.getAttribute("description-multilangauge-map"));
                el.textContent = languageMap[language] || languageMap["th"];
            }
        });
    })
    .catch((error) => console.error("Error setting language:", error));
}

function setCurrency(currency) {
    // Sends the POST method without reloading the page
    fetch("/set-currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
    })
    .then((data) => {
        // Update the dropdown button text immediately
        document.getElementById("currencyDropdown").innerText = currency.toUpperCase();
    })
    .catch((error) => console.error("Error setting language:", error));
}