'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const works = [
  ['新龙门客栈', '贾廷 · 新国风环境式越剧'],
  ['我的大观园', '贾宝玉 · 青春越剧'],
  ['何文秀', '尹派经典 · 小生风骨'],
  ['梁山伯与祝英台', '梁山伯 · 经典传承']
];

const interests = [
  ['◌', '尹派艺术', '重视唱腔韵味、小生气质与人物精神的当代表达。'],
  ['剑', '身段与武戏', '在公开报道中以扎实基本功、利落身段和武戏表现受到关注。'],
  ['剧', '人物创造', '注重从人物内心出发，让传统角色与今天的观众相遇。'],
  ['新', '传统新生', '持续探索戏曲与青年审美、舞台科技和新传播方式的连接。']
];

const quizQuestions = [
  { q: '陈丽君主要工哪个行当？', options: ['小生', '花旦', '老生'], answer: 0, note: '她是越剧尹派小生演员。' },
  { q: '陈丽君在《新龙门客栈》中饰演谁？', options: ['贾廷', '金镶玉', '周淮安'], answer: 0, note: '她在剧中饰演贾廷。' },
  { q: '她主要学习并传承哪一越剧流派？', options: ['尹派', '吕派', '范派'], answer: 0, note: '她工尹派小生。' },
  { q: '《我的大观园》中陈丽君饰演谁？', options: ['贾宝玉', '林黛玉', '薛宝钗'], answer: 0, note: '她在剧中饰演贾宝玉。' },
  { q: '陈丽君的家乡是浙江哪座城市？', options: ['嵊州', '临海', '嘉兴'], answer: 0, note: '她出生于越剧发源地浙江嵊州。' }
];

