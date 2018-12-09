import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Dimensions,
    FlatList, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
// import * as firebase from 'firebase';
// import Firebase from "./Firebase"
// import { StyleGuide } from "./rne/src/components/theme";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util"
import Swiper from './Swiper'


export default class Detail extends React.Component {
    state = {
        showIndicator: false,

    };

    componentDidMount() {
        console.log('Detail::componentDidMount');

        const { post, profile } = this.props.navigation.state.params;
        console.log('post', post);
        console.log('profile', profile);
    }

    render() {
        const { navigation } = this.props;


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
                        <Animated.View style={{ backgroundColor: 'rgb(40, 40, 40)' }}>
                            {/* profile pictures */}
                            {this.renderSwiper(this.props.navigation.state.params.post)}

                            <View style={styles.descriptionContainer}>
                                <Text style={styles.descriptionTitle}>{'The Siam'}</Text>

                                {/* rating * review */}
                            </View>

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

    renderSwiper(post) {
        let pictures = [];

        let value = post.pictures.one.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`one`}>
                    <TouchableWithoutFeedback onPress={() => { // ToDo: remove!
                        console.log('move to Intro');
                        // this.moveToIntro();
                    }}>
                        <SmartImage
                            style={styles.item}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableWithoutFeedback>
                </View>
            );
        }

        value = post.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <TouchableWithoutFeedback onPress={() => {
                        console.log('move to Intro');
                        // this.moveToIntro();
                    }}>
                        <SmartImage
                            style={styles.item}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableWithoutFeedback>
                </View>
            );
        }

        value = post.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <TouchableWithoutFeedback onPress={() => {
                        console.log('move to Intro');
                        // this.moveToIntro();
                    }}>
                        <SmartImage
                            style={styles.item}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableWithoutFeedback>
                </View>
            );
        }

        value = post.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <TouchableWithoutFeedback onPress={() => {
                        console.log('move to Intro');
                        // this.moveToIntro();
                    }}>
                        <SmartImage
                            style={styles.item}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={value}
                        />
                    </TouchableWithoutFeedback>
                </View>
            );
        }

        return (
            <Swiper
                style={styles.wrapper}
                containerStyle={{ marginBottom: 20 }}
                width={Dimensions.get('window').width}
                // height={Dimensions.get('window').width / 16 * 9}
                height={Dimensions.get('window').width}
                loop={false}
                autoplay={false}
                autoplayTimeout={3}
                paginationStyle={{ bottom: 4 }}
            >
                {pictures}
            </Swiper>
        );
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
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'rgb(40, 40, 40)'
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

    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold'
    },
    item: {
        // flex: 1,
        width: Dimensions.get('window').width,
        // height: Dimensions.get('window').width / 16 * 9,
        height: Dimensions.get('window').width
    },


    descriptionContainer: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        padding: Theme.spacing.small,

        backgroundColor: 'blue'
    },
    descriptionTitle: {
        color: 'white',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },



});
