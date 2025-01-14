import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Image,
    Dimensions, FlatList, ActivityIndicator, Platform
} from "react-native";
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import PreloadImage from './PreloadImage';
import Util from './Util';

const DEFAULT_FEED_COUNT = 10;

const profilePictureWidth = 64;


export default class CheckLikes extends React.Component {
    state = {
        isLoadingUsers: false,
        users: [],
        totalUserCount: 0
    };

    constructor(props) {
        super(props);

        this.lastLoadedUserIndex = -1;

        this.customerProfileList = new Map();

        this.customersUnsubscribes = [];
    }

    componentDidMount() {
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.getUsers();
    }

    componentWillUnmount() {
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        for (let i = 0; i < this.customersUnsubscribes.length; i++) {
            const instance = this.customersUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'CheckLikes.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'CheckLikes';

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        marginLeft: 40 + 16
                    }}>Liked By
                        {
                            this.state.totalUserCount > 0 &&
                            <Text style={{
                                color: Theme.color.text4,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                            }}> {this.state.totalUserCount}</Text>
                        }
                    </Text>

                    {
                        /*
                        this.state.totalUserCount > 0 &&
                        <View style={{ paddingBottom: 8 }}>
                            <Text style={styles.title}>Liked by {this.state.totalUserCount > 1 ? this.state.totalUserCount + ' people' : this.state.totalUserCount + ' person'}</Text>
                        </View>
                        */
                    }
                </View>

                <FlatList
                    ref={(fl) => this._flatList = fl}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}

                    /*
                    ListHeaderComponent={
                        this.state.totalUserCount > 0 &&
                        <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                            <Text style={styles.title}>Liked by {this.state.totalUserCount > 1 ? this.state.totalUserCount + ' people' : this.state.totalUserCount + ' person'}</Text>
                            <View style={{ borderBottomColor: Theme.color.title, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.xSmall, marginBottom: Theme.spacing.xSmall }} />
                        </View>
                    }
                    */

                    data={this.state.users}
                    keyExtractor={item => item.uid}
                    renderItem={({ item, index }) => {
                        const name = item.name;
                        const place = item.place ? item.place : 'Not specified';
                        const placeColor = item.place ? Theme.color.text2 : Theme.color.text4;
                        const placeFont = item.place ? "Roboto-Regular" : "Roboto-Italic";
                        const picture = item.picture;
                        const avatarName = Util.getAvatarName(name);
                        const avatarColor = Util.getAvatarColor(item.uid);

                        let nameFontSize = 26;
                        let nameLineHeight = 30;

                        if (avatarName.length === 1) {
                            nameFontSize = 28;
                            nameLineHeight = 32;
                        } else if (avatarName.length === 2) {
                            nameFontSize = 26;
                            nameLineHeight = 30;
                        } else if (avatarName.length === 3) {
                            nameFontSize = 24;
                            nameLineHeight = 28;
                        }

                        return (
                            <View style={{ paddingHorizontal: Theme.spacing.small }}>
                                <View style={{ marginTop: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                                    {
                                        picture ?
                                            <SmartImage
                                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                                showSpinner={false}
                                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                uri={picture}
                                            />
                                            :
                                            <View
                                                style={{
                                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                                    {avatarName}
                                                </Text>
                                            </View>
                                    }
                                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 16 }}>
                                        <Text style={{ color: Theme.color.text2, fontSize: 15, fontFamily: "Roboto-Regular" }}>
                                            {name}
                                        </Text>
                                        <Text style={{
                                            marginTop: 6,
                                            color: placeColor, fontSize: 15, fontFamily: placeFont
                                        }}>
                                            {place}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }}

                    onScroll={({ nativeEvent }) => {
                        if (!this.focused) return;

                        if (this.isCloseToBottom(nativeEvent)) {
                            this.getUsers();
                        }
                    }}
                    // onRefresh={this.handleRefresh}
                    // refreshing={this.state.refreshing}

                    ListEmptyComponent={
                        // render illustration
                        // !this.state.isLoadingFeeds &&
                        this.state.totalUserCount === 0 &&
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                color: Theme.color.text2,
                                fontSize: 28,
                                lineHeight: 32,
                                fontFamily: "Chewy-Regular"
                            }}>{Platform.OS === 'android' ? 'No likes yet' : 'No one has checked on yet'}</Text>

                            <Text style={{
                                marginTop: 10,
                                color: Theme.color.text3,
                                fontSize: 20,
                                lineHeight: 24,
                                fontFamily: "Chewy-Regular"
                            }}>Just give it some time</Text>

                            <Image
                                style={{
                                    marginTop: 30,
                                    width: Cons.stickerWidth,
                                    height: Cons.stickerHeight,
                                    resizeMode: 'cover'
                                }}
                                source={PreloadImage.likes}
                            />
                        </View>
                    }
                />

                {
                    this.state.isLoadingUsers &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
                }
            </View>
        );
    }

    getUsers() {
        if (this.state.isLoadingUsers) return;

        const likes = this.props.navigation.state.params.likes;
        const length = likes.length;

        this.setState({ totalUserCount: length });

        if (length === 0) {
            this.setState({ users: [] });
            return;
        }

        // all loaded
        if (this.lastLoadedUserIndex === 0) return;

        this.setState({ isLoadingUsers: true });

        console.log('jdub', 'CheckLikes', 'loading feeds ...');

        // let newUsers = [];

        let startIndex = 0;
        if (this.lastLoadedUserIndex === -1) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedUserIndex - 1;
        }

        let count = 0;

        for (let i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const uid = likes[i];
            this.subscribeToProfile(uid);

            this.lastLoadedUserIndex = i;

            count++;
        }

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingUsers: false });
        }, 1000); // 250

        console.log('jdub', 'CheckLikes', 'loading feeds done!');
    }

    subscribeToProfile(uid) {
        if (this.customerProfileList.has(uid)) return;

        // this will be updated in subscribe
        this.customerProfileList.set(uid, null);

        const instance = Firebase.subscribeToProfile(uid, user => {
            if (user === null) return; // error

            if (user === undefined) {
                this.customerProfileList.delete(uid);
                return;
            }

            this.customerProfileList.set(uid, user);

            // update state
            const name = user.name;
            const place = user.place;
            const picture = user.picture.uri;

            let users = [...this.state.users];
            const index = users.findIndex(el => el.uid === uid);
            if (index === -1) {
                // add
                const user = {
                    uid,
                    name,
                    place,
                    picture
                };

                users.push(user);
            } else {
                // update
                let user = users[index];
                user.name = name;
                user.place = place;
                user.picture = picture;

                users[index] = user;
            }

            !this.closed && this.setState({ users });
        });

        this.customersUnsubscribes.push(instance);
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
        // alignItems: 'center',
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    pictureContainer: {
        width: (Dimensions.get('window').width - 2 * 6) / 3,
        height: (Dimensions.get('window').width - 2 * 6) / 3,
        marginVertical: 2,
        marginHorizontal: 2,
        borderRadius: 2
    },
    picture: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    },
    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    }
});
