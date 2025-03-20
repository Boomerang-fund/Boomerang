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


// ✅ Prepare form data dynamically
function prepareFormData() {
    const formData = new FormData();

    const draftIdInput = document.querySelector('input[name="draftId"]');
    if (draftIdInput?.value.trim()) {
        formData.append("draftId", draftIdInput.value.trim());
    }

    // Fields to append
    const fields = ["originalTitle", "originalDescription", "location", "geometry", "fundingGoal", "currency", "deadline"];
    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input) formData.append(`project[${field}]`, input.value);
    });

    // Retrieve selected categories & keywords
    formData.append("project[categories]", JSON.stringify(getSelectedCategoriesForSubmission()));

    // Attach images
    const imageInput = document.getElementById("image");
    if (imageInput && imageInput.files.length > 0) {
        [...imageInput.files].forEach(file => formData.append("image", file));
    }

    // Handle deleted images
    document.querySelectorAll('input[name="deleteImages[]"]:checked')
        .forEach(checkbox => formData.append("deleteImages[]", checkbox.value));

    return formData;
}

// ✅ Validate form before submission
function isFormValid() {
    const requiredFields = ["originalTitle", "originalDescription", "location", "geometry", "fundingGoal", "currency", "deadline"];

    // Check for empty required fields
    const isEmptyField = requiredFields.some(field => {
        const input = document.getElementById(field);
        return !input || !input.value.trim() || (["fundingGoal", "deadline"].includes(field) && Number(input.value) <= 0);
    });

    // Ensure at least one category is selected
    const hasCategories = document.querySelector("#categories-container input[type='checkbox']:checked");

    return !isEmptyField && hasCategories;
}

// ✅ Submit form data (Handles both drafts & project creation)
async function submitProject(isDraft = false) {
    // If publishing, validate form
    if (!isDraft && !isFormValid()) {
        updateFlashMessage("Please fill in everything before creating a project.", "error");
        return;
    }

    const formData = prepareFormData();
    const endpoint = isDraft ? "/projects/save-draft" : "/projects/create-project";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            

            if (isDraft) {
                // Update draft ID in form to persist changes
                updateFlashMessage(data.message, "success");
                document.querySelector('input[name="draftId"]').value = data.draftId;
            } else {
                // Redirect to project page after creation
                window.location.href = data.redirectUrl;
            }
        } else {
            updateFlashMessage(data.message, "error");
        }
    } catch (error) {
        console.error(`Error ${isDraft ? "saving draft" : "creating project"}:`, error);
        alert(`Failed to ${isDraft ? "save draft" : "create project"}.`);
    }
}

// ✅ Handlers for saving draft & creating project
function saveDraft() {
    // Allow empty autocomplete options
    const locationInput = document.querySelector(".mapboxgl-ctrl-geocoder input");
    if (locationInput?.value.trim() === "") {
        document.getElementById("location").value = "";
        document.getElementById("geometry").value = "[]";
    } 
    // Ensure a valid location is selected
    else if (!locationSelected) {
        updateFlashMessage("Please select a valid location from the dropdown before saving.", "error");
        return;
    }

    submitProject(true); //isDraft = true
}

function createProject() {
    submitProject(false); // isDraft = false
}

document.addEventListener("DOMContentLoaded", goToStep);

// Declare global functions
window.nextStep = nextStep;
window.previousStep = previousStep;
window.saveDraft = saveDraft;