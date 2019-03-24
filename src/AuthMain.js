import React from 'react';
import {
    StyleSheet, View, StatusBar, TouchableOpacity, ActivityIndicator,
    Animated, Dimensions, Platform, Image
} from 'react-native';
import { EvilIcons, Ionicons, FontAwesome } from "react-native-vector-icons";
import Firebase from './Firebase';
import * as firebase from "firebase";
// import { SaveStorage, LoadStorage, RemoveStorage } from './Storage';
import PreloadImage from './PreloadImage';
import { Cons } from "./Globals";
import { Text, Theme } from "./rnff/src/components";

const height = Dimensions.get('window').height;


export default class AuthMain extends React.Component {
    state = {
        showFacebookLoader: false,

        // loaded: false,
        // blurRadius: new Animated.Value(1),
        // offset: new Animated.Value(0)

        // opacity: new Animated.Value(0),
        offset: new Animated.Value(height)
    };

    componentDidMount() {
        Animated.timing(this.state.offset, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
        }).start(() => {
            StatusBar.setHidden(false);
        });
    }

    componentWillUnmount() {
        this.closed = true;
    }

    async continueWithFacebook() {
        // ToDo: disable buttons

        // show indicator
        this.setState({ showFacebookLoader: true });

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

                // check existance
                const profile = await Firebase.getProfile(Firebase.user().uid);
                if (!profile) {
                    // save user info to database
                    await Firebase.createProfile(user.user.uid, user.user.displayName, user.user.email, user.user.phoneNumber);
                }
            } catch (error) {
                console.log('signInAndRetrieveDataWithCredential error', error);

                // ToDo: error handling - messagebox (please try again)
            }
        }

        // close indicator
        !this.closed && this.setState({ showFacebookLoader: false });

        // ToDo: enable buttons
    }

    isStandaloneApp = () => {
        if (Expo.Constants.appOwnership === 'expo') {
            console.log('Expo ownership app');

            if (Platform.OS === 'android') return true;

            return false;

        } else { // standalone
            console.log('standalone app');

            return true;
        }

        // return !(Platform.OS === 'ios' && Expo.Constants.appOwnership === 'expo');
    }

    signUpWithEmail() {
        this.props.navigation.navigate("email");
    }

    signUpWithMobile() {
        this.props.navigation.navigate("mobile");
    }

    render() {
        const viewStyle = {
            transform: [
                {
                    translateY: this.state.offset
                }
            ]
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
                />

                <Animated.View style={[styles.view, viewStyle]}>
                    <View style={styles.logo}>
                        <Text style={{
                            fontFamily: "FriendlySchoolmates-Regular",
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 42,
                            paddingTop: 24,
                            textAlign: 'center'
                        }}>ROWENA</Text>
                    </View>

                    <View style={styles.empty}>
                    </View>

                    <View style={styles.contents}>
                        <TouchableOpacity
                            onPress={() => {
                                setTimeout(() => {
                                    this.continueWithFacebook();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithFacebookButton}
                        >
                            <EvilIcons style={{ position: 'absolute', left: 12, top: 6 }} name='sc-facebook' color="rgba(0, 0, 0, 0.6)" size={36} />
                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'rgba(0, 0, 0, 0.6)', paddingTop: Cons.submitButtonPaddingTop() }}>Continue with Facebook</Text>
                            {
                                this.state.showFacebookLoader &&
                                <ActivityIndicator
                                    style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 1000 }}
                                    animating={true}
                                    size="small"
                                    color='rgba(0, 0, 0, 0.6)'
                                />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setTimeout(() => {
                                    this.signUpWithEmail();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithEmailButton}
                        >
                            <Ionicons style={{ position: 'absolute', left: 18, top: 9 }} name='md-mail' color="rgba(255, 255, 255, 0.8)" size={23} />
                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)', paddingTop: Cons.submitButtonPaddingTop() }}>Sign up with Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setTimeout(() => {
                                    this.signUpWithMobile();
                                }, Cons.buttonTimeoutShort);
                            }}
                            style={styles.signUpWithMobileButton}
                        >
                            <FontAwesome style={{ position: 'absolute', left: 19, top: 10 }} name='phone' color="rgba(255, 255, 255, 0.8)" size={24} />
                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)', paddingTop: Cons.submitButtonPaddingTop() }}>Sign up with Mobile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginBottom: 150, marginTop: 18, justifyContent: 'center', alignItems: 'center' }}
                        // ToDo: login
                        // onPress={() => this.props.navigation.navigate("logIn")}
                        >
                            <Text>
                                <Text style={{ fontSize: 14, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}>Already a member?  </Text>
                                <Text style={{ fontSize: 15, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)' }}>Log in</Text>
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ position: 'absolute', bottom: 30, fontSize: 13, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)' }}>
                            Don't worry! We don't post anything to Facebook.
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }





    /*
    async getUserToken() {
        const userToken = await AsyncStorage.getItem('USER_TOKEN');

        return userToken;
    }
    */
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.color.themeBackground
    },
    view: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0,
        width: '85%',
        height: 45
    },
    signUpWithEmailButton: {
        marginTop: 20,

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
        width: '85%',
        height: 45
    },
    signUpWithMobileButton: {
        marginTop: 20,

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
        width: '85%',
        height: 45
    }
});
