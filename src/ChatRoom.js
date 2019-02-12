import React from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard, BackHandler, Platform, SafeAreaView
} from 'react-native';
import { Theme } from "./rnff/src/components";
import { GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
// import KeyboardSpacer from 'react-native-keyboard-spacer';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeAlert from 'react-native-awesome-alerts';
import autobind from "autobind-decorator";
import SmartImage from "./rnff/src/components/SmartImage";
import { Globals } from "./Globals";
import { sendPushNotification } from './PushNotifications';

const chatViewHeight = Dimensions.get('window').height - Globals.searchBarHeight;
const textInputPaddingTop = parseInt(Dimensions.get('window').height / 26);
const textInputPaddingLeft = parseInt(Dimensions.get('window').width / 20);
const textInputPaddingRight = parseInt(Dimensions.get('window').width / 20);
const textInputMarginBottom = (Platform.OS === 'ios') ? 20 : 12;
const sendButtonMarginBottom = parseInt(Dimensions.get('window').height / 40);
const inputToolbarHeight = parseInt(Dimensions.get('window').height / 10);

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;
const avatarHeight = Globals.searchBarHeight * 0.5;


export default class ChatRoom extends React.Component {
    state = {
        name: '',
        id: '',
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
        console.log('ChatRoom::componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const item = this.props.navigation.state.params.item;
        this.setState({ name: item.users[1].name, id: item.id });

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

            !this.isClosed && this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, message)
            }));
        });

        setTimeout(() => {
            !this.isClosed && this.setState({ renderPost: true });
        }, 500);
    }

    componentWillUnmount() {
        console.log('ChatRoom::componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        const item = this.props.navigation.state.params.item;
        Firebase.chatOff(item.id);

        this.isClosed = true;
    }

    @autobind
    handleHardwareBackPress() {
        // this.goBack(); // works best when the goBack is async
        this.props.navigation.navigate("chat");

        return true;
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.state.onKeyboard) this.setState({ onKeyboard: true });
    }

    @autobind
    _keyboardDidHide(e) {
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

        const top1 = (Dimensions.get('window').height - postHeight) / 2;
        const top2 = Globals.searchBarHeight;
        const postTop = this.state.onKeyboard ? top2 : top1;

        const item = this.props.navigation.state.params.item;
        // const index = this.props.navigation.state.params.index;

        // const imageUri = item.users[1].picture;

        let imageUri = null;

        const users = item.users;
        for (var i = 0; i < users.length; i++) { // find the owner of this post
            const user = users[i];

            if (item.owner === user.uid) {
                imageUri = user.picture;

                break;
            }
        }

        /*
        const imageWidth1 = postHeight * 0.7;
        const imageWidth2 = postHeight * 0.5;
        const imageWidth = this.state.onKeyboard ? imageWidth2 : imageWidth1;
        */
        // const imageWidth = postHeight * 0.7;

        const bigImageWidth = postHeight * 0.7;

        let small = postHeight * 0.7;
        if (Dimensions.get('window').height <= 640) small = postHeight * 0.56;

        const smallImageWidth = small;

        const imageWidth = this.state.onKeyboard ? smallImageWidth : bigImageWidth;

        const name = item.users[1].name;
        // const text2 = 'Send a message before your battery dies.';


        return (
            <View style={styles.container}>
                <View style={styles.searchBar}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            this.props.navigation.navigate("chat");
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={async () => await this.openPost()}>
                        <SmartImage
                            style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2, marginBottom: 4 }}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={imageUri}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={async () => await this.openPost()}>
                        <Text
                            style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: 18,
                                fontFamily: "SFProText-Semibold",
                                // alignSelf: 'center',
                                marginLeft: 10,
                                paddingBottom: 4
                            }}
                        >{this.state.name}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.setState({ showAlert: true })}
                    >
                        <Ionicons name='md-trash' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={Platform.OS === 'android' ? styles.androidView : styles.iosView} >
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
                        onSend={async (messages) => await this.sendMessage(messages[0])}
                        onPressAvatar={async () => await this.openAvatar()}

                        textInputProps={{
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

                                    if (!this.onLoading) {
                                        this.onLoading = true;

                                        this.loadMore();
                                    }
                                }
                            }

                            /*
                            onEndReached: this.onEndReached,
                            onEndReachedThreshold: 100
                            // onMomentumScrollBegin: this.onMomentumScrollBegin
                            */
                        }}
                    />
                    {/*
                        <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : null} keyboardVerticalOffset={80} />
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
                    <View style={{ width: '100%', height: Dimensions.get('window').height / 20, backgroundColor: 'red' }} />
                    */
                }

                {
                    // ToDo: apply animation
                    this.state.renderPost && showPost &&
                    <View style={[styles.post, { top: postTop }]}>
                        <Text>
                            <Text style={styles.text1}>{'You picked '}</Text>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.text1}>{'!'}</Text>
                        </Text>

                        <TouchableOpacity onPress={async () => await this.openPost()}>
                            <SmartImage
                                showSpinner={false}
                                style={{ width: imageWidth, height: imageWidth, borderRadius: imageWidth / 2, marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={imageUri}
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
                    title={"Want to leave " + name + "?"}
                    // message="I have a message for you!"
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

                        await Firebase.deleteChatRoom(Firebase.user().uid, item.id);

                        // this.props.screenProps.state.params.onGoBack(index, () => { this.props.navigation.goBack(); });
                        this.props.navigation.navigate("chat", { roomId: item.id });
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
            </View>
        );
    } // end of render

    isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
        const threshold = 40;
        return contentSize.height - layoutMeasurement.height - threshold <= contentOffset.y;
    }

    loadMore() {
        console.log('ChatRoom::loadMore()');

        const lastMessage = this.state.messages[this.state.messages.length - 1];
        const time = lastMessage.createdAt;
        const date = new Date(time);
        const timestamp = date.getTime();
        const id = lastMessage._id;

        Firebase.loadMoreMessage(this.state.id, timestamp, id, message => {
            if (message) {
                console.log('message list', message);

                !this.isClosed && this.setState(previousState => ({
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
        const notificationType = Globals.pushNotification.chat;
        const sender = item.users[0].uid;
        const receiver = item.users[1].uid; // owner(boss)'s uid
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

        sendPushNotification(sender, receiver, notificationType, data);
    }

    async openPost() {
        const item = this.props.navigation.state.params.item;

        const placeId = item.placeId;
        const feedId = item.feedId;
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        const post = feedDoc.data();

        // console.log('post', post);

        this.props.navigation.navigate("post", { post: post });
    }

    async openAvatar() {
        const item = this.props.navigation.state.params.item;

        if (item.owner === item.users[1].uid) {
            // --
            const placeId = item.placeId;
            const feedId = item.feedId;
            const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
            const post = feedDoc.data();

            this.props.navigation.navigate("post", { post: post });
            // --
        } else {
            this.props.navigation.navigate("user");
        }
    }

    @autobind
    renderSend(props) {
        return (
            <Send {...props} containerStyle={{ marginBottom: textInputMarginBottom + sendButtonMarginBottom }} >
                <View style={styles.sendButton} >
                    <Ionicons name='ios-send' color={Theme.color.selection} size={28} />

                    {/*
                    <Image source={require('../../assets/send.png')} resizeMode={'center'} />
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
        height: Globals.searchBarHeight,
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
        marginBottom: textInputMarginBottom,

        paddingLeft: textInputPaddingLeft,
        paddingRight: textInputPaddingRight,

        paddingTop: textInputPaddingTop
    },
    sendButton: {
        backgroundColor: Theme.color.background,
        // backgroundColor: 'green',
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
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    text1: {
        color: Theme.color.text1,
        fontSize: 20,
        fontFamily: "SFProText-Regular"
    },
    name: {
        color: Theme.color.text1,
        fontSize: 20,
        fontFamily: "SFProText-Semibold"
    },
    text2: {
        color: Theme.color.text1,
        fontSize: 18,
        fontFamily: "SFProText-Regular",
        paddingHorizontal: Theme.spacing.base,
        textAlign: 'center'
    }
});
