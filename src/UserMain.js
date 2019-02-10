import React from 'react';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, Dimensions } from 'react-native';


export default class UserMain extends React.Component {
    state = {
        // bottomPosition: Dimensions.get('window').height
    };

    render() {

        return (
            <View style={styles.container}>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'green'
    },

});
