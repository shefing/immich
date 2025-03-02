/* tslint:disable */
/* eslint-disable */
/**
 * Immich
 * Immich API
 *
 * The version of the OpenAPI document: 1.94.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface AssetBulkUploadCheckResult
 */
export interface AssetBulkUploadCheckResult {
    /**
     * 
     * @type {string}
     * @memberof AssetBulkUploadCheckResult
     */
    action: AssetBulkUploadCheckResultActionEnum;
    /**
     * 
     * @type {string}
     * @memberof AssetBulkUploadCheckResult
     */
    assetId?: string;
    /**
     * 
     * @type {string}
     * @memberof AssetBulkUploadCheckResult
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof AssetBulkUploadCheckResult
     */
    reason?: AssetBulkUploadCheckResultReasonEnum;
}


/**
 * @export
 */
export const AssetBulkUploadCheckResultActionEnum = {
    Accept: 'accept',
    Reject: 'reject'
} as const;
export type AssetBulkUploadCheckResultActionEnum = typeof AssetBulkUploadCheckResultActionEnum[keyof typeof AssetBulkUploadCheckResultActionEnum];

/**
 * @export
 */
export const AssetBulkUploadCheckResultReasonEnum = {
    Duplicate: 'duplicate',
    UnsupportedFormat: 'unsupported-format'
} as const;
export type AssetBulkUploadCheckResultReasonEnum = typeof AssetBulkUploadCheckResultReasonEnum[keyof typeof AssetBulkUploadCheckResultReasonEnum];


/**
 * Check if a given object implements the AssetBulkUploadCheckResult interface.
 */
export function instanceOfAssetBulkUploadCheckResult(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "action" in value;
    isInstance = isInstance && "id" in value;

    return isInstance;
}

export function AssetBulkUploadCheckResultFromJSON(json: any): AssetBulkUploadCheckResult {
    return AssetBulkUploadCheckResultFromJSONTyped(json, false);
}

export function AssetBulkUploadCheckResultFromJSONTyped(json: any, ignoreDiscriminator: boolean): AssetBulkUploadCheckResult {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'action': json['action'],
        'assetId': !exists(json, 'assetId') ? undefined : json['assetId'],
        'id': json['id'],
        'reason': !exists(json, 'reason') ? undefined : json['reason'],
    };
}

export function AssetBulkUploadCheckResultToJSON(value?: AssetBulkUploadCheckResult | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'action': value.action,
        'assetId': value.assetId,
        'id': value.id,
        'reason': value.reason,
    };
}

