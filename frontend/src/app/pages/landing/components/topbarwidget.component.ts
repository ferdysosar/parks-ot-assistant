import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'topbar-widget',
    standalone: true,
    imports: [RippleModule],
    template: `
        <div class="flex items-center justify-between w-full">
            
            <!-- LOGO / NOMBRE -->
            <div class="text-2xl font-bold text-gray-900">
                Parks OT Assistant
            </div>

            <!-- MENU -->
            <div class="hidden md:flex gap-8 text-gray-700 font-medium">
                <a (click)="scrollTo('home')" class="cursor-pointer">Inicio</a>
                <a (click)="scrollTo('features')" class="cursor-pointer">Funciones</a>
            </div>

        </div>
    `
})
export class TopbarWidget {

    constructor(private router: Router) {}

    scrollTo(section: string) {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    }
}