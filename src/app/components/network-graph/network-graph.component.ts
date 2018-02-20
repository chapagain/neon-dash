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
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    Injector, ElementRef, ViewChild, HostListener
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { VisualizationService } from '../../services/visualization.service';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import * as shape from 'd3-shape';
import { select } from 'd3-selection';
import 'd3-transition';
import * as dagre from 'dagre';
import { colorSets } from './color-sets';
import * as neon from 'neon-framework';

import { animate, style, transition as ngTransition, trigger } from '@angular/animations';

import { GraphData, AbstractGraph, OptionsFromConfig } from './ng.type.abstract';

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit,
    OnDestroy, AfterViewInit {

    private filters: {
        id: string,
        key: string,
        value: string
    }[];

    public active: {
        dataField: FieldMetaData,
        nodeField: string, //any[] Future support for multiple node and link fields
        linkField: string, //any[]
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        data: any[],
        aggregation: string,
        graphType: string;
    };

    public graphData: GraphData;

    theme = 'dark';
    graphType = 'Network Graph';

    selectedColorScheme: string;

    private colorSchemeService: ColorSchemeService;
    private defaultActiveColor;

    public optionsFromConfig: OptionsFromConfig;
    private graphObject: AbstractGraph;

    @ViewChild('graphElement') graphElement: ElementRef;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            nodeField: this.injector.get('nodeField', null),
            linkField: this.injector.get('linkField', null),
            dataField: this.injector.get('dateField', null),
            graphType: this.injector.get('graphType', null),
            unsharedFilterField: this.injector.get('unsharedFilterField', null),
            unsharedFilterValue: this.injector.get('unsharedFilterValue', null),
            limit: this.injector.get('limit', null)
        };

        this.active = {
            dataField: new FieldMetaData(),
            nodeField: this.optionsFromConfig.nodeField,
            linkField: this.optionsFromConfig.linkField,
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            data: [],
            aggregation: 'count',
            graphType: this.optionsFromConfig.graphType || 'directed-graph'
        };

        //this.getGraphData();
        this.updateData();

        //this.setColorScheme('picnic');
        //this.setInterpolationType('Catmull Rom');

        this.queryTitle = this.optionsFromConfig.title || 'Network Graph';

        //console.log('constructor ' + this.meta);
        //console.log('constructor ' + this.meta.databases);
    }

    ngOnInit() {
        this.selectGraph(this.graphType);
        this.updateData();
        //setInterval(this.updateData.bind(this), 2000);
        //console.log('ngOninit ' + this.meta.database);

    }

    subNgOnInit() {
        //
    }

    postInit() {
        //
    }

    subNgOnDestroy() {
        return this.graphObject && this.graphObject.destroy();
    }

    subGetBindings(bindings: any) {
        bindings.limit = this.active.limit;
        //
    }

    ngAfterViewInit() {
        let type = this.optionsFromConfig.graphType;
    }

    getExportFields() {
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: valuePrettyName
        }];
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    addLocalFilter(filter) {
        //
    }

    getVisualizationName(): string {
        return 'Network Graph';
    }

    getFilterText(filter) {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.dataField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        return text;
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        //return {nodes, links};
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid); // what?
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField !== undefined && this.active.aggregationField.columnName !== '' && valid);
            //This would mean though that if the data is just a number being represented by a string, it would simply fail.
            //As opposed to first trying to parse it.
            //This also makes it silently fail, without letting the user know that it failed or why. One could easily change the
            //aggregation type, not notice that the chart didn't change, and
            valid = ((this.active.aggregationField.type !== 'string') && valid);

        }
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses: neon.query.WherePredicate[] = [];
        whereClauses.push(neon.query.where(this.active.dataField.columnName, '!=', null));
        let yAxisField = this.active.aggregationField.columnName;
        let groupBy: any[] = [this.active.dataField.columnName];

        if (this.hasColorField()) {
            whereClauses.push(neon.query.where(this.meta.colorField.columnName, '!=', null));
            groupBy.push(this.meta.colorField.columnName);
        }

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(
                neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                    this.meta.unsharedFilterValue));
        }

        query.where(neon.query.and.apply(query, whereClauses));
        switch (this.active.aggregation) {
            case 'count':
                return query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'sum':
                return query.groupBy(groupBy).aggregate(neonVariables.SUM, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'average':
                return query.groupBy(groupBy).aggregate(neonVariables.AVG, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'min':
                return query.groupBy(groupBy).aggregate(neonVariables.MIN, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'max':
                return query.groupBy(groupBy).aggregate(neonVariables.MAX, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
        }
    }

    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        /*
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let filter of neonFilters) {
                ignoredFilterIds.push(filter.id);
            }
            return ignoredFilterIds;
        }*/
        return null;
    }

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    removeFilter() {
        //
    }

    onQuerySuccess(response): void {
        //
    }

    setupFilters() {
        //
    }

    getNodes() {
        return this.graphData.nodes;
    }

    getLinks() {
        return this.graphData.links;
    }

    updateData() {
        /*
              if (add) {
                // directed graph
                const hNode = {
                  id: id(),
                  label: country
                };

                this.hierarchialGraph.nodes.push(hNode);

                this.hierarchialGraph.links.push({
                  source: this.hierarchialGraph.nodes[Math.floor(Math.random() * (this.hierarchialGraph.nodes.length - 1))].id,
                  target: hNode.id,
                  label: 'on success'
                });

                this.hierarchialGraph.links = [...this.hierarchialGraph.links];
                this.hierarchialGraph.nodes = [...this.hierarchialGraph.nodes];
              }//*/
        //this.getGraphData();

    }

    selectGraph(graphSelector) {
        this.graphType = graphSelector;
        /*
      for (const group of this.chartGroups) {
        for (const chart of group.charts) {
          if (chart.selector === chartSelector) {
            this.chart = chart;
            return;
          }
        }
      }*/
    }

    select(data) {
        //console.log('Item clicked', data);
    }
    /*
        setColorScheme(name) {
            /*
          this.selectedColorScheme = name;
          this.colorScheme = this.colorSets.find(s => s.name === name);*/
    // }

    onLegendLabelClick(entry) {
        //console.log('Legend clicked', entry);
    }

    toggleExpand(node) {
        //console.log('toggle expand', node);
    }

    onUpdateFields() {
        this.updateData();
        //
    }

    addLocalFilters(filter) {
        //
    }

    createNeonFilterClauseEquals() {
        //
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDataField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeNodeField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeLinkField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeColorField() {
        this.logChangeAndStartQueryChain(); // ('colorField', this.active.colorField.columnName);
    }

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
    }

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    formatingCallback(value): string {
        if (!isNaN(parseFloat(value)) && !isNaN(value - 0)) {
            //round to at most 3 decimal places, so as to not display tiny floating-point errors
            return String(Math.round((parseFloat(value) + 0.00001) * 1000) / 1000);
        }
        // can't be converted to a number, so just use it as-is.
        return value;
    }

    getButtonText() {
        let text = 'No Data';
        let data = this.graphData; //this.graphData.nodes;
        if (!data || !data.nodes.length) {
            return text;
        } else {
            let total = data.nodes.length;
            return 'Total ' + this.formatingCallback(total);
        }
    }

    createTitle() {
        let title = '';
        if (!this.optionsFromConfig) {
            title = 'Network Graph';
        } else {
            title = this.optionsFromConfig.title;
        }
        return title;
    }

    resetData() {
        this.graphData = new GraphData();
    }

    toNodes(datafield) {
        let nodes = [];

        /*
                datafield.array.forEach(element => {
                    if(nodes.indexOf(element.id) < 0) {
                        nodes.push(element.id, element.name)
                    }
                });*/
    }
}
