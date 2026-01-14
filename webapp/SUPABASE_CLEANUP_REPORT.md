# Supabase Resources & Codebase Audit Report

**Generated Date:** 2026-01-05
**Scope:** Current `src` codebase and Supabase Database Schema

## Executive Summary
A scan of the current application codebase (`src/App.jsx` and connected components) and the Supabase database schema reveals several tables and features that appear to be dormant, disconnected, or placeholders for future implementation ("Coming Soon").

The following resources consume database storage but are not currently utilized by the active frontend application flow.

---

## 1. Database Tables (Recommended for Deletion/Archival)

### A. Social & Groups Feature (High Confidence)
The "Core Buddy" / Social feature is currently marked as "Coming Soon" in the `ProfileScreen.jsx`. There is no active code in the `App.jsx` router or connected components that reads from or writes to these tables.

*   `groups`
*   `group_members`
*   `group_chat_messages`
*   `group_requests`
*   `group_challenges`

**Reasoning:**
- No imports or usage of these tables found in `App.jsx`, `DashboardScreen.jsx`, or `ProfileScreen.jsx`.
- Feature explicitly toggles a "Coming Soon" toast in the UI.

### B. Personal Bests (Medium Confidence)
*   `personal_bests`

**Reasoning:**
- The current stats implementation (`user_stats`) tracks `total_minutes`, `total_workouts`, and `weekly_goal`.
- There is no visible UI in `ProfileScreen` or `DashboardScreen` that displays specific exercise personal records (PRs).

### C. Saved Workouts (Low Confidence)
*   `saved_workouts`

**Reasoning:**
- While `WorkoutSummary.jsx` exists, the current `App.jsx` flow generates workouts on the fly using `generatedWorkout` state and local storage (`mc_workout`).
- Unless `WorkoutSummary` has an internal "Save to Favorites" button that writes to this table (which is not visible in the main router logic), this table may be unused.

---

## 2. Unused React Components (Orphaned Files)

The following components exist in the codebase but are **not referenced** in the main `App.jsx` routing flow. This suggests the features they provide (choosing equipment, choosing workout type) are currently hardcoded or bypassed.

*   **`src/components/EquipmentSelection.jsx`**
    *   *Status:* **Orphaned**.
    *   *Current Behavior:* `App.jsx` hardcodes equipment to `['bodyweight', 'dumbbells', 'kettlebell']` on line 348.
*   **`src/components/WorkoutTypeSelection.jsx`**
    *   *Status:* **Orphaned**.
    *   *Current Behavior:* `App.jsx` hardcodes workout type to `'core'` on line 348.

---

## 3. SQL Cleanup Script

To remove the unused database resources identified in Section 1A and 1B, you can run the following SQL in your Supabase SQL Editor.

> **⚠️ WARNING:** This operation is destructive and cannot be undone. Ensure you have backups before running `DROP TABLE`.