import React from 'react';
import {
    StyleSheet, View, ImageBackground, TouchableOpacity, ActivityIndicator, Animated, BackHandler,
    Keyboard, Dimensions, Platform, TextInput, Button
} from 'react-native';
import { Constants, Linking, WebBrowser } from "expo";
import { Ionicons, AntDesign } from "react-native-vector-icons";
// import * as firebase from 'firebase';
import Firebase from './Firebase'
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import { Text, Theme } from "./rnff/src/components";
import { Cons } from "./Globals";
import { registerExpoPushToken } from './PushNotifications';
// https://github.com/ttdung11t2/react-native-confirmation-code-input
import CodeInput from 'react-native-confirmation-code-input';

// import firebase from 'firebase/app';
// import 'firebase/auth';

const captchaUrl = `https://rowena-88cfd.firebaseapp.com/recaptcha.html?appurl=${Linking.makeUrl('')}`;


export default class SignUpWithMobileMain extends React.Component {
    state = {
        mode: 'PHONE', // 'PHONE', 'VERIFICATION'
        buttonText: 'Next',

        // user: undefined,
        confirmationResult: undefined,
        code: '',

        countryText: null, // United State (+1)
        dialCode: null, // +1


        // phone: '01093088300', // ToDo: test
        phone: '',
        // password: '',

        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        pwIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        showSignUpLoader: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        invalid: true,
        signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)',
        signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)',

        securePwInput: true,
        secureText: 'Show',

        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - 60 - Cons.buttonHeight // 60: gap
    };

    componentDidMount() {
        console.log('SignUpWithMobileMain.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        setTimeout(() => {
            !this.closed && this.refs['emailInput'] && this.refs['emailInput'].focus();
        }, Cons.buttonTimeoutLong);
    }

    initFromSelect(result) { // country
        const countryText = result.name + ' (' + result.dial + ')';
        this.setState({ countryText, dialCode: result.dial });

        // set focus
        // !this.closed && this.refs['emailInput'] && this.refs['emailInput'].focus();
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();

            return true;
        }

        this.props.navigation.navigate("authMain");

        return true;
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

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
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

    validateNumber(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        this.setState({ phone: text });

        // ToDo: check number
        /*
        let reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (reg.test(String(text).toLowerCase()) === false) {
            // console.log('Please enter a valid email address.');

            // show icon
            this.setState({ emailIcon: 0 });
        } else {
            console.log("Email is Correct");

            // show icon
            this.setState({ emailIcon: 2 });
        }
        */
    }

    validateCode(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        this.setState({ code: text });

        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }
    }

    moveToPassword(text) {
        if (this.state.emailIcon !== 2) {
            // console.log('Please enter a valid email address.');

            // show message box
            this.showNotification('Please enter a valid email address.');

            this.setState({ emailIcon: 1 });

            // set focus
            this.refs['emailInput'].focus();

            return;
        }

        // set focus
        this.refs['pwInput'].focus();
    }

    moveToSignUp(text) {
        if (this.state.pwIcon !== 2) {

            // show message box
            const msg = this.getPasswordErrorMessage(this.state.password);
            this.showNotification(msg);

            this.setState({ pwIcon: 1 });

            // set focus
            this.refs['pwInput'].focus();

            return;
        }

        this.processSignUp();
    }

    getPasswordErrorMessage(text) {
        if (text.length < 6) {
            return 'Must be at least 6 characters.';
        }

        if (/\d/.test(text) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(text)) {
            return ' Email is Correct';
        } else {
            return 'Must have at least one symbol or number.';
        }
    }

    toggleSecureText() {
        if (this.state.secureText === 'Show') {
            console.log('toggleSecureText', 'show -> hide');
            this.setState({ secureText: 'Hide', securePwInput: false });
        } else {
            console.log('toggleSecureText', 'hide -> show');
            this.setState({ secureText: 'Show', securePwInput: true });
        }

        // ToDo: don't need this in ios, not working in android!
        /*
        if (Platform.OS === 'android') {
            this.refs['pwInput'].setNativeProps(
                { selection: { start: this.state.password.length - 1, end: this.state.password.length - 1 } }
            );
        }
        */
    }

    signUp() {
        if (this.state.emailIcon !== 2) {
            // console.log('Please enter a valid email address.');

            // show message box
            this.showNotification('Please enter a valid email address.');

            this.setState({ emailIcon: 1 });

            // set focus
            this.refs['emailInput'].focus();

            return;
        }

        if (this.state.pwIcon !== 2) {

            // show message box
            const msg = this.getPasswordErrorMessage(this.state.password);
            this.showNotification(msg);

            this.setState({ pwIcon: 1 });

            // set focus
            this.refs['pwInput'].focus();

            return;
        }

        // hide keyboard
        this.refs['emailInput'].blur();
        this.refs['pwInput'].blur();

        this.processSignUp();
    }

    async processSignUp() {
        // show indicator
        this.setState({ showSignUpLoader: true });

        try {
            const user = await Firebase.auth.createUserWithEmailAndPassword(this.state.email, this.state.password);
            console.log('user', user);

            // save token
            if (user.additionalUserInfo && user.additionalUserInfo.isNewUser) {
                registerExpoPushToken(user.user.uid, user.user.displayName);
            }

            /*
            // check existance
            const profile = await Firebase.getProfile(user.user.uid);
            if (profile) {
                // update
                const data = {
                    name: user.user.displayName,
                    email: user.user.email,
                    phoneNumber: user.user.phoneNumber
                };

                await Firebase.updateProfile(user.user.uid, data);
            } else {
                // create
                // save user info to database
                await Firebase.createProfile(user.user.uid, user.user.displayName, user.user.email, user.user.phoneNumber);
            }
            */
        } catch (error) {
            console.log('error', error.code, error.message);

            if (error.code === 'auth/email-already-in-use') {
                this.showNotification('The email address is already in use.');
            } else if (error.code === 'auth/network-request-failed') {
                this.showNotification('A network error occurred. Please try again.');
            } else {
                this.showNotification('An error occurred. Please try again.');
            }
        }

        // close indicator
        !this.closed && this.setState({ showSignUpLoader: false });
    }

    render() {
        const emailIcon = this.state.emailIcon;
        const pwIcon = this.state.pwIcon;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

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
                                this.props.navigation.navigate("authMain");
                            }}
                        >
                            <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                        </TouchableOpacity>
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

                    {
                        !this.state.confirmationResult ?
                            <View style={{ paddingTop: Theme.spacing.tiny }}>
                                <Text style={{
                                    marginLeft: 22,
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32, // ToDo: check in ios
                                    fontFamily: "Roboto-Medium",
                                    paddingTop: 8
                                }}>What's your mobile number?</Text>

                                <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
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
                                        <Text style={{ marginBottom: 10, paddingLeft: 18, color: Theme.color.text2, fontSize: 16, fontFamily: "Roboto-Regular" }}>
                                            {this.state.countryText ? this.state.countryText : 'Select your country'}
                                        </Text>
                                        <Ionicons style={{ paddingLeft: 6, paddingBottom: 10 }} name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={16} />
                                    </TouchableOpacity>

                                    <TextInput
                                        ref='emailInput'
                                        style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                        keyboardType={'phone-pad'}
                                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                        onChangeText={(text) => this.validateNumber(text)}
                                        selectionColor={Theme.color.selection}
                                        // keyboardAppearance={'dark'}
                                        underlineColorAndroid="transparent"
                                        autoCorrect={false}
                                        autoCapitalize="none"

                                    // value={this.state.email}
                                    />

                                    <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                        onLayout={(e) => {
                                            const { y } = e.nativeEvent.layout;
                                            this.emailY = y;
                                        }}
                                    />
                                    {/* to block shaking */}
                                    {(emailIcon === 0) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='exclamationcircleo' color="transparent" size={30} />}
                                    {(emailIcon === 1) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={30} />}
                                    {(emailIcon === 2) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={30} />}
                                </View>
                            </View>
                            :
                            <View style={{ paddingTop: Theme.spacing.tiny }}>
                                <Text style={{
                                    marginLeft: 22,
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32, // ToDo: check in ios
                                    fontFamily: "Roboto-Medium",
                                    paddingTop: 8
                                }}>Enter verification code</Text>

                                <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                                    <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                                        {"We've sent a text message with your verification code to "}
                                        <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                            {this.state.dialCode + this.state.phone}
                                        </Text>
                                    </Text>

                                    {/*
                                    <TextInput
                                        ref='codeInput'
                                        style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                        keyboardType="numeric"
                                        value={this.state.code}
                                        onChangeText={(text) => this.validateCode(text)}
                                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                        selectionColor={Theme.color.selection}
                                        // keyboardAppearance={'dark'}
                                        underlineColorAndroid="transparent"
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />

                                    <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                        onLayout={(e) => {
                                            const { y } = e.nativeEvent.layout;
                                            this.emailY = y;
                                        }}
                                    />
                                    */}



                                    <CodeInput
                                        ref="codeInput"
                                        codeLength={6}
                                        inputPosition='center'
                                        size={40}
                                        space={8}
                                        className={'border-b'}
                                        // secureTextEntry
                                        keyboardType="numeric"
                                        onFulfill={(code) => this.checkCode(code)}
                                        codeInputStyle={{ fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                    />
                                    {/*
                                    <CodeInput
                                        ref="codeInputRef2"
                                        secureTextEntry
                                        compareWithCode='AsDW2'
                                        activeColor='rgba(49, 180, 4, 1)'
                                        inactiveColor='rgba(49, 180, 4, 1.3)'
                                        autoFocus={false}
                                        ignoreCase={true}
                                        inputPosition='center'
                                        size={50}
                                        onFulfill={(isValid) => this._onFinishCheckingCode1(isValid)}
                                        containerStyle={{ marginTop: 30 }}
                                        codeInputStyle={{ borderWidth: 1.5 }}
                                    />

                                    <CodeInput
                                        ref="codeInputRef2"
                                        keyboardType="numeric"
                                        codeLength={5}
                                        className='border-circle'
                                        compareWithCode='12345'
                                        autoFocus={false}
                                        codeInputStyle={{ fontWeight: '800' }}
                                        onFulfill={(isValid, code) => this._onFinishCheckingCode2(isValid, code)}
                                    />
*/}







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
            </ImageBackground>
        );
    }

    hideEmailIcon() {
        if (this.state.emailIcon !== 0) this.setState({ emailIcon: 0 });
    }

    hidePasswordIcon() {
        if (this.state.pwIcon !== 0) this.setState({ pwIcon: 0 });
    }

    hideAlertIcons() {
        if (this.state.emailIcon !== 0) this.setState({ emailIcon: 0 });

        if (this.state.pwIcon !== 0) this.setState({ pwIcon: 0 });
    }

    hideActiveAlertIcons() { // hide only alert icon
        if (this.state.emailIcon === 1) this.setState({ emailIcon: 0 });

        if (this.state.pwIcon === 1) this.setState({ pwIcon: 0 });
    }

    onPhoneChange = (phone) => {
        console.log('SignUpWithMobileMain.onPhoneChange');

        this.setState({ phone });
    }

    onPhoneComplete = async () => {
        console.log('SignUpWithMobileMain.onPhoneComplete');

        let token = null;
        const listener = ({ url }) => {
            WebBrowser.dismissBrowser();

            const tokenEncoded = Linking.parse(url).queryParams['token'];
            if (tokenEncoded) token = decodeURIComponent(tokenEncoded);
        }

        Linking.addEventListener('url', listener);

        await WebBrowser.openBrowserAsync(captchaUrl);

        Linking.removeEventListener('url', listener);

        console.log('SignUpWithMobileMain.token', token);

        if (token) {
            const { dialCode, phone } = this.state;
            const number = dialCode + phone;

            //fake firebase.auth.ApplicationVerifier
            const captchaVerifier = {
                type: 'recaptcha',
                verify: () => Promise.resolve(token)
            };

            try {
                // Firebase.auth.languageCode = 'en';
                const confirmationResult = await Firebase.auth.signInWithPhoneNumber(number, captchaVerifier);

                console.log('confirmationResult', confirmationResult);

                this.setState({
                    confirmationResult,
                    mode: 'VERIFICATION',
                    invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)'
                });

            } catch (error) {
                console.log('error', error.code, error.message);

                // ToDo: error handling
                if (error.code === 'auth/too-many-requests') {
                    // this.showNotification('We have blocked all requests from this device due to unusual activity. Try again later.');
                    this.showNotification('Unusual activity. Please try again later.');
                } else {
                    this.showNotification('An error occurred. Please try again.');
                }
            }
        }
    }

    onCodeChange = (code) => {
        this.setState({ code })
    }

    onSignIn = async () => {
        const { confirmationResult, code } = this.state;

        try {
            await confirmationResult.confirm(code);
        } catch (e) {
            console.warn(e);

            this.refs.codeInput.clear();

            // ToDo: focus
        }

        this.reset();
    }

    reset = () => {
        this.setState({
            confirmationResult: undefined,
            code: '',
            phone: ''
        });
    }

    buttonClick() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        if (this.state.mode === 'PHONE') {
            // ToDo: validation check


            this.onPhoneComplete();
        } else if (this.state.buttonText === 'VERIFICATION') {


            this.onSignIn();
        }
    }

    checkCode(code) {
        console.log('checkCode', code);
        this.setState({ code });


        // this.refs.codeInput.clear();
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
