/**
 * Mustache Template Parser with JSON Schema Support
 * Parses system prompt templates that use Mustache templating with JSON schema definitions
 */
import Mustache from 'mustache';
/**
 * Extracts JSON schema from Mustache template comments
 * Format: {{! json-schema-start { ... } json-schema-end }}
 */
function extractJsonSchema(template) {
    const schemaRegex = /\{\{!\s*json-schema-start\s*([\s\S]*?)\s*json-schema-end\s*\}\}/;
    const match = template.match(schemaRegex);
    if (!match) {
        return null;
    }
    try {
        const schemaJson = match[1].trim();
        return JSON.parse(schemaJson);
    }
    catch (error) {
        console.warn('Failed to parse JSON schema from template:', error);
        return null;
    }
}
/**
 * Removes JSON schema comments from template
 */
function cleanTemplate(template) {
    const schemaRegex = /\{\{!\s*json-schema-start\s*[\s\S]*?\s*json-schema-end\s*\}\}/g;
    return template.replace(schemaRegex, '').trim();
}
/**
 * Parses a Mustache template with JSON schema and extracts parameters
 */
export function parsePalsHubTemplate(template) {
    if (!template || typeof template !== 'string') {
        return {
            cleanSystemPrompt: '',
            parameterSchema: [],
            defaultParameters: {},
        };
    }
    // Handle Mustache format with JSON schema
    const schema = extractJsonSchema(template);
    const cleanSystemPrompt = cleanTemplate(template);
    // Convert schema to PocketPal format
    const parameterSchema = schema ? convertJsonSchemaToPocketPal(schema) : [];
    const defaultParameters = schema
        ? extractDefaultParametersFromSchema(schema)
        : {};
    return {
        cleanSystemPrompt,
        parameterSchema,
        defaultParameters,
    };
}
/**
 * Converts JSON schema to PocketPal ParameterDefinition format
 */
function convertJsonSchemaToPocketPal(schema) {
    const parameterSchema = [];
    for (const [key, definition] of Object.entries(schema)) {
        if (typeof definition !== 'object' || definition === null) {
            continue;
        }
        // Map schema types to PocketPal types
        let pocketPalType;
        switch (definition.type) {
            case 'select':
                pocketPalType = 'select';
                break;
            case 'combobox':
                pocketPalType = 'combobox';
                break;
            case 'text':
            default:
                pocketPalType = 'text';
                break;
        }
        const paramDef = {
            key,
            type: pocketPalType,
            label: definition.label || key,
            required: definition.required || false,
            placeholder: definition.placeholder,
            description: definition.description,
        };
        // Add options for select and combobox fields
        if ((pocketPalType === 'select' || pocketPalType === 'combobox') &&
            Array.isArray(definition.options)) {
            paramDef.options = definition.options;
        }
        parameterSchema.push(paramDef);
    }
    return parameterSchema;
}
/**
 * Extracts default parameter values from JSON schema
 */
function extractDefaultParametersFromSchema(schema) {
    const defaults = {};
    for (const [key, definition] of Object.entries(schema)) {
        if (typeof definition !== 'object' || definition === null) {
            continue;
        }
        // Set appropriate default based on type
        switch (definition.type) {
            case 'select':
            case 'combobox':
                // For select/combobox, use schema default or empty string (single-select)
                defaults[key] =
                    definition.default !== undefined ? definition.default : '';
                break;
            default:
                // For other types, use schema default or empty string
                defaults[key] =
                    definition.default !== undefined ? definition.default : '';
                break;
        }
    }
    return defaults;
}
/**
 * Renders a Mustache template with provided values
 */
export function generateFinalSystemPrompt(template, parameters) {
    if (!template || typeof template !== 'string') {
        return '';
    }
    if (!parameters || typeof parameters !== 'object') {
        return template;
    }
    try {
        // Process parameter values for Mustache rendering
        const processedParameters = processParametersForMustache(parameters);
        // Disable HTML escaping for our use case
        return Mustache.render(template, processedParameters, {}, {
            escape: (text) => text,
        });
    }
    catch (error) {
        console.warn('Failed to render Mustache template:', error);
        return template;
    }
}
/**
 * Processes parameter values for Mustache rendering
 */
function processParametersForMustache(parameters) {
    const processed = {};
    for (const [key, value] of Object.entries(parameters)) {
        // Handle datetime_tag parameters
        if (value === '{{datetime}}') {
            processed[key] = new Date().toLocaleString();
            continue;
        }
        // Handle array values (select)
        if (Array.isArray(value)) {
            processed[key] = value.join(', ');
            continue;
        }
        // Handle boolean values
        if (typeof value === 'boolean') {
            processed[key] = value ? 'Yes' : 'No';
            continue;
        }
        // Handle null/undefined
        if (value == null) {
            processed[key] = '';
            continue;
        }
        processed[key] = String(value);
    }
    return processed;
}
