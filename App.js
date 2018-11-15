import React from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
// import ModalHost from 'expo/src/modal/ModalHost';
import { ThemeProvider } from './src/rne/src/components';
import MainSwitchNavigator from './src/MainSwitchNavigator';
import { FeedStore } from './src/rnff/src/components';
import { Font, AppLoading } from 'expo';
import { configure } from 'mobx';
import { Provider } from "mobx-react/native";
import { Profile, Explore, Share, SharePicture, HomeTab, Comments, Settings, ProfileStore } from "./src/rnff/src/home";

configure({ enforceActions: 'observed' })

// const onNavigationStateChange = () => undefined;

/*
type AppProps = {};

type AppState = {
	isReady: boolean,
};
*/


// export default class App extends React.Component<AppProps, AppState> {
export default class App extends React.Component {

	feedStore = new FeedStore();
	profileStore = new ProfileStore();
	userFeedStore = new FeedStore();

	state = {
		/*
		email: '',
		password: '',
		*/

		/*
		userName: '',
		phoneNumber: '',
		confirmationCode: '',
		*/

		// isReady: false,
	};

	/*
	ready() {
		this.setState({ isReady: true });
	}
	*/

	/*
	constructor(props) {
		super(props);
	}
	*/

	componentDidMount() {
		console.log('App::componentDidMount');

		const { navigation } = this.props;

		StatusBar.setBarStyle('light-content');
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("black");
		}

		// this.ready();
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
		const { feedStore, profileStore, userFeedStore } = this;


		const statusBar = (
			<StatusBar
				translucent
				backgroundColor="transparent"
				barStyle="light-content"
			/>
		);

		/*
		if (isReady === false) {
			return (
				<React.Fragment>

					{statusBar}

					<AppLoading />

				</React.Fragment>
			);
		}
		*/

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
					<Provider {...{ feedStore, profileStore, userFeedStore }}>
						<MainSwitchNavigator />
					</Provider>
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
