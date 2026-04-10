import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule],
    template: `
        <section
            class="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-10"
            style="
                background:
                    radial-gradient(circle at 16% 22%, rgba(34, 211, 238, 0.24), transparent 34%),
                    radial-gradient(circle at 82% 24%, rgba(56, 189, 248, 0.2), transparent 30%),
                    linear-gradient(125deg, #040a12 0%, #081523 44%, #0d2338 100%);
            "
        >
            <div class="absolute inset-0 bg-slate-950/45"></div>
            <div class="absolute -top-24 -left-20 w-96 h-96 bg-cyan-400/14 rounded-full blur-3xl"></div>
            <div class="absolute bottom-12 right-8 w-80 h-80 bg-sky-400/12 rounded-full blur-3xl"></div>

            <div class="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl p-8 sm:p-12 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200 mb-5">
                    <i class="pi pi-exclamation-triangle text-2xl"></i>
                </div>

                <p class="text-cyan-200 text-sm uppercase tracking-[0.2em] mb-3">Error 404</p>
                <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">Página no encontrada</h1>
                <p class="text-slate-200 text-base sm:text-lg leading-relaxed mb-8">
                    La ruta que buscás no existe o fue movida. Volvé al inicio de Parks OT Assistant para continuar con tu consulta de OTs.
                </p>

                <a
                    routerLink="/"
                    class="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold transition shadow-xl shadow-cyan-500/25"
                >
                    Volver al inicio
                </a>
            </div>
        </section>
    `
})
export class Notfound {}
