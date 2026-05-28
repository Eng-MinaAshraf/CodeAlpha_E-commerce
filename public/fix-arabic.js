const fs = require('fs');
const path = require('path');

const files = [
  'pages/admin/dashboard.html',
  'pages/admin/delivery.html',
  'pages/admin/orders.html',
  'pages/admin/products.html',
  'pages/admin/users.html'
];

// Reusable snippets
const sidebarArabic = `
      <div class="sidebar-header">
        <a href="/pages/admin/dashboard.html" class="sidebar-brand">
          <i class="fas fa-user-shield text-accent"></i>
          <span>لوحة تحكم الإدارة</span>
        </a>
      </div>
      <div class="sidebar-user">
        <img src="https://ui-avatars.com/api/?name=Admin&background=ff6b2b&color=fff&size=40" alt="صورة المدير" class="admin-avatar">
        <div class="admin-user-info">
          <span class="admin-name">المدير العام</span>
          <span class="admin-role text-accent">admin@store.com</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a href="/pages/admin/dashboard.html" class="admin-nav-item active">
          <i class="fas fa-chart-line"></i> لوحة التحكم
        </a>
        <a href="/pages/admin/orders.html" class="admin-nav-item">
          <i class="fas fa-shopping-bag"></i> إدارة الطلبات
        </a>
        <a href="/pages/admin/products.html" class="admin-nav-item">
          <i class="fas fa-box-open"></i> إدارة المنتجات
        </a>
        <a href="/pages/admin/users.html" class="admin-nav-item">
          <i class="fas fa-users"></i> العملاء
        </a>
        <a href="/pages/admin/delivery.html" class="admin-nav-item">
          <i class="fas fa-motorcycle"></i> فريق التوصيل
        </a>
      </nav>
      <div class="sidebar-footer">
        <a href="/" class="admin-nav-item">
          <i class="fas fa-external-link-alt"></i> عرض المتجر
        </a>
        <a href="#" id="admin-logout-btn" class="admin-nav-item text-error hover-bg-error hover-text-white">
          <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
        </a>
      </div>
`;

function restoreSidebar(content) {
  return content.replace(/<div class="sidebar-header">[\s\S]*?<\/div>\s*<\/aside>/, sidebarArabic + '\n    </aside>');
}

function restoreTitles(content, title, pageTitle) {
  content = content.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  content = content.replace(/<h1 class="admin-page-title">.*?<\/h1>/, `<h1 class="admin-page-title">${pageTitle}</h1>`);
  return content;
}

