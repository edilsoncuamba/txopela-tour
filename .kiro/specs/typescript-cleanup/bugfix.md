# Bugfix Requirements Document

## Introduction

The Txopela Tour MVP project currently has 237 ESLint errors that prevent clean builds and compromise code quality. These errors include unused imports and variables (remnants from prototyping), excessive use of `any` types that undermine TypeScript's type safety, incorrect React Hook dependencies, and React Fast Refresh violations. This bugfix will systematically eliminate all ESLint errors while preserving all core functionality including cultural tourism features, user posts, reporting system, geolocation, and search/filter capabilities.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `npm run lint` is executed THEN the system reports 237 ESLint errors across multiple files

1.2 WHEN unused imports exist in component files (e.g., IconChevronLeft, IconCamera in various pages) THEN ESLint reports "@typescript-eslint/no-unused-vars" errors

1.3 WHEN unused state variables exist (e.g., lat, setLat, lng, setLng in Map.tsx) THEN ESLint reports "@typescript-eslint/no-unused-vars" errors

1.4 WHEN unused functions exist (e.g., handleLogout, handleAvaliar in various components) THEN ESLint reports "@typescript-eslint/no-unused-vars" errors

1.5 WHEN unused props exist (e.g., onLocalPress, onNotifications in components) THEN ESLint reports "@typescript-eslint/no-unused-vars" errors

1.6 WHEN `any` type is used instead of specific types (in AppContext.tsx, AuthContext.tsx, api.ts, websocket.ts, pages, and tests) THEN ESLint reports "@typescript-eslint/no-explicit-any" errors (~80 occurrences)

1.7 WHEN useEffect hooks are missing dependencies (in Bookings.tsx, Chat.tsx, Chatbot.tsx) THEN ESLint reports "react-hooks/exhaustive-deps" warnings

1.8 WHEN constants are exported alongside components (in icons.tsx, badge.tsx, button.tsx, form.tsx, etc.) THEN ESLint reports "react-refresh/only-export-components" errors

1.9 WHEN TourismProvider and Explore are imported but not used in App.tsx THEN ESLint reports "@typescript-eslint/no-unused-vars" errors

1.10 WHEN Math.random() is called during render in sidebar.tsx THEN ESLint reports impure function usage in render

1.11 WHEN AppIconProps is defined but not used THEN ESLint reports "@typescript-eslint/no-unused-vars" error

### Expected Behavior (Correct)

2.1 WHEN `npm run lint` is executed THEN the system SHALL complete with zero errors and zero warnings

2.2 WHEN component files are linted THEN the system SHALL report no unused import errors because all unused imports have been removed

2.3 WHEN component files with state variables are linted THEN the system SHALL report no unused variable errors because all unused state variables and their setters have been removed

2.4 WHEN component files with functions are linted THEN the system SHALL report no unused function errors because all unused functions have been removed

2.5 WHEN component files with props are linted THEN the system SHALL report no unused props errors because all unused props have been removed or marked with underscore prefix if intentionally unused

2.6 WHEN TypeScript files are linted THEN the system SHALL report no `any` type errors because all `any` types have been replaced with specific TypeScript types or properly typed interfaces

2.7 WHEN components with useEffect hooks are linted THEN the system SHALL report no missing dependency warnings because all dependencies have been correctly specified in dependency arrays

2.8 WHEN UI component files are linted THEN the system SHALL report no React Fast Refresh errors because constants are either moved to separate files or marked with proper export patterns

2.9 WHEN App.tsx is linted THEN the system SHALL report no unused import errors because TourismProvider and Explore imports have been removed or properly utilized

2.10 WHEN sidebar.tsx is linted THEN the system SHALL report no impure function errors because Math.random() has been moved outside render or properly memoized

2.11 WHEN type definition files are linted THEN the system SHALL report no unused type errors because AppIconProps has been removed or properly utilized

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application runs after the fix THEN the system SHALL CONTINUE TO display all cultural tourism content (Cultura, Histórias, Destinos, Serviços) correctly

3.2 WHEN users interact with posts after the fix THEN the system SHALL CONTINUE TO allow creating, viewing, and interacting with user posts

3.3 WHEN users access the reporting system after the fix THEN the system SHALL CONTINUE TO function correctly for reporting inappropriate content

3.4 WHEN geolocation features are used after the fix THEN the system SHALL CONTINUE TO provide accurate location-based services

3.5 WHEN search and filter functionality is used after the fix THEN the system SHALL CONTINUE TO return correct filtered results

3.6 WHEN authentication flows are executed after the fix THEN the system SHALL CONTINUE TO handle login, registration, and password recovery correctly

3.7 WHEN navigation occurs between pages after the fix THEN the system SHALL CONTINUE TO route correctly and maintain application state

3.8 WHEN UI components are rendered after the fix THEN the system SHALL CONTINUE TO display with correct styling and behavior

3.9 WHEN API calls are made after the fix THEN the system SHALL CONTINUE TO communicate with backend services correctly

3.10 WHEN WebSocket connections are established after the fix THEN the system SHALL CONTINUE TO handle real-time communication correctly

3.11 WHEN the application is built for production after the fix THEN the system SHALL CONTINUE TO produce a working bundle without runtime errors

3.12 WHEN existing tests are run after the fix THEN the system SHALL CONTINUE TO pass all previously passing tests
