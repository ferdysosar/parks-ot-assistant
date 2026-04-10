import { Routes } from '@angular/router';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    { path: '', loadChildren: () => import('./app/product/product.routes') },
    { path: 'demo', loadChildren: () => import('./app/demo/demo.routes') },

    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
