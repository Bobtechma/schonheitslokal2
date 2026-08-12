/**
 * SEO metadata helper to dynamically update browser head tags (title, description, canonical link, and hreflangs).
 * This ensures search engine crawlers like Google Search Console index all routes correctly with translations.
 */
export function updateMetaTags(
  title: string,
  description: string,
  path: string = '',
  language: 'de-CH' | 'pt-BR' = 'de-CH'
) {
  if (typeof window === 'undefined') return;

  // 1. Update Title
  document.title = title;

  // 2. Update Meta Description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);

  // 3. Update Canonical URL
  const baseUrl = 'https://schoenheitslokal.ch';
  const canonicalUrl = `${baseUrl}${path}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 4. Update Hreflang Tags (Multilingual Indexation for Switzerland - de-CH and pt-BR)
  const languages: { [key: string]: string } = {
    'de-CH': 'de',
    'pt-BR': 'pt'
  };

  // Remove existing hreflang tags to prevent duplicate crawler signals
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

  // Add updated hreflang alternates
  Object.keys(languages).forEach(langKey => {
    const hreflangLink = document.createElement('link');
    hreflangLink.setAttribute('rel', 'alternate');
    hreflangLink.setAttribute('hreflang', languages[langKey]);
    // Append proper query language parameter
    const queryChar = path.includes('?') ? '&' : '?';
    hreflangLink.setAttribute('href', `${baseUrl}${path}${queryChar}lang=${languages[langKey]}`);
    document.head.appendChild(hreflangLink);
  });

  // Add x-default hreflang for standard fallback (default to German)
  const defaultLink = document.createElement('link');
  defaultLink.setAttribute('rel', 'alternate');
  defaultLink.setAttribute('hreflang', 'x-default');
  defaultLink.setAttribute('href', `${baseUrl}${path}`);
  document.head.appendChild(defaultLink);

  // 5. Update HTML lang tag
  document.documentElement.setAttribute('lang', language === 'pt-BR' ? 'pt-BR' : 'de-CH');
}
