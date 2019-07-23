import React from 'react';
import { View, Animated } from 'react-native';
import { Text } from './rnff/src/components';
import { Ionicons, FontAwesome, SimpleLineIcons } from '@expo/vector-icons';


export default class IconWithBadge extends React.Component {
    constructor() {
        super();

        // this.animating = false;
        this.animationState = 0; // 0: stop, 1: ing, 2: finished
        this.springValue = new Animated.Value(1);
    }

    render() {
        const { type, name, badgeCount, color, size, animate } = this.props;

        if (animate) {
            if (this.animationState === 0) {
                this.animationState = 1;

                this.springValue.setValue(2);

                Animated.spring(this.springValue, {
                    toValue: 1,
                    friction: 2,
                    tension: 1,
                    useNativeDriver: true
                }).start(() => this.animationState = 2); // finished
            }
        } else {
            this.animationState = 0;
        }

        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {
                    (type === 'Ionicons') &&
                    <Ionicons name={name} size={size} color={color} />
                }
                {
                    (type === 'FontAwesome') &&
                    <FontAwesome name={name} size={size} color={color} />
                }
                {
                    (type === 'SimpleLineIcons') &&
                    <SimpleLineIcons name={name} size={size} color={color} />
                }

                {
                    animate && badgeCount === 0 &&
                    <Animated.View style={{
                        position: 'absolute',
                        top: 4 + 2,
                        right: -10 - 2,
                        backgroundColor: 'red',
                        borderRadius: 4,
                        width: 8,
                        height: 8,
                        transform: [{ scale: this.springValue }]
                    }} />
                }
                {
                    animate && badgeCount > 0 && badgeCount <= 9 &&
                    <Animated.View style={{
                        // If you're using react-native < 0.57 overflow outside of the parent
                        // will not work on Android, see https://git.io/fhLJ8
                        position: 'absolute',
                        top: 4,
                        right: -10,
                        backgroundColor: 'red',
                        borderRadius: 6,
                        width: 12,
                        height: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [{ scale: this.springValue }]
                    }}>
                        <Text style={{ color: 'white', fontSize: 9, fontFamily: "Roboto-Medium", paddingTop: 2.5 }}>{badgeCount}</Text>
                    </Animated.View>
                }
                {
                    animate && badgeCount > 9 &&
                    <Animated.View style={{
                        // If you're using react-native < 0.57 overflow outside of the parent
                        // will not work on Android, see https://git.io/fhLJ8
                        position: 'absolute',
                        top: 4,
                        right: -10 - 2,
                        backgroundColor: 'red',
                        borderRadius: 6,
                        width: 12 + 4,
                        height: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [{ scale: this.springValue }]
                    }}>
                        <Text style={{ color: 'white', fontSize: 9, fontFamily: "Roboto-Medium", paddingTop: 2.5 }}>9+</Text>
                    </Animated.View>
                }
            </View>
        );
    }
}
