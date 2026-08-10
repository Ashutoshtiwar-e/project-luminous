/**
 * Safely decodes HTML entities, strips HTML tags, and normalizes whitespace
 * to convert raw backend text into clean, human-readable strings.
 */
export function cleanAndFormatText(input: string | undefined | null): string {
  if (!input) return '';

  // 1. Preserve paragraph breaks by replacing common tags with newlines
  let processed = input.replace(/<br\s*\/?>/gi, '\n');
  processed = processed.replace(/<\/p>\s*<p>/gi, '\n\n');
  processed = processed.replace(/<\/p>/gi, '\n\n');
  processed = processed.replace(/<p>/gi, '');
  
  // Remove script and style tags completely so their content doesn't end up in the text
  processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  processed = processed.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Safely decode HTML entities and strip remaining HTML tags using DOMParser
  // This executes NO scripts and does not load external resources.
  let text = processed;
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(processed, 'text/html');
    text = doc.body.textContent || '';
  } else {
    // Basic fallback for server-side if needed
    text = processed
      .replace(/&nbsp;/g, ' ')
      .replace(/&#xa0;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8217;/g, '’')
      .replace(/&#8220;/g, '“')
      .replace(/&#8221;/g, '”')
      .replace(/<[^>]+>/g, '');
  }

  // 3. Normalize whitespace
  // Replace non-breaking spaces and other invisible formatting characters with normal spaces
  text = text.replace(/[\u00A0\u200B\u200C\u200D\u2028\u2029]/g, ' ');
  
  // Collapse multiple spaces into one
  text = text.replace(/[ \t]+/g, ' ');

  // Collapse multiple empty lines into double newlines
  text = text.replace(/\n\s*\n\s*/g, '\n\n');
  
  // Fix cases where spaces are left at the beginning of a new line
  text = text.replace(/\n {1,}/g, '\n');

  return text.trim();
}
