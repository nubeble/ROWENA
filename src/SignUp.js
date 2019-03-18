import React from 'react';
import { StyleSheet, View, TextInput, Button } from 'react-native';
import { Text } from "./rnff/src/components";


export default class SignUp extends React.Component {

    state = {
        userName: '',
        password: '',
        phoneNumber: '',
        email: '',
        confirmationCode: ''
    };

    onChangeText(key, value) {
        this.setState({
            [key]: value
        })
    }

    signUp() {
        Auth.signUp({
            username: this.state.userName,
            password: this.state.password,
            attributes: {
                email: this.state.email,
                phone_number: this.state.phoneNumber
                // other custom attributes 
            },
            validationData: []  //optional
        })
            .then(data => console.log('result signing up:', data))
            .catch(err => console.log('error signing up:', err));
    }

    confirmSignUp() {
        // After retrieveing the confirmation code from the user
        Auth.confirmSignUp(this.state.userName, this.state.confirmationCode, {
            // Optional. Force user confirmation irrespective of existing alias. By default set to True.
            forceAliasCreation: true
        })
            .then(data => console.log('result confirming signing up:', data))
            .catch(err => console.log('error confirming signing up:', err));
    }




    render() {
        return (
            <View style={styles.container}>

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('userName', value)} placeholder='User Name' />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('password', value)} placeholder='Password'
                    secureTextEntry={true} />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('phoneNumber', value)} placeholder='Phone Number' />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('email', value)} placeholder='Email' />

                <Button title='Sign Up' onPress={this.signUp.bind(this)} />

                <TextInput style={styles.input} onChangeText={value => this.onChangeText('confirmationCode', value)} placeholder='Confirmation Code' />

                <Button title='Confirm Sign Up' onPress={this.confirmSignUp.bind(this)} />

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
