// assets/js/projects.js
// Moteur de rendu dynamique de la grille de projets
// Lit assets/data/projects.json et génère les cartes HTML

(function () {
  'use strict';

  // Palette de couleurs cyclique pour les cartes (reprend les couleurs actuelles du design)
  const CARD_COLORS = [
    'var(--color-light-blue)',
    'var(--color-light-green)',
    'var(--color-light-orange)',
    'var(--color-pink)',
    'var(--color-light-green)',
    'var(--color-light-blue)',
  ];

  // ─── State ──────────────────────────────────────────────────────────────────

  let allProjects = [];
  let activeCategory = 'All';
  let activeTag = null;

  // ─── Fetch & Init ────────────────────────────────────────────────────────────

  async function init() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    // Afficher les skeletons pendant le chargement
    renderSkeletons(grid, 6);

    try {
      let res = await fetch('assets/data/projects.json');
      if (!res.ok) res = await fetch('/assets/data/projects.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProjects = await res.json();
    } catch (err) {
      console.error('Portfolio: could not load projects.json', err);
      grid.innerHTML = `<p class="projects-error">Impossible de charger les projets.</p>`;
      return;
    }

    // Construire les filtres
    renderFilters();

    // Rendre la grille initiale
    renderGrid();
  }

  // ─── Skeletons ───────────────────────────────────────────────────────────────

  function renderSkeletons(grid, count) {
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'project-card skeleton' + (i === 1 || i === 2 ? ' large' : '');
      card.innerHTML = `
        <div class="project-header skeleton-header">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
        </div>
        <div class="project-illustration skeleton-illustration"></div>
      `;
      grid.appendChild(card);
    }
  }

  // ─── Filters ─────────────────────────────────────────────────────────────────

  function renderFilters() {
    // Collect categories
    const categories = ['All', ...new Set(allProjects.map(p => p.category).filter(Boolean))];

    // Collect all unique tags
    const tagCounts = {};
    allProjects.forEach(p => {
      (p.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    // Top tags (appearing in more than 1 project, sorted by count)
    const topTags = Object.entries(tagCounts)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Build filter bar
    const filterBar = document.createElement('div');
    filterBar.id = 'project-filters';
    filterBar.innerHTML = `
      <div class="filter-group" id="filter-categories">
        ${categories.map(cat => `
          <button class="filter-btn${cat === activeCategory ? ' active' : ''}" 
                  data-filter-type="category" 
                  data-filter-value="${cat}"
                  id="filter-cat-${cat.toLowerCase()}">
            ${cat}
          </button>
        `).join('')}
      </div>
      ${topTags.length > 0 ? `
        <div class="filter-group filter-tags" id="filter-tags">
          ${topTags.map(tag => `
            <button class="filter-btn filter-tag${activeTag === tag ? ' active' : ''}" 
                    data-filter-type="tag" 
                    data-filter-value="${tag}"
                    id="filter-tag-${tag.replace(/\s+/g, '-').toLowerCase()}">
              ${tag}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Attach event listeners
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        const value = btn.dataset.filterValue;

        if (type === 'category') {
          activeCategory = value;
          activeTag = null;
        } else if (type === 'tag') {
          activeTag = activeTag === value ? null : value;
        }

        updateFilterUI(filterBar);
        renderGrid();
      });
    });

    // Insert before the grid
    const grid = document.getElementById('grid');
    const section = grid.closest('section') || grid.parentNode;
    section.insertBefore(filterBar, grid);
  }

  function updateFilterUI(filterBar) {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      const type = btn.dataset.filterType;
      const value = btn.dataset.filterValue;
      const isActive =
        (type === 'category' && value === activeCategory) ||
        (type === 'tag' && value === activeTag);
      btn.classList.toggle('active', isActive);
    });
  }

  // ─── Grid ────────────────────────────────────────────────────────────────────

  function getFilteredProjects() {
    return allProjects.filter(p => {
      const catMatch = activeCategory === 'All' || p.category === activeCategory;
      const tagMatch = !activeTag || (p.tags && p.tags.includes(activeTag));
      return catMatch && tagMatch;
    });
  }

  function renderGrid() {
    const grid = document.getElementById('grid');
    const projects = getFilteredProjects();

    // Animate out
    grid.classList.add('grid-transitioning');

    setTimeout(() => {
      grid.innerHTML = '';

      if (projects.length === 0) {
        grid.innerHTML = `<p class="projects-empty">Aucun projet ne correspond à ce filtre.</p>`;
        grid.classList.remove('grid-transitioning');
        return;
      }

      projects.forEach((project, index) => {
        const card = createProjectCard(project, index);
        grid.appendChild(card);
      });

      grid.classList.remove('grid-transitioning');

      // Re-init scroll animations for dynamically inserted cards
      if (typeof initScrollAnimations === 'function') {
        initScrollAnimations();
      } else {
        // Fallback: observe all cards
        observeCards();
      }
    }, 150);
  }

  // ─── Card ─────────────────────────────────────────────────────────────────────

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    if (month) {
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
    return year;
  }

  function getStatusLabel(status) {
    const labels = {
      'In Progress': 'En cours',
      'Completed': 'Terminé',
      'Archived': 'Archivé',
    };
    return labels[status] || status;
  }

  function createProjectCard(project, index) {
    const card = document.createElement('div');
    const colorIndex = index % CARD_COLORS.length;
    const bgColor = CARD_COLORS[colorIndex];

    // Dark card for every 7th item (like the original)
    const isDark = index % 7 === 6;

    card.className = 'project-card' + (project.featured ? ' large' : '') + (isDark ? ' dark-card' : '');
    card.style.setProperty('--card-bg', isDark ? 'var(--color-dark-grey)' : bgColor);
    card.dataset.projectId = project.id;

    // Build tags HTML (show first 3 tags)
    const visibleTags = (project.tags || []).slice(0, 3);
    const tagsHtml = visibleTags.length > 0
      ? `<div class="card-tags">${visibleTags.map(t => `<span class="card-tag">${t}</span>`).join('')}</div>`
      : '';

    // Date or status display
    const dateDisplay = project.status === 'In Progress'
      ? `<span class="card-status status-progress">En cours</span>`
      : `<span class="card-status">${formatDate(project.date)}</span>`;

    card.innerHTML = `
      <div class="project-header">
        ${dateDisplay}
        <div>
          <h3>${project.category || ''}</h3>
          <h2>${project.title}</h2>
        </div>
      </div>
      ${project.cover
        ? `<div class="project-illustration">
             <img src="${project.cover}" alt="${project.title}" loading="lazy">
           </div>`
        : `<div class="project-illustration project-no-cover">
             <div class="no-cover-placeholder">
               <span>${project.title.charAt(0)}</span>
             </div>
           </div>`
      }
      ${tagsHtml}
    `;

    // Click → page de détail
    card.addEventListener('click', () => {
      window.location.href = `project.html?id=${encodeURIComponent(project.id)}`;
    });

    // Tilt on hover (subtle parallax)
    attachTiltEffect(card);

    return card;
  }

  // ─── Tilt Effect ─────────────────────────────────────────────────────────────

  function attachTiltEffect(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  // ─── Scroll Animations ───────────────────────────────────────────────────────

  function observeCards() {
    const cards = document.querySelectorAll('.project-card:not(.skeleton)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const index = [...card.parentNode.children].indexOf(card);
          card.style.transitionDelay = `${index * 60}ms`;
          card.classList.add('visible');
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.08 });

    cards.forEach(card => {
      card.classList.add('card-hidden');
      observer.observe(card);
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
