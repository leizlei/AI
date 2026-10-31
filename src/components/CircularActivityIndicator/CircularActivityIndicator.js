import * as React from 'react';
import { Animated, Easing } from 'react-native';
import styles from './styles';
export const CircularActivityIndicator = ({ color, size = 24, style, }) => {
    const spinValue = React.useRef(new Animated.Value(0)).current;
    const { circle } = styles({ color, size });
    React.useEffect(() => {
        Animated.loop(Animated.timing(spinValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: true,
        })).start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<Animated.View style={[
            {
                transform: [
                    {
                        rotate: spinValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                        }),
                    },
                ],
            },
            circle,
            style,
        ]} testID="CircularActivityIndicator"/>);
};
