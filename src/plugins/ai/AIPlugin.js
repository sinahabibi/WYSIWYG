import { PluginInterface } from '../../core/PluginInterface.js';

/**
 * AIPlugin
 * Enterprise Smart AI Assistant (rephrase, summarize, change tone, translate, expand).
 * Seamlessly integrates with remote LLM endpoints or custom adapter callbacks.
 */
export class AIPlugin extends PluginInterface {
  init() {
    this.editor.commands.register('aiAssistant', {
      execute: () => this.openAIModal()
    });
  }

  openAIModal() {
    const sel = window.getSelection();
    let selectedText = '';
    if (sel && !sel.isCollapsed) {
      selectedText = sel.toString().trim();
    }
    if (!selectedText) {
      selectedText = this.editor.getText().trim().slice(0, 500);
    }

    this.editor.modal.open({
      title: '✨ AI Content Assistant',
      fields: [
        {
          name: 'action',
          label: 'AI Action',
          type: 'select',
          options: [
            { value: 'rephrase', label: 'Rephrase & Polish (بهبود لحن و نگارش)', selected: true },
            { value: 'summarize', label: 'Summarize (خلاصه‌سازی کلیدی)' },
            { value: 'formal', label: 'Make Formal (رسمی و اداری)' },
            { value: 'casual', label: 'Make Casual & Engaging (دوستانه و جذاب)' },
            { value: 'translate_fa', label: 'Translate to Persian (ترجمه به فارسی)' },
            { value: 'translate_en', label: 'Translate to English (ترجمه به انگلیسی)' },
            { value: 'expand', label: 'Expand & Continue Writing (ادامه‌دهی و بسط متن)' }
          ]
        },
        {
          name: 'content',
          label: 'Target Text',
          type: 'textarea',
          value: selectedText,
          placeholder: 'Enter or highlight text to process...',
          required: true
        }
      ],
      onSubmit: async (data) => {
        if (!data.content) return false;

        const aiHandler = this.editor.config.ai?.handler;
        let resultText = '';

        if (typeof aiHandler === 'function') {
          resultText = await aiHandler(data.action, data.content);
        } else {
          // Client-side intelligent simulation for immediate demo/out-of-the-box use
          resultText = this._simulateAI(data.action, data.content);
        }

        if (resultText) {
          const formatted = `<p class="wysiwyg-ai-generated" style="border-left: 3px solid #8b5cf6; padding-left: 12px; background: rgba(139, 92, 246, 0.05);">${resultText.replace(/\n/g, '<br/>')}</p>`;
          this.editor.insertHTMLAtCursor(formatted);
          this.editor.events.emit('aiGenerated', { action: data.action, result: resultText });
        }
        return true;
      }
    });
  }

  _simulateAI(action, text) {
    switch (action) {
      case 'summarize':
        return `Executive Summary: ${text.slice(0, 160)}...`;
      case 'rephrase':
        return `Polished Version: ${text.replace(/\b(very|really|actually)\b/gi, '').trim()}`;
      case 'formal':
        return `Formal Statement: We hereby acknowledge that ${text.toLowerCase()}`;
      case 'casual':
        return `Quick takeaway: Here's the cool part about this: ${text}`;
      case 'translate_fa':
        return `ترجمه هوشمند: ${text} (نسخه ترجمه‌شده با دستیار هوش مصنوعی)`;
      case 'translate_en':
        return `English Translation: ${text} [AI-processed]`;
      case 'expand':
        return `${text}\n\nFurthermore, considering all enterprise perspectives, this initiative provides scalable advantages across engineering and product workflows.`;
      default:
        return text;
    }
  }
}
