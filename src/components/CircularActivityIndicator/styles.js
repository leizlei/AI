import { StyleSheet } from 'react-native';
const styles = ({ color, size }) => StyleSheet.create({
    circle: {
        backgroundColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
        borderRadius: size / 2,
        borderRightColor: color,
        borderTopColor: color,
        borderWidth: 1.5,
        height: size,
        width: size,
    },
});
export default styles;
