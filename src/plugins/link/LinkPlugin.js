import { PluginInterface } from '../../core/PluginInterface.js';

/**
 * LinkPlugin
 * Accessible hyperlink insertion, editing, and security enforcement modal.
 */
export class LinkPlugin extends PluginInterface {
  init() {
    this.editor.commands.register('link', {
      execute: () => this.openLinkModal()
    });
  }

  openLinkModal() {
    const sel = window.getSelection();
    let initialText = '';
    let initialHref = '';

    if (sel && !sel.isCollapsed) {
      initialText = sel.toString();
      const parentLink = this.editor.findClosestAncestor(sel.anchorNode, 'a');
      if (parentLink) initialHref = parentLink.getAttribute('href') || '';
    }

    this.editor.modal.open({
      title: 'Insert or Edit Hyperlink',
      fields: [
        { name: 'url', label: 'Destination URL', type: 'text', value: initialHref, placeholder: 'https://example.com', required: true },
        { name: 'text', label: 'Anchor Display Text', type: 'text', value: initialText, placeholder: 'Read more...' },
        { name: 'target', label: 'Open in new tab (_blank)', type: 'checkbox', checked: true }
      ],
      onSubmit: (data) => {
        if (!data.url) return false;
        const text = data.text || data.url;
        const target = data.target ? ' target="_blank" rel="noopener noreferrer"' : '';
        const html = `<a href="${data.url}"${target}>${text}</a>`;
        this.editor.insertHTMLAtCursor(html);
        return true;
      }
    });
  }
}
