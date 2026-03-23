import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import empresasActivos from '../../../../../data/empresas-activos.json';

type EmpresaActivo = {
    empresa: string;
    activos: string[];
};

@Component({
    selector: 'companies-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section
            class="relative py-24 lg:py-28 px-6 lg:px-12 text-white overflow-hidden"
            style="
                background:
                    radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.08), transparent 24%),
                    radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.08), transparent 22%),
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

            <div class="relative z-10 max-w-7xl mx-auto">
                <!-- encabezado -->
                <div class="max-w-3xl mx-auto text-center">
                    <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm mb-6">
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        Catálogo estructural del sistema
                    </div>

                    <p class="text-sm md:text-base uppercase tracking-[0.35em] text-cyan-300 font-semibold mb-4">
                        Empresas demo · activos asociados · estructura de consulta
                    </p>

                    <h2
                        class="text-4xl md:text-5xl font-extrabold tracking-tight"
                        style="color: #ffffff;"
                    >
                        Empresas y activos
                    </h2>

                    <div class="mt-5 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

                    <p class="mt-6 text-lg leading-relaxed" style="color: #e2e8f0;">
                        Base de referencia utilizada para estructurar la navegación entre empresas,
                        embarcaciones y registros de órdenes dentro del asistente.
                    </p>
                </div>

                <!-- grid empresas -->
                <div class="mt-14 grid md:grid-cols-2 gap-6">
                    <article
                        *ngFor="let item of catalogo"
                        class="rounded-[2rem] border border-white/10 bg-slate-950/65 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                        <div class="px-6 py-5 border-b border-white/10 bg-white/5">
                            <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                                Empresa demo
                            </div>

                            <h3
                                class="text-3xl font-bold leading-tight"
                                style="color: #ffffff;"
                            >
                                {{ item.empresa }}
                            </h3>
                        </div>

                        <div class="p-6">
                            <div class="text-sm font-semibold mb-4" style="color: #cbd5e1;">
                                Activos asociados
                            </div>

                            <div class="flex flex-wrap gap-3">
                                <span
                                    *ngFor="let activo of item.activos"
                                    class="inline-flex items-center px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm"
                                >
                                    {{ activo }}
                                </span>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    `
})
export class Companieswidget {
    catalogo: EmpresaActivo[] = empresasActivos as EmpresaActivo[];
}