import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import otsData from '../../../data/ots-demo.json';

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

type Mensaje = {
    tipo: 'user' | 'bot';
    texto: string;
};

@Component({
    selector: 'chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <!-- BOTÓN FLOTANTE -->
        <button
            type="button"
            (click)="toggleChat()"
            class="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-2xl z-[999] flex items-center justify-center transition"
            aria-label="Abrir chat"
        >
            <span class="text-2xl">💬</span>
        </button>

        <!-- PANEL CHAT -->
        <div
            *ngIf="abierto"
            class="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-[999] overflow-hidden flex flex-col"
        >
            <!-- HEADER -->
            <div class="px-4 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                    <div class="text-white font-bold">Asistente OT</div>
                    <div class="text-xs text-cyan-300 mt-1">Consulta demo dentro de la landing</div>
                </div>

                <button
                    type="button"
                    (click)="toggleChat()"
                    class="w-10 h-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
                >
                    ✕
                </button>
            </div>

            <!-- MENSAJES -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div
                    *ngFor="let msg of mensajes"
                    class="flex"
                    [class.justify-end]="msg.tipo === 'user'"
                    [class.justify-start]="msg.tipo === 'bot'"
                >
                    <div
                        class="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow"
                        [ngClass]="msg.tipo === 'user'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-white/10 text-white border border-white/10'"
                    >
                        {{ msg.texto }}
                    </div>
                </div>
            </div>

            <!-- EJEMPLOS -->
            <div class="px-4 pt-2 pb-3 border-t border-white/10 bg-white/[0.03]">
                <div class="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Ejemplos
                </div>

                <div class="flex flex-wrap gap-2">
                    <button
                        type="button"
                        (click)="usarEjemplo('OT-001')"
                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-xs hover:bg-cyan-400/15 transition"
                    >
                        OT-001
                    </button>

                    <button
                        type="button"
                        (click)="usarEjemplo('Aurora I')"
                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-xs hover:bg-cyan-400/15 transition"
                    >
                        Aurora I
                    </button>

                    <button
                        type="button"
                        (click)="usarEjemplo('Río Norte Logística')"
                        class="px-3 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-xs hover:bg-cyan-400/15 transition"
                    >
                        Río Norte
                    </button>
                </div>
            </div>

            <!-- INPUT -->
            <div class="p-4 border-t border-white/10 bg-slate-950">
                <div class="flex gap-2">
                    <input
                        [(ngModel)]="input"
                        (keyup.enter)="enviar()"
                        type="text"
                        placeholder="Ej: OT-001, Aurora I, Río Norte..."
                        class="flex-1 px-4 py-3 rounded-2xl border border-white/10 bg-slate-900 text-white outline-none"
                    />

                    <button
                        type="button"
                        (click)="enviar()"
                        class="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    `
})
export class ChatWidget {
    abierto = false;
    input = '';

    mensajes: Mensaje[] = [
        {
            tipo: 'bot',
            texto: 'Hola. Podés consultar por número de OT, empresa o activo. Ejemplos: OT-001, Aurora I, Río Norte Logística.'
        }
    ];

    ots: OTDemo[] = otsData as OTDemo[];

    toggleChat(): void {
        this.abierto = !this.abierto;
    }

    usarEjemplo(valor: string): void {
        this.input = valor;
        this.enviar();
    }

    enviar(): void {
        const texto = this.input.trim();
        if (!texto) return;

        this.mensajes.push({ tipo: 'user', texto });

        const respuesta = this.buscar(texto);

        this.mensajes.push({ tipo: 'bot', texto: respuesta });

        this.input = '';
    }

    buscar(query: string): string {
        const q = this.normalizar(query);

        const porNumero = this.ots.find(
            (ot) => this.normalizar(ot.ot_numero) === q
        );

        if (porNumero) {
            return `${porNumero.ot_numero}: ${porNumero.activo} · ${porNumero.empresa} · ${porNumero.tipo} · ${porNumero.fecha}.`;
        }

        const porActivo = this.ots.filter((ot) =>
            this.normalizar(ot.activo).includes(q)
        );

        if (porActivo.length > 0) {
            const resumen = porActivo
                .slice(0, 3)
                .map((ot) => `${ot.ot_numero} - ${ot.activo} (${ot.tipo})`)
                .join(' | ');

            return `Encontré ${porActivo.length} OT(s) para ese activo. ${resumen}`;
        }

        const porEmpresa = this.ots.filter((ot) =>
            this.normalizar(ot.empresa).includes(q)
        );

        if (porEmpresa.length > 0) {
            const resumen = porEmpresa
                .slice(0, 3)
                .map((ot) => `${ot.ot_numero} - ${ot.activo} (${ot.tipo})`)
                .join(' | ');

            return `Encontré ${porEmpresa.length} OT(s) para esa empresa. ${resumen}`;
        }

        return 'No encontré resultados en los registros demo. Probá con un número de OT, una empresa o un activo.';
    }

    normalizar(texto: string): string {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}