const fs = require('fs');
const path = require('path');

// 1. FIX ORDERS.HTML TABLE COLUMNS
const ordersPath = path.join(__dirname, 'pages/admin/orders.html');
let ordersHtml = fs.readFileSync(ordersPath, 'utf8');

const orderRowOld = `<td>
                  <strong>\${order.order_id}</strong>
                  <div class="font-bold mt-sm">\${order.shipping_name}</div>
                  <div class="text-sm text-secondary">\${order.shipping_phone}</div>
                  <div class="text-sm text-secondary">\${order.shipping_address}7R \${order.shipping_city}</div>
                </td>
                <td><span class="text-secondary">\${formatDate(order.created_at)}</span></td>
                <td><strong class="text-accent">\${formatPrice(order.total)}</strong></td>
                <td>
                  \${order.delivery_staff_id 
                    ? \`<div class="badge badge-success mb-xs"><i class="fas fa-motorcycle"></i> \${order.delivery_staff_name}</div><div class="text-xs text-secondary">\${order.delivery_staff_phone || ''}</div>\`
                    : \`<button class="btn btn-outline btn-sm assign-delivery-btn" data-id="\${order.id}">إسناد لمندوب</button>\`
                  }
                </td>
                <td>
                  \${getStatusSelect(order.id, order.status)}
                </td>`;

const orderRowNew = `<td><strong>\${order.order_id}</strong></td>
                <td><span class="text-secondary">\${formatDate(order.created_at)}</span></td>
                <td>
                  <div class="font-bold mt-sm">\${order.shipping_name}</div>
                  <div class="text-sm text-secondary">\${order.shipping_phone}</div>
                  <div class="text-sm text-secondary">\${order.shipping_address} - \${order.shipping_city}</div>
                </td>
                <td><strong class="text-accent">\${formatPrice(order.total)}</strong></td>
                <td>
                  \${getStatusSelect(order.id, order.status)}
                </td>
                <td>
                  \${order.delivery_staff_id 
                    ? \`<div class="badge badge-success mb-xs"><i class="fas fa-motorcycle"></i> \${order.delivery_staff_name}</div><div class="text-xs text-secondary">\${order.delivery_staff_phone || ''}</div>\`
                    : \`<button class="btn btn-outline btn-sm assign-delivery-btn" data-id="\${order.id}">إسناد لمندوب</button>\`
                  }
                </td>`;

ordersHtml = ordersHtml.replace(orderRowOld, orderRowNew);

// Also fix colspan in empty row for orders
ordersHtml = ordersHtml.replace(/colspan="5"/g, 'colspan="6"');
fs.writeFileSync(ordersPath, ordersHtml, 'utf8');

// 2. FIX USERS.HTML USER ID
const usersPath = path.join(__dirname, 'pages/admin/users.html');
let usersHtml = fs.readFileSync(usersPath, 'utf8');

usersHtml = usersHtml.replace(
  /<div class="text-xs text-secondary mt-xs">\$\{user\.id \|\| ''\}<\/div>/g,
  ''
);

fs.writeFileSync(usersPath, usersHtml, 'utf8');

console.log("Fixed orders layout and removed user ID from users.html");
