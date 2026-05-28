/**
 * @fileoverview Authentication state manager
 * @description مدير حالة المصادقة - يتتبع حالة تسجيل الدخول ويحدّث واجهة المستخدم عبر Supabase
 * @module auth
 */

import { supabase } from "./supabase.js";
import { toast } from "./toast.js";
import { customConfirm } from "./utils.js";

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.listeners = [];
    this.initialized = false;
    this._readyPromise = null;
    this._readyResolve = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this._readyPromise = new Promise((resolve) => {
      this._readyResolve = resolve;
    });

    // جلب الجلسة الحالية أولاً
    supabase.auth.getSession().then(({ data: { session } }) => {
      this._handleSession(session);
      
      if (this._readyResolve) {
        this._readyResolve();
        this._readyResolve = null;
      }
    });

    // الاستماع لتغيرات حالة المصادقة (تسجيل الدخول / الخروج)
    supabase.auth.onAuthStateChange((event, session) => {
      this._handleSession(session);
    });
  }

  _handleSession(session) {
    this.currentSession = session;
    if (session && session.user) {
      this.currentUser = session.user;
      this.updateNavbar(session.user);
      this._notifyListeners(session.user);

      // Save email silently so Admin can see it in users list and check completion
      if (session.user.email) {
        this.getAuthHeaders().then(headers => {
          fetch('/api/auth/profile', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ 
              email: session.user.email,
              name: session.user.user_metadata?.full_name 
            })
          })
          .then(res => res.json())
          .then(response => {
            if (session.user.email !== 'admin@store.com' && response.data) {
              const profile = response.data;
              if (!profile.phone || !profile.address) {
                const isProfilePage = window.location.pathname.includes('/profile.html');
                if (!isProfilePage) {
                  window.location.replace('/pages/profile.html?incomplete=true');
                }
              } else {
                if (window.location.pathname.includes('/profile.html') && window.location.search.includes('incomplete=true')) {
                  window.location.replace('/pages/profile.html');
                }
              }
            }
          })
          .catch(e => console.warn('Could not sync email to profile:', e));
        });
      }
    } else {
      this.currentUser = null;
      this.updateNavbar(null);
      this._notifyListeners(null);
    }
  }

  async waitUntilReady() {
    if (this._readyPromise) {
      await this._readyPromise;
    }
  }

  async logout() {
    customConfirm(
      'تسجيل الخروج', 
      'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟', 
      async () => {
        try {
          await supabase.auth.signOut();
          toast.success('تم تسجيل الخروج بنجاح');
          window.location.href = '/pages/login.html';
        } catch (error) {
          toast.error('حدث خطأ أثناء تسجيل الخروج');
        }
      }
    );
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async getIdToken() {
    try {
      // إرجاع توكن الجلسة الحالية (JWT)
      if (!this.currentSession) return null;
      return this.currentSession.access_token;
    } catch (error) {
      console.error("خطأ في الحصول على رمز المصادقة:", error);
      return null;
    }
  }

  requireAuth(redirectUrl = "/pages/login.html") {
    if (!this.currentUser) {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("redirectAfterLogin", currentPath);

      toast.warning("يرجى تسجيل الدخول أولاً");
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  onAuthChange(callback) {
    if (typeof callback !== "function") {
      console.error("onAuthChange يتطلب دالة callback");
      return () => {};
    }

    this.listeners.push(callback);

    if (this.initialized && this._readyResolve === null) {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error("خطأ في مستمع حالة المصادقة:", error);
      }
    }

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  updateNavbar(user) {
    const userSections = document.querySelectorAll(".navbar-logged, #navbar-logged");
    const guestSections = document.querySelectorAll(".navbar-guest, #navbar-guest");
    const userNameEls = document.querySelectorAll(".navbar-user-name, #nav-user-name");
    const userAvatarEls = document.querySelectorAll(".navbar-user-avatar, #nav-user-photo");
    const logoutBtns = document.querySelectorAll(".navbar-logout-btn, #nav-logout-btn");
    const adminLink = document.getElementById('nav-admin-panel');

    if (user) {
      userSections.forEach((el) => {
        el.style.display = "";
        el.removeAttribute("hidden");
      });
      guestSections.forEach((el) => {
        el.style.display = "none";
        el.setAttribute("hidden", "");
      });

      if (adminLink) {
        adminLink.style.display = user.email === 'admin@store.com' ? 'block' : 'none';
      }

      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "مستخدم";
      userNameEls.forEach((el) => {
        el.textContent = displayName;
      });

      const avatarUrl = user.user_metadata?.avatar_url;
      userAvatarEls.forEach((el) => {
        if (avatarUrl) {
          el.src = avatarUrl;
          el.alt = displayName;
        } else {
          el.src = "";
          el.alt = displayName;
          el.style.display = "none";

          let textAvatar = el.parentElement?.querySelector(".navbar-avatar-text");
          if (!textAvatar) {
            textAvatar = document.createElement("span");
            textAvatar.className = "navbar-avatar-text";
            textAvatar.setAttribute("aria-hidden", "true");
            el.parentElement?.insertBefore(textAvatar, el);
          }
          textAvatar.textContent = displayName.charAt(0).toUpperCase();
        }
      });

        logoutBtns.forEach((btn) => {
        btn.style.display = "";
        // ربط حدث تسجيل الخروج بزر الخروج
        if (!btn.hasAttribute('data-logout-handled')) {
          btn.setAttribute('data-logout-handled', 'true');
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            this.logout();
          });
        }
      });

      // إضافة تفاعل النقر للقائمة المنسدلة
      userSections.forEach((el) => {
        if (!el.hasAttribute('data-dropdown-handled')) {
          el.setAttribute('data-dropdown-handled', 'true');
          el.addEventListener('click', (e) => {
            // منع إغلاق القائمة فوراً عند النقر داخلها
            if (e.target.closest('.navbar-dropdown') && !e.target.id.includes('logout')) return;
            
            const dropdown = el.querySelector('.navbar-dropdown');
            if (dropdown) {
              dropdown.classList.toggle('show');
            }
          });
        }
      });

      // إغلاق القائمة عند النقر في أي مكان خارجها
      if (!window.dropdownClickOutsideHandled) {
        window.dropdownClickOutsideHandled = true;
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.navbar-logged')) {
            document.querySelectorAll('.navbar-dropdown.show').forEach(d => d.classList.remove('show'));
          }
        });
      }
    } else {
      userSections.forEach((el) => {
        el.style.display = "none";
        el.setAttribute("hidden", "");
      });
      guestSections.forEach((el) => {
        el.style.display = "";
        el.removeAttribute("hidden");
      });

      userNameEls.forEach((el) => {
        el.textContent = "";
      });

      logoutBtns.forEach((btn) => {
        btn.style.display = "none";
      });
    }
  }

  async getAuthHeaders() {
    const token = await this.getIdToken();
    const headers = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  _notifyListeners(user) {
    this.listeners.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error("خطأ في مستمع حالة المصادقة:", error);
      }
    });
  }
}

export const authManager = new AuthManager();
authManager.init();
