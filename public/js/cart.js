/**
 * @fileoverview Cart manager with Backend API + localStorage dual support
 * @description مدير سلة التسوق - يدعم API السيرفر للمستخدمين المسجلين و localStorage للضيوف
 * @module cart
 */

import { api } from "./api.js";
import { authManager } from "./auth.js";
import { toast } from "./toast.js";

const GUEST_CART_KEY = "guestCart";

class CartManager {
  constructor() {
    this.items = [];
    this.listeners = [];
    this.userId = null;
  }

  init() {
    // مراقبة تسجيل الدخول
    authManager.onAuthChange((user) => {
      if (user) {
        this.userId = user.id;
        this._loadFromApi();
      } else {
        this.userId = null;
        this._loadFromLocalStorage();
        this.updateBadge();
        this._notifyListeners();
      }
    });
  }

  async _loadFromApi() {
    try {
      const response = await api.cart.get();
      this.items = response.data || [];
      this.updateBadge();
      this._notifyListeners();
    } catch (error) {
      console.error("خطأ في جلب السلة من الخادم:", error);
      this._loadFromLocalStorage();
    }
  }

  getItems() {
    return [...this.items];
  }

  getCount() {
    return this.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  getSubtotal() {
    return this.items.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0
    );
  }

  async addItem(product, quantity = 1) {
    try {
      if (!product || !product.id) {
        toast.error("بيانات المنتج غير صالحة");
        return;
      }

      const existingIndex = this.items.findIndex((item) => item.id === product.id || item.product_id === product.id);

      if (existingIndex > -1) {
        const newQuantity = this.items[existingIndex].quantity + quantity;
        await this.updateQuantity(product.id, newQuantity);
        toast.success(`تم تحديث كمية "${product.name}" في السلة`);
      } else {
        const cartItem = {
          productId: product.id,
          name: product.name || "منتج بدون اسم",
          price: Number(product.price) || 0,
          image: product.image || "",
          quantity: quantity
        };

        if (this.userId) {
          const res = await api.cart.add(cartItem);
          // Api returns updated cart items usually, but let's just push it and reload
          this.items.push(res.data);
          // Better yet, reload from api to ensure consistency
          this._loadFromApi();
        } else {
          // localStorage uses generic id
          this.items.push({ id: product.id, ...cartItem });
          this._saveToLocalStorage();
        }

        this.updateBadge();
        this._notifyListeners();
        toast.success(`تمت إضافة "${product.name}" إلى السلة`);
      }

      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { action: "add", productId: product.id }
        })
      );
    } catch (error) {
      console.error("خطأ في إضافة المنتج:", error);
      toast.error("حدث خطأ أثناء إضافة المنتج إلى السلة");
    }
  }

  async updateQuantity(productId, quantity) {
    try {
      if (quantity <= 0) {
        await this.removeItem(productId);
        return;
      }

      if (this.userId) {
        await api.cart.update(productId, quantity);
        const index = this.items.findIndex((item) => item.product_id === productId || item.id === productId || item.productId === productId);
        if (index > -1) {
          this.items[index].quantity = quantity;
        }
      } else {
        const index = this.items.findIndex((item) => item.id === productId || item.productId === productId);
        if (index > -1) {
          this.items[index].quantity = quantity;
          this._saveToLocalStorage();
        }
      }

      this.updateBadge();
      this._notifyListeners();

      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { action: "update", productId, quantity }
        })
      );
    } catch (error) {
      console.error("خطأ في تحديث كمية المنتج:", error);
      toast.error("حدث خطأ أثناء تحديث الكمية");
    }
  }

  async removeItem(productId) {
    try {
      const removedItem = this.items.find((item) => item.id === productId || item.product_id === productId || item.productId === productId);

      if (this.userId) {
        await api.cart.remove(productId);
        this.items = this.items.filter((item) => item.product_id !== productId && item.id !== productId && item.productId !== productId);
      } else {
        this.items = this.items.filter((item) => item.id !== productId && item.productId !== productId);
        this._saveToLocalStorage();
      }

      this.updateBadge();
      this._notifyListeners();

      if (removedItem) {
        toast.info(`تمت إزالة "${removedItem.name}" من السلة`);
      }

      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { action: "remove", productId }
        })
      );
    } catch (error) {
      console.error("خطأ في إزالة المنتج:", error);
      toast.error("حدث خطأ أثناء إزالة المنتج");
    }
  }

  async clear() {
    try {
      if (this.userId) {
        await api.cart.clear();
      } else {
        localStorage.removeItem(GUEST_CART_KEY);
      }

      this.items = [];
      this.updateBadge();
      this._notifyListeners();

      toast.info("تم إفراغ سلة التسوق");

      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { action: "clear" }
        })
      );
    } catch (error) {
      console.error("خطأ في إفراغ السلة:", error);
      toast.error("حدث خطأ أثناء إفراغ السلة");
    }
  }

  _saveToLocalStorage() {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(this.items));
    } catch (error) {
      console.error("خطأ في حفظ السلة في التخزين المحلي:", error);
    }
  }

  _loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.items = parsed;
        }
      } else {
        this.items = [];
      }
    } catch (error) {
      console.error("خطأ في تحميل السلة من التخزين المحلي:", error);
      this.items = [];
    }
  }

  async mergeGuestCart(userId) {
    try {
      const guestItems = [];
      const stored = localStorage.getItem(GUEST_CART_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          guestItems.push(...parsed);
        }
      }

      if (guestItems.length === 0) return;

      for (const item of guestItems) {
        try {
          await api.cart.add({
            productId: item.id || item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity || 1
          });
        } catch (e) {
          console.error("Failed to merge item", item, e);
        }
      }

      localStorage.removeItem(GUEST_CART_KEY);
      this._loadFromApi(); // تحديث السلة من الخادم
      
      toast.success("تم دمج سلة التسوق بنجاح");
    } catch (error) {
      console.error("خطأ في دمج سلة الضيف:", error);
    }
  }

  _notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.items);
      } catch (error) {
        console.error("خطأ في مستمع تغييرات السلة:", error);
      }
    });
  }

  onChange(callback) {
    if (typeof callback !== "function") return () => {};
    this.listeners.push(callback);
    try {
      callback(this.items);
    } catch (error) {}
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  updateBadge() {
    const count = this.getCount();
    const badges = document.querySelectorAll(".cart-count");

    badges.forEach((badge) => {
      badge.textContent = count > 99 ? "99+" : count.toString();
      if (count > 0) {
        badge.classList.add("has-items");
        badge.removeAttribute("hidden");
      } else {
        badge.classList.remove("has-items");
        badge.setAttribute("hidden", "");
      }
      badge.setAttribute("aria-label", `${count} عنصر في السلة`);
    });
  }
}

export const cartManager = new CartManager();
cartManager.init();
