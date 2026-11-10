/**
 * ModalManager
 * Accessible, dynamic modal dialog manager with keyboard trap (Enter/Escape)
 * and focus management.
 */
export class ModalManager {
  /**
   * @param {import('../core/EditorCore.js').EditorCore} editor
   */
  constructor(editor) {
    this.editor = editor;
    this.activeBackdrop = null;
  }

  open({ title, fields = [], onSubmit }) {
    this.close();

    const backdrop = document.createElement('div');
    backdrop.className = 'wysiwyg-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'wysiwyg-modal';

    let fieldsHtml = '';
    fields.forEach(f => {
      if (f.type === 'checkbox') {
        fieldsHtml += `
          <label class="wysiwyg-form-check">
            <input type="checkbox" name="${f.name}" ${f.checked ? 'checked' : ''} />
            <span>${f.label}</span>
          </label>
        `;
      } else if (f.type === 'textarea') {
        fieldsHtml += `
          <div class="wysiwyg-form-group">
            <label class="wysiwyg-form-label ${f.required ? 'required' : ''}">${f.label}</label>
            <textarea class="wysiwyg-form-input" style="height:90px;resize:vertical;" name="${f.name}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${f.value || ''}</textarea>
          </div>
        `;
      } else if (f.type === 'select') {
        const opts = (f.options || []).map(o => `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('');
        fieldsHtml += `
          <div class="wysiwyg-form-group">
            <label class="wysiwyg-form-label ${f.required ? 'required' : ''}">${f.label}</label>
            <select class="wysiwyg-form-input" name="${f.name}">${opts}</select>
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="wysiwyg-form-group">
            <label class="wysiwyg-form-label ${f.required ? 'required' : ''}">${f.label}</label>
            <input class="wysiwyg-form-input" type="${f.type || 'text'}" name="${f.name}" value="${f.value || ''}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
          </div>
        `;
      }
    });

    modal.innerHTML = `
      <div class="wysiwyg-modal-header">
        <span>${title}</span>
        <button class="wysiwyg-modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="wysiwyg-modal-body">
        ${fieldsHtml}
      </div>
      <div class="wysiwyg-modal-footer">
        <button class="wysiwyg-btn-secondary" id="wysiwygModalCancel">Cancel</button>
        <button class="wysiwyg-btn-primary" id="wysiwygModalSubmit">Apply</button>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    this.activeBackdrop = backdrop;

    // Focus first input
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    // Event binding
    const closeModal = () => this.close();
    modal.querySelector('.wysiwyg-modal-close').addEventListener('click', closeModal);
    modal.querySelector('#wysiwygModalCancel').addEventListener('click', closeModal);
    backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const submitAction = () => {
      const data = {};
      fields.forEach(f => {
        const input = modal.querySelector(`[name="${f.name}"]`);
        if (input) {
          data[f.name] = f.type === 'checkbox' ? input.checked : input.value;
        }
      });
      if (onSubmit(data) !== false) {
        closeModal();
      }
    };

    modal.querySelector('#wysiwygModalSubmit').addEventListener('click', submitAction);
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName.toLowerCase() !== 'textarea') {
        e.preventDefault();
        submitAction();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  close() {
    if (this.activeBackdrop) {
      this.activeBackdrop.remove();
      this.activeBackdrop = null;
    }
  }
}
