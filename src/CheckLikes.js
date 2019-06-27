import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Image,
    Dimensions, FlatList, ActivityIndicator, TouchableWithoutFeedback
} from "react-native";
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import Util from './Util';

const DEFAULT_FEED_COUNT = 10;

const profilePictureWidth = 64;

// 1:1
const illustHeight = 340;
const illustWidth = 340;


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
        // this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
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
        console.log('CheckLikes.handleHardwareBackPress');

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
                        const placeColor = item.place ? Theme.color.text2 : Theme.color.text3;
                        const picture = item.picture;
                        const avatarName = Util.getAvatarName(name);
                        const avatarColor = Util.getAvatarColor(item.uid);

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
                                                <Text style={{ color: 'white', fontSize: 24, lineHeight: 28, fontFamily: "Roboto-Medium" }}>
                                                    {avatarName}
                                                </Text>
                                            </View>
                                    }
                                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 16 }}>
                                        <Text style={{ color: Theme.color.text2, fontSize: 15, fontFamily: "Roboto-Regular" }}>
                                            {name}</Text>
                                        <Text style={{
                                            marginTop: 6,
                                            color: placeColor, fontSize: 15, fontFamily: "Roboto-Regular"
                                        }}>{place}</Text>
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
                        // ToDo: render design
                        // !this.state.isLoadingFeeds &&

                        this.state.totalUserCount === 0 &&
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                color: Theme.color.text2,
                                fontSize: 24,
                                paddingTop: 4,
                                fontFamily: "Chewy-Regular"
                            }}>No likes from customers</Text>

                            <Text style={{
                                marginTop: 10,
                                color: Theme.color.text3,
                                fontSize: 18,
                                fontFamily: "Chewy-Regular"
                            }}>Let's find some hot chicks</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    setTimeout(() => {
                                        if (this.closed) return;
                                        // Consider: set scroll position 0

                                        // this.props.navigation.navigate("intro");
                                    }, Cons.buttonTimeoutShort);
                                }}
                                style={{ marginTop: 20 }}>
                                <Image
                                    style={{
                                        width: illustWidth,
                                        height: illustHeight,
                                        resizeMode: 'cover'
                                    }}
                                    source={PreloadImage.review}
                                />
                            </TouchableOpacity>
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

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
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

        console.log('CheckLikes', 'loading users...');

        // let newUsers = [];

        let startIndex;

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

        console.log('CheckLikes', 'loading feeds done!');
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

    async postClick(item) {
        if (item.replyAdded) {
            // update replyAdded in user profile
            const { profile } = this.props.profileStore;

            await Firebase.updateReplyChecked(item.placeId, item.feedId, profile.uid, item.reviewId, false);

            // update state
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId && el.reviewId === item.reviewId);
            if (index === -1) {
                // this should never happen
                return;
            }

            let feed = feeds[index];
            feed.replyAdded = false;
            feeds[index] = feed;
            !this.closed && this.setState({ feeds });
        }

        this.openPost(item);
    }

    openPost(item) {
        // show indicator
        // !this.closed && this.setState({ showPostIndicator: index });

        const post = this.getPost(item);
        if (post === null) {
            // the post is not subscribed yet
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (post === undefined) {
            // the post is removed
            this.refs["toast"].show('The post has been removed by its owner.', 500, () => {
                // update picture
                /*
                let feeds = [...this.state.feeds];
                const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
                if (index !== -1) {
                    feeds.splice(index, 1);
                    !this.closed && this.setState({ feeds });
                }
                */
                let feeds = [...this.state.feeds];
                for (let i = 0; i < feeds.length; i++) {
                    const feed = feeds[i];
                    if (feed.placeId === item.placeId && feed.feedId === item.feedId) {
                        feeds.splice(i, 1);
                    }
                }
                !this.closed && this.setState({ feeds });

                // update database
                Firebase.updateReview(Firebase.user().uid, item.placeId, item.feedId, null);

                // await Firebase.updateReview(Firebase.user().uid, item.placeId, item.feedId, null);
                // this.onFocus();
            });

            return;
        }

        const feedSize = this.getFeedSize(item.placeId);
        if (feedSize === -1) {
            // console.log('getFeedSize', item.placeId);
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed
            // this should never happen
            return;
        }

        const extra = {
            feedSize: feedSize
        };

        // setTimeout(() => {
        Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
        this.props.navigation.navigate("reviewPost", { post: post, extra: extra, from: 'Profile' });
        // }, Cons.buttonTimeoutShort);

        // hide indicator
        // !this.closed && this.setState({ showPostIndicator: -1 });
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
        flexGrow: 1
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
