import React from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';


export default class Me extends React.Component {
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
		backgroundColor: '#fff',
		// alignItems: 'center',
		justifyContent: 'center'
	}
});
