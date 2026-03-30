# Offload

A minimal, focused GTD (Getting Things Done) app for Android and iOS, built with React Native.

Capture everything, clarify it once, and work from trusted lists — so your brain can focus on doing instead of remembering.

## Features

- **Inbox** — rapid capture with a global FAB; keyboard stays open for quick multi-item entry
- **Clarify** — guided GTD processing flow: actionable → single action or project → context + due date
- **Next Actions** — filterable by context (`@computer`, `@phone`, `@errands`, `@home`, `@anywhere`), focus (★), or free-text search; swipe to complete/delete; inline edit; completed history
- **Projects** — multi-step outcomes with linked actions; stalled-project badge in the drawer
- **Someday / Maybe** — park ideas without commitment; promote to Inbox when ready
- **Waiting For** — track delegated items with person and optional follow-up date; overdue highlighting
- **Reference** — items marked non-actionable during clarify land here for later lookup
- **Weekly Review** — guided checklist with streak tracking and a banner reminder when overdue
- **Data export** — share a JSON snapshot of all your data via the native share sheet

## Tech stack

| Library | Version | Purpose |
| --- | --- | --- |
| React Native | 0.84.1 | Cross-platform mobile framework |
| React | 19.2.3 | UI rendering |
| Zustand | 5.0.12 | State management with MMKV persistence |
| react-native-mmkv | 4.3.0 | Synchronous, fast local storage |
| React Navigation | 7.x | Drawer + native stack navigation |
| react-native-gesture-handler | 2.30.0 | Swipeable action rows |
| react-native-reanimated | 4.2.3 | Smooth animations |

## Getting started

### Prerequisites

- Node.js ≥ 22.11.0
- React Native development environment set up — follow the [official guide](https://reactnative.dev/docs/set-up-your-environment)
- For Android: Android Studio + an emulator or physical device
- For iOS: Xcode + CocoaPods (macOS only)

### Install

```sh
npm install
```

### iOS (macOS only)

```sh
bundle install          # first time only — installs CocoaPods
bundle exec pod install # first time or after changing native deps
npm start               # start Metro in one terminal
npm run ios             # build and launch in another
```

### Android

```sh
npm start               # start Metro in one terminal
npm run android         # build and launch in another
```

## Project structure

```text
src/
  components/
    ActionRow.tsx     # Swipeable action card with inline edit, due date, focus star
    DatePicker.tsx    # Reusable scroll-wheel date picker
  navigation/
    index.tsx         # Drawer + stack navigators, FAB, export button
  screens/
    InboxScreen.tsx
    ClarifyScreen.tsx
    NextActionsScreen.tsx
    ProjectsScreen.tsx
    ProjectDetailScreen.tsx
    SomedayScreen.tsx
    WaitingForScreen.tsx
    ReferenceScreen.tsx
    WeeklyReviewScreen.tsx
  store/
    index.ts          # Zustand store + selectors
  theme/
    index.ts          # Colors, spacing, typography tokens
  types/
    index.ts          # Shared TypeScript types
```

## License

MIT
