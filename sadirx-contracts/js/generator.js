// ==================== CONTRACT GENERATOR ====================
const Generator = {

  buildBody(contract, settings) {
    const c = contract;
    const s = settings;

    const dayName = new Date(c.start_date || Date.now()).toLocaleDateString('ar-SA', { weekday: 'long' });
    const dateStr = c.contract_date;

    // Helper
    const money = v => v ? `${Number(v).toLocaleString('ar-SA')} ريال سعودي` : '---';
    const val = v => v || '---';

    // Duration clause
    let durationClause = '';
    const ct = c.contract_type;
    if (ct === 'محدد المدة') {
      durationClause = `تكون مدة هذا العقد ${val(c.contract_duration)}، تبدأ من تاريخ ${val(c.start_date)} وتنتهي في تاريخ ${val(c.end_date)}، ويجوز تجديده باتفاق الطرفين كتابةً قبل انتهائه.`;
    } else if (ct === 'غير محدد المدة') {
      durationClause = `يعدّ هذا العقد غير محدد المدة، وتبدأ علاقة العمل من تاريخ ${val(c.start_date)}، ويجوز إنهاؤه وفقًا للأحكام النظامية ذات العلاقة، مع مراعاة فترة الإشعار المنصوص عليها.`;
    } else if (ct === 'دوام جزئي') {
      durationClause = `يعدّ هذا العقد عقد دوام جزئي، وتبدأ علاقة العمل من تاريخ ${val(c.start_date)}، وتخضع لأحكام العمل بدوام جزئي وفق اللوائح المعمول بها في المملكة العربية السعودية.`;
    } else if (ct === 'عمل مرن') {
      durationClause = `يعدّ هذا العقد عقد عمل مرن، وتبدأ علاقة العمل من تاريخ ${val(c.start_date)}، وتحدد ساعات ومواعيد العمل بالاتفاق المتبادل وفق طبيعة المهام واحتياجات الشركة.`;
    } else if (ct === 'تدريب منتهي بالتوظيف') {
      durationClause = `يعدّ هذا العقد برنامج تدريب منتهٍ بالتوظيف، تبدأ مدته من ${val(c.start_date)} وتنتهي في ${val(c.end_date)}، وعند إتمام الطرف الثاني لمتطلبات البرنامج بنجاح يُنظر في توظيفه وفق سياسة الشركة.`;
    }

    // Probation
    let probationClause = '';
    if (c.probation_period && c.probation_period !== 'لا يوجد') {
      probationClause = `يخضع الطرف الثاني لفترة تجربة مدتها ${val(c.probation_period)} تبدأ من تاريخ مباشرة العمل، ويجوز خلالها لأي من الطرفين إنهاء العقد وفقًا للأنظمة المعمول بها دون إشعار مسبق أو تعويض، إلا ما نص عليه النظام.`;
    } else {
      probationClause = `لا يخضع الطرف الثاني لفترة تجربة بموجب هذا العقد.`;
    }

    // Duties list
    const duties = (c.job_duties || '').split('\n').filter(d => d.trim()).map(d => `    • ${d.trim()}`).join('\n');
    const dutiesText = duties || '    • تنفيذ المهام والمسؤوليات المرتبطة بالوظيفة.';

    // Non-compete (if enabled)
    const nonCompeteArticle = c.clause_noncompete ? `
المادة التاسعة عشرة (أ): عدم المنافسة
يلتزم الطرف الثاني، خلال مدة هذا العقد وبعد انتهائه لفترة لا تتجاوز [المدة المتفق عليها]، بعدم الانخراط في أي نشاط أو عمل يتنافس مع أعمال الطرف الأول أو يضر بمصالحه التجارية داخل [النطاق الجغرافي المتفق عليه].

⚠️ تنبيه: يتطلب بند عدم المنافسة تحديد النطاق والمدة والمكان بدقة، ويجب مراجعته من مختص قانوني قبل اعتماده.
` : '';

    // Special conditions
    const specialClause = c.special_conditions ? `
المادة الثانية والعشرون: شروط خاصة
${c.special_conditions}
` : '';

    // Medical insurance detail
    let medInsurance = '';
    if (c.medical_insurance) {
      medInsurance = `يوفر الطرف الأول للطرف الثاني تأمينًا طبيًا${c.medical_insurance_class ? ` (فئة: ${c.medical_insurance_class})` : ''} وفق السياسات والإجراءات المعمول بها.`;
    }

    const body = `بسم الله الرحمن الرحيم

عقد عمل

رقم العقد: ${c.contract_number}

إنه في يوم ${dayName} بتاريخ ${dateStr}، في مدينة ${val(c.contract_city)}، تم إبرام هذا العقد بين كل من:

الطرف الأول:
شركة سدير إكس، سجل تجاري رقم ${val(s.commercial_registration)}، وعنوانها ${val(s.address)}، ${val(s.city)}، ويمثلها في هذا العقد الأستاذ / ${val(s.representative_name)}، بصفته ${val(s.representative_title)}، ويشار إليها لاحقًا بـ "الطرف الأول" أو "الشركة".

الطرف الثاني:
الأستاذ / ${val(c.employee_name)}، ${val(c.employee_nationality)}، بموجب هوية / إقامة رقم ${val(c.employee_id)}، ويشار إليه لاحقًا بـ "الطرف الثاني" أو "الموظف".

وقد اتفق الطرفان، وهما بكامل أهليتهما المعتبرة شرعًا ونظامًا، على إبرام هذا العقد وفق المواد التالية:

─────────────────────────────────────────

المادة الأولى: التمهيد
يعد التمهيد أعلاه جزءًا لا يتجزأ من هذا العقد ومكملًا ومتممًا له.

─────────────────────────────────────────

المادة الثانية: موضوع العقد
بموجب هذا العقد، يلتزم الطرف الثاني بالعمل لدى الطرف الأول في الوظيفة المحددة بهذا العقد، وفقًا للأنظمة المعمول بها في المملكة العربية السعودية، ولوائح وسياسات الطرف الأول، وبما لا يخالف أحكام هذا العقد.

─────────────────────────────────────────

المادة الثالثة: المسمى الوظيفي والارتباط الإداري
يعمل الطرف الثاني لدى الطرف الأول بالمسمى الوظيفي: ${val(c.job_title)}، ضمن إدارة / قسم: ${val(c.department)}، ويرتبط إداريًا بـ ${val(c.reporting_to)}.

ويلتزم الطرف الثاني بأداء المهام والمسؤوليات المرتبطة بالوظيفة، ومنها:
${dutiesText}

ويحق للطرف الأول تعديل أو تطوير المهام الوظيفية بما يتناسب مع طبيعة العمل واحتياجاته، وبما لا يخالف الأنظمة المعمول بها.

─────────────────────────────────────────

المادة الرابعة: مقر العمل
يكون مقر عمل الطرف الثاني في ${val(c.work_location)}، وتكون طبيعة العمل: ${val(c.work_mode)}.
ويجوز للطرف الأول تكليف الطرف الثاني بالعمل في أي موقع أو مشروع تابع له أو مرتبط بأعماله، متى اقتضت مصلحة العمل ذلك، وبما لا يخالف الأنظمة المعمول بها.

─────────────────────────────────────────

المادة الخامسة: مدة العقد
نوع العقد: ${val(c.contract_type)}.
تبدأ علاقة العمل اعتبارًا من تاريخ ${val(c.start_date)}.
${durationClause}

─────────────────────────────────────────

المادة السادسة: فترة التجربة
${probationClause}

─────────────────────────────────────────

المادة السابعة: الراتب والبدلات والمزايا
يلتزم الطرف الأول بدفع الأجر الشهري للطرف الثاني وفق البيانات التالية:

• الراتب الأساسي: ${money(c.basic_salary)}
• بدل السكن: ${money(c.housing_allowance)}
• بدل النقل: ${money(c.transportation_allowance)}${c.other_allowances ? `\n• بدلات أخرى: ${c.other_allowances}` : ''}
• إجمالي الراتب الشهري: ${money(c.total_salary)}
• تاريخ صرف الراتب: ${val(c.salary_payment_date)}
• طريقة الصرف: ${val(c.salary_payment_method)}

${c.benefits ? `وتكون المزايا الإضافية على النحو التالي:\n${c.benefits}` : ''}

─────────────────────────────────────────

المادة الثامنة: أيام وساعات العمل
تكون أيام العمل الأسبوعية: ${val(c.working_days)}.
تكون ساعات العمل اليومية: ${val(c.working_hours)}.
تكون أيام الراحة الأسبوعية: ${val(c.weekly_rest_days)}.
ويلتزم الطرفان في ذلك بالأنظمة واللوائح المعمول بها في المملكة العربية السعودية.

─────────────────────────────────────────

المادة التاسعة: الإجازات
يستحق الطرف الثاني الإجازات وفقًا للأنظمة المعمول بها في المملكة العربية السعودية:
• الإجازة السنوية: ${val(c.annual_leave)}
• الإجازات الرسمية: ${val(c.official_holidays)}
• الإجازات المرضية: ${val(c.sick_leave)}${c.additional_leaves ? `\n• إجازات إضافية: ${c.additional_leaves}` : ''}

─────────────────────────────────────────

المادة العاشرة: التأمينات الاجتماعية والتأمين الطبي
${c.social_insurance ? 'يلتزم الطرف الأول بتسجيل الطرف الثاني في التأمينات الاجتماعية وفق الأحكام المعمول بها في المملكة العربية السعودية.' : 'لا ينطبق الاشتراك في التأمينات الاجتماعية على هذه الحالة وفق الأنظمة المعمول بها.'}
${medInsurance}

─────────────────────────────────────────

المادة الحادية عشرة: الالتزامات المهنية
يلتزم الطرف الثاني بما يلي:
1. أداء مهامه الوظيفية بكفاءة ومهنية واحترافية.
2. الالتزام بسياسات ولوائح وإجراءات الطرف الأول.
3. المحافظة على سمعة الطرف الأول ومصالحه.
4. الالتزام بأخلاقيات العمل والانضباط المهني.
5. عدم استخدام موارد الطرف الأول إلا لأغراض العمل.
6. التعاون مع فريق العمل والعملاء والشركاء بما يحقق مصلحة العمل.
7. تنفيذ التعليمات والتكليفات الصادرة من جهة الارتباط الإداري متى كانت ضمن نطاق العمل ولا تخالف النظام.

─────────────────────────────────────────
${c.clause_confidentiality ? `
المادة الثانية عشرة: السرية وعدم الإفصاح
يلتزم الطرف الثاني بالمحافظة على سرية جميع المعلومات والبيانات والوثائق والمستندات والملفات والخطط والأفكار والمشاريع والحلول التقنية والتجارية والتشغيلية التي يطلع عليها بحكم عمله لدى الطرف الأول.
ولا يجوز للطرف الثاني الإفصاح عن أي من تلك المعلومات لأي طرف ثالث، سواء أثناء سريان العقد أو بعد انتهائه، إلا بموافقة كتابية مسبقة من الطرف الأول أو بموجب متطلب نظامي.

─────────────────────────────────────────
` : ''}
${c.clause_ip ? `
المادة الثالثة عشرة: الملكية الفكرية
تعد جميع الأعمال والمخرجات والمواد والوثائق والتصاميم والأفكار والحلول والبرمجيات والنماذج والخطط والمحتويات التي يعدها أو يساهم فيها الطرف الثاني أثناء عمله أو بسبب عمله أو باستخدام موارد الطرف الأول ملكًا خالصًا للطرف الأول، ما لم يتم الاتفاق كتابةً على خلاف ذلك.
ويلتزم الطرف الثاني بعدم استخدام أو نشر أو نقل أو استغلال أي من تلك المخرجات خارج نطاق العمل دون موافقة كتابية مسبقة من الطرف الأول.

─────────────────────────────────────────
` : ''}
${c.clause_conflict ? `
المادة الرابعة عشرة: تعارض المصالح
يلتزم الطرف الثاني بالإفصاح للطرف الأول عن أي حالة تعارض مصالح فعلية أو محتملة قد تؤثر على أدائه أو قراراته أو التزاماته تجاه الطرف الأول.
كما يلتزم الطرف الثاني بعدم ممارسة أي نشاط أو عمل أو علاقة تجارية أو مهنية من شأنها الإضرار بمصالح الطرف الأول أو التأثير على التزاماته الوظيفية وفق الأنظمة المعمول بها.

─────────────────────────────────────────
` : ''}
${c.clause_assets ? `
المادة الخامسة عشرة: العهد والأجهزة والحسابات
يلتزم الطرف الثاني بالمحافظة على جميع العهد والأجهزة والأدوات والحسابات والصلاحيات والملفات والبيانات التي تسلم له من الطرف الأول لأغراض العمل.
ويكون الطرف الثاني مسؤولًا عن استخدامها بشكل مهني وآمن، وعدم تسليمها أو مشاركتها مع أي طرف آخر دون موافقة الطرف الأول.

─────────────────────────────────────────
` : ''}

المادة السادسة عشرة: إنهاء العقد
يجوز إنهاء هذا العقد وفقًا للأنظمة المعمول بها في المملكة العربية السعودية، وبحسب نوع العقد وطبيعته، ووفق فترة الإشعار المتفق عليها وهي: ${val(c.notice_period)}.
ولا يخل إنهاء العقد بأي حقوق أو التزامات نشأت قبل تاريخ الإنهاء، بما في ذلك الالتزامات المتعلقة بالسرية والملكية الفكرية وتسليم العهد والملفات.

─────────────────────────────────────────
${c.clause_handover ? `
المادة السابعة عشرة: تسليم العهد والملفات
يلتزم الطرف الثاني عند انتهاء العلاقة التعاقدية، لأي سبب كان، بتسليم جميع العهد والأجهزة والمستندات والملفات والحسابات والصلاحيات والبيانات والمخرجات التي تخص الطرف الأول أو عملاءه أو شركاءه.
كما يلتزم الطرف الثاني بعدم الاحتفاظ بأي نسخ ورقية أو إلكترونية من معلومات أو ملفات الطرف الأول إلا بموافقة كتابية منه.

─────────────────────────────────────────
` : ''}

المادة الثامنة عشرة: الإشعارات والمراسلات
تكون الإشعارات والمراسلات بين الطرفين من خلال العناوين ووسائل التواصل المسجلة في هذا العقد، أو من خلال البريد الإلكتروني، أو أي وسيلة رسمية يعتمدها الطرف الأول.
ويلتزم كل طرف بإبلاغ الطرف الآخر بأي تغيير يطرأ على بيانات التواصل الخاصة به.

─────────────────────────────────────────

المادة التاسعة عشرة: الأنظمة الحاكمة وتسوية النزاعات
يخضع هذا العقد للأنظمة واللوائح المعمول بها في المملكة العربية السعودية.
وفي حال نشوء أي نزاع بين الطرفين بشأن تفسير أو تنفيذ هذا العقد، فيتم السعي إلى حله وديًا أولًا، فإن تعذر ذلك أُحيل النزاع إلى الجهة المختصة نظامًا.
${nonCompeteArticle}
─────────────────────────────────────────

المادة العشرون: نسخ العقد
حرر هذا العقد من نسختين أصليتين بيد كل طرف نسخة للعمل بموجبها.

─────────────────────────────────────────

المادة الحادية والعشرون: أحكام عامة
أي تعديل أو إضافة على هذا العقد لا تكون نافذة إلا إذا كانت مكتوبة وموقعة من الطرفين.
وفي حال بطلان أي بند من بنود هذا العقد أو عدم قابليته للتنفيذ، فإن ذلك لا يؤثر على صحة باقي البنود متى أمكن استمرار العقد وفقًا للأنظمة المعمول بها.
${specialClause}

─────────────────────────────────────────

⚠️ ملاحظة قانونية مهمة:
هذا العقد نموذج تنظيمي لأغراض إدارية، ويجب مراجعته من مختص قانوني قبل الاعتماد النهائي أو الاستخدام الرسمي.`;

    return body.replace(/\n{3,}/g, '\n\n').trim();
  },

  // Render HTML version
  renderHTML(contract, settings) {
    const body = contract.contract_body || this.buildBody(contract, settings);
    const lines = body.split('\n');
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) { html += '<br>'; continue; }
      if (line.startsWith('المادة') && !line.startsWith('المادة ال') && line.includes(':')) {
        html += `<div class="contract-article-title">${this.escHtml(line)}</div>`;
      } else if (line.match(/^المادة (الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|الحادية|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العشرون)/)) {
        html += `<div class="contract-article-title">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('عقد عمل')) {
        html += `<div class="contract-title">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('بسم الله')) {
        html += `<div style="text-align:center;font-size:16px;margin-bottom:8px;">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('رقم العقد:')) {
        html += `<div class="contract-number-line">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('الطرف الأول:') || line.startsWith('الطرف الثاني:')) {
        html += `<div class="contract-party-title">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('─')) {
        html += `<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">`;
      } else if (line.startsWith('⚠️')) {
        html += `<div class="contract-legal-note">${this.escHtml(line)}</div>`;
      } else if (line.match(/^\d+\./)) {
        html += `<div style="padding-right:16px;margin:4px 0;">${this.escHtml(line)}</div>`;
      } else if (line.startsWith('•')) {
        html += `<div style="padding-right:16px;margin:3px 0;">${this.escHtml(line)}</div>`;
      } else {
        html += `<div style="margin:4px 0;">${this.escHtml(line)}</div>`;
      }
    }
    return html;
  },

  escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  // Generate RTF-based Word document
  generateWordBlob(contract, settings) {
    const body = contract.contract_body || this.buildBody(contract, settings);
    // Use HTML that Word can open as .doc
    const htmlDoc = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  @page { size: 21cm 29.7cm; margin: 2.5cm 3cm; mso-page-orientation: portrait; }
  body {
    font-family: "Traditional Arabic", Arial, sans-serif;
    font-size: 13pt;
    direction: rtl;
    text-align: right;
    line-height: 1.8;
    color: #1a1a1a;
    mso-bidi-language: AR-SA;
  }
  .header { text-align: center; border-bottom: 3px double #1a365d; padding-bottom: 16pt; margin-bottom: 20pt; }
  .contract-title { font-size: 20pt; font-weight: bold; color: #1a365d; }
  .article-title { font-size: 14pt; font-weight: bold; color: #1a365d; background: #f0f4f8; padding: 6pt 10pt; margin: 14pt 0 8pt; border-right: 4pt solid #c9a94e; }
  .party-title { font-size: 13pt; font-weight: bold; color: #1a365d; margin-top: 10pt; }
  .legal-note { background: #fffbeb; border: 1pt solid #fcd34d; padding: 10pt; font-size: 11pt; color: #92400e; text-align: center; margin-top: 20pt; }
  .separator { border: none; border-top: 1pt solid #ddd; margin: 10pt 0; }
  .sig-table { width: 100%; margin-top: 40pt; border-collapse: collapse; }
  .sig-table td { width: 50%; padding: 16pt; vertical-align: top; border: 1pt solid #e2e8f0; text-align: center; }
  .sig-title { font-size: 13pt; font-weight: bold; color: #1a365d; margin-bottom: 8pt; }
  .sig-line { border-top: 1pt solid #999; margin: 40pt 10pt 6pt; }
  p { margin: 4pt 0; }
</style>
</head>
<body>
${this.buildWordHTML(contract, settings)}
</body>
</html>`;
    return new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
  },

  buildWordHTML(contract, settings) {
    const c = contract;
    const s = settings;
    const body = c.contract_body || this.buildBody(c, s);
    const esc = this.escHtml.bind(this);

    let html = '<div class="header">';
    if (s.logo_url) html += `<img src="${s.logo_url}" style="max-height:70pt;max-width:180pt;object-fit:contain;margin-bottom:10pt;"><br>`;
    html += `<div class="contract-title">عقد عمل</div>`;
    html += `<p style="font-size:11pt;color:#555;">رقم العقد: ${c.contract_number}</p>`;
    html += '</div>';

    const lines = body.split('\n');
    for (const line of lines) {
      if (!line.trim()) { html += '<p>&nbsp;</p>'; continue; }
      if (line.startsWith('بسم الله')) { html += `<p style="text-align:center;font-size:15pt;">${esc(line)}</p>`; }
      else if (line.startsWith('عقد عمل')) { /* already in header */ }
      else if (line.startsWith('رقم العقد:')) { /* already in header */ }
      else if (line.match(/^المادة .+:/)) { html += `<div class="article-title">${esc(line)}</div>`; }
      else if (line.startsWith('الطرف الأول:') || line.startsWith('الطرف الثاني:')) { html += `<p class="party-title">${esc(line)}</p>`; }
      else if (line.startsWith('─')) { html += '<hr class="separator">'; }
      else if (line.startsWith('⚠️')) { html += `<div class="legal-note">${esc(line)}</div>`; }
      else { html += `<p>${esc(line)}</p>`; }
    }

    // Signature page
    html += `
<div style="margin-top:50pt;">
<div class="article-title">صفحة التوقيع</div>
<table class="sig-table">
<tr>
  <td>
    <div class="sig-title">الطرف الأول</div>
    <p>شركة سدير إكس</p>
    <p>يمثلها: ${esc(s.representative_name)}</p>
    <p>الصفة: ${esc(s.representative_title)}</p>
    ${s.rep_signature_url ? `<img src="${s.rep_signature_url}" style="max-height:50pt;max-width:120pt;object-fit:contain;margin:10pt auto;display:block;">` : '<div style="height:50pt;"></div>'}
    <div class="sig-line"></div>
    <p style="font-size:10pt;color:#666;">التوقيع</p>
    ${s.stamp_url ? `<img src="${s.stamp_url}" style="max-height:60pt;max-width:60pt;object-fit:contain;margin:8pt auto;display:block;opacity:0.85;">` : ''}
    <p style="font-size:10pt;color:#666;">التاريخ: ________________</p>
  </td>
  <td>
    <div class="sig-title">الطرف الثاني</div>
    <p>الاسم: ${esc(c.employee_name || '---')}</p>
    <p>رقم الهوية / الإقامة: ${esc(c.employee_id || '---')}</p>
    ${c.employee_signature_url ? `<img src="${c.employee_signature_url}" style="max-height:50pt;max-width:120pt;object-fit:contain;margin:10pt auto;display:block;">` : '<div style="height:50pt;"></div>'}
    <div class="sig-line"></div>
    <p style="font-size:10pt;color:#666;">التوقيع</p>
    <p style="font-size:10pt;color:#666;">التاريخ: ________________</p>
  </td>
</tr>
</table>
</div>`;

    return html;
  }
};
