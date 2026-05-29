/**
 * @fileoverview Supabase initialization and client-side API mock interceptor
 * @description تهيئة Supabase وتوجيه طلبات API تلقائياً في جهة العميل
 * @module supabase
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm';

const supabaseUrl = 'https://ebpscvuzeqlatbklqkwo.supabase.co';
const supabaseAnonKey = 'sb_publishable_evHGKFvrUqhOk1uR8rK47g_Se6qOeew';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================================================================
// Global Fetch Interceptor for Serverless Mode
// =========================================================================

// Helpers
let bcryptLoaded = false;
async function ensureBcrypt() {
  if (bcryptLoaded || (typeof dcodeIO !== 'undefined' && typeof dcodeIO.bcrypt !== 'undefined')) {
    bcryptLoaded = true;
    return;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js';
    script.onload = () => {
      bcryptLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const readAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const jsonResponse = (data, status = 200, message = '') => {
  return new Response(JSON.stringify({
    success: true,
    message,
    data
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

const errorResponse = (message, status = 400) => {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Route Handlers
async function handleMockApi(urlString, options) {
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const queryParams = Object.fromEntries(url.searchParams.entries());

  let body = null;
  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    } else {
      body = options.body;
    }
  }

  // Health check
  if (path === '/api/health') {
    return jsonResponse({ message: 'الخادم يعمل بنجاح في جهة العميل' });
  }

  // 1. PRODUCTS
  if (path === '/api/products') {
    if (method === 'GET') {
      let query = supabase.from('products').select('*', { count: 'exact' });
      if (queryParams.category && queryParams.category !== 'all') {
        query = query.eq('category', queryParams.category);
      }
      if (queryParams.search) {
        query = query.or(`name.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`);
      }
      const sort = queryParams.sort || 'newest';
      if (sort === 'price-asc') query = query.order('price', { ascending: true });
      else if (sort === 'price-desc') query = query.order('price', { ascending: false });
      else if (sort === 'name-asc') query = query.order('name', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const limit = Math.min(Math.max(parseInt(queryParams.limit) || 20, 1), 100);
      const currentPage = Math.max(parseInt(queryParams.page) || 1, 1);
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const formattedProducts = data.map(p => ({
        ...p,
        images: p.image ? p.image.split(',') : [],
        image: p.image ? p.image.split(',')[0] : ''
      }));

      const totalPages = Math.ceil((count || 0) / limit);
      return jsonResponse({
        products: formattedProducts,
        pagination: {
          currentPage,
          totalPages,
          totalProducts: count,
          pageSize: limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        }
      });
    } else if (method === 'POST') {
      const { data, error } = await supabase.from('products').insert({
        name: body.name.trim(),
        price: parseFloat(body.price),
        category: body.category,
        description: body.description?.trim() || '',
        image: body.image || '',
        stock: parseInt(body.stock) || 0,
      }).select().single();
      if (error) throw error;
      return jsonResponse(data, 201, 'تم إنشاء المنتج بنجاح | Product created successfully');
    }
  }

  // Upload product images
  if (path === '/api/products/upload-images' || path === '/api/products/upload-image') {
    if (!body || !(body instanceof FormData)) return errorResponse('لم يتم إرسال أي صورة', 400);
    const files = body.getAll('images').length > 0 ? body.getAll('images') : body.getAll('image');
    if (files.length === 0) return errorResponse('لم يتم إرسال أي صورة', 400);

    const uploadPromises = files.map(async (file) => {
      const base64Image = await readAsDataURL(file);
      const fd = new URLSearchParams();
      fd.append('key', '9514c90de1a0b07a6020c180823cde84');
      fd.append('image', base64Image);
      fd.append('name', `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

      const res = await originalFetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: fd
      });
      const result = await res.json();
      if (!result.success) throw new Error('فشل رفع الصورة على ImgBB');
      return result.data.url;
    });

    const urls = await Promise.all(uploadPromises);
    if (path.endsWith('upload-image')) {
      return new Response(JSON.stringify({ success: true, url: urls[0] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return jsonResponse({ urls });
    }
  }

  // Single Product operations
  if (/^\/api\/products\/([^\/]+)$/.test(path)) {
    const id = path.split('/').pop();
    if (method === 'GET') {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error || !data) return errorResponse('المنتج غير موجود | Product not found', 404);
      const formatted = {
        ...data,
        images: data.image ? data.image.split(',') : [],
        image: data.image ? data.image.split(',')[0] : ''
      };
      return jsonResponse(formatted);
    } else if (method === 'PUT') {
      const { data, error } = await supabase.from('products').update({
        name: body.name.trim(),
        price: parseFloat(body.price),
        category: body.category,
        description: body.description?.trim() || '',
        image: body.image || '',
        stock: parseInt(body.stock) || 0,
      }).eq('id', id).select().single();
      if (error) throw error;
      return jsonResponse(data, 200, 'تم تحديث المنتج بنجاح');
    } else if (method === 'DELETE') {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(null, 200, 'تم حذف المنتج بنجاح');
    }
  }

  // 2. CART
  if (path === '/api/cart') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const { data, error } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', session.user.id);
    if (error) throw error;

    const formattedCart = data.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name || item.products?.name,
      price: item.price || item.products?.price,
      image: item.image || item.products?.image
    }));
    return jsonResponse(formattedCart);
  }

  if (path === '/api/cart/add') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const { productId, quantity = 1, name, price, image } = body;

    const { data: existing, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', session.user.id)
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
          user_id: session.user.id,
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
    return jsonResponse(result, 200, 'تم إضافة المنتج للسلة');
  }

  if (path === '/api/cart/update') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const { productId, quantity } = body;

    if (quantity <= 0) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id).eq('product_id', productId);
      return jsonResponse(null, 200, 'تم حذف المنتج من السلة');
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse(data, 200, 'تم تحديث الكمية');
  }

  if (/^\/api\/cart\/remove\/([^\/]+)$/.test(path)) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const productId = path.split('/').pop();
    const { error } = await supabase.from('cart_items').delete().eq('user_id', session.user.id).eq('product_id', productId);
    if (error) throw error;
    return jsonResponse(null, 200, 'تم حذف المنتج من السلة');
  }

  if (path === '/api/cart/clear') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const { error } = await supabase.from('cart_items').delete().eq('user_id', session.user.id);
    if (error) throw error;
    return jsonResponse(null, 200, 'تم تفريغ السلة');
  }

  // 3. ORDERS
  if (path === '/api/orders') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse(data);
    } else if (method === 'POST') {
      const { items, shipping } = body;
      const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_id: orderId,
        user_id: session.user.id,
        user_email: session.user.email,
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

      await supabase.from('cart_items').delete().eq('user_id', session.user.id);

      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
        if (prod && prod.stock > 0) {
          await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.productId);
        }
      }

      return jsonResponse(order, 201, 'تم إنشاء الطلب بنجاح');
    }
  }

  if (/^\/api\/orders\/([^\/]+)\/cancel$/.test(path)) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const parts = path.split('/');
    const id = parts[parts.length - 2];

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !order) return errorResponse('الطلب غير موجود', 404);
    if (order.status !== 'pending') return errorResponse('لا يمكن إلغاء هذا الطلب', 400);

    const { error: updateError } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if (updateError) throw updateError;
    return jsonResponse(null, 200, 'تم إلغاء الطلب بنجاح');
  }

  if (/^\/api\/orders\/([^\/]+)$/.test(path)) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const id = path.split('/').pop();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) return errorResponse('الطلب غير موجود', 404);
    return jsonResponse(data);
  }

  // 4. AUTH & PROFILE
  if (path === '/api/auth/profile') {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user) return errorResponse('غير مصرح', 401);
    const user = session.user;

    if (method === 'GET') {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return jsonResponse({
        uid: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        ...(profile || {})
      });
    } else if (method === 'POST') {
      const { name, phone, address } = body;
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name || user.user_metadata?.full_name || '',
          phone: phone || '',
          address: address || ''
        })
        .select()
        .single();

      if (error) throw error;

      if (body.avatar_url || name) {
        await supabase.auth.updateUser({
          data: {
            full_name: name || user.user_metadata?.full_name,
            avatar_url: body.avatar_url || user.user_metadata?.avatar_url
          }
        });
      }
      return jsonResponse(profile, 200, 'تم حفظ الملف الشخصي بنجاح');
    } else if (method === 'PUT') {
      const { name, phone, address, email } = body;
      const updatePayload = { id: user.id };
      if (name !== undefined) updatePayload.name = name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (address !== undefined) updatePayload.address = address;
      if (email !== undefined) updatePayload.email = email;

      const { data: profile, error } = await supabase.from('profiles').upsert(updatePayload).select().single();
      if (error) throw error;
      return jsonResponse(profile, 200, 'تم تحديث الملف الشخصي بنجاح');
    }
  }

  if (path === '/api/auth/upload-avatar') {
    if (!body || !(body instanceof FormData)) return errorResponse('لم يتم إرسال أي صورة', 400);
    const file = body.get('image');
    if (!file) return errorResponse('لم يتم إرسال أي صورة', 400);

    const base64Image = await readAsDataURL(file);
    const fd = new URLSearchParams();
    fd.append('key', '9514c90de1a0b07a6020c180823cde84');
    fd.append('image', base64Image);

    const res = await originalFetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: fd
    });
    const result = await res.json();
    if (!result.success) throw new Error('فشل رفع الصورة على ImgBB');
    return new Response(JSON.stringify({ success: true, url: result.data.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // 5. ADMIN
  if (path === '/api/admin/stats') {
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: ordersCount, data: orders } = await supabase.from('orders').select('total');
    const totalRevenue = (orders || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return jsonResponse({
      usersCount: usersCount || 0,
      productsCount: productsCount || 0,
      ordersCount: ordersCount || 0,
      totalRevenue: totalRevenue || 0,
      recentOrders: recentOrders || []
    });
  }

  if (path === '/api/admin/orders') {
    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return jsonResponse(orders);
  }

  if (/^\/api\/admin\/orders\/([^\/]+)\/status$/.test(path)) {
    const parts = path.split('/');
    const id = parts[parts.length - 2];
    const { status } = body;

    const { data: order, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return jsonResponse(order, 200, 'تم تحديث حالة الطلب');
  }

  if (/^\/api\/admin\/orders\/([^\/]+)\/assign$/.test(path)) {
    const parts = path.split('/');
    const id = parts[parts.length - 2];
    const { staffId } = body;

    const { data: staff, error: staffError } = await supabase.from('delivery_staff').select('id, name, phone').eq('id', staffId).single();
    if (staffError || !staff) return errorResponse('موظف التوصيل غير موجود', 404);

    const { data: order, error: orderError } = await supabase.from('orders').update({
      status: 'shipped',
      delivery_staff_id: staff.id,
      delivery_staff_name: staff.name,
      delivery_staff_phone: staff.phone
    }).eq('id', id).select().single();

    if (orderError) throw orderError;
    return jsonResponse(order, 200, 'تم إسناد الطلب وتحديث حالته بنجاح');
  }

  if (path === '/api/admin/users') {
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const usersWithEmail = (profiles || []).map(p => ({
      ...p,
      email: p.email || 'غير متوفر'
    }));
    return jsonResponse(usersWithEmail);
  }

  if (path === '/api/admin/delivery') {
    if (method === 'GET') {
      const { data: staff, error } = await supabase.from('delivery_staff').select('id, name, email, password, phone, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse(staff);
    } else if (method === 'POST') {
      const { name, phone } = body;
      const emailStr = name.trim().toLowerCase().replace(/\s+/g, '.') + '.' + Math.floor(1000 + Math.random() * 9000);
      const email = `${emailStr}@delivery.store.com`;
      const plainPassword = Math.random().toString(36).substring(2, 10);

      const { data: staff, error } = await supabase.from('delivery_staff').insert({
        name,
        email,
        password: plainPassword,
        phone
      }).select().single();

      if (error) throw error;
      return jsonResponse({
        ...staff,
        password: plainPassword
      }, 201, 'تم إضافة المندوب بنجاح');
    }
  }

  if (/^\/api\/admin\/delivery\/([^\/]+)$/.test(path)) {
    const id = path.split('/').pop();
    if (method === 'PUT') {
      const { name, phone, email, password } = body;
      const updateData = { name, phone, email };
      if (password) updateData.password = password;

      const { data: staff, error } = await supabase.from('delivery_staff').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('orders').update({
        delivery_staff_name: name,
        delivery_staff_phone: phone
      }).eq('delivery_staff_id', id);

      return jsonResponse(staff, 200, 'تم تحديث بيانات الموظف بنجاح');
    } else if (method === 'DELETE') {
      const { error } = await supabase.from('delivery_staff').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(null, 200, 'تم حذف الموظف بنجاح');
    }
  }

  if (path === '/api/admin/delivery-recovery') {
    const { data, error } = await supabase.from('password_recovery_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return jsonResponse(data);
  }

  if (/^\/api\/admin\/delivery-recovery\/([^\/]+)\/approve$/.test(path)) {
    const parts = path.split('/');
    const id = parts[parts.length - 2];

    const { data: request, error: reqError } = await supabase.from('password_recovery_requests').select('*').eq('id', id).single();
    if (reqError || !request) return errorResponse('طلب استعادة كلمة المرور غير موجود', 404);

    const DEFAULT_PASSWORD = 'DeliveryDefault123!';
    const { error: updateAgentErr } = await supabase.from('delivery_staff').update({ password: DEFAULT_PASSWORD }).eq('id', request.agent_id);
    if (updateAgentErr) throw updateAgentErr;

    const { error: updateReqErr } = await supabase.from('password_recovery_requests').update({ status: 'approved' }).eq('id', id);
    if (updateReqErr) throw updateReqErr;

    return jsonResponse(null, 200, 'تمت الموافقة بنجاح وإعادة تعيين كلمة المرور للوضع الافتراضي');
  }

  if (/^\/api\/admin\/delivery-recovery\/([^\/]+)\/reject$/.test(path)) {
    const parts = path.split('/');
    const id = parts[parts.length - 2];

    const { error } = await supabase.from('password_recovery_requests').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;
    return jsonResponse(null, 200, 'تم رفض طلب الاستعادة بنجاح');
  }

  // 6. DELIVERY
  if (path === '/api/delivery/login') {
    const { email, password } = body;
    const { data: staff, error } = await supabase.from('delivery_staff').select('*').eq('email', email).single();
    if (error || !staff) return errorResponse('بيانات الدخول غير صحيحة', 401);

    await ensureBcrypt();
    let isMatch = false;
    if (staff.password.startsWith('$2a$') || staff.password.startsWith('$2b$')) {
      isMatch = dcodeIO.bcrypt.compareSync(password, staff.password);
    } else {
      isMatch = (password === staff.password);
    }

    if (!isMatch) return errorResponse('بيانات الدخول غير صحيحة', 401);
    return jsonResponse({
      token: staff.id,
      name: staff.name,
      email: staff.email
    }, 200, 'تم تسجيل الدخول بنجاح');
  }

  if (path === '/api/delivery/orders') {
    const { data: orders, error } = await supabase.from('orders').select('*').eq('status', 'shipped').order('created_at', { ascending: false });
    if (error) throw error;
    return jsonResponse(orders);
  }

  if (/^\/api\/delivery\/orders\/([^\/]+)\/deliver$/.test(path)) {
    const parts = path.split('/');
    const id = parts[parts.length - 2];

    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id).eq('status', 'shipped');
    if (error) throw error;
    return jsonResponse(null, 200, 'تم تسليم الطلب للعميل بنجاح');
  }

  if (path === '/api/delivery/forgot-password/request') {
    const { name, email } = body;
    let query = supabase.from('delivery_staff').select('*').ilike('name', name.trim());
    if (email) query = query.eq('email', email.trim());

    const { data: agents, error } = await query;
    if (error || !agents || agents.length === 0) return errorResponse('لم يتم العثور على حساب مندوب يطابق البيانات المدخلة', 404);

    const agent = agents[0];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from('password_recovery_requests')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .gte('created_at', startOfToday.toISOString());
    if (countErr) throw countErr;

    if (count >= 3) return errorResponse('لقد تجاوزت الحد الأقصى لطلبات استعادة كلمة المرور اليوم (بحد أقصى 3 طلبات)', 429);

    const { error: insertErr } = await supabase.from('password_recovery_requests').insert({
      agent_id: agent.id,
      agent_name: agent.name,
      agent_email: agent.email,
      status: 'pending'
    });
    if (insertErr) throw insertErr;
    return jsonResponse(null, 200, 'تم إرسال طلبك إلى المسؤول بنجاح.');
  }

  if (path === '/api/delivery/forgot-password/status') {
    const { name } = body;
    const { data: agents, error: agentErr } = await supabase.from('delivery_staff').select('id').ilike('name', name.trim());
    if (agentErr || !agents || agents.length === 0) return new Response(JSON.stringify({ success: true, status: 'NOT_FOUND' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const agentIds = agents.map(a => a.id);
    const { data: requests, error: reqErr } = await supabase
      .from('password_recovery_requests')
      .select('*')
      .in('agent_id', agentIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (reqErr || !requests || requests.length === 0) return new Response(JSON.stringify({ success: true, status: 'NOT_FOUND' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const request = requests[0];
    if (request.status === 'approved' && request.viewed) return new Response(JSON.stringify({ success: true, status: 'NOT_FOUND' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    if (request.status === 'approved') {
      await supabase.from('password_recovery_requests').update({ viewed: true }).eq('id', request.id);
      return new Response(JSON.stringify({
        success: true,
        status: 'approved',
        email: request.agent_email,
        defaultPassword: 'DeliveryDefault123!'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      success: true,
      status: request.status
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (path === '/api/delivery/change-password') {
    const authHeader = options.headers?.['Authorization'] || options.headers?.['authorization'] || '';
    const staffId = authHeader.replace('Bearer ', '').trim();
    if (!staffId) return errorResponse('غير مصرح بالدخول', 401);

    const { oldPassword, newPassword } = body;
    const { data: staff, error: fetchErr } = await supabase.from('delivery_staff').select('*').eq('id', staffId).single();
    if (fetchErr || !staff) return errorResponse('لم يتم العثور على الحساب', 404);

    await ensureBcrypt();
    let isMatch = false;
    if (staff.password.startsWith('$2a$') || staff.password.startsWith('$2b$')) {
      isMatch = dcodeIO.bcrypt.compareSync(oldPassword, staff.password);
    } else {
      isMatch = (oldPassword === staff.password);
    }

    if (!isMatch) return errorResponse('كلمة المرور الحالية غير صحيحة', 400);

    const { error: updateErr } = await supabase.from('delivery_staff').update({ password: newPassword }).eq('id', staffId);
    if (updateErr) throw updateErr;
    return jsonResponse(null, 200, 'تم تغيير كلمة المرور بنجاح');
  }

  return errorResponse('المسار المطلوب غير موجود في المحاكي', 404);
}

const originalFetch = window.fetch;
window.fetch = async function (input, options = {}) {
  let url = typeof input === 'string' ? input : input.url;

  let isIntercepted = false;
  let normalizedUrl = url;

  if (url.includes('/api/')) {
    isIntercepted = true;
  } else if (url.includes('ebpscvuzeqlatbklqkwo.supabase.co/rest/v1')) {
    isIntercepted = true;
    normalizedUrl = url.replace(/https?:\/\/ebpscvuzeqlatbklqkwo\.supabase\.co\/rest\/v1/, '/api');
  }

  if (isIntercepted) {
    try {
      return await handleMockApi(normalizedUrl, options);
    } catch (error) {
      console.error('[Mock Fetch Error]:', error);
      return new Response(JSON.stringify({
        success: false,
        message: error.message || 'حدث خطأ غير متوقع في محاكي API'
      }), {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return originalFetch.apply(this, arguments);
};
