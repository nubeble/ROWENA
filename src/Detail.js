import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Platform,
    FlatList, TouchableWithoutFeedback, Alert, Image, Keyboard, TextInput, StatusBar, BackHandler
} from 'react-native';
import { Constants, Permissions, ImagePicker, Linking, MapView, Svg } from "expo";
import Ionicons from "react-native-vector-icons/Ionicons";
// import { Ionicons as Icon } from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import Firebase from "./Firebase";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import moment from 'moment';
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
import Swiper from './Swiper';
import { Rating, AirbnbRating } from './react-native-ratings/src';
import autobind from "autobind-decorator";
import { observer } from "mobx-react/native";
import ReviewStore from "./ReviewStore";
import ReadMore from "./ReadMore";
import AwesomeAlert from 'react-native-awesome-alerts';
import { Globals } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);


const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";
const bodyInfoContainerPaddingHorizontal = Theme.spacing.small;
const bodyInfoContainerPaddingVertical = Theme.spacing.small;
const bodyInfoItemWidth = Dimensions.get('window').width / 5;
// const bodyInfoItemHeight = bodyInfoItemWidth;
const bodyInfoItemHeight = Dimensions.get('window').height / 12;


@observer // for reviewStore
export default class Detail extends React.Component {
    reviewStore: ReviewStore = new ReviewStore();

    replyViewHeight = Dimensions.get('window').height / 9;

    alertCallback = null;

    state = {
        rating: 0,
        // isNavigating: false,
        renderList: false,
        isOwner: false,

        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0),

        showAlert: false,
        alertMessage: '',

