# new-component

Generates a new standalone Angular component following project conventions.

## Usage
`/new-component <feature>/<component-name>`

## Steps

1. Create the component file at `src/app/features/<feature>/components/<component-name>/<component-name>.ts`
2. Create the SCSS file at `src/app/features/<feature>/components/<component-name>/<component-name>.scss`
3. Use the standalone component pattern with:
   - `imports: [CommonModule]` (add others as needed)
   - `changeDetection: ChangeDetectionStrategy.OnPush`
   - `encapsulation: ViewEncapsulation.None`
4. Export the component class
5. If the component uses tasks, inject `TaskService` via `inject(TaskService)`

## Example

```typescript
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-<component-name>',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<component-name>.html',
  styleUrl: './<component-name>.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class <ComponentName>Component {}
```
