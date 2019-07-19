import React from 'react';
import {
    StyleSheet, View, Dimensions, FlatList, TouchableHighlight, Image, TouchableOpacity, BackHandler, ActivityIndicator
} from 'react-native';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import PreloadImage from './PreloadImage';
import { NavigationActions } from 'react-navigation';
import autobind from "autobind-decorator";
import { Text, Theme } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import Toast, { DURATION } from 'react-native-easy-toast';
import Util from "./Util";
import { Cons, Vars } from "./Globals";
// import _ from 'lodash';
import moment from 'moment';
import Dialog from "react-native-dialog";

const DEFAULT_ROOM_COUNT = 8;


export default class ChatMain extends React.Component {
    state = {
        ready: false,

        isLoadingChat: false,
        loadingType: 0, // 0: none, 100: center, 200: down

        chatRoomList: [],

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.allChatRoomsLoaded = false;

        this.deletedChatRoomList = [];

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

        this.props.navigation.setParams({
            scrollToTop: () => {
                // console.log('ChatMain.scrollToTop');
                this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        });

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.setState({ isLoadingChat: true, loadingType: 100 });

        const uid = Firebase.user().uid;

        Firebase.loadChatRoom(DEFAULT_ROOM_COUNT, uid, list => {
            if (list) {
                if (list.length === 0) {
                    this.allChatRoomsLoaded = true;
                } else {
                    // this.allChatRoomsLoaded = false;

                    // Consider: On sending a message
                    // this.setState({ chatRoomList: list });

                    // 여기서 기존 state list를 검색해서 동일한 방이 있으면, 그 방의 상대방 정보 (name, picture)는 건너뛰고 업데이트! 없으면 밑에 subscribe에서 업데이트 된다.
                    // 또, user profile을 검색해서 대화방 상대방의 정보가 있으면, lastLogInTime 업데이트! 없으면 밑에 subscribe에서 업데이트 된다.
                    this.updateList(list);

                    // subscribe profile, post, feed count
                    this.subscribe(list);
                }
            } else {
                this.allChatRoomsLoaded = true;
            }

            this.setState({ ready: true, isLoadingChat: false, loadingType: 0 });
        });
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

    subscribe(list) {
        for (let i = 0; i < list.length; i++) {
            const room = list[i];

            // const owner = room.owner; // owner uid of the post
            const users = room.users;

            // const me = users[0];
            const you = users[1];

            // check if customer or girl
            // if (me.uid === owner) { // I am a girl. Then subscribe customer(you)'s user profile.
            this.subscribeToProfile(you.uid);
            // }

            // if (you.uid === owner) { // I am a customer. Then subscribe girl(post).
            this.subscribeToPost(room.placeId, room.feedId, room.id);
            this.subscribeToPlace(room.placeId);
            // }
        }
    }

    subscribeToProfile(uid) {
        if (this.customerProfileList.has(uid)) return;

        // this will be updated in subscribe
        this.customerProfileList.set(uid, null);

        const instance = Firebase.subscribeToProfile(uid, user => {
            if (user === undefined) {
                this.customerProfileList.delete(uid);
                return;
            }

            this.customerProfileList.set(uid, user);

            // update state
            const name = user.name;
            const picture = user.picture.uri;
            const activating = user.activating;
            const lastLogInTime = user.lastLogInTime;

            let list = [...this.state.chatRoomList];
            for (let i = 0; i < list.length; i++) {
                let room = list[i];
                let opponent = room.users[1];

                if (opponent.uid === uid) {
                    if (room.users[0].uid === room.owner) {
                        let changed = false;
                        if (opponent.name !== name || opponent.picture !== picture) changed = true;

                        opponent.name = name;
                        opponent.picture = picture;
                        opponent.activating = activating;
                        opponent.lastLogInTime = lastLogInTime;

                        room.users[1] = opponent;
                        list[i] = room;

                        // update database
                        // if (changed) Firebase.updateChatRoom(room.users[0].uid, room.users[1].uid, room.id, room.users);
                        if (changed) {
                            let users = [];
                            const user1 = {
                                uid: room.users[0].uid,
                                name: room.users[0].name,
                                picture: room.users[0].picture
                            };

                            const user2 = {
                                uid: room.users[1].uid,
                                name: room.users[1].name,
                                picture: room.users[1].picture
                            };

                            users.push(user1);
                            users.push(user2);

                            Firebase.updateChatRoom(room.users[0].uid, room.users[1].uid, room.id, users);
                        }
                    } else {
                        opponent.activating = activating;
                        opponent.lastLogInTime = lastLogInTime;

                        room.users[1] = opponent;
                        list[i] = room;
                    }
                }
            }

            !this.closed && this.setState({ chatRoomList: list });
        });

        this.customersUnsubscribes.push(instance);
    }

    subscribeToPost(placeId, feedId, roomId) {
        if (this.feedList.has(feedId)) return;

        // this will be updated in subscribe
        this.feedList.set(feedId, null);

        const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) {
                this.feedList.delete(feedId);
                return;
            }

            this.feedList.set(feedId, newFeed);

            // update state
            const name = newFeed.name;
            const picture = newFeed.pictures.one.uri;

            let list = [...this.state.chatRoomList];
            const index = list.findIndex(el => el.id === roomId);
            if (index !== -1) {
                if (list[index].users[1].uid === list[index].owner) {
                    let opponent = list[index].users[1];

                    let changed = false;
                    if (opponent.name !== name || opponent.picture !== picture) changed = true;

                    opponent.name = name;
                    opponent.picture = picture;

                    list[index].users[1] = opponent;

                    !this.closed && this.setState({ chatRoomList: list });

                    // update database
                    if (changed) Firebase.updateChatRoom(list[index].users[0].uid, list[index].users[1].uid, list[index].id, list[index].users);
                }
            }
        });

