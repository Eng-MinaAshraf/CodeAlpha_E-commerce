/**
 * إعداد Firebase Admin SDK
 * ملف التهيئة الرئيسي لربط الخادم بخدمات Firebase
 * @module config/firebase-admin
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * تهيئة تطبيق Firebase Admin
 * يتم اختيار طريقة المصادقة بناءً على متغيرات البيئة المتاحة
 */
let app;

try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔑 تهيئة Firebase باستخدام ملف حساب الخدمة المباشر...');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // الطريقة الأولى: استخدام ملف حساب الخدمة (Service Account)
    // يُستخدم عندما يكون ملف المفتاح متاحاً في متغير البيئة
    console.log('🔑 تهيئة Firebase باستخدام ملف حساب الخدمة...');
    app = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // الطريقة الثانية: استخدام مفتاح JSON مباشرة من متغير البيئة
    console.log('🔑 تهيئة Firebase باستخدام مفتاح JSON...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // الطريقة الثالثة: التهيئة بمعرف المشروع فقط
    // تعمل عند النشر على Google Cloud أو في بيئة التطوير المحلية
    console.log('🔑 تهيئة Firebase بمعرف المشروع فقط...');
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  console.log('✅ تم تهيئة Firebase Admin بنجاح');
} catch (error) {
  console.error('❌ خطأ في تهيئة Firebase Admin:', error.message);
  process.exit(1);
}

// قاعدة بيانات Firestore - المخزن الرئيسي للبيانات
const db = getFirestore(app);

// خدمة المصادقة - للتحقق من هوية المستخدمين
const adminAuth = getAuth(app);

export { db, adminAuth };
