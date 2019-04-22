import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, FlatList, Image, Dimensions, Animated,
    TextInput, Platform, StatusBar, Keyboard, ActivityIndicator
} from 'react-native';
import { Text, Theme, RefreshIndicator } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign } from 'react-native-vector-icons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker, Constants } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import PreloadImage from './PreloadImage';
import Firebase from './Firebase';
import * as firebase from "firebase";
import Util from './Util';
import DateTimePicker from 'react-native-modal-datetime-picker';
// https://github.com/lawnstarter/react-native-picker-select
import Select from 'react-native-picker-select';
import Toast, { DURATION } from 'react-native-easy-toast';

const avatarWidth = Dimensions.get('window').width / 4;

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";

const doneButtonViewHeight = 44;

const textInputFontSize = 18;
const textInputHeight = 34;

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

type InjectedProps = {
    profileStore: ProfileStore
};


@inject("profileStore")
@observer
export default class EditProfile extends React.Component<InjectedProps> {
    state = {
        showPostLoader: false,

        onUploadingImage: false,
        uploadImageUri: null,

        refreshing: true,

        name: '',

        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(1990, 1, 1),
        birthday: null,

        gender: null,

        country: null,
        countryCode: null,

        street: null,
        city: '',
        state: '',
        streetInfo: null,
        cityInfo: null,

        note: '',
        noteLength: 0,

        email: null,
        phoneNumber: null,



        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        flashOffset: new Animated.Value((8 + 34 + 8) * -1),

        // showPictureAlertIcon: false,
        showNameAlertIcon: false,
        showAgeAlertIcon: false,
        showGenderAlertIcon: false,
        showCountryAlertIcon: false,
        showStreetAlertIcon: false,

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
            this.refs.flatList.scrollToOffset({ offset: this.nameY, animated: true });
        } else if (this.focusedItem === 'note') {
            this.refs.flatList.scrollToOffset({ offset: this.noteY + doneButtonViewHeight, animated: true });

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

        this.refs.flatList.scrollToOffset({ offset: this.birthdayY, animated: true });
    }

