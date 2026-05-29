/**
 * @fileoverview Toast notification system - standalone, no dependencies
 * @description نظام إشعارات التوست - مستقل بدون أي اعتماديات خارجية
 * @module toast
 */

import { supabase } from "./supabase.js";

/**
 * Toast notification manager
 * Provides success, error, warning, and info notifications
 * RTL-aware, positioned at bottom-left for Arabic layouts
 */
class Toast {
  constructor() {
    /** @type {HTMLDivElement|null} */
    this.container = null;
    this._injectStyles();
    this._createContainer();
  }

  /**
   * Create the toast container element and append to body
   * @private
   */
  _createContainer() {
    // تجنب إنشاء حاوية مكررة
    if (document.getElementById("toast-container")) {
      this.container = document.getElementById("toast-container");
      return;
    }

    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.className = "toast-container";
    this.container.setAttribute("role", "alert");
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("aria-atomic", "true");

    // Wait for DOM to be ready
    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(this.container);
      });
    }
  }

  /**
   * Inject toast CSS styles into the document head
   * @private
   */
  _injectStyles() {
    if (document.getElementById("toast-styles")) return;

    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 10000;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
        max-width: 420px;
        width: calc(100% - 48px);
        pointer-events: none;
        direction: rtl;
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        border-right: 4px solid transparent;
        position: relative;
        overflow: hidden;
        pointer-events: all;
        transform: translateX(-120%);
        opacity: 0;
        animation: toast-slide-in 0.4s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
        font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        direction: rtl;
      }

      .toast-exit {
        animation: toast-slide-out 0.3s cubic-bezier(0.06, 0.71, 0.55, 1) forwards;
      }

      @keyframes toast-slide-in {
        from {
          transform: translateX(-120%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toast-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(-120%);
          opacity: 0;
        }
      }

      /* ─── Toast Types ─── */
      .toast-success {
        border-right-color: #22c55e;
        background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      }
      .toast-success .toast-icon {
        background: #dcfce7;
        color: #16a34a;
      }

      .toast-error {
        border-right-color: #ef4444;
        background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
      }
      .toast-error .toast-icon {
        background: #fee2e2;
        color: #dc2626;
      }

      .toast-warning {
        border-right-color: #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
      }
      .toast-warning .toast-icon {
        background: #fef3c7;
        color: #d97706;
      }

      .toast-info {
        border-right-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
      }
      .toast-info .toast-icon {
        background: #dbeafe;
        color: #2563eb;
      }

      /* ─── Icon ─── */
      .toast-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
      }

      /* ─── Content ─── */
      .toast-content {
        flex: 1;
        color: #1f2937;
        word-break: break-word;
        padding-top: 4px;
      }

      /* ─── Close Button ─── */
      .toast-close {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #9ca3af;
        font-size: 18px;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
      }
      .toast-close:hover {
        background: rgba(0, 0, 0, 0.06);
        color: #374151;
      }

      /* ─── Progress Bar ─── */
      .toast-progress {
        position: absolute;
        bottom: 0;
        right: 0;
        height: 3px;
        border-radius: 0 0 12px 0;
        transition: width linear;
      }
      .toast-success .toast-progress { background: #22c55e; }
      .toast-error .toast-progress { background: #ef4444; }
      .toast-warning .toast-progress { background: #f59e0b; }
      .toast-info .toast-progress { background: #3b82f6; }

      /* ─── Responsive ─── */
      @media (max-width: 480px) {
        .toast-container {
          left: 12px;
          right: 12px;
          bottom: 12px;
          max-width: 100%;
          width: calc(100% - 24px);
        }
        .toast {
          padding: 12px 14px;
          font-size: 13px;
        }
      }
    `;

    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.head.appendChild(style);
      });
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {'success'|'error'|'warning'|'info'} [type='info'] - Toast type
   * @param {number} [duration=4000] - Auto-dismiss duration in ms
   * @returns {HTMLDivElement} The toast element
   */
  show(message, type = "info", duration = 4000) {
    // Ensure container exists in the DOM
    if (!this.container || !this.container.parentNode) {
      this._createContainer();
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");

    // Icon
    const iconEl = document.createElement("span");
    iconEl.className = "toast-icon";
    iconEl.innerHTML = this._getIcon(type);
    iconEl.setAttribute("aria-hidden", "true");

    // Content
    const contentEl = document.createElement("span");
    contentEl.className = "toast-content";
    contentEl.textContent = message;

    // Close button
    const closeEl = document.createElement("button");
    closeEl.className = "toast-close";
    closeEl.innerHTML = "×";
    closeEl.setAttribute("aria-label", "إغلاق الإشعار");
    closeEl.addEventListener("click", () => this._removeToast(toastEl));

    // Progress bar
    const progressEl = document.createElement("div");
    progressEl.className = "toast-progress";
    progressEl.style.width = "100%";

    // Assemble
    toastEl.appendChild(iconEl);
    toastEl.appendChild(contentEl);
    toastEl.appendChild(closeEl);
    toastEl.appendChild(progressEl);

    this.container.appendChild(toastEl);

    // Animate progress bar
    requestAnimationFrame(() => {
      progressEl.style.transitionDuration = `${duration}ms`;
      progressEl.style.width = "0%";
    });

    // Pause on hover
    let dismissTimer;
    let remainingTime = duration;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      dismissTimer = setTimeout(() => this._removeToast(toastEl), remainingTime);
    };

    const pauseTimer = () => {
      clearTimeout(dismissTimer);
      remainingTime -= Date.now() - startTime;
      progressEl.style.transitionDuration = "0ms";
      const progressPercent = (remainingTime / duration) * 100;
      progressEl.style.width = `${Math.max(0, progressPercent)}%`;
    };

    const resumeTimer = () => {
      progressEl.style.transitionDuration = `${remainingTime}ms`;
      progressEl.style.width = "0%";
      startTimer();
    };

    toastEl.addEventListener("mouseenter", pauseTimer);
    toastEl.addEventListener("mouseleave", resumeTimer);

    // Auto-dismiss
    startTimer();

    // Limit visible toasts to 5
    const toasts = this.container.querySelectorAll(".toast:not(.toast-exit)");
    if (toasts.length > 5) {
      this._removeToast(toasts[0]);
    }

    return toastEl;
  }

  /**
   * Show a success toast
   * @param {string} message - نص الإشعار
   */
  success(message) {
    return this.show(message, "success");
  }

  /**
   * Show an error toast
   * @param {string} message - نص الإشعار
   */
  error(message) {
    return this.show(message, "error", 6000);
  }

  /**
   * Show a warning toast
   * @param {string} message - نص الإشعار
   */
  warning(message) {
    return this.show(message, "warning", 5000);
  }

  /**
   * Show an info toast
   * @param {string} message - نص الإشعار
   */
  info(message) {
    return this.show(message, "info");
  }

  /**
   * Get the icon HTML for a given toast type
   * @private
   * @param {'success'|'error'|'warning'|'info'} type
   * @returns {string} Icon HTML
   */
  _getIcon(type) {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ"
    };
    return icons[type] || icons.info;
  }

  /**
   * Remove a toast with slide-out animation
   * @private
   * @param {HTMLDivElement} element - The toast element to remove
   */
  _removeToast(element) {
    if (!element || element.classList.contains("toast-exit")) return;

    element.classList.add("toast-exit");

    element.addEventListener(
      "animationend",
      () => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      },
      { once: true }
    );

    // Fallback removal if animation doesn't fire
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 400);
  }
}

/** @type {Toast} Singleton toast instance */
export const toast = new Toast();
