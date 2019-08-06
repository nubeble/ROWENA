import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, BackHandler,
    Keyboard, Dimensions, Platform, TextInput, Image
} from 'react-native';
import { Linking } from "expo";
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Ionicons, AntDesign } from "react-native-vector-icons";
// import * as firebase from 'firebase';
import Firebase from './Firebase'
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import { Text, Theme } from "./rnff/src/components";
import { Cons } from "./Globals";
import { registerExpoPushToken } from './PushNotifications';
import { NavigationActions } from 'react-navigation';

// https://github.com/ttdung11t2/react-native-confirmation-code-input
import CodeInput from 'react-native-confirmation-code-input';

// import firebase from 'firebase/app';
// import 'firebase/auth';

// const CAPTCHA_URL = `https://rowena-88cfd.firebaseapp.com/recaptcha.html?appurl=${Linking.makeUrl('')}`;
const CAPTCHA_URL = `https://rowena-88cfd.web.app/recaptcha.html?appurl=${Linking.makeUrl('')}`;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default class SignUpWithMobileMain extends React.Component {
    state = {
        mode: 'PHONE', // 'PHONE', 'VERIFICATION'

        // user: undefined,
        confirmationResult: undefined,
        code: '',

        countryText: null, // United State (+1)
        dialCode: null, // +1
        countryTextColor: Theme.color.text2,


        phone: '',
        // password: '',

        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        pwIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        emailY: -1,

        showSignUpLoader: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        invalid: true, // button
        signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)',
        signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)',

        securePwInput: true,
        secureText: 'Show',

        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - Cons.bottomButtonMarginBottom - Cons.buttonHeight
    };

    componentDidMount() {
        console.log('SignUpWithMobileMain.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        /*
        this._handleOpenURL = this._handleOpenURL.bind(this);
        Linking.addEventListener('url', this._handleOpenURL);
        */
    }

    initFromSelect(result) { // country
        const countryText = result.name + ' (' + result.dial + ')';
        this.setState({ countryText, dialCode: result.dial });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        // Linking.removeEventListener('url', this._handleOpenURL);

        // unsubscribe
        // if (this.instance) this.instance();

        this.closed = true;
    }

    @autobind
    onFocus() {
        if (this.refs['emailInput']) this.refs['emailInput'].focus();
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();

            return true;
        }

        if (this.state.mode === 'PHONE') {
            this.props.navigation.dispatch(NavigationActions.back());
        } else if (this.state.mode === 'VERIFICATION') {
            this.setState(
                {
                    mode: 'PHONE',
                    confirmationResult: undefined,
                    code: '',
                    invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)"
                }
            );
        }

        return true;
    }

    @autobind
    _keyboardDidShow(e) {
        const bottomPosition = Dimensions.get('window').height - e.endCoordinates.height;
        const signUpButtonTop = bottomPosition - 10 - Cons.buttonHeight; // 10: gap

        !this.closed && this.setState({ bottomPosition: bottomPosition, signUpButtonTop: signUpButtonTop });
    }

    @autobind
    _keyboardDidHide(e) {
        const bottomPosition = Dimensions.get('window').height;
        const signUpButtonTop = bottomPosition - Cons.bottomButtonMarginBottom - Cons.buttonHeight;

        !this.closed && this.setState({ bottomPosition: bottomPosition, signUpButtonTop: signUpButtonTop });
    }

    showNotification(msg) {
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: Constants.statusBarHeight + 6,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.state.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.state.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
    }

    validateNumber(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        // check number
        let result = true;
        let newText = '';
        let numbers = '0123456789';
        for (let i = 0; i < text.length; i++) {
            if (numbers.indexOf(text[i]) > -1) {
                newText = newText + text[i];
            } else {
                /*
                this.showNotification('Please enter numbers only.');

                // show icon
                this.setState({ emailIcon: 1 });
                */

                result = false;
                break;
            }
        }

        if (result) this.setState({ phone: newText });
    }

    render() {
        const emailIcon = this.state.emailIcon;
        const pwIcon = this.state.pwIcon;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={{ flex: 1 }}>
                <Image
                    style={{ width: windowWidth, height: windowHeight, resizeMode: 'cover' }}
                    source={PreloadImage.background}
                    fadeDuration={0}
                />

                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
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

                    <View style={styles.searchBar}>
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
                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideActiveAlertIcons();
                                }

                                if (this.state.mode === 'PHONE') {
                                    this.props.navigation.dispatch(NavigationActions.back());
                                } else if (this.state.mode === 'VERIFICATION') {
                                    this.setState(
                                        {
                                            mode: 'PHONE',
                                            confirmationResult: undefined,
                                            code: '',
                                            invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)"
                                        }
                                    );
                                }
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
                                left: this.state.mode === 'PHONE' ? '25%' : '50%',
                                width: '25%',
                                height: 3,
                                backgroundColor: "rgb(62, 165, 255)"
                            }} />
                        </View>
                    </View>

                    {
                        this.state.mode === 'PHONE' ?
                            <View style={{ paddingTop: Theme.spacing.tiny }}>
                                <Text style={{
                                    marginLeft: 22,
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32,
                                    fontFamily: "Roboto-Medium",
                                    paddingTop: 2
                                }}>What's your mobile number?</Text>

                                <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row' }}
                                        onPress={() => {
                                            if (this._showNotification) {
                                                this.hideNotification();
                                                this.hideAlertIcons();
                                            }

                                            this.props.navigation.navigate("signUpWithMobileCountrySelection", {
                                                from: 'SignUpWithMobileMain',
                                                initFromSelect: (result) => this.initFromSelect(result)
                                            });
                                        }}
                                    >
                                        <Text style={{ marginBottom: 10, paddingLeft: 18, color: this.state.countryTextColor, fontSize: 16, fontFamily: "Roboto-Regular" }}>
                                            {this.state.countryText ? this.state.countryText : 'Select your country'}
                                        </Text>
                                        <Ionicons style={{ paddingLeft: 6, paddingTop: 3 }} name='md-arrow-dropdown' color={this.state.countryTextColor} size={16} />
                                    </TouchableOpacity>

                                    <TextInput
                                        ref='emailInput'
                                        style={{ height: 40, paddingLeft: 18, paddingRight: 56, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                        keyboardType={"numeric"}
                                        maxLength={20}
                                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                        onChangeText={(text) => this.validateNumber(text)}
                                        value={this.state.phone}
                                        selectionColor={Theme.color.selection}
                                        // keyboardAppearance={'dark'}
                                        underlineColorAndroid="transparent"
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                    {
                                        /*
                                        this.state.phone.length > 0 &&
                                        <TouchableOpacity
                                            style={{
                                                width: 40, height: 40, justifyContent: "center", alignItems: "center",
                                                position: 'absolute', right: 48, top: 33
                                            }}
                                            onPress={() => {
                                                if (this._showNotification) {
                                                    this.hideNotification();
                                                    this.hideAlertIcons();
                                                }
 
                                                this.setState({ phone: '' });
 
                                                // disable
                                                this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
                                            }}
                                        >
                                            <Ionicons name='ios-close-circle' color='rgba(255, 255, 255, 0.8)' size={20} />
                                        </TouchableOpacity>
                                        */
                                    }

                                    <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                        onLayout={(e) => {
                                            const { y } = e.nativeEvent.layout;
                                            this.setState({ emailY: y });
                                        }}
                                    />
                                    {this.state.emailY !== -1 && emailIcon === 0 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.emailY - 34 }} name='exclamationcircleo' color="transparent" size={27} />}
                                    {this.state.emailY !== -1 && emailIcon === 1 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.emailY - 34 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={27} />}
                                    {this.state.emailY !== -1 && emailIcon === 2 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.emailY - 34 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={27} />}
                                </View>
                            </View>
                            :
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
                                            {this.state.dialCode + this.state.phone}
                                        </Text>
                                    </Text>
                                    {/*
                                    <TouchableOpacity
                                        style={{ marginTop: 6, marginBottom: 12 }}
                                        onPress={() => {
                                            // ToDo: resend code
                                        }}
                                    >
                                        <Text style={{ paddingHorizontal: 18, color: Theme.color.text1, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                            {"RESEND"}
                                        </Text>
                                    </TouchableOpacity>
                                    */}

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
                                </View>
                            </View>
                    }

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => this.buttonClick()} style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}>
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>
                                {this.state.mode === 'PHONE' ? 'Next' : 'Sign up'}
                            </Text>
                            {
                                this.state.showSignUpLoader &&
                                <ActivityIndicator
                                    style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 1000 }}
                                    animating={true}
                                    size="small"
                                    color={this.state.signUpButtonTextColor}
                                />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    hideAlertIcons() {
        if (this.state.emailIcon !== 0) this.setState({ emailIcon: 0 });

        if (this.state.pwIcon !== 0) this.setState({ pwIcon: 0 });

        if (this.state.countryTextColor !== Theme.color.text2) this.setState({ countryTextColor: Theme.color.text2 });
    }

    hideActiveAlertIcons() { // hide only alert icon
        if (this.state.emailIcon === 1) this.setState({ emailIcon: 0 });

        if (this.state.pwIcon === 1) this.setState({ pwIcon: 0 });

        if (this.state.countryTextColor !== Theme.color.text2) this.setState({ countryTextColor: Theme.color.text2 });
    }

    onPhoneChange = (phone) => {
        console.log('SignUpWithMobileMain.onPhoneChange');

        this.setState({ phone });
    }

    onPhoneComplete = async () => {
        console.log('SignUpWithMobileMain.onPhoneComplete');

        if (!this.state.dialCode) {
            this.showNotification('Please select your country calling code.');
            this.setState({ countryTextColor: Theme.color.notification });
            return;
        }

        let token = null;
        const listener = ({ url }) => {
            if (Platform.OS === 'ios') WebBrowser.dismissBrowser();
            const tokenEncoded = Linking.parse(url).queryParams['token'];
            if (tokenEncoded) token = decodeURIComponent(tokenEncoded);
        }

        Linking.addEventListener('url', listener);
        await WebBrowser.openBrowserAsync(CAPTCHA_URL);
        Linking.removeEventListener('url', listener);

        console.log('SignUpWithMobileMain.token', token);

        if (token) {
            const { dialCode, phone } = this.state;
            const number = dialCode + phone;
            const captchaVerifier = {
                type: 'recaptcha',
                verify: () => Promise.resolve(token)
            };

            try {
                Firebase.auth.languageCode = 'en';
                const confirmationResult = await Firebase.auth.signInWithPhoneNumber(number, captchaVerifier);

                this.setState({
                    confirmationResult,
                    mode: 'VERIFICATION',
                    invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)'
                });
            } catch (error) {
                console.log('onPhoneComplete error', error.code, error.message);

                // ToDo: error handling
                if (error.code === 'auth/too-many-requests') {
                    // this.showNotification('We have blocked all requests from this device due to unusual activity. Try again later.');
                    this.showNotification('Unusual activity. Please try again later.');
                } else {
                    this.showNotification('An error happened. Please try again.');
                }
            }
        }

        // await WebBrowser.openBrowserAsync(CAPTCHA_URL);
    }

    /*
    async _handleOpenURL(event) {
        if (Platform.OS === 'ios') WebBrowser.dismissBrowser(); // iOS only

        const url = event.url;
        let token = null;
        const tokenEncoded = Linking.parse(url).queryParams['token'];
        if (tokenEncoded) token = decodeURIComponent(tokenEncoded);

        console.log('_handleOpenURL, token', token);
        // 03AOLTBLRtdul18NggbyqigtFmG5Mv9EUdYYwdE_ezyxbLXLxVLAxYN6mBmaMIkx2SvNNeMyXX81NA6-488D_byqOjQ8yRIB4RcXGi7oZBjkqkzxHSuZGVSoJbyE3fKast9tSytKf38V27QalswFZTibDLcJpVG-epcCimhajwpR0PhFMBqPb4WdjvVTP2UiXCVX8KwLqFIaqCtQLovhevdRhJsWpUgZuRrJS0iWiNguUw1xl958bYYZq9CRd3hj4ujLOo75MPXW7TR9YN-SjflxDVE54bJt3na4ZqatENyeMYhm09tyu4Zbaxqq6yOeR68p0vYPONvmlNB28auzyGVmtfELDyCQ41_Q

        if (token) {
            const { dialCode, phone } = this.state;
            const number = dialCode + phone;

            const captchaVerifier = {
                type: 'recaptcha',
                verify: () => Promise.resolve(token)
            };

            try {
                Firebase.auth.languageCode = 'en';
                const confirmationResult = await Firebase.auth.signInWithPhoneNumber(number, captchaVerifier);

                this.setState({
                    confirmationResult,
                    mode: 'VERIFICATION',
                    invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)'
                });
            } catch (error) {
                console.log('onPhoneComplete error', error.code, error.message);

                // ToDo: error handling
                if (error.code === 'auth/too-many-requests') {
                    // this.showNotification('We have blocked all requests from this device due to unusual activity. Try again later.');
                    this.showNotification('Unusual activity. Please try again later.');
                } else {
                    this.showNotification('An error happened. Please try again.');
                }

                // ToDo: test
                // this.showNotification(error.code + error.message);
            }
        }
    }
    */

    onSignIn = async () => {

        /*
        this.instance = Firebase.auth.onAuthStateChanged(async (user) => {
            console.log('SignUpWithMobileMain.onAuthStateChanged', user);

            this.props.navigation.navigate("signUpWithMobilePassword");
        });
        */

        const { confirmationResult, code } = this.state;

        try {
            const user = await confirmationResult.confirm(code);
            console.log('user', user);

            // save token
            // if (user.additionalUserInfo && user.additionalUserInfo.isNewUser) {
            await registerExpoPushToken(user.user.uid, user.user.phoneNumber);
            // }
        } catch (error) {
            console.log('onSignIn error', error.code, error.message);

            // ToDo: error handling
            if (error.code === 'auth/invalid-verification-code') {
                // The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure use the verification code provided by the user
                this.showNotification('The SMS verification code is invalid. Please resend the verification code.');
            } else if (error.code === 'auth/missing-verification-code') {
                // The phone auth credential was created with an empty SMS verification code.
                this.showNotification('Empty SMS verification code. Please resend the verification code.');
            } else {
                this.showNotification('An error happened. Please try again.');
            }

            // reset
            this.setState({
                confirmationResult: undefined,
                code: '',
                // phone: '',
                mode: 'PHONE'
            });

            // this.refs.codeInput.clear();
        }
    }

    async buttonClick() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        // show indicator
        this.setState({ showSignUpLoader: true });

        if (this.state.mode === 'PHONE') {
            // ToDo: validation check

            await this.onPhoneComplete();
        } else if (this.state.mode === 'VERIFICATION') {
            // ToDo: validation check

            await this.onSignIn();
        }

        // hide indicator
        !this.closed && this.setState({ showSignUpLoader: false });
    }

    checkCode(code) {
        console.log('checkCode', code);
        this.setState({ code }, () => {
            this.buttonClick();
        });

        // enable
        this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
    }
}

const styles = StyleSheet.create({
    /*
    container: {
        flex: 1
    },
    */
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8, // paddingBottom from searchBar
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    signUpButton: {
        width: '85%',
        height: Cons.buttonHeight,
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        /*
        borderColor: "transparent",
        borderWidth: 0,
        */
        justifyContent: 'center',
        alignItems: 'center'
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
