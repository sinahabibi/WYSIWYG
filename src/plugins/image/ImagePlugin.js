import { PluginInterface } from '../../core/PluginInterface.js';
import { SVG_ICONS } from '../../ui/icons.js';

/**
 * ImagePlugin
 * High-performance image manager with multiple upload strategies (base64, server, URL),
 * client-side WebP compression, drag-and-drop, clipboard paste, interactive 4-corner resizing,
 * alignment and figure captions.
 */
export class ImagePlugin extends PluginInterface {
  constructor(editor) {
    super(editor);
    this.config = editor.config.image || {};
    this.selectedFigure = null;
    this.isResizing = false;
    this.startResizeData = null;
  }

  init() {
    this._createImageToolbar();
    this._attachEventHandlers();
  }

  _attachEventHandlers() {
    const { body } = this.editor;

    // Drag and Drop
    if (this.config.features?.allowDragDrop) {
      body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      body.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
          files.forEach(file => this.uploadImage(file));
        }
      });
    }

    // Clipboard Paste (Ctrl+V)
    if (this.config.features?.allowClipboardPaste) {
      body.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (file) this.uploadImage(file);
          }
        }
      });
    }

    // Image Selection & Click Handling
    body.addEventListener('click', (e) => {
      const figure = e.target.closest('figure.wysiwyg-image');
      if (figure) {
        this.selectImage(figure);
      } else {
        this.deselectImage();
      }
    });

    // Window click to deselect when clicking outside
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('figure.wysiwyg-image') && !e.target.closest('.wysiwyg-image-toolbar')) {
        this.deselectImage();
      }
    });

    // Interactive Resizing Mouse Listeners
    window.addEventListener('pointermove', (e) => this._handlePointerMove(e));
    window.addEventListener('pointerup', () => this._handlePointerUp());
  }

  selectImage(figure) {
    this.deselectImage();
    this.selectedFigure = figure;
    figure.classList.add('is-focused');

    if (this.config.features?.enableResizing) {
      this._appendResizeHandles(figure);
    }
    this._positionImageToolbar(figure);
  }

  deselectImage() {
    if (this.selectedFigure) {
      this.selectedFigure.classList.remove('is-focused');
      this.selectedFigure.querySelectorAll('.wysiwyg-resize-handle').forEach(h => h.remove());
      this.selectedFigure = null;
    }
    if (this.imageToolbar) {
      this.imageToolbar.classList.remove('visible');
    }
  }

  _appendResizeHandles(figure) {
    if (figure.querySelector('.wysiwyg-resize-handle')) return;
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `wysiwyg-resize-handle wysiwyg-resize-${pos}`;
      handle.dataset.corner = pos;
      handle.addEventListener('pointerdown', (e) => this._startResize(e, pos));
      figure.appendChild(handle);
    });
  }

  _startResize(e, corner) {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    const img = this.selectedFigure.querySelector('img');

    this.startResizeData = {
      startX: e.clientX,
      startWidth: img.offsetWidth,
      corner,
      aspectRatio: img.naturalWidth / img.naturalHeight || 1.6
    };
  }

  _handlePointerMove(e) {
    if (!this.isResizing || !this.selectedFigure) return;
    const { startX, startWidth, corner } = this.startResizeData;
    const deltaX = (corner.includes('e') ? (e.clientX - startX) : (startX - e.clientX));
    const newWidth = Math.max(120, Math.min(startWidth + deltaX, this.editor.body.clientWidth));

    const img = this.selectedFigure.querySelector('img');
    img.style.width = `${newWidth}px`;
    img.style.height = 'auto';

    this._positionImageToolbar(this.selectedFigure);
  }

  _handlePointerUp() {
    if (this.isResizing) {
      this.isResizing = false;
      this.startResizeData = null;
      this.editor.history.recordImmediateSnapshot();
      this.editor.events.emit('change');
    }
  }

  _createImageToolbar() {
    const bar = document.createElement('div');
    bar.className = 'wysiwyg-image-toolbar';
    bar.innerHTML = `
      <button class="wysiwyg-btn" data-action="align-left" title="Float Left">${SVG_ICONS.alignLeft}</button>
      <button class="wysiwyg-btn" data-action="align-center" title="Align Center">${SVG_ICONS.alignCenter}</button>
      <button class="wysiwyg-btn" data-action="align-right" title="Float Right">${SVG_ICONS.alignRight}</button>
      <div class="wysiwyg-toolbar-separator"></div>
      <button class="wysiwyg-btn" data-action="toggle-caption" title="Toggle Caption">${SVG_ICONS.caption}</button>
      <button class="wysiwyg-btn" data-action="edit-alt" title="Edit Alt Text"><span style="font-size:11px; font-weight:700;">ALT</span></button>
      <button class="wysiwyg-btn" data-action="delete" title="Delete Image" style="color:var(--wysiwyg-danger);">${SVG_ICONS.trash}</button>
    `;

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn || !this.selectedFigure) return;
      const action = btn.dataset.action;

      if (action.startsWith('align-')) {
        const align = action.replace('align-', '');
        this.selectedFigure.setAttribute('data-align', align);
      } else if (action === 'toggle-caption') {
        let cap = this.selectedFigure.querySelector('figcaption');
        if (cap) {
          cap.remove();
        } else {
          cap = document.createElement('figcaption');
          cap.contentEditable = "true";
          cap.textContent = "Figure caption description";
          this.selectedFigure.appendChild(cap);
        }
      } else if (action === 'edit-alt') {
        const img = this.selectedFigure.querySelector('img');
        const currentAlt = img.getAttribute('alt') || '';
        const newAlt = prompt('Enter image accessibility ALT description:', currentAlt);
        if (newAlt !== null) {
          img.setAttribute('alt', newAlt);
        }
      } else if (action === 'delete') {
        this.selectedFigure.remove();
        this.deselectImage();
      }

      this.editor.history.recordImmediateSnapshot();
      this.editor.events.emit('change');
      if (this.selectedFigure) this._positionImageToolbar(this.selectedFigure);
    });

    document.body.appendChild(bar);
    this.imageToolbar = bar;
  }

  _positionImageToolbar(figure) {
    const rect = figure.getBoundingClientRect();
    const bar = this.imageToolbar;
    bar.classList.add('visible');

    const top = window.scrollY + rect.top - bar.offsetHeight - 8;
    const left = window.scrollX + rect.left + (rect.width / 2) - (bar.offsetWidth / 2);

    bar.style.top = `${Math.max(10, top)}px`;
    bar.style.left = `${Math.max(10, left)}px`;
  }

  async uploadImage(file) {
    const validation = this.config.validation || {};
    const maxBytes = (validation.maxSizeMB || 8) * 1024 * 1024;

    if (file.size > maxBytes) {
      alert(`Image size exceeds maximum allowed limit of ${validation.maxSizeMB}MB.`);
      return;
    }

    if (validation.allowedTypes && !validation.allowedTypes.includes(file.type)) {
      alert(`Invalid image format. Allowed: ${validation.allowedTypes.join(', ')}`);
      return;
    }

    const strategy = this.config.uploadStrategy || 'base64';

    if (strategy === 'base64') {
      await this._handleBase64Strategy(file);
    } else if (strategy === 'server') {
      await this._handleServerStrategy(file);
    } else {
      this.openCustomUrlModal();
    }
  }

  async _handleBase64Strategy(file) {
    const compressedDataUrl = await this._compressImage(file);
    this.insertImageNode({
      src: compressedDataUrl,
      alt: file.name.replace(/\.[^/.]+$/, ""),
      title: file.name
    });
  }

  async _handleServerStrategy(file) {
    // 1. Insert Inline Progress Placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'wysiwyg-image-uploading';
    placeholder.innerHTML = `
      <div class="wysiwyg-upload-spinner"></div>
      <div class="wysiwyg-upload-label">Uploading "${file.name}" (0%)...</div>
      <div class="wysiwyg-upload-progress-bar">
        <div class="wysiwyg-upload-progress-fill"></div>
      </div>
    `;
    this.editor.insertNodeAtCursor(placeholder);

    const progressFill = placeholder.querySelector('.wysiwyg-upload-progress-fill');
    const progressLabel = placeholder.querySelector('.wysiwyg-upload-label');

    // Simulated Server Upload with Progress Percentage
    try {
      const uploadedUrl = await new Promise((resolve) => {
        let pct = 0;
        const interval = setInterval(() => {
          pct += 15;
          if (pct > 95) pct = 95;
          progressFill.style.width = `${pct}%`;
          progressLabel.textContent = `Uploading "${file.name}" (${pct}%)...`;
        }, 120);

        setTimeout(async () => {
          clearInterval(interval);
          progressFill.style.width = '100%';
          progressLabel.textContent = `Processing image on server...`;
          
          // Provide compressed WebP fallback or simulated remote URL
          const compressed = await this._compressImage(file);
          resolve(compressed);
        }, 1100);
      });

      // Replace placeholder with final figure element
      const figure = this.createFigureElement({
        src: uploadedUrl,
        alt: file.name,
        title: file.name
      });
      placeholder.parentNode.replaceChild(figure, placeholder);
      this.editor.history.recordImmediateSnapshot();
      this.editor.events.emit('change');
    } catch (err) {
      placeholder.remove();
      alert(`Upload failed: ${err.message}`);
    }
  }

  _compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const comp = this.config.compression || {};
          const maxWidth = comp.maxWidth || 1920;
          const maxHeight = comp.maxHeight || 1080;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const format = comp.outputFormat || 'image/webp';
          const quality = comp.quality || 0.88;
          resolve(canvas.toDataURL(format, quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  openCustomUrlModal() {
    this.editor.modal.open({
      title: 'Insert Web Image',
      fields: [
        { name: 'url', label: 'Image URL', type: 'text', placeholder: 'https://images.unsplash.com/...', required: true },
        { name: 'alt', label: 'Alternative Text (Mandatory Accessibility)', type: 'text', placeholder: 'Describe image content...', required: true },
        { name: 'title', label: 'Image Title (Tooltip)', type: 'text', placeholder: 'Optional title' },
        { name: 'lazy', label: 'Enable Native Lazy Loading', type: 'checkbox', checked: true }
      ],
      onSubmit: (data) => {
        if (!data.url || !data.alt) {
          alert('Both Image URL and Descriptive ALT text are required.');
          return false;
        }
        this.insertImageNode({
          src: data.url,
          alt: data.alt,
          title: data.title || '',
          loading: data.lazy ? 'lazy' : 'eager'
        });
        return true;
      }
    });
  }

  createFigureElement({ src, alt, title = '', loading = 'lazy' }) {
    const figure = document.createElement('figure');
    figure.className = 'wysiwyg-image align-center';
    figure.setAttribute('data-align', 'center');

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    if (title) img.title = title;
    img.loading = loading;

    figure.appendChild(img);

    if (this.config.features?.figureCaption) {
      const caption = document.createElement('figcaption');
      caption.contentEditable = "true";
      caption.textContent = alt || 'Click to edit caption...';
      figure.appendChild(caption);
    }

    return figure;
  }

  insertImageNode(attrs) {
    const figure = this.createFigureElement(attrs);
    this.editor.insertNodeAtCursor(figure);
    this.editor.history.recordImmediateSnapshot();
    this.editor.events.emit('change');
  }

  destroy() {
    if (this.imageToolbar) this.imageToolbar.remove();
  }
}
