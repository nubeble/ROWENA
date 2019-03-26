// @flow
import * as React from "react";
import { StyleSheet, View, Animated, Platform, Dimensions } from "react-native";

import { Theme } from "./Theme";
import type { BaseProps } from "./Types";

type RefreshIndicatorProps = BaseProps & {
    refreshing: boolean,
    style: Object, // not map
    total: number,
    size: number,
    color: string
};

type CircleProps = {
    order: number,
    total: number,
    size: number,
    color: string
};

type CircleState = {
    animation: Animated.Value
};

class Circle extends React.Component<CircleProps, CircleState> {
    state = {
        animation: new Animated.Value(0)
    };

    componentDidMount() {
        const { animation } = this.state;
        const options = { toValue: 1, duration: 2000, useNativeDriver: Platform.OS === "ios" };
        Animated.loop(Animated.timing(animation, options)).start();
    }

    render(): React.Node {
        const { order, total, size, color } = this.props;
        const { animation } = this.state;

        const factor = order - 1;
        const part = 1 / total;
        const scale = animation.interpolate({
            inputRange: [0, part * factor, (part * factor) + (part * 0.5), (part * factor) + part, 1],
            outputRange: [1, 1, 3, 1, 1]
        });

        let margin = Theme.spacing.tiny;
        if (size === 4) margin = 6;

        return (
            <Animated.View style={[styles.circle, {
                backgroundColor: color,
                width: size, height: size, borderRadius: size / 2,
                transform: [{ scale }],
                margin: margin
            }]} />
        );
    }
}

// eslint-disable-next-line react/no-multi-comp
export default class RefreshIndicator extends React.PureComponent<RefreshIndicatorProps> {
    static defaultProps = {
        refreshing: true,
        total: 4,
        size: 6,
        color: 'grey'
    };

    render(): React.Node {
        const { refreshing, style, total, size, color } = this.props;

        if (!refreshing) {
            return <View />;
        }

        let circleArray = [];
        for (var i = 0; i < total; i++) {
            circleArray.push(
                <Circle key={i} order={i + 1} total={total} size={size} color={color} />
            );
        }

        return (
            <View style={[styles.container, style]}>
                {circleArray}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",

        marginTop: Theme.spacing.large,
        marginBottom: Theme.spacing.large
    },
    circle: {
        height: 6,
        width: 6,
        borderRadius: 3,
        // backgroundColor: Theme.palette.primary,
        // backgroundColor: 'grey',
        margin: Theme.spacing.tiny
    }
});
