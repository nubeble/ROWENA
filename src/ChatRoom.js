import React from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard
} from 'react-native';
import { Constants } from "expo";
import { Theme } from "./rnff/src/components";
import { GiftedChat } from 'react-native-gifted-chat';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeAlert from 'react-native-awesome-alerts';
import autobind from "autobind-decorator";
import SmartImage from "./rnff/src/components/SmartImage";
// import PostModal from './PostModal';

const postWidth = Dimensions.get('window').width;
const postHeight = Dimensions.get('window').height / 3;


export default class ChatRoom extends React.Component {
    state = {
        name: '',
        id: '',
        messages: [],
        showAlert: false,
        onKeyboard: false,
        bottomPosition: Dimensions.get('window').height
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
            // name: this.props.navigation.state.params.name, // ToDo
            // uid: Firebase.uid()
            _id: Firebase.uid()
        };
    }

    render() {
        const renderPost = this.state.messages.length > 1 ? false : true;

        const top1 = (Dimensions.get('window').height - postHeight) / 2;
        const top2 = (this.state.bottomPosition - postHeight) / 2;
        const postTop = this.state.onKeyboard ? top2 : top1;

        const item = this.props.navigation.state.params.item;
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

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 18,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center'
                        }}
                    >{this.state.name}</Text>

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

                <GiftedChat
                    messages={this.state.messages}
                    onSend={async (messages) => await Firebase.sendMessages(this.state.id, messages, Firebase.uid())}
                    user={this.user}
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

                {
                    renderPost &&
                    <View style={[styles.post, { top: postTop }]}>
                        <Text>
                            <Text style={styles.text1}>{'You picked '}</Text>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.text1}>{'!'}</Text>
                        </Text>

                        <TouchableOpacity onPress={async () => {
                            const item = this.props.navigation.state.params.item;
                            const placeId = item.placeId;
                            const feedId = item.feedId;
                            const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
                            const post = reviewDoc.data();

                            // console.log('post', post);

                            // if (post !== undefined) this.refs.modal.showModal(post);

                            this.props.navigation.navigate('post', { post: post });
                        }}>
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
                    title="Want to leave your chatroom?"
                    // message="I have a message for you!"
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="No"
                    confirmText="Yes"
                    confirmButtonColor="#DD6B55"
                    onCancelPressed={() => {
                        this.setState({ showAlert: false });
                    }}
                    onConfirmPressed={() => {
                        this.setState({ showAlert: false });
                    }}
                />

                {/*
                <PostModal ref='modal' navigation={this.props.navigation}></PostModal>
                */}
            </View>
        );
    } // end of render

    isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
        const threshold = 40;
        return contentSize.height - layoutMeasurement.height - threshold <= contentOffset.y;
    }

    loadMore() {
        console.log('ChatRoom::loadMore()');

        const timestamp = this.state.messages[this.state.messages.length - 1].timestamp;
        const date = new Date(timestamp);
        const lastMessageTimestamp = date.getTime();
        const lastMessageId = this.state.messages[this.state.messages.length - 1]._id;

        Firebase.loadMoreMessage(this.state.id, lastMessageTimestamp, lastMessageId, message => {
            if (message) {
                console.log('message list', message);

                !this.isClosed && this.setState(previousState => ({
                    messages: GiftedChat.prepend(previousState.messages, message)
                }));

                this.onLoading = false;
            }
        });
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
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    post: {
        width: postWidth,
        height: postHeight,
        // backgroundColor: 'green',
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
