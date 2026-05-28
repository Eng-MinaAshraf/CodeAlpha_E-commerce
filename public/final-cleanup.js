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
  
  const text = fs.readFileSync(filePath, 'utf8');
  let lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ï؟½')) {
      let l = lines[i];

      if (l.includes("tbody.innerHTML = '<tr><td colspan=\"5\" class=\"text-center text-secondary\">")) {
        lines[i] = "            tbody.innerHTML = '<tr><td colspan=\"5\" class=\"text-center text-secondary\">لا توجد طلبات حديثة</td></tr>';";
      } else if (l.includes('// أحذية')) {
        lines[i] = "            // جلب أحدث الطلبات";
      } else if (l.includes('class="fas fa-plus"')) {
        if (file.includes('delivery.html')) {
          lines[i] = "        <i class=\"fas fa-plus\"></i> إضافة مندوب جديد";
        }
      } else if (l.includes('<p class="text-sm text-secondary mt-xs"><i class="fas fa-info-circle">')) {
        lines[i] = "        <p class=\"text-sm text-secondary mt-xs\"><i class=\"fas fa-info-circle\"></i> أدخل بيانات مندوب التوصيل لإسناد الطلبات إليه.</p>";
      } else if (file.includes('delivery.html') && l.includes('كتب7ï؟½7ï؟½7ï؟½ 7ï؟½8 7ï؟½8y7ï؟½8 7ï؟½7ï؟½')) {
        lines[i] = "          إضافة مندوب للتوصيل";
      } else if (l.includes('<i class="fas fa-edit text-accent">')) {
        lines[i] = "        <h2><i class=\"fas fa-edit text-accent\"></i> تعديل بيانات المندوب</h2>";
      } else if (l.includes('7ï؟½8~7ï؟½ 7ï؟½8 7ï؟½7ï؟½7ï؟½8y8 7ï؟½7ï؟½') && !l.includes('btn.innerText')) {
        lines[i] = "          حفظ التعديلات";
      } else if (l.includes('<h2 class="mb-md">')) {
        lines[i] = "      <h2 class=\"mb-md\">لم يتم العثور على أي مندوب!</h2>";
      } else if (l.includes('<p class="text-secondary mb-lg">')) {
        lines[i] = "      <p class=\"text-secondary mb-lg\">لا يوجد أي مندوب توصيل مسجل حالياً. يمكنك إضافة مندوبين جدد لبدء إسناد الطلبات.</p>";
      } else if (l.includes('<span class="text-secondary">')) {
        if (l.includes('${staff.phone') || l.includes('${user.phone') || l.includes('${user.address')) {
           lines[i] = l.replace(/\|\| '.*?'/, "|| 'غير متوفر'");
        } else if (file.includes('delivery.html')) {
           lines[i] = "                    <span class=\"text-secondary\">لا يوجد بيانات</span>";
        }
      } else if (l.includes('7ï؟½7ï؟½8 7ï؟½897R')) {
        lines[i] = "                <div class=\"text-sm text-secondary mt-xs\">العنوان غير متوفر</div>";
      } else if (l.includes('colspan="5" class="text-center text-secondary py-xl"')) {
        lines[i] = "            tbody.innerHTML = '<tr><td colspan=\"5\" class=\"text-center text-secondary py-xl\">لا توجد بيانات حالياً</td></tr>';";
      } else if (l.includes('<i class="fas fa-edit"></i>')) {
        lines[i] = l.replace(/<i class="fas fa-edit"><\/i>.*/, '<i class="fas fa-edit"></i> تعديل');
      } else if (l.includes('<i class="fas fa-trash"></i>')) {
        lines[i] = l.replace(/<i class="fas fa-trash"><\/i>.*/, '<i class="fas fa-trash"></i> حذف');
      } else if (l.includes('customConfirm(')) {
        if (file.includes('delivery.html')) {
          lines[i] = "                customConfirm('تأكيد الحذف', 'هل أنت متأكد من رغبتك في حذف هذا المندوب؟ لا يمكن التراجع.', async () => {";
        } else {
          lines[i] = "                customConfirm('تأكيد الحذف', 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع.', async () => {";
        }
      } else if (l.includes('colspan="5" class="text-center text-error py-xl"')) {
        lines[i] = "        document.getElementById('delivery-staff-body').innerHTML = '<tr><td colspan=\"5\" class=\"text-center text-error py-xl\">حدث خطأ في تحميل البيانات</td></tr>';";
      } else if (l.includes('toast.error(')) {
        if (l.includes('err.message')) lines[i] = "        toast.error('حدث خطأ: ' + err.message);";
        else lines[i] = "        toast.error(error.message || 'حدث خطأ غير معروف');";
      } else if (l.includes("btn.innerText = '7ï؟½8~7ï؟½")) {
        lines[i] = "        btn.innerText = 'حفظ التعديلات';";
      } else if (l.includes("assign-delivery-btn")) {
        lines[i] = l.replace(/>.*?</, '>إسناد لمندوب<');
      } else if (l.includes('select.innerHTML = \'<option value="">')) {
        if (l.includes('8yكتب')) lines[i] = "            select.innerHTML = '<option value=\"\">لا يوجد مندوبين</option>';";
        else lines[i] = "        select.innerHTML = '<option value=\"\">حدث خطأ في جلب البيانات</option>';";
      } else if (l.includes('response.data.map(staff =>')) {
        lines[i] = "            select.innerHTML = '<option value=\"\">-- اختر المندوب --</option>' + response.data.map(staff => `<option value=\"\${staff.id}\">\${staff.name} - \${staff.phone || 'غير متوفر'}</option>`).join('');";
      } else if (l.includes("toast.warning(")) {
        lines[i] = "      if(!staffId) return toast.warning('يرجى اختيار المندوب أولاً');";
      } else if (l.includes('btn.innerText = \'7ï؟½8~7ï؟½ 8ï؟½7ï؟½7')) {
        lines[i] = "      btn.innerText = 'حفظ وإسناد المندوب';";
      } else if (l.includes('<option value="')) {
        if (l.includes('value=""')) lines[i] = "            <option value=\"\">-- اختر الفئة --</option>";
        if (l.includes('value="electronics"')) lines[i] = "            <option value=\"electronics\">إلكترونيات</option>";
        if (l.includes('value="clothing"')) lines[i] = "            <option value=\"clothing\">ملابس</option>";
        if (l.includes('value="beauty"')) lines[i] = "            <option value=\"beauty\">مستحضرات تجميل</option>";
        if (l.includes('value="toys"')) lines[i] = "            <option value=\"toys\">ألعاب</option>";
        if (l.includes('value="furniture"')) lines[i] = "            <option value=\"furniture\">أثاث</option>";
        if (l.includes('value="books"')) lines[i] = "            <option value=\"books\">كتب</option>";
        if (l.includes('value="shoes"')) lines[i] = "            <option value=\"shoes\">أحذية</option>";
      } else if (l.includes('7ï؟½8~7ï؟½ 7ï؟½8 8&8 7ï؟½7ï؟½')) {
        lines[i] = "          حفظ البيانات";
      } else if (l.includes('<small class="text-secondary mt-xs">')) {
        lines[i] = "          <small class=\"text-secondary mt-xs\">يمكنك رفع عدة صور. الصورة الأولى ستكون الرئيسية.</small>";
      } else if (l.includes('${pagination.currentPage}')) {
        lines[i] = "      span.innerText = `صفحة \${pagination.currentPage} من \${pagination.totalPages}`;";
      } else if (l.includes('throw new Error(')) {
        if (l.includes('uploadData')) lines[i] = "            throw new Error(uploadData.message || 'حدث خطأ أثناء الرفع');";
        else lines[i] = "          throw new Error('حدث خطأ أثناء المعالجة');";
      } else if (l.includes("submitBtn.innerText = '7ï؟½8~7ï؟½")) {
        lines[i] = "        submitBtn.innerText = 'حفظ التعديلات';";
      } else if (l.includes('colspan="4" class="text-center text-secondary py-xl"')) {
        lines[i] = "            tbody.innerHTML = '<tr><td colspan=\"4\" class=\"text-center text-secondary py-xl\">لا توجد بيانات حالياً</td></tr>';";
      }
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Final clean done for: ' + file);
}
