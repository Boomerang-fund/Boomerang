document.addEventListener("DOMContentLoaded", () => {
    const cookiePopup = document.getElementById("cookieConsent");
    const accept = document.getElementById("accept");
    const decline = document.getElementById("decline");

    // Handle Accept
    accept.addEventListener("click", () => {
        fadeOut(cookiePopup);
        setCookies(true);
    });
    // Handle Decline
    decline.addEventListener("click", () => {
        fadeOut(cookiePopup);
        setCookies(false);
    });

    function fadeOut(element) {
        element.style.opacity = "0";  
        setTimeout(() => {
            element.style.display = "none";  
        }, 500);
    }
    function setCookies(cookiesBool) {
        fetch("/set-cookies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cookiesBool })
        }).catch(error => console.error("Error setting cookies:", error));
    }
});