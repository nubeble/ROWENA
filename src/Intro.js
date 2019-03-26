// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image, StatusBar, Platform
} from "react-native";
import { Header } from 'react-navigation';
import { Svg } from "expo";
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import { FontAwesome, AntDesign } from 'react-native-vector-icons';
import Firebase from './Firebase';
import SmartImage from "./rnff/src/components/SmartImage";
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import { RefreshIndicator } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';

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

    state = {
        renderList: false,

        // set the initial places (DEFAULT_PLACE_COUNT)
        places: [
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'one'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'two'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'three'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'four'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'five'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'six'
            }
        ],
        popularFeeds: [],
        recentFeeds: [],

        searchText: '',
        refreshing: false
    };

    constructor(props) {
        super(props);

        /*
        this.popularFeedsUnsubscribes = [];
        this.recentFeedsUnsubscribes = [];
        */
    }

    async componentDidMount() {
        console.log('Intro.componentDidMount');
        console.log('uid', Firebase.user().uid);
        console.log('width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        console.log('height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);

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

        // load length from database
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
            length: count
            // location: result.location
        }

        setTimeout(() => {
            // this.props.navigation.navigate("exploreMain", { place: place });
            this.props.navigation.navigate("home", { place: place });
        }, Cons.buttonTimeoutShort);
    }

    @autobind
    async onFocus() {
        Vars.currentScreenName = 'Intro';

        // -- update the post that user clicked a like button
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
        // --
    }

    componentWillUnmount() {
        // if (this.unsubscribeToPlaceSize) this.unsubscribeToPlaceSize();

        this.onFocusListener.remove();

        /*
        for (var i = 0; i < this.popularFeedsUnsubscribes.length; i++) {
            const instance = this.popularFeedsUnsubscribes[i];
            instance();
        }

        for (var i = 0; i < this.recentFeedsUnsubscribes.length; i++) {
            const instance = this.recentFeedsUnsubscribes[i];
            instance();
        }
        */

        this.closed = true;
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
        if (snap.docs.length > 0) {
            let places = [...this.state.places];

            var index = 0;

            snap.forEach(async (doc) => {
                // console.log(doc.id, '=>', doc.data());

                const data = doc.data();

                const uri = await Firebase.getPlaceRandomFeedImage(doc.id);

                places[index] = {
                    // ...places[index],
                    place_id: doc.id,
                    length: data.count,
                    name: data.name,
                    uri,
                    key: doc.id
                };

                index++;

                if (index === snap.docs.length) {
                    Intro.places = places;
                    !this.closed && this.setState({ places });
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
        let array = {};
        for (var i = 0; i < placeList.length; i++) {
            const item = placeList[i];

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
            var value = array[key];
            // console.log(key + ":" + value);

            const feeds = await Firebase.getFeedByAverageRating(key, value);

            for (var i = 0; i < feeds.length; i++) {
                const feed = feeds[i];

                popularFeeds[index] = feed;

                index++;
            }
        }

        !this.closed && this.setState({ popularFeeds });
        Intro.popularFeeds = popularFeeds;

        // subscribe
        /*
        for (var i = 0; i < popularFeeds.length; i++) {
            const feed = popularFeeds[i];

            const instance = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                // newFeed === undefined if removed
                if (newFeed === undefined) console.log('!!!!! removed !!!!!!');

                let _popularFeeds = [...this.state.popularFeeds];
                let index = _popularFeeds.findIndex(item => item.id === feed.id); // snap.id
                if (index !== -1) {
                    _popularFeeds[index] = newFeed;
                    !this.closed && this.setState({ popularFeeds: _popularFeeds });
                }
            });

            this.popularFeedsUnsubscribes.push(instance);
        }
        */
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

        // subscribe
        /*
        for (var i = 0; i < recentFeeds.length; i++) {
            const feed = recentFeeds[i];

            const instance = Firebase.subscribeToFeed(feed.placeId, feed.id, newFeed => {
                // newFeed === undefined if removed
                // if (newFeed === undefined) console.log('!!!!! removed !!!!!!');

                let _recentFeeds = [...this.state.recentFeeds];
                let index = _recentFeeds.findIndex(item => item.id === feed.id); // snap.id
                if (index !== -1) {
                    _recentFeeds[index] = newFeed;
                    !this.closed && this.setState({ recentFeeds: _recentFeeds });
                }
            });

            this.recentFeedsUnsubscribes.push(instance);
        }
        */
    }

    render(): React.Node {
        // const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;


        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: Theme.color.component,
                        borderRadius: 25
                    }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 2, top: (34 - 30) / 2, width: 30, height: 30, justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                setTimeout(() => {
                                    this.props.navigation.navigate("search", { from: 'Intro', initFromSearch: (result) => this.initFromSearch(result) });
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                setTimeout(() => {
                                    this.props.navigation.navigate("search", { from: 'Intro', initFromSearch: (result) => this.initFromSearch(result) });
                                }, Cons.buttonTimeoutShort);
                            }}
                        >

                            {/*
                            <TextInput
                                // ref='searchInput'
                                pointerEvents="none"
                                editable={false}
                                style={{ width: '100%', height: '100%', backgroundColor: 'green', fontSize: 16, fontFamily: "SFProText-Semibold", color: "white", textAlign: 'center' }}
                                placeholder='Where to?' placeholderTextColor='rgb(160, 160, 160)'
                                // underlineColorAndroid="transparent"
                                // onTouchStart={() => this.startEditing()}
                                // onEndEditing={() => this.leaveEditing()}
                                value={this.state.searchText}
                            />
                            */}
                            <Text
                                style={{
                                    width: '100%', height: '100%', fontSize: 16, fontFamily: "SFProText-Semibold", paddingTop: Cons.searchBarPaddingTop(),
                                    color: "rgb(160, 160, 160)", textAlign: 'center'
                                }}
                                numberOfLines={1}
                            >{'Where to?'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {
                    this.state.renderList &&
                    <FlatList
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={[styles.titleContainer, { paddingBottom: 12 }]}>
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

                                    // name = city + ', ' + country;
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
                                    const words = name.split(', ');
                                    if (words.length > 1) {
                                        city = words[0];
                                        country = words[words.length - 1];

                                        // name = city + ', ' + country;
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
                                    onPress={() => {
                                        setTimeout(() => {
                                            // this.props.navigation.navigate("exploreMain", { place: place });
                                            this.props.navigation.navigate("home", { place: place });
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        <Image
                                            style={styles.picture}
                                            source={{ uri: imageUri }}
                                            fadeDuration={0}
                                        />
                                        <View style={styles.content}>
                                            {/*
                                            <Text style={{
                                                backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: 20,
                                                lineHeight: Platform.OS === 'ios' ? 26 : 34,
                                                fontFamily: "SFProText-Bold"
                                            }}>{`${(name) ? name : ''}`}</Text>
                                            */}
                                            <Text style={{
                                                // backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: 20,
                                                fontFamily: "SFProText-Bold"
                                            }}>{city}</Text>
                                            <Text style={{
                                                // backgroundColor: 'green',
                                                textAlign: 'center',
                                                color: Theme.color.title,
                                                fontSize: 20,
                                                fontFamily: "SFProText-Bold"
                                            }}>{country}</Text>

                                            <Text style={{
                                                textAlign: 'center',
                                                color: Theme.color.subtitle,
                                                fontSize: 14,
                                                paddingTop: Platform.OS === 'ios' ? 4 : 8,
                                                fontFamily: "SFProText-Semibold"
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
                                    <Text style={styles.title}>{'Recently listed girls'}</Text>
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
            <Carousel>
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
            <Carousel>
                {pictures}
            </Carousel>
        );
    }

    renderFeedItem(feed) {
        let placeName = feed.placeName;
        const words = placeName.split(', ');
        if (words.length > 2) {
            const city = words[0];
            const country = words[words.length - 1];
            placeName = city + ', ' + country;
        }

        return (
            <TouchableOpacity activeOpacity={1.0}
                onPress={() => {
                    console.log('onpress', feed.placeId, feed.id);
                    this.props.navigation.navigate("introPost", { post: feed });
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
                    <Text style={[styles.feedItemText, { marginBottom: Platform.OS === 'ios' ? 4 : 0 }]}>{placeName}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 1 }}>
                        <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                            <AirbnbRating
                                count={5}
                                readOnly={true}
                                showRating={false}
                                defaultRating={3}
                                size={12}
                                margin={1}
                            />
                        </View>
                        <Text style={styles.rating}>{feed.averageRating}</Text>

                        <AntDesign style={{ marginLeft: 10, marginTop: 1 }} name='message1' color={Theme.color.title} size={12} />
                        <Text style={styles.reviewCount}>{feed.reviewCount}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState(
            {
                refreshing: true
            },
            async () => {
                await this.getPlaces();
                /*
                await this.getPopularFeeds();
                await this.getRecentFeeds();
                */

                !this.closed && this.setState({ refreshing: false });
            }
        );
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
        color: Theme.color.text2,
        fontSize: 18,
        fontFamily: "SFProText-Semibold"
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
        // backgroundColor: "rgba(0, 0, 0, 0.3)",
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
        fontFamily: "SFProText-Semibold",
        paddingLeft: 2,

        textShadowColor: "#3D3D3D",
        textShadowOffset: { width: 0.6, height: 0.6 },
        textShadowRadius: 4
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 14,
        fontFamily: "SFProText-Regular",
        paddingTop: Cons.ratingTextPaddingTop()
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "SFProText-Regular",
        paddingTop: Cons.ratingTextPaddingTop()
    }
});
