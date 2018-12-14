import React from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity, TextInput, KeyboardAvoidingView } from 'react-native';
import { Constants } from 'expo';
// import { Header } from 'react-navigation';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Theme } from './rnff/src/components';
import { AirbnbRating } from './react-native-ratings/src';
import autobind from "autobind-decorator";


export default class ReviewScreen extends React.Component {
    state = {
        rating: 5,
        invalid: true,
        signUpButtomTextColor: 'rgba(255,255,255,0.3)'
    };

    componentDidMount() {
        const { post, profile, rating } = this.props.navigation.state.params;

        // console.log('rating', rating);
        this.setState({ rating });
        this.refs.rating.setPosition(rating); // bug in AirbnbRating

        let that = this;
        setTimeout(function () {
            that.refs['comment'].focus();
        }, 1500); // 1.5 sec
    }

    @autobind
    ratingCompleted(rating) {
        // console.log("Rating is: " + rating);
        this.setState({ rating });
    }

    post() {
        // ToDo
        this.addReview();
    }

    render() {
        const { post, profile } = this.props.navigation.state.params;


        return (
            <View style={styles.flex}>
                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            this.props.navigation.state.params.onGoBack();
                            this.props.navigation.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* ToDo: get geolocation of my location */}
                    <Text style={styles.distance}>put text here..</Text>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4 + 1, // paddingBottom from searchBarStyle
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                    // onPress={() => this.post()}
                    >
                        <Text style={styles.post}>Post</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoContainer}>
                    {/*
                    <Text style={styles.review}>Share your experience to help others</Text>
                    */}
                    <View style={{ marginBottom: 10 }}>
                        <AirbnbRating
                            ref='rating'
                            onFinishRating={this.ratingCompleted}
                            showRating={false}
                            count={5}
                            defaultRating={this.state.rating}
                            size={32}
                            margin={3}
                        />
                    </View>

                    {/*
                    <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%' }} />
                    */}

                    <TextInput
                        // autoFocus
                        ref='comment'
                        multiline={true}
                        numberOfLines={4}
                        style={{
                            padding: 12, borderRadius: 5,
                            width: '100%', fontSize: 16, fontFamily: "SFProText-Regular",
                            color: "white", textAlign: 'justify', textAlignVertical: 'top', backgroundColor: '#212121'
                        }}
                        placeholder='Share details of your own experience'
                        placeholderTextColor='rgb(160, 160, 160)'
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                    />
                </View>


                <KeyboardAvoidingView style={{ position: 'absolute', bottom: 10, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => this.post()} style={styles.signUpButton} disabled={this.state.invalid} >
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: this.state.signUpButtomTextColor }}>Post</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        );
    }





    /*** Database ***/

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

    // from Profile.js
    async addReview() {
        // test
        let placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E'; // 호치민
        let feedId = 'b0247934-f097-2094-dbfc-3a63da957de7'; // 제니

        let userUid = Firebase.auth.currentUser.uid; // 리뷰를 쓴 사람 (이러면 자추인데..)
        let comment = 'best girl ever!';
        let rating = 5;

        await Firebase.addReview(placeId, feedId, userUid, comment, rating);
    };

}

const styles = StyleSheet.create({
    /*
	container: {
		flex: 1,
		backgroundColor: '#fff',
		// alignItems: 'center',
		justifyContent: 'center',
    }
    */

    flex: {
        flex: 1,
        backgroundColor: 'black'
    },
    searchBarStyle: {
        /*
        position: 'absolute',
        top: 0,
        left: 0,
        // zIndex: 10000,
        */
        width: '100%',
        height: Constants.statusBarHeight + 8 + 34 + 8
    },
    distance: {
        position: 'absolute',
        bottom: 8 + 4 + 3, // paddingBottom from searchBarStyle
        alignSelf: 'center',
        fontSize: 16,
        fontFamily: "SFProText-Semibold",
        color: "rgba(255, 255, 255, 0.8)"
    },
    post: {
        alignSelf: 'center',
        fontSize: 18,
        fontFamily: "SFProText-Semibold",
        color: "rgba(255, 255, 255, 0.8)"
    },
    infoContainer: {
        // flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        // padding: Theme.spacing.small,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
        // backgroundColor: 'rgb(27,27,27)'
        // backgroundColor: 'red'
    },
    review: {
        color: 'grey',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 16,
        fontFamily: "SFProText-Regular",
        paddingTop: 10,
        paddingBottom: 10
    },
    signUpButton: {
        // marginTop: 40,
        // position: 'absolute',
        // bottom: 10,
        width: '85%',
        height: 45,
        // alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)", // "transparent"
        borderRadius: 5,
        // borderColor: "transparent",
        // borderWidth: 0
        justifyContent: 'center',
        alignItems: 'center',
    },





});

