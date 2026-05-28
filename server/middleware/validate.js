/**
 * وسيط التحقق من صحة البيانات (Validation Middleware)
 * يستخدم express-validator للتحقق من المدخلات قبل معالجتها
 * @module middleware/validate
 */

import { body, validationResult } from 'express-validator';

/**
 * الفئات المسموح بها للمنتجات
 * يجب أن تتطابق مع الفئات المعروضة في الواجهة الأمامية
 */
const ALLOWED_CATEGORIES = [
  'electronics',    // إلكترونيات
  'clothing',       // ملابس
  'home',           // منزل ومطبخ
  'beauty',         // جمال وعناية
  'sports',         // رياضة
  'books',          // كتب
  'toys',           // ألعاب
  'food',           // طعام
  'accessories',    // إكسسوارات
  'other',          // أخرى
];

/**
 * قواعد التحقق من بيانات المنتج
 * تُطبق عند إنشاء أو تعديل منتج
 */
export const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('اسم المنتج مطلوب | Product name is required')
    .isLength({ min: 2 })
    .withMessage('يجب أن يكون اسم المنتج حرفين على الأقل | Product name must be at least 2 characters'),

  body('price')
    .notEmpty()
    .withMessage('السعر مطلوب | Price is required')
    .isFloat({ gt: 0 })
    .withMessage('يجب أن يكون السعر أكبر من صفر | Price must be greater than 0'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('الفئة مطلوبة | Category is required')
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`الفئة غير صالحة. الفئات المسموحة: ${ALLOWED_CATEGORIES.join(', ')} | Invalid category`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('الوصف يجب ألا يتجاوز 2000 حرف | Description must not exceed 2000 characters'),

  body('image')
    .optional()
    .isString()
    .withMessage('رابط الصورة غير صالح | Invalid image data'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('الكمية يجب أن تكون رقم صحيح 0 أو أكثر | Stock must be a non-negative integer'),
];

/**
 * قواعد التحقق من بيانات الطلب
 * تُطبق عند إنشاء طلب شراء جديد
 */
export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('يجب أن يحتوي الطلب على عنصر واحد على الأقل | Order must contain at least one item'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('معرف المنتج مطلوب | Product ID is required'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('الكمية يجب أن تكون 1 على الأقل | Quantity must be at least 1'),

  body('shipping')
    .isObject()
    .withMessage('بيانات الشحن مطلوبة | Shipping information is required'),

  body('shipping.name')
    .trim()
    .notEmpty()
    .withMessage('اسم المستلم مطلوب | Recipient name is required'),

  body('shipping.address')
    .trim()
    .notEmpty()
    .withMessage('العنوان مطلوب | Address is required'),

  body('shipping.city')
    .trim()
    .notEmpty()
    .withMessage('المدينة مطلوبة | City is required'),

  body('shipping.phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب | Phone number is required')
    .matches(/^[\d\s\+\-\(\)]{8,20}$/)
    .withMessage('رقم الهاتف غير صالح | Invalid phone number'),
];

/**
 * قواعد التحقق من بيانات التسجيل
 * تُطبق عند إنشاء حساب مستخدم جديد
 */
export const validateAuth = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب | Email is required')
    .isEmail()
    .withMessage('صيغة البريد الإلكتروني غير صالحة | Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة | Password is required')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل | Password must be at least 6 characters'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب | Name is required')
    .isLength({ min: 2 })
    .withMessage('الاسم يجب أن يكون حرفين على الأقل | Name must be at least 2 characters'),
];

/**
 * وسيط فحص نتائج التحقق
 * يُستدعى بعد قواعد التحقق لفحص ما إذا كانت هناك أخطاء
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // تجميع رسائل الأخطاء في مصفوفة مرتبة
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة - يرجى التحقق من المدخلات | Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
    });
  }

  next();
};
