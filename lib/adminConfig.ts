/**
 * Admin Configuration
 * Defines admin users who have unrestricted access to both apps
 */

export const ADMIN_EMAILS = [
  "anishoonnittan@gmail.com",
  "complaintsaus@gmail.com",
];

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if a user is an admin (can access both consumer and business apps)
 */
export function isAdminUser(user: { email?: string | null }): boolean {
  return isAdminEmail(user.email);
}