/**
 * Contrast Checker Utility
 * 
 * Development tool for detecting text/background contrast issues.
 * Based on WCAG 2.1 contrast ratio calculations.
 */

// Known problematic class patterns on dark backgrounds
export const FORBIDDEN_ON_DARK = [
  'text-gray-500',
  'text-gray-600', 
  'text-gray-700',
  'text-gray-800',
  'text-gray-900',
];

// Known problematic class patterns on light backgrounds
export const FORBIDDEN_ON_LIGHT = [
  'text-gray-100',
  'text-gray-200',
  'text-gray-300',
  'text-gray-400',
];

// Dark background indicators
export const DARK_BG_CLASSES = [
  'bg-[#0f172a]',
  'bg-[#1a1f2e]',
  'bg-[#1e293b]',
  'bg-theme-bg',
  'bg-theme-card',
  'bg-slate-900',
  'bg-slate-800',
  'bg-gray-900',
  'bg-gray-800',
  'dark',
];

// Light background indicators  
export const LIGHT_BG_CLASSES = [
  'bg-white',
  'bg-gray-50',
  'bg-gray-100',
  'bg-slate-50',
  'bg-theme-consultant',
];

export interface ContrastViolation {
  element: Element;
  textClass: string;
  backgroundContext: string;
  severity: 'error' | 'warning';
  recommendation: string;
}

/**
 * Check if an element or its ancestors have dark background classes
 */
export function hasAncestorWithClass(element: Element | null, classes: string[]): boolean {
  while (element) {
    const classList = element.className;
    if (typeof classList === 'string') {
      for (const cls of classes) {
        if (classList.includes(cls)) {
          return true;
        }
      }
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * Scan the DOM for potential contrast violations
 */
export function scanForContrastViolations(): ContrastViolation[] {
  const violations: ContrastViolation[] = [];
  
  // Get all elements in the document
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const classList = element.className;
    if (typeof classList !== 'string') return;
    
    // Check for forbidden classes on dark backgrounds
    for (const forbiddenClass of FORBIDDEN_ON_DARK) {
      if (classList.includes(forbiddenClass)) {
        // Check if this element is within a dark background context
        if (hasAncestorWithClass(element, DARK_BG_CLASSES)) {
          violations.push({
            element,
            textClass: forbiddenClass,
            backgroundContext: 'dark',
            severity: 'error',
            recommendation: `Replace "${forbiddenClass}" with "text-theme-text-muted" or "text-gray-400" minimum`,
          });
        }
      }
    }
    
    // Check for forbidden classes on light backgrounds
    for (const forbiddenClass of FORBIDDEN_ON_LIGHT) {
      if (classList.includes(forbiddenClass)) {
        // Check if this element is within a light background context
        if (hasAncestorWithClass(element, LIGHT_BG_CLASSES)) {
          violations.push({
            element,
            textClass: forbiddenClass,
            backgroundContext: 'light',
            severity: 'warning',
            recommendation: `Replace "${forbiddenClass}" with "text-theme-text-muted" or "text-gray-500" minimum`,
          });
        }
      }
    }
  });
  
  return violations;
}

/**
 * Log violations to console in a readable format
 */
export function logViolations(violations: ContrastViolation[]): void {
  if (violations.length === 0) {
    console.log('✅ No contrast violations detected');
    return;
  }
  
  console.group(`⚠️ ${violations.length} contrast violation(s) detected`);
  
  violations.forEach((violation, index) => {
    const style = violation.severity === 'error' 
      ? 'color: #ff6b6b; font-weight: bold;'
      : 'color: #ffd93d; font-weight: bold;';
    
    console.groupCollapsed(
      `%c${violation.severity.toUpperCase()}: ${violation.textClass} on ${violation.backgroundContext} background`,
      style
    );
    console.log('Element:', violation.element);
    console.log('Text content:', violation.element.textContent?.slice(0, 50));
    console.log('Recommendation:', violation.recommendation);
    console.groupEnd();
  });
  
  console.groupEnd();
}
