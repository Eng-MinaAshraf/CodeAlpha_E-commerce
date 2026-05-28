const fs = require('fs');
const path = require('path');

const files = [
  'pages/admin/dashboard.html',
  'pages/admin/delivery.html',
  'pages/admin/orders.html',
  'pages/admin/products.html',
  'pages/admin/users.html'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace any corrupted strings with proper Arabic
  content = content.replace(/7ï؟½7ï؟½7ï؟½8~7ï؟½ 8&8 7ï؟½7ï؟½ 7ï؟½7ï؟½8y7ï؟½/g, 'إضافة منتج');
  content = content.replace(/8 8y7ï؟½ 7ï؟½8 8&7ï؟½7ï؟½7ï؟½7ï؟½7ï؟½/g, 'قيد المراجعة');
  content = content.replace(/7ï؟½7ï؟½7ï؟½8y 7ï؟½8 7ï؟½7ï؟½8!8y7ï؟½/g, 'قيد التجهيز');
  content = content.replace(/7ï؟½8& 7ï؟½8 7ï؟½7ï؟½8 /g, 'تم الشحن');
  content = content.replace(/7ï؟½8& 7ï؟½8 7ï؟½8ï؟½7ï؟½8y8 /g, 'تم التوصيل');
  content = content.replace(/8&8 7 8y/g, 'ملغي');
  content = content.replace(/7ï؟½7ï؟½8 7ï؟½7ï؟½ 8 8&8 7ï؟½8ï؟½7ï؟½/g, 'إسناد لمندوب');
  
  content = content.replace(/7ï؟½7ï؟½7ï؟½8y8 /g, 'تعديل');
  content = content.replace(/8&7ï؟½8 /g, 'حذف');
  content = content.replace(/7ï؟½8~7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½8y8 7ï؟½7ï؟½/g, 'حفظ التعديلات');
  content = content.replace(/7ï؟½8~7ï؟½ 7ï؟½8 8&8 7ï؟½7ï؟½/g, 'حفظ البيانات');
  
  content = content.replace(/8 7ï؟½ 7ï؟½8ï؟½7ï؟½7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½ 7ï؟½7ï؟½7ï؟½/g, 'لا توجد بيانات حالياً');
  
  content = content.replace(/7ï؟½7ï؟½7ï؟½7ï؟½ 7ï؟½8 8~7ï؟½7ï؟½/g, '-- اختر الفئة --');
  content = content.replace(/7ï؟½8 8ï؟½7ï؟½7ï؟½8ï؟½8 8y7ï؟½7ï؟½/g, 'إلكترونيات');
  content = content.replace(/8&8 7ï؟½7ï؟½7ï؟½/g, 'ملابس');
  content = content.replace(/7ï؟½7ï؟½7ï؟½8y7ï؟½/g, 'أحذية');
  content = content.replace(/8ï؟½7ï؟½7ï؟½/g, 'كتب');
  content = content.replace(/7ï؟½7ï؟½7ï؟½7ï؟½/g, 'أثاث');
  content = content.replace(/8&7ï؟½7ï؟½7ï؟½7ï؟½7ï؟½7ï؟½7ï؟½ 7ï؟½7ï؟½8&8y8 /g, 'مستحضرات تجميل');
  content = content.replace(/7ï؟½8 7ï؟½7ï؟½7ï؟½/g, 'ألعاب');
  
  content = content.replace(/7ï؟½7ï؟½7ï؟½ 8 8& 7ï؟½8 8& 7ï؟½7ï؟½7ï؟½7ï؟½8y7ï؟½7ï؟½ 7ï؟½8ï؟½7ï؟½7ï؟½7R 7ï؟½8y7ï؟½8& 7ï؟½8 7ï؟½7ï؟½7ï؟½8~7ï؟½7ï؟½ 7ï؟½7ï؟½8 7ï؟½8ï؟½7ï؟½7ï؟½ 7ï؟½8 8 7ï؟½8y8&7ï؟½./g, 'يمكنك رفع عدة صور. الصورة الأولى ستكون الرئيسية.');
  content = content.replace(/7ï؟½7ï؟½7ï؟½ 7ï؟½7ï؟½7ï؟½ 7ï؟½7ï؟½8 7ï؟½7 7ï؟½8 7ï؟½ 7ï؟½8 7ï؟½8 7ï؟½7ï؟½7ï؟½/g, 'حدث خطأ أثناء العملية');
  content = content.replace(/7ï؟½8& 7ï؟½7ï؟½7ï؟½8y7ï؟½ 7ï؟½7ï؟½8 7ï؟½ 7ï؟½8 7ï؟½8 7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½/g, 'تمت العملية بنجاح');

  // Generic toast fallback
  content = content.replace(/toast\.success\('.*?'\)/g, "toast.success('تمت العملية بنجاح')");
  content = content.replace(/toast\.error\('.*?'\)/g, "toast.error('حدث خطأ أثناء العملية')");

  // Fix products edit modal labels that got broken
  if (file.includes('products.html')) {
    content = content.replace(/<div class="modal-overlay" id="edit-product-modal">[\s\S]*?<\/div>\s*<\/div>/, `<div class="modal-overlay" id="edit-product-modal">
    <div class="modal-content admin-card" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h2><i class="fas fa-edit text-accent"></i> تعديل بيانات المنتج</h2>
        <button type="button" class="modal-close" onclick="document.getElementById('edit-product-modal').classList.remove('active')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <form id="edit-product-form">
        <input type="hidden" id="edit-product-id">
        <input type="hidden" id="edit-existing-image">
        <div class="form-group">
          <label class="form-label" for="edit-name">اسم المنتج</label>
          <input type="text" id="edit-name" class="form-input" required minlength="2">
        </div>
        
        <div class="flex-between gap-md">
          <div class="form-group flex-1">
            <label class="form-label" for="edit-price">السعر ($)</label>
            <input type="number" id="edit-price" class="form-input" required min="1" step="0.01">
          </div>
          <div class="form-group flex-1">
            <label class="form-label" for="edit-stock">المخزون</label>
            <input type="number" id="edit-stock" class="form-input" required min="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-category">الفئة</label>
          <select id="edit-category" class="form-select" required>
            <option value="">-- اختر الفئة --</option>
            <option value="electronics">إلكترونيات</option>
            <option value="clothing">ملابس</option>
            <option value="shoes">أحذية</option>
            <option value="books">كتب</option>
            <option value="furniture">أثاث</option>
            <option value="beauty">مستحضرات تجميل</option>
            <option value="toys">ألعاب</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-description">الوصف</label>
          <textarea id="edit-description" class="form-textarea" required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-image-file">صور المنتج</label>
          <input type="file" id="edit-image-file" class="form-input" accept="image/*">
          <small class="text-secondary mt-xs">اختر صورة جديدة إذا كنت تريد الاستبدال.</small>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" id="edit-submit-btn">
          حفظ التعديلات
        </button>
      </form>
    </div>
  </div>`);

    // Fix edit button rendering in js
    content = content.replace(/<button class="btn btn-icon btn-outline-primary" onclick="editProduct\('\$\{product\.id\}'\)" title=".*?">[\s\S]*?<\/button>/, `<button class="btn btn-icon btn-outline-primary" onclick="editProduct('\${product.id}')" title="تعديل">
      <i class="fas fa-edit"></i> تعديل
    </button>`);
    content = content.replace(/<button class="btn btn-icon btn-outline-error" onclick="deleteProduct\('\$\{product\.id\}'\)" title=".*?">[\s\S]*?<\/button>/, `<button class="btn btn-icon btn-outline-error" onclick="deleteProduct('\${product.id}')" title="حذف">
      <i class="fas fa-trash"></i> حذف
    </button>`);
  }
  
  if (file.includes('delivery.html')) {
    // Fix edit button rendering in js
    content = content.replace(/<button class="btn btn-icon btn-outline-primary" onclick="editDelivery\('\$\{staff\.id\}'\)" title=".*?">[\s\S]*?<\/button>/, `<button class="btn btn-icon btn-outline-primary" onclick="editDelivery('\${staff.id}')" title="تعديل">
      <i class="fas fa-edit"></i> تعديل
    </button>`);
    content = content.replace(/<button class="btn btn-icon btn-outline-error" onclick="deleteDelivery\('\$\{staff\.id\}'\)" title=".*?">[\s\S]*?<\/button>/, `<button class="btn btn-icon btn-outline-error" onclick="deleteDelivery('\${staff.id}')" title="حذف">
      <i class="fas fa-trash"></i> حذف
    </button>`);
  }

  // Ensure card headers don't have unnecessary margins that break alignment
  // Remove empty admin-card-header classes or add proper margin
  // Since we want to fix CSS, we can inject a style block into the files
  if (!content.includes('/* Alignment fix */')) {
      content = content.replace('</head>', `
  <style>
    /* Alignment fix */
    .admin-card-header {
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .admin-card-title {
      margin: 0 !important;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .admin-table-container {
      margin-top: 0;
    }
    .admin-table th, .admin-table td {
      vertical-align: middle;
    }
  </style>
</head>`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed JS strings in: ' + file);
}
