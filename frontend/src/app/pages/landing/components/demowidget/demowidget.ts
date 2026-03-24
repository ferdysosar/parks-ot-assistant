import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import otsData from '../../../../../data/ots-demo.json';

type OTDemo = {
    ot_numero: string;
    empresa: string;
    activo: string;
    fecha: string;
    tipo: string;
    motivo: string;
    trabajo_realizado: string;
    materiales: string[];
    responsable: string;
    ubicacion: string;
    observaciones?: string;
};

@Component({
    selector: 'demo-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
                        Demo funcional
                    </h2>

                    <div class="mt-5 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

                    <p class="mt-6 text-lg leading-relaxed" style="color: #e2e8f0;">
                        Probá consultas simples por número de OT, empresa o activo utilizando
                        los registros demo cargados en el sistema.
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
                                Demo interactiva
                            </div>
                        </div>

                        <div class="p-6 lg:p-8">
                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                                <label class="block text-sm font-semibold mb-3" style="color: #ffffff;">
                                    Escribí una consulta
                                </label>

                                <div class="flex flex-col md:flex-row gap-3">
                                    <input
                                        [(ngModel)]="consulta"
                                        (keyup.enter)="consultar()"
                                        type="text"
                                        placeholder="Ej: OT-001, Aurora I o Río Norte Logística"
                                        class="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none"
                                        style="color: #ffffff;"
                                    />

                                    <button
                                        type="button"
                                        (click)="consultar()"
                                        class="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                                    >
                                        Consultar
                                    </button>
                                </div>

                                <div class="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        (click)="usarEjemplo('OT-001')"
                                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm hover:bg-cyan-400/15 transition"
                                    >
                                        OT-001
                                    </button>

                                    <button
                                        type="button"
                                        (click)="usarEjemplo('Aurora I')"
                                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm hover:bg-cyan-400/15 transition"
                                    >
                                        Aurora I
                                    </button>

                                    <button
                                        type="button"
                                        (click)="usarEjemplo('Río Norte Logística')"
                                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm hover:bg-cyan-400/15 transition"
                                    >
                                        Río Norte Logística
                                    </button>
                                </div>
                            </div>

                            <div class="mt-6 space-y-5">
                                <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                                    <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                                        Usuario
                                    </div>
                                    <p class="text-base md:text-lg leading-relaxed" style="color: #ffffff;">
                                        {{ consultaMostrada || 'Todavía no se realizó ninguna consulta.' }}
                                    </p>
                                </div>

                                <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <div class="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        Asistente
                                    </div>

                                    <p class="text-base leading-relaxed" style="color: #f8fafc;">
                                        {{ respuesta }}
                                    </p>
                                </div>

                                <div *ngIf="resultados.length > 0" class="grid gap-4">
                                    <article
                                        *ngFor="let ot of resultados"
                                        class="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
                                    >
                                        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div>
                                                <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                                                    {{ ot.ot_numero }}
                                                </div>
                                                <h3 class="text-2xl font-bold" style="color: #ffffff;">
                                                    {{ ot.activo }}
                                                </h3>
                                                <p class="mt-1" style="color: #cbd5e1;">
                                                    {{ ot.empresa }}
                                                </p>
                                            </div>

                                            <div class="inline-flex items-center px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm">
                                                {{ ot.tipo }}
                                            </div>
                                        </div>

                                        <div class="mt-5 grid md:grid-cols-2 gap-4">
                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Fecha
                                                </div>
                                                <div class="mt-2 text-slate-100">
                                                    {{ ot.fecha }}
                                                </div>
                                            </div>

                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Ubicación
                                                </div>
                                                <div class="mt-2 text-slate-100">
                                                    {{ ot.ubicacion }}
                                                </div>
                                            </div>

                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Motivo
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.motivo }}
                                                </div>
                                            </div>

                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Trabajo realizado
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.trabajo_realizado }}
                                                </div>
                                            </div>

                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Responsable
                                                </div>
                                                <div class="mt-2 text-slate-100">
                                                    {{ ot.responsable }}
                                                </div>
                                            </div>

                                            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Materiales
                                                </div>
                                                <div class="mt-2 text-slate-100">
                                                    {{ ot.materiales.join(', ') }}
                                                </div>
                                            </div>

                                            <div
                                                *ngIf="ot.observaciones"
                                                class="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2"
                                            >
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Observaciones
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.observaciones }}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class DemoWidget {
    ots: OTDemo[] = otsData as OTDemo[];

    consulta = '';
    consultaMostrada = '';
    respuesta =
        'Podés consultar por número de OT, por nombre de empresa o por nombre de activo.';
    resultados: OTDemo[] = [];

    usarEjemplo(valor: string): void {
        this.consulta = valor;
        this.consultar();
    }

    consultar(): void {
        const texto = this.consulta.trim();

        if (!texto) {
            this.consultaMostrada = '';
            this.resultados = [];
            this.respuesta = 'Escribí una consulta para buscar registros demo.';
            return;
        }

        this.consultaMostrada = texto;

        const textoNormalizado = this.normalizar(texto);

        const porNumero = this.ots.filter(
            (ot) => this.normalizar(ot.ot_numero) === textoNormalizado
        );

        if (porNumero.length > 0) {
            this.resultados = porNumero;
            this.respuesta = `Se encontró ${porNumero.length} orden de trabajo por número exacto.`;
            return;
        }

        const porActivo = this.ots.filter((ot) =>
            this.normalizar(ot.activo).includes(textoNormalizado)
        );

        if (porActivo.length > 0) {
            this.resultados = porActivo;
            this.respuesta = `Se encontraron ${porActivo.length} órdenes asociadas al activo consultado.`;
            return;
        }

        const porEmpresa = this.ots.filter((ot) =>
            this.normalizar(ot.empresa).includes(textoNormalizado)
        );

        if (porEmpresa.length > 0) {
            this.resultados = porEmpresa;
            this.respuesta = `Se encontraron ${porEmpresa.length} órdenes asociadas a la empresa consultada.`;
            return;
        }

        this.resultados = [];
        this.respuesta =
            'No se encontraron coincidencias en los registros demo. Probá con un número de OT, un activo o una empresa.';
    }

    normalizar(texto: string): string {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}