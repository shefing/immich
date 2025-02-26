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
 * @interface OAuthAuthorizeResponseDto
 */
export interface OAuthAuthorizeResponseDto {
    /**
     * 
     * @type {string}
     * @memberof OAuthAuthorizeResponseDto
     */
    url: string;
}

/**
 * Check if a given object implements the OAuthAuthorizeResponseDto interface.
 */
export function instanceOfOAuthAuthorizeResponseDto(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "url" in value;

    return isInstance;
}

export function OAuthAuthorizeResponseDtoFromJSON(json: any): OAuthAuthorizeResponseDto {
    return OAuthAuthorizeResponseDtoFromJSONTyped(json, false);
}

export function OAuthAuthorizeResponseDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): OAuthAuthorizeResponseDto {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'url': json['url'],
    };
}

export function OAuthAuthorizeResponseDtoToJSON(value?: OAuthAuthorizeResponseDto | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'url': value.url,
    };
}

