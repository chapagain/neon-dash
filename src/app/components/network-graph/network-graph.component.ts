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
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';

import * as shape from 'd3-shape';
import 'd3-transition';
import * as neon from 'neon-framework';
import * as vis from 'vis';
import { findNode } from '@angular/compiler';
import { filter } from 'rxjs/operators';

class GraphData {
    constructor(
        public nodes = new vis.DataSet(),
        public edges = new vis.DataSet()
    ) {}
}

class GraphProperties {
    constructor(
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) {}
    addNode(node: Node) {
        this.nodes.push(node);
    }
    addEdge(edge: Edge) {
        this.edges.push(edge);
    }
}

class Node {
    // http://visjs.org/docs/network/nodes.html
    constructor(
        public id: string,
        public label: string,
        public nodeType?: string,
        public size?: number,
        public color?: string,
        public isLink?: boolean,
        public font?: Object
    ) {}
}

interface ArrowProperties {
    to: boolean;
}

interface ArrowUpdate {
    id: string;
    arrows: ArrowProperties;
}

class Edge {
    // http://visjs.org/docs/network/edges.html
    constructor(
        public from: string,
        public to: string,
        public label?: string,
        public arrows?: ArrowProperties,
        public count?: number,
        public color?: Object,
        public type?: string, //used to identify that catagory of edge (to hide/show when legend option is clicked)
        public width?: number
    ) {}
}

/**
 * Manages configurable options for the specific visualization.
 */
