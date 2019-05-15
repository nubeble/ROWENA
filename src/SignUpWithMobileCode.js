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

// import firebase from 'firebase/app';
// import 'firebase/auth';

const captchaUrl = `https://rowena-88cfd.firebaseapp.com/recaptcha.html?appurl=${Linking.makeUrl('')}`;


export default class SignUpWithMobileCode extends React.Component {
    state = {
        // user: undefined,
        // phone: '+639276480554',
        // phone: '+821093088300', // ToDo: test
        confirmationResult: undefined,
        code: '',
        buttonText: 'Next',

        countryText: null, // United State (+1)
        dialCode: null, // +1


        // email: '01093088300', // ToDo: test
        email: '',
        password: '',

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

        this.props.navigation.goBack();

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

    validateEmail(text) {
        this.setState({ email: text });

        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        if (this._showNotification) {
            this.hideNotification();
            this.hideEmailIcon();
        }

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

    validatePassword(text) {
        this.setState({ password: text });

        console.log('email', this.state.email);
        console.log('password', text);

        // enable/disable signup button
        if (text === '' || this.state.email === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.8)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        if (this._showNotification) {
            this.hideNotification();
            this.hidePasswordIcon();
        }

        if (text.length < 6) {
            console.log('Must be at least 6 characters.');

            this.setState({ pwIcon: 0 });

            return;
        }

        if (/\d/.test(text) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(text)) {

            console.log("Email is Correct");

            // show icon
            this.setState({ pwIcon: 2 });

        } else {
            console.log('Must have at least one symbol or number.');

            this.setState({ pwIcon: 0 });

            return;
        }
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

        // hide indicator
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
                                // this.props.navigation.goBack();
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

                    <View style={{ paddingTop: Theme.spacing.tiny }}>
                        <Text style={{
                            marginLeft: 22,
                            color: Theme.color.text2,
                            fontSize: 28,
                            lineHeight: 32,
                            fontFamily: "Roboto-Medium",
                            paddingTop: 8
                        }}>What's your mobile number?</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>



                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => {
                                    /*
                                    if (this.state.onUploadingImage) return;

                                    if (this._showNotification) {
                                        this.hideNotification();
                                        this.hideAlertIcon();
                                    }
                                    */

                                    // ToDo:initFromSelect
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


                            {
                                !this.state.confirmationResult ?
                                    <TextInput
                                        ref='emailInput'
                                        style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                        keyboardType={'phone-pad'}
                                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                        onChangeText={(text) => this.validateEmail(text)}
                                        selectionColor={Theme.color.selection}
                                        // keyboardAppearance={'dark'}
                                        underlineColorAndroid="transparent"
                                        autoCorrect={false}
                                        autoCapitalize="none"

                                    // value={this.state.email}
                                    // onChangeText={(text) => this.setState({ email: text })}
                                    />
                                    :
                                    <TextInput
                                        ref='emailInput'
                                        style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                        keyboardType="numeric"
                                        // placeholder="Code from SMS"
                                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                        // onChangeText={(text) => this.validateEmail(text)}
                                        selectionColor={Theme.color.selection}
                                        // keyboardAppearance={'dark'}
                                        underlineColorAndroid="transparent"
                                        autoCorrect={false}
                                        autoCapitalize="none"

                                        value={this.state.code}
                                        onChangeText={(text) => this.setState({ code })}
                                    />
                            }

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

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => this.buttonClick()} style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}>
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>{this.state.buttonText}</Text>
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
            const { phone } = this.state;
            //fake firebase.auth.ApplicationVerifier
            const captchaVerifier = {
                type: 'recaptcha',
                verify: () => Promise.resolve(token)
            };

            try {
                const confirmationResult = await Firebase.signInWithPhoneNumber(phone, captchaVerifier);

                this.setState({ confirmationResult });
            } catch (e) {
                console.warn(e);

                // ToDo: notification
            }
        }
    }

    onCodeChange = (code) => {
        this.setState({ code })
    }

    onSignIn = async () => {
        console.log('SignUpWithMobileMain.onSignIn')
        const { confirmationResult, code } = this.state
        try {
            await confirmationResult.confirm(code)
        } catch (e) {
            console.warn(e)
        }
        this.reset()
    }

    reset = () => {
        console.log('SignUpWithMobileMain.reset')
        this.setState({
            phone: '',
            phoneCompleted: false,
            confirmationResult: undefined,
            code: ''
        })
    }

    buttonClick() {
        if (this.state.buttonText === 'Next') {
            // ToDo: validation check


            this.onPhoneComplete();
        } else if (this.state.buttonText === 'Sign up') {
            this.onSignIn();
        }
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
