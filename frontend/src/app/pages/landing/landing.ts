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
        <hero-widget />
        <features-widget />
        <ots-widget />
        <footer-widget />
        <app-chat-widget></app-chat-widget>
    `
})
export class Landing {}
