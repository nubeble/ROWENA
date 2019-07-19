import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, BackHandler, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import * as Permissions from 'expo-permissions';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Util from "./Util";


export default class AdvertisementFinish extends React.Component {
    constructor(props) {
        super(props);

        this.contentText = Util.getQuotes();
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementStart.handleHardwareBackPress');
        // this.props.navigation.dispatch(NavigationActions.back());
        this.props.navigation.dismiss();

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    {/* close button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            setTimeout(() => {
                                !this.closed && this.props.navigation.dismiss();
                            }, Cons.buttonTimeout);
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {/* // render illustration */}
                <View style={styles.container}>
                    <Text style={{
                        marginTop: 8,
                        paddingHorizontal: 22,
                        fontSize: 28,
                        lineHeight: 32,
                        color: 'black',
                        fontFamily: "Chewy-Regular"
                    }}>Hope you find it</Text>

                    <Image
                        style={{
                            marginTop: 80,
                            width: 474 * 0.5,
                            height: 394 * 0.5,
                            resizeMode: 'cover',
                            alignSelf: 'center'
                        }}
                        source={PreloadImage.hope}
                    />

                    <Text style={{
                        marginTop: 20,
                        paddingHorizontal: Theme.spacing.base,
                        color: 'black',
                        fontSize: 16,
                        lineHeight: 24,
                        fontFamily: "Chewy-Regular",
                        textAlign: 'center'
                    }}>{this.contentText}</Text>
                </View>

                <View style={{ position: 'absolute', top: Dimensions.get('window').height - 60 - Cons.buttonHeight, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            !this.closed && this.props.navigation.dismiss();
                        }, Cons.buttonTimeout);
                    }} style={styles.signUpButton}>
                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Finish</Text>
                    </TouchableOpacity>
                </View>





                {/*
                <View style={styles.container}>

                    <Image
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                            // resizeMode: 'cover'
                        }}
                        resizeMode={'contain'}
                        source={require('../assets/sample4.jpg')}
                    />

                    <View style={{ position: 'absolute', top: Dimensions.get('window').height - Cons.searchBarHeight - buttonGap - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                        <TouchableOpacity
                            onPress={() => this.props.navigation.navigate("advertisementMain")}
                            style={styles.signUpButton}>
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'white' }}>Let's start!</Text>
                        </TouchableOpacity>
                    </View>

                </View>
                */}

            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: Theme.color.background
        backgroundColor: '#FFFFFF'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1
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
