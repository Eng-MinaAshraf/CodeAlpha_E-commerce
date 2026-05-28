/**
 * مسارات بوابة التوصيل (Delivery Portal)
 * @module routes/delivery
 */

import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * وسيط التحقق من موظف التوصيل
 * يعتمد على إرسال معرف الموظف كرمز دخول (Token)
 */
const requireDeliveryStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
    }
    
    const staffId = authHeader.split(' ')[1];
    
    // التحقق من وجود الموظف في قاعدة البيانات
    const { data: staff, error } = await supabase
      .from('delivery_staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error || !staff) {
      return res.status(401).json({ success: false, message: 'حساب التوصيل غير صالح أو تم حذفه' });
    }

    req.staff = staff;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/delivery/login
 * تسجيل دخول موظف التوصيل
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد وكلمة المرور' });
    }

    const { data: staff, error } = await supabase
      .from('delivery_staff')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !staff) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // إرجاع بيانات الموظف ومعرفه كـ Token
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token: staff.id,
        name: staff.name,
        email: staff.email
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/delivery/orders
 * جلب الطلبات المتاحة للتوصيل (تم الشحن)
 */
router.get('/orders', requireDeliveryStaff, async (req, res, next) => {
  try {
    // جلب الطلبات التي حالتها shipped فقط
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'shipped')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/delivery/orders/:id/deliver
 * تحويل حالة الطلب إلى (تم التوصيل)
 */
router.put('/orders/:id/deliver', requireDeliveryStaff, async (req, res, next) => {
  try {
    const { id } = req.params;

    // تحديث الحالة
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', id)
      .eq('status', 'shipped') // التأكد من أنه قيد الشحن بالفعل
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'تم تسليم الطلب للعميل بنجاح' });
  } catch (error) {
    next(error);
  }
});

export default router;
