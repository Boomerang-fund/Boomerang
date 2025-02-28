
function setLanguage(language) {
    // Send the POST request
    fetch("/set-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language })
    })
    .then(response => response.json())
    .then(data => {
        // Update the dropdown button text immediately
        document.getElementById("languageDropdown").innerText = language.toUpperCase();
    })
    .catch(error => console.error("Error setting language:", error));
    }


function setCurrency(currency) {
    // Sends the POST method without reloading the page
    fetch("/set-currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency })
    })
    .then(data => {
    // Update the dropdown button text immediately
    document.getElementById("currencyDropdown").innerText = currency.toUpperCase();
    })
    .catch(error => console.error("Error setting language:", error));
    }