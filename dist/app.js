const DEMO_CODE = 'FL-9482-XQ7K';
const defaultCase = {
  id: DEMO_CODE,
  type: 'ความไม่เป็นธรรม',
  detail: 'ได้รับการประเมินผลงานไม่เป็นธรรมและมีการโยนงานโดยไม่มีคำอธิบาย',
  location: 'ฝ่ายปฏิบัติการ',
  identity: 'anonymous',
  tier: 2,
  aiTier: 2,
  state: 'received',
  routed: false,
  assignee: '',
  createdAt: '12 ต.ค. 2569 10:24',
  updatedAt: '12 ต.ค. 2569 10:24',
  history: [
    { state: 'received', label: 'รับเรื่องแล้ว', detail: 'ระบบได้รับข้อมูลและสร้าง Case ID แล้ว', time: '10:24' }
  ]
};

let cases = JSON.parse(localStorage.getItem('fairLoopCases') || 'null') || [defaultCase];
let activeCaseId = cases[0]?.id || DEMO_CODE;
let currentRoute = 'home';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function persist() {
  localStorage.setItem('fairLoopCases', JSON.stringify(cases));
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function nowText() {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
}

function makeCode() {
  const a = Math.floor(1000 + Math.random() * 9000);
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FL-${a}-${b}`;
}

function getActiveCase() {
  return cases.find(item => item.id === activeCaseId) || cases[0];
}

function login() {
  const pin = $('#pin-input').value.replace(/\D/g, '');
  if (pin.length !== 6) {
    notify('กรุณากรอก PIN ให้ครบ 6 หลัก');
    return;
  }
  $('#login-view').classList.add('hidden');
  $('#app-shell').classList.remove('hidden');
  setRole('employee');
  routeTo('home');
}

$('#pin-input').addEventListener('input', event => {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
  $$('.pin-dots span').forEach((dot, index) => dot.classList.toggle('filled', index < event.target.value.length));
});
$('#pin-input').addEventListener('keydown', event => { if (event.key === 'Enter') login(); });
$('#login-btn').addEventListener('click', login);
$('#demo-pin-btn').addEventListener('click', () => {
  $('#pin-input').value = '256826';
  $$('.pin-dots span').forEach(dot => dot.classList.add('filled'));
  login();
});
$('#logout-btn').addEventListener('click', () => {
  $('#app-shell').classList.add('hidden');
  $('#login-view').classList.remove('hidden');
  $('#pin-input').value = '';
  $$('.pin-dots span').forEach(dot => dot.classList.remove('filled'));
});

function setRole(role) {
  $$('.role-btn').forEach(button => button.classList.toggle('active', button.dataset.role === role));
  $('#employee-app').classList.toggle('hidden', role !== 'employee');
  $('#review-app').classList.toggle('hidden', role !== 'review');
  $('#hr-app').classList.toggle('hidden', role !== 'hr');
  if (role === 'review') renderReview();
  if (role === 'hr') renderHr();
}

$$('.role-btn').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));

function routeTo(route) {
  currentRoute = route;
  $$('.route-view').forEach(view => view.classList.add('hidden'));
  const target = $(`#route-${route}`);
  if (target) target.classList.remove('hidden');
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route));
  if (route === 'tracker') renderTracker();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('[data-route]').forEach(button => button.addEventListener('click', () => routeTo(button.dataset.route)));

