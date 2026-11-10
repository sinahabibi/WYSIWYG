/**
 * CommandManager
 * Centralized command dispatcher and active state checker.
 */
export class CommandManager {
  /**
   * @param {import('./EditorCore.js').EditorCore} editor
   */
  constructor(editor) {
    this.editor = editor;
    this.commands = new Map();
    this._registerDefaultCommands();
  }

  register(name, definition) {
    this.commands.set(name, definition);
  }

  execute(name, ...args) {
    if (this.editor.isReadOnly && name !== 'sourceView' && name !== 'exportHtml') {
      return false;
    }

    if (this.commands.has(name)) {
      const cmd = this.commands.get(name);
      const res = cmd.execute(this.editor, ...args);
      this.editor.history.record();
      this.editor.events.emit('change');
      this.editor.updateToolbarState();
      return res;
    }

    // Default fallback to browser native command execution
    document.execCommand(name, false, args[0] || null);
    this.editor.history.record();
    this.editor.events.emit('change');
    this.editor.updateToolbarState();
    return true;
  }

  isActive(name) {
    if (this.commands.has(name)) {
      const cmd = this.commands.get(name);
      return cmd.isActive ? cmd.isActive(this.editor) : false;
    }
    try {
      return document.queryCommandState(name);
    } catch (_) {
      return false;
    }
  }

  _registerDefaultCommands() {
    // Basic formatting commands
    ['bold', 'italic', 'underline', 'strikethrough'].forEach(cmd => {
      this.register(cmd, {
        execute: () => document.execCommand(cmd, false, null),
        isActive: () => document.queryCommandState(cmd)
      });
    });

    // Code inline command
    this.register('code', {
      execute: (editor) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return;

        const parentCode = editor.findClosestAncestor(range.commonAncestorContainer, 'code');
        if (parentCode) {
          const text = document.createTextNode(parentCode.textContent);
          parentCode.parentNode.replaceChild(text, parentCode);
        } else {
          const codeEl = document.createElement('code');
          codeEl.appendChild(range.extractContents());
          range.insertNode(codeEl);
        }
      },
      isActive: (editor) => !!editor.findClosestAncestor(window.getSelection()?.anchorNode, 'code')
    });

    // Heading command (h2, h3, h4, p)
    this.register('heading', {
      execute: (editor, level = 'h2') => {
        document.execCommand('formatBlock', false, `<${level}>`);
      },
      isActive: (editor, level = 'h2') => {
        const block = editor.findClosestAncestor(window.getSelection()?.anchorNode, level);
        return !!block;
      }
    });

    // Blockquote
    this.register('blockquote', {
      execute: (editor) => {
        const bq = editor.findClosestAncestor(window.getSelection()?.anchorNode, 'blockquote');
        if (bq) {
          document.execCommand('formatBlock', false, '<p>');
        } else {
          document.execCommand('formatBlock', false, '<blockquote>');
        }
      },
      isActive: (editor) => !!editor.findClosestAncestor(window.getSelection()?.anchorNode, 'blockquote')
    });

    // Lists
    this.register('bulletList', {
      execute: () => document.execCommand('insertUnorderedList', false, null),
      isActive: () => document.queryCommandState('insertUnorderedList')
    });

    this.register('numberList', {
      execute: () => document.execCommand('insertOrderedList', false, null),
      isActive: () => document.queryCommandState('insertOrderedList')
    });

    // Clean formatting
    this.register('cleanFormat', {
      execute: (editor) => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('formatBlock', false, '<p>');
      }
    });

    // Font color & highlight
    this.register('fontColor', {
      execute: (editor, color) => document.execCommand('foreColor', false, color)
    });

    this.register('highlight', {
      execute: (editor, color) => document.execCommand('hiliteColor', false, color)
    });

    // Undo & Redo
    this.register('undo', {
      execute: (editor) => editor.history.undo()
    });

    this.register('redo', {
      execute: (editor) => editor.history.redo()
    });

    // Alignment
    this.register('alignment', {
      execute: (editor, align = 'left') => {
        const block = editor.getCurrentBlock();
        if (block) {
          block.setAttribute('data-align', align);
          block.style.textAlign = align;
        }
      }
    });
  }
}
