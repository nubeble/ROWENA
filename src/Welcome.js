import React from 'react';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity, Dimensions } from 'react-native';


export default class Welcome extends React.Component {
    state = {
        bottomPosition: Dimensions.get('window').height
    };

    render() {
        const buttonGap = 80;

        return (
            <View style={styles.container}>
                <Image
                    style={{ width: '100%', height: 200, marginTop: 80, marginBottom: 40 }}
                    resizeMode={'cover'}
                    source={require('../assets/sample2.png')}
                />

                <Image
                    style={{ width: '100%', height: 200 }}
                    resizeMode={'contain'}
                    source={require('../assets/sample3.png')}
                />


                <View style={{ position: 'absolute', top: this.state.bottomPosition - buttonGap - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('mainStackNavigator')} style={styles.signUpButton}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Get Started</Text>
                    </TouchableOpacity>
                </View>


            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'rgb(175, 175, 175)'
    },
    signUpButton: {
        width: '85%',
        height: 45,
        backgroundColor: "rgba(255, 255, 255, 0.3)", // "transparent"
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
