import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Platform,
    FlatList, TouchableWithoutFeedback, Image, Keyboard, TextInput, StatusBar, BackHandler, Vibration
} from 'react-native';
import { Constants, MapView, Svg, Haptic } from "expo";
import { Ionicons, AntDesign, FontAwesome, MaterialIcons } from "react-native-vector-icons";
import { Text, Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from 'moment';
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
import Swiper from './Swiper';
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

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const DEFAULT_REVIEW_COUNT = 3;

// 3:2 image
const imageWidth = Dimensions.get('window').width;
const imageHeight = imageWidth / 3 * 2;

const illustWidth = Dimensions.get('window').width - (Theme.spacing.small * 2);
const illustHeight = illustWidth / 2321 * 1890;

// const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";
const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\n";
const bodyInfoContainerPaddingHorizontal = Theme.spacing.small;
const bodyInfoContainerPaddingVertical = Theme.spacing.small;
// const bodyInfoItemWidth = Dimensions.get('window').width / 5;
// const bodyInfoItemHeight = bodyInfoItemWidth;
const bodyInfoItemHeight = Dimensions.get('window').height / 12;


@inject("feedStore", "profileStore")
@observer // for reviewStore
export default class Post extends React.Component<InjectedProps> {
    reviewStore: ReviewStore = new ReviewStore();

    replyViewHeight = Dimensions.get('window').height / 9;

    state = {
        post: null,

        writeRating: 0,
        renderList: false,
        isOwner: false,

        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value((Constants.statusBarHeight + 10) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        liked: false,

        chartInfo: null,

        /*
        post: null,
        profile: null
        */
    };

    constructor(props) {
        super(props);

        this.itemHeights = {};

        this.springValue = new Animated.Value(1);
    }

    async initFromWriteReview(result) { // back from rating
        // console.log('Post.initFromWriteReview', result);

        this.setState({ writeRating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating

        // reload reviews
        if (result) {
            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;
            const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
            this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

            // 1.
            const newPost = await this.reloadPost(post.placeId, post.id);
            const newChart = this.getChartInfo(newPost);
            this.setState({ post: newPost, chartInfo: newChart });

            // this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
        }
    }

    async reloadPost(placeId, feedId) {
        const postDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (postDoc.exists) {
            const post = postDoc.data();

            return post;
        }

        return null;
    }

    getChartInfo(post) {
        const chart = this.state.chartInfo;

        // 2) ranking
        // ToDo: calc ranking
        const ranking = 2;

        const newChart = {
            cityName: chart.cityName,
            numberOfGirls: chart.numberOfGirls,

            averageRating: post.averageRating,
            reviewCount: post.reviewCount,
            reviewStats: post.reviewStats,
            ranking: ranking
        };

        return newChart;
    }

    componentDidMount() {
        console.log('Post.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { post, extra } = this.props.navigation.state.params;
        this.init(post, extra);

        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('Post.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        if (this.state.dialogVisible) {
            this.hideDialog();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'Post';

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    init(post, extra) {
        this.setState({ post });

        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

        const isOwner = this.isOwner(post.uid, Firebase.user().uid);
        this.setState({ isOwner });

        // check liked
        const liked = this.checkLiked(post.likes);
        if (liked) {
            this.setState({ liked: true });
        }

        // chart info

        // 1) city name
        const placeName = post.placeName;
        const words = placeName.split(', ');
        const cityName = words[0];

        // 2) ranking
        // ToDo: calc ranking
        const ranking = 4;

        const chart = {
            // cityName: extra.cityName,
            cityName: cityName,
            numberOfGirls: extra.feedSize,
            averageRating: post.averageRating,
            reviewCount: post.reviewCount,
            reviewStats: post.reviewStats, // 5, 4, 3, 2, 1
            ranking: ranking
        };

        this.setState({ chartInfo: chart });

        /*
        const { feedStore } = this.props;
        this.unsubscribeToPost = feedStore.subscribeToPost(post.placeId, post.id, newPost => this.setState({ post: newPost }));
        this.unsubscribeToProfile = feedStore.subscribeToProfile(post.uid, newProfile => this.setState({ profile: newProfile }));
        */
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    componentWillUnmount() {
        console.log('Post.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();


        /*
        this.unsubscribeToPost();
        this.unsubscribeToProfile();
        */

        this.closed = true;
    }

    async edit() {
        // ToDo: edit post


        Vars.userFeedsChanged = true;
    }

    /*
    isValidPost(placeId, feedId) {
        const { feedStore } = this.props;
        const { feed } = feedStore;

        if (feed) {
            for (var i = 0; i < feed.length; i++) {
                const post = feed[i].post;

                if (post.placeId === placeId && post.id === feedId) {
                    // exists
                    return true;
                }
            }
        }

        return false; // removed
    }
    */

    @autobind
    async toggle() {
        if (this.toggling) return;

        this.toggling = true;

        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        // check if removed by the owner
        /*
        if (!this.isValidPost(post.placeId, post.id)) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }
        */

        // check the owner of the post
        if (Firebase.user().uid === post.uid) {
            this.refs["toast"].show('Sorry, You can not call dibs on your post.', 500);

            this.toggling = false;
            return;
        }

        if (!this.state.liked) {
            this.setState({ liked: true });

            this.springValue.setValue(2);

            Animated.spring(this.springValue, {
                toValue: 1,
                friction: 2,
                tension: 1
            }).start();

            // toast
            this.refs["toast"].show('Thanks ❤', 500);
        } else {
            this.setState({ liked: false });

            // toast
            this.refs["toast"].show('Oh...', 500);
        }

        // update database
        const placeId = post.placeId;
        const feedId = post.id;
        const uid = Firebase.user().uid;

        const name = post.name;
        const placeName = post.placeName;
        const averageRating = post.averageRating;
        const reviewCount = post.reviewCount;
        const uri = post.pictures.one.uri;

        const result = await Firebase.updateLikes(uid, placeId, feedId, name, placeName, averageRating, reviewCount, uri);
        if (!result) {
            // the post is removed
            this.refs["toast"].show('The post has been removed by its owner.', 500);
        }

        this.toggling = false;

        Vars.postToggleButtonPressed = true;
        const _post = {};
        _post.placeId = placeId;
        _post.feedId = feedId;
        Vars.toggleButtonPressedPost = _post;
    }

    checkLiked(likes) {
        let liked = false;

        const uid = Firebase.user().uid;

        for (var i = 0; i < likes.length; i++) {
            const _uid = likes[i];
            if (uid === _uid) {
                liked = true;
                break;
            }
        }

        return liked;
    }

    render() {
        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        // ToDo: calc distance (get my location)
        let distance = '12 km away';
        /*
        const location = post.location;
        location.longitude
        location.latitude
        */

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [
                {
                    translateY: this.state.offset
                }
            ]
        };

        return (
            <View style={styles.flex}>
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* like button */}
                    <TouchableWithoutFeedback onPress={this.toggle}>
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
                </View>

                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => this.hideNotification()}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                {
                    this.state.renderList &&
                    <TouchableWithoutFeedback
                        onPress={() => {
                            if (this.state.showKeyboard) this.setState({ showKeyboard: false });
                        }}
                    >
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            contentContainerStyle={styles.container}
                            showsVerticalScrollIndicator={true}
                            ListHeaderComponent={
                                <View>
                                    {/* profile pictures */}
                                    {
                                        this.renderSwiper(post)
                                    }

                                    <View style={styles.infoContainer}>
                                        <View style={{ marginTop: Theme.spacing.tiny, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <View style={styles.circle}></View>
                                            <Text style={styles.date}>Posted {moment(post.timestamp).fromNow()}</Text>
                                        </View>
                                        <Text style={styles.name}>{post.name}</Text>
                                        <View style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            alignItems: 'center', justifyContent: 'center',
                                            paddingVertical: bodyInfoContainerPaddingVertical,
                                            paddingHorizontal: bodyInfoContainerPaddingHorizontal
                                        }}>
                                            <View style={{
                                                width: '50%', height: bodyInfoItemHeight,
                                                alignItems: 'flex-start', justifyContent: 'space-between'
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: Theme.color.title }}
                                                        source={PreloadImage.birth}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>{Util.getAge(post.birthday)} years old</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, marginTop: 2, tintColor: Theme.color.title }}
                                                        source={PreloadImage.scale}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>{post.weight} kg</Text>
                                                </View>
                                            </View>
                                            <View style={{
                                                width: '50%', height: bodyInfoItemHeight,
                                                alignItems: 'flex-start', justifyContent: 'space-between'
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: Theme.color.title }}
                                                        source={PreloadImage.ruler}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>{post.height} cm</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: Theme.color.title }}
                                                        source={PreloadImage.bra}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>{post.bust} cup</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: Theme.spacing.tiny }}>
                                            <MaterialIcons style={{ marginLeft: 1, marginTop: 1 }} name='location-on' color={Theme.color.title} size={16} />
                                            <Text style={styles.distance}>{distance}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: Theme.spacing.tiny }}>
                                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                                <AirbnbRating
                                                    count={5}
                                                    readOnly={true}
                                                    showRating={false}
                                                    defaultRating={Math.floor(post.averageRating)}
                                                    size={16}
                                                    margin={1}
                                                />
                                            </View>
                                            <Text style={styles.rating}>{post.averageRating}</Text>
                                            <AntDesign style={{ marginLeft: 12, marginTop: 1 }} name='message1' color={Theme.color.title} size={16} />
                                            <Text style={styles.reviewCount}>{post.reviewCount}</Text>
                                        </View>

                                        {
                                            post.note &&
                                            <Text style={styles.note}>{post.note}</Text>
                                        }
                                    </View>

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                    {/* map */}
                                    <View style={styles.mapContainer}>
                                        <Text style={styles.location}>{post.location.description}</Text>
                                        <TouchableOpacity activeOpacity={0.5}
                                            onPress={() => {
                                                setTimeout(() => {
                                                    /*
                                                    this.setState({ isNavigating: true }, () => {
                                                        this.props.navigation.navigate("map", { post: post });
                                                    });
                                                    */
                                                    this.props.navigation.navigate("map", { post: post });
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={styles.mapView}>
                                                <MapView
                                                    ref={map => { this.map = map }}
                                                    style={styles.map}
                                                    mapPadding={{ left: 0, right: 0, top: 25, bottom: 25 }}
                                                    initialRegion={{
                                                        longitude: post.location.longitude,
                                                        latitude: post.location.latitude,
                                                        latitudeDelta: 0.001,
                                                        longitudeDelta: 0.001
                                                    }}
                                                    scrollEnabled={false}
                                                    zoomEnabled={false}
                                                    rotateEnabled={false}
                                                    pitchEnabled={false}
                                                >
                                                    <MapView.Marker
                                                        coordinate={{
                                                            longitude: post.location.longitude,
                                                            latitude: post.location.latitude
                                                        }}
                                                    // title={'title'}
                                                    // description={'description'}
                                                    />
                                                </MapView>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                    <View style={styles.reviewsContainer} onLayout={this.onLayoutReviewsContainer}>
                                        {
                                            this.renderChart(this.state.chartInfo)
                                        }
                                        {
                                            this.renderReviews(this.reviewStore.reviews)
                                        }
                                    </View>

                                    <View style={styles.writeReviewContainer}>
                                        <Text style={styles.ratingText}>Share your experience to help others</Text>
                                        <View style={{ marginBottom: 10 }}>
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

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                    <Text style={{
                                        marginTop: Theme.spacing.small,
                                        marginBottom: Theme.spacing.small,
                                        fontSize: 14, fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                                        textAlign: 'center', lineHeight: 24
                                    }}>{"Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you"}</Text>

                                    <TouchableOpacity
                                        style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.large }]}
                                        onPress={async () => await this.contact()}
                                    >
                                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Start a Chat</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </TouchableWithoutFeedback>
                }

                {
                    this.state.showKeyboard &&
                    <View style={{
                        position: 'absolute',
                        top: this.state.bottomPosition - this.replyViewHeight,
                        height: this.replyViewHeight,
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

                                // padding: 8, // not working in ios
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingLeft: 10,
                                paddingRight: 10,

                                borderRadius: 5,
                                fontSize: 14,
                                fontFamily: "Roboto-Regular",
                                color: Theme.color.title,
                                textAlign: 'justify',
                                textAlignVertical: 'top',
                                backgroundColor: '#212121'
                            }}
                            placeholder='Reply to a review...'
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

    renderSwiper(post) {
        let pictures = [];

        let value = post.pictures.one.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`one`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
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

        value = post.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
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

        value = post.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
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

        value = post.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}
                    >
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


        return (
            <Swiper
                ref={(swiper) => { this.swiper = swiper; }}
                style={styles.wrapper}
                // containerStyle={{ marginBottom: 10 }}
                width={imageWidth}
                height={imageHeight}
                loop={false}
                autoplay={false}
                autoplayTimeout={3}
                paginationStyle={{ bottom: 4 }}
            >
                {pictures}
            </Swiper>
        );
    }

    renderChart(data) {
        if (data === null) {
            // ToDo: draw skeleton

            return null;
        }

        if (data.reviewCount === 0) {
            return (
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: Theme.spacing.tiny }}>
                    <Text style={{
                        // color: Theme.color.text3,
                        color: 'rgb(221, 184, 128)',
                        fontSize: 24,
                        paddingTop: 4,
                        fontFamily: "Roboto-Medium"
                    }}>Please write the first review.</Text>

                    <Image
                        style={{
                            marginTop: 30,
                            marginBottom: 8,
                            width: illustWidth * 0.4,
                            height: illustHeight * 0.4,
                            resizeMode: 'cover'
                        }}
                        source={PreloadImage.keyboard}
                    />
                </View>
            );
        }

        const cityName = data.cityName;
        const numberOfGirls = data.numberOfGirls;
        const averageRating = data.averageRating;
        const reviewCount = data.reviewCount;
        const stats = data.reviewStats; // 5
        const ranking = data.ranking;

        /*
        // ToDo: test
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
        for (var i = 0; i < stats.length; i++) {
            var value = Math.round(stats[i] / reviewCount * 100);
            var percentage = value.toString() + '%';
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
        const defaultRating = Math.floor(averageRating);

        return (
            <View>
                {/*
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{
                        color: Theme.color.text2,
                        fontSize: 34,
                        paddingTop: 16,
                        fontFamily: "Roboto-Medium",
                        // backgroundColor: 'green',
                    }}>{averageRating}</Text>

                    <View style={{ marginLeft: 6, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={4}
                                size={14}
                                margin={1}
                            />
                        </View>
                        <View style={{ marginLeft: 2, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                            <Ionicons name='md-person' color={Theme.color.text4} size={14} />
                            <Text style={{
                                paddingLeft: 5,
                                color: Theme.color.text4,
                                fontSize: 12,
                                fontFamily: "Roboto-Light",
                                // backgroundColor: 'green'
                            }}>{reviewCount.toString() + " total"}</Text>
                        </View>
                    </View>

                    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Text style={{
                            marginLeft: 12,
                            color: Theme.color.text3,
                            fontSize: 16,
                            fontFamily: "Roboto-Regular",
                            // backgroundColor: 'green',
                            // paddingTop: 12
                        }}>{"#" + ranking.toString() + " of " + numberOfGirls.toString() + " girls in " + cityName}</Text>
                    </View>
                </View>
                */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{
                        color: Theme.color.text2,
                        fontSize: 28,
                        lineHeight: 34,
                        fontFamily: "Roboto-Medium",
                        // backgroundColor: 'green',
                        marginRight: 8
                    }}>{averageRating}</Text>

                    <View style={{ width: 'auto', alignItems: 'flex-start', marginRight: 12 }}>
                        <AirbnbRating
                            count={5}
                            readOnly={true}
                            showRating={false}
                            defaultRating={defaultRating}
                            size={24}
                            margin={2}
                        />
                    </View>

                    <Text style={{
                        // paddingLeft: 5,
                        color: Theme.color.text4,
                        fontSize: 16,
                        lineHeight: 34,
                        fontFamily: "Roboto-Light",
                        // backgroundColor: 'green'
                    }}>{"(" + reviewCount.toString() + " reviews)"}</Text>
                </View>

                <Text style={{
                    marginBottom: 20,
                    // marginLeft: 12,
                    color: Theme.color.text3,
                    fontSize: 16,
                    fontFamily: "Roboto-Regular",
                    // backgroundColor: 'green',
                    // paddingTop: 12
                }}>{"#" + ranking.toString() + " of " + numberOfGirls.toString() + " girls in " + cityName}</Text>

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
                        <Text style={styles.ratingText2} numberOfLines={1}>{Util.numberWithCommas(stats[0])}</Text>
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
                        <Text style={styles.ratingText2} numberOfLines={1}>{Util.numberWithCommas(stats[1])}</Text>
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
                        <Text style={styles.ratingText2} numberOfLines={1}>{Util.numberWithCommas(stats[2])}</Text>
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
                        <Text style={styles.ratingText2} numberOfLines={1}>{Util.numberWithCommas(stats[3])}</Text>
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
                        <Text style={styles.ratingText2} numberOfLines={1}>{Util.numberWithCommas(stats[4])}</Text>
                    </View>
                </View>
            </View>
        );
    }

    renderReviews(reviews) { // draw items up to 4
        console.log('Post.renderReviews');

        if (reviews === undefined) {
            // draw skeleton

            let reviewArray = [];
            const width = Dimensions.get('window').width - Theme.spacing.small * 2 - 10 * 4;

            for (var i = 0; i < DEFAULT_REVIEW_COUNT; i++) {
                reviewArray.push(
                    <View key={i} style={{ paddingVertical: 4 }}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={120}>
                            <Svg.Circle
                                cx={18 + 2}
                                cy={18 + 2}
                                r={18}
                            />
                            <Svg.Rect
                                x={2 + 18 * 2 + 10}
                                y={2 + 18 - 12}
                                width={60}
                                height={6}
                            />
                            <Svg.Rect
                                x={2 + 18 * 2 + 10}
                                y={2 + 18 + 6}
                                width={100}
                                height={6}
                            />

                            <Svg.Rect
                                x={0}
                                y={2 + 18 * 2 + 14}
                                width={'100%'}
                                height={6}
                            />
                            <Svg.Rect
                                x={0}
                                y={2 + 18 * 2 + 14 + 14}
                                width={'100%'}
                                height={6}
                            />
                            <Svg.Rect
                                x={0}
                                y={2 + 18 * 2 + 14 + 14 + 14}
                                width={'80%'}
                                height={6}
                            />
                        </SvgAnimatedLinearGradient>
                    </View>
                );
            }

            /*
            reviewArray.push(
                <ActivityIndicator
                    key={'indicator'}
                    style={{
                        marginTop: 20,
                        marginBottom: 20
                    }}
                    animating={true}
                    size="large"
                    color='grey'
                />
            );
            */

            return (
                <View style={styles.reviewContainer}>
                    {reviewArray}
                </View>
            );
        } else {
            if (reviews.length === 0) {
                return null;
            }

            // console.log('reviews length', reviews.length);

            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;

            let reviewArray = [];

            for (var i = 0; i < reviews.length; i++) {
                if (i >= DEFAULT_REVIEW_COUNT) break;

                const review = reviews[i];

                const _profile = review.profile;
                const _review = review.review;
                const ref = _review.id;
                const index = i;
                const reply = _review.reply;
                const isMyReview = this.isOwner(_review.uid, Firebase.user().uid);
                let isMyReply = undefined;
                if (reply) isMyReply = this.isOwner(reply.uid, Firebase.user().uid);

                reviewArray.push(
                    <View key={_review.id} onLayout={(event) => this.onItemLayout(event, index)}>
                        {/* ToDo: add profile image */}

                        <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.xSmall, paddingBottom: Theme.spacing.xSmall }}>
                            <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>
                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: Theme.spacing.tiny }}>
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

                        <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.xSmall }}>
                            <ReadMore
                                numberOfLines={2}
                            // onReady={() => this.readingCompleted()}
                            >
                                <Text style={styles.reviewText}>{_review.comment}</Text>
                            </ReadMore>
                        </View>

                        {
                            isMyReview && !reply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                    onPress={() => this.removeReview(index)}
                                >
                                    <Text ref='delete' style={{ marginLeft: 4, fontFamily: "Roboto-Thin", color: "silver" }}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        }

                        {
                            // comment, id, timestamp, uid
                            reply &&
                            <View style={{
                                paddingTop: Theme.spacing.tiny,
                                paddingBottom: Theme.spacing.tiny,
                                paddingLeft: Theme.spacing.tiny,
                                paddingRight: Theme.spacing.tiny,
                                backgroundColor: Theme.color.highlight, borderRadius: 2
                            }}>

                                <View style={{ flexDirection: 'row', paddingBottom: Theme.spacing.xSmall }}>
                                    <Text style={styles.replyOwner}>Owner Response</Text>
                                    <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                                </View>

                                <ReadMore
                                    numberOfLines={2}
                                >
                                    <Text style={styles.replyComment}>{reply.comment}</Text>
                                </ReadMore>

                                {
                                    isMyReply &&
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                            onPress={() => this.removeReply(index)}
                                        >
                                            <Text ref='replyDelete' style={{ marginLeft: 4, fontFamily: "Roboto-Thin", color: "silver" }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                        }

                        {
                            this.state.isOwner && !reply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                    onPress={() => this.openKeyboard(ref, index, _profile.uid)}
                                >
                                    <Text ref='reply' style={{ marginLeft: 4, fontFamily: "Roboto-Thin", color: "silver" }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        }

                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                    </View>
                );
            } // end of for

            return (
                <View style={styles.reviewContainer}>
                    {reviewArray}

                    {/* Read all ??? reviews button */}
                    <TouchableOpacity
                        onPress={() => {
                            // setTimeout(() => {
                            this.props.navigation.navigate("readReview",
                                {
                                    reviewStore: this.reviewStore,
                                    isOwner: this.state.isOwner,
                                    placeId: this.props.navigation.state.params.post.placeId,
                                    feedId: this.props.navigation.state.params.post.id
                                });
                            // }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <View style={{
                            width: '100%', height: Dimensions.get('window').height / 14,
                            justifyContent: 'center',
                            // alignItems: 'center',
                            // backgroundColor: 'blue',
                            // borderTopWidth: 1,
                            // borderBottomWidth: 1,
                            // borderColor: 'rgb(34, 34, 34)'
                        }}>
                            <Text style={{ fontSize: 16, color: '#f1c40f', fontFamily: "Roboto-Light" }}>Read all {post.reviewCount}+ reviews</Text>
                            <FontAwesome name='chevron-right' color="#f1c40f" size={16} style={{ position: 'absolute', right: 12 }} />

                        </View>
                    </TouchableOpacity>

                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
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
            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;

            // check if removed by the owner
            /*
            if (!this.isValidPost(post.placeId, post.id)) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }
            */

            this.props.navigation.navigate("writeReview", { post: post, rating: rating, initFromWriteReview: (result) => this.initFromWriteReview(result) });
        }, Cons.buttonTimeoutLong);
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('Post._keyboardDidShow');

        this.setState({ showKeyboard: true, bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (var i = 0; i < this.selectedItemIndex; i++) {
            var h = this.itemHeights[i];
            if (h) {
                totalHeights += h;
            }
        }

        const chartHeight = Theme.spacing.tiny + 140 + 10; // OK
        const y = this.reviewsContainerY + chartHeight + totalHeights; // OK

        const height = this.itemHeights[this.selectedItemIndex]; // OK
        const keyboardHeight = e.endCoordinates.height; // OK
        const searchBarHeight = Cons.searchBarHeight; // OK

        const gap = Dimensions.get('window').height - keyboardHeight - this.replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true }); // precisely fit!
    }

    @autobind
    _keyboardDidHide() {
        if (!this.focused) return;

        console.log('Post._keyboardDidHide');

        this.setState({ showKeyboard: false, bottomPosition: Dimensions.get('window').height });

        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;
        this.owner = undefined;

        /*
        if (this._showNotification) {
            this.hideNotification();
        }
        */
    }

    openKeyboard(ref, index, owner) {
        if (this.state.showKeyboard) return;

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
        this.owner = owner;
    }

    showNotification(msg) {
        if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                // this.state.offset.setValue(height * -1);

                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200,
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: 0,
                            duration: 200,
                        }),
                    ])
                ]).start();
            });
        });

        StatusBar.setHidden(true);
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200,
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200,
                    })
                ])
            ]).start();
        });

        StatusBar.setHidden(false);

        this._showNotification = false;
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

        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        // check if removed by the owner
        /*
        if (!this.isValidPost(post.placeId, post.id)) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }
        */

        const feedDoc = await Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).get();
        if (!feedDoc.exists) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

        const uid = Firebase.user().uid;

        // find existing chat room (by uid)
        const room = await Firebase.findChatRoomByPostId(uid, post.id);
        if (room) {
            /*
            this.setState({ isNavigating: true }, () => {
                this.props.navigation.navigate('room', { item: room });
            });
            */
            this.props.navigation.navigate("chatRoom", { item: room });
        } else {
            // create new chat room
            // --
            const chatRoomId = Util.uid(); // create chat room id

            const user1 = {
                uid: uid,
                name: Firebase.user().name,
                picture: Firebase.user().photoUrl,
            };

            const user2 = {
                // pid: post.id, // post id
                uid: post.uid, // owner
                name: post.name,
                picture: post.pictures.one.uri
            };

            let users = [];
            users.push(user1);
            users.push(user2);

            const item = await Firebase.createChatRoom(uid, users, post.placeId, post.id, chatRoomId, post.uid, true);
            // --

            /*
            this.setState({ isNavigating: true }, () => {
                this.props.navigation.navigate('room', { item: item });
            });
            */
            this.props.navigation.navigate("chatRoom", { item: item });
        }
    }

    sendReply() {
        const message = this._reply._lastNativeText;
        console.log('sendReply', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');
            return;
        }

        this.addReply(message);

        this.sendPushNotification(message);

        this.refs["toast"].show('Your reply has been submitted!', 500, async () => {
            if (!this.closed) {
                // this._reply.blur();
                if (this.state.showKeyboard) this.setState({ showKeyboard: false });

                // reload reviews
                // const { post } = this.props.navigation.state.params;
                const post = this.state.post;
                const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                // 2.
                const newPost = await this.reloadPost(post.placeId, post.id);
                const newChart = this.getChartInfo(newPost);
                this.setState({ post: newPost, chartInfo: newChart });

                this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
            }
        });
    }

    async addReply(message) {
        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        const placeId = post.placeId;
        const feedId = post.id;
        const reviewId = this.reviewStore.reviews[this.selectedItemIndex].review.id;
        const userUid = Firebase.user().uid; // 리뷰를 쓴 사람

        await Firebase.addReply(placeId, feedId, reviewId, userUid, message);
    };

    async removeReview(index) {
        this.openDialog('Delete', 'Are you sure you want to delete this review?', async () => {
            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;

            // check if removed by the owner
            /*
            if (!this.isValidPost(post.placeId, post.id)) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }
            */

            const placeId = post.placeId;
            const feedId = post.id;
            const reviewId = this.reviewStore.reviews[index].review.id;
            const userUid = Firebase.user().uid;

            const result = await Firebase.removeReview(placeId, feedId, reviewId, userUid);
            if (!result) {
                // the post is removed
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            this.refs["toast"].show('Your review has successfully been removed.', 500, async () => {
                if (!this.closed) {
                    // refresh UI
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                    // 3.
                    const newPost = await this.reloadPost(post.placeId, post.id);
                    const newChart = this.getChartInfo(newPost);
                    this.setState({ post: newPost, chartInfo: newChart });

                    this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
                }
            });
        });
    }

    async removeReply(index) {
        this.openDialog('Delete', 'Are you sure you want to delete this reply?', async () => {
            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;

            const placeId = post.placeId;
            const feedId = post.id;
            const reviewId = this.reviewStore.reviews[index].review.id;
            const replyId = this.reviewStore.reviews[index].review.reply.id;
            const userUid = Firebase.user().uid;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.refs["toast"].show('Your reply has successfully been removed.', 500, async () => {
                if (!this.closed) {
                    // refresh UI
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                    // 4.
                    const newPost = await this.reloadPost(post.placeId, post.id);
                    const newChart = this.getChartInfo(newPost);
                    this.setState({ post: newPost, chartInfo: newChart });

                    this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
                }
            });
        });
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

    sendPushNotification(message) {
        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        const sender = Firebase.user().uid;
        const senderName = Firebase.user().name;
        // const receiver = post.uid; // owner
        const receiver = this.owner;
        const data = {
            message: message,
            placeId: post.placeId,
            feedId: post.id
        };

        sendPushNotification(sender, senderName, receiver, Cons.pushNotification.reply, data);
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
    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        width: imageWidth,
        height: imageHeight
    },
    infoContainer: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        // padding: Theme.spacing.small,
        paddingTop: Theme.spacing.tiny,
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
        // paddingTop: Cons.lastLogInDatePaddingTop(),
        marginLeft: 8,
        fontSize: 14,
        fontFamily: "Roboto-Thin",
        color: Theme.color.placeholder
    },
    name: {
        color: Theme.color.title,
        fontSize: 24,
        paddingTop: 4,
        fontFamily: "Roboto-Medium"
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
    bodyInfoTitle: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        // paddingTop: Cons.bodyInfoTitlePaddingTop(),
        paddingTop: 2,
        paddingLeft: Theme.spacing.tiny,
    },
    distance: {
        paddingLeft: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
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
        marginTop: Theme.spacing.tiny,

        color: Theme.color.text2,
        fontSize: 16,
        fontFamily: "Roboto-Light",
        lineHeight: 26
    },
    mapContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
    },
    location: {
        // marginTop: Theme.spacing.xSmall,
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
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small
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
        marginHorizontal: 10,
        padding: 10,
    },
    reviewName: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
    },
    reviewDate: {
        color: 'grey',
        fontSize: 12,
        fontFamily: "Roboto-Thin",
        marginLeft: 'auto'
    },
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 14,
        // lineHeight: 13,
        fontFamily: "Roboto-Light",
        // paddingTop: Theme.spacing.xSmall
        // paddingTop: 1
    },
    reviewText: {
        color: 'silver',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Light"
    },
    replyOwner: {
        color: "#E5E5E5",
        fontSize: 14,
        // fontFamily: "SuisseIntl-ThinItalic"
        fontFamily: "Roboto-MediumItalic"
    },
    replyDate: {
        color: 'grey',
        fontSize: 12,
        fontFamily: "Roboto-Thin",
        marginLeft: 'auto'
    },
    replyComment: {
        color: Theme.color.title,
        fontSize: 14,
        lineHeight: 18,
        // fontFamily: "SuisseIntl-ThinItalic"
        fontFamily: "Roboto-LightItalic"
    },
    contactButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notification: {
        width: '100%',
        height: Constants.statusBarHeight + 10,
        position: "absolute",
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,

        flexDirection: 'column',
        // justifyContent: 'center'
        justifyContent: 'flex-end'
    },
    notificationText: {
        alignSelf: 'center',
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: "#FFF",
        paddingBottom: 2
    },
    notificationButton: {
        position: 'absolute',
        right: 18,
        bottom: 2
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
