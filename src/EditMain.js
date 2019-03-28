// ToDo: add notification, flash

import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, BackHandler, Animated } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker, Constants } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


export default class EditMain extends React.Component {
    state = {
        onUploadingImage: false,
        uploadingImageNumber: 0, // 1,2,3,4

        uploadImage1Uri: null,
        uploadImage2Uri: null,
        uploadImage3Uri: null,
        uploadImage4Uri: null,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value((Constants.statusBarHeight + 10) * -1),

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        flashOffset: new Animated.Value(Cons.searchBarHeight * -1),



    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('EditMain.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        // ToDo: remove server files

        this.hardwareBackPressListener.remove();

        this.closed = true;
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
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.container}>
                    <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                        <SmartImage
                            style={styles.ad}
                            uri={'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => console.log('onPress')}>
                        <SmartImage
                            style={styles.ad}
                            uri={'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => console.log('onPress')}>
                        <SmartImage
                            style={styles.ad}
                            uri={'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => console.log('onPress')}>
                        <SmartImage
                            style={styles.ad}
                            uri={'https://image.fmkorea.com/files/attach/new/20181018/3655109/1279820040/1330243115/88e28dc9c5ec7b43e428a0569f365429.jpg'}
                        />
                    </TouchableOpacity>

                </View>

                {/*
                <View style={styles.header}><Text>header</Text></View>
                <View style={styles.title}><Text>title</Text></View>
                <View style={styles.content}><Text>content</Text></View>
                <View style={styles.footer}><Text>footer</Text></View>
                */}
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
        formData.append("type", "profile"); // ToDo: check the type ('post', 'profile')

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
        }
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
        backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        // marginTop: 50,
        paddingTop: 50,
        // backgroundColor: 'black',
        backgroundColor: 'green',
        // flexDirection: 'column',
        // alignItems: 'stretch',
        // justifyContent: 'center'
    },
    ad: {
        width: (Dimensions.get('window').width) / 2,
        height: (Dimensions.get('window').width) / 2 / 5 * 3,
        marginTop: Theme.spacing.tiny,
        marginBottom: Theme.spacing.tiny
    },

    header: {
        width: '100%',
        height: '10%',
        backgroundColor: '#ff9a9a',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        width: '100%',
        height: '20%',
        backgroundColor: '#9aa9ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        backgroundColor: '#d6ca1a',

        justifyContent: 'center',
        alignItems: 'center',
        // alignItems: 'stretch',
        // padding: 10
    },
    footer: {
        width: '100%',
        height: '10%',
        backgroundColor: '#1ad657',
        justifyContent: 'center',
        alignItems: 'center'
    },

});
