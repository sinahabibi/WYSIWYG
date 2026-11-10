# WYSIWYG Enterprise Editor 🖋️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla%20JS)-success.svg)](package.json)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%26%20Modular-purple.svg)](src/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Types%20Included-informational.svg)](types/index.d.ts)
[![Open Source](https://img.shields.io/badge/Open%20Source-Community%20First-orange.svg)](CONTRIBUTING.md)

An enterprise-grade, zero-dependency rich text editor engineered with **Clean Architecture**. Designed as a high-performance open-source alternative to **CKEditor 5 Enterprise** and **TinyMCE**, featuring strict AST-based DOM sanitization, multi-strategy image pipelines, floating balloon toolbars, interactive tables, real-time analytics, an **AI Content Assistant**, and **Markdown support**.

---

## 🌟 Key Features

- **🏛️ Clean & Modular Architecture:** Decoupled into domain services (`src/core`), isolated plugins (`src/plugins`), AST security (`src/sanitization`), and presentation layers (`src/ui`).
- **🛡️ Strict AST Sanitization:** Protects against XSS attacks and automatically purifies messy paste payloads from **Microsoft Word** and **Google Docs** (stripping `MsoNormal`, XML conditional comments, and proprietary styles).
- **✨ Smart AI Content Assistant:** Built-in modular AI dialog supporting text rephrasing, summarization, tone shifts (formal/casual), translation (Persian/English), and automated text expansion.
- **⚡ Dual-Mode Markdown:** Live keyboard triggers (e.g., `# `, `## `, `> `, `- `, `1. `) and bidirectional Markdown export (`.md`).
- **🖼️ Multi-Strategy Image Pipeline:**
  - Client-side Canvas compression to WebP.
  - Asynchronous simulated/real server upload with percentage progress bars.
  - WCAG 2.1 AA accessible custom URL modal with mandatory `alt` attributes.
  - Interactive 4-corner live resizing handles and figure captions.
- **📊 10x10 Matrix Table Builder:** Interactive cell picker, contextual table floating toolbars, dynamic row/col insertion, and header conversions.
- **🎈 Floating Balloon Toolbar:** Notion & Medium-style text selection popup that floats above highlighted text.
- **📈 Document Metrics & Auto-Save:** Real-time word counter, character counter, reading time estimation, and configurable background `localStorage` auto-save.
- **🌐 Full LTR / RTL Support:** Designed for Persian, Arabic, and international multilingual applications.
- **🌗 Light & Dark Themes:** Smooth CSS custom property transitions.

---

## 🏛️ Clean Architecture Structure

The codebase is organized into small, single-responsibility modules:

```
WYSIWYG/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Automated validation & type checking
│   │   └── deploy-pages.yml       # Automated GitHub Pages demo deployment
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── core/                      # Domain & Orchestration
│   │   ├── EventEmitter.js        # Decoupled event bus
│   │   ├── CommandManager.js      # Executive commands registry
│   │   ├── HistoryManager.js      # Undo/Redo snapshot & selection manager
│   │   ├── PluginInterface.js     # Abstract plugin base contract
│   │   └── EditorCore.js          # Core editor engine
│   ├── sanitization/              # Security Layer
│   │   └── DOMSanitizer.js        # Strict AST sanitizer & Word/Docs cleaner
│   ├── plugins/                   # Feature Plugins (Single Responsibility)
│   │   ├── image/ImagePlugin.js   # Image manager, uploaders & resize handles
│   │   ├── table/TablePlugin.js   # 10x10 Table generator & floating tools
│   │   ├── balloon/BalloonToolbarPlugin.js # Contextual text selection balloon
│   │   ├── link/LinkPlugin.js     # Hyperlink modal & security attributes
│   │   ├── media/MediaEmbedPlugin.js # Video embed (YouTube & Vimeo)
│   │   ├── metrics/MetricsPlugin.js # Word/Char counts & auto-save
│   │   ├── ai/AIPlugin.js         # ✨ AI assistant & text actions
│   │   └── markdown/MarkdownPlugin.js # ⚡ Markdown shortcuts & export
│   ├── ui/                        # Presentation Components
│   │   ├── icons.js               # Zero-dependency SVG icons registry
│   │   └── ModalManager.js        # Accessible modal dialogs
│   └── index.js                   # Unified ES module entry point
├── types/
│   └── index.d.ts                 # Full TypeScript definitions
├── editor.config.json             # Configuration schema
├── editor.css                     # Editor design system styles
├── editor.js                      # Standalone browser bundle (legacy/CDN)
├── index.html                     # Live interactive demo
├── package.json                   # NPM manifest & exports map
├── tsconfig.json                  # TypeScript compiler settings
├── CONTRIBUTING.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md             # Contributor Covenant
└── LICENSE                        # MIT License
```

---

## 🚀 Quick Start

### 1. Using Native ES Modules (Modern Web)

```html
<!-- Stylesheet -->
<link rel="stylesheet" href="./editor.css">

<!-- Container -->
<div id="editor"></div>

<!-- ES Module initialization -->
<script type="module">
  import { init } from './src/index.js';

  const editor = await init('#editor', './editor.config.json');

  editor.events.on('change', () => {
    console.log('Sanitized HTML:', editor.getCleanHTML());
    console.log('Markdown content:', editor.getMarkdown());
  });
</script>
```

### 2. Using Standalone Bundle (Traditional Script Tag)

```html
<link rel="stylesheet" href="./editor.css">
<div id="editor"></div>

<script src="./editor.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const editor = await window.WYSIWYG.init('#editor');
  });
</script>
```

### 3. Using as an NPM Package (in React, Vue, Svelte, or Next.js)

```bash
npm install wysiwyg-enterprise
```

```javascript
import { EditorCore } from 'wysiwyg-enterprise';
import 'wysiwyg-enterprise/css';

const editor = new EditorCore('#editor-container', {
  core: { language: 'rtl', placeholder: 'متن خود را اینجا بنویسید...' },
  ui: { theme: 'dark' }
});
```

---

## 🛠️ Configuration Options

You can configure the editor via a JSON file or by passing a JavaScript object:

```json
{
  "core": {
    "language": "ltr",
    "placeholder": "Write your content here...",
    "readOnly": false,
    "autoSaveIntervalMs": 8000
  },
  "toolbar": {
    "mode": "docked",
    "sticky": true,
    "items": [
      "heading", "|",
      "bold", "italic", "underline", "strikethrough", "code", "|",
      "alignment", "|",
      "bulletList", "numberList", "blockquote", "|",
      "link", "insertTable", "imageManager", "mediaEmbed", "|",
      "ai", "markdown", "|",
      "cleanFormat", "undo", "redo", "|",
      "sourceView", "exportHtml"
    ]
  },
  "image": {
    "uploadStrategy": "base64",
    "validation": { "maxSizeMB": 8 },
    "compression": { "enabled": true, "quality": 0.88, "outputFormat": "image/webp" }
  },
  "ui": {
    "theme": "light",
    "showWordCounter": true,
    "showReadingTime": true
  }
}
```

---

## 🤖 Custom AI Adapter Integration

You can easily connect the `AIPlugin` to any remote LLM (OpenAI, Anthropic Claude, Google Gemini, or local Ollama models) using the `ai.handler` hook:

```javascript
const editor = new EditorCore('#editor', {
  ai: {
    handler: async (action, text) => {
      // Connect to your backend API route
      const response = await fetch('/api/ai-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text })
      });
      const data = await response.json();
      return data.result;
    }
  }
});
```

---

## 📖 Public API Reference

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `getHTML()` | — | Returns raw editor HTML. |
| `getCleanHTML()` | — | Returns sanitized HTML stripped of XSS and invalid markup. |
| `getMarkdown()` | — | Returns the document converted to clean Markdown. |
| `getText()` | — | Returns plain text content without HTML tags. |
| `setHTML(html)` | `content: string` | Updates editor content and adds to undo history. |
| `execute(command, ...args)` | `cmd, args` | Executes an editor command (e.g. `bold`, `heading`, `link`). |
| `setReadOnly(boolean)` | `isReadOnly` | Toggles editor read-only mode. |
| `setTheme('light'\|'dark')` | `theme` | Switches theme dynamically. |
| `setDirection('ltr'\|'rtl')` | `dir` | Sets document direction for Persian/Arabic/English. |
| `toggleSourceView()` | — | Toggles between rich visual mode and raw HTML mode. |
| `exportHTMLDownload()` | — | Triggers a browser download of the standalone HTML document. |
| `destroy()` | — | Cleans up event listeners, plugins, and DOM nodes. |

---

## 🤝 Contributing

We welcome issues, feature requests, and Pull Requests! Please see [CONTRIBUTING.md](CONTRIBUTING.md) and our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
