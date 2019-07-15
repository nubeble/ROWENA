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
import ProfileStore from "./rnff/src/home/ProfileStore";
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';
import Util from './Util';

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 18; // 3 x 6


@inject("profileStore")
@observer
export default class CommentMain extends React.Component<InjectedProps> {
    // static __flatList = null;

    state = {
        // renderFeed: false,
        feeds: [], // customers profile
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        // showPostIndicator: -1,
    };

    constructor(props) {
        super(props);

        // this.reload = true;
        this.lastLoadedFeedIndex = -1;
        // this.lastChangedTime = 0;

        this.customerList = new Map();

        this.customersUnsubscribes = [];
    }

    /*
    static scrollToTop() {
        CommentMain.__flatList.scrollToOffset({ offset: 0, animated: true });
    }
    */

    componentDidMount() {
        console.log('CommentMain.componentDidMount');

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.props.profileStore.setCommentsUpdatedCallback(this.onCommentsUpdated);

        this.getCommentedFeeds();
    }

    componentWillUnmount() {
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        this.props.profileStore.unsetCommentsUpdatedCallback(this.onCommentsUpdated);

        for (let i = 0; i < this.customersUnsubscribes.length; i++) {
            const instance = this.customersUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    @autobind
    onCommentsUpdated() {
        // reload from the start
        this.lastLoadedFeedIndex = -1;
        this.getCommentedFeeds();
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'CommentMain';

        /*
        const lastChangedTime = this.props.profileStore.lastTimeCommentsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getCommentedFeeds();
        }
        */

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('CommentMain.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
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
                    }}>Reviewed Customers
                        {
                            this.state.totalFeedsSize > 0 &&
                            <Text style={{
                                color: Theme.color.text4,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                            }}> {this.state.totalFeedsSize}</Text>
                        }
                    </Text>
                </View>

                {
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                            // CommentMain.__flatList = fl;
                        }}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        columnWrapperStyle={{ flex: 1, justifyContent: 'flex-start' }}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.commentId}
                        renderItem={({ item, index }) => {
                            let avatarName = '';
                            let avatarColor = 'black';
                            if (!item.picture) {
                                // avatarName = 'JK';
                                avatarName = Util.getAvatarName(item.name);
                                avatarColor = Util.getAvatarColor(item.uid);
                            }

                            return (
                                <TouchableWithoutFeedback onPress={() => this.postClick(item)}>
                                    <View style={styles.pictureContainer}>
                                        {
                                            item.picture ?
                                                <SmartImage
                                                    style={styles.picture}
                                                    showSpinner={false}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={item.picture}
                                                />
                                                :
                                                /*
                                                <Image
                                                    style={[styles.picture, {
                                                        backgroundColor: 'black', resizeMode: 'cover'
                                                    }]}
                                                    source={PreloadImage.user}
                                                />
                                                */
                                                <View
                                                    style={{ width: '100%', height: '100%', borderRadius: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: avatarColor }}
                                                >
                                                    <Text style={{ color: 'white', fontSize: 34, paddingTop: 16, fontFamily: "Roboto-Medium" }}>
                                                        {avatarName}
                                                    </Text>
                                                </View>
                                        }
                                        {
                                            /*
                                            this.state.showPostIndicator === index &&
                                            <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: 'center', alignItems: 'center' }}>
                                                <ActivityIndicator animating size={'small'} color={'white'} />
                                            </View>
                                            */
                                        }
                                    </View>
                                </TouchableWithoutFeedback>
                            );

                        }}
                        onScroll={({ nativeEvent }) => {
                            if (!this.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getCommentedFeeds();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        /*
                        ListHeaderComponent={
                            this.state.totalFeedsSize > 0 &&
                            <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                                <Text style={styles.title}>Your customers ({this.state.totalFeedsSize})</Text>
                            </View>
                        }
                        */

                        ListEmptyComponent={
                            // render illustration
                            // !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
                                <Text style={{
                                    marginTop: 100,
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32,
                                    fontFamily: "Chewy-Regular"
                                }}>No reviewed customers</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 20,
                                    lineHeight: 24,
                                    fontFamily: "Chewy-Regular"
                                }}>Let's find some hot guys</Text>

                                <Image
                                    style={{
                                        marginTop: 30,
                                        width: Cons.stickerWidth,
                                        height: Cons.stickerHeight,
                                        resizeMode: 'cover'
                                    }}
                                    source={PreloadImage.find}
                                />
                            </View>
                        }
                    />
                }

