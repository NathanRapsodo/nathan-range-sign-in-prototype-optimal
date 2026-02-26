/**
 * Get the base path for the application
 * In production with GitHub Pages, this will be the repository name
 */
export function getBasePath(): string {
  // Use the environment variable set in next.config.js
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Get the full path with basePath prepended
 */
export function getFullPath(path: string): string {
  const basePath = getBasePath();
  if (!basePath) return path;
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
