/**
 * EventEmitter
 * Pure event bus implementation for editor life-cycle and decoupled plugin communication.
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this._events.has(event)) {
      this._events.get(event).delete(handler);
    }
  }

  emit(event, ...args) {
    if (this._events.has(event)) {
      for (const handler of this._events.get(event)) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[WYSIWYG Event Error] in "${event}":`, err);
        }
      }
    }
  }

  destroy() {
    this._events.clear();
  }
}
