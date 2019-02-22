import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, BackHandler } from 'react-native';
import { Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';


export default class EditMain extends React.Component {
    state = {
        showIndicator: false,
        showAlert: false,


        uploadingImage: false,
        uploadImage1: 'http://imgnews.naver.net/image/001/2017/05/20/PYH2017052019870001300_P2_20170520101607447.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'
    };

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
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
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
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
                        case 0: this.setState({ uploadImage1: uri }); break;
                        case 1: this.setState({ uploadImage2: uri }); break;
                        case 2: this.setState({ uploadImage3: uri }); break;
                        case 3: this.setState({ uploadImage4: uri }); break;
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
        width: parseInt(Dimensions.get('window').width) / 2,
        height: (parseInt(Dimensions.get('window').width) / 2) / 5 * 3,
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
