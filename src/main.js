import './style.css';
import Chart from 'chart.js/auto';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

const state = {
  mainData: null,
  compareData: null,
  charts: {
    difficulty: null,
    mainTopic: null,
    compareTopic: null,
    rating: null
  },
  activeTopicCard: 0
};

const ui = {
  handleInput: document.getElementById('handleInput'),
  compareHandleInput: document.getElementById('compareHandleInput'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  compareBtn: document.getElementById('compareBtn'),
  compareControls: document.getElementById('compareControls'),
  dashboard: document.getElementById('dashboard'),
  profileGrid: document.getElementById('profileGrid'),
  mainTopicCard: document.getElementById('mainTopicCard'),
  compareTopicCard: document.getElementById('compareTopicCard'),
  mainTopicTitle: document.getElementById('mainTopicTitle'),
  compareTopicTitle: document.getElementById('compareTopicTitle'),
  cursorDot: document.getElementById('cursorDot'),
  cursorRing: document.getElementById('cursorRing'),
  fxCanvas: document.getElementById('fxCanvas')
};

const lenis = new Lenis({
  duration: 1.05,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.2
});

lenis.on('scroll', ScrollTrigger.update);

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

function setupThreeBackground() {
  if (!ui.fxCanvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas: ui.fxCanvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;

  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.035,
    transparent: true,
    opacity: 0.65,
    color: 0x66d9ff
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x223f6c,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(34, 20, 30, 20), gridMaterial);
  grid.position.set(0, -2.6, -5.4);
  grid.rotation.x = -0.9;
  scene.add(grid);

  const pointer = { x: 0, y: 0 };

  const handleMouse = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.25;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.2;
  };
  window.addEventListener('mousemove', handleMouse, { passive: true });

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();
    particles.rotation.y = t * 0.04 + pointer.x;
    particles.rotation.x = Math.sin(t * 0.3) * 0.04 + pointer.y;
    grid.rotation.z = Math.sin(t * 0.18) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

function setupCursorEffects() {
  if (!window.matchMedia('(pointer: fine)').matches || !ui.cursorDot || !ui.cursorRing) return;

  ui.cursorDot.classList.remove('hidden');
  ui.cursorRing.classList.remove('hidden');

  const ringX = gsap.quickTo(ui.cursorRing, 'x', { duration: 0.25, ease: 'power3' });
  const ringY = gsap.quickTo(ui.cursorRing, 'y', { duration: 0.25, ease: 'power3' });
  const dotX = gsap.quickTo(ui.cursorDot, 'x', { duration: 0.08, ease: 'power2' });
  const dotY = gsap.quickTo(ui.cursorDot, 'y', { duration: 0.08, ease: 'power2' });

  const handleMove = (event) => {
    const { clientX, clientY } = event;
    dotX(clientX);
    dotY(clientY);
    ringX(clientX);
    ringY(clientY);
  };

  document.addEventListener('mousemove', handleMove, { passive: true });

  document.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-active');
    gsap.fromTo(ui.cursorRing, { scale: 0.9 }, { scale: 1.35, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 });
  });

  document.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-active');
  });

  const hoverTargets = 'button, a, input, .glass-panel, .topic-card, .stat-tile';
  document.querySelectorAll(hoverTargets).forEach((element) => {
    element.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
      gsap.to(ui.cursorRing, { scale: 1.6, duration: 0.2, ease: 'power2.out' });
    });

    element.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
      gsap.to(ui.cursorRing, { scale: 1, duration: 0.2, ease: 'power2.out' });
    });
  });
}

function setupScrollEffects() {
  gsap.utils.toArray('.glass-panel, .topic-card').forEach((panel) => {
    gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: panel,
          start: 'top 88%'
        }
      }
    );
  });

  gsap.to('#hero', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5
    }
  });

  gsap.to('#controlArea', {
    yPercent: -4,
    ease: 'none',
    scrollTrigger: {
      trigger: '#controlArea',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.4
    }
  });
}

