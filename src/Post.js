import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Platform,
    FlatList, TouchableWithoutFeedback, Image, Keyboard, TextInput, StatusBar, BackHandler, Vibration
} from 'react-native';
import Constants from 'expo-constants';
import * as Haptic from 'expo-haptics';
import * as Svg from 'react-native-svg';
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, AntDesign, FontAwesome, MaterialIcons, MaterialCommunityIcons, EvilIcons, Octicons, Entypo } from "react-native-vector-icons";
import { Text, Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from 'moment';
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
// import Swiper from './Swiper';
import SwiperFlatList from './react-native-swiper-flatlist/src/components/SwiperFlatList/SwiperFlatList';
import { AirbnbRating } from './react-native-ratings/src';
import Firebase from "./Firebase";
import autobind from "autobind-decorator";
import { inject, observer } from "mobx-react/native";
import ReviewStore from "./ReviewStore";
import ReadMore from "./ReadMore";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { NavigationActions } from 'react-navigation';
import Dialog from "react-native-dialog";
import _ from 'lodash';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const DEFAULT_REVIEW_COUNT = 3;

const profilePictureWidth = 50;
const replyViewHeight = Dimensions.get('window').height / 9;

// 3:2 image
const imageWidth = Dimensions.get('window').width;
const imageHeight = imageWidth / 3 * 2;

const illustWidth = 2321;
const illustHeight = 1890;

// const bodyInfoItemHeight = Dimensions.get('window').height / 24;
const bodyInfoItemHeight = 32;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const useGoogleMaps = Platform.OS === 'android' ? true : false;


@inject("feedStore", "profileStore")
@observer // for reviewStore
export default class Post extends React.Component<InjectedProps> {
    // static __flatList = null;

    reviewStore: ReviewStore = new ReviewStore();

    state = {
        // from: null,
        post: null,

        isOwner: false,

        writeRating: 0,
        liked: false,
        chartInfo: null,

        reviews: null,

        isModal: false,
        disableContactButton: false,

        showPostLoader: false,

        // lastLogInTime: null,

        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);

        this.feed = null; // subscribe post
        this.feedUnsubscribe = null;

        this.user = null; // subscribe user
        this.userUnsubscribe = null;

        this.itemHeights = {};

        this.springValue = new Animated.Value(1);

        this.contentText = Util.getQuotes();
    }

    /*
    static scrollToTop() {
        Post.__flatList.scrollToOffset({ offset: 0, animated: true });
    }
    */

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { post, extra, from } = this.props.navigation.state.params;
        console.log('jdub', 'Post.componentDidMount, from', from);

        this.init(post, extra);

        if (from === 'Profile' || from === 'ChatRoom') {
            this.setState({ isModal: true });
        } else {
            this.setState({ isModal: false });
        }

        // show contact button
        if (from === 'ChatRoom') this.setState({ disableContactButton: true });
    }

    componentWillUnmount() {
        console.log('jdub', 'Post.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.reviewStore.unsetAddToReviewFinishedCallback(this.onAddToReviewFinished);

        if (this.feedUnsubscribe) {
            this.feedUnsubscribe();
        }

        if (this.userUnsubscribe) {
            this.userUnsubscribe();
        }

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'Post.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        const params = this.props.navigation.state.params;
        if (params) {
            const initFromPost = params.initFromPost;
            if (initFromPost) initFromPost(this.state.post);
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'Post';

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    subscribeToPost(post) {
        // this will be updated in subscribe
        this.feed = post;

        const fi = Firebase.subscribeToFeed(post.d.placeId, post.d.id, newFeed => {
            if (newFeed === null) return; // error

            if (newFeed === undefined) {
                this.feed = null;
                return;
            }

            // console.log('subscribeToFeed, newFeed: ', newFeed);

            this.feed = newFeed;

            // update views & likes
            const { visits, likes } = newFeed.d;

            let newPost = this.state.post;
            newPost.d.visits = visits;
            newPost.d.likes = likes;
            !this.closed && this.setState({ post: newPost });

            // update liked
            let liked = false;
            const uid = Firebase.user().uid;
            for (let i = 0; i < likes.length; i++) {
                const item = likes[i]; // uid
                if (uid === item) {
                    liked = true;
                    break;
                }
            }
            !this.closed && this.setState({ liked });

            // ToDo: update feedStore: No need to update for views & likes
            // const { feedStore } = this.props;
            // feedStore.updateFeed(newPost);
        });

        this.feedUnsubscribe = fi;
    }

    edit() {
        if (!this.feed) {
            // this should never happen
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

        let { post } = this.state;
        if (this.originNote) {
            post.d.note = this.originNote;
        }

        this.props.navigation.navigate("editPostMain", { post });
    }

    initFromWriteReview(result) { // back from rating
        if (Platform.OS === 'android') {
            !this.closed && this.setState({ writeRating: 0 });

            this.refs.rating.setPosition(0); // bug in AirbnbRating
        }

        if (result) {
            this.reloadReviews();
        }
    }

    initFromReadAllReviews() { // back from read all reviews
        this.reloadReviews();
    }

    reloadReviews() {
        this.setState({ reviews: null });
        // init
        this.originReviewList = undefined;
        this.translatedReviewList = undefined;
        this.originReplyList = undefined;
        this.translatedReplyList = undefined;

        // 1. reload reviews
        // const post = this.state.post;
        // const query = Firebase.firestore.collection("places").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        // this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);
        this.reviewStore.loadReviewFromStart(DEFAULT_REVIEW_COUNT);

        // 2. reload review count & calc chart
        const newPost = this.reloadPost();
        const newChart = this.getChartInfo(newPost);
        // !this.closed && this.setState({ post: newPost, chartInfo: newChart }, () => { this.translateNote(); });
        this.setState({ post: newPost, chartInfo: newChart });

        this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
    }

    reloadPost() {
        const post = this.feed;

        // update feedStore
        const { feedStore } = this.props;
        feedStore.updateFeed(post);

        return post;
    }

    getChartInfo(post) {
        const chart = this.state.chartInfo;
        if (!chart) return null;

        const visitCount = post.d.visits.length;
        const totalVisitCount = this.getVisitCount(post.d.visits);
        const visitCountPerDay = this.getVisitCountPerDay(post.d.visits);

        const newChart = {
            cityName: chart.cityName,
            numberOfGirls: chart.numberOfGirls,

            averageRating: post.d.averageRating,
            reviewCount: post.d.reviewCount,
            reviewStats: post.d.reviewStats,
            // ranking: ranking
            visitCount,
            totalVisitCount,
            visitCountPerDay,
            likeCount: post.d.likes.length
        };

        return newChart;
    }

    getVisitCount(visits) {
        if (visits.length === 0) return 0;

        let totalCount = 0;

        for (let i = 0; i < visits.length; i++) {
            const visit = visits[i];
            const count = visit.count;

            totalCount = totalCount + count;
        }

        return totalCount;
    }

    getVisitCountPerDay(visits) {
        if (visits.length === 0) return 0;

        let visitCountPerDay = 0;

        const now = Date.now();

        for (let i = 0; i < visits.length; i++) {
            const visit = visits[i];
            const timestamp = visit.timestamp;

            const difference = now - timestamp;
            // const daysDifference = Math.floor(difference/1000/60/60/24);
            const hoursDifference = Math.floor(difference / 1000 / 60 / 60);

            console.log('jdub', 'hoursDifference', hoursDifference);

            if (hoursDifference <= 24) visitCountPerDay++;
        }

        console.log('jdub', 'total visit count', visits.length, '24 hours visit count', visitCountPerDay);

        return visitCountPerDay;
    }

    init(post, extra) {
        this.setState({ post });

        this.subscribeToPost(post);
        // this.subscribeToProfile(post.uid);

        this.reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        const query = Firebase.firestore.collection("places").doc(post.d.placeId).collection("feed").doc(post.d.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

        const isOwner = this.isOwner(post.d.uid, Firebase.user().uid);
        this.setState({ isOwner });

        // check liked
        const liked = this.checkLiked(post.d.likes);
        this.setState({ liked });

        // chart info

        // 1) city name
        const placeName = post.d.placeName;
        const words = placeName.split(', ');
        const cityName = words[0];

        // 2) statement
        const visitCount = post.d.visits.length;
        const totalVisitCount = this.getVisitCount(post.d.visits);
        const visitCountPerDay = this.getVisitCountPerDay(post.d.visits);

        // count
        let count = 0;
        if (post.d.gender === 'Man') count = extra.placeCounts.men;
        else if (post.d.gender === 'Woman') count = extra.placeCounts.women;
        else count = extra.placeCounts.count - extra.placeCounts.men - extra.placeCounts.women;

        const chart = {
            // cityName: extra.cityName,
            cityName: cityName,
            numberOfGirls: count,
            averageRating: post.d.averageRating,
            reviewCount: post.d.reviewCount,
            reviewStats: post.d.reviewStats, // 5, 4, 3, 2, 1
            // ranking: ranking
            visitCount,
            totalVisitCount,
            visitCountPerDay,
            likeCount: post.d.likes.length
        };

        this.setState({ chartInfo: chart });
    }

    @autobind
    onAddToReviewFinished() {
        console.log('jdub', 'Post.onAddToReviewFinished');

        const { reviews } = this.reviewStore;

        let __reviews = _.cloneDeep(reviews); // deep copy

        !this.closed && this.setState({ reviews: __reviews });
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    @autobind
    async toggleLikes() {
        if (this.toggling) return;

        this.toggling = true;

        const post = this.state.post;

        // check the owner of the post
        if (Firebase.user().uid === post.d.uid) {
            this.refs["toast"].show('Sorry, this is your post.', 500);
            this.toggling = false;
            return;
        }

        // check existence
        if (!this.feed) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            this.toggling = false;
            return;
        }

        let showBadge = false;

        const liked = this.state.liked;
        if (!liked) {
            this.setState({ liked: true });

            this.springValue.setValue(2);

            Animated.spring(this.springValue, {
                toValue: 1,
                friction: 2,
                tension: 1,
                useNativeDriver: true
            }).start();

            // toast
            // this.refs["toast"].show('Saved to ❤', 500);

            // show badge on likes
            showBadge = true;
        } else {
            this.setState({ liked: false });

            // toast
            // this.refs["toast"].show('Removed from ❤', 500);
        }

        // update database
        const uid = Firebase.user().uid;
        const placeId = post.d.placeId;
        const feedId = post.d.id;
        const name = post.d.name;
        const placeName = post.d.placeName;
        // const averageRating = post.d.averageRating;
        // const reviewCount = post.d.reviewCount;
        const uri = post.d.pictures.one.uri;

        const result = await Firebase.toggleLikes(uid, placeId, feedId, name, placeName, uri);
        if (!result) {
            // the post is removed
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            this.toggling = false;
            return;
        }

        if (showBadge) {
            if (Vars.focusedScreen !== 'SavedMain' && Vars.focusedScreen !== 'SavedPlace' && this.props.screenProps.data) this.props.screenProps.data.changeBadgeOnLikes(true, 0);
        }

        // send push notification
        if (!liked) {
            const { profile } = this.props.profileStore;
            const data = {
                // message: profile.name + ' likes your post. ❤',
                message: '',
                placeId: post.d.placeId,
                feedId: post.d.id
            };

            sendPushNotification(uid, profile.name, post.d.uid, Cons.pushNotification.like, data);
        }

        // update state post for likes
        /*
        console.log('jdub', 'update likes to state post');

        let newPost = this.state.post;
        let { likes } = newPost.d;
        const idx = likes.indexOf(uid);
        if (idx === -1) {
            likes.push(uid);
        } else {
            likes.splice(idx, 1);
        }
        newPost.d.likes = likes;

        !this.closed && this.setState({ post: newPost });
        */

        // update feedStore: No need to update for likes
        // const { feedStore } = this.props;
        // feedStore.updateFeed(newPost);

        this.toggling = false;
    }

    checkLiked(likes) {
        let liked = false;

        const uid = Firebase.user().uid;

        for (let i = 0; i < likes.length; i++) {
            const _uid = likes[i];
            if (uid === _uid) {
                liked = true;
                break;
            }
        }

        return liked;
    }

    render() {
        const { from } = this.props.navigation.state.params;

        const notificationStyle = {
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
        };

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
                        }}>
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.searchBar}>
                    {/* close button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                            }

                            const params = this.props.navigation.state.params;
                            if (params) {
                                const initFromPost = params.initFromPost;
                                if (initFromPost) initFromPost(this.state.post);
                            }

                            this.props.navigation.dispatch(NavigationActions.back());
                        }}>
                        {
                            this.state.isModal ?
                                <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                                :
                                <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                        }
                    </TouchableOpacity>

                    {
                        this.state.isOwner && from === 'Profile' ?
                            // edit button (only in modal from Profile)
                            < TouchableOpacity
                                style={{
                                    width: 48,
                                    height: 48,
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    justifyContent: "center", alignItems: "center"
                                }}
                                onPress={() => {
                                    if (this._showNotification) {
                                        this.hideNotification();
                                    }

                                    this.edit();
                                }}>
                                <MaterialCommunityIcons name="square-edit-outline" color="rgba(255, 255, 255, 0.8)" size={24} />
                            </TouchableOpacity>
                            :
                            // like button
                            <TouchableWithoutFeedback onPress={this.toggleLikes}>
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    justifyContent: "center", alignItems: "center"
                                }}>
                                    {
                                        this.state.liked ?
                                            <AnimatedIcon name="md-heart" color="red" size={24} style={{ transform: [{ scale: this.springValue }] }} />
                                            :
                                            <Ionicons name="md-heart-empty" color="rgba(255, 255, 255, 0.8)" size={24} />
                                    }
                                </View>
                            </TouchableWithoutFeedback>
                    }
                </View>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.setState({ showKeyboard: false });
                    }}
                >
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                            // Post.__flatList = fl;
                        }}
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={this.renderListHeaderComponent()}
                    />
                </TouchableWithoutFeedback>
                {
                    this.state.showKeyboard &&
                    <View style={{
                        position: 'absolute',
                        top: this.state.bottomPosition - replyViewHeight,
                        height: replyViewHeight,
                        width: '100%',
                        flexDirection: 'row',
                        // justifyContent: 'center',
                        // alignItems:'center',
                        flex: 1,

                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 10,
                        paddingRight: 0,

                        borderTopWidth: 1,
                        borderTopColor: Theme.color.line,
                        backgroundColor: Theme.color.background
                    }}>

                        <TextInput
                            // ref='reply'
                            ref={(c) => { this._reply = c; }}
                            multiline={true}
                            numberOfLines={2}
                            style={{
                                /*
                                width: '80%',
                                // width: Dimensions.get('window').width * 0.5,
                                height: '90%',
                                */
                                flex: 0.85,
                                borderRadius: 5,

                                // padding: 10, // not working in ios
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingLeft: 10,
                                paddingRight: 10,

                                fontSize: 14, fontFamily: "Roboto-Regular", color: Theme.color.title,

                                textAlignVertical: 'top',

                                backgroundColor: '#212121'
                            }}
                            placeholder={Platform.OS === 'android' ? 'Reply to a review' : 'Reply to a comment'}
                            placeholderTextColor={Theme.color.placeholder}
                            onChangeText={(text) => this.onChangeText(text)}
                            selectionColor={Theme.color.selection}
                            // keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={{
                                // marginLeft: 10,
                                // width: Dimensions.get('window').width * 0.2,
                                /*
                                width: '10%',
                                height: '90%',
                                */
                                flex: 0.15,
                                // borderRadius: 5,
                                // backgroundColor: 'red',

                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={() => this.sendReply()}
                        >
                            <Ionicons name='ios-send' color={Theme.color.selection} size={24} />
                        </TouchableOpacity>
                    </View>
                }

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
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
    }

    renderListHeaderComponent() {
        const post = this.state.post;
        if (!post) return null;

        /*
        let postedTime = '';
        if (Math.abs(moment().diff(post.timestamp, 'minutes')) < 2) {
            postedTime = 'Just posted';
        } else {
            postedTime = 'Posted ' + moment(post.timestamp).fromNow();
        }
        */

        let views = null;
        const visits = this.getVisitCount(post.d.visits);
        if (visits === 0) {
            // views = Platform.OS === 'android' ? 'No views yet' : '0 views';
            views = 'No views yet';
        } else if (visits === 1) {
            views = '1 view';
        } else {
            views = Util.numberWithCommas(visits) + ' views';
        }

        let likes = null;
        const _likes = post.d.likes.length;
        if (_likes === 0) {
            // likes = Platform.OS === 'android' ? 'No likes yet' : '0 likes';
            likes = 'No likes yet';
        } else if (_likes === 1) {
            likes = '1 like';
        } else {
            likes = Util.numberWithCommas(_likes) + ' likes';
        }

        let showSettingsButton = false;

        const distance = Util.getDistance(post.d.location, Vars.location);

        if (distance === '? km away' || distance === '? miles away') showSettingsButton = true;

        const averageRating = post.d.averageRating;

        const integer = Math.floor(averageRating);

        let markerImage = null;
        switch (integer) {
            case 0: markerImage = PreloadImage.emoji0; break;
            case 1: markerImage = PreloadImage.emoji1; break;
            case 2: markerImage = PreloadImage.emoji2; break;
            case 3: markerImage = PreloadImage.emoji3; break;
            case 4: markerImage = PreloadImage.emoji4; break;
            case 5: markerImage = PreloadImage.emoji5; break;
        }

        let color = '#FFFFFF';
        if (post.d.gender === 'Woman') color = 'rgba(212, 112, 174, 0.3)';
        else if (post.d.gender === 'Man') color = 'rgba(76, 169, 174, 0.3)';

        return (
            <View>
                {/* profile pictures */}
                {
                    this.renderSwiper(post)
                }

                <View style={styles.infoContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
                        {/* post date */}
                        {/*
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="clock-outline" color={Theme.color.text2} size={14} />
                            <Text style={{ marginLeft: 6, color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Light" }}>{postedTime}</Text>
                        </View>
                        */}

                        {/* views & likes */}
                        {
                            Platform.OS === 'android' ?
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.views, { marginRight: 4 }]}>{views}</Text>
                                    <Octicons name='primitive-dot' color={Theme.color.title} size={10} style={{ marginHorizontal: 4 }} />
                                    <TouchableOpacity style={{ marginLeft: 4 }} onPress={() => this.props.navigation.navigate("checkLikes", { likes: this.state.post.d.likes })}>
                                        <Text style={styles.likes}>{likes}</Text>
                                    </TouchableOpacity>
                                </View>
                                :
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.views}>{views}</Text>
                                </View>
                        }
                    </View>

                    {/* name */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={styles.name}>{post.d.name}</Text>
                        <Text style={styles.age}>{Util.getAge(post.d.birthday)}</Text>
                        {
                            this.renderPostReportButton()
                        }
                    </View>

                    {/* profile */}
                    {
                        Platform.OS === 'android' &&
                        <View style={{ marginTop: 8, marginBottom: 4, flexDirection: 'row' }}>
                            {
                                post.d.height !== 0 &&
                                <View style={[styles.profileItem, { backgroundColor: color }]}>
                                    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                        <Image
                                            style={{ width: 16, height: 16, tintColor: Theme.color.subtitle, resizeMode: 'cover' }}
                                            source={PreloadImage.ruler}
                                        />
                                    </View>
                                    <Text style={styles.bodyInfoTitle}>{post.d.height} cm</Text>
                                </View>
                            }
                            {
                                post.d.weight !== 0 &&
                                <View style={[styles.profileItem, { backgroundColor: color }]}>
                                    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                        <MaterialCommunityIcons name='scale' color={Theme.color.subtitle} size={16} />
                                    </View>
                                    <Text style={styles.bodyInfoTitle}>{post.d.weight} kg</Text>
                                </View>
                            }
                            <View style={[styles.profileItem, { backgroundColor: color }]}>
                                <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                    <Ionicons name='ios-body' color={Theme.color.subtitle} size={18} />
                                </View>
                                {
                                    this.renderBodyType(post)
                                }
                            </View>
                            <View style={[styles.profileItem, { backgroundColor: color }]}>
                                {
                                    post.d.gender === 'Woman' &&
                                    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                        <Image
                                            style={{ width: 17, height: 17, tintColor: Theme.color.subtitle, resizeMode: 'cover' }}
                                            source={PreloadImage.bra}
                                        />
                                    </View>
                                }
                                {
                                    post.d.gender === 'Man' &&
                                    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                        <Image
                                            style={{ width: 13, height: 13, tintColor: Theme.color.subtitle, resizeMode: 'cover' }}
                                            source={PreloadImage.muscle}
                                        />
                                    </View>
                                }
                                {
                                    post.d.gender === 'Other' &&
                                    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                                        <FontAwesome name='transgender' color={Theme.color.subtitle} size={18} />
                                    </View>
                                }
                                {
                                    this.renderBoobs(post)
                                }
                            </View>
                        </View>
                    }

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 8 }}>
                        <MaterialIcons name='location-on' color={'rgb(255, 68, 68)'} size={19} />
                        <Text style={styles.distance}>{distance}</Text>
                        {
                            showSettingsButton &&
                            <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 6 }}>
                                <TouchableOpacity
                                    style={{
                                        width: 20, height: 20, justifyContent: 'center', alignItems: 'center'
                                    }}
                                    onPress={async () => {
                                        await Util.openSettings("LOCATION");
                                    }}>
                                    <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                                </TouchableOpacity>
                            </View>
                        }
                    </View>

                    {
                        this.renderReview(post)
                    }

                    <TouchableOpacity activeOpacity={0.5}
                        onPress={() => {
                            if (this.originNote) { // means translated
                                this.setOriginNote();
                            } else {
                                this.translateNote();
                            }
                        }}
                    >
                        <Text style={styles.note}>{post.d.note}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                {/* map */}
                <View style={styles.mapContainer}>
                    <Text style={styles.location}>{post.d.location.description}</Text>

                    {
                        Platform.OS === 'android' ?
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    if (this._showNotification) {
                                        this.hideNotification();
                                    }

                                    this.props.navigation.navigate("map", { post: post });
                                }}
                            >
                                <View style={styles.mapView}>
                                    <MapView
                                        ref={map => { this.map = map }}
                                        provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                                        style={styles.map}
                                        // mapPadding={{ left: 0, right: 0, top: 25, bottom: 25 }}
                                        // legalLabelInsets={{ top: 25, bottom: 25 }}
                                        initialRegion={{
                                            longitude: post.d.location.longitude,
                                            latitude: post.d.location.latitude,
                                            latitudeDelta: 0.008,
                                            longitudeDelta: 0.008 * ASPECT_RATIO
                                        }}
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                        rotateEnabled={false}
                                        pitchEnabled={false}
                                    >
                                        <MapView.Marker
                                            coordinate={{
                                                longitude: post.d.location.longitude,
                                                latitude: post.d.location.latitude
                                            }}
                                        // title={'title'}
                                        // description={'description'}
                                        >
                                            <View style={{ width: 32, height: 50 }}>
                                                <Image source={PreloadImage.pin} style={{ tintColor: Theme.color.marker, width: 32, height: 50, resizeMode: 'cover', position: 'absolute', top: 0, left: 0 }} />
                                                <Image source={markerImage} style={{ width: 22, height: 22, resizeMode: 'cover', position: 'absolute', top: 5, left: 5 }} />
                                            </View>
                                        </MapView.Marker>
                                    </MapView>
                                </View>
                            </TouchableWithoutFeedback>
                            :
                            <View style={styles.mapView}>
                                <MapView
                                    onPress={() => {
                                        if (this._showNotification) {
                                            this.hideNotification();
                                        }

                                        this.props.navigation.navigate("map", { post: post });
                                    }}
                                    ref={map => { this.map = map }}
                                    provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                                    style={styles.map}
                                    // mapPadding={{ left: 0, right: 0, top: 25, bottom: 25 }}
                                    // legalLabelInsets={{ top: 25, bottom: 25 }}
                                    initialRegion={{
                                        longitude: post.d.location.longitude,
                                        latitude: post.d.location.latitude,
                                        latitudeDelta: 0.008,
                                        longitudeDelta: 0.008 * ASPECT_RATIO
                                    }}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                >
                                    <MapView.Marker
                                        coordinate={{
                                            longitude: post.d.location.longitude,
                                            latitude: post.d.location.latitude
                                        }}
                                    // title={'title'}
                                    // description={'description'}
                                    >
                                        <View style={{ width: 32, height: 50 }}>
                                            <Image source={PreloadImage.pin} style={{ tintColor: Theme.color.marker, width: 32, height: 50, resizeMode: 'cover', position: 'absolute', top: 0, left: 0 }} />
                                            <Image source={markerImage} style={{ width: 22, height: 22, resizeMode: 'cover', position: 'absolute', top: 5, left: 5 }} />
                                        </View>
                                    </MapView.Marker>
                                </MapView>
                            </View>
                    }
                </View>

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                <View style={styles.reviewsContainer} onLayout={this.onLayoutReviewsContainer}>
                    {
                        this.renderChart(this.state.chartInfo)
                    }
                    {
                        this.renderReviews(this.state.reviews)
                    }
                </View>

                {
                    this.renderWriteReview()
                }

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                <Text style={{
                    // backgroundColor: 'green',
                    width: '85%', alignSelf: 'center',
                    marginTop: Theme.spacing.small,
                    marginBottom: Theme.spacing.small,
                    fontSize: 14, fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                    textAlign: 'center',
                    // lineHeight: 24
                    lineHeight: 20
                }}>{this.contentText}</Text>

                <TouchableOpacity
                    style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: Cons.bottomButtonMarginBottom }]}
                    onPress={async () => {
                        if (this.state.showPostLoader) return;

                        if (this._showNotification) {
                            this.hideNotification();
                        }

                        await this.contact();
                    }}>
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>{'Message ' + post.d.name}</Text>
                    {
                        this.state.showPostLoader &&
                        <ActivityIndicator
                            style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 10002 }}
                            animating={true}
                            size="small"
                            color={Theme.color.buttonText}
                        />
                    }
                </TouchableOpacity>
            </View>
        );
    }

    renderBodyType(post) {
        if (post.d.bodyType === 'Prefer Not to Say' || post.d.bodyType === 'Rather not say') { // 하위호환
            // return <Text style={styles.preferNotToSay}>{post.d.bodyType}</Text>;
            // return <Text style={styles.ratherNotSay}>{'Rather not say'}</Text>;
            return <Text style={styles.bodyInfoTitle}>{'Fit'}</Text>;
        } else {
            return <Text style={styles.bodyInfoTitle}>{post.d.bodyType}</Text>;
        }
    }

    renderBoobs(post) {
        if (post.d.gender === 'Woman') {
            if (post.d.bust === 'Prefer Not to Say' || post.d.bust === 'Rather not say') { // 하위호환
                // return <Text style={styles.preferNotToSay}>{post.d.bust}</Text>;
                // return <Text style={styles.ratherNotSay}>{'Rather not say'}</Text>;
                return <Text style={styles.bodyInfoTitle}>{'B cup'}</Text>;
            } else {
                return <Text style={styles.bodyInfoTitle}>{post.d.bust + ' cup'}</Text>;
            }
        } else if (post.d.gender === 'Man') {
            if (post.d.muscle === 'Prefer Not to Say' || post.d.muscle === 'Rather not say') {
                // return <Text style={styles.preferNotToSay}>{post.d.muscle}</Text>;
                // return <Text style={styles.ratherNotSay}>{'Rather not say'}</Text>;
                return <Text style={styles.bodyInfoTitle}>{'Medium'}</Text>;
            } else {
                return <Text style={styles.bodyInfoTitle}>{Util.getMuscle(post.d.muscle)}</Text>;
            }
        } else if (post.d.gender === 'Other') {
            return <Text style={styles.bodyInfoTitle}>{'Transgender'}</Text>;
        }

        /*
        if (post.d.gender === 'Other' && post.d.bust) {
            if (post.d.bust === 'Prefer Not to Say' || post.d.bust === 'Rather not say') {
                // return <Text style={styles.preferNotToSay}>{post.d.bust}</Text>;
                return <Text style={styles.ratherNotSay}>{'Rather not say'}</Text>;
            } else {
                return <Text style={styles.bodyInfoTitle}>{post.d.bust + ' cup'}</Text>;
            }
        }
        */

        return null;

        /*
        post.d.gender === 'Other' && post.d.muscle &&
        <Text style={styles.bodyInfoTitle}>{Util.getMuscle(post.d.muscle)}</Text>
        */
    }

    renderSwiper(post) {
        let pictures = [];

        let value = post.d.pictures.one.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`one`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            if (post.d.pictures.two.uri) {
                                this.swiper.scrollToIndex({ index: 1, animated: false });
                                if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                                else Vibration.vibrate(10);
                            } else {
                                // right end
                                if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                                else Vibration.vibrate(30);
                            }
                        }
                    }}>
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.d.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollToIndex({ index: 0, animated: false });
                            if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            if (post.d.pictures.three.uri) {
                                this.swiper.scrollToIndex({ index: 2, animated: false });
                                if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                                else Vibration.vibrate(10);
                            } else {
                                // right end
                                if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                                else Vibration.vibrate(30);
                            }
                        }
                    }}>
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.d.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollToIndex({ index: 1, animated: false });
                            if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            if (post.d.pictures.four.uri) {
                                this.swiper.scrollToIndex({ index: 3, animated: false });
                                if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                                else Vibration.vibrate(10);
                            } else {
                                // right end
                                if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                                else Vibration.vibrate(30);
                            }
                        }
                    }}>
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.d.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollToIndex({ index: 2, animated: false });
                            if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}>
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        /*
        // anonymous image
        if (pictures.length === 0) {
            pictures.push(
                <View style={styles.slide} key={`zero`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            if (Platform.OS === 'ios') Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}
                    >
                        <Image
                            style={[styles.item, { backgroundColor: 'black', resizeMode: 'cover' }]}
                            source={PreloadImage.user}
                        />
                    </TouchableOpacity>
                </View>
            );
        }
        */

        return (
            <SwiperFlatList
                ref={(swiper) => this.swiper = swiper}
                pageIndexFontSize={12}
            >
                {pictures}
            </SwiperFlatList>
        );
    }

    renderPostReportButton() {
        return (
            <TouchableOpacity
                style={{
                    width: 20,
                    height: 20,
                    marginLeft: 6,
                    justifyContent: "center", alignItems: "center"
                }}
                onPress={() => {
                    this.reportPost();
                }}
            >
                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
            </TouchableOpacity>
        );
    }

    reportPost() {
        const post = this.state.post;
        if (!post) return null;

        this.openDialog('Report Post', 'Are you sure you want to report and block ' + post.d.name + '?', async () => {
            // report post

            // check the owner of the post
            // if (Firebase.user().uid === post.uid) {
            if (this.state.isOwner) {
                this.refs["toast"].show('Sorry, this is your post.', 500);
                return;
            }

            // check existence
            if (!this.feed) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            // 1. update database (reporters)
            const uid = Firebase.user().uid;
            const placeId = post.d.placeId;
            const feedId = post.d.id;
            // const name = post.name;
            // const placeName = post.d.placeName;
            // const uri = post.d.pictures.one.uri;

            const result = await Firebase.reportPost(uid, placeId, feedId);
            if (!result) {
                // the post is removed
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            // 2. update state post
            let _post = post;
            if (!_post.d.reporters) {
                let reporters = [];
                reporters.push(uid);
                _post.d.reporters = reporters;
            } else {
                _post.d.reporters.push(uid);
            }
            this.setState({ post: _post });

            // 3. update feedStore
            const { feedStore } = this.props;
            feedStore.updateFeed(_post);

            // 4. go back
            this.refs["toast"].show('Thanks for your feedback.', 500, () => {
                if (this.closed) return;

                if (this._showNotification) {
                    this.hideNotification();
                }

                const params = this.props.navigation.state.params;
                if (params) {
                    const initFromPost = params.initFromPost;
                    if (initFromPost) initFromPost(_post);
                }

                this.props.navigation.dispatch(NavigationActions.back());
            });
        });
    }

    renderReviewReportButton(review, index) {
        return (
            <TouchableOpacity
                style={{
                    width: 18,
                    height: 18,
                    marginLeft: 6,
                    justifyContent: "center", alignItems: "center"
                }}
                onPress={() => {
                    this.reportReview(review, index);
                }}
            >
                <Ionicons name='md-alert' color={Theme.color.text5} size={14} />
            </TouchableOpacity>
        );
    }

    reportReview(review, index) {
        const post = this.state.post;
        if (!post) return null;

        this.openDialog('Report Review', 'Are you sure you want to report ' + review.name + '?', async () => {
            // report review

            // 1. update database (reporters)
            const uid = Firebase.user().uid;
            const placeId = post.d.placeId;
            const feedId = post.d.id;
            const reviewId = review.id;

            const result = await Firebase.reportReview(uid, placeId, feedId, reviewId);
            if (!result) {
                // the review is removed
                this.refs["toast"].show('The review has been removed by its owner.', 500);
                return;
            }

            // reload review
            // this.reloadReviews();
            this.hideReview(index, uid);

            this.refs["toast"].show('Thanks for your feedback.', 500);
        });
    }

    hideReview(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.review;
        if (!_review.reporters) {
            let reporters = [];
            reporters.push(uid);
            _review.reporters = reporters;
        } else {
            _review.reporters.push(uid);
        }

        this.setState({ reviews });
    }

    showReview(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.review;

        const idx = _review.reporters.indexOf(uid);
        if (idx !== -1) _review.reporters.splice(idx, 1);

        this.setState({ reviews });
    }

    /*
    renderReplyReportButton(review) {
        return (
            <TouchableOpacity
                style={{
                    width: 18,
                    height: 18,
                    marginLeft: 6,
                    justifyContent: "center", alignItems: "center"
                }}
                onPress={() => {
                    this.reportReply(review);
                }}
            >
                <Ionicons name='md-alert' color={Theme.color.text5} size={14} />
            </TouchableOpacity>
        );
    }

    reportReply(review) { // report Owner
        const post = this.state.post;
        if (!post) return null;

        this.openDialog('Report Reply', 'Are you sure you want to report ' + post.name + '?', async () => {
            // report reply

            // 1. update database (reporters)
            const uid = Firebase.user().uid;
            const placeId = post.placeId;
            const feedId = post.id;

            const reviewId = review.id;
            const replyId = review.reply.id;

            await Firebase.reportReply(uid, placeId, feedId, reviewId, replyId);

            this.refs["toast"].show('Thanks for your feedback.', 500);
        });
    }
    */

    renderReview(post) {
        const averageRating = post.d.averageRating;

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        /*
        let likesCount = 0;
        if (post.d.likes) {
            likesCount = post.d.likes.length;
        }
        */

        if (post.d.reviewCount > 0) {
            if (Platform.OS === 'android') {
                // ratings & reviews
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2, paddingBottom: 8 - 4 }}>
                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={integer}
                                size={16}
                                margin={1}
                            />
                        </View>
                        <Text style={styles.rating}>{number}</Text>
                        <AntDesign style={{ marginLeft: 12, marginTop: 2 }} name='message1' color={Theme.color.title} size={16} />
                        <Text style={styles.reviewCount}>{Util.numberWithCommas(post.d.reviewCount)}</Text>
                    </View>
                );
            } else { // ios
                let reviewCount = "";
                if (post.reviewCount > 1) {
                    reviewCount = Util.numberWithCommas(post.d.reviewCount) + " comments";
                } else {
                    reviewCount = Util.numberWithCommas(post.d.reviewCount) + " comment";
                }

                // likes & reviews
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2, paddingBottom: 8 - 4 }}>
                        {/*
                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={integer}
                                size={16}
                                margin={1}
                            />
                        </View>
                        <Text style={styles.rating}>{number}</Text>
                        */}
                        {/*
                        <Ionicons style={{ marginLeft: 1.5, marginTop: 3 }} name="md-heart-empty" color={Theme.color.title} size={20} />
                        <Text style={[styles.rating, { color: Theme.color.title }]}>{likesCount}</Text>

                        <AntDesign style={{ marginLeft: 12, marginTop: 2 }} name='message1' color={Theme.color.title} size={16} />
                        <Text style={styles.reviewCount}>{Util.numberWithCommas(post.d.reviewCount)}</Text>
                        */}
                        <AntDesign style={{ marginLeft: 1.5, marginRight: 1.5, marginTop: 2 }} name='message1' color={'#f1c40f'} size={16} />
                        <Text style={styles.reviewCount}>{reviewCount}</Text>
                    </View>
                );
            }
        }

        return (
            <View style={{ marginBottom: 9 - 4 }}>
                <View style={{ width: 160, height: 22, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        Platform.OS === 'android' ?
                            <AntDesign style={{ marginTop: 1, marginLeft: 1 }} name='staro' color={'#f1c40f'} size={18} />
                            :
                            <AntDesign style={{ marginTop: 2, marginLeft: 1.5, marginRight: 1.5 }} name='message1' color={'#f1c40f'} size={16} />
                        // <AntDesign style={{ marginTop: 1, marginLeft: 1 }} name='staro' color={'#f1c40f'} size={18} />
                    }

                    <Text style={{
                        // color: '#f1c40f',
                        color: Theme.color.text2,
                        fontSize: 18,
                        fontFamily: "Roboto-Italic",
                        paddingLeft: 5,
                        paddingTop: 2
                    }}>Newly posted</Text>
                </View>
            </View>
        );
    }

    renderChart(data) {
        // this should never happen
        if (!data) return null;

        if (data.reviewCount === 0) {
            return (
                // render illustration
                <View style={{ justifyContent: 'center', alignItems: 'center', /* paddingVertical: Theme.spacing.tiny */ }}>
                    <Text style={{
                        color: 'rgb(221, 184, 128)',
                        fontSize: 24,
                        lineHeight: 28,
                        fontFamily: "Chewy-Regular"
                    }}>{Platform.OS === 'android' ? 'Please write the first review.' : 'Please write the first comment.'}</Text>

                    <Image
                        style={{
                            marginTop: 20,
                            width: illustWidth * 0.06,
                            height: illustHeight * 0.06,
                            resizeMode: 'cover'
                        }}
                        source={PreloadImage.keyboard}
                    />
                </View>
            );
        }

        if (Platform.OS === 'ios') {
            let reviewCountText = '';
            const reviewCount = data.reviewCount;
            if (reviewCount > 1) {
                reviewCountText = reviewCount.toString() + " Comments";
            } else {
                reviewCountText = reviewCount.toString() + " Comment";
            }

            return (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{
                        color: Theme.color.text2,
                        // fontSize: 28,
                        // lineHeight: 34,
                        fontSize: 24,
                        lineHeight: 28,
                        fontFamily: "Roboto-Medium",
                        marginRight: 8
                    }}>{reviewCountText}</Text>
                </View>
            );
        } else {
            const cityName = data.cityName;
            const numberOfGirls = data.numberOfGirls;
            const averageRating = data.averageRating;
            const reviewCount = data.reviewCount;
            const stats = data.reviewStats; // 5
            // const ranking = data.ranking;
            const statement = this.getStatement(data);

            /*
            // const cityName = 'Puerto Vallarta'; // string
            // const numberOfGirls = 10; // number
            const averageRating = 4.2; // number
            const reviewCount = 60; // number, 15+27+14+3+1
            const stats = [
                15, 27, 14, 3, 1
            ];
            // const ranking = 2; // number
            */

            // calc bar size
            let rate = [];
            for (let i = 0; i < stats.length; i++) {
                let value = Math.round(stats[i] / reviewCount * 100);
                let percentage = value.toString() + '%';
                rate[i] = percentage;
            }

            // calc star number (0, 1, 2, 3, 4, 5)
            /*
            const _number = Math.floor(averageRating);
            const _decimal = averageRating - _number; // if 1.0 - 1 = 0 or 0.0 ?
            if (_decimal <= 0.2) {
    
            } else if (0.8 <= _decimal) {
    
            } else {
    
            }
            */

            const integer = Math.floor(averageRating);

            let number = '';
            if (Number.isInteger(averageRating)) {
                number = averageRating + '.0';
            } else {
                number = averageRating.toString();
            }

            let reviewCountText = '';
            if (reviewCount > 1) {
                reviewCountText = "(" + reviewCount.toString() + " Reviews)";
            } else {
                reviewCountText = "(" + reviewCount.toString() + " Review)";
            }

            return (
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{
                            color: Theme.color.text2,
                            fontSize: 28,
                            lineHeight: 34,
                            fontFamily: "Roboto-Medium",
                            // backgroundColor: 'green',
                            marginRight: 8
                        }}>{number}</Text>
                        <View style={{ width: 'auto', alignItems: 'flex-start', marginRight: 12 }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={integer}
                                size={24}
                                margin={2}
                            />
                        </View>
                        <Text style={{
                            // paddingLeft: 5,
                            color: Theme.color.text2,
                            fontSize: 18,
                            lineHeight: 34,
                            fontFamily: "Roboto-Light",
                            // backgroundColor: 'green'
                        }}>{reviewCountText}</Text>
                        {/*
                    <Text style={{
                        color: Theme.color.text2,
                        paddingTop: 6,
                        fontSize: 18,
                        fontFamily: "Roboto-Light",
                        // backgroundColor: 'green'
                    }}>{reviewCountText}</Text>
                    */}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                        {
                            statement.type === 100 &&
                            <View style={{ width: 20, height: 20, justifyContent: "center", alignItems: "center" }}>
                                <Ionicons name='ios-trophy' color={Theme.color.text3} size={16} />
                            </View>
                        }
                        {
                            statement.type === 200 &&
                            <View style={{ width: 20, height: 20, justifyContent: "center", alignItems: "center" }}>
                                <Ionicons name="md-heart" color={Theme.color.text3} size={16} />
                            </View>
                        }
                        {
                            statement.type === 300 &&
                            <View style={{ width: 20, height: 20, justifyContent: "center", alignItems: "center" }}>
                                <Ionicons name='md-people' color={Theme.color.text3} size={16} />
                            </View>
                        }
                        {
                            statement.type === 400 &&
                            <View style={{ width: 20, height: 20, justifyContent: "center", alignItems: "center" }}>
                                <Ionicons name='md-people' color={Theme.color.text3} size={16} />
                            </View>
                        }
                        <Text style={{
                            marginLeft: 4,
                            color: Theme.color.text3,
                            fontSize: 16,
                            fontFamily: "Roboto-Regular",
                            // paddingTop: 12
                        }}>{statement.text}</Text>
                    </View>

                    <View style={{ marginBottom: 18 }}>
                        <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Ionicons name='md-star' color={Theme.color.text4} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText1}>{"5.0"}</Text>
                            <View style={{
                                marginLeft: 10,
                                marginRight: 10,
                                // width: barWidth,
                                flex: 1,
                                height: 14,
                                backgroundColor: Theme.color.chartBarBackground,
                                borderRadius: 14
                            }}>

                                {/* draw bar */}
                                <View style={{
                                    flex: 1,
                                    width: rate[0],

                                    backgroundColor: Theme.color.chartBar,
                                    borderRadius: 14
                                }} />
                            </View>
                            <Text style={styles.ratingText2}>{Util.numberWithCommas(stats[0])}</Text>
                        </View>

                        <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Ionicons name='md-star' color={Theme.color.text4} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText1}>{"4.0"}</Text>
                            <View style={{
                                marginLeft: 10,
                                marginRight: 10,
                                // width: barWidth,
                                flex: 1,
                                height: 14,
                                backgroundColor: Theme.color.chartBarBackground,
                                borderRadius: 14
                            }}>

                                {/* draw bar */}
                                <View style={{
                                    flex: 1,
                                    width: rate[1],

                                    backgroundColor: Theme.color.chartBar,
                                    borderRadius: 14
                                }} />
                            </View>
                            <Text style={styles.ratingText2}>{Util.numberWithCommas(stats[1])}</Text>
                        </View>

                        <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Ionicons name='md-star' color={Theme.color.text4} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText1}>{"3.0"}</Text>
                            <View style={{
                                marginLeft: 10,
                                marginRight: 10,
                                // width: barWidth,
                                flex: 1,
                                height: 14,
                                backgroundColor: Theme.color.chartBarBackground,
                                borderRadius: 14
                            }}>

                                {/* draw bar */}
                                <View style={{
                                    flex: 1,
                                    width: rate[2],

                                    backgroundColor: Theme.color.chartBar,
                                    borderRadius: 14
                                }} />
                            </View>
                            <Text style={styles.ratingText2}>{Util.numberWithCommas(stats[2])}</Text>
                        </View>

                        <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Ionicons name='md-star' color={Theme.color.text4} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText1}>{"2.0"}</Text>
                            <View style={{
                                marginLeft: 10,
                                marginRight: 10,
                                // width: barWidth,
                                flex: 1,
                                height: 14,
                                backgroundColor: Theme.color.chartBarBackground,
                                borderRadius: 14
                            }}>

                                {/* draw bar */}
                                <View style={{
                                    flex: 1,
                                    width: rate[3],

                                    backgroundColor: Theme.color.chartBar,
                                    borderRadius: 14
                                }} />
                            </View>
                            <Text style={styles.ratingText2}>{Util.numberWithCommas(stats[3])}</Text>
                        </View>

                        <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Ionicons name='md-star' color={Theme.color.text4} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText1}>{"1.0"}</Text>
                            <View style={{
                                marginLeft: 10,
                                marginRight: 10,
                                // width: barWidth,
                                flex: 1,
                                height: 14,
                                backgroundColor: Theme.color.chartBarBackground,
                                borderRadius: 14
                            }}>

                                {/* draw bar */}
                                <View style={{
                                    flex: 1,
                                    width: rate[4],

                                    backgroundColor: Theme.color.chartBar,
                                    borderRadius: 14
                                }} />
                            </View>
                            <Text style={styles.ratingText2}>{Util.numberWithCommas(stats[4])}</Text>
                        </View>
                    </View>
                </View>
            );
        }
    }

    getStatement(chart) {
        // 1) #23 of 307 girls in Singapore
        // 2) 38 people called dibs on this girl
        // 3) 40 people are viewing this girl within the past 24 hours
        // 4) 4 people are viewing this girl now

        const cityName = chart.cityName;
        const numberOfGirls = chart.numberOfGirls;
        const averageRating = chart.averageRating;
        const reviewCount = chart.reviewCount;
        // const stats = chart.reviewStats;
        const visitCount = chart.visitCount;
        const totalVisitCount = chart.totalVisitCount;
        const visitCountPerDay = chart.visitCountPerDay;
        const likeCount = chart.likeCount;

        const ranking = this.getRanking(chart); // total post >= 10 & average rating >= 4.0 & 1 <= ranking <= 10

        let gender = null;
        if (this.state.post.d.gender === 'Woman') gender = 'girl';
        else if (this.state.post.d.gender === 'Man') gender = 'guy';
        else gender = 'gay';

        if (ranking !== 0) {
            const type = 100;
            const text = null;
            if (Platform.OS === "android") {
                text = "#" + ranking + " of " + numberOfGirls + " " + gender + "s" + " in " + cityName;
            } else {
                text = "#" + ranking + " of " + numberOfGirls + " posts in " + cityName;
            }

            const result = {
                type, text
            };

            return result;
        }

        if (likeCount >= 10 && visitCountPerDay >= 10) {
            // pick one
            const rn = Math.round(Math.random() * 10) % 2; // 0 ~ 1
            if (rn === 0) {
                // pick like
                const type = 200;
                const text = Platform.OS === 'android' ? likeCount + " people like this " + gender : likeCount + " people like this post";
                const result = {
                    type, text
                };

                return result;
            } else {
                // pick visit
                const type = 300;
                const text = Platform.OS === 'android' ? visitCountPerDay + " people are viewing this " + gender + " within the past 24 hours" : visitCountPerDay + " people are viewing this post within the past 24 hours";
                const result = {
                    type, text
                };

                return result;
            }
        }

        if (likeCount >= 10) {
            const type = 200;
            const text = Platform.OS === 'android' ? likeCount + " people like this " + gender : likeCount + " people like this post";
            const result = {
                type, text
            };

            return result;
        }

        if (visitCountPerDay >= 10) {
            const type = 300;
            const text = Platform.OS === 'android' ? visitCountPerDay + " people are viewing this " + gender + " within the past 24 hours" : visitCountPerDay + " people are viewing this post within the past 24 hours";
            const result = {
                type, text
            };

            return result;
        }

        const type = 400;
        const text = Platform.OS === 'android' ? visitCount + " people viewed this " + gender + " " + totalVisitCount + " times" : visitCount + " people viewed this post " + totalVisitCount + " times";
        const result = {
            type, text
        };

        return result;
    }

    getRanking(chart) { // 1 ~ 10
        const numberOfGirls = chart.numberOfGirls;
        const averageRating = chart.averageRating;
        const reviewCount = chart.reviewCount;
        // const stats = chart.reviewStats;
        const visitCount = chart.visitCount;
        const likeCount = chart.likeCount;

        if (numberOfGirls < 10) return 0;

        if (averageRating < 4) return 0;

        const points = reviewCount + visitCount + likeCount;

        if (averageRating >= 4.8) { // 1 ~ 2
            if (points >= 50) return 1;
            return 2;
        }

        if (averageRating >= 4.6) { // 1 ~ 4
            if (points >= 50) return 1;
            if (points >= 45) return 2;
            if (points >= 40) return 3;
            return 4;
        }

        if (averageRating >= 4.4) { // 1 ~ 6
            if (points >= 50) return 1;
            if (points >= 45) return 2;
            if (points >= 40) return 3;
            if (points >= 35) return 4;
            if (points >= 30) return 5;
            return 6;
        }

        if (averageRating >= 4.2) { // 1 ~ 8
            if (points >= 50) return 1;
            if (points >= 45) return 2;
            if (points >= 40) return 3;
            if (points >= 35) return 4;
            if (points >= 30) return 5;
            if (points >= 25) return 6;
            if (points >= 20) return 7;
            return 8;
        }

        // if (averageRating >= 4.0) { // 1 ~ 10
        if (points >= 50) return 1;
        if (points >= 45) return 2;
        if (points >= 40) return 3;
        if (points >= 35) return 4;
        if (points >= 30) return 5;
        if (points >= 25) return 6;
        if (points >= 20) return 7;
        if (points >= 15) return 8;
        if (points >= 10) return 9;
        return 10;
        // }
    }

    renderReviews(reviews) {
        // if (reviews === undefined) {
        if (!reviews) {
            // render skeleton

            const width = Dimensions.get('window').width - Theme.spacing.small * 2 - 10 * 2;

            let reviewArray = [];

            if (Platform.OS === 'android') {
                for (let i = 0; i < DEFAULT_REVIEW_COUNT; i++) {
                    reviewArray.push(
                        <View style={{ alignItems: 'center', paddingTop: 10 }} key={i}>
                            <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={140 + 10}>
                                <Svg.Rect
                                    x={0}
                                    y={10}
                                    width={100}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={width - 100}
                                    y={11}
                                    width={100}
                                    height={6}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12}
                                    width={'60%'}
                                    height={8}
                                />
                                <Svg.Circle
                                    cx={24}
                                    cy={106}
                                    r={24}
                                />
                                <Svg.Rect
                                    x={24 * 2 + 16}
                                    y={106 - 8 - 6}
                                    width={80}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={24 * 2 + 16}
                                    y={106 + 6}
                                    width={80}
                                    height={8}
                                />
                            </SvgAnimatedLinearGradient>

                            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: width }} />
                        </View>
                    );
                }
            } else { // ios
                for (let i = 0; i < DEFAULT_REVIEW_COUNT; i++) {
                    reviewArray.push(
                        <View style={{ alignItems: 'center', paddingTop: 10 }} key={i}>
                            <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={140 + 10}>
                                <Svg.Rect
                                    x={width - 100}
                                    y={11}
                                    width={100}
                                    height={6}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12}
                                    width={'60%'}
                                    height={8}
                                />
                                <Svg.Circle
                                    cx={24}
                                    cy={106}
                                    r={24}
                                />
                                <Svg.Rect
                                    x={24 * 2 + 16}
                                    y={106 - 8 - 6}
                                    width={80}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={24 * 2 + 16}
                                    y={106 + 6}
                                    width={80}
                                    height={8}
                                />
                            </SvgAnimatedLinearGradient>

                            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: width }} />
                        </View>
                    );
                }
            }

            return (
                <View style={{ paddingBottom: 10, marginBottom: Theme.spacing.tiny }}>
                    {reviewArray}
                </View>
            );
        }

        if (reviews.length === 0) return null;

        let reviewArray = [];

        for (let i = 0; i < reviews.length; i++) {
            if (i >= DEFAULT_REVIEW_COUNT) break;

            const review = reviews[i];

            const reporters = review.review.reporters;
            if (!reporters || reporters.length === 0 || reporters.indexOf(Firebase.user().uid) === -1) {
                // show original
                reviewArray.push(
                    this.renderReviewItemOrigin(review, i)
                );
            } else {
                // show blocked image
                reviewArray.push(
                    this.renderReviewItemBlocked(review, i)
                );
            }
        }

        const reviewCount = this.state.post.d.reviewCount;

        return (
            <View style={styles.reviewContainer}
                onLayout={(e) => {
                    const { y } = e.nativeEvent.layout;
                    this.reviewContainerY = y;
                }}
            >
                {reviewArray}

                {/* Read all ??? reviews button */}
                <TouchableOpacity
                    onPress={() => {
                        if (this._showNotification) {
                            this.hideNotification();
                        }

                        setTimeout(() => {
                            if (this.closed) return;

                            if (!this.feed) {
                                this.refs["toast"].show('The post has been removed by its owner.', 500);
                                return;
                            }

                            this.props.navigation.navigate("readReview",
                                {
                                    reviewStore: this.reviewStore,
                                    isOwner: this.state.isOwner,
                                    placeId: this.props.navigation.state.params.post.d.placeId,
                                    feedId: this.props.navigation.state.params.post.d.id,
                                    initFromReadAllReviews: () => this.initFromReadAllReviews()
                                });
                        }, Cons.buttonTimeout);
                    }}>
                    <View style={{
                        width: '100%', height: Dimensions.get('window').height / 14,
                        justifyContent: 'center',
                        // alignItems: 'center',
                        // backgroundColor: 'blue',
                        // borderTopWidth: 1,
                        // borderBottomWidth: 1,
                        // borderColor: 'rgb(34, 34, 34)'
                    }}>
                        <Text style={{ fontSize: 18, color: '#f1c40f', fontFamily: "Roboto-Regular" }}>
                            {
                                Platform.OS === 'android' ? 'Read all ' + reviewCount.toString() + '+ reviews' : 'Read all ' + reviewCount.toString() + '+ comments'
                            }
                        </Text>
                        <FontAwesome name='chevron-right' color="#f1c40f" size={18} style={{ position: 'absolute', right: 0 }} />
                    </View>
                </TouchableOpacity>

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
            </View>
        );
    }

    renderReviewItemOrigin(review, i) {
        const _profile = review.profile;
        const _review = review.review;
        const ref = _review.id;
        const index = i;
        const reply = _review.reply;

        const isMyReview = this.isOwner(_review.uid, Firebase.user().uid);
        let isMyReply = false;
        if (reply) isMyReply = this.isOwner(reply.uid, Firebase.user().uid);

        let uid, picture, name, place, placeColor, placeFont;

        if (_profile) {
            uid = _profile.uid;
            picture = _profile.picture.uri;
            name = _profile.name;

            place = _profile.place ? _profile.place : 'Not specified';
            placeColor = _profile.place ? Theme.color.text2 : Theme.color.text4;
            placeFont = _profile.place ? "Roboto-Regular" : "Roboto-Italic";
        } else { // user removed
            uid = _review.uid;
            picture = _review.picture;
            name = _review.name;

            place = _review.place ? _review.place : 'Not specified';
            placeColor = _review.place ? Theme.color.text2 : Theme.color.text4;
            placeFont = _review.place ? "Roboto-Regular" : "Roboto-Italic";
        }

        const avatarName = Util.getAvatarName(name);
        const avatarColor = Util.getAvatarColor(uid);
        let nameFontSize = 20;
        let nameLineHeight = 24;

        if (avatarName.length === 1) {
            nameFontSize = 22;
            nameLineHeight = 26;
        } else if (avatarName.length === 2) {
            nameFontSize = 20;
            nameLineHeight = 24;
        } else if (avatarName.length === 3) {
            nameFontSize = 18;
            nameLineHeight = 22;
        }

        return (
            <View key={_review.id} onLayout={(event) => this.onItemLayout(event, index)}>
                {
                    Platform.OS === 'android' ?
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.spacing.xSmall }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                    <AirbnbRating
                                        count={5}
                                        readOnly={true}
                                        showRating={false}
                                        defaultRating={_review.rating}
                                        size={12}
                                        margin={1}
                                    />
                                </View>
                                <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                            </View>

                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>
                        : // ios
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: Theme.spacing.xSmall }}>
                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>
                }

                <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.xSmall }}>
                    <ReadMore
                        numberOfLines={2}
                        onPress={() => {
                            // console.log('jdub', 'onPress');
                            if (!this.originReviewList) this.originReviewList = [];

                            if (this.originReviewList[index]) { // means translated
                                this.setOriginReview(index);
                            } else {
                                this.translateReview(index);
                            }
                        }}
                    >
                        <Text style={styles.reviewText}>{_review.comment}</Text>
                    </ReadMore>
                </View>

                <View style={{ marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        picture ?
                            <SmartImage
                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={picture}
                            />
                            :
                            <View
                                style={{
                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: Theme.color.text2, fontSize: 13, fontFamily: "Roboto-Regular" }}>
                                {name}
                            </Text>
                            {
                                !isMyReview &&
                                this.renderReviewReportButton(_review, index)
                            }
                        </View>

                        <Text style={{
                            marginTop: 4,
                            color: placeColor, fontSize: 13, fontFamily: placeFont
                        }}>
                            {place}
                        </Text>
                    </View>
                </View>
                {
                    isMyReview && !reply &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={{
                                // alignSelf: 'baseline'
                                width: 24, height: 24, justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.removeReview(index)}
                        >
                            <MaterialIcons name='close' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }

                {
                    // comment, id, timestamp, uid
                    reply &&
                    <View style={{
                        marginTop: Theme.spacing.xSmall,
                        paddingTop: Theme.spacing.tiny,
                        paddingBottom: Theme.spacing.tiny,
                        paddingLeft: Theme.spacing.tiny,
                        paddingRight: Theme.spacing.tiny,
                        backgroundColor: Theme.color.highlight, borderRadius: 2
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Theme.spacing.xSmall }}>
                            <Text style={styles.replyOwner}>Owner Response</Text>
                            <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                        </View>

                        <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.xSmall }}>
                            <ReadMore
                                numberOfLines={2}
                                onPress={() => {
                                    if (!this.originReplyList) this.originReplyList = [];

                                    if (this.originReplyList[index]) { // means translated
                                        this.setOriginReply(index);
                                    } else {
                                        this.translateReply(index);
                                    }
                                }}
                            >
                                <Text style={styles.replyComment}>{reply.comment}</Text>
                            </ReadMore>
                        </View>

                        {
                            isMyReply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={{
                                        // alignSelf: 'baseline'
                                        width: 24, height: 24, justifyContent: "center", alignItems: "center"
                                    }}
                                    onPress={() => this.removeReply(index)}
                                >
                                    <MaterialIcons name='close' color={'silver'} size={20} />
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                }

                {
                    this.state.isOwner && !reply &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={{
                                // alignSelf: 'baseline'
                                width: 24, height: 24, justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.openKeyboard(ref, index)}
                        >
                            <MaterialIcons name='reply' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: 10, marginBottom: Theme.spacing.tiny }} />
            </View>
        );
    }

    renderReviewItemBlocked(review, i) {
        const _review = review.review;

        return (
            <TouchableOpacity activeOpacity={0.5} key={_review.id}
                onPress={() => {
                    this.openDialog('Unblock Review', 'Are you sure you want to unblock ' + _review.name + '?', async () => {
                        const uid = Firebase.user().uid;
                        const post = this.state.post;
                        const placeId = post.d.placeId;
                        const feedId = post.d.id;
                        const reviewId = _review.id;

                        const result = await Firebase.unblockReview(uid, placeId, feedId, reviewId);
                        if (!result) {
                            this.refs["toast"].show('The review has been removed by its owner.', 500);
                            return;
                        }

                        // this.reloadReviews();
                        this.showReview(i, uid);
                    });
                }}
            >
                {
                    this.renderReviewItemOrigin(review, i)
                }

                <View style={[StyleSheet.absoluteFill, { marginHorizontal: -8, marginBottom: Theme.spacing.tiny + 9 }, {
                    borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                }]}>
                    <AntDesign style={{ marginBottom: 4 }} name='checkcircleo' color="#228B22" size={28} />
                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 14,
                        fontFamily: "Roboto-Light",
                        paddingHorizontal: 10,
                        textAlign: 'center',
                        marginBottom: 8
                    }}>{'Thanks for letting us know.'}</Text>
                    <Text style={{
                        color: Theme.color.text3,
                        fontSize: 14,
                        fontFamily: "Roboto-Light",
                        paddingHorizontal: 10,
                        textAlign: 'center'
                    }}>{'Your feedback improves the quality of contents on Rowena.'}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    renderWriteReview() {
        if (Platform.OS === 'android') {
            return (
                <View style={styles.writeReviewContainer}>
                    <Text style={styles.ratingText}>Share your experience to help others</Text>
                    <View style={{ marginBottom: Theme.spacing.small }}>
                        <AirbnbRating
                            ref='rating'
                            onFinishRating={this.ratingCompleted}
                            showRating={false}
                            count={5}
                            defaultRating={this.state.writeRating}
                            size={32}
                            margin={3}
                        />
                    </View>
                </View>
            );
        } else { // ios
            const { profile } = this.props.profileStore;

            const picture = profile.picture.uri;

            const avatarName = Util.getAvatarName(profile.name);
            const avatarColor = Util.getAvatarColor(profile.uid);
            let nameFontSize = 22;
            let nameLineHeight = 26;

            if (avatarName.length === 1) {
                nameFontSize = 24;
                nameLineHeight = 28;
            } else if (avatarName.length === 2) {
                nameFontSize = 22;
                nameLineHeight = 26;
            } else if (avatarName.length === 3) {
                nameFontSize = 20;
                nameLineHeight = 24;
            }

            let margintop = -8;
            if (this.state.chartInfo.reviewCount === 0) {
                margintop = 12;
            }

            return (
                <View style={{ paddingHorizontal: Theme.spacing.small + 10, marginTop: margintop, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        picture ?
                            <SmartImage
                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={picture}
                            />
                            :
                            <View
                                style={{
                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <View style={{ width: '100%', height: 34, backgroundColor: '#212121', borderRadius: 5 }}>
                            <TouchableOpacity
                                style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}
                                onPress={() => {
                                    this.ratingCompleted(-1);
                                }}
                            >
                                <Text style={{ fontSize: 16, fontFamily: "Roboto-Regular", color: Theme.color.placeholder }}
                                    numberOfLines={1}
                                >{'Add a comment...'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }
    }

    onLayoutReviewsContainer = (event) => {
        const { y } = event.nativeEvent.layout;
        this.reviewsContainerY = y;
    }

    @autobind
    onItemLayout(event, index) {
        const { x, y, width, height } = event.nativeEvent.layout;
        this.itemHeights[index] = height;
    }

    @autobind
    ratingCompleted(rating) {
        setTimeout(() => {
            if (this.closed) return;

            // check if removed by the owner
            if (!this.feed) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            const post = this.state.post;

            const { profile } = this.props.profileStore;
            const user = {
                uid: profile.uid,
                name: profile.name,
                place: profile.place,
                picture: profile.picture
            };

            const param = {
                post,
                user,
                rating,
                initFromWriteReview: (result) => this.initFromWriteReview(result)
            };

            this.props.navigation.navigate("writeReview", param);
        }, 300);
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('jdub', 'Post._keyboardDidShow');

        this.setState({ bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (let i = 0; i < this.selectedItemIndex; i++) {
            let h = this.itemHeights[i];
            if (h) {
                totalHeights += h;
            }
        }

        const y = this.reviewsContainerY + this.reviewContainerY + totalHeights;
        const height = this.itemHeights[this.selectedItemIndex];
        const keyboardHeight = e.endCoordinates.height;
        const searchBarHeight = Cons.searchBarHeight;
        const gap = Dimensions.get('window').height - keyboardHeight - replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true });
    }

    @autobind
    _keyboardDidHide(e) {
        if (!this.focused) return;

        console.log('jdub', 'Post._keyboardDidHide');

        this.setState({ showKeyboard: false, bottomPosition: Dimensions.get('window').height });

        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;

        /*
        if (this._showNotification) {
            this.hideNotification();
        }
        */
    }

    openKeyboard(ref, index) {
        if (this.state.showKeyboard) return;

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
    }

    showNotification(msg) {
        this._showNotification = true;

        !this.closed && this.setState({ notification: msg }, () => {
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

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }

    async contact() {
        if (this.state.isOwner) {
            this.refs["toast"].show('Sorry, this is your post.', 500);
            return;
        }

        if (this.state.disableContactButton) {
            this.refs["toast"].show('Sorry, You have already opened a chatroom.', 500);
            return;
        }

        // check if removed by the owner
        if (!this.feed) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

        this.setState({ showPostLoader: true });

        const post = this.state.post;

        const uid = Firebase.user().uid;

        // find existing chat room (by uid)
        let room = await Firebase.findChatRoomByPostId(uid, post.d.id);
        if (room) {
            // this.props.navigation.navigate("chatRoom", { item: room });

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
            // const post = this.state.post;

            // count
            const { extra } = this.props.navigation.state.params;
            const placeCounts = extra.placeCounts;

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
                placeCounts,
                customerProfile
            };

            this.setState({ showPostLoader: false });
            this.props.navigation.navigate("chatRoom", { item: params });
        } else {
            const { profile } = this.props.profileStore;

            // create new chat room
            // --
            const chatRoomId = Util.uid(); // create chat room id

            const user1 = {
                uid: uid,
                /*
                name: Firebase.user().name, // use profile store
                picture: Firebase.user().photoUrl, // use profile store
                */
                name: profile.name,
                picture: profile.picture.uri
            };

            const user2 = {
                // pid: post.id, // post id
                uid: post.d.uid, // owner
                name: post.d.name,
                picture: post.d.pictures.one.uri
            };

            let users = [];
            users.push(user1);
            users.push(user2);

            room = await Firebase.createChatRoom(uid, users, post.d.placeId, post.d.id, chatRoomId, post.d.placeName, post.d.uid, true);
            // --

            // this.props.navigation.navigate("chatRoom", { item: room });

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
            // const post = this.state.post;

            // count
            const { extra } = this.props.navigation.state.params;
            const placeCounts = extra.placeCounts;

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
                placeCount,
                customerProfile
            };

            this.setState({ showPostLoader: false });
            this.props.navigation.navigate("chatRoom", { item: params });
        }
    }

    sendReply() {
        const message = this._reply._lastNativeText;
        console.log('jdub', 'sendReply', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');
            return;
        }

        this.addReply(message);

        // send push notification
        const { profile } = this.props.profileStore;
        const post = this.state.post;
        const receiver = this.state.reviews[this.selectedItemIndex].profile.uid;
        const data = {
            // message: profile.name + ' replied to your review: ' + message,
            message,
            placeId: post.d.placeId,
            feedId: post.d.id
        };

        sendPushNotification(Firebase.user().uid, profile.name, receiver, Cons.pushNotification.reply, data);

        this.refs["toast"].show('Your reply has been submitted!', 500, () => {
            if (this.closed) return;
            if (this.state.showKeyboard) this.setState({ showKeyboard: false });
            this.reloadReviews();
        });
    }

    async addReply(message) {
        if (this.__addReply) return;

        this.__addReply = true;

        const post = this.state.post;

        const placeId = post.d.placeId;
        const feedId = post.d.id;
        // const reviewOwnerUid = this.reviewStore.reviews[this.selectedItemIndex].profile.uid;
        // const reviewId = this.reviewStore.reviews[this.selectedItemIndex].review.id;
        const reviewOwnerUid = this.state.reviews[this.selectedItemIndex].profile.uid;
        const reviewId = this.state.reviews[this.selectedItemIndex].review.id;

        const userUid = Firebase.user().uid;

        await Firebase.addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message);

        this.__addReply = false;
    };

    async removeReview(index) {
        const title = Platform.OS === 'android' ? 'Delete Review' : 'Delete Comment';
        const subtitle = Platform.OS === 'android' ? 'Are you sure you want to delete this review?' : 'Are you sure you want to delete this comment?';

        this.openDialog(title, subtitle, async () => {
            const post = this.state.post;

            // check if removed by the owner
            /*
            if (!this.isValidPost(post.d.placeId, post.d.id)) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }
            */

            const placeId = post.d.placeId;
            const feedId = post.d.id;
            // const reviewId = this.reviewStore.reviews[index].review.id;
            const reviewId = this.state.reviews[index].review.id;

            const userUid = Firebase.user().uid;

            const result = await Firebase.removeReview(placeId, feedId, reviewId, userUid);
            if (!result) {
                // the post is removed
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            this.refs["toast"].show('Your review has successfully been removed.', 500, () => {
                if (this.closed) return;
                this.reloadReviews();
            });
        });
    }

    async removeReply(index) {
        this.openDialog('Delete Reply', 'Are you sure you want to delete this reply?', async () => {
            const post = this.state.post;

            const placeId = post.d.placeId;
            const feedId = post.d.id;
            // const reviewId = this.reviewStore.reviews[index].review.id;
            // const replyId = this.reviewStore.reviews[index].review.reply.id;
            const reviewId = this.state.reviews[index].review.id;
            const replyId = this.state.reviews[index].review.reply.id;

            const userUid = Firebase.user().uid;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.refs["toast"].show('Your reply has successfully been removed.', 500, () => {
                if (this.closed) return;
                this.reloadReviews();
            });
        });
    }

    translateNote() {
        let { post } = this.state;
        const { note } = post.d;

        if (this.translatedNote) {
            this.originNote = note;

            post.d.note = this.translatedNote;
            this.setState({ post });
        } else {
            Util.translate(note).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originNote = note;

                post.d.note = translated;
                !this.closed && this.setState({ post });

                this.translatedNote = translated;
            }).catch(err => {
                console.error('translate error', err);
            });
        }
    }

    setOriginNote() {
        let { post } = this.state;
        post.d.note = this.originNote;
        this.setState({ post });

        this.originNote = null;
    }

    translateReview(index) {
        // console.log('jdub', 'translateReview', index);

        let reviews = this.state.reviews;
        const comment = reviews[index].review.comment;

        if (!this.translatedReviewList) this.translatedReviewList = [];

        const translatedReview = this.translatedReviewList[index];

        if (translatedReview) {
            this.originReviewList[index] = comment;

            reviews[index].review.comment = translatedReview;
            this.setState({ reviews });
        } else {
            Util.translate(comment).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originReviewList[index] = comment;

                reviews[index].review.comment = translated;
                !this.closed && this.setState({ reviews });

                this.translatedReviewList[index] = translated;
            }).catch(err => {
                console.error('translate error', err);
            });
        }
    }

    setOriginReview(index) {
        // console.log('jdub', 'setOriginReview', index);

        const originReview = this.originReviewList[index];

        let reviews = this.state.reviews;

        reviews[index].review.comment = originReview;
        this.setState({ reviews });

        this.originReviewList[index] = null;
    }

    translateReply(index) {
        // console.log('jdub', 'translateReply', index);

        let reviews = this.state.reviews;
        const comment = reviews[index].review.reply.comment;

        if (!this.translatedReplyList) this.translatedReplyList = [];

        const translatedReply = this.translatedReplyList[index];

        if (translatedReply) {
            this.originReplyList[index] = comment;

            reviews[index].review.reply.comment = translatedReply;
            this.setState({ reviews });
        } else {
            Util.translate(comment).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originReplyList[index] = comment;

                reviews[index].review.reply.comment = translated;
                !this.closed && this.setState({ reviews });

                this.translatedReplyList[index] = translated;
            }).catch(err => {
                console.error('translate error', err);
            });
        }
    }

    setOriginReply(index) {
        // console.log('jdub', 'setOriginReply', index);

        const originReply = this.originReplyList[index];

        let reviews = this.state.reviews;

        reviews[index].review.reply.comment = originReply;
        this.setState({ reviews });

        this.originReplyList[index] = null;
    }

    openDialog(title, message, callback) {
        this.setState({ dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.small
    },
    slide: {
        /*
        width: imageWidth,
        height: imageHeight,
        */
        width: imageWidth,
        height: imageWidth,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        /*
        width: imageWidth,
        height: imageHeight
        */
        width: imageWidth,
        height: imageWidth
    },
    infoContainer: {
        flex: 1,
        // paddingTop: Theme.spacing.tiny,
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small
    },
    circle: {
        width: 10,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: 'rgb(70, 154, 32)'
    },
    date: {
        // marginLeft: 8,
        marginLeft: 6,
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    name: {
        color: Theme.color.title,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: "Roboto-Medium"
    },
    age: {
        color: Theme.color.subtitle,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: "Roboto-Medium",
        marginLeft: 8,
        marginRight: 2
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        borderRadius: 12,
        // paddingHorizontal: 10,
        paddingLeft: 5,
        paddingRight: 7,
        marginHorizontal: 3,
        // backgroundColor: 'rgba(0, 51, 102, 0.8)'
    },
    /*
    size: {
        color: "white",
        fontSize: 18,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    */
    /*
    bodyInfoTitle: {
        color: Theme.color.title,
        fontSize: 16,
        // fontFamily: "Roboto-Medium",
        fontFamily: "Roboto-Regular",
        paddingTop: 3,
        paddingLeft: Theme.spacing.xSmall,
    },
    */
    bodyInfoTitle: {
        color: Theme.color.title,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: "Roboto-Regular",
        // paddingTop: 3,
        // paddingLeft: Theme.spacing.xSmall,
    },
    /*
    preferNotToSay: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        paddingTop: 3,
        paddingLeft: Theme.spacing.xSmall,
    },
    */
    ratherNotSay: {
        color: Theme.color.title,
        fontSize: 16,
        fontFamily: "Roboto-Regular",
        paddingTop: 3,
        paddingLeft: Theme.spacing.xSmall,
    },
    distance: {
        // paddingLeft: 5,
        paddingHorizontal: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        // paddingTop: 2
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    views: {
        color: Theme.color.text2,
        fontSize: 16,
        fontFamily: "Roboto-Regular"
    },
    likes: {
        color: Theme.color.text2,
        fontSize: 16,
        fontFamily: "Roboto-Regular"
    },
    /*
    note: {
        marginTop: 5,
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: Platform.OS === 'ios' ? 26 : 30,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.small,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
        backgroundColor: 'rgb(34, 34, 34)',
        borderRadius: 5,
        // borderColor: "transparent",
        borderWidth: 0,
    },
    */
    note: {
        marginTop: 10,

        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 26,
        // fontFamily: "Roboto-Light"
        fontFamily: "Roboto-Regular"
    },
    mapContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
    },
    location: {
        marginBottom: Theme.spacing.tiny,

        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 26,
        fontFamily: "Roboto-Regular"
    },
    mapView: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    map: {
        width: '100%',
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 5 * 3
    },
    writeReviewContainer: {
        paddingHorizontal: Theme.spacing.small
    },
    ratingText: {
        color: Theme.color.placeholder,
        textAlign: 'center',
        fontSize: 16,
        // lineHeight: 16,
        fontFamily: "Roboto-Light",
        paddingTop: 10,
        paddingBottom: 10
    },
    reviewsContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
    },
    reviewContainer: {
        // marginHorizontal: 10,
        padding: 10,
    },
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 14,
        fontFamily: "Roboto-Regular"
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light"
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Regular"
    },
    replyOwner: {
        color: Theme.color.text2,
        fontSize: 13,
        fontFamily: "Roboto-Italic"
    },
    replyDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light"
    },
    replyComment: {
        color: Theme.color.text2,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Italic"
    },
    contactButton: {
        width: '85%',
        height: Cons.buttonHeight,
        alignSelf: 'center',
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
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
    ratingText1: {
        // height: 8,
        width: 20,

        color: Theme.color.text4,
        fontSize: 12,
        fontFamily: "Roboto-Medium",
        // backgroundColor: 'green'
    },
    ratingText2: {
        // height: 8,

        width: 30,
        textAlign: 'right',

        color: Theme.color.text4,
        fontSize: 12,
        fontFamily: "Roboto-Medium",
        // backgroundColor: 'green'
    }
});
