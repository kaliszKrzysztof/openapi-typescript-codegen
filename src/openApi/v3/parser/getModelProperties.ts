import type { Model } from '../../../client/interfaces/Model';
import { findOneOfParentDiscriminator, mapPropertyValue } from '../../../utils/discriminator';
import { getPattern } from '../../../utils/getPattern';
import type { OpenApi } from '../interfaces/OpenApi';
import type { OpenApiSchema } from '../interfaces/OpenApiSchema';
import { escapeName } from './escapeName';
import { getComment } from './getComment';
import type { getModel } from './getModel';
import { getType } from './getType';

// Fix for circular dependency
export type GetModelFn = typeof getModel;

export function getModelProperties(openApi: OpenApi, definition: OpenApiSchema, getModel: GetModelFn, parent?: Model): Model[] {
    const models: Model[] = [];
    const discriminator = findOneOfParentDiscriminator(openApi, parent);
    for (const propertyName in definition.properties) {
        if (definition.properties.hasOwnProperty(propertyName)) {
            const property = definition.properties[propertyName];
            const propertyRequired = definition.required?.includes(propertyName) || property.default !== undefined;
            const propertyValues = {
                name: escapeName(propertyName),
                description: getComment(property.description),
                isDefinition: false,
                isReadOnly: property.readOnly === true,
                isRequired: propertyRequired,
                isNullable: property.nullable === true,
                format: property.format,
                maximum: property.maximum,
                exclusiveMaximum: property.exclusiveMaximum,
                minimum: property.minimum,
                exclusiveMinimum: property.exclusiveMinimum,
                multipleOf: property.multipleOf,
                maxLength: property.maxLength,
                minLength: property.minLength,
                maxItems: property.maxItems,
                minItems: property.minItems,
                uniqueItems: property.uniqueItems,
                maxProperties: property.maxProperties,
                minProperties: property.minProperties,
                pattern: getPattern(property.pattern),
            };
            if (parent && discriminator?.propertyName == propertyName) {
                models.push({
                    export: 'reference',
                    type: 'string',
                    base: `'${mapPropertyValue(discriminator, parent)}'`,
                    template: null,
                    link: null,
                    imports: [],
                    enum: [],
                    enums: [],
                    properties: [],
                    ...propertyValues,
                });
            } else if (property.$ref) {
                const model = getType(property.$ref);
                models.push({
                    export: 'reference',
                    type: model.type,
                    base: model.base,
                    template: model.template,
                    link: null,
                    imports: model.imports,
                    enum: [],
                    enums: [],
                    properties: [],
                    ...propertyValues,
                });
            } else {
                const model = getModel(openApi, property);
                models.push({
                    export: model.export,
                    type: model.type,
                    base: model.base,
                    template: model.template,
                    link: model.link,
                    imports: model.imports,
                    enum: model.enum,
                    enums: model.enums,
                    properties: model.properties,
                    ...propertyValues,
                });
            }
        }
    }

    return models;
}
