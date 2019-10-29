import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Image,
    Dimensions, FlatList, ActivityIndicator, TouchableWithoutFeedback, Platform
} from "react-native";
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from "react-native-vector-icons/AntDesign";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import Toast, { DURATION } from 'react-native-easy-toast';
import ProfileStore from "./rnff/src/home/ProfileStore";
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';
import Util from './Util';
import Dialog from "react-native-dialog";

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 18; // 3 x 6


@inject("profileStore")
@observer
export default class ReviewMain extends React.Component<InjectedProps> {
    // static __flatList = null;

    state = {
        // renderFeed: false,
        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        // showPostIndicator: -1,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        // this.reload = true;
        this.lastLoadedFeedIndex = -1;
        // this.lastChangedTime = 0;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    /*
    static scrollToTop() {
        ReviewMain.__flatList.scrollToOffset({ offset: 0, animated: true });
    }
    */

    componentDidMount() {
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.props.profileStore.setReviewsUpdatedCallback(this.onReviewsUpdated);  // review add / remove detection
        this.props.profileStore.setReplyAddedOnReviewCallback(this.onReplyAddedOnReview);

        this.getReviewedFeeds();
    }

    componentWillUnmount() {
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        this.props.profileStore.unsetReviewsUpdatedCallback(this.onReviewsUpdated);
        this.props.profileStore.unsetReplyAddedOnReviewCallback(this.onReplyAddedOnReview);

        for (let i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (let i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'ReviewMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onReviewsUpdated() {
        console.log('jdub', 'ReviewMain.onReviewsUpdated');

        // reload from the start
        /*
        this.lastLoadedFeedIndex = -1;
        this.getReviewedFeeds();
        */
        const { profileStore } = this.props;
        const { profile } = profileStore;
        const length = profile.reviews.length;
        let count = length - this.lastLoadedFeedIndex;
        if (count < DEFAULT_FEED_COUNT) count = DEFAULT_FEED_COUNT;

        this.lastLoadedFeedIndex = -1;
        this.getReviewedFeeds(count);
    }

    @autobind
    onReplyAddedOnReview() {
        console.log('jdub', 'ReviewMain.onReplyAddedOnReview');

        // reload from the start
        const { profileStore } = this.props;
        const { profile } = profileStore;
        const length = profile.reviews.length;
        let count = length - this.lastLoadedFeedIndex;
        if (count < DEFAULT_FEED_COUNT) count = DEFAULT_FEED_COUNT;

        this.lastLoadedFeedIndex = -1;
        this.getReviewedFeeds(count);
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'ReviewMain';

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
        const { profile } = this.props.profileStore;

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
                    }}>
                        {
                            Platform.OS === 'android' ? 'Reviewed ' + Util.getPostName(true, Vars.showMe) : 'Commented Posts'
                        }
                        {
                            this.state.totalFeedsSize > 0 &&
                            <Text style={{
                                color: Theme.color.text4,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                            }}> {Util.numberWithCommas(this.state.totalFeedsSize)}</Text>
                        }
                    </Text>
                </View>

                {
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                            // ReviewMain.__flatList = fl;
                        }}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        columnWrapperStyle={{ flex: 1, justifyContent: 'flex-start' }}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.reviewId}
                        renderItem={({ item, index }) => {
                            if (!item.reporters || item.reporters.length === 0 || item.reporters.indexOf(Firebase.user().uid) === -1) {
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
                            } else {
                                return (
                                    <TouchableWithoutFeedback onPress={() => {
                                        this.openDialog('Unblock Post', 'Are you sure you want to unblock this post?', async () => {
                                            // unblock

                                            // 1. update database (reporters)
                                            const uid = Firebase.user().uid;
                                            const placeId = item.placeId;
                                            const feedId = item.feedId;

                                            const result = await Firebase.unblockPost(uid, placeId, feedId);
                                            if (!result) {
                                                // the post is removed
                                                this.refs["toast"].show('The post has been removed by its owner.', 500);
                                                return;
                                            }
                                        });
                                    }}>
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
                                            <View style={[StyleSheet.absoluteFill, {
                                                borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                                            }]}>
                                                {/*
                                                <AntDesign style={{ marginTop: -8, marginBottom: 12 }} name='checkcircleo' color="#228B22" size={36} />
                                                <Text style={{
                                                    color: Theme.color.text1,
                                                    fontSize: 14,
                                                    fontFamily: "Roboto-Light",
                                                    paddingHorizontal: 10,
                                                    textAlign: 'center',
                                                    marginBottom: 8
                                                }}>{'Thanks for letting us know.'}</Text>
                                                <Text style={{
                                                    color: Theme.color.text3,
                                                    fontSize: 14,
                                                    fontFamily: "Roboto-Light",
                                                    paddingHorizontal: 10,
                                                    textAlign: 'center'
                                                }}>{'Your feedback improves the quality of contents on Rowena.'}</Text>
                                                */}
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                );
                            }
                        }}
                        onScroll={({ nativeEvent }) => {
                            if (!this.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getReviewedFeeds();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        /*
                        ListHeaderComponent={
                            this.state.totalFeedsSize > 0 &&
                            <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                                <Text style={styles.title}>Your girls ({this.state.totalFeedsSize})</Text>
                            </View>
                        }
                        */

                        ListEmptyComponent={
                            // render illustration
                            // !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32,
                                    fontFamily: "Chewy-Regular"
                                }}>
                                    {
                                        Platform.OS === 'android' ? 'No reviewed ' + Util.getPostName(false, Vars.showMe) : 'No commented posts'
                                    }
                                </Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 20,
                                    lineHeight: 24,
                                    fontFamily: "Chewy-Regular"
                                }}>
                                    {
                                        Platform.OS === 'android' ? "Let's go check " + Util.getPostSubtitle(false, Vars.showMe) + " out" : "Let's go meet new guys"
                                    }
                                </Text>

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

