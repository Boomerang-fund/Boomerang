//Redirects user to step in the draft that is incomplete
function goToStep() {
    // Hide all steps first
    document.querySelectorAll(".form-step").forEach((step) => {
        step.style.display = "none";
    });

    // Show only the current step
    const activeStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        if (activeStep) {
            activeStep.style.display = "block";
        } else {
            console.warn(`⚠️ No valid step found for ${currentStep}, defaulting to Step 1.`);
            document.querySelector('.form-step[data-step="1"]').style.display = "block"; // Default to Step 1
            currentStep = 1;
        }
}



function nextStep(step) {
    document.getElementById(`step-${currentStep}`).style.display = "none";
    document.getElementById(`step-${step}`).style.display = "block";
    currentStep = step;
}

function previousStep(step) {
    document.getElementById(`step-${currentStep}`).style.display = "none";
    document.getElementById(`step-${step}`).style.display = "block";
    currentStep = step;
}

//Dynamic flash message
function updateFlashMessage(message, type) {
    const flashContainer = document.getElementById("flash-messages");

    if (!flashContainer) {
        console.error("❌ Flash message container not found!");
        return;
    }

    // Determine Bootstrap class based on message type
    const alertClass = type === "success" ? "alert-success" : "alert-danger";

    // Create a new alert message (without close button)
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `${message}`; // Removed close button

    // Clear previous messages and insert the new one
    flashContainer.innerHTML = "";
    flashContainer.appendChild(alertDiv);

    // Automatically fade out after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove("show"); // Start fade-out
        alertDiv.classList.add("fade"); // Apply Bootstrap fade effect

        // Remove alert from DOM after fade animation (0.5s)
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 3000);
}





async function saveDraft() {
    //Allows empty autocomplete options
    if (document.querySelector(".mapboxgl-ctrl-geocoder input").value.trim() === "") {
        console.log("⚠️ Empty location allowed. Setting location and geometry to blank.");
        document.getElementById("location").value = "";
        document.getElementById("geometry").value = "[]";
    } 
    //Variable locationSelected is declared in public/javascripts/new_ejs/mapBoxAutocomplete.js
    else if (!locationSelected) {
        updateFlashMessage("Please select a valid location from the dropdown before saving.", "error") // If not, make sure location is from one of the autocomplete options
        return; 
    }
    const formData = new FormData();

    const draftIdInput = document.querySelector('input[name="draftId"]');
    let draftId = draftIdInput ? draftIdInput.value.trim() : "";
    if (draftId) formData.append("draftId", draftId);
    ["originalTitle", "originalDescription", "location", "geometry", "fundingGoal", "currency", "deadline"].forEach(field => {
        formData.append(`project[${field}]`, document.getElementById(field).value);
    });
    //Function is from public/javascripts/new_ejs/categoriesAndKeywords.js
    formData.append("project[categories]", JSON.stringify(getSelectedCategoriesForSubmission()));

    const imageInput = document.getElementById("image");
    if (imageInput && imageInput.files.length > 0) {
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append("image", imageInput.files[i]);
        }
    }

    const deleteImages = document.querySelectorAll(
        'input[name="deleteImages[]"]:checked'
    );
    deleteImages.forEach((checkbox) => {
        formData.append("deleteImages[]", checkbox.value);
    });
    //Runs save-draft function in controllers/projects.js
    try {
        const response = await fetch("/projects/save-draft", {
            method: "POST",
            body: formData,
        });
        const data = await response.json(); // Parse JSON response
        
        // save-draft function in controllers/projects.js returns data.success (boolean), data.message, and draftId to be updated into frontend
        if (data.success) {
            updateFlashMessage(data.message, "success"); // ✅ Update flash message dynamically
            draftIdInput.value = data.draftId; // Update frontend
        } else {
            updateFlashMessage(data.message, "error");
        }
        
    } catch (error) {
        console.error("Error saving draft:", error);
        alert("Failed to save draft.");
    }
}

document.addEventListener("DOMContentLoaded", goToStep);

// Declare global functions
window.nextStep = nextStep;
window.previousStep = previousStep;
window.saveDraft = saveDraft;