import React from 'react';
import { StyleSheet, Animated, Dimensions, View, StatusBar, Image, Platform } from 'react-native';
import { AppLoading, SplashScreen } from 'expo';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
// import { Images, loadIcons } from "./rne/src/components";
import Firebase from './Firebase';
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';
import Star from './react-native-ratings/src/Star';
import { RefreshIndicator } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Cons, Vars } from './Globals';
import { Text } from './rnff/src/components';
import Util from './Util';

// $FlowFixMe
/*
const SFProTextBold = require("../fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("../fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("../fonts/SF-Pro-Text-Regular.otf");
const SFProTextMedium = require("../fonts/SF-Pro-Text-Medium.otf");
const SFProTextHeavy = require("../fonts/SF-Pro-Text-Heavy.otf");
const SFProTextLight = require("../fonts/SF-Pro-Text-Light.otf");
*/
/*
const SFProTextBold = require("../fonts/SuisseIntl/SuisseIntl-Bold.otf");
const SFProTextSemibold = require("../fonts/SuisseIntl/SuisseIntl-SemiBold.otf");
const SFProTextRegular = require("../fonts/SuisseIntl/SuisseIntl-Regular.otf");
const SFProTextMedium = require("../fonts/SuisseIntl/SuisseIntl-Medium.otf");
const SFProTextLight = require("../fonts/SuisseIntl/SuisseIntl-Light.otf");
const SFProTextBlack = require("../fonts/SuisseIntl/SuisseIntl-Black.otf");
*/
const RobotoBlack = require("../fonts/Roboto/Roboto-Black.ttf");
const RobotoBlackItalic = require("../fonts/Roboto/Roboto-BlackItalic.ttf");
const RobotoBold = require("../fonts/Roboto/Roboto-Bold.ttf");
const RobotoBoldItalic = require("../fonts/Roboto/Roboto-BoldItalic.ttf");
const RobotoItalic = require("../fonts/Roboto/Roboto-Italic.ttf");
const RobotoLight = require("../fonts/Roboto/Roboto-Light.ttf");
const RobotoLightItalic = require("../fonts/Roboto/Roboto-LightItalic.ttf");
const RobotoMedium = require("../fonts/Roboto/Roboto-Medium.ttf");
const RobotoMediumItalic = require("../fonts/Roboto/Roboto-MediumItalic.ttf");
const RobotoRegular = require("../fonts/Roboto/Roboto-Regular.ttf");
const RobotoThin = require("../fonts/Roboto/Roboto-Thin.ttf");
const RobotoThinItalic = require("../fonts/Roboto/Roboto-ThinItalic.ttf");

// const SuisseIntlUltraLightItalic = require("../fonts/SuisseIntl/SuisseIntl-UltraLightItalic.otf");
// const SuisseIntlThinItalic = require("../fonts/SuisseIntl/SuisseIntl-ThinItalic.otf");

const FriendlySchoolmatesRegular = require("../fonts/Friendly-Schoolmates-Regular.otf"); // logo
// const SansSerif = require("../fonts/Sans-Serif.ttf");

const ConcertOneRegular = require("../fonts/ConcertOne-Regular.ttf");
const ChewyRegular = require("../fonts/Chewy-Regular.ttf");

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore")
@observer
export default class Loading extends React.Component<InjectedProps> {
    static userAutoAuthenticated = true;
    static userSignedIn = false;

    state = {
        isReady: false,
        showIndicator: false,
        image2Opacity: new Animated.Value(0)
    };

    constructor(props) {
        super(props);

        SplashScreen.preventAutoHide(); // Instruct SplashScreen not to hide yet

        StatusBar.setHidden(true);
    }

    componentDidMount() {
        this._cacheResourcesAsync().then(() => {
            !this.closed && this.setState({ isReady: true });

            // this.init();
        }).catch(error => console.error(`Unexpected error thrown when loading: ${error.stack}`));
    }

    componentWillUnmount() {
        // unsubscribe
        // if (this.instance) this.instance();

        this.closed = true;
    }

