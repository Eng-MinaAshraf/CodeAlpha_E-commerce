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

  // Fix dashboard status map
  content = content.replace(/const map = {[\s\S]*?};\s*const info/s, `const map = {
        'pending': { class: 'status-pending', text: 'قيد المراجعة' },
        'processing': { class: 'status-processing', text: 'قيد التجهيز' },
        'shipped': { class: 'status-shipped', text: 'تم الشحن' },
        'delivered': { class: 'status-delivered', text: 'تم التوصيل' },
        'cancelled': { class: 'status-cancelled', text: 'ملغي' }
      };
      const info`);

  // Fix orders status array
  content = content.replace(/const statuses = \[[\s\S]*?\];\s*const options/s, `const statuses = [
        { val: 'pending', text: 'قيد المراجعة' },
        { val: 'processing', text: 'قيد التجهيز' },
        { val: 'shipped', text: 'تم الشحن' },
        { val: 'delivered', text: 'تم التوصيل' },
        { val: 'cancelled', text: 'ملغي' }
      ];
      
      const options`);

  // Fix products edit/delete buttons
  content = content.replace(/<button class="btn btn-icon btn-outline-primary" onclick="editProduct\('\$\{product\.id\}'\)".*?<\/button>/g, `<button class="btn btn-icon btn-outline-primary" onclick="editProduct('\${product.id}')" title="تعديل">
      <i class="fas fa-edit"></i> تعديل
    </button>`);
  
  content = content.replace(/<button class="btn btn-icon btn-outline-error" onclick="deleteProduct\('\$\{product\.id\}'\)".*?<\/button>/g, `<button class="btn btn-icon btn-outline-error" onclick="deleteProduct('\${product.id}')" title="حذف">
      <i class="fas fa-trash"></i> حذف
    </button>`);

  // Fix delivery edit/delete buttons
  content = content.replace(/<button class="btn btn-icon btn-outline-primary" onclick="editDelivery\('\$\{staff\.id\}'\)".*?<\/button>/g, `<button class="btn btn-icon btn-outline-primary" onclick="editDelivery('\${staff.id}')" title="تعديل">
      <i class="fas fa-edit"></i> تعديل
    </button>`);
  
  content = content.replace(/<button class="btn btn-icon btn-outline-error" onclick="deleteDelivery\('\$\{staff\.id\}'\)".*?<\/button>/g, `<button class="btn btn-icon btn-outline-error" onclick="deleteDelivery('\${staff.id}')" title="حذف">
      <i class="fas fa-trash"></i> حذف
    </button>`);

  // Fix generic bad strings matching \uFFFD
  // Anything like `>...<` containing \uFFFD
  content = content.replace(/>[^<]*\uFFFD[^<]*</g, (match) => {
    if (match.includes('fa-plus')) return '><i class="fas fa-plus ml-xs"></i> إضافة<';
    if (match.includes('assign-delivery-btn')) return '>إسناد لمندوب<';
    if (match.includes('toast.error')) return match; // Handled below
    if (match.includes('toast.success')) return match;
    return match; // fallback
  });

  // Fix add buttons that have \uFFFD inside them directly next to icon
  content = content.replace(/<button[^>]*>\s*<i class="fas fa-plus.*?<\/i>[^<]*\uFFFD[^<]*<\/button>/g, (match) => {
    if (match.includes('add-product-modal')) {
      return `<button class="btn btn-primary" onclick="document.getElementById('add-product-modal').classList.add('active')">
            <i class="fas fa-plus"></i> إضافة منتج
          </button>`;
    }
    if (match.includes('add-delivery-modal')) {
      return `<button class="btn btn-primary" onclick="document.getElementById('add-delivery-modal').classList.add('active')">
            <i class="fas fa-plus"></i> إضافة موظف
          </button>`;
    }
    return match;
  });

  // Fix "Assign Delivery" button specifically
  content = content.replace(/<button class="btn btn-outline btn-sm assign-delivery-btn" data-id="\$\{order\.id\}">[^<]*\uFFFD[^<]*<\/button>/g, `<button class="btn btn-outline btn-sm assign-delivery-btn" data-id="\${order.id}">إسناد لمندوب</button>`);

  // Fix empty state tables
  content = content.replace(/<td colspan="\d+" class="text-center text-secondary py-xl">[^<]*\uFFFD[^<]*<\/td>/g, `<td colspan="5" class="text-center text-secondary py-xl">لا توجد بيانات حالياً</td>`);
  content = content.replace(/<td colspan="\d+" class="text-center text-error py-xl">[^<]*\uFFFD[^<]*<\/td>/g, `<td colspan="5" class="text-center text-error py-xl">حدث خطأ في تحميل البيانات</td>`);

  // Fix select option fallbacks
  content = content.replace(/<option value="">[^<]*\uFFFD[^<]*<\/option>/g, `<option value="">-- اختر --</option>`);

  // Fix labels or spans containing \uFFFD
  content = content.replace(/<span class="text-secondary">[^<]*\uFFFD[^<]*<\/span>/g, `<span class="text-secondary">لا يوجد</span>`);

  // Fix toasts
  content = content.replace(/toast\.success\([^)]*\uFFFD[^)]*\)/g, `toast.success('تمت العملية بنجاح')`);
  content = content.replace(/toast\.error\([^)]*\uFFFD[^)]*\)/g, `toast.error('حدث خطأ أثناء العملية')`);
  content = content.replace(/toast\.warning\([^)]*\uFFFD[^)]*\)/g, `toast.warning('يرجى التحقق من المدخلات')`);

  // Fix confirm dialog
  content = content.replace(/customConfirm\([^)]*\uFFFD[^)]*\)/g, `customConfirm('تأكيد الحذف', 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.', async () => {`);

  // Fix loading buttons
  content = content.replace(/btn\.innerHTML = '[^']*spinner[^']*';/g, `btn.innerHTML = '<div class="spinner spinner-sm"></div> جاري المعالجة...';`);
  content = content.replace(/submitBtn\.innerHTML = '[^']*spinner[^']*';/g, `submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> جاري المعالجة...';`);
  
  // Restore button text after loading
  content = content.replace(/btn\.innerText = '[^']*\uFFFD[^']*';/g, `btn.innerText = 'حفظ';`);
  content = content.replace(/submitBtn\.innerText = '[^']*\uFFFD[^']*';/g, `submitBtn.innerText = 'حفظ';`);

  // Fix specific card titles that might still have \uFFFD (like orders.html)
  content = content.replace(/<h2 class="admin-card-title"><i class="fas fa-shopping-bag text-accent ml-xs"><\/i>[^<]*\uFFFD[^<]*<\/h2>/g, `<h2 class="admin-card-title"><i class="fas fa-shopping-bag text-accent ml-xs"></i> سجل الطلبات</h2>`);

  // Fix specific title in orders.html
  content = content.replace(/<h1 class="admin-page-title">[^<]*\uFFFD[^<]*<\/h1>/g, `<h1 class="admin-page-title">إدارة الطلبات</h1>`);

  // Fix select innerHTML in orders
  content = content.replace(/select\.innerHTML = '<option value="">-- [^<]* --<\/option>' \+/g, `select.innerHTML = '<option value="">-- اختر المندوب --</option>' +`);

  // Fix small hint text
  content = content.replace(/<small class="text-secondary mt-xs">[^<]*\uFFFD[^<]*<\/small>/g, `<small class="text-secondary mt-xs">يمكنك رفع عدة صور. الصورة الأولى ستكون الرئيسية.</small>`);

  // Add the CSS align fix again just to be 100% sure
  if (!content.includes('/* Final alignment fix */')) {
    content = content.replace('</head>', `
  <style>
    /* Final alignment fix */
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
  </style>
</head>`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed UFFFD in: ' + file);
}
