/* copied from SignUpWithEmailVerification */

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
import * as Progress from 'react-native-progress';
import Dialog from "react-native-dialog";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";

type InjectedProps = {
    profileStore: ProfileStore
};


@inject("profileStore")
@observer
export default class EmailVerificationMain extends React.Component<InjectedProps> {
    state = {
        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - 60 - Cons.buttonHeight, // 60: gap

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        name: '',
        nameIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        emailVerificationState: 0, // 0: disappeared, 1: waiting, 2: checked

        // timer
        timer: 60,

        // show resend button
        showResend: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert'
    };

    sendVerificationEmail() {
        var user = Firebase.auth.currentUser;
        user.sendEmailVerification().then(() => {
            // Email sent.
            console.log('Email sent.');

            // show waiting hourglass
            this.setState({ emailVerificationState: 1 });

            // timer
            setTimeout(() => {
                this.startTimer();
            }, 500);

            this.reloadInterval = setInterval(() => {
                user.reload().then(() => {
                    if (this.reloadInterval && user.emailVerified) {
                        clearInterval(this.reloadInterval);
                        this.reloadInterval = null;

                        //// verification success ////
                        console.log('reload success.', user);

                        // stop timer
                        clearInterval(this.clockCall);
                        this.clockCall = null;

                        // show check hourglass
                        this.setState({ emailVerificationState: 2 });

                        // save token here
                        /*
                        if (user.additionalUserInfo && user.additionalUserInfo.isNewUser) {
                            registerExpoPushToken(user.user.uid, user.user.email);
                        }
                        */

                        // move to next
                        setTimeout(() => {
                            // sign up finished
                            Vars.signUpType = null;
                            Vars.signUpName = null;

                            console.log('[first join] move to welcome.');
                            this.props.navigation.navigate("welcome");
                        }, 2000); // 2 sec
                    }
                }, error => {
                    if (this.reloadInterval) {
                        clearInterval(this.reloadInterval);
                        this.reloadInterval = null;

                        //// verification failed ////
                        // console.log('registerUserAndWaitEmailVerification: reload failed ! ' + error.message + ' (' + error.code + ')');
                        console.log('reload failed!', error.message + ' (' + error.code + ')');

                        // stop timer
                        clearInterval(this.clockCall);
                        this.clockCall = null;

                        // hide hourglass
                        this.setState({ emailVerificationState: 0 });

                        // show message box
                        this.showNotification('An error happened. Please try again.');
                    }
                });
            }, 1000);
        }).catch((error) => {
            // An error happened.
            console.log('An error happened.', error);

            // show message box
            this.showNotification('We have blocked all requests from this device due to unusual activity. Try again later.');

            // show resend button
            this.setState({ showResend: true });
        });
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        this.sendVerificationEmail();
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        // timer
        if (this.clockCall) {
            clearInterval(this.clockCall);
            this.clockCall = null;
        }

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

        if (this.state.dialogVisible) {
            this.hideDialog();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        // if (this.refs['nameInput']) this.refs['nameInput'].focus();
    }

    // timer
    startTimer = () => {
        this.clockCall = setInterval(() => {
            this.decrementClock();
        }, 1000);
    }

    decrementClock = () => {
        if (this.state.timer === 0) {
            // stop timer
            clearInterval(this.clockCall);
            this.clockCall = null;

            // stop reload
            clearInterval(this.reloadInterval);
            this.reloadInterval = null;

            console.log('Verification time is up.');

            this.setState({ emailVerificationState: 0 });

            // show notification
            this.showNotification('Verification time is up. Please try again.');

            // show resend button
            this.setState({ showResend: true });

            return;
        }

        this.setState((prevstate) => ({ timer: prevstate.timer - 1 }));
    };

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
        // timer
        // const timer = 30; // 60 ~ 0;
        const timer = this.state.timer;
        const progress = 1 - timer / 60;

        const email = this.props.navigation.state.params.email;
        // const user = this.props.navigation.state.params.user;

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
                blurRadius={1}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={styles.searchBar}>
                        {/*
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
                        */}

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
                                    this.hideAlertIcon();
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
                        }}>
                            {
                                this.props.navigation.state.params.from === 'Loading' ? 'Verify your email address' : 'Almost done!'
                            }
                        </Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <Text style={{ paddingHorizontal: 18, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                                {"Please check your email account for "}
                                <Text style={{ color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                    {email}
                                </Text>
                                {' and click the "Verify" link inside.'}
                            </Text>
                            {
                                this.state.emailVerificationState === 0 &&
                                <View style={{
                                    height: 240,
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Progress.Circle
                                        showsText={false} size={120} color={Theme.color.text2} borderWidth={1} progress={0} />

                                    <View style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: 240,
                                        alignItems: "center", justifyContent: "center"
                                    }}>
                                        <AntDesign name='lock' color={Theme.color.text2} size={64} />
                                        {
                                            this.state.showResend &&
                                            <TouchableOpacity
                                                style={{
                                                    // backgroundColor: 'green',
                                                    position: 'absolute',
                                                    top: 200,
                                                    alignSelf: 'center',
                                                }}
                                                onPress={() => {
                                                    if (this._showNotification) {
                                                        this.hideNotification();
                                                        this.hideAlertIcon();
                                                    }

                                                    this.setState({ timer: 60 });

                                                    this.sendVerificationEmail();
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>Resend verification email</Text>
                                            </TouchableOpacity>
                                        }
                                    </View>
                                </View>
                            }
                            {
                                this.state.emailVerificationState === 1 &&
                                <View style={{
                                    height: 240,
                                    // backgroundColor: 'green',
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Progress.Circle
                                        textStyle={{
                                            fontSize: 48,
                                            fontFamily: "Roboto-Medium"
                                        }}
                                        // formatText={progress => `${Math.round(progress * 100)}%`}
                                        formatText={progress => { // 0 ~ 1

                                            // return `${Math.round(progress * 100)}%`;
                                            return timer;
                                        }}
                                        showsText={true} size={120} color={Theme.color.text2} borderWidth={1} progress={progress} />
                                </View>
                            }
                            {
                                this.state.emailVerificationState === 2 &&
                                <View style={{
                                    height: 240,
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Progress.Circle
                                        showsText={false} size={120} color={Theme.color.text2} borderWidth={1} progress={1} />

                                    <View style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: 240,
                                        alignItems: "center", justifyContent: "center"
                                    }}>
                                        <AntDesign name='check' color={Theme.color.text2} size={64} />
                                    </View>
                                </View>
                            }
                        </View>
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.signUpButton}
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideAlertIcon();
                                }

                                setTimeout(() => {
                                    this.openDialog('alert', 'New account', 'Are you sure you want to stop email verification and create new account?', async () => {
                                        // stop timer
                                        clearInterval(this.clockCall);
                                        this.clockCall = null;

                                        // stop reload
                                        clearInterval(this.reloadInterval);
                                        this.reloadInterval = null;

                                        // ToDo: delete auth, delete token, user
                                        // --
                                        // 1. unsubscribe profile first!
                                        this.props.profileStore.final();

                                        const { profile } = this.props.profileStore;

                                        // 2. remove token (tokens - uid)
                                        await Firebase.deleteToken(profile.uid);

                                        // 3. remove user (& received comments)
                                        await Firebase.deleteProfile(profile.uid);
                                        // --

                                        this.props.navigation.navigate("authMain");
                                    });
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Create new account</Text>
                        </TouchableOpacity>
                    </View>

                    <Dialog.Container visible={this.state.dialogVisible}>
                        <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                        <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                        <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                        <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                    </Dialog.Container>
                </View>
            </ImageBackground>
        );
    }

    openDialog(type, title, message, callback) {
        this.setState({ dialogType: type, dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
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
        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center'
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