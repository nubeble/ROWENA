import React from 'react';
import { StyleSheet, Platform, StatusBar, Keyboard, Dimensions, YellowBox } from 'react-native';
// import ModalHost from 'expo/src/modal/ModalHost';
import { StyleProvider } from "native-base";
import getTheme from "./src/rnff/native-base-theme/components";
import variables from "./src/rnff/native-base-theme/variables/commonColor";
import _ from 'lodash';
import { configure } from 'mobx';
import { Provider } from "mobx-react/native";
import { FeedStore, Theme } from './src/rnff/src/components';
import { ProfileStore } from "./src/rnff/src/home";

configure({ enforceActions: 'observed' })

// $FlowFixMe
/*
// https://github.com/firebase/firebase-js-sdk/issues/97
if (!console.ignoredYellowBox) {
    console.ignoredYellowBox = [];
}
console.ignoredYellowBox.push("Setting a timer");
*/
YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
    if (message.indexOf('Setting a timer') <= -1) {
        _console.warn(message);
    }
};

export default class App extends React.Component {
    feedStore = new FeedStore();
    profileStore = new ProfileStore();
    // userFeedStore = new FeedStore();

    state = {
    };

    componentDidMount() {
        console.log('App::componentDidMount');

        StatusBar.setBarStyle('light-content');
        if (Platform.OS === "android") { // ToDo: remove
            StatusBar.setBackgroundColor(Theme.color.background);
        }
    }

    render() {
        // const { feedStore, profileStore, userFeedStore } = this;
        const { feedStore, profileStore } = this;

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

                <StyleProvider style={getTheme(variables)}>
                    {/*
                    <Provider {...{ feedStore, profileStore, userFeedStore }}>
                        <MainSwitchNavigator onNavigationStateChange={() => undefined} />
                    </Provider>
                    */}
                    <Provider {...{ feedStore, profileStore }}>
                        <MainSwitchNavigator />
                    </Provider>
                </StyleProvider>
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
import ChatMain from './src/ChatMain';
import ChatRoom from './src/ChatRoom';
import PostScreen from './src/PostScreen';
import Likes from './src/Likes';
import ProfileScreen from './src/Profile';
import Intro from './src/Intro';
import SearchScreen from './src/SearchScreen';
import ExploreScreen from './src/Explore';
import Detail from './src/Detail';
import MapScreen from './src/MapScreen';
import WriteReviewScreen from './src/WriteReviewScreen';
import ReadAllReviewScreen from './src/ReadAllReviewScreen';


// --
const ExploreStackNavigator = createStackNavigator(
    {
        exploreMain: {
            screen: ExploreScreen
        },
        exploreSearchModal: {
            screen: SearchScreen
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

class ExploreStackNavigatorWrapper extends React.Component {
    static router = ExploreStackNavigator.router;

    render() {
        return (
            <ExploreStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// --

const HomeStackNavigator = createStackNavigator(
    {
        home: {
            // screen: ExploreScreen
            screen: ExploreStackNavigatorWrapper
        },
        detail: {
            screen: Detail
        },
        map: {
            screen: MapScreen
        },
        readReview: {
            screen: ReadAllReviewScreen
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

// --
const IntroStackNavigator = createStackNavigator(
    {
        introMain: {
            screen: Intro
        },
        introSearchModal: {
            screen: SearchScreen
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

class IntroStackNavigatorWrapper extends React.Component {
    static router = IntroStackNavigator.router;

    render() {
        return (
            <IntroStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// --

const HomeSwitchNavigator = createSwitchNavigator(
    {
        // intro: { screen: Intro },
        intro: { screen: IntroStackNavigatorWrapper },
        homeStackNavigator: { screen: HomeStackNavigatorWrapper }
    },
    {
        // initialRouteName: 'intro'
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
    // console.log('navigation.state.routes', navigation.state.routes);
    /*
	console.log('router', navigation.router);
	console.log('state', navigation.state);
	*/

    if (Platform.OS === "ios") return;

    const introStack = navigation.state.routes[0];
    const homeStack = navigation.state.routes[1];
    const exploreStack = homeStack.routes[0];


    if (
        introStack.routes[1] && introStack.routes[1].routeName === 'introSearchModal' ||
        exploreStack.routes[1] && exploreStack.routes[1].routeName === 'exploreSearchModal' ||
        homeStack.routes[homeStack.routes.length - 1].routeName === 'map' ||
        homeStack.routes[homeStack.routes.length - 1].routeName === 'writeReview') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};

/*
const ChatStackNavigator = createStackNavigator(
    {
        chat: {
            screen: ChatMain
        },
        room: {
            screen: ChatRoom
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

class ChatStackNavigatorWrapper extends React.Component {
    static router = ChatStackNavigator.router;

    render() {
        return (
            <ChatStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

ChatStackNavigatorWrapper.navigationOptions = ({ navigation }) => {
    // console.log('navigation.state.routes', navigation.state.routes);

    if (navigation.state.routes[1] && navigation.state.routes[1].routeName === 'room') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};
*/

// ====

const ChatStackNavigator = createStackNavigator(
    {
        chatMain: {
            screen: ChatMain
        },
        room: {
            screen: ChatRoom
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

class ChatStackNavigatorWrapper extends React.Component {
    static router = ChatStackNavigator.router;

    render() {
        return (
            <ChatStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

// --
const PostModalNavigator = createStackNavigator(
    {
        postModal: {
            screen: PostScreen
        },
        mapModal: {
            screen: MapScreen
        },
        readReviewModal: {
            screen: ReadAllReviewScreen
        },
        writeReviewModal: {
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

class PostModalNavigatorWrapper extends React.Component {
    static router = PostModalNavigator.router;

    render() {
        return (
            <PostModalNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// --

const ChatRootStackNavigator = createStackNavigator(
    {
        chatStack: { screen: ChatStackNavigatorWrapper },
        // post: { screen: PostScreen }
        post: { screen: PostModalNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none'
    }
);

class ChatRootStackNavigatorWrapper extends React.Component {
    static router = ChatRootStackNavigator.router;

    render() {
        return (
            <ChatRootStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

ChatRootStackNavigatorWrapper.navigationOptions = ({ navigation }) => {
    // console.log('navigation.state.routes', navigation.state.routes);

    if (Platform.OS === "ios") return;

    const chatStack = navigation.state.routes[0];
    // chatStack.isTransitioning

    const room = chatStack.routes[1];
    if (room && room.routeName === 'room') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};

// ====

var _tabBarOptions = { // style (bar), labelStyle (label), tabStyle (tab)
    style: {
        backgroundColor: Theme.color.background,
        borderTopWidth: 1,
        borderTopColor: Theme.color.line,
        paddingTop: Platform.OS === "ios" ? parseInt(Dimensions.get('window').height / 80) : 0
    },
    animationEnabled: true,
    showLabel: false,
    showIcon: true,
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
        chat: {
            // screen: ChatStackNavigatorWrapper,
            screen: ChatRootStackNavigatorWrapper,
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
                // } else if (navigation.state.routeName === 'chats') {
            } else if (navigation.state.routeName === 'chat') {
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
        // initialRouteName: 'loading'
    }
);
