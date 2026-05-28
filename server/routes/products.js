/**
 * مسارات المنتجات (Products Routes)
 * @module routes/products
 */

import { Router } from 'express';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { validateProduct, handleValidationErrors } from '../middleware/validate.js';
import { supabase } from '../config/supabase.js';
import multer from 'multer';

const router = Router();

// إعداد Multer لرفع الملفات
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مسموح'));
  },
});

/**
 * GET /api/products
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, sort = 'newest', search, limit = 20, page = 1 } = req.query;

    const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    switch (sort) {
      case 'price-asc': query = query.order('price', { ascending: true }); break;
      case 'price-desc': query = query.order('price', { ascending: false }); break;
      case 'name-asc': query = query.order('name', { ascending: true }); break;
      case 'newest':
      default: query = query.order('created_at', { ascending: false }); break;
    }

    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) throw error;

    const formattedProducts = products.map(p => ({
      ...p,
      images: p.image ? p.image.split(',') : [],
      image: p.image ? p.image.split(',')[0] : ''
    }));

    const totalPages = Math.ceil((count || 0) / pageSize);

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          currentPage,
          totalPages,
          totalProducts: count,
          pageSize,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود | Product not found',
      });
    }

    const formattedProduct = {
      ...product,
      images: product.image ? product.image.split(',') : [],
      image: product.image ? product.image.split(',')[0] : ''
    };

    res.json({ success: true, data: formattedProduct });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 */
router.post('/', requireAdmin, validateProduct, handleValidationErrors, async (req, res, next) => {
  try {
    const { name, price, category, description, image, stock } = req.body;

    const { data: product, error } = await supabase.from('products').insert({
      name: name.trim(),
      price: parseFloat(price),
      category,
      description: description?.trim() || '',
      image: image || '',
      stock: parseInt(stock) || 0,
    }).select().single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح | Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', requireAdmin, validateProduct, handleValidationErrors, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, image, stock } = req.body;

    const { data: product, error } = await supabase.from('products').update({
      name: name.trim(),
      price: parseFloat(price),
      category,
      description: description?.trim() || '',
      image: image,
      stock: parseInt(stock) || 0,
    }).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { count, error: countError } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('id', id);
    if (countError) throw countError;
    if (count === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products/upload-images
 */
router.post('/upload-images', requireAdmin, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'لم يتم إرسال صور' });
    }

    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    if (!IMGBB_API_KEY) throw new Error('ImgBB API key not configured');

    const uploadPromises = req.files.map(async (file) => {
      const base64Image = file.buffer.toString('base64');
      const formData = new URLSearchParams();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Image);
      formData.append('name', `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error('Image upload failed: ' + (result.error?.message || ''));
      return result.data.url;
    });

    const urls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: {
        urls,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
