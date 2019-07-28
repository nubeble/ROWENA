import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, Dimensions, Platform, Image, StatusBar } from 'react-native';
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import PreloadImage from './PreloadImage';
import Util from './Util';

// initial region
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// const SPACE = 0.01;
// const UP = 1.02;

const useGoogleMaps = Platform.OS === 'android' ? true : false;


export default class MapScreen extends React.Component {
    state = {
        renderMap: false,
        distance: '',
        region: { // current region
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
        },
        markerImage: null
    };

    constructor(props) {
        super(props);

        this.ready = false;
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        setTimeout(() => {
            this.load();

            !this.closed && this.setState({ renderMap: true });
        }, 0);
    }

    load() {
        const { post } = this.props.navigation.state.params;
        const latitude = post.location.latitude;
        const longitude = post.location.longitude;

        const distance = Util.getDistance(post.location, Vars.location);

        const region = {
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02 * ASPECT_RATIO
        };

        const averageRating = post.averageRating;
        const integer = Math.floor(averageRating);

        let markerImage = null;
        switch (integer) {
            case 0: markerImage = PreloadImage.emoji0; break;
            case 1: markerImage = PreloadImage.emoji1; break;
            case 2: markerImage = PreloadImage.emoji2; break;
            case 3: markerImage = PreloadImage.emoji3; break;
            case 4: markerImage = PreloadImage.emoji4; break;
            case 5: markerImage = PreloadImage.emoji5; break;
        }

        this.setState({ distance, region, markerImage });
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'MapScreen';

        StatusBar.setHidden(true);
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        StatusBar.setHidden(false);
    }

    render() {
        return (
            <View style={styles.flex}>
                {
                    this.state.renderMap &&
                    <MapView
                        ref={ref => { this.map = ref; }}
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
                        >
                            <View style={{ width: 32, height: 50 }}>
                                <Image source={PreloadImage.pin} style={{ tintColor: Theme.color.marker, width: 32, height: 50, position: 'absolute', top: 0, left: 0 }} />
                                <Image source={this.state.markerImage} style={{ width: 22, height: 22, position: 'absolute', top: 5, left: 5 }} />
                            </View>
                        </MapView.Marker>
                        {/*
                        <MapView.Circle
                            // key={(this.state.currentLongitude + this.state.currentLongitude).toString()}
                            center={{
                                latitude: this.state.region.latitude,
                                longitude: this.state.region.longitude
                            }}
                            radius={150} // m
                            strokeWidth={2}
                            strokeColor={Theme.color.selection}
                            fillColor={'rgba(62, 165, 255, 0.6)'}
                        // onRegionChangeComplete={this.onRegionChangeComplete.bind(this)}
                        />
                        */}
                    </MapView>
                }

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
                        this.props.navigation.goBack();
                    }}
                >
                    <View style={{
                        width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(255, 255, 255, 0.6)'
                    }}>
                        <Ionicons name='md-arrow-back' color='rgba(0, 0, 0, 0.8)' size={26} />
                    </View>
                </TouchableOpacity>

                {/* distance */}
                <View
                    style={{
                        width: '50%',
                        height: 30,
                        position: 'absolute',
                        top: 100 + 6,
                        left: '25%',
                        borderRadius: 30 / 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        justifyContent: "center", alignItems: "center"
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: 'rgba(0, 0, 0, 0.8)' }}>{this.state.distance}</Text>
                </View>

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
                    }}
                >
                    <View style={{
                        width: 42, height: 42, borderRadius: 42 / 2, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(255, 255, 255, 0.6)'
                    }}>
                        <MaterialIcons name='gps-fixed' color='rgba(0, 0, 0, 0.8)' size={26} />
                    </View>
                </TouchableOpacity>
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

                this.moveToRegion(region, 10);
            }, (error) => {
                console.log('getCurrentPosition() error', error);
            });
        } catch (e) {
            console.log('getCurrentPosition() exception', e.message);
        }
    }

    @autobind
    onMapReady(e) {
        this.ready = true;
    };

    moveToRegion(region, duration) {
        if (this.ready) {
            setTimeout(() => !this.closed && this.map.animateToRegion(region), duration);

            // this.setState({ region });
        }
    }

    @autobind
    onRegionChange(region) {
        console.log('onRegionChange', region);
    };

    @autobind
    onRegionChangeComplete(region) {
        console.log('onRegionChangeComplete', region);
    };
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    map: {
        ...StyleSheet.absoluteFillObject
    }
});
