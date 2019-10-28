import React from 'react';
import { StyleSheet, Animated, Dimensions, View, StatusBar, Image, Platform } from 'react-native';
import { AppLoading, SplashScreen } from 'expo';
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import Firebase from './Firebase';
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';
import Star from './react-native-ratings/src/Star';
import { RefreshIndicator, Theme } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Cons, Vars } from './Globals';
import { Text } from './rnff/src/components';
import Util from './Util';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


// $FlowFixMe
// const RobotoBlack = require("../fonts/Roboto/Roboto-Black.ttf");
// const RobotoBlackItalic = require("../fonts/Roboto/Roboto-BlackItalic.ttf");
const RobotoBold = require("../fonts/Roboto/Roboto-Bold.ttf");
// const RobotoBoldItalic = require("../fonts/Roboto/Roboto-BoldItalic.ttf");
const RobotoItalic = require("../fonts/Roboto/Roboto-Italic.ttf");
const RobotoLight = require("../fonts/Roboto/Roboto-Light.ttf");
const RobotoLightItalic = require("../fonts/Roboto/Roboto-LightItalic.ttf");
const RobotoMedium = require("../fonts/Roboto/Roboto-Medium.ttf");
// const RobotoMediumItalic = require("../fonts/Roboto/Roboto-MediumItalic.ttf");
const RobotoRegular = require("../fonts/Roboto/Roboto-Regular.ttf");
// const RobotoThin = require("../fonts/Roboto/Roboto-Thin.ttf");
// const RobotoThinItalic = require("../fonts/Roboto/Roboto-ThinItalic.ttf");
const ChewyRegular = require("../fonts/Chewy-Regular.ttf");

// const FriendlySchoolmatesRegular = require("../fonts/Friendly-Schoolmates-Regular.otf"); // logo font
const MPLUSRounded1cBold = require("../fonts/MPLUSRounded1c-Bold.ttf");


@inject("feedStore", "profileStore")
@observer
export default class Loading extends React.Component<InjectedProps> {
    static userAutoAuthenticated = true;
    static userSignedIn = false;

    state = {
        showIndicator: false
    };

    constructor(props) {
        super(props);

        this.imageOpacity = new Animated.Value(0);

        SplashScreen.hide();
    }

    componentDidMount() {
        StatusBar.setHidden(true);

        !this.closed && this.setState({ showIndicator: true });
    }

    componentWillUnmount() {
        // unsubscribe
        // if (this.instance) this.instance();

        this.closed = true;
    }

