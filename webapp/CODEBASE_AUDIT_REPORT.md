
# Codebase Audit Report
**Date:** 2026-01-13
**Status:** Comprehensive Analysis Complete

## 1. Confirmed Unused / Deprecated Files (Safe to Delete)
The following files have been identified as deprecated, emptied (returning `null`), or fully disconnected from the current routing and logic flow. They are safe to remove.

### Authentication & Config Legacy
- `src/components/AuthCallback.jsx` (Empty/Deprecated)
- `src/components/ResetPasswordScreen.jsx` (Empty/Deprecated - functionality moved to AuthScreen/Context)
- `src/components/SupabaseAuthConfig.jsx` (Empty/Deprecated)
- `src/components/SupabaseConfigCheck.jsx` (Empty/Deprecated)
- `src/components/SupabaseConfigDebug.jsx` (Empty/Deprecated)
- `src/components/EmailVerificationLoader.jsx` (Empty/Deprecated)

### Old Flow Components
- `src/components/DashboardScreen.jsx` (Empty/Redirects removed)
- `src/components/HomeScreen.jsx` (Empty/Deprecated)
- `src/components/ParqScreen.jsx` (Empty/Deprecated)
- `src/components/PWAVerificationPage.jsx` (Empty/Deprecated)

### Legacy Workout Selection Logic
- `src/components/EquipmentSelection.jsx` (Empty/Deprecated - logic moved to TimeSelection/Generator)
- `src/components/WorkoutTypeSelection.jsx` (Empty/Deprecated)
- `src/components/WorkoutDisplay.jsx` (Empty/Deprecated - replaced by WorkoutSummary)

### Orphaned Components (Confirmed Unused)
- `src/components/CommunityChatScreen.jsx` (Orphaned. `App.jsx` routing does not include a chat route. Community features are now handled via `MembersPage` and `PostsFeed`.)
- `src/components/CallToAction.jsx` (Orphaned. No apparent imports in current UI flows.)
- `src/components/HeroImage.jsx` (Orphaned. Not imported by `WelcomeMessage` or other active components.)
- `src/components/VideoPlaceholder.jsx` (Orphaned. Not imported by `ExerciseVideo.jsx` or other active components.)

## 2. Potentially Unused Files (Verification Recommended)
None. All previously identified potentially unused files have been moved to "Confirmed Unused" after further analysis.

## 3. Actively Used Files (Do Not Delete)
The following files are critical to the application's current functionality.

### Core Entry & Configuration
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`
- `vite.config.js`
- `tailwind.config.js`
- `package.json`

### Core Contexts & Libs
- `src/contexts/SupabaseAuthContext.jsx`
- `src/contexts/SoundContext.jsx`
- `src/contexts/ThemeContext.jsx`
- `src/lib/customSupabaseClient.js`
- `src/lib/sessionUtils.js`
- `src/lib/workoutGenerator.js`
- `src/lib/levelUtils.js`
- `src/lib/utils.js`

### Primary Screens (Imported in App.jsx)
- `src/components/WelcomeMessage.jsx`
- `src/components/AuthScreen.jsx`
- `src/components/ProfileScreen.jsx`
- `src/components/ProfileSetupScreen.jsx`
- `src/components/TimeSelection.jsx`
- `src/components/DiceScreen.jsx`
- `src/components/WorkoutSummary.jsx`
- `src/components/TimerScreen.jsx`
- `src/components/MembersPage.jsx`
- `src/components/MemberProfileView.jsx`
- `src/components/BadgesScreen.jsx`
- `src/components/StatsStreak.jsx`
- `src/components/StatsMinutes.jsx`
- `src/components/StatsWorkouts.jsx`
- `src/components/LeaderboardPage.jsx`

### Secondary Components (Dependencies)
- `src/components/BottomNavigation.jsx`
- `src/components/HamburgerMenu.jsx`
- `src/components/NotificationsPanel.jsx`
- `src/components/DailyStreakCard.jsx`
- `src/components/AchievementsCard.jsx`
- `src/components/PersonalBestCard.jsx`
- `src/components/PostsFeed.jsx`
- `src/components/PostCard.jsx`
- `src/components/PostUploadForm.jsx`
- `src/components/ProfileEdit.jsx`
- `src/components/SettingsModal.jsx`
- `src/components/ExerciseVideo.jsx`
- `src/components/WorkoutIcons.jsx`
- `src/components/Confetti.jsx`
- `src/components/GifPicker.jsx` (Likely used in PostUploadForm)

### Admin & Legal (Lazy Loaded)
- `src/components/AdminDashboard.jsx`
- `src/components/AdminUtilities.jsx`
- `src/components/SubscriptionScreen.jsx`
- `src/components/PrivacyPolicy.jsx`
- `src/components/TermsOfService.jsx`

### UI Library (`src/components/ui/`)
- All components in this directory are assumed active or available for use.

## 4. Analysis Notes
- **Routing:** The `App.jsx` file strictly controls the visible screens via the `currentScreen` state. Any component not reachable via `App.jsx` state transitions is effectively unreachable by the user.
- **Authentication:** The auth flow has been consolidated into `SupabaseAuthContext` and `AuthScreen`. The old separate callback and reset screens are obsolete.
- **Workout Logic:** The workout generation logic is centralized in `workoutGenerator.js`, making the old selection screens (`EquipmentSelection`, `WorkoutTypeSelection`) redundant.
