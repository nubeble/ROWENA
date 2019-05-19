import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Dimensions,
    ImageBackground, Animated, Keyboard, Platform, TextInput, Button
} from 'react-native';
import { Text, Theme, Firebase } from './rnff/src/components';
import { Constants, Linking, WebBrowser } from "expo";
import { Ionicons, AntDesign } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';
import CodeInput from 'react-native-confirmation-code-input';


export default class SignUpWithEmailVerification extends React.Component {
    state = {
        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - 60 - Cons.buttonHeight, // 60: gap

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        invalid: true,
        signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)',
        signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)',

        name: '',
        nameIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        emailVerificationState: 0 // 0: disappeared, 1: waiting, 2: checked
    };

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        var user = Firebase.auth.currentUser;
        user.sendEmailVerification().then(function () {
            // Email sent.
            console.log('Email sent.');

            // show hourglass
            this.setState({ emailVerificationState: 0 });

            let interval = null;
            interval = setInterval(() => {
                user.reload().then(() => {
                    if (interval && user.emailVerified) {
                        clearInterval(interval);
                        interval = null;

                        // resolve(user);
                        console.log('reload success.', user);

                        // hide hourglass
                        this.setState({ emailVerificationState: 2 });

                        // ToDo: move to next
                    }
                }, error => {
                    if (interval) {
                        clearInterval(interval);
                        interval = null;

                        console.log('reload failed!', error.message + ' (' + error.code + ')');

                        // console.log('registerUserAndWaitEmailVerification: reload failed ! ' + error.message + ' (' + error.code + ')');

                        // reject(error);


                        // ToDo: hide hourglass
                        this.setState({ emailVerificationState: 0 });

                        // ToDo: please try again
                    }
                });
            }, 1000);
        }).catch(function (error) {
            // An error happened.
            console.log('An error happened.', error);

            // ToDo: please try again
        });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.closed = true;
    }

    @autobind
    _keyboardDidShow(e) {
        const bottomPosition = Dimensions.get('window').height - e.endCoordinates.height;
        const signUpButtonTop = bottomPosition - 10 - Cons.buttonHeight; // 10: gap

        !this.closed && this.setState({ bottomPosition: bottomPosition, signUpButtonTop: signUpButtonTop });
    }

    @autobind
    _keyboardDidHide() {
        const bottomPosition = Dimensions.get('window').height;
        const signUpButtonTop = bottomPosition - 60 - Cons.buttonHeight; // 60: gap

        !this.closed && this.setState({ bottomPosition: bottomPosition, signUpButtonTop: signUpButtonTop });
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        // if (this.refs['nameInput']) this.refs['nameInput'].focus();
    }

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: Constants.statusBarHeight + 6,
                            duration: 200
                        })
                    ])
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        this._showNotification = false;
    }

    hideAlertIcon() {
        if (this.state.nameIcon !== 0) this.setState({ nameIcon: 0 });
    }

    render() {
        const email = this.props.navigation.state.params.email;
        const user = this.props.navigation.state.params.user;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const nameIcon = this.state.nameIcon;

        return (
            <ImageBackground
                style={{
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height
                }}
                source={PreloadImage.Background}
                resizeMode='cover'
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
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
                            <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                        </TouchableOpacity>

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
                                left: '50%',
                                width: '25%',
                                height: 3,
                                backgroundColor: "rgb(62, 165, 255)"
                            }} />
                        </View>
                    </View>

                    <Animated.View
                        style={[styles.notification, notificationStyle]}
                        ref={notification => this._notification = notification}
                    >
                        <Text style={styles.notificationText}>{this.state.notification}</Text>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideActiveAlertIcons();
                                }
                            }}
                        >
                            <Ionicons name='md-close' color="black" size={20} />
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ paddingTop: Theme.spacing.tiny }}>
                        <Text style={{
                            marginLeft: 22,
                            color: Theme.color.text2,
                            fontSize: 28,
                            lineHeight: 32,
                            fontFamily: "Roboto-Medium",
                            paddingTop: 2
                        }}>Enter verification code</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                                {"We've sent a text message with your verification code to "}
                                <Text style={{ color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                    {email}
                                </Text>
                            </Text>

                            {/*
                            <CodeInput
                                containerStyle={{ marginTop: 60 }}
                                ref="codeInput"
                                codeLength={6}
                                inputPosition='center'
                                size={40}
                                space={8}
                                className={'border-b'}
                                // secureTextEntry
                                keyboardType={"numeric"}
                                onFulfill={(code) => this.checkCode(code)}
                                codeInputStyle={{ fontSize: 22, fontFamily: "Roboto-Medium", color: Theme.color.text2 }}
                            />
                            */}
                            {
                                this.state.emailVerificationState &&
                                <View>
                                </View>
                            }
                        </View>
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}
                            onPress={() => {
                                setTimeout(() => {
                                    // this.submit(this.state.name);
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        );
    }

    validateName(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        console.log('text', text);


        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        // Consider: check character
        if (!text) {
            // hide icon
            this.setState({ nameIcon: 0 });
        } else {
            let reg = /^[a-zA-Z\s]*$/;
            if (reg.test(text) === false) {
                // hide icon
                this.setState({ nameIcon: 0 });
            } else {
                // show icon
                this.setState({ nameIcon: 2 });
            }
        }

        this.setState({ name: text });
    }

    submit(text) {
        if (this.state.nameIcon !== 2) {
            // show message box
            const msg = 'Please use valid characters for your name.';
            this.showNotification(msg);

            this.setState({ nameIcon: 1 });

            // set focus
            // this.refs['nameInput'].focus();

            return;
        }

        Vars.signUpName = this.state.name;

        const from = this.props.navigation.state.params.from;
        if (from === 'email') {
            this.props.navigation.navigate("signUpWithEmailMain");
        } else if (from === 'mobile') {
            this.props.navigation.navigate("signUpWithMobileMain");
        }
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        // backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        // backgroundColor: 'black'
    },
    signUpButton: {
        width: '85%',
        height: Cons.buttonHeight,
        // backgroundColor: Theme.color.buttonBackground,
        backgroundColor: Theme.color.selection,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityIndicator: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0
    },
    notification: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        height: (8 + 34 + 8) - 12,
        borderRadius: 5,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.notification,
        zIndex: 10000,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    notificationText: {
        width: Dimensions.get('window').width - (12 + 24) * 2, // 12: margin right, 24: button width
        fontSize: 15,
        lineHeight: 17,
        fontFamily: "Roboto-Medium",
        color: "black",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
