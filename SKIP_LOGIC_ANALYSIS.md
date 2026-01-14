
# Skip Button Logic Analysis

This document details the logic flow of the skip/forward button functionality within `src/components/TimerScreen.jsx`, confirming the absence of any hidden 1-minute rest periods and tracing the exact state transitions.

## 1. The Skip Handler

The primary entry point for the skip action is the `skipPhase` function.

**Location:** `src/components/TimerScreen.jsx` (~Line 347)

