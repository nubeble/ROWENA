// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image, StatusBar, Platform, BackHandler, NetInfo, Animated
} from "react-native";
import { Header } from 'react-navigation';
import { Svg, Constants, Location, Permissions, Linking } from "expo";
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { inject, observer } from "mobx-react/native";
// import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import { FontAwesome, AntDesign, Ionicons } from 'react-native-vector-icons';
import Firebase from './Firebase';
import SmartImage from "./rnff/src/components/SmartImage";
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import _ from 'lodash';
import { RefreshIndicator } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
import Toast, { DURATION } from 'react-native-easy-toast';

/*
type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};
*/

const DEFAULT_PLACE_COUNT = 6;
const DEFAULT_FEED_COUNT = 6;

// 1:1 image
const imageWidth = (Dimensions.get('window').width - 4 * 2 * 3) / 2;
const imageHeight = imageWidth;

// 3:2 image
const itemWidth = Dimensions.get('window').width - 40;
const itemHeight = (Dimensions.get('window').width - 40) / 3 * 2;

/*
const skeletonViewWidth = Dimensions.get('window').width;
const skeletonViewHeight = (4 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 4) * 3;
*/


// @inject("feedStore", "profileStore") @observer
// export default class Intro extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
export default class Intro extends React.Component {
    static places = [];
    static popularFeeds = [];
    static recentFeeds = [];

    static feedCountList = new Map();

    static popularFeedsUnsubscribes = []; // Consider: unsubscribe?
    static recentFeedsUnsubscribes = []; // Consider: unsubscribe?

    static countsUnsubscribes = []; // Consider: unsubscribe?

    state = {
        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        // renderList: false,

        // set the initial places (DEFAULT_PLACE_COUNT)
        places: [
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'one'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'two'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'three'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'four'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'five'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'six'
            }
        ],
        popularFeeds: [],
        recentFeeds: [],

