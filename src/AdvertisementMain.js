import React from 'react';
import {
    StyleSheet, TouchableOpacity, View, BackHandler, Dimensions, Image, TextInput,
    Platform, FlatList, Animated, StatusBar, Keyboard, ActivityIndicator
} from 'react-native';
import { Permissions, Linking, ImagePicker, Constants } from 'expo';
import { Text, Theme, RefreshIndicator } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign } from 'react-native-vector-icons';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
import * as firebase from "firebase";
import Util from './Util';
import autobind from 'autobind-decorator';
import DateTimePicker from 'react-native-modal-datetime-picker';
// https://github.com/lawnstarter/react-native-picker-select
import Select from 'react-native-picker-select';
// import { Chevron } from 'react-native-shapes';
import Toast, { DURATION } from 'react-native-easy-toast';

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";

const doneButtonViewHeight = 44;

const textInputFontSize = 18;
const textInputHeight = 34;

const imageViewWidth = Dimensions.get('window').width / 2;
const imageViewHeight = imageViewWidth / 4 * 3;

const imageWidth = imageViewWidth * 0.8;
const imageHeight = imageViewHeight * 0.8;

const genderItems = [
    {
        label: 'Male',
        value: 'Male'
    },
    {
        label: 'Female',
        value: 'Female'
    }
];

const bodyTypeItems = [
    {
        label: 'Skinny',
        value: 'Skinny'
    },
    {
        label: 'Fit',
        value: 'Fit'
    },
    {
        label: 'Thick',
        value: 'Thick'
    }
];

const braSizeItems = [
    {
        label: 'A cup',
        value: 'A cup',
        // color: 'yellow'
    },
    {
        label: 'B cup',
        value: 'B cup',
        // color: 'yellow'
    },
    {
        label: 'C cup',
        value: 'C cup',
        // color: 'yellow'
    },
    {
        label: 'D cup',
        value: 'D cup',
        // color: 'green'
    },
    {
        label: 'E cup',
        value: 'E cup',
        // color: 'blue'
    },
    {
        label: 'F cup',
        value: 'F cup',
        // color: 'purple'
    }
];


export default class AdvertisementMain extends React.Component {
    state = {
        showPostLoader: false,

        onUploadingImage: false,
        uploadingImageNumber: 0, // 1,2,3,4
        refreshing: true,

        uploadImage1Uri: null,
        uploadImage2Uri: null,
        uploadImage3Uri: null,
        uploadImage4Uri: null,

        name: '',

        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(1990, 1, 1),
        birthday: null,
        gender: null,
        height: '',
        weight: '',
        bodyType: null,
        breasts: null,
        note: '',
        noteLength: 0,

        country: null,
        countryCode: null,

        street: null,
        city: '',
        state: '',
        streetInfo: null,
        cityInfo: null,


        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        // flashOffset: new Animated.Value(Cons.searchBarHeight * -1),
        flashOffset: new Animated.Value((8 + 34 + 8) * -1),

        showPicture1AlertIcon: false,
        showPicture2AlertIcon: false,
        showPicture3AlertIcon: false,
        showPicture4AlertIcon: false,
        showNameAlertIcon: false,
        showAgeAlertIcon: false,
        showGenderAlertIcon: false,
        showHeightAlertIcon: false,
        showWeightAlertIcon: false,
        showBodyTypeAlertIcon: false,
        showBreastsAlertIcon: false,
        showCountryAlertIcon: false,
        showStreetAlertIcon: false,

        /*
        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,
        */
        onNote: false,
        keyboardTop: Dimensions.get('window').height
    };

