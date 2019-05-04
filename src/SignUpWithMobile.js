import React from 'react';
import {
    StyleSheet, View, ImageBackground, TouchableOpacity, ActivityIndicator, Animated, BackHandler,
    Keyboard, Dimensions, Platform, TextInput
} from 'react-native';
// import { Form, Item, Input, Label } from 'native-base';
import { Constants } from "expo";
import { Ionicons, AntDesign } from "react-native-vector-icons";
// import * as firebase from 'firebase';
import Firebase from './Firebase'
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import { Text, Theme } from "./rnff/src/components";
import { Cons } from "./Globals";
import { registerExpoPushToken } from './PushNotifications';


export default class SignUpWithMobile extends React.Component {
    state = {
        email: '',
        password: '',
        // userName: ''

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
        console.log('SignUpWithMobile.componentDidMount');

        Firebase.auth.languageCode = 'it';
        // To apply the default browser preference instead of explicitly setting it.
        // Firebase.auth.useDeviceLanguage();







        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        setTimeout(() => {
            !this.closed && this.refs['emailInput'] && this.refs['emailInput'].focus();
        }, Cons.buttonTimeoutLong);
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

        console.log('email', text);
        console.log('password', this.state.password);

        // enable/disable signup button
        if (text === '' || this.state.password === '') {
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
                            onPress={() => this.props.navigation.goBack()}
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
                            fontFamily: "Roboto-Medium",
                            paddingTop: 8
                        }}>What's your email?</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                {'EMAIL ADDRESS'}
                            </Text>
                            <TextInput
                                ref='emailInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                keyboardType={'email-address'}
                                onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                onChangeText={(text) => this.validateEmail(text)}
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
                            {/* to block shaking */}
                            {(emailIcon === 0) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='exclamationcircleo' color="transparent" size={30} />}
                            {(emailIcon === 1) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={30} />}
                            {(emailIcon === 2) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={30} />}

                            <Text style={{ marginTop: 16, paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                {'PASSWORD'}
                            </Text>
                            <TextInput
                                ref='pwInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
                                // keyboardType={Platform.OS === "android" ? 'visible-password' : 'default'}
                                secureTextEntry={this.state.securePwInput}
                                onSubmitEditing={(event) => this.moveToSignUp(event.nativeEvent.text)}
                                onChangeText={(text) => this.validatePassword(text)}
                                autoCapitalize="none"
                                selectionColor={Theme.color.selection}
                                // keyboardAppearance={'dark'}
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 94, right: 24, alignSelf: 'baseline' }}
                                // style={{ position: 'absolute', top: 94, right: Dimensions.get('window').width / 2, alignSelf: 'baseline' }}
                                onPress={() => this.toggleSecureText()}
                            >
                                <Text style={{ fontSize: 13, fontFamily: "Roboto-Medium", color: Theme.color.text2 }}>{this.state.secureText}</Text>
                            </TouchableOpacity>
                            <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                onLayout={(e) => {
                                    const { y } = e.nativeEvent.layout;
                                    this.passwordY = y;
                                }}
                            />
                            {/* to block shaking */}
                            {(pwIcon === 0) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='exclamationcircleo' color="transparent" size={28} />}
                            {(pwIcon === 1) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={28} />}
                            {(pwIcon === 2) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={28} />}
                        </View>
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => this.signUp()} style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}>
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>Sign up</Text>
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
