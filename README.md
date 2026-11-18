# Jeremiah Fallin | Portfolio & Movie Ratings Engine

This repository contains the source code for the personal developer portfolio website of Jeremiah Fallin. The application showcases engineering and interface design works, TV show reviews, and features a machine learning-backed movie watch history and rating engine.

---

## 🌟 Key Features

### 🎬 1. Movie Watch History & Ranking Engine
* **Bradley-Terry Probability Model:** Quantifies movie comparison preferences using a custom mathematical model implemented with a **TensorFlow.js** backend.
* **Evidence-Based Uncertainty:** Reports a plausible range for every rating from a Laplace approximation, so thinly compared films show wider ranges than heavily compared ones.
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

### Add new watches from Plex
New movie watches can come from your Plex server instead of being typed into `src/movie-watch-history.json` by hand. Plex supplies what you watched and when; you still answer the one question each watch needs (was it better than the film before it?) on a local review page.

1. Add your server's address and token to `.env`:
   ```
   PLEX_URL=http://192.168.1.20:32400
   PLEX_TOKEN=your-plex-token
   ```
   To find the token, open any movie in Plex Web, choose **Get Info → View XML**, and copy the `X-Plex-Token` value from the address bar. If other people use your server, also set `PLEX_ACCOUNT_ID` to your account (the server owner is usually `1`). Posters for films new to the site come from TMDB when `TMDB_READ_ACCESS_TOKEN` is set.
2. Fetch the watches made since the last entry in the history:
   ```bash
   npm run sync:plex
   ```
   Add `-- --dry-run` to list them without saving. They wait in `.plex-queue.json`, which is not committed.
3. Start `npm run dev` and open [http://localhost:3000/review](http://localhost:3000/review). Answer each watch in order: **Better**, **Worse**, **Can't compare**, or **Not a real watch**. You can fix the title before answering so a rewatch matches how you named the film before, and **Undo** reverses the last answer. The page only exists in development; a production build returns 404 for it.
4. Run `npm run build` to update the rankings, then commit the changed files.

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
├── public/
│   └── media/            # Backdrop images and media assets
├── scripts/              # Build-time rating calculation scripts
├── src/
│   ├── app/              # Next.js App Router pages and layout assets
│   ├── components/       # Custom React components (table, graph, layouts)
│   ├── content/          # MDX files containing posts (movies, shows, projects)
│   ├── data/             # Static json records and pre-calculated ratings
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Bradley-Terry ratings algorithm logic
└── tests/                # Playwright E2E spec files
```
