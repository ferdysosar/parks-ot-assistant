import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'features-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="funciones"
      class="relative py-24 lg:py-28 text-white overflow-hidden"
      style="
        background:
          radial-gradient(circle at 20% 10%, rgba(34, 211, 238, 0.10), transparent 25%),
          radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.10), transparent 22%),
          linear-gradient(180deg, #081321 0%, #0b1a2c 100%);
      "
    >
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div
          class="absolute inset-0"
          style="
            background-image:
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
            background-size: 42px 42px;
          "
        ></div>
      </div>

      <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
      <div class="absolute -top-16 left-10 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full"></div>
      <div class="absolute bottom-0 right-10 w-80 h-80 bg-sky-500/10 blur-3xl rounded-full"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div class="max-w-3xl mx-auto text-center">
          <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm mb-6">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Capacidades principales del sistema
          </div>

          <p class="text-sm md:text-base uppercase tracking-[0.35em] text-cyan-300 font-semibold mb-4">
            Consulta estructurada · historial técnico · trazabilidad operativa
          </p>

          <h2
            class="text-4xl md:text-5xl font-extrabold tracking-tight"
            style="color: #ffffff; text-shadow: 0 0 10px rgba(255,255,255,0.10);"
          >
            Funciones principales
          </h2>

          <div class="mt-5 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"></div>

          <p class="mt-6 text-lg leading-relaxed" style="color: #f8fafc;">
            Un enfoque pensado para consultar órdenes de trabajo con rapidez, contexto
            técnico y visibilidad clara sobre empresas, activos, responsables y materiales.
          </p>
        </div>

        <div class="mt-14 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 7h18M6 3h12v18H6z" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Consulta por empresa o activo
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Permite localizar órdenes de trabajo asociadas a una empresa, embarcación
              o unidad específica, reduciendo tiempos de búsqueda.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Historial de trabajos realizados
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Muestra intervenciones previas, fechas y antecedentes técnicos para dar
              continuidad a cada orden registrada.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-7.8 7.8L6 18l.9-3.9 7.8-7.8z" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Materiales y recursos utilizados
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Facilita identificar materiales, insumos y recursos aplicados en cada trabajo,
              mejorando control y trazabilidad técnica.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Consulta por fecha y ubicación
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Ayuda a ubicar órdenes según fecha, puerto, terminal o punto operativo
              donde se realizó la intervención.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Observaciones y pendientes
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Permite revisar novedades, hallazgos técnicos, seguimientos y pendientes
              asociados a cada orden de trabajo.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 shadow-xl hover:border-cyan-400/30 transition">
            <div class="w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <h3
              class="text-2xl font-bold"
              style="color: #ffffff; text-shadow: 0 0 8px rgba(255,255,255,0.08);"
            >
              Consultas en lenguaje natural
            </h3>

            <p class="mt-4 leading-relaxed" style="color: #e2e8f0;">
              Prepara la base para que el usuario consulte información de forma directa,
              como si estuviera conversando con un asistente operativo.
            </p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FeaturesWidget {}