import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Platform,
    FlatList, TouchableWithoutFeedback, Image, Keyboard, TextInput, StatusBar, BackHandler, Vibration
} from 'react-native';
import { Constants, Svg, Haptic, Linking } from "expo";
import MapView, { MAP_TYPES, ProviderPropType, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, AntDesign, FontAwesome, MaterialIcons, MaterialCommunityIcons, Feather } from "react-native-vector-icons";
import { Text, Theme, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from 'moment';
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
import Swiper from './Swiper';
import { AirbnbRating } from './react-native-ratings/src';
import Firebase from "./Firebase";
import autobind from "autobind-decorator";
import { inject, observer } from "mobx-react/native";
import ReadMore from "./ReadMore";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { NavigationActions } from 'react-navigation';
import Dialog from "react-native-dialog";
import DateTimePicker from 'react-native-modal-datetime-picker';
// https://github.com/lawnstarter/react-native-picker-select
import Select from 'react-native-picker-select';

// 3:2 image
const imageWidth = Dimensions.get('window').width;
const imageHeight = imageWidth / 3 * 2;

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


export default class EditPost extends React.Component {
    state = {
        post: null,

        // renderList: false,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',



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
        cityInfo: null,
        streetInfo: null,
        country: null,
        countryCode: null,
        street: null,
        note: '',
        noteLength: 0
    };

    constructor(props) {
        super(props);

        this.itemHeights = {};

        this.springValue = new Animated.Value(1);
    }

    componentDidMount() {
        console.log('Post.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { post } = this.props.navigation.state.params;

        const name = post.name;
        let birthday = null;
        let datePickerDate = new Date(1990, 0, 1);
        if (post.birthday) {
            birthday = Util.getBirthdayText(post.birthday);
            datePickerDate = Util.getDate(post.birthday);
        }
        const gender = post.gender;
        const height = post.height + ' cm';
        const weight = post.weight + ' kg';
        const bodyType = post.bodyType;
        const breasts = post.bust + ' cup';

        const cityInfo = {
            cityId: post.placeId,
            description: post.placeName
        };

        const location = post.location;
        const streetInfo = {
            description: location.description,
            longitude: location.longitude,
            latitude: location.latitude
        };

        let street = ''; // remove country
        const words1 = location.description.split(', ');
        const size = words1.length - 1;
        for (let i = 0; i < size; i++) {
            street += words1[i];
            if (i != size - 1) street += ', ';
        }

        const country = words1[words1.length - 1];
        const countryCode = Util.getCountyCode(country);

        const note = post.note;
        let noteLength = 0;
        if (note) noteLength = note.length;

        this.setState({ post, name, birthday, datePickerDate, gender, height, weight, bodyType, breasts, cityInfo, streetInfo, country, countryCode, street, note, noteLength });

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
        */
    }

    @autobind
    _keyboardDidShow(e) {
        if (!this.focused) return;

    }

    @autobind
    _keyboardDidHide() {
        if (!this.focused) return;


    }

    @autobind
    handleHardwareBackPress() {
        console.log('EditPost.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'EditPost';

        this.focused = true;
    }

    @autobind
    onBlur() {
        this.focused = false;
    }

    componentWillUnmount() {
        console.log('Post.componentWillUnmount');

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    render() {
        let paddingBottom = Cons.viewMarginBottom();

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={[styles.flex, { paddingBottom }]}>
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
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                {/* search bar */}
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
                            if (this._showNotification) {
                                this.hideNotification();
                            }

                            const params = this.props.navigation.state.params;
                            if (params) {
                                const initFromPost = params.initFromPost;
                                if (initFromPost) initFromPost(this.state.post);
                            }

                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* delete button */}
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
                            if (this._showNotification) {
                                this.hideNotification();
                            }

                            // ToDo: check!
                            this.openDialog('Delete', 'Are you sure you want to delete this post?', async () => {
                                const { post } = this.props.navigation.state.params;
                                await Firebase.removeFeed(post.uid, post.placeId, post.id);

                                // close
                                this.props.navigation.dispatch(NavigationActions.back());
                            });
                        }}
                    >
                        <Ionicons name='md-trash' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* check button */}
                    {/*
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
                            // await this.save();
                        }}
                    >
                        <Ionicons name='md-checkmark' color={'rgba(62, 165, 255, 0.8)'} size={24} />
                    </TouchableOpacity>
                    */}
                </View>

                {
                    // this.state.renderList &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={this.renderHeader()}
                    />
                }

                <DateTimePicker
                    isVisible={this.state.showDatePicker}
                    onConfirm={this._handleDatePicked}
                    onCancel={this._hideDateTimePicker}
                    date={this.state.datePickerDate}
                    titleIOS={this.state.datePickerTitle}
                />

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View >
        );
    }

    renderHeader() {
        const post = this.state.post;

        let distance = '';
        let integer = 0;
        let number = '';
        let ageText = '';

        let showSettingsButton = false;

        if (post) {
            distance = Util.getDistance(post.location, Vars.location);
            if (distance === '? km away') showSettingsButton = true;

            const averageRating = post.averageRating;

            integer = Math.floor(averageRating);

            if (Number.isInteger(averageRating)) {
                number = averageRating + '.0';
            } else {
                number = averageRating.toString();
            }

            const age = Util.getAge(post.birthday);
            if (age > 1) {
                ageText = age.toString() + ' years old';
            } else {
                ageText = age.toString() + ' year old';
            }
        }

        return (
            <View>
                {/* profile pictures */}
                {
                    this.renderSwiper(post)
                }

                <View style={{ marginTop: Theme.spacing.base, paddingHorizontal: 4 }}
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
                        >{this.state.birthday ? this.state.birthday : "When is your birthday?"}</Text>

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
                            // label: "Fit",
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
                            // label: "C cup",
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
                                !this.closed && this.props.navigation.navigate("advertisementSelect", { initFromSelect: (result) => this.initFromSelect(result) });
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
                                !this.closed && this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', countryCode: this.state.countryCode, initFromSearch: (result1, result2) => this.initFromSearch(result1, result2) });
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

                <TouchableOpacity
                    style={[styles.contactButton, { marginTop: Theme.spacing.base, marginBottom: 32 }]}
                    onPress={async () => {
                        if (this._showNotification) {
                            this.hideNotification();
                        }

                        // await this.contact();
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>{'Update Post'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    renderSwiper(post) {
        if (!post) return null;

        let pictures = [];

        let value = post.pictures.one.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`one`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            this.swiper.scrollBy(1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        }
                    }}
                    >
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        value = post.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Light);
                            else Vibration.vibrate(10);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}
                    >
                        <SmartImage
                            style={styles.item}
                            showSpinner={false}
                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableOpacity>
                </View>
            );
        }

        // anonymous image
        if (pictures.length === 0) {
            pictures.push(
                <View style={styles.slide} key={`zero`}>
                    <TouchableOpacity activeOpacity={1.0} onPress={(e) => {
                        const imageW = Dimensions.get('window').width;
                        const boundary = imageW / 2;
                        const x = e.nativeEvent.locationX;

                        if (x <= boundary) { // left
                            this.swiper.scrollBy(-1, false);
                            if (Platform.OS === 'ios') Haptic.impact(Haptic.ImpactFeedbackStyle.Success);
                            else Vibration.vibrate(30);
                        } else { // right
                            if (Platform.OS === 'ios') Haptic.notification(Haptic.NotificationFeedbackType.Success);
                            else Vibration.vibrate(30);
                        }
                    }}
                    >
                        <Image
                            style={[styles.item, { backgroundColor: 'black', tintColor: 'white', resizeMode: 'contain' }]}
                            source={PreloadImage.user}
                        />
                    </TouchableOpacity>
                </View>
            );
        }


        return (
            <Swiper
                ref={(swiper) => { this.swiper = swiper; }}
                style={styles.wrapper}
                // containerStyle={{ marginBottom: 10 }}
                width={imageWidth}
                height={imageHeight}
                loop={false}
                autoplay={false}
                autoplayTimeout={3}
                paginationStyle={{ bottom: 4 }}
            >
                {pictures}
            </Swiper>
        );
    }

    openKeyboard(ref, index, owner) {
        if (this.state.showKeyboard) return;

        !this.closed && this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
        this.owner = owner;
    }

    showNotification(msg) {
        if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        !this.closed && this.setState({ notification: msg }, () => {
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

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }

    openDialog(title, message, callback) {
        !this.closed && this.setState({ dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) !this.closed && this.setState({ dialogVisible: false });
    }

    handleCancel() {
        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
    }

    sendPushNotification(message) {
        // const { post } = this.props.navigation.state.params;
        const post = this.state.post;

        const sender = Firebase.user().uid;
        const senderName = Firebase.user().name;
        // const receiver = post.uid; // owner
        const receiver = this.owner;
        const data = {
            message: message,
            placeId: post.placeId,
            feedId: post.id
        };

        sendPushNotification(sender, senderName, receiver, Cons.pushNotification.reply, data);
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
        justifyContent: 'flex-end'
    },
    container: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.small
    },
    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        width: imageWidth,
        height: imageHeight
    },
    infoContainer: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        // padding: Theme.spacing.small,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small
    },
    circle: {
        width: 10,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: 'rgb(70, 154, 32)'
    },
    date: {
        marginLeft: 8,
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    name: {
        color: Theme.color.title,
        fontSize: 24,
        paddingTop: 4,
        fontFamily: "Roboto-Medium"
    },
    /*
    size: {
        color: "white",
        fontSize: 18,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.xSmall
    },
    */
    bodyInfoTitle: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        // paddingTop: Cons.bodyInfoTitlePaddingTop(),
        paddingTop: 2,
        paddingLeft: Theme.spacing.tiny,
    },
    distance: {
        // paddingLeft: 5,
        paddingHorizontal: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    distanceButton: {
        // paddingLeft: 5,
        paddingHorizontal: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 18,
        // lineHeight: 18,
        fontFamily: "Roboto-Regular",
        // paddingTop: Math.round(Dimensions.get('window').height / 100) - 2
        paddingTop: 2
    },
    /*
    note: {
        marginTop: 5,
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: Platform.OS === 'ios' ? 26 : 30,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.small,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
        backgroundColor: 'rgb(34, 34, 34)',
        borderRadius: 5,
        // borderColor: "transparent",
        borderWidth: 0,
    },
    */
    note: {
        marginTop: Theme.spacing.tiny,

        color: Theme.color.text2,
        fontSize: 16,
        fontFamily: "Roboto-Light",
        lineHeight: 26
    },
    mapContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
    },
    location: {
        // marginTop: Theme.spacing.xSmall,
        marginBottom: Theme.spacing.tiny,

        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 26,
        fontFamily: "Roboto-Regular"
    },
    mapView: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    map: {
        width: '100%',
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 5 * 3
    },
    writeReviewContainer: {
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small
    },
    ratingText: {
        color: Theme.color.placeholder,
        textAlign: 'center',
        fontSize: 16,
        // lineHeight: 16,
        fontFamily: "Roboto-Light",
        paddingTop: 10,
        paddingBottom: 10
    },
    reviewsContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
    },
    reviewContainer: {
        // marginHorizontal: 10,
        padding: 10,
    },
    reviewName: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light",
        marginLeft: 'auto'
    },
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 14,
        // lineHeight: 13,
        fontFamily: "Roboto-Regular",
        // paddingTop: Theme.spacing.xSmall
        // paddingTop: 1
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Regular"
    },
    replyOwner: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-MediumItalic"
    },
    replyDate: {
        color: Theme.color.text3,
        fontSize: 12,
        fontFamily: "Roboto-Light",
        marginLeft: 'auto'
    },
    replyComment: {
        color: Theme.color.text2,
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "Roboto-Italic"
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
    ratingText1: {
        // height: 8,
        width: 20,

        color: Theme.color.text4,
        fontSize: 12,
        fontFamily: "Roboto-Medium",
        // backgroundColor: 'green'
    },
    ratingText2: {
        // height: 8,

        width: 30,
        textAlign: 'right',

        color: Theme.color.text4,
        fontSize: 12,
        fontFamily: "Roboto-Medium",
        // backgroundColor: 'green'
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
