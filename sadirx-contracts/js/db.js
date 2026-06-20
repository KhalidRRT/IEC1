// ==================== DATABASE (localStorage) ====================
const DB = {
  // ---- Company Settings ----
  getSettings() {
    const s = localStorage.getItem('sx_settings');
    if (!s) return {
      company_name: 'شركة سدير إكس',
      commercial_registration: '',
      address: '',
      city: '',
      email: '',
      phone: '',
      representative_name: 'خالد بن تركي القرني',
      representative_title: 'الرئيس التنفيذي',
      logo_url: '',
      stamp_url: '',
      rep_signature_url: '',
      contract_number_prefix: 'SX-HR-CON',
      logo_size: 80,
      stamp_size: 80,
      sig_size: 80,
    };
    return JSON.parse(s);
  },
  saveSettings(data) {
    localStorage.setItem('sx_settings', JSON.stringify(data));
  },

  // ---- Contracts ----
  getContracts() {
    const c = localStorage.getItem('sx_contracts');
    return c ? JSON.parse(c) : [];
  },
  saveContracts(list) {
    localStorage.setItem('sx_contracts', JSON.stringify(list));
  },
  getContract(id) {
    return this.getContracts().find(c => c.id === id) || null;
  },
  saveContract(contract) {
    const list = this.getContracts();
    const idx = list.findIndex(c => c.id === contract.id);
    if (idx >= 0) list[idx] = contract;
    else list.unshift(contract);
    this.saveContracts(list);
    return contract;
  },
  deleteContract(id) {
    const list = this.getContracts().filter(c => c.id !== id);
    this.saveContracts(list);
  },

  // ---- Contract Number ----
  generateContractNumber() {
    const settings = this.getSettings();
    const year = new Date().getFullYear();
    const list = this.getContracts();
    const thisYear = list.filter(c => c.contract_number && c.contract_number.includes(String(year)));
    const serial = String(thisYear.length + 1).padStart(3, '0');
    return `${settings.contract_number_prefix}-${year}-${serial}`;
  },

  // ---- New Contract Template ----
  newContract() {
    return {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      contract_number: this.generateContractNumber(),
      status: 'draft', // draft | ready | signed | expired
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Parties
      employee_name: '', employee_id: '', employee_nationality: '',
      employee_phone: '', employee_email: '', employee_address: '',
      employee_signature_url: '',
      // Job
      job_title: '', department: '', reporting_to: '', work_location: '',
      work_mode: 'حضوري', job_duties: '',
      // Contract
      contract_type: 'محدد المدة', start_date: '', end_date: '', contract_duration: '',
      probation_period: '90 يومًا', renewable: true, notice_period: '30 يومًا',
      // Salary
      basic_salary: '', housing_allowance: '', transportation_allowance: '',
      other_allowances: '', total_salary: '', benefits: '',
      salary_payment_date: 'الخامس من كل شهر', salary_payment_method: 'تحويل بنكي',
      social_insurance: true, medical_insurance: true, medical_insurance_class: '',
      // Working hours
      working_days: 'الأحد - الخميس', working_hours: '8 ساعات يوميًا',
      weekly_rest_days: 'الجمعة والسبت', annual_leave: '21 يومًا',
      official_holidays: 'وفق التقويم الرسمي للمملكة العربية السعودية',
      sick_leave: 'وفق نظام العمل السعودي', additional_leaves: '',
      // Clauses (enabled/disabled)
      clause_confidentiality: true,
      clause_ip: true,
      clause_conflict: true,
      clause_compliance: true,
      clause_discipline: true,
      clause_assets: true,
      clause_handover: true,
      clause_noncompete: false,
      special_conditions: '',
      // Generated
      contract_body: '',
      contract_date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }),
      contract_city: 'الرياض',
    };
  }
};
