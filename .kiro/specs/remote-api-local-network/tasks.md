# Implementation Plan: Remote API Local Network Configuration

## Overview

Este plano implementação quebra o desenvolvimento de configuração dinâmica do backend em tarefas sequenciais e discretas. A implementação segue uma abordagem foundation-first: estabelecer infraestrutura principal (services, contexts, configuração) antes de construir componentes UI, depois testes, e finalmente documentação.

O projeto usa React + TypeScript + Vite + Radix UI + Tailwind CSS, integrando-se perfeitamente com a aplicação existente do Txopela Tour MVP.

## Tasks

### Phase 1: Core Infrastructure Setup

- [ ] 1.1 Enhance BackendConfigManager with validation and event dispatch
  - [ ] 1.1.1 Add URL format validation method (regex for protocol://host:port)
  - [ ] 1.1.2 Add URL parsing and normalization
  - [ ] 1.1.3 Implement event dispatching on config changes (backendConfigChanged)
  - [ ] 1.1.4 Add localStorage versioning for future migrations
  - [ ] 1.1.5 Write unit tests for URL validation
    - **Property 1: URL Validation Consistency**
    - **Validates: Requirements 1.0, 1.1, 1.2**
    - Test that valid URLs always parse correctly and invalid URLs always fail
    - Generate random protocol, host, port combinations and validate consistency
    - _Dependencies: None_

- [ ] 1.2 Create HealthCheckService for backend connectivity monitoring
  - [ ] 1.2.1 Create `src/services/healthCheck.ts` with HealthCheckService class
  - [ ] 1.2.2 Implement periodic health checks to `/api/health/` endpoint
  - [ ] 1.2.3 Add exponential backoff retry logic (1s, 2s, 4s, 8s, then 30s)
  - [ ] 1.2.4 Add status state (online/offline/checking)
  - [ ] 1.2.5 Implement error tracking and reporting
  - [ ] 1.2.6 Add listener pattern for status change events
  - [ ] 1.2.7 Write unit tests for health check logic
    - **Property 2: Health Check Idempotence**
    - **Validates: Requirements 3.0, 3.1**
    - Test that consecutive health checks return consistent results when backend is stable
    - Verify exponential backoff timing increases correctly
    - _Dependencies: 1.1_

- [ ] 1.3 Create NetworkContext for global network state management
  - [ ] 1.3.1 Create `src/contexts/NetworkContext.tsx` with TypeScript interfaces
  - [ ] 1.3.2 Implement useNetworkStatus custom hook
  - [ ] 1.3.3 Wire HealthCheckService into context
  - [ ] 1.3.4 Add backend URL update functionality
  - [ ] 1.3.5 Implement multi-tab synchronization via storage events
  - [ ] 1.3.6 Write context usage tests
    - **Property 3: Context State Consistency**
    - **Validates: Requirements 1.0, 10.0**
    - Test that updating backend URL in context is reflected across tabs
    - Verify that context state always matches localStorage state
    - _Dependencies: 1.1, 1.2_

- [ ] 1.4 Update api.ts service to use dynamic backend configuration
  - [ ] 1.4.1 Modify `getAPI_BASE_URL()` to always call `backendConfig.getApiUrl()`
  - [ ] 1.4.2 Add retry logic for network errors (3 attempts with exponential backoff)
  - [ ] 1.4.3 Create request queueing system for offline support
  - [ ] 1.4.4 Implement request replay when backend comes online
  - [ ] 1.4.5 Enhance error messages with user-friendly descriptions
  - [ ] 1.4.6 Add DEBUG logging in DEV mode for all requests
  - [ ] 1.4.7 Write integration tests for API retry logic
    - **Property 4: Retry Logic Convergence**
    - **Validates: Requirements 5.0, 5.1**
    - Test that requests eventually succeed after network recovery
    - Verify retry attempts follow exponential backoff timing
    - _Dependencies: 1.1, 1.2_

- [ ] 1.5 Create error handling and messaging system
  - [ ] 1.5.1 Create `src/utils/errorMessages.ts` with error code to message mapping
  - [ ] 1.5.2 Implement error classification (network, auth, validation, server)
  - [ ] 1.5.3 Add suggestions/solutions for common errors
  - [ ] 1.5.4 Create error display component (`src/components/ErrorDisplay.tsx`)
  - [ ] 1.5.5 Write unit tests for error messages
    - **Property 5: Error Message Completeness**
    - **Validates: Requirements 5.0**
    - Test that every error type has a non-empty, actionable message
    - Verify error messages contain either help text or suggestions
    - _Dependencies: None_

### Phase 2: UI Components & User Interaction

- [ ] 2.1 Create BackendConfiguration component for Settings page
  - [ ] 2.1.1 Create `src/components/BackendConfiguration.tsx`
  - [ ] 2.1.2 Implement URL input field with real-time validation
  - [ ] 2.1.3 Add "Test Connection" button with loading state
  - [ ] 2.1.4 Implement URL history dropdown (last 5 URLs)
  - [ ] 2.1.5 Add "Reset to Default" button
  - [ ] 2.1.6 Add success/error notification display
  - [ ] 2.1.7 Add network status indicator (● online/offline/checking)
  - [ ] 2.1.8 Write component tests
    - **Property 6: UI State Synchronization**
    - **Validates: Requirements 2.0, 2.1, 2.2**
    - Test that component state always reflects actual backend configuration
    - Verify that changing config updates localStorage immediately
    - _Dependencies: 1.1, 1.2, 1.3, 1.5_

- [ ] 2.2 Integrate BackendConfiguration component into Settings page
  - [ ] 2.2.1 Update `src/pages/Settings.tsx` to include BackendConfiguration section
  - [ ] 2.2.2 Add visual styling and layout
  - [ ] 2.2.3 Position backend config section appropriately (near top for visibility)
  - [ ] 2.2.4 Add help text explaining how to find backend IP
  - [ ] 2.2.5 Test Settings page rendering with component
  - [ ] 2.2.6 Write E2E tests for Settings page interaction
    - **Property 7: Settings UI Responsiveness**
    - **Validates: Requirements 2.0**
    - Test that Settings page loads and renders configuration section
    - Verify form inputs accept and validate URLs
    - _Dependencies: 2.1_

- [ ] 2.3 Create NetworkStatusIndicator component
  - [ ] 2.3.1 Create `src/components/NetworkStatusIndicator.tsx`
  - [ ] 2.3.2 Display connection status (icon + optional tooltip)
  - [ ] 2.3.3 Show "Online/Offline" status with color coding
  - [ ] 2.3.4 Add click action to open BackendConfiguration modal
  - [ ] 2.3.5 Place indicator in app header/navigation
  - [ ] 2.3.6 Write component tests
    - **Property 8: Status Indicator Accuracy**
    - **Validates: Requirements 3.0**
    - Test that indicator matches actual backend health check status
    - Verify updates when health check status changes
    - _Dependencies: 1.2, 1.3_

### Phase 3: Testing & Validation

- [ ] 3.1 Create comprehensive backend connectivity test suite
  - [ ] 3.1.1 Create `src/tests/backend-connectivity.test.ts`
  - [ ] 3.1.2 Test health check endpoint returns HTTP 200
  - [ ] 3.1.3 Test authentication endpoints (register, login, refresh)
  - [ ] 3.1.4 Test read endpoints (GET /api/posts, /api/locals, /api/services)
  - [ ] 3.1.5 Test write endpoints (POST /api/posts, /api/locals, /api/services)
  - [ ] 3.1.6 Test error handling (4xx, 5xx responses)
  - [ ] 3.1.7 Test timeout scenarios
  - [ ] 3.1.8 Generate test report with endpoint status
  - [ ] 3.1.9 Write integration tests that validate all endpoints
    - **Property 9: Endpoint Status Stability**
    - **Validates: Requirements 4.0, 4.1**
    - Test that endpoints maintain consistent status across multiple calls
    - Generate random request sequences and verify error handling
    - _Dependencies: 1.1, 1.2, 1.4_

- [ ] 3.2 Create property-based tests for configuration and state management
  - [ ] 3.2.1 Create `src/tests/config-properties.test.ts`
  - [ ] 3.2.2 Test URL validation with 100+ random URL combinations (fast-check)
  - [ ] 3.2.3 Test config round-trip (set → get returns same values)
  - [ ] 3.2.4 Test localStorage persistence (store → retrieve → compare)
  - [ ] 3.2.5 Test health check idempotence
  - [ ] 3.2.6 Test error message generation
  - [ ] 3.2.7 Write detailed test results report
    - **Property 10: Configuration Persistence Round-Trip**
    - **Validates: Requirements 1.0, 6.0**
    - Test that configuration survives localStorage round-trip
    - Generate random valid configurations and verify retrieval
    - _Dependencies: 1.1_

- [ ] 3.3 Create offline scenario tests
  - [ ] 3.3.1 Create `src/tests/offline-scenarios.test.ts`
  - [ ] 3.3.2 Test request queueing when backend offline
  - [ ] 3.3.3 Test cached data serving (graceful degradation)
  - [ ] 3.3.4 Test request replay when backend comes online
  - [ ] 3.3.5 Test order preservation during replay
  - [ ] 3.3.6 Write scenario documentation
    - **Property 11: Offline Request Queue Ordering**
    - **Validates: Requirements 5.0**
    - Test that requests replay in chronological order when backend recovers
    - Generate random request sequences and verify replay order
    - _Dependencies: 1.1, 1.4_

- [ ] 3.4 Create CORS configuration validation tests
  - [ ] 3.4.1 Create `src/tests/cors-validation.test.ts`
  - [ ] 3.4.2 Test CORS headers in responses (Access-Control-Allow-Origin)
  - [ ] 3.4.3 Test preflight requests (OPTIONS method)
  - [ ] 3.4.4 Test credentials handling (Access-Control-Allow-Credentials)
  - [ ] 3.4.5 Test allowed methods (GET, POST, PUT, DELETE, OPTIONS)
  - [ ] 3.4.6 Document CORS configuration requirements
    - **Property 12: CORS Header Compliance**
    - **Validates: Requirements 8.0, 8.1**
    - Test that all CORS responses include required headers
    - Verify methods and origins are properly allowed
    - _Dependencies: 1.1, 1.4_

### Phase 4: Documentation & Setup Guide

- [ ] 4.1 Create comprehensive network setup guide
  - [ ] 4.1.1 Create `NETWORK_SETUP_GUIDE.md` in project root
  - [ ] 4.1.2 Add Windows setup instructions (ipconfig, firewall)
  - [ ] 4.1.3 Add macOS setup instructions (ifconfig, network prefs)
  - [ ] 4.1.4 Add Linux setup instructions (ifconfig, iptables)
  - [ ] 4.1.5 Add troubleshooting section (common issues and solutions)
  - [ ] 4.1.6 Add CORS configuration guide for backend
  - [ ] 4.1.7 Add port forwarding instructions if needed
  - [ ] 4.1.8 Add example `.env` configurations
  - [ ] 4.1.9 Write end-to-end guide documentation
    - **Property 13: Guide Completeness**
    - **Validates: Requirements 7.0, 7.1, 7.2**
    - Test that guide covers all major platforms (Windows, macOS, Linux)
    - Verify troubleshooting section has solutions for common issues
    - _Dependencies: None_

- [ ] 4.2 Create backend health check endpoint documentation
  - [ ] 4.2.1 Document expected response format for `/api/health/`
  - [ ] 4.2.2 Add response examples (success, timeout, error)
  - [ ] 4.2.3 Document expected HTTP status codes
  - [ ] 4.2.4 Add timing expectations (< 2 seconds)
  - [ ] 4.2.5 Write API integration tests documentation
    - **Property 14: API Documentation Accuracy**
    - **Validates: Requirements 3.0, 4.0**
    - Test that documented endpoints match actual implementation
    - Verify response formats match documentation
    - _Dependencies: 3.1_

- [ ] 4.3 Create troubleshooting guide for common issues
  - [ ] 4.3.1 Create `docs/TROUBLESHOOTING.md`
  - [ ] 4.3.2 Add "Connection Refused" section (backend not running)
  - [ ] 4.3.3 Add "Timeout" section (network issues, firewall)
  - [ ] 4.3.4 Add "CORS Error" section (backend misconfiguration)
  - [ ] 4.3.5 Add "401 Unauthorized" section (token issues)
  - [ ] 4.3.6 Add "IP Address Changed" section (dynamic IP recovery)
  - [ ] 4.3.7 Add "Settings not Persisted" section (localStorage issues)
  - [ ] 4.3.8 Add command examples for each OS
  - [ ] 4.3.9 Write diagnostic documentation
    - **Property 15: Troubleshooting Coverage**
    - **Validates: Requirements 5.0, 7.0**
    - Test that troubleshooting guide covers main error scenarios
    - Verify solutions are actionable and practical
    - _Dependencies: None_

- [ ] 4.4 Create developer quick start guide
  - [ ] 4.4.1 Create `docs/QUICK_START_LOCAL_NETWORK.md`
  - [ ] 4.4.2 Add "5-minute setup" section
  - [ ] 4.4.3 Add environment variables explanation
  - [ ] 4.4.4 Add how to test backend connectivity
  - [ ] 4.4.5 Add how to debug configuration issues
  - [ ] 4.4.6 Add links to detailed guides
  - [ ] 4.4.7 Write quick reference documentation
    - **Property 16: Quick Start Completeness**
    - **Validates: Requirements 7.0**
    - Test that quick start guide has all essential information
    - Verify it covers the main workflow (configure → test → use)
    - _Dependencies: 4.1, 4.3_

### Phase 5: Integration & Finalization

- [ ] 5.1 Integrate all components and test end-to-end
  - [ ] 5.1.1 Test full flow: open Settings → change URL → use new backend
  - [ ] 5.1.2 Test Settings page with network status indicator
  - [ ] 5.1.3 Test error scenarios (invalid URL, timeout, connection refused)
  - [ ] 5.1.4 Test multi-tab synchronization (open multiple browser tabs)
  - [ ] 5.1.5 Test token refresh on new backend
  - [ ] 5.1.6 Write end-to-end test suite
    - **Property 17: End-to-End Flow Correctness**
    - **Validates: All Requirements**
    - Test complete user journey: startup → change config → make requests → handle errors
    - Generate random configuration changes and verify behavior
    - _Dependencies: 2.1, 2.2, 3.1_

- [ ] 5.2 Performance optimization and monitoring
  - [ ] 5.2.1 Profile health check performance (target: < 100ms)
  - [ ] 5.2.2 Profile configuration loading performance (target: < 10ms)
  - [ ] 5.2.3 Add performance metrics logging
  - [ ] 5.2.4 Optimize localStorage access patterns
  - [ ] 5.2.5 Profile memory usage with many pending requests
  - [ ] 5.2.6 Write performance test suite
    - **Property 18: Performance Bounds**
    - **Validates: Non-Functional Requirements**
    - Test that health check completes within 2 seconds
    - Verify configuration updates reflect within 100ms
    - _Dependencies: 1.1, 1.2_

- [ ] 5.3 Code review and quality assurance
  - [ ] 5.3.1 Review all new TypeScript code for type safety
  - [ ] 5.3.2 Verify error handling completeness
  - [ ] 5.3.3 Check console for any warnings/errors
  - [ ] 5.3.4 Verify accessibility of new UI components
  - [ ] 5.3.5 Check styling consistency with existing components
  - [ ] 5.3.6 Write final QA test report

- [ ] 5.4 Documentation review and completion
  - [ ] 5.4.1 Review and update all generated documentation
  - [ ] 5.4.2 Verify links and cross-references
  - [ ] 5.4.3 Add table of contents to main guide
  - [ ] 5.4.4 Create index of all setup guides and references
  - [ ] 5.4.5 Write final implementation summary
  - [ ] 5.4.6 Create CHANGELOG entry

- [ ] 5.5 Prepare for production deployment
  - [ ] 5.5.1 Review environment variable handling
  - [ ] 5.5.2 Verify security considerations (no exposed tokens)
  - [ ] 5.5.3 Test with production-like configuration
  - [ ] 5.5.4 Create deployment checklist
  - [ ] 5.5.5 Document production setup differences
  - [ ] 5.5.6 Write deployment documentation

## Property-Based Testing Strategy

### Test Framework: fast-check

All property-based tests will use [fast-check](https://github.com/dubzzz/fast-check) for generating random test data.

### Properties to Test

1. **URL Validation Consistency** (Task 1.1)
   - Property: For any valid URL, validation returns true; for invalid, returns false
   - Arbiters: URL strings with random protocols, hosts, ports
   - Test Count: 100 cases

2. **Health Check Idempotence** (Task 1.2)
   - Property: Calling health check multiple times with stable backend returns consistent status
   - Arbiters: Random timestamps, simulated latencies
   - Test Count: 50 cases

3. **Context State Consistency** (Task 1.3)
   - Property: Context state always matches localStorage state
   - Arbiters: Random configuration objects
   - Test Count: 100 cases

4. **Retry Logic Convergence** (Task 1.4)
   - Property: Requests eventually succeed after network recovery
   - Arbiters: Random network failure sequences
   - Test Count: 50 cases

5. **Error Message Completeness** (Task 1.5)
   - Property: Every error code maps to non-empty message
   - Arbiters: All defined error codes
   - Test Count: 20 cases

6. **UI State Synchronization** (Task 2.1)
   - Property: Component state reflects actual backend configuration
   - Arbiters: Random user interactions
   - Test Count: 100 cases

7. **Settings UI Responsiveness** (Task 2.2)
   - Property: Settings page renders and accepts input
   - Arbiters: Random URLs and configurations
   - Test Count: 50 cases

8. **Status Indicator Accuracy** (Task 2.3)
   - Property: Indicator status matches health check status
   - Arbiters: Random health check results
   - Test Count: 100 cases

9. **Endpoint Status Stability** (Task 3.1)
   - Property: Endpoints maintain consistent status across calls
   - Arbiters: All endpoints, random retry counts
   - Test Count: 200+ cases (one per endpoint)

10. **Configuration Persistence Round-Trip** (Task 3.2)
    - Property: Configuration survives localStorage round-trip
    - Arbiters: Random valid configurations
    - Test Count: 100 cases

11. **Offline Request Queue Ordering** (Task 3.3)
    - Property: Requests replay in chronological order when backend recovers
    - Arbiters: Random request sequences
    - Test Count: 100 cases

12. **CORS Header Compliance** (Task 3.4)
    - Property: All CORS responses include required headers
    - Arbiters: Random request types and origins
    - Test Count: 50 cases

## Dependencies

```
Phase 1 (Foundation):
1.1 → 1.2 → 1.3 → 1.4 → 1.5

Phase 2 (UI):
1.1, 1.2, 1.3, 1.5 → 2.1 → 2.2
1.2, 1.3 → 2.3

Phase 3 (Testing):
1.1, 1.2, 1.4 → 3.1
1.1 → 3.2
1.1, 1.4 → 3.3
1.1, 1.4 → 3.4

Phase 4 (Documentation):
3.1 → 4.2
None → 4.1, 4.3, 4.4

Phase 5 (Integration):
2.1, 2.2, 3.1 → 5.1
1.1, 1.2 → 5.2
All → 5.3, 5.4, 5.5
```

## Success Criteria

- ✓ All requirements met by corresponding tasks
- ✓ All property-based tests pass
- ✓ E2E tests pass on local network setup
- ✓ Documentation complete and reviewed
- ✓ No TypeScript errors or warnings
- ✓ Performance targets met (health check < 2s, config update < 100ms)
- ✓ Accessibility standards met for new UI components
- ✓ Code review approved by lead developer
