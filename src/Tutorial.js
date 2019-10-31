import React from 'react';
import { StyleSheet, View, Image, BackHandler, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { LinearGradient } from 'expo';
import { Ionicons, Entypo, FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import AppIntroSlider from 'react-native-app-intro-slider';
import autobind from 'autobind-decorator';
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const slides = [
    {
        key: 'slide1',
        title: 'Select your destination',
        text: 'Description.\nSay something cool',
        image: {
            uri: PreloadImage.tutorial1,
            width: 624,
            height: 1224
        },
        backgroundColor: 'darkgreen'
    },
    {
        key: 'slide2',
        title: 'Take a look at your favorite person',
        text: 'Other cool stuff',
        image: {
            uri: PreloadImage.tutorial2,
            width: 624,
            height: 1224
        },
        backgroundColor: 'darkorange'
    },
    {
        key: 'slide3',
        title: 'Connect with people',
        text: 'I\'m already out of descriptions\n\nLorem ipsum bla bla bla',
        image: {
            uri: PreloadImage.tutorial3,
            width: 624,
            height: 1224
        },
        backgroundColor: 'brown'
    },
    {
        key: 'slide4',
        title: "Let's go for it!",
        text: 'I\'m already out of descriptions\n\nLorem ipsum bla bla bla',
        image: {
            uri: PreloadImage.tutorial4,
            width: 624,
            height: 1224
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
        // --
        console.log('jdub', 'move to main');
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

                dotStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                activeDotStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}

                renderNextButton={this.renderNextButton}
                renderDoneButton={this.renderDoneButton}
                onDone={this.onDone}
            // showPrevButton, showSkipButton, bottomButton, hideNextButton, hideDoneButton
            // onSkip={() => console.log('jdub', "skipped")}
            />
        );
    }

    @autobind
    renderItem({ item, index }) {
        const slide = item;

        let icon = null;
        if (index === 0) {
            icon = (
                <View style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name='place' color="black" size={50} />
                </View>
            );
        } else if (index === 1) {
            icon = (
                <View style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name='search' color="black" size={42} />
                </View>
            );
        } else if (index === 2) {
            icon = (
                <View style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name='globe' color="black" size={44} />
                </View>
            );
        } else if (index === 3) {
            icon = (
                <View style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name='thumbs-up' color="black" size={42} />
                </View>
            );
        }

        const imageHeight = windowHeight * 0.6;
        const imageWidth = imageHeight * slide.image.width / slide.image.height;

        return (
            <View style={styles.flex}>
                {icon}

                <View style={{ marginTop: 8, height: 100, alignItems: 'center', paddingHorizontal: 10 }}>
                    <Text style={styles.title}>{slide.title}</Text>
                </View>

                <Image source={slide.image.uri}
                    style={{
                        width: imageWidth,
                        height: imageHeight,
                        resizeMode: 'cover',
                        marginBottom: '10%'
                    }}
                />
            </View>
        );
    }

    @autobind
    renderNextButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}>
                <Ionicons name='md-arrow-round-forward' color='white' size={26} />
            </View>
        );
    };

    @autobind
    renderDoneButton() {
        return (
            <View style={{
                width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: Theme.color.selection,
            }}>
                <Entypo name='check' color="white" size={26} />
            </View>
        );
    };

    @autobind
    onDone() {
        setTimeout(() => {
            if (this.closed) return;
            console.log('jdub', 'move to main');
            this.props.navigation.navigate("mainStackNavigator");
        }, Cons.buttonTimeout);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    title: {
        fontSize: 34,
        lineHeight: 40,
        fontFamily: "Chewy-Regular",
        color: 'black',
        textAlign: 'center'
    }
});