const fallbackDynamics = {
  updatedAt: '2026-08-05T07:20:00+08:00',
  version: '2026.08.05',
  items: [
    { date: '2026-04-24', title: '担任艺术生产与创作部副主任', desc: '公开报道显示，陈丽君已担任浙江小百花越剧院艺术生产与创作部副主任。', source: '澎湃新闻', url: 'https://www.thepaper.cn/newsDetail_forward_33041741', tag: '任职' },
    { date: '2026-03-01', title: '随团完成台湾巡演', desc: '浙江小百花越剧院在桃园、台北演出《我的大观园》与折子戏专场，陈丽君参与演出及互动。', source: '新华网', url: 'https://www.news.cn/20260301/a66bb7cfef9f4af886e6c4ff8f152831/c.html', tag: '演出' },
    { date: '2026-01-16', title: '获一级演员任职资格', desc: '公开资料显示，陈丽君获得一级演员任职资格。', source: '公开资料汇编', url: 'https://zh.wikipedia.org/zh-cn/%E9%99%88%E4%B8%BD%E5%90%9B', tag: '荣誉' }
  ]
};

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function safeExternalUrl(url) {
  try {
    const parsed = new URL(url, location.href);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '时间待核验';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}

$('#works').innerHTML = works.map(w => `
  <article class="work" tabindex="0">
    <div class="art"></div>
    <div class="work-copy"><h3>${escapeHTML(w[0])}</h3><p>${escapeHTML(w[1])}</p></div>
  </article>`).join('');

$('#interests').innerHTML = interests.map(x => `
  <article class="interest"><span>${escapeHTML(x[0])}</span><h3>${escapeHTML(x[1])}</h3><p>${escapeHTML(x[2])}</p></article>`).join('');

function renderFeed(payload, mode = 'local') {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  $('#feed').innerHTML = items.map(x => `
    <article class="feed-item">
      <div class="feed-meta"><time>${escapeHTML(x.date)}</time><span>${escapeHTML(x.tag || '动态')}</span></div>
      <h3>${escapeHTML(x.title)}</h3>
      <p>${escapeHTML(x.desc)}</p>
      <a target="_blank" rel="noopener noreferrer" href="${safeExternalUrl(x.url)}">${escapeHTML(x.source || '公开来源')} · 阅读原文 →</a>
    </article>`).join('');

  const prefix = mode === 'network' ? '已同步本站最新资料包' : '已载入本机核验资料包';
  $('#feedStatus').innerHTML = `${prefix} · 更新至 <b>${escapeHTML(formatTime(payload.updatedAt))}</b>`;
  $('#feedFreshness').textContent = `资料版本 ${payload.version || '本地版'}`;
}

async function loadDynamics({ announce = false } = {}) {
  const btn = $('#refreshBtn');
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  $('#feedStatus').textContent = '正在检查本站最新资料包…';
  try {
    const response = await fetch(`./data/dynamics.json?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items) || !data.items.length) throw new Error('数据格式不完整');
    renderFeed(data, 'network');
    localStorage.setItem('dynamicsCache', JSON.stringify(data));
    if (announce) showToast('已完成同步');
  } catch (error) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem('dynamicsCache') || 'null'); } catch {}
    renderFeed(cached?.items?.length ? cached : fallbackDynamics, 'local');
    if (announce) showToast('当前网络不可用，已显示本机核验资料');
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}

$('#refreshBtn').addEventListener('click', () => loadDynamics({ announce: true }));
renderFeed(fallbackDynamics, 'local');
loadDynamics();

$$('[data-go]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.go;
  const target = key === 'top' ? document.body : key === 'works' ? $('#works') : key === 'fan' ? $('.fan-card') : $(`#${key}`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

$('#themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');

$('#favBtn').addEventListener('click', () => {
  const on = localStorage.getItem('fav') !== '1';
  localStorage.setItem('fav', on ? '1' : '0');
  $('#favBtn').textContent = on ? '♥ 已收藏' : '♡ 收藏';
  showToast(on ? '已收藏到本机' : '已取消收藏');
});
if (localStorage.getItem('fav') === '1') $('#favBtn').textContent = '♥ 已收藏';

const fortunes = ['一身清气，步履有光。', '慢工守艺，自有回响。', '今日宜听一段越韵。', '台上一分钟，台下万千功。', '花开有时，热爱长青。'];
$('#fortuneBtn').addEventListener('click', () => {
  $('#fortune').textContent = fortunes[Math.floor(Math.random() * fortunes.length)];
});

let checkCount = Number(localStorage.getItem('check') || 0);
$('#checkCount').textContent = `${checkCount} 次`;

const modal = $('#modal');
const modalCard = $('.modal-card');
const modalBody = $('#modalBody');
let lastFocused = null;

function closeModal() {
  modal.hidden = true;
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  modalBody.innerHTML = '';
  lastFocused?.focus?.();
}

function openModal() {
  lastFocused = document.activeElement;
  modal.hidden = false;
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => $('#closeModal').focus());
}

$('#closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
modalCard.addEventListener('click', event => event.stopPropagation());

function renderQuiz(index = 0, score = 0, answered = false) {
  const item = quizQuestions[index];
  const progress = Math.round(((index + 1) / quizQuestions.length) * 100);
  modalBody.innerHTML = `
    <section class="quiz" aria-live="polite">
      <div class="quiz-top"><span>第 ${index + 1} / ${quizQuestions.length} 题</span><span>得分 ${score}</span></div>
      <div class="quiz-progress"><i style="width:${progress}%"></i></div>
      <h2>丽君小考</h2>
      <p class="quiz-question">${escapeHTML(item.q)}</p>
      <div class="quiz-options">
        ${item.options.map((option, optionIndex) => `<button class="quiz-option" data-option="${optionIndex}" ${answered ? 'disabled' : ''}>${escapeHTML(option)}</button>`).join('')}
      </div>
      <div id="quizFeedback" class="quiz-feedback" hidden></div>
      <div class="quiz-actions">
        <button class="secondary-action" id="quitQuiz">退出小考</button>
        <button class="action" id="nextQuiz" hidden>${index === quizQuestions.length - 1 ? '查看成绩' : '下一题'}</button>
      </div>
    </section>`;

  $('#quitQuiz').addEventListener('click', closeModal);
  $$('.quiz-option', modalBody).forEach(button => button.addEventListener('click', () => {
    const selected = Number(button.dataset.option);
    const correct = selected === item.answer;
    const nextScore = score + (correct ? 1 : 0);
    $$('.quiz-option', modalBody).forEach((optionButton, optionIndex) => {
      optionButton.disabled = true;
      if (optionIndex === item.answer) optionButton.classList.add('correct');
      if (optionIndex === selected && !correct) optionButton.classList.add('wrong');
    });
    const feedback = $('#quizFeedback');
    feedback.hidden = false;
    feedback.className = `quiz-feedback ${correct ? 'ok' : 'no'}`;
    feedback.innerHTML = `<b>${correct ? '回答正确' : '回答不正确'}</b><span>${escapeHTML(item.note)}</span>`;
    const next = $('#nextQuiz');
    next.hidden = false;
    next.addEventListener('click', () => {
      if (index < quizQuestions.length - 1) renderQuiz(index + 1, nextScore);
      else renderQuizResult(nextScore);
    }, { once: true });
  }));
}

function renderQuizResult(score) {
  localStorage.setItem('quizBest', String(Math.max(score, Number(localStorage.getItem('quizBest') || 0))));
  modalBody.innerHTML = `
    <section class="quiz-result">
      <div class="result-ring"><b>${score}</b><span>/ ${quizQuestions.length}</span></div>
      <h2>小考完成</h2>
      <p>${score === quizQuestions.length ? '满分！你对丽君舞台很熟悉。' : score >= 3 ? '表现不错，再读一读动态与作品会更熟悉。' : '继续探索作品与人物档案，下次会更好。'}</p>
      <button class="action" id="retryQuiz">再答一次</button>
      <button class="secondary-action full" id="finishQuiz">完成</button>
    </section>`;
  $('#retryQuiz').addEventListener('click', () => renderQuiz());
  $('#finishQuiz').addEventListener('click', closeModal);
}

$$('[data-modal]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.modal;
  if (type === 'checkin') {
    checkCount += 1;
    localStorage.setItem('check', String(checkCount));
    $('#checkCount').textContent = `${checkCount} 次`;
    modalBody.innerHTML = `<h2>签到成功</h2><p>这是你在本机的第 <b>${checkCount}</b> 次越韵签到。</p><button class="action" id="doneCheckin">完成</button>`;
    openModal();
    $('#doneCheckin').addEventListener('click', closeModal);
    return;
  }
  if (type === 'note') {
    modalBody.innerHTML = `<h2>写一封云笺</h2><textarea id="noteArea" maxlength="500" placeholder="写下你对舞台、角色或越剧的感受…">${escapeHTML(localStorage.getItem('note') || '')}</textarea><div class="form-actions"><button class="secondary-action" id="cancelNote">取消</button><button class="action" id="saveNote">保存到本机</button></div>`;
    openModal();
    $('#cancelNote').addEventListener('click', closeModal);
    $('#saveNote').addEventListener('click', () => {
      localStorage.setItem('note', $('#noteArea').value.trim());
      showToast('云笺已保存到本机');
      closeModal();
    });
    return;
  }
  if (type === 'quiz') {
    renderQuiz();
    openModal();
    return;
  }
  if (type === 'share') {
    modalBody.innerHTML = `<h2>分享卡</h2><div class="share-card"><small>云上小百花</small><h1>李丽君</h1><p>尹韵清声 · 让传统被今天听见</p></div><p>可使用 iPhone 截图保存。此版本不调用境外图片或字体服务。</p><button class="action" id="closeShare">完成</button>`;
    openModal();
    $('#closeShare').addEventListener('click', closeModal);
  }
}));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2200);
}

