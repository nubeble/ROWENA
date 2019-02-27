import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import {
    StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList, BackHandler,
    ActivityIndicator, TouchableOpacity, Keyboard, TextInput, TouchableWithoutFeedback
} from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants, Svg } from "expo";
import { Text, Theme, Avatar } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
// import ReadMore from "./ReadMore";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Cons } from "./Globals";
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';

type FlatListItem<T> = {
    item: T
};

const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";


export default class ReadAllReviewScreen extends React.Component {
    replyViewHeight = Dimensions.get('window').height / 9;

    state = {
        renderReview: false,
        isLoadingReview: false,
        // reviewLength: 0,
        isOwner: false,
        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0),

        refreshing: false,

        showAlert: false,
        alertTitle: '',
        alertMessage: ''
    };

    constructor(props) {
        super(props);

        this.itemHeights = [];
        this.lastItemIndex = 0;
    }

    componentDidMount() {
        // console.log('ReadAllReviewScreen.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const { reviewStore, isOwner } = this.props.navigation.state.params;

        // console.log('reviews', reviewStore.reviews);

        this.setState({ isOwner });

        reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        // reviewStore.checkForNewEntries(); // do not use here!
        this.loadReviewFromTheStart();

        setTimeout(() => {
            !this.closed && this.setState({ renderReview: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished() {
        console.log('onAddToReviewFinished');

        !this.closed && this.setState({ isLoadingReview: false, refreshing: false });
    }

    @autobind
    handleHardwareBackPress() {
        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            this.props.navigation.goBack();
        }

        return true;
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;

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
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    this.state.renderReview &&
                    <TouchableWithoutFeedback
                        onPress={() => {
                            if (this.state.showKeyboard) this.setState({ showKeyboard: false });
                        }}
                    >
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            data={reviews}
                            keyExtractor={this.keyExtractor}
                            renderItem={this.renderItem}
                            onEndReachedThreshold={0.5}
                            onEndReached={this.loadMore}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator

                            ListEmptyComponent={this.renderListEmptyComponent}
                            ListFooterComponent={
                                this.state.isLoadingReview &&
                                <ActivityIndicator
                                    style={styles.bottomIndicator}
                                    animating={true}
                                    size="small"
                                    color='grey'
                                />
                            }

                            ItemSeparatorComponent={this.itemSeparatorComponent}

                            onRefresh={this.handleRefresh}
                            refreshing={this.state.refreshing}
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
                                numberOfLines={3}
                                style={{
                                    flex: 0.85,

                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    paddingLeft: 10,
                                    paddingRight: 10,

                                    borderRadius: 5,
                                    fontSize: 14,
                                    fontFamily: "SFProText-Regular",
                                    color: "white", textAlign: 'justify', textAlignVertical: 'top',
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
                            <TouchableOpacity style={{
                                flex: 0.15,
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

                <AwesomeAlert
                    title={this.state.alertTitle}
                    title={this.state.alertMessage}

                    show={this.state.showAlert}
                    showProgress={false}
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="YES"
                    confirmText="NO"
                    confirmButtonColor="#DD6B55"

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
                    onDismiss={() => {
                        this.setState({ showAlert: false });
                    }}

                    contentContainerStyle={{ width: Cons.alertWidth, height: Cons.alertHeight, backgroundColor: "white", justifyContent: "space-between" }}

                    titleStyle={{ fontSize: 18, fontFamily: "SFProText-Bold", color: 'black' }}
                    messageStyle={{ fontSize: 16, fontFamily: "SFProText-Regular", color: 'black' }}

                    cancelButtonStyle={{ width: Cons.alertButtonWidth, height: Cons.alertButtonHeight, marginBottom: 10, backgroundColor: "white", borderColor: "black", borderWidth: 1, justifyContent: 'center', alignItems: 'center' }} // YES
                    cancelButtonTextStyle={{ color: "black", fontSize: 14, fontFamily: "SFProText-Semibold" }}
                    confirmButtonStyle={{ width: Cons.alertButtonWidth, height: Cons.alertButtonHeight, marginBottom: 10, backgroundColor: "white", borderColor: "black", borderWidth: 1, marginLeft: Cons.alertButtonMarginBetween, justifyContent: 'center', alignItems: 'center' }} // NO
                    confirmButtonTextStyle={{ color: "black", fontSize: 14, fontFamily: "SFProText-Semibold" }}
                />

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View >
        );
    } // end of render()

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                // this.loadMore();
                this.loadReviewFromTheStart();
            }
        );
    }

    loadReviewFromTheStart() {
        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReviewFromTheStart();
    }

    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item, index }: FlatListItem<ReviewEntry>): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        const ref = item.review.id;

        const reply = _review.reply;

        const isMyReview = this.isOwner(_review.uid, Firebase.user().uid);

        let isMyReply = undefined;
        if (reply) isMyReply = this.isOwner(reply.uid, Firebase.user().uid);


        return (
            <View style={{ paddingBottom: Theme.spacing.tiny }} onLayout={(event) => this.onItemLayout(event, index)}>
                {/* ToDo: add profile image */}

                <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.base, paddingBottom: Theme.spacing.tiny }}>
                    <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>
                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Theme.spacing.tiny }}>
                    {/* ToDo: draw stars based on averge rating & get review count */}
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
                    <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                </View>

                <View style={{ paddingTop: Theme.spacing.small, paddingBottom: Theme.spacing.tiny }}>
                    {/*
                    <Text style={styles.reviewText}>{tmp}</Text>
                    */}
                    <Text style={styles.reviewText}>{_review.comment}</Text>
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
                            paddingTop: Theme.spacing.small,
                            paddingBottom: Theme.spacing.small,
                            paddingLeft: Theme.spacing.small,
                            paddingRight: Theme.spacing.small,
                            backgroundColor: Theme.color.highlight, borderRadius: 2
                        }}>

                            <View style={{ flexDirection: 'row', paddingBottom: Theme.spacing.small }}>
                                <Text style={styles.replyOwner}>Owner Response</Text>
                                <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                            </View>

                            {/*
                                <Text style={styles.reviewText}>{tmp}</Text>
                            */}
                            <Text style={styles.replyComment}>{reply.comment}</Text>

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
                    this.state.isOwner && !reply ?
                        (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Theme.spacing.base }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }} onPress={() => this.openKeyboard(ref, index, _profile.uid)}>
                                    <Text style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        )
                        :
                        (
                            <View style={{ paddingTop: Theme.spacing.base - Theme.spacing.tiny }} />
                        )
                }
            </View>
        );
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    @autobind
    loadMore() {
        console.log('ReadAllReviewScreen.loadMore');

        if (this.state.isLoadingReview) {
            // this.setState({ refreshing: false });
            return;
        }

        const { reviewStore } = this.props.navigation.state.params;
        if (reviewStore.allReviewsLoaded) {
            console.log('reviewStore.allReviewsLoaded');

            this.setState({ refreshing: false });

            return;
        }

        this.setState({ isLoadingReview: true });

        reviewStore.loadReview();
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%' }} />
        );
    }

    @autobind
    onItemLayout(event, index) {
        const { x, y, width, height } = event.nativeEvent.layout;
        // console.log(x, y, width, height);
        console.log(index, height);

        this.itemHeights[index] = height;
        this.lastItemIndex = index;
    }

    @autobind
    renderListEmptyComponent() {

        // block the bottom indicator rendering
        // if (this.state.isLoadingReview) this.setState({ isLoadingReview: false });

        const { navigation } = this.props;

        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;

        const loading = reviews === undefined;

        const width = Dimensions.get('window').width - Theme.spacing.base * 2;


        let reviewArray = [];

        for (var i = 0; i < 4; i++) {
            reviewArray.push(
                <View key={i}>
                    <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton} secondaryColor="grey" width={width} height={160}>
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
            /*
            <View style={{ paddingHorizontal: Theme.spacing.small }}>
                {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }}/>}
            </View>
            */

            loading ?
                <View style={{ paddingVertical: Theme.spacing.small }}>
                    {reviewArray}
                </View>
                :
                <View style={{ paddingVertical: Theme.spacing.small, paddingHorizontal: Theme.spacing.small }}>
                    <FirstPost {...{ navigation }} />
                </View>
        );
    }

    @autobind
    _keyboardDidShow(e) {
        this.setState({ bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (var i = 0; i < this.selectedItemIndex; i++) {
            var h = this.itemHeights[i];
            if (h) {
                totalHeights += h + 1; // separator width
            }
        }

        const height = this.itemHeights[this.selectedItemIndex];
        const keyboardHeight = e.endCoordinates.height;
        const searchBarHeight = Cons.searchBarHeight;

        const y = totalHeights;

        const gap = Dimensions.get('window').height - keyboardHeight - this.replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true });
    }

    @autobind
    _keyboardDidHide() {
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
            if (!this.closed) {
                // this._reply.blur();
                this.setState({ showKeyboard: false });

                // refresh all
                const { reviewStore, placeId, feedId } = this.props.navigation.state.params;
                const count = reviewStore.reviews.length;
                // this.refreshReviews(placeId, feedId, count + 1);
                this.refreshReviews(placeId, feedId, 5);
            }
        });
    }

    async addReply(message) {
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

        const reviewId = reviewStore.reviews[this.selectedItemIndex].review.id;
        const userUid = Firebase.user().uid; // 리뷰를 쓴 사람

        await Firebase.addReply(placeId, feedId, reviewId, userUid, message);
    };

    async removeReview(index) {
        // show dialog
        this.showAlert('Delete', 'Are you sure you want to delete this review?', async () => {
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            const reviewId = reviewStore.reviews[index].review.id;
            const userUid = Firebase.user().uid;

            const count = reviewStore.reviews.length;

            await Firebase.removeReview(placeId, feedId, reviewId, userUid);

            this.refs["toast"].show('Your review has successfully been removed.', 500, () => {
                if (!this.closed) {
                    // refresh all
                    // this.refreshReviews(placeId, feedId, count - 1);
                    this.refreshReviews(placeId, feedId, 5);
                }
            });
        });
    }

    async removeReply(index) {
        // show dialog
        this.showAlert('Delete', 'Are you sure you want to delete this reply?', async () => {
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            const reviewId = reviewStore.reviews[index].review.id;
            const replyId = reviewStore.reviews[index].review.reply.id;
            const userUid = Firebase.user().uid;

            const count = reviewStore.reviews.length;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.refs["toast"].show('Your reply has successfully been removed.', 500, () => {
                if (!this.closed) {
                    // refresh UI
                    // this.refreshReviews(placeId, feedId, count - 1);
                    this.refreshReviews(placeId, feedId, 5);
                }
            });
        });
    }

    refreshReviews(placeId, feedId, count) {
        // ToDo: reload only the changed review
        const query = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").orderBy("timestamp", "desc");
        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.init(query, count);
    }

    showAlert(title, message, callback) {
        this.setState({ alertTitle: title, alertMessage: message, showAlert: true });

        this.setAlertCallback(callback);
    }

    setAlertCallback(callback) {
        this.alertCallback = callback;
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
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.base

        // flex: 1,
        // padding: Theme.spacing.small,
        // paddingTop: Theme.spacing.tiny,

        // paddingTop: Theme.spacing.small,
        // paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.base,
        paddingRight: Theme.spacing.base
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
        color: 'silver',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "SFProText-Regular"
    },
    reviewName: {
        color: 'white',
        fontSize: 15,
        fontFamily: "SFProText-Semibold",
        // paddingBottom: Theme.spacing.tiny
        // backgroundColor: 'red',

        // alignSelf: 'flex-start'
    },
    reviewDate: {
        // backgroundColor: 'red',
        // marginLeft: 27,
        color: 'grey',
        fontSize: 15,
        fontFamily: "SFProText-Light",
        marginLeft: 'auto'
    },
    reviewRating: {
        marginLeft: 4,

        color: '#f1c40f',
        fontSize: 15,
        lineHeight: 15,

        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.xSmall
        // paddingTop: parseInt(Dimensions.get('window').height / 100) - 2
    },
    replyOwner: {
        // color: "rgb(170, 170, 170)",
        color: "#E5E5E5",
        fontSize: 15,
        // lineHeight: 22,
        fontFamily: "SuisseIntl-ThinItalic"
    },
    replyDate: {
        color: 'grey',
        fontSize: 15,
        fontFamily: "SFProText-Light",
        marginLeft: 'auto'
    },
    replyComment: {
        color: 'white',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "SuisseIntl-ThinItalic"
    },
    bottomIndicator: {
        marginTop: 20,
        // marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
    },
    /*
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    */
    notification: {
        position: "absolute",
        width: '100%',
        height: Constants.statusBarHeight + 10,
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,

        flexDirection: 'column',
        // justifyContent: 'center'
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
    }
});
