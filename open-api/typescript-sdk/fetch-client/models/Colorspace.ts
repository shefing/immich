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


/**
 * 
 * @export
 */
export const Colorspace = {
    Srgb: 'srgb',
    P3: 'p3'
} as const;
export type Colorspace = typeof Colorspace[keyof typeof Colorspace];


export function ColorspaceFromJSON(json: any): Colorspace {
    return ColorspaceFromJSONTyped(json, false);
}

export function ColorspaceFromJSONTyped(json: any, ignoreDiscriminator: boolean): Colorspace {
    return json as Colorspace;
}

export function ColorspaceToJSON(value?: Colorspace | null): any {
    return value as any;
}

