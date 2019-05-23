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
        refreshing: true,

        uploadImageUri: null,

        name: '',

        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(1990, 0, 1), // 1990.01.01
        birthday: null,

        gender: null,

        place: null,

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

        showPictureAlertIcon: false,
        showNameAlertIcon: false,
        showAgeAlertIcon: false,
        showGenderAlertIcon: false,
        showPlaceAlertIcon: false,

        onNote: false,
        keyboardTop: Dimensions.get('window').height
    };

    constructor(props) {
        super(props);

        this.imageRefs = []; // for cleaning files in server
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        const { profile } = this.props.profileStore;

        // const uid = profile.uid;
        const name = profile.name;
        let birthday = null;
        let datePickerDate = new Date(1990, 0, 1);
        if (profile.birthday) {
            birthday = Util.getBirthdayText(profile.birthday);
            datePickerDate = Util.getDate(profile.birthday);
        }

        const gender = profile.gender;
        const place = profile.place;
        const email = profile.email;
        const phoneNumber = profile.phoneNumber;
        const imageUri = profile.picture.uri;
        const about = profile.about;
        let noteLength = 0;
        if (about) noteLength = about.length;
        // ToDo: test
        /*
        const name = 'Jay Kim';
        const birthday = Util.getBirthdayText('03111982'); // DDMMYYYY
        const datePickerDate = new Date(1982, 10, 3);
        const gender = 'Male';
        const place = 'Manila, Philippines';
        const email = 'jdub.kim@gmail.com';
        const phoneNumber = '821093088300';
        const imageUri = profile.picture.uri;
        const about = 'hi~';
        const noteLength = about.length;
        */

        this.setState({ uploadImageUri: imageUri, name, birthday, datePickerDate, gender, place, note: about, noteLength: noteLength, email, phoneNumber });
    }

    initFromSearch(result) { // 'Cebu, Philippines'
        /*
        Object {
            "description": "Suwon, Gyeonggi-do, South Korea",
            "location": Object {
                "lat": 37.2635727,
                "lng": 127.0286009,
            },
            "place_id": "ChIJEUZ2IApDezURybRd7gIwN_E",
        }
        */

        this.setState({ place: result.description });
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('EditProfile._keyboardDidShow');

        if (this.focusedItem === 'name') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17, animated: true }); // Consider
        } else if (this.focusedItem === 'note') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.placeY, animated: true });

            if (!this.state.onNote) this.setState({ onNote: true });
        }

        this.setState({ keyboardTop: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide() {
        if (!this.focused) return;

        console.log('EditProfile._keyboardDidHide');

        if (this.state.onNote) this.setState({ onNote: false });

        this.setState({ keyboardTop: Dimensions.get('window').height });
    }

    noteDone() {
        this.setState({ onNote: false, keyboardTop: Dimensions.get('window').height });

        Keyboard.dismiss();
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'EditProfile';

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

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY, animated: true });
    }

    onFocusGender() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY, animated: true });
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
        const { uploadImageUri, name, birthday, gender, place, note, email, phoneNumber } = this.state;

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

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY - 17, animated: true }); // Consider

            return;
        }

        if (birthday === null) {
            this.showNotification('Please select your date of birth.');

            this.setState({ showAgeAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.nameY, animated: true });

            return;
        }

        if (gender === null) {
            this.showNotification('Please select your gender.');

            this.setState({ showGenderAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.birthdayY, animated: true });

            return;
        }

        if (place === null) {
            this.showNotification('Please enter your place.');

            this.setState({ showPlaceAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY, animated: true });

            return;
        }

        // ToDo: check email, phoneNumber

        // 2. update
        this.setState({ showPostLoader: true });

        let data = {};

        data.userUid = Firebase.user().uid;

        data.name = name;

        let _birthday = 'DDMMYYYY';
        _birthday = Util.getBirthday(this.state.datePickerDate);
        data.birthday = _birthday;

        data.gender = gender;

        data.place = place;

        let _note = null;
        if (note !== '') {
            _note = note;
        }
        data.note = _note;

        data.image = {
            uri: uploadImageUri,
            ref: this.uploadImageRef
        };

        data.email = email;
        data.phoneNumber = phoneNumber;

        await this.updateProfile(data);

        this.removeItemFromList();

        // 3. go back
        this.refs["toast"].show('Your advertisement posted successfully.', 500, () => {
            this.setState({ showPostLoader: false });

            if (!this.closed) {
                this.props.navigation.dispatch(NavigationActions.back());
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
                        onPress={async () => {
                            await this.save();
                        }}
                    >
                        <Ionicons name='md-checkmark' color={'rgba(62, 165, 255, 0.8)'} size={24} />
                    </TouchableOpacity>
                </View>

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
        const { uploadImageUri } = this.state;

        return (
            <View>
                <View style={{ borderTopColor: Theme.color.line, borderTopWidth: 1 }}>
                    <View style={{ marginTop: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            this.uploadPicture();
                        }}>
                            {
                                uploadImageUri ?
                                    <SmartImage
                                        style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                        showSpinner={false}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={uploadImageUri}
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
                        </TouchableOpacity>
                        {
                            this.state.showPictureAlertIcon &&
                            <AntDesign style={{ position: 'absolute', left: Dimensions.get('window').width / 2 - 12, top: avatarWidth / 2 - 12 }}
                                name='exclamationcircleo' color={Theme.color.notification} size={24} />
                        }

                        {
                            this.state.onUploadingImage &&
                            <View style={{
                                width: Dimensions.get('window').width, height: avatarWidth,
                                position: 'absolute', top: 0, left: 0,
                                justifyContent: 'center', alignItems: 'center'
                            }}>
                                <RefreshIndicator refreshing={this.state.refreshing} total={3} size={4} color={Theme.color.selection} />
                            </View>
                        }
                    </View>

                    <View style={{ marginBottom: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => {
                                if (this._showNotification) {
                                    this.hideNotification();
                                    this.hideAlertIcon();
                                }

                                this.uploadPicture();
                            }}
                        >
                            <Text style={{ color: 'rgba(62, 165, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Regular" }}>{'Change Profile Picture'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginTop: Theme.spacing.small, paddingHorizontal: 4 }}
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
                        placeholder="Enter your name"
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
                        >{this.state.birthday ? this.state.birthday : "Select your birthday"}</Text>

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

                    {/* 4. place */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'LOCATION'}
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

                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.genderY, animated: true });

                            setTimeout(() => {
                                this.props.navigation.navigate("editSearch",
                                    { from: 'EditProfile', initFromSearch: (result) => this.initFromSearch(result) }); // ToDo
                            }, Cons.buttonTimeoutShort);
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                // height: textInputHeight,
                                minHeight: textInputHeight,
                                fontSize: textInputFontSize, fontFamily: "Roboto-Regular", color: !this.state.place ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.place ? this.state.place : "Select your location"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginTop: 6, marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.placeY = y;
                        }}
                    />
                    {
                        this.state.showPlaceAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.placeY - 30 - 6 }} name='exclamationcircleo' color={Theme.color.notification} size={24} />
                    }

                    {/* 6. note */}
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

                    {/* 7. email */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "Roboto-Medium" }}>
                            {'EMAIL ADDRESS'}
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

                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.noteY, animated: true });

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
                        >{this.state.email ? this.state.email : "Enter your email address"}</Text>
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

                            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.emailY, animated: true });

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
                        >{this.state.phoneNumber ? this.state.phoneNumber : "Enter your phone number"}</Text>
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
        );
    }

    uploadPicture() {
        if (this.state.onUploadingImage) return;

        this.pickImage();
    }

    async pickImage() {
        const { status: existingCameraStatus } = await Permissions.getAsync(Permissions.CAMERA);
        const { status: existingCameraRollStatus } = await Permissions.getAsync(Permissions.CAMERA_ROLL);

        if (existingCameraStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA);
            if (status !== 'granted') {
                /*
                const url = 'app-settings:';
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    Linking.openURL(url);
                }
                */
                return;
            }
        }

        if (existingCameraRollStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                /*
                const url = 'app-settings:';
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    Linking.openURL(url);
                }
                */
                return;
            }
        }

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

                const ref = 'images/' + Firebase.user().uid + '/profile/' + result.uri.split('/').pop();
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
        // formData.append("type", "post");
        formData.append("type", "profile");

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
        } catch (error) {
            console.error(error);

            this.showNotification('An error happened. Please try again.');

            // stop indicator
            this.setState({ refreshing: false });

            // show alert icon
            this.setState({ showPictureAlertIcon: true });
        }
    }

    async updateProfile(data) {
        let profile = {};
        profile.uid = data.userUid;
        profile.name = data.name;
        profile.birthday = data.birthday;
        profile.gender = data.gender;
        profile.place = data.place;
        profile.about = data.note;
        profile.picture = {
            // preview: null,
            uri: data.image.uri,
            ref: data.image.ref
        };
        profile.email = data.email;
        profile.phoneNumber = data.phoneNumber;

        await Firebase.updateProfile(profile.uid, profile);
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
        if (this.state.showAgeAlertIcon) this.setState({ showAgeAlertIcon: false });
        if (this.state.showGenderAlertIcon) this.setState({ showGenderAlertIcon: false });
        if (this.state.showPlaceAlertIcon) this.setState({ showPlaceAlertIcon: false });
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
