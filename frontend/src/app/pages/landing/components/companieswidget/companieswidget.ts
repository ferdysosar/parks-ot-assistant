import { Component } from '@angular/core';
import companiesData from '../../../../../data/empresas-activos.json';

@Component({
    selector: 'companies-widget',
    standalone: true,
    template: `
        <div class="py-20 px-6 lg:px-20 bg-surface-50">
            <div class="text-center mb-10">
                <h2 class="text-4xl font-semibold mb-4">Empresas y activos</h2>
                <p class="text-xl text-gray-600">
                    Catálogo demo de empresas y remolcadores utilizados para estructurar las consultas del sistema.
                </p>
            </div>

            <div class="grid gap-6 max-w-6xl mx-auto md:grid-cols-2">
                @for (company of companies; track company.empresa) {
                    <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                        <h3 class="text-2xl font-semibold text-gray-900 mb-4">
                            {{ company.empresa }}
                        </h3>

                        <div class="flex flex-wrap gap-2">
                            @for (activo of company.activos; track activo) {
                                <span class="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                                    {{ activo }}
                                </span>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    `
})
export class Companieswidget {
    companies = companiesData;
}