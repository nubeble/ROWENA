// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image, StatusBar, Platform, BackHandler, Animated
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
import Util from './Util';

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
    static __flatList = null;

    static places = [];
    static popularFeeds = [];
    static recentFeeds = [];

    static feedList = new Map();
    static feedCountList = new Map();

    // do not unsibscribe
    // --
    static popularFeedsUnsubscribes = [];
    static recentFeedsUnsubscribes = [];

    static countsUnsubscribes = [];
    // --

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

    static scrollToTop() {
        Intro.__flatList.scrollToOffset({ offset: 0, animated: true });
    }

    static final() {
        console.log('Intro.final');

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

                await Util.openSettings();
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

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
        */

        if (Intro.places.length === 0) this.getPlaces();

        this.getPopularFeeds();
        this.getRecentFeeds();
    }

    componentWillUnmount() {
        console.log('Intro.componentWillUnmount');

        this.onFocusListener.remove();
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    async initFromSearch(result) {
        console.log('Intro.initFromSearch', result);

        // get city, country
        let name = result.description;
        name = Util.getPlaceName(name);

        /*
        // load count from database (no need to subscribe!)
        const placeDoc = await Firebase.firestore.collection("place").doc(result.place_id).get();
        let count = 0;
        if (placeDoc.exists) {
            let field = placeDoc.data().count;
            if (field) count = field;
        }
        */

        let count = 0;

        const feedSize = this.getFeedSize(result.place_id);
        if (feedSize === -1) {
            this.refs["toast"].show('Please try again.', 500);
            return;
        }

        if (feedSize === undefined) {
            // the place is removed or not exists

            // load count from database (then subscribe)
            const placeDoc = await Firebase.firestore.collection("place").doc(result.place_id).get();
            if (placeDoc.exists) {
                let field = placeDoc.data().count;
                if (field) count = field;
            }

            // subscribe feed count
            // --
            if (!Intro.feedCountList.has(result.place_id)) {
                // this will be updated in subscribe
                Intro.feedCountList.set(result.place_id, -1);

                const ci = Firebase.subscribeToPlace(result.place_id, newPlace => {
                    if (newPlace === undefined) {
                        // update Intro.feedCountList
                        Intro.feedCountList.delete(result.place_id);
                        return;
                    }

                    // update Intro.feedCountList
                    Intro.feedCountList.set(result.place_id, newPlace.count);
                });

                Intro.countsUnsubscribes.push(ci);
            }
            // --
        } else {
            count = feedSize;
        }

        const place = {
            name: name,
            place_id: result.place_id,
            length: count,

            // location: result.location
            lat: result.location.lat,
            lng: result.location.lng
        }

        this.props.navigation.navigate("home", { place: place });
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
    onFocus() {
        Vars.currentScreenName = 'Intro';
    }

    async getPlaces() {
        const size = DEFAULT_PLACE_COUNT;

        const snap = await Firebase.firestore.collection("place").orderBy("count", "desc").limit(size).get();
        if (snap.size > 0) {
            let places = [...this.state.places];
            let index = 0;

            snap.forEach(async (doc) => {
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
                    /*
                    Intro.places = places;
                    !this.closed && this.setState({ places });
                    */

                    // subscribe feed count
                    if (!Intro.feedCountList.has(doc.id)) {
                        // this will be updated in subscribe
                        Intro.feedCountList.set(doc.id, -1);

                        const ci = Firebase.subscribeToPlace(doc.id, newPlace => {
                            if (newPlace === undefined) {
                                // update Intro.feedCountList
                                Intro.feedCountList.delete(doc.id);
                                return;
                            }

                            // update Intro.feedCountList
                            Intro.feedCountList.set(doc.id, newPlace.count);

                            // update UI
                            let __places = [...this.state.places];
                            let __index = __places.findIndex(el => el.place_id === doc.id);
                            if (__index !== -1) {
                                let __place = __places[__index];
                                __place.length = newPlace.count;
                                __places[__index] = __place;

                                Intro.places = __places;
                                !this.closed && this.setState({ places: __places });
                            }
                        });

                        Intro.countsUnsubscribes.push(ci);
                    }
                } else { // data.count === 0
                    index++;

                    if (index === snap.docs.length) {
                        Intro.places = places;
                        !this.closed && this.setState({ places });
                    }
                }
            });
        }
    }

    async getPopularFeeds() {
        if (Intro.popularFeeds.length > 0) return;

        let placeList = [];
        /*
        let count = 0;
        while (true) {
            const placeId = await Firebase.getRandomPlace();
            if (placeId) {
                // check existance
                if (placeList.indexOf(placeId) === -1) {
                    placeList.push(placeId);
                    count++;
                }
            }

            if (count >= DEFAULT_FEED_COUNT) break;
        }
        */
        placeList = await Firebase.getRandomPlaces(DEFAULT_FEED_COUNT);
        placeList = Util.shuffle(placeList);

        let popularFeeds = [];
        let index = 0;

        for (let i = 0; i < placeList.length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByAverageRating(placeId);
            if (feed) {
                popularFeeds[index] = feed;
                index++;
            }
        }

        !this.closed && this.setState({ popularFeeds });
        Intro.popularFeeds = popularFeeds;

        for (let i = 0; i < popularFeeds.length; i++) {
            const feed = popularFeeds[i];

            // subscribe post
            // --
            if (!Intro.feedList.has(feed.id)) {
                // this will be updated in subscribe
                Intro.feedList.set(feed.id, null);

                const fi = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                    if (newFeed === undefined) {
                        // update Intro.feedList
                        Intro.feedList.delete(feed.id);
                        return;
                    }

                    // update Intro.feedList
                    Intro.feedList.set(feed.id, newFeed);

                    // update
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
            }
            // --

            // subscribe feed count
            // --
            if (!Intro.feedCountList.has(feed.placeId)) {
                // this will be updated in subscribe
                Intro.feedCountList.set(feed.placeId, -1);

                const ci = Firebase.subscribeToPlace(feed.placeId, newPlace => {
                    if (newPlace === undefined) {
                        // update Intro.feedCountList
                        Intro.feedCountList.delete(feed.placeId);
                        return;
                    }

                    // update Intro.feedCountList
                    Intro.feedCountList.set(feed.placeId, newPlace.count);
                });

                Intro.countsUnsubscribes.push(ci);
            }
            // --
        }
    }

    async getRecentFeeds() {
        if (Intro.recentFeeds.length > 0) return;

        let placeList = [];
        /*
        let count = 0;
        while (true) {
            const placeId = await Firebase.getRandomPlace();
            if (placeId) {
                // check existance
                if (placeList.indexOf(placeId) === -1) {
                    placeList.push(placeId);
                    count++;
                }
            }

            if (count >= DEFAULT_FEED_COUNT) break;
        }
        */
        placeList = await Firebase.getRandomPlaces(DEFAULT_FEED_COUNT);
        placeList = Util.shuffle(placeList);

        let recentFeeds = [];
        let index = 0;

        for (let i = 0; i < placeList.length; i++) {
            const placeId = placeList[i];
            const feed = await Firebase.getFeedByTimestamp(placeId);
            if (feed) {
                recentFeeds[index] = feed;
                index++;
            }
        }

        !this.closed && this.setState({ recentFeeds });
        Intro.recentFeeds = recentFeeds;

        for (let i = 0; i < recentFeeds.length; i++) {
            const feed = recentFeeds[i];

            // subscribe post
            // --
            if (!Intro.feedList.has(feed.id)) {
                // this will be updated in subscribe
                Intro.feedList.set(feed.id, null);

                const fi = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                    if (newFeed === undefined) {
                        // update Intro.feedList
                        Intro.feedList.delete(feed.id);
                        return;
                    }

                    // update Intro.feedList
                    Intro.feedList.set(feed.id, newFeed);

                    // update
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
            }
            // --

            // subscribe feed count
            // --
            if (!Intro.feedCountList.has(feed.placeId)) {
                // this will be updated in subscribe
                Intro.feedCountList.set(feed.placeId, -1);

                const ci = Firebase.subscribeToPlace(feed.placeId, newPlace => {
                    if (newPlace === undefined) {
                        // update Intro.feedCountList
                        Intro.feedCountList.delete(feed.placeId);
                        return;
                    }

                    // update Intro.feedCountList
                    Intro.feedCountList.set(feed.placeId, newPlace.count);
                });

                Intro.countsUnsubscribes.push(ci);
            }
            // --
        }
    }

    openSearch() {
        setTimeout(() => {
            !this.closed && this.props.navigation.navigate("search", { from: 'Intro', initFromSearch: (result) => this.initFromSearch(result) });
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
                        // ref={(fl) => this._flatList = fl}
                        ref={(fl) => Intro.__flatList = fl}

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
                                /*
                                const words = name.split(', ');
                                if (words.length > 1) {
                                    city = words[0];
                                    country = words[words.length - 1];
                                } else {
                                    city = name;
                                }
                                */
                                city = Util.getCityName(name);
                                country = Util.getCountryName(name);

                                imageUri = place.uri;
                            } else {
                                // use static value
                                place = Intro.places[index];
                                if (place) {
                                    place_id = place.place_id;
                                    length = place.length;
                                    name = place.name;

                                    // get city, country
                                    /*
                                    const words = name.split(', ');
                                    if (words.length > 1) {
                                        city = words[0];
                                        country = words[words.length - 1];
                                    } else {
                                        city = name;
                                    }
                                    */
                                    city = Util.getCityName(name);
                                    country = Util.getCountryName(name);

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
                                        const feedSize = this.getFeedSize(place.place_id);
                                        if (feedSize === -1) {
                                            this.refs["toast"].show('Please try again.', 500);
                                            return;
                                        }

                                        if (feedSize === undefined) {
                                            // the place is removed
                                            // this should never happen
                                            return;
                                        }

                                        let newPlace = _.clone(place);
                                        newPlace.length = feedSize;

                                        this.props.navigation.navigate("home", { place: newPlace });
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        {/*
                                        <Image
                                            style={styles.picture}
                                            source={{ uri: imageUri }}
                                        // fadeDuration={0}
                                        />
                                        */}
                                        <SmartImage
                                            style={styles.item}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={imageUri}
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

        for (let i = 0; i < feeds.length; i++) {
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
                    {/* Consider: draw a character avatar */}
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

        for (let i = 0; i < feeds.length; i++) {
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
                    {/* Consider: draw a character avatar */}
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
        placeName = Util.getPlaceName(placeName);

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
                    const post = this.getPost(feed.id);
                    if (post === null) {
                        // the post is not subscribed yet
                        this.refs["toast"].show('Please try again.', 500);
                        return;
                    }

                    if (post === undefined) {
                        this.refs["toast"].show('The post no longer exists.', 500);
                        return;
                    }

                    const feedSize = this.getFeedSize(feed.placeId);
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
                        feedSize: feedSize
                    };

                    Firebase.addVisits(Firebase.user().uid, feed.placeId, feed.id);
                    this.props.navigation.navigate("introPost", { post, extra });
                }}
            >
                {/*
                <SmartImage
                    style={styles.item}
                    showSpinner={false}
                    // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                    uri={feed.pictures.one.uri}
                />
                */}
                <Image
                    style={styles.item}
                    source={{ uri: feed.pictures.one.uri }}
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

    getFeedSize(placeId) {
        /*
        let count = -1;
        if (Intro.feedCountList.has(placeId)) {
            count = Intro.feedCountList.get(placeId);
        }

        return count;
        */

        return Intro.feedCountList.get(placeId); // -1: the place is not subscribed yet, undefined: the place is removed
    }

    handleRefresh = async () => {
        !this.closed && this.setState({ refreshing: true });

        await this.getPlaces();

        !this.closed && this.setState({ refreshing: false });
    }

    showNotification(msg) {
        // if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.offset, {
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
                Animated.timing(this.state.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.state.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
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
