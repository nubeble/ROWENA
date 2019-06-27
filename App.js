import React from 'react';
import { StyleSheet, Platform, StatusBar, Keyboard, Dimensions, YellowBox, Alert, NetInfo } from 'react-native';
import { StyleProvider } from "native-base";
import getTheme from "./src/rnff/native-base-theme/components";
import variables from "./src/rnff/native-base-theme/variables/commonColor";
import _ from 'lodash';
import { configure } from 'mobx';
import { Provider } from "mobx-react/native";
import { FeedStore, Theme, Text } from './src/rnff/src/components';
import { ProfileStore } from "./src/rnff/src/home";
import autobind from "autobind-decorator";
import { Notifications } from 'expo';
import Constants from 'expo-constants';
import Firebase from './src/Firebase';
import { Cons, Vars } from './src/Globals';

// disable mobx strict mode
// configure({ enforceActions: 'observed' })

// $FlowFixMe
/*
// https://github.com/firebase/firebase-js-sdk/issues/97
if (!console.ignoredYellowBox) {
    console.ignoredYellowBox = [];
}
console.ignoredYellowBox.push("Setting a timer");
*/
/*
YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
    if (message.indexOf('Setting a timer') <= -1) {
        _console.warn(message);
    }
};
*/
YellowBox.ignoreWarnings([
    'Warning:',
    'Setting a timer for a long period of time',
    'Require cycle'
]);


export default class App extends React.Component {
    feedStore = new FeedStore();
    profileStore = new ProfileStore();
    // userFeedStore = new FeedStore();

    state = {
        connectionState: 0, // 0: none, 1: connected, 2: disconnected

        showBadgeOnHome: false,
        badgeOnHomeCount: -1,

        showBadgeOnLikes: false,
        badgeOnLikesCount: -1,

        showBadgeOnChat: false,
        badgeOnChatCount: -1,

        showBadgeOnProfile: false,
        badgeOnProfileCount: -1
    };

