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

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
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
import { DatasetMock } from '../../../testUtils/MockServices/DatasetMock';

@Component({
    selector: 'app-kebah-case',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
  })
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters = [];
    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        changeDetection: ChangeDetectorRef,
        visualizationService: VisualizationService) {
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
        this.filters = [];
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

    getOptionFromConfig(field) {
        return null;
    }

    subGetBindings(bindings: any) {
        //
    }

    createQuery() {
        let query = new neon.query.Query();
        return query;
    }

    createNeonFilterClauseEquals() {
        //
    }

    onUpdateFields() {
        //
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
          } else {
            return 'Test Filter';
        }
    }

    getExportFields() {
        let fields = [{
            columnName: 'value',
            prettyName: 'Count'
        }];
        return fields;
    }

    getNeonFilterFields() {
        return null;
    }

    getVisualizationName() {
        return 'Test';
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        return ignoredFilterIds;
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

    removeFilter() {
        //
    }

    getElementRefs() {
        return {};
    }
}

describe('Component: base-neon', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
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
                    useClass: DatasetMock
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

        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create a component', (() => {
        expect(component).toBeTruthy();
    }));

    it('should return expected value from bindings', (() => {
        component.meta.database = new DatabaseMetaData('testDatabase1');
        component.meta.table = new TableMetaData('testTable1');
        expect(component.getBindings()).toEqual({
            title: component.meta.title,
            database: component.meta.database.name,
            table: component.meta.table.name,
            unsharedFilterField: component.meta.unsharedFilterField.columnName,
            unsharedFilterValue: component.meta.unsharedFilterValue,
            colorField: component.meta.colorField.columnName
        });
    }));

    it('does have expected meta properties', () => {
        expect(component.meta).toEqual({
            title: 'Test',
            databases: DatasetMock.DATABASES,
            database: DatasetMock.DATABASES[0],
            tables: DatasetMock.TABLES,
            table: DatasetMock.TABLES[0],
            unsharedFilterField: new FieldMetaData(),
            unsharedFilterValue: '',
            colorField: new FieldMetaData(),
            fields: DatasetMock.FIELDS
        });
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

    it('initFields does update fields and does call onUpdateFields', () => {
        let spy = spyOn(component, 'onUpdateFields');
        let output = {
            databases: DatasetMock.DATABASES,
            database: DatasetMock.DATABASES[0],
            tables: DatasetMock.TABLES,
            table: DatasetMock.TABLES[0],
            fields: []
        };
        component.initFields(output);
        expect(spy.calls.count()).toBe(1);
        expect(output.databases).toEqual(DatasetMock.DATABASES);
        expect(output.database).toEqual(DatasetMock.DATABASES[0]);
        expect(output.tables).toEqual(DatasetMock.TABLES);
        expect(output.table).toEqual(DatasetMock.TABLES[0]);
        expect(output.fields).toEqual(DatasetMock.FIELDS);
    });

    it('initTables does update tables and fields and does call onUpdateFields', () => {
        let spy = spyOn(component, 'onUpdateFields');
        let output = {
            databases: DatasetMock.DATABASES,
            database: DatasetMock.DATABASES[0],
            tables: [],
            table: null,
            fields: []
        };
        component.initTables(output);
        expect(spy.calls.count()).toBe(1);
        expect(output.databases).toEqual(DatasetMock.DATABASES);
        expect(output.database).toEqual(DatasetMock.DATABASES[0]);
        expect(output.tables).toEqual(DatasetMock.TABLES);
        expect(output.table).toEqual(DatasetMock.TABLES[0]);
        expect(output.fields).toEqual(DatasetMock.FIELDS);
    });

    it('initDatabases does update databases, tables, and fields and does call onUpdateFields', () => {
        let spy = spyOn(component, 'onUpdateFields');
        let output = {
            databases: [],
            database: null,
            tables: [],
            table: null,
            fields: []
        };
        component.initDatabases(output);
        expect(spy.calls.count()).toBe(1);
        expect(output.databases).toEqual(DatasetMock.DATABASES);
        expect(output.database).toEqual(DatasetMock.DATABASES[0]);
        expect(output.tables).toEqual(DatasetMock.TABLES);
        expect(output.table).toEqual(DatasetMock.TABLES[0]);
        expect(output.fields).toEqual(DatasetMock.FIELDS);
    });

    it('handleChangeDatabase does update meta and does call onUpdateFields and logChangeAndStartQueryChain', () => {
        let spyUpdate = spyOn(component, 'onUpdateFields');
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        component.meta.databases = DatasetMock.DATABASES;
        component.meta.database = DatasetMock.DATABASES[0];
        component.meta.tables = [];
        component.meta.table = null;
        component.meta.fields = [];
        component.handleChangeDatabase();
        expect(spyUpdate.calls.count()).toBe(1);
        expect(spyLog.calls.count()).toBe(1);
        expect(component.meta.databases).toEqual(DatasetMock.DATABASES);
        expect(component.meta.database).toEqual(DatasetMock.DATABASES[0]);
        expect(component.meta.tables).toEqual(DatasetMock.TABLES);
        expect(component.meta.table).toEqual(DatasetMock.TABLES[0]);
        expect(component.meta.fields).toEqual(DatasetMock.FIELDS);
        expect(component.meta.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.meta.unsharedFilterValue).toEqual('');
    });

    it('handleChangeTable does update meta and does call onUpdateFields and logChangeAndStartQueryChain', () => {
        let spyUpdate = spyOn(component, 'onUpdateFields');
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        component.meta.databases = DatasetMock.DATABASES;
        component.meta.database = DatasetMock.DATABASES[0];
        component.meta.tables = DatasetMock.TABLES;
        component.meta.table = DatasetMock.TABLES[0];
        component.meta.fields = [];
        component.handleChangeTable();
        expect(spyUpdate.calls.count()).toBe(1);
        expect(spyLog.calls.count()).toBe(1);
        expect(component.meta.databases).toEqual(DatasetMock.DATABASES);
        expect(component.meta.database).toEqual(DatasetMock.DATABASES[0]);
        expect(component.meta.tables).toEqual(DatasetMock.TABLES);
        expect(component.meta.table).toEqual(DatasetMock.TABLES[0]);
        expect(component.meta.fields).toEqual(DatasetMock.FIELDS);
        expect(component.meta.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.meta.unsharedFilterValue).toEqual('');
    });

    it('handleChangeData does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');
        component.handleChangeData();
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

    it('Tests default return from findFieldObject', (() => {
        expect(component.findFieldObject('testField', null)).toEqual(new FieldMetaData());
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
});
