# Shared UI Components

This directory contains reusable UI components that abstract the underlying UI library implementation. This makes it easy to swap UI libraries in the future without changing your application code.

## Components

### Form Components

#### Input (`app-input`)
Text input component with support for various types, validation, and error messages.

```typescript
import { InputComponent } from '@shared/components';

// Usage
<app-input
  id="email"
  type="email"
  label="Email"
  placeholder="Enter email"
  formControlName="email"
  [error]="getError()"
  required
/>
```

**Props:**
- `id`: Unique identifier
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
- `label`: Label text
- `placeholder`: Placeholder text
- `hint`: Helper text
- `error`: Error message
- `disabled`: Disabled state
- `readonly`: Readonly state
- `required`: Required indicator
- `icon`: Left icon class
- `suffixIcon`: Right icon class
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: Full width toggle

#### Select (`app-select`)
Dropdown/select component with options support.

```typescript
import { SelectComponent, SelectOption } from '@shared/components';

const options: SelectOption[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' }
];

<app-select
  id="country"
  label="Country"
  [options]="options"
  formControlName="country"
  [error]="getError()"
/>
```

#### Textarea (`app-textarea`)
Multi-line text input component.

```typescript
<app-textarea
  id="description"
  label="Description"
  [rows]="4"
  [maxLength]="500"
  [showCharCount]="true"
  formControlName="description"
/>
```

#### Checkbox (`app-checkbox`)
Checkbox component.

```typescript
<app-checkbox
  id="agree"
  label="I agree to terms"
  formControlName="agree"
/>
```

#### Radio (`app-radio`)
Radio button component (use multiple for radio groups).

```typescript
<app-radio
  id="option1"
  name="choice"
  value="option1"
  label="Option 1"
  formControlName="choice"
/>
```

#### Button (`app-button`)
Button component with variants and loading states.

```typescript
import { ButtonComponent } from '@shared/components';

<app-button
  variant="primary"
  size="md"
  [loading]="isLoading"
  [disabled]="isDisabled"
  (onClick)="handleClick()"
>
  Click Me
</app-button>
```

**Variants:** 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost'
**Sizes:** 'sm' | 'md' | 'lg'

### Layout Components

#### Card (`app-card`)
Card container component.

```typescript
<app-card title="Card Title" subtitle="Subtitle" [footer]="true">
  <p>Card content</p>
  <div footer>Footer content</div>
</app-card>
```

#### Modal (`app-modal`)
Modal/dialog component.

```typescript
import { ModalComponent } from '@shared/components';

<app-modal
  #modal
  title="Confirm Action"
  size="md"
  [showCloseButton]="true"
  (onClose)="handleClose()"
  (onConfirm)="handleConfirm()"
>
  <p>Modal content</p>
</app-modal>

// Open modal
modal.open();
```

### Feedback Components

#### Alert (`app-alert`)
Alert/message component.

```typescript
import { AlertComponent, AlertType } from '@shared/components';

<app-alert
  type="error"
  title="Error occurred"
  [dismissible]="true"
  (onDismiss)="handleDismiss()"
>
  Error message details
</app-alert>
```

**Types:** 'success' | 'error' | 'warning' | 'info'

### Utility Components

#### Label (`app-label`)
Label component.

```typescript
<app-label for="input-id" [required]="true">Label Text</app-label>
```

#### FormField (`app-form-field`)
Wrapper component for form fields with consistent styling.

```typescript
<app-form-field
  label="Field Label"
  hint="Helper text"
  [error]="getError()"
>
  <app-input formControlName="field" />
</app-form-field>
```

## Usage Example

```typescript
import { 
  InputComponent, 
  ButtonComponent, 
  AlertComponent,
  CardComponent 
} from '@shared/components';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [InputComponent, ButtonComponent, AlertComponent, CardComponent],
  template: `
    <app-card title="Example Form">
      <form [formGroup]="form">
        <app-input
          id="name"
          label="Name"
          formControlName="name"
          [error]="getError('name')"
        />
        
        <app-button
          type="submit"
          variant="primary"
          [loading]="isLoading"
        >
          Submit
        </app-button>
      </form>
    </app-card>
  `
})
export class ExampleComponent {
  // Component logic
}
```

## Benefits

1. **UI Library Abstraction**: Easy to swap UI libraries by updating component implementations
2. **Consistent API**: All components follow similar patterns
3. **Reusability**: Use components throughout the application
4. **Type Safety**: Full TypeScript support with proper types
5. **Form Integration**: All form components implement `ControlValueAccessor` for seamless Angular Forms integration

## Future Migration

When you want to switch UI libraries (e.g., from PrimeNG to Material, or to a custom implementation):

1. Update the component implementations in this directory
2. Keep the same component selectors and input/output properties
3. Your application code remains unchanged!

