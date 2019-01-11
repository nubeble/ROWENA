import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Constants } from "expo";
import { Theme } from "./rnff/src/components";
import { GiftedChat } from 'react-native-gifted-chat';
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeAlert from 'react-native-awesome-alerts';


export default class ChatRoom extends React.Component {
    /*
    static navigationOptions = ({ navigation }) => ({
        title: (navigation.state.params || {}).name || 'Chat!',
    });
    */

    state = {
        name: '',
        id: '',
        messages: [],
        showAlert: false
    };

    constructor(props) {
        super(props);

        this.onLoading = undefined;
    }

    componentDidMount() {
        console.log('ChatRoom::componentDidMount');

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

        const item = this.props.navigation.state.params.item;

        Firebase.chatOff(item.id);

        this.isClosed = true;
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
        return (
            /*
            <View style={styles.container}>
            </View>
            */

            <View style={styles.container}>
                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
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
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center'
                        }}
                    >{this.state.name}</Text>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
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
                    onSend={async (messages) => await Firebase.sendMessage(this.state.id, messages, Firebase.uid())}
                    user={this.user}
                    listViewProps={{
                        scrollEventThrottle: 400,
                        onScroll: ({ nativeEvent }) => {
                            // console.log('nativeEvent', nativeEvent);
                            if (this.isCloseToTop(nativeEvent)) {
                                console.log('close to top');

                                if (!this.onLoading) {
                                    this.onLoading = true;

                                    // this.setState({ refreshing: true }); // ToDo: indicator

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
        backgroundColor: Theme.color.background,
        // alignItems: 'center',
        // justifyContent: 'center',
    },
    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,

        flexDirection: 'column',
        justifyContent: 'flex-end',
        // alignItems: 'center'
    },
});