    componentDidMount() {
        console.log('App.componentDidMount');
        console.log('width', Dimensions.get('window').width);
        console.log('height', Dimensions.get('window').height);

        /*
        StatusBar.setBarStyle('light-content');
        if (Platform.OS === "android") {
            StatusBar.setBackgroundColor(Theme.color.background);
        }
        */

        // StatusBar.setHidden(true);

        this.networkListener = NetInfo.addEventListener('connectionChange', this.handleConnectionChange);

        // Handle notifications that are received or selected while the app
        // is open. If the app was closed and then opened by tapping the
        // notification (rather than just tapping the app icon to open it),
        // this function will fire on the next tick after the app starts
        // with the notification data.
        this.notificationListener = Notifications.addListener(this.handleNotification);

        // ToDo: test this.props.exp.notification
        // console.log('props.exp.notification', this.props.exp.notification);
        if (this.props.exp.notification) {
            console.log('props.exp.notification', this.props.exp.notification);

            Alert.alert(
                'props.exp.notification',
                this.props.exp.notification,
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
        }

        // check the releaseChannel
        const channel = this.getApiUrl(Constants.manifest.releaseChannel);
        console.log('channel', channel);
    }

    componentWillUnmount() {
        this.networkListener.remove();
        this.notificationListener.remove();
    }

    @autobind
    handleConnectionChange(connectionInfo) {
        if (connectionInfo.type === 'none') { // disconnected
            this.setState({ connectionState: 1 });

            Alert.alert(
                'Network connection',
                'You are currently offline.',
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
        } else if (connectionInfo.type === 'unknown') { // error case
            this.setState({ connectionState: 1 });

            Alert.alert(
                'Network connection',
                'An unkown network error has occurred.',
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
        } else { // connected / reconnected
            const preState = this.state.connectionState;

            if (preState === 1) { // reconnected
                Alert.alert(
                    'Network connection',
                    'You are connected again.',
                    [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                    { cancelable: false }
                );
            }

            this.setState({ connectionState: 2 });
        }
    }

    getApiUrl(releaseChannel) {
        if (releaseChannel === undefined) { // since releaseChannels are undefined in dev, return your default.
            // return App.apiUrl.dev;
            return "dev";
        }

        if (releaseChannel.indexOf('prod') !== -1) { // this would pick up prod-v1, prod-v2, prod-v3
            // return App.apiUrl.prod;
            return releaseChannel.substring(releaseChannel.lastIndexOf('prod') + 1);
        }

        if (releaseChannel.indexOf('staging') !== -1) { // return staging environment variables
            // return App.apiUrl.staging;
            return releaseChannel.substring(releaseChannel.lastIndexOf('staging') + 1);
        }

        return null;
    }

    @autobind
    async handleNotification(e) {
        console.log('App.handleNotification', e);
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

        /*
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
        */

        const origin = e.origin;
        const data = e.data;

        if (origin === 'received') { // android
            if (data) {
                switch (Number(data.type)) {
                    case Cons.pushNotification.chat: {
                        if (Vars.focusedScreen !== 'ChatMain') {
                            // show badge
                            // this.setState({ badgeOnChatCount: this.state.badgeOnChatCount + 1, showBadgeOnChat: true });
                            this.setState({ showBadgeOnChat: true, badgeOnChatCount: 0 });
                        }
                    } break;

                    case Cons.pushNotification.review: {
                        if (Vars.focusedScreen !== 'ProfileMain') {
                            // show badge
                            this.setState({ showBadgeOnProfile: true, badgeOnProfileCount: 0 });
                        }
                    } break;

                    case Cons.pushNotification.reply: {
                        if (Vars.focusedScreen !== 'ProfileMain') {
                            // show badge
                            this.setState({ showBadgeOnProfile: true, badgeOnProfileCount: 0 });
                        }
                    } break;

                    case Cons.pushNotification.comment: {
                        if (Vars.focusedScreen !== 'ProfileMain') {
                            // show badge
                            this.setState({ showBadgeOnProfile: true, badgeOnProfileCount: 0 });
                        }
                    } break;
                }
            }
        } else if (origin === 'selected') {
            if (data) {
                switch (Number(data.type)) {
                    case Cons.pushNotification.chat: {
                        // hide badge
                        this.setState({ showBadgeOnChat: false, badgeOnChatCount: -1 });

                        const message = data.userData.message;
                        const chatRoomId = data.userData.chatRoomId;

                        this.moveToChatRoom(chatRoomId);
                    } break;

                    case Cons.pushNotification.review: {
                        // hide badge
                        this.setState({ showBadgeOnProfile: false, badgeOnProfileCount: -1 });

                        const message = data.userData.message;
                        const placeId = data.userData.placeId;
                        const feedId = data.userData.feedId;

                        // move to post preview
                        this.moveToUserPost(placeId, feedId);
                    } break;

                    case Cons.pushNotification.reply: {
                        // hide badge
                        this.setState({ showBadgeOnProfile: false, badgeOnProfileCount: -1 });

                        const message = data.userData.message;
                        const placeId = data.userData.placeId;
                        const feedId = data.userData.feedId;

                        // move to post preview
                        this.moveToUserPost(placeId, feedId);
                    } break;

                    case Cons.pushNotification.comment: {
                        // hide badge
                        this.setState({ showBadgeOnProfile: false, badgeOnProfileCount: -1 });

                        const message = data.userData.message;

                        // move to check profile
                        this.moveToCheckProfile();
                    } break;
                }
            }
        }
    }

    async moveToChatRoom(chatRoomId) {
        const room = await Firebase.findChatRoomById(Firebase.user().uid, chatRoomId);
        if (room) {
            // NavigationService.navigate("chatRoom", { item: room });

            // title
            let titleImageUri = null;
            let titleName = null;
            let customer = null; // customer's uid (if I'm the owner then I need customer's profile.)

            if (room.users[0].uid === room.owner) {
                titleImageUri = room.users[0].picture;
                titleName = room.users[0].name;
                customer = room.users[1].uid;
            } else { // if (room.users[1].uid === room.owner) {
                titleImageUri = room.users[1].picture;
                titleName = room.users[1].name;
            }

            const title = {
                picture: titleImageUri,
                name: titleName
            };

            // feed
            const post = await Firebase.getPost(room.feedId);

            // feed count
            const feedSize = await Firebase.getFeedSize(room.placeId);

            // customer profile
            let customerProfile = null;
            if (customer) customerProfile = await Firebase.getProfile(customer);

            const params = {
                id: room.id,
                placeId: room.placeId,
                feedId: room.feedId,
                users: room.users,
                owner: room.owner, // owner uid of the post
                showAvatar: room.contents === '' ? true : false,
                lastReadMessageId: room.lastReadMessageId,
                placeName: room.placeName,

                title,
                post,
                feedSize,
                customerProfile
            };

            NavigationService.navigate("chatRoom", { item: params });
        }
    }

    async moveToUserPost(placeId, feedId) {
        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        if (!placeDoc.exists) return;

        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (!feedDoc.exists) return;

        const extra = {
            feedSize: placeDoc.data().count
        };

        const post = feedDoc.data();

        Firebase.addVisits(Firebase.user().uid, placeId, feedId);
        NavigationService.navigate("postPreview", { post: post, extra: extra, from: 'Profile' });
    }

    moveToCheckProfile() {
        Firebase.updateCommentChecked(Firebase.user().uid, false);
        NavigationService.navigate("edit");
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
                        <MainSwitchNavigator onNavigationStateChange={() => undefined}/>
                    </Provider>
                    */}
                    <Provider {...{ feedStore, profileStore }}>
                        <AppContainer
                            ref={navigatorRef => {
                                NavigationService.setTopLevelNavigator(navigatorRef);
                            }}
                            screenProps={{
                                showBadgeOnHome: this.state.showBadgeOnHome,
                                badgeOnHomeCount: this.state.badgeOnHomeCount,

                                showBadgeOnLikes: this.state.showBadgeOnLikes,
                                badgeOnLikesCount: this.state.badgeOnLikesCount,

                                showBadgeOnChat: this.state.showBadgeOnChat,
                                badgeOnChatCount: this.state.badgeOnChatCount,

                                showBadgeOnProfile: this.state.showBadgeOnProfile,
                                badgeOnProfileCount: this.state.badgeOnProfileCount,

                                changeBadgeOnHome: this.changeBadgeOnHome,
                                changeBadgeOnLikes: this.changeBadgeOnLikes,
                                changeBadgeOnChat: this.changeBadgeOnChat,
                                changeBadgeOnProfile: this.changeBadgeOnProfile
                            }}
                        />
                    </Provider>
                </StyleProvider>
            </React.Fragment>
        );
    }

    @autobind
    changeBadgeOnHome(show, count) {
        this.setState({ showBadgeOnHome: show, badgeOnHomeCount: count });
    }

    @autobind
    changeBadgeOnLikes(show, count) {
        this.setState({ showBadgeOnLikes: show, badgeOnLikesCount: count });
    }

    @autobind
    changeBadgeOnChat(show, count) {
        this.setState({ showBadgeOnChat: show, badgeOnChatCount: count });
    }

    @autobind
    changeBadgeOnProfile(show, count) {
        this.setState({ showBadgeOnProfile: show, badgeOnProfileCount: count });
    }
}



import { createSwitchNavigator, createStackNavigator, createBottomTabNavigator, createAppContainer } from "react-navigation";
// import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';
import StackViewStyleInterpolator from 'react-navigation-stack/src/views/StackView/StackViewStyleInterpolator';
import { BottomTabBar } from 'react-navigation-tabs';
// import { TabBarBottom } from 'react-navigation'; // not working in S7
import IconWithBadge from './src/IconWithBadge';
import NavigationService from './src/NavigationService';
import Loading from './src/Loading';
import Welcome from './src/Welcome';
import AuthMain from './src/AuthMain';
import SignUpWithEmail from './src/SignUpWithEmail';
import SignUpWithMobileName from './src/SignUpWithMobileName';
import SignUpWithMobileMain from './src/SignUpWithMobileMain';
// import SignUpWithMobilePassword from './src/SignUpWithMobilePassword';
// import SignUpWithMobileBirthday from './src/SignUpWithMobileBirthday';
import EmailVerificationMain from './src/EmailVerificationMain';
import ResetPasswordMain from './src/ResetPasswordMain';
import ResetPasswordVerification from './src/ResetPasswordVerification';
import ChatMain from './src/ChatMain';
import ChatRoom from './src/ChatRoom';
import UserMain from './src/UserMain';
import LikesMain from './src/LikesMain';
import ProfileMain from './src/ProfileMain';
import Intro from './src/Intro';
import SearchScreen from './src/SearchScreen';
import Explore from './src/Explore';
import Post from './src/Post';
import EditPost from './src/EditPost';
import CheckLikes from './src/CheckLikes';
import MapScreen from './src/MapScreen';
import WriteReviewScreen from './src/WriteReviewScreen';
import ReadAllReviewsScreen from './src/ReadAllReviewsScreen';
import EditMain from './src/EditMain';
import EditProfile from './src/EditProfile';
import ReviewMain from './src/ReviewMain';
import AdvertisementStart from './src/AdvertisementStart';
import AdvertisementMain from './src/AdvertisementMain';
import CountrySelection from './src/CountrySelection';
import AdvertisementFinish from './src/AdvertisementFinish';
import CommentMain from './src/CommentMain';
import MapSearch from './src/MapSearch';
// import MapOverview from './src/MapOverview';
import Admin from './src/Admin';


const EmailResetPasswordStackNavigator = createStackNavigator(
    {
        resetPasswordMain: { screen: ResetPasswordMain },
        resetPasswordVerification: { screen: ResetPasswordVerification }
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

class EmailResetPasswordStackNavigatorWrapper extends React.Component {
    static router = EmailResetPasswordStackNavigator.router;

    render() {
        return (
            <EmailResetPasswordStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

const SignUpWithEmailMainStackNavigator = createStackNavigator(
    {
        emailMain: { screen: SignUpWithEmail },
        emailReset: { screen: EmailResetPasswordStackNavigatorWrapper }
        // resetPasswordVerification: { screen: ResetPasswordVerification }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class SignUpWithEmailMainStackNavigatorWrapper extends React.Component {
    static router = SignUpWithEmailMainStackNavigator.router;

    render() {
        return (
            <SignUpWithEmailMainStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

const SignUpWithEmailStackNavigator = createStackNavigator(
    {
        signUpWithEmailName: { screen: SignUpWithMobileName },
        // signUpWithEmailMain: { screen: SignUpWithEmail },
        signUpWithEmailMain: { screen: SignUpWithEmailMainStackNavigatorWrapper },
        signUpWithEmailVerification: { screen: EmailVerificationMain }
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

class SignUpWithEmailStackNavigatorWrapper extends React.Component {
    static router = SignUpWithEmailStackNavigator.router;

    render() {
        return (
            <SignUpWithEmailStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

const SignUpWithMobileMainStackNavigator = createStackNavigator(
    {
        signUpWithMobileMain: { screen: SignUpWithMobileMain },
        signUpWithMobileCountrySelection: { screen: CountrySelection }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class SignUpWithMobileMainStackNavigatorWrapper extends React.Component {
    static router = SignUpWithMobileMainStackNavigator.router;

    render() {
        return (
            <SignUpWithMobileMainStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

const SignUpWithMobileStackNavigator = createStackNavigator(
    {
        signUpWithMobileName: { screen: SignUpWithMobileName },
        signUpWithMobileMain: { screen: SignUpWithMobileMainStackNavigatorWrapper },
        // signUpWithMobilePassword: { screen: SignUpWithMobilePassword },
        // signUpWithMobileBirthday: { screen: SignUpWithMobileBirthday }
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

class SignUpWithMobileStackNavigatorWrapper extends React.Component {
    static router = SignUpWithMobileStackNavigator.router;

    render() {
        return (
            <SignUpWithMobileStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}

/*
const EmailVerificationStackNavigator = createStackNavigator(
    {
        // intro
        main: { screen: EmailVerificationMain },
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

class EmailVerificationStackNavigatorWrapper extends React.Component {
    static router = EmailVerificationStackNavigator.router;

    render() {
        return (
            <EmailVerificationStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
*/

// -- start of AuthStackNavigatorWrapper
const AuthStackNavigator = createStackNavigator(
    {
        authMain: { screen: AuthMain },
        mobile: { screen: SignUpWithMobileStackNavigatorWrapper },
        email: { screen: SignUpWithEmailStackNavigatorWrapper }
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
// -- end of AuthStackNavigatorWrapper

// -- start of IntroStackNavigatorWrapper
const IntroStackNavigator = createStackNavigator(
    {
        // introHome: { screen: IntroModalNavigatorWrapper },
        introHome: { screen: Intro },
        introPost: { screen: Post },
        // readReview: { screen: ReadAllReviewsScreen }
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
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of IntroStackNavigatorWrapper

// -- start of HomeStackNavigatorWrapper
const HomeStackNavigator = createStackNavigator(
    {
        // home: { screen: ExploreModalNavigatorWrapper },
        home: { screen: Explore },
        detail: { screen: Post },
        // readReview: { screen: ReadAllReviewsScreen }
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
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of HomeStackNavigatorWrapper

// -- start of HomeSwitchNavigatorWrapper
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
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of HomeSwitchNavigatorWrapper

const PostStackNavigator = createStackNavigator(
    {
        postMain: { screen: Post },
        editPost: { screen: EditPost },
        selectCountry: { screen: CountrySelection },
        searchStreet: { screen: SearchScreen }
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

class PostStackNavigatorWrapper extends React.Component {
    static router = PostStackNavigator.router;

    render() {
        return (
            <PostStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}

// -- start of UserStackNavigatorWrapper
const UserStackNavigator = createStackNavigator(
    {
        userMain: {
            screen: UserMain
        },
        /*
        writeComment: {
            screen: WriteComment
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

class UserStackNavigatorWrapper extends React.Component {
    static router = UserStackNavigator.router;

    render() {
        return (
            <UserStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of UserStackNavigatorWrapper

// -- start of ChatRoomStackNavigatorWrapper
const ChatRoomStackNavigator = createStackNavigator(
    {
        room: { screen: ChatRoom },
        post: { screen: PostStackNavigatorWrapper },
        user: { screen: UserStackNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class ChatRoomStackNavigatorWrapper extends React.Component {
    static router = ChatRoomStackNavigator.router;

    render() {
        return (
            <ChatRoomStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of ChatRoomStackNavigatorWrapper

// -- start of EditStackNavigatorWrapper
const EditStackNavigator = createStackNavigator(
    {
        editMain: { screen: EditMain },
        editProfile: { screen: EditProfile },
        editSearch: { screen: SearchScreen }
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

class EditStackNavigatorWrapper extends React.Component {
    static router = EditStackNavigator.router;

    render() {
        return (
            <EditStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of EditStackNavigatorWrapper

// -- start of ReviewStackNavigator
const ReviewStackNavigator = createStackNavigator(
    {
        main: { screen: ReviewMain },
        // test: { screen: HidingHeader },
        // reviewPost: { screen: PostSwitchNavigatorWrapper }
        reviewPost: { screen: PostStackNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class ReviewStackNavigatorWrapper extends React.Component {
    static router = ReviewStackNavigator.router;

    render() {
        return (
            <ReviewStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of ReviewStackNavigatorWrapper

// -- start of AdvertisementStackNavigatorWrapper
const AdvertisementStackNavigator = createStackNavigator(
    {
        advertisementStart: { screen: AdvertisementStart },
        advertisementMain: { screen: AdvertisementMain },
        advertisementSelect: { screen: CountrySelection },
        advertisementSearch: { screen: SearchScreen },
        advertisementFinish: { screen: AdvertisementFinish }
    },
    {
        // initialRouteName: 'advertisementStart',
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

class AdvertisementStackNavigatorWrapper extends React.Component {
    static router = AdvertisementStackNavigator.router;

    render() {
        return (
            <AdvertisementStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of AdvertisementStackNavigatorWrapper

// -- start of CommentStackNavigatorWrapper
const CommentStackNavigator = createStackNavigator(
    {
        main: { screen: CommentMain },
        userPost: { screen: UserStackNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class CommentStackNavigatorWrapper extends React.Component {
    static router = CommentStackNavigator.router;

    render() {
        return (
            <CommentStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of CommentStackNavigatorWrapper

// -- start of MainBottomTabNavigatorWrapper
const _tabBarOptions = { // style (bar), labelStyle (label), tabStyle (tab)
    style: {
        backgroundColor: Theme.color.background,
        borderTopWidth: 1,
        borderTopColor: Theme.color.line,
        // paddingTop: Platform.OS === "ios" ? Math.round(Dimensions.get('window').height / 80) : 0
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

const MainBottomTabNavigator = createBottomTabNavigator(
    {
        home: {
            screen: HomeSwitchNavigatorWrapper,
            navigationOptions: ({ navigation, screenProps }) => (_navigationOptions(navigation, screenProps))
        },
        likes: {
            screen: LikesMain,
            navigationOptions: ({ navigation, screenProps }) => (_navigationOptions(navigation, screenProps))
        },
        chat: {
            screen: ChatMain,
            navigationOptions: ({ navigation, screenProps }) => (_navigationOptions(navigation, screenProps))
        },
        profile: {
            screen: ProfileMain,
            navigationOptions: ({ navigation, screenProps }) => (_navigationOptions(navigation, screenProps))
        }
    },
    (Platform.OS === "android") ?
        {
            tabBarOptions: _tabBarOptions,
            tabBarComponent: props => <TabBarComponent {...props} />,
            // tabBarPosition: 'bottom'
        }
        :
        {
            tabBarOptions: _tabBarOptions
        }
);

let routeName = null;
let timestamp = 0;

function _navigationOptions(navigation, screenProps) {
    // console.log('_navigationOptions, data', screenProps.data);

    return {
        // title: `${navigation.state.params.name}'s Profile!`,
        title: 'title',
        tabBarLabel: navigation.state.routeName,
        tabBarIcon: ({ tintColor, focused }) => {
            const data = screenProps.data;

            if (navigation.state.routeName === 'home') {
                return (
                    <IconWithBadge type={'Ionicons'} name={'md-compass'} size={30} color={tintColor} badgeCount={data.badgeOnHomeCount} animate={data.showBadgeOnHome} />
                );
            } else if (navigation.state.routeName === 'likes') {
                return (
                    <IconWithBadge type={'Ionicons'} name={'ios-heart'} size={30} color={tintColor} badgeCount={data.badgeOnLikesCount} animate={data.showBadgeOnLikes} />
                );
            } else if (navigation.state.routeName === 'chat') {
                return (
                    <IconWithBadge type={'Ionicons'} name={'ios-chatbubbles'} size={30} color={tintColor} badgeCount={data.badgeOnChatCount} animate={data.showBadgeOnChat} />
                );
            } else if (navigation.state.routeName === 'profile') {
                return (
                    <IconWithBadge type={'FontAwesome'} name={'user'} size={30} color={tintColor} badgeCount={data.badgeOnProfileCount} animate={data.showBadgeOnProfile} />
                );
            }
        },
        tabBarOnPress: ({ defaultHandler, navigation }) => {
            const data = screenProps.data;

            if (navigation.state.routeName === 'home') {
                console.log('home');

                const now = Date.now();

                if (routeName === 'home') {
                    const diff = now - timestamp;
                    console.log('diff', diff);

                    if (diff < 500) {
                        // double click
                        if (Vars.focusedScreen === 'Intro') Intro.scrollToTop();
                        if (Vars.focusedScreen === 'Explore') Explore.scrollToTop();
                        if (Vars.focusedScreen === 'Post') Post.scrollToTop();
                    }
                } else {
                    routeName = 'home';
                }

                timestamp = now;

                if (data.showBadgeOnHome) {
                    // hide badge
                    data.changeBadgeOnHome(false, -1);
                }
            } else if (navigation.state.routeName === 'likes') {
                console.log('likes');

                const now = Date.now();

                if (routeName === 'likes') {
                    const diff = now - timestamp;
                    console.log('diff', diff);

                    if (diff < 500) {
                        // double click
                        if (Vars.focusedScreen === 'LikesMain') LikesMain.scrollToTop();
                    }
                } else {
                    routeName = 'likes';
                }

                timestamp = now;

                if (data.showBadgeOnLikes) {
                    // hide badge
                    data.changeBadgeOnLikes(false, -1);
                }
            } else if (navigation.state.routeName === 'chat') {
                console.log('chat');

                const now = Date.now();

                if (routeName === 'chat') {
                    const diff = now - timestamp;
                    console.log('diff', diff);

                    if (diff < 500) {
                        // double click
                        if (Vars.focusedScreen === 'ChatMain') ChatMain.scrollToTop();
                    }
                } else {
                    routeName = 'chat';
                }

                timestamp = now;

                if (data.showBadgeOnChat) {
                    // hide badge
                    data.changeBadgeOnChat(false, -1);
                }
            } else if (navigation.state.routeName === 'profile') {
                console.log('profile');

                const now = Date.now();

                if (routeName === 'profile') {
                    const diff = now - timestamp;
                    console.log('diff', diff);

                    if (diff < 500) {
                        // double click
                        if (Vars.focusedScreen === 'ProfileMain') ProfileMain.scrollToTop();
                    }
                } else {
                    routeName = 'profile';
                }

                timestamp = now;

                if (data.showBadgeOnProfile) {
                    // hide badge
                    data.changeBadgeOnProfile(false, -1);
                }
            }

            defaultHandler();
        }
    };
}

class TabBarComponent extends React.Component {
    state = {
        visible: true,
        focused: false
    };

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
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
        // console.log('TabBarComponent.keyboardDidShow');

        this.setState({ visible: false });
    }

    @autobind
    _keyboardDidHide(e) {
        // console.log('TabBarComponent.keyboardDidHide');

        this.setState({ visible: true });
    }

    @autobind
    onFocus() {
        // console.log('TabBarComponent.onFocus');

        this.setState({ focused: true });
        // this.focused = true;
    }

    @autobind
    onBlur() {
        // console.log('TabBarComponent.onBlur');

        this.setState({ focused: false });
        // this.focused = false;
    }

    render() {
        // return this.state.focused && this.state.visible ? <BottomTabBar {...this.props}/> : null;
        // return this.state.focused && this.state.visible ? <TabBarBottom {...this.props}/> : null; // not working in S7

        if (!this.state.focused) {
            // if (!this.focused) {
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
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of MainBottomTabNavigatorWrapper

// -- start of RootStackNavigatorWrapper
const RootStackNavigator = createStackNavigator(
    {
        main: { screen: MainBottomTabNavigatorWrapper },
        search: { screen: SearchScreen },
        postPreview: { screen: PostStackNavigatorWrapper }
    },
    {
        mode: 'modal',
        headerMode: 'none',
        navigationOptions: {
            gesturesEnabled: false
        },
        transitionConfig: () => ({
            screenInterpolator: StackViewStyleInterpolator.forVertical
        })
    }
);

class RootStackNavigatorWrapper extends React.Component {
    static router = RootStackNavigator.router;

    render() {
        return (
            <RootStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of RootStackNavigatorWrapper

// -- start of MapSearchStackNavigatorWrapper
const MapSearchStackNavigator = createStackNavigator(
    {
        home: { screen: MapSearch },
        post: { screen: Post },
        // mapOverview: { screen: MapOverview } // test
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

class MapSearchStackNavigatorWrapper extends React.Component {
    static router = MapSearchStackNavigator.router;

    render() {
        return (
            <MapSearchStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
// -- end of MapSearchStackNavigatorWrapper

/*
const CheckLikesStackNavigator = createStackNavigator(
    {
        home: { screen: CheckLikes },
        // post: { screen: Post }
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

class CheckLikesStackNavigatorWrapper extends React.Component {
    static router = CheckLikesStackNavigator.router;

    render() {
        return (
            <CheckLikesStackNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps.data
                }}
            />
        );
    }
}
*/

// -- start of AdminNavigatorWrapper
const AdminNavigator = createStackNavigator(
    {
        adminMain: { screen: Admin }
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

class AdminNavigatorWrapper extends React.Component {
    static router = AdminNavigator.router;

    render() {
        return (
            <AdminNavigator navigation={this.props.navigation}
                screenProps={{
                    params: this.props.navigation.state.params,
                    rootNavigation: this.props.navigation
                }}
            />
        );
    }
}
// -- end of AdminNavigatorWrapper

// -- start of MainStackNavigatorWrapper
const MainStackNavigator = createStackNavigator(
    {
        root: { screen: RootStackNavigatorWrapper },

        mapSearch: { screen: MapSearchStackNavigatorWrapper },

        // checkLikes: { screeen: CheckLikesStackNavigatorWrapper },
        checkLikes: { screen: CheckLikes },
        map: { screen: MapScreen },
        readReview: { screen: ReadAllReviewsScreen },
        writeReview: { screen: WriteReviewScreen },
        chatRoom: { screen: ChatRoomStackNavigatorWrapper },

        edit: { screen: EditStackNavigatorWrapper },
        checkReview: { screen: ReviewStackNavigatorWrapper },
        advertisement: { screen: AdvertisementStackNavigatorWrapper },
        checkComment: { screen: CommentStackNavigatorWrapper },

        admin: { screen: AdminNavigatorWrapper }
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
                    rootNavigation: this.props.navigation,
                    data: this.props.screenProps
                }}
            />
        );
    }
}
// -- end of MainStackNavigatorWrapper

const MainSwitchNavigator = createSwitchNavigator(
    {
        loading: { screen: Loading },
        authStackNavigator: { screen: AuthStackNavigatorWrapper },
        emailVerification: { screen: EmailVerificationMain },
        welcome: { screen: Welcome },
        mainStackNavigator: { screen: MainStackNavigatorWrapper }
    },
    {
        // initialRouteName: 'loading'
    }
);

const AppContainer = createAppContainer(MainSwitchNavigator);
