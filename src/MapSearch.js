import React from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, BackHandler, Platform, Image, StatusBar } from 'react-native';
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { Text, Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import { observer } from "mobx-react/native";
import Carousel from './Carousel';
import SmartImage from "./rnff/src/components/SmartImage";
import { AirbnbRating } from './react-native-ratings/src';
import { RefreshIndicator } from "./rnff/src/components";
import Firebase from './Firebase';
import * as firebase from "firebase";
import { GeoCollectionReference, GeoFirestore, GeoQuery, GeoQuerySnapshot } from 'geofirestore';
import { NavigationActions } from 'react-navigation';
import PreloadImage from './PreloadImage';
import Util from "./Util";
import { LinearGradient } from 'expo-linear-gradient';

// initial region
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// const SPACE = 0.01;

// const UP = 1.02;

const DEFAULT_FEED_COUNT = 8;

const useGoogleMaps = Platform.OS === 'android' ? true : false;

// 3:2 image
const itemWidth = Dimensions.get('window').width - 40;
const itemHeight = (Dimensions.get('window').width - 40) / 3 * 2;


// @observer
export default class MapSearch extends React.Component {
    // feedStore = new FeedStore();
    gf = new GeoFirestore(Firebase.firestore);

    constructor(props) {
        super(props);

        this.ready = false;

        this.state = {
            // renderMap: false,
            showSearchButton: true,
            loading: false,
            region: { // current region
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
            },
            feeds: [],
            selectedMarker: 0, // index
            place: null
        };
    }

    async componentDidMount() {
        // console.log('MapSearch.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        // this.feedStore.setAddToFeedFinishedCallback(this.onAddToFeedFinished);

        StatusBar.setHidden(true);

        const { placeName, region } = this.props.navigation.state.params;

        this.setState({ place: placeName });

        let __region = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2 * ASPECT_RATIO
        };
        this.setState({ region: __region });

        // this.setState({ renderMap: true });

        /*
        const { store } = this.props.navigation.state.params;
        const { feed } = store; // array

        this.setState({ feeds: feed });
        */


        /*
        const { placeId } = this.props.navigation.state.params;

        const query = Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("averageRating", "desc");
        this.feedStore.init(query, 'averageRating');

        this.setState({ loading: true });
        */

        this.setState({ loading: true });

        const feeds = await this.loadFeeds(__region);
        this.setState({ feeds: feeds });

        this.setState({ loading: false });

        this.setState({ showSearchButton: false });

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderMap: true });
        }, 0);
        */
    }

    initFromPost(post) {
        let feeds = [...this.state.feeds];
        let index = feeds.findIndex(el => el.placeId === post.placeId && el.id === post.id);
        if (index !== -1) {
            feeds[index] = post;
            !this.closed && this.setState({ feeds });
        }
    }

    async loadFeeds(region) {
        let feeds = [];

        const { placeId } = this.props.navigation.state.params;
        const geocollection: GeoCollectionReference = this.gf.collection("places").doc(placeId).collection("feed");

        // get kilometers by region
        const oneDegreeOfLatitudeInMeters = 111.32;
        const km = region.latitudeDelta / 2 * oneDegreeOfLatitudeInMeters;

        const query: GeoQuery = geocollection.near({
            center: new firebase.firestore.GeoPoint(region.latitude, region.longitude),
            radius: km, // kilometers
            // limit: 5
        }).limit(DEFAULT_FEED_COUNT);

        await query.get().then(async (value: GeoQuerySnapshot) => {
            // console.log(value.docs); // All docs returned by GeoQuery

            const docs = value.docs;
            for (let i = 0; i < docs.length; i++) {
                const data = docs[i].data();

                feeds.push(data);
            }
        });

        return feeds;
    }

    @autobind
    handleHardwareBackPress() {
        // this.props.navigation.goBack();
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        console.log('MapSearch.componentWillUnmount');

        this.hardwareBackPressListener.remove();

        StatusBar.setHidden(false);

        this.closed = true;
    }

    render() {
        /*
        const { feedStore } = this;
        const { feed } = feedStore; // array
        // const loading = feed === undefined;
        */

        return (
            <View style={styles.flex}>
                {
                    // this.state.renderMap &&
                    this.renderMap()
                }

                {/* place name */}
                <View
                    style={{
                        width: '100%',
                        alignSelf: 'baseline',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        position: 'absolute',
                        top: Constants.statusBarHeight,
                        left: 0,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        justifyContent: "center", alignItems: "center"
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(0, 0, 0, 0.8)', textAlign: 'center' }}>{this.state.place}</Text>
                </View>

                {/* close button */}
                <TouchableOpacity
                    style={{
                        width: 42,
                        height: 42,
                        position: 'absolute',
                        top: 100,
                        left: 10,
                        justifyContent: "center", alignItems: "center"
                    }}
                    onPress={() => {
                        // this.props.navigation.goBack();
                        this.props.navigation.dispatch(NavigationActions.back());
                    }}
                >
                    <View style={{
                        width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(255, 255, 255, 0.6)'
                    }}>
                        <Ionicons name='md-arrow-back' color='rgba(0, 0, 0, 0.8)' size={26} />
                    </View>
                </TouchableOpacity>

                {/* search this area */}
                {
                    this.state.showSearchButton &&
                    <TouchableOpacity
                        style={{
                            width: '50%',
                            height: 30,
                            position: 'absolute',
                            left: '25%',
                            top: 100 + 6, // center
                            // top: Constants.statusBarHeight + 30,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            // this.setState({ loading: true });
                            this.reload();
                        }}
                    >
                        <View style={{
                            width: '100%', height: '100%', borderRadius: 30 / 3, justifyContent: "center", alignItems: "center",
                            // backgroundColor: this.state.loading ? 'white' : Theme.color.selection
                            backgroundColor: this.state.loading ? 'rgba(255, 255, 255, 0.9)' : 'rgba(205, 94, 119, 0.9)'
                        }}>
                            {
                                this.state.loading ?
                                    <RefreshIndicator refreshing color={'rgba(0, 0, 0, 0.8)'} total={3} size={3} />
                                    :
                                    <Text style={{ color: Theme.color.title, fontSize: 14, fontFamily: "Roboto-Medium" }}>{'Redo search in this area'}</Text>
                            }
                        </View>
                    </TouchableOpacity>
                }

                {/* gps button */}
                <TouchableOpacity
                    style={{
                        width: 42,
                        height: 42,
                        position: 'absolute',
                        top: 100,
                        right: 10,
                        justifyContent: "center", alignItems: "center"
                    }}
                    onPress={() => {
                        this.getCurrentPosition();

                        // test
                        // this.props.navigation.navigate("mapOverview");
                    }}
                >
                    <View style={{
                        width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(255, 255, 255, 0.6)'
                    }}>
                        <MaterialIcons name='gps-fixed' color='rgba(0, 0, 0, 0.8)' size={26} />
                    </View>
                </TouchableOpacity>



                <View style={styles.container}>
                    {
                        // this.state.renderMap &&
                        this.renderPosts()
                    }
                </View>
            </View>
        );
    }

    getCurrentPosition() {
        try {
            navigator.geolocation.getCurrentPosition((position) => {
                const region = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01 * ASPECT_RATIO
                };

                this.moveRegion(region, 10);
            }, (error) => {
                console.log('getCurrentPosition() error', error);
            });
        } catch (e) {
            console.log('getCurrentPosition() exception', e.message);
        }
    }

    renderMap() {
        const { feeds } = this.state;

        let array = [];

        for (let i = 0; i < feeds.length; i++) {
            const post = feeds[i];

            const latitude = post.location.latitude;
            const longitude = post.location.longitude;
            const rating = Math.floor(post.averageRating);
            // const rating = i % 6; // ToDo: test

            let image = null;
            switch (rating) {
                case 0: image = PreloadImage.emoji0; break; // new
                case 1: image = PreloadImage.emoji1; break;
                case 2: image = PreloadImage.emoji2; break;
                case 3: image = PreloadImage.emoji3; break;
                case 4: image = PreloadImage.emoji4; break;
                case 5: image = PreloadImage.emoji5; break;
            }

            const marker = {
                coordinate: {
                    latitude: latitude,
                    longitude
                },
                image,
                index: i
            };

            array.push(marker);
        }

        let markers = [];
        for (let i = 0; i < array.length; i++) {
            const marker = array[i];

            markers.push(
                <MapView.Marker
                    key={i}
                    coordinate={marker.coordinate}
                    // anchor={{ x: 0.5, y: 0.5 }}
                    // centerOffset={{ x: -42, y: -60 }}
                    // image={carImage}
                    // title={'title'}
                    // description={'description'}

                    // zIndex={this.state.selectedMarker === i ? array.length - 1 : 0}

                    zIndex={this.state.selectedMarker === i ? array.length : marker.index}

                    onPress={() => {
                        console.log('MapSearch.renderMapView, marker onpress', marker.index);

                        this.setState({ selectedMarker: marker.index });

                        // move region in ios (in android automatically moved)
                        if (Platform.OS === 'ios') {
                            this.moveMarker(marker.index);
                        }

                        // move carousel
                        this.carousel.moveToPage(marker.index);
                    }}
                >
                    <View style={{ width: 32, height: 50 }}>
                        <Image source={PreloadImage.pin} style={{
                            tintColor: this.state.selectedMarker === i ? Theme.color.marker : 'darkgrey',
                            width: 32, height: 50, position: 'absolute', top: 0, left: 0
                        }} />
                        <Image source={marker.image} style={{
                            width: 22, height: 22, position: 'absolute', top: 5, left: 5
                        }} />
                    </View>
                </MapView.Marker>
            );
        }

        // test
        /*
        markers.push(
            <MapView.Marker
                key={1111}
                coordinate={{
                    latitude: 14.623401,
                    longitude: 120.971351
                }}
            />
        );
        */


        return (
            <MapView
                ref={ref => { this.map = ref; }}
                provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                // mapType={MAP_TYPES.TERRAIN}
                style={styles.map}
                initialRegion={this.state.region}
                showsUserLocation={true}
                // showsMyLocationButton={true}
                onRegionChange={(region) => {
                    if (!this.state.showSearchButton) this.setState({ showSearchButton: true });

                    this.setState({ region });
                }}
                /*
                onRegionChangeComplete={(region) => {
                    // console.log(region);
                    this.setState({ region });
                }}
                */
                onMapReady={this.onMapReady}
            >
                {
                    markers.length > 0 &&
                    markers
                }
            </MapView>
        );
    }

    onMapReady = (e) => {
        this.ready = true;


        // ToDo: set boundaries
        /*
        this.map.setMapBoundaries(
            {
                latitude: 14.562181, longitude:121.11852
            },
            {
                latitude: 14.46491, longitude:121.0222239
            }
        );
        */
    };

    moveRegion(region, duration) {
        if (this.ready) {
            setTimeout(() => !this.closed && this.map.animateToRegion(region), duration);

            // this.setState({ region });
        }
    }

    renderPosts() {
        const { feeds } = this.state;

        if (feeds.length === 0) {
            /*
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
            */
            // <RefreshIndicator />
            return null;
        }

        let pictures = [];

        for (let i = 0; i < feeds.length; i++) {
            const post = feeds[i];

            if (i === 0) {
                post && pictures.push(
                    <View key={post.id} style={styles.view_front}>
                        {
                            this.renderPost(post)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                post && pictures.push(
                    <View key={post.id} style={styles.view_rear}>
                        {
                            this.renderPost(post)
                        }
                    </View>
                );
            } else {
                post && pictures.push(
                    <View key={post.id} style={styles.view_middle}>
                        {
                            this.renderPost(post)
                        }
                    </View>
                );
            }
        }

        return (
            <View style={{ marginTop: 10 }}>
                <Carousel
                    ref={(carousel) => { this.carousel = carousel; }}
                    onPageChanged={(page) => {
                        console.log('MapSearch.renderPosts, current page', page);

                        this.setState({ selectedMarker: page });

                        // move region
                        this.moveMarker(page);
                    }}
                >
                    {pictures}
                </Carousel>
            </View>
        );
    }

    moveMarker(index) {
        const tmp = this.getRegion(index);
        if (tmp) {
            const region = {
                latitude: tmp.latitude,
                longitude: tmp.longitude,
                latitudeDelta: this.state.region.latitudeDelta,
                longitudeDelta: this.state.region.longitudeDelta
            };

            this.moveRegion(region, 0);
        }
    }

    getRegion(index) {
        const { feeds } = this.state;

        if (feeds.length === 0) return null;

        const post = feeds[index];
        const latitude = post.location.latitude;
        const longitude = post.location.longitude;

        return ({ latitude, longitude });
    }

    renderPost(post) {
        // placeName
        /*
        let placeName = post.placeName;
        const words = placeName.split(', ');
        if (words.length > 2) {
            const city = words[0];
            const country = words[words.length - 1];
            placeName = city + ', ' + country;
        }
        */
        const distance = Util.getDistance(post.location, Vars.location);

        // defaultRating, averageRating
        const averageRating = post.averageRating;

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        return (
            <TouchableOpacity activeOpacity={1.0}
                // onPress={async () => {
                onPress={() => {
                    // console.log('onpress', post.placeId, post.id);

                    const { feedSize } = this.props.navigation.state.params;

                    const extra = {
                        feedSize
                    };

                    Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
                    this.props.navigation.navigate("post", { post: post, extra: extra, initFromPost: (result) => this.initFromPost(result) });
                }}
            >
                <SmartImage
                    style={styles.item}
                    showSpinner={false}
                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                    uri={post.pictures.one.uri}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                    start={[0, 0]}
                    end={[0, 1]}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                    <Text style={styles.feedItemText}>{post.name}</Text>
                    <Text style={styles.feedItemText}>{distance}</Text>
                    {
                        post.reviewCount > 0 ?
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
                                    <Text style={styles.reviewCount}>{post.reviewCount}</Text>
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

    async reload() {
        // const { placeId } = this.props.navigation.state.params;
        // console.log('placeId', placeId);

        const { region } = this.state;

        /*
        const s = region.latitude - (region.latitudeDelta / 2);
        const n = region.latitude + (region.latitudeDelta / 2);
        const w = region.longitude - (region.longitudeDelta / 2);
        const e = region.longitude + (region.longitudeDelta / 2);

        console.log(s, n, w, e);

        const lesserGeopoint = new firebase.firestore.GeoPoint(s, w); // SW
        const greaterGeopoint = new firebase.firestore.GeoPoint(n, e); // NE

        const query = Firebase.firestore.collection("places").doc(placeId).collection("feed")
            .where('location.gp', '>', lesserGeopoint).where('location.gp', '<', greaterGeopoint);

        this.feedStore.init(query, null);
        */


        this.setState({ loading: true });

        const feeds = await this.loadFeeds(region);
        !this.closed && this.setState({ feeds: feeds });

        !this.closed && this.setState({ loading: false });

        !this.closed && this.setState({ showSearchButton: false });
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    container: {
        position: 'absolute',
        bottom: Cons.mapPostBottom(),
        // bottom: -5,
        left: 0,
        width: '100%',
        backgroundColor: 'transparent'
        // backgroundColor: 'rgba(80, 80, 80, 0.4)'
    },
    map: {
        ...StyleSheet.absoluteFillObject
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
    }
});
