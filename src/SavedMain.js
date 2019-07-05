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

type InjectedProps = {
    profileStore: ProfileStore
};

// const DEFAULT_FEED_COUNT = 6;
const DEFAULT_FEED_COUNT = 3; // ToDo: test

// 600, 510
const illustHeight = 300;
const illustWidth = 300 / 510 * 600;


@inject("profileStore")
@observer
export default class SavedMain extends React.Component<InjectedProps> {
    static __flatList = null;

    state = {
        feeds: [],
        isLoadingFeeds: false,
        loadingType: 0, // 0: none, 100: middle, 200: down
        refreshing: false
    };

    constructor(props) {
        super(props);

        this.map = {}; // place id : feed list
        this.order = []; // place id

        // this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
    }

    static scrollToTop() {
        SavedMain.__flatList.scrollToOffset({ offset: 0, animated: true });
    }

    initMap() {
        this.map = {};
        this.order = [];
    }

    addValue(key, value) {
        if (!this.map[key]) {
            this.map[key] = [];

            this.order.push(key);
        }

        this.map[key].push(value);
    }

    getValue(key) {
        return this.map[key];
    }

    componentDidMount() {
        console.log('SavedMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        // this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('SavedMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        console.log('SavedMain.onFocus');

        Vars.focusedScreen = 'SavedMain';

        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getSavedFeeds();

            // move scroll top
            // this._flatList.scrollToOffset({ offset: 0, animated: true });
        }

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
        console.log('SavedMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    getPlaces() {
        console.log('getPlaces()');

        this.initMap();

        const { profile } = this.props.profileStore;

        const likes = profile.likes;
        const length = likes.length;

        if (length === 0) return;

        // for (let i = 0; i < length; i++) {
        for (let i = length - 1; i >= 0; i--) {
            const like = likes[i];
            const placeId = like.placeId;

            this.addValue(placeId, like);
        }
    }

    drawPlaces() { // set state feeds
        console.log('drawPlaces()');

        // all loaded
        if (this.lastLoadedFeedIndex >= this.order.length - 1) return;

        console.log('SavedMain', 'loading feeds...');

        let newFeeds = [];

        let reload = false;
        let startIndex = 0;

        if (this.lastLoadedFeedIndex === -1) {
            reload = true;
            startIndex = 0;

            this.setState({ isLoadingFeeds: true, loadingType: 100 });
        } else {
            startIndex = this.lastLoadedFeedIndex + 1;

            this.setState({ isLoadingFeeds: true, loadingType: 200 });
        }

        let count = 0;

        for (let i = startIndex; i < this.order.length; i++) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const placeId = this.order[i];

            // ToDo: make image, no need to subscribe
            const feeds = this.getValue(placeId);
            // const picture = this.makeImage(feeds);

            const _placeName = feeds[0].placeName;
            const _picture = feeds[0].picture; // ToDo: test
            const _placeId = feeds[0].placeId;

            const newFeed = {
                placeName: _placeName, // city, state, country | city, country
                picture: _picture,
                placeId: _placeId,
                feeds // array
            };

            newFeeds.push(newFeed);

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (reload)
            this.setState({ feeds: newFeeds });
        else
            this.setState({ feeds: [...this.state.feeds, ...newFeeds] });

        console.log('SavedMain', 'loading feeds done!');

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false, loadingType: 0 });
        }, 250);
    }

    getSavedFeeds() {
        console.log('getSavedFeeds()');

        if (this.state.isLoadingFeeds) return;

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.getPlaces();

            this.lastLoadedFeedIndex = -1;
        }

        this.drawPlaces();
    }

    /*
    getSavedFeeds() {
        if (this.state.isLoadingFeeds) return;

        const { profile } = this.props.profileStore;

        const feeds = profile.likes;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            this.setState({ feeds: [] });
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

        // this.setState({ isLoadingFeeds: true });

        console.log('SavedMain', 'loading feeds...');

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

        for (let i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const feed = feeds[i];

            const placeId = feed.placeId;
            const feedId = feed.feedId;
            const name = feed.name;
            const placeName = feed.placeName;
            const picture = feed.picture;

            // subscribe
            if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
                const newFeed = this.feedList.get(feedId);
                newFeeds.push(newFeed);
            } else {
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

                // subscribe post
                this.subscribeToPost(placeId, feedId);

                // subscribe count
                this.subscribeToPlace(placeId);
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

        console.log('SavedMain', 'loading feeds done!');

        // this.setState({ isLoadingFeeds: false, loadingType: 0 });
        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false, loadingType: 0 });
        }, 250);
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
                            // alignSelf: 'flex-start',
                            marginLeft: 16
                        }}
                    >
                        {'Saved'}
                    </Text>
                </View>
                <FlatList
                    ref={(fl) => {
                        this._flatList = fl;
                        SavedMain.__flatList = fl;
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
                    keyExtractor={item => item.placeId}
                    renderItem={({ item, index }) => {
                        const placeName = item.placeName;
                        const feedsSize = item.feeds.length;

                        return (
                            <TouchableWithoutFeedback
                                onPress={async () => {
                                    this.props.navigation.navigate("savedPlace", { feeds: item.feeds });
                                }}
                            >
                                <View style={styles.pictureContainer}>
                                    <SmartImage
                                        style={styles.picture}
                                        showSpinner={false}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={item.picture}
                                    />
                                    <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                        <Text style={styles.feedItemText}>{placeName}
                                            <Text style={[styles.feedItemText, { color: Theme.color.text3 }]}> {feedsSize}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        );





                        /*
                        // placeName
                        let placeName = item.placeName;
                        placeName = Util.getPlaceName(placeName);

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
                        */
                    }}
                    // onEndReachedThreshold={0.5}
                    // onEndReached={this.handleScrollEnd}
                    onScroll={({ nativeEvent }) => {
                        if (!this.focused) return;

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

                        // ToDo: render design
                        // !this.state.isLoadingFeeds &&
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                color: Theme.color.text2,
                                fontSize: 24,
                                paddingTop: 4,
                                fontFamily: "Chewy-Regular"
                            }}>No selected girls</Text>

                            <Text style={{
                                marginTop: 10,
                                color: Theme.color.text3,
                                fontSize: 18,
                                fontFamily: "Chewy-Regular"
                            }}>Start exploring girls for your next trip</Text>

                            <TouchableOpacity
                                onPress={() => {
                                    setTimeout(() => {
                                        // Consider: set scroll position 0

                                        // !this.closed && this.props.navigation.navigate("intro");
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
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
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
        fontSize: 18,
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
