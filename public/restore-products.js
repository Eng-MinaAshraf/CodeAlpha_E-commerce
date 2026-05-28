const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages/admin/products.html');
let html = fs.readFileSync(filePath, 'utf8');

// Restore the mangled block before <script type="module">
const brokenBlock = `<div class="form-group">
  <script type="module">`;
  
html = html.replace(/<div class="form-group">\s*<script type="module">/g, 
`<div class="form-group">
          <label class="form-label" for="edit-image-file">صور المنتج</label>
          <input type="file" id="edit-image-file" class="form-input" accept="image/*">
          <small class="text-secondary mt-xs">يمكنك رفع عدة صور. الصورة الأولى ستكون الرئيسية.</small>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" id="edit-submit-btn">
          حفظ التعديلات
        </button>
      </form>
    </div>
  </div>

  <script type="module">`);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Restored products.html successfully');
