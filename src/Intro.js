// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image, Platform, BackHandler, Animated, AsyncStorage, StatusBar
} from "react-native";
import { Header } from 'react-navigation';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import { FontAwesome, AntDesign, Ionicons } from 'react-native-vector-icons';
import Firebase from './Firebase';
import SmartImage from "./rnff/src/components/SmartImage";
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
// import _ from 'lodash';
import { RefreshIndicator } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
import Util from './Util';
import { LinearGradient } from 'expo-linear-gradient';
import Dialog from "react-native-dialog";
import { subscribeToTopic, unsubscribeToTopic, sendPushNotificationToTopic } from './PushNotifications';

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_PLACE_COUNT = 6;
const DEFAULT_FEED_COUNT = 6;

// 1:1 image
const imageWidth = (Dimensions.get('window').width - 4 * 2 * 3) / 2;
// const imageHeight = imageWidth;

// 3:2 image
const itemWidth = Dimensions.get('window').width - 40;
const itemHeight = (Dimensions.get('window').width - 40) / 3 * 2;

/*
const skeletonViewWidth = Dimensions.get('window').width;
const skeletonViewHeight = (4 + (Dimensions.get('window').width - 4 * 2 * 3) / 2 + 4) * 3;
*/


@inject("profileStore")
@observer
export default class Intro extends React.Component<InjectedProps> {
    // static __flatList = null;

    static places = [];
    static popularFeeds = [];
    static recentFeeds = [];

    static feedList = new Map();
    static feedCountList = new Map();

    // do not unsibscribe except logout
    // --
    static popularFeedsUnsubscribes = [];
    static recentFeedsUnsubscribes = [];

    static countsUnsubscribes = [];
    // --

    state = {
        notification: '',

        // set the initial places (DEFAULT_PLACE_COUNT)
        places: [
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'one',
                newPostAdded: undefined
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'two',
                newPostAdded: undefined
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'three',
                newPostAdded: undefined
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'four',
                newPostAdded: undefined
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'five',
                newPostAdded: undefined
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                lat: 0,
                lng: 0,
                key: 'six',
                newPostAdded: undefined
            }
        ],
        popularFeeds: [],
        recentFeeds: [],

        searchText: '',
        refreshing: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    static final() {
        Intro.places = [];
        Intro.popularFeeds = [];
        Intro.recentFeeds = [];

        Intro.feedList = new Map();
        Intro.feedCountList = new Map();

        for (let i = 0; i < Intro.popularFeedsUnsubscribes.length; i++) {
            const instance = Intro.popularFeedsUnsubscribes[i];
            instance();
        }
        Intro.popularFeedsUnsubscribes = [];

        for (let i = 0; i < Intro.recentFeedsUnsubscribes.length; i++) {
            const instance = Intro.recentFeedsUnsubscribes[i];
            instance();
        }
        Intro.recentFeedsUnsubscribes = [];

        for (let i = 0; i < Intro.countsUnsubscribes.length; i++) {
            const instance = Intro.countsUnsubscribes[i];
            instance();
        }
        Intro.countsUnsubscribes = [];
    }

