// Global Application State
let currentScaleMode = 'fit'; // 'fit' or '100'
let currentView = 'map'; // 'map', 'portfolio', 'riyadh-detailed'
let activeRegion = 'saudi';
let activeEntity = 'stadiums';
let isTimelinePlaying = false;
let timelineInterval = null;

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
  setupViewportScaling();
  window.addEventListener('resize', setupViewportScaling);
  
  // Close view switcher dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdownContainer = document.querySelector('.switcher-dropdown-container');
    const dropdown = document.getElementById('switcher-dropdown');
    if (dropdownContainer && !dropdownContainer.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
});

// 1. Viewport Auto-scaling Logic
function setupViewportScaling() {
  const viewport = document.getElementById('viewport');
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const targetWidth = 5124;
  const targetHeight = 1440;
  
  if (currentScaleMode === 'fit') {
    const scaleX = winWidth / targetWidth;
    const scaleY = winHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);
    
    viewport.style.transform = `scale(${scale})`;
    // Center it on screen if it leaves space
    const leftOffset = Math.max(0, (winWidth - targetWidth * scale) / 2);
    const topOffset = Math.max(0, (winHeight - targetHeight * scale) / 2);
    viewport.style.left = `${leftOffset}px`;
    viewport.style.top = `${topOffset}px`;
    
    document.getElementById('scale-value-display').innerText = `Scale: ${Math.round(scale * 100)}% (Fit Screen)`;
  } else {
    // 100% Size Mode
    viewport.style.transform = 'scale(1)';
    viewport.style.left = '0px';
    viewport.style.top = '0px';
    document.getElementById('scale-value-display').innerText = 'Scale: 100% (5124 x 1440)';
  }
}

function setScaleMode(mode) {
  currentScaleMode = mode;
  const buttons = document.querySelectorAll('.scale-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'fit') {
    buttons[0].classList.add('active');
  } else {
    buttons[1].classList.add('active');
  }
  setupViewportScaling();
}

// 2. Navigation State Transitions
function transitionToPortal() {
  const welcome = document.getElementById('welcome-screen');
  const portal = document.getElementById('portal-screen');
  
  welcome.style.opacity = '0';
  setTimeout(() => {
    welcome.style.display = 'none';
    portal.style.display = 'block';
    portal.style.opacity = '1';
  }, 500);
}

function enterDashboard(initialView) {
  const portal = document.getElementById('portal-screen');
  const dashboard = document.getElementById('main-dashboard');
  
  portal.style.opacity = '0';
  setTimeout(() => {
    portal.style.display = 'none';
    dashboard.classList.remove('hidden');
    switchView(initialView);
  }, 500);
}

function exitToPortal() {
  const portal = document.getElementById('portal-screen');
  const dashboard = document.getElementById('main-dashboard');
  
  dashboard.classList.add('hidden');
  portal.style.display = 'block';
  setTimeout(() => {
    portal.style.opacity = '1';
  }, 50);
}

// 3. Switcher Dropdown & View Management
function toggleDropdown() {
  const dropdown = document.getElementById('switcher-dropdown');
  dropdown.classList.toggle('active');
}

function switchView(viewName) {
  currentView = viewName;
  
  // Hide all main canvases
  document.getElementById('saudi-map-view').classList.add('hidden');
  document.getElementById('riyadh-detailed-view').classList.add('hidden');
  document.getElementById('portfolio-view').classList.add('hidden');
  
  // Update view trigger labels & drop down states
  const triggerText = document.getElementById('active-view-name');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => item.classList.remove('active'));
  
  // Toggle Sidebars content
  const sideRiyadhMetrics = document.getElementById('side-riyadh-metrics');
  const sidePortfolioDetails = document.getElementById('side-portfolio-details');
  const sideTag = document.getElementById('side-tag');
  const sideTitle = document.getElementById('side-main-title');
  
  if (viewName === 'map') {
    document.getElementById('saudi-map-view').classList.remove('hidden');
    triggerText.innerText = '01 MAP VIEW';
    dropdownItems[0].classList.add('active');
    
    // Sidebar config
    sideRiyadhMetrics.classList.remove('hidden');
    sidePortfolioDetails.classList.add('hidden');
    sideTag.innerText = 'PROGRAM HEALTH';
    sideTitle.innerText = 'Riyadh Stadium Portfolios';
    
    // Set region back to Saudi active in the sidebar menu
    selectRegion('saudi');
  } 
  else if (viewName === 'portfolio') {
    document.getElementById('portfolio-view').classList.remove('hidden');
    triggerText.innerText = '02 PORTFOLIO VIEW';
    dropdownItems[1].classList.add('active');
    
    // Sidebar config
    sideRiyadhMetrics.classList.add('hidden');
    sidePortfolioDetails.classList.remove('hidden');
    sideTag.innerText = 'PROJECT STATUS';
    sideTitle.innerText = 'Riyadh Project Insights';
    
    // Default show King Fahd Stadium details in sidebar in portfolio
    onDetailedStadiumClick('King Fahd Sports City', 'On Track', 'SAR 2.2B', '75%', '68,000');
  }
  
  // Close dropdown
  document.getElementById('switcher-dropdown').classList.remove('active');
}