    render() {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <Animated.Image
                    style={{
                        width: windowWidth, height: windowHeight, resizeMode: 'cover',
                        opacity: this.imageOpacity
                    }}
                    source={PreloadImage.background}
                    onLoadEnd={async () => { // wait for image's content to fully load [`Image#onLoadEnd`] (https://facebook.github.io/react-native/docs/image#onloadend)
                        await this._cacheResourcesAsync();
                        this.init();
                    }}
                    fadeDuration={0} // we need to adjust Android devices (https://facebook.github.io/react-native/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300` 
                />

                {
                    this.state.showIndicator &&
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
                        <RefreshIndicator refreshing total={3} size={7} color={Theme.color.splash} />
                    </View>
                }
            </View>
        );
    }

    async _cacheResourcesAsync() {
        console.log('jdub', 'Loading._cacheResourcesAsync');

        // font
        const fonts = Font.loadAsync({
            // 'Roboto-Black': RobotoBlack,
            // 'Roboto-BlackItalic': RobotoBlackItalic,
            'Roboto-Bold': RobotoBold,
            // 'Roboto-BoldItalic': RobotoBoldItalic,
            'Roboto-Italic': RobotoItalic,
            'Roboto-Light': RobotoLight,
            'Roboto-LightItalic': RobotoLightItalic,
            'Roboto-Medium': RobotoMedium,
            // 'Roboto-MediumItalic': RobotoMediumItalic,
            'Roboto-Regular': RobotoRegular,
            // 'Roboto-Thin': RobotoThin,
            // 'Roboto-ThinItalic': RobotoThinItalic,
            "Chewy-Regular": ChewyRegular,
            // "FriendlySchoolmates-Regular": FriendlySchoolmatesRegular
            "MPLUSRounded1c-Bold": MPLUSRounded1cBold
        });

        // const images = Images.downloadAsync(); // logo
        // const icons = loadIcons();
        // await Promise.all([fonts, ...images, icons]);

        const preload = PreloadImage.downloadAsync();
        const star = Star.downloadAsync();

        await Promise.all([fonts, ...preload, ...star]);
    }

    init() {
        Firebase.init();

        this.instance = Firebase.auth.onAuthStateChanged(async (user) => {
            // console.log('jdub', 'Loading.onAuthStateChanged, user', user);

            // const { navigation, feedStore, profileStore, userFeedStore } = this.props;
            const { navigation, feedStore, profileStore } = this.props;

            const isUserAuthenticated = !!user;

            if (!isUserAuthenticated) { // user == null (first join or sign out, delete account)
                if (Loading.userSignedIn) { // signed out, delete account
                    Loading.userSignedIn = false;

                    Loading.userAutoAuthenticated = true;

                    // move to login page
                    console.log('jdub', '[sign out / delete account] move to auth main');
                    // StatusBar.setHidden(false);
                    navigation.navigate("authMain");
                } else {
                    Loading.userAutoAuthenticated = false;

                    !this.closed && this.setState({ showIndicator: false });

                    // show background image
                    Animated.sequence([
                        Animated.timing(this.imageOpacity, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true
                        })
                    ]).start(() => {
                        console.log('jdub', '[first join] move to auth main');
                        // StatusBar.setHidden(false);
                        navigation.navigate("authMain");
                    });
                }
            } else {
                Loading.userSignedIn = true;

                // save profile
                let name = Vars.signUpName; // means just sign up

                if (!name) name = user.displayName;
                const email = user.email;
                const mobile = user.phoneNumber;
                // const photoURL = user.photoURL; // get profile picture from facebook
                let photoURL = null;
                const facebook = Util.getFacebookProvider(user.providerData);
                if (facebook) photoURL = "https://graph.facebook.com/" + facebook.uid + "/picture?width=640&height=640";

                let profile = await Firebase.getProfile(user.uid);
                if (profile) {
                    // update
                    profile.name = name;
                    profile.email = email;
                    profile.phoneNumber = mobile;
                    if (photoURL && !profile.picture.uri) { // if only profile picture NOT exists then save it!
                        profile.picture.uri = photoURL;
                    }
                    profile.activating = true;
                    profile.lastLogInTime = Date.now();

                    await Firebase.updateProfile(user.uid, profile, true);
                } else {
                    // create
                    await Firebase.createProfile(user.uid, name, email, mobile, photoURL);
                }

                profileStore.init();

                //////// set up environment ////////

                // 1. distance unit
                const place = profile.place;
                this.setDistanceUnit(place);

                // 2.
                const postFilter = profile.postFilter;
                this.setPostFilter(postFilter);

                ////////////////////////////////////

                if (Loading.userAutoAuthenticated) {
                    if (Vars.signUpType === null) { // for the auto sign in
                        StatusBar.setHidden(false);

                        // check verification if EMAIL user
                        if (user.email && !user.emailVerified && user) {
                            if (user.providerData && user.providerData.length > 0 && user.providerData[0].providerId === "facebook.com") {
                                console.log('jdub', "email user is not verified. but facebook users don't need to email verification.");
                                await this.checkUpdates();
                            } else {
                                console.log('jdub', 'email user is not verified. move to email verification');
                                navigation.navigate("emailVerification", { email: user.email, user: user, from: 'Loading' });
                                return;
                            }
                        } else {
                            await this.checkUpdates();
                        }

                        console.log('jdub', '[auto sign in] move to main');
                        navigation.navigate("mainStackNavigator");
                    } else { // for the resign in after sign out / delete account
                        const type = Vars.signUpType; // copy

                        // sign up finished
                        Vars.signUpType = null;
                        Vars.signUpName = null;

                        if (type === 'EMAIL') return;

                        console.log('jdub', '[resign in after sign out / delete account] move to welcome');
                        if (type === 'FACEBOOK') navigation.navigate("welcome", { from: 'FACEBOOK' });
                        else if (type === 'MOBILE') navigation.navigate("welcome", { from: 'MOBILE' });
                        else navigation.navigate("welcome");
                    }
                } else {
                    const type = Vars.signUpType; // copy

                    // sign up finished
                    Vars.signUpType = null;
                    Vars.signUpName = null;

                    if (type === 'EMAIL') return;

                    console.log('jdub', '[first join] move to welcome');
                    if (type === 'FACEBOOK') navigation.navigate("welcome", { from: 'FACEBOOK' });
                    else if (type === 'MOBILE') navigation.navigate("welcome", { from: 'MOBILE' });
                    else navigation.navigate("welcome");
                }
            }
        }); // end of onAuthStateChanged
    }

    async checkUpdates() {
        // check updates (chat first.. post, likes, review, reply later)

        let result;

        // 1. home
        // result = await this.checkUpdateOnHome();

        // 2. likes
        // result = await this.checkUpdateOnLikes();

        // 3. chat
        result = await this.checkUpdateOnChat();
        if (result) {
            // show badge
            setTimeout(() => {
                // if (this.closed) return;
                const screenProps = this.props.screenProps;
                screenProps.changeBadgeOnChat(true, 0);
            }, 1500); // after 1.5 sec
        }

        // 4. profile
        result = this.checkUpdateOnProfile();
        if (result) {
            // show badge
            setTimeout(() => {
                // if (this.closed) return;
                const screenProps = this.props.screenProps;
                screenProps.changeBadgeOnProfile(true, 0);
            }, 1500); // after 1.5 sec
        }
    }

    async checkUpdateOnChat() {
        const uid = Firebase.user().uid;
        const room = await Firebase.getLastChatRoom(uid);
        if (!room) return false;

        const mid = room.mid;
        const lastReadMessageId = room.lastReadMessageId;

        // if (!lastReadMessageId) return true; // user never read

        if (!lastReadMessageId) {
            const owner = room.owner;
            if (uid === owner) { // 상대방이 말을 걸었고, 내가 읽지 않았다.
                return true;
            } else { // 내가 말을 걸었고, 상대방이 읽지 않았다.
                return false;
            }
        }

        if (mid !== lastReadMessageId) return true;

        return false;
    }

    checkUpdateOnProfile() {
        // 1. 내가 올린 post에 review가 달린 경우
        // 2. customer의 경우, 내가 쓴 review에 reply가 달린 경우
        // 3. (customer의 경우) 내 프로필에 새 review가 달린 경우

        const { profileStore } = this.props;
        const { profile } = profileStore;

        if (!profile) return false;

        // 1. check reviews on my post
        const feeds = profile.feeds;
        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            if (feed.reviewAdded) {
                return true;
            }
        }

        // 2. check replies on my review
        const reviews = profile.reviews;
        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            if (review.replyAdded) {
                return true;
            }
        }

        // 3. check comments on my profile
        if (profile.commentAdded) return true;

        return false;
    }

    setDistanceUnit(place) {
        if (place) {
            const country = Util.getCountry(place);
            if (country === 'USA' || country === 'Myanmar (Burma)' || country === 'Liberia') { // ToDo: add more countries
                Vars.distanceUnit = 'mile';
                console.log('jdub', 'mile unit');
            } else {
                Vars.distanceUnit = 'meter';
                console.log('jdub', 'meter unit');
            }
        } else {
            Vars.distanceUnit = 'meter';
            console.log('jdub', 'meter unit');
        }
    }

    setPostFilter(postFilter) {
        // 1. Show Me
        const showMe = postFilter.showMe;
        Vars.showMe = showMe;
        // console.log('jdub', 'showMe: ', showMe);

        // 2. Age Range
        // ToDo
    }
}
