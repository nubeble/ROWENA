import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    TextInput, View, FlatList, ScrollView, Image, StyleSheet, Dimensions,
    TouchableHighlight, Platform, ActivityIndicator, PixelRatio, TouchableOpacity
} from 'react-native';
import Qs from 'qs';
// import debounce from 'lodash.debounce';
import { debounce } from 'lodash';
import { Text, Theme, RefreshIndicator } from '../rnff/src/components';
import { Ionicons, FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Cons } from '../Globals';

const API_KEY = 'AIzaSyC6j5HXFtYTYkV58Uv67qyd31KjTXusM2A';

const WINDOW = Dimensions.get('window');

const defaultStyles = {
    container: {
        flex: 1,
    },
    textInputContainer: {
        // backgroundColor: '#C9C9CE',
        height: 52,
        /*
        borderTopColor: '#7e7e7e',
        borderBottomColor: '#b5b5b5',
        borderTopWidth: 1 / PixelRatio.get(),
        borderBottomWidth: 1 / PixelRatio.get(),
        */
        flexDirection: 'row'
    },
    textInput: {
		/*
		backgroundColor: '#FFFFFF',
		height: 28,
		borderRadius: 5,
		paddingTop: 4.5,
		paddingBottom: 4.5,
		paddingLeft: 10,
		paddingRight: 10,
		marginTop: 7.5,
		marginLeft: 8,
		marginRight: 8,
		fontSize: 15,
		flex: 1
		*/


        // borderRadius: 5,
        marginTop: 8,
        marginLeft: 8,
        marginRight: 42,
        paddingLeft: 8,
        paddingRight: 8,

        backgroundColor: 'transparent',
        // backgroundColor: 'green',
        // width: '100%',
        flex: 1,
        height: 40,
        fontSize: 24,
        color: "white",
        fontFamily: "Roboto-Regular"
    },
    poweredContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    powered: {},
    listView: {},
    row: {
        width: WINDOW.width,
        /*
        height: 48,
        paddingLeft: 18,
        paddingRight: 18,
        paddingTop: 16,
        */
        height: 60,
        paddingLeft: 20,
        paddingRight: 20,

        flexDirection: 'row'
    },
    separator: {
        width: '90%',
        height: StyleSheet.hairlineWidth,
        // backgroundColor: '#c8c7cc',
        // backgroundColor: Theme.color.line
        backgroundColor: 'white'
    },
    description: {},
    loader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height: 20,
    },
    /*
    androidLoader: {
        marginRight: -15,
    },
    */

    currentLocationText: {
        color: Theme.color.selection
    }
};


export default class GooglePlacesAutocomplete extends Component {
    _results = [];
    _requests = [];

    constructor(props) {
        super(props);

        this.state = this.getInitialState.call(this);
    }

    getInitialState = () => ({
        text: this.props.getDefaultValue(),
        dataSource: this.buildRowsFromResults([]),
        listViewDisplayed: this.props.listViewDisplayed === 'auto' ? false : this.props.listViewDisplayed,

        clearButtonDisplayed: false,
        isLoading: false
    })

    // setAddressText = address => !this.closed && this.setState({ text: address })
    // getAddressText = () => this.state.text

    buildRowsFromResults = (results) => {
        let res = [];

        if (results.length === 0 || this.props.predefinedPlacesAlwaysVisible === true) {
            res = [...this.props.predefinedPlaces];

            if (this.props.currentLocation === true) {
                res.unshift({
                    description: this.props.currentLocationLabel,
                    isCurrentLocation: true,
                });
            }
        }

        res = res.map(place => ({
            ...place,
            isPredefinedPlace: true
        }));

        return [...res, ...results];
    }

    componentWillMount() {
        this._request = this.props.debounce
            ? debounce(this._request, this.props.debounce)
            : this._request;
    }

    componentDidMount() {
        // This will load the default value's search results after the view has
        // been rendered
        this._handleChangeText(this.state.text);

        setTimeout(() => {
            !this.closed && this.refs.textInput && this.refs.textInput.focus();
        }, Cons.buttonTimeoutLong);
    }

    componentWillReceiveProps(nextProps) {
        let listViewDisplayed = true;

        if (nextProps.listViewDisplayed !== 'auto') {
            listViewDisplayed = nextProps.listViewDisplayed;
        }

        if (typeof (nextProps.text) !== "undefined" && this.state.text !== nextProps.text) {
            !this.closed && this.setState({
                listViewDisplayed: listViewDisplayed
            },
                this._handleChangeText(nextProps.text));
        } else {
            !this.closed && this.setState({
                listViewDisplayed: listViewDisplayed
            });
        }
    }

    componentWillUnmount() {
        this._abortRequests();

        this.closed = true;
    }

    _abortRequests = () => {
        this._requests.map(i => i.abort());
        this._requests = [];
    }