function aiReply(question) {
  const q = question.toLowerCase();
  if (q.includes('ลา') && !q.includes('ไม่เป็นธรรม')) {
    return {
      text: 'ตามระเบียบบริษัท พนักงานมีสิทธิลาป่วยตามวันที่ป่วยจริง โดยกรณีลาตั้งแต่ 3 วันทำงานขึ้นไป บริษัทอาจขอใบรับรองแพทย์ได้ คุณสามารถตรวจสอบรายละเอียดในคู่มือพนักงาน หมวดสิทธิการลา',
      transfer: false
    };
  }
  if (q.includes('เอกสาร') || q.includes('ทุจริต') || q.includes('สินบน')) {
    return {
      text: 'เหตุการณ์นี้อาจเกี่ยวข้องกับการทุจริตหรือการฝ่าฝืนระเบียบ ควรเก็บหลักฐานต้นฉบับไว้โดยไม่แก้ไข และหลีกเลี่ยงการเผชิญหน้ากับผู้เกี่ยวข้องโดยลำพัง',
      transfer: true,
      tier: 3,
      type: 'การทุจริตหรือผิดระเบียบ'
    };
  }
  return {
    text: 'เรื่องที่คุณเล่าอาจเกี่ยวข้องกับความไม่เป็นธรรมในการทำงาน คุณมีสิทธิขอเหตุผลและหลักเกณฑ์การประเมินอย่างชัดเจน หากต้องการให้มีผู้ตรวจสอบ สามารถส่งต่อผ่าน Safe Voice ได้โดยเลือกปกปิดตัวตน',
    transfer: true,
    tier: 2,
    type: 'ความไม่เป็นธรรม'
  };
}

function appendChat(question) {
  const messages = $('#chat-messages');
  const user = document.createElement('div');
  user.className = 'message user-message';
  user.innerHTML = `<div>${escapeHtml(question)}</div>`;
  messages.appendChild(user);

  const result = aiReply(question);
  const ai = document.createElement('div');
  ai.className = 'message ai-message';
  ai.innerHTML = `<span class="bot-avatar">AI</span><div>${result.text}<small style="display:block;margin-top:8px;color:#6c8191">อ้างอิง: คู่มือพนักงานและนโยบายบริษัทตัวอย่าง</small></div>`;
  messages.appendChild(ai);

  if (result.transfer) {
    const card = document.createElement('div');
    card.className = 'transfer-card';
    card.innerHTML = `<strong>ประเมินเบื้องต้น: Tier ${result.tier}</strong><p>คุณต้องการนำข้อมูลจากบทสนทนานี้ไปกรอกใน Safe Voice หรือไม่? ระบบจะยังไม่ส่งเรื่องจนกว่าคุณจะตรวจสอบและยืนยัน</p><button class="btn btn-accent">ไปที่ Safe Voice</button>`;
    card.querySelector('button').addEventListener('click', () => {
      $('#case-type').value = result.type;
      $('#case-detail').value = question;
      routeTo('safe');
    });
    messages.appendChild(card);
  }
  messages.scrollTop = messages.scrollHeight;
}

$('#chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#chat-input');
  const value = input.value.trim();
  if (!value) return;
  appendChat(value);
  input.value = '';
});

$$('[data-question]').forEach(button => button.addEventListener('click', () => appendChat(button.dataset.question)));

function inferTier(type, detail) {
  const text = `${type} ${detail}`;
  if (/ทุจริต|สินบน|ปลอม|ยักยอก|โกง|เอกสาร/.test(text)) return 3;
  if (/ไม่เป็นธรรม|เลือกปฏิบัติ|ประเมิน|โยนงาน|กดดัน/.test(text)) return 2;
  return 1;
}

$('#safe-form').addEventListener('submit', event => {
  event.preventDefault();
  const type = $('#case-type').value;
  const detail = $('#case-detail').value.trim();
  if (!type || !detail || !$('#case-consent').checked) {
    notify('กรุณากรอกข้อมูลและยืนยันก่อนส่ง');
    return;
  }
  const tier = inferTier(type, detail);
  const code = makeCode();
  const created = {
    id: code,
    type,
    detail,
    location: $('#case-location').value || 'ไม่ระบุ',
    identity: $('input[name="identity"]:checked').value,
    tier,
    aiTier: tier,
    state: 'received',
    routed: false,
    assignee: '',
    createdAt: nowText(),
    updatedAt: nowText(),
    history: [{ state: 'received', label: 'รับเรื่องแล้ว', detail: 'ระบบได้รับข้อมูลและสร้าง Case ID แล้ว', time: new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) }]
  };
  cases.unshift(created);
  activeCaseId = code;
  persist();
  $('#confirmation-code').textContent = code;
  $('#tracker-code').value = code;
  drawQr(code);
  routeTo('confirmation');
  renderReview();
});

