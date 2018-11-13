import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
import * as firebase from 'firebase';
import { StyleGuide } from "./components/theme";
import Image from "./components/Image";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


export default class Detail extends React.Component {
    state = {
        showIndicator: false,

        uploadingImage: false,
        uploadingImageUri: null
    };

    getImageType(ext) {
        switch (ext.toLowerCase()) {
            case 'gif':
                return 'image/gif';

            case 'png':
                return 'image/png';

            case 'jpg':
                return 'image/jpg';

            case 'jpeg':
                return 'image/jpeg';

            case 'bmp':
                return 'image/bmp';

            default:
                return '';
        }
    }

    isImage(ext) {
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'png':
                //etc
                return true;
        }

        return false;
    }

    async pickImage() {
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
                this.uploadImage(result.uri);

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

    /*
    async uploadImage(uri, imageName) {
        const response = await fetch(uri);

        if (response.ok) {
            const blob = await response.blob();

            let ref = firebase.storage().ref().child('images/' + imageName);

            const snapshot = ref.put(blob)
                .then(() => { console.log('uploadImage success.'); alert('Your photo has successfully uploaded.'); })
                .catch((error) => { console.log('error:', error); alert('Please try again.'); });

            const uploadedImage = snapshot.downloadURL;
            this.setState({ uploadingImageUri: uploadedImage });

        } else {
            alert('Please try again.');
        }
    }
    */
    async uploadImage(uri) {
        const fileName = uri.split('/').pop();
        var ext = fileName.split('.').pop();

        if (!this.isImage(ext)) {
            alert('invalid image file!');
            return;
        }

        var type = this.getImageType(ext);
        // console.log('file type:', type);

        const formData = new FormData();
        formData.append("image", {
            // uri: uri,
            uri,
            name: fileName,
            type: type
        });

        const res = await fetch("https://us-central1-rowena-88cfd.cloudfunctions.net/api/images", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data"
            },
            body: formData
        });

        console.log('response', res);
        // console.log('response.json', res.json()); // resJson.location
    }

    render() {
        const { navigation } = this.props;
        const { user } = navigation.state.params; // ToDo

        /*
        uid: string,
        name: string,
        country: string,
        city: string,
        picture: Picture,
        location: Location,
        about: string,
        receivedReviews: string[],
        postedReviews: string[]
        */

        const onScroll = Animated.event(
            [{
                nativeEvent: {
                    contentOffset: {
                        y: new Animated.Value(0)
                    }
                }
            }],
            {useNativeDriver: true }
        );

        // const { goBack } = this.props.navigation;

        const showIndicator = this.state.showIndicator;
        const uploadingImageUri = this.state.uploadingImageUri; // ToDo: render

        return (
            <View style={styles.flex}>

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={showIndicator}
                    size="large"
                    color='white'
                />

                <View style={styles.searchBarStyle}>

                    <TouchableOpacity
                        style={{ marginTop: Constants.statusBarHeight + 30 + 2, marginLeft: 22, alignSelf: 'baseline' }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                </View>

                <AnimatedFlatList
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <Animated.View style={{ backgroundColor: '#000000' }}>

                            {/* key, uri, preview, style */}
                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <Image
                                style={styles.ad}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <View style={styles.header}>
                                <Text type="title3" style={styles.headerText}>{'title1'}</Text>
                            </View>

                            <TouchableOpacity onPress={() => this.pickImage()} style={styles.signUpButton} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Pick me</Text>
                            </TouchableOpacity>


                        </Animated.View>
                    )}
                    scrollEventThrottle={1}
                    columnWrapperStyle={undefined}
                    // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                    {...{ onScroll }}
                />

            </View>

        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'rgb(26, 26, 26)'
    },
    searchBarStyle: {
        height: 80,
        backgroundColor: 'rgb(0, 0, 255)', // test
        paddingBottom: 16,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    container: {
        flexGrow: 1,
        paddingBottom: StyleGuide.spacing.small,
        backgroundColor: 'rgb(26, 26, 26)'
    },
    ad: {
        width: Dimensions.get('window').width - 2,
        height: (Dimensions.get('window').width - 2) / 21 * 9,
        marginBottom: StyleGuide.spacing.small
    },
    header: {
        padding: StyleGuide.spacing.tiny
    },
    headerText: {
        color: StyleGuide.palette.white
    },


    signUpButton: {
        //position: 'absolute',
        //bottom: 30,

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
