import React from 'react';
import {
    StyleSheet, View, Dimensions, TouchableOpacity, Keyboard, BackHandler, Platform, SafeAreaView
} from 'react-native';
import { Text, Theme, FeedStore } from "./rnff/src/components";
import { GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
// import KeyboardSpacer from 'react-native-keyboard-spacer';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import Dialog from "react-native-dialog";
import autobind from "autobind-decorator";
import SmartImage from "./rnff/src/components/SmartImage";
import { Cons } from "./Globals";
import { sendPushNotification } from './PushNotifications';
import { inject, observer } from "mobx-react/native";
import Toast, { DURATION } from 'react-native-easy-toast';
import Util from './Util';
import PreloadImage from './PreloadImage';

const chatViewHeight = Dimensions.get('window').height - Cons.searchBarHeight;
const textInputPaddingTop = (Dimensions.get('window').height / 26);
const textInputPaddingLeft = (Dimensions.get('window').width / 20);
const textInputPaddingRight = (Dimensions.get('window').width / 20);
const textInputMarginBottom = (Platform.OS === 'ios') ? 20 : 12;
const sendButtonMarginBottom = (Dimensions.get('window').height / 40);
const inputToolbarHeight = (Dimensions.get('window').height / 10);

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;
const avatarHeight = Cons.searchBarHeight * 0.5;
const bigImageWidth = postHeight * 0.7;
// const smallImageWidth = (Dimensions.get('window').height <= 640) ? postHeight * 0.58 : bigImageWidth;
const smallImageWidth = postHeight * 0.7;


export default class ChatRoom extends React.Component {
    state = {
        id: null,
        titleImageUri: null,
        titleName: null,
        messages: [],

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        onKeyboard: false,
        renderPost: false,

        opponentLeft: false
    };

    constructor(props) {
        super(props);

        this.onLoading = false;
        /*
                this.feed = null;
                this.feedCount = 0;
                this.opponentUser = null;
        
                this.feedUnsubscribe = null;
                this.countUnsubscribe = null;
                this.opponentUserUnsubscribe = null;
        */
    }

    componentDidMount() {
        console.log('ChatRoom.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const item = this.props.navigation.state.params.item;


        /*
                // subscribe here (post)
                // --
                const fi = Firebase.subscribeToFeed(item.placeId, item.feedId, newFeed => {
                    if (newFeed === undefined) {
                        this.feed = null;
                        return;
                    }
        
                    // update this.feed
                    this.feed = newFeed;
                });
        
                this.feedUnsubscribe = fi;
                // --
        
                // subscribe here (count)
                // --
                const ci = Firebase.subscribeToPlace(item.placeId, newPlace => {
                    if (newPlace === undefined) {
                        this.feedCount = 0;
                        return;
                    }
        
                    // update this.feedCount
                    this.feedCount = newPlace.count;
                });
        
                this.countUnsubscribe = ci;
                // --
        
                // set title
                let titleImageUri = null;
                let titleName = null;
        
                // find the owner of this post
                for (var i = 0; i < item.users.length; i++) {
                    const user = item.users[i];
        
                    if (item.owner === user.uid) {
                        titleImageUri = user.picture;
                        titleName = user.name;
                        break;
                    }
                }
        
                this.setState({ id: item.id, titleImageUri, titleName });
        */

        this.setState({ id: item.id, titleImageUri: item.title.picture, titleName: item.title.name });

        Firebase.chatOn(item.id, message => {
            console.log('on message', message);

            // fill name, avatar (picture)
            if (message.user) {
                for (let i = 0; i < item.users.length; i++) {
                    const user = item.users[i];

                    if (message.user._id === user.uid) {
                        message.user.name = user.name;
                        if (user.picture) message.user.avatar = user.picture;
                        else message.user.avatar = PreloadImage.user; // ToDo: tint color

                        break;
                    }
                }
            }

            // check if the leave message arrived
            if (message.system && message.text.indexOf(" has left the chat room.") !== -1) {
                this.setState({ opponentLeft: true });
            }

            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, message)
            }));
        });

        // show center post avatar

        // if (item.contents === '') this.setState({ renderPost: true });

        if (item.showAvatar) this.setState({ renderPost: true });
    }

    componentWillUnmount() {
        console.log('ChatRoom.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        const item = this.props.navigation.state.params.item;
        Firebase.chatOff(item.id);

        /*
            if (this.feedUnsubscribe) this.feedUnsubscribe();
            if (this.countUnsubscribe) this.countUnsubscribe();
            if (this.opponentUserUnsubscribe) this.opponentUserUnsubscribe();
        */

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ChatRoom.handleHardwareBackPress');
        // this.goBack(); // works best when the goBack is async

        this.moveToChatMain();

        return true;
    }

    moveToChatMain() {
        // save last message
        const item = this.props.navigation.state.params.item;

        const lastReadMessageId = item.lastReadMessageId;

        const message = this.getLastMessage();
        if (message) {
            const mid = message._id;

            if (lastReadMessageId !== mid) {
                Firebase.saveLastReadMessageId(Firebase.user().uid, this.state.id, mid);
            }
        }

        this.props.navigation.navigate("chat");
    }

    getLastMessage() {
        if (this.state.messages.length === 1) return null; // system message

        let lastMessage = null;

        const { messages } = this.state;

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            if (message.system) continue;

            lastMessage = message;
            break;
        }

        return lastMessage;
    }

    @autobind
    _keyboardDidShow(e) {
        // this.keyboardHeight = e.endCoordinates.height;

        if (!this.state.onKeyboard) this.setState({ onKeyboard: true });
    }

    @autobind
    _keyboardDidHide(e) {
        // this.keyboardHeight = 0;

        if (this.state.onKeyboard) this.setState({ onKeyboard: false });
    }

    get user() {
        // Return our name and our UID for GiftedChat to parse
        return {
            _id: Firebase.user().uid,
            name: Firebase.user().name,
            avatar: Firebase.user().photoUrl
        };
    }

    render() {
        const showPost = this.state.messages.length > 1 ? false : true;

        const top1 = (Dimensions.get('window').height - postHeight) / 2; // center
        const top2 = Cons.searchBarHeight;

        // --
        /*
        const firstMessageHeight = 30;
        const bottom = Dimensions.get('window').height - this.keyboardHeight - this.textInputHeight - textInputMarginBottom - firstMessageHeight;
        const top = bottom - postHeight;
        */

        // const top2 = top;
        // --

        const _postTop = this.state.onKeyboard ? top2 : top1;
        // const _postHeight = this.state.onKeyboard ? height2 : postHeight;

        const item = this.props.navigation.state.params.item;

        const imageWidth = this.state.onKeyboard ? smallImageWidth : bigImageWidth;
        const labelName = item.users[1].name;
        // const text2 = 'Send a message before your battery dies.';

        return (
            <View style={styles.container}>
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
                            this.moveToChatMain();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* icon + text */}
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={async () => await this.openPost()}>
                        <SmartImage
                            // style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2, marginBottom: 4 }}
                            style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2 }}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={this.state.titleImageUri}
                        />
                        <Text
                            style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: 18,
                                // paddingTop: 10,
                                fontFamily: "Roboto-Medium",
                                marginLeft: 10,
                                // paddingBottom: 4
                            }}
                        >{this.state.titleName}</Text>
                    </TouchableOpacity>

                    {/* leave button */}
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
                            this.handleLeave();
                        }}
                    >
                        <Ionicons name='md-trash' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={Platform.OS === 'android' ? styles.androidView : styles.iosView}>
                    <GiftedChat
                        minInputToolbarHeight={inputToolbarHeight + textInputMarginBottom}
                        minComposerHeight={0}
                        maxComposerHeight={0}

                        alwaysShowSend={true}
                        // isAnimated={true}

                        // forceGetKeyboardHeight={Platform.OS === 'android' && Platform.Version < 21}
                        messages={this.state.messages}
                        placeholder={this.state.opponentLeft ? "Can't type a message" : 'Type a message'}
                        placeholderTextColor={Theme.color.placeholder}
                        user={this.user}
                        onSend={async (messages) => {
                            if (this.state.opponentLeft) return;

                            let isSameDay = true;
                            /*
                            if (messages.length > 1) {
                                const dateOld = new Date(messages[1].createdAt);
                                const dateNew = new Date(messages[0].createdAt);

                                const result = Util.isSameDay(dateOld, dateNew);
                                isSameDay = result;
                            }
                            */

                            await this.sendMessage(isSameDay, messages[0]);
                            // await this.saveUnreadChatRoomId();
                        }}
                        onPressAvatar={async () => await this.openAvatar()}
                        onLongPress={() => undefined}

                        textInputProps={{
                            /*
                            onLayout: (event) => {
                                const layout = event.nativeEvent.layout;
                                this.textInputHeight = layout.height;
                            },
                            */
                            style: Platform.OS === 'android' ? styles.androidTextInput : styles.iosTextInput,
                            selectionColor: Theme.color.selection,
                            // keyboardAppearance: 'dark',
                            underlineColorAndroid: "transparent",
                            autoCorrect: false,

                            onFocus: () => {
                                this.setState({ onKeyboard: true });
                            },
                            onBlur: () => {
                                this.setState({ onKeyboard: false });
                            },
                            editable: !this.state.opponentLeft
                        }}
                        renderSend={this.renderSend}
                        renderInputToolbar={this.renderInputToolbar}

                        listViewProps={{
                            // scrollEventThrottle: 400,
                            onScroll: ({ nativeEvent }) => {
                                // console.log('nativeEvent', nativeEvent);
                                if (this.isCloseToTop(nativeEvent)) {
                                    console.log('close to top');
                                    this.loadMore();
                                }
                            }
                        }}
                    />
                    {/*
                        <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : null} keyboardVerticalOffset={80}/>
                    */}

                    {

                        // Platform.OS === 'android' ? <KeyboardSpacer /> : null
                        // <KeyboardSpacer />

                        // (Platform.OS === 'ios') && this.state.onKeyboard &&
                        // <KeyboardSpacer />
                    }
                </View>

                {
                    /*
                    Platform.OS === 'android' &&
                    !this.state.onKeyboard &&
                    <View style={{ width: '100%', height: Dimensions.get('window').height / 20, backgroundColor: 'red' }}/>
                    */
                }

                {
                    // Consider: apply fade in animation
                    this.state.renderPost && showPost &&
                    <View style={[styles.post, { top: _postTop }]}>
                        <Text>
                            <Text style={styles.text1}>{'You picked '}</Text>
                            <Text style={styles.name}>{labelName}</Text>
                            <Text style={styles.text1}>{'!'}</Text>
                        </Text>

                        <TouchableOpacity onPress={async () => await this.openPost()}>
                            <SmartImage
                                style={{
                                    width: imageWidth, height: imageWidth, borderRadius: imageWidth / 2,
                                    marginTop: this.state.onKeyboard ? Theme.spacing.tiny : Theme.spacing.base,
                                    marginBottom: Theme.spacing.tiny
                                }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={this.state.titleImageUri}
                            />
                        </TouchableOpacity>

                        {/*
                        <Text style={styles.text2}>{text2}</Text>
                        */}
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
    } // end of render

    isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
        const threshold = 80;
        return contentSize.height - layoutMeasurement.height - threshold <= contentOffset.y;
    }

    loadMore() {
        if (this.onLoading) return;

        this.onLoading = true;

        const lastMessage = this.state.messages[this.state.messages.length - 1];
        const time = lastMessage.createdAt;
        const date = new Date(time);
        const timestamp = date.getTime();
        const id = lastMessage._id;

        Firebase.loadMoreMessage(this.state.id, timestamp, id, message => {
            if (message) {
                console.log('message list', message);

                !this.closed && this.setState(previousState => ({
                    messages: GiftedChat.prepend(previousState.messages, message)
                }));

                this.onLoading = false;
            }
        });
    }

    async sendMessage(isSameDay, message) {
        const item = this.props.navigation.state.params.item;

        // save the message to database & update UI
        await Firebase.sendMessage(this.state.id, message, item);

        // send push notification
        const notificationType = Cons.pushNotification.chat;
        const sender = item.users[0].uid;
        const senderName = item.users[0].name;
        const receiver = item.users[1].uid; // owner

        /*
        let users = [];

        const user1 = { // My info
            // uid: sender,
            name: Firebase.user().name,
            picture: Firebase.user().photoUrl
        };

        const user2 = { // Your info (Post info)
            // uid: receiver,
            name: item.users[1].name,
            picture: item.users[1].picture
        };

        users.push(user1);
        users.push(user2);
        */

        const data = {
            message: message.text,
            placeId: item.placeId,
            feedId: item.feedId,
            chatRoomId: this.state.id,
            // users: users
        };

        sendPushNotification(sender, senderName, receiver, notificationType, data);
    }

    /*
    async saveUnreadChatRoomId() {
        const { item } = this.props.navigation.state.params;
        const users = item.users;
        const opponent = users[1].uid;

        // check profile
        const { profileStore } = this.props;
        const profile = profileStore.profile;
        const unreadChatRoom = profile.unreadChatRoom;

        let found = false;

        for (var i = 0; i < unreadChatRoom.length; i++) {
            const room = unreadChatRoom[i];
            const id = room.id;

            if (this.state.id === id) {
                found = true;
                break;
            }
        }

        if (!found) {
            // save
            await Firebase.saveUnreadChatRoomId(this.state.id);
        }
    }
    */

    async openPost() {
        /*
                const item = this.props.navigation.state.params.item;
        
                const post = this.getPost(item);
                if (!post) {
                    this.refs["toast"].show('The post has been removed by its owner.', 500); // or NOT subscribed yet!
        
                    // we skip here. NOT to close the chat room! (leave it to the user)
        
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
        
                // setTimeout(() => {
                this.props.navigation.navigate("post", { post: post, extra: extra, from: 'ChatRoom' });
                // }, Cons.buttonTimeoutShort);
        */

        setTimeout(() => {
            if (this.closed) return;

            const item = this.props.navigation.state.params.item;

            const post = item.post;

            const extra = {
                feedSize: item.feedSize
            };

            Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
            this.props.navigation.navigate("post", { post, extra, from: 'ChatRoom' });
        }, Cons.buttonTimeoutShort);
    }

    getPost(item) {
        /*
        const placeId = item.placeId;
        const feedId = item.feedId;

        if (this.feed) {
            console.log('post from memory');
            return this.feed;
        }

        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (!feedDoc.exists) return null;

        const post = feedDoc.data();

        this.feed = post;

        // subscribe here
        // --
        const instance = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) { // newFeed === undefined if removed
                this.feed = null;
                return;
            }

            // update
            this.feed = newFeed;
        });

        this.feedUnsubscribe = instance;
        // --
        */

        const post = this.feed;

        return post;
    }

    getFeedSize(placeId) {
        /*
        if (this.feedCount) {
            console.log('count from memory');
            return this.feedCount;
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        const count = placeDoc.data().count;

        this.feedCount = count;

        // subscribe here
        // --
        const instance = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCount = 0;

                return;
            }

            // update this.feedCount
            this.feedCount = newPlace.count;
        });

        this.countUnsubscribe = instance;
        // --
        */

        const count = this.feedCount;

        return count;
    }

    async openAvatar() {
        const item = this.props.navigation.state.params.item;

        if (item.owner === item.users[1].uid) {
            /*
            const placeId = item.placeId;
            const feedId = item.feedId;
            const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
            if (!feedDoc.exists) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            setTimeout(async () => {
                const post = feedDoc.data();

                if (!this.feedSize) {
                    const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
                    this.feedSize = placeDoc.data().count;
                }

                const extra = {
                    // cityName: this.state.searchText,
                    feedSize: this.feedSize
                };

                this.props.navigation.navigate("post", { post: post, extra: extra, from: 'ChatRoom' });
            }, Cons.buttonTimeoutShort);
            */

            await this.openPost();
        } else {
            const user1 = item.users[0]; // owner (girl)
            const user2 = item.users[1]; // customer
            /*
                        if (!this.opponentUser) {
                            const userDoc = await Firebase.firestore.collection("users").doc(user2.uid).get();
                            if (!userDoc.exists) {
                                this.refs["toast"].show('The user no longer exists.', 500);
                                return;
                            }
            
                            const opponentUser = userDoc.data();
                            this.opponentUser = opponentUser;
            
                            // subscribe here
                            // --
                            const instance = Firebase.subscribeToProfile(user2.uid, user => {
                                if (user === undefined) {
                                    this.opponentUser = null;
                                    return;
                                }
            
                                // update
                                this.opponentUser = user;
                            });
            
                            this.opponentUserUnsubscribe = instance;
                            // --
                        }
            */
            const customerProfile = item.customerProfile;

            // const { name, birthday, gender, place, picture, about, receivedCommentsCount, timestamp } = this.opponentUser; // customer
            const { name, birthday, gender, place, picture, about, receivedCommentsCount, timestamp } = customerProfile;

            const guest = { // customer
                uid: user2.uid,
                name,
                picture: picture.uri,
                address: place,

                receivedCommentsCount: receivedCommentsCount,
                timestamp,
                birthday, gender, about
            };

            const host = { // owner (girl)
                uid: user1.uid,
                name: user1.name,
                picture: user1.picture,
                address: item.placeName
            };

            const _item = {
                placeId: item.placeId,
                feedId: item.feedId,
                host,
                guest
            };

            setTimeout(() => {
                !this.closed && this.props.navigation.navigate("user", { item: _item });
            }, Cons.buttonTimeoutShort);
        }
    }

    @autobind
    renderSend(props) {
        return (
            <Send {...props} containerStyle={{ marginBottom: textInputMarginBottom + sendButtonMarginBottom }}>
                <View style={styles.sendButton}>
                    <Ionicons name='ios-send' color={this.state.opponentLeft ? Theme.color.placeholder : Theme.color.selection} size={28} />

                    {/*
                    <Image source={require('../../assets/send.png')} resizeMode={'center'}/>
                    */}
                </View>
            </Send>
        );
    }

    @autobind
    renderInputToolbar(props) {
        return <InputToolbar {...props} containerStyle={{
            backgroundColor: Theme.color.background,
            borderTopColor: Theme.color.textInput
            // borderTopWidth: 0
        }} />
    }

    handleLeave() {
        const item = this.props.navigation.state.params.item;
        const myUid = item.users[0].uid;
        const myName = item.users[0].name;
        const opponentUid = item.users[1].uid;
        const labelName = item.users[1].name;

        this.openDialog('Leave conversation', "Are you sure you don't want to receive new messages from " + labelName + "?", async () => {
            await Firebase.deleteChatRoom(myUid, myName, opponentUid, item.id);
            // this.props.screenProps.state.params.onGoBack(index, () => { this.props.navigation.goBack(); });
            this.props.navigation.navigate("chat", { roomId: item.id });
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
    container: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end'
    },
    androidView: {
        flex: 1
    },
    iosView: {
        height: chatViewHeight
    },
    androidTextInput: {
        width: '86%',
        height: inputToolbarHeight,
        fontSize: 16,
        fontFamily: "Roboto-Regular",
        color: "white",
        backgroundColor: Theme.color.background,
        // backgroundColor: 'green',
        marginBottom: textInputMarginBottom,

        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight
    },
    iosTextInput: {
        width: '86%',
        height: inputToolbarHeight,
        fontSize: 16,
        fontFamily: "Roboto-Regular",
        color: "white",
        backgroundColor: Theme.color.background,
        // backgroundColor: 'green',
        marginBottom: textInputMarginBottom,

        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight,

        paddingTop: textInputPaddingTop
    },
    sendButton: {
        backgroundColor: Theme.color.background,
        width: (Dimensions.get('window').width / 10),
        height: (Dimensions.get('window').width / 10),
        alignItems: 'center',
        justifyContent: 'center',

        // marginBottom: textInputMarginBottom + sendButtonMarginBottom
    },
    post: {
        width: postWidth,
        height: postHeight,
        position: 'absolute',
        alignItems: 'center',
        // justifyContent: 'flex-start',
        justifyContent: 'center',

        // backgroundColor: 'green'
    },
    text1: {
        color: Theme.color.text2,
        fontSize: 20,
        fontFamily: "Roboto-Light"
    },
    name: {
        color: Theme.color.text2,
        fontSize: 20,
        fontFamily: "Roboto-Medium"
    },
    text2: {
        color: Theme.color.text2,
        fontSize: 18,
        fontFamily: "Roboto-Light",
        paddingHorizontal: Theme.spacing.base,
        textAlign: 'center'
    }
});