function drawQr(code) {
  const canvas = $('#case-qr');
  const data = `${location.origin}${location.pathname}?case=${encodeURIComponent(code)}`;
  if (window.QRCode?.toCanvas) {
    window.QRCode.toCanvas(canvas, data, { width: 180, margin: 1, color: { dark: '#073a75', light: '#ffffff' } });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,180,180);
    ctx.fillStyle = '#073a75';
    for (let y=0;y<21;y++) for (let x=0;x<21;x++) if ((x*y+x+y+code.length)%3===0) ctx.fillRect(8+x*8,8+y*8,7,7);
  }
}

$('#copy-code').addEventListener('click', async () => {
  await navigator.clipboard?.writeText($('#confirmation-code').textContent);
  notify('คัดลอก Case ID แล้ว');
});

function stateLabel(state) {
  return ({ received:'รับเรื่องแล้ว', review:'FAIR LOOP กำลังตรวจสอบ', hr:'ส่งให้บริษัทแล้ว', investigating:'กำลังตรวจสอบ', action:'กำลังดำเนินการ', resolved:'แก้ไขแล้ว' })[state] || state;
}

function renderTimeline(caseItem) {
  const canonical = [
    ['received','รับเรื่องแล้ว','ระบบได้รับเรื่องของคุณแล้ว'],
    ['review','ตรวจสอบข้อมูล','AI และทีม FAIR LOOP ตรวจข้อมูลก่อนส่งต่อ'],
    ['investigating','กำลังดำเนินการ','บริษัทกำลังตรวจสอบและดำเนินการ'],
    ['resolved','แก้ไขแล้ว','ดำเนินการเสร็จสิ้นและแจ้งผลแล้ว']
  ];
  const order = { received:0, review:1, hr:2, investigating:2, action:2, resolved:3 };
  const current = order[caseItem.state] ?? 0;
  return canonical.map((item,index) => `<div class="timeline-item ${index<current?'done':''} ${index===current?'current':''}"><strong>${item[1]}</strong><span>${item[2]}</span>${index===current?`<small>อัปเดตล่าสุด ${caseItem.updatedAt}</small>`:''}</div>`).join('');
}

function renderTracker() {
  const code = $('#tracker-code').value.trim() || activeCaseId;
  const item = cases.find(c => c.id.toLowerCase() === code.toLowerCase());
  const detail = $('#tracker-detail');
  if (!item) { detail.classList.add('hidden'); return; }
  activeCaseId = item.id;
  detail.classList.remove('hidden');
  detail.innerHTML = `<div class="case-topline"><div><span class="eyebrow">CASE ID</span><h3>${item.id}</h3><p>${escapeHtml(item.type)}</p></div><span class="tier tier-${item.tier}">Tier ${item.tier}</span></div><div class="timeline">${renderTimeline(item)}</div><div class="trust-strip"><strong>ข้อมูลของคุณยังได้รับการปกป้อง</strong><span>${item.identity==='anonymous'?'บริษัทไม่เห็นชื่อของผู้แจ้งในเคสนี้':'คุณเลือกเปิดเผยตัวตนเพื่อให้บริษัทติดต่อได้'}</span></div>`;
}

$('#open-case-btn').addEventListener('click', () => {
  renderTracker();
  if ($('#tracker-detail').classList.contains('hidden')) notify('ไม่พบ Case ID นี้');
});
$('#scan-demo-btn').addEventListener('click', () => {
  $('#tracker-code').value = activeCaseId || DEMO_CODE;
  renderTracker();
  notify('จำลองการสแกน QR สำเร็จ');
});