    reload() {
        this.getPlaces();
        this.getFeeds();
    }

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);
    }

    componentWillMount() {
        Util.initTranslator();

        if (!Vars.location) {
            if (Platform.OS === 'android' && !Constants.isDevice) {
                console.log('jdub', 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!');
            } else {
                this._getLocationAsync();
            }
        }

        /*
        if (!Vars.distanceUnit) {
            this._getDistanceUnit();
        }
        */
    }

    _getLocationAsync = async () => {
        await this.loadLocation();

        // console.log('jdub', 'Intro._getLocationAsync');
        const { status: existingStatus } = await Permissions.getAsync(Permissions.LOCATION);
        // console.log('jdub', 'Intro._getLocationAsync, existingStatus', existingStatus);
        if (existingStatus !== "granted") {
            const { status } = await Permissions.askAsync(Permissions.LOCATION);
            // console.log('jdub', 'Intro._getLocationAsync, status', status);
            if (status !== 'granted') {
                console.log('jdub', 'Permission to access location was denied.');

                await Util.openSettings("LOCATION");
                return;
            }
        }

        const location = await Location.getCurrentPositionAsync({});
        // console.log('jdub', 'Intro._getLocationAsync, location', JSON.stringify(location));
        // {"timestamp":1557984891181,"mocked":false,"coords":{"heading":0,"longitude":127.024578,"speed":0,"altitude":101.0999984741211,"latitude":37.4652717,"accuracy":17.857999801635742}}

        if (location) {
            Vars.location = location;

            await this.saveLocation(location);
        }
    };

    async loadLocation() {
        // set the previous location to the global value
        let latitude = null;
        let longitude = null;

        const keys = ['LOCATION_LAT', 'LOCATION_LNG'];
        const stores = await this._retrieveMultiData(keys);
        stores.map((result, i, store) => {
            const key = store[i][0];
            const value = store[i][1];

            if (key === 'LOCATION_LAT') {
                if (value) latitude = JSON.parse(value);
            } else if (key === 'LOCATION_LNG') {
                if (value) longitude = JSON.parse(value);
            }
        });

        if (latitude && longitude) {
            const location = {
                coords: {
                    latitude, longitude
                }
            };

            Vars.location = location;
        }
    }

    async saveLocation(location) {
        if (location) {
            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            let data = [];
            data.push(['LOCATION_LAT', latitude.toString()]);
            data.push(['LOCATION_LNG', longitude.toString()]);
            await this._storeMultiData(data);
        }
    }

    /*
    _getDistanceUnit() {
        this.profileInterval = setInterval(() => {
            const { profile } = this.props.profileStore;
            if (profile) {
                // stop profile timer
                if (this.profileInterval) {
                    clearInterval(this.profileInterval);
                    this.profileInterval = null;
                }

                const place = profile.place;
                if (place) {
                    const country = Util.getCountry(place);
                    if (country === 'USA' || country === 'Myanmar (Burma)' || country === 'Liberia') { // ToDo: add more countries
                        Vars.distanceUnit = 'mile';
                        console.log('jdub', 'mile unit');
                    } else {
                        Vars.distanceUnit = 'meter';
                        console.log('jdub', 'meter unit');
                    }
                } else {
                    Vars.distanceUnit = 'meter';
                    console.log('jdub', 'meter unit');
                }
            }
        }, 100); // 0.1 sec
    }
    */

    componentDidMount() {
        console.log('jdub', 'Intro.componentDidMount');

        this.props.navigation.setParams({
            scrollToTop: () => {
                this._flatList.scrollToOffset({ offset: 0, animated: true });
            },
            /*
            final: () => {
                this.final();
            },
            */
            reload: () => {
                this.reload();
            }
        });

        console.log('jdub', 'uid', Firebase.user().uid);
        console.log('jdub', 'width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        console.log('jdub', 'height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        StatusBar.setHidden(false);

        if (Intro.places.length === 0) this.getPlaces();
        this.getFeeds();
    }

    componentWillUnmount() {
        // console.log('jdub', 'Intro.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        // stop profile timer
        if (this.profileInterval) {
            clearInterval(this.profileInterval);
            this.profileInterval = null;
        }

        this.closed = true;
    }

    async initFromSearch(result) {
        console.log('jdub', 'Intro.initFromSearch', result);

        let name = result.description;
        // name = Util.getPlaceName(name); // city + country

        let count = 0;
        let placeCounts = null;

        const feedSize = this.getPlaceCount(result.place_id, Vars.showMe);
        if (feedSize === null) {
            this.showToast('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed or not exists

            // load count from database (then subscribe)
            const placeDoc = await Firebase.firestore.collection("places").doc(result.place_id).get();
            if (!placeDoc.exists) {
                // nothing to do here
            } else {
                let place = placeDoc.data();

                count = this._getPlaceCount(place, Vars.showMe);
                const counts = {
                    count: place.count,
                    men: place.men,
                    women: place.women
                };
                placeCounts = counts;

                // subscribe feed count
                // no need to subscribe for now
                // this.subscribeToPlace(result.place_id);
            }
        } else {
            count = feedSize;
            placeCounts = this.getPlaceCounts(result.place_id);
        }

        subscribeToTopic(result.place_id);

        const place = {
            name: name,
            place_id: result.place_id,
            length: count,
            placeCounts,

            // location: result.location
            lat: result.location.lat,
            lng: result.location.lng
        };

        this.props.navigation.navigate("home", { place: place });
    }

    @autobind
    handleHardwareBackPress() {
        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        BackHandler.exitApp();

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'Intro';

        this.searchText = "Try \"" + Util.getRandomCity() + "\"";
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;
    }

    async getPlaces() {
        const size = DEFAULT_PLACE_COUNT;

        let snap = null;
        if (Vars.showMe === 'Men') {
            snap = await Firebase.firestore.collection("places").orderBy("men", "desc").limit(size).get();
        } else if (Vars.showMe === 'Women') {
            snap = await Firebase.firestore.collection("places").orderBy("women", "desc").limit(size).get();
        } else { // Everyone
            snap = await Firebase.firestore.collection("places").orderBy("count", "desc").limit(size).get();
        }

        let places = [...this.state.places];
        let index = 0;

        snap.forEach(async (doc) => {
            const placeId = doc.id;
            const place = doc.data();

            const count = this._getPlaceCount(place, Vars.showMe);

            if (count > 0) {
                let gender = null;
                if (Vars.showMe === 'Men') gender = 'Man';
                else if (Vars.showMe === 'Women') gender = 'Woman';

                const uri = await Firebase.getPlaceRandomFeedImage(placeId, gender); // gender: Woman, Man, null
                // console.log('!!!!', index, uri);

                places[index] = {
                    // ...places[index],
                    place_id: placeId,
                    length: count,
                    name: place.name,
                    uri,
                    lat: place.lat,
                    lng: place.lng,
                    key: placeId,
                    newPostAdded: undefined
                };
            }

            if (index === snap.docs.length - 1) {
                Intro.places = places;
                !this.closed && this.setState({ places });

                // subscribe all places
                for (let i = 0; i < places.length; i++) {
                    const __placeId = places[i].place_id;
                    if (__placeId) {
                        // subscribe feed count
                        this.subscribeToPlace(__placeId);
                    }
                }
            }

            index++;
        }); // end of foreach
    }

    /*
    async getPopularFeeds() {
        if (Intro.popularFeeds.length > 0) return;

        let placeList = [];

        placeList = await Firebase.getRandomPlaces(DEFAULT_FEED_COUNT);
        placeList = Util.shuffle(placeList);

        console.log('getPopularFeeds size', placeList.length);

        let gender = null;
        if (Vars.showMe === 'Men') gender = 'Man';
        else if (Vars.showMe === 'Women') gender = 'Woman';

        let popularFeeds = [];
        for (let i = 0; i < placeList.length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByAverageRating(placeId, gender);
            if (feed) {
                popularFeeds.push(feed);
            } else {
                console.log('feed not exists', placeId);
            }
        }

        // console.log('jdub', 'popularFeeds', popularFeeds.length);

        !this.closed && this.setState({ popularFeeds });

        for (let i = 0; i < popularFeeds.length; i++) {
            const feed = popularFeeds[i];

            // subscribe post
            this.subscribeToFeed(feed.d.placeId, feed.d.id);

            // subscribe feed count
            this.subscribeToPlace(feed.d.placeId);
        }

        Intro.popularFeeds = popularFeeds;
    }

    async getRecentFeeds() {
        if (Intro.recentFeeds.length > 0) return;

        let placeList = [];

        placeList = await Firebase.getRandomPlaces(DEFAULT_FEED_COUNT);
        placeList = Util.shuffle(placeList);

        console.log('getRecentFeeds size', placeList.length);

        let gender = null;
        if (Vars.showMe === 'Men') gender = 'Man';
        else if (Vars.showMe === 'Women') gender = 'Woman';

        let recentFeeds = [];
        for (let i = 0; i < placeList.length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByTimestamp(placeId, gender);
            if (feed) {
                recentFeeds.push(feed);
            } else {
                console.log('feed not exists', placeId);
            }
        }

        // console.log('jdub', 'recentFeeds', recentFeeds.length);

        !this.closed && this.setState({ recentFeeds });

        for (let i = 0; i < recentFeeds.length; i++) {
            const feed = recentFeeds[i];

            // subscribe post
            this.subscribeToFeed(feed.d.placeId, feed.d.id);

            // subscribe feed count
            this.subscribeToPlace(feed.d.placeId);
        }

        Intro.recentFeeds = recentFeeds;
    }
    */

    async getFeeds() {
        // get random places
        let placeList = [];
        let placesSize = 0;
        if (Intro.popularFeeds.length === 0) placesSize += DEFAULT_FEED_COUNT;
        if (Intro.recentFeeds.length === 0) placesSize += DEFAULT_FEED_COUNT;
        if (placesSize > 0) {
            placeList = await Firebase.getRandomPlaces(placesSize);
            placeList = Util.shuffle(placeList);
        }

        // console.log('getFeeds() placeList.length', placeList.length);

        placesSize = placeList.length; // actual read size
        const length1 = placesSize / 2;
        // const length2 = placesSize - length1;

        this.getPopularFeeds(placeList, length1);

        this.getRecentFeeds(placeList, length1);
    }

    async getPopularFeeds(placeList, length) {
        if (Intro.popularFeeds.length > 0) return;

        let popularFeeds = [];

        let gender = null;
        if (Vars.showMe === 'Men') gender = 'Man';
        else if (Vars.showMe === 'Women') gender = 'Woman';

        for (let i = 0; i < length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByAverageRating(placeId, gender);
            if (feed) {
                popularFeeds.push(feed);
            } else {
                console.log('feed not exists', placeId);
            }
        }
        // console.log('jdub', 'popularFeeds', popularFeeds.length);

        !this.closed && this.setState({ popularFeeds });
        Intro.popularFeeds = popularFeeds;

        // subscribe
        this.subscribeToFeeds(popularFeeds);
    }

    async getRecentFeeds(placeList, startIndex) {
        if (Intro.recentFeeds.length > 0) return;

        let recentFeeds = [];

        let gender = null;
        if (Vars.showMe === 'Men') gender = 'Man';
        else if (Vars.showMe === 'Women') gender = 'Woman';

        for (let i = startIndex; i < placeList.length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByTimestamp(placeId, gender);
            if (feed) {
                recentFeeds.push(feed);
            } else {
                console.log('feed not exists', placeId);
            }
        }
        // console.log('jdub', 'recentFeeds', recentFeeds.length);

        !this.closed && this.setState({ recentFeeds });
        Intro.recentFeeds = recentFeeds;

        // subscribe
        this.subscribeToFeeds(recentFeeds);
    }

    subscribeToFeeds(feeds) {
        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            // subscribe post
            this.subscribeToFeed(feed.d.placeId, feed.d.id);

            // subscribe feed count
            this.subscribeToPlace(feed.d.placeId);
        }
    }

    subscribeToFeed(placeId, feedId) {
        if (!Intro.feedList.has(feedId)) {
            // this will be updated in subscribe
            Intro.feedList.set(feedId, null);

            const fi = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
                if (newFeed === null) return; // error

                if (newFeed === undefined) {
                    // update Intro.feedList
                    Intro.feedList.delete(feedId);
                    return;
                }

                // update Intro.feedList
                Intro.feedList.set(feedId, newFeed);

                this.updateFeed(newFeed);
            });

            Intro.popularFeedsUnsubscribes.push(fi);
        }
    }

    subscribeToPlace(placeId) {
        if (!Intro.feedCountList.has(placeId)) {
            // this will be updated in subscribe
            Intro.feedCountList.set(placeId, null);

            const ci = Firebase.subscribeToPlace(placeId, newPlace => {
                if (newPlace === null) return; // error

                if (newPlace === undefined) {
                    Intro.feedCountList.delete(placeId);
                    return;
                }

                const value = {
                    count: newPlace.count,
                    men: newPlace.men,
                    women: newPlace.women
                };
                Intro.feedCountList.set(placeId, value);

                this.updatePlace(placeId, newPlace);
            });

            Intro.countsUnsubscribes.push(ci);
        }
    }

    updateFeed(newFeed) {
        // update popularFeeds
        let _popularFeeds = [...this.state.popularFeeds];
        const index = _popularFeeds.findIndex(item => item.d.placeId === newFeed.d.placeId && item.d.id === newFeed.d.id); // snap.id
        if (index !== -1) {
            // console.log('jdub', 'popularFeeds[', index, '] changed.');
            _popularFeeds[index] = newFeed;
            !this.closed && this.setState({ popularFeeds: _popularFeeds });

            Intro.popularFeeds[index] = newFeed;
        }

        // update recentFeeds
        let _recentFeeds = [...this.state.recentFeeds];
        const index2 = _recentFeeds.findIndex(item => item.d.placeId === newFeed.d.placeId && item.d.id === newFeed.d.id); // snap.id
        if (index2 !== -1) {
            // console.log('jdub', 'recentFeeds[', index2, '] changed.');
            _recentFeeds[index2] = newFeed;
            !this.closed && this.setState({ recentFeeds: _recentFeeds });

            Intro.recentFeeds[index2] = newFeed;
        }
    }

    updatePlace(placeId, place) {
        // console.log('jdub', 'Intro.updatePlace, place.count', place.count);

        // show badge on bottom tab navigator
        let showBadge = false;

        // update Intro.feedCountList
        // Intro.feedCountList.set(placeId, place.count);

        // update UI (number, badge)
        let places = [...this.state.places];
        const index = places.findIndex(el => el.place_id === placeId);
        console.log('jdub', 'Intro.updatePlace, index', index);

        if (index !== -1) {
            let __place = places[index];
            __place.length = this._getPlaceCount(place, Vars.showMe);
            console.log('jdub', 'Intro.updatePlace, length', __place.length);

            if (typeof __place.newPostAdded === 'undefined') {
                __place.newPostAdded = false;
            } else {
                __place.newPostAdded = true;
                // console.log('jdub', 'Intro.updatePlace, showBadge = true');

                showBadge = true;
            }

            places[index] = __place;

            Intro.places = places;
            !this.closed && this.setState({ places: places });
        }

        if (showBadge) {
            if (Vars.focusedScreen !== 'Intro' && this.props.screenProps.data) this.props.screenProps.data.changeBadgeOnHome(true, 0);
        }
    }

    openSearch() {
        setTimeout(() => {
            !this.closed && this.props.navigation.navigate("search", { from: 'Intro', initFromSearch: (result) => this.initFromSearch(result) });
        }, Cons.buttonTimeout);
    }

    render(): React.Node {
        let searchText = 'Where to?';
        if (this.searchText) searchText = this.searchText;

        const notificationStyle = {
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
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
                            >{searchText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    ref={(fl) => this._flatList = fl}
                    // ref={(fl) => Intro.__flatList = fl}

                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <View style={[styles.titleContainer, { paddingTop: Theme.spacing.tiny, paddingBottom: 12 }]}>
                            <Text style={styles.title}>{'Popular destinations'}</Text>
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
                        let placeName = null;

                        let city = null;
                        let state = null;
                        let country = null;

                        let imageUri = null;

                        place_id = item.place_id;
                        if (place_id) {
                            place = item;
                            length = place.length;
                            placeName = place.name;

                            // get city, country
                            city = Util.getCity(placeName);
                            const stateAndcountry = Util.getStateAndCountry(placeName);
                            if (stateAndcountry) {
                                const words = stateAndcountry.split(', ');
                                if (words.length === 1) { // country
                                    country = words[0];
                                } else if (words.length === 2) { // state, country
                                    state = words[0];
                                    country = words[1];
                                }
                            }

                            imageUri = place.uri;
                        } else {
                            // use static value
                            place = Intro.places[index];
                            if (place) {
                                place_id = place.place_id;
                                length = place.length;
                                placeName = place.name;

                                // get city, country
                                city = Util.getCity(placeName);
                                const stateAndcountry = Util.getStateAndCountry(placeName);
                                if (stateAndcountry) {
                                    const words = stateAndcountry.split(', ');
                                    if (words.length === 1) { // country
                                        country = words[0];
                                    } else if (words.length === 2) { // state, country
                                        state = words[0];
                                        country = words[1];
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
                                    <SvgAnimatedLinearGradient
                                        primaryColor={Theme.color.skeleton1}
                                        secondaryColor={Theme.color.skeleton2}
                                        width={imageWidth}
                                        height={imageWidth}
                                    >
                                        <Svg.Rect
                                            x={0}
                                            y={0}
                                            rx={2}
                                            ry={2}
                                            width={imageWidth}
                                            height={imageWidth}
                                        />
                                    </SvgAnimatedLinearGradient>
                                </View>
                            );
                        }

                        const fontSize = this.getLabelFontSize(city, state, country);
                        const lineHeight = this.getLabelLineHeight(fontSize);

                        // Test
                        /*
                        const tmp = index;
                        if (tmp === 0) {
                            city = 'Bangkok';
                            state = null;
                            country = 'Thailand';
                            length = 126;
                        } else if (tmp === 1) {
                            city = 'Hong Kong';
                            state = null;
                            country = null;
                            length = 97;
                        } else if (tmp === 2) {
                            city = 'Tokyo';
                            state = null;
                            country = 'Japan';
                            length = 69;
                        } else if (tmp === 3) {
                            city = 'Paris';
                            state = null;
                            country = 'France';
                            length = 41;
                        } else if (tmp === 4) {
                            city = 'Los Angeles';
                            state = 'CA';
                            country = 'USA';
                            length = 36;
                        } else if (tmp === 5) {
                            city = 'Moscow';
                            state = 'Moscow';
                            country = 'Russia';
                            length = 30;
                        }
                        */

                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    // hide badge
                                    let __places = [...this.state.places];
                                    let __index = __places.findIndex(el => el.place_id === place_id);
                                    if (__index !== -1) {
                                        let __place = __places[__index];
                                        __place.newPostAdded = false;

                                        __places[__index] = __place;

                                        Intro.places = __places;
                                        !this.closed && this.setState({ places: __places });
                                    }

                                    const feedSize = this.getPlaceCount(place_id, Vars.showMe);
                                    if (feedSize === null) {
                                        this.showToast('Please try again.', 500);
                                        return;
                                    }

                                    if (feedSize === undefined) {
                                        // place is removed
                                        // this should never happen
                                        return;
                                    }

                                    const placeCounts = this.getPlaceCounts(place_id);

                                    subscribeToTopic(place_id);

                                    // let newPlace = _.clone(place);
                                    // newPlace.length = feedSize;
                                    const newPlace = {
                                        name: placeName,
                                        place_id,
                                        length: feedSize,
                                        placeCounts,
                                        lat: place.lat,
                                        lng: place.lng
                                    };

                                    this.props.navigation.navigate("home", { place: newPlace });
                                }}
                            >
                                <View style={styles.pictureContainer}>
                                    <SmartImage
                                        style={styles.item}
                                        showSpinner={false}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={imageUri}
                                    />
                                    <View style={styles.content}>
                                        {
                                            city &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{city}</Text>
                                        }
                                        {
                                            state &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{state}</Text>
                                        }
                                        {
                                            country &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{country}</Text>
                                        }
                                        {
                                            length > 0 &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.subtitle,
                                                fontSize: 14,
                                                lineHeight: 20,
                                                fontFamily: "Roboto-Medium",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1
                                            }}>
                                                {
                                                    // Platform.OS === 'android' ? Util.numberWithCommas(length) + '+ girls' : Util.numberWithCommas(length) + '+ guys'
                                                    Util.numberWithCommas(length) + '+ ' + Util.getPostName(false, Vars.showMe)
                                                }
                                            </Text>
                                        }
                                    </View>

                                    {/* // Test
                                    {
                                        tmp === 0 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp1}
                                        />
                                    }
                                    {
                                        tmp === 1 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp2}
                                        />
                                    }
                                    {
                                        tmp === 2 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp3}
                                        />
                                    }
                                    {
                                        tmp === 3 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp4}
                                        />
                                    }
                                    {
                                        tmp === 4 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp5}
                                        />
                                    }
                                    {
                                        tmp === 5 &&
                                        <Image
                                            style={styles.item}
                                            source={PreloadImage.tmp6}
                                        />
                                    }
                                    <View style={styles.content}>
                                        {
                                            city &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{city}</Text>
                                        }
                                        {
                                            state &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{state}</Text>
                                        }
                                        {
                                            country &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: fontSize,
                                                lineHeight: lineHeight,
                                                fontFamily: "Roboto-Bold",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1.2, height: 1.2 },
                                                textShadowRadius: 1
                                            }}>{country}</Text>
                                        }
                                        {
                                            length > 0 &&
                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.subtitle,
                                                fontSize: 14,
                                                lineHeight: 20,
                                                fontFamily: "Roboto-Medium",

                                                textShadowColor: 'black',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1
                                            }}>{Util.numberWithCommas(length) + '+ girls'}</Text>
                                        }
                                    </View>
                                    */}

                                    {
                                        item.newPostAdded === true &&
                                        <View style={{
                                            position: 'absolute',
                                            top: 5,
                                            right: 5,
                                            backgroundColor: 'red',
                                            borderRadius: Cons.redDotWidth / 2,
                                            width: Cons.redDotWidth,
                                            height: Cons.redDotWidth
                                        }} />
                                    }
                                </View>
                            </TouchableOpacity>
                        );
                    }}

                    ListFooterComponent={
                        <View style={{ marginTop: 20, marginBottom: 8 }}>
                            <View style={styles.titleContainer}>
                                {
                                    <Text style={styles.title}>{Platform.OS === 'android' ? 'Top-rated ' + Util.getPostName(false, Vars.showMe) : 'Most-liked posts'}</Text>
                                }
                            </View>
                            {
                                this.renderPopularFeeds()
                            }
                            <View style={styles.titleContainer}>
                                {
                                    <Text style={styles.title}>{Platform.OS === 'android' ? 'Most recent hosted ' + Util.getPostName(false, Vars.showMe) : 'Most recent posts'}</Text>
                                }
                            </View>
                            {
                                this.renderRecentFeeds()
                            }
                        </View>
                    }

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                />

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>
            </View>
        );
    } // end of render()

    getLabelFontSize(city, state, country) {
        let cityLength = 0;
        let stateLength = 0;
        let countryLength = 0;

        if (city) cityLength = city.length;
        if (state) stateLength = state.length;
        if (country) countryLength = country.length;

        // get max
        const max = Math.max(cityLength, stateLength, countryLength);

        // console.log('max', max);

        /*
        if (max >= 14) return 16;
        if (max >= 13) return 18;
        if (max >= 12) return 20;
        */
        if (max >= 20) return 14;
        if (max >= 18) return 16;
        if (max >= 16) return 18;

        return 20;
    }

    getLabelLineHeight(fontSize) {
        /*
        if (fontSize === 16) return 22;
        if (fontSize === 18) return 26;
        if (fontSize === 20) return 28;
        */
        if (fontSize === 14) return 22;
        if (fontSize === 16) return 24;
        if (fontSize === 18) return 26;
        if (fontSize === 20) return 28;

        return 28;
    }

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
                    <SvgAnimatedLinearGradient
                        primaryColor={Theme.color.skeleton1}
                        secondaryColor={Theme.color.skeleton2}
                        width={itemWidth}
                        height={itemHeight}
                    >
                        <Svg.Rect
                            x={0}
                            y={0}
                            rx={2}
                            ry={2}
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

        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            if (i === 0) {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_front}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_rear}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_middle}>
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
                    <Ionicons name='md-person' color={Theme.color.component} size={40} />
                </View>
            );
        }

        return (
            <Carousel
                onPageChanged={(page) => {
                    console.log('jdub', 'Intro.renderPopularFeeds, current page', page);
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
                    <SvgAnimatedLinearGradient
                        primaryColor={Theme.color.skeleton1}
                        secondaryColor={Theme.color.skeleton2}
                        width={itemWidth}
                        height={itemHeight}
                    >
                        <Svg.Rect
                            x={0}
                            y={0}
                            rx={2}
                            ry={2}
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

        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            if (i === 0) {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_front}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_rear}>
                        {
                            this.renderFeedItem(feed)
                        }
                    </View>
                );
            } else {
                feed && pictures.push(
                    <View key={feed.d.id} style={styles.view_middle}>
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
                    <Ionicons name='md-person' color={Theme.color.component} size={40} />
                </View>
            );
        }

        return (
            <Carousel
                onPageChanged={(page) => {
                    console.log('jdub', 'Intro.renderRecentFeeds, current page', page);
                }}
            >
                {pictures}
            </Carousel>
        );
    }

    renderFeedItem(feed) {
        if (!feed.d.reporters || feed.d.reporters.length === 0 || feed.d.reporters.indexOf(Firebase.user().uid) === -1) {
            let placeName = feed.d.placeName;
            // placeName = Util.getPlaceName(placeName);

            return (
                <TouchableOpacity activeOpacity={1}
                    onPress={async () => {
                        const post = this.getPost(feed.d.id);
                        if (post === null) {
                            // the post is not subscribed yet
                            this.showToast('Please try again.', 500);
                            return;
                        }

                        if (post === undefined) {
                            this.showToast('The post no longer exists.', 500);
                            return;
                        }

                        const feedSize = this.getPlaceCounts(feed.d.placeId);
                        if (feedSize === null) {
                            this.showToast('Please try again.', 500);
                            return;
                        }

                        if (feedSize === undefined) {
                            // the place is removed
                            // this should never happen
                            return;
                        }

                        const extra = { placeCounts: feedSize };

                        /*
                        const result = await Firebase.addVisits(Firebase.user().uid, feed.placeId, feed.id);
                        this.props.navigation.navigate("introPost", { post: result, extra });
                        */
                        Firebase.addVisits(Firebase.user().uid, feed.d.placeId, feed.d.id);
                        this.props.navigation.navigate("introPost", { post, extra });
                    }}
                >
                    <Image
                        style={styles.item}
                        source={{ uri: feed.d.pictures.one.uri }}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                        start={[0, 0]}
                        end={[0, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>

                        <Text style={styles.feedItemText}>{feed.d.name} {Util.getAge(feed.d.birthday)}</Text>
                        <Text style={styles.feedItemText}>{placeName}</Text>
                        {
                            this.renderReview(feed)
                        }
                    </View>
                </TouchableOpacity>
            );
        } else {
            let placeName = feed.d.placeName;

            return (
                <TouchableOpacity activeOpacity={1}
                    onPress={() => {
                        this.openDialog('Unblock Post', 'Are you sure you want to unblock ' + feed.d.name + '?', async () => {
                            // unblock

                            // 1. update database (reporters)
                            const uid = Firebase.user().uid;
                            const placeId = feed.d.placeId;
                            const feedId = feed.d.id;

                            const result = await Firebase.unblockPost(uid, placeId, feedId);
                            if (!result) {
                                // the post is removed
                                this.showToast('The post has been removed by its owner.', 500);
                                return;
                            }
                        });
                    }}
                >
                    <Image
                        style={styles.item}
                        source={{ uri: feed.d.pictures.one.uri }}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                        start={[0, 0]}
                        end={[0, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                        <Text style={styles.feedItemText}>{feed.d.name}</Text>
                        <Text style={styles.feedItemText}>{placeName}</Text>
                        {
                            this.renderReview(feed)
                        }
                    </View>

                    <View style={[StyleSheet.absoluteFill, {
                        borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                    }]}>
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
                    </View>
                </TouchableOpacity>
            );
        }
    }

    renderReview(feed) {
        // defaultRating, averageRating
        const averageRating = feed.d.averageRating;

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        /*
        let likesCount = 0;
        if (feed.likes) {
            likesCount = feed.likes.length;
        }
        */
        const visitCount = Util.getVisitCount(feed.d.visits);

        if (feed.d.reviewCount > 0) {
            if (Platform.OS === 'android') {
                // ratings & reviews
                return (
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
                            <Text style={styles.reviewCount}>{Util.numberWithCommas(feed.d.reviewCount)}</Text>
                        </View>
                    </View>
                );
            } else { // ios
                // likes & reviews
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginLeft: 2,
                            width: 'auto', height: 'auto', borderRadius: 3, // paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)'
                        }}>
                            {/*
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
                            */}
                            {/*
                            <Ionicons style={{ marginTop: 2 }} name="md-heart-empty" color={'red'} size={15} />
                            <Text style={[styles.rating, { color: Theme.color.title }]}>{likesCount}</Text>
                            */}
                            <Ionicons style={{ marginTop: 2 }} name="md-eye" color={'#4c9a2a'} size={15} />
                            <Text style={[styles.rating, { color: Theme.color.title }]}>{visitCount}</Text>

                            <AntDesign style={{ marginLeft: 10, marginTop: 1 }} name='message1' color={'#f1c40f'} size={12} />
                            <Text style={styles.reviewCount}>{Util.numberWithCommas(feed.d.reviewCount)}</Text>
                        </View>
                    </View>
                );
            }
        }

        // new icon
        return (
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
        );
    }

    getPost(id) {
        /*
        let post = null;
        if (Intro.feedList.has(id)) {
            post = Intro.feedList.get(id);
        }
    
        return post;
        */

        return Intro.feedList.get(id); // null: the post is not subscribed yet, undefined: the post is removed
    }

    getPlaceCount(placeId, showMe) {
        const value = Intro.feedCountList.get(placeId);
        if (!value) return value;

        if (showMe === 'Men') return value.men;
        if (showMe === 'Women') return value.women;
        return value.count;
    }

    getPlaceCounts(placeId) {
        return Intro.feedCountList.get(placeId);
    }

    _getPlaceCount(place, showMe) {
        if (showMe === 'Men') return place.men;
        if (showMe === 'Women') return place.women;
        return place.count;
    }

    handleRefresh = async () => {
        if (this.state.refreshing) return;

        !this.closed && this.setState({ refreshing: true });

        await this.getPlaces();

        !this.closed && this.setState({ refreshing: false });
    }

    showNotification(msg) {
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.offset, {
                        toValue: Constants.statusBarHeight + 6,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
    }


    _storeData = async (key, value) => {
        console.log('jdub', '_storeData', key, value);

        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            // Error saving data
        }
    }

    _storeMultiData = async (data) => {
        console.log('jdub', '_storeMultiData', data);

        try {
            await AsyncStorage.multiSet(data);
        } catch (error) {
            // Error saving data
        }
    }

    _retrieveData = async (key) => {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value !== null) {
                console.log('jdub', '_retrieveData', key, value);
            }

            return value;
        } catch (error) {
            console.log('jdub', '_retrieveData error', error);
            // Error retrieving data
            return null;
        }
    }

    _retrieveMultiData = async (keys) => {
        try {
            const values = await AsyncStorage.multiGet(keys);
            if (values !== null) {
                console.log('jdub', '_retrieveMultiData', keys, values);
            }

            return values;
        } catch (error) {
            console.log('jdub', '_retrieveMultiData error', error);
            // Error retrieving data
            return null;
        }
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

    showToast(msg, ms, cb = null) {
        if (this.props.screenProps.data) this.props.screenProps.data.showToast(msg, ms, cb);
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
        height: imageWidth,
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
