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

/* eslist-disable */

import * as neon from 'neon-framework';

export namespace neonVariables {
    /* tslint:disable:no-string-literal */
    export const ASCENDING = neon.query['ASCENDING'];
    export const AVG = neon.query['AVG'];
    export const COUNT = neon.query['COUNT'];
    export const DESCENDING = neon.query['DESCENDING'];
    export const MAX = neon.query['MAX'];
    export const MIN = neon.query['MIN'];
    export const SUM = neon.query['SUM'];
    /* tslint:enable:no-string-literal */
}

export namespace neonUtilities {
    /**
     * Flattens and returns the given array.
     *
     * @arg {array} input
     * @return {array}
     */
    export function flatten(input) {
        return (input || []).reduce((array, element) => {
            return array.concat(Array.isArray(element) ? flatten(element) : element);
        }, []);
    }

    /**
     * Returns the object nested inside the given object using the given path string (with periods to mark each nested property).
     *
     * @arg {object} item
     * @arg {string} pathString
     * @return {object}
     */
    export function deepFind(item, pathString) {
        let itemToReturn = item;
        let path = (pathString ? pathString.split('.') : []);
        for (let i = 0; i < path.length; i++) {
            if (itemToReturn instanceof Array) {
                let nestedPath = path.slice(i).join('.');
                let pieces = [];
                for (let itemInList of itemToReturn) {
                    let entryValue = deepFind(itemInList, nestedPath);
                    if (entryValue instanceof Array) {
                        entryValue = flatten(entryValue);
                    }
                    pieces = pieces.concat(entryValue);
                }
                return pieces;
            }
            itemToReturn = itemToReturn ? itemToReturn[path[i]] : undefined;
        }
        return itemToReturn;
    }
}

// Mappings used in the JSON configuration file.
export namespace neonMappings {
    export const DATE = 'date';
    export const ID = 'id';
    export const LATITUDE = 'latitude';
    export const LONGITUDE = 'longitude';
    export const URL = 'url';
}

export const neonCustomConnectionMappings: { name: string, prettyName: string }[] = [{
        name: 'date',
        prettyName: 'Date'
    },
    {
        name: 'id',
        prettyName: 'ID'
    },
    {
        name: 'latitude',
        prettyName: 'Latitude'
    },
    {
        name: 'longitude',
        prettyName: 'Longitude'
    },
    {
        name: 'url',
        prettyName: 'URL'
}];

export namespace neonVisualizationMinPixel { // jshint ignore:line
    export const x = 320;
    export const y = 240;
}

export const neonVisualizations: any[] = [{
    name: 'Annotation Viewer',
    type: 'annotationViewer',
    icon: 'annotation_viewer'
}, {
    name: 'Bar Chart',
    type: 'barChart',
    icon: 'bar_chart'
}, {
    name: 'Data Table',
    type: 'dataTable',
    icon: 'view_data'
}, {
    name: 'Document Viewer',
    type: 'documentViewer',
    icon: 'document_viewer'
}, {
    name: 'Filter Builder',
    type: 'filterBuilder',
    icon: 'create_filter'
}, {
    name: 'Line Chart',
    type: 'lineChart',
    icon: 'line_chart'
}, {
    name: 'Map',
    type: 'map',
    icon: 'map'
}, {
    name: 'Media Viewer',
    type: 'mediaViewer',
    icon: 'media_viewer'
}, {
    name: 'Network Graph',
    type: 'networkGraph',
    icon: 'network_graph'
}, {
    name: 'Sample',
    type: 'sample',
    icon: 'neon_logo'
}, {
    name: 'Scatter Plot',
    type: 'scatterPlot',
    icon: 'scatter_plot'
}, {
    name: 'Stacked Timeline',
    type: 'stackedTimeline',
    icon: 'stacked_timeline'
}, {
    name: 'Text Cloud',
    type: 'textCloud',
    icon: 'text_cloud'
}, {
    name: 'Thumbnail Grid',
    type: 'thumbnailGrid',
    icon: 'thumbnail_grid'
}, {
    name: 'Timeline',
    type: 'timeline',
    icon: 'timeline'
}, {
    name: 'Wiki Viewer',
    type: 'wikiViewer',
    icon: 'wiki_viewer'
}];
