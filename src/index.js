/**
 * WYSIWYG Enterprise Framework
 * Open-Source, Clean Architecture Rich-Text Engine
 */
import { EditorCore } from './core/EditorCore.js';
import { EventEmitter } from './core/EventEmitter.js';
import { CommandManager } from './core/CommandManager.js';
import { HistoryManager } from './core/HistoryManager.js';
import { PluginInterface } from './core/PluginInterface.js';
import { DOMSanitizer } from './sanitization/DOMSanitizer.js';
import { ModalManager } from './ui/ModalManager.js';
import { SVG_ICONS } from './ui/icons.js';
import { ImagePlugin } from './plugins/image/ImagePlugin.js';
import { TablePlugin } from './plugins/table/TablePlugin.js';
import { BalloonToolbarPlugin } from './plugins/balloon/BalloonToolbarPlugin.js';
import { LinkPlugin } from './plugins/link/LinkPlugin.js';
import { MediaEmbedPlugin } from './plugins/media/MediaEmbedPlugin.js';
import { MetricsPlugin } from './plugins/metrics/MetricsPlugin.js';
import { AIPlugin } from './plugins/ai/AIPlugin.js';
import { MarkdownPlugin } from './plugins/markdown/MarkdownPlugin.js';

export {
  EditorCore,
  EventEmitter,
  CommandManager,
  HistoryManager,
  PluginInterface,
  DOMSanitizer,
  ModalManager,
  SVG_ICONS,
  ImagePlugin,
  TablePlugin,
  BalloonToolbarPlugin,
  LinkPlugin,
  MediaEmbedPlugin,
  MetricsPlugin,
  AIPlugin,
  MarkdownPlugin
};

/**
 * Convenience helper to initialize an editor instance
 * @param {HTMLElement|string} target
 * @param {Object|string} [configOrUrl='./editor.config.json']
 * @returns {Promise<EditorCore>}
 */
export async function init(target, configOrUrl = './editor.config.json') {
  let config = {};
  if (typeof configOrUrl === 'string') {
    try {
      const res = await fetch(configOrUrl);
      config = await res.json();
    } catch (e) {
      console.warn('[WYSIWYG] Could not load config JSON from URL, using default:', e);
    }
  } else if (typeof configOrUrl === 'object') {
    config = configOrUrl;
  }
  return new EditorCore(target, config);
}

// Bind to window for direct browser script/module access
if (typeof window !== 'undefined') {
  window.WYSIWYG = {
    EditorCore,
    EventEmitter,
    CommandManager,
    HistoryManager,
    PluginInterface,
    DOMPurifierAndSanitizer: DOMSanitizer, // backwards compatibility alias
    DOMSanitizer,
    ModalManager,
    SVG_ICONS,
    ImagePlugin,
    TablePlugin,
    BalloonToolbarPlugin,
    LinkPlugin,
    MediaEmbedPlugin,
    MetricsPlugin,
    AIPlugin,
    MarkdownPlugin,
    init
  };
}

export default {
  EditorCore,
  DOMSanitizer,
  EventEmitter,
  CommandManager,
  HistoryManager,
  PluginInterface,
  init
};
