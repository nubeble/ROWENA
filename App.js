import React from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
// import ModalHost from 'expo/src/modal/ModalHost';
import { ThemeProvider, Colors } from './src/rne/src/components';
// import MainSwitchNavigator from './src/MainSwitchNavigator';
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

// $FlowFixMe
// https://github.com/firebase/firebase-js-sdk/issues/97
if (!console.ignoredYellowBox) {
	console.ignoredYellowBox = [];
}
console.ignoredYellowBox.push("Setting a timer");



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

		// const { navigation } = this.props;

		StatusBar.setBarStyle('light-content');
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("black");
		}

		ThemeProvider.getInstance().switchColors(Colors['Main']);


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






import { createSwitchNavigator, createStackNavigator, createBottomTabNavigator } from "react-navigation";
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

import Loading from './src/Loading';
import Welcome from './src/Welcome'
import AuthMain from './src/AuthMain';
import SignUpWithEmail from './src/SignUpWithEmail';
import SignUpWithMobile from './src/SignUpWithMobile';
import Chats from './src/Chats';
import Likes from './src/Likes';
import ProfileScreen from './src/Profile';
import Intro from './src/Intro';
import ExploreScreen from './src/Explore';
import Detail from './src/Detail';
import MapScreen from './src/MapScreen'


const HomeStackNavigator = createStackNavigator(
	{
		home: {
			screen: ExploreScreen
		},
		detail: {
			screen: Detail
		},
		map: {
			screen: MapScreen
		}
	},
	{
		initialRouteName: 'home',
		mode: 'card',
		headerMode: 'none',
		navigationOptions: {
			gesturesEnabled: false,
		},
		transitionConfig: () => ({
			screenInterpolator: StackViewStyleInterpolator.forHorizontal
		})
	}
);

class HomeStackNavigatorWrapper extends React.Component {
	static router = HomeStackNavigator.router;

	render() {
		return (
			<HomeStackNavigator navigation={this.props.navigation}


				screenProps={{
					params: this.props.navigation.state.params,
					rootNavigation: this.props.navigation
				}}



			/>
		);
	}
}

const HomeSwitchNavigator = createSwitchNavigator(
	{
		intro: { screen: Intro },

		// homeStackNavigator: { screen: HomeStackNavigator }
		homeStackNavigator: { screen: HomeStackNavigatorWrapper }
	},
	{
		initialRouteName: 'intro'
	}
);

class HomeSwitchNavigatorWrapper extends React.Component {
	static router = HomeSwitchNavigator.router;

	render() {
		return (
			<HomeSwitchNavigator navigation={this.props.navigation}
				screenProps={{
					params: this.props.navigation.state.params,
					rootNavigation: this.props.navigation
				}}
			/>
		);
	}
}

const MainBottomTabNavigator = createBottomTabNavigator(
	{
		home: HomeSwitchNavigatorWrapper,
		likes: Likes,
		chats: Chats,
		profile: ProfileScreen
	},
	{
		navigationOptions: ({ navigation }) => ({
			// title: `${navigation.state.params.name}'s Profile!`,
			title: 'Title',
			tabBarLabel: navigation.state.routeName,

			tabBarIcon: ({ tintColor, focused }) => {

				// console.log('navigation: ', navigation);

				// let iconName;

				if (navigation.state.routeName === 'home') {

					return <Ionicons
						// name={focused ? 'compass' : 'compass-outline'}
						name={'md-compass'}
						size={30}
						style={{ color: tintColor }}
					/>;

				} else if (navigation.state.routeName === 'likes') {

					return <Ionicons
						// name={focused ? 'ios-heart' : 'ios-heart-empty'}
						name={'ios-heart'}
						size={30}
						style={{ color: tintColor }}
					/>;

				} else if (navigation.state.routeName === 'chats') {

					return <Ionicons
						// name={focused ? 'ios-chatbubbles' : 'ios-chatbubbles-outline'}
						name={'ios-chatbubbles'}
						size={30}
						style={{ color: tintColor }}
					/>;

				} else if (navigation.state.routeName === 'profile') {

					return <FontAwesome
						name={'user'}
						size={30}
						style={{ color: tintColor }}
					/>;
				}

			},

			// tabBarVisible: navigation.state.routeName === 'home' &&
		}),

		tabBarOptions: { // ToDo: style (bar), labelStyle (label), tabStyle (tab)
			style: {
				backgroundColor: 'rgb(40, 40, 40)',
				borderTopWidth: 1,
				borderTopColor: 'rgb(61, 61, 61)',
				paddingTop: Platform.OS === "ios" ? 10 : 0
			},
			animationEnabled: true,
			showLabel: false,
			showIcon: true,
			// tintColor: 'red',
			// activeTintColor: 'rgb(234, 68, 90)',
			activeTintColor: 'rgb(255, 255, 255)',
			inactiveTintColor: 'rgb(144, 144, 144)',
			tabStyle: {
				// paddingVertical: 10
			}
		},
	}
);

class MainBottomTabNavigatorWrapper extends React.Component {
	static router = MainBottomTabNavigator.router;

	render() {
		return (
			<MainBottomTabNavigator navigation={this.props.navigation}
				screenProps={{
					params: this.props.navigation.state.params,
					rootNavigation: this.props.navigation
				}}
			/>
		);
	}
}

const AuthStackNavigator = createStackNavigator(
	{
		authMain: {
			screen: AuthMain
		},

		email: {
			screen: SignUpWithEmail
		},

		mobile: {
			screen: SignUpWithMobile
		}
	},
	{
		mode: 'card',
		headerMode: 'none',
		navigationOptions: {
			gesturesEnabled: false,
		},
		transitionConfig: () => ({
			screenInterpolator: StackViewStyleInterpolator.forHorizontal
		})
	}
);

class AuthStackNavigatorWrapper extends React.Component {
	static router = AuthStackNavigator.router;

	render() {
		return (
			<AuthStackNavigator navigation={this.props.navigation}
				screenProps={{
					params: this.props.navigation.state.params,
					rootNavigation: this.props.navigation
				}}
			/>
		);
	}
}

const MainSwitchNavigator = createSwitchNavigator(
	{
		loading: { screen: Loading },

		welcome: { screen: Welcome },

		authStackNavigator: { screen: AuthStackNavigatorWrapper }, // stack navigator

		// welcome & guile

		mainBottomTabNavigator: { screen: MainBottomTabNavigatorWrapper } // tab navigator
	},
	{
		initialRouteName: 'loading'
	}
);
