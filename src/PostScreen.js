/*
 * Copied from detail.js
*/

import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, Platform, Dimensions, FlatList, SafeAreaView,
    TouchableWithoutFeedback, ActivityIndicator, Animated, Image, Keyboard, TextInput, StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Constants, MapView } from 'expo';
import { Text, Theme } from "./rnff/src/components";
import moment from 'moment';
import SmartImage from "./rnff/src/components/SmartImage";
import Swiper from './Swiper';
import { AirbnbRating } from './react-native-ratings/src';
import ReviewStore from "./ReviewStore";
import Firebase from "./Firebase";
import autobind from "autobind-decorator";
import { observer } from "mobx-react/native";
import ReadMore from "./ReadMore";
import Toast, { DURATION } from 'react-native-easy-toast';
import { NavigationActions } from 'react-navigation';
import { Globals } from "./Globals";

// const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";


@observer
export default class PostScreen extends React.Component {
    reviewStore: ReviewStore = new ReviewStore();

    replyViewHeight = Dimensions.get('window').height / 9;

    state = {
        rating: 0,
        renderList: false,
        isOwner: false,

        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0)
    };

    constructor(props) {
        super(props);

        this.itemHeights = {};
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
                {/* alert */}
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
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.props.navigation.dispatch(NavigationActions.back())}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center',
                            paddingBottom: 4
                        }}
                    >{post.name}</Text>
                </View>

                {
                    !this.state.renderList ?
                        <ActivityIndicator
                            style={{
                                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0
                            }}
                            animating={true}
                            size="large"
                            color='grey'
                        />
                        :
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
                                    <SafeAreaView>

                                        {/* profile pictures */}
                                        {this.renderSwiper(post)}

                                        <View style={styles.infoContainer}>
                                            <TouchableWithoutFeedback
                                            // onPress={this.profile}
                                            >
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                    <View style={styles.circle}></View>
                                                    <Text style={styles.date}>Activate {moment(post.timestamp).fromNow()}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>

                                            <Text style={styles.name}>{post.name}</Text>
                                            <Text style={styles.size}>
                                                {post.age} yr {post.height} cm {post.weight} kg
                                                        </Text>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
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

                                            <Text style={styles.note}>{post.note}</Text>
                                        </View>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                        {/* map */}
                                        <View style={styles.mapContainer}>
                                            <TouchableOpacity activeOpacity={0.5}
                                                onPress={() => this.props.navigation.navigate("mapModal", { post: post })}
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
                                            {/* ToDo: show review chart */}
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

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                        {/*
                                            <TouchableOpacity onPress={async () => this.contact()} style={[styles.contactButton, { marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }]} >
                                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>Contact</Text>
                                            </TouchableOpacity>
                                            */}

                                    </SafeAreaView>
                                )}
                            />
                        </TouchableWithoutFeedback>
                }

                {
                    this.state.showKeyboard && (
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
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                                keyboardAppearance={'dark'}
                                onChangeText={(text) => this.onChangeText(text)}
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
                    )
                }

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

    onGoBack(result) { // back from rating
        console.log('PostModal::onGoBack', result);

        this.setState({ rating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating

        // reload reviews
        if (result) {
            const { post } = this.props.navigation.state.params;
            const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
            this.reviewStore.init(query);
        }
    }

    componentDidMount() {
        console.log('PostModal::componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

        const { post } = this.props.navigation.state.params;
        this.init(post);
    }

    init(post) {
        const isOwner = this.isOwner(post.uid, Firebase.uid());
        this.setState({ isOwner });

        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query);

        setTimeout(() => {
            !this.isClosed && this.setState({ renderList: true });
        }, 500);
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    componentWillUnmount() {
        console.log('PostModal::componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        this.isClosed = true;
    }

    renderReviews(reviews) { // draw items up to 4
        console.log('PostModal::renderReviews');

        const reviewArray = [];

        const { post } = this.props.navigation.state.params;
        let reviewLength = post.reviewCount;

        if (reviews === undefined) {
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
        } else {
            console.log('reviews length', reviews.length);

            for (var i = 0; i < reviews.length; i++) {
                if (i > 3) break;

                const review = reviews[i];

                const _profile = review.profile;
                const _review = review.review;
                const ref = _review.id;
                const index = i;
                const reply = _review.reply;
                const isMyReview = this.isOwner(_review.uid, Firebase.uid());
                let isMyReply = undefined;
                if (reply) isMyReply = this.isOwner(reply.uid, Firebase.uid());


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
                                <Text style={styles.reviewText}>{_review.comment}</Text>
                            </ReadMore>
                        </View>

                        {
                            isMyReview && !reply && (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                        onPress={() => this.removeReview(index)}
                                    >
                                        <Text ref='delete' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        }

                        {
                            // comment, id, timestamp, uid
                            reply && (
                                <View style={{
                                    paddingTop: Theme.spacing.tiny,
                                    paddingBottom: Theme.spacing.tiny,
                                    paddingLeft: Theme.spacing.tiny,
                                    paddingRight: Theme.spacing.tiny,
                                    backgroundColor: Theme.color.highlight, borderRadius: 2
                                }}>

                                    <View style={{ flexDirection: 'row', paddingBottom: Theme.spacing.xSmall }}>
                                        <Text style={styles.replyOwner}>Management Response</Text>
                                        <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                                    </View>

                                    <ReadMore
                                        numberOfLines={2}
                                    >
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
                            )
                        }

                        {
                            this.state.isOwner && !reply && (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <TouchableOpacity style={{ alignSelf: 'baseline' }} onPress={() => this.showKeyboard(ref, index)}>
                                        <Text ref='reply' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Reply</Text>
                                    </TouchableOpacity>
                                </View>
                            )
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
                        this.props.navigation.navigate("readReviewModal",
                            {
                                reviewStore: this.reviewStore,
                                isOwner: this.state.isOwner,
                                placeId: post.placeId,
                                feedId: post.id
                            });
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
        const { post } = this.props.navigation.state.params;

        setTimeout(() => {
            this.props.navigation.navigate("writeReviewModal", { post: post, rating: rating, onGoBack: (result) => this.onGoBack(result) });
        }, 500); // 0.5 sec
    }

    @autobind
    _keyboardDidShow(e) {
        this.setState({ bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

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
        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;

        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
        }

        this.setState({ bottomPosition: Dimensions.get('window').height });
    }

    showKeyboard(ref, index) {
        if (this.state.showKeyboard) return;

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
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

    sendReply() {
        const message = this._reply._lastNativeText;
        console.log('message', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');

            return;
        }

        this.addReply(message);

        this.refs.toast.show('Your reply has been submitted!', 500, () => {
            if (!this.isClosed) {
                // this._reply.blur();
                this.setState({ showKeyboard: false });

                // ToDo: reload only the added review!
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
        const userUid = Firebase.uid(); // 리뷰를 쓴 사람

        await Firebase.addReply(placeId, feedId, reviewId, userUid, message);
    };

    async removeReview(index) {
        // ToDo: show dialog

        const { post } = this.props.navigation.state.params;

        const placeId = post.placeId;
        const feedId = post.id;
        const reviewId = this.reviewStore.reviews[index].review.id;
        const userUid = Firebase.uid();

        await Firebase.removeReview(placeId, feedId, reviewId, userUid);

        this.refs.toast.show('Your review has successfully been removed.', 500, () => {
            if (!this.isClosed) {
                // refresh UI
                const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                this.reviewStore.init(query);
            }
        });
    }

    async removeReply(index) {
        // ToDo: show dialog

        const { post } = this.props.navigation.state.params;

        const placeId = post.placeId;
        const feedId = post.id;
        const reviewId = this.reviewStore.reviews[index].review.id;
        const replyId = this.reviewStore.reviews[index].review.reply.id;
        const userUid = Firebase.uid();

        await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

        this.refs.toast.show('Your reply has successfully been removed.', 500, () => {
            if (!this.isClosed) {
                // refresh UI
                const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
                this.reviewStore.init(query);
            }
        });
    }
};

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
    container: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.small
    },
    infoContainer: {
        flex: 1,
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
        height: 14,
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
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    size: {
        color: "white",
        fontSize: 18,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    rating: {
        marginLeft: 5,

        color: '#f1c40f',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        paddingTop: parseInt(Dimensions.get('window').height / 100) - 2

    },
    reviewCount: {
        marginLeft: 5,

        color: 'white',
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },
    note: {
        color: 'silver',
        fontSize: 16,
        lineHeight: 32,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
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
    },
    reviewText: {
        color: 'silver',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "SFProText-Regular"
    },
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
    },
    replyOwner: {
        color: "#E5E5E5",
        fontSize: 14,
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
    }
});
