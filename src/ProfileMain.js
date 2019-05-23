import autobind from "autobind-decorator";
import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image,
    NetInfo, TouchableWithoutFeedback, Animated
} from 'react-native';
import { Constants } from "expo";
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

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 9; // 3 x 3

const avatarWidth = Dimensions.get('window').height / 11;


@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<InjectedProps> {
    state = {
        renderFeed: false,
        // showIndicator: false,

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,
        // showPostIndicator: -1,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert',
        dialogPassword: ''
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
        this.onLoading = false;

        this.lastCommentsUpdatedTime = 0;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.networkListener = NetInfo.addEventListener('connectionChange', this.handleConnectionChange);

        this.getUserFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.networkListener.remove();

        for (var i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (var i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        // console.log('ProfileMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.navigate("intro");

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'ProfileMain';

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

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    @autobind
    handleConnectionChange(connectionInfo) {
        // console.log('handleConnectionChange, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
        // console.log('handleConnectionChange', connectionInfo);

        /*
        const msg = 'type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType;
        this.showNotification(msg);
        */

        if (connectionInfo.type === 'none') {
            // disconnected
            this.showNotification('You are currently offline.');

            // ToDo: stop
        } else if (connectionInfo.type !== 'none') {
            // connected
            this.showNotification('You are connected again.');

            // ToDo: resume
        }
    }

    /*
    @autobind
    onScrollHandler() {
        console.log('ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }
    */

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
        }

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: Constants.statusBarHeight + 6,
                            duration: 200
                        })
                    ])
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        this._showNotification = false;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    getUserFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        if (!profile) return;

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

        this.onLoading = true;

        console.log('ProfileMain', 'loading feeds...');

        this.setState({ isLoadingFeeds: true });

        let newFeeds = [];

        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (var i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const feed = feeds[i];

            newFeeds.push(feed);



            // subscribe here (post)
            // --
            const placeId = feed.placeId;
            const feedId = feed.feedId;

            const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                if (newFeed === undefined) {
                    this.feedList.delete(feedId);

                    return;
                }

                console.log('feed subscribed', newFeed);

                // update this.feedList
                this.feedList.set(feedId, newFeed);

                // update picture
                let feeds = [...this.state.feeds];
                const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.feedId === newFeed.id);
                if (index !== -1) {
                    feeds[index].picture = newFeed.pictures.one.uri;
                    this.setState({ feeds });
                }
            });

            this.feedsUnsubscribes.push(fi);
            // --

            // subscribe here (count)
            // --
            const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                if (newPlace === undefined) {
                    this.feedCountList.delete(placeId);

                    return;
                }

                console.log('count subscribed');

                // update this.feedCountList
                this.feedCountList.set(placeId, newPlace.count);
            });

            this.countsUnsubscribes.push(ci);
            // --



            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({
                // isLoadingFeeds: false, feeds: newFeeds, refreshing: false
                isLoadingFeeds: false,
                feeds: newFeeds, // refreshing: false
            });
        } else {
            this.setState({
                // isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds], refreshing: false
                isLoadingFeeds: false,
                feeds: [...this.state.feeds, ...newFeeds], // refreshing: false
            });
        }

        /*
        setTimeout(() => {
            this.setState({ isLoadingFeeds: false });
        }, 1000);
        */

        console.log('ProfileMain', 'loading feeds done!');

        this.onLoading = false;
    }

    async postClick(item) {
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
                this.refs["toast"].show('The post does not exist.', 500);

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
        const feeds = [...this.state.feeds];
        const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
        if (index === -1) {
            this.refs["toast"].show('The post does not exist.', 500);

            return;
        }

        // this.setState({ showPostIndicator: index });

        const post = this.getPost(item);
        if (!post) {
            // this.refs["toast"].show('The post has been removed by its owner.', 500); // never happen!
            // we skip here. It'll update state feeds on onfocus event.

            this.refs["toast"].show('Please try again.', 500);

            return;
        }

        const feedSize = this.getFeedSize(item.placeId);
        if (feedSize === 0) {
            this.refs["toast"].show('Please try again.', 500);

            return;
        }

        const extra = {
            feedSize: feedSize
        };

        console.log('post', post);
        // setTimeout(() => {
        this.props.navigation.navigate("postPreview", { post: post, extra: extra, from: 'Profile' });
        // }, Cons.buttonTimeoutShort);

        // hide indicator
        // this.setState({ showPostIndicator: -1 });
    }

    getPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;

        /*
        if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
            console.log('post from memory');
            return this.feedList.get(feedId);
        }

        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (!feedDoc.exists) return null;

        const post = feedDoc.data();

        this.feedList.set(feedId, post);

        // subscribe here
        // --
        const instance = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) { // newFeed === undefined if removed
                this.feedList.delete(feedId);

                return;
            }

            // update this.feedList
            this.feedList.set(feedId, newFeed);
        });

        this.feedsUnsubscribes.push(instance);
        // --
        */

        let post = null;
        if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
            post = this.feedList.get(feedId);
        }

        return post;
    }

    async getFeedSize(placeId) {
        /*
        if (this.feedCountList.has(placeId)) {
            console.log('count from memory');
            return this.feedCountList.get(placeId);
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        // if (!placeDoc.exists) return 0; // never happen

        const count = placeDoc.data().count;

        this.feedCountList.set(placeId, count);

        // subscribe here
        // --
        const instance = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCountList.delete(placeId);

                return;
            }

            // update this.feedCountList
            this.feedCountList.set(placeId, newPlace.count);
        });

        this.countsUnsubscribes.push(instance);
        // --
        */

        let count = 0;
        if (this.feedCountList.has(placeId)) {
            count = this.feedCountList.get(placeId);
        }

        return count;
    }

    render() {
        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const { profile } = this.props.profileStore;

        let uid = null;
        let name = null;
        let email = null;
        let phoneNumber = null;
        let picture = null;
        let comments = null;
        let commentAdded = false;

        let avatarName = 'Anonymous';

        if (profile) {
            uid = profile.uid;
            name = profile.name;
            email = profile.email;
            phoneNumber = profile.phoneNumber;
            picture = profile.picture.uri;
            comments = profile.comments;
            commentAdded = profile.commentAdded;

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
        }

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

                <View style={styles.searchBar}>

                    <TouchableOpacity activeOpacity={1.0}
                        onPress={() => this.openAdmin()}
                    >
                        <Text
                            style={{
                                color: Theme.color.text1,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                                alignSelf: 'flex-start',
                                marginLeft: 16
                            }}
                        >Profile</Text>
                    </TouchableOpacity>

                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={styles.infoContainer}>
                                    {/* avatar view */}
                                    <TouchableOpacity
                                        style={{ marginTop: 20 }}
                                        onPress={() => {
                                            if (!profile) return;

                                            setTimeout(() => {
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
                                                    <View style={{ marginTop: Cons.badgeWidth / 2, alignSelf: 'flex-start' }}>
                                                        <Text style={{ paddingTop: 4, fontSize: 24, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
                                                            {avatarName}
                                                        </Text>
                                                    </View>
                                                    {
                                                        commentAdded &&
                                                        <View style={{
                                                            marginLeft: Cons.badgeWidth / 2,
                                                            backgroundColor: 'red',
                                                            borderRadius: Cons.badgeWidth / 2,
                                                            width: Cons.badgeWidth,
                                                            height: Cons.badgeWidth
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
                                                    if (!profile) return;

                                                    setTimeout(() => {
                                                        // ToDo: open picture

                                                    }, Cons.buttonTimeoutShort);
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
                                                        <Image
                                                            style={{
                                                                backgroundColor: 'black', tintColor: 'white', width: avatarWidth, height: avatarWidth,
                                                                borderRadius: avatarWidth / 2, borderColor: 'black', borderWidth: 1,
                                                                resizeMode: 'cover'
                                                            }}
                                                            source={PreloadImage.user}
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
                                                    this.props.navigation.navigate("checkReview");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{"Girls You've Reviewed"}</Text>
                                                <AntDesign name='staro' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Advertise Yourself or Your Friends */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (!profile) return;

                                                setTimeout(() => {
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
                                                        this.props.navigation.navigate("checkComment");
                                                    }, Cons.buttonTimeoutShort);
                                                }}
                                            >
                                                <View style={{
                                                    width: '100%', height: Dimensions.get('window').height / 14,
                                                    justifyContent: 'center',
                                                    paddingLeft: 2
                                                }}>
                                                    <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{"Customers You've Reviewed"}</Text>
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
                                                    // unsubscribe profile
                                                    this.props.profileStore.final();

                                                    // init & unsubscribe
                                                    Intro.final();

                                                    await Firebase.signOut(profile.uid);
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

                                                    // 4. remove token (tokens - uid)
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
                                    (this.state.totalFeedsSize > 0) &&
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>Your post ({this.state.totalFeedsSize})</Text>
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
                                                borderRadius: Cons.badgeWidth / 2,
                                                width: Cons.badgeWidth,
                                                height: Cons.badgeWidth
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
                            if (!this.state.focused) return;

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
        if (this.onLoading) return;

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

    // copied from Loading.js
    checkUpdateOnUserFeed() { // User Feed 업데이트만 체크!
        // 1. owner의 경우, 내가 올린 post에 리뷰가 달린 경우
        // 2. customer의 경우, 내가 쓴 review에 답글이 달린 경우
        // 3. customer의 경우, Customer Review에 새 리뷰가 달린 경우 - skip here!


        // 1.
        const { profileStore } = this.props;
        const { profile } = profileStore;

        if (!profile) return false;

        const feeds = profile.feeds;
        for (var i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            if (feed.reviewAdded) {
                return true;
            }
        }

        // check 2
        const reviews = profile.reviews;
        for (var i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            if (review.replyAdded) {
                return true;
            }
        }

        return false;
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
        paddingBottom: 4,
        flexDirection: 'column',
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
    }
});
