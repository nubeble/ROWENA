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
const imageHeight = imageWidth / 380 * 260;

const contentText = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you";
const bottomPosition = Dimensions.get('window').height;
const buttonGap = 80;


export default class AdvertisementFinish extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementStart.handleHardwareBackPress');
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
                            // this.props.navigation.dispatch(NavigationActions.back());
                            setTimeout(() => {
                                this.props.navigation.navigate("profile");
                            }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    <Text style={{
                        marginTop: Theme.spacing.tiny,
                        paddingHorizontal: 22,
                        fontSize: 28,
                        lineHeight: 32, // ToDo: check ios!
                        color: Theme.color.text2,
                        fontFamily: "Roboto-Medium",
                        // textAlign: 'center'
                    }}>Let's wait awhile</Text>

                    <Image
                        style={{
                            marginTop: 80,
                            width: imageWidth * 0.7,
                            height: imageHeight * 0.7,
                            alignSelf: 'center'
                        }}
                        resizeMode={'contain'}
                        source={PreloadImage.wait}
                    />

                    <Text style={{
                        marginTop: 20,
                        paddingHorizontal: Theme.spacing.base,
                        color: Theme.color.text3,
                        fontSize: 16,
                        lineHeight: 24, // ToDo: check ios!
                        fontFamily: "Roboto-Light",
                        textAlign: 'center'
                    }}>{contentText}</Text>
                </View>

                <View style={{ position: 'absolute', top: bottomPosition - buttonGap - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            this.props.navigation.navigate("profile");
                        }, Cons.buttonTimeoutShort);
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
        backgroundColor: Theme.color.background
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
        backgroundColor: Theme.color.buttonBackground,
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