// 4. Region Sidebar Controls
function selectRegion(region) {
  activeRegion = region;
  
  const items = document.querySelectorAll('.region-list .region-item');
  items.forEach(item => item.classList.remove('active'));
  
  // Highlight clicked
  let idx = 0;
  if (region === 'saudi') idx = 0;
  else if (region === 'riyadh') idx = 1;
  else if (region === 'neom') idx = 2;
  else if (region === 'jeddah') idx = 3;
  else if (region === 'alkhobar') idx = 4;
  else if (region === 'abha') idx = 5;
  items[idx].classList.add('active');

  // If clicked Riyadh, highlight map pin and display metrics
  if (region === 'riyadh') {
    highlightSaudiMapPin('pin-riyadh');
    updateQuickMetrics('Riyadh', '68%', '8 Stadiums', '23 Projects', 'MEDIUM');
    
    // Automatically trigger Riyadh Tooltip in Country Map
    if (currentView === 'map') {
      const pin = document.getElementById('pin-riyadh');
      const rect = pin.getBoundingClientRect();
      const parentRect = pin.closest('.map-canvas-container').getBoundingClientRect();
      
      // Compute coordinates relative to container
      const x = rect.left - parentRect.left + 30;
      const y = rect.top - parentRect.top - 80;
      
      showTooltip('STADIUM', 'King Fahd Sports City', 'ON TRACK', 'Sports City Renewal Co.', 'SAR 2.2B', '2024 - 2027', '68,000', x, y);
      document.getElementById('gantt-side-panel').classList.add('active');
    }
  } else {
    // If other regions, update tooltip/metrics accordingly
    closeTooltip();
    closeGanttPanel();
    
    if (region === 'neom') {
      highlightSaudiMapPin('pin-neom');
      updateQuickMetrics('NEOM', '92%', '1 Stadium', '5 Projects', 'LOW');
    } else if (region === 'jeddah') {
      highlightSaudiMapPin('pin-jeddah');
      updateQuickMetrics('Jeddah', '54%', '4 Stadiums', '16 Projects', 'HIGH');
    } else if (region === 'alkhobar') {
      highlightSaudiMapPin('pin-alkhobar');
      updateQuickMetrics('Al Khobar', '40%', '1 Stadium', '4 Projects', 'MEDIUM');
    } else if (region === 'abha') {
      highlightSaudiMapPin('pin-abha');
      updateQuickMetrics('Abha', '78%', '1 Stadium', '3 Projects', 'LOW');
    } else {
      // Saudi Arabia general
      highlightSaudiMapPin(null);
      updateQuickMetrics('Saudi Arabia', '68%', '15 Stadiums', '51 Projects', 'MEDIUM');
    }
  }
}

function highlightSaudiMapPin(pinId) {
  const pins = document.querySelectorAll('.saudi-svg-map .map-pin');
  pins.forEach(pin => pin.classList.remove('active'));
  
  if (pinId) {
    document.getElementById(pinId).classList.add('active');
  }
}