    getReviewedFeeds(count = DEFAULT_FEED_COUNT) {
        if (this.state.isLoadingFeeds) return;

        const { profile } = this.props.profileStore;
        if (!profile) return;

        const reviews = profile.reviews;
        const length = reviews.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            this.setState({ feeds: [] });
            return;
        }

        /*
        // check update
        const lastChangedTime = this.props.profileStore.lastTimeReviewsUpdated;
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

        console.log('jdub', 'ReviewMain', 'loading feeds ...');

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

        let _count = 0;

        for (let i = startIndex; i >= 0; i--) {
            if (_count >= count) break;

            let review = reviews[i];

            // newFeeds.push(review);

            // subscribe post
            // --
            const placeId = review.placeId;
            const feedId = review.feedId;

            if (this.feedList.has(feedId)) {
                const feed = this.feedList.get(feedId);
                if (feed) { // could be null or undefined
                    // update picture
                    review.picture = feed.d.pictures.one.uri;
                    review.reporters = feed.d.reporters;
                }

                newFeeds.push(review);
            } else {
                newFeeds.push(review);

                // this will be updated in subscribe
                this.feedList.set(feedId, null);

                const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                    if (newFeed === null) return; // error

                    if (newFeed === undefined) {
                        this.feedList.delete(feedId);
                        return;
                    }

                    // update this.feedList
                    this.feedList.set(feedId, newFeed);

                    // update picture, reporters
                    let changed = false;

                    let feeds = [...this.state.feeds];
                    for (let i = 0; i < feeds.length; i++) {
                        let feed = feeds[i];
                        if (feed.placeId === newFeed.d.placeId && feed.feedId === newFeed.d.id) {
                            if (feed.picture !== newFeed.d.pictures.one.uri) changed = true;

                            feed.picture = newFeed.d.pictures.one.uri;
                            feed.reporters = newFeed.d.reporters;

                            feeds[i] = feed;
                        }
                    }
                    !this.closed && this.setState({ feeds });

                    // update database
                    if (changed) Firebase.updateReview(Firebase.user().uid, placeId, feedId, newFeed.d.pictures.one.uri);
                });

                this.feedsUnsubscribes.push(fi);
            }
            // --

            // subscribe feed count
            // --
            if (!this.feedCountList.has(placeId)) {
                // this will be updated in subscribe
                this.feedCountList.set(placeId, null);

                const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                    if (newPlace === null) return; // error

                    if (newPlace === undefined) {
                        this.feedCountList.delete(placeId);
                        return;
                    }

                    // this.feedCountList.set(placeId, newPlace.count);
                    const value = {
                        count: newPlace.count,
                        men: newPlace.men,
                        women: newPlace.women
                    };
                    this.feedCountList.set(placeId, value);
                });

                this.countsUnsubscribes.push(ci);
            }
            // --

            this.lastLoadedFeedIndex = i;

            _count++;
        }

        if (reload) this.setState({ feeds: newFeeds });
        else this.setState({ feeds: [...this.state.feeds, ...newFeeds] });

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false });
        }, 250);

        console.log('jdub', 'ReviewMain', 'loading feeds done!');
    }

    async postClick(item) {
        if (item.replyAdded) {
            // update replyAdded in user profile
            const { profile } = this.props.profileStore;
            if (!profile) return;

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
                // update UI
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
            });

            return;
        }

        const feedSize = this.getPlaceCounts(item.placeId);
        if (feedSize === null) {
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed
            // this should never happen
            return;
        }

        const extra = { placeCounts: feedSize };

        Firebase.addVisits(Firebase.user().uid, post.d.placeId, post.d.id);
        this.props.navigation.navigate("reviewPost", { from: 'ReviewMain', post: post, extra: extra });

        // hide indicator
        // !this.closed && this.setState({ showPostIndicator: -1 });
    }

    getPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;

        const post = this.feedList.get(feedId);

        return post; // null: the post is not subscribed yet, undefined: the post is removed
    }

    getPlaceCounts(placeId) {
        return this.feedCountList.get(placeId); // -1: the place is not subscribed yet, undefined: the place is removed
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastLoadedFeedIndex = -1;
        this.getReviewedFeeds();

        !this.closed && this.setState({ refreshing: false });
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
