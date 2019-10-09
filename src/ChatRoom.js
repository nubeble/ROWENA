import React from 'react';
import {
    StyleSheet, View, Dimensions, TouchableOpacity, Keyboard, BackHandler, Platform, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Text, Theme, FeedStore } from "./rnff/src/components";
import { GiftedChat, InputToolbar, Send, Bubble, Time, Message, MessageText } from 'react-native-gifted-chat';
// import * as Animatable from 'react-native-animatable';
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
import { NavigationActions } from 'react-navigation';
import PreloadImage from './PreloadImage';
// import KeyboardSpacer from 'react-native-keyboard-spacer';

type InjectedProps = {
    feedStore: FeedStore
};

const DEFAULT_MESSAGE_COUNT = 20;

const chatViewHeight = Dimensions.get('window').height - Cons.searchBarHeight;

const inputToolbarHeight = 48;
const textInputMarginBottom = 2;
const sendButtonMarginBottom = 7;

const textInputPaddingLeft = 16;
const textInputPaddingRight = 10;

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;
const avatarHeight = Cons.searchBarHeight * 0.5;
const bigImageWidth = postHeight * 0.7;
// const smallImageWidth = (Dimensions.get('window').height <= 640) ? postHeight * 0.58 : bigImageWidth;
const smallImageWidth = postHeight * 0.7;


// export default class ChatRoom extends React.Component {
@inject("feedStore")
@observer
export default class Post extends React.Component<InjectedProps> {
    state = {
        titleImageUri: null,
        titleName: null,
        messages: [],

        isLoadingMessages: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        onKeyboard: false,
        viewHeight: Dimensions.get('window').height,

        renderPost: false,

        opponentLeft: false
    };

    constructor(props) {
        super(props);

        this.id = null;
        this.users = null;

        this.allMessagesLoaded = false;
    }

