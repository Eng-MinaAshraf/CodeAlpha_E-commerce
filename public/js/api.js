/**
 * @fileoverview Centralized API service
 * @description خدمة API مركزية لجميع طلبات الخادم
 * @module api
 */

import { authManager } from "./auth.js";
import { toast } from "./toast.js";

/** @type {string} Base URL for all API endpoints */
const API_BASE = "/api";

/**
 * Centralized API service for all server communication
 * Handles authentication headers, error handling, and response parsing
 */
class ApiService {
  /**
   * Base request method - handles auth, fetch, errors
   * @private
   * @param {string} endpoint - API endpoint path (e.g. '/products')
   * @param {RequestInit} [options={}] - Fetch options
   * @returns {Promise<any>} Parsed JSON response
   * @throws {Error} On network or server errors
   */
  async _request(endpoint, options = {}) {
    try {
      // الحصول على رؤوس المصادقة
      const authHeaders = await authManager.getAuthHeaders();

      // دمج الرؤوس
      const mergedOptions = {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers
        }
      };

      const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);

      // معالجة الاستجابات الفارغة (204 No Content)
      if (response.status === 204) {
        return null;
      }

      // محاولة تحليل الاستجابة كـ JSON
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          (typeof data === "object" && data?.message) ||
          (typeof data === "object" && data?.error) ||
          (typeof data === "string" && data) ||
          this._getErrorMessage(response.status);

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // أخطاء الشبكة (لا اتصال بالإنترنت، خادم غير متاح)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error("خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت");
      } else if (!error.message?.includes("خطأ")) {
        // تجنب عرض التوست مرتين إذا تم عرضه بالفعل أعلاه
        console.error(`API Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  /**
   * Get user-friendly error message based on HTTP status code
   * @private
   * @param {number} status - HTTP status code
   * @returns {string} Arabic error message
   */
  _getErrorMessage(status) {
    const messages = {
      400: "طلب غير صالح. يرجى التحقق من البيانات المدخلة",
      401: "غير مصرح. يرجى تسجيل الدخول مرة أخرى",
      403: "ليس لديك صلاحية للوصول إلى هذا المورد",
      404: "المورد المطلوب غير موجود",
      409: "تعارض في البيانات. يرجى المحاولة مرة أخرى",
      422: "بيانات غير صالحة. يرجى التحقق من المدخلات",
      429: "عدد كبير من الطلبات. يرجى الانتظار قليلاً",
      500: "خطأ في الخادم. يرجى المحاولة لاحقاً",
      502: "خطأ في البوابة. يرجى المحاولة لاحقاً",
      503: "الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً"
    };
    return messages[status] || `حدث خطأ غير متوقع (${status})`;
  }

  /**
   * Send a GET request
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<any>}
   */
  async get(endpoint) {
    return this._request(endpoint, { method: "GET" });
  }

  /**
   * Send a POST request with JSON body
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<any>}
   */
  async post(endpoint, data) {
    return this._request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  /**
   * Send a PUT request with JSON body
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<any>}
   */
  async put(endpoint, data) {
    return this._request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  /**
   * Send a DELETE request
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<any>}
   */
  async delete(endpoint) {
    return this._request(endpoint, { method: "DELETE" });
  }

  /* ═══════════════════════════════════════════════════════════
   *  Products API
   * ═══════════════════════════════════════════════════════════ */

  /** @namespace products */
  products = {
    /**
     * Get all products with optional filtering/sorting
     * @param {Object} [params={}] - Query parameters
     * @param {string} [params.category] - تصفية حسب الفئة
     * @param {string} [params.sort] - ترتيب النتائج
     * @param {string} [params.search] - نص البحث
     * @param {number} [params.page] - رقم الصفحة
     * @param {number} [params.limit] - عدد العناصر لكل صفحة
     * @returns {Promise<Object>} Products list response
     */
    getAll: async (params = {}) => {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ).toString();
      const endpoint = queryString ? `/products?${queryString}` : "/products";
      return this._request(endpoint, { method: "GET" });
    },

    /**
     * Get a single product by ID
     * @param {string} id - معرّف المنتج
     * @returns {Promise<Object>} Product data
     */
    getById: async (id) => {
      return this._request(`/products/${id}`, { method: "GET" });
    },

    /**
     * Create a new product
     * @param {Object} data - بيانات المنتج
     * @returns {Promise<Object>} Created product
     */
    create: async (data) => {
      return this._request("/products", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },

    /**
     * Update an existing product
     * @param {string} id - معرّف المنتج
     * @param {Object} data - البيانات المحدّثة
     * @returns {Promise<Object>} Updated product
     */
    update: async (id, data) => {
      return this._request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete a product
     * @param {string} id - معرّف المنتج
     * @returns {Promise<any>}
     */
    delete: async (id) => {
      return this._request(`/products/${id}`, { method: "DELETE" });
    },

    /**
     * Upload product images
     * @param {FileList|Array<File>} files - ملفات الصور
     * @returns {Promise<Object>} Upload result with image URLs
     */
    uploadImages: async (files) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      // الحصول على رأس المصادقة فقط (بدون Content-Type ليتم تعيينه تلقائياً)
      const token = await authManager.getIdToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/products/upload-images`, {
        method: "POST",
        headers,
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.message || "فشل في رفع الصور";
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      return response.json();
    }
  };

  /* ═══════════════════════════════════════════════════════════
   *  Cart API
   * ═══════════════════════════════════════════════════════════ */

  /** @namespace cart */
  cart = {
    /**
     * Get the current user's cart
     * @returns {Promise<Object>} Cart data
     */
    get: async () => {
      return this._request("/cart", { method: "GET" });
    },

    /**
     * Add an item to the cart
     * @param {Object} item - عنصر السلة { productId, quantity, ... }
     * @returns {Promise<Object>}
     */
    add: async (item) => {
      return this._request("/cart/add", {
        method: "POST",
        body: JSON.stringify(item)
      });
    },

    /**
     * Update item quantity in the cart
     * @param {string} productId - معرّف المنتج
     * @param {number} quantity - الكمية الجديدة
     * @returns {Promise<Object>}
     */
    update: async (productId, quantity) => {
      return this._request("/cart/update", {
        method: "PUT",
        body: JSON.stringify({ productId, quantity })
      });
    },

    /**
     * Remove an item from the cart
     * @param {string} productId - معرّف المنتج
     * @returns {Promise<any>}
     */
    remove: async (productId) => {
      return this._request(`/cart/remove/${productId}`, { method: "DELETE" });
    },

    /**
     * Clear all items from the cart
     * @returns {Promise<any>}
     */
    clear: async () => {
      return this._request("/cart/clear", { method: "DELETE" });
    }
  };

  /* ═══════════════════════════════════════════════════════════
   *  Orders API
   * ═══════════════════════════════════════════════════════════ */

  /** @namespace orders */
  orders = {
    /**
     * Create a new order
     * @param {Object} orderData - بيانات الطلب
     * @returns {Promise<Object>} Created order
     */
    create: async (orderData) => {
      return this._request("/orders", {
        method: "POST",
        body: JSON.stringify(orderData)
      });
    },

    /**
     * Get all orders for the current user
     * @returns {Promise<Array>} List of orders
     */
    getAll: async () => {
      return this._request("/orders", { method: "GET" });
    },

    /**
     * Get a single order by ID
     * @param {string} id - معرّف الطلب
     * @returns {Promise<Object>} Order data
     */
    getById: async (id) => {
      return this._request(`/orders/${id}`, { method: "GET" });
    },

    /**
     * Cancel an order
     * @param {string} id - معرّف الطلب
     * @returns {Promise<Object>}
     */
    cancel: async (id) => {
      return this._request(`/orders/${id}/cancel`, { method: "PUT" });
    }
  };

  /* ═══════════════════════════════════════════════════════════
   *  Auth / Profile API
   * ═══════════════════════════════════════════════════════════ */

  /** @namespace auth */
  auth = {
    /**
     * Get the current user's profile
     * @returns {Promise<Object>} User profile data
     */
    getProfile: async () => {
      return this._request("/auth/profile", { method: "GET" });
    },

    /**
     * Update the current user's profile
     * @param {Object} data - بيانات الملف الشخصي المحدّثة
     * @returns {Promise<Object>}
     */
    updateProfile: async (data) => {
      return this._request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },

    /**
     * Create a new user profile
     * @param {Object} data - بيانات الملف الشخصي الجديد
     * @returns {Promise<Object>}
     */
    createProfile: async (data) => {
      return this._request("/auth/profile", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  };
}

/** @type {ApiService} Singleton API service instance */
export const api = new ApiService();
