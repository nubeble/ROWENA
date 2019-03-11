import React from 'react';
import {
    StyleSheet, TouchableOpacity, View, Text, BackHandler, Dimensions, Image, TextInput,
    Platform, Picker
    // DatePickerAndroid, DatePickerIOS
} from 'react-native';
import { Permissions, Linking, ImagePicker } from 'expo';
import { Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
import Util from './Util';
import autobind from 'autobind-decorator';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';

const imageViewWidth = Dimensions.get('window').width / 2;
const imageViewHeight = imageViewWidth / 4 * 3;

const imageWidth = imageViewWidth * 0.8;
const imageHeight = imageViewHeight * 0.8;


export default class AdvertisementMain extends React.Component {
    state = {
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


    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('AdvertisementMain.handleHardwareBackPress');
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

    onFocusHeight() {
        // clear
        this.setState({ height: '' });
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
        // clear
        this.setState({ weight: '' });
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

    render() {
        return (
            <View style={styles.flex}>
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
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>
                <KeyboardAwareScrollView style={{ flex: 1 }}>

                    {/* image editor view */}
                    <Text style={{ paddingHorizontal: 4, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                        PICTURES
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
                    <View style={{ paddingHorizontal: 4 }}>
                        {/* 1. name */}
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            NAME
                        </Text>
                        <TextInput
                            style={{
                                paddingHorizontal: 18,
                                height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)'
                            }}
                            // keyboardType={'email-address'}
                            // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                            onChangeText={(text) => this.validateName(text)}
                            selectionColor={Theme.color.selection}
                            keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                            autoCapitalize="words"
                            placeholder='Selena Gomez'
                            placeholderTextColor='rgb(160, 160, 160)'
                            value={this.state.name}
                        />
                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />

                        {/* 2. birthday */}
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            BIRTHDAY
                        </Text>
                        {/* picker */}
                        <TouchableOpacity
                            onPress={() => this.showDateTimePicker('What is your date of birth?')}
                        >
                            {/*
                            <View style={{ width: '40%', height: 38, marginLeft: 9 + 10, paddingLeft: 10, borderColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderRadius: 2, justifyContent: 'center', alignItems: 'flex-start' }}>
                                {
                                    !this.state.birthday ?
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>{'DD  MM  YYYY'}</Text>
                                        :
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold" }}>{this.state.birthday}</Text>
                                }
                                <View
                                    style={{ position: 'absolute', right: 4, top: (38 - 24) / 2, width: 24, height: 24, justifyContent: "flex-start", alignItems: "center" }}
                                >
                                    <Ionicons name='md-calendar' color="rgba(255, 255, 255, 0.8)" size={18} />
                                </View>
                            </View>
                            */}
                            <Text
                                style={[{
                                    paddingHorizontal: 18,
                                    height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: !this.state.birthday ? 'rgb(160, 160, 160)' : 'rgba(255, 255, 255, 0.8)'
                                },
                                Platform.OS === 'ios' && {
                                    paddingTop: 4
                                }
                                ]}
                            >{this.state.birthday ? this.state.birthday : 'Select a date'}</Text>
                        </TouchableOpacity>
                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />

                        {/* 3. height */}
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            HEIGHT
                        </Text>
                        <TextInput
                            style={{
                                paddingHorizontal: 18,
                                height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                                width: '50%'
                            }}
                            keyboardType={'phone-pad'}
                            // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                            onFocus={(e) => this.onFocusHeight()}
                            onBlur={(e) => this.onBlurHeight()}
                            onChangeText={(text) => this.validateHeight(text)}
                            selectionColor={Theme.color.selection}
                            keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                            autoCapitalize="none"
                            placeholder='164 cm'
                            placeholderTextColor='rgb(160, 160, 160)'
                            value={this.state.height}
                        />
                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />

                        {/* 4. weight */}
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            WEIGHT
                        </Text>
                        <TextInput
                            style={{
                                paddingHorizontal: 18,
                                height: 38, fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)',
                                width: '50%'
                            }}
                            keyboardType={'phone-pad'}
                            onFocus={(e) => this.onFocusWeight()}
                            onBlur={(e) => this.onBlurWeight()}
                            onChangeText={(text) => this.validateWeight(text)}
                            selectionColor={Theme.color.selection}
                            keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                            autoCapitalize="none"
                            placeholder='45 kg'
                            placeholderTextColor='rgb(160, 160, 160)'
                            value={this.state.weight}
                        />
                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />

                        {/* 5. breasts */}
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            BREASTS
                        </Text>
                        {/* ToDo: picker - A, B, C, D, E, F */}
                        <Picker
                            mode='dropdown'
                            selectedValue={this.state.breasts}
                            style={{ height: 38, width: '50%', backgroundColor: 'green' }}
                            onValueChange={(itemValue, itemIndex) => this.setState({ breasts: itemValue })}>
                            <Picker.Item label="Select your bra size" value="" />
                            <Picker.Item label="A" value="A" />
                            <Picker.Item label="B" value="B" />
                            <Picker.Item label="C" value="C" />
                            <Picker.Item label="D" value="D" />
                            <Picker.Item label="E" value="E" />
                            <Picker.Item label="F" value="F" />
                        </Picker>
                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />






                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            LOCATION
                        </Text>

                        {/* ToDo: open search screen */}

                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />

                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontFamily: "SFProText-Semibold", paddingLeft: 18 }}>
                            NOTE
                        </Text>
                        <TextInput
                            style={{
                                paddingLeft: 20,
                                paddingRight: 20,
                                paddingTop: 20,
                                paddingBottom: 20,
                                backgroundColor: 'blue',
                                height: 100,
                                fontSize: 22, fontFamily: "SFProText-Regular", color: 'rgba(255, 255, 255, 0.8)'
                            }}
                            // keyboardType={'email-address'}
                            // onSubmitEditing={(event) => this.moveToPassword(event.nativeEvent.text)}
                            // onChangeText={(text) => this.validateEmail(text)}
                            selectionColor={Theme.color.selection}
                            keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                            autoCapitalize="none"
                        />

                        <View style={{ alignSelf: 'center', borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '90%', marginBottom: Theme.spacing.small }} />
                    </View>















                    <View style={{ marginTop: 200 }}>
                        <TouchableOpacity
                            onPress={() => this.makeDummyData()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>☆ Make Dummy Data ★</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.makeBangkok()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Bangkok)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.makePattaya()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Pattaya)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.makeManila()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Manila)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.makeMacao()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Macao)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={async () => await this.removeFeed()}
                            style={styles.bottomButton}
                        >
                            <Text style={{ fontSize: 16, color: 'white' }}>Remove Feed</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAwareScrollView>


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



                // close indicator
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

            // ToDo: error handling
        }
    }

    //// DB
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
            // ToDo
        }

        Vars.userFeedsChanged = true;
    }

    async makeDummyData() {
        for (var i = 0; i < 10; i++) {
            // 1. 태국
            this.makeBangkok(); // 방콕
            this.makePattaya(); // 파타야

            // 2. 베트남
            this.makeHCM(); // 호치민
            this.makeHanoi(); // 하노이

            // 3. 필리핀
            this.makeManila();
            this.makeCebu();

            // 4. 라오스
            this.makeVientiane();

            // 5. 캄보디아
            this.makePP();

            // 6. 마카오 (Macao, Macau)
            this.makeMacao();

            // 7. 인도네시아
            this.makeJakarta();

            // 8. 말레이시아
            this.makeKL();
        }

        /*
        // 1. Bangkok, Thailand
        for (var i = 0; i < 10; i++) await this.makeBKK();

        // 2. Ho Chi Minh, Vietnam
        for (var i = 0; i < 10; i++) await this.makeHCM();

        // 3. Manila
        for (var i = 0; i < 10; i++) await this.makeManila();

        // 4. Vientiane
        for (var i = 0; i < 10; i++) await this.makeVientiane();

        // 5. Phnom Penh
        for (var i = 0; i < 10; i++) await this.makePP();

        // 6. Jakarta
        for (var i = 0; i < 10; i++) await this.makeJakarta();
        */
    }

    getRandomImage(number) { // 0 ~ 5
        let images = []; // random item

        let uri1, uri2, uri3, uri4;

        switch (number) {
            case 0: {
                // --
                uri1 = 'https://pds.joins.com/news/component/htmlphoto_mmdata/201705/20/htm_2017052043510989199.jpeg';
                uri2 = 'https://i.pinimg.com/originals/a2/10/18/a210180e93b5e277050c3384b9dad462.jpg';
                uri3 = 'https://i.pinimg.com/originals/95/8a/f8/958af83d9cd2eb5a079cc652cffb3b4f.jpg';
                uri4 = 'https://upload.wikimedia.org/wikipedia/commons/0/04/%28%EC%98%88%EA%B3%A0%29_CNTV_%EC%97%AD%EC%A0%81_-_%EC%9C%A4%EA%B7%A0%EC%83%81%2C_%EC%B1%84%EC%88%98%EB%B9%88_%EC%B1%84%EC%88%98%EB%B9%88_24s.jpg';
                // --
            } break;

            case 1: {
                uri1 = 'https://post-phinf.pstatic.net/MjAxNzA4MzFfMTI5/MDAxNTA0MTYwODU4MzQ3.HxB3nEhj4uv-3XWu2Z2zAr4iSPas3aOokdPh1AgY5F4g.egcEId7lF7bFsE5s14XRTNnVGiqxUOYL4SJ4-7p95kQg.JPEG/AOA_%EC%84%A4%ED%98%84_%EB%8D%B0%EC%8B%B1%EB%94%94%EB%B0%94_%282%29.jpg?type=w1200';
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/263CCB345769E5A308';
                uri3 = 'https://img.huffingtonpost.com/asset/5aaf1a5b1e000057107af0b7.jpeg?cache=HNh7gSVWkr&ops=scalefit_630_noupscale';
                uri4 = 'https://i.pinimg.com/originals/a0/2e/ec/a02eecdae0e3fb79dcbf762cddaa952b.jpg';
            } break;

            case 2: {
                uri1 = 'https://i1.daumcdn.net/thumb/R750x0/?fname=http%3A%2F%2Fcfile27.uf.tistory.com%2Fimage%2F99115C3359D104EA04DB67';
                uri2 = 'https://i.ytimg.com/vi/dW0mXvpPRJ8/maxresdefault.jpg';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/27735B3959071E4A04';
                uri4 = 'https://pbs.twimg.com/profile_images/744128499904978944/eIN4yA3y_400x400.jpg';
            } break;

            case 3: {
                uri1 = 'https://i0.hdslb.com/bfs/archive/14e43191ca970b80912c58acf9987f0b8eadb80e.jpg';
                uri2 = 'https://i.ytimg.com/vi/aApMHbQR_OI/hqdefault.jpg?v=58dddaf4';
                uri3 = 'https://pbs.twimg.com/media/DA4zuBYUAAEfNMG.jpg';
                uri4 = 'https://i1.wp.com/overdope.com/wp-content/uploads/2017/01/2017-01-21_220645.jpg?fit=690%2C460';
            } break;

            case 4: {
                uri1 = 'https://pkpkgirls.files.wordpress.com/2018/08/38751740_651875865193841_3072906610452987904_o.jpg';
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/241FE94E58F9E0911C';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/2379514F58F806902F';
                uri4 = 'https://img1.daumcdn.net/thumb/R1920x0/?fname=http%3A%2F%2Fcfile21.uf.tistory.com%2Fimage%2F9969BD415C472ACB1DF0F5';
            } break;

            case 5: {
                uri1 = 'https://t1.daumcdn.net/news/201808/09/10asia/20180809101854646ppyw.jpg';
                uri2 = 'https://t1.daumcdn.net/news/201808/16/moneytoday/20180816131509218odci.jpg';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/99B9D8375A9E4FE30B';
                uri4 = 'https://t1.daumcdn.net/cfile/tistory/991B0F4F5BCEC5FC19';
            } break;
        }

        let image1Uri = null;
        let image2Uri = null;
        let image3Uri = null;
        let image4Uri = null;

        let num = parseInt(Math.random() * 10 % 4); // 0 ~ 3
        switch (num) {
            case 0: {
                image1Uri = uri1;
                image2Uri = uri2;
                image3Uri = uri3;
                image4Uri = uri4;
            } break;

            case 1: {
                image4Uri = uri1;
                image1Uri = uri2;
                image2Uri = uri3;
                image3Uri = uri4;
            } break;

            case 2: {
                image3Uri = uri1;
                image4Uri = uri2;
                image1Uri = uri3;
                image2Uri = uri4;
            } break;

            case 3: {
                image2Uri = uri1;
                image3Uri = uri2;
                image4Uri = uri3;
                image1Uri = uri4;
            } break;
        }

        images[0] = image1Uri;
        images[1] = image2Uri;
        images[2] = image3Uri;
        images[3] = image4Uri;

        return images;
    }

    async makeBangkok() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const placeName = 'Bangkok, Thailand';

        // ToDo: get it from google location api
        const location = {
            description: 'Soi Sukhumvit 19, Khlong Toei Nuea, Watthana, Bangkok, Thailand',
            longitude: 100.5017651,
            latitude: 13.7563309
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makePattaya() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ49cxTZKVAjER_xC9qQHzf6k';
        const placeName = 'Pattaya, Thailand';

        // ToDo: get it from google location api
        const location = {
            description: '파타야',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeHCM() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const placeName = 'Ho Chi Minh, Vietnam';

        // ToDo: get it from google location api
        const location = {
            description: '호치민',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kim Seol-hyun';
        const age = 24;
        const height = 167;
        const weight = 49;
        const bust = 'B+';

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

    async makeHanoi() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJKQqAE44ANTERDbkQYkF-mAI';
        const placeName = 'Hanoi, Vietnam';

        // ToDo: get it from google location api
        const location = {
            description: '하노이',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kim Seol-hyun';
        const age = 24;
        const height = 167;
        const weight = 49;
        const bust = 'B+';

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

    async makeManila() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk';
        const placeName = 'Manila, Philippines';

        // ToDo: get it from google location api
        const location = {
            description: '마닐라',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeCebu() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ_S3NjSWZqTMRBzXT2wwDNEw';
        const placeName = 'Cebu, Philippines';

        // ToDo: get it from google location api
        const location = {
            description: '세부',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeVientiane() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJIXvtBoZoJDER3-7BGIaxkx8';
        const placeName = 'Vientiane, Laos';

        // ToDo: get it from google location api
        const location = {
            description: '비엔티안',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Angelina Danilova';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makePP() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ42tqxz1RCTERuyW1WugOAZw';
        const placeName = 'Phnom Penh, Cambodia';

        // ToDo: get it from google location api
        const location = {
            description: '프놈펜',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeMacao() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJmY8AduF6ATQRrXXv59PpHbk';
        const placeName = 'Macao, Macau';

        // ToDo: get it from google location api
        const location = {
            description: '마카오',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeJakarta() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJnUvjRenzaS4RoobX2g-_cVM';
        const placeName = 'Jakarta, Indonesia';

        // ToDo: get it from google location api
        const location = {
            description: '자카르타',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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

    async makeKL() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ5-rvAcdJzDERfSgcL1uO2fQ';
        const placeName = 'Kuala Lumpur, Malaysia';

        // ToDo: get it from google location api
        const location = {
            description: '쿠알라룸푸르',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

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




    /*
    async openCalendar() {
        try {
            const { action, year, month, day } = await DatePickerAndroid.open({
                date: new Date(1990, 1, 1)
            });

            if (action !== DatePickerAndroid.dismissedAction) {
                // Selected year, month (0-11), day
                // this.setState({ day, month, year });

                let _day = '';
                if (day < 10) {
                    _day = '0' + day;
                } else {
                    _day = day.toString();
                }

                let _month = '';
                switch (month) {
                    case 1: _month = 'JAN'; break;
                    case 2: _month = 'FEB'; break;
                    case 3: _month = 'MAR'; break;
                    case 4: _month = 'APR'; break;
                    case 5: _month = 'MAY'; break;
                    case 6: _month = 'JUN'; break;
                    case 7: _month = 'JUL'; break;
                    case 8: _month = 'AUG'; break;
                    case 9: _month = 'SEP'; break;
                    case 10: _month = 'OCT'; break;
                    case 11: _month = 'NOV'; break;
                    case 12: _month = 'DEC'; break;
                }

                let _year = year.toString();

                const birthday = _month + '  ' + _day + '  ' + _year;
                this.setState({ birthday });
            }

        } catch ({ code, message }) {
            console.warn('Cannot open date picker', message);
        }
    }

    onDateChange(date) {
        console.log('date', date);
        this.setState({ birthday: date });
    }
    */

    showDateTimePicker(title) {
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
        justifyContent: 'flex-end'
    },

    bottomButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0,

        marginTop: 10,
        marginBottom: 10
    },


});
