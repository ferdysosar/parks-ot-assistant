import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { DemoWidget } from './components/demowidget/demowidget';
import { OtsWidget } from './components/otswidget/otswidget';
import { Companieswidget } from './components/companieswidget/companieswidget';
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
        DemoWidget,
        OtsWidget,
        Companieswidget,
        FooterWidget,
        ChatWidget
    ],
    template: `
        <topbar-widget />
        <hero-widget />
        <features-widget />
        <demo-widget />
        <ots-widget />
        <companies-widget />
        <footer-widget />
        <chat-widget />
    `
})
export class Landing {}