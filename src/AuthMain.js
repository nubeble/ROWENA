import React from 'react';
import {
    StyleSheet, View, StatusBar, TouchableOpacity, ActivityIndicator, ImageBackground,
    Animated, Dimensions, Platform, Image, BackHandler
} from 'react-native';
import { Constants } from 'expo';
import { EvilIcons, Ionicons, FontAwesome } from "react-native-vector-icons";
import Firebase from './Firebase';
import * as firebase from "firebase";
// import { SaveStorage, LoadStorage, RemoveStorage } from './Storage';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from "./Globals";
import { Text, Theme } from "./rnff/src/components";
import { registerExpoPushToken } from './PushNotifications';
import autobind from "autobind-decorator";

// const AnimatedImage = Animated.createAnimatedComponent(Image);
// const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const HEIGHT = Dimensions.get('window').height;


export default class AuthMain extends React.Component {
    // static loaded = false;
    static animation = true;

    state = {
        // showFacebookLoader: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),


        // loaded: false,

        // offset: new Animated.Value(0)
        // intensity: new Animated.Value(0),

        // opacity: new Animated.Value(0),
        viewOffset: new Animated.Value(HEIGHT),

        // blurRadius: new Animated.Value(0),
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        return true;
    }

    @autobind
    onFocus() {
        /*
        if (!AuthMain.loaded) {
            AuthMain.loaded = true;

            Animated.timing(this.state.viewOffset, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start(() => {
                StatusBar.setHidden(false);
            });
        } else {
            Animated.timing(this.state.viewOffset, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true
            }).start(() => {
                // StatusBar.setHidden(false);
            });
        }
        */

        if (AuthMain.animation) {
            /*
            Animated.timing(this.state.viewOffset, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => {
                StatusBar.setHidden(false);
            });
            */
            Animated.sequence([
                Animated.delay(500),
                Animated.spring(this.state.viewOffset, {
                    toValue: 0,
                    bounciness: 10,
                    useNativeDriver: true
                })
            ]).start(() => {
                StatusBar.setHidden(false);
            });

            // ToDo: screen blinking issue on blur animation
            /*
            console.log('animation start');
            Animated.timing(this.state.blurRadius, { duration: 3000, toValue: 5, useNativeDriver: true }).start(() => {
                // add code here
            });
            */

            /*
            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(this.state.blurRadius, { toValue: 3, duration: 2000 }),
                    Animated.timing(this.state.viewOffset, { toValue: 0, duration: 300 })
                ]).start();
            }, 3000);
            */

            AuthMain.animation = false;
        } else {
            this.setState({ viewOffset: 0 });
        }
    }

    async continueWithFacebook() {
        Vars.signUpType = 'FACEBOOK';

        // show indicator
        // this.setState({ showFacebookLoader: true });

        // ToDo: disable buttons

        const {
            type,
            token,
            expires,
            permissions,
            declinedPermissions,
        } = await Expo.Facebook.logInWithReadPermissionsAsync('367256380681542',
            {
                permissions: ['public_profile', 'email'], behavior: this.isStandaloneApp() ? 'native' : 'browser'
            });

        if (type === 'success') {
            const credential = firebase.auth.FacebookAuthProvider.credential(token);

            try {
                const user = await Firebase.auth.signInAndRetrieveDataWithCredential(credential);
                console.log('user', user);

                // save token
                if (user.additionalUserInfo && user.additionalUserInfo.isNewUser) {
                    await registerExpoPushToken(user.user.uid, user.user.displayName);
                }

                /*
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
                    await Firebase.createProfile(user.user.uid, user.user.displayName, user.user.email, user.user.phoneNumber);
                }
                */
            } catch (error) {
                console.log('signInAndRetrieveDataWithCredential error', error);

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
                    this.showNotification('An error happened. Please try again.');
                }
            }
        } else {
            console.log('Facebook.logInWithReadPermissionsAsync result', type, permissions, declinedPermissions);
            const str = type + ' ' + permissions + ' ' + declinedPermissions;
            this.showNotification(str);
        }

        // ToDo: enable buttons