    constructor(props) {
        super(props);

        this.feedId = null;

        this.imageRefs = []; // for cleaning files in server
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    initFromSelect(result) { // country
        console.log('AdvertisementMain.initFromSelect', result);

        this.setState({
            country: result.name, countryCode: result.code,
            street: null, city: '', state: '', streetInfo: null, cityInfo: null
        });
    }

    initFromSearch(result1, result2) { // street
        console.log('AdvertisementMain.initFromSearch', result1, result2);

        /*
        "description": "33 Hyoryeong-ro, Seocho-dong, Seocho-gu, Seoul, South Korea",
        "location": {
            "lat": 37.4851745,
            "lng": 127.0131415,
        },
        "place_id": "ChIJAYY89hOhfDURvKmQf1zQ_eA"
        }
        */
        const location = {
            description: result1.description,
            // streetId: result1.place_id,
            longitude: result1.location.lng,
            latitude: result1.location.lat
        };

        const cityInfo = {
            description: result2.name,
            cityId: result2.placeId,
            location: result2.location
        };

        /*
        let street = null;
        let state = '';
        let city = '';

        const words2 = result2.name.split(', '); // "23 Limslättsväg, 22920, Åland Islands"

        // get street text
        const words1 = result1.description.split(', '); // "23 Limslättsväg, Åland Islands"
        const length = words1.length - words2.length;

        if (length <= 0) {
            if (words1.length === 0) {
                // someting is wrong
            } else if (words1.length === 1) {
                // someting is wrong
            } else if (words1.length === 2) {
                street = words1[0];
            } else if (words1.length === 3) {
                street = words1[0];
                city = words1[1];
            } else if (words1.length === 4) {
                street = words1[0];
                city = words1[1];
                state = words1[2];
            } else {
                street = '';
                for (var i = 0; i < words1.length - 3; i++) {
                    street += words1[i];

                    if (i !== words1.length - 3 - 1) street += ', ';
                }

                city = words1[words1.length - 3];
                state = words1[words1.length - 2];
            }
        } else {
            street = '';
            for (var i = 0; i < length; i++) {
                street += words1[i];

                if (i !== length - 1) street += ', ';
            }

            // get city, state
            if (words2.length === 0) {
                // someting is wrong
            } else if (words2.length === 1) {
                // someting is wrong
            } else if (words2.length === 2) {
                city = words2[0];
            } else if (words2.length === 3) {
                city = words2[0];
                state = words2[1];
            } else {
                city = words2[words2.length - 3];
                state = words2[words2.length - 2];
            }
        }
        */

        let street = null;
        let state = '';
        let city = '';

        street = '';
        const words1 = result1.description.split(', ');
        const size = words1.length - 1;
        for (var i = 0; i < size; i++) {
            street += words1[i];
            if (i != size - 1) street += ', ';
        }

        this.setState({ street: street, city: city, state: state, streetInfo: location, cityInfo: cityInfo });
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('AdvertisementMain._keyboardDidShow');

        if (this.focusedItem === 'name') {
            // this.refs.flatList.scrollToOffset({ offset: this.nameY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17, animated: true }); // Consider
        } else if (this.focusedItem === 'height') {
            // this.refs.flatList.scrollToOffset({ offset: this.heightY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY, animated: true });
        } else if (this.focusedItem === 'weight') {
            // this.refs.flatList.scrollToOffset({ offset: this.weightY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.heightY, animated: true });
        } else if (this.focusedItem === 'note') {
            // this.refs.flatList.scrollToOffset({ offset: this.noteY + doneButtonViewHeight, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY, animated: true });

            if (!this.state.onNote) this.setState({ onNote: true });
        }

        this.setState({ keyboardTop: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide() {
        if (!this.focused) return;

        console.log('AdvertisementMain._keyboardDidHide');

        if (this.state.onNote) this.setState({ onNote: false });

        this.setState({ keyboardTop: Dimensions.get('window').height });
    }

    noteDone() {
        this.setState({ onNote: false, keyboardTop: Dimensions.get('window').height });

        Keyboard.dismiss();
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'AdvertisementMain';

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();

            return true;
        }

        if (this._showFlash) {
            this.hideFlash();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        // remove server files
        if (this.imageRefs.length > 0) {
            console.log('clean image files');

            const formData = new FormData();
            for (var i = 0; i < this.imageRefs.length; i++) {
                const ref = this.imageRefs[i];

                const number = i + 1;
                const fieldName = 'file' + number.toString();
                formData.append(fieldName, ref);

                console.log(fieldName, ref);
            }

            fetch(SERVER_ENDPOINT + "cleanPostImages", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data"
                },
                body: formData
            });
        }

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    validateName(text) {
        this.setState({ name: text });
    }

    onFocusName() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // move scroll in keyboard show event
        this.focusedItem = 'name';
    }

    onFocusBirthday() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // this.refs.flatList.scrollToOffset({ offset: this.birthdayY, animated: true });
        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY, animated: true });
    }

    onFocusGender() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // this.refs.flatList.scrollToOffset({ offset: this.genderY, animated: true });
        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY, animated: true });
    }

    onFocusHeight() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // clear
        this.setState({ height: '' });

        // move scroll in keyboard show event
        this.focusedItem = 'height';
    }

    onBlurHeight() {
        // set cm
        const text = this.state.height;

        if (text.length === 0) return;

        this.setState({ height: text + ' cm' });
    }

    validateHeight(text) {
        if (text.length === 0) {
            this.setState({ height: '' });

            return;
        }

        if (text.length > 3) {
            return;
        }

        this.setState({ height: text });
    }

    onFocusWeight() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // clear
        this.setState({ weight: '' });

        // move scroll in keyboard show event
        this.focusedItem = 'weight';
    }

    onBlurWeight() {
        // set kg
        const text = this.state.weight;

        if (text.length === 0) return;

        this.setState({ weight: text + ' kg' });
    }

    validateWeight(text) {
        if (text.length === 0) {
            this.setState({ weight: '' });

            return;
        }

        if (text.length > 3) {
            return;
        }

        this.setState({ weight: text });
    }

    onFocusBodyType() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // this.refs.flatList.scrollToOffset({ offset: this.bodyTypeY, animated: true });
        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.weightY, animated: true });
    }

    onFocusBreasts() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // this.refs.flatList.scrollToOffset({ offset: this.breastsY, animated: true });
        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY, animated: true });
    }

    onFocusNote() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        if (!this.state.onNote) this.setState({ onNote: true });

        // move scroll in keyboard show event
        this.focusedItem = 'note';
    }

    onBlurNote() {
        if (this.state.onNote) this.setState({ onNote: false });
    }

    async post() {
        // ToDo: test navigation
        // this.props.navigation.navigate("advertisementFinish");
        // return;

        if (this.state.onUploadingImage) return;

        // 1. check
        const { name, birthday, gender, height, weight, bodyType, breasts, note, country, street, streetInfo, cityInfo, uploadImage1Uri, uploadImage2Uri, uploadImage3Uri, uploadImage4Uri } = this.state;

        if (uploadImage1Uri === null) {
            this.showNotification('Please add your 1st profile picture.');

            this.setState({ showPicture1AlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: 0, animated: true });

            return;
        }

        if (name === '') {
            this.showNotification('Please write your name.');

            this.setState({ showNameAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.nameY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17, animated: true }); // Consider

            return;
        }

        if (birthday === null) {
            this.showNotification('Please select your date of birth.');

            this.setState({ showAgeAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.birthdayY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY, animated: true });

            return;
        }

        if (gender === null) {
            this.showNotification('Please select your gender.');

            this.setState({ showGenderAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.genderY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY, animated: true });

            return;
        }

        if (height === '') {
            this.showNotification('Please enter your height.');

            this.setState({ showHeightAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.heightY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY, animated: true });

            return;
        }

        if (weight === '') {
            this.showNotification('Please enter your weight.');

            this.setState({ showWeightAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + heightY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.weightY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.heightY, animated: true });

            return;
        }

        if (!bodyType) {
            this.showNotification('Please select your bra size.');

            this.setState({ showBodyTypeAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.weightY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.bodyTypeY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.weightY, animated: true });

            return;
        }

        if (!breasts) {
            this.showNotification('Please select your bra size.');

            this.setState({ showBreastsAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.breastsY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY, animated: true });

            return;
        }

        if (country === null) {
            this.showNotification('Please enter your country.');

            this.setState({ showCountryAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY, animated: true });

            return;
        }

        if (street === null) {
            this.showNotification('Please enter your city.');

            this.setState({ showStreetAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });
            // this.refs.flatList.scrollToOffset({ offset: this.streetY, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.countryY, animated: true });

            return;
        }

        // 2. upload
        this.setState({ showPostLoader: true });

        let data = {};

        if (!this.feedId) {
            this.feedId = Util.uid();
        }
        data.feedId = this.feedId;

        data.userUid = Firebase.user().uid;

        data.name = name;

        let _birthday = 'DDMMYYYY';
        _birthday = Util.getBirthday(this.state.datePickerDate);
        data.birthday = _birthday;

        data.gender = gender;
        data.height = Util.getHeight(height);
        data.weight = Util.getWeight(weight);
        data.bodyType = bodyType;
        data.bust = Util.getBust(breasts);

        // placeId, placeName, location
        // --
        data.placeId = cityInfo.cityId;
        data.placeName = cityInfo.description;

        const location = {
            description: streetInfo.description,
            // streetId: streetInfo.streetId,
            longitude: streetInfo.longitude,
            latitude: streetInfo.latitude
        };

        data.location = location;
        // --

        let _note = null;
        if (note !== '') {
            _note = note;
        }
        data.note = _note;

        data.image1 = {
            uri: uploadImage1Uri,
            ref: this.uploadImage1Ref
        };
        data.image2 = {
            uri: uploadImage2Uri,
            ref: this.uploadImage2Ref
        };
        data.image3 = {
            uri: uploadImage3Uri,
            ref: this.uploadImage3Ref
        };
        data.image4 = {
            uri: uploadImage4Uri,
            ref: this.uploadImage4Ref
        };

        const extra = {
            lat: cityInfo.location.lat,
            lng: cityInfo.location.lng
        };

        await this.createFeed(data, extra);

        this.removeItemFromList();

        // 3. move to finish page
        this.refs["toast"].show('Your advertisement posted successfully.', 500, () => {
            this.setState({ showPostLoader: false });

            if (!this.closed) {
                this.props.navigation.navigate("advertisementFinish");
            }
        });
    }

    removeItemFromList() {
        if (this.uploadImage1Ref) {
            const ref = this.uploadImage1Ref;
            const index = this.imageRefs.indexOf(ref);
            if (index > -1) {
                this.imageRefs.splice(index, 1);
            }
        }

        if (this.uploadImage2Ref) {
            const ref = this.uploadImage2Ref;
            const index = this.imageRefs.indexOf(ref);
            if (index > -1) {
                this.imageRefs.splice(index, 1);
            }
        }

        if (this.uploadImage3Ref) {
            const ref = this.uploadImage3Ref;
            const index = this.imageRefs.indexOf(ref);
            if (index > -1) {
                this.imageRefs.splice(index, 1);
            }
        }

        if (this.uploadImage4Ref) {
            const ref = this.uploadImage4Ref;
            const index = this.imageRefs.indexOf(ref);
            if (index > -1) {
                this.imageRefs.splice(index, 1);
            }
        }
    }

    render() {
        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const flashStyle = {
            opacity: this.state.flashOpacity,
            transform: [{ translateY: this.state.flashOffset }]
        };

        return (
            <View style={[styles.flex, { paddingBottom: Cons.viewMarginBottom() }]}>
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
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            if (this._showFlash) {
                                this.hideFlash();
                            }

                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={styles.searchBarTitle}>{'New Post'}</Text>
                </View>

                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[styles.flash, flashStyle]}
                    ref={flash => this._flash = flash}
                >
                    <View>
                        <Text style={styles.flashMessageTitle}>{this.state.flashMessageTitle}</Text>
                        <Text style={styles.flashMessageSubtitle}>{this.state.flashMessageSubtitle}</Text>
                    </View>
                    {
                        this.state.flashImage &&
                        <Image
                            // style={{ width: (Cons.searchBarHeight * 0.7) / 3 * 4, height: Cons.searchBarHeight * 0.7, borderRadius: 2 }}
                            style={{ width: (8 + 34 + 8) * 0.84 / 3 * 4, height: (8 + 34 + 8) * 0.84, borderRadius: 2 }}
                            source={{ uri: this.state.flashImage }}
                        />
                    }

                    {/*
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                    </TouchableOpacity>
                    */}
                </Animated.View>

                <FlatList
                    // ref={(fl) => this._flatList = fl}
                    ref="flatList"
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={this.renderContainer()}
                />

                <DateTimePicker
                    isVisible={this.state.showDatePicker}
                    onConfirm={this._handleDatePicked}
                    onCancel={this._hideDateTimePicker}
                    date={this.state.datePickerDate}
                    titleIOS={this.state.datePickerTitle}
                />

                {
                    this.state.onNote &&
                    <View style={{
                        width: '100%', height: doneButtonViewHeight, backgroundColor: '#D0D0D0',
                        // borderTopColor: '#3B3B3B', borderTopWidth: 1,
                        position: 'absolute', top: this.state.keyboardTop - doneButtonViewHeight,
                        justifyContent: "center", alignItems: "flex-end", paddingRight: 15
                    }}>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.noteDone()}
                        >
                            <Text style={styles.done}>Done</Text>
                        </TouchableOpacity>
                    </View>
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View>
        );
    }

    renderContainer() {
        return (
            <View style={{ paddingTop: 2 }}>
                {/* image editor view */}
                <Text style={{ marginHorizontal: 4, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium", paddingLeft: 18 }}>
                    {'PICTURES'}
                </Text>

                <View style={{ width: '100%', marginBottom: 20 }}>
                    {/* row 1 view */}
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        {/* cell 1 view */}
                        <View style={{ width: imageViewWidth, height: imageViewHeight, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 12 }}>
                            {
                                this.renderImage(1, this.state.uploadImage1Uri)
                            }
                        </View>
                        {/* cell 2 view */}
                        <View style={{ width: imageViewWidth, height: imageViewHeight, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 12 }}>
                            {
                                this.renderImage(2, this.state.uploadImage2Uri)
                            }
                        </View>
                    </View>
                    {/* row 2 view */}
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        {/* cell 1 view */}
                        <View style={{ width: imageViewWidth, height: imageViewHeight, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 12 }}>
                            {
                                this.renderImage(3, this.state.uploadImage3Uri)
                            }
                        </View>
                        {/* cell 2 view */}
                        <View style={{ width: imageViewWidth, height: imageViewHeight, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 12 }}>
                            {
                                this.renderImage(4, this.state.uploadImage4Uri)
                            }
                        </View>
                    </View>
                </View>

                {/* input view */}
                <View style={{ paddingHorizontal: 4 }}
                    onLayout={(e) => {
                        const { y } = e.nativeEvent.layout;
                        this.inputViewY = y;
                    }}
                >
                    {/* 1. name */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'NAME'}
                        </Text>
                        {/*
                        <Text style={{ marginRight: 18, color: Theme.color.text5, fontSize: 12, lineHeight: 19, fontFamily: "Roboto-Light" }}>
                            {'Customers find you with it.'}
                        </Text>
                        */}
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            width: '80%',
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)'
                        }}
                        // keyboardType={'email-address'}
                        // keyboardAppearance='dark'
                        onChangeText={(text) => this.validateName(text)}
                        value={this.state.name}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="words"
                        placeholder="Selena Gomez"
                        placeholderTextColor={Theme.color.placeholder}
                        onFocus={(e) => this.onFocusName()}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.nameY = y;
                        }}
                    />
                    {
                        this.state.showNameAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.nameY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 2. birthday */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'AGE (BIRTHDAY)'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    {/* picker */}
                    <TouchableOpacity
                        onPress={() => {
                            this.onFocusBirthday();

                            this.showDateTimePicker('What is your date of birth?');
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                width: '80%',
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.birthday ? this.state.birthday : "22 JUL 1992"}</Text>

                        {/* ToDo: add icon */}

                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.birthdayY = y;
                        }}
                    />
                    {
                        this.state.showAgeAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.birthdayY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 3. gender */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'GENDER'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        onOpen={() => this.onFocusGender()} // NOT work in Android
                        placeholder={{
                            label: "Select your gender",
                            value: null
                        }}
                        items={genderItems}
                        onValueChange={(value) => { // only for Android
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.setState({ gender: value });
                        }}
                        style={{
                            iconContainer: {
                                top: 5,
                                right: 100
                            }
                        }}
                        textInputProps={{
                            style: {
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular",
                                color: this.state.gender === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            }
                        }}
                        useNativeAndroidPickerStyle={false}
                        value={this.state.gender}

                        Icon={() => {
                            // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                            return null;
                        }}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.genderY = y;
                        }}
                    />
                    {
                        this.state.showGenderAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.genderY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 4. height */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'HEIGHT'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            width: '80%',
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'
                        // keyboardAppearance='dark'
                        onFocus={(e) => this.onFocusHeight()}
                        onBlur={(e) => this.onBlurHeight()}
                        onChangeText={(text) => this.validateHeight(text)}
                        value={this.state.height}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="none"
                        placeholder='164 cm'
                        placeholderTextColor={Theme.color.placeholder}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.heightY = y;
                        }}
                    />
                    {
                        this.state.showHeightAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.heightY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 5. weight */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'WEIGHT'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            width: '80%',
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'
                        // keyboardAppearance='dark'
                        onFocus={(e) => this.onFocusWeight()}
                        onBlur={(e) => this.onBlurWeight()}
                        onChangeText={(text) => this.validateWeight(text)}
                        value={this.state.weight}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="none"
                        placeholder='45 kg'
                        placeholderTextColor={Theme.color.placeholder}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.weightY = y;
                        }}
                    />
                    {
                        this.state.showWeightAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.weightY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 6. body type */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'BODY TYPE'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        onOpen={() => this.onFocusBodyType()} // NOT work in Android
                        placeholder={{
                            label: "What's your body type?",
                            value: null
                        }}
                        items={bodyTypeItems}
                        onValueChange={(value) => { // only for Android
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.setState({ bodyType: value });
                        }}
                        style={{
                            iconContainer: {
                                top: 5,
                                right: 100
                            }
                        }}
                        textInputProps={{
                            style: {
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular",
                                color: this.state.bodyType === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            }
                        }}
                        useNativeAndroidPickerStyle={false}
                        value={this.state.bodyType}

                        Icon={() => {
                            // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                            return null;
                        }}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.bodyTypeY = y;
                        }}
                    />
                    {
                        this.state.showBodyTypeAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.bodyTypeY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 7. breasts */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {'BREASTS'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        /*
                        ref={(el) => {
                            this.inputRefs.favSport0 = el;
                        }}
                        */
                        onOpen={() => this.onFocusBreasts()} // NOT work in Android
                        placeholder={{
                            label: "What's your bra size?",
                            value: null,
                            // color: '#9EA0A4'
                            // color: 'green'
                        }}
                        // placeholderTextColor={Theme.color.placeholder}

                        items={braSizeItems}
                        onValueChange={(value) => { // only for Android
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.setState({ breasts: value });
                        }}
                        style={{
                            iconContainer: {
                                top: 5,
                                right: 100
                            },
                            /*
                            inputAndroid: {
                                // marginLeft: 18,
                                // paddingRight: 30, // to ensure the text is never behind the icon
                                // height: 38,
                                // width: '50%',
                                // fontSize: 22, fontFamily: "Roboto-Light",
                                // color: 'rgba(255, 255, 255, 0.8)',
                                // color: 'red',
                                // backgroundColor: 'red'
                                // backgroundColor: 'transparent'
                            },
                            inputIOS: {
                            }
                            */
                        }}
                        textInputProps={{
                            style: {
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular",
                                color: this.state.breasts === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            }
                        }}
                        useNativeAndroidPickerStyle={false}
                        value={this.state.breasts}

                        Icon={() => {
                            // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                            return null;
                        }}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.breastsY = y;
                        }}
                    />
                    {
                        this.state.showBreastsAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.breastsY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 8. note */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'NOTE'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={Platform.OS === 'ios' ? styles.textInputStyleIOS : styles.textInputStyleAndroid}
                        placeholder='More information about you'
                        placeholderTextColor={Theme.color.placeholder}
                        onChangeText={(text) => {
                            this.setState({ note: text, noteLength: text.length });
                        }}
                        value={this.state.note}
                        selectionColor={Theme.color.selection}

                        // keyboardType='default'
                        // returnKeyType='done'
                        // keyboardAppearance='dark'
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        // autoCapitalize="none"
                        maxLength={200}
                        multiline={true}
                        numberOfLines={4}
                        onFocus={(e) => {
                            this.onFocusNote();
                        }}
                        onBlur={(e) => this.onBlurNote()}
                    />
                    <Text style={{ color: Theme.color.placeholder, fontSize: 14, fontFamily: "Roboto-Regular", textAlign: 'right', paddingRight: 24, paddingBottom: 4 }}>
                        {this.state.noteLength}
                    </Text>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.noteY = y;
                        }}
                    />

                    {/* 9. country */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'COUNTRY'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.onUploadingImage) return;

                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            // this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });
                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY, animated: true });

                            setTimeout(() => {
                                this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
                            }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                // height: textInputHeight,
                                minHeight: textInputHeight,
                                fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.country ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.country ? this.state.country : "What country do you live in?"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.countryY = y;
                        }}
                    />
                    {
                        this.state.showCountryAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.countryY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 10. street */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'STREET'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                // ToDo: show description with pop-up
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.onUploadingImage) return;

                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            // check the country is filled
                            if (!this.state.country) {
                                this.showNotification('Please enter your country.');

                                this.setState({ showCountryAlertIcon: true });

                                // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });
                                // this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });
                                this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY, animated: true });

                                return;
                            }

                            // this.refs.flatList.scrollToOffset({ offset: this.streetY, animated: true });
                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.countryY, animated: true });

                            setTimeout(() => {
                                this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', countryCode: this.state.countryCode, initFromSearch: (result1, result2) => this.initFromSearch(result1, result2) });
                            }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                // height: textInputHeight,
                                minHeight: textInputHeight,
                                fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.street ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.street ? this.state.street : "What city do you live in?"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.streetY = y;
                        }}
                    />
                    {
                        this.state.showStreetAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.streetY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }
                </View>

                {/*
                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small }} />
                */}

                <Text style={{
                    marginTop: Theme.spacing.small,
                    marginBottom: Theme.spacing.small,
                    fontSize: 14, fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                    textAlign: 'center', lineHeight: 24
                }}>{"Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you"}</Text>

                <TouchableOpacity
                    style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: 32 }]}
                    onPress={async () => await this.post()}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Post an Advertisement</Text>
                    {
                        this.state.showPostLoader &&
                        <ActivityIndicator
                            style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 1000 }}
                            animating={true}
                            size="small"
                            color={Theme.color.buttonText}
                        />
                    }
                </TouchableOpacity>
            </View>
        );
    }

    renderImage(number, uri) {
        const iconButtonWidth = Dimensions.get('window').width / 14;
        const iconButtonX = (iconButtonWidth / 2) * -1 + iconButtonWidth / 3;

        if (!uri) {
            return (
                <View style={{ width: imageWidth, height: imageHeight }}>
                    <View style={{
                        width: '100%', height: '100%', borderRadius: 2, borderColor: '#707070', borderWidth: 2, borderStyle: 'dashed', backgroundColor: '#505050',
                        justifyContent: "center", alignItems: "center"
                    }}>
                        {/* center icon */}
                        <Ionicons name='md-person' color={Theme.color.component} size={40} />
                    </View>

                    {/* number */}
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 18, color: 'rgba(255, 255, 255, 0.8)', position: 'absolute', top: 6, left: 8 }}>{number}</Text>

                    {/* icon button */}
                    <TouchableOpacity
                        style={{
                            width: iconButtonWidth, height: iconButtonWidth, borderRadius: iconButtonWidth / 2,
                            backgroundColor: Theme.color.selection, position: 'absolute',
                            bottom: iconButtonX, right: iconButtonX, justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.uploadPicture(number - 1);
                        }}
                    >
                        <Ionicons name='ios-add' color='white' size={24} />
                    </TouchableOpacity>
                    {
                        number === 1 && this.state.showPicture1AlertIcon &&
                        <AntDesign style={{ position: 'absolute', top: imageHeight / 2 - 12, left: imageWidth / 2 - 12 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }
                    {
                        number === 2 && this.state.showPicture2AlertIcon &&
                        <AntDesign style={{ position: 'absolute', top: imageHeight / 2 - 12, left: imageWidth / 2 - 12 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }
                    {
                        number === 3 && this.state.showPicture3AlertIcon &&
                        <AntDesign style={{ position: 'absolute', top: imageHeight / 2 - 12, left: imageWidth / 2 - 12 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }
                    {
                        number === 4 && this.state.showPicture4AlertIcon &&
                        <AntDesign style={{ position: 'absolute', top: imageHeight / 2 - 12, left: imageWidth / 2 - 12 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }
                    {
                        this.state.onUploadingImage && number === this.state.uploadingImageNumber &&
                        /*
                        <ActivityIndicator
                            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, zIndex: 10001 }}
                            animating={true}
                            size="small"
                            color='#A8A8A8'
                        />
                        */
                        <View style={{
                            width: imageWidth, height: imageHeight,
                            position: 'absolute', top: 0, left: 0,
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            <RefreshIndicator refreshing={this.state.refreshing} total={3} size={4} color={Theme.color.selection} />
                        </View>
                    }
                </View>
            );
        }

        return (
            <View style={{ width: imageWidth, height: imageHeight }}>
                <Image
                    style={{ width: imageWidth, height: imageHeight, borderRadius: 2 }}
                    source={{ uri: uri }}
                />

                {/* icon */}
                <TouchableOpacity
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'white', position: 'absolute', bottom: -14 + 10, right: -14 + 10, justifyContent: "center", alignItems: "center" }}
                    onPress={() => {
                        this.uploadPicture(number - 1);
                    }}
                >
                    <Ionicons name='md-create' color={Theme.color.selection} size={18} />
                </TouchableOpacity>
                {
                    this.state.onUploadingImage && number === this.state.uploadingImageNumber &&
                    /*
                    <ActivityIndicator
                        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, zIndex: 10001 }}
                        animating={true}
                        size="small"
                        color='rgba(0, 0, 0, 0.6)'
                    />
                    */
                    <View style={{
                        width: imageWidth, height: imageHeight,
                        position: 'absolute', top: 0, left: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <RefreshIndicator refreshing={this.state.refreshing} total={3} size={4} color={Theme.color.selection} />
                    </View>
                }
            </View>
        );
    }

    uploadPicture(index) {
        if (this.state.onUploadingImage) return;

        this.pickImage(index);
    }

    async pickImage(index) {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3], // ToDo: android only! (only square image in IOS)
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync:', result);

            if (!result.cancelled) {
                this.setState({ onUploadingImage: true, uploadingImageNumber: index + 1 });

                // show indicator & progress bar
                this.showFlash('Uploading...', 'Your picture is now uploading.', result.uri);

                // upload image
                this.uploadImage(result.uri, index, (uri) => {
                    switch (index) {
                        case 0: this.setState({ uploadImage1Uri: uri }); break;
                        case 1: this.setState({ uploadImage2Uri: uri }); break;
                        case 2: this.setState({ uploadImage3Uri: uri }); break;
                        case 3: this.setState({ uploadImage4Uri: uri }); break;
                    }

                    const ref = 'images/' + Firebase.user().uid + '/post/' + this.feedId + '/' + result.uri.split('/').pop();
                    this.imageRefs.push(ref);

                    switch (index) {
                        case 0: this.uploadImage1Ref = ref; break;
                        case 1: this.uploadImage2Ref = ref; break;
                        case 2: this.uploadImage3Ref = ref; break;
                        case 3: this.uploadImage4Ref = ref; break;
                    }

                    // save to database
                    /*
                        var data = {
                        pictures: {
                            uri: uri
                        }
                    };
                    this.updateUser(Firebase.user().uid, data);
                    */

                    /*
                    const fileName = result.uri.split('/').pop();
                    const url = await firebase.storage().ref(fileName).getDownloadURL();
                    console.log('download URL:', url);
                    */

                    // hide indicator & progress bar
                    this.setState({ flashMessageTitle: 'Success!', flashMessageSubtitle: 'Your picture uploaded successfully.' });
                    setTimeout(() => {
                        !this.closed && this.hideFlash();

                        this.setState({ onUploadingImage: false, uploadingImageNumber: 0 });
                    }, 1500);
                });
            }
        } else {
            Linking.openURL('app-settings:');
        }
    }

    async uploadImage(uri, index, cb) {
        const fileName = uri.split('/').pop();
        var ext = fileName.split('.').pop();

        if (!Util.isImage(ext)) {
            const msg = 'Invalid image file (' + ext + ').';
            this.showNotification(msg);
            return;
        }

        var type = Util.getImageType(ext);
        // console.log('file type:', type);

        const formData = new FormData();
        // formData.append("type", "profile");
        formData.append("type", "post");

        if (!this.feedId) {
            this.feedId = Util.uid();
        }

        formData.append("feedId", this.feedId);

        formData.append("image", {
            uri,
            name: fileName,
            type: type
        });
        formData.append("userUid", Firebase.user().uid);
        // formData.append("pictureIndex", index);

        try {
            let response = await fetch(SERVER_ENDPOINT + "uploadFile/images",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data"
                    },
                    body: formData
                }
            );

            let responseJson = await response.json();
            console.log('uploadImage, responseJson', responseJson);

            // console.log('responseJson', await response.json());

            cb(responseJson.downloadUrl);

            /*
            try {
                let downloadURL = await Firebase.storage.ref(responseJson.name).getDownloadURL();
                // let downloadURL = await Firebase.storage.child(responseJson.name).getDownloadURL();
                cb(downloadURL);
            } catch (error) {
                console.error(error);
            }
            */
        } catch (error) {
            console.error(error);

            this.showNotification('An error occurred. Please try again.');

            // stop indicator
            this.setState({ refreshing: false });

            // show alert icon
            if (index === 0) this.setState({ showPicture1AlertIcon: true });
            if (index === 1) this.setState({ showPicture2AlertIcon: true });
            if (index === 2) this.setState({ showPicture3AlertIcon: true });
            if (index === 3) this.setState({ showPicture4AlertIcon: true });
        }
    }

    //// database ////
    async createFeed(data, extra) {
        console.log('AdvertisementMain.createFeed', data, extra);

        // const feedId = Util.uid(); // create uuid
        // const userUid = Firebase.user().uid;

        let feed = {};
        feed.uid = data.userUid;
        feed.id = data.feedId;
        feed.placeId = data.placeId;
        feed.placeName = data.placeName;
        feed.location = data.location;
        feed.note = data.note;

        const pictures = {
            one: {
                // preview: null,
                uri: data.image1.uri ? data.image1.uri : null,
                ref: data.image1.ref ? data.image1.ref : null
            },
            two: {
                // preview: null,
                uri: data.image2.uri ? data.image2.uri : null,
                ref: data.image2.ref ? data.image2.ref : null
            },
            three: {
                // preview: null,
                uri: data.image3.uri ? data.image3.uri : null,
                ref: data.image3.ref ? data.image3.ref : null
            },
            four: {
                // preview: null,
                uri: data.image4.uri ? data.image4.uri : null,
                ref: data.image4.ref ? data.image4.ref : null
            }
        };
        feed.pictures = pictures;

        feed.name = data.name;
        feed.birthday = data.birthday;
        feed.gender = data.gender;
        feed.height = data.height;
        feed.weight = data.weight;
        feed.bodyType = data.bodyType;
        feed.bust = data.bust;

        // console.log('feed', feed);

        await Firebase.createFeed(feed, extra);

        // Vars.userFeedsChanged = true;
    }

    /*
    // ToDo: test
    async removeFeed() {
        const uid = Firebase.user().uid;
    
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const feedId = '26f7ee12-7b68-de8f-1dd1-b971b07421c4';
    
        const result = await Firebase.removeFeed(uid, placeId, feedId);
        if (!result) {
            // error handling - nothig to do
        }
    
        Vars.userFeedsChanged = true;
    }
    */

    showDateTimePicker(title) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.setState({ datePickerTitle: title, showDatePicker: true });
    }

    _hideDateTimePicker = () => this.setState({ showDatePicker: false });

    _handleDatePicked = (date) => {
        console.log('A date has been picked: ', date);

        this._hideDateTimePicker();

        const _date = new Date(date);

        const day = _date.getDate();
        const month = _date.getMonth();
        const year = _date.getFullYear();
        /*
        console.log('day', day);
        console.log('month', month);
        console.log('year', year);
        */

        let _day = '';
        if (day < 10) {
            _day = '0' + day.toString();
        } else {
            _day = day.toString();
        }

        let _month = '';
        switch (month) {
            case 0: _month = 'JAN'; break;
            case 1: _month = 'FEB'; break;
            case 2: _month = 'MAR'; break;
            case 3: _month = 'APR'; break;
            case 4: _month = 'MAY'; break;
            case 5: _month = 'JUN'; break;
            case 6: _month = 'JUL'; break;
            case 7: _month = 'AUG'; break;
            case 8: _month = 'SEP'; break;
            case 9: _month = 'OCT'; break;
            case 10: _month = 'NOV'; break;
            case 11: _month = 'DEC'; break;
        }

        let _year = '';
        _year = year.toString();

        const birthday = _day + '  ' + _month + '  ' + _year;

        this.setState({ birthday, datePickerDate: _date });
    };

    showNotification(msg) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: Constants.statusBarHeight + 6,
                            duration: 200
                        })
                    ])
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        this._showNotification = false;
    }

    hideAlertIcon() {
        if (this.state.showNameAlertIcon) this.setState({ showNameAlertIcon: false });

        if (this.state.showAgeAlertIcon) this.setState({ showAgeAlertIcon: false });

        if (this.state.showGenderAlertIcon) this.setState({ showGenderAlertIcon: false });

        if (this.state.showHeightAlertIcon) this.setState({ showHeightAlertIcon: false });

        if (this.state.showWeightAlertIcon) this.setState({ showWeightAlertIcon: false });

        if (this.state.showBodyTypeAlertIcon) this.setState({ showBodyTypeAlertIcon: false });

        if (this.state.showBreastsAlertIcon) this.setState({ showBreastsAlertIcon: false });

        if (this.state.showCountryAlertIcon) this.setState({ showCountryAlertIcon: false });

        if (this.state.showStreetAlertIcon) this.setState({ showStreetAlertIcon: false });

        if (this.state.showPicture1AlertIcon) this.setState({ showPicture1AlertIcon: false });
        if (this.state.showPicture2AlertIcon) this.setState({ showPicture2AlertIcon: false });
        if (this.state.showPicture3AlertIcon) this.setState({ showPicture3AlertIcon: false });
        if (this.state.showPicture4AlertIcon) this.setState({ showPicture4AlertIcon: false });
    }

    showFlash(title, subtitle, image) {
        if (!this._showFlash) {
            this._showFlash = true;

            if (this._showNotification) {
                this.hideNotification();
                this.hideAlertIcon();
            }

            this.setState({ flashMessageTitle: title, flashMessageSubtitle: subtitle, flashImage: image }, () => {
                this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
                    Animated.sequence([
                        Animated.parallel([
                            Animated.timing(this.state.flashOpacity, {
                                toValue: 1,
                                duration: 200
                            }),
                            Animated.timing(this.state.flashOffset, {
                                toValue: Constants.statusBarHeight,
                                duration: 200
                            })
                        ])
                    ]).start();
                });
            });

            // StatusBar.setHidden(true);
        }
    };

    hideFlash() {
        this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.flashOpacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.flashOffset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        // StatusBar.setHidden(false);

        this._showFlash = false;
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    searchBarTitle: {
        fontSize: 18,
        fontFamily: "Roboto-Medium",
        color: 'rgba(255, 255, 255, 0.8)',
        paddingBottom: 8
    },
    contactButton: {
        width: '85%',
        height: Cons.buttonHeight,
        alignSelf: 'center',
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notification: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        height: (8 + 34 + 8) - 12,
        borderRadius: 5,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.notification,
        zIndex: 10000,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    notificationText: {
        width: Dimensions.get('window').width - (12 + 24) * 2, // 12: margin right, 24: button width
        fontSize: 15,
        fontFamily: "Roboto-Medium",
        color: "black",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    flash: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        // height: Cons.searchBarHeight,
        height: (8 + 34 + 8),
        position: "absolute",
        borderRadius: 5,
        top: 0,
        backgroundColor: Theme.color.selection,
        zIndex: 10001,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.base
        // paddingTop: Constants.statusBarHeight
    },
    flashMessageTitle: {
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: "white"
    },
    flashMessageSubtitle: {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: "white"
    },
    textInputStyleIOS: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)',
        minHeight: 52
    },
    textInputStyleAndroid: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: 'rgba(255, 255, 255, 0.8)',
        height: 84,
        textAlignVertical: 'top'
    },
    done: {
        fontSize: 17,
        fontFamily: 'System',
        // fontWeight: 'bold',
        fontWeight: '500',

        // color: Theme.color.selection,
        color: 'rgb(30, 117, 212)',
        // backgroundColor: 'grey',
        alignSelf: 'center'
    }
});
