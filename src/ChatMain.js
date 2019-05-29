import React from 'react';
import {
    StyleSheet, View, Dimensions, FlatList, TouchableHighlight, Image, TouchableOpacity, BackHandler
} from 'react-native';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import PreloadImage from './PreloadImage';
import { NavigationActions } from 'react-navigation';
import autobind from "autobind-decorator";
import { Text, Theme } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { Constants } from "expo";
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';
import Util from "./Util";
import { Cons, Vars } from "./Globals";

DEFAULT_ROOM_COUNT = 10;

// 1:1
const illustHeight = 300;
const illustWidth = 300;


export default class ChatMain extends React.Component {
    state = {
        name: '',
        // renderChat: false,
        isLoadingChat: false,
        chatRoomList: []
    };

    constructor(props) {
        super(props);

        this.deletedChatRoomList = [];
        this.onLoading = false;
    }

    static final() {
        console.log('ChatMain.final');

        const uid = Firebase.user().uid;

        Firebase.stopChatRoom(uid);
    }

    componentDidMount() {
        console.log('ChatMain.componentDidMount');

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.setState({ isLoadingChat: true });

        const uid = Firebase.user().uid;

        // load chat room list
        Firebase.loadChatRoom(uid, list => {
            if (list) {
                console.log('ChatMain, loadChatRoom, updating list', list);

                this.setState({ chatRoomList: list });

                this.allChatRoomsLoaded = false;
            }

            this.setState({ isLoadingChat: false });
        });

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderChat: true });
        }, 0);
        */
    }

    @autobind
    onFocus() {
        console.log('ChatMain.onFocus');

        this.isFocused = true;

        Vars.currentScreenName = 'ChatMain';

        const params = this.props.navigation.state.params;
        if (params) {
            const roomId = params.roomId;
            console.log('roomId', roomId);

            // search it from the list
            const result = this.findChatRoom(roomId);
            if (result) { // found

                // means already removed. nothing to do here.

            } else { // not found
                // means need to remove here.

                // put it on the list
                this.deletedChatRoomList.push(roomId);

                // update state
                var array = [...this.state.chatRoomList];
                const index = this.findIndex(array, roomId);
                console.log('index', index);
                if (index !== -1) { // if the item inside of 10 rooms is removed then automatically updated in database, state array and index = -1
                    array.splice(index, 1);
                    this.setState({ chatRoomList: array });
                }

                // move scroll top
                // this._flatList.scrollToOffset({ offset: 0, animated: true });
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
        // console.log('ChatMain.onBlur');
        this.isFocused = false;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ChatMain.handleHardwareBackPress');

        this.props.navigation.navigate("intro");

        return true;
    }

    componentWillUnmount() {
        console.log('ChatMain.componentWillUnmount');

        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render(): React.Node {
        // const { navigation } = this.props;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: Theme.color.text1,
                            fontSize: 20,
                            fontFamily: "Roboto-Medium",
                            alignSelf: 'flex-start',
                            marginLeft: 16
                        }}
                    >Messages</Text>

                </View>

                {
                    // this.state.renderChat &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        data={this.state.chatRoomList}
                        keyExtractor={this.keyExtractor}
                        renderItem={this.renderItem}
                        // onEndReachedThreshold={0.5}
                        // onEndReached={this.loadMore}
                        onScroll={({ nativeEvent }) => {
                            if (this.isCloseToBottom(nativeEvent)) {
                                this.loadMore();
                            }
                        }}
                        // scrollEventThrottle={1}

                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        /*
                        ListFooterComponent={
                            this.state.isLoadingChat &&
                            <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                                <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                            </View>
                        }
                        */

                        ListEmptyComponent={
                            !this.state.isLoadingChat &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 24,
                                    paddingTop: 4,
                                    fontFamily: "Roboto-Medium"
                                }}>No new messages</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 18,
                                    fontFamily: "Roboto-Medium"
                                }}>Let's find some hot chicks</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTimeout(() => {
                                            // Consider: set scroll position 0

                                            !this.closed && this.props.navigation.navigate("intro");
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                    style={{ marginTop: 20 }}>

                                    <View style={{
                                        width: illustWidth, height: illustHeight,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <Image
                                            style={{
                                                width: illustWidth * 0.6,
                                                height: illustHeight * 0.6,
                                                resizeMode: 'cover'
                                            }}
                                            source={PreloadImage.chat}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View>
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
        const update = this.checkUpdate(item.lastReadMessageId, item.mid);
        // const viewHeight = Dimensions.get('window').height / 10;
        const viewHeight = (Dimensions.get('window').width - Theme.spacing.tiny * 2) * 0.24; // (view width - container padding) * 24%
        const avatarHeight = viewHeight;
        // const avatarHeight = viewHeight * 0.8;

        return (
            <TouchableHighlight onPress={() => this.props.navigation.navigate("chatRoom", { item: item })}>
                <View style={{ flexDirection: 'row', flex: 1, paddingTop: Theme.spacing.small, paddingBottom: Theme.spacing.small }}>
                    <View style={{
                        width: '24%', height: viewHeight,
                        // backgroundColor: 'green',
                        // justifyContent: 'center', alignItems: 'flex-start', paddingLeft: Theme.spacing.xSmall
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <SmartImage
                            style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2 }}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={user.picture}
                        />
                        {
                            update &&
                            <View style={{
                                position: 'absolute',
                                /*
                                top: 0 + viewHeight * 0.08,
                                left: viewHeight - Cons.redDotWidth - viewHeight * 0.08,
                                */
                                top: 0,
                                left: viewHeight,

                                backgroundColor: 'red',
                                borderRadius: Cons.redDotWidth / 2,
                                width: Cons.redDotWidth,
                                height: Cons.redDotWidth
                            }} />
                        }
                    </View>
                    {/*
                    <View style={{
                        width: '46%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 10
                    }}>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.contents}>{contents}</Text>
                    </View>

                    <View style={{
                        width: '30%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: Theme.spacing.xSmall
                    }}>
                        <Text style={styles.time}>{time}</Text>
                    </View>
                    */}
                    <View style={{
                        width: '76%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 10
                    }}>
                        <Text style={styles.time}>{time}</Text>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.contents}>{contents}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    checkUpdate(lastReadMessageId, mid) {
        if (!mid) { // no contents (will never happen)
            return false;
        }

        if (!lastReadMessageId) { // user never read
            return true;
        }

        if (mid === lastReadMessageId) {
            return false;
        }

        return true;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    @autobind
    loadMore() {
        if (this.onLoading) return;

        // console.log('ChatMain.loadMore', this.isFocused);

        if (!this.isFocused) return;

        if (this.state.chatRoomList.length <= 0) return;

        if (this.allChatRoomsLoaded) return;

        this.onLoading = true;

        this.setState({ isLoadingChat: true });

        const uid = Firebase.user().uid;

        const timestamp = this.state.chatRoomList[this.state.chatRoomList.length - 1].timestamp;
        const id = this.state.chatRoomList[this.state.chatRoomList.length - 1].id;

        Firebase.loadMoreChatRoom(DEFAULT_ROOM_COUNT, uid, timestamp, id, list => { // load 10 rooms
            if (list) {
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
            }

            this.onLoading = false;

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
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        paddingBottom: 4,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.small,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.tiny,
        paddingRight: Theme.spacing.tiny
    },
    name: {
        color: Theme.color.text2,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    contents: {
        marginTop: Dimensions.get('window').height / 60,
        color: Theme.color.text3,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        // numberOfLines: 1, ellipsizeMode: 'tail'
    },
    time: {
        /*
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Regular"
        */
        position: 'absolute',
        top: (Theme.spacing.small / 3) * -1, right: Theme.spacing.xSmall,
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Regular"
    }
});
