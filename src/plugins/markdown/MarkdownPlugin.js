import { PluginInterface } from '../../core/PluginInterface.js';

/**
 * MarkdownPlugin
 * Real-time Markdown shortcuts (e.g. typing '# ', '> ', '- ') while typing,
 * plus bidirectional HTML <-> Markdown conversion utilities.
 */
export class MarkdownPlugin extends PluginInterface {
  init() {
    this._attachMarkdownShortcuts();
    this.editor.commands.register('exportMarkdown', {
      execute: () => this.exportMarkdownFile()
    });
  }

  _attachMarkdownShortcuts() {
    this.editor.body.addEventListener('keyup', (e) => {
      if (e.key !== ' ' && e.key !== 'Spacebar') return;

      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) return;

      const block = this.editor.getCurrentBlock();
      if (!block) return;

      const text = block.textContent || '';
      
      // Match markdown triggers at the beginning of the block
      if (text.startsWith('# ')) {
        this._convertBlock(block, 'h2', text.slice(2));
      } else if (text.startsWith('## ')) {
        this._convertBlock(block, 'h3', text.slice(3));
      } else if (text.startsWith('### ')) {
        this._convertBlock(block, 'h4', text.slice(4));
      } else if (text.startsWith('> ')) {
        this._convertBlock(block, 'blockquote', text.slice(2));
      } else if (text.startsWith('- ') || text.startsWith('* ')) {
        block.textContent = text.slice(2);
        document.execCommand('insertUnorderedList', false, null);
      } else if (/^\d+\.\s/.test(text)) {
        const match = text.match(/^\d+\.\s/)[0];
        block.textContent = text.slice(match.length);
        document.execCommand('insertOrderedList', false, null);
      }
    });
  }

  _convertBlock(oldBlock, newTag, cleanText) {
    const newEl = document.createElement(newTag);
    newEl.textContent = cleanText || '';
    oldBlock.parentNode.replaceChild(newEl, oldBlock);

    // Place cursor at the end of the new element
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(newEl);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    this.editor.history.recordImmediateSnapshot();
    this.editor.events.emit('change');
  }

  /**
   * Converts current editor content to clean Markdown syntax
   * @returns {string}
   */
  getMarkdown() {
    const html = this.editor.getCleanHTML();
    const div = document.createElement('div');
    div.innerHTML = html;

    let md = '';
    for (const node of div.childNodes) {
      md += this._nodeToMarkdown(node) + '\n\n';
    }
    return md.trim();
  }

  _nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    const content = Array.from(node.childNodes).map(c => this._nodeToMarkdown(c)).join('');

    switch (tag) {
      case 'h2': return `## ${content}`;
      case 'h3': return `### ${content}`;
      case 'h4': return `#### ${content}`;
      case 'p': return content;
      case 'strong':
      case 'b': return `**${content}**`;
      case 'em':
      case 'i': return `*${content}*`;
      case 'code': return `\`${content}\``;
      case 'blockquote': return `> ${content}`;
      case 'ul':
        return Array.from(node.children).map(li => `- ${this._nodeToMarkdown(li)}`).join('\n');
      case 'ol':
        return Array.from(node.children).map((li, idx) => `${idx + 1}. ${this._nodeToMarkdown(li)}`).join('\n');
      case 'li': return content;
      case 'a':
        return `[${content}](${node.getAttribute('href') || ''})`;
      case 'img':
        return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
      case 'figure':
        const img = node.querySelector('img');
        const cap = node.querySelector('figcaption');
        if (img) {
          const alt = cap ? cap.textContent : img.getAttribute('alt') || '';
          return `![${alt}](${img.getAttribute('src') || ''})`;
        }
        return content;
      default:
        return content;
    }
  }

  exportMarkdownFile() {
    const md = this.getMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