function setupCardTiltEffects() {
  const interactiveCards = document.querySelectorAll('.glass-panel, .topic-card, .stat-panel');

  interactiveCards.forEach((card) => {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (event) => {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 6;
      const rotateX = (0.5 - y) * 6;

      gsap.to(card, {
        rotateX,
        rotateY,
        z: 8,
        duration: 0.25,
        ease: 'power2.out',
        transformPerspective: 900
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        z: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
    });
  });
}

function animateEntry() {
  gsap.from('#hero', { y: 20, opacity: 0, duration: 0.7, ease: 'power2.out' });
  gsap.from('#controlArea .glass-panel', {
    y: 18,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    delay: 0.15,
    ease: 'power2.out'
  });
}

function animateDashboard() {
  gsap.from('#dashboard .glass-panel, #dashboard .topic-card', {
    opacity: 0,
    y: 20,
    duration: 0.55,
    stagger: 0.06,
    ease: 'power2.out'
  });
}

function validateApiResponse(data, fallbackMessage) {
  if (!data || data.status !== 'OK') {
    throw new Error(data?.comment || fallbackMessage);
  }
}

async function fetchUser(handle) {
  const [statusRes, infoRes, ratingRes] = await Promise.all([
    fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`),
    fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
    fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)
  ]);

  const statusData = await statusRes.json();
  const infoData = await infoRes.json();
  const ratingData = await ratingRes.json();

  validateApiResponse(statusData, 'Unable to fetch user submissions.');
  validateApiResponse(infoData, 'Unable to fetch profile info.');
  validateApiResponse(ratingData, 'Unable to fetch contest rating history.');

  const solved = new Set();
  const attempted = new Map();
  const difficultyCount = {};
  const tagCount = {};

  let totalRating = 0;
  let ratedSolvedCount = 0;
  let maxRating = 0;

  statusData.result.forEach((submission) => {
    if (!submission.problem) return;
    const key = `${submission.problem.contestId}-${submission.problem.index}`;

    if (submission.verdict === 'OK') {
      if (!solved.has(key)) {
        solved.add(key);

        if (submission.problem.rating) {
          difficultyCount[submission.problem.rating] = (difficultyCount[submission.problem.rating] || 0) + 1;
          totalRating += submission.problem.rating;
          ratedSolvedCount += 1;
          maxRating = Math.max(maxRating, submission.problem.rating);
        }

        submission.problem.tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    } else if (!attempted.has(key)) {
      attempted.set(key, submission.problem);
    }
  });

  const unsolved = [];
  attempted.forEach((problem, key) => {
    if (!solved.has(key)) unsolved.push(problem);
  });

  const tags = Object.keys(tagCount);
  const leastTopic = tags.length ? tags.reduce((a, b) => (tagCount[a] < tagCount[b] ? a : b)) : 'N/A';
  const mostTopic = tags.length ? tags.reduce((a, b) => (tagCount[a] > tagCount[b] ? a : b)) : 'N/A';

  return {
    handle,
    rating: infoData.result[0]?.rating ?? 'Unrated',
    solved,
    unsolved,
    difficultyCount,
    tagCount,
    avgRating: ratedSolvedCount ? (totalRating / ratedSolvedCount).toFixed(2) : '0.00',
    maxRating,
    leastTopic,
    mostTopic,
    ratingGraph: ratingData.result || []
  };
}

function createStatTile(label, value, note = '') {
  return `
    <article class="stat-tile">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${value}</p>
      ${note ? `<p class="mt-2 text-xs text-slate-400">${note}</p>` : ''}
    </article>
  `;
}

function createProfilePanel(data) {
  const unsolvedLinks = data.unsolved
    .slice(0, 5)
    .map(
      (problem) =>
        `<a class="mt-1 block text-xs text-cyan-300 hover:text-cyan-200" target="_blank" rel="noreferrer" href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}">${problem.name}</a>`
    )
    .join('');

  return `
    <article class="stat-panel">
      <h3 class="text-xl font-semibold text-cyan-100">${data.handle}</h3>
      <div class="stat-grid">
        ${createStatTile('Current CF Rating', data.rating)}
        ${createStatTile('Total Solved', data.solved.size)}
        ${createStatTile('Average Problem Rating', data.avgRating, 'Average over solved rated problems')}
        ${createStatTile('Hardest Solved', data.maxRating || 'N/A')}
        ${createStatTile('Least Practiced Topic', data.leastTopic)}
        ${createStatTile('Most Practiced Topic', data.mostTopic)}
      </div>
      <div class="mt-4 rounded-xl border border-cyan-100/10 bg-slate-950/55 p-3">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Attempted but unsolved (${data.unsolved.length})</p>
        <div class="mt-2">${unsolvedLinks || '<p class="text-xs text-slate-500">None</p>'}</div>
      </div>
    </article>
  `;
}

function setLoading(button, loadingText, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add('opacity-70', 'cursor-not-allowed');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('opacity-70', 'cursor-not-allowed');
  }
}

