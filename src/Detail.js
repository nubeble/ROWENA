import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
// import * as firebase from 'firebase';
import Firebase from "./Firebase"
import { StyleGuide } from "./rne/src/components/theme";
import Image from "./rne/src/components/Image";

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




    addUser() {
        Firebase.firestore.collection("users").add({
            uid: "2935293529352935",
            name: "Jay",
            country: "Korea",
            city: "Seoul",
            picture: {
                preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
                uri: "https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a"
            },
            location: {
                longitude: 35.0092433,
                latitude: 135.7587373
            },
            about: "from Korea",
            receivedReviews: [ // review UID List (나한테 달린 리뷰)
                "1234123412341234", "5678567856785678"
            ],
            // 총 리뷰 갯수 - receivedReviews.length

            // 평균 평점 - 리뷰가 추가될 때마다 다시 계산해서 업데이트
            averageRating: 2.7,
            postedReviews: [ // review UID List (내가 작성한 리뷰)
                "4321432143214321", "8765876587658765"
            ]
        }).then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        }).catch(function (error) {
            console.error("Error adding document: ", error);
        });
    }

    watchUsers() {
        Firebase.firestore.collection("users").onSnapshot((snapshot) => {
            // const list = [];
            // snapshot.docChanges().forEach((change) => {
            snapshot.forEach((doc) => {
                /*
                list.push({
                });

                this.setState({
                    users: list;
                });
                */

                console.log('watchUsers', doc);
            });
        });
    }

    getUser(userUid) {
        var result = Firebase.firestore.collection('users').doc(userUid).get();
        console.log('getUser', result);
    }

    getUsers() { // ToDo: async?? how to render?? - state var
        var query = Firebase.firestore.collection('users').orderBy('averageRating', 'desc').limit(50);
        // this.getDocumentsInQuery(query, render);
        query.onSnapshot((snapshot) => {
            if (snapshot.size) {

                // snapshot.forEach((doc) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.setState({
                            // users: change.doc
                        });

                        console.log('getUsers(added)', change.doc);
                    }
                });
            }
        });
    }

    /*
    addReview(userUid, review) {
        var userDoc = Firebase.firestore.collection('users').doc(userUid);
        var newReviewDoc = userDoc.collection('receivedReviews').doc();

        return Firebase.firestore.runTransaction((transaction) => {
            return transaction.get(userDoc).then((doc) => {
                var data = doc.data();

                var newAverage = (data.numRatings * data.avgRating + rating.rating) / (data.numRatings + 1);

                transaction.update(userDoc, {
                    numRatings: data.numRatings + 1,
                    avgRating: newAverage
                });

                return transaction.set(newReviewDoc, rating);
            });
        });
    }
    */







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
            { useNativeDriver: true }
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
