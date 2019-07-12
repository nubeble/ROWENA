import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Dimensions, FlatList, Image,
    Animated, Keyboard, TextInput
} from 'react-native';
import { Text, Theme } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { NavigationActions } from 'react-navigation';
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons, MaterialIcons } from "react-native-vector-icons";
import autobind from "autobind-decorator";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Cons, Vars } from "./Globals";
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Util from "./Util";
import type { CommentEntry } from "../rnff/src/components/Model";
import CommentStore from "./CommentStore";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from "moment";
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import Toast, { DURATION } from 'react-native-easy-toast';
import { sendPushNotification } from './PushNotifications';
import Dialog from "react-native-dialog";

const DEFAULT_REVIEW_COUNT = 6;

const avatarWidth = Dimensions.get('window').height / 11;
const profilePictureWidth = 56;
const replyViewHeight = Dimensions.get('window').height / 9;

// const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore")
@observer // for commentStore
export default class UserMain extends React.Component<InjectedProps> {
    commentStore: CommentStore = new CommentStore();

    state = {
        // renderFeed: false,

        isLoadingFeeds: false,
        refreshing: false,

        host: null,
        guest: null,

        showReviewButton: false,
        disableReviewButton: false,

        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        // this.opponentUser = null;

        this.opponentUserUnsubscribe = null;
    }

