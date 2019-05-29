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

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 12; // 3 x 4

// 1:1
const illustHeight = 340;
const illustWidth = 340;


@inject("profileStore")
@observer
export default class ReviewMain extends React.Component<InjectedProps> {
    state = {
        // renderFeed: false,
        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,
        // showPostIndicator: -1,
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
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.getReviewedFeeds();

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
        */
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'ReviewMain';

        const lastChangedTime = this.props.profileStore.lastTimeReviewsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getReviewedFeeds();

            // move scroll top
            // if (this._flatList) this._flatList.scrollToOffset({ offset: 0, animated: true });
        }

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ReviewMain.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

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
                </View>

                {
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        columnWrapperStyle={{ flex: 1, justifyContent: 'flex-start' }}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.reviewId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableWithoutFeedback onPress={() => this.postClick(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.picture}
                                        />
                                        {
                                            item.replyAdded &&
                                            <View style={{
                                                position: 'absolute',
                                                top: 3,
                                                right: 3,
                                                backgroundColor: 'red',
                                                borderRadius: Cons.redDotWidth / 2,
                                                width: Cons.redDotWidth,
                                                height: Cons.redDotWidth
                                            }} />
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
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getReviewedFeeds();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        ListHeaderComponent={
                            (this.state.totalFeedsSize > 0) &&
                            <View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>Your girls ({this.state.totalFeedsSize})</Text>
                                </View>
                            </View>
                        }

                        ListEmptyComponent={
                            !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 24,
                                    paddingTop: 4,
                                    fontFamily: "Roboto-Medium"
                                }}>No reviewed girls</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 18,
                                    fontFamily: "Roboto-Medium"
                                }}>Let's find some hot chicks</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTimeout(() => {
                                            if (this.closed) return;
                                            // Consider: set scroll position 0

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
                                        source={PreloadImage.review}
                                    />
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

    getReviewedFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        const reviews = profile.reviews;
        const length = reviews.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });

            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeReviewsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.onLoading = true;

        console.log('ReviewMain', 'loading feeds...');

        this.setState({ isLoadingFeeds: true });

        let newFeeds = [];

        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (var i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const review = reviews[i];

            newFeeds.push(review);



            // subscribe here (post)
            // --
            const placeId = review.placeId;
            const feedId = review.feedId;

            const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                if (newFeed === undefined) {
                    this.feedList.delete(feedId);

                    return;
                }

                console.log('feed subscribed');

                // update this.feedList
                this.feedList.set(feedId, newFeed);

                // update picture
                let feeds = [...this.state.feeds];
                const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.feedId === newFeed.id);
                if (index !== -1) {
                    feeds[index].picture = newFeed.pictures.one.uri;
                    !this.closed && this.setState({ feeds });
                }
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



            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({ isLoadingFeeds: false, feeds: newFeeds });
        } else {
            this.setState({ isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds] });
        }

        console.log('ReviewMain', 'loading feeds done!');

        this.onLoading = false;
    }

    postClick(item) {
        if (item.replyAdded) {
            // update replyAdded in user profile
            const { profile } = this.props.profileStore;
            /*
            const result = await Firebase.updateReplyChecked(item.placeId, item.feedId, profile.uid, item.reviewId, false);
            if (!result) {
                this.refs["toast"].show('The user no longer exists.', 500);

                return;
            }
            */
            Firebase.updateReplyChecked(item.placeId, item.feedId, profile.uid, item.reviewId, false);

            // update state
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId && el.reviewId === item.reviewId);
            if (index === -1) {
                this.refs["toast"].show('The post does not exist.', 500);

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
        const feeds = [...this.state.feeds];
        const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
        if (index === -1) {
            this.refs["toast"].show('The post does not exist.', 500);

            return;
        }

        // !this.closed && this.setState({ showPostIndicator: index });

        const post = this.getPost(item);
        if (!post) {
            this.refs["toast"].show('The post has been removed by its owner.', 500); // or NOT subscribed yet!

            // we skip here. It'll update state feeds on onfocus event.

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

        // setTimeout(() => {
        this.props.navigation.navigate("reviewPost", { post: post, extra: extra, from: 'Profile' });
        // }, Cons.buttonTimeoutShort);

        // hide indicator
        // !this.closed && this.setState({ showPostIndicator: -1 });
    }

    getPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;

        /*
        if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
            console.log('post from memory');
            return this.feedList.get(feedId);
        }

        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (!feedDoc.exists) return null;

        const post = feedDoc.data();

        this.feedList.set(feedId, post);

        // subscribe here
        // --
        const instance = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) {
                this.feedList.delete(feedId);

                return;
            }

            // update this.feedList
            this.feedList.set(feedId, newFeed);
        });

        this.feedsUnsubscribes.push(instance);
        // --
        */

        let post = null;
        if (this.feedList.has(feedId)) {
            post = this.feedList.get(feedId);
        }

        return post;
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

    handleRefresh = () => {
        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getReviewedFeeds();

        !this.closed && this.setState({ refreshing: false });
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        // backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingTop: Theme.spacing.base,
        // paddingBottom: Theme.spacing.small,
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
