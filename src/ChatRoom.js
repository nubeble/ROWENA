import React from 'react';
import {
    StyleSheet, View, Dimensions, TouchableOpacity, Keyboard, BackHandler, Platform, ActivityIndicator
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
import { NavigationActions } from 'react-navigation';

const DEFAULT_MESSAGE_COUNT = 20;

const chatViewHeight = Dimensions.get('window').height - Cons.searchBarHeight;

const inputToolbarMarginBottom = 20; // ios only

const textInputPaddingLeft = (Dimensions.get('window').width / 20);
const textInputPaddingRight = (Dimensions.get('window').width / 20);

const textInputMarginBottom = 4;

const sendButtonMarginBottom = 7;
const inputToolbarHeight = 48;

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

        isLoadingMessages: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        onKeyboard: false,
        renderPost: false,

        opponentLeft: false
    };

    constructor(props) {
        super(props);

        this.allMessagesLoaded = false;
    }

    componentDidMount() {
        console.log('ChatRoom.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

        this.keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardWillShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', this._keyboardWillHide);

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const item = this.props.navigation.state.params.item;

        this.setState({ id: item.id, titleImageUri: item.title.picture, titleName: item.title.name });

        Firebase.chatOn(DEFAULT_MESSAGE_COUNT, item.id, message => {
            console.log('on message', message);

            // fill name, avatar (picture)
            if (message.user) {
                for (let i = 0; i < item.users.length; i++) {
                    const user = item.users[i];

                    if (message.user._id === user.uid) {
                        message.user.name = user.name;
                        if (user.picture) message.user.avatar = user.picture;
                        else message.user.avatar = PreloadImage.user;

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

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ChatRoom.handleHardwareBackPress');
        // this.goBack(); // works best when the goBack is async

        this.moveToChatMain();

        return true;
    }

    async moveToChatMain() {
        // save last message
        const item = this.props.navigation.state.params.item;

        const lastReadMessageId = item.lastReadMessageId;

        const message = this.getLastMessage();
        if (message) {
            const mid = message._id;

            if (lastReadMessageId !== mid) {
                await Firebase.saveLastReadMessageId(Firebase.user().uid, this.state.id, mid);
            }
        }

        // this.props.navigation.navigate("chat");
        this.props.navigation.dispatch(NavigationActions.back());
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
        this.setState({ onKeyboard: true });
    }

    @autobind
    _keyboardDidHide(e) {
        this.setState({ onKeyboard: false });
    }

    @autobind
    _keyboardWillShow(e) {
        this.setState({ onKeyboard: true });
    }

    @autobind
    _keyboardWillHide(e) {
        this.setState({ onKeyboard: false });
    }

    get user() {
        // Return our name and our UID for GiftedChat to parse
        return {
            _id: Firebase.user().uid,
            name: Firebase.user().name,
            avatar: Firebase.user().photoUrl
        };
    }

    isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
        const threshold = 80;
        return contentSize.height - layoutMeasurement.height - threshold <= contentOffset.y;
    }

    loadMore() {
        if (this.allMessagesLoaded) return;

        if (this.state.isLoadingMessages) return;

        this.setState({ isLoadingMessages: true });

        const lastMessage = this.state.messages[this.state.messages.length - 1];
        const time = lastMessage.createdAt;
        const date = new Date(time);
        const timestamp = date.getTime();
        const id = lastMessage._id;

        Firebase.loadMoreMessage(DEFAULT_MESSAGE_COUNT, this.state.id, timestamp, id, message => {
            if (message) {
                console.log('message list', message);

                !this.closed && this.setState(previousState => ({
                    messages: GiftedChat.prepend(previousState.messages, message)
                }));

                // this.onLoading = false;
            } else {
                this.allMessagesLoaded = true;
            }

            this.setState({ isLoadingMessages: false });
        });
    }

    async sendMessage(isSameDay, message) {
        if (message.text.length === 0) return;

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

        for (let i = 0; i < unreadChatRoom.length; i++) {
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
        setTimeout(() => {
            if (this.closed) return;

            const item = this.props.navigation.state.params.item;

            const post = item.post;

            const extra = {
                feedSize: item.feedSize
            };

            Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
            this.props.navigation.navigate("post", { post, extra, from: 'ChatRoom' });
        }, Cons.buttonTimeout);
    }

    getPost(item) {
        const post = this.feed;

        return post;
    }

    getFeedSize(placeId) {
        const count = this.feedCount;

        return count;
    }

    async openAvatar() {
        const item = this.props.navigation.state.params.item;

        if (item.owner === item.users[1].uid) {
            await this.openPost();
        } else {
            const user1 = item.users[0]; // owner (girl)
            const user2 = item.users[1]; // customer

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
                !this.closed && this.props.navigation.navigate("user", { from: 'ChatRoom', item: _item });
            }, Cons.buttonTimeout);
        }
    }

    render() {
        const _inputToolbarMarginBottom = this.state.onKeyboard ? 0 : inputToolbarMarginBottom;

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
                        // minInputToolbarHeight={inputToolbarHeight + textInputMarginBottom}
                        minInputToolbarHeight={Platform.OS === 'ios' ? inputToolbarHeight + textInputMarginBottom + _inputToolbarMarginBottom : inputToolbarHeight + textInputMarginBottom}
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
                            // multiline: true,
                            // numberOfLines: 2,
                            /*
                            onLayout: (event) => {
                                const layout = event.nativeEvent.layout;
                                this.textInputHeight = layout.height;
                            },
                            */

                            // style: Platform.OS === 'android' ? styles.androidTextInput : styles.iosTextInput,
                            style: Platform.OS === 'ios' ? [styles.iosTextInput, { marginBottom: textInputMarginBottom + _inputToolbarMarginBottom }] : styles.androidTextInput,

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


                        /*
                        renderAvatar ={props => {
                            return <CustomActions {...props} onSend={this.onSendFromUser} />
                        }}
                        */


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
                    this.state.renderPost && this.state.messages.length <= 1 &&
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

                {
                    !this.state.renderPost && this.state.messages.length === 0 &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
                }

                {
                    this.state.isLoadingMessages &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
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

    @autobind
    renderSend(props) {
        const _inputToolbarMarginBottom = this.state.onKeyboard ? 0 : inputToolbarMarginBottom;

        return (
            // <Send {...props} containerStyle={{ marginTop: -4, marginBottom: textInputMarginBottom + sendButtonMarginBottom }}>
            <Send {...props}
                containerStyle={{
                    marginTop: -4,
                    marginBottom: Platform.OS === 'ios' ? textInputMarginBottom + sendButtonMarginBottom + _inputToolbarMarginBottom : textInputMarginBottom + sendButtonMarginBottom
                }}
            >
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
        // backgroundColor: Theme.color.background,
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
        // backgroundColor: Theme.color.background,
        // backgroundColor: 'green',
        marginBottom: textInputMarginBottom,

        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight,

        paddingTop: 14
    },
    sendButton: {
        // backgroundColor: Theme.color.background,
        // backgroundColor: 'red',
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center'
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
