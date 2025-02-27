function setCookies(cookiesBool) {
    fetch("/set-cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookiesBool })
    })
    .then(response => response.json())
    // .then(data => console.log("Cookies set:", data.message))
    .catch(error => console.error("Error setting cookies:", error));
}