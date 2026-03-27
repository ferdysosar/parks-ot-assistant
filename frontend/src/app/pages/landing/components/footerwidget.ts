import { Component } from '@angular/core';

@Component({
    selector: 'footer-widget',
    standalone: true,
    template: `
        <footer class="text-center py-10 text-gray-600" role="contentinfo">
            <p class="text-xl font-semibold mb-2">Parks OT Assistant</p>
            <p>
                Proyecto académico orientado a la optimización de consultas de órdenes de trabajo.
            </p>
        </footer>
    `
})
export class FooterWidget {}
