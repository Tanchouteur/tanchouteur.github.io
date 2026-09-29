// English copy is kept outside projects.json because that file is regenerated from GitHub.
// Add an entry when a new project is published; the fallback below never shows French prose.
export const PROJECTS_EN = {
  CliOS: {
    description: 'A modular Python/PySide6 car dashboard for the Renault Clio 3, bringing together CAN/OBD telemetry, trip statistics and embedded services.',
    longDescription: `# CliOS — A modular car dashboard

CliOS explores how to give an older car a modern, adaptable interface. The application is built with Python and PySide6 for an in-car display. It brings together vehicle data, trip information and useful services in a single interface.

## Engineering focus

The project connects software, embedded hardware and interface design. CAN/OBD data is treated as a source for telemetry and trip statistics, while a modular architecture keeps the interface open to new features. The result is an ongoing exploration of reliable, readable information in a vehicle environment.`,
  },
  'Lapins-du-Gapeau': {
    description: 'A fast local business and e-commerce website for a family rabbit breeder in southern France, built with Astro, Decap CMS and Cloudflare.',
    longDescription: `# Lapins du Gapeau — A site a small business can manage

I built a public website for a family rabbit breeder in the Var region of France. The aim was to present the business clearly, support local discovery and let the owners manage content themselves.

## Implementation

Astro keeps pages fast and easy to navigate. Decap CMS gives the team a practical way to update content without editing code, while Cloudflare supports delivery. The project also includes local search optimization and commerce-oriented content. The emphasis was on a useful site that remains maintainable after launch.`,
  },
  SpotifySort: {
    description: 'Sort Spotify playlists automatically with Google Gemini AI. Each user supplies their own keys and classification rules.',
    longDescription: `# SpotiSort v4 — Playlist organization with AI

SpotiSort helps users reorganize their Spotify playlists according to rules they choose. It combines Spotify data with Google Gemini AI to classify tracks and produce a more useful playlist structure.

## User control

Each user configures their own API keys and classification rules. This keeps the sorting behavior explicit and lets people adapt the tool to their music rather than accepting one fixed set of categories.`,
  },
  RigFarm: {
    description: 'A central platform for monitoring and controlling a GPU farm, with live telemetry, Vast.ai orchestration, power control and automated pricing.',
    longDescription: `# RigFarm — GPU farm operations

RigFarm brings several operational tasks into one platform: monitoring GPU rigs, managing availability on Vast.ai, controlling power and adjusting pricing.

## Scope

The platform gathers live telemetry so operators can see machine state and act on it. It also connects orchestration and energy control to the same workflow. Automated pricing helps align available capacity with market conditions. The project combines software operations with the physical constraints of a GPU installation.`,
  },
  CPUs: {
    title: 'Processor Architecture & 8-bit ALU',
    description: 'Modular design and simulation of a processor and 8-bit ALU in Logisim, exploring logic circuits, instruction sets and hardware fundamentals.',
    longDescription: `# Processor architecture and 8-bit ALU

This Logisim project explores computation from logic gates upward. I designed an 8-bit arithmetic logic unit with arithmetic and bitwise operations, then developed a processor architecture around registers, control logic and an instruction set.

## What it covers

The ALU handles addition, subtraction, multiplication, division and logical operations, with status flags for conditions such as zero, overflow and carry. The processor design explores the data path, register file, instruction decoding and conditional jumps. Working at gate level gave me a clearer view of how architectural decisions affect software behavior and performance.`,
  },
  'MenuD-laSemaine': {
    title: 'Weekly Meal Planner',
    description: 'A mobile-first web app for planning 14 family meals each week, with deterministic constraint-based generation and a synchronized shopping list.',
    longDescription: `# Weekly Meal Planner — Family meals and shopping

This mobile-first application helps a household plan seven lunches and seven dinners each week. It began as a personal prototype and was rebuilt as a typed web application around a deterministic meal-planning engine.

## Features

The planner accounts for seasonality, weekday constraints, preferences and recent meals. Users can lock chosen meals, regenerate the others and see explained alternatives. A shopping list adjusts quantities to the number of diners and retains checked items. Confirmed plans can be reused, and an iCalendar feed brings menus into shared calendars.

## Architecture

The interface uses Next.js and React. PostgreSQL and Prisma store the catalogue and plans, while the generation engine is designed as testable application logic. Docker and Coolify support deployment.`,
  },
  'BUT2-SAE-DorfRomantik': {
    title: 'Dorfjavatik',
    description: 'A hexagonal strategy and puzzle game inspired by Dorfromantik, built in plain Java with Swing/Graphics2D, procedural generation, graph algorithms and MariaDB rankings.',
    longDescription: `# Dorfjavatik — A hexagonal strategy game in Java

Built by a team of three for a computer science university project, Dorfjavatik is a landscape-building puzzle game inspired by Dorfromantik. We used the standard Java toolkit, Swing and Graphics2D, without a game engine.

## Game systems

Players place hexagonal tiles to connect matching terrain. Connected regions form groups whose scores grow with their size. Seeded tile generation makes sessions reproducible. Undo requires a graph traversal because removing a tile can split one region into several components.

## Implementation

The project follows an MVC structure. It includes vector rendering, camera movement, animation, audio and MariaDB-backed rankings, with an offline fallback when the database is unavailable.`,
  },
};

const CAPTIONS_EN = {
  CliOS: { 'cover.jpg': 'CliOS main interface inside the car', 'apex-3.jpg': 'Driving and telemetry view', 'atelier_luxe.jpg': 'Automotive interface prototype' },
  'Lapins-du-Gapeau': { 'cover.png': 'Lapins du Gapeau home page', 'screenshot-home.png': 'Introduction to the rabbitry', 'screenshot-portees.png': 'Available litters' },
  SpotifySort: { 'cover.png': 'SpotiSort main screen', 'Home1.png': 'Spotify sign-in and home page', 'Trie1.png': 'Automatic sorting settings' },
  RigFarm: { 'cover.jpg': 'GPU farm overview', 'vue-systeme.jpg': 'System monitoring', 'vue-electricite.jpg': 'Power consumption monitoring' },
};

export function inEnglish(projects) {
  const englishTags = { Algorithmique: 'Algorithms', 'Théorie des Graphes': 'Graph Theory', 'Architecture MVC': 'MVC Architecture' };
  return projects.map((project) => ({
    ...project,
    title: PROJECTS_EN[project.id]?.title || project.title,
    description: PROJECTS_EN[project.id]?.description || 'English project description coming soon.',
    longDescription: PROJECTS_EN[project.id]?.longDescription || '',
    tags: project.tags.map((tag) => englishTags[tag] || tag),
    presentation: {
      ...project.presentation,
      captions: CAPTIONS_EN[project.id] || {},
    },
  }));
}
