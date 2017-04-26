// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DataSelectQueryBuilder, ItemsPerPage, SortableProperties} from './builder';

/** @const {!DataSelectApi.SupportedActions} **/
const Actions = {
  /** @export */
  PAGINATE: 0,
  /** @export */
  SORT: 1,
};

/**
 * @final
 */
export class DataSelectService {
  /**
   * @param {!./../namespace/service.NamespaceService} kdNamespaceService
   * @param {!../../chrome/state.StateParams|!../resource/resourcedetail.StateParams} $stateParams
   * @ngInject
   */
  constructor(kdNamespaceService, $stateParams) {
    /** @private {!Map<string, !DataSelectApi.DataSelectQuery>} */
    this.instances_ = new Map();
    /** @private {!./../namespace/service.NamespaceService} */
    this.kdNamespaceService_ = kdNamespaceService;
    /** @export {!DataSelectApi.SupportedActions} **/
    this.actions_ = Actions;
    /** @export {number} **/
    this.rowsLimit = ItemsPerPage;
    /** {!../../../chrome/chrome_state.StateParams|!../../resource/resourcedetail.StateParams} */
    this.stateParams_ = $stateParams;
  }

  /**
   * Returns true if given data select id is registered, false otherwise.
   *
   * @param {string} dataSelectId
   * @return {boolean}
   * @export
   */
  isRegistered(dataSelectId) {
    return this.instances_.has(dataSelectId);
  }

  /**
   * Registers data select query instance for given data select id.
   *
   * @param {string} dataSelectId
   * @export
   */
  registerInstance(dataSelectId) {
    this.instances_.set(dataSelectId, new DataSelectQueryBuilder().build());
  }

  /** @export **/
  getMinRowsLimit() {
    return this.rowsLimit;
  }

  /**
   * @param listResource {!angular.$resource}
   * @param dataSelectId {string}
   * @param dataSelectQuery {!DataSelectApi.DataSelectQuery}
   * @param action {string}
   * @return {!angular.$q.Promise}
   * @private
   */
  selectData_(listResource, dataSelectId, dataSelectQuery, action) {
    let query = this.instances_.get(dataSelectId);
    let name = this.stateParams_.objectName || query.name;
    let namespace =
        this.stateParams_.objectNamespace || this.stateParams_.namespace || query.namespace;

    if (!dataSelectQuery) {
      throw new Error(`Data select query for given data select id ${dataSelectId} does not exist`);
    }

    if (this.kdNamespaceService_.isMultiNamespace(namespace)) {
      namespace = '';
    }

    query.name = dataSelectQuery.name || name;
    query.namespace = dataSelectQuery.namespace || namespace;

    switch (action) {
      case this.actions_.PAGINATE:
        query.page = dataSelectQuery.page;
        break;
      case this.actions_.SORT:
        query.sortBy = dataSelectQuery.sortBy;
        break;
    }

    this.instances_.set(dataSelectId, query);
    return listResource.get(query).$promise;
  }

  /**
   * @param listResource {!angular.$resource}
   * @param dataSelectId {string}
   * @param dataSelectQuery {!DataSelectApi.DataSelectQuery}
   * @return {!angular.$q.Promise}
   * @export
   */
  paginate(listResource, dataSelectId, dataSelectQuery) {
    return this.selectData_(listResource, dataSelectId, dataSelectQuery, this.actions_.PAGINATE);
  }

  /**
   * @param listResource {!angular.$resource}
   * @param dataSelectId {string}
   * @param ascending {boolean}
   * @param sortBy {string}
   * @return {!angular.$q.Promise}
   * @export
   */
  sort(listResource, dataSelectId, ascending, sortBy) {
    if (sortBy === SortableProperties.AGE) {
      // Flip sorting because by sorting is done based on creation timestamp.
      ascending = !ascending;
    }

    let dataSelectQuery =
        new DataSelectQueryBuilder().setAscending(ascending).setSortBy(sortBy).build();
    return this.selectData_(listResource, dataSelectId, dataSelectQuery, this.actions_.SORT);
  }

  /**
   * @param {string|undefined} [namespace]
   * @param {string|undefined} [name]
   * @return {!DataSelectApi.DataSelectQuery}
   * @export
   */
  getDefaultResourceQuery(namespace, name) {
    let query = new DataSelectQueryBuilder().setNamespace(namespace).setName(name).build();

    if (this.kdNamespaceService_.isMultiNamespace(query.namespace)) {
      query.namespace = '';
    }

    return query;
  }
}