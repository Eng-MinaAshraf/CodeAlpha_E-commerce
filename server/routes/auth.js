/**
 * مسارات المصادقة والملف الشخصي (Auth & Profile Routes)
 * @module routes/auth
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateAuth, handleValidationErrors } from '../middleware/validate.js';
import { supabase } from '../config/supabase.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

/**
 * GET /api/auth/profile
 */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.uid)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      success: true,
      data: {
        ...req.user,
        ...(profile || {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/profile
 * PUT /api/auth/profile
 */
router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.uid,
        name: name || req.user.name,
        phone: phone || '',
        address: address || ''
      })
      .select()
      .single();

    if (error) throw error;

    // Update Supabase Auth metadata for name and avatar using admin API
    if (req.body.avatar_url || name) {
      await supabase.auth.admin.updateUserById(req.user.uid, {
        user_metadata: { full_name: name, avatar_url: req.body.avatar_url }
      });
    }

    res.json({
      success: true,
      message: 'تم حفظ الملف الشخصي بنجاح',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;

    // Build the update payload dynamically to avoid overriding with undefined
    const updatePayload = { id: req.user.uid };
    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (address !== undefined) updatePayload.address = address;
    if (email !== undefined) updatePayload.email = email;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updatePayload)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/upload-avatar
 */
router.post('/upload-avatar', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرسال أي صورة' });
    
    const formData = new FormData();
    const base64Image = req.file.buffer.toString('base64');
    formData.append('image', base64Image);
    
    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, { 
      method: 'POST', 
      body: formData 
    });
    
    const imgbbData = await imgbbRes.json();
    if (!imgbbData.success) throw new Error('فشل رفع الصورة');
    
    res.json({ success: true, url: imgbbData.data.url });
  } catch(error) {
    next(error);
  }
});

export default router;
