import React from 'react';
import {
    StyleSheet, TouchableOpacity, View, BackHandler, Dimensions, Image, TextInput,
    Platform, FlatList, Animated, StatusBar, Keyboard, ActivityIndicator
} from 'react-native';
import { Permissions, Linking, ImagePicker, Constants } from 'expo';
import { Text, Theme, RefreshIndicator } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign, FontAwesome } from 'react-native-vector-icons';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
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
        onUploadingImage: false,
        uploadingImageNumber: 0, // 1,2,3,4

        // uploadImage1Uri: 'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg',
        uploadImage1Uri: null,
        uploadImage2Uri: null,
        uploadImage3Uri: null,
        uploadImage4Uri: null,

        refreshing: true,

        name: '',

        showDatePicker: false,
        datePickerTitle: null,
        datePickerDate: new Date(1990, 1, 1),
        birthday: null,

        height: '',
        weight: '',
        breasts: '',
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
        offset: new Animated.Value((Constants.statusBarHeight + 10) * -1),

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        flashOffset: new Animated.Value(Cons.searchBarHeight * -1),

        showNameAlertIcon: false,
        showAgeAlertIcon: false,
        showHeightAlertIcon: false,
        showWeightAlertIcon: false,
        showBreastsAlertIcon: false,
        showCountryAlertIcon: false,
        showStreetAlertIcon: false,
        showPicturesAlertIcon: false,

        /*
        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,
        */
        onNote: false,
        keyboardTop: Dimensions.get('window').height,

        viewMarginBottom: 0
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

        // ToDo: iphone x, iphone xr, iphone xs, ...
        if (Platform.OS === 'ios' && Constants.platform.ios.model.toLowerCase() === 'iphone x') this.setState({ viewMarginBottom: 8 });
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
        /*
        type Location = {
            description: string,
            streetId: string, // place_id for street
            longitude: number,
            latitude: number
        };
        */
        /*
        const city = {
            name: obj.formatted_address,
            placeId: obj.place_id
        };
        */

        const location = {
            description: result1.description,
            streetId: result1.place_id,
            longitude: result1.location.lng,
            latitude: result1.location.lat
        };

        // const words = result1.description.split(', ');
        const words2 = result2.name.split(', ');
        // console.log('words', words.length, words); // 4, Myeong-dong, Jung-gu, Seoul, South Korea

        let street = null;
        let state = '';
        let city = '';

        // get street text
        const words1 = result1.description.split(', ');
        const length = words1.length - words2.length;

        street = '';
        for (var i = 0; i < length; i++) {
            street += words1[i];

            if (i !== length - 1) street += ', ';
        }

        // get, state, city text
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
            /*
            street = '';
            const length = words.length - 3;
            for (var i = 0; i < length; i++) {
                street += words[i];

                if (i !== length - 1) street += ', ';
            }

            city = words[words.length - 3];
            state = words[words.length - 2];
            */

            city = words2[words2.length - 3];
            state = words2[words2.length - 2];
        }

        const cityInfo = {
            description: result2.name,
            cityId: result2.placeId
        };

        this.setState({ street: street, city: city, state: state, streetInfo: location, cityInfo: cityInfo });
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

        console.log('AdvertisementMain._keyboardDidShow');

        if (this.focusedItem === 'name') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
        } else if (this.focusedItem === 'height') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
        } else if (this.focusedItem === 'weight') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
        } else if (this.focusedItem === 'note') {
            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY + 1, animated: true });

            if (!this.state.onNote) this.setState({ onNote: true });
        }


        /*
        if (this.noteFocused) {
            if (!this.state.onNote) this.setState({ onNote: true });
        }
        */

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
            // this._showNotification = false;

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
            // this._showNotification = false;
        }

        this.focusedItem = 'name';
    }

    onFocusHeight() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            // this._showNotification = false;
        }

        // clear
        this.setState({ height: '' });

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
            // this._showNotification = false;
        }

        // clear
        this.setState({ weight: '' });

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

    onFocusBreasts() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            // this._showNotification = false;
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
    }

    onFocusNote() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            // this._showNotification = false;
        }

        if (!this.state.onNote) this.setState({ onNote: true });

        this.focusedItem = 'note';
    }

    onBlurNote() {
        if (this.state.onNote) this.setState({ onNote: false });
    }

    async post() {
        if (this.state.onUploadingImage) return;

        // 1. check
        const { name, birthday, height, weight, breasts, note, country, street, streetInfo, cityInfo, uploadImage1Uri, uploadImage2Uri, uploadImage3Uri, uploadImage4Uri } = this.state;

        if (uploadImage1Uri === null) {
            this.showNotification('Please add your 1st profile picture.');

            this.setState({ showPicturesAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: 0, animated: true });

            return;
        }

        if (name === '') {
            this.showNotification('Please write your name.');

            this.setState({ showNameAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        if (birthday === null) {
            this.showNotification('Please select your date of birth.');

            this.setState({ showAgeAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        if (height === '') {
            this.showNotification('Please enter your height.');

            this.setState({ showHeightAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        if (weight === '') {
            this.showNotification('Please enter your weight.');

            this.setState({ showWeightAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        if (breasts === '') {
            this.showNotification('Please select your bra size.');

            this.setState({ showBreastsAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        if (country === null) {
            this.showNotification('Please enter your country.');

            this.setState({ showCountryAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY + 1, animated: true });

            return;
        }

        if (street === null) {
            this.showNotification('Please enter your city.');

            this.setState({ showStreetAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY + 1, animated: true });

            return;
        }

        // 2. upload
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

        data.height = Util.getHeight(height);
        data.weight = Util.getWeight(weight);
        data.bust = Util.getBust(breasts);

        // placeId, placeName, location
        // --
        data.placeId = streetInfo.placeId;
        data.placeName = streetInfo.description;
        data.location = location;
        // --

        let _note = null;
        if (note !== '') {
            _note = note;
        }

        data.note = _note;

        data.image1Uri = uploadImage1Uri;
        data.image2Uri = uploadImage2Uri;
        data.image3Uri = uploadImage3Uri;
        data.image4Uri = uploadImage4Uri;

        await this.createFeed(data);

        this.removeItemFromList();

        // 3. move to finish page
        this.refs["toast"].show('Your advertisement posted successfully.', 500, () => {
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
            transform: [
                {
                    translateY: this.state.offset
                }
            ]
        };

        const flashStyle = {
            opacity: this.state.flashOpacity,
            transform: [
                {
                    translateY: this.state.flashOffset
                }
            ]
        };

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
                                // this._showNotification = false;
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
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
                            style={{ width: (Cons.searchBarHeight - Constants.statusBarHeight) * 0.9 / 3 * 4, height: (Cons.searchBarHeight - Constants.statusBarHeight) * 0.9, borderRadius: 2 }}
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
                                // this._showNotification = false;
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
            <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: this.state.viewMarginBottom }}>
                {/* image editor view */}
                <Text style={{ marginHorizontal: 4, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
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
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                            {'NAME'}
                        </Text>
                        {/*
                        <Text style={{ marginRight: 18, color: Theme.color.text5, fontSize: 12, lineHeight: 19, fontFamily: "SFProText-Regular" }}>
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
                            <FontAwesome name='info-circle' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)'
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
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.nameY = y;
                        }}
                    />
                    {
                        this.state.showNameAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.nameY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 2. birthday */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
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
                            <FontAwesome name='info-circle' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    {/* picker */}
                    <TouchableOpacity
                        onPress={() => {
                            this.showDateTimePicker('What is your date of birth?');
                        }}
                    >
                        <Text
                            style={{
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.birthday ? this.state.birthday : "22 JUL 1992"}</Text>

                        {/* ToDo: add icon */}

                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.birthdayY = y;
                        }}
                    />
                    {
                        this.state.showAgeAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.birthdayY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 3. height */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                        {'HEIGHT'}
                    </Text>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            width: '50%'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'
                        // keyboardAppearance='dark'
                        onFocus={(e) => this.onFocusHeight()}
                        onBlur={(e) => this.onBlurHeight()}
                        onChangeText={(text) => this.validateHeight(text)}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="none"
                        placeholder='164 cm'
                        placeholderTextColor={Theme.color.placeholder}
                        value={this.state.height}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.heightY = y;
                        }}
                    />
                    {
                        this.state.showHeightAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.heightY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 4. weight */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                        {'WEIGHT'}
                    </Text>
                    <TextInput
                        style={{
                            paddingLeft: 18, paddingRight: 32,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            width: '50%'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'
                        // keyboardAppearance='dark'
                        onFocus={(e) => this.onFocusWeight()}
                        onBlur={(e) => this.onBlurWeight()}
                        onChangeText={(text) => this.validateWeight(text)}
                        selectionColor={Theme.color.selection}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        autoCapitalize="none"
                        placeholder='45 kg'
                        placeholderTextColor={Theme.color.placeholder}
                        value={this.state.weight}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.weightY = y;
                        }}
                    />
                    {
                        this.state.showWeightAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.weightY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 5. breasts */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
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
                            <FontAwesome name='info-circle' color={Theme.color.text5} size={16} />
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
                        onValueChange={(value) => {
                            // so, only for Android
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                                // this._showNotification = false;
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
                                // fontSize: 22, fontFamily: "SFProText-Regular",
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
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular",
                                color: (this.state.breasts === '') ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                            }
                        }}
                        useNativeAndroidPickerStyle={false}
                        value={this.state.breasts}

                        Icon={() => {
                            // return <Ionicons name='md-arrow-dropdown' color="rgba(255, 255, 255, 0.8)" size={20} />
                            return null;
                        }}
                    />
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.breastsY = y;
                        }}
                    />
                    {
                        this.state.showBreastsAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.breastsY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 7. note */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
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
                    <Text style={{ color: Theme.color.placeholder, fontSize: 14, fontFamily: "SFProText-Regular", textAlign: 'right', paddingRight: 24, paddingBottom: 4 }}>
                        {this.state.noteLength}
                    </Text>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.noteY = y;
                        }}
                    />

                    {/* country */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                        {'COUNTRY'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

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
                                fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: !this.state.country ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.country ? this.state.country : "What country do you live in?"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.countryY = y;
                        }}
                    />
                    {
                        this.state.showCountryAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.countryY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* street */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
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
                            <FontAwesome name='info-circle' color={Theme.color.text5} size={16} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                            }

                            // check the country is filled
                            if (!this.state.country) {
                                this.showNotification('Please enter your country.');

                                this.setState({ showCountryAlertIcon: true });

                                this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY + 1, animated: true });

                                return;
                            }

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
                                fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: !this.state.street ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)',
                                paddingTop: 7
                            }}
                        >{this.state.street ? this.state.street : "What city do you live in?"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.streetY = y;
                        }}
                    />
                    {
                        this.state.showStreetAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 22, top: this.streetY - 30 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }



                    {/* city */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                        {'CITY'}
                    </Text>
                    <Text
                        style={{
                            paddingHorizontal: 18,
                            height: textInputHeight,
                            // minHeight: textInputHeight,
                            fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            paddingTop: 7
                        }}
                    >
                        {this.state.city}
                    </Text>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />
                    {/* state */}
                    <Text style={{ paddingHorizontal: 18, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>
                        {'STATE'}
                    </Text>
                    <Text
                        style={{
                            paddingHorizontal: 18,
                            height: textInputHeight,
                            // minHeight: textInputHeight,
                            fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            paddingTop: 7
                        }}
                    >
                        {this.state.state}
                    </Text>
                    <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />



                </View>

                {/*
                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small }} />
                */}

                <Text style={{
                    marginTop: Theme.spacing.small,
                    marginBottom: Theme.spacing.small,
                    fontSize: 14, fontFamily: "SFProText-Regular", color: Theme.color.placeholder,
                    textAlign: 'center', lineHeight: 26
                }}>{"Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you"}</Text>

                <TouchableOpacity
                    style={[styles.contactButton, { marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.large }]}
                    onPress={async () => await this.post()}
                >
                    <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: Theme.color.buttonText, paddingTop: Cons.submitButtonPaddingTop() }}>Post an Advertisement</Text>
                </TouchableOpacity>
            </View>
        );
    }

    renderImage(number, uri) {
        if (!uri) {
            return (
                <View style={{ width: imageWidth, height: imageHeight }}>
                    <View style={{ width: '100%', height: '100%', borderRadius: 2, borderColor: '#707070', borderWidth: 2, borderStyle: 'dashed', backgroundColor: '#505050' }} />

                    {/* number */}
                    <Text style={{ fontFamily: "SFProText-Semibold", fontSize: 18, color: 'rgba(255, 255, 255, 0.8)', position: 'absolute', top: 6, left: 8 }}>{number}</Text>

                    {/* icon button */}
                    <TouchableOpacity
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.color.selection, position: 'absolute', bottom: -14 + 10, right: -14 + 10, justifyContent: "center", alignItems: "center" }}
                        onPress={() => {
                            this.uploadPicture(number - 1);

                            // test
                            /*
                            if (number === 3) {
                                this.showFlash('Uploading...', 'Your picture is now uploading.', null);
                            } else if (number === 4) {
                                this.setState({ flashMessageTitle: 'Success!', flashMessageSubtitle: 'Your picture uploaded successfully.' });
                                setTimeout(() => {
                                    !this.closed && this.hideFlash();
                                }, 1000);
                            }
                            */
                        }}
                    >
                        <Ionicons name='ios-add' color='white' size={24} />
                    </TouchableOpacity>
                    {
                        number === 1 && this.state.showPicturesAlertIcon &&
                        <AntDesign style={{ position: 'absolute', top: imageHeight / 2 - 12, left: imageWidth / 2 - 12 }} name='exclamationcircleo' color="rgba(255, 184, 24, 0.8)" size={24} />
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
                            <RefreshIndicator refreshing={this.state.refreshing} total={3} size={4} />
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
                        <RefreshIndicator refreshing={this.state.refreshing} total={3} size={4} />
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
                aspect: [4, 3],
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
            alert('invalid image file!');
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
        formData.append("pictureIndex", index);

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

            // ToDo: show alert icon
            // exclamationcircleo
        }
    }

    //// database ////
    async createFeed(data) {
        console.log('data', data);

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
        feed.height = data.height;
        feed.weight = data.weight;
        feed.bust = data.bust;

        console.log('feed', feed);

        await Firebase.createFeed(feed);

        Vars.userFeedsChanged = true;
    }

    // ToDo: test
    /*
    async createFeed() {
        const feedId = Util.uid(); // create uuid
        const userUid = Firebase.user().uid;
    
        let placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        let placeName = 'Bangkok, Thailand';
        const location = {
            description: 'Soi Sukhumvit 19, Khlong Toei Nuea, Watthana, Bangkok, Thailand',
            longitude: 100.5017651,
            latitude: 13.7563309
        };
    
        const note = 'note';
    
        const image1Uri = 'https://i.ytimg.com/vi/FLm-oBqOM24/maxresdefault.jpg';
        const image2Uri = 'https://pbs.twimg.com/media/DiABjHdXUAEHCdN.jpg';
        const image3Uri = 'https://i.ytimg.com/vi/jn2XzSxv4sU/maxresdefault.jpg';
        const image4Uri = 'https://t1.daumcdn.net/cfile/tistory/994E373C5BF1FD440A';
    
        const name = 'name';
        const birthday = '03111982';
        const height = 166;
        const weight = 50;
        const bust = 'D';
    
        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
        feed.location = location;
        feed.note = note;
    
        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };
    
        feed.pictures = pictures;
        feed.name = name;
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;
    
        await Firebase.createFeed(feed);
    
        Vars.userFeedsChanged = true;
    }
    
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
            // this._showNotification = false;
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

        if (this._showFlash) this.hideFlash();

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                // this.state.offset.setValue(height * -1);

                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200,
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: 0,
                            duration: 200,
                        }),
                    ])
                ]).start();
            });
        });

        StatusBar.setHidden(true);
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200,
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200,
                    })
                ])
            ]).start();
        });

        StatusBar.setHidden(false);

        this._showNotification = false;
    }

    hideAlertIcon() {
        if (this.state.showNameAlertIcon) this.setState({ showNameAlertIcon: false });

        if (this.state.showAgeAlertIcon) this.setState({ showAgeAlertIcon: false });

        if (this.state.showHeightAlertIcon) this.setState({ showHeightAlertIcon: false });

        if (this.state.showWeightAlertIcon) this.setState({ showWeightAlertIcon: false });

        if (this.state.showBreastsAlertIcon) this.setState({ showBreastsAlertIcon: false });

        if (this.state.showCountryAlertIcon) this.setState({ showCountryAlertIcon: false });

        if (this.state.showStreetAlertIcon) this.setState({ showStreetAlertIcon: false });

        if (this.state.showPicturesAlertIcon) this.setState({ showPicturesAlertIcon: false });
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
                    // this.state.flashOffset.setValue(height * -1);

                    Animated.sequence([
                        Animated.parallel([
                            Animated.timing(this.state.flashOpacity, {
                                toValue: 1,
                                duration: 200,
                            }),
                            Animated.timing(this.state.flashOffset, {
                                toValue: 0,
                                duration: 200,
                            }),
                        ])
                    ]).start();
                });
            });

            StatusBar.setHidden(true);
        }
    };

    hideFlash() {
        this._flash.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.flashOpacity, {
                        toValue: 0,
                        duration: 200,
                    }),
                    Animated.timing(this.state.flashOffset, {
                        toValue: height * -1,
                        duration: 200,
                    })
                ])
            ]).start();
        });

        StatusBar.setHidden(false);

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
        fontSize: 20,
        fontFamily: "SFProText-Semibold",
        color: 'rgba(255, 255, 255, 0.8)',
        paddingBottom: 8
    },
    contactButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notification: {
        width: '100%',
        height: Constants.statusBarHeight + 10,
        position: "absolute",
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,

        flexDirection: 'column',
        // justifyContent: 'center'
        justifyContent: 'flex-end'
    },
    notificationText: {
        alignSelf: 'center',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        color: "#FFF",
        paddingBottom: Platform.OS === 'ios' ? 4 : 0
    },
    notificationButton: {
        position: 'absolute',
        right: 18,
        bottom: 4
    },
    flash: {
        width: '100%',
        height: Cons.searchBarHeight,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.selection,
        zIndex: 9999,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.base,
        paddingTop: Constants.statusBarHeight
    },
    flashMessageTitle: {
        fontSize: 16,
        fontFamily: "SFProText-Semibold",
        color: "white"
    },
    flashMessageSubtitle: {
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        color: "white"
    },
    textInputStyleIOS: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
        minHeight: 52
    },
    textInputStyleAndroid: {
        paddingLeft: 18, paddingRight: 32,
        fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
        height: 84,
        textAlignVertical: 'top'
    },
    done: {
        fontSize: 17,
        // fontFamily: "SFProText-Regular",
        fontWeight: '300',
        color: 'blue',
        // backgroundColor: 'grey',
        alignSelf: 'center'
    }



});
