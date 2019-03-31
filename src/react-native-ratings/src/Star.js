import React, { PureComponent } from 'react';
import { StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Asset } from 'expo';

const STAR_IMAGE = require('./images/airbnb-star.png');
const STAR_SELECTED_IMAGE = require('./images/airbnb-star-selected.png');
const STAR_SIZE = 40;


export default class Star extends PureComponent {
    static defaultProps = {
        selectedColor: '#f1c40f'
    };

    // --
    // static STAR_IMAGE = _STAR_IMAGE;
    // static STAR_SELECTED_IMAGE = _STAR_SELECTED_IMAGE;

    static downloadAsync(): Promise<*>[] {
        return [
            Asset.loadAsync([
                STAR_IMAGE,
                STAR_SELECTED_IMAGE
            ])
        ];
    }
    // --

    componentWillUnmount() {
        this.stopAnimation();
    }

    stopAnimation() {
        if (this.instance) this.instance.stopAnimation();
    }

    constructor() {
        super();
        this.springValue = new Animated.Value(1);

        this.state = {
            selected: false
        };
    }

    spring() {
        const { position, starSelectedInPosition } = this.props;

        this.springValue.setValue(1.2);

        this.instance = Animated.spring(
            this.springValue,
            {
                toValue: 1,
                friction: 2,
                tension: 1
            }
        ).start();

        this.setState({ selected: !this.state.selected });
        starSelectedInPosition(position);
    }

    render() {
        const { fill, size, selectedColor, isDisabled, margin } = this.props;
        const starSource = fill && selectedColor === null ? STAR_SELECTED_IMAGE : STAR_IMAGE;

        return (
            <TouchableOpacity activeOpacity={1} onPress={this.spring.bind(this)} disabled={isDisabled}>
                <Animated.Image
                    source={starSource}
                    style={[
                        styles.starStyle,
                        {
                            margin: margin,
                            tintColor: fill && selectedColor ? selectedColor : undefined,
                            width: size || STAR_SIZE,
                            height: size || STAR_SIZE,
                            transform: [{ scale: this.springValue }]
                        }
                    ]}
                />
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    starStyle: {
        // margin: 3
        margin: 0
    }
});
