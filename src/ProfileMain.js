import autobind from "autobind-decorator";
import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image,
    TouchableWithoutFeedback, Animated, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import SmartImage from "./rnff/src/components/SmartImage";
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons, MaterialIcons } from "react-native-vector-icons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Text, Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
// import { unregisterExpoPushToken } from './PushNotifications';
import { NavigationActions } from 'react-navigation';
import { RefreshIndicator } from "./rnff/src/components";
import Dialog from "react-native-dialog";
import Util from "./Util";
import ProfileStore from "./rnff/src/home/ProfileStore";
import Intro from './Intro';
import ChatMain from './ChatMain';
import * as WebBrowser from 'expo-web-browser';

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 9; // 3 x 3

const avatarWidth = Dimensions.get('window').height / 11;

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<InjectedProps> {
    state = {
        // renderFeed: false,
        // showIndicator: false,

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        // showPostIndicator: -1,

        replyAdded: false,

        notification: '',

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert',
        dialogPassword: '',

        onUploadingImage: false,
        // uploadImageUri: null,

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null // uri
    };

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);

        this.flashOpacity = new Animated.Value(0);
        this.flashOffset = new Animated.Value((8 + 34 + 8) * -1);

        // this.reload = true;
        this.lastLoadedFeedIndex = -1;
        // this.lastChangedTime = 0;

        this.lastCommentsUpdatedTime = 0;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];

        // this.imageRefs = []; // for cleaning files in server
    }

    componentDidMount() {
        console.log('jdub', 'ProfileMain.componentDidMount');

        this.props.navigation.setParams({
            scrollToTop: () => {
                this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        });

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.props.profileStore.setFeedsUpdatedCallback(this.onFeedsUpdated); // user post add / remove detection
        this.props.profileStore.setReviewAddedOnFeedCallback(this.onReviewAddedOnFeed);
        this.props.profileStore.setReplyAddedOnReviewCallback(this.onReplyAddedOnReview);

        this.getUserFeeds();

        this.checkReplyOnReview();
    }

    componentWillUnmount() {
        console.log('jdub', 'ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.props.profileStore.unsetFeedsUpdatedCallback(this.onFeedsUpdated);
        this.props.profileStore.unsetReviewAddedOnFeedCallback(this.onReviewAddedOnFeed);
        this.props.profileStore.unsetReplyAddedOnReviewCallback(this.onReplyAddedOnReview);

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
            console.log('jdub', 'clean image files');

            const formData = new FormData();
            for (let i = 0; i < this.imageRefs.length; i++) {
                const ref = this.imageRefs[i];

                const number = i + 1;
                const fieldName = 'file' + number.toString();
                formData.append(fieldName, ref);

                console.log('jdub', fieldName, ref);
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
        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        // this.props.navigation.dispatch(NavigationActions.back());
        BackHandler.exitApp();

        return true;
    }

    @autobind
    onFeedsUpdated() {
        console.log('jdub', 'ProfileMain.onFeedsUpdated');

        // reload from the start
        /*
        this.lastLoadedFeedIndex = -1;
        this.getUserFeeds();
        */
        const { profileStore } = this.props;
        const { profile } = profileStore;
        const length = profile.feeds.length;
        let count = length - this.lastLoadedFeedIndex;
        if (count < DEFAULT_FEED_COUNT) count = DEFAULT_FEED_COUNT;

        this.lastLoadedFeedIndex = -1;
        this.getUserFeeds(count);
    }

    @autobind
    onReviewAddedOnFeed() {
        console.log('jdub', 'ProfileMain.onReviewAddedOnFeed');

        // reload from the start
        const { profileStore } = this.props;
        const { profile } = profileStore;
        const length = profile.feeds.length;
        let count = length - this.lastLoadedFeedIndex;
        if (count < DEFAULT_FEED_COUNT) count = DEFAULT_FEED_COUNT;

        this.lastLoadedFeedIndex = -1;
        this.getUserFeeds(count);
    }

    @autobind
    onReplyAddedOnReview() {
        console.log('jdub', 'ProfileMain.onReplyAddedOnReview');

        !this.closed && this.setState({ replyAdded: true });
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'ProfileMain';

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    /*
    @autobind
    onScrollHandler() {
        console.log('jdub', 'ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }
    */

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    getUserFeeds(count = DEFAULT_FEED_COUNT) {
        if (this.state.isLoadingFeeds) return;

        const { profile } = this.props.profileStore;
        if (!profile) return;

        const feeds = profile.feeds;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            this.setState({ feeds: [] });
            return;
        }

        /*
        // check update
        const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }
        */

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.setState({ isLoadingFeeds: true });

        console.log('jdub', 'ProfileMain', 'loading feeds ...');

        let newFeeds = [];

        /*
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }
        */
        let reload = false;
        let startIndex = 0;
        if (this.lastLoadedFeedIndex === -1) {
            reload = true;
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let _count = 0;

        for (let i = startIndex; i >= 0; i--) {
            if (_count >= count) break;

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
                    if (newFeed === null) return; // error

                    if (newFeed === undefined) {
                        this.feedList.delete(feedId);
                        return;
                    }

                    // update this.feedList
                    this.feedList.set(feedId, newFeed);

                    // update picture
                    let changed = false;

                    let feeds = [...this.state.feeds];
                    const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.feedId === newFeed.id);
                    if (index !== -1) {
                        if (feeds[index].picture !== newFeed.pictures.one.uri) changed = true;

                        feeds[index].picture = newFeed.pictures.one.uri;
                        !this.closed && this.setState({ feeds });
                    }

                    // update database
                    if (changed) Firebase.updateUserFeed(Firebase.user().uid, placeId, feedId, newFeed.pictures.one.uri);
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
                    if (newPlace === null) return; // error

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

            _count++;
        }

        if (reload) this.setState({ feeds: newFeeds });
        else this.setState({ feeds: [...this.state.feeds, ...newFeeds] });

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false });
        }, 250);

        console.log('jdub', 'ProfileMain', 'loading feeds done!');
    }

    postClick(item) {
        // red dot
        if (item.reviewAdded) {
            // update reviewAdded in user profile
            const { profile } = this.props.profileStore;
            if (!profile) return;

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

        this.openPost(item);
    }

    openPost(item) {
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
            // this should never happen
            // this.refs["toast"].show('The post no longer exists.', 500);
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

        Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
        this.props.navigation.navigate("postPreview", { post: post, extra: extra, from: 'Profile' });

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
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
        };

        const flashStyle = {
            opacity: this.flashOpacity,
            transform: [{ translateY: this.flashOffset }]
        };

        const { profile } = this.props.profileStore;
        if (!profile) return null;

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
        let nameFontSize = 28;
        let nameLineHeight = 32;

        if (!picture) {
            _avatarName = Util.getAvatarName(name);
            _avatarColor = Util.getAvatarColor(uid);

            if (_avatarName.length === 1) {
                nameFontSize = 30;
                nameLineHeight = 34;
            } else if (_avatarName.length === 2) {
                nameFontSize = 28;
                nameLineHeight = 32;
            } else if (_avatarName.length === 3) {
                nameFontSize = 26;
                nameLineHeight = 30;
            }
        }

        // const replyAdded = this.checkUpdateOnReview();
        const replyAdded = this.state.replyAdded;

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
                    {/* admin button */}
                    <TouchableOpacity activeOpacity={1} onPress={() => this.openAdmin()}>
                        <Text style={{
                            color: Theme.color.text1,
                            fontSize: 20,
                            fontFamily: "Roboto-Medium",
                            alignSelf: 'flex-start',
                            marginLeft: 16
                        }}>Profile</Text>
                    </TouchableOpacity>

                    {/* settings button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            if (!profile) return;

                            setTimeout(() => {
                                if (this.closed) return;
                                this.props.navigation.navigate("settings");
                            }, Cons.buttonTimeout);
                        }}
                    >
                        <Feather name='settings' color='rgba(255, 255, 255, 0.8)' size={20} />
                    </TouchableOpacity>
                </View>

                {
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                        }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={styles.infoContainer}>
                                    {/* avatar view */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!profile) return;

                                            setTimeout(() => {
                                                if (this.closed) return;
                                                Firebase.updateCommentChecked(uid, false);
                                                this.props.navigation.navigate("editProfile");
                                            }, Cons.buttonTimeout);
                                        }}
                                    >
                                        <View style={{
                                            width: '100%', height: Dimensions.get('window').height / 8,
                                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <View style={{ marginTop: Cons.redDotWidth / 2, alignSelf: 'flex-start' }}>
                                                        <Text style={{ fontSize: 24, lineHeight: 28, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
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
                                                            <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
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

                                        {/* Girls You've Reviewed / Posts You've Commented */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
                                                    if (this.closed) return;
                                                    this.setState({ replyAdded: false });
                                                    this.props.navigation.navigate("reviewGirls");
                                                }, Cons.buttonTimeout);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: 40,
                                                // justifyContent: 'center', paddingLeft: 2
                                                flexDirection: 'row', alignItems: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 20, lineHeight: 24, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>
                                                    {Platform.OS === 'android' ? "Girls You've Reviewed" : "Posts You've Commented"}
                                                </Text>
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

                                        {/* Advertise Yourself or Your Girls / Create a New Post */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
                                                    if (this.closed) return;
                                                    this.props.navigation.navigate("advertisement");
                                                }, Cons.buttonTimeout);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: 40,
                                                justifyContent: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 20, lineHeight: 24, color: '#f1c40f', fontFamily: "Roboto-Regular" }}>
                                                    {Platform.OS === 'android' ? 'Advertise Yourself or Your Girls' : 'Create a New Post'}
                                                </Text>
                                                <MaterialIcons name='add-to-photos' color={'#f1c40f'} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Customers You've Reviewed / Users You've Commented */}
                                        {
                                            comments && comments.length > 0 &&
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!profile) return;

                                                    setTimeout(() => {
                                                        if (this.closed) return;
                                                        this.props.navigation.navigate("reviewCustomers");
                                                    }, Cons.buttonTimeout);
                                                }}
                                            >
                                                <View style={{
                                                    width: '100%', height: 40,
                                                    // justifyContent: 'center', paddingLeft: 2
                                                    flexDirection: 'row', alignItems: 'center', paddingLeft: 2
                                                }}>
                                                    <Text style={{ fontSize: 20, lineHeight: 24, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>
                                                        {Platform.OS === 'android' ? "Customers You've Reviewed" : "Users You've Commented"}
                                                    </Text>
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

                                        {/* Settings */}
                                        {/*
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
                                                    if (this.closed) return;
                                                    this.props.navigation.navigate("settings");
                                                }, Cons.buttonTimeout);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: 40,
                                                justifyContent: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 20, lineHeight: 24, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{'Settings'}</Text>
                                                <Feather name='settings' color={Theme.color.text2} size={23} style={{ position: 'absolute', right: 1 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                        */}

                                        {/* Terms of Service */}
                                        {/*
                                        <TouchableOpacity
                                            onPress={async () => {
                                                const URL = `https://rowena-88cfd.web.app/terms.html`;
                                                let result = await WebBrowser.openBrowserAsync(URL);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: 40,
                                                justifyContent: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 20, lineHeight: 24, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Terms of Service'}</Text>
                                                <Feather name='book' color={Theme.color.text3} size={22} style={{ position: 'absolute', right: 1 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                        */}

                                        {/* Log out */}
                                        {/*
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                this.openDialog('alert', 'Log Out', 'Are you sure you want to log out?', async () => {
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
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: 40,
                                                justifyContent: 'center', paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 20, lineHeight: 24, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Log Out'}</Text>
                                                <AntDesign name='logout' color={Theme.color.text3} size={22} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                        */}
                                    </View>

                                </View>

                                {/* VERSION | Your Posts */}
                                {
                                    /*
                                    this.state.totalFeedsSize === 0 &&
                                    <View style={{
                                        width: '100%', height: 40,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <TouchableOpacity onPress={() => {
                                            // nothing to do
                                        }}>
                                            <Text style={{ fontSize: 16, color: Theme.color.text4, fontFamily: "Roboto-Light" }}>VERSION {Cons.version} ({Cons.buildNumber})</Text>
                                        </TouchableOpacity>
                                    </View>
                                    */
                                }
                                {
                                    this.state.totalFeedsSize > 0 &&
                                    <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                                        <Text style={styles.title}>
                                            {'Your posts'}
                                            {
                                                this.state.totalFeedsSize > 0 &&
                                                <Text style={{
                                                    color: Theme.color.text4,
                                                    fontSize: 18,
                                                    fontFamily: "Roboto-Medium"
                                                }}> {Util.numberWithCommas(this.state.totalFeedsSize)}</Text>
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
                                <TouchableWithoutFeedback onPress={() => this.postClick(item)}>
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
                        <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
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

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View>
        );
    } // end of render()

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState({ refreshing: true });

        // reload from the start
        this.lastLoadedFeedIndex = -1;
        this.getUserFeeds();

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
            this.openDialog('pad', 'Log in Admin', 'Type an administrator password', null);

            this.adminCount = undefined;
        }
    }

    showNotification(msg) {
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.offset, {
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
                Animated.timing(this.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
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
                }, Cons.buttonTimeout);
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

    // red dot on Girls You've Reviewed
    checkReplyOnReview() {
        const { profileStore } = this.props;
        const { profile } = profileStore;
        if (!profile) return;

        const reviews = profile.reviews;
        let replyAdded = false;
        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            if (review.replyAdded) {
                replyAdded = true;
                break;
            }
        }

        this.setState({ replyAdded });
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
                Util.openSettings("CAMERA_ROLL");
                return;
            }
        }

        if (existingCameraRollStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                Util.openSettings("CAMERA_ROLL");
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1.0,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });

        console.log('jdub', 'result of launchImageLibraryAsync:', result);

        if (!result.cancelled) {
            const path = result.uri;

            this.openDialog('alert', 'Edit Profile', 'Are you sure you want to change your profile picture?', async () => {

                this.setState({ onUploadingImage: true });

                // show indicator & progress bar
                this.showFlash('Uploading...', 'Your picture is now uploading.', path);

                // upload image
                this.uploadImage(path, async (uri) => {
                    if (!uri) {
                        this.setState({ onUploadingImage: false });
                        return;
                    }

                    // this.setState({ uploadImageUri: uri });

                    const ref = 'images/' + Firebase.user().uid + '/profile/' + path.split('/').pop();
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
        let ext = fileName.split('.').pop();

        if (!Util.isImage(ext)) {
            const msg = 'Invalid image file (' + ext + ').';
            this.showNotification(msg);
            return;
        }

        let type = Util.getImageType(ext);
        // console.log('jdub', 'file type:', type);

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
            console.log('jdub', 'uploadImage, responseJson', responseJson);

            // console.log('jdub', 'responseJson', await response.json());

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
                    Animated.timing(this.flashOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.flashOffset, {
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
                Animated.timing(this.flashOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.flashOffset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showFlash = false; });
        });
    }

    async updateProfilePicture(uri, ref) {
        const { profile } = this.props.profileStore;
        if (!profile) return;

        if (profile.picture.ref) {
            const ref = profile.picture.ref;
            Firebase.removeProfilePictureRef(ref);
        }

        let data = {};
        data.picture = {
            uri,
            ref
        };

        await Firebase.updateProfilePicture(profile.uid, data);
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
