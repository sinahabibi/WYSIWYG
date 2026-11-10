/**
 * PluginInterface
 * Base contract for all WYSIWYG plugins following Clean Architecture principles.
 */
export class PluginInterface {
  /**
   * @param {import('./EditorCore.js').EditorCore} editor
   */
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Called when the plugin is initialized by EditorCore
   */
  init() {}

  /**
   * Cleanup any DOM listeners or floating elements
   */
  destroy() {}
}
