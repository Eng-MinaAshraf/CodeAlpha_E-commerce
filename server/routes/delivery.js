/**
 * مسارات بوابة التوصيل (Delivery Portal)
 * @module routes/delivery
 */

import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

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
      .single();

    if (error || !staff) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // تحقق من صحة كلمة المرور المشفرة مع دعم الرجوع التلقائي للملفات القديمة غير المشفرة
    let isMatch = false;
    if (staff.password.startsWith('$2a$') || staff.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, staff.password);
    } else {
      isMatch = (password === staff.password);
    }

    if (!isMatch) {
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

/**
 * POST /api/delivery/forgot-password/request
 * تقديم طلب جديد لاستعادة كلمة المرور
 */
router.post('/forgot-password/request', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'الاسم الكامل مطلوب' });
    }

    // البحث عن المندوب المطابق بالاسم
    let query = supabase.from('delivery_staff').select('*').ilike('name', name.trim());
    if (email) {
      query = query.eq('email', email.trim());
    }

    const { data: agents, error } = await query;
    if (error || !agents || agents.length === 0) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على حساب مندوب يطابق البيانات المدخلة' });
    }

    const agent = agents[0];

    // التحقق من حد الطلبات اليومي (بحد أقصى 3 طلبات لكل مندوب يومياً)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from('password_recovery_requests')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .gte('created_at', startOfToday.toISOString());

    if (countErr) throw countErr;

    if (count >= 3) {
      return res.status(429).json({ success: false, message: 'لقد تجاوزت الحد الأقصى لطلبات استعادة كلمة المرور اليوم (بحد أقصى 3 طلبات)' });
    }

    // إنشاء طلب استعادة جديد
    const { error: insertErr } = await supabase
      .from('password_recovery_requests')
      .insert({
        agent_id: agent.id,
        agent_name: agent.name,
        agent_email: agent.email,
        status: 'pending'
      });

    if (insertErr) throw insertErr;

    res.json({ success: true, message: 'تم إرسال طلبك إلى المسؤول بنجاح.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/delivery/forgot-password/status
 * التحقق من حالة آخر طلب للمندوب
 */
router.post('/forgot-password/status', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'الاسم الكامل مطلوب' });
    }

    // البحث عن المعرفات
    const { data: agents, error: agentErr } = await supabase
      .from('delivery_staff')
      .select('id')
      .ilike('name', name.trim());

    if (agentErr || !agents || agents.length === 0) {
      return res.json({ success: true, status: 'NOT_FOUND' });
    }

    const agentIds = agents.map(a => a.id);

    // جلب آخر طلب
    const { data: requests, error: reqErr } = await supabase
      .from('password_recovery_requests')
      .select('*')
      .in('agent_id', agentIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (reqErr || !requests || requests.length === 0) {
      return res.json({ success: true, status: 'NOT_FOUND' });
    }

    const request = requests[0];

    // إذا كان مقبولاً وتم عرضه من قبل، لا يظهر مرة أخرى
    if (request.status === 'approved' && request.viewed) {
      return res.json({ success: true, status: 'NOT_FOUND' });
    }

    if (request.status === 'approved') {
      // تحديثه كمقروء/معروض فوراً
      await supabase
        .from('password_recovery_requests')
        .update({ viewed: true })
        .eq('id', request.id);

      return res.json({
        success: true,
        status: 'approved',
        email: request.agent_email,
        defaultPassword: 'DeliveryDefault123!' // derived from system default
      });
    }

    return res.json({
      success: true,
      status: request.status // 'pending' or 'rejected'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/delivery/change-password
 * تغيير كلمة المرور للمندوب (داخل البوابة)
 */
router.put('/change-password', requireDeliveryStaff, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }

    const staffId = req.staff.id;

    // جلب بيانات المندوب كاملة
    const { data: staff, error: fetchErr } = await supabase
      .from('delivery_staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (fetchErr || !staff) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على الحساب' });
    }

    // التحقق من صحة كلمة المرور القديمة (دعم التشفير والرجوع التلقائي)
    let isMatch = false;
    if (staff.password.startsWith('$2a$') || staff.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(oldPassword, staff.password);
    } else {
      isMatch = (oldPassword === staff.password);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    // تشفير كلمة المرور الجديدة وحفظها
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('delivery_staff')
      .update({ password: hashedPassword })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    next(error);
  }
});

export default router;
