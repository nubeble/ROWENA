import React from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform
} from 'react-native';
import { Constants } from "expo";
import { Theme } from "./rnff/src/components";
import { GiftedChat, Send } from 'react-native-gifted-chat';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeAlert from 'react-native-awesome-alerts';
import autobind from "autobind-decorator";
import SmartImage from "./rnff/src/components/SmartImage";
import GLOBALS from './Globals';

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;
const avatarHeight = (Constants.statusBarHeight + 8 + 34 + 8) * 0.5; // searchBar height
const sendButtonWidth = Dimensions.get('window').width * 0.8;


export default class ChatRoom extends React.Component {
    state = {
        name: '',
        id: '',
        messages: [],
        showAlert: false,
        onKeyboard: false,
        bottomPosition: Dimensions.get('window').height,
        renderPost: false
    };

    constructor(props) {
        super(props);

        this.onLoading = undefined;
    }

    componentDidMount() {
        console.log('ChatRoom::componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

        const item = this.props.navigation.state.params.item;
        this.setState({ name: item.users[1].name, id: item.id });

        Firebase.chatOn(item.id, message => {
            console.log('on message', message);

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

        const item = this.props.navigation.state.params.item;
        Firebase.chatOff(item.id);

        this.isClosed = true;
    }

    @autobind
    _keyboardDidShow(e) {
        this.setState({
            onKeyboard: true,
            bottomPosition: Dimensions.get('window').height - e.endCoordinates.height
            // bottomPosition: Dimensions.get('window').height - e.endCoordinates.height - (Dimensions.get('window').height * 0.06) // margin bottom
        });
    }

    @autobind
    _keyboardDidHide() {
        this.setState({
            onKeyboard: false,
            bottomPosition: Dimensions.get('window').height
        });
    }

    get user() {
        // Return our name and our UID for GiftedChat to parse
        return {
            name: this.props.navigation.state.params.name,
            _id: Firebase.uid(),
            // avatar
        };
    }

    render() {
        const postAvailable = this.state.messages.length > 1 ? false : true;

        const top1 = (Dimensions.get('window').height - postHeight) / 2;
        const top2 = (this.state.bottomPosition - postHeight) / 2;
        const postTop = this.state.onKeyboard ? top2 : top1;

        const item = this.props.navigation.state.params.item;
        const index = this.props.navigation.state.params.index;
        const imageUri = item.users[1].picture;
        const imageWidth = postHeight * 0.7;
        const name = item.users[1].name;
        const text2 = 'Send a message before your battery dies.';


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
                            this.props.navigation.goBack();
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

                <View style={{ flex: 1 }}>
                    <GiftedChat
                        alwaysShowSend={true}
                        bottomOffset={100} // ToDo: !!
                        // isAnimated={true}

                        messages={this.state.messages}
                        placeholder={'Write a message'}
                        user={this.user}
                        onSend={async (messages) => await Firebase.sendMessages(this.state.id, messages, Firebase.uid())}
                        onPressAvatar={async () => await this.openPost()}
                        

                        textInputProps={{
                            style: {
                                width: '85%',
                                fontSize: 14,
                                fontFamily: "SFProText-Regular",
                                color: "white",

                                backgroundColor: Theme.color.background,
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingLeft: 10,
                                paddingRight: 10
                            },

                            keyboardAppearance: 'dark', // ToDo
                            underlineColorAndroid: "transparent",
                            autoCorrect: false
                        }}
                        renderSend={this.renderSend}

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
                    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : null} keyboardVerticalOffset={80} />
                </View>

                {
                    // ToDo: apply animation
                    this.state.renderPost && postAvailable &&
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

                        await Firebase.deleteChatRoom(Firebase.uid(), item.id);

                        // this.props.screenProps.state.params.onGoBack(index, () => { this.props.navigation.goBack(); });

                        this.props.navigation.navigate('chatMain', { roomId: item.id });
                    }}
                    onConfirmPressed={() => {
                        this.setState({ showAlert: false });
                    }}

                    contentContainerStyle={{ width: '80%', height: GLOBALS.alertHeight, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "space-between" }}
                    titleStyle={{ fontSize: 18, fontFamily: "SFProText-Regular", color: '#FFF' }}
                    cancelButtonStyle={{ width: 100, paddingTop: 10, paddingBottom: 8, backgroundColor: "rgba(255, 0, 0, 0.6)" }}
                    cancelButtonTextStyle={{ textAlign: 'center', fontSize: 16, lineHeight: 16, fontFamily: "SFProText-Regular" }}
                    confirmButtonStyle={{ marginLeft: GLOBALS.buttonMarginLeft, width: 100, paddingTop: 10, paddingBottom: 8, backgroundColor: "rgba(255, 255, 255, 0.6)" }}
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

    async openPost() {
        const item = this.props.navigation.state.params.item;
        const placeId = item.placeId;
        const feedId = item.feedId;
        const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        const post = reviewDoc.data();

        // console.log('post', post);

        this.props.navigation.navigate('post', { post: post });
    }

    renderSend(props) {
        return (
            <Send
                {...props}
            >
                <View style={{ backgroundColor: Theme.color.background,
                    alignItems: 'center', justifyContent: 'center' }}>
                    
                    <Ionicons name='ios-send' color="rgb(62, 165, 255)" size={24} />
                    {/*
                    <Image source={require('../../assets/send.png')} resizeMode={'center'} />
                    */}
                </View>
            </Send>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end'
    },
    post: {
        width: postWidth,
        height: postHeight,
        position: 'absolute',
        justifyContent: 'center',
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
