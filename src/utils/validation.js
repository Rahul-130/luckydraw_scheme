export const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push("at least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("a lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("an uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("a number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("a special character (e.g., !@#$%)");
    }

    if (errors.length > 0) {
        return `Password must contain ${errors.join(', ')}.`;
    }
    return null;
};

export const PASSWORD_REQUIREMENTS = "Requires 8+ characters, uppercase, lowercase, number, and special character.";

export const validateEmail = (email) => {
    // A simple regex for email validation. For production, consider a more robust library if needed.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address.";
    }
    return null;
};
