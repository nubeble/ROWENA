import React from 'react';
import { StyleSheet, BackHandler, View, TouchableOpacity, AsyncStorage, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import { Header } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete/GooglePlacesAutocomplete';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";
import Util from './Util';

const API_KEY = 'AIzaSyDGeKg4ewR0-MfmHnBWkv6Qfeoc5Ia4vP8'; // API key for Places API, Geocoding API, Cloud Translation API

// const homePlace = { description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } } };
// const workPlace = { description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } } };
const Bangkok = { description: 'Bangkok, Thailand', place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE', geometry: { location: { lat: 13.7563309, lng: 100.5017651 } } };
const Manila = { description: 'Manila, Philippines', place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk', geometry: { location: { lat: 14.5995124, lng: 120.9842195 } } };
const HoChiMinh = { description: 'Ho Chi Minh City, Vietnam', place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E', geometry: { location: { lat: 10.8230989, lng: 106.6296638 } } };
const Vientiane = { description: 'Vientiane, Laos', place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8', geometry: { location: { lat: 17.9757058, lng: 102.6331035 } } };


export default class SearchScreen extends React.Component {
    state = {
        // renderScreen: false
        history: null
    };

    async componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const from = this.props.navigation.state.params.from;
        if (from !== 'AdvertisementMain' && from !== 'EditProfile') await this.loadHistory();

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderScreen: true });
        }, 0);
        */
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'SearchScreen.handleHardwareBackPress');

        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'SearchScreen';
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;
    }

    render() {
        const from = this.props.navigation.state.params.from;
        const countryCode = this.props.navigation.state.params.countryCode;

        const components = 'country:' + countryCode;

        let predefinedPlaces = null;

        if (from === 'EditProfile') {
            // use predefined
            predefinedPlaces = this.getPredefinedPlaces();
        } else if (from === 'AdvertisementMain') {
            predefinedPlaces = [];
        } else {
            if (!this.state.history) {
                // use predefined
                predefinedPlaces = this.getPredefinedPlaces();
            } else {
                // use history
                predefinedPlaces = this.getSavedPlaces();
            }
        }

        let placeholder = '';
        if (from === 'EditProfile') placeholder = 'Where are you from? (City)';
        else if (from === 'AdvertisementMain') placeholder = 'Where do you live? (Street)';
        else placeholder = 'Where to? (City)';

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
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
                        <Ionicons name={from === 'AdvertisementMain' || from === 'EditProfile' ? 'md-arrow-back' : 'md-close'} color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    // this.state.renderScreen &&
                    <GooglePlacesAutocomplete
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
                                fontFamily: "Roboto-Light",
                                */
                            },
                            listView: {
                                // marginTop: 20,
                                // position: 'absolute',
                                // width: '100%',
                                // left: 0, right: 0,
                                // height: '100%',
                                // backgroundColor: 'transparent'
                            },
                            separator: {
                                backgroundColor: 'transparent'
                            },

                            predefinedPlacesDescription: {
                                /*
                                fontSize: 14,
                                color: Theme.color.text2,
                                fontFamily: "Roboto-Light",
                                */
                                // height: 30,

                                // backgroundColor: 'green'
                            },
                            description: {
                                /*
                                fontSize: 14,
                                color: Theme.color.text2,
                                fontFamily: "Roboto-Light",
                                */
                                // height: 30,

                                // backgroundColor: 'blue'
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
                        enablePoweredByContainer={false}
                        placeholder={placeholder}
                        placeholderTextColor={Theme.color.placeholder}
                        minLength={2} // minimum length of text to search
                        autoFocus={false}
                        returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                        listViewDisplayed='auto'    // true/false/undefined
                        // listViewDisplayed={this.state.showPlaceSearchListView}
                        fetchDetails={true}
                        // renderDescription={row => row.description} // custom description render
                        onFail={(message) => {
                            this.showToast(message, 500);
                        }}
                        onPress={async (data, details = null) => { // 'details' is provided when fetchDetails = true
                            console.log('jdub', 'SearchScreen, data', data);
                            console.log('jdub', 'SearchScreen, details', details);

                            if (!details) this.props.navigation.goBack();

                            /*
                            // filter "Kyiv, Ukraine, 02000"
                            let description1 = data.description;
                            description1 = Util.filterNumber(description1);
                            */
                            let description1 = data.description;

                            const location = details.geometry.location;
                            const result = {
                                description: description1,
                                place_id: data.place_id,
                                location: {
                                    lat: location.lat,
                                    lng: location.lng
                                }
                            };

                            // save the keyword to storage
                            // --
                            if (from !== 'AdvertisementMain' && from !== 'EditProfile') {
                                const item = {
                                    description: data.description,
                                    place_id: data.place_id,
                                    geometry: {
                                        location: {
                                            lat: location.lat,
                                            lng: location.lng
                                        }
                                    }
                                };

                                await this.saveHistory(JSON.stringify(item));
                            }
                            // --

                            if (from === 'AdvertisementMain') {
                                // ToDo: exception for city-state (Macao, Hong Kong, ...)
                                let type = 200; // 100: city-state, 200: city
                                if (countryCode === 'MO' || countryCode === 'HK' || countryCode === 'MC' || countryCode === 'SG') {
                                    console.log('jdub', '!!!!!!!! city-state !!!!!!!!');
                                    type = 100;
                                }

                                const input = {
                                    lat: location.lat,
                                    lng: location.lng
                                };

                                const key = API_KEY;

                                Util.getPlaceId(input, key, type, (obj) => {
                                    if (this.closed) return;

                                    if (!obj) { // error
                                        // ToDo: toast or something
                                        this.showToast('Please try again.', 500);
                                        return;
                                    }

                                    console.log('jdub', 'Util.getPlaceId result', obj);

                                    let address = obj.formatted_address;

                                    // filter "Kyiv, Ukraine, 02000"
                                    address = Util.filterNumber(address);

                                    address = Util.getPlace(address);

                                    const city = {
                                        name: address,
                                        placeId: obj.place_id,
                                        location: {
                                            lat: obj.geometry.location.lat,
                                            lng: obj.geometry.location.lng
                                        }
                                    };

                                    this.props.navigation.state.params.initFromSearch(result, city);
                                    this.props.navigation.goBack();
                                });
                            } else {
                                setTimeout(() => {
                                    if (this.closed) return;

                                    this.props.navigation.state.params.initFromSearch(result);
                                    this.props.navigation.goBack();
                                }, Cons.buttonTimeout);
                            }
                        }}

                        getDefaultValue={() => ''}
                        query={
                            from === 'AdvertisementMain' ?
                                {
                                    key: API_KEY,
                                    language: 'en',
                                    // types: ['establishment'],
                                    types: ['address'],
                                    components: components
                                }
                                :
                                {
                                    // available options: https://developers.google.com/places/web-service/autocomplete
                                    key: API_KEY,
                                    language: 'en', // language of the results
                                    // types: ['(cities)'] // default: 'geocode'
                                    types: ['geocode', 'political']
                                }
                        }

                        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                        currentLocationLabel="Current location"

                        nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch

                        GooglePlacesSearchQuery={{
                            // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                            rankby: 'distance',
                            types: 'food'
                        }}
                        // filterPlacesSearchByTypes={['locality', 'administrative_area_level_3']}
                        // filterPlacesSearchByTypes={from === 'AdvertisementMain' ? ['geocode'] : ['locality', 'administrative_area_level_3']}
                        filterPlacesSearchByTypes={
                            from === 'AdvertisementMain' ?
                                []
                                :
                                // filter with all these types to find a city
                                /*
                                [
                                    ["locality", "political", "geocode"],
                                    ["administrative_area_level_1", "political", "geocode"]
                                ]
                                */
                                [
                                    // ["colloquial_area", "locality", "political"],
                                    // ["locality", "political"],
                                    ["colloquial_area", "locality", "political", "geocode"],
                                    ["locality", "political", "geocode"],
                                    // ["country", "political", "geocode"]

                                    // ['locality', 'administrative_area_level_3'],
                                    // ['street_address']
                                ]
                        }

                        GoogleReverseGeocodingQuery={{
                            // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
                        }}
                        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

                        predefinedPlaces={predefinedPlaces}
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
                }
            </View>
        );
    }

    getPredefinedPlaces() {
        const predefinedPlaces = [Bangkok, Manila, HoChiMinh, Vientiane];
        predefinedPlaces[0].icon = 'predefined';
        predefinedPlaces[1].icon = 'predefined';
        predefinedPlaces[2].icon = 'predefined';
        predefinedPlaces[3].icon = 'predefined';

        return predefinedPlaces;
    }

    getSavedPlaces() {
        const predefinedPlaces = [];

        for (let i = 0; i < this.state.history.length; i++) {
            let item = this.state.history[i];
            if (item) {
                item.icon = 'saved';
                predefinedPlaces.push(item);
            }
        }

        if (predefinedPlaces.length < 4) {
            const predefinedList = [];
            predefinedList.push(Bangkok);
            predefinedList.push(Manila);
            predefinedList.push(HoChiMinh);
            predefinedList.push(Vientiane);

            const startIndex = predefinedPlaces.length;
            for (let i = startIndex; i < 4; i++) {
                predefinedPlaces.push(predefinedList[i]);
            }
        }

        return predefinedPlaces;
    }

    async loadHistory() {
        console.log('jdub', 'SearchScreen.loadHistory');

        /*
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.log('jdub', 'loadHistory clear error', error);
        }
        */

        // check
        /*
        try {
            const keys = await AsyncStorage.getAllKeys();
            console.log('jdub', 'loadHistory keys', keys);
        } catch (error) {
            console.log('jdub', 'loadHistory error', error);
        }
        */

        // this.storageIndex = -1;

        /*
        let result = await this._retrieveData('LAST_INDEX');

        console.log('jdub', 'loaded index', result);

        if (result) {
            const index = parseInt(result);

            this.storageIndex = index;

            let storageItem1 = null;
            let storageItem2 = null;
            let storageItem3 = null;
            let storageItem4 = null;

            result = await this._retrieveData('ITEM1');
            if (result) {
                storageItem1 = JSON.parse(result);
            }
            result = await this._retrieveData('ITEM2');
            if (result) {
                storageItem2 = JSON.parse(result);
            }
            result = await this._retrieveData('ITEM3');
            if (result) {
                storageItem3 = JSON.parse(result);
            }
            result = await this._retrieveData('ITEM4');
            if (result) {
                storageItem4 = JSON.parse(result);
            }

            // reorder
            let data = [];
            switch (this.storageIndex) {
                case 0:
                    data[0] = storageItem1;
                    data[1] = storageItem4;
                    data[2] = storageItem3;
                    data[3] = storageItem2;
                    break;

                case 1:
                    data[0] = storageItem2;
                    data[1] = storageItem1;
                    data[2] = storageItem4;
                    data[3] = storageItem3;
                    break;

                case 2:
                    data[0] = storageItem3;
                    data[1] = storageItem2;
                    data[2] = storageItem1;
                    data[3] = storageItem4;
                    break;

                case 3:
                    data[0] = storageItem4;
                    data[1] = storageItem3;
                    data[2] = storageItem2;
                    data[3] = storageItem1;
                    break;
            }

            !this.closed && this.setState({ history: data });
        }
        */
        const keys = ['LAST_INDEX', 'ITEM1', 'ITEM2', 'ITEM3', 'ITEM4'];
        const stores = await this._retrieveMultiData(keys);

        let index = -1;
        let storageItem1 = null;
        let storageItem2 = null;
        let storageItem3 = null;
        let storageItem4 = null;

        stores.map((result, i, store) => {
            // get at each store's key/value so you can work with it
            let key = store[i][0];
            let value = store[i][1];

            if (key === 'LAST_INDEX') {
                if (value) index = parseInt(value);
            } else if (key === 'ITEM1') {
                if (value) storageItem1 = JSON.parse(value);
            } else if (key === 'ITEM2') {
                if (value) storageItem2 = JSON.parse(value);
            } else if (key === 'ITEM3') {
                if (value) storageItem3 = JSON.parse(value);
            } else if (key === 'ITEM4') {
                if (value) storageItem4 = JSON.parse(value);
            }
        });

        if (index === -1) {
            this.storageIndex = -1;
            return;
        }

        // reorder
        let data = [];
        switch (index) {
            case 0:
                data[0] = storageItem1;
                data[1] = storageItem4;
                data[2] = storageItem3;
                data[3] = storageItem2;
                break;

            case 1:
                data[0] = storageItem2;
                data[1] = storageItem1;
                data[2] = storageItem4;
                data[3] = storageItem3;
                break;

            case 2:
                data[0] = storageItem3;
                data[1] = storageItem2;
                data[2] = storageItem1;
                data[3] = storageItem4;
                break;

            case 3:
                data[0] = storageItem4;
                data[1] = storageItem3;
                data[2] = storageItem2;
                data[3] = storageItem1;
                break;
        }

        this.storageIndex = index;

        !this.closed && this.setState({ history: data });
    }

    async saveHistory(item) {
        console.log('jdub', 'saveHistory', item);

        let index = this.storageIndex + 1;
        if (index === 4) {
            index = 0;
        }

        const number = index + 1;

        /*
        switch (number) {
            case 1:
                await this._storeData('ITEM1', item);
                break;

            case 2:
                await this._storeData('ITEM2', item);
                break;

            case 3:
                await this._storeData('ITEM3', item);
                break;

            case 4:
                await this._storeData('ITEM4', item);
                break;
        }

        await this._storeData('LAST_INDEX', index.toString());
        */
        let data = [];
        switch (number) {
            case 1:
                data.push(['ITEM1', item]);
                data.push(['LAST_INDEX', index.toString()]);
                break;

            case 2:
                data.push(['ITEM2', item]);
                data.push(['LAST_INDEX', index.toString()]);
                break;

            case 3:
                data.push(['ITEM3', item]);
                data.push(['LAST_INDEX', index.toString()]);
                break;

            case 4:
                data.push(['ITEM4', item]);
                data.push(['LAST_INDEX', index.toString()]);
                break;
        }

        if (data.length > 0) await this._storeMultiData(data);

        this.storageIndex = index;
    }

    /*
    _storeData = async (key, value) => {
        console.log('jdub', '_storeData', key, value);

        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            // Error saving data
        }
    }
    */

    _storeMultiData = async (data) => {
        console.log('jdub', '_storeMultiData', data);

        try {
            await AsyncStorage.multiSet(data);
        } catch (error) {
            // Error saving data
        }
    }

    /*
    _retrieveData = async (key) => {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value !== null) {
                console.log('jdub', '_retrieveData', key, value);
            }

            return value;
        } catch (error) {
            console.log('jdub', '_retrieveData error', error);
            // Error retrieving data
            return null;
        }
    }
    */

    _retrieveMultiData = async (keys) => {
        try {
            const values = await AsyncStorage.multiGet(keys);
            if (values !== null) {
                console.log('jdub', '_retrieveMultiData', keys, values);
            }

            return values;
        } catch (error) {
            console.log('jdub', '_retrieveMultiData error', error);
            // Error retrieving data
            return null;
        }
    }

    showToast(msg, ms, cb = null) {
        if (this.props.screenProps.data) this.props.screenProps.data.showToast(msg, ms, cb);
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