window.addEventListener('error', () => showToast('页面遇到异常，请刷新后重试'));

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}


// ===== 远程影像志 1.1.0 =====
const remoteGallery = [{"url": "https://www.news.cn/local/20240814/ae932498ec0947358de3b92429544868/20240814ae932498ec0947358de3b92429544868_20240814f35b0cbdb51a4961804b549314bfc236.jpg", "caption": "《新龙门客栈》贾廷与金镶玉", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20231124/00ba72a8c66a4630a66707a433fd96e0/2023112400ba72a8c66a4630a66707a433fd96e0_2023112441f9a421932741e9997da4773cdd8cbf.jpeg", "caption": "环境式越剧对手戏", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20231222/276078f589e74980b1304caacb0dd88f/20231222276078f589e74980b1304caacb0dd88f_2023122181e1c764aa884a84bed39c0bc0c67553.jpg", "caption": "金镶玉人物形象", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20231222/276078f589e74980b1304caacb0dd88f/20231222276078f589e74980b1304caacb0dd88f_20231221c93a7fb573474956aaee463ff09d7bc1.jpg", "caption": "贾廷经典造型", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/local/20231223/4ea507b8910f40e89ce7584528f7d1ec/202312234ea507b8910f40e89ce7584528f7d1ec_6d79b714682647d89ccfbc8732e2ccd9.jpg", "caption": "贾廷舞台瞬间", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/local/20231223/4ea507b8910f40e89ce7584528f7d1ec/202312234ea507b8910f40e89ce7584528f7d1ec_bb50e7aba22c426894369e93a5b4b408.png", "caption": "演出返场群像", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_2024051761b49213f3924bd4b341dfc5042669d6.jpg", "caption": "舞台后台记录", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_20240517c0eed701994d4db08ec3ca82435da944.jpg", "caption": "《钱塘里》舞台群像", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_2024051705d5bb98dfda4e3d84aaab5e90d07e51.jpg", "caption": "化妆间准备", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_20240517fa17dcbcd8c746efa4fd0f1a33abcd01.jpg", "caption": "《新龙门客栈》人物关系", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_20240517d53bc06cbff54f84a8266a45355d8475.jpg", "caption": "越剧经典舞台形象", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/culture/20240517/14654a59501646eb98588e99f54769a3/2024051714654a59501646eb98588e99f54769a3_20240517a673ebad2dca4e9cb5310e4f475be830.jpg", "caption": "演员与观众互动", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20231124/00ba72a8c66a4630a66707a433fd96e0/2023112400ba72a8c66a4630a66707a433fd96e0_2023112427681a5b58644851a8d4cf56e2f848c7.jpeg", "caption": "陈丽君与老师交流", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20260724/c0c82ca28f3c47a795fab62899a6349b/38bqyjLjNSXYPj2n.jpg", "caption": "影视跨界角色", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/local/20240520/f38c6c64c801446996171641e4d8f2c3/20240520f38c6c64c801446996171641e4d8f2c3_7b25e8516d06421ab02266e54ca5384c.JPG", "caption": "新版《梁祝》选段", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/politics/20260111/ebb4525cdb8c463a8ac4a96d5895e435/20260111ebb4525cdb8c463a8ac4a96d5895e435_bf827df44d5f42da8d7381d8edadeba5.JPG", "caption": "戏曲舞台群像", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/politics/20260111/ebb4525cdb8c463a8ac4a96d5895e435/20260111ebb4525cdb8c463a8ac4a96d5895e435_e5698a0206f34b41a17fae3614de2893.JPG", "caption": "梁山伯舞台形象", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20250519/4fba9d61bac64ba78513c0aca187f1fa/202505194fba9d61bac64ba78513c0aca187f1fa_20250519fc9b96b637674852bf7aaf080a9df070.jpeg", "caption": "《我的大观园》群像", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/ent/20260330/bf262f7f41b54eae96050b07a898da73/20260330bf262f7f41b54eae96050b07a898da73_20260330397d991d969c409db22c2c05619d213c.jpg", "caption": "话剧《枕头人》造型", "source": "新华网 / 新华社公开报道"}, {"url": "https://www.news.cn/local/20240814/ae932498ec0947358de3b92429544868/20240814ae932498ec0947358de3b92429544868_20240814f35b0cbdb51a4961804b549314bfc236.jpg", "caption": "新国风舞台瞬间", "source": "新华网 / 新华社公开报道"}];