    componentDidMount() {
        console.log('UserMain.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.commentStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        // const item = this.props.navigation.state.params.item;
        const { from, item } = this.props.navigation.state.params;

        let showReviewButton = false;
        if (from === 'ChatRoom') {
            showReviewButton = true;
        } else { // CommentMain
            showReviewButton = false;
        }

        let disableReviewButton = false;
        if (!item.placeId || !item.feedId) disableReviewButton = true; // from CommentMain

        const guest = item.guest;
        const host = item.host;

        this.setState({ showReviewButton, disableReviewButton, guest: guest, host: host });

        const uid = guest.uid;

        this.setState({ isLoadingReview: true });

        const query = Firebase.firestore.collection("users").doc(uid).collection("comments").orderBy("timestamp", "desc");
        this.commentStore.init(query, DEFAULT_REVIEW_COUNT);

        // this.disableScroll();

        // subscribe here
        // --
        const instance = Firebase.subscribeToProfile(uid, user => {
            /*
            if (user === undefined) {
                this.opponentUser = null;
                return;
            }

            this.opponentUser = user;
            */

            if (user === undefined) {
                this.refs["toast"].show('The user no longer exists.', 500);
                this.setState({ guest: null });
                return;
            }

            let { guest } = this.state;
            // guest.receivedCommentsCount = user.receivedCommentsCount;

            guest.name = user.name;
            guest.picture = user.picture.uri;
            guest.address = user.place;
            guest.receivedCommentsCount = user.receivedCommentsCount;
            guest.timestamp = user.timestamp;
            guest.birthday = user.birthday;
            guest.gender = user.gender;
            guest.about = user.about;

            this.setState({ guest });
        });

        this.opponentUserUnsubscribe = instance;
        // --

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
        */
    }

    @autobind
    onAddToReviewFinished() {
        console.log('UserMain.onAddToReviewFinished');

        !this.closed && this.setState({ isLoadingFeeds: false, refreshing: false });

        // !this.closed && this.enableScroll();
    }

    @autobind
    handleHardwareBackPress() {
        console.log('UserMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'UserMain';

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

    @autobind
    keyboardDidShow(e) {
        this.setState({ bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

        /*
        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (let i = 0; i < this.selectedItemIndex; i++) {
            let h = this.itemHeights[i];
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
        */
    }

    @autobind
    keyboardDidHide() {
        this.setState({ showKeyboard: false, bottomPosition: Dimensions.get('window').height });

        /*
        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;
        this.owner = undefined;
        */

        /*
        if (this._showNotification) {
            this.hideNotification();
        }
        */
    }

    // openKeyboard(ref, index, owner) {
    openKeyboard() {
        if (this.state.showKeyboard) return;

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        /*
        this.selectedItem = ref;
        this.selectedItemIndex = index;
        this.owner = owner;
        */
    }

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }

    sendComment() {
        const message = this._reply._lastNativeText;
        console.log('UserMain.sendComment', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');
            return;
        }

        this.addComment(message);

        this.sendPushNotification(message);

        this.refs["toast"].show('Your reply has been submitted!', 500, () => {
            if (!this.closed) {
                // this._reply.blur();
                this.setState({ showKeyboard: false });

                // refresh
                this.setState({ isLoadingFeeds: true });
                this.commentStore.loadReviewFromStart();

                // move scroll top
                this._flatList.scrollToOffset({ offset: 0, animated: false });
            }
        });
    }

    async addComment(message) {
        const { host, guest } = this.state;
        const { placeId, feedId } = this.props.navigation.state.params.item;

        // Firebase.addComment(host.uid, guest.uid, message, host.name, host.address, host.picture, placeId, feedId);
        Firebase.addComment(host.uid, guest.uid, message, placeId, feedId);
    };

    async removeComment(index) {
        this.openDialog('Delete', 'Are you sure you want to delete this review?', async () => {
            const { reviews } = this.commentStore;
            const { host, guest } = this.state;

            const commentId = reviews[index].comment.id;
            const result = await Firebase.removeComment(host.uid, guest.uid, commentId);
            if (!result) {
                this.refs["toast"].show('The user no longer exists.', 500);
                return;
            }

            this.refs["toast"].show('Your review has successfully been removed.', 500);

            // refresh
            this.setState({ isLoadingFeeds: true });
            this.commentStore.loadReviewFromStart();

            // move scroll top
            this._flatList.scrollToOffset({ offset: 0, animated: false });
        });
    }

    sendPushNotification(message) {
        const { host, guest } = this.state;

        const sender = host.uid;
        const senderName = host.name;
        const receiver = guest.uid;

        const data = {
            // message: senderName + ' wrote a review: ' + message
            message
        };

        sendPushNotification(sender, senderName, receiver, Cons.pushNotification.comment, data);
    }

    componentWillUnmount() {
        console.log('UserMain.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        if (this.opponentUserUnsubscribe) this.opponentUserUnsubscribe();

        this.closed = true;
    }

    render() {
        const { guest } = this.state; // undefined at loading
        if (!guest) return null;

        let avatarName = 'Anonymous';
        let address = "Not specified";
        let addressColor = Theme.color.text4;
        let addressFont = "Roboto-LightItalic";
        let reviewText = 'loading...';
        // let labelText = null;
        let imageUri = null;
        let dateText = 'Joined in September 26, 2018';
        let age = '20';
        let gender = 'Female';
        let note = 'hi';

        let _avatarName = '';
        let _avatarColor = 'black';

        const { reviews } = this.commentStore;

        // name
        if (guest.name) avatarName = guest.name;

        // address
        if (guest.address) {
            address = guest.address;
            addressColor = Theme.color.text2;
            addressFont = "Roboto-Light";
        }

        const count = guest.receivedCommentsCount;

        // reviewText
        if (count === 0) {
            reviewText = 'No customer reviews yet';
        } else if (count === 1) {
            reviewText = '1 customer review';
        } else {
            reviewText = count.toString() + " customer reviews";
        }

        // labelText
        /*
        if (count === 1) {
            labelText = count.toString() + ' review from hosts';
        } else if (count > 1) {
            labelText = count.toString() + ' reviews from hosts';
        }
        */

        // image
        if (guest.picture) imageUri = guest.picture;

        // date
        dateText = Util.getJoinedDate(guest.timestamp);

        // ToDo: use age, gender, note
        if (guest.birthday) age = Util.getAge(guest.birthday);
        if (guest.gender) gender = guest.gender;
        if (guest.about) note = guest.about;

        if (!imageUri) {
            _avatarName = Util.getAvatarName(avatarName);
            _avatarColor = Util.getAvatarColor(guest.uid);
        }

        // const _replyViewHeight = this.state.bottomPosition - Cons.searchBarHeight + this.borderY;

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
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/*
                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 20,
                            fontFamily: "Roboto-Medium",
                            alignSelf: 'center',
                            paddingBottom: 4
                        }}
                    >{post.name}</Text>
                    */}
                </View>

                <FlatList
                    ref={(fl) => this._flatList = fl}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.infoContainer}>
                                {/* avatar view */}
                                <View>
                                    <View style={{
                                        width: '100%', height: Dimensions.get('window').height / 8,
                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                            <Text style={{ marginTop: Cons.redDotWidth / 2, paddingTop: 4, fontSize: 24, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
                                                {avatarName}
                                            </Text>
                                            <Text style={{ marginTop: Dimensions.get('window').height / 80, fontSize: 16, color: Theme.color.text3, fontFamily: "Roboto-Light" }}>
                                                {dateText}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                width: avatarWidth, height: avatarWidth,
                                                marginRight: 22, justifyContent: 'center', alignItems: 'center'
                                            }}
                                        >
                                            {
                                                imageUri ?
                                                    /*
                                                        <Image
                                                            style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                            source={{ uri: imageUri }}
                                                        />
                                                    */
                                                    <SmartImage
                                                        style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                        showSpinner={false}
                                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                        uri={imageUri}
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
                                        </View>
                                    </View>
                                </View>

                                <View style={{ width: '100%', paddingHorizontal: 20 }}>

                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }}>
                                        <Image
                                            style={{ width: 20, height: 20, resizeMode: 'cover' }}
                                            source={PreloadImage.home}
                                        />
                                        <Text style={{ marginLeft: 12, fontSize: 18, color: addressColor, fontFamily: addressFont }}>{address}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: Theme.spacing.small }}>
                                        <Image
                                            style={{ width: 22, height: 22, resizeMode: 'cover' }}
                                            source={PreloadImage.comment}
                                        />
                                        <Text style={{ marginLeft: 10, fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Light" }}>{reviewText}</Text>
                                    </View>

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }}
                                        onLayout={(event) => {
                                            const { x, y, width, height } = event.nativeEvent.layout;

                                            this.borderY = y;
                                        }}
                                    />

                                    {
                                        this.state.showReviewButton &&
                                        <View style={{ paddingTop: Theme.spacing.tiny, alignItems: 'center' }}>
                                            <Text style={{
                                                paddingHorizontal: Theme.spacing.base,
                                                width: Dimensions.get('window').width * 0.85,
                                                marginBottom: Theme.spacing.small,
                                                fontSize: 14, lineHeight: 24,
                                                fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                                                textAlign: 'center'
                                            }}>Share your experience to help others</Text>

                                            <TouchableOpacity
                                                style={[styles.contactButton,
                                                {
                                                    marginBottom: Theme.spacing.small,
                                                    backgroundColor: this.state.showKeyboard ? Theme.color.component : Theme.color.buttonBackground
                                                }
                                                ]}
                                                onPress={() => {
                                                    if (this.state.disableReviewButton) {
                                                        this.refs["toast"].show("Can't add a review here.", 500);
                                                        return;
                                                    }

                                                    if (!this.state.guest) {
                                                        this.refs["toast"].show('The user no longer exists.', 500);
                                                        return;
                                                    }

                                                    setTimeout(() => {
                                                        if (this.closed) return;
                                                        // this.props.navigation.navigate("writeComment");
                                                        this.openKeyboard();

                                                        // move scroll top
                                                        // const gap = this.state.bottomPosition - replyViewHeight - Cons.searchBarHeight + this.borderY;
                                                        // console.log('gap', gap);
                                                        // this._flatList.scrollToOffset({ offset: gap, animated: true });
                                                        this._flatList.scrollToOffset({ offset: 0, animated: true });
                                                    }, Cons.buttonTimeoutShort);
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 16, fontFamily: "Roboto-Medium",
                                                    // color: this.state.showKeyboard ? 'black' : 'rgba(255, 255, 255, 0.8)'
                                                    color: this.state.showKeyboard ? 'black' : Theme.color.buttonText
                                                }}>{'Add a Review'}</Text>
                                            </TouchableOpacity>

                                            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny }} />
                                        </View>
                                    }

                                </View>
                            </View>
                        </View>
                    }
                    data={reviews}
                    keyExtractor={item => item.comment.id}
                    renderItem={this.renderItem}
                    ItemSeparatorComponent={this.itemSeparatorComponent}
                    onScroll={({ nativeEvent }) => {
                        if (!this.focused) return;

                        if (this.isCloseToBottom(nativeEvent)) {
                            this.loadMore();
                        }
                    }}
                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}

                    ListFooterComponent={
                        this.state.isLoadingFeeds &&
                        <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                        </View>
                    }

                    ListEmptyComponent={this.renderListEmptyComponent}
                />

                {
                    this.state.showKeyboard &&
                    <View style={{
                        position: 'absolute',
                        top: this.state.bottomPosition - replyViewHeight,
                        height: replyViewHeight,

                        /*
                         height: _replyViewHeight,
                         top: this.state.bottomPosition - _replyViewHeight,
                         */
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
                            placeholder='Add a Review'
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
                            onPress={() => this.sendComment()}
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
    } // end of render()

    @autobind
    renderItem({ item, index }): React.Node {
        const post = item.post;
        const _review = item.comment;

        let picture = null;
        let placeName = 'Not specified';
        let placeColor = Theme.color.text4;
        let placeFont = "Roboto-Italic";
        let name = null;
        let avatarName = null;
        let avatarColor = 'black';

        if (post) {
            picture = post.pictures.one.uri;
            placeName = post.placeName;
            if (placeName) {
                placeColor = Theme.color.text2;
                placeFont = "Roboto-Regular";
            }
            name = post.name;
            avatarName = Util.getAvatarName(name);
            avatarColor = Util.getAvatarColor(post.id);
        }
        /*
        else {
            picture = _review.picture;
            if (placeName) placeColor = Theme.color.text2;
            placeName = _review.place;
            name = _review.name;
        }
        */

        let isMyComment = false;
        if (_review.uid === Firebase.user().uid) {
            isMyComment = true;
        }

        return (
            <View style={{ paddingHorizontal: Theme.spacing.base, paddingVertical: Theme.spacing.small }}>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>
                <View style={{ paddingBottom: 6 }}>
                    <Text style={styles.reviewText}>{_review.comment}</Text>
                </View>
                <View style={{ marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
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
                                <Text style={{ color: 'white', fontSize: 22, lineHeight: 26, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <Text style={{ color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                            {name}</Text>
                        <Text style={{
                            marginTop: 4,
                            color: placeColor, fontSize: 14, fontFamily: placeFont
                        }}>{placeName}</Text>
                    </View>
                </View>
                {
                    isMyComment &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity style={{ alignSelf: 'baseline' }}
                            onPress={() => this.removeComment(index)}
                        >
                            <MaterialIcons name='close' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    @autobind
    loadMore() {
        // console.log('loadMore');

        if (this.state.isLoadingFeeds) return;

        if (this.commentStore.allReviewsLoaded) return;

        this.setState({ isLoadingFeeds: true });

        this.commentStore.loadReview();
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ alignSelf: 'center', width: Dimensions.get('window').width - 20 * 2, borderBottomColor: Theme.color.line, borderBottomWidth: 1 }} />
        );
    }

    @autobind
    renderListEmptyComponent() {
        const { guest } = this.state;
        if (!guest) return null;

        // if (guest.receivedCommentsCount === 0) return this.renderEmptyImage();

        const { reviews } = this.commentStore;
        const loading = reviews === undefined;

        if (loading) {
            // render skeleton

            const width = Dimensions.get('window').width - Theme.spacing.base * 2;

            let reviewArray = [];

            for (let i = 0; i < 4; i++) {
                reviewArray.push(
                    <View style={{ alignItems: 'center', paddingTop: 14 }} key={i}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={134 + 14}>
                            <Svg.Rect
                                x={width - 100}
                                y={10}
                                width={100}
                                height={6}
                            />
                            <Svg.Rect
                                x={0}
                                y={10 + 20}
                                width={'100%'}
                                height={8}
                            />
                            <Svg.Rect
                                x={0}
                                y={10 + 20 + 8 + 12}
                                width={'60%'}
                                height={8}
                            />
                            <Svg.Circle
                                cx={24}
                                cy={100}
                                r={24}
                            />
                            <Svg.Rect
                                x={24 * 2 + 16}
                                y={100 - 8 - 6}
                                width={80}
                                height={8}
                            />
                            <Svg.Rect
                                x={24 * 2 + 16}
                                y={100 + 6}
                                width={80}
                                height={8}
                            />
                        </SvgAnimatedLinearGradient>
                        {
                            i !== 3 &&
                            <View style={{ width: Dimensions.get('window').width - 20 * 2, borderBottomColor: Theme.color.line, borderBottomWidth: 1 }} />
                        }
                    </View>
                );
            }

            return (
                <View>
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
                    // color: 'rgb(250, 203, 205)',
                    color: Theme.color.text2,
                    fontSize: 26,
                    lineHeight: 30,
                    fontFamily: "Chewy-Regular"
                }}>No customer reviews yet</Text>

                <Text style={{
                    marginTop: 8,
                    color: Theme.color.text3,
                    fontSize: 18,
                    lineHeight: 22,
                    fontFamily: "Chewy-Regular"
                }}>Stop expecting, start exploring</Text>

                <Image
                    style={{
                        marginTop: 30,
                        width: Cons.stickerWidth,
                        height: Cons.stickerHeight,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.comments}
                />
            </View>
        );
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState({ isLoadingFeeds: true, refreshing: true });

        // reload from the start
        this.commentStore.loadReviewFromStart();

        // this.disableScroll();
    }

    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true, showsVerticalScrollIndicator: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false, showsVerticalScrollIndicator: false });
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
        // backgroundColor: 'green'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'black'
    },
    ad: {
        width: (Dimensions.get('window').width),
        height: (Dimensions.get('window').width) / 21 * 9,
        marginTop: Theme.spacing.tiny,
        marginBottom: Theme.spacing.tiny
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    contentContainer: {
        flexGrow: 1
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
        // paddingBottom: Theme.spacing.tiny
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
    contactButton: {
        /*
        // width: '85%',
        width: Dimensions.get('window').width * 0.85,
        height: Cons.buttonHeight,
        alignSelf: 'center',
        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,

        alignItems: 'center',
        justifyContent: 'center'
        */

        width: Dimensions.get('window').width * 0.85,
        height: Cons.buttonHeight,
        alignSelf: 'center',
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
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
