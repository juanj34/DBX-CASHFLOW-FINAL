/**
 * Helper to get a display name for a quote.
 * Treats "Untitled Quote" as equivalent to having no title,
 * allowing fallback to projectName only (no client name in display).
 */
export const getQuoteDisplayName = (
  title: string | null | undefined,
  projectName: string | null | undefined,
  _clientName?: string | null, // Kept for backward compat but not used
  fallback = 'Quote'
): string => {
  // Treat "Untitled Quote" as if there's no title
  const effectiveTitle = title && title !== 'Untitled Quote' ? title : null;
  // Only use title or project name - never client name
  return effectiveTitle || projectName || fallback;
};