        // likesButtonAnimation: new Animated.Value(0),
        liked: false,
    };

    constructor(props) {
        super(props);

        this.itemHeights = {};

        this.springValue = new Animated.Value(1);
    }

    onGoBack(result) { // back from rating
        console.log('Detail.onGoBack', result);

        this.setState({ rating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating

        // reload reviews
        if (result) {
            const { post } = this.props.navigation.state.params;
            const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
            this.reviewStore.init(query);



            // ToDo: check!
            this._flatList.scrollToOffset({ offset: this.reviewsContainerY, animated: false });
        }
    }

    componentDidMount() {
        console.log('Detail.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { post } = this.props.navigation.state.params;
        this.init(post);

        setTimeout(() => {
            !this.isClosed && this.setState({ renderList: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        // this.goBack(); // works best when the goBack is async

        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            this.props.navigation.goBack();
        }

        return true;
    }

    @autobind
    onFocus() {
        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    init(post) {
        const isOwner = this.isOwner(post.uid, Firebase.user().uid);
        this.setState({ isOwner });

        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query);
    }

    componentWillUnmount() {
        console.log('Detail.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.isClosed = true;
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    @autobind
    toggle() {
        // check the owner of the post
        const { post } = this.props.navigation.state.params;

        if (Firebase.user().uid === post.uid) {
            this.refs["toast"].show('Sorry, You can not call dibs on your post.', 500, () => {
                if (!this.isClosed) {
                    // ToDo:
                }
            });

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
        } else {
            this.setState({ liked: false });
        }
        
        const placeId = post.placeId;
        const feedId = post.id;
        const uid = Firebase.user().uid;

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        // await Firebase.firestore.runTransaction(async transaction => {
        Firebase.firestore.runTransaction(async transaction => {
            // update count
            const postDoc = await transaction.get(feedRef);
            const { likes } = postDoc.data();

            const idx = likes.indexOf(uid);
            if (idx === -1) {
                likes.push(uid);
            } else {
                likes.splice(idx, 1);
            }

            transaction.update(feedRef, { likes });


            // save to user profile
            const userDoc = await transaction.get(userRef);
            // const { likes } = userDoc.data();
            const _likes = userDoc.data().likes;

            let _idx = -1;

            for (var i = 0; i < _likes.length; i++) {
                const item = _likes[i];
                if (item.feedId === feedId) {
                    _idx = i;
                    break;
                }
            }

            if (_idx === -1) { // add
                const data: LikeRef = {
                    placeId: placeId,
                    feedId: feedId,
                    picture: uri
                }
                _likes.push(data);
            } else { // remove
                _likes.splice(_idx, 1);
            }

            transaction.update(userRef, { likes: _likes });
        });
    }

    render() {
        const { post } = this.props.navigation.state.params;

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

                <View style={styles.searchBar}>
                    <TouchableOpacity
                        // style={{ marginTop: Constants.statusBarHeight + Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        // style={{ marginTop: Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/*
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => Alert.alert("Not Implemented")}
                    >
                        <Ionicons name='md-heart-empty' color="rgba(255, 255, 255, 0.8)" size={24}/>
                    </TouchableOpacity>
                    */}
                    <TouchableWithoutFeedback onPress={this.toggle}>
                        <View style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            justifyContent: "center", alignItems: "center"
                        }}>
                            {
                                this.state.liked ? // false -> true
                                    <AnimatedIcon name="md-heart" color="red" size={24} style={{ transform: [{ scale: this.springValue }] }} />
                                    :
                                    <Ionicons name="md-heart-empty" color="rgba(255, 255, 255, 0.8)" size={24} />
                            }
                        </View>
                    </TouchableWithoutFeedback>




                    {/*
                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center',
                            paddingBottom: 4
                        }}
                    >{post.name}</Text>
                    */}
                </View>

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
                            ListHeaderComponent={(
                                <View>
                                    {/* profile pictures */}
                                    {this.renderSwiper(post)}

                                    <View style={styles.infoContainer}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <View style={styles.circle}></View>
                                            <Text style={styles.date}>Activate {moment(post.timestamp).fromNow()}</Text>
                                        </View>
                                        {/*
                                        <Text style={styles.name}>{post.name}</Text>
                                        <Text style={styles.size}>
                                            {post.age}yrs  {post.height}cm  {post.weight}kg  {post.bust}cup
                                        </Text>
                                        */}
                                        <Text style={styles.name}>{post.name === 'name' ? 'Anna' : post.name}</Text>
                                        {/*
                                        <View style={{
                                            // backgroundColor: 'green',
                                            width: '100%',
                                            flexDirection: 'row',
                                            alignItems: 'center', justifyContent: 'center',
                                            paddingVertical: bodyInfoContainerPaddingVertical,
                                            paddingHorizontal: bodyInfoContainerPaddingHorizontal
                                        }}
                                        >
                                            <View style={{ backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                                alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={styles.bodyInfoTitle}>Age</Text>
                                                <Text style={styles.bodyInfoContent}>20</Text>
                                            </View>
                                            <View
                                                style={{
                                                    borderLeftWidth: 5,
                                                    borderLeftColor: Theme.color.line,
                                                    //height: bodyInfoItemHeight * 0.5
                                                }}
                                            />
                                            <View style={{ backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                                alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={styles.bodyInfoTitle}>Height</Text>
                                                <Text style={styles.bodyInfoContent}>164</Text>
                                            </View>
                                            <View
                                                style={{
                                                    borderLeftWidth: 5,
                                                    borderLeftColor: Theme.color.line,
                                                    //height: bodyInfoItemHeight * 0.5
                                                }}
                                            />
                                            <View style={{ backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                                alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={styles.bodyInfoTitle}>Weight</Text>
                                                <Text style={styles.bodyInfoContent}>48</Text>
                                            </View>
                                            <View
                                                style={{
                                                    borderLeftWidth: 5,
                                                    borderLeftColor: Theme.color.line,
                                                    //height: bodyInfoItemHeight * 0.5
                                                }}
                                            />
                                            <View style={{ backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                                alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={styles.bodyInfoTitle}>Bust Size</Text>
                                                <Text style={styles.bodyInfoContent}>C</Text>
                                            </View>
                                        </View>
                                        */}
                                        <View style={{
                                            // backgroundColor: 'green',
                                            width: '100%',
                                            flexDirection: 'row',
                                            alignItems: 'center', justifyContent: 'center',
                                            paddingVertical: bodyInfoContainerPaddingVertical,
                                            paddingHorizontal: bodyInfoContainerPaddingHorizontal
                                        }}
                                        >
                                            <View style={{
                                                width: '50%', height: bodyInfoItemHeight,
                                                alignItems: 'flex-start', justifyContent: 'space-between'
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: 'white' }}
                                                        source={PreloadImage.birth}
                                                    // tintColor={'white'} // not working in ios
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>20 years old</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, marginTop: 2, tintColor: 'white' }}
                                                        source={PreloadImage.scale}
                                                    // tintColor={'white'}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>48 kg</Text>
                                                </View>
                                            </View>
                                            <View style={{
                                                width: '50%', height: bodyInfoItemHeight,
                                                alignItems: 'flex-start', justifyContent: 'space-between'
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: 'white' }}
                                                        source={PreloadImage.ruler}
                                                    // tintColor={'white'}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>164 cm</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        style={{ width: 20, height: 20, tintColor: 'white' }}
                                                        source={PreloadImage.bra}
                                                    // tintColor={'white'}
                                                    />
                                                    <Text style={styles.bodyInfoTitle}>C cup</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 1, paddingBottom: Theme.spacing.tiny }}>
                                            <MaterialIcons style={{ marginLeft: 1, marginTop: 1 }} name='location-on' color={'white'} size={16} />
                                            <Text style={styles.distance}>24 km away</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 1, paddingBottom: Theme.spacing.tiny }}>
                                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                                <AirbnbRating
                                                    count={5}
                                                    readOnly={true}
                                                    showRating={false}
                                                    defaultRating={4}
                                                    size={16}
                                                    margin={1}
                                                />
                                            </View>

                                            {/* ToDo: draw stars based on averge rating & get review count
                                                        {post.averageRating}
                                                    */}
                                            <Text style={styles.rating}>4.4</Text>

                                            <AntDesign style={{ marginLeft: 12, marginTop: 1 }} name='message1' color="white" size={16} />
                                            <Text style={styles.reviewCount}>12</Text>
                                        </View>

                                        {/*
                                                    <Text style={styles.note}>{tmp}</Text>
                                                */}
                                        <Text style={styles.note}>{post.note === 'note' ? tmp : post.note}</Text>
                                    </View>

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                    {/* map */}
                                    <View style={styles.mapContainer}>
                                        <TouchableOpacity activeOpacity={0.5}
                                            onPress={() => {
                                                setTimeout(() => {
                                                    /*
                                                    this.setState({ isNavigating: true }, () => {
                                                        this.props.navigation.navigate("map", { post: post });
                                                    });
                                                    */
                                                    this.props.navigation.navigate("map", { post: post });
                                                }, Globals.buttonTimeoutLong);
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
                                        {/* Consider: show review chart */}
                                        <Image
                                            style={{ width: '100%', height: 140, marginBottom: 10 }}
                                            resizeMode={'cover'}
                                            source={require('../assets/sample1.jpg')}
                                        />

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
                                                defaultRating={this.state.rating}
                                                size={32}
                                                margin={3}
                                            />
                                        </View>
                                    </View>

                                    <View style={{ borderBottomColor: this.state.isOwner ? 'transparent' : Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small }} />

                                    {
                                        !this.state.isOwner &&
                                        <TouchableOpacity
                                            style={[styles.contactButton, { marginTop: Theme.spacing.small + Theme.spacing.small, marginBottom: Theme.spacing.small + Theme.spacing.small }]}
                                            onPress={async () => this.contact()}
                                        >
                                            <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)', paddingTop: Globals.submitButtonPaddingTop() }}>Contact</Text>
                                        </TouchableOpacity>
                                    }
                                </View>
                            )}

                        /*
                        ListFooterComponent={
                            this.state.isNavigating && (
                                <View style={{ width: '100%', height: 100 }} // 100: (enough) height of tab bar
                                />
                            )
                        }
                        */
                        // scrollEventThrottle={1}
                        // columnWrapperStyle={undefined}
                        // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                        // {...{ onScroll }}
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
                                fontFamily: "SFProText-Regular",
                                color: "white",
                                textAlign: 'justify',
                                textAlignVertical: 'top',
                                backgroundColor: '#212121'
                            }}
                            placeholder='Reply to a review...'
                            placeholderTextColor={Theme.color.placeholder}
                            onChangeText={(text) => this.onChangeText(text)}

                            selectionColor={Theme.color.selection}
                            keyboardAppearance={'dark'}
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

                <AwesomeAlert
                    show={this.state.showAlert}
                    showProgress={false}
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="YES"
                    confirmText="NO"
                    confirmButtonColor="#DD6B55"
                    // title={"Want to leave " + name + "?"}
                    title={this.state.alertMessage}
                    // message="I have a message for you!"
                    onCancelPressed={async () => {
                        this.setState({ showAlert: false });

                        // pressed YES
                        console.log('YES');

                        if (this.alertCallback) {
                            this.alertCallback();
                            this.alertCallback = null;
                        }
                    }}
                    onConfirmPressed={() => {
                        this.setState({ showAlert: false });
                    }}

                    contentContainerStyle={{ width: '80%', height: Globals.alertHeight, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "space-between" }}
                    titleStyle={{ fontSize: 18, fontFamily: "SFProText-Regular", color: '#FFF' }}
                    cancelButtonStyle={{ marginBottom: 12, width: 100, paddingTop: 10, paddingBottom: 8, backgroundColor: "rgba(255, 0, 0, 0.6)" }}
                    cancelButtonTextStyle={{ textAlign: 'center', fontSize: 16, lineHeight: 16, fontFamily: "SFProText-Regular" }}
                    confirmButtonStyle={{ marginBottom: 12, marginLeft: Globals.alertButtonMarginLeft, width: 100, paddingTop: 10, paddingBottom: 8, backgroundColor: "rgba(255, 255, 255, 0.6)" }}
                    confirmButtonTextStyle={{ textAlign: 'center', fontSize: 16, lineHeight: 16, fontFamily: "SFProText-Regular" }}
                />

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
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
                    <SmartImage
                        showSpinner={false}
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }


        return (
            <Swiper
                style={styles.wrapper}
                // containerStyle={{ marginBottom: 10 }}
                width={Dimensions.get('window').width}
                // height={Dimensions.get('window').width / 16 * 9}
                height={Dimensions.get('window').width}
                loop={false}
                autoplay={false}
                autoplayTimeout={3}
                paginationStyle={{ bottom: 4 }}
            >
                {pictures}
            </Swiper>
        );
    }

    renderReviews(reviews) { // draw items up to 4
        console.log('Detail.renderReviews');

        const width = Dimensions.get('window').width - Theme.spacing.small * 2 - 10 * 4;

        let reviewArray = [];

        const { post } = this.props.navigation.state.params;
        const reviewLength = post.reviewCount;

        if (reviews === undefined) {
            for (var i = 0; i < 4; i++) {
                reviewArray.push(
                    <View key={i}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton} secondaryColor="grey" width={width} height={120}>
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
        } else {
            console.log('reviews length', reviews.length);

            for (var i = 0; i < reviews.length; i++) {
                if (i > 3) break;

                const review = reviews[i];

                const _profile = review.profile;
                const _review = review.review;
                // const _ref = 'review' + i;
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

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* ToDo: draw stars based on averge rating & get review count */}
                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                <AirbnbRating
                                    count={5}
                                    readOnly={true}
                                    showRating={false}
                                    defaultRating={4}
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
                                {/*
                                <Text style={styles.reviewText}>{tmp}</Text>
                                */}
                                <Text style={styles.reviewText}>{_review.comment}</Text>
                            </ReadMore>
                        </View>

                        {
                            isMyReview && !reply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                    onPress={() => this.removeReview(index)}
                                >
                                    <Text ref='delete' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Delete</Text>
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
                                    {/*
                                    <Text style={styles.reviewText}>{tmp}</Text>
                                    */}
                                    <Text style={styles.replyComment}>{reply.comment}</Text>
                                </ReadMore>

                                {
                                    isMyReply && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                                onPress={() => this.removeReply(index)}
                                            >
                                                <Text ref='replyDelete' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )
                                }
                            </View>
                        }

                        {
                            this.state.isOwner && !reply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }} onPress={() => this.openKeyboard(ref, index, _profile.uid)}>
                                    <Text ref='reply' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        }

                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                    </View>
                );
            } // end of for
        }


        return (
            <View style={styles.reviewContainer}>
                {reviewArray}

                {/* Read all ??? reviews button */}
                <TouchableOpacity
                    onPress={() => {
                        setTimeout(() => {
                            this.props.navigation.navigate("readReview",
                                {
                                    reviewStore: this.reviewStore,
                                    isOwner: this.state.isOwner,
                                    placeId: this.props.navigation.state.params.post.placeId,
                                    feedId: this.props.navigation.state.params.post.id
                                });
                        }, Globals.buttonTimeoutShort);
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
                        <Text style={{ fontSize: 16, color: '#f1c40f', fontFamily: "SFProText-Regular" }}>Read all {reviewLength}+ reviews</Text>
                        <FontAwesome name='chevron-right' color="#f1c40f" size={16} style={{ position: 'absolute', right: 12 }} />

                    </View>
                </TouchableOpacity>

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
            </View>
        );
    }

    onLayoutReviewsContainer = (event) => {
        // console.log('onLayoutReviewsContainer', event.nativeEvent.layout);
        const { y } = event.nativeEvent.layout;
        this.reviewsContainerY = y;
    }

    @autobind
    onItemLayout(event, index) {
        const { x, y, width, height } = event.nativeEvent.layout;
        console.log(index, height);

        this.itemHeights[index] = height;
    }

    @autobind
    ratingCompleted(rating) {
        // console.log("Rating is: " + rating);

        setTimeout(() => {
            /*
            this.setState({ isNavigating: true }, () => {
                const { post, profile } = this.props.navigation.state.params;
                this.props.navigation.navigate("writeReview", { post: post, rating: rating, onGoBack: (result) => this.onGoBack(result) });
            });
            */
            const { post } = this.props.navigation.state.params;
            this.props.navigation.navigate("writeReview", { post: post, rating: rating, onGoBack: (result) => this.onGoBack(result) });
        }, 500); // 0.5 sec
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('Detail._keyboardDidShow');

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
        const searchBarHeight = Globals.searchBarHeight; // OK

        const gap = Dimensions.get('window').height - keyboardHeight - this.replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true }); // precisely fit!
    }

    @autobind
    _keyboardDidHide() {
        if (!this.focused) return;

        console.log('Detail._keyboardDidHide');

        this.setState({ showKeyboard: false, bottomPosition: Dimensions.get('window').height });

        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;
        this.owner = undefined;

        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
        }
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

    showNotification = (msg) => {
        if (!this._showNotification) {
            this._showNotification = true;

            this.setState({ notification: msg },
                () => {
                    this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                        this.state.offset.setValue(height * -1);

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
                }
            );

            StatusBar.setHidden(true);
        }
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
            this._showNotification = false;
        }
    }

    async contact() {
        const { post } = this.props.navigation.state.params;

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

        this.refs["toast"].show('Your reply has been submitted!', 500, () => {
            if (!this.isClosed) {
                // this._reply.blur();
                if (this.state.showKeyboard) this.setState({ showKeyboard: false });

                // Consider: reload only the added review!
                const { post } = this.props.navigation.state.params;
                const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                this.reviewStore.init(query);
            }
        });
    }

    async addReply(message) {
        const { post } = this.props.navigation.state.params;

        const placeId = post.placeId;
        const feedId = post.id;
        const reviewId = this.reviewStore.reviews[this.selectedItemIndex].review.id;
        const userUid = Firebase.user().uid; // 리뷰를 쓴 사람

        await Firebase.addReply(placeId, feedId, reviewId, userUid, message);
    };

    removeReview(index) {
        // show dialog
        this.showAlert('Are you sure you want to delete this review?', async () => {
            const { post } = this.props.navigation.state.params;

            const placeId = post.placeId;
            const feedId = post.id;
            const reviewId = this.reviewStore.reviews[index].review.id;
            const userUid = Firebase.user().uid;

            await Firebase.removeReview(placeId, feedId, reviewId, userUid);

            this.refs["toast"].show('Your review has successfully been removed.', 500, () => {
                if (!this.isClosed) {
                    // refresh UI
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query);
                }
            });
        });
    }

    showAlert(message, callback) {
        this.setAlertCallback(callback);

        this.setState({ alertMessage: message, showAlert: true });
    }

    setAlertCallback(callback) {
        this.alertCallback = callback;
    }

    async removeReply(index) {
        // show dialog
        this.showAlert('Are you sure you want to delete this reply?', async () => {
            const { post } = this.props.navigation.state.params;

            const placeId = post.placeId;
            const feedId = post.id;
            const reviewId = this.reviewStore.reviews[index].review.id;
            const replyId = this.reviewStore.reviews[index].review.reply.id;
            const userUid = Firebase.user().uid;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.refs["toast"].show('Your reply has successfully been removed.', 500, () => {
                if (!this.isClosed) {
                    // refresh UI
                    const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                    this.reviewStore.init(query);
                }
            });
        });
    }

    sendPushNotification(message) {
        const { post } = this.props.navigation.state.params;

        const sender = Firebase.user().uid;
        const senderName = Firebase.user().name;
        // const receiver = post.uid; // owner
        const receiver = this.owner;
        const data = {
            message: message,
            placeId: post.placeId,
            feedId: post.id
        };

        sendPushNotification(sender, senderName, receiver, Globals.pushNotification.reply, data);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Globals.searchBarHeight,
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
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width
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
        // backgroundColor: 'rgb(70, 154, 32)',
        height: 14,
        paddingTop: Globals.lastLogInDatePaddingTop(),
        marginLeft: 8,
        fontSize: 14,
        lineHeight: 14,
        fontFamily: "SFProText-Light",
        color: Theme.color.text2
    },
    name: {
        color: 'white',
        fontSize: 24,
        fontFamily: "SFProText-Semibold",
        marginTop: Theme.spacing.xSmall,
        paddingTop: Theme.spacing.xSmall,
        // paddingBottom: Theme.spacing.xSmall
    },
    /*
    size: {
        color: "white",
        fontSize: 18,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    */
    bodyInfoTitle: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        paddingTop: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.tiny,
        // backgroundColor: 'green'
    },
    bodyInfoContent: {
        color: 'white',
        fontSize: 18,
        fontFamily: "SFProText-Bold",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    distance: {
        paddingLeft: 5,

        color: 'white',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        // paddingTop: Theme.spacing.xSmall
        paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },

    rating: {
        marginLeft: 5,

        color: '#f1c40f',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        // paddingTop: Theme.spacing.xSmall
        paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },
    reviewCount: {
        marginLeft: 5,

        color: 'white',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        // paddingTop: Theme.spacing.xSmall
        paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },
    note: {
        marginTop: 5,

        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.small,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,

        backgroundColor: 'rgb(34, 34, 34)',
        borderRadius: 5,
        // borderColor: "transparent",
        borderWidth: 0,
    },
    mapContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
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
        color: 'grey',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 16,
        fontFamily: "SFProText-Regular",
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
        // borderRadius: 3,
        // borderColor: 'rgba(0,0,0,0.1)',
        // borderWidth: 1,
        // backgroundColor: 'yellow',
    },
    reviewText: {
        // color: 'rgba(255, 255, 255, 0.8)',
        color: 'silver',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "SFProText-Regular"
    },
    /*
    reviewName: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
    },
    reviewDate: {
        // backgroundColor: 'red',
        marginLeft: 20,
        color: 'grey',
        fontSize: 14,
        lineHeight: 15,
        // lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },
    */
    reviewName: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
    },
    reviewDate: {
        color: 'grey',
        fontSize: 14,
        fontFamily: "SFProText-Light",
        marginLeft: 'auto'
    },
    reviewRating: {
        marginLeft: 4,

        color: '#f1c40f',
        fontSize: 13,
        lineHeight: 13,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.xSmall
        // paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },
    replyOwner: {
        // color: "rgb(170, 170, 170)",
        color: "#E5E5E5",
        fontSize: 14,
        // lineHeight: 18,
        fontFamily: "SuisseIntl-ThinItalic"
    },
    replyDate: {
        color: 'grey',
        fontSize: 14,
        fontFamily: "SFProText-Light",
        marginLeft: 'auto'
    },
    replyComment: {
        color: 'white',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "SuisseIntl-ThinItalic"
    },
    contactButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notification: {
        position: "absolute",
        width: '100%',
        height: Constants.statusBarHeight + 10,
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    notificationText: {
        position: 'absolute',
        // bottom: 0,
        alignSelf: 'center',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        color: "#FFF"
    },
    notificationButton: {
        position: 'absolute',
        right: 18,
        // bottom: 0,
        // alignSelf: 'baseline'
    },





});