function updateVisibility() {
  const hasMain = Boolean(state.mainData);
  const hasCompare = Boolean(state.compareData);

  ui.compareControls.classList.toggle('hidden', !hasMain);
  ui.dashboard.classList.toggle('hidden', !hasMain);
  ui.compareTopicCard.classList.toggle('hidden', !hasCompare);
}

function destroyChart(instanceKey) {
  if (state.charts[instanceKey]) {
    state.charts[instanceKey].destroy();
    state.charts[instanceKey] = null;
  }
}

function renderDifficultyChart() {
  destroyChart('difficulty');

  const ratingSet = new Set([
    ...Object.keys(state.mainData?.difficultyCount || {}),
    ...Object.keys(state.compareData?.difficultyCount || {})
  ]);
  const labels = [...ratingSet].sort((a, b) => Number(a) - Number(b));

  state.charts.difficulty = new Chart(document.getElementById('difficultyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: state.mainData.handle,
          data: labels.map((rating) => state.mainData.difficultyCount[rating] || 0),
          backgroundColor: 'rgba(255, 196, 105, 0.85)',
          borderRadius: 6
        },
        ...(state.compareData
          ? [
              {
                label: state.compareData.handle,
                data: labels.map((rating) => state.compareData.difficultyCount[rating] || 0),
                backgroundColor: 'rgba(88, 212, 255, 0.85)',
                borderRadius: 6
              }
            ]
          : [])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#1f2937', font: { weight: 600 } }
        }
      },
      scales: {
        x: { ticks: { color: '#334155' }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: '#334155' } }
      }
    }
  });
}

function renderTopicCharts() {
  destroyChart('mainTopic');
  destroyChart('compareTopic');

  ui.mainTopicTitle.textContent = `${state.mainData.handle} Topic Distribution`;
  ui.compareTopicTitle.textContent = state.compareData
    ? `${state.compareData.handle} Topic Distribution`
    : 'Comparison Profile';

  const palette = ['#67e8f9', '#fbbf24', '#818cf8', '#fb7185', '#34d399', '#a78bfa', '#38bdf8', '#f87171', '#4ade80', '#facc15'];

  state.charts.mainTopic = new Chart(document.getElementById('mainTopicChart'), {
    type: 'pie',
    data: {
      labels: Object.keys(state.mainData.tagCount),
      datasets: [
        {
          data: Object.values(state.mainData.tagCount),
          backgroundColor: palette
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#1f2937', font: { size: 11 } }
        }
      }
    }
  });

  if (state.compareData) {
    state.charts.compareTopic = new Chart(document.getElementById('compareTopicChart'), {
      type: 'pie',
      data: {
        labels: Object.keys(state.compareData.tagCount),
        datasets: [
          {
            data: Object.values(state.compareData.tagCount),
            backgroundColor: palette
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#1f2937', font: { size: 11 } }
          }
        }
      }
    });
  }

  setActiveTopicCard(state.activeTopicCard);
}

function renderRatingChart() {
  destroyChart('rating');

  const mainRatings = (state.mainData?.ratingGraph || []).map((entry) => entry.newRating);
  const compareRatings = (state.compareData?.ratingGraph || []).map((entry) => entry.newRating);
  const maxContests = Math.max(mainRatings.length, compareRatings.length, 1);
  const labels = Array.from({ length: maxContests }, (_, i) => i + 1);

  state.charts.rating = new Chart(document.getElementById('ratingChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: state.mainData.handle,
          data: mainRatings,
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          tension: 0.15,
          pointRadius: 2,
          pointHoverRadius: 5
        },
        ...(state.compareData
          ? [
              {
                label: state.compareData.handle,
                data: compareRatings,
                borderColor: '#06b6d4',
                backgroundColor: '#06b6d4',
                tension: 0.15,
                pointRadius: 2,
                pointHoverRadius: 5
              }
            ]
          : [])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#1f2937', font: { weight: 600 } }
        },
        tooltip: {
          callbacks: {
            title(items) {
              const item = items[0];
              const index = item.dataIndex;
              const user = item.dataset.label === state.mainData.handle ? state.mainData : state.compareData;
              return `${item.dataset.label} - ${user?.ratingGraph?.[index]?.contestName || `Contest #${index + 1}`}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Contest Number', color: '#334155' },
          ticks: { color: '#334155', maxTicksLimit: 12 },
          grid: { display: false }
        },
        y: { ticks: { color: '#334155' } }
      }
    }
  });
}

