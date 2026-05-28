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
  const corruptedText = fs.readFileSync(filePath, 'utf8');
  
  // Reverse the double-encoding
  // Convert the corrupted string back to its raw bytes (interpreted as latin1)
  const buffer = Buffer.from(corruptedText, 'latin1');
  
  // Read those bytes as the original UTF-8
  const restoredText = buffer.toString('utf8');
  
  // Write back to the file properly
  fs.writeFileSync(filePath, restoredText, 'utf8');
  console.log('Restored: ' + file);
}
