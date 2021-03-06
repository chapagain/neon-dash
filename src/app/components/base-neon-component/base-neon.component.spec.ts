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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Injector,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ThemesService } from '../../services/themes.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { basename } from 'path';
import * as neon from 'neon-framework';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

export class TestOptions extends BaseNeonOptions {
    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        // Do nothing.
    }

    /**
     * Initializes all the field options for the specific visualization.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        // Do nothing.
    }
}

@Component({
    selector: 'app-kebah-case',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
  })
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters: any[] = [];
    public options: TestOptions;
    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        changeDetection: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {
        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            changeDetection,
            visualizationService
        );
        this.options = new TestOptions(this.injector, this.datasetService, 'TestName');
    }

    postInit() {
        //Method for anything that needs to be done once the visualization has been initialized
    }

    subNgOnInit() {
        //Method to do any visualization-specific initialization.
    }

    subNgOnDestroy() {
        //Get an option from the visualization's config
    }

    subGetBindings(bindings: any) {
        //
    }

    createQuery() {
        let query = new neon.query.Query();
        return query;
    }

    getCloseableFilters() {
        return [];
    }

    getElementRefs() {
        return {};
    }

    getExportFields() {
        let fields = [{
            columnName: 'value',
            prettyName: 'Count'
        }];
        return fields;
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        return ignoredFilterIds;
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
          } else {
            return 'Test Filter';
        }
    }

    getOptions() {
        return this.options;
    }

    isValidQuery() {
        return true;
    }

    onQuerySuccess() {
        return new neon.query.Query();
    }

    refreshVisualization() {
        //
    }

    removeFilter() {
        //
    }

    setupFilters() {
        let database = 'test database';
        let table = 'test table';
        let fields = ['test field'];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
            }
        } else {
            this.filters = [];
        }
        //
    }
}

describe('Component: base-neon', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent,
            ExportControlComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            {
                provide: DatasetService,
                useClass: DatasetServiceMock
            },
            FilterService,
            ExportService,
            Injector,
            ThemesService,
            VisualizationService,
            ErrorNotificationService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create a component', (() => {
        expect(component).toBeTruthy();
    }));

    it('should return expected value from bindings', (() => {
        component.getOptions().database = new DatabaseMetaData('testDatabase1');
        component.getOptions().table = new TableMetaData('testTable1');
        expect(component.getBindings()).toEqual({
            title: 'TestName',
            database: 'testDatabase1',
            table: 'testTable1',
            unsharedFilterField: '',
            unsharedFilterValue: '',
            limit: 10
        });
    }));

    it('does have expected options properties', () => {
        let options = component.getOptions();
        expect(options.title).toEqual('TestName');
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
        expect(options.limit).toEqual(10);
        expect(options.newLimit).toEqual(10);
    });

    it('Checks both export functions', (() => {
        let query = component.createQuery();

        expect(component.export()).toBeDefined();
        expect(component.doExport()).toBeDefined();
        /*expect(component.export()).toEqual({
            name: 'Query_Results_Table',
            data: [{
                query: component.createQuery,
                name: String,
                fields: [{
                    query: 'value',
                    pretty: 'Count'
                }],
                ignoreFilters: query.ignoreFilters,
                selectionOnly: query.selectionOnly,
                ignoredFilterIds: [],
                type: 'query'
            }]
        });*/
    }));

    it('Checks to see doExport calls the export function once', (() => {
        let spy = spyOn(component, 'export');
        component.doExport();
        expect(spy.calls.count()).toBe(1);
    }));

    it('Tests ngOnDestroy function', (() => {
        expect(component.ngOnDestroy()).toBeUndefined();
        let spy = spyOn(component, 'subNgOnDestroy');
        component.ngOnDestroy();
        expect(spy.calls.count()).toBe(1);
    }));

    it('updateFields does update fields and does call updateFieldsOnTableChanged', () => {
        let options = component.getOptions();
        let spy = spyOn(options, 'updateFieldsOnTableChanged');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = DatasetServiceMock.TABLES;
        options.table = DatasetServiceMock.TABLES[0];
        options.updateFields();
        expect(spy.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateTables does update tables and fields and does call updateFieldsOnTableChanged', () => {
        let options = component.getOptions();
        let spy = spyOn(options, 'updateFieldsOnTableChanged');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.updateTables();
        expect(spy.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateDatabases does update databases, tables, and fields and does call updateFieldsOnTableChanged', () => {
        let options = component.getOptions();
        let spy = spyOn(options, 'updateFieldsOnTableChanged');
        options.updateDatabases();
        expect(spy.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('handleChangeDatabase does update options and does call updateFieldsOnTableChanged and logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spyUpdate = spyOn(options, 'updateFieldsOnTableChanged');
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = [];
        options.table = null;
        options.fields = [];
        component.handleChangeDatabase();
        expect(spyUpdate.calls.count()).toBe(1);
        expect(spyLog.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeTable does update options and does call updateFieldsOnTableChanged and logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spyUpdate = spyOn(options, 'updateFieldsOnTableChanged');
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = DatasetServiceMock.TABLES;
        options.table = DatasetServiceMock.TABLES[0];
        options.fields = [];
        component.handleChangeTable();
        expect(spyUpdate.calls.count()).toBe(1);
        expect(spyLog.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeData does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');
        component.handleChangeData();
        expect(spy.calls.count()).toBe(1);
    });

    it('handleChangeLimit does update limit and does call logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spy = spyOn(component, 'logChangeAndStartQueryChain');

        options.newLimit = 1234;

        component.handleChangeLimit();
        expect(options.limit).toBe(1234);
        expect(spy.calls.count()).toBe(1);

        options.newLimit = 0;

        component.handleChangeLimit();
        expect(options.limit).toBe(1234);
        expect(options.newLimit).toBe(1234);
        expect(spy.calls.count()).toBe(1);
    });

    it('Handle Filters Changed Event method calls the correct functions', (() => {
        let spySetupFilters = spyOn(component, 'setupFilters');
        let spyExecuteQueryChain = spyOn(component, 'executeQueryChain');
        component.handleFiltersChangedEvent();
        expect(spySetupFilters.calls.count()).toBe(1);
        expect(spyExecuteQueryChain.calls.count()).toBe(1);
    }));

    it('Tests expected return', (() => {
        expect(component.getButtonText()).toBe('');
    }));

    it('Tests onQuery default response', (() => {
        let spyOnQuerySuccess = spyOn(component, 'onQuerySuccess');
        component.baseOnQuerySuccess({
            data: []
         });
        expect(spyOnQuerySuccess.calls.count()).toBe(1);
        expect(component.isLoading).toBeFalsy();
    }));

    it('isNumber does return expected boolean', () => {
        expect(component.isNumber(true)).toBe(false);
        expect(component.isNumber('a')).toBe(false);
        expect(component.isNumber([1, 2])).toBe(false);
        expect(component.isNumber({
            value: 1
        })).toBe(false);

        expect(component.isNumber(1)).toBe(true);
        expect(component.isNumber(12.34)).toBe(true);
        expect(component.isNumber(-12.34)).toBe(true);
        expect(component.isNumber('1')).toBe(true);
        expect(component.isNumber('12.34')).toBe(true);
        expect(component.isNumber('-12.34')).toBe(true);
    });

    it('prettifyInteger does return expected string', () => {
        expect(component.prettifyInteger(0)).toBe('0');
        expect(component.prettifyInteger(1)).toBe('1');
        expect(component.prettifyInteger(12)).toBe('12');
        expect(component.prettifyInteger(123)).toBe('123');
        expect(component.prettifyInteger(1234)).toBe('1,234');
        expect(component.prettifyInteger(1234567890)).toBe('1,234,567,890');
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }]);

        expect(removeCalls).toBe(1);
    });

    it('removeAllFilters does work as expected with multiple filters', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            if (removeCalls === 2) {
                expect(filter).toEqual({
                    id: 'id2',
                    key: 'key2',
                    value: 'value2',
                    prettyKey: 'prettyKey2'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);

        expect(removeCalls).toBe(2);
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;
        let callbackCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }], () => {
            callbackCalls++;
        });

        expect(removeCalls).toBe(2);
        expect(callbackCalls).toBe(1);
    });

    it('removeAllFilters does not change original array', () => {
        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeMoreFilters();
        };

        let filters = [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }];

        component.removeAllFilters(filters);

        expect(filters).toEqual([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);
    });
});
