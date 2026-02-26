/**
 * Helper to determine if the current route is a "Play" page
 * (i.e., any active game mode / in-play screen)
 */
export function isPlayRoute(pathname: string): boolean {
  // Currently, /play is the only play page
  // In the future, this could include /range, /target-range, /course, /ctp, etc.
  return pathname === '/play';
}
