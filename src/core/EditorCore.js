import { EventEmitter } from './EventEmitter.js';
import { CommandManager } from './CommandManager.js';
import { HistoryManager } from './HistoryManager.js';
import { DOMSanitizer } from '../sanitization/DOMSanitizer.js';
import { ModalManager } from '../ui/ModalManager.js';
import { SVG_ICONS } from '../ui/icons.js';
import { ImagePlugin } from '../plugins/image/ImagePlugin.js';
import { TablePlugin } from '../plugins/table/TablePlugin.js';
import { BalloonToolbarPlugin } from '../plugins/balloon/BalloonToolbarPlugin.js';
import { LinkPlugin } from '../plugins/link/LinkPlugin.js';
import { MediaEmbedPlugin } from '../plugins/media/MediaEmbedPlugin.js';
import { MetricsPlugin } from '../plugins/metrics/MetricsPlugin.js';
import { AIPlugin } from '../plugins/ai/AIPlugin.js';
import { MarkdownPlugin } from '../plugins/markdown/MarkdownPlugin.js';

/**
 * EditorCore
 * Main orchestrator for WYSIWYG Enterprise Editor.
 * Manages life-cycle, DOM canvas, toolbar actions, plugins, event bus, and history.
 */
export class EditorCore {
  /**
   * @param {HTMLElement|string} targetElement
   * @param {Object} [userConfig={}]
   */
  constructor(targetElement, userConfig = {}) {
    this.container = typeof targetElement === 'string' ? document.querySelector(targetElement) : targetElement;
    if (!this.container) throw new Error('[WYSIWYG] Target container element not found.');

    this.config = this._mergeConfig(userConfig);
    this.events = new EventEmitter();
    this.isReadOnly = !!this.config.core?.readOnly;
    this.isSourceMode = false;

    // Subsystems
    this.sanitizer = new DOMSanitizer(this.config.sanitization);
    this.commands = new CommandManager(this);
    this.modal = new ModalManager(this);
    this.plugins = new Map();

    this._initDOM();
    this.history = new HistoryManager(this);
    this._initPlugins();
    this._attachCoreListeners();

    this.history.init();
    this.updateToolbarState();
  }

  _mergeConfig(overrides) {
    const defaults = {
      core: { language: 'ltr', placeholder: 'Write your story...', readOnly: false, autoSaveIntervalMs: 8000 },
      toolbar: {
        mode: 'docked',
        sticky: true,
        items: [
          'heading', '|', 'bold', 'italic', 'underline', 'strikethrough', 'code', '|',
          'alignment', '|', 'bulletList', 'numberList', 'blockquote', '|',
          'link', 'insertTable', 'imageManager', 'mediaEmbed', '|',
          'ai', 'markdown', '|',
          'cleanFormat', 'undo', 'redo', '|', 'sourceView', 'exportHtml'
        ]
      },
      balloon: { enabled: true, items: ['bold', 'italic', 'underline', 'heading', 'link', 'cleanFormat'] },
      image: { uploadStrategy: 'base64', features: { allowDragDrop: true, allowClipboardPaste: true, enableResizing: true, figureCaption: true } },
      sanitization: { stripInlineStyles: true },
      ui: { theme: 'light', showWordCounter: true, showReadingTime: true, readingSpeedWpm: 200 }
    };

    return {
      core: { ...defaults.core, ...overrides.core },
      toolbar: { ...defaults.toolbar, ...overrides.toolbar },
      balloon: { ...defaults.balloon, ...overrides.balloon },
      image: { ...defaults.image, ...overrides.image },
      sanitization: { ...defaults.sanitization, ...overrides.sanitization },
      ui: { ...defaults.ui, ...overrides.ui },
      ai: { ...overrides.ai }
    };
  }

  _initDOM() {
    this.container.classList.add('wysiwyg-container');
    this.container.setAttribute('dir', this.config.core?.language === 'rtl' ? 'rtl' : 'ltr');
    this.container.setAttribute('data-theme', this.config.ui?.theme || 'light');

    // Build Toolbar
    this.toolbarEl = document.createElement('div');
    this.toolbarEl.className = `wysiwyg-toolbar ${this.config.toolbar?.sticky ? 'wysiwyg-toolbar-sticky' : ''}`;
    this._buildToolbarItems();
    this.container.appendChild(this.toolbarEl);

    // Build Editable Canvas
    this.body = document.createElement('div');
    this.body.className = 'wysiwyg-body';
    this.body.contentEditable = !this.isReadOnly;
    this.body.setAttribute('data-placeholder', this.config.core?.placeholder || '');
    this.body.setAttribute('spellcheck', 'true');
    this.body.style.minHeight = this.config.ui?.minHeight || '380px';
    this.container.appendChild(this.body);

    // Build Source View Textarea
    this.sourceViewEl = document.createElement('textarea');
    this.sourceViewEl.className = 'wysiwyg-source-view';
    this.container.appendChild(this.sourceViewEl);
  }

