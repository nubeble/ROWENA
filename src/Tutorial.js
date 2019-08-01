import React from 'react';
import { StyleSheet, View, Image, BackHandler } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { LinearGradient } from 'expo';
import { Ionicons, Entypo } from '@expo/vector-icons';
import AppIntroSlider from 'react-native-app-intro-slider';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";

const slides = [
    {
        key: 'slide1',
        title: 'Select your destination',
        text: 'Description.\nSay something cool',
        image: {
            uri: PreloadImage.tutorial1,
            width: 640,
            height: 640
        },
        backgroundColor: 'darkgreen'
    },
    {
        key: 'slide2',
        title: 'Take a look at your favorite person',
        text: 'Other cool stuff',
        image: {
            uri: PreloadImage.tutorial2,
            width: 640,
            height: 640
        },
        backgroundColor: 'darkorange'
    },
    {
        key: 'slide3',
        title: 'Connect with people',
        text: 'I\'m already out of descriptions\n\nLorem ipsum bla bla bla',
        image: {
            uri: PreloadImage.tutorial3,
            width: 640,
            height: 640
        },
        backgroundColor: 'brown'
    },
    {
        key: 'slide4',
        title: "Let's go for it!",
        text: 'I\'m already out of descriptions\n\nLorem ipsum bla bla bla',
        image: {
            uri: PreloadImage.tutorial4,
            width: 640,
            height: 640
        },
        backgroundColor: 'purple'
    }
];


export default class Tutorial extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        // ToDo: dialog - you wanna quit?

        // --
        console.log('move to main');
        this.props.navigation.navigate("mainStackNavigator");
        // --

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        return (
            <AppIntroSlider
                slides={slides}
                renderItem={this.renderItem}
                renderNextButton={this.renderNextButton}
                renderDoneButton={this.renderDoneButton}
                onDone={this.onDone}
            // showPrevButton, showSkipButton, bottomButton, hideNextButton, hideDoneButton
            // onSkip={() => console.log("skipped")}
            />
        );
    }

    @autobind
    renderItem({ item, index }) {
        const slide = item;

        return (
            <View style={[styles.flex, { /* backgroundColor: slide.backgroundColor */ backgroundColor: 'white' }]}>
                <Text style={styles.title}>{slide.title}</Text>
                <Image source={slide.image.uri}
                    style={{
                        width: slide.image.width,
                        height: slide.image.height,
                        resizeMode: 'cover',
                        // alignSelf: 'center'
                        marginLeft: 35,
                        // marginBottom: -84
                    }}
                />
            </View>
        );
    }

    @autobind
    renderNextButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, .4)',
            }}>
                <Ionicons name='md-arrow-round-forward' color='rgba(255, 255, 255, .9)' size={26} style={{ backgroundColor: 'transparent' }} />
            </View>
        );
    };

    @autobind
    renderDoneButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, .4)',
            }}>
                <Entypo name='check' color='rgba(255, 255, 255, .9)' size={26} style={{ backgroundColor: 'transparent' }} />
            </View>
        );
    };

    @autobind
    onDone() {
        setTimeout(() => {
            if (this.closed) return;
            console.log('move to main');
            this.props.navigation.navigate("mainStackNavigator");
        }, Cons.buttonTimeout);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        alignItems: 'center',
        // justifyContent: 'space-around'
    },
    title: {
        textAlign: 'center',
        fontSize: 34,
        lineHeight: 40,
        height: 40 * 2,
        // backgroundColor: 'black',
        fontFamily: "Chewy-Regular",
        // color: 'black',
        color: Theme.color.splash,
        paddingHorizontal: 10,
        marginTop: 50
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "Chewy-Regular",
        color: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 20,
        marginBottom: 80
    }
});
