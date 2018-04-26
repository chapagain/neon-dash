/*
 * Copyright 2017 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { async, ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpModule, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { Injector } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { DatasetMock } from '../../../testUtils/MockServices/DatasetMock';

/*describe('Component: ThumbnailGrid', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ThumbnailGridComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ExportService,
                ErrorNotificationService,
                FilterService,
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                // Mock for testing Http
                { provide: XHRBackend, useClass: MockBackend }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('does have expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            id: '',
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            typeField: new FieldMetaData(),
            documentArray: [],
            documentType: '',
            url: ''
        });
    }));

    it('createQuery does return expected query', (() => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.id = 'testId';
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';
        component.active.typeField.columnName = 'testTypeField';

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testLinkField', 'testTypeField', 'testIdField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.createQuery()).toEqual(query);
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');
        component.showMedia = false;
        expect(component.getButtonText()).toBe('No Data');
        component.showMedia = true;
        component.active.url = 'https://test.com';
        expect(component.getButtonText()).toBe('');
        component.active.documentArray = ['a'];
        component.active.url = '';
        expect(component.getButtonText()).toBe('Total Files 1');
        component.active.documentArray = ['a', 'b', 'c', 'd'];
        expect(component.getButtonText()).toBe('Total Files 4');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getExportFields does return expected array', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.idField.prettyName = 'Test ID Field';
        component.active.linkField.columnName = 'testLinkField';
        component.active.linkField.prettyName = 'Test Link Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testIdField',
            prettyName: 'Test ID Field'
        }, {
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        }]);
    }));

    it('getFiltersToIgnore does return null', (() => {
        expect(component.getFiltersToIgnore()).toBeNull();
    }));

    it('getFilterText does return empty string', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('getCloseableFilters does return null', (() => {
        expect(component.getCloseableFilters()).toBeNull();
    }));

    it('getTabLabel does return expected tab label', (() => {
        let names = [];
        let index = null;
        expect(component.getTabLabel(names, index)).toBe('');

        names = ['a', 'b', 'c', 'd'];
        index = 2;
        expect(component.getTabLabel(names, index)).toBe('c');

    }));

    it('getVisualizationName does return expected string', (() => {
        expect(component.getVisualizationName()).toBe('Media Viewer');
    }));

    it('isValidQuery does return expected result', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.meta.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.meta.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.active.id = 'testId';
        expect(component.isValidQuery()).toBe(false);

        component.active.idField.columnName = 'testIdField';
        expect(component.isValidQuery()).toBe(false);

        component.active.linkField.columnName = 'testLinkField';
        expect(component.isValidQuery()).toBe(false);

        component.active.typeField.columnName = 'testTypeField';
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does set expected properties if response returns no data', (() => {
        component.meta.errorMessage = 'testErrorMessage';
        component.active.documentArray = ['testLink'];

        component.onQuerySuccess({
            data: []
        });

        expect(component.meta.errorMessage).toBe('No Data');
        expect(component.active.documentType).toBe('');
        expect(component.active.documentArray).toEqual([]);
    }));

    it('onQuerySuccess does set expected properties if response returns data',
        fakeAsync(inject([XHRBackend], (mockBackend) => {
            component.meta.errorMessage = 'testErrorMessage';
            component.active.idField.columnName = 'testIdField';
            component.active.linkField.columnName = 'testLinkField';
            component.active.typeField.columnName = 'testTypeField';

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: 'Test Document Link',
                    status: 200
                })));
            });

            component.onQuerySuccess({
                data: [{
                    testIdField: 'testIdValue',
                    testLinkField: 'testLinkValue',
                    testTypeField: 'testTypeValue'
                }]
            });

            // Wait for the HTTP response.
            tick(500);
            expect(component.meta.errorMessage).toBe('');
            expect(component.active.documentType).toBe('testTypeValue');
            expect(component.active.documentArray).toEqual(['testLinkValue']);
        }))
    );

    it('onQuerySuccess does set expected properties if response failed',
        fakeAsync(inject([XHRBackend], (mockBackend) => {
            component.meta.errorMessage = 'testErrorMessage';
            component.active.idField.columnName = 'testIdField';
            component.active.linkField.columnName = 'testLinkField';
            component.active.typeField.columnName = 'testTypeField';
            component.active.documentArray = ['testLink'];

            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Response(new ResponseOptions({
                    body: 'Test Error Message',
                    status: 500
                })));
            });

            component.onQuerySuccess({
                data: [{
                    testIdField: 'testIdValue',
                    testLinkField: 'testLinkValue',
                    testTypeField: 'testTypeValue'
                }]
            });

            // Wait for the HTTP response.
            tick(500);
            expect(component.meta.errorMessage).toBe('');
            expect(component.active.documentType).toBe('testTypeValue');
            expect(component.active.documentArray).toEqual(['testLinkValue']);
        }))
    );

    it('onQuerySuccess does call multiple times and does set expected properties if response returns data with multiple links',
        fakeAsync(inject([XHRBackend], (mockBackend) => {
            component.meta.errorMessage = 'testErrorMessage';
            component.active.idField.columnName = 'testIdField';
            component.active.linkField.columnName = 'testLinkField';
            component.active.typeField.columnName = 'testTypeField';

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: 'Test Document Link 1',
                    status: 200
                })));
            });

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: 'Test Document Link 2',
                    status: 200
                })));
            });

            component.onQuerySuccess({
                data: [{
                    testIdField: 'testIdValue',
                    testLinkField: ['testLinkValue1', 'testLinkValue2'],
                    testTypeField: 'testTypeValue'
                }]
            });

            // Wait for the HTTP response.
            tick(500);
            expect(component.meta.errorMessage).toBe('');
            expect(component.active.documentType).toBe('testTypeValue');
            expect(component.active.documentArray).toEqual(['testLinkValue1', 'testLinkValue2']);
        }))
    );

    it('onUpdateFields does set expected fields to empty strings because fields are empty', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual(new FieldMetaData());
        expect(component.active.linkField).toEqual(new FieldMetaData());
        expect(component.active.typeField).toEqual(new FieldMetaData());
    }));

    it('postInit does call executeQueryChain', (() => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toBe(1);
    }));

    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('removeFilter function does exist', (() => {
        expect(component.removeFilter).toBeDefined();
    }));

    it('setupFilters function does exist', (() => {
        expect(component.setupFilters).toBeDefined();
    }));

    it('subGetBindings does set expected bindings', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';

        let bindings = {};
        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            linkField: 'testLinkField'
        });
    }));

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subNgOnInit function does exist', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));

    it('sanitize function cleans url', (() => {
        component.active.url = 'https://kafka.apache.org/intro';
        expect(component.sanitize(component.active.url).toString()).toBe(
            'SafeValue must use [property]=binding: https://kafka.apache.org/intro (see http://g.co/ng/security#xss)');
    }));

    it('does show toolbar and sidenav', (() => {
        fixture.detectChanges();
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Media Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if meta.errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(iconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message div'));
        expect(errorMessageInSidenav).toBeNull();
    }));

    it('does show error-message in toolbar and sidenav if meta.errorMessage is defined', async(() => {
        component.meta.errorMessage = 'Test Error Message';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent.indexOf('Test Error Message') >= 0).toBe(true);

            let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(iconInSidenav).not.toBeNull();
            expect(iconInSidenav.nativeElement.textContent).toBe('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent.indexOf('Test Error Message') >= 0).toBe(true);
        });
    }));

    it('does show settings icon button in toolbar', (() => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('does show sidenav options menu', (() => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    }));

    it('does show selects in sidenav options menu that have no options', (() => {
        fixture.detectChanges();

        let inputs = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-input-element'));
        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));
        expect(inputs.length).toBe(1);
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(5);

        expect(placeholders[0].nativeElement.textContent).toContain('Title');
        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(placeholders[1].nativeElement.textContent).toContain('Database');
        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(placeholders[2].nativeElement.textContent).toContain('Table');
        expect(selects[2].componentInstance.disabled).toBe(true);
        expect(placeholders[3].nativeElement.textContent).toContain('ID Field');
        expect(selects[3].componentInstance.disabled).toBe(true);
        expect(placeholders[4].nativeElement.textContent).toContain('Link Field');
    }));

    it('does hide loading overlay by default', (() => {
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does show loading overlay if isLoading is true', async(() => {
        component.isLoading = true;
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does show loading overlay if calling onQuerySuccess', fakeAsync(inject([XHRBackend], (mockBackend) => {
        component.active.linkField.columnName = 'testLinkField';

        mockBackend.connections.subscribe((connection) => {
            fixture.detectChanges();

            fixture.whenStable().then(() => {
                fixture.detectChanges();

                let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
                expect(loadingOverlay).not.toBeNull();

                let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
                expect(spinner).not.toBeNull();

                connection.mockRespond(new Response(new ResponseOptions({
                    body: 'Test Loading Document Link',
                    status: 200
                })));
            });
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    })));

    it('does hide tabs if active.documentArray is empty', inject([DomSanitizer], (sanitizer) => {
        component.active.documentArray = [];
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);
    }));

    it('does show tabs if active.documentArray is not empty and active showMedia is true', async(inject([DomSanitizer], (sanitizer) =>  {
        component.active.documentArray = ['testLinkValue1', 'testLinkValue2'];
        component.showMedia = true;
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(component.active.documentArray.length).toBe(2);

            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            expect(tabs[0].nativeElement.textContent).toBe('testLinkValue1');
            expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
            expect(tabs[1].nativeElement.textContent).toBe('testLinkValue2');
            expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);
        });
    })));

    it('does display image tag according to the img documentType', async(inject([DomSanitizer], (sanitizer) => {
        component.showMedia = true;
        component.active.linkField.prettyName = 'Test Link Field';
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.active.documentArray = [imgSrc];
        component.active.documentType = 'img';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body .media-viewer-div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<img');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="' + component.active.linkField.prettyName + '"');
        });
    })));

    it('does display video tag according to the vid documentType', async(inject([DomSanitizer], (sanitizer) => {
        component.showMedia = true;
        let vidSrc = 'https://youtu.be/Mxesac55Puo';
        component.active.documentArray = [vidSrc];
        component.active.documentType = 'vid';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body .media-viewer-div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<video');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + vidSrc + '"');
        });
    })));

    it('does display iframe tag according to the txt documentType', async(inject([DomSanitizer], (sanitizer) => {
        component.showMedia = true;
        let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
        component.active.documentArray = [docSrc];
        component.active.documentType = 'txt';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body .media-viewer-div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<iframe');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
        });
    })));
});

describe('Component: ThumbnailGrid with config', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ThumbnailGridComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                { provide: DatasetService, useClass: DatasetMock },
                ExportService,
                ErrorNotificationService,
                FilterService,
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'database', useValue: 'testDatabase1' },
                { provide: 'table', useValue: 'testTable1' },
                { provide: 'id', useValue: 'testId' },
                { provide: 'idField', useValue: 'testIdField' },
                { provide: 'linkField', useValue: 'testLinkField' },
                { provide: 'typeField', useValue: 'testTypeField' },
                { provide: 'url', useValue: 'https://kafka.apache.org/intro' }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected meta properties', (() => {
        expect(component.meta.database).toEqual(DatasetMock.DATABASES[0]);
        expect(component.meta.databases).toEqual(DatasetMock.DATABASES);
        expect(component.meta.table).toEqual(DatasetMock.TABLES[0]);
        expect(component.meta.tables).toEqual(DatasetMock.TABLES);
        expect(component.meta.fields).toEqual(DatasetMock.FIELDS);
    }));

    it('does set expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            id: 'testId',
            idField: new FieldMetaData('testIdField', 'Test ID Field'),
            linkField: new FieldMetaData('testLinkField', 'Test Link Field'),
            typeField: new FieldMetaData('testTypeField', 'Test Type Field'),
            documentArray: [],
            documentType: '',
            url: 'https://kafka.apache.org/intro'
        });
    }));

    it('onUpdateFields does set expected fields from config', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.active.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field'));
        expect(component.active.typeField).toEqual(new FieldMetaData('testTypeField', 'Test Type Field'));
    }));

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Media Viewer');
    }));

    it('does show selects in sidenav options menu that have expected options', (() => {
        fixture.detectChanges();

        let inputs = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-input-element'));
        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));

        expect(inputs.length).toBe(1);
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(5);

        expect(placeholders[0].nativeElement.textContent).toContain('Title');

        // Don't directly test the two arrays because it's causing an overflow error!
        expect(selects[0].componentInstance.options.toArray().length).toEqual(DatasetMock.DATABASES.length);
        expect(selects[0].componentInstance.disabled).toBe(false);
        expect(placeholders[1].nativeElement.textContent).toContain('Database');

        expect(selects[1].componentInstance.options.toArray().length).toEqual(DatasetMock.TABLES.length);
        expect(selects[1].componentInstance.disabled).toBe(false);
        expect(placeholders[2].nativeElement.textContent).toContain('Table');

        expect(selects[2].componentInstance.options.toArray().length).toEqual(DatasetMock.FIELDS.length);
        expect(selects[2].componentInstance.disabled).toBe(false);
        expect(placeholders[3].nativeElement.textContent).toContain('ID Field');

        expect(selects[3].componentInstance.options.toArray().length).toEqual(DatasetMock.FIELDS.length);
        expect(selects[3].componentInstance.disabled).toBe(false);
        expect(placeholders[4].nativeElement.textContent).toContain('Link Field');
    }));
});*/
