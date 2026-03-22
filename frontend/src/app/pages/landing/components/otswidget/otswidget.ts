import { Component } from '@angular/core';
import otsData from '../../../../../data/ots-demo.json';

@Component({
    selector: 'ots-widget',
    standalone: true,
    template: `
        <div class="py-20 px-6 lg:px-20">
            <div class="text-center mb-10">
                <h2 class="text-4xl font-semibold mb-4">Órdenes de trabajo demo</h2>
                <p class="text-xl text-gray-600">
                    Ejemplos de registros estructurados que servirán como base para el asistente.
                </p>
            </div>

            <div class="grid gap-6 max-w-6xl mx-auto">
                @for (ot of ots.slice(0, 6); track ot.ot_numero) {
                    <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                        
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="text-sm text-gray-500">{{ ot.ot_numero }}</div>
                                <h3 class="text-xl font-semibold">{{ ot.activo }}</h3>
                                <p class="text-gray-600">{{ ot.empresa }}</p>
                            </div>
                            <div class="text-sm text-gray-500">
                                {{ ot.fecha }} · {{ ot.tipo }}
                            </div>
                        </div>

                        <div class="mt-4 text-gray-700">
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
            </div>
        </div>
    `
})
export class OtsWidget {
    ots = otsData;
}