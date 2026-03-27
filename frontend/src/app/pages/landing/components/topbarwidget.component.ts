import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'topbar-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      class="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      [ngClass]="scrolled
        ? 'bg-slate-950/85 backdrop-blur-xl border-b border-cyan-400/10 shadow-lg'
        : 'bg-slate-950/55 backdrop-blur-md border-b border-white/5'"
    >
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="h-20 flex items-center justify-between">
          <!-- Marca -->
          <a href="#inicio" class="flex items-center gap-4 group">
            <div
              class="w-11 h-11 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/20 to-sky-500/10 flex items-center justify-center shadow-lg shadow-cyan-500/10"
            >
              <svg
                class="w-6 h-6 text-cyan-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 17c3.5-2 6.5-2 10 0s6.5 2 8 1" />
                <path d="M5 14c2.8-1.5 5.2-1.5 8 0 2.8 1.5 5.2 1.5 8 0" />
                <path d="M7 11c1.9-1 3.7-1 5.5 0s3.6 1 5.5 0" />
              </svg>
            </div>

            <div class="leading-tight">
              <div class="text-white font-semibold text-xl tracking-tight group-hover:text-cyan-300 transition">
                Parks OT Assistant
              </div>
              <div class="text-[11px] uppercase tracking-[0.28em] text-slate-300">
                Parks Ingeniería · Operación naval
              </div>
            </div>
          </a>

          <!-- Menú -->
          <nav class="hidden md:flex items-center gap-2">
            <a
              href="#inicio"
              class="px-4 py-2 rounded-xl text-sm text-slate-200 hover:text-white hover:bg-white/5 transition"
            >
              Inicio
            </a>

            <a
              href="#funciones"
              class="px-4 py-2 rounded-xl text-sm text-slate-200 hover:text-white hover:bg-white/5 transition"
            >
              Funciones
            </a>

            <a
              href="#ots"
              class="ml-2 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-cyan-300/35 bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-100 font-semibold text-sm transition shadow-md shadow-cyan-500/15"
            >
              Ver OTs
            </a>
          </nav>
        </div>
      </div>
    </header>
  `
})
export class TopbarWidget {
  scrolled = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrolled = window.scrollY > 20;
  }
}
