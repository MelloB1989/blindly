---
"blindly": patch
---

fix(chat): improve WebSocket stability and fix message handling

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
