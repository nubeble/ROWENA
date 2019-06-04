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

DEFAULT_ROOM_COUNT = 6;

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

        this.feedList = new Map();
        this.feedCountList = new Map();
        this.customerProfileList = new Map(); // if I am a customer, then use feed for the opponent.

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
        this.customersUnsubscribes = [];
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
                // Consider: 여기서 기존 state list를 검색해서 동일한 방이 있으면, 그 방의 상대방 정보 (name, picture)는 건너뛰고 업데이트!
                // this.setState({ chatRoomList: list });
                this.updateList(list);

                this.allChatRoomsLoaded = false;

                for (let i = 0; i < list.length; i++) {
                    const room = list[i];

                    const owner = room.owner; // owner uid of the post
                    const users = room.users;

                    const me = users[0];
                    const you = users[1];

                    // customer or girl
                    if (me.uid === owner) { // I am a girl. Then subscribe customer(you)'s user profile.
                        this.subscribeToProfile(you.uid, room.id);
                    }

                    // if (you.uid === owner) { // I am a customer. Then subscribe girl(post).
                    this.subscribeToPost(room.placeId, room.feedId, room.id);
                    this.subscribeToPlace(room.placeId);
                    // }
                }
            }

            this.setState({ isLoadingChat: false });
        });

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderChat: true });
        }, 0);
        */
    }

    componentWillUnmount() {
        console.log('ChatMain.componentWillUnmount');

        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        for (let i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (let i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        for (let i = 0; i < this.customersUnsubscribes.length; i++) {
            const instance = this.customersUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    subscribeToPost(placeId, feedId, roomId) {
        if (this.feedList.has(feedId)) return;

        const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) {
                this.feedList.delete(feedId);
                return;
            }

            this.feedList.set(feedId, newFeed);

            // update chatRoomList
            const name = newFeed.name;
            const picture = newFeed.pictures.one.uri;

            let list = [...this.state.chatRoomList];
            const index = list.findIndex(el => el.id === roomId);
            if (index !== -1) {
                if (list[index].users[1].uid === list[index].owner) {
                    let user = list[index].users[1];
                    user.name = name;
                    user.picture = picture;
                    list[index].users[1] = user;

                    !this.closed && this.setState({ chatRoomList: list });
                }
            }
        });

        this.feedsUnsubscribes.push(fi);
    }

    subscribeToPlace(placeId) { // subscribe place count
        if (this.feedCountList.has(placeId)) return;

        const ci = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCountList.delete(placeId);
                return;
            }

            this.feedCountList.set(placeId, newPlace.count);
        });

        this.countsUnsubscribes.push(ci);
    }

    subscribeToProfile(uid, roomId) {
        if (this.customerProfileList.has(uid)) return;

        const instance = Firebase.subscribeToProfile(uid, user => {
            if (user === undefined) {
                this.customerProfileList.delete(uid);
                return;
            }

            this.customerProfileList.set(uid, user);

            // update chatRoomList
            const name = user.name;
            const picture = user.picture.uri;

            /*
            let list = [...this.state.chatRoomList];
            const index = list.findIndex(el => el.id === roomId);
            if (index !== -1) {
                if (list[index].users[0].uid === list[index].owner) {
                    let user = list[index].users[1];
                    user.name = name;
                    user.picture = picture;
                    list[index].users[1] = user;

                    !this.closed && this.setState({ chatRoomList: list });
                }
            }
            */
            let changed = false;
            let list = [...this.state.chatRoomList];
            for (let i = 0; i < list.length; i++) {
                let room = list[i];
                if (room.users[0].uid === room.owner && room.users[1].uid === uid) {
                    let opponent = room.users[1];
                    opponent.name = name;
                    opponent.picture = picture;
                    room.users[1] = opponent;
                    list[i] = room;

                    changed = true;
                }
            }

            if (changed) !this.closed && this.setState({ chatRoomList: list });
        });

        this.customersUnsubscribes.push(instance);
    }

    getPost(feedId) {
        let post = null;
        if (this.feedList.has(feedId)) {
            post = this.feedList.get(feedId);
        }

        return post;
    }

    getFeedSize(placeId) {
        let count = 0;
        if (this.feedCountList.has(placeId)) {
            count = this.feedCountList.get(placeId);
        }

        return count;
    }

    getCustomerProfile(uid) {
        let profile = null;
        if (this.customerProfileList.has(uid)) {
            profile = this.customerProfileList.get(uid);
        }

        return profile;
    }

    updateList(_list) {
        let newList = _list;
        for (let i = 0; i < newList.length; i++) {
            let newRoom = newList[i];

            // find existing one
            const room = this.checkExistence(newRoom.id);
            if (room) {
                const opponent = room.users[1];
                newRoom.users[1] = opponent;
                newList[i] = newRoom;
            }
        }

        this.setState({ chatRoomList: newList });
    }

    checkExistence(id) { // return existing chat room
        let list = [...this.state.chatRoomList];
        const index = list.findIndex(el => el.id === id);
        if (index !== -1) return list[index];

        return null;
    }

    @autobind
    onFocus() {
        console.log('ChatMain.onFocus');

        this.isFocused = true;

        Vars.currentScreenName = 'ChatMain';

        const params = this.props.navigation.state.params;
        if (params) {
            const roomId = params.roomId; // room id need to get removed
            // console.log('roomId', roomId);

            const result = this.deleted(roomId);
            if (result) { // found
                // means already removed. nothing to do here.
            } else { // not found
                // means need to remove here.
                this.deleteChatRoom(roomId);

                // move scroll top
                // this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        }
    }

    deleted(id) {
        for (var i = 0; i < this.deletedChatRoomList.length; i++) {
            const item = this.deletedChatRoomList[i];
            if (item === id) return true;
        }

        return false;
    }

    findIndex(list, id) {
        for (var i = 0; i < list.length; i++) {
            const item = list[i];
            console.log('id', item);
            if (item.id === id) return i;
        }

        return -1;
    }

    deleteChatRoom(roomId) {
        // put it on the list
        this.deletedChatRoomList.push(roomId);

        // update state
        var list = [...this.state.chatRoomList];
        const index = this.findIndex(list, roomId);
        // console.log('index', index);
        if (index !== -1) { // if the item inside of 10 rooms is removed then automatically updated in database, state array and index = -1
            list.splice(index, 1);
            this.setState({ chatRoomList: list });
        }
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
        this.isFocused = false;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ChatMain.handleHardwareBackPress');

        this.props.navigation.navigate("intro");

        return true;
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
        const id = item.id;
        const users = item.users;
        const opponent = users[1];
        const timestamp = item.timestamp;
        const time = Util.getTime(timestamp);
        const contents = item.contents; // last message
        const update = this.checkUpdate(item.lastReadMessageId, item.mid);
        // const viewHeight = Dimensions.get('window').height / 10;
        const viewHeight = (Dimensions.get('window').width - Theme.spacing.tiny * 2) * 0.24; // (view width - container padding) * 24%
        const avatarHeight = viewHeight;
        // const avatarHeight = viewHeight * 0.8;

        let avatarName = null;
        let avatarColor = null;
        if (!opponent.picture) {
            avatarName = Util.getAvatarName(opponent.name);
            // avatarColor = this.getAvatarColor(index);
            avatarColor = this.getAvatarColor(id);
        }

        return (
            <TouchableHighlight onPress={() => {
                let list = [...this.state.chatRoomList];
                const itemIndex = list.findIndex(el => el.id === id);
                if (itemIndex !== -1) {
                    const chatRoom = list[itemIndex];
                    this.moveToChatRoom(chatRoom);
                } else {
                    this.refs["toast"].show('The room no longer exists.', 500);
                }
            }}>
                <View style={{ flexDirection: 'row', flex: 1, paddingTop: Theme.spacing.small, paddingBottom: Theme.spacing.small }}>
                    <View style={{
                        width: '24%', height: viewHeight,
                        // backgroundColor: 'green',
                        // justifyContent: 'center', alignItems: 'flex-start', paddingLeft: Theme.spacing.xSmall
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        {
                            opponent.picture ?
                                <SmartImage
                                    style={{ width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2 }}
                                    showSpinner={false}
                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                    uri={opponent.picture}
                                />
                                :
                                <View
                                    style={{
                                        width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2,
                                        alignItems: 'center', justifyContent: 'center', backgroundColor: avatarColor
                                    }}
                                >
                                    <Text style={{ color: 'white', fontSize: 28, lineHeight: 32, fontFamily: "Roboto-Medium" }}>
                                        {avatarName}
                                    </Text>
                                </View>
                        }

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
                        <Text style={styles.name}>{opponent.name}</Text>
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
                        <Text style={styles.name}>{opponent.name}</Text>
                        <Text style={styles.contents}>{contents}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    moveToChatRoom(item) {
        const users = item.users;

        // title
        let titleImageUri = null;
        let titleName = null;
        let customer = null; // customer's uid (if I'm the owner then I need customer's profile.)

        if (users[0].uid === item.owner) {
            titleImageUri = users[0].picture;
            titleName = users[0].name;
            customer = users[1].uid;
        } else { // if (users[1].uid === item.owner) {
            titleImageUri = users[1].picture;
            titleName = users[1].name;
        }

        const title = {
            picture: titleImageUri,
            name: titleName
        };

        // feed
        const post = this.getPost(item.feedId);
        if (!post) {
            this.refs["toast"].show('The post no longer exists.', 500, () => {
                const me = users[0];
                const you = users[1];

                // remove the chat room
                Firebase.deleteChatRoom(me.uid, me.name, you.uid, item.id);

                // update delete chatroom list
                this.deleteChatRoom(item.id);
            });

            return;
        }

        // count
        const feedSize = this.getFeedSize(item.placeId);

        // customer profile
        let customerProfile = null;
        if (customer) customerProfile = this.getCustomerProfile(customer);

        const params = {
            id: item.id,
            placeId: item.placeId,
            feedId: item.feedId,
            users,
            owner: item.owner, // owner uid of the post
            showAvatar: item.contents === '' ? true : false,
            lastReadMessageId: item.lastReadMessageId,
            placeName: item.placeName,
            title,
            post,
            feedSize,
            customerProfile
        };

        this.props.navigation.navigate("chatRoom", { item: params });
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

    getAvatarColor(id) {
        if (!this.avatarColorList) {
            this.avatarColorList = new Map();
        }

        if (this.avatarColorList.has(id)) {
            return this.avatarColorList.get(id);
        } else {
            const color = Util.getDarkColor();
            this.avatarColorList.set(id, color);
            return color;
        }
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