	/**
	 * This method is exposed to parent components to focus on textInput manually.
	 * @public
	 */
    triggerFocus = () => {
        if (this.refs.textInput) this.refs.textInput.focus();
    }

	/**
	 * This method is exposed to parent components to blur textInput manually.
	 * @public
	 */
    triggerBlur = () => {
        if (this.refs.textInput) this.refs.textInput.blur();
    }

    getCurrentLocation = () => {
        // console.log('GooglePlacesAutocomplete.getCurrentLocation');

        // show loader
        this.setState({ isLoading: true });

        let options = {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 1000
        };

        if (this.props.enableHighAccuracyLocation && Platform.OS === 'android') {
            options = {
                enableHighAccuracy: true,
                timeout: 20000
            }
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('navigator.geolocation.getCurrentPosition', position);

                // set text
                const name = position.coords.latitude + ', ' + position.coords.longitude;
                !this.closed && this.setState({ text: name });

                if (this.props.nearbyPlacesAPI === 'None') {
                    let currentLocation = {
                        description: this.props.currentLocationLabel,
                        geometry: {
                            location: {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            }
                        }
                    };

                    // hide loader
                    this.setState({ isLoading: false });

                    this._disableRowLoaders();
                    this.props.onPress(currentLocation, currentLocation);
                } else { // GoogleReverseGeocoding or GooglePlacesSearch
                    // this._requestNearby(position.coords.latitude, position.coords.longitude);

                    const input = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    const key = API_KEY;

                    if (this.props.predefinedPlaces.length === 0) { // 'AdvertisementMain'
                        // get current location (street)
                        this.getStreetAddress(input, key, (obj) => {
                            if (this.closed) return;

                            console.log('this.getStreetAddress result', obj);

                            // Consider: exception
                            // if (obj.formatted_address === 'Macau') obj.formatted_address = 'Macau, China';

                            // set text
                            !this.closed && this.setState({ text: obj.formatted_address });

                            const data = {
                                description: obj.formatted_address,
                                place_id: obj.place_id
                            };

                            const details = {
                                geometry: {
                                    location: {
                                        lat: obj.geometry.location.lat,
                                        lng: obj.geometry.location.lng
                                    }
                                }
                            };

                            // hide loader
                            this.setState({ isLoading: false });

                            this._disableRowLoaders();
                            this.props.onPress(data, details);
                        });
                    } else {
                        // get current location (city)
                        this.getPlaceId(input, key, (obj) => {
                            if (this.closed) return;

                            console.log('this.getPlaceId result', obj);

                            // Consider: exception
                            // if (obj.formatted_address === 'Macau') obj.formatted_address = 'Macau, China';

                            // set text
                            !this.closed && this.setState({ text: obj.formatted_address });

                            const data = {
                                description: obj.formatted_address,
                                place_id: obj.place_id
                            };

                            const details = {
                                geometry: {
                                    location: {
                                        lat: obj.geometry.location.lat,
                                        lng: obj.geometry.location.lng
                                    }
                                }
                            };

                            // hide loader
                            this.setState({ isLoading: false });

                            this._disableRowLoaders();
                            this.props.onPress(data, details);
                        });
                    }
                }
            },
            (error) => {
                console.log('navigator.geolocation.getCurrentPosition error', error.message);
                this._disableRowLoaders();
                // if (this.props.onFail) this.props.onFail(error.message);
                if (this.props.onFail) this.props.onFail('Please turn Location Services on.');
            }, options
        );
    }

    _onPress = (rowData) => {
        if (rowData.isPredefinedPlace !== true && this.props.fetchDetails === true) {
            if (rowData.isLoading === true) {
                // already requesting
                return;
            }

            this._abortRequests();

            // display loader
            this._enableRowLoader(rowData);

            // fetch details
            const request = new XMLHttpRequest();
            this._requests.push(request);
            request.timeout = this.props.timeout;
            request.ontimeout = this.props.onTimeout;
            request.onreadystatechange = () => {
                if (request.readyState !== 4) return;

                if (request.status === 200) {
                    const responseJSON = JSON.parse(request.responseText);

                    if (responseJSON.status === 'OK') {
                        if (!this.closed) {
                            const details = responseJSON.result;
                            this._disableRowLoaders();
                            this._onBlur();

                            !this.closed && this.setState({ text: this._renderDescription(rowData) });

                            if (this.refs.textInput) this.refs.textInput.setNativeProps({ selection: { start: 0, end: 0 } });

                            delete rowData.isLoading;

                            // Consider: exception
                            // if (rowData.description === 'Macau') rowData.description = 'Macau, China';

                            this.props.onPress(rowData, details);
                        }
                    } else {
                        this._disableRowLoaders();

                        if (this.props.autoFillOnNotFound) {
                            !this.closed && this.setState({ text: this._renderDescription(rowData) });

                            if (this.refs.textInput) this.refs.textInput.setNativeProps({ selection: { start: 0, end: 0 } });

                            delete rowData.isLoading;
                        }

                        if (!this.props.onNotFound) {
                            console.warn('google places autocomplete: ' + responseJSON.status);
                        } else {
                            this.props.onNotFound(responseJSON);
                        }
                    }
                } else {
                    console.warn('google places autocomplete: request could not be completed or has been aborted');
                    this._disableRowLoaders();
                    if (this.props.onFail) this.props.onFail('The request could not be completed or has been aborted.');
                }
            };

            request.open('GET', 'https://maps.googleapis.com/maps/api/place/details/json?' + Qs.stringify({
                key: this.props.query.key,
                placeid: rowData.place_id,
                language: this.props.query.language
            }));

            if (this.props.query.origin !== null) {
                request.setRequestHeader('Referer', this.props.query.origin);
            }

            request.send();
        } else if (rowData.isCurrentLocation === true) {
            // display loader
            this._enableRowLoader(rowData);

            !this.closed && this.setState({ text: this._renderDescription(rowData) });

            if (this.refs.textInput) this.refs.textInput.setNativeProps({ selection: { start: 0, end: 0 } });

            this.triggerBlur(); // hide keyboard but not the results
            delete rowData.isLoading;
            this.getCurrentLocation();
        } else { // predefined place
            !this.closed && this.setState({ text: this._renderDescription(rowData) });

            if (this.refs.textInput) this.refs.textInput.setNativeProps({ selection: { start: 0, end: 0 } });

            this._onBlur();
            delete rowData.isLoading;
            let predefinedPlace = this._getPredefinedPlace(rowData);

            // sending predefinedPlace as details for predefined places
            this.props.onPress(predefinedPlace, predefinedPlace);
        }
    }

    _enableRowLoader = (rowData) => {
        let rows = this.buildRowsFromResults(this._results);
        for (let i = 0; i < rows.length; i++) {
            if ((rows[i].place_id === rowData.place_id) || (rows[i].isCurrentLocation === true && rowData.isCurrentLocation === true)) {
                rows[i].isLoading = true;
                !this.closed && this.setState({
                    dataSource: rows
                });
                break;
            }
        }
    }

    _disableRowLoaders = () => {
        if (!this.closed) {
            for (let i = 0; i < this._results.length; i++) {
                if (this._results[i].isLoading === true) {
                    this._results[i].isLoading = false;
                }
            }

            !this.closed && this.setState({
                dataSource: this.buildRowsFromResults(this._results),
            });
        }
    }

    _getPredefinedPlace = (rowData) => {
        if (rowData.isPredefinedPlace !== true) {
            return rowData;
        }

        for (let i = 0; i < this.props.predefinedPlaces.length; i++) {
            if (this.props.predefinedPlaces[i].description === rowData.description) {
                return this.props.predefinedPlaces[i];
            }
        }

        return rowData;
    }

    _filterResultsByTypes = (unfilteredResults, types) => {
        if (types.length === 0) return unfilteredResults;

        const results = [];
        for (let i = 0; i < unfilteredResults.length; i++) {
            let found = false;

            for (let j = 0; j < types.length; j++) {
                if (unfilteredResults[i].types.indexOf(types[j]) !== -1) {
                    found = true;
                    break;
                }
            }

            if (found === true) {
                results.push(unfilteredResults[i]);
            }
        }

        return results;
    }

    _filterByALLTypes = (unfilteredResults, types) => {
        if (types.length === 0) return unfilteredResults;

        const results = [];
        for (let i = 0; i < unfilteredResults.length; i++) {
            let add = true;
            let count = 0; // count of false

            for (let j = 0; j < types.length; j++) {
                /*
                if (unfilteredResults[i].types.indexOf(types[j]) === -1) {
                    found = false;
                    break;
                }
                */

                const type = types[j]; // ["locality", "political", "geocode"]

                for (let k = 0; k < type.length; k++) {
                    if (unfilteredResults[i].types.indexOf(type[k]) === -1) {
                        count++;
                        break;
                    }
                }
            }

            if (count === 2) add = false;

            if (add) {
                results.push(unfilteredResults[i]);
            }
        }

        return results;
    }

    _filterResultsByCity = (unfilteredResults, typesArray) => {
        if (typesArray.length === 0) return unfilteredResults; // never happen

        const results = [];

        for (let h = 0; h < typesArray.length; h++) {
            const types = typesArray[h];

            // --
            for (let i = 0; i < unfilteredResults.length; i++) {
                if (unfilteredResults[i].types.length !== types.length) continue;

                let found = true;

                for (let j = 0; j < types.length; j++) {
                    if (unfilteredResults[i].types.indexOf(types[j]) === -1) {
                        found = false;
                        break;
                    }
                }

                if (found === true) {
                    results.push(unfilteredResults[i]);
                    break;
                }
            }
            // --

            if (results.length > 0) break;
        }

        return results;
    }

    _requestNearby = (latitude, longitude) => {
        this._abortRequests();

        if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
            const request = new XMLHttpRequest();
            this._requests.push(request);
            request.timeout = this.props.timeout;
            request.ontimeout = this.props.onTimeout;
            request.onreadystatechange = () => {
                if (request.readyState !== 4) {
                    return;
                }

                if (request.status === 200) {
                    const responseJSON = JSON.parse(request.responseText);
                    // console.log('responseJSON', responseJSON);

                    this._disableRowLoaders();

                    if (typeof responseJSON.results !== 'undefined') {
                        if (!this.closed) {
                            let results = [];
                            if (this.props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
                                console.log('_requestNearby GoogleReverseGeocoding pre results', responseJSON.results);
                                results = this._filterResultsByTypes(responseJSON.results, this.props.filterReverseGeocodingByTypes);
                                console.log('_requestNearby GoogleReverseGeocoding results', results);
                            } else { // GooglePlacesSearch
                                // results = responseJSON.results;

                                console.log('_requestNearby GooglePlacesSearch pre results', results);
                                results = this._filterByALLTypes(responseJSON.results, this.props.filterPlacesSearchByTypes);
                                console.log('_requestNearby GooglePlacesSearch results', results);
                            }

                            !this.closed && this.setState({
                                dataSource: this.buildRowsFromResults(results)
                            });
                        }
                    }

                    if (typeof responseJSON.error_message !== 'undefined') {
                        console.warn('google places autocomplete: ' + responseJSON.error_message);
                        if (this.props.onFail) this.props.onFail(responseJSON.error_message);
                    }
                } else {
                    // console.warn("google places autocomplete: request could not be completed or has been aborted");
                }
            };

            let url = '';
            if (this.props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
                // your key must be allowed to use Google Maps Geocoding API
                url = 'https://maps.googleapis.com/maps/api/geocode/json?' + Qs.stringify({
                    latlng: latitude + ',' + longitude,
                    key: this.props.query.key,
                    ...this.props.GoogleReverseGeocodingQuery
                });
            } else { // GooglePlacesSearch
                url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' + Qs.stringify({
                    location: latitude + ',' + longitude,
                    key: this.props.query.key,
                    ...this.props.GooglePlacesSearchQuery
                });
            }

            request.open('GET', url);
            if (this.props.query.origin !== null) {
                request.setRequestHeader('Referer', this.props.query.origin)
            }
            request.send();
        } else {
            this._results = [];
            !this.closed && this.setState({
                dataSource: this.buildRowsFromResults([]),
            });
        }
    }

    _request = (text) => {
        this._abortRequests();

        if (text.length >= this.props.minLength) {
            const request = new XMLHttpRequest();
            this._requests.push(request);
            request.timeout = this.props.timeout;
            request.ontimeout = this.props.onTimeout;
            request.onreadystatechange = () => {
                if (request.readyState !== 4) {
                    return;
                }

                if (request.status === 200) {
                    const responseJSON = JSON.parse(request.responseText);

                    if (typeof responseJSON.predictions !== 'undefined') {
                        if (!this.closed) {
                            // console.log('predictions', responseJSON.predictions);

                            /*
                            const results = this.props.nearbyPlacesAPI === 'GoogleReverseGeocoding'
                                ? this._filterResultsByTypes(responseJSON.predictions, this.props.filterReverseGeocodingByTypes)
                                : responseJSON.predictions;
                            */

                            var results = [];
                            if (this.props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
                                console.log('_request GoogleReverseGeocoding pre results', responseJSON.predictions);
                                results = this._filterResultsByTypes(responseJSON.predictions, this.props.filterReverseGeocodingByTypes);
                                console.log('_request GoogleReverseGeocoding results', results);
                            } else { // GooglePlacesSearch
                                // results = responseJSON.predictions;

                                console.log('_request GooglePlacesSearch pre results', responseJSON.predictions);
                                // results = this._filterByALLTypes(responseJSON.predictions, this.props.filterPlacesSearchByTypes);
                                results = this._filterResultsByCity(responseJSON.predictions, this.props.filterPlacesSearchByTypes);
                                console.log('_request GooglePlacesSearch results', results);
                            }

                            this._results = results;
                            !this.closed && this.setState({
                                dataSource: this.buildRowsFromResults(results)
                            });
                        }
                    }

                    if (typeof responseJSON.error_message !== 'undefined') {
                        console.warn('google places autocomplete: ' + responseJSON.error_message);
                        if (this.props.onFail) this.props.onFail(responseJSON.error_message);
                    }
                } else {
                    // console.warn("google places autocomplete: request could not be completed or has been aborted");
                }
            };

            request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURIComponent(text) + '&' + Qs.stringify(this.props.query));
            /*
            request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURIComponent(text) + '&' + 
            'key=AIzaSyC6j5HXFtYTYkV58Uv67qyd31KjTXusM2A' + '&' + 'language=en' + '&' + 'types=(address)' + '&' + 'components=country:kr'
            );
            */
            if (this.props.query.origin !== null) {
                request.setRequestHeader('Referer', this.props.query.origin)
            }
            request.send();
        } else {
            this._results = [];
            !this.closed && this.setState({
                dataSource: this.buildRowsFromResults([])
            });
        }
    }

    _onChangeText = (text) => {
        this._request(text);

        !this.closed && this.setState({
            text: text,
            listViewDisplayed: !this.closed || this.props.autoFocus,
        });
    }

    _handleChangeText = (text) => {
        this._onChangeText(text);

        const onChangeText = this.props
            && this.props.textInputProps
            && this.props.textInputProps.onChangeText;

        if (onChangeText) {
            onChangeText(text);
        }



        if (text.length >= 1) {
            !this.closed && this.setState({ clearButtonDisplayed: true });
        } else {
            !this.closed && this.setState({ clearButtonDisplayed: false });
        }
    }

    _getRowLoader() {
        return (
            <ActivityIndicator
                animating={true}
                size="small"
                // color='grey'
                color={Theme.color.selection}
            />
        );
    }

    _renderRowData = (rowData) => {
        if (this.props.renderRow) {
            return this.props.renderRow(rowData);
        }

        /*
        return (
            <Text
                style={[{ flex: 1 }, this.props.suppressDefaultStyles ? {} : defaultStyles.description,
                    this.props.styles.description,
                    rowData.isPredefinedPlace ? this.props.styles.predefinedPlacesDescription : {},
                    rowData.isCurrentLocation ? defaultStyles.currentLocationText : {}
                ]}
                numberOfLines={this.props.numberOfLines}
            >
                {this._renderDescription(rowData)}
            </Text>
        );
        */



        if (rowData.isCurrentLocation) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <FontAwesome style={{ width: 20 }} name='location-arrow' color={Theme.color.selection} size={16} />
                        <Text
                            style={[defaultStyles.description, this.props.styles.description, defaultStyles.currentLocationText,
                            { fontSize: 16, fontFamily: "Roboto-Medium", marginLeft: 14, paddingTop: 2 }]}
                        >{rowData.description}</Text>
                    </View>
                </View>
            );
        }

        const description = rowData.description;
        const index = description.indexOf(',');

        let city = '';
        let state = '';

        if (index === -1) {
            city = description;

            // Consider: exception
            // if (city === 'Macau') state = 'China';
        } else {
            city = description.substring(0, index);
            state = description.substring(index + 2, description.length);

            // console.log('city', city);
            // console.log('state', state);
        }

        if (rowData.isPredefinedPlace) {
            const icon = rowData.icon;

            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                        {
                            icon === 'saved' &&
                            <MaterialIcons style={{ width: 20 }} name='watch-later' color={Theme.color.text2} size={15} />
                        }
                        {
                            icon === 'predefined' &&
                            <MaterialIcons style={{ width: 20 }} name='whatshot' color={Theme.color.text2} size={15} />
                        }
                        {
                            !icon &&
                            <Ionicons style={{ width: 20 }} name='ios-heart' color={Theme.color.text2} size={15} />
                        }
                        <View style={{ marginLeft: 14, marginRight: 20 }}>
                            <Text
                                style={[defaultStyles.description, this.props.styles.description,
                                this.props.styles.predefinedPlacesDescription,
                                { fontSize: 16, color: Theme.color.text2, fontFamily: "Roboto-Medium", marginBottom: 2 }]}
                            >{city}</Text>
                            <Text
                                style={[defaultStyles.description, this.props.styles.description,
                                this.props.styles.predefinedPlacesDescription,
                                { fontSize: 15, color: Theme.color.text3, fontFamily: "Roboto-Regular" }]}
                                numberOfLines={this.props.numberOfLines}
                            >{state}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <MaterialIcons style={{ width: 20 }} name='location-on' color={Theme.color.text2} size={15} />
                    <View style={{ marginLeft: 14, marginRight: 20 }}>
                        <Text
                            style={[defaultStyles.description, this.props.styles.description,
                            this.props.styles.predefinedPlacesDescription,
                            { fontSize: 16, color: Theme.color.text2, fontFamily: "Roboto-Medium", marginBottom: 2 }]}
                        >{city}</Text>
                        <Text
                            style={[defaultStyles.description, this.props.styles.description,
                            this.props.styles.predefinedPlacesDescription,
                            { fontSize: 15, color: Theme.color.text3, fontFamily: "Roboto-Light" }]}
                            numberOfLines={this.props.numberOfLines}
                        >{state}</Text>
                    </View>
                </View>
            </View>
        );
    }

    _renderDescription = (rowData) => {
        if (this.props.renderDescription) {
            return this.props.renderDescription(rowData);
        }

        return rowData.description || rowData.formatted_address || rowData.name;
    }

    _renderLoader = (rowData) => {
        if (rowData.isLoading === true) {
            return (
                <View style={[this.props.suppressDefaultStyles ? {} : defaultStyles.loader, this.props.styles.loader]}>
                    {this._getRowLoader()}
                </View>
            );
        }

        return null;
    }

    _renderRow = (rowData = {}, sectionID, rowID) => {
        return (
            <ScrollView
                style={{ flex: 1 }}
                scrollEnabled={this.props.isRowScrollable}
                keyboardShouldPersistTaps={this.props.keyboardShouldPersistTaps}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}>
                <TouchableHighlight
                    // style={{ width: WINDOW.width, height: (WINDOW.height / 80) * 5 }}
                    onPress={() => this._onPress(rowData)}
                // underlayColor={this.props.listUnderlayColor || "#c8c7cc"}
                >
                    <View style={[this.props.suppressDefaultStyles ? {} : defaultStyles.row, this.props.styles.row, rowData.isPredefinedPlace ? this.props.styles.specialItemRow : {}]}>
                        {this._renderRowData(rowData)}
                        {
                            // this._renderLoader(rowData)
                        }
                    </View>
                </TouchableHighlight>
            </ScrollView>
        );
    }

    _renderSeparator = (sectionID, rowID) => {
        if (rowID == this.state.dataSource.length - 1) {
            return null;
        }

        return (
            /*
            <View
                key={`${sectionID}-${rowID}`}
                style={[this.props.suppressDefaultStyles ? {} : defaultStyles.separator, this.props.styles.separator]} />
            */
            <View
                key={`${sectionID}-${rowID}`}
                style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', alignSelf: 'center' }} />
        );
    }

    _onBlur = () => {
        this.triggerBlur();

        !this.closed && this.setState({ listViewDisplayed: false });
    }

    _onFocus = () => {
        !this.closed && this.setState({ listViewDisplayed: true });
    }

    _renderPoweredLogo = () => {
        if (!this._shouldShowPoweredLogo()) {
            return null
        }

        return (
            <View
                style={[this.props.suppressDefaultStyles ? {} : defaultStyles.row, defaultStyles.poweredContainer, this.props.styles.poweredContainer]}
            >
                <Image
                    style={[this.props.suppressDefaultStyles ? {} : defaultStyles.powered, this.props.styles.powered]}
                    resizeMode='contain'
                    source={require('./images/powered_by_google_on_white.png')}
                />
            </View>
        );
    }

    _shouldShowPoweredLogo = () => {
        if (!this.props.enablePoweredByContainer || this.state.dataSource.length == 0) {
            return false
        }

        for (let i = 0; i < this.state.dataSource.length; i++) {
            let row = this.state.dataSource[i];

            if (!row.hasOwnProperty('isCurrentLocation') && !row.hasOwnProperty('isPredefinedPlace')) {
                return true
            }
        }

        return false
    }

    _renderLeftButton = () => {
        if (this.props.renderLeftButton) {
            return this.props.renderLeftButton()
        }
    }

    _renderRightButton = () => {
        if (this.props.renderRightButton) {
            return this.props.renderRightButton()
        }
    }

    renderClearButton = () => {
        if (this.state.clearButtonDisplayed) {
            return (
                <TouchableOpacity
                    style={{ position: 'absolute', right: 30, top: 20, alignSelf: 'baseline' }}
                    onPress={() => {
                        if (this.refs.textInput) {
                            !this.closed && this.setState({ text: '', dataSource: this.buildRowsFromResults([]), clearButtonDisplayed: false });
                        }
                    }}
                >
                    <Ionicons name='ios-close-circle' color="grey" size={20} />
                </TouchableOpacity>
            );
        }
    }

    _getFlatList = () => {
        const keyGenerator = () => (
            Math.random().toString(36).substr(2, 10)
        );

        if ((this.state.text !== '' || this.props.predefinedPlaces.length || this.props.currentLocation === true) && this.state.listViewDisplayed === true) {
            return (
                <FlatList
                    style={[this.props.suppressDefaultStyles ? {} : defaultStyles.listView, this.props.styles.listView]}
                    data={this.state.dataSource}
                    keyExtractor={keyGenerator}
                    extraData={[this.state.dataSource, this.props]}

                    /*
                    ListHeaderComponent={
                        <View
                            // key={`${sectionID}-${rowID}`}
                            style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', alignSelf: 'center' }} />
                    }
                    */

                    // ItemSeparatorComponent={this._renderSeparator}
                    renderItem={({ item }) => this._renderRow(item)}
                    // ListFooterComponent={this._renderPoweredLogo}
                    {...this.props}
                />
            );
        }

        return null;
    }

    render() {
        const {
            onFocus,
            clearButtonMode,
            ...userProps
        } = this.props.textInputProps;

        return (
            <View
                style={[this.props.suppressDefaultStyles ? {} : defaultStyles.container, this.props.styles.container]}
                pointerEvents="box-none"
            >
                {!this.props.textInputHide &&
                    <View
                        style={[this.props.suppressDefaultStyles ? {} : defaultStyles.textInputContainer, this.props.styles.textInputContainer]}
                    >
                        {this._renderLeftButton()}
                        <TextInput
                            ref="textInput"
                            multiline={false}
                            // keyboardType={Platform.OS === "android" ? 'visible-password' : 'default'}
                            // returnKeyType={this.props.returnKeyType}
                            // keyboardAppearance={'dark'}
                            underlineColorAndroid={this.props.underlineColorAndroid}
                            autoCorrect={false}
                            autoCapitalize="words"
                            selectionColor={Theme.color.selection}
                            editable={this.props.editable}
                            autoFocus={this.props.autoFocus}
                            style={[this.props.suppressDefaultStyles ? {} : defaultStyles.textInput, this.props.styles.textInput]}
                            placeholder={this.props.placeholder}
                            placeholderTextColor={this.props.placeholderTextColor}
                            onFocus={onFocus ? () => { this._onFocus(); onFocus() } : this._onFocus}
                            onBlur={this._onBlur}
							/*
							clearButtonMode={
							  clearButtonMode ? clearButtonMode : "while-editing"
							}
							*/
                            clearButtonMode={'never'}
                            {...userProps}
                            onChangeText={this._handleChangeText}
                            onSubmitEditing={this.props.onSubmitEditing}
                            value={this.state.text}
                        />
                        {this.renderClearButton()}

                        {this._renderRightButton()}
                    </View>
                }
                {!this.props.textInputHide &&
                    <View style={{
                        borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', alignSelf: 'center',
                        marginBottom: Theme.spacing.small
                    }} />
                }

                {this._getFlatList()}
                {this.props.children}

                {
                    this.state.isLoading &&
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center'
                    }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
                }
            </View>
        );
    }

    async getPlaceId(input, key, callback) {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;

            if (request.status === 200) {
                const responseJSON = JSON.parse(request.responseText);

                // console.log('responseJSON', responseJSON);

                // if (typeof responseJSON.predictions !== 'undefined') {
                if (typeof responseJSON.results !== 'undefined') {
                    /*
                    const results = responseJSON.predictions; // array
                    console.log('getPlaceId predictions', results);
                    const result = results[0]; // map object
                    console.log('getPlaceId array 0', result);

                    callback(result);
                    */

                    let result = null;

                    // console.log('getPlaceId pre results', responseJSON.results);
                    const filter = ['locality', 'administrative_area_level_3'];
                    const results = this._filterResultsByTypes(responseJSON.results, filter);
                    // console.log('getPlaceId after results', results);

                    // add 'street_address' filter
                    if (results.length != 0) {
                        result = results[0];
                    } else {
                        const filter2 = ['street_address'];
                        const results2 = this._filterResultsByTypes(responseJSON.results, filter2);

                        if (results2.length != 0) {
                            result = results2[0];
                        } else {
                            // just use the origin
                            result = responseJSON.results[0];
                        }
                    }

                    callback(result);
                }

                if (typeof responseJSON.error_message !== 'undefined') {
                    console.warn('getPlaceId (google places autocomplete)' + responseJSON.error_message);
                }
            }
        };

        // request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURIComponent(input) + '&' + Qs.stringify(query));
        const latitude = input.lat;
        const longitude = input.lng;
        const url = 'https://maps.googleapis.com/maps/api/geocode/json?' + Qs.stringify({
            latlng: latitude + ',' + longitude,
            key: key
            // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
        });
        request.open('GET', url);
        request.send();

        // get detail
        /*
        request.open('GET', 'https://maps.googleapis.com/maps/api/place/details/json?' + Qs.stringify({
            key: this.props.query.key,
            placeid: rowData.place_id,
            language: this.props.query.language
        }));

        request.send();
        */
    }

    async getStreetAddress(input, key, callback) {
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;

            if (request.status === 200) {
                const responseJSON = JSON.parse(request.responseText);

                // console.log('responseJSON', responseJSON);

                // if (typeof responseJSON.predictions !== 'undefined') {
                if (typeof responseJSON.results !== 'undefined') {
                    /*
                    const results = responseJSON.predictions; // array
                    console.log('getPlaceId predictions', results);
                    const result = results[0]; // map object
                    console.log('getPlaceId array 0', result);

                    callback(result);
                    */

                    let result = null;

                    // console.log('getPlaceId pre results', responseJSON.results);
                    const filter = ['street_address'];
                    const results = this._filterResultsByTypes(responseJSON.results, filter);
                    // console.log('getPlaceId after results', results);

                    // add 'street_address' filter
                    if (results.length != 0) {
                        result = results[0];
                    } else {
                        const filter2 = ['street_address'];
                        const results2 = this._filterResultsByTypes(responseJSON.results, filter2);

                        if (results2.length != 0) {
                            result = results2[0];
                        } else {
                            // just use the origin
                            result = responseJSON.results[0];
                        }
                    }

                    callback(result);
                }

                if (typeof responseJSON.error_message !== 'undefined') {
                    console.warn('getPlaceId (google places autocomplete)' + responseJSON.error_message);
                }
            }
        };

        // request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURIComponent(input) + '&' + Qs.stringify(query));
        const latitude = input.lat;
        const longitude = input.lng;
        const url = 'https://maps.googleapis.com/maps/api/geocode/json?' + Qs.stringify({
            latlng: latitude + ',' + longitude,
            key: key
            // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
        });
        request.open('GET', url);
        request.send();

        // get detail
        /*
        request.open('GET', 'https://maps.googleapis.com/maps/api/place/details/json?' + Qs.stringify({
            key: this.props.query.key,
            placeid: rowData.place_id,
            language: this.props.query.language
        }));

        request.send();
        */
    }
}

