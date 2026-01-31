/**
 * Helper to get a display name for a quote.
 * Treats "Untitled Quote" as equivalent to having no title,
 * allowing fallback to projectName or clientName.
 */
export const getQuoteDisplayName = (
  title: string | null | undefined,
  projectName: string | null | undefined,
  clientName?: string | null,
  fallback = 'Quote'
): string => {
  // Treat "Untitled Quote" as if there's no title
  const effectiveTitle = title && title !== 'Untitled Quote' ? title : null;
  return effectiveTitle || projectName || clientName || fallback;
};
