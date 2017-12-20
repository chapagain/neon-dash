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
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ChangeDetectorRef,
    ViewContainerRef
} from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
// import * as moment from 'moment';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DocumentViewerSingleItemComponent } from '../document-viewer-single-item/document-viewer-single-item.component';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-document-viewer',
    templateUrl: './document-viewer.component.html',
    styleUrls: ['./document-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {

    private singleItemRef: MatDialogRef<DocumentViewerSingleItemComponent>;

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        dateField: string,
        idField: string,
        metadataFields: any[], // Array of arrays. Each internal array is a row of metadata and contains {name, field} objects.
        popoutFields: any[], // Same as metadataFields in format. Extra fields that will show in the single document popout window.
        limit: number,
        showText: boolean,
        showSelect: boolean
    };

    public active: {
        data: any[],
        dataField: FieldMetaData,
        dateField: FieldMetaData,
        docCount: number,
        idField: FieldMetaData,
        limit: number,
        metadataFields: any[]
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, public viewContainerRef: ViewContainerRef,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, public dialog: MatDialog) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            dateField: this.injector.get('dateField', null),
            idField: this.injector.get('idField', null),
            metadataFields: this.injector.get('metadataFields', null),
            popoutFields: this.injector.get('popoutFields', null),
            limit: this.injector.get('limit', null),
            showText: this.injector.get('showText', false),
            showSelect: this.injector.get('showSelect', true)
        };
        this.active = {
            data: [],
            dataField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            docCount: 0,
            idField: new FieldMetaData(),
            limit: this.optionsFromConfig.limit || 50,
            metadataFields: []
        };
        this.queryTitle = this.optionsFromConfig.title || 'Document Viewer';
    }

    subNgOnInit() {
        this.executeQueryChain();
    }

    postInit() {
        // Do nothing.
    }

    subNgOnDestroy() {
        // Do nothing.
    }

    subGetBindings(bindings) {
        // TODO
    }

    getExportFields() {
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        },
        {
            columnName: this.active.dateField.columnName,
            prettyName: this.active.dateField.prettyName
        },
        {
            columnName: this.active.idField.columnName,
            prettyName: this.active.idField.prettyName
        }];
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onUpdateFields() {
        this.active.dataField = this.findFieldObject('dataField', neonMappings.NEWSFEED_TEXT);
        this.active.dateField = this.findFieldObject('dateField'); // If not set in the config, ignore it altogether.
        this.active.idField = this.findFieldObject('idField');
        this.active.metadataFields = neonUtilities.flatten(this.optionsFromConfig.metadataFields);
    }

    getFilterText(filter) {
        return '';
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        return null; // This visualization doesn't filter.
    }

    getNeonFilterFields() {
        return []; // This visualization doesn't filter.
    }

    getVisualizationName() {
        return 'Document Viewer';
    }

    getFiltersToIgnore() {
        return null;
    }

    isValidQuery(): boolean {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        // We intentionally don't include dateField or idField in the validity check, because we're allowed to leave it null.
        return !!(valid);
    }

    createQuery() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let fields = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
            return x.field;
        }).concat(this.active.dataField.columnName);
        if (this.active.dateField.columnName) {
            fields = fields.concat(this.active.dateField.columnName);
            query = query.sortBy(this.active.dateField.columnName, neonVariables.DESCENDING);
        }
        if (this.active.idField.columnName) {
            fields = fields.concat(this.active.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(this.active.limit);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        } else {
            let fields = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
                return x.field;
            }).concat(this.active.dataField.columnName);
            if (this.active.dateField.columnName) {
                fields = fields.concat(this.active.dateField.columnName);
            }
            if (this.active.idField.columnName) {
                fields = fields.concat(this.active.idField.columnName);
            }
            let data = response.data.map(function(element) {
                let elem = {};
                for (let field of fields) {
                    elem[field] = neonUtilities.deepFind(element, field);
                }
                return elem;
            }.bind(this));
            this.active.data = data;
            this.getDocCount();
        }
    }

    getDocCount() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    }

    refreshVisualization() {
        // TODO STUB
    }

    getButtonText() {
        return !this.active.data.length ?
            'No Data' :
            this.active.data.length < this.active.docCount ?
                'Top ' + this.active.data.length + ' of ' + this.active.docCount :
                'Total ' + this.active.data.length;
    }

    setupFilters() {
        this.executeQueryChain();
    }

    removeFilter(value) {
        // Do nothing.
    }

    /**
     * Responds to changes in a field by starting a new query cycle.
     */
    private handleChangeField() {
        this.logChangeAndStartQueryChain();
    }

    formatMetadataEntry(record, metadataEntry) {
        let field = record[metadataEntry.field];
        if (typeof field  === 'string') {
            return field || 'None';
        } else if (field instanceof Array) {
            let matches = [];
            for (let obj of field) {
                if (!metadataEntry.arrayFilter) {
                    matches.push(obj);
                } else if (this.checkIfRecordMatchesFilter(obj, metadataEntry.arrayFilter)) {
                    if (!metadataEntry.arrayFilter.show || metadataEntry.arrayFilter.show === '*') {
                        matches.push(obj);
                    } else {
                        matches.push(obj[metadataEntry.arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ') || 'None';
        } else {
            return 'None';
        }
    }

    private checkIfRecordMatchesFilter(object, filter) {
        if (!filter) {
            return true;
        } else if (filter.filterType === '=') {
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return true;
                }
            }
            return false;
        } else if (filter.filterType === '!=') {
            let matches = true;
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return false;
                }
            }
            return true;
        }
    }

    private openSingleRecord(item) {
        let config = new MatDialogConfig();
        // config.viewContainerRef = this.viewContainerRef;
        let metadata = this.active.metadataFields;
        if (this.optionsFromConfig.popoutFields) {
            metadata = metadata.concat(neonUtilities.flatten(this.optionsFromConfig.popoutFields));
        }
        config.data = {
            item: item,
            textField: this.active.dataField.columnName,
            metadataFields: metadata
        };

        this.singleItemRef = this.dialog.open(DocumentViewerSingleItemComponent, config);
        this.singleItemRef.afterClosed().subscribe(() => {
            this.singleItemRef = null;
        });
    }

    /**
     * Publishes a select_id event for the ID of the given selected item.
     *
     * @arg {object} item
     * @fires select_id
     * @private
     */
    private selectSingleRecord(item) {
        if (this.active.idField.columnName && item[this.active.idField.columnName]) {
            this.publishSelectId(item[this.active.idField.columnName]);
        }
    }
}