GooglePlacesAutocomplete.propTypes = {
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    underlineColorAndroid: PropTypes.string,
    returnKeyType: PropTypes.string,
    onPress: PropTypes.func,
    onNotFound: PropTypes.func,
    onFail: PropTypes.func,
    minLength: PropTypes.number,
    fetchDetails: PropTypes.bool,
    autoFocus: PropTypes.bool,
    autoFillOnNotFound: PropTypes.bool,
    getDefaultValue: PropTypes.func,
    timeout: PropTypes.number,
    onTimeout: PropTypes.func,
    query: PropTypes.object,
    GoogleReverseGeocodingQuery: PropTypes.object,
    GooglePlacesSearchQuery: PropTypes.object,
    styles: PropTypes.object,
    textInputProps: PropTypes.object,
    enablePoweredByContainer: PropTypes.bool,
    predefinedPlaces: PropTypes.array,
    currentLocation: PropTypes.bool,
    currentLocationLabel: PropTypes.string,
    nearbyPlacesAPI: PropTypes.string,
    enableHighAccuracyLocation: PropTypes.bool,
    filterReverseGeocodingByTypes: PropTypes.array,
    filterPlacesSearchByTypes: PropTypes.array,
    predefinedPlacesAlwaysVisible: PropTypes.bool,
    enableEmptySections: PropTypes.bool,
    renderDescription: PropTypes.func,
    renderRow: PropTypes.func,
    renderLeftButton: PropTypes.func,
    renderRightButton: PropTypes.func,
    listUnderlayColor: PropTypes.string,
    debounce: PropTypes.number,
    isRowScrollable: PropTypes.bool,
    text: PropTypes.string,
    textInputHide: PropTypes.bool,
    suppressDefaultStyles: PropTypes.bool,
    numberOfLines: PropTypes.number,
    onSubmitEditing: PropTypes.func,
    editable: PropTypes.bool
};

