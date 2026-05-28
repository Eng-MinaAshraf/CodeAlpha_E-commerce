/**
 * وسيط المصادقة (Authentication Middleware)
 * يتحقق من هوية المستخدم عبر رمز Supabase JWT
 * @module middleware/auth
 */

import { supabase } from '../config/supabase.js';

/**
 * استخراج رمز المصادقة من ترويسة الطلب
 * @param {import('express').Request} req - كائن الطلب
 * @returns {string|null} رمز المصادقة أو null إذا لم يوجد
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split('Bearer ')[1];
  }

  return null;
};

/**
 * وسيط المصادقة الإلزامية
 * يمنع الوصول إذا لم يكن المستخدم مسجل الدخول
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - يرجى تسجيل الدخول | Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // التحقق من صحة الرمز وجلب بيانات المستخدم عبر Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح أو منتهي | Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // إرفاق بيانات المستخدم بكائن الطلب
    req.user = {
      uid: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      emailVerified: user.email_confirmed_at != null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * وسيط المصادقة الاختيارية
 * يسمح بالوصول بدون مصادقة لكن يرفق بيانات المستخدم إذا كان الرمز موجوداً
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          uid: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          emailVerified: user.email_confirmed_at != null,
        };
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * وسيط مصادقة المدير (Admin Authentication)
 * يسمح بالوصول فقط إذا كان المستخدم مسجل الدخول وهو المدير
 */
export const requireAdmin = async (req, res, next) => {
  // أولاً نمرر الطلب على مصادقة الدخول العادية
  requireAuth(req, res, () => {
    // بعد التأكد من تسجيل الدخول، نتحقق من الإيميل
    if (req.user && req.user.email === 'admin@store.com') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'ممنوع الوصول - هذه الصفحة مخصصة لمدير الموقع فقط | Access Denied',
        code: 'FORBIDDEN',
      });
    }
  });
};
