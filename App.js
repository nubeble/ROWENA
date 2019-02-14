import React from 'react';
import { StyleSheet, Platform, StatusBar, Keyboard, Dimensions, YellowBox, Alert } from 'react-native';
// import ModalHost from 'expo/src/modal/ModalHost';
import { StyleProvider } from "native-base";
import getTheme from "./src/rnff/native-base-theme/components";
import variables from "./src/rnff/native-base-theme/variables/commonColor";
import _ from 'lodash';
import { configure } from 'mobx';
import { Provider } from "mobx-react/native";
import { FeedStore, Theme } from './src/rnff/src/components';
import { ProfileStore } from "./src/rnff/src/home";
import autobind from "autobind-decorator";
import { Notifications } from 'expo';
import Firebase from './src/Firebase';


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
        console.log('App.componentDidMount');

        StatusBar.setBarStyle('light-content');
        if (Platform.OS === "android") {
            StatusBar.setBackgroundColor(Theme.color.background);
        }

        // Handle notifications that are received or selected while the app
        // is open. If the app was closed and then opened by tapping the
        // notification (rather than just tapping the app icon to open it),
        // this function will fire on the next tick after the app starts
        // with the notification data.
        this.notificationListener = Notifications.addListener(this.handleNotification);

        // test
        // console.log('props.exp.notification', this.props.exp.notification);
        if (this.props.exp.notification) {
            console.log('props.exp.notification', this.props.exp.notification);

            Alert.alert(
                'props.exp.notification',
                'check out this.props.exp.notification', // ToDo: this.props.exp.notification
                [
                    {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                    },
                    {
                        text: 'OK',
                        onPress: () => console.log('OK Pressed')
                    },
                ],
                { cancelable: false },
            );
        }
    }

    @autobind
    async handleNotification(e) {
        console.log('handleNotification', e);
        /*
        handleNotification Object {
        "actionId": null,
        "data": Object {
            "message": "11111111",
            "receiver": "hNMPG5TvU4OL5NKXjrTTFNmHJMC3",
            "sender": "FtYRoxLKoNWym2WvQE9GB7fYi1B3",
        },
        "origin": "received" | "selected",
        "remote": true,
        "userText": null,
        }
        */

        Alert.alert(
            // 'Alert Title',
            e.data.type,
            e.data.userData.message,
            [
                // { text: 'Ask me later', onPress: () => console.log('Ask me later pressed') },
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => console.log('OK Pressed')
                },
            ],
            { cancelable: false },
        );

        const origin = e.origin;
        const data = e.data;

        if (origin === 'received') { // android
            if (data) {
                switch (Number(data.type)) {
                    case Globals.pushNotification.chat: {
                        const message = data.userData.message;
                        const chatRoomId = data.userData.chatRoomId;

                        // ToDo: red mark on chat icon


                    } break;

                    case Globals.pushNotification.review: {
                    } break;

                    case Globals.pushNotification.reply: {
                    } break;
                }
            }
        } else if (origin === 'selected') {
            if (data) {
                switch (Number(data.type)) {
                    case Globals.pushNotification.chat: {
                        const message = data.userData.message;

                        const chatRoomId = data.userData.chatRoomId;

                        const room = await Firebase.findChatRoomById(Firebase.user().uid, chatRoomId);
                        if (room) NavigationService.navigate("chatRoom", { item: room });
                    } break;

                    case Globals.pushNotification.review: {
                        const message = data.userData.message;

                        // move to detail
                        const placeId = data.userData.placeId;
                        const feedId = data.userData.feedId;
                        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
                        const post = feedDoc.data();

                        NavigationService.navigate("postPreview", { post: post, from: 'Profile' });

                    } break;

                    case Globals.pushNotification.reply: {
                        const message = data.userData.message;

                        // move to detail
                        const placeId = data.userData.placeId;
                        const feedId = data.userData.feedId;
                        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
                        const post = feedDoc.data();

                        NavigationService.navigate("postPreview", { post: post, from: 'Profile' });

                    } break;
                }
            }
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
                        {/*
                        <MainSwitchNavigator />
                        */}
                        <MainSwitchNavigator
                            ref={navigatorRef => {
                                NavigationService.setTopLevelNavigator(navigatorRef);
                            }}
                        />
                    </Provider>
                </StyleProvider>
            </React.Fragment>
        );
    }
}


