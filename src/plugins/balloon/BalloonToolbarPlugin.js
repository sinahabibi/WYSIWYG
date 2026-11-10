import { PluginInterface } from '../../core/PluginInterface.js';
import { SVG_ICONS } from '../../ui/icons.js';

/**
 * BalloonToolbarPlugin
 * Medium/Notion style contextual floating selection balloon.
 * Appears dynamically above user text selection.
 */
export class BalloonToolbarPlugin extends PluginInterface {
  constructor(editor) {
    super(editor);
    this.balloonEl = null;
  }

  init() {
    if (!this.editor.config.balloon?.enabled) return;
    this._createBalloon();
    this._attachSelectionListeners();
  }

  _createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'wysiwyg-floating-balloon';

    const items = this.editor.config.balloon?.items || ['bold', 'italic', 'underline', 'link'];
    items.forEach(item => {
      if (item === '|') {
        const sep = document.createElement('div');
        sep.className = 'wysiwyg-toolbar-separator';
        balloon.appendChild(sep);
      } else {
        const btn = document.createElement('button');
        btn.className = 'wysiwyg-btn';
        btn.dataset.command = item;
        btn.title = item;
        btn.innerHTML = SVG_ICONS[item] || item;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.editor.execute(item);
        });
        balloon.appendChild(btn);
      }
    });

    document.body.appendChild(balloon);
    this.balloonEl = balloon;
  }

  _attachSelectionListeners() {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        this.hide();
        return;
      }

      const range = sel.getRangeAt(0);
      if (!this.editor.body.contains(range.commonAncestorContainer)) {
        this.hide();
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0) {
        this.hide();
        return;
      }

      this.show(rect);
    };

    document.addEventListener('selectionchange', () => {
      setTimeout(handleSelection, 20);
    });
  }

  show(rect) {
    if (!this.balloonEl) return;
    const bar = this.balloonEl;
    bar.classList.add('visible');

    const top = window.scrollY + rect.top - bar.offsetHeight - 10;
    const left = window.scrollX + rect.left + (rect.width / 2) - (bar.offsetWidth / 2);

    bar.style.top = `${Math.max(10, top)}px`;
    bar.style.left = `${Math.max(10, left)}px`;
  }

  hide() {
    if (this.balloonEl) this.balloonEl.classList.remove('visible');
  }

  destroy() {
    if (this.balloonEl) this.balloonEl.remove();
  }
}
