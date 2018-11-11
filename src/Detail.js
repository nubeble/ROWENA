import React from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Form, Item, Input, Label } from 'native-base';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
import Ionicons from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
import * as firebase from 'firebase';


export default class Detail extends React.Component {

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

    async pickImage() {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                style: { backgroundColor: 'black'},
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync: ', result);

            if (!result.cancelled) {
                this.uploadImage(result.uri, 'test1'); // ToDo: image name (unique)
            }
        } else {
            Linking.openURL('app-settings:');
        }
    }

    async uploadImage(uri, imageName) {

        // ToDo: show progress bar

        // show indicator
        this.setState({ showIndicator: true });

        const response = await fetch(uri);

        if (response.ok) {
            const blob = await response.blob();

            let ref = firebase.storage().ref().child('images/' + imageName);

            ref.put(blob)
                .then( () => { console.log('uploadImage success.'); alert('Your photo has successfully uploaded.'); } )
                .catch( (error) => { console.log('error: ', error); alert('Please try again.'); } );
            
            // close indicator
            this.setState({ showIndicator: false });
        } else {

            // close indicator
            this.setState({ showIndicator: false });

            alert('Please try again.');
        }

        
    }

    render() {

        const { navigation } = this.props;
        const { params } = navigation.state.params; // ToDo




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
            <View style={styles.container}>

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={showIndicator}
                    size="large"
                    // color='rgba(255, 184, 24, 0.8)'
                    color='rgba(255, 255, 255, 0.8)'
                />

                <TouchableOpacity
                    style={{ marginTop: Constants.statusBarHeight + 30 + 2, marginLeft: 20, alignSelf: 'baseline' }}
                    onPress={() => this.props.navigation.goBack()}
                >
                    <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                </TouchableOpacity>

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

                <TouchableOpacity onPress={() => this.pickImage()} style={styles.signUpButton} >
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Pick me</Text>
                </TouchableOpacity>
            </View>

        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgb(26, 26, 26)'
    },
    signUpButton: {
        position: 'absolute',
        bottom: 30,

        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    notification: {
        position: "absolute",
        left: 0,
        right: 0,
        justifyContent: 'center',
        top: Constants.statusBarHeight,
        height: 30,
        backgroundColor: "rgba(255, 184, 24, 0.8)"
    },
    notificationText: {
        alignSelf: 'center',
        color: "#FFF"
    },

});
