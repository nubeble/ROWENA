import React from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Form, Item, Input, Label } from 'native-base';
import { Constants } from "expo";
import Ionicons from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
// import * as firebase from 'firebase';
import Firebase from './Firebase'


export default class SignUpWithEmail extends React.Component {
    state = {
        email: '',
        password: '',
        // userName: ''

        emailIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        pwIcon: 0, // 0: disappeared, 1: exclamation, 2: check

        showIndicator: false,

        value: '',
        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0),

        invalid: true,
        signUpButtomTextColor: 'rgba(255,255,255,0.3)',

        securePwInput: true,
        secureText: 'Show',
    };

    showNotification = () => {
        if (!this._showNotification) {
            this._showNotification = true;

            this.setState(
                {
                    value: "",
                    notification: this.state.value,
                },
                () => {
                    this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                        this.state.offset.setValue(height * -1);

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
                }
            );
        }
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

        this._showNotification = false;
    }

    componentDidMount() {
        let that = this;
        setTimeout(function () {
            that.refs['emailInput']._root.focus();
        }, 750); // 0.75 sec
    }

    validateEmail(text) {
        this.setState({ email: text });

        console.log('email', text);
        console.log('password', this.state.password);

        // enable/disable signup button
        if (text === '' || this.state.password === '') {
            // disable
            this.setState( {invalid: true, signUpButtomTextColor: 'rgba(255,255,255,0.3)'} );
        } else {
            // enable
            this.setState( {invalid: false, signUpButtomTextColor: 'rgba(255, 255, 255, 0.8)'} );
        }

        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
        }

        let reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (reg.test(String(text).toLowerCase()) === false) {
            console.log('Please enter a valid email address.');

            // show icon
            this.setState({ emailIcon: 0 });
        } else {
            console.log("Email is Correct");

            // show icon
            this.setState({ emailIcon: 2 });
        }
    }

    validatePassword(text) {
        this.setState({ password: text });

        console.log('email', this.state.email);
        console.log('password', text);

        // enable/disable signup button
        if (text === '' || this.state.email === '') {
            // disable
            this.setState( {invalid: true, signUpButtomTextColor: 'rgba(255,255,255,0.3)'} );
        } else {
            // enable
            this.setState( {invalid: false, signUpButtomTextColor: 'rgba(255, 255, 255, 0.8)'} );
        }

        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
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
            this.setState({secureText: 'Hide', securePwInput: false});
        } else {
            this.setState({secureText: 'Show', securePwInput: true});
        }

        // ToDo: don't need this in ios, not working in android
        this.refs['pwInput']._root.setNativeProps({ selection:{ start:this.state.password.length, end:this.state.password.length } });
    }

    signUp() {
        if (this.state.emailIcon !== 2) {
            console.log('Please enter a valid email address.');

            // show message box
            this.state.value = 'Please enter a valid email address.';
            this.showNotification();

            this.setState({ emailIcon: 1 });

            // set focus
            this.refs['emailInput']._root.focus();

            return;
        }

        if (this.state.pwIcon !== 2) {

            // show message box
            this.state.value = this.getPasswordErrorMessage(this.state.password);
            this.showNotification();

            this.setState({ pwIcon: 1 });

            // set focus
            this.refs['pwInput']._root.focus();

            return;
        }

        // hide keyboard
        this.refs['emailInput']._root.blur();
        this.refs['pwInput']._root.blur();


        // show indicator
        this.setState({ showIndicator: true });

        try {
            // firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password);
            Firebase.auth.createUserWithEmailAndPassword(this.state.email, this.state.password);
        } catch (error) {

            // close indicator
            this.setState({ showIndicator: false });

            console.log('error', error.toString());

            // ToDo: do something
        }
    }

    render() {
        const { goBack } = this.props.navigation;
        const showIndicator = this.state.showIndicator;
        const emailIcon = this.state.emailIcon;
        const pwIcon = this.state.pwIcon;
        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [
                {
                    translateY: this.state.offset
                },
            ],
        };

        return (
            <ImageBackground
                style={{ flex: 1, width: null, height: null }}
                source={require('../assets/splash.png')}
                imageStyle={{ resizeMode: 'cover' }}
                blurRadius={3}
            >
                <View
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'center' }} >

                    <View style={styles.container}>

                        <Animated.View
                            style={[styles.notification, notificationStyle]}
                            ref={notification => this._notification = notification}
                        >
                            <Text style={styles.notificationText}>
                                {this.state.notification}
                            </Text>
                            <TouchableOpacity
                                style={{ position: 'absolute', right: 18, top: 4, alignSelf: 'baseline' }}
                                onPress={() => this.hideNotification()}
                            >
                                <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                            </TouchableOpacity>
                        </Animated.View>

                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={showIndicator}
                            size="large"
                            // color='rgba(255, 184, 24, 0.8)'
                            color='rgba(255, 255, 255, 0.8)'
                        />

                        {/*
                        <View style={{ position: 'absolute', top: 34, width: '100%', backgroundColor: '#999999', height: 2 }} />
                        */}

                        <View style={styles.searchBarStyle}>

                            <TouchableOpacity
                                style={{ marginTop: Constants.statusBarHeight + 30 + 2, marginLeft: 22, alignSelf: 'baseline' }}
                                onPress={() => this.props.navigation.goBack()}
                            >
                                <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                            </TouchableOpacity>

                        </View>

                        <Text style={{
                            marginTop: 12,
                            marginLeft: 22,

                            color: 'rgba(255, 255, 255, 0.8)',
                            fontFamily: "SansSerif",
                            fontSize: 28,
                            fontWeight: 'bold',
                            // textAlign: 'center'
                        }}>What's your email?</Text>


                        <Form style={{ marginTop: 18, marginLeft: 4, marginRight: 16 }} >
                            <Label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: 'bold', marginLeft: 18 }} >EMAIL ADDRESS</Label>
                            <Item>
                                <Input ref='emailInput' autoCapitalize="none" style={{ height: 42, fontSize: 22, color: 'rgba(255, 255, 255, 0.8)' }} underlineColorAndroid="transparent" autoCorrect={false}
                                    selectionColor={'rgba(255, 255, 255, 0.8)'}
                                    onChangeText={(text) => this.validateEmail(text)}
                                />
                                {(emailIcon === 1) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='exclamation' color="rgba(255, 255, 255, 0.8)" size={28} />}
                                {(emailIcon === 2) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='check' color="rgba(255, 255, 255, 0.8)" size={28} />}
                            </Item>

                            <Label style={{ marginTop: 30, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: 'bold', marginLeft: 18 }} >PASSWORD</Label>

                            <TouchableOpacity
                                style={{ position: 'absolute', top: 92, right: 10, alignSelf: 'baseline' }}
                                onPress={() => this.toggleSecureText()}
                            >
                                <Text style={{ fontWeight: 'bold', fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>{this.state.secureText}</Text>
                            </TouchableOpacity>

                            <Item>
                                <Input ref='pwInput' autoCapitalize="none" style={{ height: 42, fontSize: 22, color: 'rgba(255, 255, 255, 0.8)' }} underlineColorAndroid="transparent" autoCorrect={false}
                                    selectionColor={'rgba(255, 255, 255, 0.8)'}
                                    secureTextEntry={this.state.securePwInput}
                                    onChangeText={(text) => this.validatePassword(text)}
                                />
                                {(pwIcon === 1) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='exclamation' color="rgba(255, 255, 255, 0.8)" size={28} />}
                                {(pwIcon === 2) && <AntDesign style={{ position: 'absolute', right: 2, top: 8 }} name='check' color="rgba(255, 255, 255, 0.8)" size={28} />}
                            </Item>
                        </Form>

                        <TouchableOpacity onPress={() => this.signUp()} style={styles.signUpButton} disabled={ this.state.invalid } >
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: this.state.signUpButtomTextColor }}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    searchBarStyle: {
        height: 80,
        paddingBottom: 16,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    signUpButton: {
        // marginTop: 40,
        position: 'absolute',
        bottom: 30,

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
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,

        // margin: 'auto',


        /*
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto'
        */


        /*
        // alignSelf: 'center',
        left: 0,
        right: 0,
        top: 50,
        bottom: 0,
        // margin: auto;

        // justifyContent: 'center',
        // alignItems: 'center',
        height: 80
        */
    },
    notification: {
        position: "absolute",
        left: 0,
        right: 0,
        //paddingHorizontal: 7,
        //paddingVertical: 15,
        justifyContent: 'center',
        top: Constants.statusBarHeight,
        // top: 0,
        height: 30,
        backgroundColor: "rgba(255, 184, 24, 0.8)"
    },
    notificationText: {
        alignSelf: 'center',
        color: "#FFF"
    },

});