  _buildToolbarItems() {
    const items = this.config.toolbar?.items || [];
    this.toolbarEl.innerHTML = '';

    items.forEach(token => {
      if (token === '|') {
        const sep = document.createElement('div');
        sep.className = 'wysiwyg-toolbar-separator';
        this.toolbarEl.appendChild(sep);
      } else if (token === 'heading') {
        this.toolbarEl.appendChild(this._createHeadingDropdown());
      } else if (token === 'alignment') {
        this.toolbarEl.appendChild(this._createAlignmentDropdown());
      } else if (token === 'fontColor' || token === 'highlight') {
        this.toolbarEl.appendChild(this._createColorDropdown(token));
      } else if (token === 'insertTable') {
        this.toolbarEl.appendChild(this._createTableGridDropdown());
      } else {
        const btn = document.createElement('button');
        btn.className = 'wysiwyg-btn';
        btn.dataset.command = token;
        btn.title = token.charAt(0).toUpperCase() + token.slice(1);
        btn.innerHTML = SVG_ICONS[token] || token;

        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this._handleToolbarAction(token);
        });

        this.toolbarEl.appendChild(btn);
      }
    });
  }

  _createHeadingDropdown() {
    const wrap = document.createElement('div');
    wrap.className = 'wysiwyg-dropdown';
    wrap.innerHTML = `
      <button class="wysiwyg-btn wysiwyg-dropdown-trigger" type="button">
        <span class="wysiwyg-label">Normal text</span>
        <span class="wysiwyg-caret">${SVG_ICONS.caret}</span>
      </button>
      <div class="wysiwyg-dropdown-menu">
        <button class="wysiwyg-dropdown-item" data-value="p"><span style="font-size:14px;">Paragraph</span></button>
        <button class="wysiwyg-dropdown-item" data-value="h2"><span style="font-size:18px;font-weight:700;">Heading 2</span></button>
        <button class="wysiwyg-dropdown-item" data-value="h3"><span style="font-size:16px;font-weight:600;">Heading 3</span></button>
        <button class="wysiwyg-dropdown-item" data-value="h4"><span style="font-size:14px;font-weight:600;">Heading 4</span></button>
      </div>
    `;

    const trigger = wrap.querySelector('.wysiwyg-dropdown-trigger');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeAllDropdowns(wrap);
      wrap.classList.toggle('open');
    });

    wrap.querySelectorAll('.wysiwyg-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.value;
        this.execute('heading', val);
        wrap.classList.remove('open');
      });
    });

    return wrap;
  }

  _createAlignmentDropdown() {
    const wrap = document.createElement('div');
    wrap.className = 'wysiwyg-dropdown';
    wrap.innerHTML = `
      <button class="wysiwyg-btn wysiwyg-dropdown-trigger" type="button">
        ${SVG_ICONS.alignLeft}
        <span class="wysiwyg-caret">${SVG_ICONS.caret}</span>
      </button>
      <div class="wysiwyg-dropdown-menu">
        <button class="wysiwyg-dropdown-item" data-align="left">${SVG_ICONS.alignLeft} Left</button>
        <button class="wysiwyg-dropdown-item" data-align="center">${SVG_ICONS.alignCenter} Center</button>
        <button class="wysiwyg-dropdown-item" data-align="right">${SVG_ICONS.alignRight} Right</button>
        <button class="wysiwyg-dropdown-item" data-align="justify">${SVG_ICONS.alignJustify} Justify</button>
      </div>
    `;

    wrap.querySelector('.wysiwyg-dropdown-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeAllDropdowns(wrap);
      wrap.classList.toggle('open');
    });

    wrap.querySelectorAll('.wysiwyg-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        this.execute('alignment', item.dataset.align);
        wrap.classList.remove('open');
      });
    });

    return wrap;
  }

  _createColorDropdown(type) {
    const wrap = document.createElement('div');
    wrap.className = 'wysiwyg-dropdown';
    const colors = ['#000000', '#475569', '#ef4444', '#f97316', '#facc15', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#e2e8f0'];

    let swatches = '';
    colors.forEach(c => {
      swatches += `<div class="wysiwyg-color-swatch" style="background:${c};" data-color="${c}"></div>`;
    });

    wrap.innerHTML = `
      <button class="wysiwyg-btn wysiwyg-dropdown-trigger" type="button" title="${type === 'fontColor' ? 'Text Color' : 'Highlight Color'}">
        ${SVG_ICONS[type]}
        <span class="wysiwyg-caret">${SVG_ICONS.caret}</span>
      </button>
      <div class="wysiwyg-dropdown-menu">
        <div class="wysiwyg-color-palette">${swatches}</div>
      </div>
    `;

    wrap.querySelector('.wysiwyg-dropdown-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeAllDropdowns(wrap);
      wrap.classList.toggle('open');
    });

    wrap.querySelectorAll('.wysiwyg-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this.execute(type, swatch.dataset.color);
        wrap.classList.remove('open');
      });
    });

    return wrap;
  }

  _createTableGridDropdown() {
    const wrap = document.createElement('div');
    wrap.className = 'wysiwyg-dropdown';

    let cellsHtml = '';
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 10; c++) {
        cellsHtml += `<div class="wysiwyg-table-grid-cell" data-row="${r}" data-col="${c}"></div>`;
      }
    }

    wrap.innerHTML = `
      <button class="wysiwyg-btn wysiwyg-dropdown-trigger" type="button" title="Insert Table">
        ${SVG_ICONS.insertTable}
        <span class="wysiwyg-caret">${SVG_ICONS.caret}</span>
      </button>
      <div class="wysiwyg-dropdown-menu">
        <div class="wysiwyg-table-grid-picker">
          <div class="wysiwyg-table-grid-title" id="gridTitle">Insert Table (1x1)</div>
          <div class="wysiwyg-table-grid-matrix">${cellsHtml}</div>
        </div>
      </div>
    `;

    const title = wrap.querySelector('#gridTitle');
    const cells = wrap.querySelectorAll('.wysiwyg-table-grid-cell');

    wrap.querySelector('.wysiwyg-dropdown-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeAllDropdowns(wrap);
      wrap.classList.toggle('open');
    });

    cells.forEach(cell => {
      cell.addEventListener('pointerenter', () => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        title.textContent = `Insert Table (${r}x${c})`;
        cells.forEach(item => {
          const ir = parseInt(item.dataset.row);
          const ic = parseInt(item.dataset.col);
          if (ir <= r && ic <= c) {
            item.classList.add('highlighted');
          } else {
            item.classList.remove('highlighted');
          }
        });
      });

      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const tablePlugin = this.plugins.get('table');
        if (tablePlugin) tablePlugin.createTable(r, c);
        wrap.classList.remove('open');
      });
    });

    return wrap;
  }

  _closeAllDropdowns(except) {
    this.container.querySelectorAll('.wysiwyg-dropdown').forEach(d => {
      if (d !== except) d.classList.remove('open');
    });
  }

  _handleToolbarAction(token) {
    if (token === 'imageManager') {
      const imgPlugin = this.plugins.get('image');
      if (imgPlugin) {
        if (imgPlugin.config.uploadStrategy === 'customUrl') {
          imgPlugin.openCustomUrlModal();
        } else {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) imgPlugin.uploadImage(file);
          };
          input.click();
        }
      }
    } else if (token === 'ai') {
      const aiPlugin = this.plugins.get('ai');
      if (aiPlugin) aiPlugin.openAIModal();
    } else if (token === 'markdown') {
      const mdPlugin = this.plugins.get('markdown');
      if (mdPlugin) mdPlugin.exportMarkdownFile();
    } else if (token === 'sourceView') {
      this.toggleSourceView();
    } else if (token === 'exportHtml') {
      this.exportHTMLDownload();
    } else {
      this.execute(token);
    }
  }

  _initPlugins() {
    this.plugins.set('image', new ImagePlugin(this));
    this.plugins.set('table', new TablePlugin(this));
    this.plugins.set('balloon', new BalloonToolbarPlugin(this));
    this.plugins.set('link', new LinkPlugin(this));
    this.plugins.set('mediaEmbed', new MediaEmbedPlugin(this));
    this.plugins.set('metrics', new MetricsPlugin(this));
    this.plugins.set('ai', new AIPlugin(this));
    this.plugins.set('markdown', new MarkdownPlugin(this));

    for (const plugin of this.plugins.values()) {
      plugin.init();
    }
  }

  _attachCoreListeners() {
    this.body.addEventListener('input', () => {
      this.history.record();
      this.events.emit('change');
      this.updateToolbarState();
    });

    document.addEventListener('selectionchange', () => {
      this.updateToolbarState();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.wysiwyg-dropdown')) {
        this._closeAllDropdowns();
      }
    });

    // Intercept Paste for Office / Word / Google Docs sanitization
    this.body.addEventListener('paste', (e) => {
      if (e.clipboardData.types.includes('Files')) return;

      const htmlPayload = e.clipboardData.getData('text/html');
      const rtfPayload = e.clipboardData.getData('text/rtf');
      const textPayload = e.clipboardData.getData('text/plain');

      if (htmlPayload) {
        e.preventDefault();
        const cleanHtml = this.sanitizer.cleanPastePayload(htmlPayload, rtfPayload);
        this.insertHTMLAtCursor(cleanHtml);
      } else if (textPayload) {
        e.preventDefault();
        const formatted = textPayload
          .split(/\n\n+/)
          .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        this.insertHTMLAtCursor(formatted);
      }
    });

    this.sourceViewEl.addEventListener('input', () => {
      this.body.innerHTML = this.sourceViewEl.value;
      this.events.emit('change');
    });
  }

  updateToolbarState() {
    this.toolbarEl.querySelectorAll('button[data-command]').forEach(btn => {
      const cmd = btn.dataset.command;
      if (['undo', 'redo', 'imageManager', 'insertTable', 'mediaEmbed', 'cleanFormat', 'sourceView', 'exportHtml', 'ai', 'markdown'].includes(cmd)) {
        if (cmd === 'undo') btn.disabled = !this.history.canUndo();
        if (cmd === 'redo') btn.disabled = !this.history.canRedo();
        return;
      }

      if (this.commands.isActive(cmd)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const block = this.getCurrentBlock();
    const headingLabel = this.toolbarEl.querySelector('.wysiwyg-label');
    if (headingLabel && block) {
      const tag = block.tagName.toLowerCase();
      if (tag === 'h2') headingLabel.textContent = 'Heading 2';
      else if (tag === 'h3') headingLabel.textContent = 'Heading 3';
      else if (tag === 'h4') headingLabel.textContent = 'Heading 4';
      else headingLabel.textContent = 'Paragraph';
    }
  }

  // --- Public API ---

  execute(command, ...args) {
    return this.commands.execute(command, ...args);
  }

  getHTML() {
    return this.body.innerHTML;
  }

  getCleanHTML() {
    return this.sanitizer.getCleanHTML(this.body);
  }

  getMarkdown() {
    const mdPlugin = this.plugins.get('markdown');
    return mdPlugin ? mdPlugin.getMarkdown() : '';
  }

  setHTML(content) {
    this.body.innerHTML = content;
    this.history.recordImmediateSnapshot();
    this.events.emit('change');
    this.updateToolbarState();
  }

  getText() {
    return this.body.innerText || '';
  }

  setReadOnly(isReadOnly) {
    this.isReadOnly = !!isReadOnly;
    this.body.contentEditable = !isReadOnly;
    this.container.classList.toggle('is-read-only', this.isReadOnly);
  }

  setTheme(theme) {
    this.config.ui.theme = theme;
    this.container.setAttribute('data-theme', theme);
  }

  setDirection(direction = 'ltr') {
    this.config.core.language = direction;
    this.container.setAttribute('dir', direction);
  }

  toggleSourceView() {
    this.isSourceMode = !this.isSourceMode;
    if (this.isSourceMode) {
      this.sourceViewEl.value = this.getCleanHTML();
      this.container.classList.add('in-source-mode');
    } else {
      this.body.innerHTML = this.sourceViewEl.value;
      this.container.classList.remove('in-source-mode');
      this.history.recordImmediateSnapshot();
      this.events.emit('change');
    }
  }

  exportHTMLDownload() {
    const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exported WYSIWYG Enterprise Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 860px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; }
    th { background: #f8fafc; }
    figure { margin: 1.5em 0; }
    figure[data-align="center"] { text-align: center; }
    figure[data-align="left"] { float: left; margin: 0 1.5em 1em 0; }
    figure[data-align="right"] { float: right; margin: 0 0 1em 1.5em; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    figcaption { font-size: 13px; color: #64748b; font-style: italic; margin-top: 6px; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1.5em 0; padding: 8px 16px; background: #f8fafc; font-style: italic; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
${this.getCleanHTML()}
</body>
</html>`;

    const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-export-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  insertHTMLAtCursor(html) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node;
    let lastNode;
    while ((node = temp.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);

    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    this.history.recordImmediateSnapshot();
    this.events.emit('change');
  }

  insertNodeAtCursor(node) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      this.body.appendChild(node);
      return;
    }
    const range = sel.getRangeAt(0);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
  }

  getCurrentBlock() {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    return this.findClosestAncestor(sel.anchorNode, 'h2, h3, h4, p, blockquote, li, td, th');
  }

  findClosestAncestor(node, selector) {
    let curr = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (curr && curr !== this.body) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }

  destroy() {
    for (const plugin of this.plugins.values()) {
      plugin.destroy();
    }
    this.events.destroy();
    this.container.innerHTML = '';
  }
}
