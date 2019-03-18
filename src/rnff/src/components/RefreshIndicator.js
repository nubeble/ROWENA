// @flow
import * as React from "react";
import { StyleSheet, View, Animated, Platform, Dimensions } from "react-native";

import { Theme } from "./Theme";
import type { BaseProps } from "./Types";

type RefreshIndicatorProps = BaseProps & {
    refreshing: boolean
};

type CircleProps = {
    order: number,
    total: number,
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
        const { order, total, color } = this.props;
        const { animation } = this.state;
        const factor = order - 1;
        const part = 1 / total;
        const scale = animation.interpolate({
            inputRange: [0, part * factor, (part * factor) + (part * 0.5), (part * factor) + part, 1],
            outputRange: [1, 1, 3, 1, 1]
        });

        return (
            <Animated.View style={[styles.circle, { backgroundColor: color, transform: [{ scale }] }]} />
        );
    }
}

// eslint-disable-next-line react/no-multi-comp
export default class RefreshIndicator extends React.PureComponent<RefreshIndicatorProps> {

    static defaultProps = {
        refreshing: true,
        color: 'grey'
    };

    render(): React.Node {
        const { refreshing, style, color } = this.props;
        if (!refreshing) {
            return <View />;
        }
        return (
            <View style={[styles.container, style]}>
                <Circle order={1} total={4} color={color} />
                <Circle order={2} total={4} color={color} />
                <Circle order={3} total={4} color={color} />
                <Circle order={4} total={4} color={color} />
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
