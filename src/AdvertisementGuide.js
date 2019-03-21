import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, BackHandler, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';

const imageWidth = Dimensions.get('window').width - Theme.spacing.base * 2;
const imageHeight = imageWidth / 650 * 597;
const contentText = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you";
const bottomPosition = Dimensions.get('window').height;
const buttonGap = 80;


export default class AdvertisementGuide extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementGuide.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="black" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    <Text style={{
                        marginTop: Theme.spacing.tiny,
                        paddingHorizontal: 22,
                        fontSize: 28,
                        lineHeight: 46, // ToDo: check ios!
                        color: 'black',
                        fontFamily: "SFProText-Semibold",
                        // textAlign: 'center'
                    }}>Let's set up your listing</Text>

                    <Image
                        style={{
                            marginTop: 30,
                            width: imageWidth * 0.6,
                            height: imageHeight * 0.6,
                            alignSelf: 'center'
                        }}
                        resizeMode={'contain'}
                        source={PreloadImage.advertisement}
                    />

                    <Text style={{
                        marginTop: 10,
                        paddingHorizontal: Theme.spacing.base,
                        color: 'black',
                        fontSize: 16,
                        lineHeight: 30, // ToDo: check ios!
                        fontFamily: "SFProText-Regular",
                        textAlign: 'center'
                    }}>{contentText}</Text>
                </View>

                <View style={{ position: 'absolute', top: bottomPosition - buttonGap - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            this.props.navigation.navigate("advertisementMain");
                        }, Cons.buttonTimeoutShort);
                    }} style={styles.signUpButton}>
                        <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'black', paddingTop: Cons.submitButtonPaddingTop() }}>Next</Text>
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
                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'white', paddingTop: Cons.submitButtonPaddingTop() }}>Let's start!</Text>
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
        backgroundColor: '#F6F6F6'
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
        height: 45,
        backgroundColor: "rgba(255, 255, 255, 0.6)", // "transparent"
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
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

