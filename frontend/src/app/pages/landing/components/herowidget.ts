import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'hero-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="inicio"
      class="relative overflow-hidden min-h-[90vh] flex items-center text-white pt-16"
      style="
        background:
          radial-gradient(circle at 16% 22%, rgba(34, 211, 238, 0.24), transparent 34%),
          radial-gradient(circle at 82% 24%, rgba(56, 189, 248, 0.20), transparent 30%),
          linear-gradient(125deg, #040a12 0%, #081523 44%, #0d2338 100%);
      "
    >
      <div class="absolute inset-0 opacity-15 pointer-events-none">
        <div
          class="absolute inset-0"
          style="
            background-image:
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
            background-size: 46px 46px;
          "
        ></div>
      </div>

      <div class="absolute inset-0 bg-slate-950/38"></div>
      <div class="absolute -top-24 -left-20 w-96 h-96 bg-cyan-400/14 rounded-full blur-3xl"></div>
      <div class="absolute top-24 right-10 w-[28rem] h-[28rem] bg-sky-400/12 rounded-full blur-3xl"></div>
      <div class="absolute bottom-14 left-[22%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
      <div class="absolute right-[8%] top-[20%] w-48 h-48 rounded-full border border-cyan-300/20 opacity-30"></div>
      <div class="absolute right-[10%] top-[23%] w-32 h-32 rounded-full border border-cyan-300/20 opacity-35"></div>

      <div class="relative z-10 w-full">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
          <div class="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-12 items-center">
            <div class="relative">
              <div class="absolute -inset-x-6 -inset-y-8 rounded-[2.5rem] bg-slate-950/82 border border-white/12 ring-1 ring-white/8"></div>

              <div class="relative">
                <div class="inline-flex items-center gap-3 mb-5 px-4 py-2 rounded-full border border-cyan-300/35 bg-cyan-400/12 text-cyan-100 text-sm shadow-lg shadow-cyan-500/10">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                Parks Ingeniería · Soluciones navales
                </div>

                <h1 class="text-6xl md:text-8xl xl:text-[6.6rem] font-black leading-[0.86] tracking-tight text-white" style="color: #ffffff;">
                  Consulta de órdenes de trabajo navales
                </h1>

                <div class="mt-5 w-36 h-1.5 rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-500"></div>

                <p class="mt-6 text-lg md:text-[1.32rem] text-slate-50 max-w-2xl leading-relaxed" style="color: #f8fafc;">
                  Accedé a OTs por número, empresa, activo o fecha desde una interfaz clara y orientada a la operación.
                </p>

                <div class="mt-7 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#ots"
                    class="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold transition shadow-xl shadow-cyan-500/30"
                  >
                    Ir a Ver OTs
                  </a>

                  <a
                    href="#funciones"
                    class="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/20 bg-white/8 hover:bg-white/12 text-white font-semibold transition"
                  >
                    Explorar funciones
                  </a>
                </div>

                <div class="mt-8 grid sm:grid-cols-3 gap-3 max-w-3xl">
                  <div class="rounded-2xl bg-slate-900/45 border border-white/10 px-4 py-3">
                    <div class="text-cyan-200 text-xs uppercase tracking-[0.2em]">Consulta</div>
                    <div class="text-white text-sm mt-1">OT, empresa, activo</div>
                  </div>
                  <div class="rounded-2xl bg-slate-900/45 border border-white/10 px-4 py-3">
                    <div class="text-cyan-200 text-xs uppercase tracking-[0.2em]">Tiempo</div>
                    <div class="text-white text-sm mt-1">Respuesta inmediata</div>
                  </div>
                  <div class="rounded-2xl bg-slate-900/45 border border-white/10 px-4 py-3">
                    <div class="text-cyan-200 text-xs uppercase tracking-[0.2em]">Cobertura</div>
                    <div class="text-white text-sm mt-1">Historial técnico OT</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="relative">
              <div class="absolute -inset-4 rounded-[2rem] bg-cyan-400/10 blur-2xl"></div>
              <div class="relative rounded-[2rem] border border-white/12 bg-slate-950/62 backdrop-blur-xl shadow-xl overflow-hidden">
                <div class="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-2.5 h-2.5 rounded-full bg-cyan-300"></span>
                    <span class="text-slate-100 text-sm font-semibold">Consola Operativa OT</span>
                  </div>
                  <span class="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Tiempo real</span>
                </div>

                <div class="p-5 space-y-4">
                  <div class="rounded-xl bg-slate-900/55 px-4 py-3 border border-white/8">
                    <div class="text-[11px] uppercase tracking-[0.14em] text-cyan-200 mb-1">Consulta sugerida</div>
                    <div class="text-slate-100 text-sm">últimas 5 del aurora</div>
                  </div>

                  <div class="rounded-xl bg-slate-900/45 px-4 py-3 border border-white/8">
                    <div class="flex items-center justify-between text-xs text-slate-300 mb-2">
                      <span>Estado de registros</span>
                      <span class="text-emerald-300">Sincronizado</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div class="h-full w-[78%] bg-gradient-to-r from-cyan-400 to-sky-400"></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-slate-900/45 px-4 py-3 border border-white/8">
                      <div class="text-cyan-200 text-[11px] uppercase tracking-[0.14em]">Empresa</div>
                      <div class="text-slate-100 text-sm mt-1">Río Norte</div>
                    </div>
                    <div class="rounded-xl bg-slate-900/45 px-4 py-3 border border-white/8">
                      <div class="text-cyan-200 text-[11px] uppercase tracking-[0.14em]">Activo</div>
                      <div class="text-slate-100 text-sm mt-1">Aurora I</div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-slate-900/45 px-4 py-3 border border-white/8">
                    <div class="text-cyan-200 text-[11px] uppercase tracking-[0.14em] mb-2">Líneas rápidas</div>
                    <div class="space-y-2 text-sm text-slate-200">
                      <div>• qué OTs hubo en marzo 2025</div>
                      <div>• qué OTs se hicieron el 26/03/2026</div>
                      <div>• del 2025</div>
                    </div>
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
export class HeroWidget {}
