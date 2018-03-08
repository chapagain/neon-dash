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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextCloudComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    private textCloud: TextCloud;
    private filters: {
        id: string,
        key: string,
        value: string,
        translated: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        configFilter: {
            use: boolean,
            lhs: string,
            operator: string,
            rhs: string
        },
        unsharedFilterField: any,
        unsharedFilterValue: string,
        sizeField: string,
        sizeAggregation: string,
        limit: number
    };
    public active: {
        dataField: FieldMetaData,
        sizeField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        newLimit: number,
        textColor: string,
        allowsTranslations: boolean,
        filterable: boolean,
        data: any[],
        count: number
    };
    public sizeAggregationTypes = [
        {name: 'Average', value: 'AVG'},
        {name: 'Maximum', value: 'MAX'},
        {name: 'Minimum', value: 'MIN'},
        {name: 'Sum', value: 'SUM'}
    ];
    // Average should be the default. It is loaded from the optionsFromConfig
    public sizeAggregation: string;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            configFilter: this.injector.get('configFilter', null),
            unsharedFilterField: this.injector.get('unsharedFilterField', null),
            unsharedFilterValue: this.injector.get('unsharedFilterValue', null),
            sizeField: this.injector.get('sizeField', null),
            sizeAggregation: this.injector.get('sizeAggregation', 'AVG'),
            limit: this.injector.get('limit', 40)
        };
        this.sizeAggregation = this.optionsFromConfig.sizeAggregation;
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            newLimit: this.optionsFromConfig.limit,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            data: [],
            count: 0
        };
    }

    subNgOnInit() {
        // Do nothing
    }

    postInit() {
        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.active.textColor = this.getPrimaryThemeColor().toHexString();
        this.updateTextCloudSettings();

        this.executeQueryChain();
    }

    subNgOnDestroy() {
        // Do nothing
    }

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.sizeField = this.active.sizeField.columnName;
        bindings.sizeAggregation = this.sizeAggregation;
        bindings.limit = this.active.limit;
    }

    getExportFields() {
        let countField = this.active.sizeField.prettyName === '' ? 'Count' :
            this.active.sizeField.prettyName;
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: countField
        }];
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    private updateTextCloudSettings() {
        let options = new TextCloudOptions(new SizeOptions(80, 140, '%'),
            new ColorOptions('#aaaaaa', this.active.textColor));
        this.textCloud = new TextCloud(options);
    }

    updateObject(prev, field, value) {
        let obj = Object.assign({}, prev);
        obj[field] = value;
        return obj;
    }

    onUpdateFields() {
        let dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        let sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
        this.active = this.updateObject(this.active, 'dataField', dataField);
        this.active = this.updateObject(this.active, 'sizeField', sizeField);
        this.meta = Object.assign({}, this.meta); // trigger action
    }

    addLocalFilter(filter) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).map((existingFilter) => {
            return existingFilter;
        }).concat([filter]);
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        let filterClauses = this.filters.map((filter) => {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    getVisualizationName(): string {
        return 'Text Cloud';
    }

    refreshVisualization() {
        this.createTextCloud();
    }

    getFilterText(filter) {
        return filter.value;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        return valid;
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clauses = [neon.query.where(this.active.dataField.columnName, '!=', null)];

        if (this.optionsFromConfig.configFilter) {
            clauses.push(neon.query.where(this.optionsFromConfig.configFilter.lhs,
                this.optionsFromConfig.configFilter.operator,
                this.optionsFromConfig.configFilter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }

        return clauses.length > 1 ? neon.query.and.apply(neon.query, clauses) : clauses[0];
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();
        let dataField = this.active.dataField.columnName;

        if (this.active.sizeField.columnName === '') {
            // Normal aggregation query
            return query.where(whereClause).groupBy(dataField).aggregate(neonVariables.COUNT, '*', 'value')
                .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
        } else {
            // Query for data with the size field and sort by it
            let sizeColumn = this.active.sizeField.columnName;
            return query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
                .groupBy(dataField).aggregate(neon.query[this.sizeAggregation], sizeColumn, sizeColumn)
                .sortBy(sizeColumn, neonVariables.DESCENDING).limit(this.active.limit);
        }
    }

    getFiltersToIgnore() {
        return null;
    }

    getDocCount() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let whereClause = this.createClause();
        let countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .groupBy(this.active.dataField.columnName)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    }

    onQuerySuccess(response): void {
        try {
            if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
                this.active.count = response.data.length;
            } else {
                let cloudData = response.data || [];
                let useSizeField: boolean = this.active.sizeField.columnName !== '';

                let activeData = cloudData.map((item) => {
                    item.key = item[this.active.dataField.columnName];
                    item.keyTranslated = item.key;
                    // If we have a size field, asign the value to the value field
                    if (useSizeField) {
                        item.value = item[this.active.sizeField.columnName];
                    }
                    return item;
                });
                this.active = this.updateObject(this.active, 'data', activeData);
                this.refreshVisualization();
                if (cloudData.length === 0) {
                    this.active.count = 0;
                } else {
                    this.getDocCount();
                }
            }
        } catch (e) {
            console.error((<Error> e).message);
        }
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            let key = neonFilter.filter.whereClause.lhs;
            let value = neonFilter.filter.whereClause.rhs;
            let filter = {
                id: neonFilter.id,
                key: key,
                value: value,
                prettyKey: key
            };
            if (this.filterIsUnique(filter)) {
                this.addLocalFilter(filter);
            }
        }
    }

    isFilterSet(): boolean {
        return this.filters.length > 0;
    }

    onClick(item) {
        let value = item.key;
        let key = this.active.dataField.columnName;
        let prettyKey = this.active.dataField.prettyName;
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            key: key,
            value: value,
            prettyKey: prettyKey
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.key, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
    }

    filterIsUnique(filter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.key === filter.key) {
                return false;
            }
        }
        return true;
    }

    createTextCloud() {
         let data = this.textCloud.createTextCloud(this.active.data);
         this.active = this.updateObject(this.active, 'data', data);
    }

    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    handleChangeLimit() {
        if (super.isNumber(this.active.newLimit)) {
            let newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                this.logChangeAndStartQueryChain();
            } else {
                this.active.newLimit = this.active.limit;
            }
        } else {
            this.active.newLimit = this.active.limit;
        }
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.isFilterSet() && !this.active.data.length) {
            return 'No Data';
        }
        if (this.active.count <= this.active.data.length) {
            return 'Total ' + super.prettifyInteger(this.active.count);
        }
        return super.prettifyInteger(this.active.data.length) + ' of ' + super.prettifyInteger(this.active.count);
    }

    getFilterData() {
        return this.filters;
    }

    createFilterDesc(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    }

    createFilterText(value: string) {
        if (!this.active.allowsTranslations) {
            return value;
        }

        let text = '';
        this.filters.forEach((filter) => {
            if (filter.value === value) {
                text = filter.translated || filter.value;
            }
        });

        return text;
    }

    getRemoveDesc(value: string) {
        return 'Delete Filter ' + this.createFilterDesc(value);
    }

    // filter is a filter from the filter service that the filter to remove corresponds to.
    removeFilter(filter: any) {
        // We do it this way instead of using splice() because we have to replace filter array
        // with a new object for Angular to recognize the change. It doesn't respond to mutation.
        let newFilters = [];
        for (let index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id !== filter.id) {
                newFilters.push(this.filters[index]);
            }
        }
        this.filters = newFilters;
    }

    // These methods must be present for AoT compile
    requestExport() {
        // Do nothing.
    }

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }
}
