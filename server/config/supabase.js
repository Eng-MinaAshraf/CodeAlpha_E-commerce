/**
 * إعداد Supabase Client
 * ملف التهيئة الرئيسي لربط الخادم بقاعدة بيانات Supabase
 * @module config/supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ خطأ: متغيرات بيئة Supabase مفقودة! تأكد من إضافتها في ملف .env');
  process.exit(1);
}

// إنشاء عميل Supabase
// ملاحظة: في الواجهة الخلفية نفضل استخدام Service Role Key للصلاحيات الكاملة، 
// ولكن لاستخدامك الحالي، مفتاح Anon سيفي بالغرض وسيعتمد على الـ RLS Policies.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ تم تهيئة اتصال Supabase بنجاح');

export { supabase };
