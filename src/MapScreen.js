import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { MapView, Constants } from 'expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text } from "./rnff/src/components";
import { Cons } from "./Globals";
import autobind from "autobind-decorator";


export default class MapScreen extends React.Component {
    state = {
        region: { // current region
            latitude: -37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
        },
        ready: false,
        renderMap: false
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        // ToDo
        // this.getCurrentPosition();

        setTimeout(() => {
            !this.isClosed && this.setState({ renderMap: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.goBack();

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.isClosed = true;
    }

    render() {
        const { post } = this.props.navigation.state.params;

        const latitude = post.location.latitude;
        const longitude = post.location.longitude;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            // this.props.navigation.state.params.onGoBack();
                            this.props.navigation.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="black" size={24}/>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.getCurrentPosition()}
                    >
                        <MaterialIcons name='gps-fixed' color="black" size={24}/>
                    </TouchableOpacity>

                    {/* ToDo: get geolocation of my location */}
                    <Text style={styles.distance}>? kilometers away</Text>
                </View>

                {
                    this.state.renderMap &&
                        <MapView
                            ref={map => { this.map = map }}
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
                            <MapView.Marker
                                coordinate={{
                                    latitude: latitude,
                                    longitude: longitude
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
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const region = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    };

                    this.setRegion(region);
                },
                (error) => {
                    //TODO: better design
                    /*
                    switch (error.code) {
                        case 1:
                            if (Platform.OS === "ios") {
                                Alert.alert("", "Para ubicar tu locación habilita permiso para la aplicación en Ajustes - Privacidad - Localización");
                            } else {
                                Alert.alert("", "Para ubicar tu locación habilita permiso para la aplicación en Ajustes - Apps - ExampleApp - Localización");
                            }
                            break;
                        default:
                            Alert.alert("", "Error al detectar tu locación");
                    }
                    */
                    console.log('getCurrentPosition() error', error);
                }
            );
        } catch (e) {
            alert(e.message || "");
        }
    }

    setRegion(region) {
        if (this.state.ready) {
            setTimeout(() => this.map.animateToRegion(region), 10);
        }

        this.setState({ region });
    }

    onMapReady = (e) => {
        if (!this.state.ready) {
            this.setState({ ready: true });
        }
    };

    onRegionChange = (region) => {
        // console.log('onRegionChange', region);
    };

    onRegionChangeComplete = (region) => {
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
        fontFamily: "SFProText-Semibold",
        color: "black"
    },
    map: {
        flex: 1
        /*
        width: '100%',
        height: '100%'
        */
    }
});