function updateQuickMetrics(name, readiness, stadiums, projects, risk) {
  document.getElementById('overlay-city-name').innerText = name;
  document.getElementById('overlay-city-readiness').innerText = `${readiness} READY`;
  document.getElementById('overlay-city-stadiums').innerText = stadiums;
  document.getElementById('overlay-city-projects').innerText = projects;
  document.getElementById('overlay-city-risk').innerText = risk;
  
  const riskVal = document.getElementById('overlay-city-risk');
  if (risk === 'HIGH') {
    riskVal.style.color = 'var(--accent-red)';
  } else if (risk === 'MEDIUM') {
    riskVal.style.color = 'var(--accent-orange)';
  } else {
    riskVal.style.color = 'var(--accent-emerald)';
  }
}

// 5. Entity Selection
function selectEntity(entity) {
  activeEntity = entity;
  const items = document.querySelectorAll('.entity-list .entity-item');
  items.forEach(item => item.classList.remove('active'));
  
  let idx = 0;
  if (entity === 'stadiums') idx = 0;
  else if (entity === 'hospitality') idx = 1;
  else if (entity === 'fanzones') idx = 2;
  else if (entity === 'transport') idx = 3;
  items[idx].classList.add('active');
}

// 6. Canvas Tab / Filter selections
function setCanvasTab(btn, tabType) {
  const tabs = document.querySelectorAll('.canvas-tab');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// 7. Interactive Map Pin Clicks & Tooltips
function onPinClick(city, e) {
  e.stopPropagation();
  
  // Set region active in sidebar menu
  selectRegion(city);
}

function showTooltip(tag, title, status, contractor, budget, timeline, capacity, x, y) {
  const modal = document.getElementById('pin-tooltip-modal');
  modal.style.left = `${x}px`;
  modal.style.top = `${y}px`;
  modal.style.display = 'flex';
  
  document.getElementById('tooltip-entity-tag').innerText = tag;
  document.getElementById('tooltip-entity-title').innerText = title;
  document.getElementById('tooltip-entity-status').innerText = status;
  document.getElementById('tooltip-contractor').innerText = contractor;
  document.getElementById('tooltip-budget').innerText = budget;
  document.getElementById('tooltip-timeline').innerText = timeline;
  document.getElementById('tooltip-capacity').innerText = capacity;
}

function closeTooltip() {
  document.getElementById('pin-tooltip-modal').style.display = 'none';
}

function closeGanttPanel() {
  document.getElementById('gantt-side-panel').classList.remove('active');
}

// 8. Detailed City Map View Transitions
function enterDetailedRiyadhMap() {
  closeTooltip();
  closeGanttPanel();
  
  currentView = 'riyadh-detailed';
  document.getElementById('saudi-map-view').classList.add('hidden');
  document.getElementById('riyadh-detailed-view').classList.remove('hidden');
  
  // Highlight Riyadh region
  selectRegion('riyadh');
}

function exitDetailedRiyadhMap() {
  currentView = 'map';
  document.getElementById('riyadh-detailed-view').classList.add('hidden');
  document.getElementById('saudi-map-view').classList.remove('hidden');
}

// Click on Detailed Stadium pins (State 8 detailed map)
function onDetailedStadiumClick(name, status, budget, progress, capacity) {
  // Update active pins on Detailed Riyadh map
  const detailedPins = document.querySelectorAll('#riyadh-detailed-view .map-pin');
  detailedPins.forEach(p => {
    p.classList.remove('active');
    const txtNode = p.querySelector('.map-pin-text');
    if (txtNode && txtNode.textContent === name) {
      p.classList.add('active');
    }
  });

  // Switch Side metrics and titles
  document.getElementById('side-circle-title').innerText = name;
  document.getElementById('side-circle-pct').innerText = progress;
  
  // Calculate dash offset based on progress percent
  const pctNum = parseInt(progress);
  const fill = document.getElementById('circular-progress-fill');
  if (fill) {
    const circumference = 440; // 2 * PI * r (r = 70) => ~439.8
    const offset = circumference - (pctNum / 100) * circumference;
    fill.style.strokeDashoffset = offset;
  }

  // Highlight stadium warnings if click specific ones
  const actionList = document.getElementById('side-action-list');
  const actionTitle = document.getElementById('side-action-title');
  actionTitle.innerText = `${name} Tasks`;
  
  if (name === 'Prince Faisal bin Fahd Stadium') {
    actionList.innerHTML = `
      <div class="action-item">
        <div class="action-check checked" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text" style="text-decoration: line-through;">Excavation works completion</div>
          <div class="action-date">Completed: Apr 15, 2026</div>
        </div>
      </div>
      <div class="action-item">
        <div class="action-check" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text">Soil drainage system validation</div>
          <div class="action-date">Target: Jul 25, 2026 (HOLD)</div>
        </div>
      </div>
    `;
  } else if (name === 'New Murabba Stadium') {
    actionList.innerHTML = `
      <div class="action-item">
        <div class="action-check" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text">Design approval stage gate</div>
          <div class="action-date">Target: Aug 12, 2026</div>
        </div>
      </div>
    `;
  } else {
    // Default / King Fahd Sports City
    actionList.innerHTML = `
      <div class="action-item">
        <div class="action-check checked" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text" style="text-decoration: line-through;">Substructure Reinforcement</div>
          <div class="action-date">Completed: May 12, 2026</div>
        </div>
      </div>
      <div class="action-item">
        <div class="action-check checked" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text" style="text-decoration: line-through;">Pillar Concrete Pour</div>
          <div class="action-date">Completed: Jun 28, 2026</div>
        </div>
      </div>
      <div class="action-item">
        <div class="action-check" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text">Steel Roof Girder Lift</div>
          <div class="action-date">Target: Jul 20, 2026</div>
        </div>
      </div>
      <div class="action-item">
        <div class="action-check" onclick="toggleCheck(this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="action-text">Seat Rails Installation</div>
          <div class="action-date">Target: Sep 15, 2026</div>
        </div>
      </div>
    `;
  }
}

// 9. Table Filtering in Portfolio View
function filterTable(type) {
  // Update filter pills active state
  const pills = document.querySelectorAll('.portfolio-table-filters .table-filter-pill');
  pills.forEach(pill => pill.classList.remove('active'));
  
  // Find matching pill to make active
  pills.forEach(p => {
    if (p.innerText.toLowerCase().includes(type.toLowerCase())) {
      p.classList.add('active');
    }
  });

  const tableBody = document.getElementById('portfolio-table-body');
  const rows = tableBody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const rowType = row.getAttribute('data-type');
    if (type === 'all' || rowType === type) {
      row.style.display = 'table-row';
    } else {
      row.style.display = 'none';
    }
  });
}

