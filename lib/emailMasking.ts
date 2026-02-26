export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = localPart.length > 3 
    ? `${localPart.substring(0, 3)}***`
    : `${localPart.substring(0, 1)}***`;
  
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');
  
  const maskedDomain = domainName.length > 3
    ? `${domainName.substring(0, 3)}***.${tld}`
    : `${domainName.substring(0, 1)}***.${tld}`;
  
  return `${maskedLocal}@${maskedDomain}`;
}
