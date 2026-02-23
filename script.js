// ═══════════════════════════════════════════════════════════════
// PC Tech Library · script.js  (Full rewrite)
// Fixes: smooth theme, better search+highlight, search+tab sync,
//        quiz shuffle + 20 questions, feedback/comments, mobile UX
// ═══════════════════════════════════════════════════════════════

// ─── Loading Screen ──────────────────────────────────────────
window.addEventListener('load', () => {
    const el = document.getElementById('footer-updated');
    if (el) {
        const d = new Date();
        el.textContent = 'Last updated: ' + d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
    }
    setTimeout(() => {
        const screen = document.getElementById('loading-screen');
        if (screen) screen.classList.add('hidden');
        initQuiz();
    }, 2000);
});

// ─── Theme Toggle (smooth + ripple) ──────────────────────────
function toggleTheme() {
    // ripple overlay for smooth flash
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position:fixed; inset:0; z-index:9998; pointer-events:none;
        background: ${document.body.classList.contains('light-mode') ? 'rgba(10,15,30,0.18)' : 'rgba(255,255,255,0.18)'};
        opacity:1; transition: opacity 0.5s ease;
    `;
    document.body.appendChild(ripple);
    setTimeout(() => { ripple.style.opacity = '0'; }, 50);
    setTimeout(() => ripple.remove(), 600);

    const isLight = document.body.classList.toggle('light-mode');
    document.getElementById('theme-text').innerText = isLight ? 'Light Mode' : 'Dark Mode';
}

// ─── Zawgyi / Unicode Toggle ──────────────────────────────────
let isZawgyi = false;
function toggleFont() {
    isZawgyi = !isZawgyi;
    document.body.classList.toggle('zawgyi-mode', isZawgyi);
    const btn = document.getElementById('font-toggle-btn');
    btn.textContent = isZawgyi ? '🌐 Zawgyi' : '🌐 Unicode';
    btn.classList.toggle('zawgyi-active', isZawgyi);
}

// ─── Back-to-top ──────────────────────────────────────────────
const backBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    backBtn.classList.toggle('visible', window.scrollY > 300);
});
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Copy Button ──────────────────────────────────────────────
const copyIconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
const checkIconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>';

function copyText(text, btn) {
    const doIt = () => {
        btn.classList.add('copied');
        btn.innerHTML = checkIconSVG + ' Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = copyIconSVG + ' Copy';
        }, 2000);
    };
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(doIt).catch(() => fallbackCopy(text, doIt));
    } else {
        fallbackCopy(text, doIt);
    }
}
function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta); cb();
}

// ─── Search with highlight + no-results ──────────────────────
let activeSection = 'all';
let searchTimeout = null;

function searchTech() {
    const searchBar = document.getElementById('searchBar');
    const input = searchBar.value.trim();

    // ring indicator
    searchBar.classList.toggle('has-value', input.length > 0);

    // debounce for performance
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => runSearch(input), 80);
}

function runSearch(input) {
    const lq = input.toLowerCase();
    const cards = document.querySelectorAll('.tech-card');
    let anyVisible = false;

    cards.forEach(card => {
        const inSection = activeSection === 'all' || card.dataset.section === activeSection;
        if (!inSection) { card.style.display = 'none'; return; }

        const subItems = card.querySelectorAll('.nested-details');

        if (lq === '') {
            card.style.display = '';
            subItems.forEach(item => {
                item.style.display = '';
                item.open = false;
                clearHighlight(item);
            });
            anyVisible = true;
            return;
        }

        let cardMatch = false;
        subItems.forEach(item => {
            const rawText = item.innerText.toLowerCase();
            if (rawText.includes(lq)) {
                item.style.display = '';
                item.open = true;
                highlightText(item, input);
                cardMatch = true;
            } else {
                item.style.display = 'none';
                item.open = false;
            }
        });

        if (!cardMatch && (card.dataset.title || '').toLowerCase().includes(lq)) {
            cardMatch = true;
            subItems.forEach(i => { i.style.display = ''; clearHighlight(i); });
        }

        card.style.display = cardMatch ? '' : 'none';
        if (cardMatch) anyVisible = true;
    });

    // no-results UI
    const noRes = document.getElementById('search-no-results');
    if (noRes) {
        noRes.style.display = (!anyVisible && lq) ? 'block' : 'none';
        if (!anyVisible && lq) {
            document.getElementById('no-res-text').textContent = '"' + input + '" နဲ့ ပတ်သတ်တာ မတွေ့ဘူး';
        }
    }
}

function highlightText(container, term) {
    clearHighlight(container);
    if (!term) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    nodes.forEach(node => {
        if (!node.nodeValue.toLowerCase().includes(term.toLowerCase())) return;
        const span = document.createElement('span');
        span.innerHTML = node.nodeValue.replace(re, '<mark class="search-hi">$1</mark>');
        node.parentNode.replaceChild(span, node);
    });
}

function clearHighlight(container) {
    container.querySelectorAll('mark.search-hi').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });
    // unwrap temp spans
    container.querySelectorAll('span').forEach(span => {
        if (!span.className && span.parentNode) {
            const frag = document.createDocumentFragment();
            while (span.firstChild) frag.appendChild(span.firstChild);
            span.parentNode.replaceChild(frag, span);
        }
    });
}

// ─── Section Tabs (sync with search) ─────────────────────────
function filterSection(section) {
    activeSection = section;
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    const input = document.getElementById('searchBar').value.trim();
    runSearch(input);
}

// ─── PC Part Calculator ───────────────────────────────────────
function calculatePC() {
    const parts = {
        'CPU':         document.getElementById('calc-cpu'),
        'GPU':         document.getElementById('calc-gpu'),
        'RAM':         document.getElementById('calc-ram'),
        'Storage':     document.getElementById('calc-storage'),
        'PSU':         document.getElementById('calc-psu'),
        'Motherboard': document.getElementById('calc-mobo'),
    };

    let total = 0, breakdown = '', count = 0;
    for (const [name, el] of Object.entries(parts)) {
        const val = parseInt(el.value);
        if (val > 0) {
            total += val; count++;
            const label = el.options[el.selectedIndex].text.split('(')[0].trim();
            breakdown += '<li>' + name + ': <span>' + label + '</span></li>';
            breakdown += '<li style="border-bottom:none;padding:2px 0;color:var(--accent);font-size:11px">&nbsp;&nbsp;&nbsp;→ ' + val.toLocaleString() + ' ks</li>';
        }
    }

    if (count === 0) { alert('Parts အနည်းဆုံး တစ်ခုလောက် ရွေးပါ! 😅'); return; }

    let tier, tierClass;
    if      (total < 500000)  { tier = '💚 Budget Build';             tierClass = 'tier-budget'; }
    else if (total < 1200000) { tier = '💙 Mid-range Build';          tierClass = 'tier-mid'; }
    else if (total < 2500000) { tier = '💜 High-end Build';           tierClass = 'tier-high'; }
    else                      { tier = '🔥 Ultra / Enthusiast Build'; tierClass = 'tier-ultra'; }

    document.getElementById('calc-total').textContent = total.toLocaleString() + ' ks';
    document.getElementById('calc-breakdown').innerHTML = breakdown;
    const tierEl = document.getElementById('calc-tier');
    tierEl.textContent = tier; tierEl.className = 'calc-tier ' + tierClass;

    const result = document.getElementById('calc-result');
    result.classList.add('show');
    setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

// ─── Quiz (20 questions, shuffled) ───────────────────────────
const allQuizData = [
    { q: "CPU မှာ Core နဲ့ Thread ဘာကွာသလဲ?",
      opts: ["Core က Virtual, Thread က Physical","Core က Physical, Thread က Virtual ညွှန်ကြားချက်","နှစ်ခုတစ်ထပ်တည်းဖြစ်တယ်","Thread က Core ထက် ပိုကောင်းတယ်"],
      ans: 1, exp: "Core က ရုပ်ပိုင်းဆိုင်ရာ processing unit ဖြစ်ပြီး Thread က virtual execution path ဖြစ်ပါတယ်! ✅" },
    { q: "DDR4 နဲ့ DDR5 RAM ကို တစ်ချိန်တည်း Motherboard တစ်ခုမှာ တပ်လို့ရသလား?",
      opts: ["ရတယ်၊ Speed ပိုမြန်မယ်","မရဘူး၊ Slot နဲ့ Voltage ကွဲပြားတယ်","Adapter သုံးရင် ရတယ်","Motherboard အပေါ်မှာ မူတည်တယ်"],
      ans: 1, exp: "DDR4 နဲ့ DDR5 ဟာ Slot ပုံစံ၊ Pin count နဲ့ Voltage တွေ ကွဲပြားတဲ့အတွက် ရောစပ်လို့မရပါဘူး! ❌" },
    { q: "NVMe SSD က SATA SSD ထက် ဘာကြောင့် ပိုမြန်သလဲ?",
      opts: ["ဈေးပိုကြီးလို့","PCIe interface သုံးပြီး bandwidth ပိုကြီးလို့","ပိုသေးငယ်တဲ့ form factor ကြောင့်","DRAM cache ပါလို့"],
      ans: 1, exp: "NVMe က PCIe lanes ကနေတဆင့် data လွှဲပြောင်းတဲ့အတွက် SATA ထက် bandwidth အများကြီး ပိုမြင့်ပါတယ်! 🚀" },
    { q: "80+ Gold PSU ရဲ့ efficiency rating ကဘယ်လောက်လဲ?",
      opts: ["80%","85%","87-92%","95%+"],
      ans: 2, exp: "80+ Gold Rating ဟာ 87-92% efficiency ရှိပြီး ပါဝါဆုံးရှုံးမှု နည်းပါတယ်! ✅" },
    { q: "AMD Ryzen CPU အတွက် ဘယ် Socket သုံးသလဲ?",
      opts: ["LGA 1700","AM4 / AM5","LGA 1200","TR4"],
      ans: 1, exp: "Ryzen CPU တွေဟာ AM4 (Ryzen 5000 series အထိ) နဲ့ AM5 (Ryzen 7000 series) Socket တွေ သုံးပါတယ်! 🔌" },
    { q: "PC Freeze ဖြစ်ရတဲ့ အဖြစ်များဆုံး အကြောင်းရင်းကဘာလဲ?",
      opts: ["Monitor ကြောင့်","Keyboard ကြောင့်","Overheating / RAM ပြဿနာ / Drive Failure","Internet connection ကြောင့်"],
      ans: 2, exp: "CPU Overheating, RAM Slot ညစ်ပတ်ခြင်း နဲ့ Drive ပျက်စီးခြင်းတွေဟာ PC Freeze ဖြစ်ရတဲ့ အဓိကအကြောင်းရင်းတွေပါ! 🔧" },
    { q: "Nvidia ရဲ့ NVENC က ဘာအတွက် သုံးသလဲ?",
      opts: ["CPU Overclocking","GPU Video Encoding (Hardware)","RAM Speed Boost","Fan Control"],
      ans: 1, exp: "NVENC ဆိုတာ Nvidia GPU မှာ ပါတဲ့ dedicated hardware video encoder ဖြစ်ပြီး CPU မပင်ပန်းဘဲ Video encode လုပ်ပေးပါတယ်! 🎥" },
    { q: "Windows 11 တင်ဖို့ မရှိမဖြစ်လိုအပ်တာကဘာလဲ?",
      opts: ["32GB RAM","RTX GPU","TPM 2.0","4K Monitor"],
      ans: 2, exp: "Windows 11 က TPM 2.0 (Trusted Platform Module) မရှိရင် official installation မလုပ်နိုင်ပါဘူး! 🔒" },
    { q: "HDD နဲ့ NVMe SSD ဘယ်ဟာ ပိုမြန်သလဲ?",
      opts: ["HDD - mechanical parts ကြောင့်","NVMe SSD - တစ်ဆယ်ဆကျော် ပိုမြန်တယ်","ဈေးနှုန်းအပေါ် မူတည်တယ်","SATA Cable type ပေါ် မူတည်တယ်"],
      ans: 1, exp: "NVMe SSD ဟာ HDD ထက် read/write speed မှာ တစ်ဆယ်ဆကျော်အထိ ပိုမြန်ပါတယ်! 💀" },
    { q: "Dual Boot ဆိုတာဘာကိုဆိုလဲ?",
      opts: ["PC ကို နှစ်ကြိမ်ဖွင့်ခြင်း","OS နှစ်ခုကို PC တစ်ခုထဲ တပ်ပြီး ရွေးချယ်သုံးနိုင်ခြင်း","Hard Drive နှစ်ခုတပ်ခြင်း","RAM နှစ်ဆ တိုးမြှင့်ခြင်း"],
      ans: 1, exp: "Dual Boot ဆိုသည်မှာ OS နှစ်ခုကို တစ်ခုတည်းသော PC ပေါ်မှာ install လုပ်ပြီး boot ချိန်မှာ ရွေးချယ်နိုင်ခြင်းဖြစ်ပါတယ်! 🖥️" },
    // ── 10 questions အသစ် ──
    { q: "Thermal Paste ဘာအတွက် သုံးသလဲ?",
      opts: ["GPU cooling","CPU နဲ့ Heatsink ကြား heat transfer ကောင်းစေဖို့","RAM speed မြှင့်ဖို့","Motherboard ကာကွယ်ဖို့"],
      ans: 1, exp: "Thermal Paste ဟာ CPU Surface နဲ့ Heatsink ကြားက tiny air gaps ကို ဖြည့်ပြီး heat transfer ပိုကောင်းစေပါတယ်! 🌡️" },
    { q: "PCIe x16 slot ဆိုသည်မှာ ဘာကိုဆိုလဲ?",
      opts: ["RAM slot တစ်မျိုး","GPU တပ်ဖို့ bandwidth ၁၆ lane ရှိတဲ့ expansion slot","Power connector","Storage connector"],
      ans: 1, exp: "PCIe x16 slot ဟာ Graphics Card တပ်ဆင်ဖို့ bandwidth ၁၆ lane ရှိတဲ့ motherboard expansion slot ဖြစ်ပါတယ်! 🎮" },
    { q: "BIOS / UEFI ဆိုတာဘာလဲ?",
      opts: ["Windows ရဲ့ တစ်စိတ်တစ်ပိုင်း","OS load မတင်ခင် hardware initialize လုပ်တဲ့ firmware","Antivirus software","Graphics driver"],
      ans: 1, exp: "BIOS/UEFI ဟာ motherboard ပေါ်မှာ built-in firmware ဖြစ်ပြီး OS မဝင်ခင် hardware တွေကို စစ်ဆေး initialize လုပ်ပေးပါတယ်! ⚙️" },
    { q: "GPU ရဲ့ VRAM ကဘာနဲ့ တူသလဲ?",
      opts: ["CPU Cache","System RAM ပေမဲ့ GPU သီးသန့်သုံးတဲ့ high-speed memory","Hard drive","Motherboard memory"],
      ans: 1, exp: "VRAM ဟာ GPU မှာ built-in ဖြစ်တဲ့ high-speed memory ဖြစ်ပြီး textures, frame buffers တွေကို သိမ်းရာမှာ သုံးပါတယ်! 🖼️" },
    { q: "Linux Mint ရဲ့ GRUB ဆိုတာဘာလဲ?",
      opts: ["Linux file manager","Bootloader — OS ရွေးချယ်ဖို့ menu ပြပေးတဲ့ software","Terminal app","Package manager"],
      ans: 1, exp: "GRUB (Grand Unified Bootloader) ဟာ PC ဖွင့်ရင် Windows နဲ့ Linux ကြားမှာ ရွေးချယ်ဖို့ menu ပြပေးတဲ့ bootloader ဖြစ်ပါတယ်! 🚀" },
    { q: "Contact Cleaner ဘာအတွက် သုံးသလဲ?",
      opts: ["CPU cooling paste","RAM, GPU slot တွေကို oxidation/ညစ်ပတ်မှု ရှင်းဖို့","PC screen ပေါ်ကို clean လုပ်ဖို့","Thermal interface material"],
      ans: 1, exp: "Contact Cleaner ဟာ RAM slot, card connectors တွေပေါ် oxidation, ဖုန်မှုန့်တွေ ရှင်းဖို့ သုံးပါတယ်! 🧹" },
    { q: "Rufus ဆိုတာဘာ software လဲ?",
      opts: ["PC benchmark tool","USB drive ကို bootable လုပ်ဖို့ tool","Video editing software","Driver installer"],
      ans: 1, exp: "Rufus ဟာ Windows/Linux ISO file ကို USB drive ပေါ်မှာ bootable အဖြစ် ရေးဖို့ သုံးတဲ့ free tool ဖြစ်ပါတယ်! 💾" },
    { q: "Intel 'F' suffix CPU (eg: i5-13400F) ကဘာကိုဆိုလဲ?",
      opts: ["Overclockable CPU","Integrated GPU မပါဘဲ dedicated GPU လိုအပ်တဲ့ CPU","Fast cache CPU","Laptop CPU"],
      ans: 1, exp: "Intel 'F' series CPU ဟာ integrated graphics မပါဘဲ ဈေးသက်သာသော်လည်း dedicated GPU မဖြစ်မနေ လိုအပ်ပါတယ်! 💡" },
    { q: "CrystalDiskInfo ဘာလုပ်ဆောင်သလဲ?",
      opts: ["RAM speed test","SSD/HDD ကျန်းမာရေး S.M.A.R.T status စစ်ဆေးတဲ့ tool","CPU temperature monitor","GPU benchmark"],
      ans: 1, exp: "CrystalDiskInfo ဟာ SSD/HDD ရဲ့ S.M.A.R.T data ကို ဖတ်ပြီး drive ကျန်းမာရေး စစ်ဆေးပေးတဲ့ free tool ဖြစ်ပါတယ်! 🔍" },
    { q: "PC Build မှာ 80 Plus Bronze PSU ထက် 80 Plus Gold PSU ကိုဘာကြောင့် ပိုရွေးသင့်သလဲ?",
      opts: ["ပိုကြီးလို့","Efficiency 87-90% ဖြစ်ပြီး လျှပ်စစ်ဆုံးရှုံးမှု နည်းကာ ဝပ်ဘိုးချွေတာနိုင်လို့","Cable ပိုများလို့","Color ပိုကောင်းလို့"],
      ans: 1, exp: "Gold PSU ဟာ Bronze ထက် efficiency မြင့်ပြီး (87-90% vs 82-85%) ၊ long-term မှာ electric bill ချွေတာနိုင်ပြီး hardware ကိုပါ ပိုကာကွယ်ပေးတယ်! ⚡" },
];

let quizPool = [];
let currentQ = 0, score = 0, answered = false;
const QUIZ_COUNT = 10;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function initQuiz() {
    quizPool = shuffle(allQuizData).slice(0, QUIZ_COUNT);
    currentQ = 0; score = 0;
    showQuestion();
}

function showQuestion() {
    const q = quizPool[currentQ];
    answered = false;

    document.getElementById('quiz-wrap').style.display = 'block';
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-counter').textContent = 'Question ' + (currentQ + 1) + ' / ' + QUIZ_COUNT;
    document.getElementById('quiz-bar').style.width = ((currentQ / QUIZ_COUNT) * 100) + '%';
    document.getElementById('quiz-question').textContent = q.q;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').style.color = '';
    document.getElementById('quiz-next').style.display = 'none';

    const optEl = document.getElementById('quiz-options');
    optEl.innerHTML = '';
    // shuffle options
    const idxMap = shuffle([0,1,2,3]);
    let newAns = 0;
    idxMap.forEach((origIdx, newIdx) => {
        if (origIdx === q.ans) newAns = newIdx;
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = q.opts[origIdx];
        btn.onclick = () => selectAnswer(newIdx, newAns);
        optEl.appendChild(btn);
    });
    // store mapped answer
    document.getElementById('quiz-options').dataset.correctIdx = newAns;
}

function selectAnswer(idx, correctIdx) {
    if (answered) return;
    answered = true;
    const opts = document.querySelectorAll('.quiz-option');
    opts.forEach(b => b.disabled = true);
    opts[correctIdx].classList.add('correct');
    const fb = document.getElementById('quiz-feedback');
    if (idx === correctIdx) {
        score++;
        fb.textContent = '🎉 မှန်ကန်ပါတယ်! ' + quizPool[currentQ].exp;
        fb.style.color = '#5effd8';
    } else {
        opts[idx].classList.add('wrong');
        fb.textContent = '❌ မမှန်ပါဘူး! ' + quizPool[currentQ].exp;
        fb.style.color = '#ff6b8a';
    }
    document.getElementById('quiz-next').style.display = 'inline-block';
}

function nextQuestion() {
    currentQ++;
    if (currentQ >= QUIZ_COUNT) showResult();
    else showQuestion();
}

function showResult() {
    document.getElementById('quiz-bar').style.width = '100%';
    document.getElementById('quiz-wrap').style.display = 'none';
    const result = document.getElementById('quiz-result');
    result.style.display = 'block';
    document.getElementById('quiz-score-num').textContent = score + '/' + QUIZ_COUNT;
    const pct = score / QUIZ_COUNT;
    let msg, sub;
    if      (pct >= 0.9) { msg = '🏆 PC Expert!';    sub = 'ကောင်းတယ်! PC Knowledge အပြည့်ရှိတယ်နော် 😎'; }
    else if (pct >= 0.7) { msg = '💪 Well Done!';     sub = 'ကောင်းပါတယ်! နည်းနည်းလေး ထပ်လေ့လာရင် Expert ဖြစ်မယ် 👌'; }
    else if (pct >= 0.5) { msg = '📚 Not Bad!';       sub = 'အရမ်းဆိုးတော့မဟုတ်ဘူး! Knowledge Base ကို ထပ်ကြည့်ပါ 😊'; }
    else                 { msg = '🔧 Keep Learning!'; sub = 'စိတ်မပျက်ပါနဲ့! Web ထဲမှာ အကုန်လေ့လာနိုင်ပါတယ် 💪'; }
    document.getElementById('quiz-result-msg').textContent = msg;
    document.getElementById('quiz-result-sub').textContent = sub;
}

function restartQuiz() { initQuiz(); }

// ─── Firebase Firestore Real-time Comments ────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBHOguiR4dxeXMjAO_ebUJSk0ebq60gpV0",
    authDomain: "pc-tech-library.firebaseapp.com",
    projectId: "pc-tech-library",
    storageBucket: "pc-tech-library.firebasestorage.app",
    messagingSenderId: "250761166764",
    appId: "1:250761166764:web:7ea7346be5f6bad74dc409"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const commentsRef = db.collection('comments');

// Real-time listener — comment အသစ်တင်တိုင်း အားလုံးမြင်ရမယ်
commentsRef.orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
    const comments = [];
    snapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
    });
    renderComments(comments);
}, err => {
    console.error('Firestore error:', err);
});

async function submitFeedback() {
    const name     = document.getElementById('fb-name').value.trim() || 'Anonymous';
    const topic    = document.getElementById('fb-topic').value;
    const text     = document.getElementById('fb-text').value.trim();
    const ratingEl = document.querySelector('input[name="rating"]:checked');
    const rating   = ratingEl ? parseInt(ratingEl.value) : 0;

    if (!text) {
        const ta = document.getElementById('fb-text');
        ta.focus();
        ta.style.borderColor = '#ff6b8a';
        ta.style.boxShadow = '0 0 0 3px rgba(255,107,138,0.15)';
        setTimeout(() => { ta.style.borderColor = ''; ta.style.boxShadow = ''; }, 1800);
        return;
    }

    // Submit button loading state
    const btn = document.querySelector('.feedback-submit');
    btn.textContent = '⏳ တင်နေတယ်...';
    btn.disabled = true;

    try {
        await commentsRef.add({
            name,
            topic,
            text,
            rating,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            timeDisplay: new Date().toLocaleString('en-GB', {
                day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit'
            })
        });

        // Success
        document.getElementById('feedback-form').style.display = 'none';
        document.getElementById('feedback-success').style.display = 'block';

        // Reset form
        document.getElementById('fb-name').value = '';
        document.getElementById('fb-text').value = '';
        document.getElementById('fb-topic').selectedIndex = 0;
        if (ratingEl) ratingEl.checked = false;

    } catch (err) {
        console.error('Submit error:', err);
        alert('တင်မရဘူး — internet connection စစ်ဆေးပါ! 😅');
    }

    btn.textContent = '📨 Comment တင်မယ်';
    btn.disabled = false;
}

async function deleteComment(docId) {
    if (!confirm('Comment ဖျက်မှာ သေချာသလား?')) return;
    try {
        await commentsRef.doc(docId).delete();
    } catch(err) {
        alert('ဖျက်မရဘူး! 😅');
    }
}

function showFeedbackForm() {
    document.getElementById('feedback-form').style.display = 'flex';
    document.getElementById('feedback-success').style.display = 'none';
}

function renderComments(comments) {
    const list = document.getElementById('comments-list');
    if (!list) return;

    const empty = document.getElementById('comments-empty');

    if (!comments || comments.length === 0) {
        list.innerHTML = '';
        if (empty) { empty.style.display = 'block'; list.appendChild(empty); }
        return;
    }
    if (empty) empty.style.display = 'none';

    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

    list.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-name">👤 ${escHtml(c.name || 'Anonymous')}</span>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    ${c.rating ? '<span class="comment-rating">' + stars(c.rating) + '</span>' : ''}
                    <span class="comment-topic">${escHtml(c.topic || '')}</span>
                    <button onclick="deleteComment('${c.id}')" title="ဖျက်ရန်"
                        style="background:none;border:none;color:rgba(255,107,138,0.4);cursor:pointer;font-size:13px;padding:0 4px;transition:color 0.2s"
                        onmouseover="this.style.color='#ff6b8a'"
                        onmouseout="this.style.color='rgba(255,107,138,0.4)'">✕</button>
                </div>
            </div>
            <div class="comment-text">${escHtml(c.text || '')}</div>
            <div class="comment-time">🕐 ${c.timeDisplay || ''}</div>
        </div>
    `).join('');
}

function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}
