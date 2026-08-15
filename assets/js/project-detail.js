// assets/js/project-detail.js
// Page de détail d'un projet — lit l'id dans l'URL, charge projects.json, affiche tout

(function () {
  'use strict';

  // Marked.js est utilisé pour le rendu Markdown de longDescription
  // Il sera chargé depuis le CDN dans project.html

  // ─── State lightbox ──────────────────────────────────────────────────────────

  let lightboxImages = [];
  let lightboxIndex = 0;

  // ─── Init ────────────────────────────────────────────────────────────────────

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
      showError('Aucun projet spécifié.');
      return;
    }

    try {
      const res = await fetch('assets/data/projects.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const projects = await res.json();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        showError(`Projet "${projectId}" introuvable.`);
        return;
      }

      renderProject(project);
    } catch (err) {
      console.error('project-detail:', err);
      showError('Impossible de charger les données du projet.');
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    if (month) {
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return year;
  }

  function renderProject(project) {
    // Update page title & meta
    document.title = `${project.title} — Louis Tanchou`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', project.description);

    // Cover hero
    const hero = document.getElementById('project-hero');
    if (hero) {
      if (project.cover) {
        hero.style.backgroundImage = `url('${project.cover}')`;
        hero.classList.add('has-cover');
      } else {
        hero.classList.add('no-cover');
        hero.innerHTML = `<div class="hero-placeholder"><span>${project.title.charAt(0)}</span></div>`;
      }
    }

    // Title & meta
    setText('project-title', project.title);
    setText('project-category', project.category || '');
    setText('project-date', formatDate(project.date));

    // Status badge
    const statusEl = document.getElementById('project-status');
    if (statusEl) {
      statusEl.textContent = project.status || '';
      statusEl.className = 'project-status-badge status-' + (project.status || '').toLowerCase().replace(/\s+/g, '-');
    }

    // Description
    setText('project-description', project.description);

    // Long description (Markdown → HTML)
    const longDescEl = document.getElementById('project-long-description');
    if (longDescEl && project.longDescription) {
      if (window.marked) {
        longDescEl.innerHTML = window.marked.parse(project.longDescription);
      } else {
        // Fallback: simple paragraph
        longDescEl.innerHTML = project.longDescription
          .split('\n\n')
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
      }
      longDescEl.style.display = '';
    } else if (longDescEl) {
      longDescEl.style.display = 'none';
    }

    // Tags
    const tagsEl = document.getElementById('project-tags');
    if (tagsEl && project.tags && project.tags.length > 0) {
      tagsEl.innerHTML = project.tags
        .map(tag => `<span class="detail-tag">${tag}</span>`)
        .join('');
    } else if (tagsEl) {
      tagsEl.style.display = 'none';
    }

    // Repo stats
    const statsEl = document.getElementById('project-stats');
    if (statsEl && project.repoData) {
      const rd = project.repoData;
      const stats = [];
      if (rd.stars > 0) stats.push(`⭐ ${rd.stars} star${rd.stars > 1 ? 's' : ''}`);
      if (rd.forks > 0) stats.push(`🍴 ${rd.forks}`);
      if (rd.language) stats.push(`📦 ${rd.language}`);
      if (rd.updatedAt) {
        const updated = new Date(rd.updatedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        stats.push(`🕐 Mis à jour ${updated}`);
      }
      statsEl.textContent = stats.join(' · ');
    }

    // Links
    renderLinks(project);

    // Gallery
    renderGallery(project);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderLinks(project) {
    const linksEl = document.getElementById('project-links');
    if (!linksEl || !project.links) return;

    const linkItems = Object.entries(project.links)
      .filter(([, url]) => url)
      .map(([type, url]) => {
        const labels = {
          github: '⬡ GitHub',
          demo: '↗ Demo',
          docs: '📄 Docs',
          website: '🌐 Website',
        };
        const label = labels[type] || type;
        return `<a href="${url}" target="_blank" rel="noopener" class="project-link-btn project-link-${type}" id="link-${type}">${label}</a>`;
      });

    linksEl.innerHTML = linkItems.join('');
  }

  function renderGallery(project) {
    const galleryEl = document.getElementById('project-gallery');
    const gallerySection = document.getElementById('gallery-section');

    if (!galleryEl) return;

    const allImages = [];
    if (project.cover) allImages.push(project.cover);
    allImages.push(...(project.images || []));

    const screenshots = project.images || [];

    if (screenshots.length === 0) {
      if (gallerySection) gallerySection.style.display = 'none';
      return;
    }

    lightboxImages = allImages;

    galleryEl.innerHTML = screenshots.map((img, idx) => `
      <div class="gallery-item" 
           id="gallery-item-${idx}"
           data-index="${project.cover ? idx + 1 : idx}"
           tabindex="0"
           role="button"
           aria-label="Voir screenshot ${idx + 1}">
        <img src="${img}" alt="Screenshot ${idx + 1}" loading="lazy">
        <div class="gallery-overlay">
          <span class="gallery-zoom-icon">⤢</span>
        </div>
      </div>
    `).join('');

    // Attach click handlers
    galleryEl.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        openLightbox(parseInt(item.dataset.index));
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openLightbox(parseInt(item.dataset.index));
        }
      });
    });
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────────

  function openLightbox(index) {
    lightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    updateLightboxImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Keyboard navigation
    document.addEventListener('keydown', handleLightboxKey);
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleLightboxKey);
  }

  function updateLightboxImage() {
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    if (img) img.src = lightboxImages[lightboxIndex];
    if (counter) counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
  }

  function handleLightboxKey(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
  }

  function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
  }

  // ─── Error ───────────────────────────────────────────────────────────────────

  function showError(message) {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <section style="padding: 6rem 2rem; text-align: center;">
          <h2>😕 ${message}</h2>
          <p><a href="/" style="text-decoration: underline">← Retour au portfolio</a></p>
        </section>
      `;
    }
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────────

  window.__closeLightbox = closeLightbox;
  window.__navigateLightbox = navigateLightbox;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
