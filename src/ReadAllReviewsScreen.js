import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import {
    StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList, BackHandler,
    ActivityIndicator, TouchableOpacity, Keyboard, TextInput, TouchableWithoutFeedback
} from "react-native";
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import { Text, Theme, Avatar } from "./rnff/src/components";
// import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
// import ReadMore from "./ReadMore";
import { Ionicons, MaterialIcons } from "react-native-vector-icons";
import Toast, { DURATION } from 'react-native-easy-toast';
import Dialog from "react-native-dialog";
import { Cons, Vars } from "./Globals";
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import Util from './Util';

const profilePictureWidth = 56;
const replyViewHeight = Dimensions.get('window').height / 9;


export default class ReadAllReviewsScreen extends React.Component {
    state = {
        renderReview: false,
        isLoadingReview: false,
        // reviewLength: 0,
        isOwner: false,
        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        refreshing: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.itemHeights = [];
        this.lastItemIndex = 0;
    }

    componentDidMount() {
        console.log('ReadAllReviewsScreen.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        const { reviewStore, isOwner } = this.props.navigation.state.params;

        this.setState({ isOwner });

        reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        // reviewStore.checkForNewEntries(); // do not use here!
        this.loadReviewFromStart();

        setTimeout(() => {
            !this.closed && this.setState({ renderReview: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished() {
        // console.log('onAddToReviewFinished');

        !this.closed && this.setState({ isLoadingReview: false, refreshing: false });

        // !this.closed && this.enableScroll();
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ReadAllReviewsScreen.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.state.params.initFromReadAllReviews();
        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'ReadAllReviewsScreen';

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.closed = true;
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={[styles.flex, { paddingBottom: Cons.viewMarginBottom() }]}>
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
                            this.props.navigation.state.params.initFromReadAllReviews();
                            this.props.navigation.goBack();
                        }}
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
                            // onEndReachedThreshold={0.5}
                            // onEndReached={this.loadMore}
                            onScroll={({ nativeEvent }) => {
                                if (!this.focused) return;

                                if (this.isCloseToBottom(nativeEvent)) {
                                    this.loadMore();
                                }
                            }}
                            // scrollEventThrottle={1}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator

                            ListEmptyComponent={this.renderListEmptyComponent}
                            ListFooterComponent={
                                this.state.isLoadingReview &&
                                <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                                    <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                                </View>
                            }

                            ItemSeparatorComponent={this.itemSeparatorComponent}

                            onRefresh={this.handleRefresh}
                            refreshing={this.state.refreshing}
                        />
                    </TouchableWithoutFeedback>
                }

                {
                    this.state.showKeyboard &&
                    <View style={{
                        position: 'absolute',
                        top: this.state.bottomPosition - replyViewHeight,
                        height: replyViewHeight,
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
                            placeholder='Reply to a review'
                            placeholderTextColor={Theme.color.placeholder}
                            onChangeText={(text) => this.onChangeText(text)}
                            selectionColor={Theme.color.selection}
                            // keyboardAppearance={'dark'}
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
            </View >
        );
    } // end of render()

    handleRefresh = () => {
        if (this.state.refreshing) return;

        // this.setState({ isLoadingReview: true, refreshing: true });
        this.setState({ refreshing: true });

        // reload from the start
        this.loadReviewFromStart();
    }

    loadReviewFromStart() {
        this.setState({ isLoadingReview: true });

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReviewFromStart();

        // this.disableScroll();
    }

    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item, index }): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        const ref = _review.id;
        const reply = _review.reply;

        const isMyReview = this.isOwner(_review.uid, Firebase.user().uid);
        let isMyReply = false;
        if (reply) isMyReply = this.isOwner(reply.uid, Firebase.user().uid);

        const avatarName = Util.getAvatarName(_profile.name);
        const avatarColor = Util.getAvatarColor(_profile.uid);

        const place = _profile.place ? _profile.place : 'Not specified';
        const placeColor = _profile.place ? Theme.color.text2 : Theme.color.text4;

        return (
            <View style={{ paddingTop: 20, paddingBottom: 16 }} onLayout={(event) => this.onItemLayout(event, index)}>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={_review.rating}
                                size={14}
                                margin={1}
                            />
                        </View>
                        <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                    </View>

                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>

                <View style={{ paddingTop: 10, paddingBottom: 6 }}>
                    <Text style={styles.reviewText}>{_review.comment}</Text>
                </View>

                <View style={{ marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        _profile.picture.uri ?
                            <SmartImage
                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={_profile.picture.uri}
                            />
                            :
                            <View
                                style={{
                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 22, lineHeight: 26, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <Text style={{ color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                            {_profile.name}</Text>
                        <Text style={{
                            marginTop: 4,
                            color: placeColor, fontSize: 14, fontFamily: "Roboto-Regular"
                        }}>{place}</Text>
                    </View>
                </View>
                {
                    isMyReview && !reply &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity style={{ alignSelf: 'baseline' }}
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
                        marginTop: Theme.spacing.tiny,
                        paddingTop: Theme.spacing.small,
                        paddingBottom: Theme.spacing.small,
                        paddingLeft: Theme.spacing.small,
                        paddingRight: Theme.spacing.small,
                        backgroundColor: Theme.color.highlight, borderRadius: 2
                    }}>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Theme.spacing.tiny }}>
                            <Text style={styles.replyOwner}>Owner Response</Text>
                            <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                        </View>

                        <View style={{ paddingTop: 10, paddingBottom: 6 }}>
                            <Text style={styles.replyComment}>{reply.comment}</Text>
                        </View>
                        {
                            isMyReply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }}
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
                        <TouchableOpacity style={{ alignSelf: 'baseline' }}
                            onPress={() => this.openKeyboard(ref, index, _profile.uid)}
                        >
                            <MaterialIcons name='reply' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
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
        if (this.state.isLoadingReview) return;

        const { reviewStore } = this.props.navigation.state.params;
        if (reviewStore.allReviewsLoaded) return;

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
        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;

        const loading = reviews === undefined;

        if (loading) {
            const width = Dimensions.get('window').width - Theme.spacing.base * 2;

            let reviewArray = [];

            for (let i = 0; i < 5; i++) {
                reviewArray.push(
                    <View key={i}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={160}>
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
                <View style={{ paddingVertical: Theme.spacing.small }}>
                    {reviewArray}
                </View>
            );
        }

        return this.renderEmptyImage();
    }

    renderEmptyImage() {
        return (
            // ToDo: render design
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{
                    // color: Theme.color.text2,
                    color: 'rgb(247, 178, 57)',
                    fontSize: 24,
                    paddingTop: 4,
                    fontFamily: "Chewy-Regular"
                }}>No customer reviews yet</Text>

                {/*
                <Text style={{
                    marginTop: 10,
                    color: Theme.color.text3,
                    fontSize: 18,
                    fontFamily: "Chewy-Regular"
                }}>Start exploring girls for your next trip</Text>
                */}

                <Image
                    style={{
                        marginTop: 20,
                        width: 200 / 510 * 600,
                        height: 200,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.find}
                />
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

        const gap = Dimensions.get('window').height - keyboardHeight - replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true });
    }

    @autobind
    _keyboardDidHide() {
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

        this.refs["toast"].show('Your reply has been submitted!', 500, () => {
            if (!this.closed) {
                // this._reply.blur();
                this.setState({ showKeyboard: false });

                // reload
                /*
                const { reviewStore, placeId, feedId } = this.props.navigation.state.params;
                this.refreshReviews(placeId, feedId, 6);
                */
                this.loadReviewFromStart();

                // move scroll top
                this._flatList.scrollToOffset({ offset: 0, animated: false });
            }
        });
    }

    async addReply(message) {
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

        const reviewOwnerUid = reviewStore.reviews[this.selectedItemIndex].profile.uid;
        const reviewId = reviewStore.reviews[this.selectedItemIndex].review.id;
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
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            const reviewId = reviewStore.reviews[index].review.id;
            const userUid = Firebase.user().uid;

            const result = await Firebase.removeReview(placeId, feedId, reviewId, userUid);
            if (!result) {
                // the post is removed
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            this.refs["toast"].show('Your review has successfully been removed.', 500, () => {
                if (!this.closed) {
                    // reload
                    // this.refreshReviews(placeId, feedId, 6);
                    this.loadReviewFromStart();

                    // move scroll top
                    this._flatList.scrollToOffset({ offset: 0, animated: false });
                }
            });
        });
    }

    async removeReply(index) {
        this.openDialog('Delete', 'Are you sure you want to delete this reply?', async () => {
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            const reviewId = reviewStore.reviews[index].review.id;
            const replyId = reviewStore.reviews[index].review.reply.id;
            const userUid = Firebase.user().uid;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.refs["toast"].show('Your reply has successfully been removed.', 500, () => {
                if (!this.closed) {
                    // reload
                    // this.refreshReviews(placeId, feedId, 6);
                    this.loadReviewFromStart();

                    // move scroll top
                    this._flatList.scrollToOffset({ offset: 0, animated: false });
                }
            });
        });
    }

    /*
    refreshReviews(placeId, feedId, count) {
        // reload whole reviews
        const query = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").orderBy("timestamp", "desc");
        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.init(query, count);
    }
    */

    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true, showsVerticalScrollIndicator: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false, showsVerticalScrollIndicator: false });
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
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

        const sender = Firebase.user().uid;
        const senderName = Firebase.user().name;
        const receiver = this.owner;
        const data = {
            message: message,
            placeId: placeId,
            feedId, feedId
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
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 16,
        fontFamily: "Roboto-Regular"
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: "Roboto-Regular"
    },
    replyOwner: {
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "Roboto-Italic"
    },
    replyDate: {
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    replyComment: {
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: "Roboto-Italic"
    },
    bottomIndicator: {
        marginTop: 20,
        // marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
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
