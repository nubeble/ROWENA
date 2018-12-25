import React from 'react';
import {
    StyleSheet, Dimensions, View, TouchableOpacity, TouchableWithoutFeedback, TextInput, Keyboard,
    KeyboardAvoidingView, Animated, StatusBar
} from 'react-native';
import { Constants } from 'expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Theme } from './rnff/src/components';
import { AirbnbRating } from './react-native-ratings/src';
import autobind from "autobind-decorator";
import Firebase from "./Firebase";
import Toast, { DURATION } from 'react-native-easy-toast';


export default class WriteReviewScreen extends React.Component {
    state = {
        rating: 5,
        invalid: false,
        signUpButtomTextColor: 'rgba(255, 255, 255, 0.8)',
        bottomLocation: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0)
    };

    componentDidMount() {
        const { post, profile, rating } = this.props.navigation.state.params;

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

        this.setState({ rating });
        this.refs.rating.setPosition(rating); // bug in AirbnbRating

        if (!this.isClosed) {
            let that = this;
            setTimeout(function () {
                !that.isClosed && that.refs['comment'] && that.refs['comment'].focus();
            }, 1500); // 1.5 sec
        }
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        this.isClosed = true;
    }

    @autobind
    _keyboardDidShow(e) {
        /*
        this.props.navigation.setParams({
            keyboardHeight: e.endCoordinates.height,
            normalHeight: Dimensions.get('window').height, 
            shortHeight: Dimensions.get('window').height - e.endCoordinates.height, 
        }); 
        */

        this.setState({ bottomLocation: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide() {
        this.setState({ bottomLocation: Dimensions.get('window').height });
    }

    @autobind
    ratingCompleted(rating) {
        this.setState({ rating });
    }

    post() {
        let comment = this.refs['comment']._lastNativeText;
        if (comment === undefined || comment === '') {
            this.showNotification('Please enter a valid comment.');

            return;
        }

        const { post, profile, rating } = this.props.navigation.state.params;
        if (post.uid === Firebase.auth.currentUser.uid) {

            this.refs.toast.show('Sorry, You can not write a self-recommendation.', 500, () => {
                if (!this.isClosed) {
                    this.props.navigation.state.params.onGoBack(false);
                    this.props.navigation.goBack();
                }
            });

            return;
        }

        this.addReview(comment);

        this.refs.toast.show('Your review has been submitted!', 500, () => {
            if (!this.isClosed) {
                this.props.navigation.state.params.onGoBack(true);
                this.props.navigation.goBack();
            }
        });
    }

    render() {
        const { post, profile } = this.props.navigation.state.params;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [
                {
                    translateY: this.state.offset
                }
            ]
        };


        return (
            <View style={styles.flex}>
                <Animated.View
                    style={[styles.notification, notificationStyle]}
                    ref={notification => this._notification = notification}
                >
                    <Text style={styles.notificationText}>{this.state.notification}</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => this.hideNotification()}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => {
                            this.props.navigation.state.params.onGoBack(false);
                            this.props.navigation.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/* ToDo: get geolocation of my location */}
                    <Text style={styles.distance}>{post.name}</Text>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4 + 1, // paddingBottom from searchBarStyle
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.post()}
                    >
                        <Text style={styles.post}>Post</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoContainer}>
                    <TouchableWithoutFeedback
                        onPress={() => {
                            // console.log('TouchableWithoutFeedback onPress');
                            // hide keyboard
                            this.refs['comment'].blur();
                        }}
                    >
                        {/*
                        <Text style={styles.review}>Share your experience to help others</Text>
                        */}
                        <View style={{ marginBottom: 10 + 16 }}>
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
                    </TouchableWithoutFeedback>

                    <TextInput
                        // autoFocus
                        ref='comment'
                        multiline={true}
                        numberOfLines={4}
                        style={{
                            // padding: 12, // not working in ios
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingLeft: 12,
                            paddingRight: 12,

                            borderRadius: 5,
                            width: '100%',
                            height: Dimensions.get('window').height / 5,
                            fontSize: 16, fontFamily: "SFProText-Regular",
                            color: "white", textAlign: 'justify', textAlignVertical: 'top', backgroundColor: '#212121'
                        }}
                        placeholder='Share details of your own experience'
                        placeholderTextColor='rgb(160, 160, 160)'
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                        keyboardAppearance={'dark'} // Todo: what about android??
                        onChangeText={(text) => this.onChangeText(text)}
                    />
                </View>

                <KeyboardAvoidingView style={{ position: 'absolute', top: this.state.bottomLocation - 10 - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%' }}>
                    <TouchableOpacity onPress={() => this.post()} style={styles.signUpButton} disabled={this.state.invalid} >
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: this.state.signUpButtomTextColor }}>Post</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                /*
                style={{backgroundColor:'red'}}
                textStyle={{color:'red'}}
                fadeInDuration={750}
                fadeOutDuration={1000}
                */
                />
            </View>
        );
    }

    showNotification = (msg) => {
        if (!this._showNotification) {
            this._showNotification = true;

            this.setState({ notification: msg },
                () => {
                    this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                        this.state.offset.setValue(height * -1);

                        Animated.sequence([
                            Animated.parallel([
                                Animated.timing(this.state.opacity, {
                                    toValue: 1,
                                    duration: 200,
                                }),
                                Animated.timing(this.state.offset, {
                                    toValue: 0,
                                    duration: 200,
                                }),
                            ])
                        ]).start();
                    });
                }
            );

            StatusBar.setHidden(true);
        }
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200,
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200,
                    })
                ])
            ]).start();
        });

        StatusBar.setHidden(false);

        this._showNotification = false;
    }

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
        }
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

    async addReview(comment) {
        const { post, profile } = this.props.navigation.state.params;

        // test
        // let placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E'; // 호치민
        let placeId = post.placeId;
        // let feedId = 'b0247934-f097-2094-dbfc-3a63da957de7'; // 제니
        let feedId = post.id;

        let userUid = Firebase.auth.currentUser.uid; // 리뷰를 쓴 사람
        console.log('user uid', userUid);

        let rating = this.state.rating;
        console.log('rating', rating);

        await Firebase.addReview(placeId, feedId, userUid, comment, rating);
    };

}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    notification: {
        position: "absolute",
        width: '100%',
        height: Constants.statusBarHeight + 10,
        top: 0,
        backgroundColor: "rgba(255, 184, 24, 0.8)",
        zIndex: 10000,

        flexDirection: 'column',
        // justifyContent: 'center'
        justifyContent: 'flex-end'
    },
    notificationText: {
        position: 'absolute',
        // bottom: 0,
        alignSelf: 'center',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        color: "#FFF"
    },
    notificationButton: {
        position: 'absolute',
        right: 18,
        // bottom: 0,
        // alignSelf: 'baseline'
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
        paddingRight: Theme.spacing.small

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
        width: '85%',
        height: 45,
        // alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