GooglePlacesAutocomplete.defaultProps = {
    placeholder: 'Search',
    placeholderTextColor: '#A8A8A8',
    isRowScrollable: true,
    underlineColorAndroid: 'transparent',
    returnKeyType: 'default',
    onPress: () => { },
    onNotFound: () => { },
    onFail: () => { },
    minLength: 0,
    fetchDetails: false,
    autoFocus: false,
    autoFillOnNotFound: false,
    keyboardShouldPersistTaps: 'always',
    getDefaultValue: () => '',
    timeout: 20000,
    onTimeout: () => console.warn('google places autocomplete: request timeout'),
    query: {
        key: 'missing api key',
        language: 'en',
        types: 'geocode',
    },
    GoogleReverseGeocodingQuery: {},
    GooglePlacesSearchQuery: {
        rankby: 'distance',
        types: 'food'
    },
    styles: {},
    textInputProps: {},
    enablePoweredByContainer: true,
    predefinedPlaces: [],
    currentLocation: false,
    currentLocationLabel: 'Current location',
    nearbyPlacesAPI: 'GooglePlacesSearch',
    enableHighAccuracyLocation: true,
    filterReverseGeocodingByTypes: [],
    filterPlacesSearchByTypes: [],
    predefinedPlacesAlwaysVisible: false,
    enableEmptySections: true,
    listViewDisplayed: 'auto',
    debounce: 0,
    textInputHide: false,
    suppressDefaultStyles: false,
    numberOfLines: 1,
    onSubmitEditing: () => { },
    editable: true
};



/*
// this function is still present in the library to be retrocompatible with version < 1.1.0
const create = function create(options = {}) {
  return React.createClass({
    render() {
      return (
        <GooglePlacesAutocomplete
          ref="GooglePlacesAutocomplete"
          {...options}
        />
      );
    },
  });
};

module.exports = {
  GooglePlacesAutocomplete,
  create
};
*/
