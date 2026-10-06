import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Register · Registration Form',
    loadComponent: () =>
      import('./features/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'lookup',
    title: 'Find a user · Registration Form',
    loadComponent: () =>
      import('./features/lookup/lookup.component').then((m) => m.LookupComponent),
  },
  { path: '**', redirectTo: '' },
];
