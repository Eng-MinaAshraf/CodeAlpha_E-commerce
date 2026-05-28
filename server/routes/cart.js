/**
 * مسارات سلة التسوق (Cart Routes)
 * @module routes/cart
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/cart
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', req.user.uid);

    if (error) throw error;

    const formattedCart = cartItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name || item.products?.name,
      price: item.price || item.products?.price,
      image: item.image || item.products?.image
    }));

    res.json({ success: true, data: formattedCart });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/add
 */
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { productId, quantity = 1, name, price, image } = req.body;

    const { data: existing, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user.uid)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ 
          user_id: req.user.uid, 
          product_id: productId, 
          quantity,
          name: name || 'منتج',
          price: price || 0,
          image: image || ''
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, message: 'تم إضافة المنتج للسلة', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cart/update
 */
router.put('/update', requireAuth, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (quantity <= 0) {
      await supabase.from('cart_items').delete().eq('user_id', req.user.uid).eq('product_id', productId);
      return res.json({ success: true, message: 'تم حذف المنتج من السلة' });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', req.user.uid)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'تم تحديث الكمية', data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/remove/:productId
 */
router.delete('/remove/:productId', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { error } = await supabase.from('cart_items').delete().eq('user_id', req.user.uid).eq('product_id', productId);
    if (error) throw error;

    res.json({ success: true, message: 'تم حذف المنتج من السلة' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/clear
 */
router.delete('/clear', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', req.user.uid);
    if (error) throw error;

    res.json({ success: true, message: 'تم تفريغ السلة' });
  } catch (error) {
    next(error);
  }
});

export default router;