        // hide indicator
        // !this.closed && this.setState({ showFacebookLoader: false });
    }

    isStandaloneApp = () => {
        if (Constants.appOwnership === 'expo') {
            console.log('Expo ownership app');

            if (Platform.OS === 'android') return true;

            return false;

        } else { // standalone
            console.log('standalone app');

            return true;
        }

        // return !(Platform.OS === 'ios' && Constants.appOwnership === 'expo');
    }

    signUpWithEmail() {
        Vars.signUpType = 'EMAIL';

        this.props.navigation.navigate("email", { from: 'email' });
    }

    signUpWithMobile() {
        Vars.signUpType = 'MOBILE';

        this.props.navigation.navigate("mobile", { from: 'mobile' });
    }

    render() {
        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const viewStyle = {
            transform: [{ translateY: this.state.viewOffset }]
        };

        return (
            <View style={styles.container}>
                <Image
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.Background}
                    fadeDuration={0} // we need to adjust Android devices (https://facebook.github.io/react-native/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300` 
                // blurRadius={Platform.OS === 'android' ? 1 : 15}
                />
                {/*
                <ImageBackground
                    style={{
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height
                    }}
                    source={PreloadImage.Background}
                    resizeMode='cover'
                    blurRadius={1}
                />
                */}
                {/*
                <AnimatedImage
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.Background}
                    fadeDuration={0} // we need to adjust Android devices (https://facebook.github.io/react-native/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300` 
                    blurRadius={this.state.blurRadius}
                />
                */}

                {/*
                <ImageBackground
                    style={{
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height
                    }}
                    source={PreloadImage.Background}
                    resizeMode='cover'
                    blurRadius={1}
                />
                */}

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
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.view, viewStyle]}>
                    <View style={styles.logo}>
                        <Image
                            style={{
                                tintColor: 'rgba(255, 255, 255, 0.8)',
                                width: 46, height: 46,
                                resizeMode: 'cover'
                            }}
                            source={PreloadImage.Title}
                        />
                        <Text style={{
                            // backgroundColor: 'green',
                            marginLeft: -4,
                            fontFamily: "FriendlySchoolmates-Regular",
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 40,
                            paddingTop: 27,
                            // paddingBottom: 4,
                            textAlign: 'center'
                        }}>ROWENA</Text>
                    </View>

                    <View style={styles.empty}>
                    </View>

                    <View style={styles.contents}>
                        {/*
                        <Text style={{ marginBottom: 5, fontSize: 13, fontFamily: "Roboto-Light", color: 'rgba(221, 221, 221, 0.8)' }}>
                            Don't worry! We don't post anything to Facebook.
                        </Text>
                        */}
                        <TouchableOpacity
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                }

                                setTimeout(() => {
                                    this.continueWithFacebook();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithFacebookButton}
                        >
                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginLeft: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}>
                                <EvilIcons name='sc-facebook' color="rgba(0, 0, 0, 0.6)" size={36} />
                            </View>

                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(0, 0, 0, 0.6)' }}>Continue with Facebook</Text>

                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginRight: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}>
                                {
                                    /*
                                    this.state.showFacebookLoader &&
                                    <ActivityIndicator
                                        animating={true}
                                        size="small"
                                        color='rgba(0, 0, 0, 0.6)'
                                    />
                                    */
                                }
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                }

                                setTimeout(() => {
                                    this.signUpWithMobile();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithMobileButton}
                        >
                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginLeft: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}>
                                <FontAwesome name='phone' color="rgba(255, 255, 255, 0.8)" size={24} />
                            </View>

                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Sign up with Mobile</Text>

                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginRight: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}></View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                }

                                setTimeout(() => {
                                    this.signUpWithEmail();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithEmailButton}
                        >
                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginLeft: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name='md-mail' color="rgba(255, 255, 255, 0.8)" size={23} />
                            </View>

                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Sign up with Email</Text>

                            <View style={{ width: Cons.buttonHeight, height: Cons.buttonHeight, marginRight: Cons.buttonHeight / 3, alignItems: 'center', justifyContent: 'center' }}></View>
                        </TouchableOpacity>

                        {/*
                        <TouchableOpacity
                            // style={{ marginBottom: 150, marginTop: 18, justifyContent: 'center', alignItems: 'center' }}
                            style={styles.logInText}
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                }

                                // ToDo: login
                                setTimeout(() => {
                                    // this.props.navigation.navigate("logIn");
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            <Text>
                                <Text style={{ fontSize: 14, fontFamily: "Roboto-Light", color: 'rgba(255, 255, 255, 0.8)' }}>Already a member?  </Text>
                                <Text style={{ fontSize: 15, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Log in</Text>
                            </Text>
                        </TouchableOpacity>
                        */}

                        <Text style={{ position: 'absolute', bottom: 30, fontSize: 13, fontFamily: "Roboto-Light", color: 'rgba(255, 255, 255, 0.8)' }}>
                            Don't worry! We don't post anything to Facebook.
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: Theme.color.splash
    },
    view: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center'
    },
    /*
    bgimage: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%'
    },
    */
    logo: {
        width: '100%',
        height: '35%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    contents: {
        width: '100%',
        height: '50%',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    signUpWithFacebookButton: {
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0,
        width: '85%',
        height: Cons.buttonHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    signUpWithMobileButton: {
        marginTop: 20,

        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
        width: '85%',
        height: Cons.buttonHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    signUpWithEmailButton: {
        marginTop: 20,

        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
        width: '85%',
        height: Cons.buttonHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        marginBottom: 30 + Dimensions.get('window').height / 8,
    },
    /*
    logInText: {
        marginTop: 30,
        marginBottom: Dimensions.get('window').height / 8,

        justifyContent: 'center', alignItems: 'center'
    },
    */
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
