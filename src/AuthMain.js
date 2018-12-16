import React from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import EvilIcons from "react-native-vector-icons/EvilIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
// import { SaveStorage, LoadStorage, RemoveStorage } from './Storage';
import Firebase from './Firebase';
import * as firebase from "firebase";
import PreloadImage from './PreloadImage';

export default class AuthMain extends React.Component {
    state = {
        showIndicator: false,

        /*
        email: '',
        password: '',
        */
    };

    componentWillUnmount() {
        this.isClosed = true;
    }

    async continueWithFacebook() {
        const {
            type,
            token,
            expires,
            permissions,
            declinedPermissions,
        } = await Expo.Facebook.logInWithReadPermissionsAsync('367256380681542', { permissions: ['public_profile'] });

        if (type === 'success') {
            const credential = firebase.auth.FacebookAuthProvider.credential(token);

            // show indicator
            this.setState({ showIndicator: true });

            // ToDo: disable buttons

            try {
                const user = await Firebase.auth.signInAndRetrieveDataWithCredential(credential);
                console.log('user', user);

                // save user info to database
                await Firebase.createProfile(user.user.uid, user.user.displayName, user.user.email, user.user.phoneNumber);
            } catch (error) {
                console.log('signInAndRetrieveDataWithCredential error', error);

                // ToDo: error handling - messagebox (please try again)
            }

            // ToDo: enable buttons

            // close indicator
            !this.isClosed && this.setState({ showIndicator: false });
        }
    }

    signUpWithEmail() {
        this.props.navigation.navigate('email');
    }

    signUpWithMobile() {
        this.props.navigation.navigate('mobile');
    }

    render() {
        // let { height, width } = Dimensions.get('window');

        return (
            <ImageBackground
                // style={{ flex: 1, width: null, height: null }}
                style={{
                    flex: 1,
                    position: 'absolute',
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height
                }}
                source={PreloadImage.Splash}
                // imageStyle={{ resizeMode: 'cover' }}
                resizeMode='cover'
                // blurRadius={3}
                blurRadius={20}
            >
                <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'center' }} >
                    <ActivityIndicator
                        style={styles.activityIndicator}
                        animating={this.state.showIndicator}
                        size="large"
                        color='white'
                    />

                    <View style={styles.logo}>

                        <Text style={{
                            // marginTop: 100,
                            // backgroundColor: 'rgba(0,0,0,0)',
                            padding: 50,
                            fontFamily: "FriendlySchoolmatesRegular",
                            // fontFamily: "SansSerif",
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 36,
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>ROWENA</Text>

                    </View>

                    <View style={styles.empty}>
                    </View>

                    <View style={styles.contents}>

                        <TouchableOpacity
                            onPress={() => this.continueWithFacebook()}
                            style={styles.signUpWithFacebookButton}
                        >
                            <EvilIcons style={{ position: 'absolute', left: 12, top: 6 }} name='sc-facebook' color="rgba(0, 0, 0, 0.6)" size={36} />
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'rgba(0, 0, 0, 0.6)' }}>Continue with Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => this.signUpWithEmail()}
                            style={styles.signUpWithEmailButton}
                        >
                            <Ionicons style={{ position: 'absolute', left: 18, top: 9 }} name='md-mail' color="rgba(255, 255, 255, 0.8)" size={23} />
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>Sign up with Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => this.signUpWithMobile()}
                            style={styles.signUpWithMobileButton}
                        >
                            <FontAwesome style={{ position: 'absolute', left: 19, top: 10 }} name='phone' color="rgba(255, 255, 255, 0.8)" size={24} />
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>Sign up with Mobile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            // onPress={() => navigate('Daftar')}
                        >
                            <Text style={{ marginBottom: 150, marginTop: 30, color: 'rgba(255, 255, 255, 0.8)' }} >
                                <Text>Already a member? </Text>
                                <Text style={{ fontWeight: '500' }}>Log in</Text>
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.caution}>
                            Don't worry! We don't post anything to Facebook.
                        </Text>

                    </View>











                    {/*
                    <View style={styles.header}>

                        <Text style={{
                            // marginTop: 100,
                            // backgroundColor: 'rgba(0,0,0,0)',
                            color: 'white',
                            fontSize: 32,
                            textAlign: 'center'
                        }}>ROWENA</Text>

                    </View>

                    <View style={styles.content}>

                        <Form style={styles.formLogin}>
                            <Item floatingLabel>
                                <Label>
                                    <Text style={styles.st_inputfnt}>Email</Text>
                                </Label>
                                <Input style={styles.st_inputfnt} onChangeText={(text) => this.setState({ email: text })} />
                            </Item>
                            <Item floatingLabel>
                                <Label>
                                    <Text style={styles.st_inputfnt}>Password</Text>
                                </Label>
                                <Input style={styles.st_inputfnt} secureTextEntry={true} onChangeText={(text) => this.setState({ password: text })} />
                            </Item>
                        </Form>

                        <Button block info style={styles.buttonLogIn} onPress={() => this.handleClick(navigate)}>
                            <Text>Log In</Text>
                        </Button>

                        <View style={{ marginTop: 10, alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => navigate('Daftar')}>
                                <Text style={styles.st_signup}>
                                    Forgot your password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Button block primary style={styles.buttonLogInWithFacebook} onPress={() => this.handleClick(navigate)}>
                            <Text>Log in with Facebook</Text>
                        </Button>

                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigate('Daftar')}>
                            <Text style={styles.st_signup}>
                                Belum pernah registrasi? SIGN UP!
                                </Text>
                        </TouchableOpacity>
                    </View>
                    */}





                </View>
            </ImageBackground >
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
        backgroundColor: '#ffffff',
        // alignItems: 'center',
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
        alignItems: 'center',
        // backgroundColor: '#ff9a9a'
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'white'
    },
    contents: {
        width: '100%',
        height: '50%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: '#1ad657'
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
    },
    caution: {
        position: 'absolute',
        bottom: 50,

        // justifyContent: 'flex-end',
        // alignItems: 'center',

        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '100'
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },


    /*
    header: {
        width: '100%',
        height: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#ff9a9a',
    },
    content: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        // backgroundColor: '#d6ca1a',
    },
    footer: {
        width: '100%',
        height: '10%',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#1ad657',
    },
    loginForm: {
        flex: 1,
        marginTop: 80
    },
    buttonLogIn: {
        marginTop: 26,
        paddingTop: 10,
        marginLeft: 30,
        marginRight: 30
    },
    buttonLogInWithFacebook: {
        marginTop: 100,
        paddingTop: 10,
        marginLeft: 30,
        marginRight: 30
    },
    formLogin: {
        // marginTop: 10,
        paddingLeft: 20,
        paddingRight: 40
    },
    st_signup: {
        color: 'white',
        fontWeight: '500'
    },
    st_inputfnt: {
        color: 'white'
    }
    */
});
