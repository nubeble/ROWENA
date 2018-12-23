import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

class JayButton extends Component {
    render() {
        const { text, onPress } = this.props;
        return (
            <TouchableOpacity style={styles.buttonStyle} onPress={() => onPress()}>
                <Text style={styles.textStyle}>{text}</Text>
            </TouchableOpacity>
        );
    }
}

JayButton.propTypes = {
    text: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center'
    },

    buttonStyle: {
        alignItems: 'center',
        backgroundColor: '#202646',
        padding: 10,
        borderRadius: 5
    }
});

export default JayButton;