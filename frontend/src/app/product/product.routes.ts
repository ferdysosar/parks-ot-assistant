import { Routes } from '@angular/router';
import { Landing } from '../pages/landing/landing';

export default [
    { path: '', component: Landing },
    { path: 'landing', redirectTo: '', pathMatch: 'full' }
] as Routes;