function caseListHtml(mode) {
  const filtered = mode === 'review' ? cases.filter(c => !c.routed) : cases.filter(c => c.routed);
  if (!filtered.length) return `<div class="empty-state"><div><strong>ยังไม่มีเคสในขั้นตอนนี้</strong><p>ลองส่ง Safe Voice หรือส่งเคสจาก FAIR LOOP Review Console</p></div></div>`;
  return filtered.map(item => `<button class="case-list-item ${item.id===activeCaseId?'active':''}" data-case-id="${item.id}"><strong>${item.id}</strong><small>${escapeHtml(item.type)}</small><span class="tier tier-${item.tier}">Tier ${item.tier}</span></button>`).join('');
}

function renderReview() {
  $('#review-count').textContent = cases.filter(c => !c.routed).length;
  const list = $('#review-case-list');
  list.innerHTML = caseListHtml('review');
  $$('.case-list-item', list).forEach(button => button.addEventListener('click', () => { activeCaseId = button.dataset.caseId; renderReview(); }));
  const item = getActiveCase();
  const panel = $('#review-panel');
  if (!item || item.routed) { panel.innerHTML = `<div class="empty-state">เลือกเคสที่รอตรวจจากรายการ</div>`; return; }
  panel.innerHTML = `<span class="eyebrow">AI PRELIMINARY REVIEW</span><h3>${item.id}</h3><p>${escapeHtml(item.type)} · ส่งเมื่อ ${item.createdAt}</p><div class="summary-box"><strong>สรุปเคส</strong><p>${escapeHtml(item.detail)}</p><small>การเปิดเผยตัวตน: ${item.identity==='anonymous'?'ปกปิดต่อบริษัท':'เปิดเผยตัวตน'}</small></div><div class="ai-box"><strong>ผลคัดกรองจาก AI</strong><p><span class="tier tier-${item.aiTier}">Tier ${item.aiTier}</span> แนะนำให้ตรวจความครบถ้วนและส่งไปยัง ${item.aiTier===3?'คณะกรรมการตรวจสอบ':'HR Safe Voice'}</p><small>AI ไม่ได้ตัดสินความผิด เจ้าหน้าที่ต้องยืนยันผลก่อนส่งต่อ</small></div><h4>การตรวจสอบขั้นสุดท้าย</h4><div class="review-actions"><select id="review-tier"><option value="1" ${item.tier===1?'selected':''}>Tier 1 ข้อเสนอแนะ</option><option value="2" ${item.tier===2?'selected':''}>Tier 2 ความไม่เป็นธรรม</option><option value="3" ${item.tier===3?'selected':''}>Tier 3 ทุจริต/ผิดระเบียบ</option></select><select id="review-route"><option>HR Safe Voice</option><option>คณะกรรมการตรวจสอบ</option><option>ฝ่ายสวัสดิการ</option></select><textarea id="review-note" placeholder="บันทึกเหตุผลหรือข้อมูลที่ปกปิด"></textarea><button id="request-info" class="btn">ขอข้อมูลเพิ่ม</button><button id="route-hr" class="btn btn-primary">ยืนยันและส่งให้บริษัท</button></div><div class="audit-box"><strong>Audit Trail</strong><p>ระบบจะบันทึกผู้ตรวจ เวลา ระดับที่ยืนยัน และปลายทางที่ส่ง</p></div>`;
  $('#request-info').addEventListener('click', () => notify('ส่งคำขอข้อมูลเพิ่มผ่านกล่องข้อความนิรนามแล้ว'));
  $('#route-hr').addEventListener('click', () => {
    item.tier = Number($('#review-tier').value);
    item.routed = true;
    item.state = 'hr';
    item.updatedAt = nowText();
    item.history.push({state:'hr',label:'ส่งให้บริษัทแล้ว',detail:`ทีม FAIR LOOP ตรวจสอบและส่งไปยัง ${$('#review-route').value}`,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})});
    persist();
    notify('ส่งเคสให้บริษัทแล้ว');
    renderReview();
    renderHr();
  });
}

