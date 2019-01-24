import React from 'react';
import { StyleSheet, Modal, View, TouchableOpacity, Platform } from 'react-native';
import { Header } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete/GooglePlacesAutocomplete';
import { Constants } from 'expo';
import { Theme } from './rnff/src/components';
import { Globals } from "./Globals";

// const homePlace = { description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } } };
// const workPlace = { description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } } };
const Bangkok = { description: 'Bangkok, Thailand', place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE', geometry: { location: { lat: 13.7563309, lng: 100.5017651 } } };
const Manila = { description: 'Manila, Philippines', place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk', geometry: { location: { lat: 14.5995124, lng: 120.9842195 } } };
const HoChiMinh = { description: 'Ho Chi Minh, Vietnam', place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E', geometry: { location: { lat: 10.8230989, lng: 106.6296638 } } };
const Vientiane = { description: 'Vientiane, Laos', place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8', geometry: { location: { lat: 17.9757058, lng: 102.6331035 } } };


export default class SearchScreen extends React.Component {
    componentWillUnmount() {
        this.isClosed = true;
    }

    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <TouchableOpacity
                        // style={{ marginTop: Platform.OS === "ios" ? Constants.statusBarHeight + Header.HEIGHT / 3 - 3 : Header.HEIGHT / 3 - 3, marginRight: 22, alignSelf: 'baseline' }}
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <GooglePlacesAutocomplete
                    enablePoweredByContainer={false}
                    placeholder='Where to?'
                    minLength={2} // minimum length of text to search
                    autoFocus={false}
                    returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                    listViewDisplayed='auto'    // true/false/undefined
                    // listViewDisplayed={this.state.showPlaceSearchListView}
                    fetchDetails={true}
                    // fetchDetails={false}
                    renderDescription={row => row.description} // custom description render
                    onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
                        console.log('data', data);
                        console.log('details', details);
                        console.log('data.place_id', data.place_id);
                        console.log('data.description', data.description);

                        // console.log('details', details.geometry.location);
                        // const location = details.geometry.location;
                        // location.lat;
                        // location.lng;

                        // close the modal in 0.3 sec
                        setTimeout(() => {
                            !this.isClosed && this.props.navigation.goBack();
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
                            // backgroundColor: 'green',
                            //borderRadius: 25,

                            // textAlignVertical: 'top',
                            // alignSelf: 'center',
                            /*
                            position: 'absolute',
                            left: 0,
                            right: 60,
                            height: 60,
                            */

                            backgroundColor: 'transparent',
                            // backgroundColor: "rgb(61, 61, 61)",
                            height: 40,
                            fontSize: 24,
                            color: "white",
                            fontFamily: "SFProText-Regular"
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
                            // fontWeight: '500',
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
                // renderLeftButton={() => <Image source={require('path/custom/left-icon')} />}
                /*
                renderLeftButton={() =>
                    <TouchableOpacity
                        style={{ position: 'absolute', left: 30, top: 10, alignSelf: 'baseline' }}
                        onPress={() => {
                            // this.startEditing();
                        }}
                    >
                        <FontAwesome name='search' color="grey" size={20} />
                    </TouchableOpacity>
                }
                */
                // renderRightButton={() => <Text>Custom text after the input</Text>}
                />
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
        height: Globals.searchBarHeight,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center'
    }
});