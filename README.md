# Jeremiah Fallin | Portfolio & Movie Ratings Engine

This repository contains the source code for the personal developer portfolio website of Jeremiah Fallin. The application showcases engineering and interface design works, TV show reviews, and features a machine learning-backed movie watch history and rating engine.

---

## 🌟 Key Features

### 🎬 1. Movie Watch History & Ranking Engine
* **Bradley-Terry Probability Model:** Quantifies movie comparison preferences using a custom mathematical model implemented with a **TensorFlow.js** backend.
* **Temporal Decay:** Integrates exponential decay ($e^{-\lambda T}$) to prioritize recent watch history reviews and decay the weight of older reviews over time.
* **Transitive Preference Discounting:** Performs Floyd-Warshall closure steps to infer transitive comparisons, applying a discount factor ($\gamma = 0.5$) to reduce the statistical weight of indirect matches.
* **Preference Loop Detection:** Detects and displays circular contradictions (e.g. loops where movie A > B, B > C, and C > A) to uncover inconsistencies in ratings.
* **Build-Time Prerendering:** Executes rating algorithms during build time via a calculation script, outputting scores and cycles as a static JSON asset served by a Next.js API route.

### 🎨 2. Premium UI/UX Design System
* **Centered Glassmorphic Layouts:** Centered main layouts built with Radix UI Themes and styled with floating glassmorphic navbars, translucent elements, background mesh gradients, and smooth hover micro-animations.
* **Badged Table Data:** Fully sortable and searchable watch history table (using `@tanstack/react-table` and custom color-coded indicators for scores, view counts, and comparison checks).
* **Interactive 2D Force Graph:** Renders comparative movie preference networks as interactive 2D node graphs (using `react-force-graph-2d`) styled with custom glassmorphic legends and detail panels.
* **Offline-Safe Typography:** Declares Google Sans fallbacks with Next.js's local Geist Sans font loader, avoiding external network requests during dev server start and ensuring instant offline builds.

---

## 🛠️ Technology Stack
* **Framework:** Next.js (App Router, MDX content pages)
* **Logic/Math Engine:** TensorFlow.js, TypeScript
* **UI & Styling:** Radix UI Themes, Vanilla CSS
* **Table Components:** TanStack Table v8
* **Graph Components:** React Force Graph 2D
* **E2E Testing:** Playwright

---

## 🚀 Getting Started

### Installation
Clone the repository and install the project dependencies:
```bash
npm install
```

### Run Development Server
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build Production Bundle
Build and compile the application for production (this automatically updates and outputs static movie rankings to `src/data/calculated-ratings.json` first):
```bash
npm run build
```

---

## 🧪 Testing

The repository contains a full Playwright End-to-End (E2E) test suite to verify navigation flows, API schemas, and interactive table sorting/filtering features.

To run tests headlessly:
```bash
npm run test:e2e
```

To run tests in the Playwright UI mode:
```bash
npm run test:e2e:ui
```

To view the generated HTML test reports:
```bash
npm run test:e2e:report
```

---

## 📁 Project Structure

```
├── content/              # MDX files containing posts (movies, shows, projects)
├── media/                # Backdrop images and media assets
├── scripts/              # Build-time rating calculation scripts
├── src/
│   ├── app/              # Next.js App Router pages and layout assets
│   ├── components/       # Custom React components (table, graph, layouts)
│   ├── data/             # Static json records and pre-calculated ratings
│   └── utils/            # Bradley-Terry ratings algorithm logic
└── tests/                # Playwright E2E spec files
```