export class NetworkGraphOptions extends BaseNeonOptions {
    public isDirected: boolean;
    public isReified: boolean;
    public linkColor: string;
    public nodeColor: string;
    public edgeColor: string;
    public fontColor: string;
    public edgeColorField: FieldMetaData;
    public linkField: FieldMetaData;
    public nodeField: FieldMetaData;
    public edgeWidth: number;
    public limit: number;
    public andFilters: boolean;
    public showSelect: boolean = false;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.isDirected = this.injector.get('isDirected', false);
        this.isReified = this.injector.get('isReified', false);
        this.linkColor = this.injector.get('linkColor', '#96c1fc');
        this.nodeColor = this.injector.get('nodeColor', '#96c1fc');
        this.edgeColor = this.injector.get('edgeColor', '#2b7ce9');
        this.fontColor = this.injector.get('fontColor', '#343434');
        this.edgeWidth = this.injector.get('edgeWidth', 1);
        this.limit = this.injector.get('limit', Infinity);
        this.andFilters = this.injector.get('andFilters', true);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.nodeField = this.findFieldObject('nodeField');
        this.linkField = this.findFieldObject('linkField');
        this.edgeColorField = this.findFieldObject('edgeColorField');
    }
}

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('graphElement') graphElement: ElementRef;

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: any
    }[] = [];

    public options: NetworkGraphOptions;

    public activeData: any[] = [];

    public graphData = new GraphData();

    graphType = 'Network Graph';

    totalNodeCount;
    existingNodeNames: String[];

    view: any[];
    width: number = 400;
    height: number = 400;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // options
    showLegend = false;
    orientation: string = 'TB'; // LR, RL, TB, BT
    orientations: any[] = [
        {
            label: 'Left to Right',
            value: 'LR'
        }, {
            label: 'Right to Left',
            value: 'RL'
        }, {
            label: 'Top to Bottom',
            value: 'TB'
        }, {
            label: 'Bottom to Top',
            value: 'BT'
        }
    ];

    // line interpolation
    curveType: string = 'Linear';
    curve: any = shape.curveLinear;
    interpolationTypes = [
        'Bundle', 'Cardinal', 'Catmull Rom', 'Linear', 'Monotone X',
        'Monotone Y', 'Natural', 'Step', 'Step After', 'Step Before'
    ];

    colorSets: any;
    colorScheme: any;
    schemeType: string = 'ordinal';
    selectedColorScheme: string;
    public colorByFields: string[] = [];
    public disabledSet: [string[]] = [] as [string[]];

    private defaultActiveColor;

    queryTitle;

    private graph: vis.Network;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        protected colorSchemeService: ColorSchemeService,
        ref: ChangeDetectorRef,
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
            ref,
            visualizationService
        );

        this.options = new NetworkGraphOptions(this.injector, this.datasetService, 'Network Graph', 500000);

        this.graphData = new GraphData();

        this.setInterpolationType('Bundle');
    }

    subNgOnInit() {
        this.updateData();
        this.createQuery();
        //setInterval(this.updateData.bind(this), 2000);

        if (!this.fitContainer) {
            this.applyDimensions();
        }
    }

    applyDimensions() {
        this.view = [this.width, this.height];
    }

    toggleFitContainer(fitContainer: boolean, autoZoom: boolean): void {
        this.fitContainer = fitContainer;
        this.autoZoom = autoZoom;

        if (this.fitContainer) {
            this.view = undefined;
        } else {
            this.applyDimensions();
        }
    }

    postInit() {
        this.executeQueryChain();
    }

    subNgOnDestroy() {
        this.createQuery();
    }

    subGetBindings(bindings: any) {
        bindings.nodeField = this.options.nodeField.columnName;
        bindings.linkField = this.options.linkField.columnName;
        bindings.edgeColorField = this.options.edgeColorField.columnName;
        bindings.andFilters = this.options.andFilters;
    }

    ngAfterViewInit() {
        const nodeSelected = this.onSelect.bind(this);
        // note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {layout: {randomSeed: 0}};
        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
        this.graph.on('stabilized', (params) => this.graph.setOptions({physics: {enabled: false}}));
        this.graph.on('doubleClick', nodeSelected);
    }

    setInterpolationType(curveType) {
        this.curveType = curveType;
        if (curveType === 'Bundle') {
            this.curve = shape.curveBundle.beta(1);
        }
        if (curveType === 'Cardinal') {
            this.curve = shape.curveCardinal;
        }
        if (curveType === 'Catmull Rom') {
            this.curve = shape.curveCatmullRom;
        }
        if (curveType === 'Linear') {
            this.curve = shape.curveLinear;
        }
        if (curveType === 'Monotone X') {
            this.curve = shape.curveMonotoneX;
        }
        if (curveType === 'Monotone Y') {
            this.curve = shape.curveMonotoneY;
        }
        if (curveType === 'Natural') {
            this.curve = shape.curveNatural;
        }
        if (curveType === 'Step') {
            this.curve = shape.curveStep;
        }
        if (curveType === 'Step After') {
            this.curve = shape.curveStepAfter;
        }
        if (curveType === 'Step Before') {
            this.curve = shape.curveStepBefore;
        }
    }

    getExportFields() {
        return [{
            columnName: this.options.nodeField.columnName,
            prettyName: this.options.nodeField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }, {
            columnName: this.options.edgeColorField.columnName,
            prettyName: this.options.edgeColorField.prettyName
        }];
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        return this.graphData;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.nodeField && this.options.nodeField.columnName && valid);
        valid = (this.options.linkField && this.options.linkField.columnName && valid);

        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.options.database.name;
        let tableName = this.options.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let nodeField = this.options.nodeField.columnName;
        let linkField = this.options.linkField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        let whereClauses: neon.query.WherePredicate[] = [];
        //whereClauses.push(neon.query.where(this.options.linkField.columnName, '!=', null));
        let groupBy: any[] = [this.options.nodeField.columnName];

        let fields = [nodeField, linkField];
        if (edgeColorField) {
            fields.push(edgeColorField);
        }

         query = query.withFields(fields);
        let whereClause = neon.query.and.apply(neon.query, whereClauses);

        query.where(whereClause);

        return query;
    }

    getFiltersToIgnore() {
        // TODO
        return null;
    }

    addFilter(myFilter, operator: string) {
        if (!this.filters.length || this.filters.length === 0) {
            this.filters.push(myFilter);
            let whereClause = neon.query.where(myFilter.field, operator, myFilter.value);
            this.addNeonFilter(true, myFilter, whereClause);
        } else if (this.filterIsUnique(filter)) {
            myFilter.id = this.filters[0].id;
            this.filters.push(myFilter);
            let whereClauses = this.filters.map((existingFilter) => {
                return neon.query.where(existingFilter.field, operator, existingFilter.value);
            });
            let whereClause = whereClauses.length === 1 ? whereClauses[0] : (this.options.andFilters ? neon.query.and.apply(neon.query,
                whereClauses) : neon.query.or.apply(neon.query, whereClauses));
            this.replaceNeonFilter(true, myFilter, whereClause);
        }
    }

    removeFilter() {
        //EDIT: all filter ID's are identical so you can not remove just one (must remove all)
        this.filters = [];
        //EDIT: meaning that you also have to reset the legend
        this.disabledSet = [] as [string[]];
        this.updateLegend();
    }

    filterIsUnique(myFilter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === myFilter.value && existingFilter.field === myFilter.field) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        let nodeFilters = [];
        this.filters.forEach((myFilter) => {
            if (myFilter.field !== this.options.edgeColorField.columnName) {
                nodeFilters.push(myFilter);
            }
        });
        return nodeFilters;
    }

    getFilterText(myFilter) {
        return myFilter.prettyField + ' = ' + myFilter.value;
    }

    setupFilters() {
        //
    }

    onQuerySuccess(response): void {
        this.activeData = response.data;
        this.totalNodeCount = 0;
        this.existingNodeNames = [];
        this.resetGraphData();
        this.updateLegend();
    }

    private resetGraphData() {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();

        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() : this.createTabularGraphProperties();

        this.graph.setOptions({physics: {enabled: true}});

        this.graphData.nodes.update(graphProperties.nodes);
        this.graphData.edges.update(graphProperties.edges);
    }

    updateData() {
        //
    }

    selectGraph(graphSelector) {
        this.graphType = graphSelector;
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
        let data = this.graphData,
        visibleNodeCount = data.nodes.length;

        if (!data || !visibleNodeCount) {
            return 'No Data';
        } else if (visibleNodeCount === this.totalNodeCount) {
            return 'Total ' + super.prettifyInteger(this.totalNodeCount);
        } else {
            return '1 - ' + super.prettifyInteger(visibleNodeCount) + ' of ' + super.prettifyInteger(this.totalNodeCount);
        }
    }

    resetData() {
        this.graphData = new GraphData();
    }

    private createReifiedGraphProperties() {
        let graph = new GraphProperties();
        let limit = this.options.limit;

        for (const entry of this.activeData) {
            if (graph.nodes.length < limit) {
                const subject = entry.subject,
                    predicate = entry.predicate,
                    object = entry.object;

                graph.addNode(new Node(subject, subject));
                graph.addNode(new Node(object, object));
                graph.addEdge(new Edge(subject, object, predicate));
                    // , {to: this.options.isDirected}));

                //TODO: add hover with other properties
            }
        }
        return graph;
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
        colorValue?: string, edgeColorField?: string) {
        let edgeColor = { color: colorValue, highlight: colorValue};
        let edgeWidth = this.options.edgeWidth;
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                graph.addEdge(new Edge(source, linkEntry, '', null, 1, edgeColor, edgeColorField, edgeWidth));
            }
        } else if (linkField) {
                graph.addEdge(new Edge(source, linkField, '', null, 1, edgeColor, edgeColorField, edgeWidth));
        }
    }

    private createTabularGraphProperties() {
        let graph = new GraphProperties(),
            linkName = this.options.linkField.columnName,
            nodeName = this.options.nodeField.columnName,
            edgeColorField = this.options.edgeColorField.columnName,
            nodeColor = this.options.nodeColor,
            edgeColor = this.options.edgeColor,
            linkColor = this.options.linkColor,
            textColor = {color: this.options.fontColor},
            limit = this.options.limit;

        for (let entry of this.activeData) {
            let linkField = entry[linkName],
                edgeType = entry[edgeColorField],
                nodeField = entry[nodeName];

            // if there is a valid edgeColorField, override the edgeColor
            if (entry[edgeColorField]) {
                let colorMapVal = edgeColorField && edgeType;
                edgeColor = this.colorSchemeService.getColorFor(edgeColorField, colorMapVal).toRgb();
            }

            //if the linkfield is an array, it'll iterate and create a node for each unique linkfield
            if (Array.isArray(linkField)) {
                for (const linkEntry of linkField) {
                    if (this.isUniqueNode(linkEntry)) {
                        this.totalNodeCount++;
                        if (graph.nodes.length < limit) {
                            graph.addNode(new Node(linkEntry, linkEntry, linkName, 1, linkColor, true, textColor));
                        }
                    }
                }
            } else if (linkField) {
                if (this.isUniqueNode(linkField)) {
                    this.totalNodeCount++;
                    if (graph.nodes.length < limit) {
                        graph.addNode(new Node(linkField, linkField, linkName, 1, linkColor, true, textColor));
                    }
                }
            }

            //if node field is an array create a new node for each unique nodeId
            if (Array.isArray(nodeField)) {
                for (const nodeEntry of nodeField) {
                    if (this.isUniqueNode(nodeEntry)) {
                        this.totalNodeCount++;
                        if (graph.nodes.length < limit) {
                            graph.addNode(new Node(nodeEntry, nodeEntry, nodeName, 1, nodeColor, false, textColor));
                        }
                    }
                    if (graph.nodes.length < limit) {
                        this.addEdgesFromField(graph, linkField, nodeEntry, edgeColor, edgeType);
                    }
                }
            } else if (nodeField) {
                if (this.isUniqueNode(nodeField)) {
                    this.totalNodeCount++;
                    if (graph.nodes.length < limit) {
                        graph.addNode(new Node(nodeField, nodeField, nodeName, 1, nodeColor, false, textColor));
                    }
                }
                if (graph.nodes.length < limit) {
                    this.addEdgesFromField(graph, linkField, nodeField, edgeColor);
                }
            }
        }
        return graph;
    }

    /**
     * Checked if the nodeId exists already and adds it if it's unique
     * @param nodeId
     */
    isUniqueNode(nodeId) {
        if (this.indexOfNodeName(nodeId) !== -1) {
            return false;
        } else {
            this.insertNodeName(nodeId);
            return true;
        }
    }

    /**
     * Returns the index of the nodeName or -1 if it doesnt exist (binary search)
     * @param searchElement nodoName to look for in the array
     */
    indexOfNodeName(searchElement) {
        let minIndex = 0;
        let maxIndex = this.existingNodeNames.length - 1;
        let currentIndex;
        let currentElement;

        if (maxIndex === 0 || searchElement < this.existingNodeNames[minIndex] || searchElement > this.existingNodeNames[maxIndex]) {
            return -1;
        }

        while (minIndex <= maxIndex) {
            currentIndex = Math.floor((minIndex + maxIndex) / 2);
            currentElement = this.existingNodeNames[currentIndex];

            if (currentElement < searchElement) {
                minIndex = currentIndex + 1;
            } else if (currentElement > searchElement) {
                maxIndex = currentIndex - 1;
            } else {
                return currentIndex;
            }
        }
        return -1;
    }

    /**
     * Inserts a unique nodeName into the existingNodeNames array in order
     * @param element
     */
    insertNodeName(element) {
        let arraySize = this.existingNodeNames.length - 1;
        let list = this.existingNodeNames;

        let i: number;
        for (i = arraySize; i >= 0 && list[i] > element; i--) {
            list[i + 1] = list[i];
        }
        list[i + 1] = element;
    }

    handleChangeDirected() {
        let arrowUpdates: ArrowUpdate[] = this.graphData.edges.map(
            (edge: ArrowUpdate) => ({id: edge.id, arrows: {to: this.options.isDirected}}),
            {fields: ['id', 'arrows']}
        );
        this.graphData.edges.update(arrowUpdates);
    }

    handleChangeReified() {
        this.resetGraphData();
    }

    getElementRefs() {
        return {
            //
        };
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    legendIsNeeded() {
        let edgeColorField = this.options.edgeColorField.columnName;
        return (edgeColorField !== '' && edgeColorField);
    }

    /**
     * Updates the network graph legend.
     */
    updateLegend() {
        let colorByFields: string[] = [];
        if (this.options.edgeColorField.columnName !== '') {
            colorByFields.push(this.options.edgeColorField.columnName);
        }
        this.colorByFields = colorByFields;
    }

    /**
     * Filters data based on the clicked legend option
     * @param event
     */
    legendItemSelected(event: any) {
        let field: FieldMetaData = this.options.edgeColorField;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

        if (currentlyActive) {
            //create filter
            let myFilter = {
                id: undefined,
                field: field.columnName,
                prettyField: field.prettyName,
                value: value.toLowerCase() //EDIT: should not need to make this to lowercase
            };

            this.addFilter(myFilter, '!=');
            this.disabledSet.push([field.columnName, value]);
        } else {
            //find the filter to remove
            let index;
            for (let i = 0; i < this.filters.length; i++) {
                let currentFilter = this.filters[i];
                //EDIT: should not need to make this to lowercase
                if (field.columnName === currentFilter.field && value.toLowerCase() === currentFilter.value) {
                    index = i;
                }
            }
            let removeFilter = this.filters[index];

            //remove all filters
            this.removeLocalFilterFromLocalAndNeon(removeFilter, true, true);
            this.disabledSet = [] as [string[]]; //resets the legend
        }
    }

    /**
     * Filters the data using the name of the selected node
     * @param properties
     */
    onSelect(properties) {
        if (properties.nodes.length === 1) {
            //find the selected node
            let nodeName = properties.nodes[0];
            let selectedNode = <Node> this.graphData.nodes.get({
                filter: function(item: Node) {
                    return (item.label === nodeName);
                }
            })[0];

            //create filter
            let field = selectedNode.isLink ? this.options.linkField : this.options.nodeField;
            let myFilter = {
                id: undefined,
                field: field.columnName,
                prettyField: field.prettyName,
                value: nodeName.toLowerCase() //EDIT: should not need to make this to lowercase
            };
            this.addFilter(myFilter, '=');
        }
    }

}
