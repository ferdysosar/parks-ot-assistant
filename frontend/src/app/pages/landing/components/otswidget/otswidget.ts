import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import otsData from '../../../../../data/ots-demo.json';
import companiesData from '../../../../../data/empresas-activos.json';

@Component({
    selector: 'ots-widget',
    standalone: true,
    imports: [FormsModule],
    template: `
        <div class="py-20 px-6 lg:px-20">
            <div class="text-center mb-10">
                <h2 class="text-4xl font-semibold mb-4">Órdenes de trabajo demo</h2>
                <p class="text-xl text-gray-600">
                    Ejemplos de registros estructurados que servirán como base para el asistente.
                </p>
            </div>

            <div class="max-w-6xl mx-auto mb-8">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por empresa
                </label>
                <select
                    class="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 shadow-sm"
                    [(ngModel)]="selectedEmpresa"
                    (change)="selectedActivo = ''"
                >
                    <option value="">Todas las empresas</option>
                    @for (empresa of empresas; track empresa) {
                        <option [value]="empresa">{{ empresa }}</option>
                    }
                </select>

                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Filtrar por activo
                    </label>

                    <select
                        class="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 shadow-sm"
                        [(ngModel)]="selectedActivo"
                        [disabled]="!selectedEmpresa"
                    >
                        <option value="">Todos los activos</option>

                        @for (activo of activos; track activo) {
                            <option [value]="activo">{{ activo }}</option>
                        }
                    </select>
                </div>
            </div>

            <div class="grid gap-6 max-w-6xl mx-auto">
                @if (filteredOts.length > 0) {
                    @for (ot of filteredOts.slice(0, 6); track ot.ot_numero) {
                        <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                            <div class="flex justify-between items-start gap-4 flex-col md:flex-row">
                                <div>
                                    <div class="text-sm text-gray-500">{{ ot.ot_numero }}</div>
                                    <h3 class="text-xl font-semibold">{{ ot.activo }}</h3>
                                    <p class="text-gray-600">{{ ot.empresa }}</p>
                                </div>
                                <div class="text-sm text-gray-500">
                                    {{ ot.fecha }} · {{ ot.tipo }}
                                </div>
                            </div>

                            <div class="mt-4 text-gray-700 space-y-2">
                                <p><strong>Motivo:</strong> {{ ot.motivo }}</p>
                                <p><strong>Trabajo:</strong> {{ ot.trabajo_realizado }}</p>
                                <p><strong>Ubicación:</strong> {{ ot.ubicacion }}</p>
                                <p><strong>Responsable:</strong> {{ ot.responsable }}</p>
                                <p>
                                    <strong>Materiales:</strong>
                                    {{ ot.materiales.length ? ot.materiales.join(', ') : 'Sin materiales' }}
                                </p>
                            </div>
                        </div>
                    }
                } @else {
                    <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
                        No hay órdenes de trabajo registradas para ese filtro.
                    </div>
                }
            </div>
        </div>
    `
})
export class OtsWidget {
    ots = otsData;
    companies = companiesData;

    selectedEmpresa = '';
    selectedActivo = '';

    empresas = this.companies.map((company) => company.empresa);

    get activos() {
        if (!this.selectedEmpresa) {
            return [];
        }

        const company = this.companies.find(
            (company) => company.empresa === this.selectedEmpresa
        );

        return company ? company.activos : [];
    }

    get filteredOts() {
        return this.ots.filter((ot) => {
            const matchEmpresa = this.selectedEmpresa
                ? ot.empresa === this.selectedEmpresa
                : true;

            const matchActivo = this.selectedActivo
                ? ot.activo === this.selectedActivo
                : true;

            return matchEmpresa && matchActivo;
        });
    }
}