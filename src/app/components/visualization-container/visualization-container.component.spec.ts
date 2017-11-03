/* tslint:disable:no-unused-variable */

import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { StackedTimelineComponent } from '../stacked-timeline/stacked-timeline.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { VisualizationService } from '../../services/visualization.service';

import { ChartModule } from 'angular2-chartjs';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                BarChartComponent,
                DataTableComponent,
                DocumentViewerComponent,
                ExportControlComponent,
                FilterBuilderComponent,
                LegendComponent,
                LineChartComponent,
                MapComponent,
                ScatterPlotComponent,
                StackedTimelineComponent,
                TextCloudComponent,
                TimelineComponent,
                UnsharedFilterComponent,
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                WikiViewerComponent
            ],
            providers: [
                ActiveGridService,
                VisualizationService,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                ChartModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
