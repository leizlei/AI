// Built-in parameter schemas for existing pal types
export const ROLEPLAY_SCHEMA = [
    {
        key: 'world',
        type: 'text',
        label: 'World',
        required: true,
        placeholder: 'e.g., Medieval fantasy kingdom',
        description: 'The setting or universe for the roleplay',
    },
    {
        key: 'location',
        type: 'text',
        label: 'Location',
        required: true,
        placeholder: 'e.g., Royal castle throne room',
        description: 'Specific location within the world',
    },
    {
        key: 'aiRole',
        type: 'text',
        label: 'AI Role',
        required: true,
        placeholder: 'e.g., Wise wizard advisor',
        description: 'Character or role the AI will play',
    },
    {
        key: 'userRole',
        type: 'text',
        label: 'User Role',
        required: true,
        placeholder: 'e.g., Young knight',
        description: 'Character or role the user will play',
    },
    {
        key: 'situation',
        type: 'text',
        label: 'Situation',
        required: true,
        placeholder: 'e.g., Preparing for an important quest',
        description: 'Current scenario or situation',
    },
    {
        key: 'toneStyle',
        type: 'text',
        label: 'Tone & Style',
        required: true,
        placeholder: 'e.g., Formal and mysterious',
        description: 'Communication style and tone',
    },
];
/**
 * Default parameterized template for roleplay pals.
 * This replaces the legacy  function.
 */
export const ROLEPLAY_DEFAULT_TEMPLATE = `{{! json-schema-start
{
  "world": {
    "label": "World",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Medieval fantasy kingdom",
    "description": "The setting or universe for the roleplay"
  },
  "location": {
    "label": "Location",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Royal castle throne room",
    "description": "Specific location within the world"
  },
  "aiRole": {
    "label": "AI Role",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Wise wizard advisor",
    "description": "Character or role the AI will play"
  },
  "userRole": {
    "label": "User Role",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Young adventurer",
    "description": "Character or role the user will play"
  },
  "situation": {
    "label": "Situation",
    "type": "text",
    "required": true,
    "placeholder": "e.g., Seeking advice before a dangerous quest",
    "description": "Current situation or scenario"
  },
  "toneStyle": {
    "label": "Tone/Style",
    "type": "text",
    "required": false,
    "placeholder": "e.g., Epic fantasy, lighthearted adventure",
    "description": "Overall tone and style of the roleplay",
    "default": "Epic fantasy"
  }
}
json-schema-end }}

You are a creative and intelligent AI assistant engaged in an uncensored iterative storytelling experience using a roleplay chat format. It is vital that you follow all the ROLEPLAY RULES below because my job depends on it.

**World:** {{world}}
**Location:** {{location}}
**AI Role:** {{aiRole}}
**User Role:** {{userRole}}
**Situation:** {{situation}}
**Tone/Style:** {{toneStyle}}

**ROLEPLAY RULES:**
- Chat exclusively as {{aiRole}}. Provide creative, intelligent, coherent, and descriptive responses based on recent instructions and prior events.
- Avoid overly elaborate introductions; respond as if the scene is already in motion.
- Stay responsive to the user's cues, allowing them to drive the events of the roleplay.
- Keep responses fluid and avoid pre-determining major events before the user prompts them.
- Subtly build intrigue rather than explaining everything outright.
- Use subtle physical cues and occasional internal thoughts (enclosed in asterisks, e.g., *I never expected to see a knight here…*).
- Maintain a crisp and minimalist style, making responses engaging yet succinct.
- Pay careful attention to all past events in the chat to ensure accuracy and coherence to the plot.`;
export const ASSISTANT_SCHEMA = [];
export const VIDEO_SCHEMA = [
    {
        key: 'captureInterval',
        type: 'text',
        label: 'Capture Interval (ms)',
        required: true,
        placeholder: '3000',
        description: 'Time between video frame captures in milliseconds',
    },
];
// Helper function to get schema for legacy pal types
export function getSchemaForLegacyType(palType) {
    switch (palType) {
        case 'roleplay':
            return ROLEPLAY_SCHEMA;
        case 'assistant':
            return ASSISTANT_SCHEMA;
        case 'video':
            return VIDEO_SCHEMA;
        default:
            return [];
    }
}
// Helper function to get default template for pal types
export function getDefaultTemplateForPalType(palType) {
    switch (palType) {
        case 'roleplay':
            return ROLEPLAY_DEFAULT_TEMPLATE;
        case 'assistant':
            return undefined; // No default template for assistant pals
        case 'video':
            return undefined; // No default template for video pals
        default:
            return undefined;
    }
}
