# Airik's Hotel Booking App

This is a React-based hotel booking demo built by Airik Farley as a frontend technical assessment.

The product design and visual inspiration are based on the W Las Vegas resort experience.

## Timebox

The application was feature complete in 5 hours.

## Video Demo

A 10 minute video demo of the showcase can be viewed here: https://www.youtube.com/watch?v=Ec1YmZhRNs0

## Render Deployment

The application is deployed on Render:

https://airiks-resort.onrender.com/

> **Note:** This deployment uses a free Render instance. The service may spin down after periods of inactivity, which can cause the first request to take 50 seconds or more while the instance starts.

## Local Development

Install dependencies:

```sh
npm install
```

Start the mock API in one terminal:

```sh
npm run dev:api
```

The API listens at:

```text
http://127.0.0.1:3001
```

Start the React application in a second terminal:

```sh
npm run dev
```

The Vite development server proxies `/stays` and `/bookings` requests to the API so the application can use same-origin requests such as:

```text
GET  /stays?from_date=2026-09-01&to_date=2026-09-02&guests=2
GET  /stays/king_suite/reviews
POST /stays/king_suite/reviews
POST /bookings
```

Reviews and bookings created through POST requests are stored in memory and reset whenever the API process restarts.

The API also permits cross-origin requests for clients that access port `3001` directly.

## Notable Scripts

Start the development server:

```bash
npm run dev
```

Start the development API:

```bash
npm run dev:api
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run Playwright end-to-end tests:

```bash
npm run test:e2e
```

Playwright starts the mock API and the production server, so run `npm run build` first (or use `npm run check`). Chromium is required once per machine:

```bash
npx playwright install chromium
```

Run Stylelint:

```bash
npm run lint:styles
```

Run Betterer:

```bash
npm run betterer
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Run the primary quality checks:

```bash
npm run check
```

This runs TypeScript checking, linting, Stylelint, tests with coverage, betterer, the production build, and Playwright end-to-end tests.

## Architecture Decisions

* The project began from my personal React experimentation starter, which includes development tooling, quality configuration, and AI agent rules. The travel domain, backend API, feature implementation, tests, and assessment-specific specifications were created for this exercise.

* AI-generated code is treated as untrusted until it has passed automated quality gates and manual review. Guardrails and agent guidance are therefore part of the project foundation rather than something added after implementation.

* Stylelint, ESLint, Jest, code coverage, Betterer, and TypeScript type checking are incorporated into the development workflow to help enforce those standards consistently.

* The backend API is intentionally lightweight and is not intended to represent a production backend. It provides the minimum HTTP boundary needed to support the frontend flows without introducing database, authentication, or infrastructure work that would distract from the focus of the assessment.

* The application is organized by feature. Checkout is also lazy-loaded as a natural route-level boundary and as an example of how I would approach code splitting as an application grows.

## Tradeoffs

The application was intentionally scoped around demonstrating complete frontend flows and engineering practices within the assessment timebox.

* Room availability is not modeled independently, so searches currently return all rooms as available.

  * A production implementation would likely introduce availability as a separate API concern and use search criteria to filter inventory.
  * I chose not to add that additional domain and API complexity because it would have duplicated patterns already demonstrated elsewhere in the application.

* Some UX and visual details remain intentionally lightweight.

  * For example, portions of the landing-page empty state can be obscured by the date picker.
  * Within the timebox, I prioritized functional flows, architecture, automated validation, and error handling over additional visual refinement.

* I deliberately invested significant time up front defining features, technical specifications, acceptance criteria, and behavioral scenarios before delegating implementation to AI agents.

  * This created a more front-loaded workflow, but it reflects how I prefer to use AI professionally: implementation begins only after scope, expected behavior, and technical constraints have been made explicit.
  * The tradeoff was less remaining time for secondary UX polish.

* I did not add pre-commit hooks because the existing automated quality workflow provided sufficient validation for the scope of this exercise.

## What I'd Build Next

With additional time, I would focus primarily on completing the booking-domain behavior and refining the user experience.

The first improvement would be a dedicated availability API so search results reflect date selection, guest count, and actual room availability rather than returning every room.

I would also improve:

* Search filtering by occupancy and availability
* Loading, empty, and error-state presentation
* Form validation and user feedback
* Responsive behavior across additional screen sizes
* Image sizing and layout consistency
* Carousel control styling and interaction
* Additional accessibility validation
* Production persistence and more robust backend validation

## LLM Usage

I wanted the assessment to reflect how I would use AI-assisted development in a professional environment rather than treating the LLM as a one-shot code generator.

I began by establishing explicit engineering guardrails for AI agents. These include ESLint, Stylelint, TypeScript type checking, Jest, code coverage, and Betterer.

Repository-level agent rules require those quality gates to be run when implementation work is completed. This gives the agent a defined standard for what "done" means and helps prevent generated changes from silently introducing regressions or violating project conventions.

I then broke the overall assessment into smaller features and defined the expected behavior before implementation. Depending on the feature, those specifications included:

* Technical design notes
* Acceptance criteria
* API contracts
* Swagger-style API definitions
* Gherkin scenarios
* Testing expectations

Those documents were then provided directly to AI agents as implementation prompts.

This kept responsibility for scope, product behavior, architecture, and quality standards with me while using the LLM primarily as an implementation accelerator.

After each feature was implemented, I manually reviewed the generated code, validated the application in the browser, and corrected issues where necessary.

The actual Markdown documents used as AI prompts are committed with the project and can be reviewed here:

https://github.com/farley911/booking-app/tree/main/.ai_prompts
