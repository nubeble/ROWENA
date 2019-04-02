import React from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, BackHandler, Platform } from 'react-native';
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
// import { MapView, Constants } from 'expo';
// import { Marker } from 'react-native-maps';
import { Text, Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { Cons } from "./Globals";
import autobind from "autobind-decorator";
import { observer } from "mobx-react/native";
import Carousel from './Carousel';
import SmartImage from "./rnff/src/components/SmartImage";
import { AirbnbRating } from './react-native-ratings/src';
import { RefreshIndicator } from "./rnff/src/components";
import Firebase from './Firebase';
import { NavigationActions } from 'react-navigation';

// initial region
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// const SPACE = 0.01;

const useGoogleMaps = Platform.OS === 'android' ? true : false;

// 3:2 image
const itemWidth = Dimensions.get('window').width - 40;
const itemHeight = (Dimensions.get('window').width - 40) / 3 * 2;


@observer
export default class MapSearch extends React.Component {
    constructor(props) {
        super(props);

        this.ready = false;

        this.feedSizeList = new Map();

        this.state = {
            renderMap: false,

            distance: '?', // ToDo: get geolocation of my location

            region: { // current region
                latitude: LATITUDE,
                longitude: LONGITUDE,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
            },

            /*
            markers: [
                {
                    coordinate: {
                        latitude: LATITUDE + 0.005,
                        longitude: LONGITUDE + 0.005
                    }
                },
                {
                    coordinate: {
                        latitude: LATITUDE - 0.005,
                        longitude: LONGITUDE - 0.005
                    }
                },
                {
                    coordinate: {
                        latitude: LATITUDE + 0.005,
                        longitude: LONGITUDE - 0.005
                    }
                },
                {
                    coordinate: {
                        latitude: LATITUDE - 0.005,
                        longitude: LONGITUDE + 0.005
                    }
                }
            ]
            */
        };
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const { region } = this.props.navigation.state.params;
        if (region) {
            const _region = {
                // latitude: region.latitude,
                latitude: region.latitude * 0.99, // push the map up
                longitude: region.longitude,
                latitudeDelta: 1,
                longitudeDelta: 1 * ASPECT_RATIO
            };

            this.setState({ region: _region });
        }

        // ToDo
        // this.getCurrentPosition();


        setTimeout(() => {
            !this.closed && this.setState({ renderMap: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        // this.props.navigation.goBack();
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        const { store } = this.props.navigation.state.params;
        const { feed } = store; // array
        // const loading = feed === undefined;

        return (
            <View style={styles.flex}>
                {
                    this.state.renderMap &&
                    this.renderMapView(feed)
                }
                <View style={styles.searchBar}>
                    {/* close button */}
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
                            // this.props.navigation.goBack();
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="black" size={24} />
                    </TouchableOpacity>

                    <Text style={styles.distance}>{this.state.distance + ' kilometers away'}</Text>

                    {/* gps button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            // this.getCurrentPosition();
                            this.props.navigation.navigate("mapOverview");
                        }}
                    >
                        <MaterialIcons name='gps-fixed' color="black" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    {/*
                    <View style={[styles.bubble, styles.latlng]}>
                        <Text style={{ textAlign: 'center' }}>
                            {this.state.region.latitude.toPrecision(7)}, {this.state.region.longitude.toPrecision(7)}
                        </Text>
                    </View>
                    */}

                    {
                        this.state.renderMap &&
                        this.renderPosts(feed)
                    }

                    {/*
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={() => this.jumpRandom()}
                            style={[styles.bubble, styles.button]}
                        >
                            <Text style={styles.buttonText}>Jump</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.animateRandom()}
                            style={[styles.bubble, styles.button]}
                        >
                            <Text style={styles.buttonText}>Animate (Region)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.animateRandomCoordinate()}
                            style={[styles.bubble, styles.button]}
                        >
                            <Text style={styles.buttonText}>Animate (Coordinate)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.animateToRandomBearing()}
                            style={[styles.bubble, styles.button]}
                        >
                            <Text style={styles.buttonText}>Animate (Bearing)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.animateToRandomViewingAngle()}
                            style={[styles.bubble, styles.button]}
                        >
                            <Text style={styles.buttonText}>Animate (View Angle)</Text>
                        </TouchableOpacity>
                    </View>
                    */}
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

                this.moveRegion(region);
            }, (error) => {
                console.log('getCurrentPosition() error', error);
            });
        } catch (e) {
            console.log('getCurrentPosition() exception', e.message);
        }
    }

    renderMapView(feed) {
        let array = [];
        if (feed) {
            for (var i = 0; i < feed.length; i++) {
                const post = feed[i].post;

                const latitude = post.location.latitude;
                const longitude = post.location.longitude;

                const marker = {
                    coordinate: {
                        latitude,
                        longitude
                    }
                };

                array.push(marker);
            }
        }

        let markers = [];
        for (var i = 0; i < array.length; i++) {
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
                    onPress={() => {
                        console.log('MapSearch.renderMapView, marker onpress');
                    }}
                />
            );
        }

        return (
            <MapView
                ref={ref => { this.map = ref; }}
                provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                // mapType={MAP_TYPES.TERRAIN}
                style={styles.map}
                initialRegion={this.state.region}
                onRegionChange={region => this.onRegionChange(region)}
                onMapReady={this.onMapReady}
            >
                {
                    markers
                }
            </MapView>
        );
    }

    onRegionChange(region) {
        this.setState({ region });

        // console.log('onRegionChange', region);
    }

    onMapReady = (e) => {
        if (!this.ready) {
            this.ready = true;
        }
    };

    moveRegion(region) {
        if (this.ready) {
            setTimeout(() => this.map.animateToRegion(region), 10);
        }

        // this.setState({ region });
    }

    renderPosts(feed) {
        if (!feed) {
            return (
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
                <RefreshIndicator />
            );
        }

        let pictures = [];

        for (var i = 0; i < feed.length; i++) {
            const post = feed[i].post;

            if (i === 0) {
                post && pictures.push(
                    <View key={post.id} style={styles.view_front}>
                        {
                            this.renderPost(post)
                        }
                    </View>
                );
            } else if (i !== 0 && i === feed.length - 1) {
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
                    onPageChanged={(page) => {
                        console.log('Intro.renderPopularFeeds, current page', page);
                    }}
                >
                    {pictures}
                </Carousel>
            </View>
        );
    }

    renderPost(post) {
        // placeName
        let placeName = post.placeName;
        const words = placeName.split(', ');
        if (words.length > 2) {
            const city = words[0];
            const country = words[words.length - 1];
            placeName = city + ', ' + country;
        }

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
                onPress={async () => {
                    // console.log('onpress', post.placeId, post.id);

                    const feedSize = await this.getFeedSize(post.placeId);

                    const extra = {
                        feedSize: feedSize
                    };

                    this.props.navigation.navigate("post", { post: post, extra: extra });
                }}
            >
                <SmartImage
                    style={styles.item}
                    showSpinner={false}
                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                    uri={post.pictures.one.uri}
                />
                <View style={[{ paddingLeft: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                    <Text style={styles.feedItemText}>{post.name}</Text>
                    <Text style={styles.feedItemText}>{placeName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 1, paddingBottom: Theme.spacing.tiny }}>
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
            </TouchableOpacity>
        );
    }

    async getFeedSize(placeId) {
        if (this.feedSizeList.has(placeId)) {
            return this.feedSizeList.get(placeId);
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        if (!placeDoc.exists) return 0;

        const count = placeDoc.data().count;

        this.feedSizeList.set(placeId, count);

        return count;
    }

















    jumpRandom() {
        this.setState({ region: this.randomRegion() });
    }

    animateRandom() {
        this.map.animateToRegion(this.randomRegion());
    }

    animateRandomCoordinate() {
        this.map.animateCamera({ center: this.randomCoordinate() });
    }

    animateToRandomBearing() {
        this.map.animateCamera({ heading: this.getRandomFloat(-360, 360) });
    }

    animateToRandomViewingAngle() {
        this.map.animateCamera({ pitch: this.getRandomFloat(0, 90) });
    }

    getRandomFloat(min, max) {
        return (Math.random() * (max - min)) + min;
    }

    randomCoordinate() {
        const region = this.state.region;
        return {
            latitude: region.latitude + ((Math.random() - 0.5) * (region.latitudeDelta / 2)),
            longitude: region.longitude + ((Math.random() - 0.5) * (region.longitudeDelta / 2)),
        };
    }

    randomRegion() {
        return {
            ...this.state.region,
            ...this.randomCoordinate(),
        };
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    searchBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Cons.searchBarHeight,
        // backgroundColor: 'red',
        // zIndex: 10000
    },
    distance: {
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: "black"
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        // backgroundColor: 'transparent'
        backgroundColor: 'rgba(80, 80, 80, 0.4)'
    },
    map: {
        // flex: 1
        // backgroundColor: 'transparent',
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
        paddingLeft: 2,

        textShadowColor: "#3D3D3D",
        // textShadowOffset: { width: 0.6, height: 0.6 },
        // textShadowRadius: 4
        textShadowOffset: { width: 0.2, height: 0.2 }
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











    bubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
    },
    latlng: {
        width: 200,
        alignItems: 'stretch',
    },
    button: {
        width: 100,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginVertical: 20,
        backgroundColor: 'transparent',
    },
    buttonText: {
        textAlign: 'center',
    }
});
