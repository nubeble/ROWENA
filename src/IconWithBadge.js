import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';


export default class IconWithBadge extends React.Component {
    constructor() {
        super();

        this.springValue = new Animated.Value(1);
    }

    /*
    componentDidMount() {
        // this.spring();

        setTimeout(() => {
            this.spring();
        }, 9900);
    }
    */

    spring() {
        const { animate } = this.props;

        if (!animate) return;

        this.springValue.setValue(2);

        /*
        Animated.spring(this.springValue, {
            toValue: 1,
            friction: 2,
            tension: 1
        }).start(() => { this.spring() });
        */

        Animated.spring(this.springValue, {
            toValue: 1,
            friction: 2,
            tension: 1
        }).start();
    }

    render() {
        const { type, name, badgeCount, color, size, animate } = this.props;

        if (animate) {
            if (!this.animating) {
                this.animating = true;

                this.springValue.setValue(2);

                Animated.spring(this.springValue, {
                    toValue: 1,
                    friction: 2,
                    tension: 1
                // }).start(() => this.animating = undefined); // play repeatedly
                }).start(); // play only one time
            }
        }


        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {
                    (type === 'Ionicons') &&
                    <Ionicons name={name} size={size} color={color}/>
                }
                {
                    (type === 'FontAwesome') &&
                    <FontAwesome name={name} size={size} color={color}/>
                }

                {
                    badgeCount === 0 &&
                    <Animated.View style={{
                        position: 'absolute',
                        top: 4 + 2,
                        right: -10 - 2,
                        backgroundColor: 'red',
                        borderRadius: 4,
                        width: 8,
                        height: 8,
                        transform: [{ scale: this.springValue }]
                    }}/>
                }
                {
                    badgeCount > 0 && badgeCount <= 9 &&
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
                        <Text style={{ color: 'white', fontSize: 9, fontFamily: "SFProText-Semibold", paddingTop: 2.5 }}>{badgeCount}</Text>
                    </Animated.View>
                }
                {
                    // ToDo:

                    badgeCount > 9 &&
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
                        <Text style={{ color: 'white', fontSize: 9, fontFamily: "SFProText-Semibold", paddingTop: 2.5 }}>{badgeCount}</Text>
                    </Animated.View>
                }
            </View>
        );
    }
}
