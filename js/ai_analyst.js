class AISeismicAnalyst {
  constructor() {
    this.analysisData = null;
    this.cachedQuestions = {
      'susulan': {
        q: 'Apakah gempa susulan wajar terjadi setelah gempa utama?',
        a: 'Ya, gempa susulan (aftershocks) merupakan proses alami pelepasan sisa tegangan elastis batuan kerak bumi hingga mencapai kestabilan kembali. Frekuensi gempa susulan umumnya menurun seiring waktu.'
      },
      'kedalaman': {
        q: 'Mengapa gempa dangkal (<60 km) lebih terasa merusak?',
        a: 'Gempa hiposentrum dangkal memiliki jarak tempuh gelombang seismik yang sangat pendek menuju permukaan tanah, sehingga redaman energi minimal dan getaran tanah di episentrum jauh lebih intensif dibanding gempa menengah atau dalam.'
      },
      'tsunami_tanda': {
        q: 'Apa saja tanda alami potensi tsunami di kawasan pesisir?',
        a: 'Tanda alami meliputi guncangan gempa kuat lebih dari 20 detik, surutnya air laut secara drastis dalam waktu singkat, bau garam menyengat, serta suara dentuman ombak besar dari laut lepas. Segera lari ke tempat tinggi atau shelter evakuasi vertikal tanpa menunggu sirene resmi.'
      },
      'tas_siaga': {
        q: 'Berapa lama perbekalan dalam Tas Siaga Bencana harus mencukupi?',
        a: 'Tas Siaga Bencana dirancang untuk bertahan mandiri minimal 72 jam (3 hari pertama pasca-bencana) sebelum bantuan logistik darurat tiba di lokasi.'
      }
    };
  }

  updateAnalysis(historyList = []) {
    if (!Array.isArray(historyList) || historyList.length === 0) {
      return;
    }

    const total = historyList.length;
    let sumMag = 0;
    let maxMag = 0;
    const magDist = { '< 4.0': 0, '4.0 - 4.9': 0, '5.0 - 5.9': 0, '>= 6.0': 0 };
    const depthDist = { dangkal: 0, menengah: 0, dalam: 0 };
    let sumatraCount = 0;
    let tsunamiCount = 0;

    const sumatraKeywords = [
      'aceh', 'banda aceh', 'sabang', 'meulaboh', 'simeulue', 'pidie', 'sumatera', 'sumatra',
      'nias', 'mentawai', 'padang', 'medan', 'bengkulu', 'lampung', 'jambi', 'riau'
    ];

    historyList.forEach(eq => {
      const m = parseFloat(eq.magnitude || 0);
      const d = parseInt(eq.depth || 0);
      const loc = (eq.location || '').toLowerCase();
      const tsu = (eq.tsunami || '').toLowerCase();

      sumMag += m;
      if (m > maxMag) maxMag = m;

      if (m < 4.0) magDist['< 4.0']++;
      else if (m < 5.0) magDist['4.0 - 4.9']++;
      else if (m < 6.0) magDist['5.0 - 5.9']++;
      else magDist['>= 6.0']++;

      if (d < 60) depthDist.dangkal++;
      else if (d <= 300) depthDist.menengah++;
      else depthDist.dalam++;

      if (sumatraKeywords.some(kw => loc.includes(kw))) {
        sumatraCount++;
      }

      if (tsu.includes('tsunami') && !tsu.includes('tidak berpotensi')) {
        tsunamiCount++;
      }
    });

    const avgMag = total > 0 ? (sumMag / total).toFixed(1) : 0;

    this.analysisData = {
      total,
      avgMag,
      maxMag: maxMag.toFixed(1),
      magDist,
      depthDist,
      sumatraCount,
      tsunamiCount
    };

    this.renderUI();
  }

  renderUI() {
    if (!this.analysisData) return;
    const d = this.analysisData;

    const countEl = document.getElementById('ai-sample-count');
    const avgEl = document.getElementById('ai-avg-mag');
    const maxEl = document.getElementById('ai-max-mag');
    const sumatraEl = document.getElementById('ai-sumatra-count');
    const narrativeEl = document.getElementById('ai-narrative-text');

    if (countEl) countEl.textContent = d.total;
    if (avgEl) avgEl.textContent = d.avgMag;
    if (maxEl) maxEl.textContent = d.maxMag;
    if (sumatraEl) sumatraEl.textContent = d.sumatraCount;

    this.renderBar('bar-mag-under4', d.magDist['< 4.0'], d.total, 'count-mag-under4');
    this.renderBar('bar-mag-4to5', d.magDist['4.0 - 4.9'], d.total, 'count-mag-4to5');
    this.renderBar('bar-mag-5to6', d.magDist['5.0 - 5.9'], d.total, 'count-mag-5to6');
    this.renderBar('bar-mag-above6', d.magDist['>= 6.0'], d.total, 'count-mag-above6');

    this.renderBar('bar-depth-shallow', d.depthDist.dangkal, d.total, 'count-depth-shallow');
    this.renderBar('bar-depth-mid', d.depthDist.menengah, d.total, 'count-depth-mid');
    this.renderBar('bar-depth-deep', d.depthDist.dalam, d.total, 'count-depth-deep');

    if (narrativeEl) {
      narrativeEl.innerHTML = `
        Berdasarkan ${d.total} data gempa BMKG terkini, aktivitas seismik didominasi oleh hiposentrum 
        <strong>dangkal (&lt;60 km) sebanyak ${d.depthDist.dangkal} kejadian (${Math.round((d.depthDist.dangkal / d.total) * 100)}%)</strong>. 
        Magnitudo rata-rata tercatat di angka <strong>M ${d.avgMag} SR</strong> dengan puncak magnitudo <strong>M ${d.maxMag} SR</strong>. 
        Zona busur Sumatra-Aceh mencatat <strong>${d.sumatraCount} aktivitas</strong> yang berkaitan dengan dinamika subduksi lempeng Indo-Australia terhadap Eurasia. 
        ${d.tsunamiCount > 0 ? `<span style="color:#ef4444;font-weight:700;">Tercatat ${d.tsunamiCount} kejadian dengan perhatian potensi tsunami resmi dari BMKG.</span>` : 'Seluruh data terkini menunjukkan status aman dari ancaman tsunami kecuali diumumkan berbeda oleh BMKG.'}
      `;
    }
  }

  renderBar(barId, count, total, countId) {
    const bar = document.getElementById(barId);
    const countEl = document.getElementById(countId);
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    if (bar) bar.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${count} (${pct}%)`;
  }

  askQuestion(key) {
    const item = this.cachedQuestions[key];
    if (!item) return;

    const modal = document.getElementById('ai-faq-modal');
    const titleEl = document.getElementById('ai-faq-question-title');
    const answerEl = document.getElementById('ai-faq-answer-body');

    if (titleEl) titleEl.textContent = item.q;
    if (answerEl) answerEl.textContent = item.a;
    if (modal) modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('ai-faq-modal');
    if (modal) modal.classList.remove('active');
  }
}

window.aiSeismicAnalyst = new AISeismicAnalyst();
