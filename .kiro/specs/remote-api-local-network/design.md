# Design Document: Remote API Local Network Configuration

## Overview

Este documento descreve a arquitectura, componentes e padrões de design para implementar configuração dinâmica e robusta do backend no frontend Txopela Tour. O foco é permitir que desenvolvadores e utilizadores alterem a URL do backend em tempo real, com validação completa, health checks e tratamento de erros.

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Txopela Tour)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UI Layer                                                 │  │
│  │  ├─ Settings Page (Backend Configuration Component)      │  │
│  │  └─ Network Status Indicator                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Config Layer (backendConfig Manager)                    │  │
│  │  ├─ Load from ENV                                         │  │
│  │  ├─ Load from localStorage                               │  │
│  │  ├─ Validate URL format                                  │  │
│  │  ├─ Sync between tabs (via storage event)               │  │
│  │  └─ Expose via window (DEV mode)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Health Check Service                                    │  │
│  │  ├─ Test connectivity to /health/                       │  │
│  │  ├─ Retry logic with exponential backoff                │  │
│  │  ├─ Report status to UI                                  │  │
│  │  └─ Persist health state                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Service Layer (api.ts)                              │  │
│  │  ├─ Get API URL from backendConfig                      │  │
│  │  ├─ Auth (login, register, token refresh)               │  │
│  │  ├─ CRUD operations (locals, services, posts)           │  │
│  │  ├─ Error handling with retry logic                     │  │
│  │  └─ Request queuing (offline support)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  localStorage / Cookie Storage                           │  │
│  │  ├─ Backend Config (txopela_backend_config)            │  │
│  │  ├─ Access Token (access_token)                         │  │
│  │  ├─ Refresh Token (refresh_token)                       │  │
│  │  └─ User Profile (txopela_user)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                       │
└─────────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────────┐
│              Network Layer (HTTP)                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Backend API (Django REST Framework)                    │   │
│  │  ├─ /api/health/  (health check)                       │   │
│  │  ├─ /api/auth/*   (authentication)                     │   │
│  │  ├─ /api/users/*  (user profile)                       │   │
│  │  ├─ /api/locals/* (cultural sites)                     │   │
│  │  ├─ /api/services/* (tourism services)                 │   │
│  │  ├─ /api/posts/*  (user discoveries)                   │   │
│  │  └─ /api/search/* (search functionality)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│           ↑                                                       │
│  Same Local Network (LAN)                                       │
│  Firewall allows port 8000 (or configured port)                │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Priority Order

```javascript
// 1. Check localStorage first (user's custom configuration)
const storedConfig = localStorage.getItem('txopela_backend_config');

// 2. If not found, use environment variables
const envConfig = {
  protocol: import.meta.env.VITE_BACKEND_PROTOCOL,
  host: import.meta.env.VITE_BACKEND_HOST,
  port: import.meta.env.VITE_BACKEND_PORT,
};

// 3. If still not found, use defaults
const defaultConfig = {
  protocol: 'http',
  host: 'localhost',
  port: 8000,
};
```

## Core Components

### 1. BackendConfigManager (Enhanced)

**Location:** `src/config/backend.ts`

**Responsibilities:**
- Load configuration from ENV → localStorage → defaults
- Validate URL format
- Build complete API URLs
- Provide getter methods
- Persist changes to localStorage
- Dispatch change events for multi-tab sync

**Interface:**

```typescript
class BackendConfigManager {
  // Read operations
  getConfig(): BackendConfig;
  getApiUrl(): string;
  getBaseUrl(): string;

  // Write operations
  setBackendUrl(protocol: string, host: string, port: number): void;
  setBackendFullUrl(url: string): void;
  reset(): void;

  // Connectivity
  testConnection(): Promise<boolean>;
  getBackendInfo(): Promise<any>;

  // Debug
  debug(): void;
}

interface BackendConfig {
  protocol: string;
  host: string;
  port: number;
  baseUrl: string;
  apiUrl: string;
}
```

**Key Features:**
- Getter lazy-loads from localStorage only once
- Setter persists immediately to localStorage
- Dispatches `backendConfigChanged` event on changes
- Validates URLs before setting
- Exposes globally in DEV mode via `window.backendConfig`

### 2. Health Check Service

**Location:** `src/services/healthCheck.ts` (new)

**Responsibilities:**
- Periodically check `/api/health/` endpoint
- Manage connection state (online/offline)
- Retry logic with exponential backoff
- Notify UI of status changes
- Cache health check results

**Interface:**

```typescript
interface HealthCheckResult {
  status: 'online' | 'offline' | 'checking';
  timestamp: Date;
  lastChecked: Date;
  failureCount: number;
  nextRetryIn: number; // milliseconds
  error?: string;
}

class HealthCheckService {
  startMonitoring(): void;
  stopMonitoring(): void;
  getStatus(): HealthCheckResult;
  forceCheck(): Promise<boolean>;
  onStatusChange(callback: (status: HealthCheckResult) => void): void;
}
```

**Retry Strategy:**
```
Attempt 1: immediate
Attempt 2: 1s delay
Attempt 3: 2s delay
Attempt 4: 4s delay
Attempt 5: 8s delay (max)

After 5 failed attempts: wait 30s, then resume with Attempt 1
```

### 3. Backend Configuration Component (UI)

**Location:** `src/components/BackendConfig.tsx` (new)

**Features:**
- Input field for backend URL
- Validation feedback (real-time)
- "Test Connection" button
- URL history dropdown (last 5 URLs)
- "Reset to Default" button
- Status indicator (● online/offline)

**State Management:**
```typescript
state = {
  inputUrl: string;           // Current input value
  isLoading: boolean;         // While testing connection
  error: string | null;       // Validation or connection error
  urlHistory: string[];       // Last 5 used URLs
  healthStatus: HealthCheckResult;
}
```

### 4. Enhanced API Service

**Location:** `src/services/api.ts` (modifications)

**Changes:**
- Always fetch API URL from `backendConfig.getApiUrl()`
- Add retry logic for network errors (max 3 attempts with backoff)
- Queue requests while offline (using localStorage)
- Enhanced error messages
- Log all requests in DEV mode

**Request Queueing (Offline Support):**
```typescript
interface PendingRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  timestamp: number;
  retryCount: number;
}

// When offline (health check fails):
// 1. Store request in localStorage: txopela_pending_requests
// 2. Return cached response if available
// 3. When backend comes online, replay all pending requests

// When online (health check succeeds):
// 1. Check if pending requests exist
// 2. Replay in chronological order
// 3. Remove from queue on success
```

### 5. Network Status Context (React Context)

**Location:** `src/contexts/NetworkContext.tsx` (new)

**Purpose:** Provide global network status to all components

```typescript
interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;           // Backend is reachable
  backendUrl: string;
  lastChecked: Date;
  error: string | null;
}

interface NetworkContextType {
  status: NetworkStatus;
  updateBackendUrl(url: string): Promise<void>;
  retestConnection(): Promise<void>;
}

export const useNetworkStatus = () => useContext(NetworkContext);
```

## Design Patterns

### 1. Configuration Loading Pattern

**Priority-based loading:**
```javascript
// Check in this order:
1. localStorage → user's last custom configuration
2. import.meta.env → build-time environment variables
3. defaults → fallback to localhost:8000

// Benefits:
- Respects user preferences (localStorage persists across sessions)
- Supports different environments (ENV for CI/CD)
- Provides reasonable defaults (localhost for local dev)
```

### 2. Health Check Pattern

**Non-intrusive monitoring:**
```javascript
// Health check runs independently:
- Every 30 seconds (not blocking other operations)
- Timeout after 5 seconds
- Uses exponential backoff on failure
- Emits events (not tied to specific requests)
- Can be forced via `forceCheck()` if needed
```

### 3. Error Recovery Pattern

**Graceful degradation:**
```javascript
// For each error type:
1. 401 (Unauthorized) → Try refresh token → If fails, logout
2. 4xx (Client Error) → Show user-friendly message
3. 5xx (Server Error) → Suggest retry with exponential backoff
4. Network Error → Queue request, retry when online
5. Timeout → Treat as network error, queue request
```

### 4. Multi-Tab Synchronization Pattern

**Using Storage Events:**
```javascript
// Tab A changes backend URL
backendConfig.setBackendUrl('http://192.168.1.10:8000');
// → Writes to localStorage

// Tab B detects storage change
window.addEventListener('storage', (e) => {
  if (e.key === 'txopela_backend_config') {
    backendConfig.loadFromStorage();
    networkContext.updateStatus();
  }
});
```

## Data Flows

### Flow 1: User Changes Backend URL in Settings

```
1. User enters new URL in BackendConfig component
   └─ Input: "http://192.168.137.200:8000"

2. Validation (regex check for protocol://host:port)
   ├─ Valid → Continue to step 3
   └─ Invalid → Show error, don't proceed

3. User clicks "Test Connection"
   └─ healthCheckService.forceCheck()

4. Health check makes GET /health/ request
   ├─ Response 200 OK → Connection successful
   ├─ Response timeout/error → Connection failed
   └─ Store result in HealthCheckResult

5. Update backendConfig
   └─ backendConfig.setBackendUrl(protocol, host, port)

6. Persist to localStorage
   └─ localStorage['txopela_backend_config'] = JSON stringified config

7. Dispatch event for multi-tab sync
   └─ window.dispatchEvent(new CustomEvent('backendConfigChanged', ...))

8. Update UI
   └─ Show success notification or error message
```

### Flow 2: Application Startup

```
1. App initializes (App.tsx or main.tsx)

2. BackendConfigManager loads configuration
   ├─ Try localStorage.getItem('txopela_backend_config')
   ├─ Fallback to import.meta.env variables
   └─ Fallback to defaults

3. HealthCheckService starts monitoring
   └─ Makes first health check request immediately
   └─ Schedules periodic checks every 30 seconds

4. NetworkContext emits initial status
   └─ isConnected = result of first health check

5. API service is ready to make requests
   └─ Uses backendConfig.getApiUrl() for all requests

6. Components can access network status
   └─ useNetworkStatus() hook
   └─ Conditionally show offline UI or spinner
```

### Flow 3: API Request with Error Handling

```
1. Component calls API method (e.g., authApi.login())

2. API Service retrieves URL from backendConfig
   └─ url = backendConfig.getApiUrl() + endpoint

3. Add authentication header if token exists
   └─ Authorization: Bearer {access_token}

4. Make fetch request with timeout
   └─ timeout = 5000ms (configurable)

5. Response handling:
   ├─ 200-299 (Success) → Return data
   ├─ 401 (Unauthorized) → Try refresh token → Retry request
   ├─ 4xx (Client Error) → Return error message to user
   ├─ 5xx (Server Error) → Queue request, schedule retry
   ├─ Network Error → Queue request, schedule retry
   └─ Timeout → Queue request, schedule retry

6. If request queued:
   └─ Store in localStorage: txopela_pending_requests
   └─ Return optimistic response (cached data if available)
   └─ Replay when backend comes online
```

## Correctness Properties

### 1. Configuration Consistency (Invariant)

**Property:** The configuration always follows: `baseUrl = protocol://host:port` and `apiUrl = baseUrl/api`

**Implementation:**
```typescript
// Private method ensures consistency
private buildConfig(protocol: string, host: string, port: number): BackendConfig {
  const baseUrl = `${protocol}://${host}:${port}`;
  return {
    protocol,
    host,
    port,
    baseUrl,
    apiUrl: `${baseUrl}/api`,  // Always derived from baseUrl
  };
}

// Invariant property test:
// For all valid (protocol, host, port) tuples,
// getApiUrl() === getBaseUrl() + '/api'
```

### 2. URL Validation Round Trip (Round Trip Property)

**Property:** If a URL is valid, validate → set → get returns equivalent URL

**Implementation:**
```typescript
// Save original URL
const originalUrl = "http://192.168.137.124:8000";

// Validate it
const isValid = validateUrl(originalUrl);

// If valid, set and get
if (isValid) {
  setBackendFullUrl(originalUrl);
  const config = getConfig();
  const retrievedUrl = `${config.protocol}://${config.host}:${config.port}`;
  
  // Round-trip property: retrievedUrl === originalUrl
  assert(retrievedUrl === originalUrl);
}
```

### 3. Idempotence (Health Check)

**Property:** Multiple consecutive health checks return same status within a reasonable time window

**Implementation:**
```typescript
// Idempotence property test:
// If backend is stable, multiple checks should return same status

const result1 = await healthCheck.forceCheck();
const result2 = await healthCheck.forceCheck();

// Both should have same status (assuming backend didn't change)
assert(result1.status === result2.status);
```

### 4. localStorage Persistence (Metamorphic Property)

**Property:** If data is stored, retrieval returns equivalent data

**Implementation:**
```typescript
// Store config
const original = {protocol: "http", host: "192.168.x.x", port: 8000};
localStorage.setItem('txopela_backend_config', JSON.stringify(original));

// Retrieve and parse
const retrieved = JSON.parse(localStorage.getItem('txopela_backend_config'));

// Metamorphic property: content is preserved
assert(JSON.stringify(original) === JSON.stringify(retrieved));
```

### 5. Error Message Clarity (Property)

**Property:** All error messages are non-empty and actionable

**Implementation:**
```typescript
const errorMessages = {
  'INVALID_URL': 'URL deve seguir o formato: http://host:port',
  'CONNECTION_REFUSED': 'Conexão recusada. Verifique se o backend está ativo na porta 8000.',
  'TIMEOUT': 'Requisição expirou após 5 segundos. Verifique a conexão de rede.',
  'UNAUTHORIZED': 'Credenciais inválidas. Faça login novamente.',
};

// Property: All error messages are non-empty
for (let msg of Object.values(errorMessages)) {
  assert(msg.length > 0);
  assert(msg.includes('Verifique') || msg.includes('Faça') || msg.includes('URL'));
}
```

## Security Considerations

### 1. Token Security
- Access tokens are stored in localStorage (acceptable for this SPA context)
- Never expose tokens in URLs or logs
- Clear tokens immediately on 401 response
- Implement token rotation via refresh endpoint

### 2. URL Validation
- Whitelist allowed protocols (http, https)
- Validate hostname format (no spaces, special chars)
- Validate port number (1-65535)
- Reject URLs pointing to different domains in production

### 3. CORS Headers
- Backend must set appropriate CORS headers
- Allowed origins must be configured
- Credentials must be explicitly allowed
- Prevent unauthorized cross-origin requests

## Performance Optimizations

### 1. Health Check Optimization
- Lightweight endpoint (/health/) instead of full auth check
- Runs independently (doesn't block other requests)
- Configurable check interval (default 30s)
- Exponential backoff to reduce server load

### 2. Request Caching
- Cache successful API responses locally
- Serve stale data if backend temporarily unavailable
- Automatic invalidation after 5 minutes

### 3. Lazy Loading Configuration
- Load backend config only once (lazy singleton)
- Use cached result for all subsequent calls
- Update cache immediately when changed

## Fallback & Recovery Strategies

### Scenario 1: Backend Initially Unreachable
```
1. App starts → Health check fails
2. Display offline indicator (✗ icon)
3. Allow user to change backend URL in Settings
4. Retry health check when user clicks "Test Connection"
5. If still fails, show troubleshooting guide link
6. Allow offline browsing with cached data (read-only)
```

### Scenario 2: Network Interruption During Session
```
1. Health check detects backend offline
2. Queue subsequent API requests
3. Periodically retry health check (exponential backoff)
4. Show "Offline" banner
5. When backend comes back online:
   - Replay queued requests in order
   - Clear "Offline" banner
   - Sync latest data
```

### Scenario 3: Backend URL Changed (IP or Port)
```
1. Old URL no longer responds (health check fails)
2. User opens Settings → Backend Configuration
3. Enters new URL (obtained from network admin or docs)
4. Clicks "Test Connection" → validates new URL
5. All future requests use new URL
6. Old localStorage config is replaced
```

## Testing Strategy

### Unit Tests
- URL validation logic (valid/invalid formats)
- Configuration building (protocol + host + port → URLs)
- Error message generation
- localStorage serialization/deserialization

### Integration Tests
- Full configuration flow (input → validate → test → save)
- Health check retry logic
- API request with token refresh
- Multi-tab synchronization

### End-to-End Tests
- User changes backend URL in Settings → API calls use new URL
- Health check detects offline → UI shows offline indicator
- Request while offline → queue → replay when online
- 401 response → automatic token refresh → retry

## Implementation Phases

### Phase 1: Core Configuration (Week 1)
- Enhance backendConfig manager
- Add health check service
- Add NetworkContext
- Update api.ts to use backendConfig

### Phase 2: UI & User Interaction (Week 2)
- Create BackendConfig component
- Add to Settings page
- Add status indicator
- Add URL history

### Phase 3: Resilience & Testing (Week 3)
- Implement request queueing
- Add retry logic with backoff
- Create test suite
- Add NETWORK_SETUP_GUIDE.md

### Phase 4: Optimization & Polish (Week 4)
- Performance optimizations
- Error message refinement
- Documentation completion
- Production readiness