function restoreCommonPlaceholders(content) {
  // Empty states
  content = content.replace(/<h3 class="empty-state-title">.*?<\/h3>/g, '<h3 class="empty-state-title">لا توجد بيانات</h3>');
  content = content.replace(/<p class="empty-state-text">.*?<\/p>/g, '<p class="empty-state-text">لم يتم العثور على أية سجلات حالياً.</p>');
  
  // Search inputs
  content = content.replace(/placeholder=".*?"/g, 'placeholder="بحث..."');
  return content;
}

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix sidebar
  content = restoreSidebar(content);

  // Fix specific pages
  if (file.includes('dashboard.html')) {
    content = restoreTitles(content, 'لوحة التحكم | المتجر الإلكتروني', 'لوحة التحكم (نظرة عامة)');
    content = content.replace(/<h3 class="stat-label">.*?7\?\?7\?\?8&7\?\?8 8y 7\?\?8 8&7\?\?8y7\?\?7\?\?7\?\?.*?<\/h3>/g, '<h3 class="stat-label">إجمالي الإيرادات</h3>');
    content = content.replace(/<h3 class="stat-label">.*?7\?\?7\?\?8&7\?\?8 8y 7\?\?8 7\?\?8 7\?\?7\?\?7\?\?.*?<\/h3>/g, '<h3 class="stat-label">إجمالي الطلبات</h3>');
    content = content.replace(/<h3 class="stat-label">.*?7\?\?8 7\?\?8 7\?\?7\?\?8& 7\?\?8 8 7\?\?7\?\?8 7\?\?8y7\?\?.*?<\/h3>/g, '<h3 class="stat-label">العملاء المسجلين</h3>');
    content = content.replace(/<h3 class="stat-label">.*?7\?\?7\?\?8&7\?\?8 8y 7\?\?8 8&8 7\?\?7\?\?7\?\?7\?\?.*?<\/h3>/g, '<h3 class="stat-label">المنتجات</h3>');
    content = content.replace(/<h2 class="admin-card-title">.*?<\/h2>/, '<h2 class="admin-card-title"><i class="fas fa-clock text-accent ml-xs"></i> أحدث الطلبات</h2>');
    content = content.replace(/<a href="\/pages\/admin\/orders\.html" class="btn btn-outline btn-sm">.*?<\/a>/, '<a href="/pages/admin/orders.html" class="btn btn-outline btn-sm">عرض الكل</a>');
    content = content.replace(/<th>.*?<\/th>/g, match => {
      if (match.includes('7')) return '<th>العمود</th>';
      return match;
    });
    content = content.replace(/<thead>\s*<tr>\s*<th>.*?<\/th>\s*<th>.*?<\/th>\s*<th>.*?<\/th>\s*<th>.*?<\/th>\s*<th>.*?<\/th>\s*<\/tr>\s*<\/thead>/, `<thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>التاريخ</th>
                    <th>العميل</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>`);
  } 
  else if (file.includes('orders.html')) {
    content = restoreTitles(content, 'إدارة الطلبات | المتجر الإلكتروني', 'إدارة الطلبات');
    content = content.replace(/<button class="filter-btn active" data-status="all">.*?<\/button>/, '<button class="filter-btn active" data-status="all">الكل</button>');
    content = content.replace(/<button class="filter-btn" data-status="pending">.*?<\/button>/, '<button class="filter-btn" data-status="pending">قيد المراجعة</button>');
    content = content.replace(/<button class="filter-btn" data-status="processing">.*?<\/button>/, '<button class="filter-btn" data-status="processing">قيد التجهيز</button>');
    content = content.replace(/<button class="filter-btn" data-status="shipped">.*?<\/button>/, '<button class="filter-btn" data-status="shipped">تم الشحن</button>');
    content = content.replace(/<button class="filter-btn" data-status="delivered">.*?<\/button>/, '<button class="filter-btn" data-status="delivered">تم التوصيل</button>');
    content = content.replace(/<button class="filter-btn" data-status="cancelled">.*?<\/button>/, '<button class="filter-btn" data-status="cancelled">ملغي</button>');
    content = content.replace(/<h2 class="admin-card-title">.*?<\/h2>/, '<h2 class="admin-card-title"><i class="fas fa-shopping-bag text-accent ml-xs"></i> سجل الطلبات</h2>');
    content = content.replace(/<thead>\s*<tr>[\s\S]*?<\/thead>/, `<thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>التاريخ</th>
                    <th>العميل</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>`);
    // Edit modal
    content = content.replace(/<h3 class="mb-sm">.*?<\/h3>/, '<h3 class="mb-sm">إسناد الطلب لمندوب توصيل</h3>');
    content = content.replace(/<label class="form-label">.*?<\/label>/, '<label class="form-label">اختر مندوب التوصيل</label>');
    content = content.replace(/<option value="">.*?<\/option>/, '<option value="">-- اختر المندوب --</option>');
    content = content.replace(/<button type="button" class="btn btn-outline" id="close-assign-modal">.*?<\/button>/, '<button type="button" class="btn btn-outline" id="close-assign-modal">إلغاء</button>');
    content = content.replace(/<button type="button" class="btn btn-primary" id="confirm-assign-btn">.*?<\/button>/, '<button type="button" class="btn btn-primary" id="confirm-assign-btn">تأكيد الإسناد</button>');
  }
  else if (file.includes('products.html')) {
    content = restoreTitles(content, 'إدارة المنتجات | المتجر الإلكتروني', 'إدارة المنتجات');
    content = content.replace(/<button class="btn btn-primary" id="add-product-btn">.*?<\/button>/, '<button class="btn btn-primary" id="add-product-btn"><i class="fas fa-plus ml-xs"></i> إضافة منتج</button>');
    content = content.replace(/<h2 class="admin-card-title">.*?<\/h2>/, '<h2 class="admin-card-title"><i class="fas fa-box-open text-accent ml-xs"></i> المخزون</h2>');
    content = content.replace(/<thead>\s*<tr>[\s\S]*?<\/thead>/, `<thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الفئة</th>
                    <th>السعر</th>
                    <th>المخزون</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>`);
    content = content.replace(/<h3 class="mb-lg" id="modal-title">.*?<\/h3>/, '<h3 class="mb-lg" id="modal-title">إضافة / تعديل منتج</h3>');
    content = content.replace(/<label class="form-label">.*?<\/label>/g, match => {
      if (match.includes('7')) return '<label class="form-label">حقل</label>';
      return match;
    });
    // Restore form labels
    content = content.replace(/<label class="form-label" for="prod-name">.*?<\/label>/, '<label class="form-label" for="prod-name">اسم المنتج</label>');
    content = content.replace(/<label class="form-label" for="prod-category">.*?<\/label>/, '<label class="form-label" for="prod-category">الفئة</label>');
    content = content.replace(/<label class="form-label" for="prod-price">.*?<\/label>/, '<label class="form-label" for="prod-price">السعر ($)</label>');
    content = content.replace(/<label class="form-label" for="prod-stock">.*?<\/label>/, '<label class="form-label" for="prod-stock">المخزون</label>');
    content = content.replace(/<label class="form-label" for="prod-desc">.*?<\/label>/, '<label class="form-label" for="prod-desc">الوصف</label>');
    content = content.replace(/<label class="form-label" for="prod-images">.*?<\/label>/, '<label class="form-label" for="prod-images">صور المنتج</label>');
    content = content.replace(/<button type="submit" class="btn btn-primary btn-block mb-sm">.*?<\/button>/, '<button type="submit" class="btn btn-primary btn-block mb-sm">حفظ المنتج</button>');
    content = content.replace(/<button type="button" class="btn btn-outline btn-block" id="close-modal-btn">.*?<\/button>/, '<button type="button" class="btn btn-outline btn-block" id="close-modal-btn">إلغاء</button>');
  }
  else if (file.includes('users.html')) {
    content = restoreTitles(content, 'العملاء | المتجر الإلكتروني', 'العملاء المسجلين');
    content = content.replace(/<h2 class="admin-card-title">.*?<\/h2>/, '<h2 class="admin-card-title"><i class="fas fa-users text-accent ml-xs"></i> جميع العملاء</h2>');
    content = content.replace(/<thead>\s*<tr>[\s\S]*?<\/thead>/, `<thead>
                  <tr>
                    <th>العميل</th>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ التسجيل</th>
                  </tr>
                </thead>`);
  }
  else if (file.includes('delivery.html')) {
    content = restoreTitles(content, 'فريق التوصيل | المتجر الإلكتروني', 'فريق التوصيل');
    content = content.replace(/<button class="btn btn-primary" id="add-delivery-btn">.*?<\/button>/, '<button class="btn btn-primary" id="add-delivery-btn"><i class="fas fa-plus ml-xs"></i> إضافة موظف</button>');
    content = content.replace(/<h2 class="admin-card-title">.*?<\/h2>/, '<h2 class="admin-card-title"><i class="fas fa-motorcycle text-accent ml-xs"></i> قائمة الموظفين</h2>');
    content = content.replace(/<thead>\s*<tr>[\s\S]*?<\/thead>/, `<thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>البريد الإلكتروني</th>
                    <th>كلمة المرور</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>`);
    // Add modal
    content = content.replace(/<h3 class="mb-lg">.*?<\/h3>/g, match => {
      if (match.includes('modal')) return match; // skip if not matching exactly
      return '<h3 class="mb-lg">بيانات الموظف</h3>';
    });
    content = content.replace(/<label class="form-label" for="del-name">.*?<\/label>/, '<label class="form-label" for="del-name">اسم الموظف</label>');
    content = content.replace(/<label class="form-label" for="del-phone">.*?<\/label>/, '<label class="form-label" for="del-phone">رقم الهاتف</label>');
    content = content.replace(/<button type="submit" class="btn btn-primary btn-block mb-sm">.*?<\/button>/g, '<button type="submit" class="btn btn-primary btn-block mb-sm">حفظ البيانات</button>');
    content = content.replace(/<button type="button" class="btn btn-outline btn-block" id="close-delivery-modal">.*?<\/button>/, '<button type="button" class="btn btn-outline btn-block" id="close-delivery-modal">إلغاء</button>');
    content = content.replace(/<button type="button" class="btn btn-outline btn-block" id="close-edit-delivery-modal">.*?<\/button>/, '<button type="button" class="btn btn-outline btn-block" id="close-edit-delivery-modal">إلغاء</button>');
  }

  content = restoreCommonPlaceholders(content);

  // General fallback for remaining corrupted labels
  content = content.replace(/<([^>]+)>([^<]*?7[^<]*?)<\/\1>/g, (match, tag, text) => {
    // We leave complex ones, but clear out pure corrupted text if it slips
    return `<${tag}></${tag}>`; // It's better than corrupted text
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed: ' + file);
}
