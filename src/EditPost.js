import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Platform,
    FlatList, TouchableWithoutFeedback, Image, Keyboard, TextInput, StatusBar, BackHandler, Vibration
} from 'react-native';
import { Constants, Svg, Haptic, Linking } from "expo";
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, AntDesign, FontAwesome, MaterialIcons, MaterialCommunityIcons, Feather } from "react-native-vector-icons";
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
import DateTimePicker from 'react-native-modal-datetime-picker';
// https://github.com/lawnstarter/react-native-picker-select
import Select from 'react-native-picker-select';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const DEFAULT_REVIEW_COUNT = 3;

const replyViewHeight = Dimensions.get('window').height / 9;

// 3:2 image
const imageWidth = Dimensions.get('window').width;
const imageHeight = imageWidth / 3 * 2;

const illustWidth = Dimensions.get('window').width - (Theme.spacing.small * 2);
const illustHeight = illustWidth / 2321 * 1890;

const bodyInfoItemHeight = Dimensions.get('window').height / 24;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const useGoogleMaps = Platform.OS === 'android' ? true : false;





const textInputFontSize = 18;
const textInputHeight = 34;

const genderItems = [
    {
        label: 'Male',
        value: 'Male'
    },
    {
        label: 'Female',
        value: 'Female'
    }
];





@inject("feedStore", "profileStore")
@observer // for reviewStore
export default class EditPost extends React.Component<InjectedProps> {
    reviewStore: ReviewStore = new ReviewStore();

    state = {
        post: null,

        renderList: false,
        isOwner: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        writeRating: 0,
        liked: false,
        chartInfo: null,

        isModal: false,
        disableContactButton: false,

        name: '',

        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(1990, 1, 1),
        birthday: null,
        gender: null,
        height: '',
        weight: '',
        bodyType: null,
        breasts: null,
        note: '',
        noteLength: 0,

        country: null,
        countryCode: null,

        street: null,
        city: '',
        state: '',
        streetInfo: null,
        cityInfo: null,
    };

    constructor(props) {
        super(props);

        this.itemHeights = {};

        this.springValue = new Animated.Value(1);
    }

