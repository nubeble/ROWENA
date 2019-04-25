import React from 'react';
import {
    StyleSheet, View, TouchableWithoutFeedback, Image, BackHandler, Dimensions, FlatList,
    TouchableOpacity, Platform, ActivityIndicator
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Constants, Permissions, Linking, ImagePicker } from "expo";
import PreloadImage from './PreloadImage';
import SmartImage from "./rnff/src/components/SmartImage";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
// import type { FeedEntry } from "./rnff/src/components/Model";
// import type { ScreenProps } from "./rnff/src/components/Types";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import autobind from 'autobind-decorator';
import { Text, Theme, RefreshIndicator, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { AirbnbRating } from './react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 6;

// 600, 510
const illustHeight = 300;
const illustWidth = 300 / 510 * 600;


@inject("feedStore", "profileStore")
@observer
export default class LikesMain extends React.Component<InjectedProps> {
    state = {
        // renderList: false,
        feeds: [],
        isLoadingFeeds: false,
        loadingType: 0, // 0: none, 100: middle, 200: down
        refreshing: false,

        focused: false
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
        this.onLoading = false;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    componentDidMount() {
        console.log('LikesMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.getSavedFeeds();

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
        */
    }

    @autobind
    handleHardwareBackPress() {
        console.log('LikesMain.handleHardwareBackPress');

        this.props.navigation.navigate("intro");

        return true;
    }

    @autobind
    onFocus() {
        console.log('LikesMain.onFocus');

        Vars.currentScreenName = 'LikesMain';

        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getSavedFeeds();

            // move scroll top
            // this._flatList.scrollToOffset({ offset: 0, animated: true });
        }

        /*
        if (Vars.postLikeButtonPressed) { // could take awhile updating user profile database
            await this.getSavedFeeds();
            Vars.postLikeButtonPressed = false;

            // already reload from the beginning. so pass this.
            Vars.updatedPostsForLikes = [];
        } else {
            if (Vars.updatedPostsForLikes.length > 0) {
                // this.setState({ isLoadingFeeds: true });
                this.setState({ isLoadingFeeds: true, loadingType: 100 });

                let feeds = [...this.state.feeds];

                for (var i = 0; i < Vars.updatedPostsForLikes.length; i++) {
                    const newPost = Vars.updatedPostsForLikes[i];

                    let index = feeds.findIndex(el => el.placeId === newPost.placeId && el.id === newPost.id);
                    if (index !== -1) {
                        feeds[index] = newPost;
                    }
                }

                !this.closed && this.setState({ feeds });

                // this.setState({ isLoadingFeeds: false });
                this.setState({ isLoadingFeeds: false, loadingType: 0 });

                Vars.updatedPostsForLikes = [];
            }
        }
        */

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        console.log('LikesMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        // this.onBlurListener.remove();

        for (var i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (var i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    getSavedFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        const feeds = profile.likes;
        const length = feeds.length;
        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });

            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.onLoading = true;

        console.log('LikesMain', 'loading feeds...');

        // this.setState({ isLoadingFeeds: true });

        let newFeeds = [];

        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;

            this.setState({ isLoadingFeeds: true, loadingType: 100 });
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;

            this.setState({ isLoadingFeeds: true, loadingType: 200 });
        }

        let count = 0;

        for (var i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const feed = feeds[i];

            // if (!feed.valid) continue;

            const placeId = feed.placeId;
            const feedId = feed.feedId;

            const picture = feed.picture;
            const name = feed.name;
            const placeName = feed.placeName;




            if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
                console.log('post from memory');

                const newFeed = this.feedList.get(feedId);
                newFeeds.push(newFeed);
            } else {
                /*
                const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
                if (!feedDoc.exists) return;

                const newFeed = feedDoc.data();
                newFeeds.push(newFeed);

                this.feedList.set(feedId, newFeed);
                */
                const newFeed = {
                    name,
                    placeName,
                    placeId,
                    id: feedId,
                    pictures: {
                        one: {
                            uri: picture
                        }
                    },
                    reviewCount: -1,
                    averageRating: -1
                };

                newFeeds.push(newFeed);

                // subscribe here (post)
                // --
                const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                    if (newFeed === undefined) { // newFeed === undefined if removed
                        // update this.feedList
                        this.feedList.delete(feedId);

                        // update state feed & UI
                        // --
                        let feeds = [...this.state.feeds];
                        const index = feeds.findIndex(el => el.placeId === placeId && el.id === feedId);
                        if (index !== -1) {
                            feeds.splice(index, 1);
                        }
                        // --

                        return;
                    }

                    // update this.feedList
                    this.feedList.set(feedId, newFeed);

                    // update state feed & UI
                    // --
                    let feeds = [...this.state.feeds];
                    const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.id === newFeed.id);
                    if (index !== -1) {
                        feeds[index] = newFeed;
                        !this.closed && this.setState({ feeds });
                    }
                    // --
                });

                this.feedsUnsubscribes.push(fi);
                // --

                // subscribe here (count)
                // --
                const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                    if (newPlace === undefined) {
                        this.feedCountList.delete(placeId);

                        return;
                    }

                    console.log('count subscribed');

                    // update this.feedCountList
                    this.feedCountList.set(placeId, newPlace.count);
                });

                this.countsUnsubscribes.push(ci);
                // --
            }

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({ feeds: newFeeds });
        } else {
            this.setState({ feeds: [...this.state.feeds, ...newFeeds] });
        }

        console.log('LikesMain', 'loading feeds done!');

        // this.setState({ isLoadingFeeds: false });
        this.setState({ isLoadingFeeds: false, loadingType: 0 });

        this.onLoading = false;
    }

    async openPost(item, index) {
        const post = this.state.feeds[index];

        if (!post) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);

            // we skip here. NOT to refresh! (leave it to the user)

            return;
        }

        const feedSize = this.getFeedSize(item.placeId);
        if (feedSize === 0) {
            this.refs["toast"].show('Please try again.', 500);

            return;
        }

        const extra = {
            feedSize: feedSize
        };

        this.props.navigation.navigate("postPreview", { post: post, extra: extra, from: 'LikesMain' });
    }

    getFeedSize(placeId) {
        /*
        if (this.feedCountList.has(placeId)) {
            console.log('count from memory');
            return this.feedCountList.get(placeId);
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        // if (!placeDoc.exists) return 0; // never happen

        const count = placeDoc.data().count;

        this.feedCountList.set(placeId, count);

        // subscribe here
        // --
        const instance = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCountList.delete(placeId);

                return;
            }

            // update this.feedCountList
            this.feedCountList.set(placeId, newPlace.count);
        });

        this.countsUnsubscribes.push(instance);
        // --
        */

        let count = 0;
        if (this.feedCountList.has(placeId)) {
            count = this.feedCountList.get(placeId);
        }

        return count;
    }

    /*
    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true });
    }
    
    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false });
    }
    */

    render() {
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
                    >Saved</Text>

                </View>
                {
                    // this.state.renderList &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        /*
                        ListHeaderComponent={
                            <View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>Bangkok, Thailand (3)</Text>
                                </View>
                            </View>
                        }
                        */
                        data={this.state.feeds}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => {
                            // placeName
                            let placeName = item.placeName;
                            const words = placeName.split(', ');
                            if (words.length > 1) {
                                const city = words[0];
                                const country = words[words.length - 1];
                                placeName = city + ', ' + country;
                            }

                            // defaultRating, averageRating
                            let integer = 0;
                            let number = '';

                            const averageRating = item.averageRating;
                            if (averageRating !== -1) {
                                integer = Math.floor(averageRating);

                                if (Number.isInteger(averageRating)) {
                                    number = averageRating + '.0';
                                } else {
                                    number = averageRating.toString();
                                }
                            }

                            return (
                                <TouchableWithoutFeedback
                                    onPress={async () => {
                                        if (averageRating !== -1 && item.reviewCount !== -1) await this.openPost(item, index);
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures.one.uri}
                                        />
                                        <View style={[{ paddingLeft: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{item.name}</Text>
                                            <Text style={styles.feedItemText}>{placeName}</Text>
                                            {
                                                item.reviewCount === -1 &&
                                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                                    <View style={{ marginLeft: 2, width: 80, height: 21, justifyContent: 'center', alignItems: 'center' }}>
                                                        <ActivityIndicator animating={true} size={18} color={Theme.color.selection} />
                                                    </View>
                                                </View>
                                            }
                                            {
                                                item.reviewCount === 0 &&
                                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                                    <View style={{
                                                        marginLeft: 2,
                                                        width: 36, height: 21, borderRadius: 3,
                                                        backgroundColor: Theme.color.new,
                                                        justifyContent: 'center', alignItems: 'center'
                                                    }}>
                                                        <Text style={styles.new}>new</Text>
                                                    </View>
                                                </View>
                                            }
                                            {
                                                item.reviewCount > 0 &&
                                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                                    <View style={{
                                                        flexDirection: 'row', alignItems: 'center',
                                                        marginLeft: 2,
                                                        width: 'auto', height: 'auto', paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)', borderRadius: 3
                                                    }}>
                                                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                                            <AirbnbRating
                                                                count={5}
                                                                readOnly={true}
                                                                showRating={false}
                                                                defaultRating={integer}
                                                                size={12}
                                                                margin={1}
                                                            />
                                                        </View>
                                                        <Text style={styles.rating}>{number}</Text>
                                                        <AntDesign style={{ marginLeft: 10, marginTop: 1 }} name='message1' color={Theme.color.title} size={12} />
                                                        <Text style={styles.reviewCount}>{item.reviewCount}</Text>
                                                    </View>
                                                </View>
                                            }
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            );
                        }}
                        // onEndReachedThreshold={0.5}
                        // onEndReached={this.handleScrollEnd}
                        onScroll={({ nativeEvent }) => {
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getSavedFeeds();
                            }
                        }}
                        // scrollEventThrottle={1}

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        ListFooterComponent={
                            // this.state.isLoadingFeeds &&
                            this.state.isLoadingFeeds && this.state.loadingType === 200 &&
                            <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                                <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                            </View>
                        }

                        ListEmptyComponent={
                            /*
                            this.state.isLoadingFeeds ?
                                <View style={{ width: '100%', height: (Dimensions.get('window').height - Cons.searchBarHeight) / 2 - 30 / 2 - Theme.spacing.base - Cons.searchBarHeight / 2 }} />
                                :
                            */

                            !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 24,
                                    paddingTop: 4,
                                    fontFamily: "Roboto-Medium"
                                }}>No selected girls</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 18,
                                    fontFamily: "Roboto-Medium"
                                }}>Start exploring girls for your next trip</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTimeout(() => {
                                            // ToDo: set scroll position 0

                                            this.props.navigation.navigate("intro");
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                    style={{ marginTop: 20 }}>
                                    <Image
                                        style={{
                                            width: illustWidth,
                                            height: illustHeight,
                                            resizeMode: 'cover'
                                        }}
                                        source={PreloadImage.find}

                                    />
                                </TouchableOpacity>
                            </View>
                        }
                    />
                }

                {
                    // this.state.isLoadingFeeds &&
                    this.state.isLoadingFeeds && this.state.loadingType === 100 &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            // color='white'
                            color={Theme.color.splash}
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

    handleRefresh = () => {
        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getSavedFeeds();

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
        paddingBottom: 4,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingLeft: Theme.spacing.base,
        paddingRight: Theme.spacing.base,
        paddingTop: Theme.spacing.base,
        paddingBottom: Theme.spacing.base
    },
    pictureContainer: {
        // 3:2 image
        width: (Dimensions.get('window').width - Theme.spacing.base * 2),
        height: (Dimensions.get('window').width - Theme.spacing.base * 2) / 3 * 2,

        borderRadius: 2,
        marginVertical: Theme.spacing.base
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
    },
    feedItemText: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        paddingLeft: 2,

        textShadowColor: 'black',
        textShadowOffset: { width: -0.3, height: -0.3 },
        textShadowRadius: Platform.OS === 'android' ? 10 : 4
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    new: {
        color: 'white',
        fontSize: 13,
        lineHeight: 13,
        fontFamily: "Roboto-Bold",
        // backgroundColor: 'grey'
    }
});
