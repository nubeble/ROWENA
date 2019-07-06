import _ from 'lodash';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { StyleSheet, View } from 'react-native';
import { Text } from "../../rnff/src/components";

import Star from './Star'

export default class AirbnbRating extends Component {
    static defaultProps = {
        defaultRating: 5,
        reviews: ["Terrible", "Bad", "Okay", "Good", "Great"],
        count: 5,
        onFinishRating: () => console.log('Rating selected. Attach a function here.'),
        showRating: true,
        readOnly: false
    };

    setPosition(position) {
        this.setState({ position: position });
    }

    /*
    stopAnimation() {
        for (let i = 0; i < this.refList.length; i++) {
            const ref = this.refList[i];
            ref.stopAnimation();
        }
    }
    */

    constructor() {
        super()

        this.state = {
            position: 5
        }

        this.refList = [];
    }

    componentDidMount() {
        const { defaultRating } = this.props

        this.setState({ position: defaultRating })
    }

    renderStars(rating_array) {
        return _.map(rating_array, (star, index) => {
            return star
        })
    }

    starSelectedInPosition(position) {
        const { onFinishRating } = this.props

        onFinishRating(position);

        this.setState({ position: position })
    }

    render() {
        const { position } = this.state
        const { count, reviews, showRating, readOnly, margin } = this.props

        const rating_array = []
        _.times(count, index => {
            rating_array.push(
                <Star
                    ref={(star) => { this.refList.push(star); }}
                    margin={margin}
                    key={index}
                    position={index + 1}
                    starSelectedInPosition={this.starSelectedInPosition.bind(this)}
                    fill={position >= index + 1}
                    isDisabled={readOnly}
                    {...this.props}
                />
            )
        })

        return (
            <View style={styles.ratingContainer}>
                {showRating &&
                    <Text style={styles.reviewText}>
                        {reviews[position - 1]}
                    </Text>
                }
                <View style={styles.starContainer}>
                    {this.renderStars(rating_array)}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    ratingContainer: {
        backgroundColor: 'transparent',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewText: {
        fontSize: 25,
        fontWeight: 'bold',
        margin: 10,
        color: 'rgba(230, 196, 46, 1)'
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