    async initFromWriteReview(result) { // back from rating
        // console.log('Post.initFromWriteReview', result);

        !this.closed && this.setState({ writeRating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating

        if (result) {
            await this.reloadReviews();
        }
    }

    async initFromReadAllReviews() { // back from read all reviews
        await this.reloadReviews();
    }

    async reloadReviews() {
        // 1. reload reviews
        const post = this.state.post;
        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

        // 2. reload review count & calc chart
        const newPost = await this.reloadPost(post.placeId, post.id);
        const newChart = this.getChartInfo(newPost);
        !this.closed && this.setState({ post: newPost, chartInfo: newChart });

        this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
    }

    async reloadPost(placeId, feedId) {
        const postDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (postDoc.exists) {
            const post = postDoc.data();

            // 1. update feedStore
            const { feedStore } = this.props;
            feedStore.updateFeed(post);

            // 2. update Intro's state array
            // this.addToUpdatedPostsForIntro(post);

            return post;
        }

        return null;
    }

    getChartInfo(post) {
        const chart = this.state.chartInfo;

        // 2) ranking
        // ToDo: calc ranking by averageRating
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

        const { post, extra, from } = this.props.navigation.state.params;
        this.init(post, extra);

        console.log('Post.componentDidMount', from);
        if (from === 'Profile' || from === 'ChatRoom') {
            this.setState({ isModal: true });
        } else {
            this.setState({ isModal: false });
        }

        // show contact button
        if (from === 'ChatRoom') this.setState({ disableContactButton: true });

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
        Vars.currentScreenName = 'Post';

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    init(post, extra) {
        !this.closed && this.setState({ post });

        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

        const isOwner = this.isOwner(post.uid, Firebase.user().uid);
        !this.closed && this.setState({ isOwner });

        // check liked
        const liked = this.checkLiked(post.likes);
        if (liked) {
            !this.closed && this.setState({ liked: true });
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

        !this.closed && this.setState({ chartInfo: chart });
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

        this.closed = true;
    }

    async edit() {
        // Vars.userFeedsChanged = true;


        // this.props.navigation.navigate("edit", { post: post });
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
            !this.closed && this.setState({ liked: true });

            this.springValue.setValue(2);

            Animated.spring(this.springValue, {
                toValue: 1,
                friction: 2,
                tension: 1
            }).start();

            // toast
            this.refs["toast"].show('Thanks ❤', 500);
        } else {
            !this.closed && this.setState({ liked: false });

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

        const result = await Firebase.updateLikes(uid, placeId, feedId, name, placeName, uri);
        if (!result) {
            // the post is removed
            this.refs["toast"].show('The post has been removed by its owner.', 500);
        }

        // update likes to state post
        // --
        console.log('update likes to state post');
        let { likes } = post;
        const idx = likes.indexOf(uid);
        if (idx === -1) {
            likes.push(uid);
        } else {
            likes.splice(idx, 1);
        }

        let newPost = post;
        newPost.likes = likes;

        !this.closed && this.setState({ post: newPost });
        // --

        this.toggling = false;



        // Vars.postLikeButtonPressed = true;

        // this.addToUpdatedPostsForIntro(newPost);
    }

    /*
    addToUpdatedPostsForIntro(post) {
        for (var i = 0; i < Vars.updatedPostsForIntro.length; i++) {
            const item = Vars.updatedPostsForIntro[i];
            if (item.placeId === post.placeId && item.id === post.id) {
                console.log('already exists in Vars.updatedPostsForIntro');
                return;
            }
        }

        Vars.updatedPostsForIntro.push(post);
    }
    */

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
        let paddingBottom = 0;
        if (this.state.isModal) paddingBottom = Cons.viewMarginBottom();

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={[styles.flex, { paddingBottom }]}>
                {/* notification bar */}
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

                {/* search bar */}
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
                        }}
                    >
                        {
                            this.state.isModal ?
                                <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                                :
                                <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                        }
                    </TouchableOpacity>

                    {/* delete button */}
                    {/*
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
                            // this.handleLeave();
                        }}
                    >
                        <Ionicons name='md-trash' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                    */}

                    {/* check button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={async () => {
                            // await this.save();
                        }}
                    >
                        <Ionicons name='md-checkmark' color={'rgba(62, 165, 255, 0.8)'} size={24} />
                    </TouchableOpacity>
                </View>

                {
                    this.state.renderList &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={this.renderHeader()}
                    />
                }

                <DateTimePicker
                    isVisible={this.state.showDatePicker}
                    onConfirm={this._handleDatePicked}
                    onCancel={this._hideDateTimePicker}
                    date={this.state.datePickerDate}
                    titleIOS={this.state.datePickerTitle}
                />

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
            </View >
        );
    }

    renderHeader() {
        const { from } = this.props.navigation.state.params;

        const post = this.state.post;

        let distance = '';
        let integer = 0;
        let number = '';
        let ageText = '';

        let showSettingsButton = false;

        if (post) {
            distance = Util.getDistance(post.location, Vars.location);
            if (distance === '? km away') showSettingsButton = true;

            const averageRating = post.averageRating;

            integer = Math.floor(averageRating);

            if (Number.isInteger(averageRating)) {
                number = averageRating + '.0';
            } else {
                number = averageRating.toString();
            }

            const age = Util.getAge(post.birthday);
            if (age > 1) {
                ageText = age.toString() + ' years old';
            } else {
                ageText = age.toString() + ' year old';
            }
        }

        return (
            <View>
                {/* profile pictures */}
                {
                    this.renderSwiper(post)
                }

                <View style={{ marginTop: Theme.spacing.base, paddingHorizontal: 4 }}
                    onLayout={(e) => {
                        const { y } = e.nativeEvent.layout;
                        this.inputViewY = y;
                    }}
                >
                    {/* 1. name */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'NAME'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            width: '80%',
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)'
                        }}
                        // keyboardType={'email-address'}
                        // keyboardAppearance='dark'
                        onChangeText={(text) => this.validateName(text)}
                        value={this.state.name}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="words"
                        placeholder="Enter your name"
                        placeholderTextColor={Theme.color.placeholder}
                        onFocus={(e) => this.onFocusName()}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.nameY = y;
                        }}
                    />
                    {
                        this.state.showNameAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.nameY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 2. birthday */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'AGE (BIRTHDAY)'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    {/* picker */}
                    <TouchableOpacity
                        onPress={() => {
                            this.onFocusBirthday();

                            this.showDateTimePicker('What is your date of birth?');
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                width: '80%',
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.birthday ? this.state.birthday : "Select your birthday"}</Text>

                        {/* ToDo: add icon */}

                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.birthdayY = y;
                        }}
                    />
                    {
                        this.state.showAgeAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.birthdayY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 3. gender */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'GENDER'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        onOpen={() => this.onFocusGender()} // NOT work in Android
                        placeholder={{
                            label: "Select your gender",
                            value: null
                        }}
                        items={genderItems}
                        onValueChange={(value) => { // only for Android
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.setState({ gender: value });
                        }}
                        style={{
                            iconContainer: {
                                top: 5,
                                right: 100
                            }
                        }}
                        textInputProps={{
                            style: {
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular",
                                color: this.state.gender === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            }
                        }}
                        useNativeAndroidPickerStyle={false}
                        value={this.state.gender}

                        Icon={() => {
                            // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                            return null;
                        }}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.genderY = y;
                        }}
                    />
                    {
                        this.state.showGenderAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.genderY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 4. place */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'LOCATION'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.onUploadingImage) return;

                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY, animated: true });

                            setTimeout(() => {
                                !this.closed && this.props.navigation.navigate("editSearch",
                                    { from: 'EditProfile', initFromSearch: (result) => this.initFromSearch(result) }); // ToDo
                            }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                // height: textInputHeight,
                                minHeight: textInputHeight,
                                fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.place ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.place ? this.state.place : "Select your location"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.placeY = y;
                        }}
                    />
                    {
                        this.state.showPlaceAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.placeY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 6. note */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'NOTE'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={Platform.OS === 'ios' ? styles.textInputStyleIOS : styles.textInputStyleAndroid}
                        placeholder='More information about you'
                        placeholderTextColor={Theme.color.placeholder}
                        onChangeText={(text) => {
                            this.setState({ note: text, noteLength: text.length });
                        }}
                        value={this.state.note}
                        selectionColor={Theme.color.selection}

                        // keyboardType='default'
                        // returnKeyType='done'
                        // keyboardAppearance='dark'
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        // autoCapitalize="none"
                        maxLength={200}
                        multiline={true}
                        numberOfLines={4}
                        onFocus={(e) => {
                            this.onFocusNote();
                        }}
                        onBlur={(e) => this.onBlurNote()}
                    />
                    <Text style={{ color: Theme.color.placeholder, fontSize: 14, fontFamily: "Roboto-Regular", textAlign: 'right', paddingRight: 24, paddingBottom: 4 }}>
                        {this.state.noteLength}
                    </Text>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.noteY = y;
                        }}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.contactButton, { marginTop: Theme.spacing.large, marginBottom: 32 }]}
                // onPress={async () => await this.contact()}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>{'Delete this post'}</Text>
                </TouchableOpacity>
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

        // anonymous image
        if (pictures.length === 0) {
            pictures.push(
                <View style={styles.slide} key={`zero`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}
                    >
                        <Image
                            style={[styles.item, { backgroundColor: 'black', tintColor: 'white', resizeMode: 'contain' }]}
                            source={PreloadImage.user}
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
            // Consider: draw skeleton

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
        // test
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

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        let reviewCountText = '';
        if (reviewCount > 1) {
            reviewCountText = "(" + reviewCount.toString() + " reviews)";
        } else {
            reviewCountText = "(" + reviewCount.toString() + " review)";
        }

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
            // const width = Dimensions.get('window').width - Theme.spacing.small * 2 - 10 * 4;
            const width = Dimensions.get('window').width - Theme.spacing.small * 2 - 10 * 2;

            for (var i = 0; i < DEFAULT_REVIEW_COUNT; i++) {
                reviewArray.push(
                    <View key={i} style={{ paddingVertical: 4 }}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={124}>
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

            return (
                <View style={styles.reviewContainer}>
                    {reviewArray}
                </View>
            );
        } else {
            if (reviews.length === 0) {
                return null;
            }
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
                            <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Anonymous'}</Text>
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
                                    {/*
                                    <Text ref='delete' style={{ marginLeft: 4, fontFamily: "Roboto-Regular", color: "silver", fontSize: 14 }}>Delete</Text>
                                    */}
                                    <MaterialIcons name='close' color={'silver'} size={20} />
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
                                            {/*
                                            <Text ref='replyDelete' style={{ marginLeft: 4, fontFamily: "Roboto-Regular", color: "silver", fontSize: 14 }}>Delete</Text>
                                            */}
                                            <MaterialIcons name='close' color={'silver'} size={20} />
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
                                    {/*
                                    <Text ref='reply' style={{ marginLeft: 4, fontFamily: "Roboto-Regular", color: "silver", fontSize: 14 }}>Reply</Text>
                                    */}
                                    <MaterialIcons name='reply' color={'silver'} size={20} />
                                </TouchableOpacity>
                            </View>
                        }

                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                    </View>
                );
            } // end of for

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
                            // setTimeout(() => {
                            this.props.navigation.navigate("readReview",
                                {
                                    reviewStore: this.reviewStore,
                                    isOwner: this.state.isOwner,
                                    placeId: this.props.navigation.state.params.post.placeId,
                                    feedId: this.props.navigation.state.params.post.id,
                                    initFromReadAllReviews: () => this.initFromReadAllReviews()
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
                            <Text style={{ fontSize: 18, color: '#f1c40f', fontFamily: "Roboto-Regular" }}>Read all {post.reviewCount}+ reviews</Text>
                            <FontAwesome name='chevron-right' color="#f1c40f" size={20} style={{ position: 'absolute', right: 0 }} />
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
            if (this.closed) return;
            // const { post } = this.props.navigation.state.params;
            const post = this.state.post;

            // check if removed by the owner
            /*
            if (!this.isValidPost(post.placeId, post.id)) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }
            */

            const param = {
                post: post,
                rating: rating,
                initFromWriteReview: (result) => this.initFromWriteReview(result)
            };

            if (this.state.isModal) {
                this.props.navigation.navigate("writeReviewModal", param);
            } else {
                this.props.navigation.navigate("writeReview", param);
            }
        }, Cons.buttonTimeoutLong);
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('Post._keyboardDidShow');

        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (var i = 0; i < this.selectedItemIndex; i++) {
            var h = this.itemHeights[i];
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
    _keyboardDidHide() {
        if (!this.focused) return;

        console.log('Post._keyboardDidHide');

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

        !this.closed && this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
        this.owner = owner;
    }

    showNotification(msg) {
        if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        !this.closed && this.setState({ notification: msg }, () => {
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

    showDateTimePicker(title) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.setState({ datePickerTitle: title, showDatePicker: true });
    }

    _hideDateTimePicker = () => this.setState({ showDatePicker: false });

    _handleDatePicked = (date) => {
        console.log('A date has been picked: ', date);

        this._hideDateTimePicker();

        const _date = new Date(date);

        const day = _date.getDate();
        const month = _date.getMonth();
        const year = _date.getFullYear();
        /*
        console.log('day', day);
        console.log('month', month);
        console.log('year', year);
        */

        let _day = '';
        if (day < 10) {
            _day = '0' + day.toString();
        } else {
            _day = day.toString();
        }

        let _month = '';
        switch (month) {
            case 0: _month = 'JAN'; break;
            case 1: _month = 'FEB'; break;
            case 2: _month = 'MAR'; break;
            case 3: _month = 'APR'; break;
            case 4: _month = 'MAY'; break;
            case 5: _month = 'JUN'; break;
            case 6: _month = 'JUL'; break;
            case 7: _month = 'AUG'; break;
            case 8: _month = 'SEP'; break;
            case 9: _month = 'OCT'; break;
            case 10: _month = 'NOV'; break;
            case 11: _month = 'DEC'; break;
        }

        let _year = '';
        _year = year.toString();

        const birthday = _day + '  ' + _month + '  ' + _year;

        this.setState({ birthday, datePickerDate: _date });
    };

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
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
                if (this.state.showKeyboard) !this.closed && this.setState({ showKeyboard: false });

                // 1. reload reviews
                const post = this.state.post;
                const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                // 2. reload review count & calc chart
                const newPost = await this.reloadPost(post.placeId, post.id);
                const newChart = this.getChartInfo(newPost);
                !this.closed && this.setState({ post: newPost, chartInfo: newChart });

                this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
            }
        });
    }

    async addReply(message) {
        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        const placeId = post.placeId;
        const feedId = post.id;
        const reviewOwnerUid = this.reviewStore.reviews[this.selectedItemIndex].profile.uid;
        const reviewId = this.reviewStore.reviews[this.selectedItemIndex].review.id;
        const userUid = Firebase.user().uid;

        /*
        const result = await Firebase.addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message);
        if (!result) {
            this.refs["toast"].show('The user no longer exists.', 500);
        }
        */
        await Firebase.addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message);
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
                    // 1. reload reviews
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                    // 2. reload review count & calc chart
                    const newPost = await this.reloadPost(post.placeId, post.id);
                    const newChart = this.getChartInfo(newPost);
                    !this.closed && this.setState({ post: newPost, chartInfo: newChart });

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
                    // 1. reload reviews
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query, DEFAULT_REVIEW_COUNT);

                    // 2. reload review count & calc chart
                    const newPost = await this.reloadPost(post.placeId, post.id);
                    const newChart = this.getChartInfo(newPost);
                    !this.closed && this.setState({ post: newPost, chartInfo: newChart });

                    this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
                }
            });
        });
    }

    openDialog(title, message, callback) {
        !this.closed && this.setState({ dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) !this.closed && this.setState({ dialogVisible: false });
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
        marginLeft: 8,
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "Roboto-Light"
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
        // paddingLeft: 5,
        paddingHorizontal: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    distanceButton: {
        // paddingLeft: 5,
        paddingHorizontal: 5,
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
        // marginHorizontal: 10,
        padding: 10,
    },
    reviewName: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light",
        marginLeft: 'auto'
    },
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 14,
        // lineHeight: 13,
        fontFamily: "Roboto-Regular",
        // paddingTop: Theme.spacing.xSmall
        // paddingTop: 1
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Regular"
    },
    replyOwner: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-MediumItalic"
    },
    replyDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light",
        marginLeft: 'auto'
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
    },
    textInputStyleIOS: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)',
        minHeight: 52
    },
    textInputStyleAndroid: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)',
        height: 84,
        textAlignVertical: 'top'
    },
    done: {
        fontSize: 17,
        fontFamily: 'System',
        // fontWeight: 'bold',
        fontWeight: '500',

        // color: Theme.color.selection,
        color: 'rgb(30, 117, 212)',
        // backgroundColor: 'grey',
        alignSelf: 'center'
    }
});
