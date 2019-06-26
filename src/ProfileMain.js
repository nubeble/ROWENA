import autobind from "autobind-decorator";
import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image,
    TouchableWithoutFeedback, Animated
} from 'react-native';
import { Permissions, ImagePicker } from "expo";
import Constants from 'expo-constants';
import SmartImage from "./rnff/src/components/SmartImage";
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from "react-native-vector-icons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Text, Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Dialog from "react-native-dialog";
import Util from "./Util";
import ProfileStore from "./rnff/src/home/ProfileStore";
import Intro from './Intro';
import ChatMain from './ChatMain';
// import { unregisterExpoPushToken } from './PushNotifications';
import { NavigationActions } from 'react-navigation';

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 9; // 3 x 3

const avatarWidth = Dimensions.get('window').height / 11;

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<InjectedProps> {
    static __flatList = null;

    state = {
        // renderFeed: false,
        // showIndicator: false,

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        // showPostIndicator: -1,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert',
        dialogPassword: '',

        onUploadingImage: false,
        // uploadImageUri: null,

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        flashOffset: new Animated.Value((8 + 34 + 8) * -1)
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;

        this.lastCommentsUpdatedTime = 0;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];

        // this.imageRefs = []; // for cleaning files in server

        // used in checkUpdateOnUserFeed
        // this.reviewAddedFeedHashTable = [];
        this.reviewAddedFeedHashTable = new Map();
    }

    static scrollToTop() {
        ProfileMain.__flatList.scrollToOffset({ offset: 0, animated: true });
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        // this.getUserFeeds();

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
        */
    }

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        for (let i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (let i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        // remove server files
        /*
        if (this.imageRefs.length > 0) {
            console.log('clean image files');

            const formData = new FormData();
            for (let i = 0; i < this.imageRefs.length; i++) {
                const ref = this.imageRefs[i];

                const number = i + 1;
                const fieldName = 'file' + number.toString();
                formData.append(fieldName, ref);

                console.log(fieldName, ref);
            }

            fetch(SERVER_ENDPOINT + "cleanPostImages", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data"
                },
                body: formData
            });
        }
        */

        this.closed = true;
    }

    /*
    removeItemFromList() {
        if (this.uploadImageRef) {
            const ref = this.uploadImageRef;
            const index = this.imageRefs.indexOf(ref);
            if (index !== -1) {
                this.imageRefs.splice(index, 1);
            }
        }
    }
    */

    @autobind
    handleHardwareBackPress() {
        // console.log('ProfileMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        // this.props.navigation.navigate("intro");
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        console.log('ProfileMain.onFocus');

        Vars.focusedScreen = 'ProfileMain';

        // check user feed updates
        if (this.checkUpdateOnUserFeed() === true) {
            this.lastChangedTime = 0;
            this.getUserFeeds();
        } else {
            const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
            if (this.lastChangedTime !== lastChangedTime) {
                // reload from the start
                this.getUserFeeds();

                // move scroll top
                // if (this._flatList) this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        }

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    /*
    @autobind
    onScrollHandler() {
        console.log('ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }
    */

    showNotification(msg) {
        // if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: Constants.statusBarHeight + 6,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.state.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.state.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    getUserFeeds() {
        if (this.state.isLoadingFeeds) return;

        const { profile } = this.props.profileStore;
        // if (!profile) return;

        const feeds = profile.feeds;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });
            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.setState({ isLoadingFeeds: true });

        console.log('ProfileMain', 'loading feeds...');

        let newFeeds = [];

        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (let i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            let feed = feeds[i];

            // newFeeds.push(feed);

            // subscribe post
            // --
            const placeId = feed.placeId;
            const feedId = feed.feedId;

            if (this.feedList.has(feedId)) {
                const _feed = this.feedList.get(feedId);
                if (_feed) { // could be null or undefined
                    // update picture
                    feed.picture = _feed.pictures.one.uri;
                }

                newFeeds.push(feed);
            } else {
                newFeeds.push(feed);

                // this will be updated in subscribe
                this.feedList.set(feedId, null);

                const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                    if (newFeed === undefined) {
                        this.feedList.delete(feedId);
                        return;
                    }

                    // update this.feedList
                    this.feedList.set(feedId, newFeed);

                    // update picture
                    // let changed = false;
                    let feeds = [...this.state.feeds];
                    const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.feedId === newFeed.id);
                    if (index !== -1) {
                        // if (feeds[index].picture !== newFeed.pictures.one.uri) changed = true;

                        feeds[index].picture = newFeed.pictures.one.uri;
                        this.setState({ feeds });
                    }

                    // update database
                    // if (changed) Firebase.updateUserFeed(Firebase.user().uid, placeId, feedId, newFeed.pictures.one.uri);
                });

                this.feedsUnsubscribes.push(fi);
            }
            // --

            // subscribe feed count
            // --
            if (!this.feedCountList.has(placeId)) {
                // this will be updated in subscribe
                this.feedCountList.set(placeId, -1);

                const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                    if (newPlace === undefined) {
                        this.feedCountList.delete(placeId);
                        return;
                    }

                    // update this.feedCountList
                    this.feedCountList.set(placeId, newPlace.count);
                });

                this.countsUnsubscribes.push(ci);
            }
            // --

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            // this.setState({ isLoadingFeeds: false, feeds: newFeeds });
            this.setState({ feeds: newFeeds });
        } else {
            // this.setState({ isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds] });
            this.setState({ feeds: [...this.state.feeds, ...newFeeds] });
        }

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false });
        }, 250);

        console.log('ProfileMain', 'loading feeds done!');
    }

    async postClick(item) {
        // red dot
        if (item.reviewAdded) {
            // update reviewAdded in user profile
            const { profile } = this.props.profileStore;
            // if (!profile) return;

            /*
            const result = await Firebase.updateReviewChecked(profile.uid, item.placeId, item.feedId, false);
            if (!result) {
                this.refs["toast"].show('The user no longer exists.', 500);
                return;
            }
            */
            Firebase.updateReviewChecked(profile.uid, item.placeId, item.feedId, false);

            // update state
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
            if (index === -1) {
                this.refs["toast"].show('The post no longer exists.', 500);
                return;
            }

            let feed = feeds[index];
            feed.reviewAdded = false;
            feeds[index] = feed;
            this.setState({ feeds });
        }

        await this.openPost(item);
    }

    async openPost(item) {
        // show indicator
        // this.setState({ showPostIndicator: index });

        const post = this.getPost(item);
        if (post === null) {
            // the post is not subscribed yet
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (post === undefined) {
            // the post is removed
            return;
        }

        const feedSize = this.getFeedSize(item.placeId);
        if (feedSize === -1) {
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed
            // this should never happen
            return;
        }

        const extra = {
            feedSize
        };

        // setTimeout(() => {
        Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
        this.props.navigation.navigate("postPreview", { post: post, extra: extra, from: 'Profile' });
        // }, Cons.buttonTimeoutShort);

        // hide indicator
        // this.setState({ showPostIndicator: -1 });
    }

    getPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;

        const post = this.feedList.get(feedId);

        return post; // null: the post is not subscribed yet, undefined: the post is removed
    }

    getFeedSize(placeId) {
        const count = this.feedCountList.get(placeId);

        return count; // -1: the place is not subscribed yet, undefined: the place is removed
    }

    render() {
        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const flashStyle = {
            opacity: this.state.flashOpacity,
            transform: [{ translateY: this.state.flashOffset }]
        };

        const { profile } = this.props.profileStore;

        const uid = profile.uid;
        const name = profile.name;
        const email = profile.email;
        const phoneNumber = profile.phoneNumber;
        const picture = profile.picture.uri;
        const comments = profile.comments;
        const commentAdded = profile.commentAdded;

        let avatarName = 'Anonymous';

        if (name) {
            avatarName = name;
        } else {
            if (email) {
                avatarName = email;
            } else {
                if (phoneNumber) {
                    avatarName = phoneNumber;
                }
            }
        }

        let _avatarName = '';
        let _avatarColor = 'black';

        if (!picture) {
            _avatarName = Util.getAvatarName(name);
            _avatarColor = Util.getAvatarColor(uid);
        }

        const replyAdded = this.checkUpdateOnReview();

        return (
            <View style={styles.flex}>
                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[styles.flash, flashStyle]}
                    ref={flash => this._flash = flash}
                >
                    <View>
                        <Text style={styles.flashMessageTitle}>{this.state.flashMessageTitle}</Text>
                        <Text style={styles.flashMessageSubtitle}>{this.state.flashMessageSubtitle}</Text>
                    </View>
                    {
                        this.state.flashImage &&
                        <Image
                            style={{ width: (8 + 34 + 8) * 0.84, height: (8 + 34 + 8) * 0.84, borderRadius: 2 }}
                            source={{ uri: this.state.flashImage }}
                        />
                    }
                </Animated.View>

                <View style={styles.searchBar}>

                    <TouchableOpacity activeOpacity={1.0} onPress={() => this.openAdmin()}>
                        <Text style={{
                            color: Theme.color.text1,
                            fontSize: 20,
                            fontFamily: "Roboto-Medium",
                            alignSelf: 'flex-start',
                            marginLeft: 16
                        }}>Profile</Text>
                    </TouchableOpacity>

                </View>

                {
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                            ProfileMain.__flatList = fl;
                        }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={styles.infoContainer}>
                                    {/* avatar view */}
                                    <TouchableOpacity
                                        style={{ marginTop: 8 }}
                                        onPress={() => {
                                            if (!profile) return;

                                            setTimeout(() => {
                                                if (this.closed) return;
                                                Firebase.updateCommentChecked(uid, false);
                                                this.props.navigation.navigate("edit");
                                            }, Cons.buttonTimeoutShort);
                                        }}
                                    >
                                        <View style={{
                                            width: '100%', height: Dimensions.get('window').height / 8,
                                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>

                                                <View style={{ flexDirection: 'row' }}>
                                                    <View style={{ marginTop: Cons.redDotWidth / 2, alignSelf: 'flex-start' }}>
                                                        <Text style={{ paddingTop: 4, fontSize: 24, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
                                                            {avatarName}
                                                        </Text>
                                                    </View>
                                                    {
                                                        commentAdded &&
                                                        <View style={{
                                                            marginLeft: Cons.redDotWidth,
                                                            backgroundColor: 'red',
                                                            borderRadius: Cons.redDotWidth / 2,
                                                            width: Cons.redDotWidth,
                                                            height: Cons.redDotWidth
                                                        }} />
                                                    }
                                                </View>

                                                <Text style={{ marginTop: Dimensions.get('window').height / 80, color: Theme.color.text3, fontSize: 16, fontFamily: "Roboto-Light" }}>View and edit profile</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    width: avatarWidth, height: avatarWidth,
                                                    marginRight: 22, justifyContent: 'center', alignItems: 'center'
                                                }}
                                                onPress={() => {
                                                    if (this._showNotification) {
                                                        this.hideNotification();
                                                        this.hideAlertIcon();
                                                    }

                                                    if (!profile) return;

                                                    this.uploadPicture();
                                                }}
                                            >
                                                {
                                                    picture ?
                                                        <SmartImage
                                                            style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                            uri={picture}
                                                            showSpinner={false}
                                                        />
                                                        :
                                                        /*
                                                        <Image
                                                            style={{
                                                                backgroundColor: 'black',
                                                                width: avatarWidth, height: avatarWidth,
                                                                borderRadius: avatarWidth / 2,
                                                                resizeMode: 'cover'
                                                            }}
                                                            source={PreloadImage.user}
                                                        />
                                                        */
                                                        <View
                                                            style={{
                                                                width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2,
                                                                backgroundColor: _avatarColor, alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Text style={{ color: 'white', fontSize: 28, lineHeight: 32, fontFamily: "Roboto-Medium" }}>
                                                                {_avatarName}
                                                            </Text>
                                                        </View>
                                                }
                                                {
                                                    this.state.onUploadingImage &&
                                                    <ActivityIndicator
                                                        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, zIndex: 10002 }}
                                                        animating={true}
                                                        size="large"
                                                        color={Theme.color.selection}
                                                    />
                                                }
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={{ width: '100%', paddingHorizontal: 20 }}>
                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* See my ratings & reviews */}

                                        {/* Girls You've Reviewed */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
                                                    if (this.closed) return;
                                                    this.props.navigation.navigate("checkReview");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                // justifyContent: 'center', paddingLeft: 2
                                                flexDirection: 'row', alignItems: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{"Girls You've Reviewed"}</Text>
                                                {
                                                    replyAdded &&
                                                    <View style={{
                                                        marginLeft: Cons.redDotWidth,
                                                        marginBottom: Cons.redDotWidth * 3,
                                                        backgroundColor: 'red',
                                                        borderRadius: Cons.redDotWidth / 2,
                                                        width: Cons.redDotWidth,
                                                        height: Cons.redDotWidth
                                                    }} />
                                                }
                                                <AntDesign name='staro' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Advertise Yourself or Your Friends */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
                                                    if (this.closed) return;
                                                    this.props.navigation.navigate("advertisement");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{'Advertise Yourself or Your Friends'}</Text>
                                                <Feather name='edit-3' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Customers You've Reviewed */}
                                        {
                                            comments && comments.length > 0 &&
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!profile) return;

                                                    setTimeout(() => {
                                                        if (this.closed) return;
                                                        this.props.navigation.navigate("checkComment");
                                                    }, Cons.buttonTimeoutShort);
                                                }}
                                            >
                                                <View style={{
                                                    width: '100%', height: Dimensions.get('window').height / 14,
                                                    // justifyContent: 'center', paddingLeft: 2
                                                    flexDirection: 'row', alignItems: 'center', paddingLeft: 2
                                                }}>
                                                    <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{"Customers You've Reviewed"}</Text>
                                                    {
                                                        /*
                                                        // commentAdded &&
                                                        <View style={{
                                                            backgroundColor: 'red',
                                                            borderRadius: Cons.redDotWidth / 2,
                                                            width: Cons.redDotWidth,
                                                            height: Cons.redDotWidth,
                                                            marginLeft: Cons.redDotWidth / 2,
                                                            marginBottom: Cons.redDotWidth * 2
                                                        }} />
                                                        */
                                                    }
                                                    <MaterialCommunityIcons name='comment-text-outline' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                                </View>
                                            </TouchableOpacity>
                                        }
                                        {
                                            comments && comments.length > 0 &&
                                            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                        }

                                        {/* Log out */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                this.openDialog('alert', 'Log out', 'Are you sure you want to logout?', async () => {
                                                    // show indicator
                                                    !this.closed && this.setState({ isLoadingFeeds: true });

                                                    // unsubscribe profile
                                                    this.props.profileStore.final();

                                                    // init & unsubscribe
                                                    Intro.final();
                                                    ChatMain.final();

                                                    // remove push token
                                                    // await unregisterExpoPushToken(profile.uid);
                                                    await Firebase.deleteToken(uid);

                                                    await Firebase.signOut(profile.uid);

                                                    // hide indicator
                                                    !this.closed && this.setState({ isLoadingFeeds: false });
                                                });

                                                /*
                                                this.openDialog('alert', 'Log out', 'Are you sure you want to remove all data from this device?', async () => {
                                                    // feeds
                                                    // storage
                                                    // user profile & auth

                                                    // comment store
                                                    //// reviews, comments

                                                    // chat
                                                    // token


                                                    // 1. unsubscribe profile first!
                                                    this.props.profileStore.final();

                                                    // 2. remove all the created feeds (place - feed)
                                                    const uid = profile.uid;
                                                    const feeds = profile.feeds;
                                                    const length = feeds.length;

                                                    for (var i = 0; i < length; i++) {
                                                        const feed = feeds[i];
                                                        await Firebase.removeFeed(uid, feed.placeId, feed.feedId);
                                                    }

                                                    // 3. delete all the chat rooms
                                                    await Firebase.deleteChatRooms(uid);

                                                    // 4. remove push token (tokens - uid)
                                                    await Firebase.deleteToken(uid);

                                                    // 5. remove all the received comments (users - user - comments - all the documents)
                                                    // 6. remove database (user profile & remove auth)
                                                    await Firebase.deleteProfile(uid);
                                                });
                                                */

                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{'Log Out'}</Text>
                                                <AntDesign name='logout' color={Theme.color.text2} size={22} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                    </View>

                                    {/*
                                    <View style={{
                                        // backgroundColor: 'green',
                                        width: '100%',
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: '#123456'
                                        // position: "absolute", top: baselineTop + 120, left: 0
                                    }}
                                    >
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>20</Text>
                                            <Text style={styles.infoText2}>reviews</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>0</Text>
                                            <Text style={styles.infoText2}>posts</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>Weight</Text>
                                            <Text style={styles.infoText2}>48</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>Bust Size</Text>
                                            <Text style={styles.infoText2}>C</Text>
                                        </View>
                                    </View>
                                    */}

                                </View>
                                {
                                    this.state.totalFeedsSize === 0 &&
                                    <View style={{
                                        width: '100%', height: Dimensions.get('window').height / 14,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <TouchableOpacity onPress={() => {
                                            // nothing to do
                                        }}>
                                            <Text style={{ fontSize: 16, color: Theme.color.text4, fontFamily: "Roboto-Light" }}>VERSION {Cons.version} ({Cons.buildNumber})</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                                {
                                    this.state.totalFeedsSize > 0 &&
                                    <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                                        <Text style={styles.title}>Your post
                                        {
                                                this.state.totalFeedsSize > 0 &&
                                                <Text style={{
                                                    color: Theme.color.text4,
                                                    fontSize: 18,
                                                    fontFamily: "Roboto-Medium"
                                                }}> {this.state.totalFeedsSize}</Text>
                                            }
                                        </Text>
                                    </View>
                                }
                            </View>
                        }
                        columnWrapperStyle={styles.columnWrapperStyle}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableWithoutFeedback onPress={async () => await this.postClick(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.picture}
                                        />
                                        {/*
                                            <View style={styles.content}>
                                                <Text style={{
                                                    textAlign: 'center',
                                                    fontWeight: '500',
                                                    color: "white",
                                                    fontSize: 21,
                                                    // flexWrap: "wrap"
                                                }}>{item.city}</Text>
                                            </View>
                                            */}
                                        {
                                            item.reviewAdded &&
                                            <View style={{
                                                position: 'absolute',
                                                top: 3,
                                                right: 3,
                                                backgroundColor: 'red',
                                                borderRadius: Cons.redDotWidth / 2,
                                                width: Cons.redDotWidth,
                                                height: Cons.redDotWidth
                                            }} />
                                        }
                                        {
                                            /*
                                            this.state.showPostIndicator === index &&
                                            <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: 'center', alignItems: 'center' }}>
                                                <ActivityIndicator animating size={'small'} color={'white'} />
                                            </View>
                                            */
                                        }
                                    </View>
                                </TouchableWithoutFeedback>
                            );
                        }}
                        // onEndReachedThreshold={0.5}
                        // onEndReached={this.onScrollHandler}
                        onScroll={({ nativeEvent }) => {
                            if (!this.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getUserFeeds();
                            }
                        }}
                        // scrollEventThrottle={1}

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                    /*
                    ListFooterComponent={
                        this.state.isLoadingFeeds &&
                        <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator />
                        </View>
                    }
                    */
                    />
                }

                {
                    this.state.isLoadingFeeds &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    {
                        this.state.dialogType === 'pad' &&
                        <Dialog.Input
                            keyboardType={'phone-pad'}
                            // keyboardAppearance={'dark'}
                            onChangeText={(text) => this.setState({ dialogPassword: text })}
                            autoFocus={true}
                            secureTextEntry={true}
                        />
                    }
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>
            </View>
        );
    } // end of render()

    handleRefresh = () => {
        /*
        this.setState(
            {
                refreshing: true
            },
            () => {
                if (Vars.userFeedsChanged) Vars.userFeedsChanged = false;

                // reload from the start
                this.lastChangedTime = 0;
                this.getUserFeeds();
            }
        );
        */

        // if (this.state.isLoadingFeeds) return;

        if (this.state.refreshing) return;

        this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getUserFeeds();

        // if (Vars.userFeedsChanged) Vars.userFeedsChanged = false;

        this.setState({ refreshing: false });
    }

    // open admin menu
    openAdmin() {
        if (!this.adminCount) {
            this.adminCount = 1;
            return;
        } else {
            this.adminCount++;
        }

        if (this.adminCount > 9) {
            // open pw menu
            this.openDialog('pad', 'Admin Login', 'Type an administrator password', null);

            this.adminCount = undefined;
        }
    }

    openDialog(type, title, message, callback) {
        this.setState({ dialogType: type, dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        // --
        if (this.state.dialogType === 'pad') this.setState({ dialogPassword: '' });
        // --

        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        // --
        if (this.state.dialogType === 'pad') {
            const pw = this.state.dialogPassword;
            if (pw === '1103') {

                setTimeout(() => {
                    if (this.closed) return;
                    this.props.navigation.navigate("admin");
                }, Cons.buttonTimeoutShort);
            }

            this.setState({ dialogPassword: '' });
        }
        // --

        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
    }

    /*
    checkUpdateOnCustomerReview() {
        const { profileStore } = this.props;
        const { profile } = profileStore;

        if (profile) {
            if (profile.commentAdded) {
                return true;
            }
        }

        return false;
    }
    */

    // copied from Loading.js
    checkUpdateOnUserFeed() {
        // 내가 올린 post에 리뷰가 달린 경우만 체크!

        const { profileStore } = this.props;
        const { profile } = profileStore;

        if (!profile) return false;

        // check reviews on my post
        let result = false;

        const feeds = profile.feeds;
        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            if (feed.reviewAdded) {
                // const saved = this.reviewAddedFeedHashTable[i];
                const saved = this.reviewAddedFeedHashTable.has(feed.feedId);
                if (saved) { // saved. means already applied.
                    // skip
                } else {
                    // this.reviewAddedFeedHashTable[i] = 1;
                    this.reviewAddedFeedHashTable.set(feed.feedId, 1);
                    result = true;
                }
            }
        }

        return result;
    }

    checkUpdateOnReview() {
        // Girls You've Reviewed
        // customer의 경우, 내가 쓴 review에 답글이 달린 경우

        const { profileStore } = this.props;
        const { profile } = profileStore;

        if (!profile) return false;

        // check replies on my review
        const reviews = profile.reviews;
        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            if (review.replyAdded) {
                return true;
            }
        }

        return false;
    }

    uploadPicture() {
        if (this.state.onUploadingImage) return;

        this.pickImage();
    }

    async pickImage() {
        const { status: existingCameraStatus } = await Permissions.getAsync(Permissions.CAMERA);
        const { status: existingCameraRollStatus } = await Permissions.getAsync(Permissions.CAMERA_ROLL);

        if (existingCameraStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA);
            if (status !== 'granted') {
                // ToDo: show notification
                return;
            }
        }

        if (existingCameraRollStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                // ToDo: show notification
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1], // ToDo: android only! (only square image in IOS)
            quality: 1.0
        });

        console.log('result of launchImageLibraryAsync:', result);

        if (!result.cancelled) {

            this.openDialog('alert', 'Edit profile', 'Are you sure you want to change your profile picture?', async () => {

                this.setState({ onUploadingImage: true });

                // show indicator & progress bar
                this.showFlash('Uploading...', 'Your picture is now uploading.', result.uri);

                // upload image
                this.uploadImage(result.uri, async (uri) => {
                    if (!uri) {
                        this.setState({ onUploadingImage: false });
                        return;
                    }

                    // this.setState({ uploadImageUri: uri });

                    const ref = 'images/' + Firebase.user().uid + '/profile/' + result.uri.split('/').pop();
                    /*
                    this.uploadImageRef = ref;

                    this.imageRefs.push(ref);
                    */

                    // update database
                    await this.updateProfilePicture(uri, ref);

                    // hide indicator & progress bar
                    this.setState({ flashMessageTitle: 'Success!', flashMessageSubtitle: 'Your picture uploaded successfully.' });
                    setTimeout(() => {
                        if (this.closed) return;
                        this.hideFlash();
                        this.setState({ onUploadingImage: false });
                    }, 1500);
                });

            });

        }
    }

    async uploadImage(uri, cb) {
        const fileName = uri.split('/').pop();
        var ext = fileName.split('.').pop();

        if (!Util.isImage(ext)) {
            const msg = 'Invalid image file (' + ext + ').';
            this.showNotification(msg);
            return;
        }

        var type = Util.getImageType(ext);
        // console.log('file type:', type);

        const formData = new FormData();
        // formData.append("type", "post");
        formData.append("type", "profile");

        formData.append("image", {
            uri,
            name: fileName,
            type: type
        });
        formData.append("userUid", Firebase.user().uid);
        // formData.append("pictureIndex", index);

        try {
            let response = await fetch(SERVER_ENDPOINT + "uploadFile/images",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data"
                    },
                    body: formData
                }
            );

            let responseJson = await response.json();
            console.log('uploadImage, responseJson', responseJson);

            // console.log('responseJson', await response.json());

            cb(responseJson.downloadUrl);
        } catch (error) {
            console.error(error);

            this.showNotification('An error happened. Please try again.');

            cb(null);
        }
    }

    // flash
    showFlash(title, subtitle, image) {
        if (this._showNotification) {
            this.hideNotification();
        }

        this._showFlash = true;

        this.setState({ flashMessageTitle: title, flashMessageSubtitle: subtitle, flashImage: image }, () => {
            this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.state.flashOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.flashOffset, {
                        toValue: Constants.statusBarHeight,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideFlash() {
        this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.state.flashOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.state.flashOffset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showFlash = false; });
        });
    }

    async updateProfilePicture(uri, ref) {
        const { profile } = this.props.profileStore;

        if (profile.picture.ref) {
            const ref = profile.picture.ref;
            Firebase.removeProfilePictureRef(ref);
        }

        let data = {};
        data.picture = {
            uri,
            ref
        };

        await Firebase.updateProfile(profile.uid, data);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        paddingBottom: 14,
        // flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    columnWrapperStyle: {
        flex: 1,
        // justifyContent: 'center'
        justifyContent: 'flex-start'
    },
    pictureContainer: {
        width: (Dimensions.get('window').width - 2 * 6) / 3,
        height: (Dimensions.get('window').width - 2 * 6) / 3,
        marginVertical: 2,
        marginHorizontal: 2,
        borderRadius: 2
    },
    picture: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    },
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        justifyContent: 'center',

        borderRadius: 2,
    },
    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    },
    infoContainer: {
        flex: 1,
        // width: '100%',
        paddingBottom: Theme.spacing.tiny
    },
    /*
    bodyInfoTitle: {
        color: 'white',
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        paddingTop: Theme.spacing.base
    },
    bodyInfoContent: {
        color: 'white',
        fontSize: 18,
        fontFamily: "Roboto-Bold",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },
    */
    infoText1: {
        color: Theme.color.text2,
        fontSize: 17,
        fontFamily: "Roboto-Medium",
        paddingTop: Theme.spacing.base
    },
    infoText2: {
        color: Theme.color.text3,
        fontSize: 15,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },
    notification: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        height: (8 + 34 + 8) - 12,
        borderRadius: 5,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.notification,
        zIndex: 10000,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    notificationText: {
        width: Dimensions.get('window').width - (12 + 24) * 2, // 12: margin right, 24: button width
        fontSize: 15,
        lineHeight: 17,
        fontFamily: "Roboto-Medium",
        color: "black",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    flash: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        // height: Cons.searchBarHeight,
        height: (8 + 34 + 8),
        position: "absolute",
        borderRadius: 5,
        top: 0,
        backgroundColor: Theme.color.selection,
        zIndex: 10001,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.base
        // paddingTop: Constants.statusBarHeight
    },
    flashMessageTitle: {
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: "white"
    },
    flashMessageSubtitle: {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: "white"
    }
});