                {
                    this.state.isLoadingFeeds &&
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

    getCommentedFeeds() {
        if (this.state.isLoadingFeeds) return;

        const { profile } = this.props.profileStore;
        if (!profile) return;

        const comments = profile.comments;
        const length = comments.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            this.setState({ feeds: [] });
            return;
        }

        /*
        // check update
        const lastChangedTime = this.props.profileStore.lastTimeCommentsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }
        */

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.setState({ isLoadingFeeds: true });

        console.log('CommentMain', 'loading feeds ...');

        let newFeeds = [];

        /*
        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }
        */
        let reload = false;
        let startIndex = 0;
        if (this.lastLoadedFeedIndex === -1) {
            reload = true;
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (let i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const comment = comments[i];

            // newFeeds.push(comment);


            // subscribe post
            // --
            const uid = comment.userUid;
            const commentId = comment.commentId;
            const name = comment.name;
            const placeName = comment.placeName;
            const uri = comment.picture;

            if (this.customerList.has(uid)) {
                const user = this.customerList.get(uid);
                if (user) {
                    const customer = {
                        commentId,
                        uid,
                        name: user.name,
                        place: user.place,
                        picture: user.picture.uri
                    };

                    newFeeds.push(customer);
                } else {
                    const customer = {
                        commentId,
                        uid,
                        name, // will be updated
                        place: placeName, // will be updated
                        picture: uri // will be updated
                    };

                    newFeeds.push(customer);
                }
            } else {
                const customer = {
                    commentId,
                    uid,
                    name, // will be updated
                    place: placeName, // will be updated
                    picture: uri // will be updated
                };

                newFeeds.push(customer);

                // this will be updated in subscribe
                this.customerList.set(uid, null);

                // subscribe user profile
                const instance = Firebase.subscribeToProfile(uid, newUser => {
                    if (newUser === undefined) {
                        // update this.customerList
                        this.customerList.delete(uid);
                        return;
                    }

                    // update this.customerList
                    this.customerList.set(uid, newUser);

                    // update state feed & UI
                    let changed = false;
                    let feeds = [...this.state.feeds];
                    for (let i = 0; i < feeds.length; i++) {
                        let feed = feeds[i];
                        if (feed.uid === uid) {
                            if (feed.name !== newUser.name || feed.place !== newUser.place || feed.picture !== newUser.picture.uri) changed = true;

                            feed.name = newUser.name;
                            feed.place = newUser.place;
                            feed.picture = newUser.picture.uri;

                            feeds[i] = feed;
                        }
                    }
                    !this.closed && this.setState({ feeds });

                    // update database
                    if (changed) {
                        const { profile } = this.props.profileStore;
                        if (!profile) return;

                        Firebase.updateComments(profile.uid, newUser.uid, newUser.name, newUser.place, newUser.picture.uri);
                    }
                });

                this.customersUnsubscribes.push(instance);
            }
            // --

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (reload) {
            // this.setState({ isLoadingFeeds: false, feeds: newFeeds });
            this.setState({ feeds: newFeeds });
        } else {
            // this.setState({ isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds] });
            this.setState({ feeds: [...this.state.feeds, ...newFeeds] });
        }

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false });
        }, 250);

        console.log('CommentMain', 'loading feeds done!');
    }

    postClick(item) {
        this.openPost(item);
    }

    openPost(item) {
        // show indicator
        // !this.closed && this.setState({ showPostIndicator: index });

        const { profile } = this.props.profileStore;
        // if (!profile) return;

        const host = {
            uid: profile.uid,
            name: profile.name,
            picture: profile.picture.uri
        };

        const customer = this.customerList.get(item.uid);
        if (customer === null) {
            // the user is not subscribed yet
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (customer === undefined) {
            // the user is removed
            this.refs["toast"].show('The user no longer exists.', 500, () => {
                // update picture
                let feeds = [...this.state.feeds];
                for (let i = 0; i < feeds.length; i++) {
                    const feed = feeds[i];
                    if (feed.uid === item.uid) {
                        feeds.splice(i, 1);
                    }
                }
                !this.closed && this.setState({ feeds });

                // update database
                Firebase.updateComments(profile.uid, item.uid, null, null, null);
            });

            return;
        }

        const { place, receivedCommentsCount, timestamp, birthday, gender, about } = customer;

        const guest = {
            uid: customer.uid,
            name: customer.name,
            picture: customer.picture.uri,
            address: place,
            receivedCommentsCount,
            timestamp, birthday, gender, about
        };

        const _item = {
            host,
            guest
        };

        this.props.navigation.navigate("userPost", { from: 'CommentMain', item: _item });

        // hide indicator
        // !this.closed && this.setState({ showPostIndicator: -1 });
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        // this.lastChangedTime = 0;
        this.lastLoadedFeedIndex = -1;
        this.getCommentedFeeds();

        !this.closed && this.setState({ refreshing: false });
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
        // alignItems: 'center',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingTop: Theme.spacing.base,
        // paddingBottom: Theme.spacing.small,
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
