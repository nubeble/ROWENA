import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, ImagePicker, Linking } from "expo";
import { StyleGuide } from "./rne/src/components/theme";
// import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase"
import Util from "./Util"

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


@inject("feedStore", "profileStore") @observer
export default class Profile extends React.Component {
    state = {
        showIndicator: false
    };

    componentDidMount() {
        console.log('Profile::componentDidMount');

        // const { profile } = this.props.navigation.state.params;
        console.log('profile', this.props.profileStore);

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
    }

    render() {
        const showIndicator = this.state.showIndicator;


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
                        style={{ marginTop: Constants.statusBarHeight + Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        // onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                </View>

                <FlatList
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <View style={{ backgroundColor: '#000000' }}>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log(onPress)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>


                            <TouchableOpacity onPress={() => this.addFeed()}
                                style={[styles.bottomButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>ADD DOC(PLACE/BKK/FEED/...)</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    // scrollEventThrottle={1}
                    // columnWrapperStyle={undefined}
                    // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                />

            </View>

        );
    } // end of render()

    addFeed() {
        // let placeId = null; // ToDo: use google Places API
        // let image1Uri; // ToDo: use image picker

        this.createFeed(Firebase.auth.currentUser.uid, null, null, null, null, null, null);
    }

    
    createFeed(userUid, placeId, image1Uri, image2Uri, image3Uri, image4Uri, note) {
        // test
        userUid = 'DMKMeSouZ6RLEZNJR1snJLLpe3f1'; // (facebook login)
        placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        note = 'note';

        // feed: user id, place id, feed id, pictures, note, reviews [review id], averageRating,
        // review: user id, review id, rating, date, content


        // 1. upload images simultaneously & get download uri
        // image1Uri, ...


        const id = Util.uid(); // create uuid

        var feed = {
            uid: userUid, // owner
            placeId: placeId,
            location: {
                description: null, // "Cebu, Philippines"
                longitude: 0.0,
                latitude: 0.0
            },
            id: id, // feed id
            pictures: { // 4
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
                }
            },
            note: note,

            // comments: 0,
            averageRating: 0.0,
            reviews: [],

            timestamp: Date.now() // 1543145425396
        };

        return Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(id).set(feed);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'rgb(40, 40, 40)'
    },
    searchBarStyle: {
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
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },

    bottomButton: {
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

});
