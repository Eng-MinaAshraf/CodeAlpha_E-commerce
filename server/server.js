/**
 * الخادم الرئيسي (Main Server)
 * نقطة الدخول الرئيسية لتطبيق Express.js
 * خادم API لمتجر إلكتروني عربي مع Firebase كقاعدة بيانات
 * @module server
 */

// تحميل متغيرات البيئة من ملف .env قبل أي شيء آخر
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// استيراد معالج الأخطاء العام
import errorHandler from './middleware/errorHandler.js';

// استيراد مسارات API
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import deliveryRoutes from './routes/delivery.js';

// إعداد __dirname لأن ES Modules لا توفره تلقائياً
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إنشاء تطبيق Express
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// الوسائط العامة (Global Middleware)
// =====================================================

// حماية الترويسات - يضيف ترويسات أمان HTTP
app.use(helmet({
  contentSecurityPolicy: false, // تعطيل CSP للسماح بتحميل الموارد الخارجية
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // السماح لنوافذ المصادقة المنبثقة (Popups) بالتواصل مع الصفحة
}));

// السماح بالطلبات من جميع المصادر (CORS)
app.use(cors({
  origin: true, // السماح بجميع المصادر في التطوير
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// تسجيل الطلبات في وحدة التحكم (Logging)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ضغط الاستجابات لتقليل حجم البيانات المرسلة
app.use(compression());

// تحليل بيانات JSON في جسم الطلب
app.use(express.json({ limit: '10mb' }));

// تحليل بيانات النماذج المشفرة
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// تقديم الملفات الثابتة (Static Files)
// =====================================================

// تقديم ملفات الواجهة الأمامية من مجلد public
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// =====================================================
// مسارات API
// =====================================================

// مسار التحقق من صحة الخادم (Health Check)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'الخادم يعمل بنجاح | Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// تركيب مسارات API
app.use('/api/auth', authRoutes);        // مسارات المصادقة والملف الشخصي
app.use('/api/products', productRoutes); // مسارات المنتجات
app.use('/api/cart', cartRoutes);        // مسارات سلة التسوق
app.use('/api/orders', orderRoutes);     // مسارات الطلبات
app.use('/api/admin', adminRoutes);      // مسارات الإدارة
app.use('/api/delivery', deliveryRoutes);// مسارات التوصيل

// =====================================================
// معالجة المسارات غير الموجودة
// =====================================================

// مسارات API غير موجودة - إرجاع 404 JSON
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود | API endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
});

// أي مسار آخر - إرجاع صفحة index.html (سلوك SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // إذا لم يوجد ملف index.html، إرجاع رسالة ترحيبية
      res.json({
        success: true,
        message: 'مرحباً بك في API متجر إلكتروني | Welcome to E-Commerce Store API',
        endpoints: {
          health: '/api/health',
          products: '/api/products',
          cart: '/api/cart',
          orders: '/api/orders',
          auth: '/api/auth/profile',
        },
      });
    }
  });
});

// =====================================================
// معالج الأخطاء العام
// =====================================================
app.use(errorHandler);

// =====================================================
// بدء تشغيل الخادم
// =====================================================
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                                                  ║');
  console.log(`║   🛒 تم تشغيل خادم المتجر الإلكتروني بنجاح       ║`);
  console.log(`║   📡 المنفذ: ${PORT}                                ║`);
  console.log(`║   🌍 البيئة: ${(process.env.NODE_ENV || 'development').padEnd(16)}          ║`);
  console.log(`║   🔗 http://localhost:${PORT}                      ║`);
  console.log('║                                                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
});

export default app;
