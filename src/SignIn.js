import React from 'react';
import { StyleSheet, View, TextInput, Button } from 'react-native';
import { Text } from "./rnff/src/components";

//import { Auth, Analytics } from 'aws-amplify';


export default class SignIn extends React.Component {

    state = {
        userName: '',
        password: '',
        confirmationCode: '',

        user: {}
    };

    onPress() {
        console.log('User clicked ads');
        Analytics.record('User clicked ads', { username: 'jdub' });
    }

    onChangeText(key, value) {
        this.setState({
            [key]: value
        })
    }

    signIn() {
        const { userName, password } = this.state;


        Auth.signIn(userName, password)
            .then(user => {
                console.log('result sign in:', user);
                this.setState({ user }); // user
            })
            .catch(err => console.log('error signing in:', err));
    }

    confirmSignIn() {
        Auth.confirmSignIn(this.state.user, this.state.confirmationCode)
            .then(data => {
                console.log('result confirming signing in:', data);

                // ToDo: this.props.screenprops //
                // this.props.screenProps.authenticate(true);
            })
            .catch(err => console.log('error confirming signing in:', err));
    }




    render() {
        return (
            <View style={styles.container}>

                <Button title='Click ads' onPress={this.onPress} />



                <TextInput style={styles.input} onChangeText={value => this.onChangeText('userName', value)} placeholder='User Name' />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('password', value)} placeholder='Password'
                    secureTextEntry={true} />

                <Button title='Sign In' onPress={this.signIn.bind(this)} />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('confirmationCode', value)} placeholder='Confirmation Code' />

                <Button title='Confirm Sign In' onPress={this.confirmSignIn.bind(this)} />

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        // alignItems: 'center',
        justifyContent: 'center',
    },


    input: {
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: '#2196F3',
        margin: 10
    }
});
