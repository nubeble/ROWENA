import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


export default class Test extends React.Component {

    render() {
        return (
            <View style={styles.container}>

                <View style={styles.header}><Text>header</Text></View>
                <View style={styles.title}><Text>title</Text></View>
                <View style={styles.content}><Text>content</Text></View>
                <View style={styles.footer}><Text>footer</Text></View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50,
        backgroundColor: 'black',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center'
    },

    header: {
        width: '100%',
        height: '10%',
        backgroundColor: '#ff9a9a',
        justifyContent: 'center',
        alignItems: 'center'
    },

    title: {
        width: '100%',
        height: '20%',
        backgroundColor: '#9aa9ff',
        justifyContent: 'center',
        alignItems: 'center'
    },

    content: {
        flex: 1,
        backgroundColor: '#d6ca1a',

        // justifyContent: 'center',
        alignItems: 'stretch',
        padding: 10
    },

    footer: {
        width: '100%',
        height: '10%',
        backgroundColor: '#1ad657',
        justifyContent: 'center',
        alignItems: 'center'
    },

});

