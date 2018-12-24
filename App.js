import React from 'react';
import { StyleSheet, Platform, StatusBar, Keyboard } from 'react-native';
// import ModalHost from 'expo/src/modal/ModalHost';
// import { ThemeProvider, Colors } from './src/rne/src/components';
import { configure } from 'mobx';
import { Provider } from "mobx-react/native";
import { FeedStore, Theme } from './src/rnff/src/components';
import { ProfileStore } from "./src/rnff/src/home";

configure({ enforceActions: 'observed' })

// $FlowFixMe
// https://github.com/firebase/firebase-js-sdk/issues/97
if (!console.ignoredYellowBox) {
    console.ignoredYellowBox = [];
}
console.ignoredYellowBox.push("Setting a timer");


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
    };

    componentDidMount() {
        console.log('App::componentDidMount');

        StatusBar.setBarStyle('light-content');
        if (Platform.OS === "android") { // ToDo: remove
            // StatusBar.setBackgroundColor("black");
            StatusBar.setBackgroundColor(Theme.color.background);
        }

        // ThemeProvider.getInstance().switchColors(Colors['Main']); // ToDo
    }

    render() {
        const { feedStore, profileStore, userFeedStore } = this;

        const statusBar = (
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
        );

        return (
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

                {/*
				<ThemeProvider>
					<Provider {...{ feedStore, profileStore, userFeedStore }}>
						<MainSwitchNavigator />
					</Provider>
				</ThemeProvider>
				*/}

                <Provider {...{ feedStore, profileStore, userFeedStore }}>
                    <MainSwitchNavigator />
                </Provider>
            </React.Fragment>
        );
    }
}


import { createSwitchNavigator, createStackNavigator, createBottomTabNavigator } from "react-navigation";
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import autobind from "autobind-decorator";
import { BottomTabBar } from 'react-navigation-tabs';

import Loading from './src/Loading';
import Welcome from './src/Welcome';
import AuthMain from './src/AuthMain';
import SignUpWithEmail from './src/SignUpWithEmail';
import SignUpWithMobile from './src/SignUpWithMobile';
import Chats from './src/Chats';
import Likes from './src/Likes';
import ProfileScreen from './src/Profile';
import Intro from './src/Intro';
import ExploreScreen from './src/Explore';
import Detail from './src/Detail';
import MapScreen from './src/MapScreen';
import WriteReviewScreen from './src/WriteReviewScreen';
import ReadReviewScreen from './src/ReadReviewScreen';


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
        },
        readReview: {
            screen: ReadReviewScreen
        },
        writeReview: {
            screen: WriteReviewScreen
        }
    },
    {
        mode: 'card',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
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

HomeSwitchNavigatorWrapper.navigationOptions = ({ navigation }) => {
	/*
	console.log('router', navigation.router);
	console.log('state', navigation.state);
	console.log('homeStackNavigator index', navigation.state.routes[1].index);
	console.log('homeStackNavigator index', navigation.state.routes[1].routes.length);
	*/

    // if (!navigation.state.routes[1].isTransitioning &&
    if (
        navigation.state.routes[1].routes[navigation.state.routes[1].routes.length - 1].routeName === 'map' ||
        navigation.state.routes[1].routes[navigation.state.routes[1].routes.length - 1].routeName === 'writeReview') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};

var _tabBarOptions = { // style (bar), labelStyle (label), tabStyle (tab)
    style: {
        backgroundColor: Theme.color.background,
        borderTopWidth: 1,
        borderTopColor: Theme.color.line,
        // paddingTop: Platform.OS === "ios" ? 10 : 0
        // alignItems: 'center'
        // alignItems: 'stretch'
    },
    animationEnabled: true,
    showLabel: false,
    showIcon: true,
    // tintColor: 'red',
    activeTintColor: 'rgb(255, 255, 255)',
    inactiveTintColor: 'rgb(145, 145, 145)',
    tabStyle: {
        // paddingVertical: 10
    }
};

const MainBottomTabNavigator = createBottomTabNavigator(
    {
        home: {
            screen: HomeSwitchNavigatorWrapper,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        },
        likes: {
            screen: Likes,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        },
        chats: {
            screen: Chats,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        },
        profile: {
            screen: ProfileScreen,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        }
    },

    (Platform.OS === "android")
        ?
        {
            tabBarComponent: props => <TabBarComponent {...props} />,
            tabBarPosition: 'bottom',

            tabBarOptions: _tabBarOptions
        }
        :
        {
            tabBarOptions: _tabBarOptions
        }
);

function _navigationOptions(navigation) {
    return {
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
        }
    };
}

class TabBarComponent extends React.Component {
    state = {
        visible: true
    }

    componentDidMount() {
        if (Platform.OS === 'android') {
            this.keyboardEventListeners = [
                Keyboard.addListener('keyboardDidShow', this.visible(false)),
                Keyboard.addListener('keyboardDidHide', this.visible(true))
            ];
        }
    }

    componentWillUnmount() {
        this.keyboardEventListeners && this.keyboardEventListeners.forEach((eventListener) => eventListener.remove());
    }

    visible = visible => () => this.setState({ visible });

    render() {
        if (!this.state.visible) {
            return null;
        } else {
            return (
                <BottomTabBar {...this.props} />
            );
        }
    }
}

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
            gesturesEnabled: false
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

        // ToDo: welcome & guile

        mainBottomTabNavigator: { screen: MainBottomTabNavigatorWrapper } // tab navigator
    },
    {
        initialRouteName: 'loading'
    }
);
