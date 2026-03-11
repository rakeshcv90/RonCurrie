/**
 * Decode HTML entities and strip special characters from text.
 * Shared utility used across Home, DisplayItems, and CategoryComponent.
 */
const decodeHtml = text => {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '')
    .replace(/&apos;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/["']/g, '')
    .replace(/[^a-zA-Z0-9\s.,-]/g, '')
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\s+/g, ' ') // clean extra spaces
    .replace(/<\/?[^>]+(>|$)/g, '')

    .trim();
};

export default decodeHtml;
