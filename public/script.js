// ============================================
// IQC WA GENERATOR PRO — SCRIPT
// by ryaakbar
// ============================================

let currentBlobUrl = null;
let toastTimer = null;
let selectedSignal = 4;

// ── INIT ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Reveal scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Navbar scroll
    const navbar = document.getElementById('navbar');
    const scrollBtns = document.getElementById('scrollBtns');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 20;
        navbar?.classList.toggle('scrolled', scrolled);
        scrollBtns?.classList.toggle('visible', scrolled);
    });

    // Set battery slider gradient on load
    updateBattery(document.getElementById('batterySlider'));

    // Set time sekarang as default
    setTimeNow();
});

// ── TIME ──────────────────────────────────
function setTimeNow() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timeInput').value = `${h}:${m}`;
    showToast('⏰ Jam diset ke waktu sekarang', 'success');
}

function getFormattedTime() {
    const val = document.getElementById('timeInput').value || '09:41';
    const [h, m] = val.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}

// ── CARRIER ───────────────────────────────
function setCarrier(name) {
    document.getElementById('carrierName').value = name;
    // Visual feedback chips
    document.querySelectorAll('.carrier-chip').forEach(c => {
        c.classList.toggle('active', c.textContent.trim() === name ||
            (name === 'INDOSAT OOREDOO' && c.textContent.trim() === 'Indosat'));
    });
}

// ── BATTERY ───────────────────────────────
function updateBattery(slider) {
    const val = slider.value;
    document.getElementById('batteryVal').textContent = `${val}%`;
    slider.style.setProperty('--val', `${val}%`);
    // Update gradient
    slider.style.background = `linear-gradient(to right, var(--blue-500) 0%, var(--blue-500) ${val}%, rgba(255,255,255,0.1) ${val}%)`;
}

function setBattery(val) {
    const slider = document.getElementById('batterySlider');
    slider.value = val;
    updateBattery(slider);
}

// ── SIGNAL ────────────────────────────────
function setSignal(val, btn) {
    selectedSignal = val;
    document.querySelectorAll('.signal-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ── CHAR COUNT ────────────────────────────
function updateCharCount(textarea, counterId) {
    const len = textarea.value.length;
    const counter = document.getElementById(counterId);
    counter.textContent = `${len} karakter`;
    counter.classList.remove('warn', 'danger');
    if (len > 500) counter.classList.add('danger');
    else if (len > 300) counter.classList.add('warn');
}

// ── GENERATE ──────────────────────────────
async function generateWA() {
    const messageText = document.getElementById('messageText').value.trim();
    const timeRaw = document.getElementById('timeInput').value;
    const carrierName = document.getElementById('carrierName').value.trim() || 'INDOSAT OOREDOO';
    const batteryPercentage = document.getElementById('batterySlider').value;
    const signalStrength = selectedSignal;

    // Validasi
    if (!messageText) {
        showToast('⚠️ Isi pesan WA wajib diisi!', 'error');
        focusEl('messageText');
        return;
    }
    if (!timeRaw) {
        showToast('⚠️ Jam wajib diisi!', 'error');
        focusEl('timeInput');
        return;
    }

    // Format jam → "9:41 AM"
    const [h, m] = timeRaw.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${m} ${ampm}`;

    setLoading(true);
    hideResult();
    hideError();

    const params = new URLSearchParams({
        time: formattedTime,
        messageText,
        carrierName,
        batteryPercentage,
        signalStrength,
    });

    try {
        const res = await fetch(`/api/generate?${params.toString()}`);

        const contentType = res.headers.get('Content-Type') || '';

        if (!res.ok || !contentType.includes('image')) {
            const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
        }

        if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
        const blob = await res.blob();
        currentBlobUrl = URL.createObjectURL(blob);

        const img = document.getElementById('resultImg');
        img.src = currentBlobUrl;
        img.onload = () => {
            setLoading(false);
            showResult();
            showToast('🔥 Screenshot berhasil digenerate!', 'success');
            setTimeout(() => {
                document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        };

    } catch (err) {
        setLoading(false);
        showError(err.message);
        showToast('❌ ' + err.message, 'error');
    }
}

// ── DOWNLOAD ──────────────────────────────
async function downloadWA() {
    const messageText = document.getElementById('messageText').value.trim();
    const timeRaw = document.getElementById('timeInput').value;
    const carrierName = document.getElementById('carrierName').value.trim() || 'INDOSAT OOREDOO';
    const batteryPercentage = document.getElementById('batterySlider').value;

    if (!messageText || !timeRaw) {
        showToast('⚠️ Generate dulu bro!', 'error');
        return;
    }

    const [h, m] = timeRaw.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${m} ${ampm}`;

    const params = new URLSearchParams({
        time: formattedTime,
        messageText,
        carrierName,
        batteryPercentage,
        signalStrength: selectedSignal,
    });

    // Trigger download via /api/download
    const a = document.createElement('a');
    a.href = `/api/download?${params.toString()}`;
    a.download = `iqc-wa-${Date.now()}.png`;
    a.click();
    showToast('⬇️ Downloading...', 'success');
}

// ── COPY IMAGE ────────────────────────────
async function copyWAImg() {
    if (!currentBlobUrl) return;
    const btn = document.getElementById('copyBtn');
    try {
        const res = await fetch(currentBlobUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        showToast('📋 Image copied!', 'success');
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Image';
        }, 2500);
    } catch {
        window.open(currentBlobUrl, '_blank');
        showToast('💡 Dibuka di tab baru, save manual!', 'success');
    }
}

// ── UI HELPERS ────────────────────────────
function setLoading(show) {
    const btn = document.getElementById('generateBtn');
    document.getElementById('loading').classList.toggle('hidden', !show);
    btn.disabled = show;
    btn.innerHTML = show
        ? '<i class="fa-solid fa-spinner fa-spin"></i><span>Generating...</span>'
        : '<i class="fa-solid fa-wand-magic-sparkles"></i><span>Generate Screenshot</span><span class="btn-arrow">→</span>';
}
function showResult()  { document.getElementById('resultCard').classList.remove('hidden'); }
function hideResult()  { document.getElementById('resultCard').classList.add('hidden'); }
function showError(msg) {
    document.getElementById('errorText').textContent = msg;
    document.getElementById('errorCard').classList.remove('hidden');
}
function hideError()   { document.getElementById('errorCard').classList.add('hidden'); }
function focusEl(id) {
    const el = document.getElementById(id);
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── TOAST ─────────────────────────────────
function showToast(msg, type = '') {
    clearTimeout(toastTimer);
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
