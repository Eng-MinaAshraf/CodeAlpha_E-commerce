/**
 * مسارات لوحة تحكم المدير (Admin Routes)
 * @module routes/admin
 */

import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

const router = Router();

// تطبيق حماية المدير على كل المسارات في هذا الملف
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * جلب إحصائيات عامة للموقع
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: ordersCount, data: orders } = await supabase.from('orders').select('total');
    
    const totalRevenue = (orders || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        usersCount: usersCount || 0,
        productsCount: productsCount || 0,
        ordersCount: ordersCount || 0,
        totalRevenue: totalRevenue || 0,
        recentOrders: recentOrders || []
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 * جلب كل الطلبات للوحة التحكم
 */
router.get('/orders', async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * تحديث حالة طلب معين
 */
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * جلب جميع العملاء
 */
router.get('/users', async (req, res, next) => {
  try {
    // جلب بيانات الملفات الشخصية
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // جلب بيانات المصادقة للحصول على البريد الإلكتروني
    let authEmailMap = {};
    try {
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (authData && authData.users) {
        authData.users.forEach(u => {
          authEmailMap[u.id] = u.email || u.user_metadata?.email || '';
        });
      }
    } catch (authErr) {
      // if admin API not available, continue without emails
      console.error('Could not fetch auth users:', authErr.message);
    }

    // دمج البريد الإلكتروني مع البيانات الشخصية
    const usersWithEmail = (profiles || []).map(profile => ({
      ...profile,
      email: authEmailMap[profile.id] || profile.email || 'غير متوفر'
    }));

    res.json({ success: true, data: usersWithEmail });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/delivery
 * جلب قائمة موظفي التوصيل
 */
router.get('/delivery', async (req, res, next) => {
  try {
    // We will query the custom 'delivery_staff' table
    const { data: staff, error } = await supabase
      .from('delivery_staff')
      .select('id, name, email, password, phone, created_at')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/delivery
 * إضافة موظف توصيل وتوليد بياناته
 */
router.post('/delivery', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'يجب إدخال اسم وهاتف الموظف' });

    // Check for duplicate names
    const { data: existingStaff } = await supabase.from('delivery_staff').select('id').eq('name', name).single();
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'الاسم مكرر، يرجى كتابة الاسم الثنائي أو إضافة اسم الأب' });
    }

    // Generate random email and password
    const emailStr = name.trim().toLowerCase().replace(/\s+/g, '.') + '.' + Math.floor(1000 + Math.random() * 9000);
    const email = `${emailStr}@delivery.store.com`;
    const password = crypto.randomBytes(4).toString('hex'); // 8 char random hex

    // Insert into custom table
    const { data: staff, error } = await supabase
      .from('delivery_staff')
      .insert({
        name,
        email,
        password,
        phone
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: 'تم إضافة الموظف بنجاح', 
      data: staff // Includes generated email and password so admin can give it to the staff
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/delivery/:id
 * تعديل بيانات موظف توصيل
 */
router.put('/delivery/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, password } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'الاسم مطلوب' });
    }

    // Check for duplicate names (excluding self)
    const { data: existingStaff } = await supabase.from('delivery_staff').select('id').eq('name', name).neq('id', id).maybeSingle();
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'الاسم مكرر، يرجى كتابة الاسم الثنائي أو إضافة اسم الأب' });
    }

    const { data: staff, error } = await supabase
      .from('delivery_staff')
      .update({ name, phone, email, password })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // تحديث بيانات الموظف في كل الطلبات المسندة إليه والتي لم يتم تسليمها بعد لكي تعكس التعديل
    await supabase
      .from('orders')
      .update({ 
        delivery_staff_name: name,
        delivery_staff_phone: phone 
      })
      .eq('delivery_staff_id', id);

    res.json({ success: true, message: 'تم تحديث بيانات الموظف بنجاح', data: staff });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/delivery/:id
 * مسح موظف توصيل
 */
router.delete('/delivery/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('delivery_staff').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'تم حذف الموظف بنجاح' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/orders/:id/assign
 * إسناد الطلب لموظف توصيل
 */
router.put('/orders/:id/assign', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'يجب اختيار موظف توصيل' });
    }

    // جلب بيانات الموظف
    const { data: staff, error: staffError } = await supabase
      .from('delivery_staff')
      .select('id, name, phone')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ success: false, message: 'موظف التوصيل غير موجود' });
    }

    // تحديث الطلب ببيانات الموظف وتغيير الحالة إلى مشحون
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        delivery_staff_id: staff.id,
        delivery_staff_name: staff.name,
        delivery_staff_phone: staff.phone
      })
      .eq('id', id)
      .select()
      .single();

    if (orderError) throw orderError;

    res.json({
      success: true,
      message: 'تم إسناد الطلب وتحديث حالته بنجاح',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

export default router;
