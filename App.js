import React from 'react';
import { StyleSheet, View, Text, Platform, StatusBar } from 'react-native';
import { Font, AppLoading } from 'expo';
// import ModalHost from "expo/src/modal/ModalHost";
import { Images, loadIcons, ThemeProvider } from "./src/components";

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

import Switches from './src/Switches';

// $FlowFixMe
const SFProTextBold = require("./fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("./fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("./fonts/SF-Pro-Text-Regular.otf");
const EchinosParkScript = require("./fonts/EchinosParkScript.ttf");
const FriendlySchoolmatesItalic = require("./fonts/Friendly-Schoolmates-Italic.otf");
const FriendlySchoolmatesRegular = require("./fonts/Friendly-Schoolmates-Regular.otf");


// const onNavigationStateChange = () => undefined;

type AppProps = {};
type AppState = {
	isReady: boolean,
};




// export default class App extends React.Component {
export default class App extends React.Component<AppProps, AppState> {

	state = {
		email: '',
		password: '',
		/*
		userName: '',
		phoneNumber: '',
		confirmationCode: '',
		*/

		isReady: false,
	};

	ready() {
		this.setState({ isReady: true });
	}


	constructor(props) {
		super(props);
	}

	// componentDidMount() {
	async componentDidMount(): Promise<void> {
		console.log('componentDidMount');

		StatusBar.setBarStyle('light-content');
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("black");
		}

		const fonts = Font.loadAsync({
			"SFProText-Bold": SFProTextBold,
			"SFProText-Semibold": SFProTextSemibold,
			"SFProText-Regular": SFProTextRegular,
			"EchinosParkScript": EchinosParkScript,
			"FriendlySchoolmatesItalic": FriendlySchoolmatesItalic,
			"FriendlySchoolmatesRegular": FriendlySchoolmatesRegular
		});

		const images = Images.downloadAsync(); // logo

		const icons = loadIcons();

		await Promise.all([fonts, ...images, icons]);

		firebase.auth().onAuthStateChanged((user) => {
			if (user !== null) {
				console.log('onAuthStateChanged', user); // 'displayName'
			}
		});

		this.ready();
	}

	signUp(email, password) {

		if (this.state.password.length < 6) {
			alert('Please enter at least 6 characters.');
			return;
		}

		try {

			firebase.auth().createUserWithEmailAndPassword(email, password);

		} catch (error) {
			console.log(error.toString());
		}

	}

	logIn(email, password) {

		try {

			firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
				console.log(user);
			})

		} catch (error) {
			console.log('signInWithEmailAndPassword', error.toString());
		}

	}

	async logInWithFacebook() {
		const {
			type,
			token,
			expires,
			permissions,
			declinedPermissions,
		} = await Expo.Facebook.logInWithReadPermissionsAsync('367256380681542', { permissions: ['public_profile'] });

		if (type === 'success') {
			const credential = firebase.auth.FacebookAuthProvider.credential(token);

			// firebase.auth().signInWithCredential(credential).catch((error) => {
			firebase.auth().signInAndRetrieveDataWithCredential(credential).catch((error) => {
				console.log('signInWithCredential', error);
			});


			// Get the user's name using Facebook's Graph API
			/*
			const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
			alert('Logged in!', `Hi ${(await response.json()).name}!`);
			*/
		}

	}



	render() {
		const { isReady } = this.state;

		console.log('render(), isReady: ', isReady);

		const statusBar = (
			<StatusBar
				translucent
				backgroundColor="transparent"
				barStyle="light-content"
			/>
		);

		if (isReady === false) {
			return (
				<React.Fragment>

					{statusBar}

					<AppLoading />

				</React.Fragment>
			);
		}

		// Main View

		return (

			/*
			<Container style={styles.container}>

				<Form>
					<Item floatingLabel>
						<Label>Email</Label>
						<Input
							autoCorrect={false}
							autoCapitalize="none"
							onChangeText={(email) => this.setState({ email })} // this.setState({ email: '', password: '' });
						/>
					</Item>
					<Item floatingLabel>
						<Label>Password</Label>
						<Input
							autoCorrect={false}
							autoCapitalize="none"
							secureTextEntry={true}
							onChangeText={(password) => this.setState({ password })}
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

				<Button style={{ marginTop: 10 }}
					full
					rounded
					primary
					onPress={() => this.logInWithFacebook()}
				>
					<Text style={{ color: 'white' }}>Log in with Facebook</Text>
				</Button>

			</Container>
			*/

			<React.Fragment>

				{statusBar}

				{/*
				<ThemeProvider>
					<PlayerProvider>
						<ModalHost>
							<MainNavigator {...{ onNavigationStateChange }} />
						</ModalHost>
					</PlayerProvider>
				</ThemeProvider>
				*/}

				<ThemeProvider>
					<Switches />
				</ThemeProvider>

			</React.Fragment>






		);
	}
}

const styles = StyleSheet.create({
	/*
	container: {
		flex: 1,
		backgroundColor: '#fff',
		// alignItems: 'center',
		justifyContent: 'center',
		padding: 10
	},
	*/
});
