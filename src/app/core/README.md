# Core Module

This directory contains core services, guards, and configuration for the application.

## Structure

```
core/
├── config/
│   └── api.config.ts          # API endpoint configuration
├── guards/
│   └── auth.guard.ts          # Authentication route guards
├── interfaces/
│   └── api.interface.ts        # API request/response interfaces
└── services/
    ├── api.service.ts         # Generic HTTP service for API calls
    └── auth.service.ts        # Authentication service
```

## API Configuration

The API base URL and endpoints are configured in `config/api.config.ts`:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://demo.api.titletoolbox.com/webservices',
  endpoints: {
    login: '/login.json'
  }
}
```

To add new endpoints, simply add them to the `endpoints` object.

## API Service

The `ApiService` provides a generic HTTP client with:
- Automatic token injection in headers
- Centralized error handling
- Support for GET, POST, PUT, DELETE methods

### Usage Example

```typescript
import { ApiService } from '@core/services/api.service';

constructor(private apiService: ApiService) {}

// GET request
this.apiService.get<ResponseType>('/endpoint.json').subscribe(...);

// POST request
this.apiService.post<ResponseType>('/endpoint.json', data).subscribe(...);
```

## Auth Service

The `AuthService` manages authentication state and provides:
- Login/logout functionality
- Token management
- User data storage
- Reactive authentication state (signals)

### Usage Example

```typescript
import { AuthService } from '@core/services/auth.service';

constructor(private authService: AuthService) {}

// Login
this.authService.login({ email, password }).subscribe({
  next: (response) => {
    if (response.success) {
      // Navigate to dashboard
    }
  },
  error: (error) => {
    // Handle error
  }
});

// Check authentication
const isAuthenticated = this.authService.isAuthenticatedValue();

// Get current user
const user = this.authService.getUser();

// Get full response data (stored from login)
const responseData = this.authService.getResponseData();

// Get specific field from response data
const specificField = this.authService.getResponseDataField('fieldName', 'defaultValue');

// Check if response data exists
const hasData = this.authService.hasResponseData();

// Access response data reactively (using signal)
const responseDataSignal = this.authService.responseData; // Readonly signal

// Logout
this.authService.logout();
```

## API Response Format

The API service handles flexible response formats. The login endpoint expects:

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (flexible formats supported):**
```json
{
  "token": "auth-token-here",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

OR

```json
{
  "data": {
    "token": "auth-token-here",
    "user": {
      "id": "123",
      "email": "user@example.com"
    }
  }
}
```

The service automatically extracts the token and user data from either format.

## Error Handling

All API errors are handled centrally in `ApiService` and return an `ApiError` object:

```typescript
interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
```

Common error messages:
- Network errors: "Unable to connect to server..."
- 401: "Unauthorized. Please login again."
- 403: "Access forbidden."
- 404: "Resource not found."
- 500: "Server error. Please try again later."

## Adding New API Endpoints

1. Add the endpoint to `api.config.ts`:
```typescript
endpoints: {
  login: '/login.json',
  newEndpoint: '/new-endpoint.json'
}
```

2. Create interface in `interfaces/api.interface.ts`:
```typescript
export interface NewEndpointRequest {
  // request fields
}

export interface NewEndpointResponse {
  // response fields
}
```

3. Use in your service:
```typescript
this.apiService.post<NewEndpointResponse>(
  API_CONFIG.endpoints.newEndpoint,
  requestData
).subscribe(...);
```

