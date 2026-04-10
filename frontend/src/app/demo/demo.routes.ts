import { Routes } from '@angular/router';
import { AppLayout } from '../layout/component/app.layout';
import { Dashboard } from '../pages/dashboard/dashboard';

export default [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard }
        ]
    },
    { path: '**', redirectTo: '' }
] as Routes;
