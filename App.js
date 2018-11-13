import React from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
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

import MainSwitchNavigator from './src/MainSwitchNavigator';

// $FlowFixMe
const SFProTextBold = require("./fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("./fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("./fonts/SF-Pro-Text-Regular.otf");
const FriendlySchoolmatesItalic = require("./fonts/Friendly-Schoolmates-Italic.otf");
const FriendlySchoolmatesRegular = require("./fonts/Friendly-Schoolmates-Regular.otf");
const SansSerif = require("./fonts/Sans-Serif.ttf");

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

	async componentDidMount(): Promise<void> {
		console.log('App::componentDidMount');

		StatusBar.setBarStyle('light-content');
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("black");
		}

		const fonts = Font.loadAsync({
			"SFProText-Bold": SFProTextBold,
			"SFProText-Semibold": SFProTextSemibold,
			"SFProText-Regular": SFProTextRegular,
			"FriendlySchoolmatesItalic": FriendlySchoolmatesItalic,
			"FriendlySchoolmatesRegular": FriendlySchoolmatesRegular,
			"SansSerif": SansSerif
		});

		const images = Images.downloadAsync(); // logo

		const icons = loadIcons();

		await Promise.all([fonts, ...images, icons]);




		// database watch
		const ref = firebase.database().ref().child('users');
		ref.on('value', function(snapshot) {
			console.log('database watch', snapshot.val());
		});

		/*
		var userRatingRef = firebase.database().ref('users/' + userId + '/totalReviewsCount');
		userRatingRef.on('value', function(snapshot) {
			// updateReviewsCount(postElement, snapshot.val());
		});
		*/






		this.ready();
	}

	/*
	logIn(email, password) {

		try {

			firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
				console.log(user);
			})

		} catch (error) {
			console.log('signInWithEmailAndPassword', error.toString());
		}

	}
	*/



	render() {
		const { isReady } = this.state;

		console.log('render(), isReady:', isReady);

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
					<MainSwitchNavigator />
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
