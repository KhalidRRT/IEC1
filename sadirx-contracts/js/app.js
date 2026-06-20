// ==================== APP CORE ====================
const App = {
  currentPage: 'dashboard',
  currentContract: null,
  currentStep: 1,
  totalSteps: 6,

  init() {
    this.bindNav();
    this.navigate('dashboard');
    this.checkSettingsWarning();
  },

  navigate(page, data = null) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    if (page === 'dashboard') Pages.dashboard();
    if (page === 'settings') Pages.settings();
    if (page === 'contracts') Pages.contracts();
    if (page === 'new-contract') Pages.newContract(data);
    if (page === 'preview') Pages.preview(data);
    window.scrollTo(0, 0);
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => this.navigate(item.dataset.page));
    });
  },

  checkSettingsWarning() {
    const s = DB.getSettings();
    const incomplete = !s.commercial_registration || !s.address;
    const banner = document.getElementById('settings-banner');
    if (banner) banner.classList.toggle('hidden', !incomplete);
  },

  toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
};

// ==================== PAGES ====================
const Pages = {

  // ---------- DASHBOARD ----------
  dashboard() {
    const contracts = DB.getContracts();
    const s = DB.getSettings();
    const total = contracts.length;
    const draft = contracts.filter(c => c.status === 'draft').length;
    const ready = contracts.filter(c => c.status === 'ready').length;
    const signed = contracts.filter(c => c.status === 'signed').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-draft').textContent = draft;
    document.getElementById('stat-ready').textContent = ready;
    document.getElementById('stat-signed').textContent = signed;

    // Recent contracts
    const recent = contracts.slice(0, 5);
    const tbody = document.getElementById('recent-contracts-body');
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:30px"><div class="empty-state-icon">📄</div><p>لا توجد عقود بعد. ابدأ بإنشاء عقد جديد.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map(c => `
      <tr>
        <td><span class="font-bold text-primary">${c.contract_number}</span></td>
        <td>${c.employee_name || '---'}</td>
        <td>${c.job_title || '---'}</td>
        <td><span class="badge badge-${c.status}">${statusLabel(c.status)}</span></td>
        <td><div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" title="معاينة" onclick="App.navigate('preview','${c.id}')">👁</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="تعديل" onclick="App.navigate('new-contract','${c.id}')">✏️</button>
        </div></td>
      </tr>`).join('');
  },

  // ---------- SETTINGS ----------
  settings() {
    const s = DB.getSettings();
    const f = id => document.getElementById(id);
    f('s-company-name').value = s.company_name || 'شركة سدير إكس';
    f('s-cr').value = s.commercial_registration || '';
    f('s-address').value = s.address || '';
    f('s-city').value = s.city || '';
    f('s-email').value = s.email || '';
    f('s-phone').value = s.phone || '';
    f('s-rep-name').value = s.representative_name || 'خالد بن تركي القرني';
    f('s-rep-title').value = s.representative_title || 'الرئيس التنفيذي';
    f('s-prefix').value = s.contract_number_prefix || 'SX-HR-CON';
    f('s-logo-size').value = s.logo_size || 80;
    f('s-stamp-size').value = s.stamp_size || 80;
    f('s-sig-size').value = s.sig_size || 80;
    this.refreshSettingsImages(s);
  },

  refreshSettingsImages(s) {
    ['logo', 'stamp', 'rep_signature'].forEach(key => {
      const url = s[key + '_url'];
      const previewEl = document.getElementById(`preview-${key}`);
      if (previewEl) {
        if (url) {
          previewEl.innerHTML = `
            <div class="image-preview">
              <img src="${url}" alt="${key}">
              <div class="image-preview-actions">
                <button class="btn btn-ghost btn-sm" onclick="Settings.clearImage('${key}')">🗑 حذف</button>
              </div>
            </div>`;
        } else {
          previewEl.innerHTML = '<p class="text-sm text-gray">لم يتم رفع ملف بعد</p>';
        }
      }
    });
  },

  // ---------- NEW CONTRACT ----------
  newContract(contractId = null) {
    App.currentStep = 1;
    if (contractId && typeof contractId === 'string' && contractId.startsWith('c_')) {
      App.currentContract = DB.getContract(contractId) || DB.newContract();
    } else {
      App.currentContract = DB.newContract();
    }
    this.renderStep(1);
    this.updateStepsBar();
  },

  renderStep(step) {
    document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById(`step-panel-${step}`);
    if (panel) panel.classList.remove('hidden');
    this.updateStepsBar();
    this.populateStepFields(step);
    document.getElementById('step-prev-btn').disabled = step === 1;
    document.getElementById('step-next-btn').textContent = step === App.totalSteps ? 'توليد العقد ▶' : 'التالي ▶';
  },

  updateStepsBar() {
    const step = App.currentStep;
    document.querySelectorAll('.step-item').forEach((el, i) => {
      const s = i + 1;
      el.classList.remove('active', 'done');
      if (s < step) el.classList.add('done');
      if (s === step) el.classList.add('active');
    });
    document.querySelectorAll('.step-connector').forEach((el, i) => {
      el.classList.toggle('done', i + 1 < step);
    });
    document.getElementById('step-counter').textContent = `الخطوة ${step} من ${App.totalSteps}`;
  },

  populateStepFields(step) {
    const c = App.currentContract;
    if (!c) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    const check = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };

    if (step === 1) {
      set('f-emp-name', c.employee_name); set('f-emp-id', c.employee_id);
      set('f-emp-nationality', c.employee_nationality); set('f-emp-phone', c.employee_phone);
      set('f-emp-email', c.employee_email); set('f-emp-address', c.employee_address);
      if (c.employee_signature_url) {
        document.getElementById('emp-sig-preview').innerHTML = `<div class="image-preview"><img src="${c.employee_signature_url}" alt="توقيع"><div class="image-preview-actions"><button class="btn btn-ghost btn-sm" onclick="ContractForm.clearEmpSig()">🗑 حذف</button></div></div>`;
      }
    }
    if (step === 2) {
      set('f-job-title', c.job_title); set('f-department', c.department);
      set('f-reporting-to', c.reporting_to); set('f-work-location', c.work_location);
      set('f-work-mode', c.work_mode); set('f-job-duties', c.job_duties);
    }
    if (step === 3) {
      set('f-contract-type', c.contract_type); set('f-start-date', c.start_date);
      set('f-end-date', c.end_date); set('f-contract-duration', c.contract_duration);
      set('f-probation', c.probation_period); set('f-notice-period', c.notice_period);
      check('f-renewable', c.renewable);
      set('f-contract-city', c.contract_city);
      ContractForm.toggleEndDate();
    }
    if (step === 4) {
      set('f-basic-salary', c.basic_salary); set('f-housing', c.housing_allowance);
      set('f-transport', c.transportation_allowance); set('f-other-allowances', c.other_allowances);
      set('f-total-salary', c.total_salary); set('f-benefits', c.benefits);
      set('f-pay-date', c.salary_payment_date); set('f-pay-method', c.salary_payment_method);
      set('f-med-class', c.medical_insurance_class);
      check('f-social-ins', c.social_insurance); check('f-med-ins', c.medical_insurance);
    }
    if (step === 5) {
      set('f-working-days', c.working_days); set('f-working-hours', c.working_hours);
      set('f-rest-days', c.weekly_rest_days); set('f-annual-leave', c.annual_leave);
      set('f-official-holidays', c.official_holidays); set('f-sick-leave', c.sick_leave);
      set('f-additional-leaves', c.additional_leaves);
    }
    if (step === 6) {
      check('cl-confidentiality', c.clause_confidentiality);
      check('cl-ip', c.clause_ip);
      check('cl-conflict', c.clause_conflict);
      check('cl-compliance', c.clause_compliance);
      check('cl-discipline', c.clause_discipline);
      check('cl-assets', c.clause_assets);
      check('cl-handover', c.clause_handover);
      check('cl-noncompete', c.clause_noncompete);
      set('f-special-conditions', c.special_conditions);
    }
  },

  // ---------- CONTRACTS LIST ----------
  contracts() {
    const list = DB.getContracts();
    const tbody = document.getElementById('contracts-table-body');
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📄</div><h3>لا توجد عقود</h3><p>ابدأ بإنشاء عقد عمل جديد</p><button class="btn btn-primary" onclick="App.navigate('new-contract')">+ إنشاء عقد جديد</button></div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><span class="font-bold text-primary">${c.contract_number}</span></td>
        <td>${c.employee_name || '---'}</td>
        <td>${c.job_title || '---'}</td>
        <td>${c.contract_type || '---'}</td>
        <td>${formatDate(c.created_at)}</td>
        <td><span class="badge badge-${c.status}">${statusLabel(c.status)}</span></td>
        <td><div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" title="معاينة" onclick="App.navigate('preview','${c.id}')">👁</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="تعديل" onclick="App.navigate('new-contract','${c.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="نسخ" onclick="ContractsList.duplicate('${c.id}')">📋</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="Word" onclick="Export.word('${c.id}')">📝</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="PDF" onclick="Export.pdf('${c.id}')">📄</button>
          <button class="btn btn-danger btn-sm btn-icon" title="حذف" onclick="ContractsList.confirmDelete('${c.id}')">🗑</button>
        </div></td>
      </tr>`).join('');
  },

  // ---------- PREVIEW ----------
  preview(contractId) {
    const id = contractId || App.currentContract?.id;
    const c = id && id.startsWith('c_') ? DB.getContract(id) : App.currentContract;
    if (!c) { App.navigate('contracts'); return; }
    App.currentContract = c;
    const s = DB.getSettings();
    if (!c.contract_body) {
      c.contract_body = Generator.buildBody(c, s);
    }
    document.getElementById('preview-contract-number').textContent = c.contract_number;
    document.getElementById('preview-status').innerHTML = `<span class="badge badge-${c.status}">${statusLabel(c.status)}</span>`;
    document.getElementById('contract-editor-textarea').value = c.contract_body;
    this.renderContractPreview(c, s);
  },

  renderContractPreview(c, s) {
    const wrap = document.getElementById('contract-html-preview');
    const logoHtml = s.logo_url ? `<img src="${s.logo_url}" class="contract-logo" alt="شعار سدير إكس">` : '';
    const htmlBody = Generator.renderHTML(c, s);

    // Signature block
    const sigHtml = `
      <div class="contract-signatures">
        <div class="signature-block">
          <h3>الطرف الأول</h3>
          <p><strong>شركة سدير إكس</strong></p>
          <p>يمثلها: ${s.representative_name || 'خالد بن تركي القرني'}</p>
          <p>الصفة: ${s.representative_title || 'الرئيس التنفيذي'}</p>
          ${s.rep_signature_url ? `<img src="${s.rep_signature_url}" class="signature-img" alt="توقيع">` : '<div style="height:60px"></div>'}
          <div class="signature-line"></div>
          <div class="signature-label">التوقيع</div>
          ${s.stamp_url ? `<img src="${s.stamp_url}" class="signature-stamp" alt="ختم">` : ''}
          <div style="margin-top:10px;font-size:12px;color:#666">التاريخ: ________________</div>
        </div>
        <div class="signature-block">
          <h3>الطرف الثاني</h3>
          <p><strong>${c.employee_name || '---'}</strong></p>
          <p>رقم الهوية / الإقامة: ${c.employee_id || '---'}</p>
          ${c.employee_signature_url ? `<img src="${c.employee_signature_url}" class="signature-img" alt="توقيع">` : '<div style="height:60px"></div>'}
          <div class="signature-line"></div>
          <div class="signature-label">التوقيع</div>
          <div style="margin-top:10px;font-size:12px;color:#666">التاريخ: ________________</div>
        </div>
      </div>`;

    wrap.innerHTML = `
      <div class="contract-doc">
        <div class="contract-header">
          ${logoHtml}
          <div class="contract-number-line">رقم العقد: ${c.contract_number}</div>
        </div>
        ${htmlBody}
        ${sigHtml}
      </div>`;
  }
};

