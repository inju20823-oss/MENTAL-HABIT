/* =====================================================
   멘탈해빗 (MentalHabit) — script.js
   주요 기능:
     1. 카테고리 탭 전환
     2. 범용 카운트다운 타이머
     3. 4-4-8 호흡 애니메이션 타이머
     4. 뽀모도로 타이머 (25분 집중 / 5분 휴식)
     5. 감사 기록 저장
     6. 감정 점수 팝업 & LocalStorage 저장
     7. 대시보드 렌더링 (요약 카드 + 바 그래프 + 로그 리스트)
     [추가] 25개 기본 미션 제어 및 +1,000P 실시간 지급 트랜잭션
     [추가] 45종 기프티쇼 비즈 동기화 포인트 상점 및 CODE128 바코드 스캐너 연동
   ===================================================== */

'use strict';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. 카테고리 탭 전환
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels  = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById('tab-' + target).classList.add('active');
  });
});


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. 범용 카운트다운 타이머 (미션 1, 3)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const timerState = {};

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return m + ':' + s;
}

function startTimer(id, totalSec) {
  if (timerState[id] && timerState[id].running) return;
  const display = document.getElementById('timer-' + id);
  if (!timerState[id]) {
    timerState[id] = { remaining: totalSec, total: totalSec, running: false, intervalId: null };
  }
  timerState[id].running = true;
  timerState[id].intervalId = setInterval(() => {
    timerState[id].remaining--;
    display.textContent = formatTime(timerState[id].remaining);
    if (timerState[id].remaining <= 0) {
      clearInterval(timerState[id].intervalId);
      timerState[id].running = false;
      showToast('⏰ 타이머 완료!');
    }
  }, 1000);
}

function pauseTimer(id) {
  if (!timerState[id] || !timerState[id].running) return;
  clearInterval(timerState[id].intervalId);
  timerState[id].running = false;
}

function deleteTimerState(id) {
  if (timerState[id]) {
    clearInterval(timerState[id].intervalId);
    delete timerState[id];
  }
}

