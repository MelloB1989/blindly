# blindly

## 0.6.8

### Patch Changes

- feat: add and capture events for analytiics, posthog (56fe2f7)

_Released: 2025-12-17_

## 0.6.7

### Patch Changes

- feat: splash animation fix: ai summary issue fix: blur pfp (d384bf2)
- fix: enforce blurred PFP for locked profiles (60baa2d)
- fix: enforce strict photo blur for matched/locked profiles and recommendations (045a6f4)
- feat: implement photo blur and improved unlock security fixes (9ea3c3a)

_Released: 2025-12-17_

## 0.6.6

### Patch Changes

- add: app invite functionality fix: wrong gender strings, added standardization (4e2766a)
- fix: set ENVIRONMENT="" in .env for Docker builds (47684f5)
- fix: pass git version to Docker build and copy .env file (078339e)
- enhance: add filters to recommendation system (2c5be51)
- fix: vercel.json for SPA path rewrites (763c220)

_Released: 2025-12-16_

## 0.6.5

### Patch Changes

- feat: Apple App Store compliance (Guidelines 5.1.1, 1.2, 5.1.1v) (e9698b4)
- add(docs): legal/csae (45ba148)
- add: Readme, new app logo (640ef6c)

_Released: 2025-12-16_

## 0.6.4

### Patch Changes

- enhance(ui): remove verified rings (46a581e)
- update: docs (5ace88b)
- add: docs for contributions, arch, selfhost add(landing): link to docs on navbar and hero section in landing (bd2035b)
- : (7eae683)
- add: landing page ui (68d9cbe)
- update: docs (d1814fc)
- update: docs (af305d9)
- update: docs (aa88e37)
- feat: add docker-compose stack (postgres, redis, migrate, backend) + multi-stage Dockerfile add: docs (e6637ea)

_Released: 2025-12-13_

## 0.6.3

### Patch Changes

- chore: update bun lockfile(s) (15e69d9)

_Released: 2025-12-10_

## 0.6.2

### Patch Changes

- fix: auth related issues, New tokens weren't used until app restart add: onboarding screens enhaced: welcome screen (8d8574b)

_Released: 2025-12-10_

## 0.6.1

### Patch Changes

- fix(workos): remove recursive call and load correct production WorkOS credentials (14179e9)

_Released: 2025-12-08_

## 0.6.0

### Minor Changes

- feat: ai chat, ai bio completion, ai summary add: user verification apis (8a77cdf)
- fix: version code (afed53d)
- Changelogs (c9b8fff)

_Released: 2025-12-08_

## 0.5.0

### Minor Changes

- 🚀 New Features

  Community Screens & Functionality
  • Added full community module UI including:
  • Post listing & details screen (expo/app/community/[id].tsx)
  • Post cards, comments, upload progress UI
  • Modal for creating posts with media support
  • Added community store using Zustand (useCommunityStore.ts)
  • Added dedicated community service layer for API interactions

  Backend GraphQL Reports Module
  • New GraphQL schema, resolvers, and handlers for reports
  (content moderation extension: posts, comments, etc.)

## 0.4.0

### Minor Changes

- 9bf82b5: Fix bugs, add HTTP file-upload APIs, and add reverse proxy for GraphQL + HTTP routing
- 39a7677: Added authentication, mock server, major screens (using claude), and design system
- 0d6a22a: • 🚀 Introduced full chat service: storage layer, WebSocket subscriptions, and GraphQL support.
  • 🔍 Added interests and hobby-based recommendation engine.
  • ❤️ Added swipe APIs (like, superlike, dislike) with match logic.
  • 📊 Added profile activity APIs and resolver implementations.

### Patch Changes

- d63ad83: • Type corrections: Resolved incorrect or inconsistent type definitions that were causing runtime issues.
  • Match logic fix: Updated and corrected the matching algorithm to ensure accurate pairing behavior.
  • Recommendation system fixes: Addressed bugs within the recommendation engine to improve relevance and stability.
  • Internal code enhancements:
  - Added shared GraphQL types (services/internal/graph/shared/types.go)
  - Introduced utility helpers for user operations (services/internal/helpers/users/utils.go)
  - Added new middleware to validate websocket requests (isWebsocketVerified.go)
- 32cf1ef: 1. Deployment Fixes
  • Corrected issues in the deployment script to ensure smooth and reliable builds and releases.
  • Improved execution flow and removed incorrect or outdated deployment steps.

  2. Cleanup
     • Removed the mock server and all related references, as it is no longer required in the deployment or development workflow.

- c05a959: fix(chat): improve WebSocket stability and fix message handling

  WebSocket Connection Improvements:

  - Add write mutex to prevent concurrent WebSocket writes from ping,
    subscription, and main goroutines
  - Increase pongWait (60s → 90s) and writeWait (10s → 30s) for better
    tolerance of network latency
  - Add ping retry logic (max 3 failures) instead of immediately closing
    connection on single ping failure
  - Clear write deadlines after each write to prevent stale deadlines
  - Fix event handlers to use 'continue' instead of 'return' to prevent
    killing the subscription goroutine on transient errors

  Message Handling Fixes:

  - Fix MessageEventSeen handler that incorrectly checked for event.Message
    (seen events only have Data, not Message)
  - Add user filter to seen events to prevent echoing back to sender
  - Fix Lua script in updateMessageInBuffer to skip empty strings and
    properly handle boolean fields (seen/received)
  - Always set UpdatedAt to match CreatedAt for new messages

  Proxy Improvements:

  - Enable TCP keep-alive on both client and backend connections
  - Add debug logging for WebSocket proxy lifecycle

  Test Suite:

  - Add CLI chat tester tool for manual WebSocket testing
  - Add comprehensive test suite for chat functionality

- 9a31126: Chat Service Fixes
  • Resolved multiple bugs affecting outgoing WebSocket events and message delivery flow.
  • Improved reliability of event handling logic (typing, message updates, seen/received events).
  • Enhanced data handling and error cases for more stable real-time communication.

  Deployment Enhancements
  • Added deployment.yml for k8s deployment.
  • Added Dockerfile for backend builds.

- This update delivers a major UI revamp across the application with significant improvements to design, motion, and visual consistency.

  UI Enhancements
  • Overhauled overall interface styling with a refined and modernized color palette.
  • Added smooth animations to chat bubbles for a more fluid conversational experience.
  • Introduced several new UI components, including:
  • GlassCard
  • GradientBackground
  • NeonButton

  Typography Improvements
  • Integrated multiple high-quality font families (Lexend, Nunito, Playwrite NO) with full weight ranges and metadata.
  • Updated font assets to support more expressive and accessible text rendering across the app.

- d0ed5ff: fix: user onboarding, update api logical bug
