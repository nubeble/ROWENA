import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Dimensions,
    ImageBackground, Animated, Keyboard, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { Text, Theme, Firebase } from './rnff/src/components';
import Constants from 'expo-constants';
import { Ionicons, AntDesign } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';


export default class ResetPasswordMain extends React.Component {
    state = {
        email: '',
        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        emailY: -1,

        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - Cons.bottomButtonMarginBottom - Cons.buttonHeight,
        showSignUpButtonLoader: false,

        invalid: true,
        signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)',
        signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)',

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1)
    };

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
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
    _keyboardDidHide(e) {
        const bottomPosition = Dimensions.get('window').height;
        const signUpButtonTop = bottomPosition - Cons.bottomButtonMarginBottom - Cons.buttonHeight;

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
        if (this.refs['emailInput']) this.refs['emailInput'].focus();
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

    hideAlertIcon() {
        if (this.state.emailIcon !== 0) this.setState({ emailIcon: 0 });
    }

    render() {
        const emailIcon = this.state.emailIcon;

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
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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
                                    this.hideAlertIcon();
                                }
                            }}
                        >
                            <Ionicons name='md-close' color="black" size={20} />
                        </TouchableOpacity>
                    </Animated.View>

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
                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideAlertIcon();
                                }

                                this.props.navigation.dispatch(NavigationActions.back());
                            }}
                        >
                            <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingTop: Theme.spacing.tiny }}>
                        <Text style={{
                            marginLeft: 22,
                            color: Theme.color.text2,
                            fontSize: 28,
                            lineHeight: 32,
                            fontFamily: "Roboto-Medium",
                            paddingTop: 2
                        }}>Reset password</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                                {"Enter your email address and we'll send you an email with instructions to reset password."}
                            </Text>
                            {/*
                            <Text style={{ marginTop: 20, paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                {'EMAIL ADDRESS'}
                            </Text>
                            */}
                            <TextInput
                                ref='emailInput'
                                style={{ marginTop: 16, height: 40, paddingLeft: 18, paddingRight: 56, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                value={this.state.email}
                                onChangeText={(text) => this.validateEmail(text)}
                                onSubmitEditing={(event) => this.submit(event.nativeEvent.text)}
                                selectionColor={Theme.color.selection}
                                keyboardType={'email-address'}
                                // keyboardAppearance={'dark'}
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
                                        position: 'absolute', top: 23,
                                        // right: 24
                                        // right: 19 // center of icon
                                        right: 24 + 24
                                    }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
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
                        </View>
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}
                            onPress={() => {
                                setTimeout(() => {
                                    if (this.closed) return;
                                    this.submit(this.state.email);
                                }, Cons.buttonTimeout);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>Next</Text>
                            {
                                this.state.showSignUpButtonLoader &&
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

    validateEmail(text) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // enable/disable signup button
        if (text === '') {
            // disable
            this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });
        } else {
            // enable
            this.setState({ invalid: false, signUpButtonBackgroundColor: "rgba(62, 165, 255, 0.8)", signUpButtonTextColor: "rgba(255, 255, 255, 0.8)" });
        }

        // check completion
        const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (reg.test(String(text).toLowerCase())) {
            console.log('validateEmail', "Email is Correct");

            // show icon
            this.setState({ emailIcon: 2 });
        } else {
            // show icon
            this.setState({ emailIcon: 0 });
        }

        this.setState({ email: text });
    }

    async submit(text) {
        if (this.state.emailIcon !== 2) {
            // show message box
            const msg = 'Please use valid characters for your email.';
            this.showNotification(msg);

            this.setState({ emailIcon: 1 });

            // set focus
            this.refs['emailInput'].focus();

            return;
        }

        // show loader
        this.setState({ showSignUpButtonLoader: true });

        try {
            Firebase.auth.languageCode = 'en';
            await Firebase.auth.sendPasswordResetEmail(this.state.email);

            console.log('email sent');

            // hide loader
            this.setState({ showSignUpButtonLoader: false });

            // move to wait page
            this.props.navigation.navigate("resetPasswordVerification");

            /*
            Firebase.auth.verifyPasswordResetCode(code).then(function (email) {
                // Display a "new password" form with the user's email address
            }).catch(function () {
                // Invalid code
            });

            Firebase.auth.confirmPasswordReset(code, newPassword).then(function () {
                // Success
                console.log('success');
            }).catch(function () {
                // Invalid code
                console.log('invalid code');
            });
            */
        } catch (error) {
            console.log('sendPasswordResetEmail error', error.code, error.message);

            if (error.code === 'auth/user-not-found') {
                this.showNotification('There is no user corresponding to the email address.'); // done
            } else if (error.code === 'auth/invalid-email') {
                this.showNotification('The email address is not valid.'); // done
            } else {
                this.showNotification('An error happened. Please try again.');
            }

            // hide loader
            this.setState({ showSignUpButtonLoader: false });
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
