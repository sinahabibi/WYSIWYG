/**
 * TypeScript Type Definitions for WYSIWYG Enterprise
 */

export interface EditorCoreConfig {
  language?: 'ltr' | 'rtl';
  placeholder?: string;
  readOnly?: boolean;
  autoSaveIntervalMs?: number;
  defaultDirection?: 'ltr' | 'rtl';
}

export interface ToolbarConfig {
  mode?: 'docked' | 'floating';
  sticky?: boolean;
  items?: string[];
}

export interface BalloonConfig {
  enabled?: boolean;
  items?: string[];
}

export interface ImageConfig {
  uploadStrategy?: 'base64' | 'server' | 'customUrl';
  server?: {
    endpoint?: string;
    headers?: Record<string, string>;
    fieldName?: string;
  };
  validation?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  };
  features?: {
    allowDragDrop?: boolean;
    allowClipboardPaste?: boolean;
    enableResizing?: boolean;
    figureCaption?: boolean;
  };
  compression?: {
    enabled?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: string;
  };
}

export interface SanitizationConfig {
  stripInlineStyles?: boolean;
  disallowTags?: string[];
  approvedTags?: string[];
  whitelistAttributes?: Record<string, string[]>;
}

export interface UIConfig {
  theme?: 'light' | 'dark';
  showWordCounter?: boolean;
  showReadingTime?: boolean;
  readingSpeedWpm?: number;
  minHeight?: string;
}

export interface AIConfig {
  handler?: (action: string, text: string) => Promise<string> | string;
}

export interface EditorConfig {
  core?: EditorCoreConfig;
  toolbar?: ToolbarConfig;
  balloon?: BalloonConfig;
  image?: ImageConfig;
  sanitization?: SanitizationConfig;
  ui?: UIConfig;
  ai?: AIConfig;
}

export declare class EventEmitter {
  constructor();
  on(event: string, handler: (...args: any[]) => void): () => void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  destroy(): void;
}

export declare class PluginInterface {
  editor: EditorCore;
  constructor(editor: EditorCore);
  init(): void;
  destroy(): void;
}

export declare class DOMSanitizer {
  constructor(sanitizationConfig?: SanitizationConfig);
  cleanPastePayload(htmlPayload: string, rtfPayload?: string): string;
  getCleanHTML(element: HTMLElement): string;
}

export declare class CommandManager {
  constructor(editor: EditorCore);
  register(name: string, definition: { execute: (editor: EditorCore, ...args: any[]) => any; isActive?: (editor: EditorCore, ...args: any[]) => boolean }): void;
  execute(name: string, ...args: any[]): any;
  isActive(name: string): boolean;
}

export declare class HistoryManager {
  constructor(editor: EditorCore, options?: { maxDepth?: number; debounceMs?: number });
  init(): void;
  record(): void;
  recordImmediateSnapshot(): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

export declare class ModalManager {
  constructor(editor: EditorCore);
  open(options: {
    title: string;
    fields: Array<{
      name: string;
      label: string;
      type?: 'text' | 'textarea' | 'checkbox' | 'select';
      value?: any;
      placeholder?: string;
      required?: boolean;
      checked?: boolean;
      options?: Array<{ value: string; label: string; selected?: boolean }>;
    }>;
    onSubmit: (data: Record<string, any>) => boolean | void | Promise<boolean | void>;
  }): void;
  close(): void;
}

export declare class ImagePlugin extends PluginInterface {
  uploadImage(file: File): Promise<void>;
  createFigureElement(attrs: { src: string; alt?: string; title?: string; loading?: string }): HTMLElement;
  insertImageNode(attrs: { src: string; alt?: string; title?: string; loading?: string }): void;
}

export declare class TablePlugin extends PluginInterface {
  createTable(rows?: number, cols?: number): void;
}

export declare class BalloonToolbarPlugin extends PluginInterface {}
export declare class LinkPlugin extends PluginInterface {}
export declare class MediaEmbedPlugin extends PluginInterface {}
export declare class MetricsPlugin extends PluginInterface {
  updateMetrics(): void;
  performSave(): void;
}

export declare class AIPlugin extends PluginInterface {
  openAIModal(): void;
}

export declare class MarkdownPlugin extends PluginInterface {
  getMarkdown(): string;
  exportMarkdownFile(): void;
}

export declare class EditorCore {
  container: HTMLElement;
  body: HTMLElement;
  config: EditorConfig;
  events: EventEmitter;
  commands: CommandManager;
  history: HistoryManager;
  sanitizer: DOMSanitizer;
  modal: ModalManager;
  plugins: Map<string, PluginInterface>;
  isReadOnly: boolean;
  isSourceMode: boolean;

  constructor(targetElement: HTMLElement | string, userConfig?: EditorConfig);

  execute(command: string, ...args: any[]): any;
  getHTML(): string;
  getCleanHTML(): string;
  getMarkdown(): string;
  setHTML(content: string): void;
  getText(): string;
  setReadOnly(isReadOnly: boolean): void;
  setTheme(theme: 'light' | 'dark'): void;
  setDirection(direction?: 'ltr' | 'rtl'): void;
  toggleSourceView(): void;
  exportHTMLDownload(): void;
  insertHTMLAtCursor(html: string): void;
  insertNodeAtCursor(node: Node): void;
  getCurrentBlock(): HTMLElement | null;
  findClosestAncestor(node: Node, selector: string): HTMLElement | null;
  updateToolbarState(): void;
  destroy(): void;
}

export declare function init(target: HTMLElement | string, configOrUrl?: EditorConfig | string): Promise<EditorCore>;

export declare namespace WYSIWYG {
  export {
    EditorCore,
    EventEmitter,
    CommandManager,
    HistoryManager,
    PluginInterface,
    DOMSanitizer,
    ModalManager,
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

export default WYSIWYG;
