import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import { Marker } from 'react-native-maps';

import {
    Platform,
    ScrollView,
    Switch,
} from 'react-native';
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import DisplayLatLng from './examples/DisplayLatLng';
import ViewsAsMarkers from './examples/ViewsAsMarkers';
import EventListener from './examples/EventListener';
import MarkerTypes from './examples/MarkerTypes';
import DraggableMarkers from './examples/DraggableMarkers';
import PolygonCreator from './examples/PolygonCreator';
import PolylineCreator from './examples/PolylineCreator';
import GradientPolylines from './examples/GradientPolylines';
import AnimatedViews from './examples/AnimatedViews';
import AnimatedMarkers from './examples/AnimatedMarkers';
import Callouts from './examples/Callouts';
import Overlays from './examples/Overlays';
import DefaultMarkers from './examples/DefaultMarkers';
import CustomMarkers from './examples/CustomMarkers';
import CachedMap from './examples/CachedMap';
import LoadingMap from './examples/LoadingMap';
import MapBoundaries from './examples/MapBoundaries';
import TakeSnapshot from './examples/TakeSnapshot';
import FitToSuppliedMarkers from './examples/FitToSuppliedMarkers';
import FitToCoordinates from './examples/FitToCoordinates';
import LiteMapView from './examples/LiteMapView';
import CustomTiles from './examples/CustomTiles';
import ZIndexMarkers from './examples/ZIndexMarkers';
import StaticMap from './examples/StaticMap';
import MapStyle from './examples/MapStyle';
import LegalLabel from './examples/LegalLabel';
import SetNativePropsOverlays from './examples/SetNativePropsOverlays';
import CustomOverlay from './examples/CustomOverlay';
import MapKml from './examples/MapKml';
import BugMarkerWontUpdate from './examples/BugMarkerWontUpdate';
import ImageOverlayWithAssets from './examples/ImageOverlayWithAssets';
import ImageOverlayWithURL from './examples/ImageOverlayWithURL';
import AnimatedNavigation from './examples/AnimatedNavigation';
import OnPoiClick from './examples/OnPoiClick';
import IndoorMap from './examples/IndoorMap';
import CameraControl from './examples/CameraControl';

const IOS = Platform.OS === 'ios';
const ANDROID = Platform.OS === 'android';

function makeExampleMapper(useGoogleMaps) {
    if (useGoogleMaps) {
        return example => [
            example[0],
            [example[1], example[3]].filter(Boolean).join(' '),
        ];
    }
    return example => example;
}


export default class MapOverview extends React.Component {
    state = {
        region: { // current region
            latitude: -37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
        },

        renderMap: false,

        Component: null,
        useGoogleMaps: ANDROID
    };

    constructor(props) {
        super(props);

        this.ready = false;
    }

    renderExample([Component, title]) {
        return (
            <TouchableOpacity
                key={title}
                style={styles.button}
                onPress={() => this.setState({ Component })}
            >
                <Text>{title}</Text>
            </TouchableOpacity>
        );
    }

    renderBackButton() {
        return (
            <TouchableOpacity
                style={styles.back}
                onPress={() => this.setState({ Component: null })}
            >
                <Text style={{ fontWeight: 'bold', fontSize: 30 }}>&larr;</Text>
            </TouchableOpacity>
        );
    }

    renderGoogleSwitch() {
        return (
            <View>
                <Text>Use GoogleMaps?</Text>
                <Switch
                    onValueChange={(value) => this.setState({ useGoogleMaps: value })}
                    style={{ marginBottom: 10 }}
                    value={this.state.useGoogleMaps}
                />
            </View>
        );
    }