    render() {
        if (!this.state.isReady) {
            return null;
        }

        return (
            <View style={{ flex: 1 }}>
                <Image
                    // style={{ flex: 1, resizeMode: 'cover', width: undefined, height: undefined, opacity: this.state.image1Opacity }}
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.Splash}
                    onLoadEnd={() => { // wait for image's content to fully load [`Image#onLoadEnd`] (https://facebook.github.io/react-native/docs/image#onloadend)
                        SplashScreen.hide(); // Image is fully presented, instruct SplashScreen to hide

                        !this.closed && this.setState({ showIndicator: true });

                        this.init();
                    }}
                    fadeDuration={0} // we need to adjust Android devices (https://facebook.github.io/react-native/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300` 
                />
                {
                    this.state.showIndicator &&
                    <View style={{
                        position: 'absolute', top: Dimensions.get('window').height / 2 - 100,
                        width: '100%', height: 30, justifyContent: 'center', alignItems: 'center'
                    }}>
                        <RefreshIndicator refreshing total={3} size={5} color='white' />
                    </View>
                }
                <Text style={{ position: 'absolute', bottom: 30 + Cons.viewMarginBottom(), right: 10, fontSize: 14, color: 'white' }}>{'Date Published ' + Cons.lastUpdatedDate}</Text>
                <Text style={{ position: 'absolute', bottom: 10 + Cons.viewMarginBottom(), right: 10, fontSize: 14, color: 'white' }}>{'Version: ' + Cons.version}</Text>
                <Animated.Image
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover',
                        opacity: this.state.image2Opacity
                    }}
                    source={PreloadImage.Background}
                // blurRadius={Platform.OS === 'android' ? 1 : 15}
                />
            </View>
        );
    }

    async _cacheResourcesAsync() {
        console.log('Loading._cacheResourcesAsync');

        // font
        const fonts = Font.loadAsync({
            'Roboto-Black': RobotoBlack,
            'Roboto-BlackItalic': RobotoBlackItalic,
            'Roboto-Bold': RobotoBold,
            'Roboto-BoldItalic': RobotoBoldItalic,
            'Roboto-Italic': RobotoItalic,
            'Roboto-Light': RobotoLight,
            'Roboto-LightItalic': RobotoLightItalic,
            'Roboto-Medium': RobotoMedium,
            'Roboto-MediumItalic': RobotoMediumItalic,
            'Roboto-Regular': RobotoRegular,
            'Roboto-Thin': RobotoThin,
            'Roboto-ThinItalic': RobotoThinItalic,
            /*
            "SFProText-Bold": SFProTextBold,
            "SFProText-Semibold": SFProTextSemibold,
            "SFProText-Regular": SFProTextRegular,
            "SFProText-Medium": SFProTextMedium,
            "SFProText-Black": SFProTextBlack,
            "SFProText-Light": SFProTextLight,
            */

            // "SuisseIntl-UltraLightItalic": SuisseIntlUltraLightItalic,
            // "SuisseIntl-ThinItalic": SuisseIntlThinItalic,

            "FriendlySchoolmates-Regular": FriendlySchoolmatesRegular,
            // "SansSerif": SansSerif
            "ConcertOne-Regular": ConcertOneRegular,
            "Chewy-Regular": ChewyRegular
        });

        // const images = Images.downloadAsync(); // logo
        // const icons = loadIcons();
        // await Promise.all([fonts, ...images, icons]);

        const preload = PreloadImage.downloadAsync();
        const star = Star.downloadAsync();

        await Promise.all([fonts, ...preload, ...star]);
    }

    init() {
        console.log('Loading.init');

        Firebase.init();

        this.instance = Firebase.auth.onAuthStateChanged(async (user) => {
            console.log('Loading.onAuthStateChanged', '----------------------------------------');
            console.log('Loading.onAuthStateChanged, user', user);
            console.log('Loading.onAuthStateChanged', '----------------------------------------');

            // const { navigation, feedStore, profileStore, userFeedStore } = this.props;
            const { navigation, feedStore, profileStore } = this.props;

            const isUserAuthenticated = !!user;

            if (!isUserAuthenticated) { // user == null (first join or sign out, delete account)
                if (Loading.userSignedIn) { // signed out, delete account
                    Loading.userSignedIn = false;

                    Loading.userAutoAuthenticated = true;

                    // move to login page
                    console.log('[sign out / delete account] move to auth main');
                    // StatusBar.setHidden(false);
                    navigation.navigate("authMain");
                } else {
                    Loading.userAutoAuthenticated = false;

                    Animated.sequence([
                        Animated.delay(1500),
                        Animated.timing(this.state.image2Opacity, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true
                        })
                    ]).start(() => {
                        !this.closed && this.setState({ showIndicator: false });

                        console.log('[first join] move to auth main.');
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

                // const { uid } = Firebase.auth.currentUser;
                /*
                const feedQuery = Firebase.firestore.collection("feed").orderBy("timestamp", "desc"); // 전체 feed
                feedStore.init(feedQuery);

                profileStore.init();

                const userFeedQuery = Firebase.firestore.collection("feed").where("uid", "==", uid).orderBy("timestamp", "desc"); // 내가 올린 feed
                userFeedStore.init(userFeedQuery);
                */
                await profileStore.init();

                if (Loading.userAutoAuthenticated) {
                    if (Vars.signUpType === null) { // for the auto sign in
                        // check verification if EMAIL user
                        if (user.email && !user.emailVerified && user) {
                            if (user.providerData && user.providerData.length > 0 && user.providerData[0].providerId === "facebook.com") {
                                console.log('email user is not verified. but facebook user NOT need to email verification.');
                                await this.checkUpdates();
                                StatusBar.setHidden(false);
                            } else {
                                console.log('email user is not verified. move to email verification.');
                                StatusBar.setHidden(false);
                                navigation.navigate("emailVerification", { email: user.email, user: user, from: 'Loading' });
                                return;
                            }
                        } else {
                            await this.checkUpdates();
                            StatusBar.setHidden(false);
                        }

                        console.log('[auto sign in] move to main.');
                        navigation.navigate("mainStackNavigator");
                    } else { // for the resign in after sign out / delete account
                        const type = Vars.signUpType; // copy

                        // sign up finished
                        Vars.signUpType = null;
                        Vars.signUpName = null;

                        if (type === 'EMAIL') return;

                        console.log('[resign in after sign out / delete account] move to welcome.');
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

                    console.log('[first join] move to welcome.');
                    if (type === 'FACEBOOK') navigation.navigate("welcome", { from: 'FACEBOOK' });
                    else if (type === 'MOBILE') navigation.navigate("welcome", { from: 'MOBILE' });
                    else navigation.navigate("welcome");
                }
            }
        }); // end of onAuthStateChanged
    }

    async checkUpdates() {
        // check updates (chat first.. post, likes, review, reply later)

        // 1. home
        // const home = await this.checkUpdateOnHome();

        // 2. likes
        // const likes = await this.checkUpdateOnLikes();

        // 3. chat
        const chatResult = await this.checkUpdateOnChat();
        if (chatResult) {
            // show badge
            setTimeout(() => {
                if (this.closed) return;
                const screenProps = this.props.screenProps;
                screenProps.changeBadgeOnChat(true, 0);
            }, 2000); // after 2 sec
        }

        // 4. profile
        const profileResult = this.checkUpdateOnProfile();
        if (profileResult) {
            // show badge
            setTimeout(() => {
                if (this.closed) return;
                const screenProps = this.props.screenProps;
                screenProps.changeBadgeOnProfile(true, 0);
            }, 2000); // after 2 sec
        }
    }

    async checkUpdateOnChat() {
        const uid = Firebase.user().uid;
        const room = await Firebase.getLastChatRoom(uid);

        if (!room) return false;

        const mid = room.mid;
        const lastReadMessageId = room.lastReadMessageId;

        if (!mid) { // no contents (will never happen)
            return false;
        }

        if (!lastReadMessageId) { // user never read
            return true;
        }

        if (mid === lastReadMessageId) {
            return false;
        }

        return true;
    }

    checkUpdateOnProfile() {
        // 1. owner의 경우, 내가 올린 post에 리뷰가 달린 경우
        // 2. customer의 경우, 내가 쓴 review에 답글이 달린 경우
        // 3. customer의 경우, Customer Review에 새 리뷰가 달린 경우

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
}