import createAppContainer, { createSwitchNavigator, createStackNavigator, createBottomTabNavigator } from "react-navigation";
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { BottomTabBar } from 'react-navigation-tabs';
// import { TabBarBottom } from 'react-navigation'; // not working in S7
import NavigationService from './src/NavigationService';
import Loading from './src/Loading';
import Welcome from './src/Welcome';
import AuthMain from './src/AuthMain';
import SignUpWithEmail from './src/SignUpWithEmail';
import SignUpWithMobile from './src/SignUpWithMobile';
import ChatMain from './src/ChatMain';
import ChatRoom from './src/ChatRoom';
import PostScreen from './src/PostScreen';
import UserMain from './src/UserMain';
import Likes from './src/Likes';
import ProfileMain from './src/ProfileMain';
import Intro from './src/Intro';
import SearchScreen from './src/SearchScreen';
import ExploreScreen from './src/Explore';
import Detail from './src/Detail';
import MapScreen from './src/MapScreen';
import WriteReviewScreen from './src/WriteReviewScreen';
import ReadAllReviewScreen from './src/ReadAllReviewScreen';
import { Globals } from './src/Globals';


// -- start of AuthStackNavigator
const AuthStackNavigator = createStackNavigator(
    {
        authMain: { screen: AuthMain },

        email: { screen: SignUpWithEmail },

        mobile: { screen: SignUpWithMobile }
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
// -- end of AuthStackNavigator

// -- start of ExploreStackNavigator
const ExploreStackNavigator = createStackNavigator(
    {
        exploreMain: { screen: ExploreScreen },
        exploreSearchModal: { screen: SearchScreen }
    },
    {
        mode: 'modal',
        headerMode: 'none'
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
// -- end of ExploreStackNavigator

// -- start of IntroStackNavigator
const IntroStackNavigator = createStackNavigator(
    {
        introMain: { screen: Intro },
        introSearchModal: { screen: SearchScreen }
    },
    {
        mode: 'modal',
        headerMode: 'none'
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
// -- end of IntroStackNavigator

// -- start of HomeStackNavigator
const HomeStackNavigator = createStackNavigator(
    {
        home: { screen: ExploreStackNavigatorWrapper },
        detail: { screen: Detail },
        readReview: { screen: ReadAllReviewScreen }
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
// -- end of HomeStackNavigator

// -- start of HomeSwitchNavigator
const HomeSwitchNavigator = createSwitchNavigator(
    {
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
// -- end of HomeSwitchNavigator


// -- chat
/*
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

ChatStackNavigatorWrapper.navigationOptions = ({ navigation }) => {
    const room = navigation.state.routes[1];
    // room.isTransitioning

    if (room && room.routeName === 'room') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};
*/


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

const UserModalNavigator = createStackNavigator(
    {
        userMain: {
            screen: UserMain
        },
        /*
        mapModal: {
            screen: MapScreen
        },
        readReviewModal: {
            screen: ReadAllReviewScreen
        },
        writeReviewModal: {
            screen: WriteReviewScreen
        }
        */
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

class UserModalNavigatorWrapper extends React.Component {
    static router = UserModalNavigator.router;

    render() {
        return (
            <UserModalNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- chat

// -- start of ChatRoomStackNavigator
const ChatRoomStackNavigator = createStackNavigator(
    {
        room: { screen: ChatRoom },
        post: { screen: PostModalNavigatorWrapper },
        user: { screen: UserModalNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none'
    }
);

class ChatRoomStackNavigatorWrapper extends React.Component {
    static router = ChatRoomStackNavigator.router;

    render() {
        return (
            <ChatRoomStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of ChatRoomStackNavigator

// -- start of MainBottomTabNavigator
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

    //    tabStyle: {
    //        paddingVertical: 10
    //    }

};

// -- start of ProfileModalNavigator
const ProfileModalNavigator = createStackNavigator(
    {
        profileMain: { screen: ProfileMain },
        postPreview: { screen: PostModalNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none'
    }
);

class ProfileModalNavigatorWrapper extends React.Component {
    static router = ProfileModalNavigator.router;

    render() {
        return (
            <ProfileModalNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

ProfileModalNavigatorWrapper.navigationOptions = ({ navigation }) => {
    const post = navigation.state.routes[1];
    // post.isTransitioning

    if (post && post.routeName === 'postPreview') {
        return {
            tabBarVisible: false
        };
    }

    return {
        tabBarVisible: true
    };
};
// -- end of ProfileModalNavigator

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
            screen: ChatMain,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        },
        profile: {
            screen: ProfileModalNavigatorWrapper,
            navigationOptions: ({ navigation }) => (_navigationOptions(navigation))
        }
    },

    //    {
    //        tabBarOptions: _tabBarOptions
    //    }

    (Platform.OS === "android") ? {
        tabBarOptions: _tabBarOptions,

        tabBarComponent: props => <TabBarComponent {...props} />,
        // tabBarPosition: 'bottom'
    } : {
            tabBarOptions: _tabBarOptions
        }
);

function _navigationOptions(navigation) {
    return {
        // title: `${navigation.state.params.name}'s Profile!`,
        title: 'title',
        tabBarLabel: navigation.state.routeName,
        tabBarIcon: ({ tintColor, focused }) => {
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
        visible: true,
        // focused: false
    };

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();
    }

    @autobind
    _keyboardDidShow(e) {
        console.log('TabBarComponent.keyboardDidShow');

        this.setState({ visible: false });
    }

    @autobind
    _keyboardDidHide(e) {
        console.log('TabBarComponent.keyboardDidHide');

        this.setState({ visible: true });
    }

    @autobind
    onFocus() {
        console.log('TabBarComponent.onFocus');

        // this.setState({ focused: true });
        this.focused = true;
    }

    @autobind
    onBlur() {
        console.log('TabBarComponent.onBlur');

        // this.setState({ focused: false });
        this.focused = false;
    }

    render() {
        // return this.state.focused && this.state.visible ? <BottomTabBar {...this.props} /> : null;
        // return this.state.focused && this.state.visible ? <TabBarBottom {...this.props} /> : null; // not working in S7


        // if (!this.state.focused) {
        if (!this.focused) {
            return <BottomTabBar {...this.props} />;
        }

        if (this.state.visible) {
            return <BottomTabBar {...this.props} />;
        }

        return null;
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
// -- end of MainBottomTabNavigator

// -- start of MainStackNavigator
const MainStackNavigator = createStackNavigator(
    {
        root: { screen: MainBottomTabNavigatorWrapper },
        map: { screen: MapScreen },
        writeReview: { screen: WriteReviewScreen },
        chatRoom: { screen: ChatRoomStackNavigatorWrapper }
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

class MainStackNavigatorWrapper extends React.Component {
    static router = MainStackNavigator.router;

    render() {
        return (
            <MainStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of MainStackNavigator

const MainSwitchNavigator = createSwitchNavigator(
    {
        loading: { screen: Loading },
        welcome: { screen: Welcome }, // Consider: welcome & guile
        authStackNavigator: { screen: AuthStackNavigatorWrapper },
        mainStackNavigator: { screen: MainStackNavigatorWrapper }
    },
    {
        // initialRouteName: 'loading'
    }
);

// const AppContainer = createAppContainer(MainSwitchNavigator);
