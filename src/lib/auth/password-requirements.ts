/**
 * Password requirements configuration
 * 
 * IMPORTANT: Keep these settings in sync with your Supabase Dashboard settings:
 * Dashboard > Authentication > Policies > Password Requirements
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8, // Minimum password length
  requireLowercase: true, // Require at least one lowercase letter (a-z)
  requireUppercase: true, // Require at least one uppercase letter (A-Z)
  requireNumbers: true, // Require at least one number (0-9)
  requireSpecialChars: true, // Require at least one special character
} as const;

/**
 * Validates a password against the configured requirements
 * @param password - The password to validate
 * @returns An error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length === 0) return null;
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`;
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter (a-z)";
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter (A-Z)";
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    return "Password must contain at least one number (0-9)";
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return "Password must contain at least one special character (!@#$%^&*...)";
  }

  return null;
}

/**
 * Generates a human-readable description of password requirements
 */
export function getPasswordRequirementsText(): string {
  const requirements: string[] = [];
  
  requirements.push(`${PASSWORD_REQUIREMENTS.minLength}+ characters`);
  
  if (PASSWORD_REQUIREMENTS.requireUppercase) requirements.push("uppercase");
  if (PASSWORD_REQUIREMENTS.requireLowercase) requirements.push("lowercase");
  if (PASSWORD_REQUIREMENTS.requireNumbers) requirements.push("number");
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) requirements.push("special character");
  
  return `Must be at least ${requirements.join(", ")}`;
}