import React from 'react';
import {
    StyleSheet, TouchableOpacity, View, BackHandler, Dimensions, Image, TextInput, Easing,
    Platform, FlatList, Animated, TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { Text, Theme, RefreshIndicator } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign } from 'react-native-vector-icons';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
import Util from './Util';
import autobind from 'autobind-decorator';
import DateTimePicker from 'react-native-modal-datetime-picker';
// https://github.com/lawnstarter/react-native-picker-select
import Select from 'react-native-picker-select';
// import { Chevron } from 'react-native-shapes';
import { sendPushNotificationToTopic } from './PushNotifications';

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";

const doneButtonViewHeight = 44;

const textInputFontSize = 18;
const textInputHeight = 34;

const imageViewWidth = Dimensions.get('window').width / 2;
const imageViewHeight = imageViewWidth / 4 * 3;

// 4:3 image
const imageWidth = imageViewWidth * 0.8;
const imageHeight = imageViewHeight * 0.8;

// message box pos
// --
const messageBoxW = Dimensions.get('window').width / 12 * 7;
const messageBoxH = 60;

const V1 = 10;
const V3 = 10;
const V4 = 14;
const V2 = messageBoxW - V3 * 2 - V4;

const x1 = 5;
const y1 = 5;

const x2 = x1 + messageBoxW;
const y2 = y1;

const x3 = x2;
const y3 = y2 + messageBoxH;

const x4 = x1 + (V2 + V3 * 2);
const y4 = y3;

const x5 = x1 + (V2 + V3);
const y5 = y4 + V1;

const x6 = x1 + V2;
const y6 = y4;

const x7 = x1;
const y7 = y3;

const points = x1.toString() + ' ' + y1.toString() + ' ' +
    x2.toString() + ' ' + y2.toString() + ' ' +
    x3.toString() + ' ' + y3.toString() + ' ' +
    x4.toString() + ' ' + y4.toString() + ' ' +
    x5.toString() + ' ' + y5.toString() + ' ' +
    x6.toString() + ' ' + y6.toString() + ' ' +
    x7.toString() + ' ' + y7.toString();
// --

const genderItems = [
    {
        label: 'Man',
        value: 'Man'
    },
    {
        label: 'Woman',
        value: 'Woman'
    },
    /*
    {
        label: 'Other',
        value: 'Other'
    }
    */
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
    },
    /*
    {
        label: 'Rather not say',
        value: 'Rather not say'
    }
    */
];

const braSizeItems = [
    {
        label: 'A cup',
        value: 'A'
    },
    {
        label: 'B cup',
        value: 'B'
    },
    {
        label: 'C cup',
        value: 'C'
    },
    {
        label: 'D cup',
        value: 'D'
    },
    /*
    {
        label: 'Rather not say',
        value: 'Rather not say'
    }
    */
];

const bicepsSizeItems = [
    {
        label: 'Small (10\" - 11.5\")',
        value: 'S'
    },
    {
        label: 'Medium (11.5\" - 13\")',
        value: 'M'
    },
    {
        label: 'Large (13\" - 14.5\")',
        value: 'L'
    },
    {
        label: 'Extra Large (14.5\" - 16\")',
        value: 'XL'
    },
    /*
    {
        label: 'Rather not say',
        value: 'Rather not say'
    }
    */
];


