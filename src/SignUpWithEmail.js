import React from 'react';
import {
    StyleSheet, View, ImageBackground, TouchableOpacity, ActivityIndicator, Animated, BackHandler,
    Keyboard, Dimensions, Platform, StatusBar, TextInput
} from 'react-native';
import { Header } from 'react-navigation';
// import { Form, Item, Input, Label } from 'native-base';
import { Constants } from "expo";
import { Ionicons, AntDesign } from "react-native-vector-icons";
// import * as firebase from 'firebase';
import Firebase from './Firebase'
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import { Text, Theme } from "./rnff/src/components";
import { Cons } from "./Globals";


export default class SignUpWithEmail extends React.Component {
    state = {
        email: '',
        password: '',
        // userName: ''

        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        pwIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        // showIndicator: false,
        showSignUpLoader: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value((Constants.statusBarHeight + 10) * -1),

        invalid: true,
        // signUpButtomTextColor: 'rgba(255,255,255,0.3)',
        signUpButtomTextColor: 'grey',

        securePwInput: true,
        secureText: 'Show',
        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - 80 - 50 // 80: bottom gap, 50: button height
    };

    componentDidMount() {
        console.log('SignUpWithEmail.componentDidMount');

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
        const signUpButtonTop = bottomPosition - 10 - 50; // 10: bottom gap, 50: button height

        !this.closed && this.setState({ bottomPosition: bottomPosition, signUpButtonTop: signUpButtonTop });
    }

