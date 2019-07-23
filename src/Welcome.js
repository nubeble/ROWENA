import React from 'react';
import { StyleSheet, View, Image, Button, TouchableOpacity, Dimensions, BackHandler } from 'react-native';
import Constants from 'expo-constants';
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";
import { Text, Theme } from "./rnff/src/components";
import autobind from 'autobind-decorator';
import Util from "./Util";


export default class Welcome extends React.Component {
    constructor(props) {
        super(props);

        this.contentText = Util.getQuotes();
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        // ToDo: dialog - you wanna quit?

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
            <View style={[styles.flex, { paddingVertical: Cons.viewMarginVertical() }]}>
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

                {/* // render illustration */}
                <View style={styles.container}>
                    <Text style={{
                        marginTop: 8,
                        paddingHorizontal: 22,
                        fontSize: 28,
                        lineHeight: 32,
                        color: 'white',
                        fontFamily: "Chewy-Regular"
                    }}>Welcome!</Text>

                    <Image
                        style={{
                            marginTop: 80,
                            width: 1280 * 0.3,
                            height: 720 * 0.3,
                            resizeMode: 'cover',
                            alignSelf: 'center'
                        }}
                        source={PreloadImage.welcome}
                    />

                    <Text style={{
                        marginTop: 10,
                        paddingHorizontal: Theme.spacing.base,
                        color: 'white',
                        fontSize: 16,
                        lineHeight: 24,
                        fontFamily: "Chewy-Regular",
                        textAlign: 'center'
                    }}>{this.contentText}</Text>
                </View>

                <View style={{ position: 'absolute', top: Dimensions.get('window').height - (Cons.viewMarginVertical() + Cons.bottomButtonMarginBottom) - Cons.buttonHeight, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => {
                        setTimeout(() => {
                            if (this.closed) return;
                            // console.log('move to main');
                            // this.props.navigation.navigate("mainStackNavigator");

                            console.log('move to tutorial');
                            this.props.navigation.navigate("tutorial");
                        }, Cons.buttonTimeout);
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
