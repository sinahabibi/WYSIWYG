/**
 * HistoryManager
 * Transactional & snapshot-based Undo/Redo manager with debounced state captures
 * and selection range preservation.
 */
export class HistoryManager {
  /**
   * @param {import('./EditorCore.js').EditorCore} editor
   * @param {Object} [options={}]
   */
  constructor(editor, options = {}) {
    this.editor = editor;
    this.maxDepth = options.maxDepth || 60;
    this.debounceMs = options.debounceMs || 350;
    this.undoStack = [];
    this.redoStack = [];
    this._debounceTimer = null;
    this._isPerformingHistoryAction = false;
  }

  init() {
    this.recordImmediateSnapshot();
  }

  record() {
    if (this._isPerformingHistoryAction) return;

    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.recordImmediateSnapshot();
    }, this.debounceMs);
  }

  recordImmediateSnapshot() {
    if (this._isPerformingHistoryAction) return;

    const snapshot = {
      html: this.editor.body.innerHTML,
      selection: this._serializeSelection()
    };

    // Avoid pushing duplicate consecutive states
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && last.html === snapshot.html) return;

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo branch
    this.editor.events.emit('historyChange', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  undo() {
    if (!this.canUndo()) return;
    this._isPerformingHistoryAction = true;

    const current = {
      html: this.editor.body.innerHTML,
      selection: this._serializeSelection()
    };
    this.redoStack.push(current);

    const prev = this.undoStack.pop();
    this.editor.body.innerHTML = prev.html;
    this._restoreSelection(prev.selection);

    this._isPerformingHistoryAction = false;
    this.editor.events.emit('historyChange', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    this.editor.events.emit('change');
  }

  redo() {
    if (!this.canRedo()) return;
    this._isPerformingHistoryAction = true;

    const current = {
      html: this.editor.body.innerHTML,
      selection: this._serializeSelection()
    };
    this.undoStack.push(current);

    const next = this.redoStack.pop();
    this.editor.body.innerHTML = next.html;
    this._restoreSelection(next.selection);

    this._isPerformingHistoryAction = false;
    this.editor.events.emit('historyChange', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    this.editor.events.emit('change');
  }

  canUndo() {
    return this.undoStack.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  _serializeSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);

    return {
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      isCollapsed: range.collapsed
    };
  }

  _restoreSelection(selData) {
    if (!selData) return;
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(this.editor.body);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {
      // Fallback gracefully
    }
  }
}
