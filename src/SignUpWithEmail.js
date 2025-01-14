import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, BackHandler,
    Keyboard, Dimensions, Platform, TextInput, Image
} from 'react-native';
// import { Form, Item, Input, Label } from 'native-base';
import Constants from 'expo-constants';
import { Ionicons, AntDesign } from "react-native-vector-icons";
// import * as firebase from 'firebase';
import Firebase from './Firebase'
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import { Text, Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
// import { registerExpoPushToken } from './PushNotifications';
import { NavigationActions } from 'react-navigation';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default class SignUpWithEmail extends React.Component {
    state = {
        email: '',
        password: '',

        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        pwIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        emailY: -1,
        passwordY: -1,

        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - Cons.bottomButtonMarginBottom - Cons.buttonHeight,

        invalid: true,
        signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)',
        signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)',

        showSignUpLoader: false,

        securePwInput: true,
        // secureText: 'Show',

        notification: ''
    };

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);
    }

    componentDidMount() {
        console.log('jdub', 'SignUpWithEmail.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        // --
        let from = null;
        const params = this.props.navigation.state.params;
        if (params) {
            from = params.from;
        }

        this.from = from;
        // --

        /*
        setTimeout(() => {
            !this.closed && this.refs['emailInput'] && this.refs['emailInput'].focus();
        }, 300);
        */
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

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

        this.props.navigation.dispatch(NavigationActions.back());

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

    validateEmail(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideEmailIcon();
        }

        // enable/disable signup button
        if (text === '' || this.state.password === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        // check completion
        const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (reg.test(String(text).toLowerCase())) {
            console.log('jdub', 'validateEmail', "Email is Correct");

            // show icon
            this.setState({ emailIcon: 2 });
        } else {
            // show icon
            this.setState({ emailIcon: 0 });
        }

        this.setState({ email: text });
    }

    moveToPassword(text) {
        if (this.state.emailIcon !== 2) {
            // console.log('jdub', 'Please enter a valid email address.');

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
        if (this._showNotification) {
            this.hideNotification();
            this.hidePasswordIcon();
        }

        // enable/disable signup button
        if (text === '' || this.state.email === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        this.setState({ password: text });

        if (text.length < 6) {
            // console.log('jdub', 'Must be at least 6 characters.');

            this.setState({ pwIcon: 0 });

            return;
        }

        if (/\d/.test(text) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(text)) {
            // console.log('jdub', "Password is correct.");

            // show icon
            this.setState({ pwIcon: 2 });

        } else {
            console.log('jdub', 'Must have at least one symbol or number.');

            this.setState({ pwIcon: 0 });

            return;
        }
    }

    async moveToSignUp(text) {
        if (this.state.pwIcon !== 2) {
            // show message box
            const msg = this.getPasswordErrorMessage(this.state.password);
            this.showNotification(msg);

            this.setState({ pwIcon: 1 });

            // set focus
            this.refs['pwInput'].focus();

            return;
        }

        if (this.from === 'logIn') {
            await this.processSignIn();
        } else {
            await this.processSignUp();
        }
    }

    getPasswordErrorMessage(password) {
        if (password.length < 6) {
            return 'Must be at least 6 characters.';
        }

        if (/\d/.test(password) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
            // return 'Password is correct.';
            return 'Please try again.'; // Consider: clear password input
        } else {
            return 'Must have at least one symbol or number.';
        }
    }

    toggleSecureText() {
        if (this.state.securePwInput) {
            this.setState({ securePwInput: false });
        } else {
            this.setState({ securePwInput: true });
        }
    }

    async signUp() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcons();
        }

        if (this.state.emailIcon !== 2) {
            // console.log('jdub', 'Please enter a valid email address.');

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

        if (this.from === 'logIn') {
            await this.processSignIn();
        } else {
            await this.processSignUp();
        }
    }

    async processSignIn() {
        // show indicator
        this.setState({ showSignUpLoader: true });

        try {
            Firebase.auth.languageCode = 'en';
            const user = await Firebase.auth.signInWithEmailAndPassword(this.state.email, this.state.password);
            console.log('jdub', 'SignUpWithEmail.signInWithEmailAndPassword, user', user);

            // save token
            // await registerExpoPushToken(user.user.uid, user.user.email);

            // hide indicator
            this.setState({ showSignUpLoader: false });

            console.log('jdub', '[SignUpWithEmail.processSignIn] move to welcome');
            this.props.navigation.navigate("welcome", { from: 'EMAIL' });
        } catch (error) {
            console.log('jdub', 'error', error.code, error.message);

            if (error.code === 'auth/invalid-email') {
                this.showNotification('The email address is not valid.');
            } else if (error.code === 'auth/user-disabled') {
                this.showNotification('The user corresponding to the given email has been disabled.');
            } else if (error.code === 'auth/user-not-found') {
                this.showNotification('There is no user corresponding to the given email.');
            } else if (error.code === 'auth/wrong-password') {
                this.showNotification('The password is invalid for the given email.');
            } else {
                this.showNotification('An error happened. Please try again later.');
            }

            // hide indicator
            this.setState({ showSignUpLoader: false });
        }
    }

    async processSignUp() {
        // show indicator
        this.setState({ showSignUpLoader: true });

        try {
            Firebase.auth.languageCode = 'en';
            const user = await Firebase.auth.createUserWithEmailAndPassword(this.state.email, this.state.password);
            console.log('jdub', 'SignUpWithEmail.processSignUp, user', user);

            // save token
            // await registerExpoPushToken(user.user.uid, user.user.email);

            // hide indicator
            this.setState({ showSignUpLoader: false });

            this.props.navigation.navigate("signUpWithEmailVerification", { user: user, email: this.state.email, from: 'SignUpWithEmail' });
        } catch (error) {
            console.log('jdub', 'error', error.code, error.message);

            if (error.code === 'auth/account-exists-with-different-credential') {
                this.showNotification('There already exists an account with the email address asserted by the credential.');
            } else if (error.code === 'auth/invalid-credential') {
                this.showNotification('The credential is malformed or has expired.');
            } else if (error.code === 'auth/operation-not-allowed') {
                this.showNotification('The type of account corresponding to the credential is not enabled.');
            } else if (error.code === 'auth/user-disabled') {
                this.showNotification('The user corresponding to the given credential has been disabled.');
            } else if (error.code === 'auth/user-not-found') {
                this.showNotification('There is no user corresponding to the given email.');
            } else if (error.code === 'auth/wrong-password') {
                this.showNotification('The password is invalid for the given email.');
            } else if (error.code === 'auth/invalid-verification-code') {
                this.showNotification('The verification code of the credential is not valid.');
            } else if (error.code === 'auth/invalid-verification-id') {
                this.showNotification('The verification ID of the credential is not valid.');
            } else {
                this.showNotification('An error happened. Please try again later.');
            }

            // hide indicator
            this.setState({ showSignUpLoader: false });
        }
    }

    render() {
        const from = this.from;

        const emailIcon = this.state.emailIcon;
        const pwIcon = this.state.pwIcon;

        const notificationStyle = {
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
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
                                    this.hideAlertIcons();
                                }

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
                                left: '25%',
                                width: '25%',
                                height: 3,
                                backgroundColor: "rgb(62, 165, 255)"
                            }} />
                        </View>
                    </View>

                    <View style={{ paddingTop: Theme.spacing.tiny }}>
                        <Text style={{
                            marginLeft: 22,
                            color: Theme.color.text2,
                            fontSize: 28,
                            lineHeight: 32,
                            fontFamily: "Roboto-Medium",
                            paddingTop: 2
                        }}>What's your email?</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                {'EMAIL ADDRESS'}
                            </Text>
                            <TextInput
                                ref='emailInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 56, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                keyboardType={'email-address'}
                                // keyboardAppearance={'dark'}
                                value={this.state.email}
                                onChangeText={(text) => this.validateEmail(text)}
                                onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                selectionColor={Theme.color.selection}
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {
                                /*
                                this.state.email.length > 0 &&
                                <TouchableOpacity
                                    style={{
                                        width: 40, height: 40, justifyContent: "center", alignItems: "center",
                                        position: 'absolute', right: 48, top: 23
                                    }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideEmailIcon();
                                        }
 
                                        this.setState({ email: '' });
 
                                        // disable
                                        this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
 
                                        this.setState({ emailIcon: 0 });
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

                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ marginTop: 4, paddingLeft: 18, paddingRight: 8, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                    {'PASSWORD'}
                                </Text>

                                <TouchableOpacity
                                    style={{ marginTop: 4 - 1, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={() => this.toggleSecureText()}
                                >
                                    {
                                        this.state.securePwInput ?
                                            <Ionicons name='md-eye' color={Theme.color.text2} size={20} />
                                            :
                                            <Ionicons name='md-eye-off' color={Theme.color.text2} size={20} />
                                    }
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                ref='pwInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 56, fontSize: 22, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
                                // keyboardType={Platform.OS === "android" ? 'visible-password' : 'default'}
                                // keyboardAppearance={'dark'}
                                secureTextEntry={this.state.securePwInput}
                                value={this.state.password}
                                onChangeText={(text) => this.validatePassword(text)}
                                onSubmitEditing={async (event) => await this.moveToSignUp(event.nativeEvent.text)}
                                autoCapitalize="none"
                                selectionColor={Theme.color.selection}
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                            />
                            {
                                /*
                                this.state.password.length > 0 &&
                                <TouchableOpacity
                                    style={{
                                        width: 40, height: 40, justifyContent: "center", alignItems: "center",
                                        position: 'absolute', right: 48, top: 23 + 82
                                    }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideEmailIcon();
                                        }
 
                                        this.setState({ password: '' });
 
                                        // disable
                                        this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
 
                                        this.setState({ pwIcon: 0 });
                                    }}
                                >
                                    <Ionicons name='ios-close-circle' color='rgba(255, 255, 255, 0.8)' size={20} />
                                </TouchableOpacity>
                                */
                            }
                            <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                onLayout={(e) => {
                                    const { y } = e.nativeEvent.layout;
                                    this.setState({ passwordY: y });
                                }}
                            />
                            {this.state.passwordY !== -1 && pwIcon === 0 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.passwordY - 34 }} name='exclamationcircleo' color="transparent" size={27} />}
                            {this.state.passwordY !== -1 && pwIcon === 1 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.passwordY - 34 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={27} />}
                            {this.state.passwordY !== -1 && pwIcon === 2 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.passwordY - 34 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={27} />}
                        </View>
                        {
                            from === 'logIn' &&
                            <TouchableOpacity
                                style={{ marginTop: 8, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => {
                                    if (this._showNotification) {
                                        this.hideNotification();
                                        this.hideAlertIcons();
                                    }

                                    setTimeout(() => {
                                        if (this.closed) return;
                                        this.props.navigation.navigate("emailReset");
                                    }, Cons.buttonTimeout);
                                }}
                            >
                                <Text>
                                    <Text style={{ fontSize: 14, fontFamily: "Roboto-Light", color: 'rgba(255, 255, 255, 0.8)' }}>Forgot password?  </Text>
                                    <Text style={{ fontSize: 15, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Reset password</Text>
                                </Text>
                            </TouchableOpacity>
                        }
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}
                            onPress={() => this.signUp()}
                        >
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>
                                {
                                    from === 'logIn' ? 'Sign in' : 'Sign up'
                                }
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

    showNotification(msg) {
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.offset, {
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
                Animated.timing(this.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
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