function renderHr() {
  const routed = cases.filter(c => c.routed);
  $('#hr-count').textContent = routed.length;
  const list = $('#hr-case-list');
  list.innerHTML = caseListHtml('hr');
  $$('.case-list-item', list).forEach(button => button.addEventListener('click', () => { activeCaseId = button.dataset.caseId; renderHr(); }));
  let item = routed.find(c => c.id === activeCaseId) || routed[0];
  const panel = $('#hr-panel');
  if (!item) { panel.innerHTML = `<div class="empty-state"><div><strong>ยังไม่มีเคสจาก FAIR LOOP</strong><p>เปลี่ยนไปมุมมอง FAIR LOOP และกดยืนยันส่งเคสก่อน</p></div></div>`; return; }
  activeCaseId = item.id;
  panel.innerHTML = `<span class="eyebrow">CASE MANAGEMENT</span><h3>${item.id}</h3><p>${escapeHtml(item.type)} · <span class="tier tier-${item.tier}">Tier ${item.tier}</span></p><div class="summary-box"><strong>สรุปที่ได้รับจาก FAIR LOOP</strong><p>${escapeHtml(item.detail)}</p><small>ข้อมูลส่วนบุคคลถูกปกปิดตามการตั้งค่าของผู้แจ้ง</small></div><h4>ผู้รับผิดชอบและสถานะ</h4><div class="review-actions"><select id="hr-assignee"><option value="">เลือกผู้รับผิดชอบ</option><option ${item.assignee==='HR Safe Voice'?'selected':''}>HR Safe Voice</option><option ${item.assignee==='คณะกรรมการตรวจสอบ'?'selected':''}>คณะกรรมการตรวจสอบ</option><option ${item.assignee==='ฝ่ายบัญชี'?'selected':''}>ฝ่ายบัญชี</option></select><select id="hr-state" class="status-select"><option value="hr" ${item.state==='hr'?'selected':''}>รับเคสแล้ว</option><option value="investigating" ${item.state==='investigating'?'selected':''}>กำลังตรวจสอบ</option><option value="action" ${item.state==='action'?'selected':''}>กำลังดำเนินการ</option><option value="resolved" ${item.state==='resolved'?'selected':''}>แก้ไขแล้ว</option></select><textarea id="hr-update" placeholder="ข้อความอัปเดตถึงผู้แจ้ง เช่น อยู่ระหว่างตรวจสอบเอกสาร"></textarea><button id="save-update" class="btn btn-primary">บันทึกและอัปเดตผู้แจ้ง</button></div><div class="audit-box"><strong>อัปเดตแบบ Real-time</strong><p>ทุกการเปลี่ยนสถานะจะปรากฏใน Case Tracker และถูกบันทึกพร้อมเวลา</p></div>`;
  $('#save-update').addEventListener('click', () => {
    const nextState = $('#hr-state').value;
    const note = $('#hr-update').value.trim() || `เปลี่ยนสถานะเป็น ${stateLabel(nextState)}`;
    item.assignee = $('#hr-assignee').value || item.assignee || 'HR Safe Voice';
    item.state = nextState;
    item.updatedAt = nowText();
    item.history.push({state:nextState,label:stateLabel(nextState),detail:note,time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})});
    persist();
    notify('อัปเดตสถานะถึงผู้แจ้งแล้ว');
    renderHr();
  });
}

function escapeHtml(value='') {
  return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
}

const queryCase = new URLSearchParams(location.search).get('case');
if (queryCase) {
  $('#pin-input').value = '256826';
  activeCaseId = queryCase;
  $('#tracker-code').value = queryCase;
}

renderReview();
renderHr();
