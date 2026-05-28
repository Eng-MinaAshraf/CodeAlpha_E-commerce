/**
 * @fileoverview Shared utility functions
 * @description دوال مساعدة مشتركة للمتجر الإلكتروني
 * @module utils
 */

/**
 * Format a numeric amount as a price string
 * @param {number} amount - المبلغ الرقمي
 * @returns {string} Formatted price string, e.g. '$25.00'
 * @example formatPrice(25) // '$25.00'
 */
export function formatPrice(amount) {
  const num = Number(amount);
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

/**
 * Format a Firestore Timestamp or Date object to an Arabic locale date string
 * @param {Object|Date|{seconds: number, nanoseconds: number}} timestamp - Firestore Timestamp or JS Date
 * @returns {string} Formatted Arabic date string
 * @example formatDate(new Date()) // '٢٧ مايو ٢٠٢٦'
 */
export function formatDate(timestamp) {
  try {
    let date;

    if (!timestamp) return "غير محدد";

    // Firestore Timestamp object
    if (timestamp && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    }
    // Firestore-like object with seconds
    else if (timestamp && typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    }
    // Already a Date
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // ISO string or number
    else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "تاريخ غير صالح";

    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return "تاريخ غير صالح";
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param {string} text - النص المراد اختصاره
 * @param {number} [maxLength=80] - الحد الأقصى لعدد الأحرف
 * @returns {string} Truncated text
 * @example truncateText('نص طويل جداً...', 10) // 'نص طويل جد...'
 */
export function truncateText(text, maxLength = 80) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Standard debounce function
 * @param {Function} fn - الدالة المراد تأخيرها
 * @param {number} [delay=300] - مدة التأخير بالميلي ثانية
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;

  const debounced = function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };

  /** Cancel the pending debounce */
  debounced.cancel = function () {
    clearTimeout(timeoutId);
  };

  return debounced;
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} str - النص المراد تعقيمه
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * Translate category from english key to Arabic display name
 * @param {string} cat - Category key
 * @returns {string} Arabic name
 */
export function translateCategory(cat) {
  const map = {
    'electronics': 'إلكترونيات',
    'clothing': 'ملابس',
    'shoes': 'أحذية',
    'books': 'كتب',
    'furniture': 'أثاث',
    'beauty': 'مستحضرات تجميل',
    'toys': 'ألعاب'
  };
  return map[cat] || cat;
}

/**
 * Generate a unique order ID in the format 'ORD-YYYY-XXXX'
 * @returns {string} Generated order ID
 * @example generateOrderId() // 'ORD-2026-4821'
 */
export function generateOrderId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `ORD-${year}-${random}`;
}

/**
 * Validate an email address using regex
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate a password and return validity + strength
 * @param {string} password - كلمة المرور
 * @returns {{ valid: boolean, strength: 'weak'|'medium'|'strong' }}
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, strength: "weak" };
  }

  const valid = password.length >= 6;
  const strength = getPasswordStrength(password);

  return { valid, strength };
}

/**
 * Evaluate password strength based on length and complexity
 * @param {string} password - كلمة المرور
 * @returns {'weak'|'medium'|'strong'} Password strength level
 */
export function getPasswordStrength(password) {
  if (!password || typeof password !== "string") return "weak";

  let score = 0;

  // Length checks
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;

  // Complexity checks
  if (/[a-z]/.test(password)) score++;        // أحرف صغيرة
  if (/[A-Z]/.test(password)) score++;        // أحرف كبيرة
  if (/[0-9]/.test(password)) score++;        // أرقام
  if (/[^a-zA-Z0-9]/.test(password)) score++; // رموز خاصة

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

/**
 * Create skeleton loading card HTML elements
 * @param {number} [count=8] - عدد البطاقات المراد إنشاؤها
 * @returns {string} HTML string of skeleton loading cards
 */
export function createSkeletonCards(count = 8) {
  const skeletonCard = `
    <div class="skeleton-card" aria-hidden="true" role="presentation">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton-row">
          <div class="skeleton skeleton-price"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    </div>
  `;

  return skeletonCard.repeat(count);
}

/**
 * Promise-based delay
 * @param {number} ms - مدة الانتظار بالميلي ثانية
 * @returns {Promise<void>}
 * @example await sleep(1000) // انتظار ثانية واحدة
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get URL search parameter value
 * @param {string} param - اسم المعامل
 * @returns {string|null} قيمة المعامل أو null
 */
export function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Update URL search parameter without reloading the page
 * @param {string} param - اسم المعامل
 * @param {string} value - قيمة المعامل
 */
export function updateUrlParam(param, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  window.history.pushState({}, '', url);
}

/**
 * Show a custom confirmation modal
 * @param {string} title - عنوان النافذة
 * @param {string} message - نص الرسالة
 * @param {Function} onConfirm - الدالة التي ستنفذ عند التأكيد
 */
export function customConfirm(title, message, onConfirm) {
  const modalHTML = `
    <div class="modal-overlay active confirm-modal-overlay" style="z-index: 1000; opacity: 1; pointer-events: auto;">
      <div class="modal-content text-center" style="transform: scale(1); max-width: 400px;">
        <div class="empty-state-icon text-warning mb-md" style="font-size: 3rem;">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="mb-sm">${title}</h3>
        <p class="text-secondary mb-xl">${message}</p>
        <div class="flex-center gap-md">
          <button class="btn btn-outline" id="confirm-cancel-btn">إلغاء</button>
          <button class="btn btn-primary" id="confirm-ok-btn">تأكيد</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const overlay = document.querySelector('.confirm-modal-overlay:last-child');
  
  const cleanup = () => {
    overlay.style.opacity = '0';
    overlay.querySelector('.modal-content').style.transform = 'scale(0.9)';
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#confirm-cancel-btn').addEventListener('click', cleanup);
  overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
}
