# new-feature

Scaffolds a new feature module following the project's feature-based architecture.

## Usage
`/new-feature <feature-name>`

## Steps

1. Create the folder structure:
   ```
   src/app/features/<feature-name>/
   ├── components/
   ├── pages/
   │   └── <feature-name>-page/
   │       ├── <feature-name>-page.ts
   │       ├── <feature-name>-page.html
   │       └── <feature-name>-page.scss
   └── <feature-name>.routes.ts
   ```

2. Create the routes file `<feature-name>.routes.ts`:
   ```typescript
   import { Routes } from '@angular/router';

   export const <FEATURE_NAME>_ROUTES: Routes = [
     {
       path: '',
       loadComponent: () =>
         import('./pages/<feature-name>-page/<feature-name>-page').then(
           (m) => m.<FeatureName>PageComponent
         ),
     },
   ];
   ```

3. Register the route in `src/app/app.routes.ts` with `loadChildren`.

4. All components inside the feature must be standalone and use `ChangeDetectionStrategy.OnPush`.
