# AuthService Usage Examples

## Accessing Response Data

The `AuthService` automatically stores the full `response.data` from the login API. You can access it in multiple ways:

### 1. Get Full Response Data

```typescript
import { AuthService } from '@core/services/auth.service';

constructor(private authService: AuthService) {}

// Get the entire response data object
const responseData = this.authService.getResponseData();
console.log('Full response data:', responseData);
```

### 2. Get Specific Field from Response Data

```typescript
// Get a specific field with optional default value
const userId = this.authService.getResponseDataField('userId');
const companyId = this.authService.getResponseDataField('companyId', null);
const permissions = this.authService.getResponseDataField('permissions', []);
```

### 3. Reactive Access (Using Signals)

```typescript
import { Component, computed } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  // ...
})
export class MyComponent {
  // Access the readonly signal
  responseData = this.authService.responseData;
  
  // Create computed values from response data
  userId = computed(() => this.responseData()?.userId);
  companyName = computed(() => this.responseData()?.companyName);
  
  constructor(private authService: AuthService) {}
}
```

### 4. In Template (Reactive)

```html
@if (authService.responseData()) {
  <div>
    <p>User ID: {{ authService.responseData()?.userId }}</p>
    <p>Company: {{ authService.responseData()?.companyName }}</p>
  </div>
}
```

### 5. Check if Data Exists

```typescript
if (this.authService.hasResponseData()) {
  // Response data is available
  const data = this.authService.getResponseData();
  // Use the data...
}
```

## Complete Example Component

```typescript
import { Component, computed, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div>
      <h1>Dashboard</h1>
      
      @if (authService.responseData()) {
        <div class="info-card">
          <h2>User Information</h2>
          <p>User ID: {{ userId() }}</p>
          <p>Company: {{ companyName() }}</p>
          <p>Role: {{ userRole() }}</p>
        </div>
      }
      
      <button (click)="showData()">Show All Data</button>
    </div>
  `
})
export class DashboardComponent {
  // Reactive access to response data
  responseData = this.authService.responseData;
  
  // Computed values from response data
  userId = computed(() => this.responseData()?.userId || 'N/A');
  companyName = computed(() => this.responseData()?.companyName || 'N/A');
  userRole = computed(() => this.responseData()?.role || 'N/A');
  
  constructor(public authService: AuthService) {}
  
  showData(): void {
    const data = this.authService.getResponseData();
    console.log('All response data:', data);
    
    // Access specific fields
    const userId = this.authService.getResponseDataField('userId');
    const permissions = this.authService.getResponseDataField('permissions', []);
    
    console.log('User ID:', userId);
    console.log('Permissions:', permissions);
  }
}
```

## Data Persistence

The response data is automatically:
- ✅ Stored in `localStorage` when login succeeds
- ✅ Restored when the app reloads (if user is still authenticated)
- ✅ Cleared when user logs out
- ✅ Available reactively through signals

## Storage Keys

- `authToken` - Authentication token
- `user` - User information object
- `responseData` - Full response.data from login API

All data is automatically managed by the `AuthService`.

