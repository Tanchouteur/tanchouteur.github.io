#!/usr/bin/env node

/**
 * build-projects.js
 * Scanne tous les repos (publics et privés si PORTFOLIO_GITHUB_TOKEN est fourni) de Tanchouteur sur GitHub,
 * récupère les dossiers .portfolio/, télécharge les images,
 * et génère assets/data/projects.json.
 *
 * Utilisation :
 *   GITHUB_TOKEN=ghp_xxx node scripts/build-projects.js
 *   node scripts/build-projects.js --dry-run
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// ─── Configuration ────────────────────────────────────────────────────────────

const GITHUB_USERNAME = "Tanchouteur";
const GITHUB_TOKEN =
  process.env.PORTFOLIO_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
const DRY_RUN = process.argv.includes("--dry-run");
const OUTPUT_JSON = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "projects.json",
);
const IMAGES_DIR = path.join(__dirname, "..", "assets", "images", "Projects");
const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
];

function getHeaders(targetUrl, customAccept = "application/vnd.github+json") {
  const urlObj = new URL(targetUrl);
  const isGitHubApi = urlObj.hostname === "api.github.com";
  const isRawGitHub = urlObj.hostname === "raw.githubusercontent.com";

  const headers = {
    "User-Agent": "tanchouteur-portfolio-builder/2.0",
  };

  if (isGitHubApi) {
    headers["Accept"] = customAccept;
    headers["X-GitHub-Api-Version"] = "2022-11-28";
  }

  // Send token only to GitHub domains, never to external AWS S3 redirects
  if (GITHUB_TOKEN && (isGitHubApi || isRawGitHub)) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const headers = getHeaders(url, "application/vnd.github+json");
    https
      .get(url, { headers }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 404) {
            resolve(null);
            return;
          }
          if (res.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${res.statusCode} for ${url}: ${data.substring(0, 100)}`,
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error for ${url}: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);

    const doRequest = (reqUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        file.destroy();
        fs.unlink(destPath, () => {});
        reject(new Error(`Too many redirects downloading ${reqUrl}`));
        return;
      }

      const urlObj = new URL(reqUrl);
      const client = urlObj.protocol === "https:" ? https : http;
      const headers = getHeaders(reqUrl, "application/vnd.github.raw");

      client
        .get(reqUrl, { headers }, (res) => {
          // Handle 301, 302, 307, 308 redirects (GitHub API redirects to AWS S3 pre-signed URLs)
          if (
            [301, 302, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            const nextUrl = new URL(res.headers.location, reqUrl).toString();
            doRequest(nextUrl, redirectCount + 1);
            return;
          }

          if (res.statusCode !== 200) {
            file.destroy();
            fs.unlink(destPath, () => {});
            reject(new Error(`HTTP ${res.statusCode} downloading ${reqUrl}`));
            return;
          }

          res.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        })
        .on("error", (err) => {
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
    // If token is provided, use /user/repos to get both public and private repositories
    const url = GITHUB_TOKEN
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner&visibility=all`
      : `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated`;

    const data = await fetchJSON(url);
    if (!data || !Array.isArray(data) || data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return repos;
}

async function getPortfolioFolder(owner, repoName) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/.portfolio`;
  const data = await fetchJSON(url);
  return data; // null if 404, array of file objects if exists
}

async function getPortfolioJson(owner, repoName) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/.portfolio/portfolio.json`;
  const data = await fetchJSON(url);
  if (!data || !data.content) return null;
  try {
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (e) {
    console.warn(
      `  ⚠ Could not parse portfolio.json for ${repoName}: ${e.message}`,
    );
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
  return base === "cover";
}

async function downloadPortfolioImages(
  owner,
  repoName,
  files,
  { dryRun = DRY_RUN } = {},
) {
  const repoImagesDir = path.join(IMAGES_DIR, repoName);
  const imageFiles = files.filter((f) => f.type === "file" && isImage(f.name));

  let coverPath = null;
  const screenshotPaths = [];

  for (const file of imageFiles) {
    const destPath = path.join(repoImagesDir, file.name);
    const relPath = `assets/images/Projects/${repoName}/${file.name}`;

    // Prefer file.url (GitHub API endpoint which supports private repos via raw Accept header)
    const downloadUrl = file.url || file.download_url;

    if (!dryRun) {
      console.log(`    ↓ Downloading ${file.name}...`);
      try {
        await downloadFile(downloadUrl, destPath);
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

async function buildProjectObject(repoData, portfolioJson, imagePaths) {
  const { normalizePresentation } = await import("../lib/portfolio.mjs");
  const repo = repoData;

  // Fallback values from repo metadata
  const fallbackDate = repo.created_at ? repo.created_at.substring(0, 7) : null;
  const fallbackTags = [
    ...(repo.topics || []),
    ...(repo.language ? [repo.language] : []),
  ];
  const fallbackLink = repo.html_url;

  return {
    id: repo.name,
    title: portfolioJson.title || repo.name,
    description: portfolioJson.description || repo.description || "",
    longDescription: portfolioJson.longDescription || "",
    category: portfolioJson.category || "Personal",
    status: portfolioJson.status || "Completed",
    date:
      typeof portfolioJson.date === "string"
        ? portfolioJson.date
        : fallbackDate,
    tags:
      Array.isArray(portfolioJson.tags) && portfolioJson.tags.length > 0
        ? portfolioJson.tags.filter((tag) => typeof tag === "string")
        : fallbackTags,
    featured: portfolioJson.featured === true,
    presentation: normalizePresentation(portfolioJson.presentation),
    order:
      typeof portfolioJson.order === "number" &&
      Number.isFinite(portfolioJson.order)
        ? portfolioJson.order
        : 999,
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
      isPrivate: repo.private || false,
      updatedAt: repo.pushed_at || repo.updated_at,
      createdAt: repo.created_at,
    },
  };
}

// ─── Cleanup removed projects ─────────────────────────────────────────────────

function cleanupRemovedProjects(
  currentProjectIds,
  imagesDir = IMAGES_DIR,
  dryRun = DRY_RUN,
) {
  if (!fs.existsSync(imagesDir)) return;
  const existingDirs = fs.readdirSync(imagesDir);
  for (const dir of existingDirs) {
    if (!currentProjectIds.has(dir)) {
      const dirPath = path.join(imagesDir, dir);
      console.log(`  🗑 Removing images for deleted project: ${dir}`);
      if (!dryRun) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(options = {}) {
  const logger = options.logger || console;
  const dryRun = options.dryRun ?? DRY_RUN;
  const outputJson = options.outputJson || OUTPUT_JSON;
  const imagesDir = options.imagesDir || IMAGES_DIR;
  const api = {
    listAllRepos,
    getPortfolioFolder,
    getPortfolioJson,
    downloadPortfolioImages,
    ...options.api,
  };
  logger.log(`\n🔍 Portfolio Builder — ${dryRun ? "DRY RUN" : "BUILD"}`);
  logger.log(`   Target user: ${GITHUB_USERNAME}`);
  logger.log(
    `   Authentication: ${GITHUB_TOKEN ? "✅ Authenticated (Private + Public repos enabled)" : "⚠ Unauthenticated (Public repos only, 60 req/h)"}`,
  );
  logger.log("─".repeat(50));

  // 1. List all repos
  logger.log("\n📦 Fetching repository list...");
  const repos = await api.listAllRepos();
  logger.log(`   Found ${repos.length} repositories`);

  // 2. Check each repo for .portfolio/
  const projects = [];
  const foundProjectIds = new Set();

  for (const repo of repos) {
    if (repo.name === "tanchouteur.github.io") continue;
    if (repo.archived) continue;

    const owner = (repo.owner && repo.owner.login) || GITHUB_USERNAME;
    const privacyLabel = repo.private ? "🔒 private" : "🌍 public";
    logger.log(`\n  📁 ${repo.name} (${privacyLabel}) `);

    // Check for .portfolio/ folder
    const portfolioFolder = await api.getPortfolioFolder(owner, repo.name);
    if (!portfolioFolder || !Array.isArray(portfolioFolder)) {
      logger.log("→ no .portfolio/\n");
      continue;
    }

    // Check for portfolio.json
    const portfolioJson = await api.getPortfolioJson(owner, repo.name);
    if (!portfolioJson) {
      logger.log("→ .portfolio/ found but no valid portfolio.json\n");
      continue;
    }

    logger.log(`→ ✅ "${portfolioJson.title || repo.name}"\n`);

    // Download images (supports both public and private repository files)
    const imagePaths = await api.downloadPortfolioImages(
      owner,
      repo.name,
      portfolioFolder,
      { dryRun },
    );

    // Build project object
    const project = await buildProjectObject(repo, portfolioJson, imagePaths);
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
  logger.log("\n🧹 Cleaning up removed projects...");
  cleanupRemovedProjects(foundProjectIds, imagesDir, dryRun);

  // 5. Write output JSON
  logger.log("\n📄 Writing projects.json...");
  logger.log(`   → ${projects.length} project(s) ready for portfolio`);

  if (!dryRun) {
    const dataDir = path.dirname(outputJson);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputJson, JSON.stringify(projects, null, 2), "utf-8");
    logger.log(`   ✅ Written to ${outputJson}`);
  } else {
    logger.log("\n[dry-run] Output JSON:");
    logger.log(JSON.stringify(projects, null, 2));
  }

  logger.log("\n✅ Build complete!\n");
  return projects;
}

module.exports = { buildProjectObject, main, isCover, isImage };
if (require.main === module)
  main().catch((err) => {
    console.error("\n❌ Build failed:", err.message);
    process.exitCode = 1;
  });
