import React from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator,
    Dimensions, FlatList, TouchableHighlight
} from 'react-native';
import autobind from "autobind-decorator";
import { Theme, RefreshIndicator, FirstPost } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { Constants } from "expo";
import Firebase from './Firebase';
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';
import moment from "moment";


export default class ChatMain extends React.Component {
    state = {
        name: '',

        renderChat: false,
        isLoadingChat: false,


        chatRoomList: []
    }

    componentDidMount() {
        console.log('ChatMain::componentDidMount');

        // load chat room list
        Firebase.loadChatRoom(list => {
            console.log('list', list);

            this.setState({ chatRoomList: list });

            this.allChatRoomsLoaded = false;
        });

        setTimeout(() => {
            !this.isClosed && this.setState({ renderChat: true });
        }, 0);
    }

    @autobind
    onAddToChatFinished(result) {
        console.log('onAddToChatFinished', result);

        if (!result) {
            this.allChatsLoaded = true; // don't call again!
        }

        !this.isClosed && this.setState({ isLoadingChat: false });
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    moveToRoom() {
        this.props.navigation.navigate('room', { name: this.state.name }); // ToDo: name
    }

    render(): React.Node {
        const { navigation } = this.props;

        // const loading = reviews === undefined;

        return (
            /*
            <View style={styles.container}>
                <Text style={styles.title}>Enter your name:</Text>
                <TextInput
                    onChangeText={this.onChangeText}
                    style={styles.nameInput}
                    placeHolder="John Cena"
                    value={this.state.name}
                />
                <TouchableOpacity onPress={this.onPress}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
            */
            <View style={styles.flex}>
                <View style={styles.searchBarStyle}>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 50,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            const user1 = {
                                // name: 'me',
                                name: Firebase.user().name ? Firebase.user().name : 'name',
                                uid: Firebase.uid(),
                                // picture: 'uri' // thumbnail image uri
                                picture: Firebase.user().photoUrl ? Firebase.user().photoUrl : 'uri',
                            };

                            const user2 = { // ToDo: get uid, name, picture from Post
                                name: 'name',
                                uid: 'uid',
                                // picture: 'uri' // thumbnail image uri
                                picture: 'http://dn.joongdo.co.kr/mnt/images/file/2018y/09m/22d/20180922001540074_1.jpg'
                            };

                            let users = [];
                            users.push(user1);
                            users.push(user2);

                            Firebase.createChatRoom(users);
                        }}
                    >
                        <Ionicons name='ios-checkbox-outline' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 100,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            // test sendMessage

                            const id = '292f38d5-e82c-c788-bbb3-4e44f675c17a';
                            const text = 'hi';
                            const user = {
                                name: 'name',
                                uid: Firebase.uid(),
                                avatar: 'https://cdn.clien.net/web/api/file/F01/7312159/186817e6270a98.jpg' // ToDo: get it from Post
                            };

                            Firebase.send(id, user, text);
                        }}
                    >
                        <Ionicons name='ios-chatbubbles' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 150,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            // go to chat room
                            this.moveToRoom();
                        }}
                    >
                        <Ionicons name='ios-call' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                </View>

                {
                    !this.state.renderChat ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            color='grey'
                        />
                        :
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            data={this.state.chatRoomList}
                            // data={this.state.chatRoomList.reverse()}
                            keyExtractor={this.keyExtractor}
                            renderItem={this.renderItem}
                            onEndReachedThreshold={0.5}
                            onEndReached={this.loadMore}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator
                            /*
                                                        ListEmptyComponent={(
                                                            <View style={{ paddingHorizontal: Theme.spacing.small }}>
                                                                {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                                                            </View>
                                                        )}
                            */
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

                            ItemSeparatorComponent={this.itemSeparatorComponent}
                        />

                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View >
        );
    }

    /*
    onChangeText = name => this.setState({ name });

    onPress = () => {
        this.props.navigation.navigate('room', { name: this.state.name });
    }
    */

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
        const timestamp = item.timestamp; // 3:01 PM 11:33 AM Yesterday 00 days ago
        const contents = item.contents; // last message

        const viewHeight = Dimensions.get('window').height / 12;

        const avatarHeight = viewHeight;

        return (
            <TouchableHighlight onPress={() => this.props.navigation.navigate('room', { item: item, index: index })}>
                <View style={{ flexDirection: 'row', flex: 1, paddingTop: Theme.spacing.small, paddingBottom: Theme.spacing.small }}>
                    <View style={{
                        width: '20%', height: viewHeight,
                        // backgroundColor: '#00BCD4',
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
                        width: '50%', height: viewHeight,
                        // backgroundColor: 'yellow',
                        justifyContent: 'center', alignItems: 'flex-start'
                    }} >
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.contents}>{contents}</Text>
                    </View>

                    <View style={{
                        width: '30%', height: viewHeight,
                        // backgroundColor: '#4CAF50',
                        justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: Theme.spacing.xSmall
                    }} >
                        <Text style={styles.time}>{moment(timestamp).fromNow()}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    @autobind
    loadMore() {
        console.log('ChatMain::loadMore');

        if (this.state.chatRoomList.length <= 0) return;

        if (this.allChatRoomsLoaded) return;

        // if (this.state.isLoading) return;

        // this.setState({ isLoading: true });

        const timestamp = this.state.chatRoomList[this.state.chatRoomList.length - 1].timestamp;
        const id = this.state.chatRoomList[this.state.chatRoomList.length - 1].id;

        Firebase.loadMoreChatRoom(timestamp, id, list => {
            console.log('loadMoreChatRoom', list);

            if (list.length === 0) {
                this.allChatRoomsLoaded = true;
            } else {
                /*
                this.setState(prevState => ({
                    chatRoomList: [...prevState.chatRoomList, list]
                }))
                */

                // this.setState({ chatRoomList: this.state.chatRoomList.concat(list) });

                // ------------------------------

                /*
                let newList = this.state.chatRoomList;

                for (var key in list) {
                    if (key === 'length' || !list.hasOwnProperty(key)) continue;

                    var value = list[key];

                    newList[key] = value;
                }

                this.setState({ newList });
                */


                let newList = [...this.state.chatRoomList]; // create the copy of state array
                for (var i = 0; i < list.length; i++) {
                    newList.push(list[i]);
                }
                newList.sort(this.compare);

                // console.log('newList', newList);


                this.setState({ chatRoomList: newList });
            }
        });
    }

    compare(a, b) {
        if (a.timestamp < b.timestamp)
            return 1;
        if (a.timestamp > b.timestamp)
            return -1;
        return 0;
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%' }} />
        );
    }
}

const offset = 24;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center'
    },
    nameInput: { // 3. <- Add a style for the input
        height: offset * 2,
        margin: offset,
        paddingHorizontal: offset,
        borderColor: '#111111',
        borderWidth: 1,
    },
    title: { // 4.
        marginTop: offset,
        marginLeft: offset,
        fontSize: offset,
    },
    buttonText: { // 5.
        marginLeft: offset,
        fontSize: offset,
    },



    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: 'red'
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
        fontSize: 16,
        fontFamily: "SFProText-Semibold"
    },
    contents: {
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "SFProText-Light"
    },
    time: {
        color: 'grey',
        fontSize: 12,
        fontFamily: "SFProText-Light"
    },




    // test
    reviewText: {
        color: 'silver',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "SFProText-Regular"
    },





});
