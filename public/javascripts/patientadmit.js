document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("close-popup");

    // Show the popup if it exists
    if (popup) {
        popup.style.display = "block";

        // Close popup on button click
        closePopup.addEventListener("click", function () {
            popup.style.display = "none";
        });

        // Automatically close popup after 5 seconds
        setTimeout(() => {
            popup.style.display = "none";
        }, 5000);
    }
});

function backtoadmin(){
    window.location.href = "/admin";
}
document.querySelector('form').addEventListener('submit', (e) => {
    // Get all field values
    const contactNumber = document.getElementById('contact_number').value.trim();
    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstname').value.trim();
    const lastName = document.getElementById('lastname').value.trim();
    const dob = document.getElementById('dob').value.trim();
    const reasonForAdmission = document.getElementById('reason_for_admission').value.trim();

    let isValid = true;

    // Validation for Contact Number
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(contactNumber)) {
        displayError('contact_number', 'Contact number must be exactly 10 digits.');
        isValid = false;
    } else {
        clearError('contact_number');
    }

    // Validation for Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        displayError('email', 'Please enter a valid email address.');
        isValid = false;
    } else {
        clearError('email');
    }

    // Validation for First Name
    if (firstName.length < 2 || firstName.length > 50) {
        displayError('firstname', 'First name must be between 2 and 50 characters.');
        isValid = false;
    } else {
        clearError('firstname');
    }

    // Validation for Last Name
    if (lastName.length < 2 || lastName.length > 50) {
        displayError('lastname', 'Last name must be between 2 and 50 characters.');
        isValid = false;
    } else {
        clearError('lastname');
    }

    // Validation for Date of Birth (Optional: Ensure it's not blank)
    if (!dob) {
        displayError('dob', 'Date of birth cannot be blank.');
        isValid = false;
    } else {
        clearError('dob');
    }

    // Validation for Reason for Admission (Optional: Ensure it's not blank)
    if (!reasonForAdmission) {
        displayError('reason_for_admission', 'Reason for admission cannot be blank.');
        isValid = false;
    } else {
        clearError('reason_for_admission');
    }

    // Prevent form submission if any validation fails
    if (!isValid) {
        e.preventDefault();
    }
});

// Helper function to display error messages
function displayError(inputId, message) {
    let errorElement = document.getElementById(`error-${inputId}`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `error-${inputId}`;
        errorElement.className = 'error-message';
        const inputField = document.getElementById(inputId);
        inputField.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

// Helper function to clear error messages
function clearError(inputId) {
    const errorElement = document.getElementById(`error-${inputId}`);
    if (errorElement) {
        errorElement.remove();
    }
}
