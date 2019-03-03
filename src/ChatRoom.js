import React from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard, BackHandler, Platform, SafeAreaView
} from 'react-native';
import { Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
// import KeyboardSpacer from 'react-native-keyboard-spacer';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeAlert from 'react-native-awesome-alerts';
import autobind from "autobind-decorator";
import SmartImage from "./rnff/src/components/SmartImage";
import { Cons } from "./Globals";
import { sendPushNotification } from './PushNotifications';
import { inject, observer } from "mobx-react/native";
import Toast, { DURATION } from 'react-native-easy-toast';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const chatViewHeight = Dimensions.get('window').height - Cons.searchBarHeight;
const textInputPaddingTop = parseInt(Dimensions.get('window').height / 26);
const textInputPaddingLeft = parseInt(Dimensions.get('window').width / 20);
const textInputPaddingRight = parseInt(Dimensions.get('window').width / 20);
const textInputMarginBottom = (Platform.OS === 'ios') ? 20 : 12;
const sendButtonMarginBottom = parseInt(Dimensions.get('window').height / 40);
const inputToolbarHeight = parseInt(Dimensions.get('window').height / 10);

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;
const avatarHeight = Cons.searchBarHeight * 0.5;
const bigImageWidth = postHeight * 0.7;
// const smallImageWidth = (Dimensions.get('window').height <= 640) ? postHeight * 0.58 : bigImageWidth;
const smallImageWidth = postHeight * 0.7;


@inject("feedStore", "profileStore")
@observer
export default class ChatRoom extends React.Component<InjectedProps> {
    state = {
        id: null,
        titleImageUri: null,
        titleName: null,
        messages: [],
        showAlert: false,
        onKeyboard: false,
        renderPost: false
    };

    constructor(props) {
        super(props);

        this.onLoading = false;
    }

    componentDidMount() {
        console.log('ChatRoom.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const item = this.props.navigation.state.params.item;

        let titleImageUri = null;
        let titleName = null;

        const users = item.users;
        for (var i = 0; i < users.length; i++) { // find the owner of this post
            const user = users[i];

            if (item.owner === user.uid) {
                titleImageUri = user.picture;
                titleName = user.name;

                break;
            }
        }

        this.setState({ id: item.id, titleImageUri, titleName });

        Firebase.chatOn(item.id, message => {
            console.log('on message', message);

            // fill name, avatar in user
            if (message.user) {
                for (var i = 0; i < item.users.length; i++) {
                    const user = item.users[i];

                    if (message.user._id === user.uid) {
                        message.user.name = user.name;
                        message.user.avatar = user.picture;

                        break;
                    }
                }
            }

            !this.closed && this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, message)
            }));
        });

        if (item.contents === '') {
            this.setState({ renderPost: true });
        }
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
        // this.goBack(); // works best when the goBack is async

        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            this.moveToChat();
        }

        return true;
    }

    moveToChat() {
        // save the last message to chat main
        if (this.state.messages.length > 1) {
            const lastMessage = this.state.messages[0];
            const mid = lastMessage._id;

            Firebase.saveLastReadMessageId(Firebase.user().uid, this.state.id, mid);
        }

        this.props.navigation.navigate("chat");
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
                            this.moveToChat();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>


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
                                fontFamily: "SFProText-Semibold",
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
                        onPress={() => this.setState({ showAlert: true })}
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
                        placeholder={'Write a message'}
                        placeholderTextColor={Theme.color.placeholder}
                        user={this.user}
                        onSend={async (messages) => {
                            await this.sendMessage(messages[0]);
                            // await this.saveUnreadChatRoomId();
                        }}
                        onPressAvatar={async () => await this.openAvatar()}

                        textInputProps={{
                            /*
                            onLayout: (event) => {
                                const layout = event.nativeEvent.layout;
                                this.textInputHeight = layout.height;
                            },
                            */
                            style: Platform.OS === 'android' ? styles.androidTextInput : styles.iosTextInput,
                            selectionColor: Theme.color.selection,
                            keyboardAppearance: 'dark',
                            underlineColorAndroid: "transparent",
                            autoCorrect: false,

                            onFocus: () => {
                                this.setState({ onKeyboard: true });
                            },
                            onBlur: () => {
                                this.setState({ onKeyboard: false });
                            }
                        }}
                        renderSend={this.renderSend}
                        renderInputToolbar={this.renderInputToolbar}

                        listViewProps={{
                            scrollEventThrottle: 400,
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
                    // ToDo: apply animation
                    this.state.renderPost && showPost &&
                    <View style={[styles.post, { top: _postTop }]}>
                        <Text>
                            <Text style={styles.text1}>{'You picked '}</Text>
                            <Text style={styles.name}>{labelName}</Text>
                            <Text style={styles.text1}>{'!'}</Text>
                        </Text>

                        <TouchableOpacity onPress={async () => await this.openPost()}>
                            <SmartImage
                                style={{ width: imageWidth, height: imageWidth, borderRadius: imageWidth / 2, marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }}
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

                <AwesomeAlert
                    show={this.state.showAlert}
                    showProgress={false}
                    title='Leave conversation'
                    message={"Are you sure you don't want to receive new messages from " + labelName + "."}
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="YES"
                    confirmText="NO"
                    confirmButtonColor="#DD6B55"
                    onCancelPressed={async () => { // YES pressed
                        this.setState({ showAlert: false });

                        await Firebase.deleteChatRoom(Firebase.user().uid, item.id);

                        // this.props.screenProps.state.params.onGoBack(index, () => { this.props.navigation.goBack(); });
                        this.props.navigation.navigate("chat", { roomId: item.id });
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
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View>
        );
    } // end of render

    isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
        const threshold = 40;
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

    async sendMessage(message) {
        const item = this.props.navigation.state.params.item;

        // save the message to database & update UI
        await Firebase.sendMessage(this.state.id, message, item);

        // send push notification
        const notificationType = Cons.pushNotification.chat;
        const sender = item.users[0].uid;
        const senderName = item.users[0].name;
        const receiver = item.users[1].uid; // owner
        // const timestamp

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

        const data = {
            message: message.text,
            placeId: item.placeId,
            feedId: item.feedId,
            chatRoomId: this.state.id,
            users: users
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
        const item = this.props.navigation.state.params.item;

        const placeId = item.placeId;
        const feedId = item.feedId;
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        const post = feedDoc.data();
        if (!post) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

        setTimeout(() => {
            this.props.navigation.navigate("post", { post: post, from: 'ChatRoom' });
        }, Cons.buttonTimeoutShort);
    }

    async openAvatar() {
        const item = this.props.navigation.state.params.item;

        if (item.owner === item.users[1].uid) {
            const placeId = item.placeId;
            const feedId = item.feedId;
            const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
            const post = feedDoc.data();
            if (!post) {
                this.refs["toast"].show('The post has been removed by its owner.', 500);
                return;
            }

            setTimeout(() => {
                this.props.navigation.navigate("post", { post: post, from: 'ChatRoom' });
            }, Cons.buttonTimeoutShort);
        } else {
            // ToDo: check validation

            setTimeout(() => {
                this.props.navigation.navigate("user");
            }, Cons.buttonTimeoutShort);
        }
    }

    @autobind
    renderSend(props) {
        return (
            <Send {...props} containerStyle={{ marginBottom: textInputMarginBottom + sendButtonMarginBottom }}>
                <View style={styles.sendButton}>
                    <Ionicons name='ios-send' color={Theme.color.selection} size={28} />

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
        fontFamily: "SFProText-Regular",
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
        fontFamily: "SFProText-Regular",
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
        width: parseInt(Dimensions.get('window').width / 10),
        height: parseInt(Dimensions.get('window').width / 10),
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
        fontFamily: "SFProText-Regular"
    },
    name: {
        color: Theme.color.text2,
        fontSize: 20,
        fontFamily: "SFProText-Semibold"
    },
    text2: {
        color: Theme.color.text2,
        fontSize: 18,
        fontFamily: "SFProText-Regular",
        paddingHorizontal: Theme.spacing.base,
        textAlign: 'center'
    }
});
