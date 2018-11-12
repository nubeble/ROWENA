import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
import * as firebase from 'firebase';


export default class Detail extends React.Component {

    state = {
        showIndicator: false,

        uploadingImage: false,
        uploadingImageUri: null
    };

    async pickImage() {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync: ', result);

            if (!result.cancelled) {
                this.setState({ uploadingImage: true });

                // show indicator
                this.setState({ showIndicator: true });

                // ToDo: show progress bar


                try {

                    // ImagePicker saves the taken photo to disk and returns a local URI to it
                    let localUri = result.uri;
                    let filename = localUri.split('/').pop();

                    // Infer the type of the image
                    let match = /\.(\w+)$/.exec(filename);
                    let type = match ? `image/${match[1]}` : `image`;

                    // Upload the image using the fetch and FormData APIs
                    let formData = new FormData();
                    // Assume "photo" is the name of the form field the server expects
                    formData.append('photo', { uri: localUri, name: filename, type });

                    let response = await fetch(YOUR_SERVER_URL, {
                        method: 'POST',
                        body: formData,
                        header: {
                            'content-type': 'multipart/form-data',
                        },
                    });

                    console.log('response.json(): ', response.json());
                } catch (e) {
                    alert('Upload Image failed, sorry :(');
                    console.log(e);
                } finally {
                    // close indicator
                    this.setState({ showIndicator: false });

                    this.setState({ uploadingImage: false });
                }
                
            } // press OK
        } else {
            Linking.openURL('app-settings:');
        }
    }

    /*
    async uploadImage(uri, imageName) {
        const response = await fetch(uri);

        if (response.ok) {
            const blob = await response.blob();

            let ref = firebase.storage().ref().child('images/' + imageName);

            const snapshot = ref.put(blob)
                .then(() => { console.log('uploadImage success.'); alert('Your photo has successfully uploaded.'); })
                .catch((error) => { console.log('error: ', error); alert('Please try again.'); });

            const uploadedImage = snapshot.downloadURL;
            this.setState({ uploadingImageUri: uploadedImage });

        } else {
            alert('Please try again.');
        }
    }
    */
    uploadImage(uri, imageName, mime = 'application/octet-stream') {
        return new Promise((resolve, reject) => {
            const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri; // ToDo: check!
            let uploadBlob = null;

            // const imageRef = FirebaseClient.storage().ref('images').child('image_001');
            let imageRef = firebase.storage().ref().child('images/' + imageName);

            fs.readFile(uploadUri, 'base64')
                .then((data) => {
                    return Blob.build(data, { type: `${mime};BASE64` });
                })
                .then((blob) => {
                    uploadBlob = blob;
                    return imageRef.put(blob, { contentType: mime });
                })
                .then(() => {
                    uploadBlob.close();
                    return imageRef.getDownloadURL();
                })
                .then((url) => {
                    resolve(url);
                })
                .catch((error) => {
                    reject(error);
                })
        })
    }










    render() {
        const { navigation } = this.props;

        const { params } = navigation.state.params; // ToDo
        const { goBack } = this.props.navigation;

        const showIndicator = this.state.showIndicator;
        const uploadingImageUri = this.state.uploadingImageUri; // ToDo: render

        return (
            <View style={styles.container}>

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={showIndicator}
                    size="large"
                    // color='rgba(255, 184, 24, 0.8)'
                    color='rgba(255, 255, 255, 0.8)'
                />

                <TouchableOpacity
                    style={{ marginTop: Constants.statusBarHeight + 30 + 2, marginLeft: 20, alignSelf: 'baseline' }}
                    onPress={() => this.props.navigation.goBack()}
                >
                    <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.pickImage()} style={styles.signUpButton} >
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Pick me</Text>
                </TouchableOpacity>
            </View>

        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgb(26, 26, 26)'
    },
    signUpButton: {
        position: 'absolute',
        bottom: 30,

        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },

});
