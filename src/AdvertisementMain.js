import React from 'react';
import {
    StyleSheet, TouchableOpacity, View, Text, BackHandler, Dimensions, Image, TextInput,
    Platform, FlatList, Animated, StatusBar
} from 'react-native';
import { Permissions, Linking, ImagePicker, Constants } from 'expo';
import { Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from "react-native-vector-icons/AntDesign";
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
import Util from './Util';
import autobind from 'autobind-decorator';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Select from 'react-native-picker-select';
// import { Chevron } from 'react-native-shapes';

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
        // ToDo: test
        uploadImage1Uri: 'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg',
        uploadImage2Uri: null,
        uploadImage3Uri: null,
        uploadImage4Uri: null,

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

        location: '',
        place: null,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0),

        showNameAlertIcon: false,
        showAgeAlertIcon: false,
        showHeightAlertIcon: false,
        showWeightAlertIcon: false,
        showBreastsAlertIcon: false,
        showLocationAlertIcon: false,
        showPicturesAlertIcon: false,

        viewMarginBottom: 0,
        // showPaddingView: false
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        // ToDo: iphone x, iphone xr, iphone xs, ...
        if (Platform.OS === 'ios' && Constants.platform.ios.model.toLowerCase() === 'iphone x') this.setState({ viewMarginBottom: 8 });
    }

    initFromSearch(result) {
        console.log('AdvertisementMain.initFromSearch', result);

        /*
        {
            "description": "Cebu, Philippines",
            "location": Object {
                "lat": 10.3156992,
                "lng": 123.8854366,
            },
            "place_id": "ChIJ_S3NjSWZqTMRBzXT2wwDNEw",
        }
        */

        this.setState({ location: result.description, place: result });
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            this._showNotification = false;

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    validateName(text) {
        this.setState({ name: text });
    }

    onFocusName() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            this._showNotification = false;
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
    }

    onFocusHeight() {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            this._showNotification = false;
        }

        // clear
        this.setState({ height: '' });

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
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
            this._showNotification = false;
        }

        // clear
        this.setState({ weight: '' });

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
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
            this._showNotification = false;
        }

        this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });
    }

    onFocusNote() {
        // show padding view
        // this.setState({ showPaddingView: true });

        // console.log (this.inputViewY, this.nameY, this.birthdayY, this.heightY, this.weightY, this.breastsY, this.locationY);

        // ToDo: only works in ios!
        this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.breastsY + 1, animated: true });
    }

    onBlurNote() {
        // hide padding view
        // this.setState({ showPaddingView: false });
    }

    async post() {
        // 1. check
        const { name, birthday, height, weight, breasts, note, location, place, uploadImage1Uri, uploadImage2Uri, uploadImage3Uri, uploadImage4Uri } = this.state;

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

        if (location === '') {
            this.showNotification('Please enter your city.');

            this.setState({ showLocationAlertIcon: true });

            this.refs.flatList.scrollToOffset({ offset: this.inputViewY, animated: true });

            return;
        }

        // 2. upload

        // ToDo:






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
                                this._showNotification = false;
                            }

                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={styles.searchBarTitle}>{'Writing a Post'}</Text>
                </View>

                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => {
                            this.hideNotification();
                            this.hideAlertIcon();
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                    </TouchableOpacity>
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
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'NAME'}
                    </Text>
                    <TextInput
                        style={{
                            paddingHorizontal: 18,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)'
                        }}
                        // keyboardType={'email-address'}
                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                        onChangeText={(text) => this.validateName(text)}
                        selectionColor={Theme.color.selection}
                        // keyboardAppearance='dark'
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
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.nameY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 2. birthday */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'AGE (BIRTHDAY)'}
                    </Text>
                    {/* picker */}
                    <TouchableOpacity
                        onPress={() => {
                            this.showDateTimePicker('What is your date of birth?');
                        }}
                    >
                        <Text
                            style={[{
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: !this.state.birthday ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            },
                            Platform.OS === 'ios' && {
                                paddingTop: 4
                            }]}
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
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.birthdayY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 3. height */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'HEIGHT'}
                    </Text>
                    <TextInput
                        style={{
                            paddingHorizontal: 18,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            width: '50%'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'

                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                        onFocus={(e) => this.onFocusHeight()}
                        onBlur={(e) => this.onBlurHeight()}
                        onChangeText={(text) => this.validateHeight(text)}
                        selectionColor={Theme.color.selection}
                        // keyboardAppearance='dark'
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
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.heightY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 4. weight */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'WEIGHT'}
                    </Text>
                    <TextInput
                        style={{
                            paddingHorizontal: 18,
                            height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                            width: '50%'
                        }}
                        keyboardType='phone-pad'
                        returnKeyType='done'

                        onFocus={(e) => this.onFocusWeight()}
                        onBlur={(e) => this.onBlurWeight()}
                        onChangeText={(text) => this.validateWeight(text)}
                        selectionColor={Theme.color.selection}
                        // keyboardAppearance='dark'
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
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.weightY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 5. breasts */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'BREASTS'}
                    </Text>
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
                                this._showNotification = false;
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
                                color: (this.state.breasts) ? 'rgba(255, 255, 255, 0.8)' : Theme.color.placeholder
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
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.breastsY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }

                    {/* 7. note */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
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
                        // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                        maxLength={200}
                        multiline={true}
                        numberOfLines={4}
                        onFocus={(e) => this.onFocusNote()}
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

                    {/* 6. location */}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        {'LOCATION'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                                this.hideAlertIcon();
                                this._showNotification = false;
                            }

                            this.props.navigation.navigate("advertisementSearch", { from: 'AdvertisementMain', initFromSearch: (result) => this.initFromSearch(result) });
                        }}
                    >
                        <Text
                            style={[{
                                paddingHorizontal: 18,
                                height: textInputHeight, fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: !this.state.location ? Theme.color.placeholder : 'rgba(255, 255, 255, 0.8)'
                            },
                            Platform.OS === 'ios' && {
                                paddingTop: 4
                            }]}
                        >{this.state.location ? this.state.location : "What city do you live in?"}</Text>
                    </TouchableOpacity>
                    <View style={{ alignSelf: 'center', borderBottomColor: 'transparent', borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.locationY = y;
                        }}
                    />
                    {
                        this.state.showLocationAlertIcon &&
                        <AntDesign style={{ position: 'absolute', right: 16, top: this.locationY - 30 }} name='exclamation' color="rgba(255, 184, 24, 0.8)" size={24} />
                    }
                </View>

                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small }} />







                <Text style={{
                    fontSize: 14, fontFamily: "SFProText-Regular", color: Theme.color.placeholder,
                    textAlign: 'center', lineHeight: 26,
                    marginTop: Theme.spacing.large,
                    marginBottom: Theme.spacing.small
                }}>{"Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you"}</Text>







                <TouchableOpacity
                    // style={[styles.contactButton, { marginTop: Theme.spacing.small * 2, marginBottom: Theme.spacing.small * 2 }]}
                    style={[styles.contactButton, { marginBottom: Theme.spacing.small * 2 }]}
                    onPress={async () => await this.post()}
                >
                    <Text style={{ fontSize: 16, fontFamily: "SFProText-Semibold", color: 'rgba(255, 255, 255, 0.8)', paddingTop: Cons.submitButtonPaddingTop() }}>{'Post'}</Text>
                </TouchableOpacity>
                {
                    /*
                    this.state.showPaddingView &&
                    <View style={{ height: Dimensions.get('window').height / 3 * 2 }}
                        onLayout={(e) => {
                            const { y } = e.nativeEvent.layout;
                            this.paddingViewY = y;

                            console.log('this.paddingViewY', this.paddingViewY);

                            // ToDo: move scroll here
                            // this.refs.flatList.scrollToOffset({ offset: this.inputViewY + this.locationY + 1, animated: true });
                        }}
                    />
                    */
                }
            </View>
        );
    }

    renderImage(number, uri) {
        if (!uri) {
            return (
                <View style={{ width: imageWidth, height: imageHeight }}>
                    <View style={{ width: '100%', height: '100%', borderRadius: 2, borderColor: 'darkgrey', borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'dimgrey' }} />

                    {/* number */}
                    <Text style={{ fontFamily: "SFProText-Semibold", fontSize: 18, color: 'white', position: 'absolute', top: 2, left: 8 }}>{number}</Text>

                    {/* icon */}
                    <TouchableOpacity
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFB5C2', position: 'absolute', bottom: -14, right: -14, justifyContent: "center", alignItems: "center" }}
                        onPress={() => {
                            this.uploadPicture(number - 1);
                        }}
                    >
                        <Ionicons name='ios-add' color='white' size={24} />
                    </TouchableOpacity>
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
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'white', position: 'absolute', bottom: -14, right: -14, justifyContent: "center", alignItems: "center" }}
                    onPress={() => {
                        this.uploadPicture(number - 1);
                    }}
                >
                    <Ionicons name='md-create' color='#FFB5C2' size={18} />
                </TouchableOpacity>
            </View>
        );
    }

    //// upload image
    uploadPicture(index) {
        this.pickImage(index);
    }

    async pickImage(index) {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync:', result);

            if (!result.cancelled) {
                this.setState({ uploadingImage: true });

                // show indicator
                this.setState({ showIndicator: true });

                // ToDo: show progress bar


                // upload image
                // var that = this;
                this.uploadImage(result.uri, index, (uri) => {
                    switch (index) {
                        case 0: this.setState({ uploadImage1Uri: uri }); break;
                        case 1: this.setState({ uploadImage2Uri: uri }); break;
                        case 2: this.setState({ uploadImage3Uri: uri }); break;
                        case 3: this.setState({ uploadImage4Uri: uri }); break;
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
                });


                /*
                const fileName = result.uri.split('/').pop();
                const url = await firebase.storage().ref(fileName).getDownloadURL();
                console.log('download URL:', url);
                */



                // hide indicator
                this.setState({ showIndicator: false });

                this.setState({ uploadingImage: false });

            } // press OK
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
        formData.append("image", {
            uri,
            name: fileName,
            type: type
        });
        formData.append("userUid", Firebase.user().uid);
        // formData.append("feedId", Firebase.user().uid);
        formData.append("pictureIndex", index);

        try {
            let response = await fetch("https://us-central1-rowena-88cfd.cloudfunctions.net/uploadFile/images",
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
        }
    }

    //// database
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

        // ToDo: use image picker
        const image1Uri = 'https://i.ytimg.com/vi/FLm-oBqOM24/maxresdefault.jpg';
        const image2Uri = 'https://pbs.twimg.com/media/DiABjHdXUAEHCdN.jpg';
        const image3Uri = 'https://i.ytimg.com/vi/jn2XzSxv4sU/maxresdefault.jpg';
        const image4Uri = 'https://t1.daumcdn.net/cfile/tistory/994E373C5BF1FD440A';

        const name = 'name';
        const age = 20;
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
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);

        Vars.userFeedsChanged = true;
    }

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

    showDateTimePicker(title) {
        if (this._showNotification) {
            this.hideNotification();
            this.hideAlertIcon();
            this._showNotification = false;
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
        if (!this._showNotification) {
            this._showNotification = true;

            this.setState({ notification: msg },
                () => {
                    this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                        this.state.offset.setValue(height * -1);

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
                }
            );

            StatusBar.setHidden(true);
        }
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

        if (this.state.showLocationAlertIcon) this.setState({ showLocationAlertIcon: false });

        if (this.state.showPicturesAlertIcon) this.setState({ showPicturesAlertIcon: false });
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
        paddingBottom: 4
    },
    contactButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)",
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
        bottom: 4,
        // alignSelf: 'baseline'
    },
    textInputStyleIOS: {
        paddingHorizontal: 18,
        fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
        minHeight: 52
    },
    textInputStyleAndroid: {
        paddingHorizontal: 18,
        fontSize: textInputFontSize, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
        height: 84,
        textAlignVertical: 'top'
    }
});
