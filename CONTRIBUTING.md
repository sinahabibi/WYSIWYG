# Contributing to WYSIWYG Enterprise

Thank you for your interest in contributing to WYSIWYG Enterprise! We welcome contributions from developers of all skill levels.

---

## 🏛️ Clean Architecture Principles

This project strictly adheres to Clean Architecture principles:
- **`src/core/`**: Houses domain logic, events (`EventEmitter`), command orchestration (`CommandManager`), and undo/redo stacks (`HistoryManager`). It has zero coupling with specific external frameworks.
- **`src/sanitization/`**: Independent, testable security and content cleaner (`DOMSanitizer`).
- **`src/plugins/`**: Isolated, decoupled plugins extending `PluginInterface`. Each plugin manages its own lifecycle (`init` and `destroy`).
- **`src/ui/`**: Pure UI presentations, accessible modals, and SVG icon registries.
- **`src/index.js`**: Unified entry point exporting modular components.

When introducing a new feature:
1. Always create a new plugin in `src/plugins/<feature_name>/` or an isolated core service.
2. Avoid modifying existing unrelated plugins.
3. Ensure zero external dependencies.

---

## 🚀 Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/wysiwyg-enterprise.git
   cd wysiwyg-enterprise
   ```
3. Open `index.html` in any modern web browser or run a lightweight local static server:
   ```bash
   python -m http.server 8000
   ```
4. Visit `http://localhost:8000` to interact with the live demo.

---

## 📝 Pull Request Guidelines

1. Create a feature branch: `git checkout -b feature/my-new-feature`
2. Follow Clean Architecture and keep functions focused and concise.
3. Update `types/index.d.ts` if your changes touch the public API.
4. Ensure your PR description clearly explains the **problem** and the **solution**.
5. Keep commits clean and descriptive:
   - `feat: add math KaTeX plugin`
   - `fix: prevent selection loss on table cell insertion`
   - `docs: update API documentation`

Thank you for helping make WYSIWYG Enterprise better!
