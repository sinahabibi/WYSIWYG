/**
 * DOMSanitizer
 * Enterprise-grade HTML security & content cleaner.
 * Strips XSS vectors, cleans proprietary Microsoft Word and Google Docs markup,
 * enforces strict tag and attribute whitelists, and normalizes semantic formatting.
 */
export class DOMSanitizer {
  constructor(sanitizationConfig = {}) {
    this.config = {
      stripInlineStyles: sanitizationConfig.stripInlineStyles ?? true,
      disallowTags: new Set(sanitizationConfig.disallowTags || ['h1', 'script', 'style', 'iframe', 'object', 'form']),
      approvedTags: new Set(sanitizationConfig.approvedTags || [
        'h2', 'h3', 'h4', 'p', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'figure', 'figcaption', 'img', 'a', 'hr', 'br'
      ]),
      whitelistAttributes: sanitizationConfig.whitelistAttributes || {
        img: ['src', 'alt', 'title', 'loading', 'width', 'height', 'data-align'],
        a: ['href', 'target', 'rel', 'title'],
        figure: ['class', 'data-align'],
        figcaption: ['contenteditable'],
        td: ['colspan', 'rowspan', 'data-align'],
        th: ['colspan', 'rowspan', 'data-align'],
        p: ['data-align'],
        h2: ['data-align'],
        h3: ['data-align'],
        h4: ['data-align']
      }
    };
  }

  /**
   * Cleans incoming clipboard payload (HTML & RTF)
   * @param {string} htmlPayload
   * @param {string} [rtfPayload='']
   * @returns {string} Clean, safe HTML
   */
  cleanPastePayload(htmlPayload, rtfPayload = '') {
    if (!htmlPayload) return '';

    let cleaned = htmlPayload;

    // Detect and strip Office conditional comments and XML namespace artifacts
    cleaned = cleaned.replace(/<!--\[if[\s\S]*?\]>[\s\S]*?<!\[endif\]-->/gi, '');
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    cleaned = cleaned.replace(/<xml[\s\S]*?<\/xml>/gi, '');
    cleaned = cleaned.replace(/<o:p[\s\S]*?<\/o:p>/gi, '');
    cleaned = cleaned.replace(/<\/?\w+:[^>]*>/gi, ''); // XML tags like <o:p>, <w:WordDocument>

    // Remove Google Docs internal wrapper tags and meta comments
    cleaned = cleaned.replace(/<b\s+style="font-weight:\s*normal;"\s*id="docs-internal-guid-[^"]*">([\s\S]*?)<\/b>/gi, '$1');
    cleaned = cleaned.replace(/<meta\s+charset='utf-8'>/gi, '');

    // Parse into detached DOM for deep structural cleaning
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');
    const root = doc.body;

    this._sanitizeDOMTree(root);

    return root.innerHTML;
  }

  /**
   * Recursively traverses and sanitizes the DOM tree
   * @param {Node} node
   */
  _sanitizeDOMTree(node) {
    const children = Array.from(node.childNodes);

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName.toLowerCase();

        // 1. Remove blacklisted tags
        if (this.config.disallowTags.has(tagName)) {
          // If it's h1, downscale to h2 rather than deleting content
          if (tagName === 'h1') {
            const h2 = document.createElement('h2');
            while (child.firstChild) h2.appendChild(child.firstChild);
            node.replaceChild(h2, child);
            this._sanitizeDOMTree(h2);
            continue;
          } else {
            child.remove();
            continue;
          }
        }

        // 2. Unwrap non-approved structural wrappers (e.g. font, center, section)
        if (!this.config.approvedTags.has(tagName)) {
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          child.remove();
          continue;
        }

        // 3. Clean Office MsoNormal and redundant CSS classes
        if (child.hasAttribute('class')) {
          const classes = child.getAttribute('class').split(/\s+/).filter(cls => {
            return !cls.toLowerCase().startsWith('mso') && !cls.includes('Normal') && !cls.includes('docs-');
          });
          if (classes.length > 0) {
            child.setAttribute('class', classes.join(' '));
          } else {
            child.removeAttribute('class');
          }
        }

        // 4. Strip inline styles if configured, or normalize text alignment
        if (child.hasAttribute('style')) {
          if (this.config.stripInlineStyles) {
            const style = child.style;
            const textAlign = style.textAlign;
            child.removeAttribute('style');
            if (textAlign && ['left', 'center', 'right', 'justify'].includes(textAlign)) {
              child.setAttribute('data-align', textAlign);
            }
          }
        }

        // 5. Enforce Whitelist Attributes
        const allowedAttrs = this.config.whitelistAttributes[tagName] || [];
        for (const attr of Array.from(child.attributes)) {
          if (!allowedAttrs.includes(attr.name)) {
            child.removeAttribute(attr.name);
          }
        }

        // 6. Security: Sanitize links against javascript: URIs
        if (tagName === 'a' && child.hasAttribute('href')) {
          const href = child.getAttribute('href').trim();
          if (/^javascript:/i.test(href)) {
            child.removeAttribute('href');
          } else {
            // Automatically set secure attributes on external links
            if (/^https?:\/\//i.test(href)) {
              child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            }
          }
        }

        // Recursively sanitize descendants
        this._sanitizeDOMTree(child);
      }
    }
  }

  /**
   * Sanitizes an element and returns its safe HTML string
   * @param {HTMLElement} element
   * @returns {string}
   */
  getCleanHTML(element) {
    const clone = element.cloneNode(true);
    this._sanitizeDOMTree(clone);
    return clone.innerHTML.trim();
  }
}