function resetTimer(id, totalSec) {
  if (timerState[id]) {
    clearInterval(timerState[id].intervalId);
  }
  timerState[id] = { remaining: totalSec, total: totalSec, running: false, intervalId: null };
  document.getElementById('timer-' + id).textContent = formatTime(totalSec);
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. 4-4-8 호흡 애니메이션 타이머 (미션 2)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let breathIntervalId  = null;
let breathRemaining   = 120;
let breathPhaseTimer  = 0;
let breathPhaseIndex  = 0;
let breathRunning     = false;

const BREATH_PHASES = [
  { duration: 4,  cssClass: 'inhale', label: '흡기\n4초' },
  { duration: 4,  cssClass: 'hold',   label: '참기\n4초' },
  { duration: 8,  cssClass: 'exhale', label: '호기\n8초' },
];

function applyBreathPhase(phaseIndex) {
  const circle = document.getElementById('breath-circle');
  const label  = document.getElementById('breath-label');
  const phase  = BREATH_PHASES[phaseIndex];
  circle.classList.remove('inhale', 'hold', 'exhale');
  circle.classList.add(phase.cssClass);
  label.textContent = phase.label.replace('\n', ' ');
}

function startBreath() {
  if (breathRunning) return;
  breathRunning = true;
  applyBreathPhase(breathPhaseIndex);
  breathIntervalId = setInterval(() => {
    breathRemaining--;
    breathPhaseTimer++;
    document.getElementById('timer-m2').textContent = formatTime(breathRemaining);
    if (breathPhaseTimer >= BREATH_PHASES[breathPhaseIndex].duration) {
      breathPhaseTimer = 0;
      breathPhaseIndex = (breathPhaseIndex + 1) % BREATH_PHASES.length;
      applyBreathPhase(breathPhaseIndex);
    }
    if (breathRemaining <= 0) {
      clearInterval(breathIntervalId);
      breathRunning = false;
      document.getElementById('breath-label').textContent = '완료!';
      document.getElementById('breath-circle').classList.remove('inhale', 'hold', 'exhale');
      showToast('🌬️ 호흡 훈련 완료!');
    }
  }, 1000);
}

function resetBreath() {
  clearInterval(breathIntervalId);
  breathRunning     = false;
  breathRemaining   = 120;
  breathPhaseTimer  = 0;
  breathPhaseIndex  = 0;
  document.getElementById('timer-m2').textContent = '02:00';
  document.getElementById('breath-label').textContent = '준비';
  const circle = document.getElementById('breath-circle');
  circle.classList.remove('inhale', 'hold', 'exhale');
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4. 뽀모도로 타이머 (미션 5)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const POMODORO_FOCUS = 25 * 60;
const POMODORO_BREAK = 5  * 60;

let pomodoroIntervalId  = null;
let pomodoroRemaining   = POMODORO_FOCUS;
let pomodoroTotal       = POMODORO_FOCUS;
let pomodoroRunning     = false;
let pomodoroIsFocus     = true;
let pomodoroFocusCount  = 0;
let pomodoroBreakCount  = 0;

function updatePomodoroProgress() {
  const elapsed  = pomodoroTotal - pomodoroRemaining;
  const percent  = Math.min((elapsed / pomodoroTotal) * 100, 100);
  document.getElementById('pomodoro-progress').style.width = percent + '%';
}

function startPomodoro() {
  if (pomodoroRunning) return;
  pomodoroRunning = true;
  pomodoroIntervalId = setInterval(() => {
    pomodoroRemaining--;
    document.getElementById('timer-m5').textContent = formatTime(pomodoroRemaining);
    updatePomodoroProgress();
    if (pomodoroRemaining <= 0) {
      if (pomodoroIsFocus) {
        pomodoroFocusCount++;
        document.getElementById('pomodoro-count').textContent = pomodoroFocusCount;
        showToast('🍅 집중 완료! 5분 휴식을 시작합니다.');
        pomodoroIsFocus   = false;
        pomodoroRemaining = POMODORO_BREAK;
        pomodoroTotal     = POMODORO_BREAK;
        document.getElementById('pomodoro-mode-label').textContent = '☕ 휴식 모드';
        document.getElementById('timer-m5').style.color = 'var(--color-success)';
      } else {
        pomodoroBreakCount++;
        document.getElementById('break-count').textContent = pomodoroBreakCount;
        showToast('⚡ 휴식 완료! 다시 집중 세션을 시작합니다.');
        pomodoroIsFocus   = true;
        pomodoroRemaining = POMODORO_FOCUS;
        pomodoroTotal     = POMODORO_FOCUS;
        document.getElementById('pomodoro-mode-label').textContent = '🍅 집중 모드';
        document.getElementById('timer-m5').style.color = 'var(--color-secondary)';
      }
      updatePomodoroProgress();
    }
  }, 1000);
}

function pausePomodoro() {
  if (!pomodoroRunning) return;
  clearInterval(pomodoroIntervalId);
  pomodoroRunning = false;
}

function resetPomodoro() {
  clearInterval(pomodoroIntervalId);
  pomodoroRunning    = false;
  pomodoroIsFocus    = true;
  pomodoroRemaining  = POMODORO_FOCUS;
  pomodoroTotal      = POMODORO_FOCUS;
  pomodoroFocusCount = 0;
  pomodoroBreakCount = 0;
  document.getElementById('timer-m5').textContent       = formatTime(POMODORO_FOCUS);
  document.getElementById('timer-m5').style.color       = 'var(--color-secondary)';
  document.getElementById('pomodoro-mode-label').textContent = '🍅 집중 모드';
  document.getElementById('pomodoro-progress').style.width   = '0%';
  document.getElementById('pomodoro-count').textContent = '0';
  document.getElementById('break-count').textContent    = '0';
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   5. 감사/성취 기록 저장 (미션 4)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function saveGratitude() {
  const v1 = document.getElementById('gratitude-1').value.trim();
  const v2 = document.getElementById('gratitude-2').value.trim();
  const v3 = document.getElementById('gratitude-3').value.trim();
  if (!v1 || !v2 || !v3) {
    showToast('⚠️ 3가지 항목을 모두 입력해 주세요.');
    return;
  }
  const saved = JSON.parse(localStorage.getItem('mh_gratitude') || '[]');
  saved.unshift({ date: new Date().toLocaleDateString('ko-KR'), items: [v1, v2, v3] });
  if (saved.length > 30) saved.pop();
  localStorage.setItem('mh_gratitude', JSON.stringify(saved));
  document.getElementById('gratitude-1').value = '';
  document.getElementById('gratitude-2').value = '';
  document.getElementById('gratitude-3').value = '';
  showToast('💚 오늘의 감사 기록이 저장되었습니다!');
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   6. 감정 점수 팝업 & LocalStorage 데이터 로그
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let pendingMissionName = '';
const EMOTION_MAP = {
  1:  { emoji: '😩', text: '1점 — 매우 힘들다' },
  2:  { emoji: '😞', text: '2점 — 힘들다' },
  3:  { emoji: '😔', text: '3점 — 좀 힘들다' },
  4:  { emoji: '😕', text: '4점 — 약간 안 좋다' },
  5:  { emoji: '😐', text: '5점 — 보통' },
  6:  { emoji: '🙂', text: '6점 — 괜찮다' },
  7:  { emoji: '😊', text: '7점 — 좋다' },
  8:  { emoji: '😄', text: '8점 — 꽤 좋다' },
  9:  { emoji: '😁', text: '9점 — 매우 좋다' },
  10: { emoji: '🤩', text: '10점 — 최고!!' },
};

function completeMission(missionName) {
  pendingMissionName = missionName;
  document.getElementById('popup-mission-name').textContent = missionName;
  const slider = document.getElementById('emotion-slider');
  slider.value = 5;
  updateEmotionLabel(5);
  document.getElementById('emotion-popup').classList.add('visible');
}

function updateEmotionLabel(value) {
  const score = parseInt(value, 10);
  const info  = EMOTION_MAP[score] || EMOTION_MAP[5];
  document.getElementById('emotion-emoji').textContent      = info.emoji;
  document.getElementById('emotion-score-text').textContent = info.text;
}

function closePopup() {
  document.getElementById('emotion-popup').classList.remove('visible');
}

function saveEmotionScore() {
  const score = parseInt(document.getElementById('emotion-slider').value, 10);
  const logEntry = {
    timestamp:   new Date().toISOString(),
    dateLabel:   new Date().toLocaleString('ko-KR'),
    mission:     pendingMissionName,
    score:       score,
  };
  const logs = getLog();
  logs.unshift(logEntry);
  if (logs.length > 100) logs.pop();
  localStorage.setItem('mh_log', JSON.stringify(logs));
  closePopup();
  showToast('📝 기록 완료! 감정 점수: ' + score + '점');
  renderDashboard();
}

function getLog() {
  return JSON.parse(localStorage.getItem('mh_log') || '[]');
}

function clearLog() {
  if (!confirm('모든 기록을 삭제할까요?')) return;
  localStorage.removeItem('mh_log');
  renderDashboard();
  showToast('🗑️ 기록이 초기화되었습니다.');
}

document.getElementById('emotion-popup').addEventListener('click', function(e) {
  if (e.target === this) closePopup();
});


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   7. 대시보드 렌더링
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderDashboard() {
  const logs = getLog();
  const total   = logs.length;
  const avgScore = total > 0
    ? (logs.reduce((sum, l) => sum + l.score, 0) / total).toFixed(1)
    : '—';
  const todayStr = new Date().toLocaleDateString('ko-KR');
  const todayCount = logs.filter(l => l.dateLabel.startsWith(todayStr)).length;

  document.getElementById('summary-total').textContent = total;
  document.getElementById('summary-avg').textContent   = avgScore;
  document.getElementById('summary-today').textContent = todayCount;

  const chartEl = document.getElementById('bar-chart');
  chartEl.innerHTML = '';
  if (logs.length === 0) {
    chartEl.innerHTML = '<p class="empty-log">아직 기록이 없습니다. 미션을 완료하면 여기에 그래프가 나타납니다.</p>';
  } else {
    const recent = logs.slice(0, 10).reverse();
    const maxBarH = 70;
    recent.forEach(entry => {
      const barHeight = Math.round((entry.score / 10) * maxBarH);
      const timePart = entry.dateLabel.split(' ').slice(-2).join(' ');
      const col = document.createElement('div');
      col.className = 'bar-col';
      col.innerHTML = `
        <span class="bar-score">${entry.score}</span>
        <div class="bar-fill" style="height: ${barHeight}px;" title="${entry.mission} — ${entry.score}점"></div>
        <span class="bar-date">${timePart}</span>
      `;
      chartEl.appendChild(col);
    });
  }

  const listEl = document.getElementById('log-list');
  listEl.innerHTML = '';
  if (logs.length === 0) {
    listEl.innerHTML = '<li class="empty-log">기록이 없습니다.</li>';
    return;
  }
  const recentLogs = logs.slice(0, 20);
  recentLogs.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'log-item';
    const scoreColor = entry.score >= 7 ? 'var(--color-success)'
                     : entry.score >= 4 ? 'var(--color-primary)'
                     :                    'var(--color-danger)';
    li.innerHTML = `
      <span class="log-item-score" style="color: ${scoreColor}">${entry.score}</span>
      <div class="log-item-info">
        <div class="log-item-mission">${entry.mission}</div>
        <div class="log-item-time">${entry.dateLabel}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   8. 유틸리티 — 토스트 알림
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let toastTimeout = null;
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, duration);
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 신규 컴포넌트 커널 확장 팩토리 (2.0 스펙)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let userPoints = 0; // 초기 리워드 머니 상태 0원 고정

// 인메모리 달력 일자별 매핑 테이블 
const calendarState = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  isCompleted: false
}));

// 25개 기본 핵심 미션 어레이 빌더
const baseMissions = [
  "심호흡 하기", "독서하기", "운동 30분", "물 2L 마시기", "스트레칭 10분",
  "비타민 챙겨먹기", "감사일기 쓰기", "7시간 이상 수면", "미라클 모닝 인증", "자세 교정 5분",
  "스쿼트 50회", "영어 단어 5개 암기", "플랭크 2분", "보건학 논문 탐독", "스마트폰 시간 줄이기",
  "뉴스 헤드라인 읽기", "의료 코딩 복습", "방 정리 정돈하기", "카페인 섭취 조절", "일기 작성하기",
  "명상 10분 하기", "가벼운 산책", "체중 기록하기", "가계부 작성", "오늘의 목표 복기"
].map((title, idx) => ({
  id: `MIS-BASE-${200 + idx}`,
  title: title,
  isDone: false,
  reward: 1000
}));

const productBrands = ['신세계백화점', '배달의민족', '네이버페이', 'GS25', 'CU', '문화상품권'];
const brandStyleMap = {
  '신세계백화점': { border: 'brand-shinsegae', badge: 'badge-shinsegae' },
  '배달의민족': { border: 'brand-baemin', badge: 'badge-baemin' },
  '네이버페이': { border: 'brand-naverpay', badge: 'badge-naverpay' },
  'GS25': { border: 'brand-gs25', badge: 'badge-gs25' },
  'CU': { border: 'brand-cu', badge: 'badge-cu' },
  '문화상품권': { border: 'brand-culture', badge: 'badge-culture' }
};

const mockExchangePlaces = {
  '신세계백화점': '전국 이마트 및 신세계백화점 상품권 교환 키오스크',
  '배달의민족': '배달의민족 APP > My배민 > 상품권 등록창',
  '네이버페이': '네이버 웹 지갑 > 쿠폰 > 네이버페이 포인트 전환',
  'GS25': '전국 GS25 오프라인 편의점 매장 포스기 결제',
  'CU': '전국 CU 오프라인 편의점 매장 포스기 결제',
  '문화상품권': '컬쳐랜드 공식 홈페이지 온라인 충전 및 사용 지정처'
};

const imageCollections = {
  '신세계백화점': 'http://googleusercontent.com/image_collection/image_retrieval/4984158485017798346',
  '배달의민족': 'http://googleusercontent.com/image_collection/image_retrieval/14059444913452076328',
  '네이버페이': 'http://googleusercontent.com/image_collection/image_retrieval/15825860963740766245',
  '문화상품권': 'http://googleusercontent.com/image_collection/image_retrieval/12195251056500679631',
  'GS25': 'http://googleusercontent.com/image_collection/image_retrieval/1745238922679403040',
  'CU': 'http://googleusercontent.com/image_collection/image_retrieval/1745238922679403040'
};

const products = [];
for (let i = 1; i <= 45; i++) {
  const brand = productBrands[(i - 1) % productBrands.length];
  let price = 5000;
  let category = 'convenience';
  
  if (brand === '신세계백화점') { price = 10000 * ((i % 3) + 1); category = 'department'; }
  else if (brand === '배달의민족' || brand === '네이버페이') { price = 5000 * ((i % 4) + 1); category = 'delivery'; }
  else { price = 1000 * ((i % 5) + 1); category = 'convenience'; }

  products.push({
    id: `SKU-GF-${1000 + i}`,
    brand: brand,
    name: `${brand} 공식 모바일 인증 상품권 ${price.toLocaleString()}원권`,
    price: price,
    category: category,
    image: imageCollections[brand],
    exchange: mockExchangePlaces[brand]
  });
}

// 글로벌 대메뉴 전환 스위치
function switchGlobalTab(viewId) {
  document.querySelectorAll('.global-view').forEach(el => el.classList.replace('block', 'hidden'));
  document.getElementById('view-' + viewId).classList.replace('hidden', 'block');
  
  document.getElementById('nav-planner-view').className = "px-6 py-2 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white";
  document.getElementById('nav-shop-view').className = "px-6 py-2 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white";
  
  document.getElementById('nav-' + viewId).className = "px-6 py-2 rounded-lg text-sm font-bold transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md";
}

// 25개 기본 미션 제어 센터 빌더
function renderBaseMissions() {
  const container = document.getElementById('base-mission-container');
  if(!container) return;
  container.innerHTML = '';

  baseMissions.forEach(mission => {
    const node = document.createElement('div');
    node.className = `flex justify-between items-center p-3.5 rounded-xl transition-all ${
      mission.isDone ? 'mission-card-completed text-slate-500' : 'mission-card-pending text-slate-200'
    }`;
    node.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full ${mission.isDone ? 'bg-slate-700' : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'} shrink-0"></span>
        <span class="text-xs font-bold tracking-tight ${mission.isDone ? 'line-through text-slate-500' : 'text-slate-100'}">${mission.title}</span>
      </div>
      <button onclick="completeBaseMission('${mission.id}')" ${mission.isDone ? 'disabled' : ''} 
              class="px-2.5 py-1.5 text-[10px] rounded-lg transition-all font-black ${
                mission.isDone 
                ? 'bg-slate-800 text-slate-600 border border-slate-700/30 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white cursor-pointer shadow-md'
              }">
          ${mission.isDone ? '지급 완료' : '적립 +1K'}
      </button>
    `;
    container.appendChild(node);
  });
}

function completeBaseMission(id) {
  const mission = baseMissions.find(m => m.id === id);
  if (!mission || mission.isDone) return;

  mission.isDone = true;
  userPoints += mission.reward;

  updatePointsUI();
  renderBaseMissions();
  
  const firstEmptyDay = calendarState.find(item => !item.isCompleted);
  if (firstEmptyDay) {
    firstEmptyDay.isCompleted = true;
    renderCalendar();
    calculateProgress();
  }
  showToast(`🎉 미션 보상금 1,000P 지급 완료!`);
}

// 실시간 종합 페이스 조절 분석 모듈
function calculateProgress() {
  const totalDays = calendarState.length;
  const completedDays = calendarState.filter(item => item.isCompleted).length;
  const rate = Math.round((completedDays / totalDays) * 100);

  document.getElementById('dashboard-rate-text').innerText = `${rate}%`;
  document.getElementById('dashboard-progress-fill').style.width = `${rate}%`;
  document.getElementById('dashboard-count-text').innerText = `${completedDays} / ${totalDays} TASKS COMPLETED`;
}

function toggleDayStatus(day) {
  const target = calendarState.find(item => item.day === day);
  if (target) {
    target.isCompleted = !target.isCompleted;
    renderCalendar();
    calculateProgress();
  }
}

// 1-1. 7열 달력 숫자 나열 매핑 구조 렌더러
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  if(!grid) return;
  grid.innerHTML = '';
  
  // 2026년 5월 오프셋 규격 정렬 (금요일 시작 = 5칸 공백)
  for (let i = 0; i < 5; i++) {
    grid.appendChild(document.createElement('div'));
  }

  calendarState.forEach(item => {
    const dayEl = document.createElement('button');
    dayEl.onclick = () => toggleDayStatus(item.day);
    
    const dayOfWeek = (item.day + 4) % 7; 
    let textCol = 'text-slate-300';
    if (dayOfWeek === 5) textCol = 'text-sky-400';
    if (dayOfWeek === 6) textCol = 'text-rose-400';

    dayEl.className = `p-2 rounded-xl font-mono text-[11px] flex flex-col items-center justify-between transition-all aspect-square border cursor-pointer ${
      item.isCompleted 
      ? 'bg-blue-500/10 border-blue-500/40 font-bold hover:bg-blue-500/20 ' + textCol
      : 'bg-slate-900 border-slate-800/80 font-medium hover:bg-slate-800 text-slate-600'
    }`;
    
    dayEl.innerHTML = `
      <span>${item.day}</span>
      <span class="w-1 h-1 rounded-full ${item.isCompleted ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-transparent'}"></span>
    `;
    grid.appendChild(dayEl);
  });
}

// 1-2. 시계형 (Clock-View) 24H 반경 변환 스크립트 엔진
function renderClockView() {
  const clock = document.getElementById('routine-clock');
  if(!clock) return;
  const totalHours = 24;
  const radius = 105;

  for (let hour = 0; hour < totalHours; hour += 2) {
    const angle = ((hour - 6) * (360 / totalHours)) * (Math.PI / 180); 
    const x = 140 + radius * Math.cos(angle) - 12;
    const y = 140 + radius * Math.sin(angle) - 12;

    const hourMarker = document.createElement('div');
    hourMarker.className = 'clock-number';
    hourMarker.style.left = `${x}px`;
    hourMarker.style.top = `${y}px`;
    hourMarker.innerText = hour;
    
    if (hour === 6 || hour === 12 || hour === 22) {
      hourMarker.className = 'clock-number text-sky-400 font-bold bg-slate-950 border border-sky-500/40 rounded-md scale-110 px-1';
    }
    clock.appendChild(hourMarker);
  }
}

// 2-2. 상점 실물 매핑 연동 카드 주입기
function renderShopProducts(dataList) {
  const container = document.getElementById('shop-products-container');
  if(!container) return;
  container.innerHTML = '';

  dataList.forEach(prod => {
    const styles = brandStyleMap[prod.brand] || { border: 'border-slate-800', badge: 'bg-slate-700 text-white' };
    const isAffordable = userPoints >= prod.price;

    const card = document.createElement('div');
    card.className = `bg-slate-900 border-x border-b border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group flex flex-col justify-between shadow-lg ${styles.border}`;
    card.innerHTML = `
        <div>
            <div class="h-36 overflow-hidden bg-white flex items-center justify-center relative p-4 shadow-inner">
                <img src="${prod.image}" alt="${prod.name}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 text-[8px] font-bold tracking-wide px-2 py-0.5 rounded ${styles.badge}">${prod.brand}</span>
            </div>
            <div class="p-4">
                <h4 class="text-xs font-bold text-slate-100 line-clamp-2 h-9 tracking-tight leading-snug">${prod.name}</h4>
            </div>
        </div>
        <div class="p-4 pt-0">
            <div class="flex justify-between items-center mb-3 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                <span class="text-[10px] text-slate-400 font-medium">필요 포인트</span>
                <div class="flex items-center gap-0.5">
                    <span class="font-mono font-black ${isAffordable ? 'text-amber-400' : 'text-rose-400'} text-xs">${prod.price.toLocaleString()}</span>
                    <span class="text-[10px] ${isAffordable ? 'text-amber-500' : 'text-rose-500'} font-bold">P</span>
                </div>
            </div>
            <button onclick="purchaseCoupon('${prod.id}')" class="w-full text-[11px] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                isAffordable 
                ? 'bg-slate-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-white cursor-pointer shadow-md' 
                : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }">
                <i class="fa-solid fa-basket-shopping text-[10px]"></i> ${isAffordable ? '바로 교환하기' : '포인트 부족'}
            </button>
        </div>
    `;
    container.appendChild(card);
  });
}

function filterShop(category) {
  document.querySelectorAll('[id^="filter-"]').forEach(btn => btn.className = "px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition-all");
  document.getElementById(`filter-${category}`).className = "px-3 py-1.5 rounded-lg font-bold bg-slate-800 text-white";

  if (category === 'all') {
    renderShopProducts(products);
  } else {
    const filtered = products.filter(p => p.category === category);
    renderShopProducts(filtered);
  }
}

// 2-4. 포인트 검증 차감 트랜잭션 코어 단
function purchaseCoupon(skuId) {
  const item = products.find(p => p.id === skuId);
  if (!item) return;

  if (userPoints < item.price) {
    showToast(`❌ 포인트 잔액이 부족합니다.`);
    return;
  }

  if (confirm(`⚡ [기프티쇼 비즈 실시간 주문 계약 발송]\n\n상품명: ${item.name}\n차감 비용: ${item.price.toLocaleString()} P\n\n보유 포인트를 사용하여 교환하시겠습니까?`)) {
    userPoints -= item.price;
    updatePointsUI();
    const randomCouponNum = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    openBarcodeModal(item, randomCouponNum);
  }
}

function updatePointsUI() {
  document.getElementById('user-points-display').innerText = userPoints.toLocaleString();
  const container = document.getElementById('point-bar-container');
  const icon = document.getElementById('point-icon');
  
  if (userPoints < 5000) { 
    container.className = "bg-slate-900/90 px-5 py-2 rounded-full border flex items-center gap-2 shadow-inner transition-all duration-300 pulse-red";
    icon.className = "fa-solid fa-triangle-exclamation text-rose-400";
  } else {
    container.className = "bg-slate-900/90 px-5 py-2 rounded-full border flex items-center gap-2 shadow-inner transition-all duration-300 pulse-green";
    icon.className = "fa-solid fa-coins text-amber-400";
  }
  
  const currentActiveFilterBtn = document.querySelector('[id^="filter-"].bg-slate-800');
  if(currentActiveFilterBtn) {
    const currentFilter = currentActiveFilterBtn.id.replace('filter-', '');
    filterShop(currentFilter);
  }
}

// 2-3. CODE128 규격 포스기용 바코드 모달 제어
function openBarcodeModal(item, couponNo) {
  const styles = brandStyleMap[item.brand] || { badge: 'bg-slate-600 text-white' };
  const badge = document.getElementById('modal-brand-badge');
  
  badge.innerText = item.brand;
  badge.className = `text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase ${styles.badge}`;
  document.getElementById('modal-name').innerText = item.name;
  document.getElementById('modal-code').innerText = couponNo.replace(/(\d{4})(\d{4})(\d{4})/g, '$1-$2-$3');
  document.getElementById('modal-exchange').innerText = item.exchange;

  document.getElementById('barcode-modal').classList.remove('hidden');

  JsBarcode("#barcode-canvas", couponNo, {
    format: "CODE128",
    width: 2.2,
    height: 65,
    displayValue: false,
    margin: 0,
    lineColor: "#000000"
  });
}

function closeBarcodeModal() {
  document.getElementById('barcode-modal').classList.add('hidden');
}

function copyCode() {
  const rawCode = document.getElementById('modal-code').innerText.replace(/-/g, '');
  navigator.clipboard.writeText(rawCode).then(() => {
    showToast('📋 쿠폰 번호가 복사되었습니다.');
  });
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   9. 초기화 — 페이지 로드 시 실행
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  renderBaseMissions(); 
  renderCalendar();
  renderClockView();
  renderShopProducts(products);
  updatePointsUI();
  calculateProgress();
});
