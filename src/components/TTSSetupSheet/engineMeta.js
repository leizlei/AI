import { Platform } from 'react-native';
export const ENGINE_META = {
    kitten: {
        sizeMb: 57,
        ramMb: 350,
        voices: 8,
        accent: '#F29547',
        gradientFrom: 'rgba(242, 149, 71, 0.12)',
        gradientTo: 'rgba(242, 149, 71, 0.02)',
    },
    kokoro: {
        sizeMb: 330,
        ramMb: 640,
        voices: 22,
        accent: '#6F5CD6',
        gradientFrom: 'rgba(111, 92, 214, 0.14)',
        gradientTo: 'rgba(111, 92, 214, 0.02)',
    },
    supertonic: {
        sizeMb: 380,
        ramMb: 670,
        voices: 10,
        accent: '#1E4DF6',
        gradientFrom: 'rgba(30, 77, 246, 0.14)',
        gradientTo: 'rgba(30, 77, 246, 0.02)',
    },
    phonon: {
        sizeMb: Platform.OS === 'ios' ? 164 : 64,
        ramMb: 300,
        voices: 8,
        accent: '#0E9F8E',
        gradientFrom: 'rgba(14, 159, 142, 0.14)',
        gradientTo: 'rgba(14, 159, 142, 0.02)',
    },
    system: {
        sizeMb: 0,
        ramMb: 0,
        voices: 0,
        accent: '#7B8896',
        gradientFrom: 'rgba(123, 136, 150, 0.10)',
        gradientTo: 'rgba(123, 136, 150, 0.02)',
    },
};
