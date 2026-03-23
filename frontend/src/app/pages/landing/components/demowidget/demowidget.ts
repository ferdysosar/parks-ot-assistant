import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'demo-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section
            id="demo"
            class="relative py-24 lg:py-28 px-6 lg:px-12 text-white overflow-hidden"
            style="
                background:
                    radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.08), transparent 25%),
                    radial-gradient(circle at 80% 30%, rgba(14, 165, 233, 0.08), transparent 22%),
                    linear-gradient(180deg, #07111f 0%, #0a1626 100%);
            "
        >
            <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>

            <div class="absolute inset-0 opacity-10 pointer-events-none">
                <div
                    class="absolute inset-0"
                    style="
                        background-image:
                            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                        background-size: 42px 42px;
                    "
                ></div>
            </div>

            <div class="relative z-10 max-w-6xl mx-auto">
                <div class="max-w-3xl mx-auto text-center">
                    <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm mb-6">
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        Flujo de consulta guiado
                    </div>

                    <p class="text-sm md:text-base uppercase tracking-[0.35em] text-cyan-300 font-semibold mb-4">
                        Interacción operativa · consulta rápida · respuesta estructurada
                    </p>

                    <h2
                        class="text-4xl md:text-5xl font-extrabold tracking-tight"
                        style="color: #ffffff;"
                    >
                        Ejemplo de uso
                    </h2>

                    <div class="mt-5 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

                    <p class="mt-6 text-lg leading-relaxed" style="color: #e2e8f0;">
                        Vista de ejemplo de cómo un usuario podría consultar información técnica
                        de una orden de trabajo dentro del sistema.
                    </p>
                </div>

                <div class="mt-14 max-w-4xl mx-auto">
                    <div class="rounded-[2rem] border border-white/10 bg-slate-950/70 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                            <div class="flex items-center gap-3">
                                <div class="flex gap-2">
                                    <span class="w-3 h-3 rounded-full bg-red-400/80"></span>
                                    <span class="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                                    <span class="w-3 h-3 rounded-full bg-green-400/80"></span>
                                </div>
                                <div class="text-sm text-slate-300">Simulación de consulta</div>
                            </div>

                            <div class="text-xs text-cyan-300 border border-cyan-400/20 px-3 py-1 rounded-full bg-cyan-400/5">
                                Demo conversacional
                            </div>
                        </div>

                        <div class="p-6 lg:p-8 space-y-5">
                            <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                                <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                                    Usuario
                                </div>
                                <p class="text-base md:text-lg leading-relaxed" style="color: #ffffff;">
                                    ¿Qué trabajos se realizaron en el barco Piero Jesús en marzo?
                                </p>
                            </div>

                            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                                <div class="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Asistente
                                </div>
                                <p class="text-base md:text-lg leading-relaxed" style="color: #f8fafc;">
                                    Se registró un mantenimiento correctivo en el sistema de CCTV.
                                    Se reemplazó una cámara IP y se verificó el cableado.
                                    Quedó pendiente monitoreo por 48 horas.
                                </p>
                            </div>

                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                        Tipo
                                    </div>
                                    <div class="mt-2 text-slate-200 text-sm">
                                        Mantenimiento correctivo
                                    </div>
                                </div>

                                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                        Sistema
                                    </div>
                                    <div class="mt-2 text-slate-200 text-sm">
                                        CCTV
                                    </div>
                                </div>

                                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                        Estado
                                    </div>
                                    <div class="mt-2 text-slate-200 text-sm">
                                        Monitoreo pendiente
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class DemoWidget {}