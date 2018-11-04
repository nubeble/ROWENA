// stack navigator
/*
import React from 'react';
import { createStackNavigator } from 'react-navigation';

import Page from './Page';
import Detail from './Detail';


export default createStackNavigator(
    {
        page: {
            screen: Page,
            // path:
        },
        detail: {
            screen: Detail,
        }
    }
);
*/

/*** ToDo: include modal! ***/

import React from 'react';
import {
    StyleSheet, View, Text, TextInput, ImageBackground, TouchableOpacity, Image, Modal, TouchableHighlight, Alert
} from 'react-native';
import { Container, Header, Content, Form, Item, Input, Label, Thumbnail, Button } from 'native-base';
import { } from 'react-native';

import AntIcon from "react-native-vector-icons/AntDesign";


export default class Authentication extends React.Component {
    state = {
        email: '',
        password: '',


        modalVisible: false
    };

    setModalVisible(visible) {
        this.setState({ modalVisible: visible });
    }

    signUpWithEmail() {

    }

    signUpWithMobile() {

    }

    signUpWithFacebook() {

    }

    render() {
        // var { height, width } = Dimensions.get('window');

        return (
            < ImageBackground
                style={{ flex: 1 }
                }
                source={require('../assets/splash.png')} // ToDo: cache
                imageStyle={{ resizeMode: 'cover' }}
                blurRadius={5}
            >
                {/*
            <Image style={styles.bgimage} blurRadius={5} source={require('../assets/splash.png')} />
            */}

                <View
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'center' }} >



                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.modalVisible}
                        onRequestClose={() => {
                            Alert.alert('Modal has been closed.');
                        }}>

                        <Header
                            leftComponent={{ icon: 'menu', color: 'rgb(234, 150, 24)' }}
                            centerComponent={{ text: 'MY TITLE', style: { color: 'rgb(234, 150, 24)' } }}
                            rightComponent={{ icon: 'home', color: 'rgb(234, 150, 24)' }}
                        />

                        <View style={{
                            flex: 1,
                            backgroundColor: '#00ffff',
                            // alignItems: 'center',
                            justifyContent: 'center'
                        }} >






                            <View>

                                <TouchableHighlight
                                    onPress={() => {
                                        this.setModalVisible(!this.state.modalVisible);
                                    }}>
                                    <Text>Hide Modal</Text>
                                </TouchableHighlight>

                            </View>




                        </View>

                    </Modal>



                    <View style={styles.logo}>

                        <Text style={{
                            // marginTop: 100,
                            // backgroundColor: 'rgba(0,0,0,0)',
                            padding: 50,
                            fontFamily: "EchinosParkScript",
                            color: 'white',
                            fontSize: 42,
                            textAlign: 'center'
                        }}>ROWENA</Text>

                    </View>

                    <View style={styles.empty}>


                        <Button block style={styles.signUpWithEmailButton}
                            onPress={() => this.setModalVisible(true)} >
                            <Text style={{ color: 'white' }}>Show Modal</Text>
                        </Button>


                    </View>

                    <View style={styles.contents}>

                        <Button block style={styles.signUpWithEmailButton}
                            onPress={() => this.signUpWithEmail()} >
                            <AntIcon style={{ position: 'absolute', left: 20, top: 10 }} name='mail' color="white" size={22} />
                            <Text style={{ color: 'white' }}>Sign up with Email</Text>
                        </Button>

                        <Button block style={styles.signUpWithMobileButton}
                            onPress={() => this.signUpWithMobile()}>
                            <AntIcon style={{ position: 'absolute', left: 20, top: 10 }} name='phone' color="white" size={22} />
                            <Text style={{ color: 'white' }}>Sign up with Mobile</Text>
                        </Button>

                        <Button block style={styles.signUpWithFacebookButton}
                            onPress={() => this.signUpWithFacebook()}>
                            <AntIcon style={{ position: 'absolute', left: 20, top: 10 }} name='facebook-square' color="white" size={22} />
                            <Text style={{ color: 'white' }}>Continue with Facebook</Text>
                        </Button>

                        <TouchableOpacity onPress={() => navigate('Daftar')}>
                            <Text style={styles.logInText}>
                                Already a member? Log in
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

    onChangeText(message: string) {

    }

    moveToMain() {
        this.props.navigation.navigate('main');
    }

    async getUserToken() {
        const userToken = await AsyncStorage.getItem('USER_TOKEN');

        return userToken;
    }
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
        backgroundColor: 'white'
    },
    contents: {
        width: '100%',
        height: '50%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: '#1ad657'
    },

    signUpWithEmailButton: {
        marginTop: 10,
        paddingTop: 10,
        marginLeft: 30,
        marginRight: 30,

        backgroundColor: "#D44638",
        height: 42
    },

    signUpWithMobileButton: {
        marginTop: 10,
        paddingTop: 10,
        marginLeft: 30,
        marginRight: 30,

        backgroundColor: "rgba(46, 160, 73, 1)",
        height: 42
    },

    signUpWithFacebookButton: {
        marginTop: 10,
        paddingTop: 10,
        marginLeft: 30,
        marginRight: 30,

        backgroundColor: "rgba(59, 89, 151, 1)",
        height: 42
    },

    logInText: {
        marginBottom: 150,
        marginTop: 30,
        color: 'white',
        fontWeight: '500'
    },

    caution: {
        position: 'absolute',
        justifyContent: 'flex-end',
        alignItems: 'center',
        bottom: 50,
        color: 'white',
        fontWeight: '100'
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
