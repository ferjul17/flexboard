/**
 * Input sanitization utilities for user-generated content
 */

/**
 * Sanitize username input:
 * - Trim whitespace
 * - Remove non-alphanumeric characters except underscore and hyphen
 * - Prevent XSS attempts
 */
export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .replace(/[^\w\s-]/gi, '') // Allow alphanumeric, underscore, hyphen, and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .slice(0, 50); // Enforce max length
}

/**
 * Sanitize text input:
 * - Trim whitespace
 * - Remove control characters
 * - Escape HTML special characters to prevent XSS
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .slice(0, maxLength);
}

/**
 * Sanitize email to prevent header injection
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[\r\n]/g, ''); // Remove newlines to prevent header injection
}

/**
 * Remove leading/trailing whitespace from all string properties in an object
 */
export function trimObjectStrings<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = value.trim();
    } else {
      result[key] = value;
    }
  }
  return result;
}
