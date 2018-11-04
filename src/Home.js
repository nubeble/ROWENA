import React from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';

import Detail from './Detail';

export default class Home extends React.Component {
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
		justifyContent: 'center',
	},

});




'현재 위치를 가져온 후, 검색 & 게시판 화면 표시'

// Photos.js