function renderRemoteGallery(){
  const grid = document.querySelector('#galleryGrid');
  if(!grid) return;
  grid.innerHTML = remoteGallery.map((item,index)=>`<button class="gallery-item" type="button" data-gallery-index="${index}" aria-label="查看第${index+1}张图片：${escapeHTML(item.caption)}"><span class="gallery-image-wrap"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${item.url}" alt="${escapeHTML(item.caption)}"><i class="image-fallback">图片暂不可用</i></span><span class="gallery-caption"><b>${String(index+1).padStart(2,'0')}</b><em>${escapeHTML(item.caption)}</em></span></button>`).join('');
  grid.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.closest('.gallery-image-wrap').classList.add('failed'),{once:true}));
  grid.querySelectorAll('[data-gallery-index]').forEach(btn=>btn.addEventListener('click',()=>openGallery(Number(btn.dataset.galleryIndex))));
}
function openGallery(index){
  const item=remoteGallery[index];
  modalBody.innerHTML=`<section class="gallery-viewer"><div class="gallery-viewer-image"><img referrerpolicy="no-referrer" src="${item.url}" alt="${escapeHTML(item.caption)}"><span>图片加载失败，可稍后重试</span></div><div class="gallery-viewer-copy"><small>${index+1} / ${remoteGallery.length}</small><h2>${escapeHTML(item.caption)}</h2><p>${escapeHTML(item.source)}</p><div class="gallery-nav"><button class="secondary-action" id="galleryPrev">上一张</button><button class="action" id="galleryNext">${index===remoteGallery.length-1?'回到第一张':'下一张'}</button></div></div></section>`;
  openModal();
  const big=modalBody.querySelector('.gallery-viewer-image img');
  big.addEventListener('error',()=>big.parentElement.classList.add('failed'),{once:true});
  document.querySelector('#galleryPrev').addEventListener('click',()=>openGallery((index-1+remoteGallery.length)%remoteGallery.length));
  document.querySelector('#galleryNext').addEventListener('click',()=>openGallery((index+1)%remoteGallery.length));
}
renderRemoteGallery();
