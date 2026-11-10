import { PluginInterface } from '../../core/PluginInterface.js';
import { SVG_ICONS } from '../../ui/icons.js';

/**
 * TablePlugin
 * Matrix-based table generator with contextual table toolbars, row & column manipulation,
 * headers toggling, and table removal.
 */
export class TablePlugin extends PluginInterface {
  constructor(editor) {
    super(editor);
    this.activeCell = null;
    this.tableToolbar = null;
  }

  init() {
    this._createTableToolbar();
    this._attachEventHandlers();
  }

  _attachEventHandlers() {
    this.editor.body.addEventListener('click', (e) => {
      const cell = e.target.closest('td, th');
      if (cell) {
        this.activeCell = cell;
        this._positionTableToolbar(cell);
      } else {
        this.activeCell = null;
        if (this.tableToolbar) this.tableToolbar.classList.remove('visible');
      }
    });

    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('table') && !e.target.closest('.wysiwyg-table-toolbar') && !e.target.closest('.wysiwyg-dropdown')) {
        if (this.tableToolbar) this.tableToolbar.classList.remove('visible');
      }
    });
  }

  createTable(rows = 3, cols = 3) {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const cell = r === 0 ? document.createElement('th') : document.createElement('td');
        cell.innerHTML = r === 0 ? `Header ${c + 1}` : `Data ${r},${c + 1}`;
        tr.appendChild(cell);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    this.editor.insertNodeAtCursor(table);
    this.editor.history.recordImmediateSnapshot();
    this.editor.events.emit('change');
  }

  _createTableToolbar() {
    const bar = document.createElement('div');
    bar.className = 'wysiwyg-table-toolbar';
    bar.innerHTML = `
      <button class="wysiwyg-btn" data-action="row-above" title="Insert Row Above">+ Row Above</button>
      <button class="wysiwyg-btn" data-action="row-below" title="Insert Row Below">+ Row Below</button>
      <button class="wysiwyg-btn" data-action="col-left" title="Insert Column Left">+ Col Left</button>
      <button class="wysiwyg-btn" data-action="col-right" title="Insert Column Right">+ Col Right</button>
      <div class="wysiwyg-toolbar-separator"></div>
      <button class="wysiwyg-btn" data-action="toggle-header" title="Toggle Header Row">Header</button>
      <button class="wysiwyg-btn" data-action="delete-row" title="Delete Row" style="color:var(--wysiwyg-danger);">- Row</button>
      <button class="wysiwyg-btn" data-action="delete-col" title="Delete Column" style="color:var(--wysiwyg-danger);">- Col</button>
      <button class="wysiwyg-btn" data-action="delete-table" title="Delete Entire Table" style="color:var(--wysiwyg-danger);">${SVG_ICONS.trash}</button>
    `;

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn || !this.activeCell) return;
      const action = btn.dataset.action;
      const row = this.activeCell.closest('tr');
      const table = this.activeCell.closest('table');
      const colIndex = Array.from(row.children).indexOf(this.activeCell);

      if (action === 'row-above' || action === 'row-below') {
        const newRow = document.createElement('tr');
        for (let i = 0; i < row.children.length; i++) {
          const td = document.createElement('td');
          td.innerHTML = '&nbsp;';
          newRow.appendChild(td);
        }
        if (action === 'row-above') {
          row.parentNode.insertBefore(newRow, row);
        } else {
          row.parentNode.insertBefore(newRow, row.nextSibling);
        }
      } else if (action === 'col-left' || action === 'col-right') {
        Array.from(table.rows).forEach(r => {
          const isTh = r.cells[0]?.tagName.toLowerCase() === 'th';
          const cell = isTh ? document.createElement('th') : document.createElement('td');
          cell.innerHTML = '&nbsp;';
          const target = r.cells[colIndex];
          if (action === 'col-left') {
            r.insertBefore(cell, target);
          } else {
            r.insertBefore(cell, target ? target.nextSibling : null);
          }
        });
      } else if (action === 'delete-row') {
        row.remove();
        if (table.rows.length === 0) table.remove();
        bar.classList.remove('visible');
      } else if (action === 'delete-col') {
        Array.from(table.rows).forEach(r => {
          if (r.cells[colIndex]) r.cells[colIndex].remove();
        });
        if (table.rows[0]?.cells.length === 0) table.remove();
        bar.classList.remove('visible');
      } else if (action === 'toggle-header') {
        const isHeader = this.activeCell.tagName.toLowerCase() === 'th';
        Array.from(row.children).forEach(c => {
          const newCell = document.createElement(isHeader ? 'td' : 'th');
          newCell.innerHTML = c.innerHTML;
          row.replaceChild(newCell, c);
        });
      } else if (action === 'delete-table') {
        table.remove();
        bar.classList.remove('visible');
      }

      this.editor.history.recordImmediateSnapshot();
      this.editor.events.emit('change');
      if (this.activeCell && this.activeCell.isConnected) {
        this._positionTableToolbar(this.activeCell);
      }
    });

    document.body.appendChild(bar);
    this.tableToolbar = bar;
  }

  _positionTableToolbar(cell) {
    const rect = cell.getBoundingClientRect();
    const bar = this.tableToolbar;
    bar.classList.add('visible');

    const top = window.scrollY + rect.top - bar.offsetHeight - 8;
    const left = window.scrollX + rect.left;

    bar.style.top = `${Math.max(10, top)}px`;
    bar.style.left = `${Math.max(10, left)}px`;
  }

  destroy() {
    if (this.tableToolbar) this.tableToolbar.remove();
  }
}