    renderExamples(examples) {
        const {
            Component,
            useGoogleMaps,
        } = this.state;

        return (
            <View style={styles.container}>
                {Component && <Component provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT} />}
                {Component && this.renderBackButton()}
                {!Component &&
                    <ScrollView
                        style={StyleSheet.absoluteFill}
                        contentContainerStyle={styles.scrollview}
                        showsVerticalScrollIndicator={false}
                    >
                        {IOS && this.renderGoogleSwitch()}
                        {examples.map(example => this.renderExample(example))}
                    </ScrollView>
                }
            </View>
        );
    }

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        setTimeout(() => {
            !this.closed && this.setState({ renderMap: true });
        }, 0);
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
        const { post } = this.props.navigation.state.params;
        const distance = Util.getDistance(post.location, Vars.location);

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

                    <Text style={styles.distance}>{distance}</Text>

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
                    /*
                    this.state.renderMap &&
                    <MapView
                        ref={map => { this.map = map; }}
                        style={styles.map}
                        initialRegion={{
                            latitude: latitude,
                            longitude: longitude,
                            latitudeDelta: 0.03,
                            longitudeDelta: 0.03
                        }}
                        showsUserLocation={true}
                        // showsMyLocationButton={true}
                        onMapReady={this.onMapReady}
                        onRegionChange={this.onRegionChange}
                        onRegionChangeComplete={this.onRegionChangeComplete}
                    >




                        <Marker
                            coordinate={{
                                latitude: latitude,
                                longitude: longitude
                            }}
                            title={'title'}
                            description={'description'}
                        />





                    </MapView>
                    */
                }














                {
                    this.renderExamples([
                        // [<component>, <component description>, <Google compatible>, <Google add'l description>]
                        // [StaticMap, 'StaticMap', true],
                        [DisplayLatLng, 'Tracking Position', true, '(incomplete)'],
                        [ViewsAsMarkers, 'Arbitrary Views as Markers', true],
                        [EventListener, 'Events', true, '(incomplete)'],
                        // [MarkerTypes, 'Image Based Markers', true],
                        // [DraggableMarkers, 'Draggable Markers', true],
                        // [PolygonCreator, 'Polygon Creator', true],
                        // [PolylineCreator, 'Polyline Creator', true],
                        // [GradientPolylines, 'Gradient Polylines', true],
                        [AnimatedViews, 'Animating with MapViews'],
                        // [AnimatedMarkers, 'Animated Marker Position'],
                        // [Callouts, 'Custom Callouts', true],
                        [Overlays, 'Circles, Polygons, and Polylines', true],
                        [DefaultMarkers, 'Default Markers', true],
                        [CustomMarkers, 'Custom Markers', true],
                        [TakeSnapshot, 'Take Snapshot', true, '(incomplete)'],

                        [CachedMap, 'Cached Map'],
                        [LoadingMap, 'Map with loading'],

                        [MapBoundaries, 'Get visible map boundaries', true],
                        [FitToSuppliedMarkers, 'Focus Map On Markers', true],
                        [FitToCoordinates, 'Fit Map To Coordinates', true],
                        [LiteMapView, 'Android Lite MapView'],
                        [CustomTiles, 'Custom Tiles', true],
                        [ZIndexMarkers, 'Position Markers with Z-index', true],
                        [MapStyle, 'Customize the style of the map', true],
                        [LegalLabel, 'Reposition the legal label', true],
                        [SetNativePropsOverlays, 'Update native props', true],
                        [CustomOverlay, 'Custom Overlay Component', true],
                        [MapKml, 'Load Map with KML', true],
                        [BugMarkerWontUpdate, 'BUG: Marker Won\'t Update (Android)', true],
                        [ImageOverlayWithAssets, 'Image Overlay Component with Assets', true],
                        [ImageOverlayWithURL, 'Image Overlay Component with URL', true],
                        // [AnimatedNavigation, 'Animated Map Navigation', true],
                        [OnPoiClick, 'On Poi Click', true],
                        // [IndoorMap, 'Indoor Map', true],
                        // [CameraControl, 'CameraControl', true],
                    ]
                        // Filter out examples that are not yet supported for Google Maps on iOS.
                        .filter(example => ANDROID || (IOS && (example[2] || !this.state.useGoogleMaps)))
                        .map(makeExampleMapper(IOS && this.state.useGoogleMaps))
                    )
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

    moveRegion(region) {
        if (this.ready) {
            setTimeout(() => !this.closed && this.map.animateToRegion(region), 10);

            this.setState({ region });
        }
    }

    @autobind
    onMapReady(e) {
        this.ready = true;
    };

    @autobind
    onRegionChange(region) {
        // console.log('onRegionChange', region);
    };

    @autobind
    onRegionChangeComplete(region) {
        // console.log('onRegionChangeComplete', region);
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
        /*
        width: '100%',
        height: '100%'
        */
    },





    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    scrollview: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    button: {
        flex: 1,
        marginTop: 10,
        backgroundColor: 'rgba(220,220,220,0.7)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
    },
    back: {
        position: 'absolute',
        top: 20,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 12,
        borderRadius: 20,
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