// 10. Checklist item toggles
function toggleCheck(chk) {
  chk.classList.toggle('checked');
  const text = chk.nextElementSibling.querySelector('.action-text');
  if (chk.classList.contains('checked')) {
    text.style.textDecoration = 'line-through';
  } else {
    text.style.textDecoration = 'none';
  }
}

// 11. Timeline Playback Simulation
function toggleTimelinePlayback() {
  isTimelinePlaying = !isTimelinePlaying;
  
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const mediaText = document.querySelector('.media-placeholder span');
  
  if (isTimelinePlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    
    let year = 2026;
    let quarter = 1;
    mediaText.innerText = `Simulation Active: Q${quarter} ${year}`;
    
    timelineInterval = setInterval(() => {
      quarter++;
      if (quarter > 4) {
        quarter = 1;
        year++;
      }
      if (year > 2034) {
        clearInterval(timelineInterval);
        isTimelinePlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        mediaText.innerText = 'Simulation Finished (2034)';
        return;
      }
      
      mediaText.innerText = `Simulation Active: Q${quarter} ${year}`;
      
      // Dynamically fluctuate progress values slightly during simulation
      const randProgress1 = Math.min(100, 75 + (year - 2026) * 3);
      const randProgress2 = Math.min(100, 68 + (year - 2026) * 4);
      const randProgress3 = Math.min(100, 20 + (year - 2026) * 9);
      
      // Update circular chart text if active in Portfolio View
      if (currentView === 'portfolio') {
        onDetailedStadiumClick('King Fahd Sports City', 'On Track', 'SAR 2.2B', `${Math.round(randProgress1)}%`, '68,000');
      }
      
      // Update progress values inside table / charts
      document.getElementById('metrics-val-prog').innerText = `${Math.round(randProgress2)}%`;
      
    }, 1500);
    
  } else {
    clearInterval(timelineInterval);
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    mediaText.innerText = 'Simulation Paused';
  }
}
