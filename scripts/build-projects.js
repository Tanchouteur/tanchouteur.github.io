#!/usr/bin/env node

/**
 * build-projects.js
 * Scanne tous les repos publics de Tanchouteur sur GitHub,
 * récupère les dossiers .portfolio/, télécharge les images,
 * et génère assets/data/projects.json.
 *
 * Utilisation :
 *   GITHUB_TOKEN=ghp_xxx node scripts/build-projects.js
 *   node scripts/build-projects.js --dry-run   (affiche sans écrire)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const GITHUB_USERNAME = 'Tanchouteur';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');
const OUTPUT_JSON = path.join(__dirname, '..', 'assets', 'data', 'projects.json');
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'projects');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'];

const HEADERS = {
  'User-Agent': 'tanchouteur-portfolio-builder/1.0',
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
};

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    const doRequest = (reqUrl) => {
      https.get(reqUrl, { headers: HEADERS }, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.destroy();
          doRequest(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          file.destroy();
          fs.unlink(destPath, () => {});
          reject(new Error(`HTTP ${res.statusCode} downloading ${reqUrl}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    doRequest(url);
  });
}

// ─── GitHub API Helpers ───────────────────────────────────────────────────────

async function listAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated`;
    const data = await fetchJSON(url);
    if (!data || data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return repos;
}

async function getPortfolioFolder(repoName) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/.portfolio`;
  const data = await fetchJSON(url);
  return data; // null if 404, array of files if exists
}

async function getPortfolioJson(repoName, branch) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/.portfolio/portfolio.json`;
  const data = await fetchJSON(url);
  if (!data || !data.content) return null;
  try {
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e) {
    console.warn(`  ⚠ Could not parse portfolio.json for ${repoName}: ${e.message}`);
    return null;
  }
}

// ─── Image handling ───────────────────────────────────────────────────────────

function isImage(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function isCover(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  return base === 'cover';
}

async function downloadPortfolioImages(repoName, files) {
  const repoImagesDir = path.join(IMAGES_DIR, repoName);
  const imageFiles = files.filter(f => f.type === 'file' && isImage(f.name));

  const coverRelPath = null;
  let coverPath = null;
  const screenshotPaths = [];

  for (const file of imageFiles) {
    const destPath = path.join(repoImagesDir, file.name);
    const relPath = `assets/images/projects/${repoName}/${file.name}`;

    if (!DRY_RUN) {
      console.log(`    ↓ Downloading ${file.name}...`);
      try {
        await downloadFile(file.download_url, destPath);
      } catch (e) {
        console.warn(`    ⚠ Failed to download ${file.name}: ${e.message}`);
        continue;
      }
    } else {
      console.log(`    [dry-run] Would download ${file.name} → ${relPath}`);
    }

    if (isCover(file.name)) {
      coverPath = relPath;
    } else {
      screenshotPaths.push(relPath);
    }
  }

  return { cover: coverPath, images: screenshotPaths };
}

// ─── Project builder ──────────────────────────────────────────────────────────

function buildProjectObject(repoData, portfolioJson, imagePaths) {
  const repo = repoData;

  // Fallback values from repo metadata
  const fallbackDate = repo.created_at ? repo.created_at.substring(0, 7) : null;
  const fallbackTags = [
    ...(repo.topics || []),
    ...(repo.language ? [repo.language] : []),
  ];
  const fallbackLink = repo.html_url;

  // Merge portfolio.json over repo defaults
  return {
    id: repo.name,
    title: portfolioJson.title || repo.name,
    description: portfolioJson.description || repo.description || '',
    longDescription: portfolioJson.longDescription || '',
    category: portfolioJson.category || 'Personal',
    status: portfolioJson.status || 'Completed',
    date: portfolioJson.date || fallbackDate,
    tags: portfolioJson.tags && portfolioJson.tags.length > 0
      ? portfolioJson.tags
      : fallbackTags,
    featured: portfolioJson.featured || false,
    order: portfolioJson.order !== undefined ? portfolioJson.order : 999,
    cover: imagePaths.cover || null,
    images: imagePaths.images || [],
    links: {
      github: fallbackLink,
      ...(portfolioJson.links || {}),
    },
    repoData: {
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || null,
      updatedAt: repo.pushed_at || repo.updated_at,
      createdAt: repo.created_at,
    },
  };
}

// ─── Cleanup removed projects ─────────────────────────────────────────────────

function cleanupRemovedProjects(currentProjectIds) {
  if (!fs.existsSync(IMAGES_DIR)) return;
  const existingDirs = fs.readdirSync(IMAGES_DIR);
  for (const dir of existingDirs) {
    if (!currentProjectIds.has(dir)) {
      const dirPath = path.join(IMAGES_DIR, dir);
      console.log(`  🗑 Removing images for deleted project: ${dir}`);
      if (!DRY_RUN) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Portfolio Builder — ${DRY_RUN ? 'DRY RUN' : 'BUILD'}`);
  console.log(`   User: ${GITHUB_USERNAME}`);
  console.log(`   Auth: ${GITHUB_TOKEN ? '✅ Authenticated' : '⚠ Unauthenticated (60 req/h limit)'}`);
  console.log('─'.repeat(50));

  // 1. List all repos
  console.log('\n📦 Fetching repository list...');
  const repos = await listAllRepos();
  console.log(`   Found ${repos.length} public repositories`);

  // 2. For each repo, check for .portfolio/
  const projects = [];
  const foundProjectIds = new Set();

  for (const repo of repos) {
    // Skip the portfolio repo itself
    if (repo.name === 'tanchouteur.github.io') continue;
    if (repo.archived) continue;

    process.stdout.write(`\n  📁 ${repo.name} `);

    // Check for .portfolio/ folder
    const portfolioFolder = await getPortfolioFolder(repo.name);
    if (!portfolioFolder || !Array.isArray(portfolioFolder)) {
      process.stdout.write('→ no .portfolio/\n');
      continue;
    }

    // Check for portfolio.json
    const portfolioJson = await getPortfolioJson(repo.name);
    if (!portfolioJson) {
      process.stdout.write('→ .portfolio/ found but no valid portfolio.json\n');
      continue;
    }

    process.stdout.write(`→ ✅ "${portfolioJson.title || repo.name}"\n`);

    // Download images
    const imagePaths = await downloadPortfolioImages(repo.name, portfolioFolder);

    // Build project object
    const project = buildProjectObject(repo, portfolioJson, imagePaths);
    projects.push(project);
    foundProjectIds.add(repo.name);
  }

  // 3. Sort projects: by order first, then by date (newest first)
  projects.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  // 4. Cleanup images for removed projects
  console.log('\n🧹 Cleaning up removed projects...');
  cleanupRemovedProjects(foundProjectIds);

  // 5. Write output JSON
  console.log('\n📄 Writing projects.json...');
  console.log(`   → ${projects.length} projects found`);

  if (!DRY_RUN) {
    const dataDir = path.dirname(OUTPUT_JSON);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(projects, null, 2), 'utf-8');
    console.log(`   ✅ Written to ${OUTPUT_JSON}`);
  } else {
    console.log('\n[dry-run] Output JSON:');
    console.log(JSON.stringify(projects, null, 2));
  }

  console.log('\n✅ Build complete!\n');
}

main().catch(err => {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
});
