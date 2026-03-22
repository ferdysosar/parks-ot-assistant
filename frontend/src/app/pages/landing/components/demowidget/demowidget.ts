import { Component } from '@angular/core';

@Component({
    selector: 'demo-widget',
    standalone: true,
    template: `
        <div id="demo" class="py-20 px-6 lg:px-20 text-center">
            <h2 class="text-4xl font-semibold mb-6">Ejemplo de uso</h2>

            <div class="max-w-3xl mx-auto bg-gray-100 p-6 rounded-xl text-left shadow">
                <div class="mb-4">
                    <strong>Usuario:</strong>
                    <p>¿Qué trabajos se realizaron en el barco Don Mauricio en marzo?</p>
                </div>

                <div>
                    <strong>Asistente:</strong>
                    <p>
                        Se registró un mantenimiento correctivo en el sistema de CCTV.
                        Se reemplazó una cámara IP y se verificó el cableado.
                        Quedó pendiente monitoreo por 48 horas.
                    </p>
                </div>
            </div>
        </div>
    `
})
export class DemoWidget {}