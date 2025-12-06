# blindly

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
