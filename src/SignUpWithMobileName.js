import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Dimensions,
    ImageBackground, Animated, Keyboard, Platform, TextInput, Button
} from 'react-native';
import { Text, Theme } from './rnff/src/components';
import Constants from 'expo-constants';
import { Ionicons, AntDesign } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from './Globals';


export default class SignUpWithMobileName extends React.Component {
    state = {
        name: '',
        nameIcon: 0, // 0: disappeared, 1: exclamation, 2: check
        nameY: -1,

        bottomPosition: Dimensions.get('window').height,
        signUpButtonTop: Dimensions.get('window').height - Cons.bottomButtonMarginBottom - Cons.buttonHeight,

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

        Vars.signUpName = null;

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        if (this.refs['nameInput']) this.refs['nameInput'].focus();
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
        if (this.state.nameIcon !== 0) this.setState({ nameIcon: 0 });
    }

    render() {
        const from = this.props.navigation.state.params.from; // 'mobile', 'email'

        const nameIcon = this.state.nameIcon;

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
                source={PreloadImage.background}
                resizeMode='cover'
            // blurRadius={Platform.OS === 'android' ? 1 : 15}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
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

                                Vars.signUpName = null;

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
                                left: '0%',
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
                        }}>{'Tell us your name'}</Text>

                        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                            <TextInput
                                ref='nameInput'
                                style={{ height: 40, paddingLeft: 18, paddingRight: 56, fontSize: 22, fontFamily: "Roboto-Regular", color: Theme.color.text2 }}
                                value={this.state.name}
                                onChangeText={(text) => this.validateName(text)}
                                onSubmitEditing={(event) => this.submit(event.nativeEvent.text)}
                                selectionColor={Theme.color.selection}
                                // keyboardAppearance={'dark'}
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                                autoCapitalize="words"
                                placeholder="Selena Gomez"
                                placeholderTextColor={Theme.color.placeholder}
                            />
                            {
                                /*
                                this.state.name.length > 0 &&
                                <TouchableOpacity
                                    style={{
                                        width: 40, height: 40, justifyContent: "center", alignItems: "center",
                                        position: 'absolute', right: 48, top: 4
                                    }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        this.setState({ name: '' });

                                        // disable
                                        this.setState({ invalid: true, signUpButtonBackgroundColor: 'rgba(235, 235, 235, 0.5)', signUpButtonTextColor: 'rgba(96, 96, 96, 0.8)' });

                                        this.setState({ nameIcon: 0 });
                                    }}
                                >
                                    <Ionicons name='ios-close-circle' color='rgba(255, 255, 255, 0.8)' size={20} />
                                </TouchableOpacity>
                                */
                            }

                            <View style={{ marginHorizontal: 18, borderBottomColor: 'rgba(255, 255, 255, 0.8)', borderBottomWidth: 1, marginBottom: Theme.spacing.small }}
                                onLayout={(e) => {
                                    const { y } = e.nativeEvent.layout;
                                    this.setState({ nameY: y });
                                }}
                            />
                            {this.state.nameY !== -1 && nameIcon === 0 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.nameY - 34 }} name='exclamationcircleo' color="transparent" size={27} />}
                            {this.state.nameY !== -1 && nameIcon === 1 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.nameY - 34 }} name='exclamationcircleo' color={"rgba(255, 187, 51, 0.8)"} size={27} />}
                            {this.state.nameY !== -1 && nameIcon === 2 && <AntDesign style={{ position: 'absolute', right: 24, top: this.state.nameY - 34 }} name='checkcircleo' color="rgba(255, 255, 255, 0.8)" size={27} />}
                        </View>

                        {
                            from === 'mobile' ?
                                <TouchableOpacity
                                    style={{ marginTop: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        setTimeout(() => {
                                            if (this.closed) return;
                                            this.props.navigation.navigate("signUpWithMobileMain");
                                        }, Cons.buttonTimeout);
                                    }}
                                >
                                    <Text>
                                        <Text style={{ fontSize: 14, fontFamily: "Roboto-Light", color: 'rgba(255, 255, 255, 0.8)' }}>Already a member?  </Text>
                                        <Text style={{ fontSize: 15, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Log in</Text>
                                    </Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity
                                    style={{ marginTop: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        setTimeout(() => {
                                            if (this.closed) return;
                                            this.props.navigation.navigate("signUpWithEmailMain", { from: 'logIn' });
                                        }, Cons.buttonTimeout);
                                    }}
                                >
                                    <Text>
                                        <Text style={{ fontSize: 14, fontFamily: "Roboto-Light", color: 'rgba(255, 255, 255, 0.8)' }}>Already a member?  </Text>
                                        <Text style={{ fontSize: 15, fontFamily: "Roboto-Medium", color: 'rgba(255, 255, 255, 0.8)' }}>Log in</Text>
                                    </Text>
                                </TouchableOpacity>
                        }
                    </View>

                    <View style={{ position: 'absolute', top: this.state.signUpButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.signUpButton, { backgroundColor: this.state.signUpButtonBackgroundColor }]} disabled={this.state.invalid}
                            onPress={() => {
                                setTimeout(() => {
                                    if (this.closed) return;
                                    this.submit(this.state.name);
                                }, Cons.buttonTimeout);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: this.state.signUpButtonTextColor }}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        );
    }

    validateName(text) {
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

        // check character
        if (!text) {
            // hide icon
            this.setState({ nameIcon: 0 });
        } else {
            const reg = /^[a-zA-Z\s]*$/;
            if (reg.test(String(text).toLowerCase())) {
                console.log('validateName', "Name is Correct");

                // show icon
                this.setState({ nameIcon: 2 });
            } else {
                // show icon
                this.setState({ nameIcon: 0 });
            }
        }

        this.setState({ name: text });
    }

    submit(text) {
        if (this.state.nameIcon !== 2) {
            // show message box
            const msg = 'Please use valid characters for your name.';
            this.showNotification(msg);

            this.setState({ nameIcon: 1 });

            // set focus
            this.refs['nameInput'].focus();

            return;
        }

        Vars.signUpName = this.state.name;

        const from = this.props.navigation.state.params.from;
        if (from === 'email') {
            this.props.navigation.navigate("signUpWithEmailMain");
        } else if (from === 'mobile') {
            this.props.navigation.navigate("signUpWithMobileMain");
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
