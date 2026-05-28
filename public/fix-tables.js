const fs = require('fs');
const path = require('path');

// 1. FIX ORDERS.HTML (Syntax Error)
const ordersPath = path.join(__dirname, 'pages/admin/orders.html');
let ordersHtml = fs.readFileSync(ordersPath, 'utf8');

// Find the duplicated select.innerHTML line and replace it
ordersHtml = ordersHtml.replace(
  `select.innerHTML = '<option value="">-- اختر المندوب --</option>' + \n            select.innerHTML = '<option value="">-- اختر المندوب --</option>' + response.data.map`,
  `select.innerHTML = '<option value="">-- اختر المندوب --</option>' + response.data.map`
);
// Also just in case the newlines are different:
ordersHtml = ordersHtml.replace(
  /select\.innerHTML\s*=\s*'<option value="">-- اختر المندوب --<\/option>'\s*\+\s*select\.innerHTML\s*=\s*'<option value="">-- اختر المندوب --<\/option>'\s*\+\s*response\.data\.map/g,
  `select.innerHTML = '<option value="">-- اختر المندوب --</option>' + response.data.map`
);

fs.writeFileSync(ordersPath, ordersHtml, 'utf8');
console.log('Fixed orders.html syntax error');

// 2. FIX USERS.HTML (Headers and JS)
const usersPath = path.join(__dirname, 'pages/admin/users.html');
let usersHtml = fs.readFileSync(usersPath, 'utf8');

// Fix headers
usersHtml = usersHtml.replace(
  /<thead>[\s\S]*?<\/thead>/,
  `<thead>
                  <tr>
                    <th>العميل</th>
                    <th>البريد الإلكتروني</th>
                    <th>الهاتف</th>
                    <th>العنوان</th>
                    <th>تاريخ التسجيل</th>
                  </tr>
                </thead>`
);

// Fix JS table body mapping
usersHtml = usersHtml.replace(
  /<tbody>[\s\S]*?<\/tbody>/,
  `<tbody id="users-body">
                <tr><td colspan="5" class="text-center py-xl"><div class="spinner"></div></td></tr>
              </tbody>`
);

usersHtml = usersHtml.replace(
  /tbody\.innerHTML = response\.data\.map\(user => `[\s\S]*?`\)\.join\(''\);/,
  `tbody.innerHTML = response.data.map(user => \`
              <tr>
                <td>
                  <strong>\${user.name || 'مستخدم'}</strong>
                  <div class="text-xs text-secondary mt-xs">\${user.id || ''}</div>
                </td>
                <td><span class="text-secondary">\${user.email || 'غير متوفر'}</span></td>
                <td><span class="text-secondary">\${user.phone || 'غير متوفر'}</span></td>
                <td><span class="text-secondary">\${user.address || 'غير متوفر'}</span></td>
                <td><span class="text-secondary">\${formatDate(user.created_at || new Date().toISOString())}</span></td>
              </tr>
            \`).join('');`
);

// Fix colspan in the empty message
usersHtml = usersHtml.replace(
  /colspan="4"/g,
  `colspan="5"`
);

fs.writeFileSync(usersPath, usersHtml, 'utf8');
console.log('Fixed users.html headers and JS');

// 3. FIX DELIVERY.HTML (Headers)
const deliveryPath = path.join(__dirname, 'pages/admin/delivery.html');
let deliveryHtml = fs.readFileSync(deliveryPath, 'utf8');

// Fix headers
deliveryHtml = deliveryHtml.replace(
  /<thead>[\s\S]*?<\/thead>/,
  `<thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الهاتف</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>`
);

// Fix colspan in the empty message
deliveryHtml = deliveryHtml.replace(
  /colspan="4"/g,
  `colspan="5"`
);

fs.writeFileSync(deliveryPath, deliveryHtml, 'utf8');
console.log('Fixed delivery.html headers');
