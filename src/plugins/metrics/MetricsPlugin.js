import { PluginInterface } from '../../core/PluginInterface.js';

/**
 * MetricsPlugin
 * Live document analytics: word count, character count, estimated reading time,
 * and background localStorage auto-save.
 */
export class MetricsPlugin extends PluginInterface {
  constructor(editor) {
    super(editor);
    this.statusBarEl = null;
    this.saveIndicator = null;
    this.metricsLabel = null;
    this.autoSaveTimer = null;
  }

  init() {
    this._renderStatusBar();
    this.editor.events.on('change', () => this.updateMetrics());
    this._setupAutoSave();
    this.updateMetrics();
  }

  _renderStatusBar() {
    const bar = document.createElement('div');
    bar.className = 'wysiwyg-statusbar';
    bar.innerHTML = `
      <div class="wysiwyg-statusbar-left">
        <span class="wysiwyg-status-badge">
          <span class="wysiwyg-status-dot" id="wysiwygStatusDot"></span>
          <span id="wysiwygSaveLabel">All changes saved</span>
        </span>
      </div>
      <div class="wysiwyg-statusbar-right" id="wysiwygMetrics">
        <span>0 words</span>
        <span>0 characters</span>
        <span>0 min read</span>
      </div>
    `;

    this.editor.container.appendChild(bar);
    this.statusBarEl = bar;
    this.saveIndicator = bar.querySelector('#wysiwygStatusDot');
    this.saveLabel = bar.querySelector('#wysiwygSaveLabel');
    this.metricsLabel = bar.querySelector('#wysiwygMetrics');
  }

  updateMetrics() {
    const text = this.editor.getText().trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const wpm = this.editor.config.ui?.readingSpeedWpm || 200;
    const readTimeMinutes = Math.max(1, Math.ceil(words / wpm));

    if (this.metricsLabel) {
      this.metricsLabel.innerHTML = `
        <span><strong>${words.toLocaleString()}</strong> words</span>
        <span><strong>${chars.toLocaleString()}</strong> characters</span>
        <span>~${words > 0 ? readTimeMinutes : 0} min read</span>
      `;
    }

    this._indicateUnsaved();
  }

  _indicateUnsaved() {
    if (this.saveIndicator) {
      this.saveIndicator.className = 'wysiwyg-status-dot saving';
      this.saveLabel.textContent = 'Unsaved changes...';
    }
  }

  _setupAutoSave() {
    const interval = this.editor.config.core?.autoSaveIntervalMs || 0;
    if (interval <= 0) return;

    this.autoSaveTimer = setInterval(() => {
      this.performSave();
    }, interval);
  }

  performSave() {
    const cleanHtml = this.editor.getCleanHTML();
    try {
      localStorage.setItem('wysiwyg_autosave_content', cleanHtml);
      const timeStr = new Date().toLocaleTimeString();
      if (this.saveIndicator) {
        this.saveIndicator.className = 'wysiwyg-status-dot';
        this.saveLabel.textContent = `Saved at ${timeStr}`;
      }
      this.editor.events.emit('autoSave', { html: cleanHtml, timestamp: Date.now() });
    } catch (e) {
      console.warn('AutoSave error:', e);
    }
  }

  destroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    if (this.statusBarEl) this.statusBarEl.remove();
  }
}