function renderProfiles() {
  ui.profileGrid.innerHTML = `
    ${createProfilePanel(state.mainData)}
    ${state.compareData ? createProfilePanel(state.compareData) : ''}
  `;
  setupCardTiltEffects();
}

function renderDashboard() {
  updateVisibility();
  if (!state.mainData) return;

  renderProfiles();
  renderDifficultyChart();
  renderTopicCharts();
  renderRatingChart();
  animateDashboard();
  ScrollTrigger.refresh();
}

function showError(message) {
  window.alert(message);
}

async function analyzeMainProfile() {
  const handle = ui.handleInput.value.trim();
  if (!handle) {
    showError('Enter a Codeforces handle first.');
    return;
  }

  setLoading(ui.analyzeBtn, 'Analyzing...', true);
  try {
    state.mainData = await fetchUser(handle);
    state.compareData = null;
    state.activeTopicCard = 0;
    ui.compareHandleInput.value = '';
    renderDashboard();
    lenis.scrollTo('#dashboard', { offset: -20, duration: 1.1 });
  } catch (error) {
    showError(error.message || 'Unable to analyze profile.');
  } finally {
    setLoading(ui.analyzeBtn, 'Analyze', false);
  }
}

async function compareProfiles() {
  if (!state.mainData) {
    showError('Analyze a primary profile first.');
    return;
  }

  const handle = ui.compareHandleInput.value.trim();
  if (!handle) {
    showError('Enter a comparison handle.');
    return;
  }

  setLoading(ui.compareBtn, 'Comparing...', true);
  try {
    state.compareData = await fetchUser(handle);
    renderDashboard();
  } catch (error) {
    showError(error.message || 'Unable to compare profiles.');
  } finally {
    setLoading(ui.compareBtn, 'Compare', false);
  }
}

function setActiveTopicCard(index) {
  const cards = [...document.querySelectorAll('.topic-card:not(.hidden)')];
  if (!cards.length) return;

  state.activeTopicCard = Math.max(0, Math.min(index, cards.length - 1));

  cards.forEach((card, idx) => {
    card.classList.toggle('active', idx === state.activeTopicCard);
    card.classList.toggle('dimmed', idx !== state.activeTopicCard);
  });
}

function setupGestures() {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  const minSwipe = 50;
  const maxDuration = 700;

  const sectionSelectors = ['#hero', '#controlArea', '#profileSection', '#difficultyChart', '#topicCards', '#ratingChart'];

  function sections() {
    return sectionSelectors.map((selector) => document.querySelector(selector)).filter(Boolean);
  }

  function jumpSection(direction) {
    const list = sections();
    if (!list.length) return;

    const centerY = window.scrollY + window.innerHeight / 2;
    let current = 0;
    list.forEach((el, i) => {
      if (el.offsetTop <= centerY) current = i;
    });

    const next = Math.max(0, Math.min(current + direction, list.length - 1));
    lenis.scrollTo(list[next], { offset: -24, duration: 0.9 });
  }

  document.addEventListener(
    'touchstart',
    (event) => {
      const target = event.target;
      if (target.closest('input, button, a, canvas')) return;
      const touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    (event) => {
      if (!startTime) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const elapsed = Date.now() - startTime;
      startTime = 0;

      if (elapsed > maxDuration) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < minSwipe && absY < minSwipe) return;

      if (event.target.closest('#topicCards') && absX > absY) {
        if (dx < 0) setActiveTopicCard(state.activeTopicCard + 1);
        else setActiveTopicCard(state.activeTopicCard - 1);
        return;
      }

      if (absY > absX) {
        if (dy < 0) jumpSection(1);
        else jumpSection(-1);
      }
    },
    { passive: true }
  );
}

ui.analyzeBtn.addEventListener('click', analyzeMainProfile);
ui.compareBtn.addEventListener('click', compareProfiles);
ui.handleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') analyzeMainProfile();
});
ui.compareHandleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') compareProfiles();
});

updateVisibility();
setupThreeBackground();
setupCursorEffects();
setupGestures();
setupScrollEffects();
setupCardTiltEffects();
animateEntry();