    onFocusGender() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.genderY, animated: true });
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

    async save() {
        if (this.state.onUploadingImage) return;

        // 1. check
        const { uploadImageUri, name, birthday, gender, country, street, streetInfo, cityInfo, note } = this.state;

        /*
        if (uploadImageUri === null) {
            this.showNotification('Please add your profile picture.');

            this.setState({ showPictureAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: 0, animated: true });

            return;
        }
        */

        if (name === '') {
            this.showNotification('Please write your name.');

            this.setState({ showNameAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + 1, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.nameY, animated: true });

            return;
        }

        if (birthday === null) {
            this.showNotification('Please select your date of birth.');

            this.setState({ showAgeAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY + 1, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.birthdayY, animated: true });

            return;
        }

        if (gender === null) {
            this.showNotification('Please select your gender.');

            this.setState({ showGenderAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY + 1, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.genderY, animated: true });

            return;
        }

        if (country === null) {
            this.showNotification('Please enter your country.');

            this.setState({ showCountryAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });

            return;
        }

        if (street === null) {
            this.showNotification('Please enter your city.');

            this.setState({ showStreetAlertIcon: true });

            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY + 1, animated: true });
            this.refs.flatList.scrollToOffset({ offset: this.streetY, animated: true });

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

        data.imageUri = uploadImageUri;

        const extra = {
            lat: cityInfo.location.lat,
            lng: cityInfo.location.lng
        };

        await this.updateProfile(data, extra);

        this.removeItemFromList();

        // 3. move to finish page
        this.refs["toast"].show('Your advertisement posted successfully.', 500, () => {
            this.setState({ showPostLoader: false });

            if (!this.closed) {
                // this.props.navigation.navigate("advertisementFinish");
            }
        });
    }

    removeItemFromList() {
        if (this.uploadImageRef) {
            const ref = this.uploadImageRef;
            const index = this.imageRefs.indexOf(ref);
            if (index > -1) {
                this.imageRefs.splice(index, 1);
            }
        }
    }

    render() {
        const { profile } = this.props.profileStore;

        const imageUri = profile.picture.uri;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        const flashStyle = {
            opacity: this.state.flashOpacity,
            transform: [{ translateY: this.state.flashOffset }]
        };


        return (
            <View style={[styles.flex, { marginBottom: Cons.viewMarginBottom() }]}>
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* text */}
                    <Text style={styles.searchBarTitle}>{'Edit Profile'}</Text>

                    {/* check button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            // this.props.navigation.dispatch(NavigationActions.back());
                            // ToDo
                        }}
                    >
                        <Ionicons name='md-checkmark' color={'rgba(62, 165, 255, 0.8)'} size={24} />
                    </TouchableOpacity>
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
                        <Ionicons name='md-close' color="white" size={20} />
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
                            style={{ width: (8 + 34 + 8) * 0.84 / 3 * 4, height: (8 + 34 + 8) * 0.84, borderRadius: 2 }}
                            source={{ uri: this.state.flashImage }}
                        />
                    }
                </Animated.View>

                <FlatList
                    // ref={(fl) => this._flatList = fl}
                    ref="flatList"
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <View>
                            <View style={{
                                borderTopColor: Theme.color.line, borderTopWidth: 1,
                                // borderBottomColor: Theme.color.line, borderBottomWidth: 1,
                                // backgroundColor: 'rgb(50, 50, 50)'
                            }}>

                                <View style={{ marginTop: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
                                    {
                                        imageUri ?
                                            <Image
                                                style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                source={{ uri: imageUri }}
                                            />
                                            :
                                            <Image
                                                style={{
                                                    backgroundColor: 'black', tintColor: 'white', width: avatarWidth, height: avatarWidth,
                                                    borderRadius: avatarWidth / 2, borderColor: 'black', borderWidth: 1,
                                                    resizeMode: 'cover'
                                                }}
                                                source={PreloadImage.user}
                                            />
                                    }
                                </View>

                                <View style={{ marginBottom: 12, justifyContent: 'center', alignItems: 'center' }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // ToDo
                                        }}
                                    >
                                        <Text style={{ color: 'rgba(62, 165, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Regular" }}>{'Change Profile Photo'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ marginTop: Theme.spacing.small }}>
                                {/* 1. name */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                        {'NAME'}
                                    </Text>
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
                                    selectionColor={Theme.color.selection}
                                    underlineColorAndroid="transparent"
                                    autoCorrect={false}
                                    autoCapitalize="words"
                                    placeholder="Selena Gomez"
                                    placeholderTextColor={Theme.color.placeholder}
                                    value={this.state.name}
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

                                {/* 4. country */}
                                <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                    {'COUNTRY'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (this.state.onUploadingImage) return;

                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        // move scroll
                                        this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });

                                        setTimeout(() => {
                                            // this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
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

                                {/* 5. street */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                        {'STREET'}
                                    </Text>
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
                                            this.refs.flatList.scrollToOffset({ offset: this.countryY, animated: true });

                                            return;
                                        }

                                        // move scroll
                                        this.refs.flatList.scrollToOffset({ offset: this.streetY, animated: true });

                                        setTimeout(() => {
                                            // this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', countryCode: this.state.countryCode, initFromSearch: (result1, result2) => this.initFromSearch(result1, result2) });
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

                                {/* 6. note */}
                                <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                    {'NOTE'}
                                </Text>
                                <TextInput
                                    style={Platform.OS === 'ios' ? styles.textInputStyleIOS : styles.textInputStyleAndroid}
                                    placeholder='More information about you'
                                    placeholderTextColor={Theme.color.placeholder}
                                    onChangeText={(text) => {
                                        this.setState({ note: text, noteLength: text.length });
                                    }}
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

                                {/* 7. email */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                        {'EMAIL ADDRESS'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (this.state.onUploadingImage) return;

                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        // move scroll
                                        this.refs.flatList.scrollToOffset({ offset: this.emailY, animated: true });

                                        setTimeout(() => {
                                            // this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                >
                                    <Text
                                        style={{
                                            paddingHorizontal: 18,
                                            // height: textInputHeight,
                                            minHeight: textInputHeight,
                                            fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.email ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                            paddingTop: 7
                                        }}
                                    >{this.state.country ? this.state.email : "email address"}</Text>
                                </TouchableOpacity>
                                <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        this.emailY = y;
                                    }}
                                />
                                {
                                    this.state.showEmailAlertIcon &&
                                    <AntDesign style={{ position: 'absolute', right: 22, top: this.emailY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                                }

                                {/* 7. phone */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                                        {'PHONE NUMBER'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (this.state.onUploadingImage) return;

                                        if (this._showNotification) {
                                            this.hideNotification();
                                            this.hideAlertIcon();
                                        }

                                        // move scroll
                                        this.refs.flatList.scrollToOffset({ offset: this.phoneNumberY, animated: true });

                                        setTimeout(() => {
                                            // this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                >
                                    <Text
                                        style={{
                                            paddingHorizontal: 18,
                                            // height: textInputHeight,
                                            minHeight: textInputHeight,
                                            fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.phoneNumber ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                            paddingTop: 7
                                        }}
                                    >{this.state.country ? this.state.phoneNumber : "phone number"}</Text>
                                </TouchableOpacity>
                                <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        this.phoneNumberY = y;
                                    }}
                                />
                                {
                                    this.state.showPhoneNumberAlertIcon &&
                                    <AntDesign style={{ position: 'absolute', right: 22, top: this.phoneNumberY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                                }
                            </View>
                        </View>
                    }
                />
            </View>
        );
    }

    uploadPicture() {
        if (this.state.onUploadingImage) return;

        this.pickImage();
    }

    async pickImage() {
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
                this.setState({ onUploadingImage: true });

                // show indicator & progress bar
                this.showFlash('Uploading...', 'Your picture is now uploading.', result.uri);

                // upload image
                const index = 0;
                this.uploadImage(result.uri, index, (uri) => {
                    this.setState({ uploadImageUri: uri });


                    const ref = 'images/' + Firebase.user().uid + '/post/' + this.feedId + '/' + result.uri.split('/').pop();
                    this.imageRefs.push(ref);

                    this.uploadImageRef = ref;

                    // hide indicator & progress bar
                    this.setState({ flashMessageTitle: 'Success!', flashMessageSubtitle: 'Your picture uploaded successfully.' });
                    setTimeout(() => {
                        !this.closed && this.hideFlash();

                        this.setState({ onUploadingImage: false });
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
        formData.append("type", "post"); // formData.append("type", "profile");

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
        formData.append("pictureIndex", index); // ToDo

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
        } catch (error) {
            console.error(error);

            this.showNotification('An error occurred. Please try again.');

            // stop indicator
            this.setState({ refreshing: false });

            // show alert icon
            // this.setState({ showPictureAlertIcon: true });
        }
    }

    async updateProfile(data, extra) {
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
                preview: null,
                uri: data.image1Uri
            },
            two: {
                preview: null,
                uri: data.image2Uri
            },
            three: {
                preview: null,
                uri: data.image3Uri
            },
            four: {
                preview: null,
                uri: data.image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = data.name;
        feed.birthday = data.birthday;
        feed.gender = data.gender;

        // console.log('feed', feed);

        // await Firebase.createFeed(feed, extra);
        Firebase.updateProfile()

        // Vars.userFeedsChanged = true;
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

        // ToDo
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

        this._showFlash = false;
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        // backgroundColor: '#123456',
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
        color: "white",
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
