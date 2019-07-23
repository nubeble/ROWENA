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
        title: 'Title 1',
        text: 'Description.\nSay something cool',
        image: {
            uri: PreloadImage.sample1,
            width: 554 * 0.5,
            height: 340 * 0.5
        },
        backgroundColor: '#59b2ab'
    },
    {
        key: 'slide2',
        title: 'Title 2',
        text: 'Other cool stuff',
        image: {
            uri: PreloadImage.sample2,
            width: 496 * 0.5,
            height: 403 * 0.5
        },
        backgroundColor: '#febe29'
    },
    {
        key: 'slide3',
        title: 'Title 3',
        text: 'I\'m already out of descriptions\n\nLorem ipsum bla bla bla',
        image: {
            uri: PreloadImage.sample3,
            width: 560 * 0.5,
            height: 304 * 0.5
        },
        backgroundColor: '#22bcb5'
    }
];


export default class Tutorial extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        // ToDo: dialog - you wanna quit?

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
        // console.log('item', item);

        const slide = item;

        return (
            <View style={[styles.flex, { paddingVertical: Cons.viewMarginVertical(), backgroundColor: slide.backgroundColor }]}>
                <Text style={styles.title}>{slide.title}</Text>
                <Image source={slide.image.uri}
                    style={{
                        width: slide.image.width,
                        height: slide.image.height,
                        resizeMode: 'cover',
                        // alignSelf: 'center'
                    }}
                />
                <Text style={styles.text}>{slide.text}</Text>
            </View>
        );
    }

    @autobind
    renderNextButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, .2)',
            }}>
                <Ionicons name='md-arrow-round-forward' color='rgba(255, 255, 255, .9)' size={26} style={{ backgroundColor: 'transparent' }} />
            </View>
        );
    };

    @autobind
    renderDoneButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, .2)',
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
        justifyContent: 'space-around'
    },
    title: {
        fontSize: 24,
        lineHeight: 28,
        fontFamily: "Roboto-Medium",
        color: 'white',
        paddingHorizontal: 20,
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