export default class AdvertisementMain extends React.Component {
    state = {
        showPostLoader: false,

        onUploadingImage: false,
        uploadingImageNumber: 0, // 1,2,3,4
        uploadImage1Uri: null,
        uploadImage2Uri: null,
        uploadImage3Uri: null,
        uploadImage4Uri: null,

        name: '',
        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(2000, 0, 1),
        birthday: null,
        gender: null,
        height: '',
        weight: '',
        bodyType: null,
        boobs: null,
        biceps: null,
        note: '',
        noteLength: 0,

        country: null,
        countryCode: null,

        street: null,
        // city: '',
        // state: '',
        streetInfo: null,
        cityInfo: null,

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
        showBoobsAlertIcon: false,
        showCountryAlertIcon: false,
        showStreetAlertIcon: false,

        onNote: false,
        keyboardTop: Dimensions.get('window').height,

        notification: '',

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri

        showMessageBox: false,
        messageBoxY: 0,
        messageBoxText: ''
    };

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);

        this.flashOpacity = new Animated.Value(0);
        this.flashOffset = new Animated.Value((8 + 34 + 8) * -1);

        this.messageBoxOpacity = new Animated.Value(0);

        this.feedId = null;

        this.imageRefs = []; // for cleaning files in server

        this.contentText = Util.getQuotes();
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardWillShow);
        this.keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', this._keyboardWillHide);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    async componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.keyboardWillShowListener.remove();
        this.keyboardWillHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        // remove server files
        // this.cleanImages();

        this.closed = true;
    }

    async cleanImages() {
        if (this.imageRefs.length > 0) {
            console.log('jdub', 'clean image files');

            let formData = new FormData();
            for (let i = 0; i < this.imageRefs.length; i++) {
                const ref = this.imageRefs[i];

                const number = i + 1;
                const fieldName = 'file' + number.toString();
                formData.append(fieldName, ref);

                console.log('jdub', fieldName, ref);
            }

            await fetch(SERVER_ENDPOINT + "cleanPostImages", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data"
                },
                body: formData
            });
        }
    }

    initFromSelect(result) { // country
        console.log('jdub', 'AdvertisementMain.initFromSelect', result);

        this.setState({
            country: result.name, countryCode: result.code,
            street: null, /* city: '', state: '', */ streetInfo: null, cityInfo: null
        });
    }

    initFromSearch(result1, result2) { // street
        console.log('jdub', 'AdvertisementMain.initFromSearch', result1, result2);

        /*
        "description": "33 Hyoryeong-ro, Seocho-dong, Seocho-gu, Seoul, South Korea",
        "location": {
            "lat": 37.4851745,
            "lng": 127.0131415,
        },
        "place_id": "ChIJAYY89hOhfDURvKmQf1zQ_eA"
        }
        */

        // streetInfo
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

        const street = Util.getStreet(result1.description);

        // --
        const country = Util.getCountry(result1.description);
        const countryCode = Util.getCountyCode(country);

        if (countryCode) {
            this.setState({ country, countryCode });
        } else {
            // set null
            this.setState({ country: null, countryCode: null });
        }
        // --

        // let state = '';
        // let city = '';

        this.setState({ street: street, /* city: city, state: state, */ streetInfo: location, cityInfo: cityInfo });
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        if (this.focusedItem === 'name') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17 + 1, animated: true });
        } else if (this.focusedItem === 'height') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY + 1, animated: true });
        } else if (this.focusedItem === 'weight') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.heightY + 1, animated: true });
        } else if (this.focusedItem === 'note') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.boobsY + 1, animated: true });

            !this.closed && this.setState({ onNote: true });
        }

        !this.closed && this.setState({ keyboardTop: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide(e) {
        if (!this.focused) return;

        !this.closed && this.setState({ onNote: false, keyboardTop: Dimensions.get('window').height });
    }

    @autobind
    _keyboardWillShow(e) {
        this._keyboardDidShow(e);
    }

    @autobind
    _keyboardWillHide(e) {
        this._keyboardDidHide(e);
    }

    noteDone() {
        this.setState({ onNote: false, keyboardTop: Dimensions.get('window').height });

        Keyboard.dismiss();
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'AdvertisementMain';

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'AdvertisementMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();

            return true;
        }

        if (this._showFlash) {
            this.hideFlash();

            return true;
        }

        // add current upload files to remove list
        if (this.uploadImage1Ref) this.imageRefs.push(this.uploadImage1Ref);
        if (this.uploadImage2Ref) this.imageRefs.push(this.uploadImage2Ref);
        if (this.uploadImage3Ref) this.imageRefs.push(this.uploadImage3Ref);
        if (this.uploadImage4Ref) this.imageRefs.push(this.uploadImage4Ref);

        // remove server files
        this.cleanImages();

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
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

    /*
    onFocusBirthday() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY + 1, animated: true });
    }
    */

    /*
    onFocusGender() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY + 1, animated: true });
    }
    */

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

    /*
    onFocusBodyType() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.weightY + 1, animated: true });
    }
    */

    /*
    onFocusBoobs() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY + 1, animated: true });
    }
    */

    onFocusNote() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        // this.setState({ onNote: true });

        // move scroll in keyboard show event
        this.focusedItem = 'note';
    }

    onBlurNote() {
        // this.setState({ onNote: false });
    }

    async post() {
        if (this.state.onUploadingImage) return;

        // 1. check
        const { name, birthday, gender, height, weight, bodyType, boobs, biceps, note, country, street, streetInfo, cityInfo,
            uploadImage1Uri, uploadImage2Uri, uploadImage3Uri, uploadImage4Uri } = this.state;

        if (uploadImage1Uri === null) {
            this.showNotification('Please add your 1st profile picture.');

            this.setState({ showPicture1AlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: 0, animated: true });

            return;
        }

        if (name === '') {
            this.showNotification('Please write your name.');

            this.setState({ showNameAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17 + 1, animated: true });

            return;
        } else if (!Util.validateName(name)) {
            this.showNotification('Please use valid characters for your name.');

            this.setState({ showNameAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17 + 1, animated: true });

            return;
        }

        if (birthday === null) {
            this.showNotification('Please select your date of birth.');

            this.setState({ showAgeAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY + 1, animated: true });

            return;
        }

        if (gender === null) {
            this.showNotification('Please select your gender.');

            this.setState({ showGenderAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY + 1, animated: true });

            return;
        }

        if (height === '') {
            this.showNotification('Please enter your height.');

            this.setState({ showHeightAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY + 1, animated: true });

            return;
        }

        if (weight === '') {
            this.showNotification('Please enter your weight.');

            this.setState({ showWeightAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.heightY + 1, animated: true });

            return;
        }

        if (!bodyType) {
            this.showNotification('Please select your bra size.');

            this.setState({ showBodyTypeAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.weightY + 1, animated: true });

            return;
        }

        if (gender === 'Woman' && !boobs) {
            this.showNotification('Please select your bra size.');

            this.setState({ showBoobsAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY + 1, animated: true });

            return;
        }

        if (gender === 'Man' && !biceps) {
            this.showNotification('Please select your biceps size.');

            this.setState({ showBoobsAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.bodyTypeY + 1, animated: true });

            return;
        }

        if (country === null) {
            this.showNotification('Please enter your country.');

            this.setState({ showCountryAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });

            return;
        }

        if (street === null) {
            this.showNotification('Please enter your city.');

            this.setState({ showStreetAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.countryY + 1, animated: true });

            return;
        }

        // 2. upload

        // show loader
        this.setState({ showPostLoader: true });

        let data = {};

        if (!this.feedId) {
            this.feedId = Util.uid();
        }
        data.feedId = this.feedId;

        data.userUid = Firebase.user().uid;

        data.name = name.trim();

        let _birthday = 'DDMMYYYY';
        _birthday = Util.getBirthday(this.state.datePickerDate);
        data.birthday = _birthday;

        data.gender = gender;
        data.height = Util.getHeight(height);
        data.weight = Util.getWeight(weight);
        data.bodyType = bodyType;
        // data.bust = Util.getBust(boobs);
        data.bust = boobs;
        data.muscle = biceps;

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
            _note = note.trim();
        }
        data.note = _note;

        /*
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
        */
        let image = this.getImage(0);
        data.image1 = {
            uri: image.uri,
            ref: image.ref
        };

        image = this.getImage(image.number);
        data.image2 = {
            uri: image.uri,
            ref: image.ref
        };

        image = this.getImage(image.number);
        data.image3 = {
            uri: image.uri,
            ref: image.ref
        };

        image = this.getImage(image.number);
        data.image4 = {
            uri: image.uri,
            ref: image.ref
        };

        const extra = {
            lat: cityInfo.location.lat,
            lng: cityInfo.location.lng
        };

        await this.createFeed(data, extra);

        // 3. move to finish page
        this.showToast('Your advertisement posted successfully.', 500);

        sendPushNotificationToTopic(Cons.pushNotification.post, data.placeName, data.placeId, data.feedId, cityInfo.location.lat, cityInfo.location.lng, data.placeId);

        // hide loader
        this.setState({ showPostLoader: false }, () => {
            !this.closed && this.props.navigation.navigate("advertisementFinish");
        });
    }

    getImage(lastSavedImageNumber) {
        let uri = null;
        let ref = null;
        let number = -1;

        const { uploadImage1Uri, uploadImage2Uri, uploadImage3Uri, uploadImage4Uri } = this.state;

        if (lastSavedImageNumber === 0) {

            if (uploadImage1Uri) {
                uri = uploadImage1Uri;
                ref = this.uploadImage1Ref;
                number = 1;
            } else {
                if (uploadImage2Uri) {
                    uri = uploadImage2Uri;
                    ref = this.uploadImage2Ref;
                    number = 2;
                } else {
                    if (uploadImage3Uri) {
                        uri = uploadImage3Uri;
                        ref = this.uploadImage3Ref;
                        number = 3;
                    } else {
                        if (uploadImage4Uri) {
                            uri = uploadImage4Uri;
                            ref = this.uploadImage4Ref;
                            number = 4;
                        }
                    }
                }
            }

        } else if (lastSavedImageNumber === 1) {

            if (uploadImage2Uri) {
                uri = uploadImage2Uri;
                ref = this.uploadImage2Ref;
                number = 2;
            } else {
                if (uploadImage3Uri) {
                    uri = uploadImage3Uri;
                    ref = this.uploadImage3Ref;
                    number = 3;
                } else {
                    if (uploadImage4Uri) {
                        uri = uploadImage4Uri;
                        ref = this.uploadImage4Ref;
                        number = 4;
                    }
                }
            }

        } else if (lastSavedImageNumber === 2) {

            if (uploadImage3Uri) {
                uri = uploadImage3Uri;
                ref = this.uploadImage3Ref;
                number = 3;
            } else {
                if (uploadImage4Uri) {
                    uri = uploadImage4Uri;
                    ref = this.uploadImage4Ref;
                    number = 4;
                }
            }

        } else if (lastSavedImageNumber === 3) {

            if (uploadImage4Uri) {
                uri = uploadImage4Uri;
                ref = this.uploadImage4Ref;
                number = 4;
            }

        }

        const image = {
            uri, ref, number
        };

        return image;
    }

    render() {
        const notificationStyle = {
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
        };

        const flashStyle = {
            opacity: this.flashOpacity,
            transform: [{ translateY: this.flashOffset }]
        };

        return (
            <View style={styles.flex}>
                {/* notification bar */}
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

                {/* flash bar */}
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
                            style={{ width: (Cons.searchBarHeight * 0.7) / 3 * 4, height: Cons.searchBarHeight * 0.7, borderRadius: 2 }}
                            style={{ width: (8 + 34 + 8) * 0.84 / 3 * 4, height: (8 + 34 + 8) * 0.84, borderRadius: 2 }}
                            // style={{ width: (8 + 34 + 8) * 0.84, height: (8 + 34 + 8) * 0.84, borderRadius: 2 }}
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

                {/* search bar */}
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

                            // add current upload files to remove list
                            if (this.uploadImage1Ref) this.imageRefs.push(this.uploadImage1Ref);
                            if (this.uploadImage2Ref) this.imageRefs.push(this.uploadImage2Ref);
                            if (this.uploadImage3Ref) this.imageRefs.push(this.uploadImage3Ref);
                            if (this.uploadImage4Ref) this.imageRefs.push(this.uploadImage4Ref);

                            // remove server files
                            this.cleanImages();

                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        // alignSelf: 'center'
                        marginLeft: 40 + 16
                    }}>New Post</Text>
                </View>

                <FlatList
                    // ref={(fl) => this._flatList = fl}
                    ref="flatList"
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={this.renderListHeaderComponent()}
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
                        justifyContent: "center", alignItems: "flex-end", paddingRight: 16
                    }}>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.noteDone()}
                        >
                            <Text style={Platform.OS === 'android' ? styles.androidDoneButton : styles.iosDoneButton}>Done</Text>
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    renderListHeaderComponent() {
        let ageText = null;
        if (this.state.birthday) {
            const age = Util.getAge(Util.getBirthday(this.state.datePickerDate));
            if (age > 1) {
                ageText = age.toString() + ' years old';
            } else {
                ageText = age.toString() + ' year old';
            }
        }

        let boobsTitle = 'BOOBS';
        if (!this.state.gender || this.state.gender === 'Woman' || this.state.gender === 'Other') boobsTitle = 'BOOBS';
        else if (this.state.gender === 'Man') boobsTitle = 'MUSCLE';

        const viewStyle = {
            opacity: this.messageBoxOpacity
        };

        if (Platform.OS === 'ios') {
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
                            <TouchableOpacity
                                style={{
                                    width: 24,
                                    height: 24,
                                    marginRight: 18,
                                    justifyContent: "center", alignItems: "center"
                                }}
                                onPress={() => {
                                    const msg = "Your name (or your friend's name). People all over the world find you on Rowena.";
                                    this.showMessageBox(msg, -17);
                                }}>
                                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            ref={(ref) => this._name = ref}
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
                                {'AGE'}
                            </Text>
                            <TouchableOpacity
                                style={{
                                    width: 24,
                                    height: 24,
                                    marginRight: 18,
                                    justifyContent: "center", alignItems: "center"
                                }}
                                onPress={() => {
                                    const msg = "Rowena is for adults only. You must be at least 18 years old to use this app.";
                                    this.showMessageBox(msg, this.nameY);
                                }}>
                                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                            </TouchableOpacity>
                        </View>
                        {/* picker */}
                        <TouchableOpacity
                            onPress={() => {
                                // this.onFocusBirthday();

                                this.showDateTimePicker('Select your date of birth');
                            }}
                        >
                            <Text
                                style={{
                                    paddingHorizontal: 18,
                                    width: '80%',
                                    height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                    paddingTop: 7
                                }}
                            >{this.state.birthday ? ageText + ' (' + this.state.birthday + ')' : "When is your birthday?"}</Text>
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
                                    const msg = "Your gender is what you decide. You are a man or a woman, or maybe you don't like to decide it.";
                                    this.showMessageBox(msg, this.birthdayY);
                                }}>
                                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                            </TouchableOpacity>
                        </View>
                        <Select
                            // onOpen={() => this.onFocusGender()} // NOT working in Android
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

                        {/* 5. weight */}

                        {/* 6. body type */}

                        {/* 7. boobs */}
                        {/* boobs / biceps */}

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
                                    const msg = "How would you describe yourself? People want to know more about you.";
                                    this.showMessageBox(msg, this.boobsY);
                                }}>
                                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            ref={(ref) => this._note = ref}
                            style={Platform.OS === 'ios' ? styles.textInputStyleIOS : styles.textInputStyleAndroid}
                            // placeholder='More information about you'
                            placeholder="I know I can't be your only match, but at least I'm the hottest."
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
                            onFocus={(e) => this.onFocusNote()}
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
                            >
                                <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                if (this.state.onUploadingImage) return;

                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideAlertIcon();
                                }

                                // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });

                                setTimeout(() => {
                                    !this.closed && this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
                                }, Cons.buttonTimeout);
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
                            >{this.state.country ? this.state.country : "Thailand"}</Text>
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
                            {/*
                            <TouchableOpacity
                                style={{
                                    width: 24,
                                    height: 24,
                                    marginRight: 18,
                                    justifyContent: "center", alignItems: "center"
                                }}
                                onPress={() => {
                                    const msg = "Only confirmed customers see your exact address. We show everyone else an approximate location.";
                                    this.showMessageBox(msg, this.countryY);
                                }}>
                                <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                            </TouchableOpacity>
                            */}
                            <TouchableOpacity
                                style={{
                                    width: 24,
                                    height: 24,
                                    marginRight: 18,
                                    justifyContent: "center", alignItems: "center"
                                }}
                            >
                                <Ionicons name='md-alert' color={Theme.color.background} size={16} />
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

                                    this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });

                                    return;
                                }

                                // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.countryY + 1, animated: true });

                                setTimeout(() => {
                                    !this.closed && this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', countryCode: this.state.countryCode, initFromSearch: (result1, result2) => this.initFromSearch(result1, result2) });
                                }, Cons.buttonTimeout);
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
                            >{this.state.street ? this.state.street : "Thong Lo, Phra Khanong, Khlong Toei, Bangkok"}</Text>
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

                    {/*
                    <Text style={{
                        paddingHorizontal: Theme.spacing.base,
                        marginTop: Theme.spacing.small,
                        marginBottom: Theme.spacing.small,
                        fontSize: 14, fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                        textAlign: 'center',
                        lineHeight: 20
                    }}>{this.contentText}</Text>
                    */}

                    <TouchableOpacity
                        // style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: Cons.bottomButtonMarginBottom }]}
                        style={[styles.contactButton, { marginTop: Theme.spacing.base, marginBottom: Cons.bottomButtonMarginBottom }]}
                        onPress={async () => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            await this.post();
                        }}
                    >
                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>
                            {Platform.OS === 'android' ? 'Post an Advertisement' : 'Upload Post'}
                        </Text>
                        {
                            this.state.showPostLoader &&
                            <ActivityIndicator
                                style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 10002 }}
                                animating={true}
                                size="small"
                                color={Theme.color.buttonText}
                            />
                        }
                    </TouchableOpacity>

                    {
                        this.state.showMessageBox &&
                        <TouchableWithoutFeedback onPress={() => {
                            if (this.state.showMessageBox) {
                                this.hideMessageBox();
                            }
                        }}>
                            <Animated.View style={[
                                {
                                    width: 5 + messageBoxW + 5, height: 5 + messageBoxH + V1 + 5,
                                    position: 'absolute', right: 5, top: this.inputViewY + this.state.messageBoxY - (messageBoxH + V1 - 10),
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: 'transparent'
                                }, viewStyle
                            ]}>
                                <SvgAnimatedLinearGradient width={5 + messageBoxW + 5} height={5 + messageBoxH + V1 + 5}>
                                    <Svg.Polygon
                                        points={points}
                                        fill={Theme.color.text5}
                                    />
                                </SvgAnimatedLinearGradient>
                                <Text style={{
                                    width: '92%', height: '70%',
                                    position: 'absolute', top: 7, left: 10,
                                    // backgroundColor: '#212121',
                                    fontSize: 13, lineHeight: 18,
                                    fontFamily: "Roboto-Regular", color: Theme.color.highlight,
                                    // textAlignVertical: 'center', // only for android
                                }}>
                                    {this.state.messageBoxText}
                                </Text>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    }
                </View>
            );
        }

        // android
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
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                const msg = "Your name (or your friend's name). People all over the world find you on Rowena.";
                                this.showMessageBox(msg, -17);
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        ref={(ref) => this._name = ref}
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
                            {'AGE'}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                const msg = "Rowena is for adults only. You must be at least 18 years old to use this app.";
                                this.showMessageBox(msg, this.nameY);
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    {/* picker */}
                    <TouchableOpacity
                        onPress={() => {
                            // this.onFocusBirthday();

                            this.showDateTimePicker('Select your date of birth');
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                width: '80%',
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.birthday ? ageText + ' (' + this.state.birthday + ')' : "When is your birthday?"}</Text>
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
                                const msg = "Your gender is what you decide. You are a man or a woman, or maybe you don't like to decide it.";
                                this.showMessageBox(msg, this.birthdayY);
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        // onOpen={() => this.onFocusGender()} // NOT working in Android
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
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        ref={(ref) => this._height = ref}
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
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        ref={(ref) => this._weight = ref}
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
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                        </TouchableOpacity>
                    </View>
                    <Select
                        // onOpen={() => this.onFocusBodyType()} // NOT working in Android
                        placeholder={
                            {
                                label: "What's your body type?",
                                value: null
                            }
                        }
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

                    {/* 7. boobs */}
                    {/* boobs / biceps */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{
                            paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium"
                        }}>
                            {boobsTitle}
                        </Text>
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                        </TouchableOpacity>
                    </View>
                    {
                        boobsTitle === 'BOOBS' ?
                            <Select
                                /*
                                ref={(el) => {
                                    this.inputRefs.favSport0 = el;
                                }}
                                */
                                // onOpen={() => this.onFocusBoobs()} // NOT working in Android
                                placeholder={{
                                    label: "What's your bra size?",
                                    value: null
                                }}
                                // placeholderTextColor={Theme.color.placeholder}
                                items={braSizeItems}
                                onValueChange={(value) => { // only for Android
                                    if (this._showNotification) {
                                        this.hideNotification();
                                        this.hideAlertIcon();
                                    }

                                    this.setState({ boobs: value, biceps: null });
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
                                        color: this.state.boobs === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                                    }
                                }}
                                useNativeAndroidPickerStyle={false}
                                value={this.state.boobs}
                                Icon={() => {
                                    // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                                    return null;
                                }}
                            />
                            :
                            <Select
                                // onOpen={() => this.onFocusBoobs()} // NOT working in Android
                                placeholder={{
                                    label: "How big are your biceps?",
                                    value: null
                                }}
                                // placeholderTextColor={Theme.color.placeholder}
                                items={bicepsSizeItems}
                                onValueChange={(value) => { // only for Android
                                    if (this._showNotification) {
                                        this.hideNotification();
                                        this.hideAlertIcon();
                                    }

                                    this.setState({ biceps: value, boobs: null });
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
                                        color: this.state.biceps === null ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                                    }
                                }}
                                useNativeAndroidPickerStyle={false}
                                value={this.state.biceps}
                                Icon={() => {
                                    return null;
                                }}
                            />
                    }
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.boobsY = y;
                        }}
                    />
                    {
                        this.state.showBoobsAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.boobsY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
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
                                const msg = "How would you describe yourself? People want to know more about you.";
                                this.showMessageBox(msg, this.boobsY);
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        ref={(ref) => this._note = ref}
                        style={Platform.OS === 'ios' ? styles.textInputStyleIOS : styles.textInputStyleAndroid}
                        // placeholder='More information about you'
                        placeholder="I know I can't be your only match, but at least I'm the hottest."
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
                        onFocus={(e) => this.onFocusNote()}
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
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.onUploadingImage) return;

                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });

                            setTimeout(() => {
                                !this.closed && this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
                            }, Cons.buttonTimeout);
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
                        >{this.state.country ? this.state.country : "Thailand"}</Text>
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
                        {/*
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => {
                                const msg = "Only confirmed customers see your exact address. We show everyone else an approximate location.";
                                this.showMessageBox(msg, this.countryY);
                            }}>
                            <Ionicons name='md-alert' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                        */}
                        <TouchableOpacity
                            style={{
                                width: 24,
                                height: 24,
                                marginRight: 18,
                                justifyContent: "center", alignItems: "center"
                            }}
                        >
                            <Ionicons name='md-alert' color={Theme.color.background} size={16} />
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

                                this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });

                                return;
                            }

                            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.countryY + 1, animated: true });

                            setTimeout(() => {
                                !this.closed && this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', countryCode: this.state.countryCode, initFromSearch: (result1, result2) => this.initFromSearch(result1, result2) });
                            }, Cons.buttonTimeout);
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
                        >{this.state.street ? this.state.street : "Thong Lo, Phra Khanong, Khlong Toei, Bangkok"}</Text>
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

                {/*
                <Text style={{
                    paddingHorizontal: Theme.spacing.base,
                    marginTop: Theme.spacing.small,
                    marginBottom: Theme.spacing.small,
                    fontSize: 14, fontFamily: "Roboto-Light", color: Theme.color.placeholder,
                    textAlign: 'center',
                    lineHeight: 20
                }}>{this.contentText}</Text>
                */}

                <TouchableOpacity
                    // style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: Cons.bottomButtonMarginBottom }]}
                    style={[styles.contactButton, { marginTop: Theme.spacing.base, marginBottom: Cons.bottomButtonMarginBottom }]}
                    onPress={async () => {
                        if (this._showNotification) {
                            this.hideNotification();
                            this.hideAlertIcon();
                        }

                        await this.post();
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>
                        {Platform.OS === 'android' ? 'Post an Advertisement' : 'Upload Post'}
                    </Text>
                    {
                        this.state.showPostLoader &&
                        <ActivityIndicator
                            style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 10002 }}
                            animating={true}
                            size="small"
                            color={Theme.color.buttonText}
                        />
                    }
                </TouchableOpacity>

                {
                    this.state.showMessageBox &&
                    <TouchableWithoutFeedback onPress={() => {
                        if (this.state.showMessageBox) {
                            this.hideMessageBox();
                        }
                    }}>
                        <Animated.View style={[
                            {
                                width: 5 + messageBoxW + 5, height: 5 + messageBoxH + V1 + 5,
                                position: 'absolute', right: 5, top: this.inputViewY + this.state.messageBoxY - (messageBoxH + V1 - 10),
                                alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'transparent'
                            }, viewStyle
                        ]}>
                            <SvgAnimatedLinearGradient width={5 + messageBoxW + 5} height={5 + messageBoxH + V1 + 5}>
                                <Svg.Polygon
                                    points={points}
                                    fill={Theme.color.text5}
                                />
                            </SvgAnimatedLinearGradient>
                            <Text style={{
                                width: '92%', height: '70%',
                                position: 'absolute', top: 7, left: 10,
                                // backgroundColor: '#212121',
                                fontSize: 13, lineHeight: 18,
                                fontFamily: "Roboto-Regular", color: Theme.color.highlight,
                                // textAlignVertical: 'center', // only for android
                            }}>
                                {this.state.messageBoxText}
                            </Text>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                }
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
                        <View style={{
                            width: imageWidth, height: imageHeight,
                            position: 'absolute', top: 0, left: 0,
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            {/*
                            <RefreshIndicator refreshing={true} total={3} size={4} color={Theme.color.selection} />
                            */}
                            <ActivityIndicator animating={true} size="small" color={Theme.color.selection} />
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
                        {/*
                        <RefreshIndicator refreshing={true} total={3} size={4} color={Theme.color.selection} />
                        */}
                        <ActivityIndicator animating={true} size="small" color={Theme.color.selection} />
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
        const { status: existingCameraStatus } = await Permissions.getAsync(Permissions.CAMERA);
        const { status: existingCameraRollStatus } = await Permissions.getAsync(Permissions.CAMERA_ROLL);

        if (existingCameraStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA);
            if (status !== 'granted') {
                await Util.openSettings("CAMERA");
                return;
            }
        }

        if (existingCameraRollStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                await Util.openSettings("CAMERA_ROLL");
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            // aspect: Platform.OS === 'android' ? [4, 3] : [1, 1], // ToDo: android only! (square image in IOS)
            aspect: [1, 1],
            quality: 1.0,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });

        console.log('jdub', 'result of launchImageLibraryAsync:', result);

        if (!result.cancelled) {
            this.setState({ onUploadingImage: true, uploadingImageNumber: index + 1 });

            const path = result.uri;

            // show indicator & progress bar
            this.showFlash('Uploading...', 'Your picture is now uploading.', path);

            // upload image
            await this.uploadImage(path, index, (uri) => {
                if (!uri) {
                    this.hideFlash();
                    this.showNotification('An error happened. Please try again later.');
                    this.showAlertIcon(index);
                    this.setState({ onUploadingImage: false });
                    return;
                }

                const ref = 'images/' + Firebase.user().uid + '/post/' + this.feedId + '/' + path.split('/').pop();

                switch (index) {
                    case 0:
                        this.setState({ uploadImage1Uri: uri });
                        if (this.uploadImage1Ref) this.imageRefs.push(this.uploadImage1Ref);
                        this.uploadImage1Ref = ref;
                        break;

                    case 1:
                        this.setState({ uploadImage2Uri: uri });
                        if (this.uploadImage2Ref) this.imageRefs.push(this.uploadImage2Ref);
                        this.uploadImage2Ref = ref;
                        break;

                    case 2:
                        this.setState({ uploadImage3Uri: uri });
                        if (this.uploadImage3Ref) this.imageRefs.push(this.uploadImage3Ref);
                        this.uploadImage3Ref = ref;
                        break;

                    case 3:
                        this.setState({ uploadImage4Uri: uri });
                        if (this.uploadImage4Ref) this.imageRefs.push(this.uploadImage4Ref);
                        this.uploadImage4Ref = ref;
                        break;
                }

                // hide indicator & progress bar
                this.setState({ flashMessageTitle: 'Success!', flashMessageSubtitle: 'Your picture uploaded successfully.' });

                setTimeout(() => {
                    if (this.closed) return;
                    this.hideFlash();
                    this.setState({ onUploadingImage: false, uploadingImageNumber: 0 });
                }, 1500);
            });
        }
    }

    async uploadImage(uri, index, cb) {
        const fileName = uri.split('/').pop();
        let ext = fileName.split('.').pop();

        if (!Util.isImage(ext)) {
            const msg = 'Invalid image file (' + ext + ').';
            this.showNotification(msg);
            return;
        }

        let type = Util.getImageType(ext);
        // console.log('jdub', 'file type:', type);

        let formData = new FormData();
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
            console.log('jdub', 'uploadImage, responseJson', responseJson);

            // console.log('jdub', 'responseJson', await response.json());

            if (responseJson.downloadUrl) cb(responseJson.downloadUrl);
            else cb(null);

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

            cb(null);
        }
    }

    showAlertIcon(index) {
        if (index === 0) this.setState({ showPicture1AlertIcon: true });
        if (index === 1) this.setState({ showPicture2AlertIcon: true });
        if (index === 2) this.setState({ showPicture3AlertIcon: true });
        if (index === 3) this.setState({ showPicture4AlertIcon: true });
    }

    async createFeed(data, extra) {
        console.log('jdub', 'AdvertisementMain.createFeed', data, extra);

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
                uri: data.image1.uri ? data.image1.uri : null,
                ref: data.image1.ref ? data.image1.ref : null
            },
            two: {
                uri: data.image2.uri ? data.image2.uri : null,
                ref: data.image2.ref ? data.image2.ref : null
            },
            three: {
                uri: data.image3.uri ? data.image3.uri : null,
                ref: data.image3.ref ? data.image3.ref : null
            },
            four: {
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
        feed.muscle = data.muscle;

        await Firebase.createFeed(feed, extra);
    }

    showDateTimePicker(title) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.setState({ datePickerTitle: title, showDatePicker: true });
    }

    _hideDateTimePicker = () => this.setState({ showDatePicker: false });

    _handleDatePicked = (date) => {
        console.log('jdub', 'A date has been picked: ', date);

        this._hideDateTimePicker();

        const _date = new Date(date);

        // check age
        const age = Util.getAge(Util.getBirthday(_date));
        if (age <= 17) {
            this.showNotification('You must be at least 18 years old to use Rowena.');
            return;
        }

        const day = _date.getDate();
        const month = _date.getMonth();
        const year = _date.getFullYear();
        /*
        console.log('jdub', 'day', day);
        console.log('jdub', 'month', month);
        console.log('jdub', 'year', year);
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
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.offset, {
                        toValue: Constants.statusBarHeight + 6,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
    }

    showFlash(title, subtitle, image) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this._showFlash = true;

        this.setState({ flashMessageTitle: title, flashMessageSubtitle: subtitle, flashImage: image }, () => {
            this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.flashOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.flashOffset, {
                        toValue: Constants.statusBarHeight,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });

        // StatusBar.setHidden(true);
    };

    hideFlash() {
        this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.timing(this.flashOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.flashOffset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showFlash = false; });
        });

        // StatusBar.setHidden(false);
    }

    hideAlertIcon() {
        if (this.state.showNameAlertIcon) this.setState({ showNameAlertIcon: false });
        if (this.state.showAgeAlertIcon) this.setState({ showAgeAlertIcon: false });
        if (this.state.showGenderAlertIcon) this.setState({ showGenderAlertIcon: false });
        if (this.state.showHeightAlertIcon) this.setState({ showHeightAlertIcon: false });
        if (this.state.showWeightAlertIcon) this.setState({ showWeightAlertIcon: false });
        if (this.state.showBodyTypeAlertIcon) this.setState({ showBodyTypeAlertIcon: false });
        if (this.state.showBoobsAlertIcon) this.setState({ showBoobsAlertIcon: false });
        if (this.state.showCountryAlertIcon) this.setState({ showCountryAlertIcon: false });
        if (this.state.showStreetAlertIcon) this.setState({ showStreetAlertIcon: false });
        if (this.state.showPicture1AlertIcon) this.setState({ showPicture1AlertIcon: false });
        if (this.state.showPicture2AlertIcon) this.setState({ showPicture2AlertIcon: false });
        if (this.state.showPicture3AlertIcon) this.setState({ showPicture3AlertIcon: false });
        if (this.state.showPicture4AlertIcon) this.setState({ showPicture4AlertIcon: false });
    }

    showMessageBox(msg, y) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.setState({ messageBoxText: msg, showMessageBox: true, messageBoxY: y }, () => {
            Animated.timing(this.messageBoxOpacity, {
                toValue: 1,
                duration: 200,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            }).start(() => {
                this.timer = setTimeout(() => {
                    if (this.closed) return;

                    if (this.state.showMessageBox) this.hideMessageBox();
                }, 2000);
            });
        });
    }

    hideMessageBox() {
        if (this._hideMessageBox) return;

        this._hideMessageBox = true;

        Animated.timing(this.messageBoxOpacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
        }).start(() => {
            this.setState({ showMessageBox: false, messageBoxY: 0 });

            this._hideMessageBox = false;
        });
    }

    blur() {
        this._name.blur();
        this._height.blur();
        this._weight.blur();
        this._note.blur();
    }

    showToast(msg, ms, cb = null) {
        if (this.props.screenProps.data) this.props.screenProps.data.showToast(msg, ms, cb);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        // alignItems: 'center',
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
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
        lineHeight: 17,
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
    iosDoneButton: {
        /*
        // fontSize: 17,
        // fontFamily: 'System',
        // fontWeight: '500',
        // color: 'rgb(30, 117, 212)',
        fontFamily: 'Helvetica-Bold',
        fontSize: 16.5,
        color: 'rgb(30, 117, 212)',
        alignSelf: 'center'
        */
        fontFamily: 'Helvetica',
        fontSize: 15,
        color: 'rgb(30, 117, 212)',
        alignSelf: 'center'
    },
    androidDoneButton: {
        fontFamily: 'System',
        fontSize: 17,
        fontWeight: '400',
        color: 'rgb(30, 117, 212)',
        alignSelf: 'center'
    }
});
