import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'hero-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="inicio"
      class="relative overflow-hidden min-h-screen flex items-center text-white pt-20"
      style="
        background:
          radial-gradient(circle at 18% 22%, rgba(56, 189, 248, 0.16), transparent 30%),
          radial-gradient(circle at 82% 28%, rgba(14, 165, 233, 0.16), transparent 26%),
          linear-gradient(135deg, #06101c 0%, #0a1728 45%, #0e2238 100%);
      "
    >
      <!-- Grilla técnica -->
      <div class="absolute inset-0 opacity-20 pointer-events-none">
        <div
          class="absolute inset-0"
          style="
            background-image:
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
            background-size: 40px 40px;
          "
        ></div>
      </div>

      <!-- Luces -->
      <div class="absolute -top-28 -left-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl"></div>
      <div class="absolute top-24 right-16 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

      <!-- Línea inferior -->
      <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

      <div class="relative z-10 w-full">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div class="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <!-- IZQUIERDA -->
            <div>
              <div class="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm shadow-lg shadow-cyan-500/10">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                Plataforma de consulta para operaciones y órdenes de trabajo
              </div>

              <div class="max-w-3xl">
                <p class="text-sm md:text-base uppercase tracking-[0.35em] text-cyan-300 font-semibold mb-4">
                  Entorno naval · gestión operativa · trazabilidad técnica
                </p>

                <h1 class="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_0_24px_rgba(34,211,238,0.10)]">
                  <span class="block text-white">
                    Parks OT Assistant
                  </span>
                </h1>

                <div class="mt-5 w-28 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

                <p class="mt-7 text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed">
                  Consultá órdenes de trabajo, embarcaciones, empresas, responsables,
                  materiales y observaciones desde una interfaz rápida, clara y pensada
                  para un contexto técnico real.
                </p>
              </div>

              <div class="mt-9 flex flex-col sm:flex-row gap-4">
                <a
                  href="#demo"
                  class="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  Ver demo
                </a>

                <a
                  href="#funciones"
                  class="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium transition"
                >
                  Explorar funciones
                </a>
              </div>

              <div class="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-lg">
                  <div class="text-3xl font-bold text-cyan-300">OTs</div>
                  <div class="text-sm text-slate-300 mt-2 leading-relaxed">
                    Consulta por activo, empresa o número de orden.
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-lg">
                  <div class="text-3xl font-bold text-cyan-300">Activos</div>
                  <div class="text-sm text-slate-300 mt-2 leading-relaxed">
                    Visualización de embarcaciones y unidades asociadas.
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-lg">
                  <div class="text-3xl font-bold text-cyan-300">Control</div>
                  <div class="text-sm text-slate-300 mt-2 leading-relaxed">
                    Fechas, responsables, materiales y observaciones.
                  </div>
                </div>
              </div>
            </div>

            <!-- DERECHA -->
            <div class="relative">
              <div class="absolute -inset-4 bg-cyan-400/10 blur-2xl rounded-[2rem]"></div>

              <div class="relative rounded-[2rem] border border-white/10 bg-slate-950/75 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                  <div class="flex items-center gap-3">
                    <div class="flex gap-2">
                      <span class="w-3 h-3 rounded-full bg-red-400/80"></span>
                      <span class="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                      <span class="w-3 h-3 rounded-full bg-green-400/80"></span>
                    </div>
                    <div class="text-sm text-slate-300">Centro de consulta operativa</div>
                  </div>

                  <div class="text-xs text-cyan-300 border border-cyan-400/20 px-3 py-1 rounded-full bg-cyan-400/5">
                    Entorno demo
                  </div>
                </div>

                <div class="p-5 lg:p-6 space-y-4">
                  <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                      Consulta
                    </div>
                    <div class="text-sm md:text-base text-white">
                      Mostrar órdenes de trabajo del activo
                      <span class="text-cyan-300 font-semibold">Aurora I</span>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                          Resultado
                        </div>
                        <div class="text-lg font-semibold text-white">
                          OT-001 · Mantenimiento preventivo
                        </div>
                      </div>

                      <div class="text-xs px-3 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 whitespace-nowrap">
                        Registrada
                      </div>
                    </div>

                    <div class="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                      <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                        <div class="text-slate-400">Empresa</div>
                        <div class="text-white mt-1">Río Norte Logística</div>
                      </div>

                      <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                        <div class="text-slate-400">Activo</div>
                        <div class="text-white mt-1">Aurora I</div>
                      </div>

                      <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                        <div class="text-slate-400">Ubicación</div>
                        <div class="text-white mt-1">Puerto de Asunción</div>
                      </div>

                      <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                        <div class="text-slate-400">Responsable</div>
                        <div class="text-white mt-1">Supervisor de taller</div>
                      </div>
                    </div>

                    <div class="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <div class="text-slate-400 text-sm">Trabajo realizado</div>
                      <div class="text-white text-sm mt-1">
                        Inspección general, ajuste de componentes y registro de observaciones operativas.
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <div class="text-cyan-300 font-bold text-lg">10+</div>
                      <div class="text-slate-400 text-xs mt-1">Empresas demo</div>
                    </div>

                    <div class="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <div class="text-cyan-300 font-bold text-lg">20+</div>
                      <div class="text-slate-400 text-xs mt-1">Activos demo</div>
                    </div>

                    <div class="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <div class="text-cyan-300 font-bold text-lg">OT</div>
                      <div class="text-slate-400 text-xs mt-1">Consulta guiada</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="hidden md:block absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-slate-900/85 backdrop-blur-xl p-4 shadow-xl max-w-xs">
                <div class="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">
                  Enfoque
                </div>
                <div class="text-sm text-slate-200 leading-relaxed">
                  Diseñado para mostrar información operativa de forma clara, útil y alineada a un entorno naval real.
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