        this.feedsUnsubscribes.push(fi);
    }

    subscribeToPlace(placeId) {
        if (this.feedCountList.has(placeId)) return;

        // this will be updated in subscribe
        this.feedCountList.set(placeId, -1);

        const ci = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCountList.delete(placeId);
                return;
            }

            this.feedCountList.set(placeId, newPlace.count);
        });

        this.countsUnsubscribes.push(ci);
    }

    getProfile(uid) {
        /*
        let profile = null;
        if (this.customerProfileList.has(uid)) {
            profile = this.customerProfileList.get(uid);
        }

        return profile;
        */

        return this.customerProfileList.get(uid); // null: the user is not subscribed yet, undefined: the user is removed
    }

    getPost(feedId) {
        /*
        let post = null;
        if (this.feedList.has(feedId)) {
            post = this.feedList.get(feedId);
        }

        return post;
        */

        return this.feedList.get(feedId); // null: the post is not subscribed yet, undefined: the post is removed
    }

    getFeedSize(placeId) {
        /*
        let count = 0;
        if (this.feedCountList.has(placeId)) {
            count = this.feedCountList.get(placeId);
        }

        return count;
        */

        return this.feedCountList.get(placeId); // -1: the place is not subscribed yet, undefined: the place is removed
    }

    updateList(list) {
        let newList = list;
        for (let i = 0; i < newList.length; i++) {
            let newRoom = newList[i];

            // find existing room
            const room = this.checkRoomExistence(newRoom.id);
            if (room) {
                // keep opponent's info
                const opponent = room.users[1];
                newRoom.users[1] = opponent;
                newList[i] = newRoom;
            }

            // find user profile
            const user = this.customerProfileList.get(newRoom.users[1].uid);
            if (user) {
                const activating = user.activating;
                const lastLogInTime = user.lastLogInTime;

                newRoom.users[1].activating = activating;
                newRoom.users[1].lastLogInTime = lastLogInTime;

                newList[i] = newRoom;
            }
        }

        this.setState({ chatRoomList: newList });
    }

    checkRoomExistence(id) { // return existing chat room
        let list = [...this.state.chatRoomList];
        const index = list.findIndex(el => el.id === id);
        if (index !== -1) return list[index];

        return null;
    }

    componentWillReceiveProps() {
        const params = this.props.navigation.state.params;
        if (params && params.roomId) {
            const roomId = params.roomId; // room id need to get removed

            console.log('ChatMain.componentWillReceiveProps, roomId', params);

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

    @autobind
    onFocus() {
        console.log('ChatMain.onFocus');

        Vars.focusedScreen = 'ChatMain';

        this.isFocused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.isFocused = false;
    }

    deleted(id) {
        for (let i = 0; i < this.deletedChatRoomList.length; i++) {
            const item = this.deletedChatRoomList[i];
            if (item === id) return true;
        }

        return false;
    }

    findIndex(list, id) {
        for (let i = 0; i < list.length; i++) {
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
        let list = [...this.state.chatRoomList];
        const index = this.findIndex(list, roomId);
        // console.log('index', index);
        if (index !== -1) { // if the item inside of 10 rooms is removed then automatically updated in database, state array and index = -1
            list.splice(index, 1);
            this.setState({ chatRoomList: list });
        }
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ChatMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    render(): React.Node {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        // alignSelf: 'flex-start',
                        marginLeft: 16
                    }}>Messages</Text>
                </View>

                <FlatList
                    ref={(fl) => {
                        this._flatList = fl;
                    }}
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

                    ListFooterComponent={
                        this.state.isLoadingChat && this.state.loadingType === 200 &&
                        <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                        </View>
                    }

                    ListEmptyComponent={
                        // render illustration
                        this.state.ready &&
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
                            <Text style={{
                                marginTop: 100,
                                color: Theme.color.text2,
                                fontSize: 28,
                                lineHeight: 32,
                                fontFamily: "Chewy-Regular"
                            }}>No new messages</Text>

                            <Text style={{
                                marginTop: 10,
                                color: Theme.color.text3,
                                fontSize: 20,
                                lineHeight: 24,
                                fontFamily: "Chewy-Regular"
                            }}>Let's find some hot chicks</Text>

                            <Image
                                style={{
                                    marginTop: 30,
                                    width: Cons.stickerWidth,
                                    height: Cons.stickerHeight,
                                    resizeMode: 'cover'
                                }}
                                source={PreloadImage.chat}
                            />
                        </View>
                    }
                />

                {
                    this.state.isLoadingChat && this.state.loadingType === 100 &&
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
    }

    @autobind
    keyExtractor(item) {
        return item.id;
    }

    @autobind
    renderItem({ item, index }): React.Node {
        const id = item.id;
        const users = item.users;
        const opponent = users[1];
        const timestamp = item.timestamp;
        const time = Util.getTime(timestamp);
        const contents = item.contents; // last message
        let _contents = null;
        if (contents.length > 30) {
            _contents = contents.substr(0, 29) + '...';
        } else {
            _contents = contents;
        }
        const update = this.checkUpdate(item.lastReadMessageId, item.mid);
        // console.log(_contents, 'update', item.id, item.lastReadMessageId, item.mid, update);
        // const viewHeight = Dimensions.get('window').height / 10;
        const viewHeight = (Dimensions.get('window').width - Theme.spacing.tiny * 2 * 2) * 0.24; // (view width - container padding) * 24%
        const avatarHeight = viewHeight;
        // const avatarHeight = viewHeight * 0.8;

        let avatarName = '';
        let avatarColor = 'black';
        let nameFontSize = 28;
        let nameLineHeight = 32;
        if (!opponent.picture) {
            avatarName = Util.getAvatarName(opponent.name);
            avatarColor = Util.getAvatarColor(opponent.uid);

            if (avatarName.length === 1) {
                nameFontSize = 30;
                nameLineHeight = 34;
            } else if (avatarName.length === 2) {
                nameFontSize = 28;
                nameLineHeight = 32;
            } else if (avatarName.length === 3) {
                nameFontSize = 26;
                nameLineHeight = 30;
            }
        }

        let circleColor = '#999999'; // grey
        let logInState = null;
        if (opponent.activating) {
            circleColor = '#1BF118'; // green
            logInState = 'Active now';
        } else {
            if (opponent.lastLogInTime) {
                // console.log(_contents, item.id, opponent.lastLogInTime);
                const now = Date.now();
                const difference = now - opponent.lastLogInTime;
                const minutesDifference = Math.round(difference / 60000);

                if (minutesDifference <= 1) {
                    circleColor = '#FEF720'; // yellow
                    logInState = 'Active 1 minute ago';
                } else if (1 < minutesDifference && minutesDifference < 60) {
                    circleColor = '#FEF720'; // yellow
                    logInState = 'Active ' + minutesDifference + ' minutes ago';
                } else if (60 <= minutesDifference && minutesDifference < 1440) { // 1 day
                    circleColor = '#FEF720'; // yellow
                    logInState = 'Active ' + moment(opponent.lastLogInTime).fromNow();
                } else {
                    circleColor = '#999999'; // grey
                    logInState = 'Active ' + moment(opponent.lastLogInTime).fromNow();
                }
            }
        }

        return (
            <TouchableHighlight
                onPress={() => {
                    let list = [...this.state.chatRoomList];
                    const index = list.findIndex(el => el.id === id);
                    if (index === -1) {
                        // this should never happen
                        this.refs["toast"].show('The room no longer exists.', 500);
                    } else {
                        const chatRoom = list[index];
                        this.moveToChatRoom(chatRoom);
                    }
                }}
                onLongPress={() => {
                    this.openDialog('Leave conversation', "Are you sure you don't want to receive new messages from " + opponent.name + "?", async () => {
                        // 1. database
                        const myUid = users[0].uid;
                        const myName = users[0].name;
                        await Firebase.deleteChatRoom(myUid, myName, opponent.uid, id);

                        // 2. update list
                        const roomId = id; // room id need to get removed
                        const result = this.deleted(roomId);
                        if (result) { // found
                            // means already removed. nothing to do here.
                        } else { // not found
                            // means need to remove here.
                            this.deleteChatRoom(roomId);
                        }
                    });
                }}
            >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.xSmall, paddingVertical: Theme.spacing.small }}>
                    <View style={{ width: '24%', height: viewHeight, justifyContent: 'center', alignItems: 'center' }}>
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
                                    <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                        {avatarName}
                                    </Text>
                                </View>
                        }

                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: circleColor,
                            borderColor: Theme.color.background,
                            borderWidth: Cons.logInDotWidth / 6,
                            borderRadius: Cons.logInDotWidth / 2,
                            width: Cons.logInDotWidth,
                            height: Cons.logInDotWidth
                        }} />

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

                    <View style={{
                        width: '76%', height: viewHeight,
                        // backgroundColor: 'green',
                        justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 10
                    }}>
                        <View style={{ width: '100%', alignItems: 'flex-end', marginTop: -10 }}>
                            <Text style={styles.time}>{time}</Text>
                        </View>

                        <Text style={styles.name}>{opponent.name}</Text>
                        <Text style={styles.contents}>{_contents}</Text>
                        <Text style={styles.logInState}>{logInState}</Text>
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
        let customer = null;

        if (users[0].uid === item.owner) { // customer's uid (if I'm the owner then I need customer's profile.)
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
        if (post === null) {
            // the post is not subscribed yet
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (post === undefined) {
            this.refs["toast"].show('The post no longer exists.', 500, () => {
                const me = users[0];
                const you = users[1];

                // remove the chat room
                Firebase.deleteChatRoom(me.uid, me.name, you.uid, item.id);

                // update state
                this.deleteChatRoom(item.id);
            });

            return;
        }

        // count
        const feedSize = this.getFeedSize(item.placeId);
        if (feedSize === -1) {
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed
            // this should never happen
            return;
        }

        // customer profile
        let customerProfile = null;

        if (customer) {
            const profile = this.getProfile(customer);
            if (profile === null) {
                // the post is not subscribed yet
                this.refs["toast"].show('Please try again.', 500);
                return;
            }

            if (profile === undefined) {
                this.refs["toast"].show('The user no longer exists.', 500, () => {
                    const me = users[0];
                    const you = users[1];

                    // remove the chat room
                    Firebase.deleteChatRoom(me.uid, me.name, you.uid, item.id);

                    // update state
                    this.deleteChatRoom(item.id);
                });

                return;
            }

            customerProfile = profile;
        }

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
        if (!this.isFocused) return;

        if (this.state.isLoadingChat) return;

        if (this.state.chatRoomList.length <= 0) return;

        if (this.allChatRoomsLoaded) return;

        this.setState({ isLoadingChat: true, loadingType: 200 });

        const uid = Firebase.user().uid;

        const timestamp = this.state.chatRoomList[this.state.chatRoomList.length - 1].timestamp;
        const id = this.state.chatRoomList[this.state.chatRoomList.length - 1].id;

        Firebase.loadMoreChatRoom(DEFAULT_ROOM_COUNT, uid, timestamp, id, list => {
            if (list) {
                if (list.length === 0) {
                    this.allChatRoomsLoaded = true;
                } else {
                    // this.allChatRoomsLoaded = false;

                    /*
                    this.setState(prevState => ({
                        chatRoomList: [...prevState.chatRoomList, list]
                    }))
                    */

                    // check duplication
                    const result = this.hasRoom(list);
                    if (result) {
                        this.allChatRoomsLoaded = true;
                    } else {
                        this.addList(list);

                        // subscribe profile, post, feed count
                        this.subscribe(list);
                    }
                }
            } else {
                this.allChatRoomsLoaded = true;
            }

            this.setState({ isLoadingChat: false, loadingType: 0 });
        });
    }

    compare(a, b) {
        if (a.timestamp < b.timestamp)
            return 1;
        if (a.timestamp > b.timestamp)
            return -1;
        return 0;
    }

    hasRoom(list) {
        const array = this.state.chatRoomList;

        for (let i = 0; i < list.length; i++) {
            const item1 = list[i];

            for (let j = 0; j < array.length; j++) {
                const item2 = array[j];

                if (item1.timestamp === item2.timestamp) {
                    return true;
                }
            }
        }

        return false;
    }

    addList(list) {
        // update room before put it in the state list
        // let _list = _.clone(list); // ToDo
        let _list = list;
        for (let i = 0; i < _list.length; i++) {
            const room = _list[i];

            const owner = room.owner; // owner uid of the post
            const users = room.users;

            const me = users[0];
            const you = users[1];

            const profile = this.getProfile(you.uid); // opponent's profile
            if (profile) {
                const name = profile.name;
                const picture = profile.picture.uri;

                const activating = profile.activating;
                const lastLogInTime = profile.lastLogInTime;

                if (me.uid === owner) { // This means that I'm a girl. Then update name, picture from user's profile.
                    if (you.name !== name || you.picture !== picture) {
                        // 1. update room
                        _list[i].users[1].name = name;
                        _list[i].users[1].picture = picture;

                        // 2. update database
                        Firebase.updateChatRoom(me.uid, you.uid, room.id, _list[i].users);
                    }

                    _list[i].users[1].activating = activating;
                    _list[i].users[1].lastLogInTime = lastLogInTime;
                } else { // This means that I'm a normal user. then update only lastLogInTime.
                    _list[i].users[1].activating = activating;
                    _list[i].users[1].lastLogInTime = lastLogInTime;
                }
            }
        }

        // update state
        let newList = [...this.state.chatRoomList];
        for (let i = 0; i < _list.length; i++) {
            newList.push(_list[i]);
        }
        newList.sort(this.compare);

        this.setState({ chatRoomList: newList });
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
        // paddingBottom: 8,
        paddingBottom: 14,
        // flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.tiny,
        paddingRight: Theme.spacing.tiny
    },
    /*
    time: {
        position: 'absolute',
        top: (Theme.spacing.small / 3) * -1, right: Theme.spacing.xSmall,
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Regular"
    },
    */
    time: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light"
    },
    name: {
        color: Theme.color.text2,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    contents: {
        marginTop: 8,
        marginBottom: 2,
        color: Theme.color.text3,
        fontSize: 18,
        fontFamily: "Roboto-Regular"
    },
    logInState: {
        // paddingBottom: 2,
        color: Theme.color.text4,
        fontSize: 10,
        fontFamily: "Roboto-Light"
    }
});
