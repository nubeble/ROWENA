import React from 'react';
import {
    StyleSheet, View, TouchableWithoutFeedback, Image, BackHandler, Dimensions, FlatList,
    TouchableOpacity, Platform, ActivityIndicator
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import PreloadImage from './PreloadImage';
import SmartImage from "./rnff/src/components/SmartImage";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import autobind from 'autobind-decorator';
import { Text, Theme, RefreshIndicator } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { AirbnbRating } from './react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Dialog from "react-native-dialog";

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 6;


@inject("profileStore")
@observer
export default class SavedPlace extends React.Component<InjectedProps> {
    // static __flatList = null;

    state = {
        feeds: [],
        placeName: null,
        totalFeedsSize: 0,
        isLoadingFeeds: false,
        loadingType: 0, // 0: none, 100: middle, 200: down
        refreshing: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.__feeds = null; // from param

        this.placeId = null;

        this.lastLoadedFeedIndex = -1;
        // this.lastChangedTime = 0;

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    /*
    static scrollToTop() {
        SavedPlace.__flatList.scrollToOffset({ offset: 0, animated: true });
    }
    */

    componentDidMount() {
        console.log('SavedPlace.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        // this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.props.profileStore.setLikesUpdatedCallback(this.onLikesUpdated);

        // placeName, placeId
        const { placeId, city } = this.props.navigation.state.params;

        this.placeId = placeId;
        this.setState({ placeName: city });

        /*
        const feeds = this.props.navigation.state.params.feeds;

        // placeName, placeId
        if (feeds.length > 0) {
            const placeName = feeds[0].placeName;
            const words = placeName.split(', ');
            this.setState({ placeName: words[0] });

            const placeId = feeds[0].placeId;
            this.placeId = placeId;
        }
        */

        // this.__feeds = feeds;

        // this.getFeeds();

        // reload from the start
        this.getFeedsFromStart();

        this.lastLoadedFeedIndex = -1;
        this.getFeeds();
    }

    @autobind
    handleHardwareBackPress() {
        console.log('SavedPlace.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onLikesUpdated() {
        console.log('SavedPlace.onLikesUpdated');

        // reload from the start
        this.getFeedsFromStart();

        this.lastLoadedFeedIndex = -1;
        this.getFeeds();
    }

    @autobind
    onFocus() {
        // console.log('SavedPlace.onFocus');

        Vars.focusedScreen = 'SavedPlace';

        /*
        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.getFeedsFromStart();

            this.lastLoadedFeedIndex = -1;
            this.getFeeds();
        }
        */

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

    componentWillUnmount() {
        console.log('SavedPlace.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

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

    getFeeds() {
        if (this.state.isLoadingFeeds) return;

        const feeds = this.__feeds;
        const length = feeds.length;

        !this.closed && this.setState({ totalFeedsSize: length });

        if (length === 0) {
            !this.closed && this.setState({ feeds: [] });
            return;
        }

        // all loaded
        if (this.lastLoadedFeedIndex >= length - 1) return;

        console.log('SavedPlace', 'loading feeds ...');

        let newFeeds = [];

        let reload = false;
        let startIndex = 0;
        if (this.lastLoadedFeedIndex === -1) {
            reload = true;
            startIndex = 0;

            !this.closed && this.setState({ isLoadingFeeds: true, loadingType: 100 });
        } else {
            startIndex = this.lastLoadedFeedIndex + 1;

            !this.closed && this.setState({ isLoadingFeeds: true, loadingType: 200 });
        }

        let count = 0;

        for (let i = startIndex; i < length; i++) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const feed = feeds[i];

            const placeId = feed.placeId;
            const feedId = feed.feedId;
            const name = feed.name;
            const placeName = feed.placeName;
            const picture = feed.picture;

            if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
                const __feed = this.feedList.get(feedId);

                const newFeed = {
                    name: __feed.name,
                    placeName: __feed.placeName,
                    placeId: __feed.placeId,
                    feedId: __feed.id,
                    picture: __feed.pictures.one.uri,
                    reviewCount: __feed.reviewCount,
                    averageRating: __feed.averageRating
                };

                newFeeds.push(newFeed);
            } else {
                const newFeed = {
                    name,
                    placeName,
                    placeId,
                    feedId,
                    picture,
                    reviewCount: -1,
                    averageRating: -1
                };

                newFeeds.push(newFeed);

                // ToDo: subscribe post after set state feeds
                // subscribe post
                this.subscribeToPost(placeId, feedId);

                // subscribe count
                this.subscribeToPlace(placeId);
            }

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (reload)
            !this.closed && this.setState({ feeds: newFeeds });
        else
            !this.closed && this.setState({ feeds: [...this.state.feeds, ...newFeeds] });

        console.log('SavedPlace', 'loading feeds done!');

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false, loadingType: 0 });
        }, 250);
    }

    getFeedsFromStart() {
        const { profile } = this.props.profileStore;
        const likes = profile.likes;
        const length = likes.length;

        let newFeeds = [];

        for (let i = length - 1; i >= 0; i--) {
            const like = likes[i];
            const placeId = like.placeId;

            if (placeId === this.placeId) {
                newFeeds.push(like);
            }
        }

        this.__feeds = newFeeds;
    }

    subscribeToPost(placeId, feedId) {
        const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) {
                // update this.feedList
                this.feedList.delete(feedId);

                // update state feed & UI
                let feeds = [...this.state.feeds];
                const index = feeds.findIndex(el => el.placeId === placeId && el.feedId === feedId);
                if (index !== -1) {
                    feeds.splice(index, 1);
                    !this.closed && this.setState({ feeds });
                }

                // update database
                Firebase.removeLikes(Firebase.user().uid, placeId, feedId);

                return;
            }

            // update this.feedList
            this.feedList.set(feedId, newFeed);

            // update state feed & UI
            let changed = false;
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === placeId && el.feedId === feedId);
            if (index !== -1) {
                const item = feeds[index];

                if (item.name !== newFeed.name || item.placeName !== newFeed.placeName || item.picture !== newFeed.pictures.one.uri) changed = true;

                // const street = Util.getStreet(newFeed.location.description);

                const __newFeed = {
                    name: newFeed.name,
                    placeName: newFeed.placeName,
                    // placeName: street,
                    placeId: newFeed.placeId,
                    feedId: newFeed.id,
                    picture: newFeed.pictures.one.uri,
                    reviewCount: newFeed.reviewCount,
                    averageRating: newFeed.averageRating
                };

                feeds[index] = __newFeed;
                !this.closed && this.setState({ feeds });
            }

            // update database
            if (changed) {
                const name = newFeed.name;
                const placeName = newFeed.placeName;
                const picture = newFeed.pictures.one.uri;
                Firebase.updateLikes(Firebase.user().uid, placeId, feedId, name, placeName, picture);
            }
        });

        this.feedsUnsubscribes.push(fi);
    }

    subscribeToPlace(placeId) {
        if (!this.feedCountList.has(placeId)) {
            // this will be updated in subscribe
            this.feedCountList.set(placeId, -1);

            const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                if (newPlace === undefined) {
                    this.feedCountList.delete(placeId);
                    return;
                }

                // update this.feedCountList
                this.feedCountList.set(placeId, newPlace.count);
            });

            this.countsUnsubscribes.push(ci);
        }
    }

    async openPost(item, index) {
        // const post = this.state.feeds[index];
        const post = this.feedList.get(item.feedId);

        if (!post) {
            // this should never happen
            // this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

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

        const extra = {
            feedSize
        };

        Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
        this.props.navigation.navigate("savedPost", { post, extra, from: 'SavedPlace' });
    }

    getFeedSize(placeId) {
        /*
        let count = 0;
        if (this.feedCountList.has(placeId)) {
            count = this.feedCountList.get(placeId);
        }

        return count;
        */
        return this.feedCountList.get(placeId);
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

                    {
                        // this.state.totalFeedsSize > 0 ?
                        <View style={{ justifyContent: 'center', marginLeft: 40 + 16, marginBottom: -8 }}>
                            <Text style={{
                                color: Theme.color.text1,
                                fontSize: 14,
                                fontFamily: "Roboto-Medium",
                                // marginLeft: 40 + 16
                            }}>Saved</Text>
                            <Text style={{
                                color: Theme.color.text1,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                            }}>{this.state.placeName}
                                <Text style={{
                                    color: Theme.color.text4,
                                    fontSize: 20,
                                    fontFamily: "Roboto-Medium",
                                }}> {this.state.totalFeedsSize}</Text>
                            </Text>
                        </View>
                        /*
                        :
                        <View>
                            <Text style={{
                                color: Theme.color.text1,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                                marginLeft: 40 + 16
                            }}>Saved</Text>
                        </View>
                        */
                    }
                </View>
                {
                    // this.state.renderList &&
                    <FlatList
                        ref={(fl) => {
                            this._flatList = fl;
                            // SavedPlace.__flatList = fl;
                        }}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        /*
                        ListHeaderComponent={
                            this.state.totalFeedsSize > 0 &&
                            <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 0 }]}>
                                <Text style={styles.title}>You picked {this.state.totalFeedsSize} girls</Text>
                            </View>
                        }
                        */

                        data={this.state.feeds}
                        // keyExtractor={item => item.id}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            let placeName = item.placeName;

                            let distance = null;

                            const post = this.feedList.get(item.feedId);
                            if (post) distance = Util.getDistance(post.location, Vars.location);
                            else distance = placeName;

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
                                    onLongPress={() => {
                                        this.openDialog('Remove likes', "Are you sure you want to remove likes from " + post.name + "?", async () => {
                                            // remove likes

                                            // toast?

                                            // update database
                                            const uid = Firebase.user().uid;
                                            const placeId = post.placeId;
                                            const feedId = post.id;
                                            const name = post.name;
                                            const placeName = post.placeName;
                                            const uri = post.pictures.one.uri;
                                            Firebase.toggleLikes(uid, placeId, feedId, name, placeName, uri);
                                        });
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.picture}
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                            start={[0, 0]}
                                            end={[0, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{item.name}</Text>
                                            <Text style={styles.feedItemText}>{distance}</Text>
                                            {
                                                item.reviewCount === -1 &&
                                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                                    <View style={{ marginLeft: 2, width: 80, height: 21, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 8 }}>
                                                        <ActivityIndicator animating={true} size={'small'} color={Theme.color.selection} />
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
                                                        width: 'auto', height: 'auto', borderRadius: 3, // paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)'
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
                            if (!this.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getFeeds();
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

                            // render illustration
                            // !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
                                <Text style={{
                                    marginTop: 100,
                                    color: Theme.color.text2,
                                    fontSize: 28,
                                    lineHeight: 32,
                                    fontFamily: "Chewy-Regular"
                                }}>No selected girls</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 20,
                                    lineHeight: 24,
                                    fontFamily: "Chewy-Regular"
                                }}>Start exploring girls for your next trip</Text>

                                <Image
                                    style={{
                                        marginTop: 30,
                                        width: Cons.stickerWidth,
                                        height: Cons.stickerHeight,
                                        resizeMode: 'cover'
                                    }}
                                    source={PreloadImage.explore}
                                />
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

    handleRefresh = () => {
        if (this.state.refreshing) return;

        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.getFeedsFromStart();

        this.lastLoadedFeedIndex = -1;
        this.getFeeds();

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
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    pictureContainer: {
        // 3:2 image
        width: (Dimensions.get('window').width - Theme.spacing.small * 2),
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 3 * 2,
        borderRadius: 2,
        marginVertical: Theme.spacing.small,
        marginHorizontal: Theme.spacing.small
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
        paddingHorizontal: 2,
        /*
        textShadowColor: 'black',
        textShadowOffset: { width: -0.3, height: -0.3 },
        textShadowRadius: Platform.OS === 'android' ? 10 : 4
        */
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
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
