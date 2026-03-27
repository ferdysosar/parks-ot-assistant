import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { OtsWidget } from './components/otswidget/otswidget';
import { FooterWidget } from './components/footerwidget';
import { ChatWidget } from '../../shared/chat-widget/chat-widget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        TopbarWidget,
        HeroWidget,
        FeaturesWidget,
        OtsWidget,
        FooterWidget,
        ChatWidget
    ],
    template: `
        <topbar-widget />

        <main id="contenido-principal" role="main">
            <section aria-label="Presentación principal">
                <hero-widget />
            </section>

            <section aria-label="Funciones del asistente">
                <features-widget />
            </section>

            <section aria-label="Consulta de órdenes de trabajo">
                <ots-widget />
            </section>
        </main>

        <footer-widget />
        <app-chat-widget></app-chat-widget>
    `
})
export class Landing {}