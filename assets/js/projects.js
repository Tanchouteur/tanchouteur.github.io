// assets/js/projects.js
// Moteur de rendu dynamique et moderne de la grille de projets

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────
  let allProjects = [];
  let activeCategory = 'All';

  // ─── Initialisation ──────────────────────────────────────────────────────────
  async function init() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    renderSkeletons(grid, 4);

    try {
      let res = await fetch('assets/data/projects.json');
      if (!res.ok) res = await fetch('/assets/data/projects.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProjects = await res.json();
    } catch (err) {
      console.error('Portfolio: could not load projects.json', err);
      grid.innerHTML = `
        <div class="projects-error-box">
          <p class="projects-error-title">Impossible de charger les projets pour le moment.</p>
          <p class="projects-error-subtitle">Vérifiez votre connexion ou réessayez dans quelques instants.</p>
        </div>
      `;
      return;
    }

    renderFilters();
    renderGrid();
  }

  // ─── Skeleton Loading ────────────────────────────────────────────────────────
  function renderSkeletons(grid, count) {
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'project-card skeleton';
      card.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-body">
          <div class="skeleton-meta">
            <div class="skeleton-pill short"></div>
            <div class="skeleton-pill tiny"></div>
          </div>
          <div class="skeleton-line title"></div>
          <div class="skeleton-line desc"></div>
          <div class="skeleton-line desc-short"></div>
          <div class="skeleton-tags">
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  // ─── Filtres (Segmented Control) ─────────────────────────────────────────────
  function renderFilters() {
    const container = document.getElementById('project-filters-container');
    if (!container) return;

    // Compter les projets par catégorie
    const counts = {
      All: allProjects.length,
      Personal: allProjects.filter(p => p.category === 'Personal').length,
      Academic: allProjects.filter(p => p.category === 'Academic').length,
    };

    const categories = [
      { key: 'All', label: 'Tous', count: counts.All },
      { key: 'Personal', label: 'Personnels', count: counts.Personal },
      { key: 'Academic', label: 'Académiques', count: counts.Academic },
    ].filter(cat => cat.key === 'All' || cat.count > 0);

    // Si on a qu'une seule catégorie ou aucun projet, pas besoin de filtres complexes
    if (categories.length <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="filter-segmented-control" role="tablist" aria-label="Filtrer les projets">
        ${categories.map(cat => `
          <button class="filter-tab ${cat.key === activeCategory ? 'active' : ''}" 
                  data-category="${cat.key}"
                  role="tab"
                  aria-selected="${cat.key === activeCategory}">
            <span>${cat.label}</span>
            <span class="filter-count">${cat.count}</span>
          </button>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category;
        if (activeCategory === cat) return;
        activeCategory = cat;

        container.querySelectorAll('.filter-tab').forEach(b => {
          const isActive = b.dataset.category === activeCategory;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive);
        });

        renderGrid();
      });
    });
  }

  // ─── Rendu Grille ────────────────────────────────────────────────────────────
  function getFilteredProjects() {
    if (activeCategory === 'All') return allProjects;
    return allProjects.filter(p => p.category === activeCategory);
  }

  function renderGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    const projects = getFilteredProjects();

    grid.classList.add('grid-fading');

    setTimeout(() => {
      grid.innerHTML = '';

      if (projects.length === 0) {
        grid.innerHTML = `
          <div class="projects-empty-state">
            <span class="empty-icon">📂</span>
            <h3>Aucun projet dans cette catégorie</h3>
            <p>Revenez bientôt pour découvrir de nouvelles réalisations !</p>
          </div>
        `;
        grid.classList.remove('grid-fading');
        return;
      }

      projects.forEach((project, index) => {
        const card = createProjectCard(project, index);
        grid.appendChild(card);
      });

      grid.classList.remove('grid-fading');
      observeCards();
    }, 120);
  }

  // ─── Format Date ─────────────────────────────────────────────────────────────
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

  // ─── Construction Carte Projet ───────────────────────────────────────────────
  function createProjectCard(project, index) {
    const card = document.createElement('article');
    card.className = 'modern-project-card';
    card.dataset.projectId = project.id;

    // Statut
    const isInProgress = project.status === 'In Progress';
    const statusHtml = isInProgress
      ? `<span class="card-status-badge status-progress"><span class="status-dot"></span>En cours</span>`
      : `<span class="card-status-badge status-completed">${formatDate(project.date) || 'Terminé'}</span>`;

    // Catégorie
    const categoryLabel = project.category === 'Academic' ? 'Académique' : (project.category === 'Personal' ? 'Personnel' : (project.category || 'Projet'));
    const categoryHtml = `<span class="card-category-badge">${categoryLabel}</span>`;

    // Illustration Cover
    const coverHtml = project.cover
      ? `<div class="card-media">
           <img src="${project.cover}" alt="${project.title}" loading="lazy" class="card-cover-img">
           <div class="card-media-overlay"></div>
         </div>`
      : `<div class="card-media card-media-placeholder">
           <div class="placeholder-monogram">${project.title.charAt(0)}</div>
         </div>`;

    // Tags (limité à 4 pour garder la carte propre)
    const visibleTags = (project.tags || []).slice(0, 4);
    const tagsHtml = visibleTags.length > 0
      ? `<div class="card-tech-stack">
           ${visibleTags.map(tag => `<span class="tech-chip">${tag}</span>`).join('')}
           ${(project.tags || []).length > 4 ? `<span class="tech-chip tech-chip-more">+${project.tags.length - 4}</span>` : ''}
         </div>`
      : '';

    // Liens
    const githubLink = project.links && project.links.github ? project.links.github : `https://github.com/Tanchouteur/${project.id}`;

    card.innerHTML = `
      <div class="card-media-wrapper">
        ${coverHtml}
        <div class="card-badges-floating">
          ${statusHtml}
          ${categoryHtml}
        </div>
      </div>

      <div class="card-content">
        <div class="card-header">
          <h3 class="card-title">
            <span>${project.title}</span>
            <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </h3>
        </div>

        <p class="card-description">${project.description || 'Projet open source développé par Louis Tanchou.'}</p>

        ${tagsHtml}

        <div class="card-footer">
          <a href="project.html?id=${encodeURIComponent(project.id)}" class="card-btn card-btn-primary" aria-label="Voir les détails de ${project.title}">
            <span>Voir le projet</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          ${githubLink ? `
            <a href="${githubLink}" target="_blank" rel="noopener" class="card-btn card-btn-ghost" aria-label="Code source GitHub de ${project.title}" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          ` : ''}
        </div>
      </div>
    `;

    // Clic sur toute la carte ouvre les détails
    card.addEventListener('click', (e) => {
      // Si l'utilisateur clique directement sur un lien <a> avec un onclick, laisser faire
      if (e.target.closest('a') && e.target.closest('a').getAttribute('target') === '_blank') {
        return;
      }
      window.location.href = `project.html?id=${encodeURIComponent(project.id)}`;
    });

    attachTiltEffect(card);
    return card;
  }

  // ─── Effet Parallaxe 3D Subtil ───────────────────────────────────────────────
  function attachTiltEffect(card) {
    // Désactiver l'effet sur mobile tactile pour la fluidité
    if (window.matchMedia('(hover: none)').matches) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  // ─── Animations d'apparition ─────────────────────────────────────────────────
  function observeCards() {
    const cards = document.querySelectorAll('.modern-project-card:not(.skeleton)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          card.classList.add('visible');
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.05 });

    cards.forEach((card, idx) => {
      card.style.animationDelay = `${idx * 80}ms`;
      observer.observe(card);
    });
  }

  // ─── Lancement ───────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
