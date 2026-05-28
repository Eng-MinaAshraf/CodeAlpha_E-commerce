/**
 * مسارات الطلبات (Orders Routes)
 * @module routes/orders
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateOrder, handleValidationErrors } from '../middleware/validate.js';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * POST /api/orders
 */
router.post('/', requireAuth, validateOrder, handleValidationErrors, async (req, res, next) => {
  try {
    const { items, shipping } = req.body;

    // Calculate total securely in the backend
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      order_id: orderId,
      user_id: req.user.uid,
      user_email: req.user.email,
      shipping_name: shipping.name,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_phone: shipping.phone,
      subtotal: calculatedTotal,
      total: calculatedTotal,
      status: 'pending'
    }).select().single();

    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', req.user.uid);

    // Decrement stock for ordered items
    for (const item of items) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
      if (prod && prod.stock > 0) {
        await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.productId);
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', id)
      .eq('user_id', req.user.uid)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/orders/:id/cancel
 */
router.put('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.uid)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'لا يمكن إلغاء هذا الطلب' });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'تم إلغاء الطلب بنجاح' });
  } catch (error) {
    next(error);
  }
});

export default router;
