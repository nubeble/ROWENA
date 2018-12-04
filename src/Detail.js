import React from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions,
    FlatList, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
// import * as firebase from 'firebase';
// import Firebase from "./Firebase"
import { StyleGuide } from "./rne/src/components/theme";
import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util"




// import Carousel from 'react-native-looped-carousel';
import Carousel from './Carousel';
// const { width, height } = Dimensions.get('window');



export default class Detail extends React.Component {
    state = {
        showIndicator: false,

        uploadingImage: false,
        uploadImage1: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage5: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage6: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',




        // size: { width, height },


    };

    componentDidMount() {
        console.log('Detail::componentDidMount');

        // const { post, profile } = this.props.navigation.state.params;
        // console.log('post', post);
        // console.log('profile', profile);

        // const { feed, user } = this.props.navigation.state.params;

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
                        case 4: this.setState({ uploadImage5: uri }); break;
                        case 5: this.setState({ uploadImage6: uri }); break;
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

        if (!Util.isImage(ext)) {
            alert('invalid image file!');
            return;
        }

        var type = Util.getImageType(ext);
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

            // ToDo: error handling - messagebox (please try again)
        }
    }

    uploadPicture(index) {
        this.pickImage(index);
    }



    /*** Database ***/
    /*
    getUser(userUid, watching) {
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
    */

    // let users = await getUsers();
    getUsers() {
        return new Promise((resolve, reject) => {
            let users = {};

            // Firebase.firestore.collection('users').orderBy('averageRating', 'desc').limit(50).get()
            Firebase.firestore.collection("users").get().then((snapshot) => {
                snapshot.forEach((doc) => {
                    console.log(doc.id, '=>', doc.data());
                    users[doc.id] = doc.data();
                });

                resolve(users);
            }).catch((err) => {
                console.log('Error getting documents', err);

                reject(err);
            });
        });
    }

    addFeed(userUid) {
        const id = Util.uid(); // create uuid

        var feed = {
            id: id,
            comments: 0,
            likes: [], // user id ("DpwskQXesHVOlNzFU6IzAvzUQhJ3")
            picture: {
                preview: null,
                uri: null
            },
            text: "text",
            timestamp: 1542408591,
            // uid: userUid
            uid: "DMKMeSouZ6RLEZNJR1snJLLpe3f1"
        };

        return Firebase.firestore.collection("feed").doc(id).set(feed);
    }

    // await addUser
    addUser(userUid) {
        var user = {
            uid: userUid,
            name: "Rachel",
            country: "Korea",
            city: "Seoul",
            email: '',
            phoneNumber: '',
            /*
            pictures: [
                {
                    preview: '',
                    uri: 'https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a'
                }
            ],
            */
            pictures: { // 6
                one: {
                    preview: null,
                    uri: null
                },
                two: {
                    preview: null,
                    uri: null
                },
                three: {
                    preview: null,
                    uri: null
                },
                four: {
                    preview: null,
                    uri: null
                },
                five: {
                    preview: null,
                    uri: null
                },
                six: {
                    preview: null,
                    uri: null
                }
            },
            location: {
                longitude: 100.46775760000003, // 경도
                latitude: 13.7659225 // 위도
            },
            about: "from Korea",
            receivedReviews: [], // 총 리뷰 갯수 - receivedReviews.length
            averageRating: 2.7,
            postedReviews: []
        };

        return Firebase.firestore.collection("users").doc(uid).set(user);

        /*
        Firebase.firestore.collection("users").add(user).then((docRef) => {
            console.log('Add User succeeded. Document written with ID:', docRef.id);
        }).catch(function (error) {
            console.error('Add User failed. Error adding document:', error);
        });
        */
    }

    // await removeUser
    removeUser(userUid) {
        /*
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
        */
        return Firebase.firestore.collection("users").doc(userUid).delete();
    }

    // ToDo: check this
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
        // const { user } = navigation.state.params; // ToDo

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
                    animating={this.state.showIndicator}
                    size="large"
                    color='white'
                />

                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
                        style={{ marginTop: Constants.statusBarHeight + Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <Animated.View style={{ backgroundColor: '#000000' }}>



                            {/*
                            <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                            </TouchableOpacity>
                            */}




                            <View style={{ flex: 1 }}>
                                <Carousel
                                    style={styles.carousel}
                                    autoplay={true}
                                    delay={2000}
                                    pageInfo={true}
                                    onAnimateNextPage={(p) => {
                                        // console.log(p);
                                    }}
                                >
                                    <TouchableWithoutFeedback onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                        />
                                    </TouchableWithoutFeedback>
                                    <TouchableWithoutFeedback onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile10.uf.tistory.com%2Fimage%2F2535634A58D7CE280462A4'}
                                        />
                                    </TouchableWithoutFeedback>
                                    <TouchableWithoutFeedback onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://cdn.clien.net/web/api/file/F01/5277958/e16aaf1ee2f745acb1d.PNG?w=780&h=30000'}
                                        />
                                    </TouchableWithoutFeedback>
                                    <TouchableWithoutFeedback onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://appzzang.me/data/editor/1811/a3c7092c8861bae6e83dec4217493a19_1542390647_7622.jpg'}
                                        />
                                    </TouchableWithoutFeedback>
                                    <TouchableWithoutFeedback onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://scontent-frx5-1.cdninstagram.com/vp/d1db3afc164d1ca671eeb1a8e2c4ded5/5C82F8D0/t51.2885-15/e35/43063022_181319842784322_7879118230333023640_n.jpg?se=8&ig_cache_key=MTg4NDk1MzA4NDIzMzQxOTYyMA%3D%3D.2'}
                                        />
                                    </TouchableWithoutFeedback>
                                </Carousel>
                            </View>

                            <ScrollView horizontal={true} contentContainerStyle={{ flex: 0 }}>
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                                <Image
                                    style={styles.ad}
                                    uri={uploadImage1}
                                />
                            </ScrollView>

                            {/*
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
                            */}


                            {/*
                            <View style={styles.header}>
                                <Text type="title3" style={styles.headerText}>{'title1'}</Text>
                            </View>
                            */}

                            <TouchableOpacity onPress={() => this.addFeed(Firebase.auth.currentUser.uid)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>addFeed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.removeUser(Firebase.auth.currentUser.uid)} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>removeUser</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.getUsers()} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>getUsers</Text>
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
                // scrollEventThrottle={1}
                // columnWrapperStyle={undefined}
                // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                // {...{ onScroll }}
                />

            </View>

        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'rgb(40, 40, 40)'
    },
    searchBarStyle: {
        // height: Header.HEIGHT + 30,
        height: Constants.statusBarHeight + Header.HEIGHT,
        paddingBottom: 14 + 2,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    container: {
        flexGrow: 1,
        paddingBottom: StyleGuide.spacing.small,
        backgroundColor: 'rgb(40, 40, 40)'
    },
    ad: {
        width: parseInt(Dimensions.get('window').width) - 2,
        height: (parseInt(Dimensions.get('window').width) - 2) / 21 * 9,
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

    carousel: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width / 16 * 9,
        marginBottom: StyleGuide.spacing.large
    },
    item: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width / 16 * 9,
    },








});
