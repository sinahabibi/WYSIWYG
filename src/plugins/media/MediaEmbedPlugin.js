import { PluginInterface } from '../../core/PluginInterface.js';

/**
 * MediaEmbedPlugin
 * Responsive media embedding for YouTube, Vimeo, and video providers.
 */
export class MediaEmbedPlugin extends PluginInterface {
  init() {
    this.editor.commands.register('mediaEmbed', {
      execute: () => this.openMediaModal()
    });
  }

  openMediaModal() {
    this.editor.modal.open({
      title: 'Embed Video or Rich Media',
      fields: [
        { name: 'url', label: 'YouTube / Vimeo Video URL', type: 'text', placeholder: 'https://www.youtube.com/watch?v=...', required: true }
      ],
      onSubmit: (data) => {
        const embedHtml = this._getEmbedHtml(data.url);
        if (embedHtml) {
          this.editor.insertHTMLAtCursor(embedHtml);
          return true;
        }
        alert('Invalid or unsupported video URL. Please provide a valid YouTube or Vimeo link.');
        return false;
      }
    });
  }

  _getEmbedHtml(url) {
    if (!url) return null;
    // YouTube match
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return `<div class="wysiwyg-media-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1.5em 0;"><iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
    }
    // Vimeo match
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch) {
      return `<div class="wysiwyg-media-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1.5em 0;"><iframe src="https://player.vimeo.com/video/${vimeoMatch[3]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
    }
    return null;
  }
}
