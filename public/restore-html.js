const fs = require('fs');
const path = require('path');

// RESTORE ORDERS.HTML
const ordersPath = path.join(__dirname, 'pages/admin/orders.html');
let ordersHtml = fs.readFileSync(ordersPath, 'utf8');

// Find where it was broken (before <script type="module">)
if (!ordersHtml.includes('<form id="assign-delivery-form">')) {
    ordersHtml = ordersHtml.replace(/<div class="modal-content admin-card" style="max-width: 400px;">\s*<div class="modal-header">[\s\S]*?<form id="assign-delivery-form">\s*<input type="hidden" id="assign-order-id">\s*<script type="module">/g,
    `<div class="modal-content admin-card" style="max-width: 400px;">
      <div class="modal-header">
        <h2>إسناد لمندوب</h2>
        <button class="modal-close" onclick="document.getElementById('assign-delivery-modal').classList.remove('active')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <form id="assign-delivery-form">
        <input type="hidden" id="assign-order-id">
        <div class="form-group">
          <label class="form-label">اختر مندوب التوصيل</label>
          <select id="delivery-staff-select" class="form-select" required>
            <option value="">-- اختر المندوب --</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-lg" id="submit-assign-btn">
          حفظ وتغيير الحالة إلى "تم الشحن"
        </button>
      </form>
    </div>
  </div>

  <script type="module">`);
    fs.writeFileSync(ordersPath, ordersHtml, 'utf8');
}

// RESTORE DELIVERY.HTML
const deliveryPath = path.join(__dirname, 'pages/admin/delivery.html');
let deliveryHtml = fs.readFileSync(deliveryPath, 'utf8');

if (!deliveryHtml.includes('<button type="submit" class="btn btn-primary btn-block mt-lg" id="submit-staff-btn">')) {
    deliveryHtml = deliveryHtml.replace(/<p class="text-sm text-secondary mt-xs"><i class="fas fa-info-circle"><\/i> أدخل بيانات مندوب التوصيل لإسناد الطلبات إليه\.<\/p>\s*<!-- Edit Delivery Staff Modal -->/g,
    `<p class="text-sm text-secondary mt-xs"><i class="fas fa-info-circle"></i> أدخل بيانات مندوب التوصيل لإسناد الطلبات إليه.</p>
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-lg" id="submit-staff-btn">
          إضافة المندوب لفريق التوصيل
        </button>
      </form>
    </div>
  </div>

  <!-- Edit Delivery Staff Modal -->`);
    
    // Also fix the edit submit btn
    deliveryHtml = deliveryHtml.replace(/7ï؟½8~7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½8y8 7ï؟½7ï؟½/g, 'حفظ التعديلات');

    fs.writeFileSync(deliveryPath, deliveryHtml, 'utf8');
}

// FIX PRODUCTS.HTML STRINGS
const productsPath = path.join(__dirname, 'pages/admin/products.html');
let productsHtml = fs.readFileSync(productsPath, 'utf8');
productsHtml = productsHtml.replace(/7ï؟½8~7ï؟½ 7ï؟½8 8&8 7ï؟½7ï؟½/g, 'إضافة المنتج');
productsHtml = productsHtml.replace(/7ï؟½8~7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½8y8 7ï؟½7ï؟½/g, 'حفظ التعديلات');
fs.writeFileSync(productsPath, productsHtml, 'utf8');

console.log("Restored HTML and fixed remaining strings");