        searchText: '',
        refreshing: false
    };

    static final() {
        console.log('Intro.final');

        Intro.places = [];
        Intro.popularFeeds = [];
        Intro.recentFeeds = [];
        Intro.feedCountList = new Map();

        for (var i = 0; i < Intro.popularFeedsUnsubscribes.length; i++) {
            const instance = Intro.popularFeedsUnsubscribes[i];
            instance();
        }
        Intro.popularFeedsUnsubscribes = [];

        for (var i = 0; i < Intro.recentFeedsUnsubscribes.length; i++) {
            const instance = Intro.recentFeedsUnsubscribes[i];
            instance();
        }
        Intro.recentFeedsUnsubscribes = [];

        for (var i = 0; i < Intro.countsUnsubscribes.length; i++) {
            const instance = Intro.countsUnsubscribes[i];
            instance();
        }
        Intro.countsUnsubscribes = [];
    }

    // --
    componentWillMount() {
        if (Platform.OS === 'android' && !Constants.isDevice) {
            console.log('Oops, this will not work on Sketch in an Android emulator. Try it on your device!');
        } else {
            this._getLocationAsync();
        }
    }

    _getLocationAsync = async () => {
        // console.log('Intro._getLocationAsync');
        const { status: existingStatus } = await Permissions.getAsync(Permissions.LOCATION);
        // console.log('Intro._getLocationAsync, existingStatus', existingStatus);
        if (existingStatus !== "granted") {
            const { status } = await Permissions.askAsync(Permissions.LOCATION);
            // console.log('Intro._getLocationAsync, status', status);
            if (status !== 'granted') {
                console.log('Permission to access location was denied.');
                /*
                const url = 'app-settings:';
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    Linking.openURL(url);
                }
                */
                return;
            }
        }

        let location = await Location.getCurrentPositionAsync({});
        console.log('Intro._getLocationAsync, location', JSON.stringify(location));
        // {"timestamp":1557984891181,"mocked":false,"coords":{"heading":0,"longitude":127.024578,"speed":0,"altitude":101.0999984741211,"latitude":37.4652717,"accuracy":17.857999801635742}}
        Vars.location = location;
    };
    // --

    async componentDidMount() {
        console.log('Intro.componentDidMount');
        console.log('uid', Firebase.user().uid);
        console.log('width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        console.log('height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.networkListener = NetInfo.addEventListener('connectionChange', this.handleConnectionChange);

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
        */

        if (Intro.places.length === 0) this.getPlaces();

        this.getPopularFeeds();
        this.getRecentFeeds();
    }

    async initFromSearch(result) {
        console.log('Intro.initFromSearch', result);

        // get city, country
        let name = result.description;
        /*
        const words = name.split(', ');
        if (words.length > 1) {
            city = words[0];
            country = words[words.length - 1];
            name = city + ', ' + country;
        }
        */

        // load length from database (no need to subscribe!)
        const placeDoc = await Firebase.firestore.collection("place").doc(result.place_id).get();
        let count = 0;
        if (placeDoc.exists) {
            let field = placeDoc.data().count;
            if (field) count = field;
        }

        // console.log('count', count);

        const place = {
            name: name,
            place_id: result.place_id,
            length: count,

            // location: result.location
            lat: result.location.lat,
            lng: result.location.lng
        }

        // setTimeout(() => {
        this.props.navigation.navigate("home", { place: place });
        // }, Cons.buttonTimeoutShort);
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        return true;
    }

    @autobind
    async onFocus() {
        Vars.currentScreenName = 'Intro';

        // update
        // console.log('update Intro state post', Vars.updatedPostsForIntro.length);

        /*
        if (Vars.updatedPostsForIntro.length > 0) {

            let popularFeeds = [...this.state.popularFeeds];
            if (popularFeeds.length === 0) {
                popularFeeds = Intro.popularFeeds;
            }

            let recentFeeds = [...this.state.recentFeeds];
            if (recentFeeds.length === 0) {
                recentFeeds = Intro.recentFeeds;
            }

            for (var i = 0; i < Vars.updatedPostsForIntro.length; i++) {
                const newPost = Vars.updatedPostsForIntro[i];
                // console.log('onFocus newPost', newPost.placeId, newPost.id);

                // search (popular feeds)
                let index = popularFeeds.findIndex(el => el.placeId === newPost.placeId && el.id === newPost.id);
                if (index !== -1) {
                    // set
                    popularFeeds[index] = newPost;
                    Intro.popularFeeds[index] = newPost;
                    // console.log('Intro.popularFeeds[index]', Intro.popularFeeds[index]);
                }

                // search (recent feeds)
                index = recentFeeds.findIndex(el => el.placeId === newPost.placeId && el.id === newPost.id);
                if (index !== -1) {
                    // set
                    recentFeeds[index] = newPost;
                    Intro.recentFeeds[index] = newPost;
                    // console.log('Intro.recentFeeds[index]', Intro.recentFeeds[index]);
                }
            }

            !this.closed && this.setState({ popularFeeds, recentFeeds });

            Vars.updatedPostsForIntro = []; // for cleaning
        }
        */

        // -- update the post that user clicked a like button
        /*
        const _post = Vars.toggleButtonPressedPost;
        if (_post) {
            // reload
            const feedDoc = await Firebase.firestore.collection("place").doc(_post.placeId).collection("feed").doc(_post.feedId).get();
            let feed;
            if (feedDoc.exists) {
                feed = feedDoc.data();
            } else {
                // removed
                feed = undefined;
            }

            // search (popular feeds)
            let popularFeeds = [...this.state.popularFeeds];
            let index = popularFeeds.findIndex(el => el.placeId === _post.placeId && el.id === _post.feedId);
            if (index !== -1) {
                // set
                popularFeeds[index] = feed;
                !this.closed && this.setState({ popularFeeds });
                Intro.popularFeeds[index] = feed;
            }

            // search (recent feeds)
            let recentFeeds = [...this.state.recentFeeds];
            index = recentFeeds.findIndex(el => el.placeId === _post.placeId && el.id === _post.feedId);
            if (index !== -1) {
                // set
                recentFeeds[index] = feed;
                !this.closed && this.setState({ recentFeeds });
                Intro.recentFeeds[index] = feed;
            }

            Vars.toggleButtonPressedPost = null;
        }
        */
        // --
    }

    componentWillUnmount() {
        console.log('Intro.componentWillUnmount');

        this.onFocusListener.remove();
        this.hardwareBackPressListener.remove();
        this.networkListener.remove();

        this.closed = true;
    }

    @autobind
    handleConnectionChange(connectionInfo) {
        if (connectionInfo.type === 'none') {
            // disconnected
            this.showNotification('You are currently offline.');

            // ToDo: stop
        } else if (connectionInfo.type !== 'none') {
            // connected
            this.showNotification('You are connected again.');

            // ToDo: resume
        }
    }

    /*
    async getPlacesSize() {
        let places = this.state.places;

        const ref1 = Firebase.firestore.collection("place").doc(places[0].place_id);
        const ref2 = Firebase.firestore.collection("place").doc(places[1].place_id);
        const ref3 = Firebase.firestore.collection("place").doc(places[2].place_id);
        const ref4 = Firebase.firestore.collection("place").doc(places[3].place_id);
        const ref5 = Firebase.firestore.collection("place").doc(places[4].place_id);
        const ref6 = Firebase.firestore.collection("place").doc(places[5].place_id);

        let count1 = 0, count2 = 0, count3 = 0, count4 = 0, count5 = 0, count6 = 0;

        await Firebase.firestore.runTransaction(transaction => {
            return new Promise(resolve => {
                const t1 = transaction.get(ref1);
                const t2 = transaction.get(ref2);
                const t3 = transaction.get(ref3);
                const t4 = transaction.get(ref4);
                const t5 = transaction.get(ref5);
                const t6 = transaction.get(ref6);

                const all = Promise.all([t1, t2, t3, t4, t5, t6]);
                all.then(docs => {
                    doc1 = docs[0];
                    doc2 = docs[1];
                    doc3 = docs[2];
                    doc4 = docs[3];
                    doc5 = docs[4];
                    doc6 = docs[5];

                    if (doc1.exists) count1 = doc1.data().count;
                    if (doc2.exists) count2 = doc2.data().count;
                    if (doc3.exists) count3 = doc3.data().count;
                    if (doc4.exists) count4 = doc4.data().count;
                    if (doc5.exists) count5 = doc5.data().count;
                    if (doc6.exists) count6 = doc6.data().count;

                    resolve(true);
                });
            });
        });

        console.log(count1, count2, count3, count4, count5, count6);

        places[0].length = count1;
        places[1].length = count2;
        places[2].length = count3;
        places[3].length = count4;
        places[4].length = count5;
        places[5].length = count6;

        this.setState({ places, refreshing: false });
    }
    */

    /*
    getPlacesSize() { // load feed length of each cities
        let __places = this.state.places;

        for (var i = 0; i < __places.length; i++) {
            let placeId = __places[i].place_id;

            this.unsubscribeToPlaceSize = Firebase.subscribeToPlaceSize(placeId, (count) => {
                let places = [...this.state.places];
                let index = places.findIndex(el => el.place_id === placeId); // snap.id
                if (index !== -1) {
                    console.log('watchPlaceSize', index, count);

                    places[index] = { ...places[index], length: count };
                    !this.closed && this.setState({ places });
                }
            });

            // if (this.state.refreshing) !this.closed && this.setState({ refreshing: false });
        }
    }
    */

    async getPlaces() {
        const size = DEFAULT_PLACE_COUNT;

        const snap = await Firebase.firestore.collection("place").orderBy("count", "desc").limit(size).get();
        if (snap.size > 0) {
            let places = [...this.state.places];

            var index = 0;

            snap.forEach(async (doc) => {
                if (doc.exists) {
                    // console.log(doc.id, '=>', doc.data());
                    const data = doc.data();
                    if (data.count > 0) {
                        const uri = await Firebase.getPlaceRandomFeedImage(doc.id);

                        places[index] = {
                            // ...places[index],
                            place_id: doc.id,
                            length: data.count,
                            name: data.name,
                            uri,
                            lat: data.lat,
                            lng: data.lng,
                            key: doc.id
                        };

                        index++;

                        if (index === snap.docs.length) {
                            Intro.places = places;
                            !this.closed && this.setState({ places });
                        }
                    }
                }
            });
        }
    }

    async getPopularFeeds() {
        if (Intro.popularFeeds.length > 0) return;

        const size = DEFAULT_FEED_COUNT;
        let placeList = [];
        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            if (placeId) placeList.push(placeId);
        }
        placeList.sort();

        let prevItem = null;
        let array = {}; // map Object
        /*
            array = {
                key (placeId) : value (count)
            };
        */

        for (var i = 0; i < placeList.length; i++) {
            const item = placeList[i]; // placeId
            if (!item) continue;

            if (item === prevItem) {
                array[item]++;
            } else {
                // new item
                array[item] = 1;
                prevItem = item;
            }
        }

        // console.log('array', array);

        let popularFeeds = [...this.state.popularFeeds];
        let index = 0;

        // map search
        for (key in array) {
            var value = array[key]; // count
            // console.log(key + ":" + value);

            const feeds = await Firebase.getFeedByAverageRating(key, value); // feeds.length could not be the same as value

            for (var i = 0; i < feeds.length; i++) {
                const feed = feeds[i];

                popularFeeds[index] = feed;

                index++;
            }
        }

        !this.closed && this.setState({ popularFeeds });
        Intro.popularFeeds = popularFeeds;

        // subscribe here (post)
        for (var i = 0; i < popularFeeds.length; i++) {
            const feed = popularFeeds[i];

            const fi = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                if (newFeed === undefined) { // newFeed === undefined if removed
                    // console.log('!!!!! post removed !!!!!!');

                    // nothing to do here.
                    return;
                }

                let _popularFeeds = [...this.state.popularFeeds];
                const index = _popularFeeds.findIndex(item => item.placeId === newFeed.placeId && item.id === newFeed.id); // snap.id
                if (index !== -1) {
                    console.log('popularFeeds[', index, '] changed.');
                    _popularFeeds[index] = newFeed;
                    !this.closed && this.setState({ popularFeeds: _popularFeeds });

                    Intro.popularFeeds[index] = newFeed;
                }
            });

            Intro.popularFeedsUnsubscribes.push(fi);

            // subscribe here (count)
            // --
            const ci = Firebase.subscribeToPlace(feed.placeId, newPlace => {
                if (newPlace === undefined) {
                    Intro.feedCountList.delete(feed.placeId);

                    return;
                }

                // update Intro.feedCountList
                Intro.feedCountList.set(feed.placeId, newPlace.count);
            });

            Intro.countsUnsubscribes.push(ci);
            // --
        }
    }

    async getRecentFeeds() {
        if (Intro.recentFeeds.length > 0) return;

        const size = DEFAULT_FEED_COUNT;
        let placeList = [];
        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            if (placeId) placeList.push(placeId);
        }
        placeList.sort();

        let prevItem = null;
        let array = {};
        for (var i = 0; i < placeList.length; i++) {
            const item = placeList[i];
            if (!item) continue;

            if (item === prevItem) {
                array[item]++;
            } else {
                // new item
                array[item] = 1;
                prevItem = item;
            }
        }

        // console.log('array', array);

        let recentFeeds = [...this.state.recentFeeds];
        let index = 0;

        // map search
        for (key in array) {
            var value = array[key];
            // console.log(key + ":" + value);

            const feeds = await Firebase.getFeedByTimestamp(key, value);

            for (var i = 0; i < feeds.length; i++) {
                const feed = feeds[i];

                recentFeeds[index] = feed;

                index++;
            }
        }

        !this.closed && this.setState({ recentFeeds });
        Intro.recentFeeds = recentFeeds;

        // subscribe here (post)
        for (var i = 0; i < recentFeeds.length; i++) {
            const feed = recentFeeds[i];

            const fi = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                if (newFeed === undefined) { // newFeed === undefined if removed
                    // console.log('!!!!! post removed !!!!!!');

                    // nothing to do here.
                    return;
                }

                let _recentFeeds = [...this.state.recentFeeds];
                const index = _recentFeeds.findIndex(item => item.placeId === newFeed.placeId && item.id === newFeed.id); // snap.id
                if (index !== -1) {
                    console.log('recentFeeds[', index, '] changed.');
                    _recentFeeds[index] = newFeed;
                    !this.closed && this.setState({ recentFeeds: _recentFeeds });

                    Intro.recentFeeds[index] = newFeed;
                }
            });

            Intro.recentFeedsUnsubscribes.push(fi);

            // subscribe here (count)
            // --
            const ci = Firebase.subscribeToPlace(feed.placeId, newPlace => {
                if (newPlace === undefined) {
                    Intro.feedCountList.delete(feed.placeId);

                    return;
                }

                // update Intro.feedCountList
                Intro.feedCountList.set(feed.placeId, newPlace.count);
            });

            Intro.countsUnsubscribes.push(ci);
            // --
        }
    }

    openSearch() {
        setTimeout(() => {
            this.props.navigation.navigate("search", { from: 'Intro', initFromSearch: (result) => this.initFromSearch(result) });
        }, Cons.buttonTimeoutShort);
    }

    render(): React.Node {
        // const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={styles.flex}>
                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.searchBar}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: Theme.color.component,
                        borderRadius: 25
                    }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 2, top: (34 - 30) / 2, width: 30, height: 30, justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.openSearch();
                            }}
                        >
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                this.openSearch();
                            }}
                        >
                            <Text
                                style={{
                                    width: '100%', height: '100%', fontSize: 16, fontFamily: "Roboto-Medium",
                                    // paddingTop: Cons.searchBarPaddingTop(),
                                    paddingTop: 3,
                                    color: "rgb(160, 160, 160)", textAlign: 'center'
                                }}
                                numberOfLines={1}
                            >{'Where to?'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {
                    // this.state.renderList &&
                    <FlatList
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                {/*
                                <View style={[styles.titleContainer, { paddingBottom: 12 }]}>
                                    <Text style={styles.title}>{'Popular destinations'}</Text>
                                </View>
                                */}
                                <View style={{ paddingHorizontal: Theme.spacing.small, paddingTop: Theme.spacing.tiny, paddingBottom: 12 }}>
                                    <Text style={styles.title}>{'Popular destinations'}</Text>
                                </View>
                            </View>
                        }

                        /*
                        ListEmptyComponent={
                            <View>
                                <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton} secondaryColor="grey" width={skeletonViewWidth} height={skeletonViewHeight}>
                                    <Svg.Rect
                                        x={8}
                                        y={8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />

                                    <Svg.Rect
                                        x={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        y={8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />

                                    <Svg.Rect
                                        x={8}
                                        y={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />

                                    <Svg.Rect
                                        x={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        y={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />

                                    <Svg.Rect
                                        x={8}
                                        y={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />

                                    <Svg.Rect
                                        x={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        y={8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                        width={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                        height={(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    />
                                </SvgAnimatedLinearGradient>
                            </View>
                        }
                        */

                        columnWrapperStyle={styles.columnWrapperStyle}
                        numColumns={2}
                        data={this.state.places}
                        // keyExtractor={item => item.place_id}
                        keyExtractor={item => item.key}

                        renderItem={({ item, index }) => {
                            let place = null;
                            let place_id = null;
                            let length = 0;
                            let name = null;
                            let city = '';
                            let country = '';
                            let imageUri = null;

                            place_id = item.place_id;
                            if (place_id) {
                                place = item;
                                length = place.length;
                                name = place.name;

                                // get city, country
                                const words = name.split(', ');
                                if (words.length > 1) {
                                    city = words[0];
                                    country = words[words.length - 1];
                                } else {
                                    city = name;
                                }

                                imageUri = place.uri;
                            } else {
                                // use static value
                                place = Intro.places[index];
                                if (place) {
                                    place_id = place.place_id;
                                    length = place.length;
                                    name = place.name;

                                    // get city, country
                                    if (name) {
                                        const words = name.split(', ');
                                        if (words.length > 1) {
                                            city = words[0];
                                            country = words[words.length - 1];
                                        } else {
                                            city = name;
                                        }
                                    }

                                    imageUri = place.uri;
                                } else {
                                    // nothing to do
                                }
                            }

                            if (!place_id) {
                                return (
                                    <View style={styles.pictureContainer}>
                                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={imageWidth} height={imageHeight}>
                                            <Svg.Rect
                                                x={0}
                                                y={0}
                                                width={imageWidth}
                                                height={imageHeight}
                                            />
                                        </SvgAnimatedLinearGradient>
                                    </View>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    onPress={async () => {
                                        // load length from database (no need to subscribe!)
                                        const placeDoc = await Firebase.firestore.collection("place").doc(place.place_id).get();
                                        let count = 0;
                                        if (placeDoc.exists) {
                                            let field = placeDoc.data().count;
                                            if (field) count = field;
                                        }

                                        let newPlace = _.clone(place);
                                        newPlace.length = count;

                                        // setTimeout(() => {
                                        this.props.navigation.navigate("home", { place: newPlace });
                                        // }, Cons.buttonTimeoutShort);
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        <Image
                                            style={styles.picture}
                                            source={{ uri: imageUri }}
                                            fadeDuration={0}
                                        />
                                        <View style={styles.content}>
                                            <Text style={{
                                                // backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: 20,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1

                                            }}>{city}</Text>
                                            <Text style={{
                                                marginTop: 8,
                                                // backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: 20,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1
                                            }}>{country}</Text>

                                            <Text style={{
                                                marginTop: 8,
                                                // backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.subtitle,
                                                fontSize: 14,
                                                fontFamily: "Roboto-Medium",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1
                                            }}>{`${(length > 0) ? length + '+ girls' : ''}`}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}

                        ListFooterComponent={
                            <View style={{ marginTop: 20, marginBottom: 8 }}>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>{'Top-rated girls'}</Text>
                                </View>
                                {
                                    this.renderPopularFeeds()
                                }
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>{'Recently posted girls'}</Text>
                                </View>
                                {
                                    this.renderRecentFeeds()
                                }
                            </View>
                        }

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}
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
    } // end of render()

    renderPopularFeeds() {
        // very first loading
        if (this.state.popularFeeds.length === 0 && Intro.popularFeeds.length === 0) {
            // show indicator
            return (
                /*
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    backgroundColor: 'black',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <RefreshIndicator />
                </View>
                */
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    // backgroundColor: 'black',
                    // justifyContent: 'center', alignItems: 'center'
                }}>
                    <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={itemWidth} height={itemHeight}>
                        <Svg.Rect
                            x={0}
                            y={0}
                            width={itemWidth}
                            height={itemHeight}
                        />
                    </SvgAnimatedLinearGradient>
                    {/*
                    <View style={{
                        width: itemWidth, height: itemHeight,
                        position: 'absolute', top: 0, left: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <RefreshIndicator />
                    </View>
                    */}
                </View>
            );
        }

        // second loading
        let feeds = [];
        if (this.state.popularFeeds.length === 0 && Intro.popularFeeds.length !== 0) {
            feeds = Intro.popularFeeds;
        } else {
            feeds = this.state.popularFeeds;
        }


        let pictures = [];

        for (var i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            if (i === 0) {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_front}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_rear}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_middle}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            }
        }

        if (pictures.length === 0) {
            pictures.push(
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    backgroundColor: 'black',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    {/*
                        ToDo: draw a character avatar
                    */}
                </View>
            );
        }

        return (
            <Carousel
                onPageChanged={(page) => {
                    console.log('Intro.renderPopularFeeds, current page', page);
                }}
            >
                {pictures}
            </Carousel>
        );
    }

    renderRecentFeeds() {
        // very first loading
        if (this.state.recentFeeds.length === 0 && Intro.recentFeeds.length === 0) {
            // show indicator
            return (
                /*
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    backgroundColor: 'black',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <RefreshIndicator />
                </View>
                */
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    // backgroundColor: 'black',
                    // justifyContent: 'center', alignItems: 'center'
                }}>
                    <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={itemWidth} height={itemHeight}>
                        <Svg.Rect
                            x={0}
                            y={0}
                            width={itemWidth}
                            height={itemHeight}
                        />
                    </SvgAnimatedLinearGradient>
                    {/*
                    <View style={{
                        width: itemWidth, height: itemHeight,
                        position: 'absolute', top: 0, left: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <RefreshIndicator />
                    </View>
                    */}
                </View>
            );
        }

        // second loading
        let feeds = [];
        if (this.state.recentFeeds.length === 0 && Intro.recentFeeds.length !== 0) {
            feeds = Intro.recentFeeds;
        } else {
            feeds = this.state.recentFeeds;
        }


        let pictures = [];

        for (var i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            if (i === 0) {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_front}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_rear}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else {
                feed && pictures.push(
                    <View key={feed.id} style={styles.view_middle}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            }
        }

        if (pictures.length === 0) {
            pictures.push(
                <View style={{
                    width: itemWidth, height: itemHeight, marginHorizontal: 20, borderRadius: 2,
                    marginBottom: Theme.spacing.base,
                    backgroundColor: 'black',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    {/*
                        ToDo: draw a character avatar
                    */}
                </View>
            );
        }

        return (
            <Carousel
                onPageChanged={(page) => {
                    console.log('Intro.renderRecentFeeds, current page', page);
                }}
            >
                {pictures}
            </Carousel>
        );
    }

    renderFeedItem(feed) {
        // placeName
        let placeName = feed.placeName;
        const words = placeName.split(', ');
        if (words.length > 2) {
            const city = words[0];
            const country = words[words.length - 1];
            placeName = city + ', ' + country;
        }

        // defaultRating, averageRating
        const averageRating = feed.averageRating;

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        return (
            <TouchableOpacity activeOpacity={1.0}
                onPress={async () => {
                    // console.log('onpress', feed.placeId, feed.id);

                    const feedSize = this.getFeedSize(feed.placeId);
                    if (feedSize === 0) {
                        this.refs["toast"].show('Please try again.', 500);

                        return;
                    }

                    const extra = {
                        feedSize: feedSize
                    };

                    this.props.navigation.navigate("introPost", { post: feed, extra: extra });
                }}
            >
                <SmartImage
                    style={styles.item}
                    showSpinner={false}
                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                    uri={feed.pictures.one.uri}
                />
                <View style={[{ paddingLeft: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                    <Text style={styles.feedItemText}>{feed.name}</Text>
                    <Text style={styles.feedItemText}>{placeName}</Text>
                    {
                        feed.reviewCount > 0 ?
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
                                    <Text style={styles.reviewCount}>{feed.reviewCount}</Text>
                                </View>
                            </View>
                            :
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
                </View>
            </TouchableOpacity>
        );
    }

    getFeedSize(placeId) {
        /*
        if (Intro.feedCountList.has(placeId)) {
            return Intro.feedCountList.get(placeId);
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        if (!placeDoc.exists) return 0;

        const count = placeDoc.data().count;

        Intro.feedCountList.set(placeId, count);

        // subscribe here
        // --
        const instance = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                Intro.feedCountList.delete(placeId);

                return;
            }

            // update Intro.feedCountList
            Intro.feedCountList.set(placeId, newPlace.count);
        });

        Intro.countsUnsubscribes.push(instance);
        // --
        */

        let count = 0;
        if (Intro.feedCountList.has(placeId)) {
            count = Intro.feedCountList.get(placeId);
        }

        return count;
    }

    handleRefresh = async () => {
        !this.closed && this.setState({ refreshing: true });

        await this.getPlaces();

        !this.closed && this.setState({ refreshing: false });
    }

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
        }

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: Constants.statusBarHeight + 6,
                            duration: 200
                        })
                    ])
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        this._showNotification = false;
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    contentContainer: {
        flexGrow: 1
    },
    columnWrapperStyle: {
        flex: 1,
        justifyContent: 'center'
    },
    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    pictureContainer: {
        width: imageWidth,
        height: imageHeight,
        // borderRadius: 2,
        marginVertical: 4,
        marginHorizontal: 4
    },
    picture: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    },
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 2,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
        // justifyContent: 'flex-end'
    },
    view_front: {
        backgroundColor: 'black',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        marginLeft: 20,
        marginRight: 5
    },
    view_middle: {
        backgroundColor: 'black',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        marginLeft: 5,
        marginRight: 5
    },
    view_rear: {
        backgroundColor: 'black',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        marginLeft: 5,
        marginRight: 20
    },
    item: {
        width: '100%',
        height: '100%',
        borderRadius: 2
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
    },
    notification: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        height: (8 + 34 + 8) - 12,
        borderRadius: 5,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.notification,
        zIndex: 10000,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    notificationText: {
        width: Dimensions.get('window').width - (12 + 24) * 2, // 12: margin right, 24: button width
        fontSize: 15,
        lineHeight: 17,
        fontFamily: "Roboto-Medium",
        color: "black",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
