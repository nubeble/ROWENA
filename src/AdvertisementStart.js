import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, BackHandler, Dimensions, Platform } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import * as Permissions from 'expo-permissions';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Util from './Util';

const illustWidth = Dimensions.get('window').width - Theme.spacing.base * 2;
const illustHeight = illustWidth;


export default class AdvertisementStart extends React.Component {
    constructor(props) {
        super(props);

        this.contentText = Util.getQuotes();
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'AdvertisementStart.handleHardwareBackPress');
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
                        <Ionicons name='md-close' color="black" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    <Text style={{
                        marginTop: 8,
                        paddingHorizontal: 22,
                        fontSize: 28,
                        lineHeight: 32,
                        color: 'black',
                        fontFamily: "Chewy-Regular"
                    }}>{Platform.OS === 'android' ? "Let's set up your advertisement" : "Let's set up your post"}</Text>

                    <Image
                        style={{
                            marginTop: 100,
                            width: Cons.stickerWidth,
                            height: Cons.stickerHeight,
                            resizeMode: 'cover',
                            alignSelf: 'center'
                        }}
                        source={PreloadImage.advertisement}
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

                <View style={{ position: 'absolute', top: Dimensions.get('window').height - Cons.bottomButtonMarginBottom - Cons.buttonHeight, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            !this.closed && this.props.navigation.navigate("advertisementMain");
                        }, Cons.buttonTimeout);
                    }} style={styles.signUpButton}>
                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
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
