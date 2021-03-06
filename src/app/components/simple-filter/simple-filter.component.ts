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
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { SimpleFilter } from '../../dataset';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as neon from 'neon-framework';
import * as uuid from 'node-uuid';

@Component({
    selector: 'app-simple-filter',
    templateUrl: './simple-filter.component.html',
    styleUrls: ['./simple-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleFilterComponent {

    public simpleFilter = new BehaviorSubject<SimpleFilter>(undefined);
    public filterId = new BehaviorSubject<string>(undefined);

    private id = uuid.v4();
    private messenger = new neon.eventing.Messenger();

    constructor(private datasetService: DatasetService, private filterService: FilterService, public themesService: ThemesService) {
        this.setSimpleFilter();
    }

    setSimpleFilter() {
        let options = this.datasetService.getActiveDatasetOptions();
        this.simpleFilter.next(options && options.simpleFilter);
        this.removeFilter();
    }

    addFilter(term: string) {
        if (term.length === 0) {
            this.removeFilter();
            return;
        }
        let sf = this.simpleFilter.getValue(),
            whereContains = neon.query.where(sf.fieldName, 'contains', term),
            filterName = `simple filter for ${sf.fieldName} containing '${term}'`,
            filterId = this.filterId.getValue(),
            noOp = () => { /*no op*/ };
        if (filterId) {
            this.filterService.replaceFilter(
                this.messenger, filterId, this.id,
                sf.databaseName, sf.tableName, whereContains,
                filterName,
                noOp, noOp
            );
        } else {
            this.filterService.addFilter(
                this.messenger, this.id,
                sf.databaseName, sf.tableName, whereContains,
                filterName,
                (id) => this.filterId.next(typeof id === 'string' ? id : null),
                noOp
            );
        }
    }

    removeFilter() {
        let filterId = this.filterId.getValue();
        if (filterId) {
            this.filterService.removeFilters(this.messenger, [filterId], () => this.filterId.next(undefined));
        }
    }
}