// ==================== SETTINGS HANDLER ====================
const Settings = {
  save() {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const s = DB.getSettings();
    s.company_name = g('s-company-name') || 'شركة سدير إكس';
    s.commercial_registration = g('s-cr');
    s.address = g('s-address');
    s.city = g('s-city');
    s.email = g('s-email');
    s.phone = g('s-phone');
    s.representative_name = g('s-rep-name') || 'خالد بن تركي القرني';
    s.representative_title = g('s-rep-title') || 'الرئيس التنفيذي';
    s.contract_number_prefix = g('s-prefix') || 'SX-HR-CON';
    s.logo_size = parseInt(document.getElementById('s-logo-size')?.value) || 80;
    s.stamp_size = parseInt(document.getElementById('s-stamp-size')?.value) || 80;
    s.sig_size = parseInt(document.getElementById('s-sig-size')?.value) || 80;
    DB.saveSettings(s);
    App.toast('تم حفظ إعدادات الشركة بنجاح ✓');
    App.checkSettingsWarning();
  },

  uploadImage(key, input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { App.toast('يرجى اختيار ملف صورة', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { App.toast('حجم الملف كبير جدًا (الحد الأقصى 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const s = DB.getSettings();
      s[key + '_url'] = e.target.result;
      DB.saveSettings(s);
      Pages.refreshSettingsImages(s);
      App.toast('تم رفع الملف بنجاح ✓');
    };
    reader.readAsDataURL(file);
  },

  clearImage(key) {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;
    const s = DB.getSettings();
    s[key + '_url'] = '';
    DB.saveSettings(s);
    Pages.refreshSettingsImages(s);
    App.toast('تم حذف الملف');
  }
};

// ==================== CONTRACT FORM ====================
const ContractForm = {
  collectStep(step) {
    const c = App.currentContract;
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const chk = id => document.getElementById(id)?.checked || false;

    if (step === 1) {
      c.employee_name = g('f-emp-name'); c.employee_id = g('f-emp-id');
      c.employee_nationality = g('f-emp-nationality'); c.employee_phone = g('f-emp-phone');
      c.employee_email = g('f-emp-email'); c.employee_address = g('f-emp-address');
    }
    if (step === 2) {
      c.job_title = g('f-job-title'); c.department = g('f-department');
      c.reporting_to = g('f-reporting-to'); c.work_location = g('f-work-location');
      c.work_mode = g('f-work-mode'); c.job_duties = g('f-job-duties');
    }
    if (step === 3) {
      c.contract_type = g('f-contract-type'); c.start_date = g('f-start-date');
      c.end_date = g('f-end-date'); c.contract_duration = g('f-contract-duration');
      c.probation_period = g('f-probation'); c.notice_period = g('f-notice-period');
      c.renewable = chk('f-renewable'); c.contract_city = g('f-contract-city');
    }
    if (step === 4) {
      c.basic_salary = g('f-basic-salary'); c.housing_allowance = g('f-housing');
      c.transportation_allowance = g('f-transport'); c.other_allowances = g('f-other-allowances');
      c.total_salary = g('f-total-salary'); c.benefits = g('f-benefits');
      c.salary_payment_date = g('f-pay-date'); c.salary_payment_method = g('f-pay-method');
      c.medical_insurance_class = g('f-med-class');
      c.social_insurance = chk('f-social-ins'); c.medical_insurance = chk('f-med-ins');
      this.calcTotal();
    }
    if (step === 5) {
      c.working_days = g('f-working-days'); c.working_hours = g('f-working-hours');
      c.weekly_rest_days = g('f-rest-days'); c.annual_leave = g('f-annual-leave');
      c.official_holidays = g('f-official-holidays'); c.sick_leave = g('f-sick-leave');
      c.additional_leaves = g('f-additional-leaves');
    }
    if (step === 6) {
      c.clause_confidentiality = chk('cl-confidentiality');
      c.clause_ip = chk('cl-ip');
      c.clause_conflict = chk('cl-conflict');
      c.clause_compliance = chk('cl-compliance');
      c.clause_discipline = chk('cl-discipline');
      c.clause_assets = chk('cl-assets');
      c.clause_handover = chk('cl-handover');
      c.clause_noncompete = chk('cl-noncompete');
      c.special_conditions = g('f-special-conditions');
    }
    c.updated_at = new Date().toISOString();
  },

  validate(step) {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const errors = [];
    if (step === 1) {
      if (!g('f-emp-name')) errors.push('اسم الموظف');
      if (!g('f-emp-id')) errors.push('رقم الهوية / الإقامة');
      if (!g('f-emp-nationality')) errors.push('الجنسية');
    }
    if (step === 2) {
      if (!g('f-job-title')) errors.push('المسمى الوظيفي');
      if (!g('f-department')) errors.push('الإدارة / القسم');
      if (!g('f-reporting-to')) errors.push('جهة الارتباط الإداري');
      if (!g('f-work-location')) errors.push('مقر العمل');
    }
    if (step === 3) {
      if (!g('f-start-date')) errors.push('تاريخ بداية العمل');
      const ct = g('f-contract-type');
      if (ct === 'محدد المدة' && !g('f-end-date')) errors.push('تاريخ نهاية العقد');
    }
    if (step === 4) {
      if (!g('f-basic-salary')) errors.push('الراتب الأساسي');
    }
    return errors;
  },

  nextStep() {
    const step = App.currentStep;
    this.collectStep(step);
    const errors = this.validate(step);
    if (errors.length) {
      App.toast(`يرجى إكمال: ${errors.join(', ')}`, 'error');
      return;
    }
    DB.saveContract(App.currentContract);
    if (step === App.totalSteps) {
      this.generate();
    } else {
      App.currentStep++;
      Pages.renderStep(App.currentStep);
    }
  },

  prevStep() {
    if (App.currentStep > 1) {
      this.collectStep(App.currentStep);
      App.currentStep--;
      Pages.renderStep(App.currentStep);
    }
  },

  saveDraft() {
    this.collectStep(App.currentStep);
    App.currentContract.status = 'draft';
    DB.saveContract(App.currentContract);
    App.toast('تم حفظ المسودة بنجاح ✓');
  },

  generate() {
    const c = App.currentContract;
    const s = DB.getSettings();

    // Check company settings completeness
    const missing = [];
    if (!s.commercial_registration) missing.push('رقم السجل التجاري');
    if (!s.address) missing.push('عنوان الشركة');
    if (!c.employee_name) missing.push('اسم الموظف');
    if (!c.employee_id) missing.push('رقم الهوية');
    if (!c.job_title) missing.push('المسمى الوظيفي');
    if (!c.basic_salary) missing.push('الراتب الأساسي');
    if (!c.start_date) missing.push('تاريخ بداية العمل');

    if (missing.length) {
      const msg = `البيانات التالية ناقصة:\n• ${missing.join('\n• ')}\n\nهل تريد حفظ مسودة فقط؟`;
      if (confirm(msg)) {
        c.status = 'draft';
        DB.saveContract(c);
        App.toast('تم حفظ المسودة', 'warning');
        App.navigate('contracts');
      }
      return;
    }

    c.contract_body = Generator.buildBody(c, s);
    c.status = 'ready';
    c.updated_at = new Date().toISOString();
    DB.saveContract(c);
    App.toast('تم توليد العقد بنجاح ✓');
    App.navigate('preview', c.id);
  },

  calcTotal() {
    const basic = parseFloat(document.getElementById('f-basic-salary')?.value) || 0;
    const housing = parseFloat(document.getElementById('f-housing')?.value) || 0;
    const transport = parseFloat(document.getElementById('f-transport')?.value) || 0;
    const total = basic + housing + transport;
    const el = document.getElementById('f-total-salary');
    if (el && total > 0) el.value = total;
  },

  toggleEndDate() {
    const ct = document.getElementById('f-contract-type')?.value;
    const endGroup = document.getElementById('end-date-group');
    if (endGroup) endGroup.classList.toggle('hidden', ct !== 'محدد المدة' && ct !== 'تدريب منتهي بالتوظيف');
  },

  autoGenerateDuties() {
    const title = document.getElementById('f-job-title')?.value?.trim();
    if (!title) { App.toast('أدخل المسمى الوظيفي أولًا', 'warning'); return; }
    const duties = generateDuties(title);
    const el = document.getElementById('f-job-duties');
    if (el) el.value = duties;
    App.toast('تم توليد المهام تلقائيًا ✓');
  },

  uploadEmpSig(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      App.currentContract.employee_signature_url = e.target.result;
      document.getElementById('emp-sig-preview').innerHTML = `
        <div class="image-preview">
          <img src="${e.target.result}" alt="توقيع">
          <div class="image-preview-actions"><button class="btn btn-ghost btn-sm" onclick="ContractForm.clearEmpSig()">🗑 حذف</button></div>
        </div>`;
    };
    reader.readAsDataURL(file);
  },

  clearEmpSig() {
    if (App.currentContract) App.currentContract.employee_signature_url = '';
    document.getElementById('emp-sig-preview').innerHTML = '<p class="text-sm text-gray">لم يتم رفع توقيع بعد</p>';
  }
};

// ==================== CONTRACTS LIST ====================
const ContractsList = {
  confirmDelete(id) {
    const c = DB.getContract(id);
    if (!c) return;
    if (confirm(`هل تريد حذف عقد ${c.employee_name || c.contract_number}؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
      DB.deleteContract(id);
      Pages.contracts();
      App.toast('تم حذف العقد');
    }
  },

  duplicate(id) {
    const c = DB.getContract(id);
    if (!c) return;
    const newC = { ...c };
    newC.id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    newC.contract_number = DB.generateContractNumber();
    newC.status = 'draft';
    newC.created_at = new Date().toISOString();
    newC.updated_at = new Date().toISOString();
    newC.contract_body = '';
    DB.saveContract(newC);
    Pages.contracts();
    App.toast('تم نسخ العقد بنجاح ✓');
  },

  filterContracts() {
    const q = document.getElementById('search-contracts')?.value?.toLowerCase() || '';
    const status = document.getElementById('filter-status')?.value || '';
    const all = DB.getContracts();
    const filtered = all.filter(c => {
      const matchQ = !q || c.employee_name?.toLowerCase().includes(q) || c.contract_number?.toLowerCase().includes(q) || c.job_title?.toLowerCase().includes(q);
      const matchS = !status || c.status === status;
      return matchQ && matchS;
    });
    const tbody = document.getElementById('contracts-table-body');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b;">لا توجد نتائج مطابقة</td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td><span class="font-bold text-primary">${c.contract_number}</span></td>
        <td>${c.employee_name || '---'}</td>
        <td>${c.job_title || '---'}</td>
        <td>${c.contract_type || '---'}</td>
        <td>${formatDate(c.created_at)}</td>
        <td><span class="badge badge-${c.status}">${statusLabel(c.status)}</span></td>
        <td><div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="App.navigate('preview','${c.id}')">👁</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="App.navigate('new-contract','${c.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="ContractsList.duplicate('${c.id}')">📋</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="Export.word('${c.id}')">📝</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="Export.pdf('${c.id}')">📄</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="ContractsList.confirmDelete('${c.id}')">🗑</button>
        </div></td>
      </tr>`).join('');
  }
};

// ==================== EXPORT ====================
const Export = {
  getContract(id) {
    if (id) return DB.getContract(id);
    return App.currentContract;
  },

  word(id) {
    const c = this.getContract(id);
    if (!c) { App.toast('لم يتم العثور على العقد', 'error'); return; }
    const s = DB.getSettings();
    if (!c.contract_body) c.contract_body = Generator.buildBody(c, s);
    const blob = Generator.generateWordBlob(c, s);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.contract_number}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('تم تنزيل ملف Word بنجاح ✓');
  },

  pdf(id) {
    const c = this.getContract(id);
    if (!c) { App.toast('لم يتم العثور على العقد', 'error'); return; }
    if (App.currentContract?.id !== c.id) {
      App.currentContract = c;
      const s = DB.getSettings();
      Pages.renderContractPreview(c, s);
    }
    // Set print title
    const origTitle = document.title;
    document.title = c.contract_number;
    window.print();
    document.title = origTitle;
    App.toast('افتح نافذة الطباعة واختر "حفظ كـ PDF"');
  },

  saveEdited() {
    const body = document.getElementById('contract-editor-textarea')?.value;
    if (!body) return;
    const c = App.currentContract;
    if (!c) return;
    c.contract_body = body;
    c.updated_at = new Date().toISOString();
    DB.saveContract(c);
    const s = DB.getSettings();
    Pages.renderContractPreview(c, s);
    App.toast('تم حفظ التعديلات وتحديث المعاينة ✓');
  },

  markSigned() {
    const c = App.currentContract;
    if (!c) return;
    c.status = 'signed';
    c.updated_at = new Date().toISOString();
    DB.saveContract(c);
    document.getElementById('preview-status').innerHTML = `<span class="badge badge-signed">موقّع</span>`;
    App.toast('تم تحديث حالة العقد إلى "موقّع" ✓');
  }
};

// ==================== HELPERS ====================
function statusLabel(s) {
  return { draft: 'مسودة', ready: 'جاهز', signed: 'موقّع', expired: 'منتهي' }[s] || s;
}

function formatDate(iso) {
  if (!iso) return '---';
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function generateDuties(title) {
  const map = {
    'مدير': 'الإشراف على فريق العمل وتوجيههم\nوضع الخطط التشغيلية وضمان تنفيذها\nمتابعة الأداء وإعداد التقارير الدورية\nتمثيل القسم في الاجتماعات\nاتخاذ القرارات التشغيلية اليومية',
    'مطور': 'تطوير وبرمجة التطبيقات والأنظمة\nمراجعة الكود وضمان جودته\nتوثيق الأعمال التقنية\nالمشاركة في اجتماعات التخطيط التقني\nاختبار البرمجيات وإصلاح الأخطاء',
    'محاسب': 'إعداد القوائم المالية والتقارير\nمتابعة الحسابات وعمليات الصرف\nتسجيل القيود المحاسبية\nمراجعة الفواتير والمستحقات\nإعداد التسويات البنكية',
    'مصمم': 'تصميم الهويات البصرية والمواد التسويقية\nإنتاج المحتوى المرئي\nتطوير التصاميم وفق متطلبات العملاء\nالعمل مع الفريق على المشاريع الإبداعية\nمتابعة مستجدات تقنيات التصميم',
    'منسق': 'تنسيق الأنشطة والمهام اليومية\nإعداد الجداول الزمنية ومتابعة التنفيذ\nالتواصل مع الأطراف المعنية\nتوثيق المراسلات والمستندات\nإعداد التقارير الدورية',
    'محلل': 'تحليل البيانات واستخلاص الرؤى\nإعداد التقارير التحليلية\nدراسة المتطلبات وترجمتها إلى حلول\nمتابعة مؤشرات الأداء\nتقديم التوصيات للإدارة',
  };
  for (const [key, val] of Object.entries(map)) {
    if (title.includes(key)) return val;
  }
  return `تنفيذ المهام المرتبطة بمسمى ${title}\nالالتزام بمعايير الجودة والأداء المهني\nالتنسيق مع الفريق والإدارة\nإعداد التقارير الدورية\nأي مهام أخرى تكلفه بها الإدارة`;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => App.init());
