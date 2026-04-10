import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetDto, CompanyDto, OtDto } from '@/app/core/data/ot-contracts';
import { LocalJsonOtDataSource } from '@/app/core/data/local-json-ot-data-source';
import { OT_DATA_SOURCE, OtDataSource } from '@/app/core/data/ot-data-source';

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

type EmpresaActivo = {
    empresa: string;
    activos: string[];
};

@Component({
    selector: 'ots-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <section
            id="ots"
            class="relative py-24 lg:py-28 px-6 lg:px-12 text-white overflow-hidden"
            style="
                background:
                    radial-gradient(circle at 18% 20%, rgba(34, 211, 238, 0.08), transparent 24%),
                    radial-gradient(circle at 82% 20%, rgba(14, 165, 233, 0.08), transparent 22%),
                    linear-gradient(180deg, #081321 0%, #0b1728 100%);
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
                <div class="max-w-3xl mx-auto text-center">
                    <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm mb-6">
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        Registros estructurados para consulta
                    </div>

                    <p class="text-sm md:text-base uppercase tracking-[0.35em] text-cyan-300 font-semibold mb-4">
                        Órdenes demo · filtros dinámicos · trazabilidad técnica
                    </p>

                    <h2
                        class="text-4xl md:text-5xl font-extrabold tracking-tight"
                        style="color: #ffffff;"
                    >
                        Ver OTs
                    </h2>

                    <div class="mt-5 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

                    <p class="mt-6 text-lg leading-relaxed" style="color: #e2e8f0;">
                        Consultá y navegá órdenes demo con filtros por empresa y activo,
                        en una vista única enfocada en operación.
                    </p>
                </div>

                <div class="mt-12 max-w-6xl mx-auto">
                    <div class="rounded-[2rem] border border-white/10 bg-slate-950/65 backdrop-blur-xl p-6 lg:p-7 shadow-2xl">
                        <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-4">
                            Estructura de empresas y activos
                        </div>

                        <div class="grid md:grid-cols-2 gap-4">
                            <article
                                *ngFor="let item of catalogoPreview"
                                class="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                                <h3 class="text-lg font-semibold text-white">{{ item.empresa }}</h3>

                                <div class="mt-3 flex flex-wrap gap-2">
                                    <span
                                        *ngFor="let activo of getActivosPreview(item.activos)"
                                        class="inline-flex items-center px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-xs"
                                    >
                                        {{ activo }}
                                    </span>

                                    <span
                                        *ngIf="item.activos.length > maxActivosVisibles"
                                        class="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-200 text-xs"
                                    >
                                        +{{ item.activos.length - maxActivosVisibles }} más
                                    </span>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>

                <div class="mt-14 max-w-5xl mx-auto">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl">
                            <label class="block text-sm font-semibold mb-3" style="color: #ffffff;">
                                Filtrar por empresa
                            </label>

                            <select
                                [(ngModel)]="empresaSeleccionada"
                                (ngModelChange)="onEmpresaChange()"
                                class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none"
                                style="color: #ffffff;"
                            >
                                <option value="">Todas las empresas</option>
                                <option *ngFor="let empresa of empresasUnicas" [value]="empresa">
                                    {{ empresa }}
                                </option>
                            </select>
                        </div>

                        <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl">
                            <label class="block text-sm font-semibold mb-3" style="color: #ffffff;">
                                Filtrar por activo
                            </label>

                            <select
                                [(ngModel)]="activoSeleccionado"
                                (ngModelChange)="onActivoChange()"
                                class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none"
                                style="color: #ffffff;"
                            >
                                <option value="">Todos los activos</option>
                                <option *ngFor="let activo of activosDisponibles" [value]="activo">
                                    {{ activo }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mt-12 max-w-6xl mx-auto">
                    <ng-container *ngIf="otsFiltradas.length > 0; else sinResultados">
                        <div class="flex items-center justify-center mb-6 gap-3">
                            <button
                                type="button"
                                (click)="anteriorGrupo()"
                                class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                                style="color: #ffffff;"
                            >
                                ←
                            </button>

                            <div class="text-sm tracking-[0.2em] uppercase text-cyan-300">
                                Vista rotativa
                            </div>

                            <button
                                type="button"
                                (click)="siguienteGrupo()"
                                class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                                style="color: #ffffff;"
                            >
                                →
                            </button>
                        </div>

                        <div class="relative min-h-[720px] lg:min-h-[650px]">
                            <div
                                class="grid lg:grid-cols-2 gap-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                [class.opacity-100]="animState === 'visible'"
                                [class.translate-x-0]="animState === 'visible'"
                                [class.opacity-0]="animState !== 'visible'"
                                [class.translate-x-6]="animState === 'next'"
                                [class.-translate-x-6]="animState === 'prev'"
                            >
                                <article
                                    *ngFor="let ot of otsVisibles"
                                    class="rounded-[2rem] border border-white/10 bg-slate-950/65 backdrop-blur-xl shadow-2xl overflow-hidden"
                                >
                                    <div class="flex flex-col gap-4 px-6 py-5 border-b border-white/10 bg-white/5">
                                        <div class="flex items-start justify-between gap-4">
                                            <div>
                                                <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                                                    {{ ot.ot_numero }}
                                                </div>
                                                <h3 class="text-3xl font-bold leading-tight" style="color: #ffffff;">
                                                    {{ ot.activo }}
                                                </h3>
                                                <p class="mt-2 text-base" style="color: #cbd5e1;">
                                                    {{ ot.empresa }}
                                                </p>
                                            </div>

                                            <div class="inline-flex items-center px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm whitespace-nowrap">
                                                {{ ot.tipo }}
                                            </div>
                                        </div>

                                        <div class="text-sm" style="color: #e2e8f0;">
                                            {{ ot.fecha }} · {{ ot.ubicacion }}
                                        </div>
                                    </div>

                                    <div class="p-6 lg:p-7">
                                        <div class="grid gap-4">
                                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Motivo
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.motivo }}
                                                </div>
                                            </div>

                                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Trabajo realizado
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.trabajo_realizado }}
                                                </div>
                                            </div>

                                            <div class="grid sm:grid-cols-2 gap-4">
                                                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                        Responsable
                                                    </div>
                                                    <div class="mt-2 text-slate-100 leading-relaxed">
                                                        {{ ot.responsable }}
                                                    </div>
                                                </div>

                                                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                        Materiales
                                                    </div>
                                                    <div class="mt-2 text-slate-100 leading-relaxed">
                                                        {{ ot.materiales.join(', ') }}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                *ngIf="ot.observaciones"
                                                class="rounded-2xl border border-white/10 bg-white/5 p-4"
                                            >
                                                <div class="text-cyan-300 text-sm font-semibold uppercase tracking-wider">
                                                    Observaciones
                                                </div>
                                                <div class="mt-2 text-slate-100 leading-relaxed">
                                                    {{ ot.observaciones }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </ng-container>

                    <ng-template #sinResultados>
                        <div class="rounded-[2rem] border border-white/10 bg-slate-950/65 backdrop-blur-xl p-10 text-center shadow-2xl">
                            <div class="text-cyan-300 text-sm font-semibold uppercase tracking-[0.25em] mb-3">
                                Sin resultados
                            </div>
                            <h3 class="text-2xl font-bold mb-3" style="color: #ffffff;">
                                No se encontraron órdenes para ese filtro
                            </h3>
                            <p style="color: #cbd5e1;">
                                Probá cambiando la empresa o el activo para visualizar otros registros demo.
                            </p>
                        </div>
                    </ng-template>
                </div>
            </div>
        </section>
    `
})
export class OtsWidget implements OnInit, OnDestroy {
    ots: OTDemo[] = [];
    catalogo: EmpresaActivo[] = [];
    maxEmpresasVisibles = 6;
    maxActivosVisibles = 4;

    empresaSeleccionada = '';
    activoSeleccionado = '';

    empresasUnicas: string[] = [];
    activosDisponibles: string[] = [];

    otsVisibles: OTDemo[] = [];
    indiceActual = 0;
    cantidadVisible = 2;
    animState: 'visible' | 'next' | 'prev' = 'visible';

    private intervaloId: ReturnType<typeof setInterval> | null = null;
    private timeoutSalidaId: ReturnType<typeof setTimeout> | null = null;

    constructor(
        @Optional() @Inject(OT_DATA_SOURCE) dataSource: OtDataSource | null = null
    ) {
        const resolvedDataSource = dataSource ?? new LocalJsonOtDataSource();
        const snapshot = resolvedDataSource.getChatSnapshot();

        this.ots = snapshot.ots.map((item) => this.mapOtDtoToDemo(item));
        this.catalogo = this.buildCompanyAssets(snapshot.companies, snapshot.assets);
        this.empresasUnicas = this.catalogo.map((item) => item.empresa);
        this.actualizarActivosDisponibles();
    }

    ngOnInit(): void {
        this.actualizarOtsVisibles();
        this.iniciarRotacion();
    }

    ngOnDestroy(): void {
        if (this.intervaloId) clearInterval(this.intervaloId);
        if (this.timeoutSalidaId) clearTimeout(this.timeoutSalidaId);
    }

    get otsFiltradas(): OTDemo[] {
        return this.ots.filter((ot) => {
            const coincideEmpresa = !this.empresaSeleccionada || ot.empresa === this.empresaSeleccionada;
            const coincideActivo = !this.activoSeleccionado || ot.activo === this.activoSeleccionado;
            return coincideEmpresa && coincideActivo;
        });
    }

    get catalogoPreview(): EmpresaActivo[] {
        return this.catalogo.slice(0, this.maxEmpresasVisibles);
    }

    getActivosPreview(activos: string[]): string[] {
        return activos.slice(0, this.maxActivosVisibles);
    }

    onEmpresaChange(): void {
        this.activoSeleccionado = '';
        this.actualizarActivosDisponibles();
        this.reiniciarRotacion();
    }

    onActivoChange(): void {
        this.reiniciarRotacion();
    }

    actualizarActivosDisponibles(): void {
        if (!this.empresaSeleccionada) {
            this.activosDisponibles = this.catalogo.flatMap((item) => item.activos);
            return;
        }

        const empresa = this.catalogo.find((item) => item.empresa === this.empresaSeleccionada);
        this.activosDisponibles = empresa ? empresa.activos : [];
    }

    actualizarOtsVisibles(): void {
        const lista = this.otsFiltradas;

        if (lista.length === 0) {
            this.otsVisibles = [];
            return;
        }

        const visibles = lista.slice(this.indiceActual, this.indiceActual + this.cantidadVisible);

        if (visibles.length < this.cantidadVisible) {
            this.otsVisibles = [
                ...visibles,
                ...lista.slice(0, this.cantidadVisible - visibles.length)
            ];
            return;
        }

        this.otsVisibles = visibles;
    }

    avanzarGrupo(direccion: 'next' | 'prev', reiniciarTimer = false): void {
        if (this.otsFiltradas.length <= this.cantidadVisible) return;

        this.ejecutarTransicion(direccion, () => {
            if (direccion === 'next') {
                this.indiceActual = (this.indiceActual + this.cantidadVisible) % this.otsFiltradas.length;
            } else {
                const total = this.otsFiltradas.length;
                this.indiceActual = (this.indiceActual - this.cantidadVisible + total) % total;
            }

            this.actualizarOtsVisibles();
        });

        if (reiniciarTimer) {
            this.reiniciarIntervalo();
        }
    }

    siguienteGrupo(): void {
        this.avanzarGrupo('next', true);
    }

    anteriorGrupo(): void {
        this.avanzarGrupo('prev', true);
    }

    iniciarRotacion(): void {
        this.intervaloId = setInterval(() => {
            if (this.otsFiltradas.length > this.cantidadVisible) {
                this.avanzarGrupo('next', false);
            }
        }, 5000);
    }

    reiniciarIntervalo(): void {
        if (this.intervaloId) clearInterval(this.intervaloId);
        this.iniciarRotacion();
    }

    reiniciarRotacion(): void {
        this.indiceActual = 0;
        this.actualizarOtsVisibles();
        this.animState = 'visible';
        this.reiniciarIntervalo();
    }

    ejecutarTransicion(direccion: 'next' | 'prev', callback: () => void): void {
        if (this.timeoutSalidaId) clearTimeout(this.timeoutSalidaId);

        this.animState = direccion;

        this.timeoutSalidaId = setTimeout(() => {
            callback();
            this.animState = 'visible';
        }, 260);
    }

    private mapOtDtoToDemo(item: OtDto): OTDemo {
        return {
            ot_numero: item.otNumber,
            empresa: item.companyName,
            activo: item.assetName,
            fecha: item.workDate,
            tipo: item.workType,
            motivo: item.reason,
            trabajo_realizado: item.workPerformed,
            materiales: item.materials,
            responsable: item.responsible,
            ubicacion: item.location,
            observaciones: item.observations ?? undefined
        };
    }

    private buildCompanyAssets(companies: CompanyDto[], assets: AssetDto[]): EmpresaActivo[] {
        return companies.map((company) => ({
            empresa: company.name,
            activos: assets
                .filter((asset) => asset.companyId === company.id)
                .map((asset) => asset.name)
        }));
    }
}
