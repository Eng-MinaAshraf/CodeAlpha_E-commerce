/**
 * معالج الأخطاء العام (Global Error Handler)
 * يلتقط جميع الأخطاء ويعيد استجابة موحدة بصيغة JSON
 * @module middleware/errorHandler
 */

/**
 * خريطة أخطاء Firebase مع رسائل عربية مقابلة
 * تُستخدم لتحويل رموز أخطاء Firebase إلى رسائل مفهومة للمستخدم
 */
const FIREBASE_ERROR_MAP = {
  'auth/user-not-found': {
    status: 404,
    message: 'المستخدم غير موجود | User not found',
  },
  'auth/wrong-password': {
    status: 401,
    message: 'كلمة المرور غير صحيحة | Wrong password',
  },
  'auth/email-already-in-use': {
    status: 409,
    message: 'البريد الإلكتروني مستخدم بالفعل | Email already in use',
  },
  'auth/weak-password': {
    status: 400,
    message: 'كلمة المرور ضعيفة جداً | Password too weak',
  },
  'auth/invalid-email': {
    status: 400,
    message: 'البريد الإلكتروني غير صالح | Invalid email',
  },
  'auth/id-token-expired': {
    status: 401,
    message: 'انتهت صلاحية الجلسة | Session expired',
  },
  'auth/id-token-revoked': {
    status: 401,
    message: 'تم إلغاء الجلسة | Session revoked',
  },
  'auth/insufficient-permission': {
    status: 403,
    message: 'صلاحيات غير كافية | Insufficient permissions',
  },
  'not-found': {
    status: 404,
    message: 'المورد المطلوب غير موجود | Resource not found',
  },
  'permission-denied': {
    status: 403,
    message: 'ليس لديك صلاحية لهذا الإجراء | Permission denied',
  },
  'already-exists': {
    status: 409,
    message: 'العنصر موجود بالفعل | Already exists',
  },
  'resource-exhausted': {
    status: 429,
    message: 'تم تجاوز الحد المسموح - حاول لاحقاً | Rate limit exceeded',
  },
  'unavailable': {
    status: 503,
    message: 'الخدمة غير متاحة حالياً | Service unavailable',
  },
};

/**
 * وسيط معالجة الأخطاء العام
 * @param {Error} err - كائن الخطأ
 * @param {import('express').Request} req - كائن الطلب
 * @param {import('express').Response} res - كائن الاستجابة
 * @param {import('express').NextFunction} next - الدالة التالية
 */
const errorHandler = (err, req, res, next) => {
  // تسجيل الخطأ في وحدة التحكم للتتبع
  console.error('❌ خطأ:', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // التحقق مما إذا كان الخطأ من Firebase
  const firebaseError = FIREBASE_ERROR_MAP[err.code];

  if (firebaseError) {
    return res.status(firebaseError.status).json({
      success: false,
      message: firebaseError.message,
      code: err.code,
    });
  }

  // معالجة أخطاء التحقق من البيانات (Validation errors)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة | Invalid data',
      code: 'VALIDATION_ERROR',
      errors: err.errors,
    });
  }

  // معالجة أخطاء JSON غير الصالحة في الطلب
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'صيغة JSON غير صالحة في الطلب | Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
  }

  // معالجة أخطاء حجم الملف (Multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم الملف كبير جداً | File too large',
      code: 'FILE_TOO_LARGE',
    });
  }

  // الخطأ الافتراضي - خطأ داخلي في الخادم
  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    message: statusCode === 500
      ? 'حدث خطأ داخلي في الخادم | Internal server error'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
  };

  // في بيئة التطوير، نضيف تفاصيل الخطأ الكاملة للمساعدة في التصحيح
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.message;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
