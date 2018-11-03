import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as firebase from 'firebase';

const firebaseConfig = {
	apiKey: "AIzaSyCT1LV1HF5REJw_SePsUeUdwFalo5IzrsQ",
	authDomain: "rowena-88cfd.firebaseapp.com",
	databaseURL: "https://rowena-88cfd.firebaseio.com",
	projectId: "rowena-88cfd",
	storageBucket: "rowena-88cfd.appspot.com",
	// messagingSenderId: "457192015889"
};

firebase.initializeApp(firebaseConfig);

import { Container, Content, Header, Form, Input, Item, Button, Label } from 'native-base';


export default class App extends React.Component {

	state = {
		email: '',
		password: ''

		/*
		userName: '',
		phoneNumber: '',
		confirmationCode: ''
		*/
	};

	constructor(props) {
		super(props);

		// this.setState({ email: '', password: '' });
	}

	signUp(email, password) {

	}

	logIn(email, password) {

	}



	render() {
		return (

			<Container style={styles.container}>

				<Form>
					<Item floatingLabel>
						<Label>Email</Label>
						<Input
							autoCorrect={false}
							autoCapitalize="none"
						/>
					</Item>
					<Item floatingLabel>
						<Label>Password</Label>
						<Input
							autoCorrect={false}
							autoCapitalize="none"
							secureTextEntry={true}
						/>
					</Item>
				</Form>

				<Button style={{ marginTop: 10 }}
					full
					rounded
					success
					onPress={() => this.logIn(this.state.email, this.state.password)}
				>
					<Text style={{ color: 'white' }}>Log in</Text>
				</Button>

				<Button style={{ marginTop: 10 }}
					full
					rounded
					primary
					onPress={() => this.signUp(this.state.email, this.state.password)}
				>
					<Text style={{ color: 'white' }}>Sign up</Text>
				</Button>

			</Container>

		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		// alignItems: 'center',
		justifyContent: 'center',
		padding: 10
	},
});
