import React from 'react';
import { StyleSheet, View, Image, Button, TouchableOpacity, Dimensions, BackHandler } from 'react-native';
import { Constants } from "expo";
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";
import { Text, Theme } from "./rnff/src/components";
import autobind from 'autobind-decorator';

// const titlePosition = Dimensions.get('window').height / 8;
const illustWidth = Dimensions.get('window').width - Theme.spacing.base * 2;
const illustHeight = illustWidth / 16 * 9;

const contentText = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you";


export default class Welcome extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {

        return true;
    }

    render() {
        // const from = this.props.navigation.state.params.from;
        let from = null;
        const params = this.props.navigation.state.params;
        if (params) {
            from = params.from;
        }

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    {
                        // from === 'MOBILE' || from === 'EMAIL' &&
                        from !== 'FACEBOOK' &&
                        <View style={{
                            position: 'absolute',
                            top: Constants.statusBarHeight,
                            width: '100%',
                            height: 3,
                            backgroundColor: "rgba(62, 165, 255, 0.4)"
                        }}>
                            <View style={{
                                position: 'absolute',
                                top: 0,
                                left: '75%',
                                width: '25%',
                                height: 3,
                                backgroundColor: "rgb(62, 165, 255)"
                            }} />
                        </View>
                    }
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
                            width: illustWidth,
                            height: illustHeight,
                            resizeMode: 'cover'
                        }}
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

                <View style={{ position: 'absolute', top: Dimensions.get('window').height - 60 - Cons.buttonHeight, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            if (this.closed) return;
                            console.log('move to main.');
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
        height: Cons.buttonHeight,
        // backgroundColor: Theme.color.buttonBackground,
        backgroundColor: Theme.color.selection,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
