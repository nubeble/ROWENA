import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, Dimensions, Platform } from 'react-native';
// import { MapView, Constants } from 'expo';
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text } from "./rnff/src/components";
import { Cons } from "./Globals";
import autobind from "autobind-decorator";

// initial region
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// const SPACE = 0.01;

const useGoogleMaps = Platform.OS === 'android' ? true : false;


export default class MapScreen extends React.Component {
    state = {
        // renderMap: false,

        distance: '?', // ToDo: get geolocation of my location

        region: { // current region
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
        }
    };

    constructor(props) {
        super(props);

        this.ready = false;
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const { post } = this.props.navigation.state.params;
        const latitude = post.location.latitude;
        const longitude = post.location.longitude;

        const region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01 * ASPECT_RATIO
        };

        this.setState({ region });

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderMap: true });
        }, 0);
        */
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.goBack();

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        return (
            <View style={styles.flex}>
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
                            this.props.navigation.goBack();
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
                        onPress={() => this.getCurrentPosition()}
                    >
                        <MaterialIcons name='gps-fixed' color="black" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    // this.state.renderMap &&
                    <MapView
                        ref={map => { this.map = map }}
                        provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                        style={styles.map}
                        initialRegion={this.state.region}
                        showsUserLocation={true}
                        // showsMyLocationButton={true}
                        onMapReady={this.onMapReady}
                    // onRegionChange={this.onRegionChange}
                    // onRegionChangeComplete={this.onRegionChangeComplete}
                    >
                        <MapView.Marker
                            coordinate={{
                                // latitude: this.state.region.latitude + SPACE,
                                // longitude: this.state.region.longitude + SPACE
                                latitude: this.state.region.latitude,
                                longitude: this.state.region.longitude
                            }}
                        // title={'title'}
                        // description={'description'}
                        />
                    </MapView>
                }
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

    onMapReady = (e) => {
        if (!this.ready) {
            this.ready = true;
        }
    };

    moveRegion(region) {
        if (this.ready) {
            setTimeout(() => this.map.animateToRegion(region), 10);
        }
    }

    onRegionChange = (region) => {
        console.log('onRegionChange', region);
    };

    onRegionChangeComplete = (region) => {
        console.log('onRegionChangeComplete', region);
    };
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
        zIndex: 10000
    },
    distance: {
        position: 'absolute',
        bottom: 8 + 4 + 3, // paddingBottom from searchBar
        alignSelf: 'center',
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: "black"
    },
    map: {
        flex: 1
        // ...StyleSheet.absoluteFillObject
    }
});
