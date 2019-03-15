import React from 'react';
import { StyleSheet, BackHandler, View, TouchableOpacity, Platform } from 'react-native';
import { Header } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete/GooglePlacesAutocomplete';
import { Constants } from 'expo';
import { Theme } from './rnff/src/components';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";

// const homePlace = { description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } } };
// const workPlace = { description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } } };
const Bangkok = { description: 'Bangkok, Thailand', place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE', geometry: { location: { lat: 13.7563309, lng: 100.5017651 } } };
const Manila = { description: 'Manila, Philippines', place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk', geometry: { location: { lat: 14.5995124, lng: 120.9842195 } } };
const HoChiMinh = { description: 'Ho Chi Minh, Vietnam', place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E', geometry: { location: { lat: 10.8230989, lng: 106.6296638 } } };
const Vientiane = { description: 'Vientiane, Laos', place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8', geometry: { location: { lat: 17.9757058, lng: 102.6331035 } } };


export default class SearchScreen extends React.Component {
    state = {
        renderScreen: false
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        setTimeout(() => {
            !this.closed && this.setState({ renderScreen: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('SearchScreen.handleHardwareBackPress');


        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'SearchScreen';
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.closed = true;
    }

    render() {
        const from = this.props.navigation.state.params.from;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    {
                        from === 'AdvertisementMain' ?
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
                                <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                            </TouchableOpacity>
                            :
                            <TouchableOpacity
                                style={{
                                    width: 48,
                                    height: 48,
                                    position: 'absolute',
                                    bottom: 2,
                                    left: 2,
                                    justifyContent: "center", alignItems: "center"
                                }}
                                onPress={() => this.props.navigation.goBack()}
                            >
                                <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                            </TouchableOpacity>
                    }
                </View>

                {
                    this.state.renderScreen &&
                    <GooglePlacesAutocomplete
                        enablePoweredByContainer={false}
                        placeholder='Where to?'
                        minLength={2} // minimum length of text to search
                        autoFocus={false}
                        returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                        listViewDisplayed='auto'    // true/false/undefined
                        // listViewDisplayed={this.state.showPlaceSearchListView}
                        fetchDetails={true}
                        renderDescription={row => row.description} // custom description render
                        onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                            // console.log('data', data);
                            // console.log('details', details);

                            // close the modal in 0.3 sec
                            setTimeout(() => {
                                if (this.closed) return;

                                const location = details.geometry.location;
                                const result = {
                                    description: data.description,
                                    place_id: data.place_id,
                                    location: {
                                        lat: location.lat,
                                        lng: location.lng
                                    }
                                }

                                this.props.navigation.state.params.initFromSearch(result);
                                this.props.navigation.goBack();
                            }, 300);
                        }}

                        getDefaultValue={() => ''}

                        query={{
                            // available options: https://developers.google.com/places/web-service/autocomplete
                            key: 'AIzaSyC6j5HXFtYTYkV58Uv67qyd31KjTXusM2A',
                            language: 'en', // language of the results
                            types: '(cities)' // default: 'geocode'
                        }}

                        styles={{
                            container: {
                                // position: 'absolute',
                                // left: 0, right: 0,
                                // bottom: 0,

                                // width: '100%',

                                // height: 32,
                                // height: Dimensions.get('window').height - (Constants.statusBarHeight + 2), // - bottom tab height

                                // top: Constants.statusBarHeight + 2,
                                // backgroundColor: 'transparent',
                                backgroundColor: 'transparent',
                            },
                            textInputContainer: {
                                /*
                                position: 'absolute',
                                left: 40,
                                right: 40,
                                alignSelf: 'baseline',
                                borderRadius: 25,
                                */
                                // height: 50,
                                // backgroundColor: 'grey',
                                backgroundColor: 'transparent',
                                borderTopColor: 'transparent',
                                borderBottomColor: 'transparent'
                            },
                            textInput: {
                                // width: '70%',
                                // position: 'absolute',
                                // left: 60,
                                // right: 60,
                                // borderRadius: 25,

                                // textAlignVertical: 'top',
                                // alignSelf: 'center',
                                /*
                                position: 'absolute',
                                left: 0,
                                right: 60,
                                height: 60,
                                */

                                // flex: 1,
                                // backgroundColor: 'transparent',
                                // backgroundColor: "green",
                                /*
                                height: 40,
                                fontSize: 24,
                                color: "white",
                                fontFamily: "SFProText-Regular",
                                */
                            },

                            listView: {
                                marginTop: 20,
                                // position: 'absolute',
                                // width: '100%',
                                // left: 0, right: 0,
                                height: '100%',
                                backgroundColor: 'transparent'
                            },
                            separator: {
                                backgroundColor: 'transparent'
                            },
                            description: {
                                fontSize: 16,
                                lineHeight: 20,
                                height: 30,
                                color: "white",
                                fontFamily: "SFProText-Regular",
                            },
                            predefinedPlacesDescription: {
                                // color: 'rgb(234, 150, 24)'
                                color: 'white'
                            },
                            poweredContainer: {
                                backgroundColor: 'transparent',
                                width: 0,
                                height: 0
                            },
                            powered: {
                                backgroundColor: 'transparent',
                                width: 0,
                                height: 0
                            }
                        }}

                        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                        currentLocationLabel="Current location"
                        nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                        GoogleReverseGeocodingQuery={{
                            // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                        }}
                        GooglePlacesSearchQuery={{
                            // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                            rankby: 'distance',
                            types: 'food'
                        }}

                        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
                        predefinedPlaces={[Bangkok, Manila, HoChiMinh, Vientiane]}

                        debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                    // renderLeftButton={() => <Image source={require('path/custom/left-icon')}/>}
                    /*
                    renderLeftButton={() =>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 30, top: 10, alignSelf: 'baseline' }}
                            onPress={() => {
                                // this.startEditing();
                            }}
                        >
                            <FontAwesome name='search' color="grey" size={20}/>
                        </TouchableOpacity>
                    }
                    */
                    // renderRightButton={() => <Text>Custom text after the input</Text>}
                    />
                }
            </View>
        );
    }
};

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
    }
});
