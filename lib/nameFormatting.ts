/**
 * Formats a name as "First name + first letter of last name"
 * Examples:
 * - "John Doe" -> "John D"
 * - "Nathan" -> "Nathan" (single name, return as is)
 * - "Mary Jane Watson" -> "Mary W" (first name + first letter of last word)
 */
export function formatDisplayName(name: string): string {
  if (!name || !name.trim()) {
    return name;
  }

  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);

  // If only one part, return as is
  if (parts.length === 1) {
    return trimmed;
  }

  // First name + first letter of last name
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}`;
}

/**
 * Formats firstName and lastName as "First name + first letter of last name"
 */
export function formatDisplayNameFromParts(firstName: string, lastName: string): string {
  const firstNameTrimmed = firstName.trim();
  const lastNameTrimmed = lastName.trim();

  if (!firstNameTrimmed) {
    return lastNameTrimmed || '';
  }

  if (!lastNameTrimmed) {
    return firstNameTrimmed;
  }

  const lastInitial = lastNameTrimmed.charAt(0).toUpperCase();
  return `${firstNameTrimmed} ${lastInitial}`;
}