    @autobind
    _keyboardDidHide() {
        const bottomPosition = Dimensions.get('window').height;
        const signUpButtonTop = bottomPosition - 80 - 50; // 80: bottom gap, 50: button height

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
                // this.state.offset.setValue(height * -1);

                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200,
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: 0,
                            duration: 200,
                        }),
                    ]),

                    /*
                    Animated.delay(1500),

                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 0,
                            duration: 300,
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: height * -1,
                            duration: 300,
                        }),
                    ]),
                    */
                ]).start();
            });
        });

        StatusBar.setHidden(true);
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200,
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200,
                    })
                ])
            ]).start();
        });

        StatusBar.setHidden(false);

        this._showNotification = false;
    }

    validateEmail(text) {
        this.setState({ email: text });

        console.log('email', text);
        console.log('password', this.state.password);

        // enable/disable signup button
        if (text === '' || this.state.password === '') {
            // disable
            this.setState({ invalid: true, signUpButtomTextColor: 'grey' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtomTextColor: 'black' });
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
            this.setState({ invalid: true, signUpButtomTextColor: 'grey' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtomTextColor: 'black' });
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
            this.setState({ secureText: 'Hide', securePwInput: false });
        } else {
            this.setState({ secureText: 'Show', securePwInput: true });
        }

        // ToDo: don't need this in ios, not working in android. check!!
        this.refs['pwInput'].setNativeProps({ selection: { start: this.state.password.length, end: this.state.password.length } });
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
        // this.setState({ showIndicator: true });
        this.setState({ showSignUpLoader: true });

        try {
            const user = await Firebase.auth.createUserWithEmailAndPassword(this.state.email, this.state.password);
            console.log('user', user);

            // save user info to database
            await Firebase.createProfile(user.user.uid, user.user.displayName, user.user.email, user.user.phoneNumber);
        } catch (error) {
            console.log('error', error);

            this.showNotification('An error occurred. Please try again.');
        }

        // close indicator
        // !this.closed && this.setState({ showIndicator: false });
        !this.closed && this.setState({ showSignUpLoader: false });
    }

    render() {
        const emailIcon = this.state.emailIcon;
        const pwIcon = this.state.pwIcon;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [
                {
                    translateY: this.state.offset
                }
            ]
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
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
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
                            <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ paddingTop: Theme.spacing.tiny }}>
                        <Text style={{
                            marginLeft: 22,
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 28,
                            fontFamily: "SFProText-Semibold"
                        }}>What's your email?</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                                {'EMAIL ADDRESS'}
                            </Text>
                            <TextInput
                                ref='emailInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
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
                            {(emailIcon === 1) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={30} />}
                            {(emailIcon === 2) && <AntDesign style={{ position: 'absolute', right: 24, top: this.emailY - 36 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={30} />}

                            <Text style={{ marginTop: 16, paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                                {'PASSWORD'}
                            </Text>
                            <TextInput
                                ref='pwInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 48, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
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
                                style={{ position: 'absolute', top: 98, right: 24, alignSelf: 'baseline' }}
                                onPress={() => this.toggleSecureText()}
                            >
                                <Text style={{ fontSize: 13, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)' }}>{this.state.secureText}</Text>
                            </TouchableOpacity>
                            <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                onLayout={(e) => {
                                    const { y } = e.nativeEvent.layout;
                                    this.passwordY = y;
                                }}
                            />
                            {/* to block shaking */}
                            {(pwIcon === 0) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='exclamationcircleo' color="transparent" size={28} />}
                            {(pwIcon === 1) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={28} />}
                            {(pwIcon === 2) && <AntDesign style={{ position: 'absolute', right: 24, top: this.passwordY - 36 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={28} />}
                        </View>

                        {/*
                        <Form style={{ marginLeft: 4, marginRight: 16 }}>
                            <Label style={{ marginTop: 16, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", marginLeft: 18 }}>EMAIL ADDRESS</Label>
                            <Item>
                                <Input ref='emailInput' style={{ height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
                                    keyboardType={'email-address'}
                                    onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                                    onChangeText={(text) => this.validateEmail(text)}
                                    selectionColor={Theme.color.selection}
                                    keyboardAppearance={'dark'}
                                    underlineColorAndroid="transparent"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                />
                                {(emailIcon === 1) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='exclamation' color="rgba(255, 255, 255, 0.8)" size={28} />}
                                {(emailIcon === 2) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='check' color="rgba(255, 255, 255, 0.8)" size={28} />}
                            </Item>

                            <Label style={{ marginTop: 16, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", marginLeft: 18 }}>PASSWORD</Label>
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 88, right: 10, alignSelf: 'baseline' }}
                                onPress={() => this.toggleSecureText()}
                            >
                                <Text style={{ fontSize: 13, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)' }}>{this.state.secureText}</Text>
                            </TouchableOpacity>
                            <Item>
                                <Input ref='pwInput' style={{ height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}
                                    // keyboardType={Platform.OS === "android" ? 'visible-password' : 'default'}
                                    secureTextEntry={this.state.securePwInput}
                                    onSubmitEditing={(event) => this.moveToSignUp(event.nativeEvent.text)}
                                    onChangeText={(text) => this.validatePassword(text)}
                                    selectionColor={Theme.color.selection}
                                    keyboardAppearance={'dark'}
                                    underlineColorAndroid="transparent"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                />
                                {(pwIcon === 1) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='exclamation' color="rgba(255, 255, 255, 0.8)" size={28} />}
                                {(pwIcon === 2) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='check' color="rgba(255, 255, 255, 0.8)" size={28} />}
                            </Item>
                        </Form>
                        */}













                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                        <TouchableOpacity onPress={() => this.signUp()} style={styles.signUpButton} disabled={this.state.invalid}>
                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: this.state.signUpButtomTextColor, paddingTop: Cons.submitButtonPaddingTop() }}>Sign up</Text>
                            {
                                this.state.showSignUpLoader &&
                                <ActivityIndicator
                                    style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 1000 }}
                                    animating={true}
                                    size="small"
                                    color='rgba(0, 0, 0, 0.6)'
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
        // paddingBottom: 8 + 4, // paddingBottom from searchBar
        paddingBottom: 8, // paddingBottom from searchBar
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    /*
    signUpButton: {
        // marginTop: 40,
        position: 'absolute',
        bottom: 10,

        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)", // "transparent"
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0
    },
    */
    signUpButton: {
        width: '85%',
        height: 45,
        backgroundColor: "rgba(255, 255, 255, 0.6)",
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
        width: '100%',
        height: Constants.statusBarHeight + 10,
        position: "absolute",
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,

        flexDirection: 'column',
        // justifyContent: 'center'
        justifyContent: 'flex-end'
    },
    notificationText: {
        alignSelf: 'center',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        color: "#FFF",
        paddingBottom: Platform.OS === 'ios' ? 4 : 0
    },
    notificationButton: {
        position: 'absolute',
        right: 18,
        bottom: 4
    }
});
