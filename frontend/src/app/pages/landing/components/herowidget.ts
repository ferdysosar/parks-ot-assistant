import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'hero-widget',
    imports: [ButtonModule, RippleModule],
    template: `
        <div
            id="hero"
            class="flex flex-col lg:flex-row items-center pt-6 px-6 lg:px-20 overflow-hidden gap-10"
            style="background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, rgb(238, 239, 175) 0%, rgb(195, 227, 250) 100%); clip-path: ellipse(180% 100% at 50% 0%)"
        >
            <div class="mx-6 md:mx-20 mt-0 md:mt-6 lg:w-1/2">
                <h1 class="text-6xl font-bold text-gray-900 leading-tight dark:!text-gray-700">
                    <span class="font-light block">Parks OT Assistant</span>
                    Consulta órdenes de trabajo en segundos
                </h1>
                <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700 dark:text-gray-700">
                    Asistente conversacional para consultar trabajos realizados, materiales utilizados, responsables, fechas y ubicaciones de embarcaciones y activos.
                </p>
                <button
                    pButton
                    pRipple
                    [rounded]="true"
                    type="button"
                    label="Ver demo"
                    class="text-xl! mt-8 px-4!"
                    (click)="scrollToDemo()"
                ></button>
            </div>

            <div class="lg:w-1/2 w-full flex justify-center mb-10">
                <div class="bg-white shadow-2xl rounded-2xl p-4 w-full max-w-xl border border-gray-200">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                        <div>
                            <div class="font-semibold text-gray-900">Parks OT Assistant</div>
                            <div class="text-sm text-gray-500">Consulta simulada</div>
                        </div>
                        <div class="text-green-600 text-sm font-medium">En línea</div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-end">
                            <div class="bg-green-100 text-gray-800 px-4 py-3 rounded-2xl rounded-br-sm max-w-xs shadow-sm">
                                ¿Qué trabajos se realizaron en el remolcador Aurora I?
                            </div>
                        </div>

                        <div class="flex justify-start">
                            <div class="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm max-w-md shadow-sm">
                                Se registró una inspección preventiva del sistema eléctrico y una verificación del cableado principal.
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <div class="bg-green-100 text-gray-800 px-4 py-3 rounded-2xl rounded-br-sm max-w-xs shadow-sm">
                                ¿Qué materiales se utilizaron?
                            </div>
                        </div>

                        <div class="flex justify-start">
                            <div class="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm max-w-md shadow-sm">
                                Se utilizaron terminales eléctricas, cinta aisladora industrial y 12 metros de cable marino.
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                        <div class="bg-gray-50 rounded-xl px-4 py-3 text-gray-400 text-sm">
                            Escribí una consulta sobre una orden de trabajo...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class HeroWidget {
    scrollToDemo() {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    }
}