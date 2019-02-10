import React from 'react';
import {
    StyleSheet, Text, View, Dimensions, FlatList, TouchableHighlight, ActivityIndicator
} from 'react-native';
import autobind from "autobind-decorator";
import { Theme } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { Constants } from "expo";
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';
import Util from "./Util";
import AwesomeAlert from 'react-native-awesome-alerts';
import { Globals } from "./Globals";


export default class ChatMain extends React.Component {
    state = {
        name: '',
        renderChat: false,
        isLoadingChat: false,
        chatRoomList: [],
        showAlert: false
    }

    constructor(props) {
        super(props);

        this.deletedChatRoomList = [];
    }

    componentDidMount() {
        console.log('ChatMain::componentDidMount');

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const uid = Firebase.user().uid;

        // load chat room list
        Firebase.loadChatRoom(uid, list => {
            console.log('ChatMain, loadChatRoom, updating list', list);

            this.setState({ chatRoomList: list });

            this.allChatRoomsLoaded = false;
        });

        setTimeout(() => {
            !this.isClosed && this.setState({ renderChat: true });
        }, 0);
    }

    @autobind
    onFocus() {
        console.log('ChatMain::onFocus');
        this.isFocused = true;

        const params = this.props.navigation.state.params;
        if (params) {
            const roomId = params.roomId;
            console.log('roomId', roomId);

            // search it from the list
            const result = this.findChatRoom(roomId);
            if (result) { // found

                // means already removed. doing nothing here.

            } else { // not found
                // means need to remove here.

                // put it on the list
                this.deletedChatRoomList.push(roomId);

                // update state
                var array = [...this.state.chatRoomList];
                const index = this.findIndex(array, roomId);
                console.log('index', index);
                if (index !== -1) { // if the item inside of 10 is removed then automatically updated in database, state array and index = -1
                    array.splice(index, 1);
                    this.setState({ chatRoomList: array });
                }

                // move scroll on top
                this._flatList.scrollToOffset({ animated: true, offset: 0 });
            }
        }
    }

    findChatRoom(id) {
        for (var i = 0; i < this.deletedChatRoomList.length; i++) {
            const item = this.deletedChatRoomList[i];
            if (item === id) return true;
        }

        return false;
    }

    findIndex(array, id) {
        for (var i = 0; i < array.length; i++) {
            const item = array[i];
            console.log('id', item);
            if (item.id === id) return i;
        }

        return -1;
    }

    /*
    onGoBack(index, callback) { // back from deleting
        console.log('index', index);

        var array = [...this.state.chatRoomList];
        array.splice(index, 1);
        this.setState({chatRoomList: array}, () => callback());
    }
    */

    @autobind
    onBlur() {
        console.log('ChatMain::onBlur');
        this.isFocused = false;
    }

    componentWillUnmount() {
        console.log('ChatMain::componentWillUnmount');

        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.isClosed = true;
    }

    render(): React.Node {
        const { navigation } = this.props;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 18,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center'
                        }}
                    >Messages</Text>

                </View>

                {
                    this.state.renderChat &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        data={this.state.chatRoomList}
                        keyExtractor={this.keyExtractor}
                        renderItem={this.renderItem}
                        onEndReachedThreshold={0.5}
                        onEndReached={this.loadMore}

                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator

                        ListFooterComponent={(
                            this.state.isLoadingChat && (
                                <ActivityIndicator
                                    style={styles.bottomIndicator}
                                    animating={this.state.isLoadingChat}
                                    size="small"
                                    color='grey'
                                />
                            )
                        )}

                    // ItemSeparatorComponent={this.itemSeparatorComponent}
                    />

                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
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
                    cancelText="No, cancel"
                    confirmText="Yes, delete it"
                    confirmButtonColor="#DD6B55"
                    onCancelPressed={() => {
                        this.setState({ showAlert: false });
                    }}
                    onConfirmPressed={() => {
                        this.setState({ showAlert: false });
                    }}
                />
            </View >
        );
    }

    @autobind
    keyExtractor(item) {
        return item.id;
    }

    @autobind
    renderItem({ item, index }) {
        // console.log(index, item);

        const id = item.id;

        const users = item.users;
        const user = users[1]; // opponent
        const timestamp = item.timestamp;
        const time = Util.getTime(timestamp);

        const contents = item.contents; // last message

        const viewHeight = Dimensions.get('window').height / 10;

        const avatarHeight = viewHeight;

        return (
            <TouchableHighlight onPress={() => this.props.navigation.navigate('chatRoom', { item: item })}>
                <View style={{ flexDirection: 'row', flex: 1, paddingTop: Theme.spacing.small, paddingBottom: Theme.spacing.small }}>
                    <View style={{
                        width: '24%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'center', alignItems: 'flex-start', paddingLeft: Theme.spacing.xSmall
                    }} >
                        <SmartImage
                            style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2 }}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={user.picture}
                        />
                    </View>

                    <View style={{
                        width: '46%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'center', alignItems: 'flex-start', paddingLeft: Theme.spacing.tiny
                    }} >
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.contents}>{contents}</Text>
                    </View>

                    <View style={{
                        width: '30%', height: viewHeight,
                        // backgroundColor: '#4CAF50',
                        justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: Theme.spacing.xSmall
                    }} >
                        <Text style={styles.time}>{time}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    @autobind
    loadMore() {
        console.log('ChatMain::loadMore', this.isFocused);

        if (!this.isFocused) return;

        if (this.state.chatRoomList.length <= 0) return;

        if (this.allChatRoomsLoaded) return;

        this.setState({ isLoadingChat: true });

        const uid = Firebase.user().uid;

        const timestamp = this.state.chatRoomList[this.state.chatRoomList.length - 1].timestamp;
        const id = this.state.chatRoomList[this.state.chatRoomList.length - 1].id;

        Firebase.loadMoreChatRoom(uid, timestamp, id, list => {
            console.log('loadMoreChatRoom', list);

            if (list.length === 0) {
                this.allChatRoomsLoaded = true;
            } else {
                /*
                this.setState(prevState => ({
                    chatRoomList: [...prevState.chatRoomList, list]
                }))
                */

                // check duplication
                const result = this.hasItem(list);
                if (result) {
                    this.allChatRoomsLoaded = true;
                } else {
                    this.addItem(list);
                }
            }

            this.setState({ isLoadingChat: false });
        });
    }

    compare(a, b) {
        if (a.timestamp < b.timestamp)
            return 1;
        if (a.timestamp > b.timestamp)
            return -1;
        return 0;
    }

    hasItem(list) {
        const array = this.state.chatRoomList;

        for (var i = 0; i < list.length; i++) {
            const item1 = list[i];

            for (var j = 0; j < array.length; j++) {
                const item2 = array[j];

                if (item1.timestamp === item2.timestamp) {
                    return true;
                }
            }
        }

        return false;
    }

    addItem(list) {
        let newList = [...this.state.chatRoomList]; // create the copy of state array
        for (var i = 0; i < list.length; i++) {
            newList.push(list[i]);
        }
        newList.sort(this.compare);

        // console.log('newList', newList);

        this.setState({ chatRoomList: newList });
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%' }} />
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Globals.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingTop: Theme.spacing.small,
        // paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.tiny,
        paddingRight: Theme.spacing.tiny
    },
    name: {
        color: Theme.color.text1,
        fontSize: 17,
        fontFamily: "SFProText-Semibold"
    },
    contents: {
        color: Theme.color.text2,
        fontSize: 15,
        fontFamily: "SFProText-Light"
    },
    time: {
        color: 'grey',
        fontSize: 12,
        fontFamily: "SFProText-Light"
    },
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    },
});
