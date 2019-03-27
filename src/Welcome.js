import React from 'react';
import { StyleSheet, View, Image, Button, TouchableOpacity, Dimensions } from 'react-native';
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";
import { Text, Theme } from "./rnff/src/components";

// const titlePosition = Dimensions.get('window').height / 8;
const imageWidth = Dimensions.get('window').width - Theme.spacing.base * 2;
const imageHeight = imageWidth / 16 * 9;
const contentText = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you";
const bottomPosition = Dimensions.get('window').height;
const buttonGap = 80;


export default class Welcome extends React.Component {
    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                </View>

                <View style={styles.container}>
                    <Text style={{
                        // marginTop: titlePosition,
                        marginTop: 10,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 32,
                        paddingTop: 12,
                        // backgroundColor: 'green',
                        fontFamily: "Roboto-Medium",
                        textAlign: 'center'
                    }}>Welcome!</Text>

                    <Image
                        style={{
                            marginTop: 30,
                            width: imageWidth,
                            height: imageHeight
                        }}
                        resizeMode={'contain'}
                        source={PreloadImage.explore}
                    />

                    <Text style={{
                        marginTop: 10,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 16,
                        lineHeight: 30,
                        fontFamily: "Roboto-Light",
                        textAlign: 'center'
                    }}>{contentText}</Text>
                </View>

                <View style={{ position: 'absolute', top: bottomPosition - buttonGap - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            this.props.navigation.navigate("mainStackNavigator");
                        }, Cons.buttonTimeoutShort);
                    }} style={styles.signUpButton}>
                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: '#8EC2EA'
        // backgroundColor: Theme.color.flashBackground
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        paddingHorizontal: Theme.spacing.base
    },
    signUpButton: {
        width: '85%',
        height: 45,
        // backgroundColor: "rgba(255, 255, 255, 0.3)", // "transparent"
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