    componentDidMount() {
        console.log('jdub', 'ChatRoom.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardWillShow);
        this.keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', this._keyboardWillHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const item = this.props.navigation.state.params.item;

        this.id = item.id;
        this.users = item.users;

        this.setState({ titleImageUri: item.title.picture, titleName: item.title.name });

        Firebase.chatOn(DEFAULT_MESSAGE_COUNT, item.id, message => {
            if (!message) {
                this.allMessagesLoaded = true;
                return;
            }
            // console.log('jdub', 'on message', message);

            // fill user info (name, avatar)
            if (message.user) {
                for (let i = 0; i < this.users.length; i++) {
                    const user = this.users[i];

                    if (message.user._id === user.uid) {
                        message.user.name = user.name;
                        if (user.picture) message.user.avatar = user.picture;
                        // else message.user.avatar = PreloadImage.user;
                        else message.user.avatar = 'none'; // Consider

                        break;
                    }
                }
            }

            // check if the leave message arrived
            if (message.system && message.text.indexOf(" has left the chat room.") !== -1) {
                !this.closed && this.setState({ opponentLeft: true });
            }

            !this.closed && this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, message)
            }));
        });

        // show center post avatar
        if (item.showAvatar) this.setState({ renderPost: true });
    }

    componentWillUnmount() {
        console.log('jdub', 'ChatRoom.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.keyboardWillShowListener.remove();
        this.keyboardWillHideListener.remove();
        this.hardwareBackPressListener.remove();

        const item = this.props.navigation.state.params.item;
        Firebase.chatOff(item.id);

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'ChatRoom.handleHardwareBackPress');

        this.goBack(); // works best when the goBack is async

        return true;
    }

    async goBack() {
        // save last message
        const item = this.props.navigation.state.params.item;

        const lastReadMessageId = item.lastReadMessageId;

        const message = this.getLastMessage();
        if (message) {
            const mid = message._id;

            if (lastReadMessageId !== mid) {
                await Firebase.saveLastReadMessageId(Firebase.user().uid, this.id, mid);
            }
        }

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
        // !this.closed && this.setState({ onKeyboard: true });

        this.setState({ onKeyboard: true, viewHeight: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide(e) {
        // !this.closed && this.setState({ onKeyboard: false });

        this.setState({ onKeyboard: false, viewHeight: Dimensions.get('window').height });
    }

    @autobind
    _keyboardWillShow(e) {
        this._keyboardDidShow(e);
    }

    @autobind
    _keyboardWillHide(e) {
        this._keyboardDidHide(e);
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

        Firebase.loadMoreMessage(DEFAULT_MESSAGE_COUNT, this.id, timestamp, id, messages => {
            if (!messages) {
                this.allMessagesLoaded = true;
            } else {
                // console.log('jdub', 'message list', message);

                if (messages.length < DEFAULT_MESSAGE_COUNT) this.allMessagesLoaded = true;

                // fill user info (name, avatar)
                for (let i = 0; i < messages.length; i++) {
                    let message = messages[i];
                    if (message.user) {
                        for (let i = 0; i < this.users.length; i++) {
                            const user = this.users[i];

                            if (message.user._id === user.uid) {
                                message.user.name = user.name;
                                if (user.picture) message.user.avatar = user.picture;
                                // else message.user.avatar = PreloadImage.user;
                                else message.user.avatar = 'none'; // Consider

                                break;
                            }
                        }
                    }
                }

                !this.closed && this.setState(previousState => ({
                    messages: GiftedChat.prepend(previousState.messages, messages)
                }));
            }

            !this.closed && this.setState({ isLoadingMessages: false });
        });
    }

    async sendMessage(isSameDay, message) {
        if (message.text.length === 0) return;

        const item = this.props.navigation.state.params.item;

        // save the message to database & update UI
        await Firebase.sendMessage(this.id, message, item);

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
            chatRoomId: this.id,
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

            if (this.id === id) {
                found = true;
                break;
            }
        }

        if (!found) {
            // save
            await Firebase.saveUnreadChatRoomId(this.id);
        }
    }
    */

    async openPost() {
        const item = this.props.navigation.state.params.item;
        const post = item.post;

        const result = await Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
        if (!result) { // post removed
            this.refs["toast"].show('The post no longer exists.', 500);
        } else {
            const extra = {
                feedSize: item.feedSize
            };

            this.props.navigation.navigate("post", { post: result, extra, from: 'ChatRoom' });
        }
    }

    async openAvatar() {
        const item = this.props.navigation.state.params.item;

        if (item.owner === item.users[1].uid) {
            await this.openPost();
        } else {
            const user1 = item.users[0]; // host
            const user2 = item.users[1]; // customer

            const customerProfile = item.customerProfile;

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

            const host = { // host
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

            this.props.navigation.navigate("user", { from: 'ChatRoom', item: _item });
        }
    }

    render() {
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
                            this.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* icon + text */}
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                        onPress={async () => await this.openPost()}
                    >
                        <SmartImage
                            style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2 }}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={this.state.titleImageUri}
                        />
                        <Text
                            style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: 18,
                                fontFamily: "Roboto-Medium",
                                marginLeft: 10
                            }}
                        >{this.state.titleName}</Text>
                    </TouchableOpacity>

                    {/* report button */}
                    {
                        item.users[1].uid === item.owner &&
                        this.renderReportButton()
                    }

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
                {/*
                <View style={Platform.OS === 'android' ? styles.androidView : styles.iosView}>
                */}
                <View style={Platform.OS === 'android' ? [styles.androidView, { height: this.state.viewHeight - Cons.searchBarHeight }] : styles.iosView}>

                    <GiftedChat
                        minInputToolbarHeight={inputToolbarHeight + textInputMarginBottom}
                        minComposerHeight={0}
                        maxComposerHeight={0}

                        alwaysShowSend={true}
                        // isAnimated={true}

                        // forceGetKeyboardHeight={Platform.OS === 'android' && Platform.Version < 21}
                        messages={this.state.messages}
                        extraData={this.state.extraData}
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
                        // onPressAvatar={async () => await this.openAvatar()}
                        onLongPress={() => undefined}

                        textInputProps={{
                            /*
                            multiline: true,
                            numberOfLines: 2,
                            */

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
                                !this.closed && this.setState({ onKeyboard: true });
                            },
                            onBlur: () => {
                                !this.closed && this.setState({ onKeyboard: false });
                            },
                            editable: !this.state.opponentLeft
                        }}
                        renderSend={this.renderSend}
                        renderInputToolbar={this.renderInputToolbar}

                        renderAvatar={this.renderAvatar}
                        renderBubble={this.renderBubble}
                        renderMessageText={this.renderMessageText}
                        renderTime={this.renderTime}
                        shouldUpdateMessage={this.shouldUpdateMessage}

                        listViewProps={{
                            // scrollEventThrottle: 400,
                            onScroll: ({ nativeEvent }) => {
                                // console.log('jdub', 'nativeEvent', nativeEvent);
                                if (this.isCloseToTop(nativeEvent)) {
                                    // console.log('jdub', 'close to top');
                                    this.loadMore();
                                }
                            }
                        }}
                    />
                    {/*
                    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : null} keyboardVerticalOffset={80} />
                    */}
                    {/*
                    <KeyboardSpacer />
                    */}
                </View>

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
        return (
            <Send {...props}
                containerStyle={{
                    marginTop: -4,
                    marginBottom: textInputMarginBottom + sendButtonMarginBottom
                }}
            >
                <View style={styles.sendButton}>
                    <Ionicons name='ios-send' color={this.state.opponentLeft ? Theme.color.placeholder : Theme.color.selection} size={28} />

                    {/*
                    <Image source={require('../../assets/send.png')} resizeMode={'center'} />
                    */}
                </View>
            </Send>
        );
    }

    @autobind
    renderInputToolbar(props) {
        return (
            <InputToolbar {...props}
                containerStyle={{
                    backgroundColor: Theme.color.background,
                    borderTopColor: Theme.color.textInput
                    // borderTopWidth: 0
                }}
            />
        );
    }

    @autobind
    renderAvatar(props) {
        const currentMessage = props.currentMessage;

        if (!currentMessage.user || !currentMessage.user._id || !currentMessage.user.avatar || !currentMessage.user.name) {
            console.log('jdub', 'renderAvatar currentMessage', currentMessage);
            return null; // system message
        }

        const { user } = currentMessage;
        // const uid = user._id;

        const avatarWidth = 36;

        let picture = user.avatar;
        if (picture === 'none') {
            picture = null;
        }

        const avatarColor = Util.getAvatarColor(user._id);
        const avatarName = Util.getAvatarName(user.name);

        if (!avatarName) {
            console.log('jdub', 'avatarName is null!!!!', user)
            return;
        }

        let nameFontSize = 17;
        if (avatarName.length === 1) nameFontSize = 19;
        else if (avatarName.length === 2) nameFontSize = 17;
        else if (avatarName.length === 3) nameFontSize = 13;

        return (
            <TouchableOpacity
                onPress={async () => await this.openAvatar()}>
                {
                    picture ?
                        <SmartImage
                            style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={picture}
                            showSpinner={false}
                        />
                        :
                        <View
                            style={{
                                width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2,
                                alignItems: 'center', justifyContent: 'center', backgroundColor: avatarColor
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: nameFontSize, fontFamily: "Roboto-Medium" }}>
                                {avatarName}
                            </Text>
                        </View>
                }
            </TouchableOpacity>
        );
    }

    @autobind
    renderBubble(props) {
        // console.log('jdub', 'renderBubble, props', props);

        let wrapperStyle = null;

        const item = this.props.navigation.state.params.item;
        if (item.users[0].uid === item.owner) {
            // I'm a host.
            wrapperStyle = {
                left: {
                    backgroundColor: Theme.color.selection
                },
                right: {
                    backgroundColor: Theme.color.splash
                }
            };
        } else {
            // I'm a customer.
            wrapperStyle = {
                left: {
                    backgroundColor: Theme.color.splash
                },
                right: {
                    backgroundColor: Theme.color.selection
                }
            };
        }

        return (
            // <Animatable.View animation={'bounceInLeft'} duration={400}>
            <Bubble {...props}
                textStyle={{
                    left: {
                        color: 'white'
                    },
                    right: {
                        color: 'white'
                    }
                }}

                wrapperStyle={wrapperStyle}

                touchableProps={{
                    onPress: async () => {
                        /*
                        "currentMessage": Object {
                            "_id": "-Lk7NivXcRdB0DME5-75",
                            "createdAt": 2019-07-19T03:59:57.400Z,
                            "text": "동작잘하는군",
                            "user": Object {
                                "_id": "tsIJHN1fyjZ7In095lCi7w2NAJP2",
                                "avatar": "https://storage.googleapis.com/rowena-88cfd.appspot.com/images%2FtsIJHN1fyjZ7In095lCi7w2NAJP2%2Fpost%2Fc9722441-350a-a8b8-aba1-737864af1e18%2Fee379518-9be0-42fa-93a3-956dbb44e62f.jpg?GoogleAccessId=firebase-adminsdk-nfrft%40rowena-88cfd.iam.gserviceaccount.com&Expires=7263907200&Signature=QQovchLR6PapMBgdopORb5PIjyVmkvknEBaw3dTts6SSpTnzrMJQn4aMF5ZkS1XSFZm3m2dV1fHy5Lgi4a9wgc6S5t%2BV8wL8bNr6f65y18IwlgjxqUXbosEGAu%2BtRnUtny%2FnExAeyTTFEOS8FpcEt6CY444DdhskGTKNqs8iYGmS4a2IIlBXjyogwntUf%2BXFWWyrqnkFH6KQSaPwiqfxj8iMSVAVss9EOONH%2FBRJ8ZTchP71XFu8qLPW7L%2Bf3xAbf15pG3AcP%2B35zJlkMYB1Cn8e%2Btk6lquRgrZ2NL%2FcfG9h4wIl3R2iF9EfPiRCG4nxiQdFnj3xxnSkNWoeFvynXQ%3D%3D",
                                "name": "매탄동 나달",
                            },
                        }
                        */


                        const currentMessage = props.currentMessage;
                        // console.log('jdub', 'currentMessage', currentMessage);

                        let { messages } = this.state;

                        let index = -1;

                        for (let i = 0; i < messages.length; i++) {
                            const message = messages[i];
                            if (message._id === currentMessage._id) {
                                index = i;
                                break;
                            }
                        }

                        if (index !== -1) {
                            let message = messages[index];

                            // re-render for custom message
                            message.updated = true;

                            const showTranslation = !!message.showTranslation;
                            if (showTranslation) { // -> hide
                                message.showTranslation = false;
                            } else { // -> show
                                message.showTranslation = true;
                            }

                            if (!message.translatedText) {
                                message.translatedText = await Util.translate(message.text);
                            }

                            messages[index] = message;
                            !this.closed && this.setState({ messages });
                        }
                    }
                }}
            >
            </Bubble>
            // </Animatable.View>
        )
    }

    @autobind
    renderMessageText(props) {
        // console.log('jdub', 'renderMessageText', props);

        const showTranslation = !!props.currentMessage.showTranslation;
        // if (showTranslation) console.log('jdub', 'translated', props.currentMessage.translatedText);

        return (
            <View>
                <MessageText {...props}
                    linkStyle={{
                        left: {
                            color: 'white'
                        },
                        right: {
                            color: 'white'
                        }
                    }}
                />
                {
                    showTranslation &&
                    <MessageText {...props}
                        linkStyle={{
                            left: {
                                color: 'white'
                            },
                            right: {
                                color: 'white'
                            }
                        }}
                        currentMessage={{
                            text: props.currentMessage.translatedText
                        }}
                    />
                }
            </View>
        );
    }

    @autobind
    renderTime(props) {
        return (
            <Time
                textStyle={{
                    left: {
                        color: Theme.color.text2
                    },
                    right: {
                        color: Theme.color.text2
                    }
                }}
                {...props}
            />
        );
    }

    @autobind
    shouldUpdateMessage(props, nextProps) {
        /*
            currentMessage: {};
            nextMessage: {};
            previousMessage: {};
        */

        const msg1 = props.currentMessage;
        const msg2 = nextProps.currentMessage;

        if (msg1.updated || msg2.updated) return true;

        return false;
    }

    handleLeave() {
        const item = this.props.navigation.state.params.item;
        const roomId = item.id;
        const myUid = item.users[0].uid;
        const myName = item.users[0].name;
        const opponentUid = item.users[1].uid;
        const labelName = item.users[1].name;

        this.openDialog('Leave Conversation', "Are you sure you don't want to receive new messages from " + labelName + "?", async () => {
            await Firebase.deleteChatRoom(myUid, myName, opponentUid, roomId);

            // this.props.navigation.navigate("chat", { roomId });
            this.props.navigation.navigate("chatMain", { roomId });
        });
    }

    renderReportButton() {
        return (
            <View style={{ height: avatarHeight, justifyContent: 'center', alignItems: 'center' }}>

                <TouchableOpacity
                    style={{
                        width: 20,
                        height: 20,
                        marginLeft: 6,
                        justifyContent: "center", alignItems: "center"
                    }}
                    onPress={() => {
                        const item = this.props.navigation.state.params.item;
                        const post = item.post;

                        this.openDialog('Report User', 'Are you sure you want to report and block ' + post.name + '?', async () => {
                            // report user

                            // 1. update database (reporters)
                            const uid = Firebase.user().uid;
                            const placeId = post.placeId;
                            const feedId = post.id;

                            const result = await Firebase.reportPost(uid, placeId, feedId);
                            if (!result) {
                                // the post is removed
                                this.refs["toast"].show('The post has been removed by its owner.', 500);
                                return;
                            }

                            // 2. update feedStore
                            let _post = post;
                            if (!_post.reporters) {
                                let reporters = [];
                                reporters.push(uid);
                                _post.reporters = reporters;
                            } else {
                                _post.reporters.push(uid);
                            }

                            const { feedStore } = this.props;
                            feedStore.updateFeed(_post);

                            // 3. go back (leave room)
                            this.refs["toast"].show('Thanks for your feedback.', 500, async () => {
                                if (this.closed) return;

                                // this.goBack();

                                // leave room
                                const roomId = item.id;
                                const myUid = item.users[0].uid;
                                const myName = item.users[0].name;
                                const opponentUid = item.users[1].uid;

                                await Firebase.deleteChatRoom(myUid, myName, opponentUid, roomId);

                                this.props.navigation.navigate("chatMain", { roomId });
                            });
                        });
                    }}>
                    <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                </TouchableOpacity>

            </View>
        );
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end'
    },
    androidView: {
        // flex: 1,
        backgroundColor: Theme.color.background
    },
    iosView: {
        height: chatViewHeight,
        backgroundColor: Theme.color.background
    },
    androidTextInput: {
        width: '86%',
        height: inputToolbarHeight,
        fontSize: 16,
        fontFamily: "Roboto-Regular",
        color: "white",
        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight,
        marginBottom: textInputMarginBottom
    },
    iosTextInput: {
        width: '86%',
        height: inputToolbarHeight,
        fontSize: 16,
        fontFamily: "Roboto-Regular",
        color: "white",
        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight,
        marginBottom: textInputMarginBottom,
        paddingTop: textInputMarginBottom + 10
    },
    sendButton: {
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
        justifyContent: 'center'
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
