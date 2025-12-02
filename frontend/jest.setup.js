// Polyfill for Web APIs needed by Next.js in Jest environment
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Use node's built-in fetch if available (Node 18+), otherwise polyfill
if (typeof global.fetch === "undefined") {
  // For older Node versions, we'll need to mock fetch
  global.fetch = jest.fn();
}

// Polyfill for Headers
if (typeof global.Headers === "undefined") {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers.set(key.toLowerCase(), value);
        });
      } else if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }

    forEach(callback) {
      this._headers.forEach((value, key) => {
        callback(value, key, this);
      });
    }
  };
}
