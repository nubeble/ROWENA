import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
import * as firebase from 'firebase';
import Firebase from "./Firebase"
import { StyleGuide } from "./rne/src/components/theme";
import Image from "./rne/src/components/Image";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


export default class Detail extends React.Component {
    state = {
        showIndicator: false,

        uploadingImage: false,
        uploadImage1: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage5: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage6: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'
    };

    componentDidMount() {
        // test
        // this.watchUsers();
    }

    getImageType(ext) {
        switch (ext.toLowerCase()) {
            case 'gif':
                return 'image/gif';

            case 'png':
                return 'image/png';

            case 'jpg':
                // return 'image/jpg';
                return 'image/jpeg';

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
                var that = this;
                this.uploadImage(result.uri, index, (uri) => {
                    switch (index) {
                        case 0: that.setState({uploadImage1: uri}); break;
                        case 1: that.setState({uploadImage2: uri}); break;
                        case 2: that.setState({uploadImage3: uri}); break;
                        case 3: that.setState({uploadImage4: uri}); break;
                        case 4: that.setState({uploadImage5: uri}); break;
                        case 5: that.setState({uploadImage6: uri}); break;
                    }

                    // save to database
                    /*
                    var data = {
                        pictures: {
                            uri: uri
                        }
                    };

                    this.updateUser(Firebase.auth.currentUser.uid, data);
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
    async uploadImage(uri, index, cb) {
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
        formData.append("userUid", Firebase.auth.currentUser.uid);
        formData.append("pictureIndex", index);

        try {
            let response = await fetch("https://us-central1-rowena-88cfd.cloudfunctions.net/api/images",
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
            console.log('responseJson', responseJson);

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

            // ToDo: messagebox (please try again)
        }
    }

    uploadPicture(index) {
        this.pickImage(index);
    }



    /*** Database ***/

    // read - done
    getUser(userUid, watching) {
        /*
        // get the entire collection
        Firebase.firestore.collection("users").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log('getUser', `${doc.id} => ${doc.data()}`);
            });
        });
        */

        /*
        Firebase.firestore.collection('users').doc('x3qSq5PuBio0RodFVgTU'). ().then((doc) => {
            if (doc.exists) {
                console.log('getUser', doc.data());
            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
        */

        var query = Firebase.firestore.collection('users');
        query = query.where('uid', '==', userUid);
        // query = query.orderBy('averageRating', 'desc');

        if (watching) {
            query.onSnapshot((snapshot) => {
                if (!snapshot.size) {
                    console.log("No such a user!");
                } else {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            // console.log(change.doc.data());
                            var data = JSON.parse(JSON.stringify(change.doc.data()));
                            console.log(data);

                            // this.setState({user: data});
                        }
                    });
                }
            });
        } else {
            query.get().then((snapshot) => {
                if (!snapshot.size) {
                    console.log("No such a user!");
                } else {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            // console.log(change.doc.data());
                            var data = JSON.parse(JSON.stringify(change.doc.data()));
                            console.log(data);

                            // this.setState({user: data});
                        }
                    });
                }
            });
        }
    }

    getUsers() {
        var query = Firebase.firestore.collection('users').orderBy('averageRating', 'desc').limit(50);
        query.get().then((snapshot) => {
            if (!snapshot.size) {
                console.log("No such users!");
            } else {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        // console.log(change.doc.data());
                        var data = JSON.parse(JSON.stringify(change.doc.data()));
                        console.log(data);

                        // this.setState({users: data});
                    }
                });
            }
        });
    }

    // update - done
    updateUser(userUid, value) {
        if (!value) return;

        /*
        var value = {
            city: "Suwon",
            about: firebase.firestore.FieldValue.delete()
        };
        */

        var query = Firebase.firestore.collection('users');
        query = query.where('uid', '==', userUid);
        query.get().then((querySnapshot) => {
            if (!querySnapshot.size) {
                console.log("No such a user!");
            } else {
                querySnapshot.forEach((queryDocumentSnapshot) => {
                    console.log(queryDocumentSnapshot.id, queryDocumentSnapshot.data());

                    // or set()
                    Firebase.firestore.collection('users').doc(queryDocumentSnapshot.id).update(value);
                });
            }
        });
    }

    // add - done
    addUser(userUid) {
        var user = {
            uid: userUid,
            name: "Rachel",
            country: "Thailand",
            city: "Bangkok",
            pictures: { // 6
                one: {
                    // preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
                    preview: '',
                    uri: 'https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a'
                },
                two: {
                    preview: '',
                    uri: ''
                },
                three: {
                    preview: '',
                    uri: ''
                },
                four: {
                    preview: '',
                    uri: ''
                },
                five: {
                    preview: '',
                    uri: ''
                },
                six: {
                    preview: '',
                    uri: ''
                }
            },
            location: {
                longitude: 100.46775760000003, // 경도
                latitude: 13.7659225 // 위도
            },
            about: "let's make love",
            receivedReviews: [ // review UID List (나한테 달린 리뷰)
            ],
            // 총 리뷰 갯수 - receivedReviews.length

            // 평균 평점 - 리뷰가 추가될 때마다 다시 계산해서 업데이트
            averageRating: 2.7,
            postedReviews: [ // review UID List (내가 작성한 리뷰)
            ]
        };

        Firebase.firestore.collection("users").add(user).then((docRef) => {
            console.log('Add User succeeded. Document written with ID:', docRef.id);
        }).catch(function (error) {
            console.error('Add User failed. Error adding document:', error);
        });
    }

    // remove - done
    removeUser(userUid) {
        var query = Firebase.firestore.collection('users');
        query = query.where('uid', '==', userUid);
        query.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                doc.ref.delete().then(() => {
                    console.log("Document successfully deleted!");
                }).catch((error) => {
                    console.error("Error removing document", error);
                });
            });
        }).catch((error) => {
            console.log("Error getting documents", error);
        });
    }

    // ToDo
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
        const uploadImage1 = this.state.uploadImage1;
        const uploadImage2 = this.state.uploadImage2;
        const uploadImage3 = this.state.uploadImage3;
        const uploadImage4 = this.state.uploadImage4;
        const uploadImage5 = this.state.uploadImage5;
        const uploadImage6 = this.state.uploadImage6;


        return (
            <View style={styles.flex} >

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

                            <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                                {/* key, uri, preview, style */}
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.uploadPicture(1)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage2}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.uploadPicture(2)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage3}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.uploadPicture(3)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage4}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.uploadPicture(4)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage5}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.uploadPicture(5)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage6}
                                />
                            </TouchableOpacity>


                            {/*
                            <View style={styles.header}>
                                <Text type="title3" style={styles.headerText}>{'title1'}</Text>
                            </View>
                            */}


                            <TouchableOpacity onPress={() => this.updateUser(Firebase.auth.currentUser.uid, null)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>updateUser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.removeUser(Firebase.auth.currentUser.uid)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>removeUser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.getUsers()} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>getUsers</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.getUser(Firebase.auth.currentUser.uid, false)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>getUser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.addUser(Firebase.auth.currentUser.uid)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>addUser</Text>
                            </TouchableOpacity>




                            {/*
                            <TouchableOpacity onPress={() => this.pickImage()} style={styles.signUpButton} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Pick me</Text>
                            </TouchableOpacity>
                            */}


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
        // backgroundColor: 'rgb(0, 0, 255)', // test
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
