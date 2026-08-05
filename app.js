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
  { q: '陈丽君主要工哪个行当？', options: ['小生', '老生', '小生'], answer: 0, note: '她是越剧尹派小生演员。' },
  { q: '陈丽君在《新龙门客栈》中饰演谁？', options: ['贾廷', '贾廷', '周淮安'], answer: 0, note: '她饰演客栈老板娘贾廷。' },
  { q: '她主要师承哪一越剧流派？', options: ['尹派', '尹派', '范派'], answer: 0, note: '她师承尹派。' },
  { q: '《钱塘里》属于哪类题材？', options: ['现实题材', '神话题材', '武侠题材'], answer: 0, note: '《钱塘里》是一部现实题材越剧。' },
  { q: '青春越剧《我的大观园》在2026年首先于哪座城市首演？', options: ['杭州', '北京', '广州'], answer: 0, note: '2026年7月在杭州首演。' }
];

const fallbackDynamics = {
  updatedAt: '2026-08-04T22:30:00+08:00',
  version: '2026.08.04',
  items: [
    { date: '2026-08-02', title: '《我的大观园》宁波站演出完成', desc: '青春越剧《我的大观园》于宁波天然舞台演出，陈丽君领衔饰演我的大观园。', source: '中国宁波网', url: 'https://news.cnnb.com.cn/system/2026/08/01/030799687.shtml', tag: '演出' },
    { date: '2026-07-19', title: '青春越剧《我的大观园》杭州首演', desc: '该剧在杭州首演，以青春化表达重新呈现越剧早期经典。', source: '中国新闻网', url: 'https://www.chinanews.com.cn/cul/2026/07-19/10662317.shtml', tag: '首演' },
    { date: '2026-01-18', title: '获评一级演员', desc: '公开报道显示，陈丽君获一级演员任职资格。', source: '新华网', url: 'https://app.xinhuanet.com/news/article.html?articleId=ac5c447346b445835e45c0e6a409c4d0', tag: '荣誉' }
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

const fortunes = ['水袖起落，心有清风。', '慢工守艺，自有回响。', '今日宜听一段越韵。', '台上一分钟，台下万千功。', '花开有时，热爱长青。'];
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
    modalBody.innerHTML = `<h2>分享卡</h2><div class="share-card"><small>君行越韵</small><h1>陈丽君</h1><p>越韵新声 · 让传统被今天听见</p></div><p>可使用 iPhone 截图保存。此版本不调用境外图片或字体服务。</p><button class="action" id="closeShare">完成</button>`;
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


// ===== 远程影像志 1.2.0 =====
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


// ===== 中国主流平台互动观察 1.3.0 =====
const socialFallback = {"updatedAt": "2026-08-05 20:00", "version": "1.2.0", "actor": "陈丽君", "platforms": [{"name": "微博", "title": "超话与舞台话题", "desc": "角色讨论、舞台动态与粉丝互动内容更新密集。", "url": "https://s.weibo.com/weibo?q=%23%E9%99%88%E4%B8%BD%E5%90%9B%23", "type": "话题"}, {"name": "抖音", "title": "短视频与直播切片", "desc": "适合发现唱段、身段、直播片段与戏迷二创。", "url": "https://www.douyin.com/search/%E9%99%88%E4%B8%BD%E5%90%9B", "type": "视频"}, {"name": "今日头条", "title": "媒体报道与用户讨论", "desc": "聚合人物报道、演出资讯及评论区观点。", "url": "https://so.toutiao.com/search?keyword=%E9%99%88%E4%B8%BD%E5%90%9B", "type": "资讯"}, {"name": "百度", "title": "全网热点检索", "desc": "快速查看近期报道、百科资料与平台聚合结果。", "url": "https://www.baidu.com/s?wd=%E9%99%88%E4%B8%BD%E5%90%9B", "type": "综合"}, {"name": "百度贴吧", "title": "长帖与戏迷交流", "desc": "适合浏览长篇观后感、作品讨论和资料整理。", "url": "https://tieba.baidu.com/f/search/res?ie=utf-8&qw=%E9%99%88%E4%B8%BD%E5%90%9B", "type": "论坛"}, {"name": "哔哩哔哩", "title": "长视频与唱段合集", "desc": "适合观看舞台混剪、尹派赏析和越剧科普。", "url": "https://search.bilibili.com/all?keyword=%E9%99%88%E4%B8%BD%E5%90%9B", "type": "视频"}], "signals": [{"title": "《我的大观园》舞台回声", "desc": "围绕贾宝玉塑造、唱腔表达、舞美与巡演反馈的集中讨论。", "tag": "演出讨论", "platforms": ["微博", "抖音", "今日头条"]}, {"title": "贾廷角色与出圈片段", "desc": "环境式越剧互动、人物气场与经典片段仍是高频内容。", "tag": "角色热点", "platforms": ["微博", "抖音", "哔哩哔哩"]}, {"title": "尹派小生身段赏析", "desc": "从扇子功、眼神、台步和唱腔切入的专业向内容。", "tag": "艺术赏析", "platforms": ["哔哩哔哩", "百度贴吧", "微博"]}, {"title": "演出信息与票务提醒", "desc": "围绕公开演出日程、场馆信息和观演提示的实用讨论。", "tag": "实用信息", "platforms": ["今日头条", "百度", "微博"]}], "methodNote": "讨论方向由公开页面人工核验后整理；不抓取私人评论，不展示无法核验的实时排名。"};
let socialPayload = socialFallback;
let socialFilterValue = '全部';

function platformInitial(name) { return String(name || '平').slice(0, 1); }
function renderSocialHub() {
  const platforms = Array.isArray(socialPayload.platforms) ? socialPayload.platforms : [];
  const signals = Array.isArray(socialPayload.signals) ? socialPayload.signals : [];
  const filterNames = ['全部', ...new Set(platforms.map(x => x.name))];
  const filter = document.querySelector('#socialFilter');
  if (!filter) return;
  filter.innerHTML = filterNames.map(name => `<button type="button" class="${name === socialFilterValue ? 'active' : ''}" data-social-filter="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join('');
  filter.querySelectorAll('[data-social-filter]').forEach(btn => btn.addEventListener('click', () => {
    socialFilterValue = btn.dataset.socialFilter;
    renderSocialHub();
  }));
  const visibleSignals = socialFilterValue === '全部' ? signals : signals.filter(x => (x.platforms || []).includes(socialFilterValue));
  document.querySelector('#socialSignals').innerHTML = visibleSignals.map((item, index) => `
    <article class="signal-card">
      <div class="signal-top"><span>${escapeHTML(item.tag || '互动观察')}</span><button type="button" class="signal-save" data-signal-save="${index}" aria-label="收藏该讨论方向">${localStorage.getItem('陈丽君-signal-' + item.title) === '1' ? '♥' : '♡'}</button></div>
      <h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.desc)}</p>
      <div class="signal-platforms">${(item.platforms || []).map(p => `<i>${escapeHTML(p)}</i>`).join('')}</div>
    </article>`).join('') || '<div class="empty-state">该平台暂无独立观察卡，可直接进入平台查看。</div>';
  document.querySelectorAll('[data-signal-save]').forEach(btn => btn.addEventListener('click', () => {
    const item = visibleSignals[Number(btn.dataset.signalSave)]; if (!item) return;
    const key = '陈丽君-signal-' + item.title; const on = localStorage.getItem(key) !== '1';
    localStorage.setItem(key, on ? '1' : '0'); btn.textContent = on ? '♥' : '♡'; showToast(on ? '已收藏讨论方向' : '已取消收藏');
  }));
  const visiblePlatforms = socialFilterValue === '全部' ? platforms : platforms.filter(x => x.name === socialFilterValue);
  document.querySelector('#platformGrid').innerHTML = visiblePlatforms.map(item => `
    <a class="platform-card" href="${safeExternalUrl(item.url)}" target="_blank" rel="noopener noreferrer">
      <span class="platform-logo">${escapeHTML(platformInitial(item.name))}</span><div><b>${escapeHTML(item.name)}</b><em>${escapeHTML(item.type)}</em><p>${escapeHTML(item.desc)}</p></div><strong>打开 ↗</strong>
    </a>`).join('');
  document.querySelector('#socialStatus').innerHTML = `观察资料更新至 <b>${escapeHTML(socialPayload.updatedAt || '待核验')}</b> · 不显示虚构热度数值`;
}

async function loadSocialHub(announce = false) {
  const btn = document.querySelector('#socialRefreshBtn'); if (btn) btn.disabled = true;
  try {
    const response = await fetch(`./data/social.json?v=${Date.now()}`, {cache:'no-store', headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error('social data unavailable');
    const data = await response.json();
    if (!Array.isArray(data.platforms) || !Array.isArray(data.signals)) throw new Error('invalid social data');
    socialPayload = data; localStorage.setItem('陈丽君-social-cache', JSON.stringify(data)); renderSocialHub();
    if (announce) showToast('互动观察资料已刷新');
  } catch (error) {
    try { const cached = JSON.parse(localStorage.getItem('陈丽君-social-cache') || 'null'); if (cached?.platforms) socialPayload = cached; } catch {}
    renderSocialHub(); if (announce) showToast('网络不可用，已显示本机观察资料');
  } finally { if (btn) btn.disabled = false; }
}
document.querySelector('#socialRefreshBtn')?.addEventListener('click', () => loadSocialHub(true));
renderSocialHub(); loadSocialHub(false);

// ===== 每日丽君情报站 1.4.0 =====
const intelFallback={updatedAt:'2026-08-06T03:00:00+08:00',checkedAt:'2026-08-06T03:00:00+08:00',version:'2.0.0',checks:[],items:[]};
const intelSources=[
 ['浙江小百花','院团与演出','https://www.baidu.com/s?wd='+encodeURIComponent('浙江小百花越剧院 陈丽君')],
 ['新华网','权威新闻','https://www.baidu.com/s?wd='+encodeURIComponent('site:news.cn 陈丽君')],
 ['中国新闻网','文化资讯','https://www.baidu.com/s?wd='+encodeURIComponent('site:chinanews.com.cn 陈丽君')],
 ['潮新闻','浙江本地','https://www.baidu.com/s?wd='+encodeURIComponent('site:tidenews.com.cn 陈丽君')],
 ['新浪微博','本人/话题','https://s.weibo.com/weibo?q='+encodeURIComponent('陈丽君')],
 ['抖音','短视频动态','https://www.douyin.com/search/'+encodeURIComponent('陈丽君')],
 ['哔哩哔哩','舞台视频','https://search.bilibili.com/all?keyword='+encodeURIComponent('陈丽君')],
 ['百度','全网聚合','https://www.baidu.com/s?wd='+encodeURIComponent('陈丽君 最新')]
];
let intelPayload=intelFallback,intelFilter='全部',intelQuery='';
function intelDateValue(x){const t=new Date(x.date||0).getTime();return Number.isFinite(t)?t:0;}
function intelFreshCount(items){const now=Date.now();return items.filter(x=>now-intelDateValue(x)<=7*86400000&&now>=intelDateValue(x)).length;}
const intelLayers=['官方与本人','权威媒体','演出与节目','视频平台','戏迷社区'];
function buildDailyBrief(items){
 const sorted=[...items].sort((a,b)=>intelDateValue(b)-intelDateValue(a));
 const fresh=sorted.filter(x=>Date.now()-intelDateValue(x)<=7*86400000&&Date.now()>=intelDateValue(x));
 const sourceCount=new Set(sorted.map(x=>x.source).filter(Boolean)).size;
 const cats=[...new Set(fresh.map(x=>x.category).filter(Boolean))];
 const top=fresh.slice(0,3);
 $('#briefDate').textContent=new Date(intelPayload.checkedAt||Date.now()).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
 $('#briefLead').textContent=fresh.length?`近7日发现 ${fresh.length} 条新增公开线索，覆盖 ${sourceCount} 个来源。${cats.length?`重点集中在${cats.slice(0,3).join('、')}。`:''}`:`今日已完成巡检，暂未发现近7日新增公开事件；系统将继续保留既有重要资料并进行下一轮检查。`;
 $('#briefHighlights').innerHTML=top.map((x,i)=>`<article><span>0${i+1}</span><div><b>${escapeHTML(x.title)}</b><em>${escapeHTML(x.source||'公开来源')} · ${escapeHTML(x.date||'时间待核验')}</em></div></article>`).join('')||'<div class="empty-state">暂无新的重点条目。</div>';
 $('#briefWatch').textContent=top[0]?.title||'关注官方演出公告、采访与节目更新';
}
function renderSourceHealth(){
 const checks=Array.isArray(intelPayload.checks)?intelPayload.checks:[];
 $('#sourceHealthGrid').innerHTML=intelLayers.map(layer=>{const rows=checks.filter(x=>x.layer===layer);const ok=rows.some(x=>x.ok);const count=rows.reduce((n,x)=>n+(x.count||0),0);return `<div class="source-health-card ${ok?'ok':'idle'}"><i></i><div><b>${layer}</b><span>${rows.length?(ok?`已连接 · ${count} 条线索`:'本轮未连接'):'等待实时接口诊断'}</span></div></div>`}).join('');
}
function renderIntel(){
 const items=Array.isArray(intelPayload.items)?intelPayload.items:[];
 const cats=['全部',...new Set(items.map(x=>x.category||'其他'))];
 $('#intelFilters').innerHTML=cats.map(c=>`<button type="button" class="${c===intelFilter?'active':''}" data-intel-filter="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
 $$('[data-intel-filter]', $('#intelFilters')).forEach(b=>b.addEventListener('click',()=>{intelFilter=b.dataset.intelFilter;renderIntel();}));
 const q=intelQuery.trim().toLowerCase();
 const visible=items.filter(x=>(intelFilter==='全部'||(x.category||'其他')===intelFilter)&&(!q||`${x.title} ${x.desc} ${x.source}`.toLowerCase().includes(q)));
 $('#intelList').innerHTML=visible.map((x,i)=>`<article class="intel-card"><div class="intel-rank">${String(i+1).padStart(2,'0')}</div><div class="intel-body"><div class="intel-meta"><time>${escapeHTML(x.date||'时间待核验')}</time><span class="tier tier-${escapeHTML((x.tier||'B').toLowerCase())}">${x.tier==='A'?'权威/一手':'公开线索'}</span><i>${escapeHTML(x.category||'动态')}</i></div><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.desc||'')}</p><div class="intel-actions"><a href="${safeExternalUrl(x.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(x.source||'公开来源')} · 阅读原文 →</a><button type="button" data-intel-save="${i}">${localStorage.getItem('intel-save-'+x.title)==='1'?'♥ 已收藏':'♡ 收藏'}</button></div></div></article>`).join('')||'<div class="empty-state">没有符合当前条件的线索。</div>';
 $$('[data-intel-save]', $('#intelList')).forEach(b=>b.addEventListener('click',()=>{const x=visible[Number(b.dataset.intelSave)];if(!x)return;const k='intel-save-'+x.title,on=localStorage.getItem(k)!=='1';localStorage.setItem(k,on?'1':'0');b.textContent=on?'♥ 已收藏':'♡ 收藏';showToast(on?'已收藏该线索':'已取消收藏');}));
 $('#intelCount').textContent=items.length;$('#intelSources').textContent=new Set(items.map(x=>x.source).filter(Boolean)).size;$('#intelNew').textContent=intelFreshCount(items);$('#intelChecked').textContent=intelPayload.checkedAt?new Date(intelPayload.checkedAt).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}):'--';buildDailyBrief(items);renderSourceHealth();
 $('#sourceRadar').innerHTML=intelSources.map(x=>`<a href="${x[2]}" target="_blank" rel="noopener noreferrer"><b>${x[0]}</b><span>${x[1]}</span><em>打开 ↗</em></a>`).join('');
}
async function loadIntel(announce=false){
 const btn=$('#intelRefreshBtn');btn.disabled=true;$('#intelStatus').textContent='正在从同源实时接口、每日资料包和本机缓存依次检查…';
 let data=null,mode='';
 try{const r=await fetch(`./api/news?v=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error();const d=await r.json();if(!d.items?.length)throw new Error();data=d;mode='实时聚合';}catch{}
 if(!data){try{const r=await fetch(`./data/daily.json?v=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error();const d=await r.json();if(!d.items?.length)throw new Error();data=d;mode='每日资料包';}catch{}}
 if(!data){try{const d=JSON.parse(localStorage.getItem('intel-cache')||'null');if(d?.items?.length){data=d;mode='本机缓存';}}catch{}}
 if(!data){data=intelFallback;mode='基础资料';}
 intelPayload=data;localStorage.setItem('intel-cache',JSON.stringify(data));renderIntel();$('#intelStatus').innerHTML=`已载入 <b>${escapeHTML(mode)}</b> · 最近检查 ${escapeHTML(formatTime(data.checkedAt||data.updatedAt))}`;btn.disabled=false;if(announce)showToast(`情报站已刷新：${mode}`);
}
$('#intelRefreshBtn')?.addEventListener('click',()=>loadIntel(true));
$('#diagnoseBtn')?.addEventListener('click',async()=>{showToast('正在运行五层信息源诊断…');await loadIntel(false);renderSourceHealth();showToast('信息源诊断完成');});
$('#intelSearch')?.addEventListener('input',e=>{intelQuery=e.target.value;renderIntel();});
renderIntel();loadIntel(false);
