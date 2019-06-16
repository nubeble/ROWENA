import React from 'react';
import {
    StyleSheet, Dimensions, View, TouchableOpacity, TouchableWithoutFeedback, TextInput, Keyboard,
    KeyboardAvoidingView, Animated, StatusBar, BackHandler, ActivityIndicator
} from 'react-native';
import { Constants } from 'expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Theme } from './rnff/src/components';
import { AirbnbRating } from './react-native-ratings/src';
import autobind from "autobind-decorator";
import Firebase from "./Firebase";
import Toast, { DURATION } from 'react-native-easy-toast';
import { Cons } from "./Globals";
import { sendPushNotification } from './PushNotifications';


export default class WriteReviewScreen extends React.Component {
    state = {
        showPostLoader: false,

        rating: 5,
        invalid: false, // Consider: not used
        bottomPosition: Dimensions.get('window').height,
        postButtonTop: Dimensions.get('window').height - 60 - Cons.buttonHeight, // 60: gap

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1)
    };

    componentDidMount() {
        const { post, rating } = this.props.navigation.state.params;

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.setState({ rating });
        this.refs.rating.setPosition(rating); // bug in AirbnbRating

        // Consider: move to onFocus
        setTimeout(() => {
            !this.closed && this.refs['comment'] && this.refs['comment'].focus();
        }, Cons.buttonTimeoutLong);
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        // this.refs.rating.stopAnimation();

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.state.params.initFromWriteReview(false);
        this.props.navigation.goBack();

        return true;
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

        const bottomPosition = Dimensions.get('window').height - e.endCoordinates.height;
        const postButtonTop = bottomPosition - 10 - Cons.buttonHeight; // 10: gap

        !this.closed && this.setState({ bottomPosition: bottomPosition, postButtonTop: postButtonTop });
    }

    @autobind
    _keyboardDidHide() {
        const bottomPosition = Dimensions.get('window').height;
        const postButtonTop = bottomPosition - 60 - Cons.buttonHeight; // 60: gap

        !this.closed && this.setState({ bottomPosition: bottomPosition, postButtonTop: postButtonTop });
    }

    @autobind
    ratingCompleted(rating) {
        this.setState({ rating });
    }

    async post() {
        let comment = this.refs['comment']._lastNativeText;
        if (comment === undefined || comment === '') {
            this.showNotification('Please enter a valid comment.');

            return;
        }

        const { post } = this.props.navigation.state.params;
        if (Firebase.user().uid === post.uid) {
            this.refs["toast"].show('Sorry, You can not write a self-recommendation.', 500, () => {
                if (!this.closed) {
                    // this.refs.rating.stopAnimation();

                    this.props.navigation.state.params.initFromWriteReview(false);
                    this.props.navigation.goBack();
                }
            });

            return;
        }

        this.setState({ showPostLoader: true });

        const result = await Firebase.addReview(post.uid, post.placeId, post.id, Firebase.user().uid, comment, this.state.rating, post.pictures.one.uri);
        if (!result) {
            // the post is removed
            this.refs["toast"].show('The post has been removed by its owner.', 500, () => {
                if (!this.closed) {
                    // this.refs.rating.stopAnimation();

                    this.props.navigation.state.params.initFromWriteReview(false);
                    this.props.navigation.goBack();
                }
            });
        } else {
            this.sendPushNotification(comment);

            this.refs["toast"].show('Your review has been submitted!', 500, () => {
                if (!this.closed) {
                    // this.refs.rating.stopAnimation();

                    this.props.navigation.state.params.initFromWriteReview(true);
                    this.props.navigation.goBack();
                }
            });
        }

        this.setState({ showPostLoader: false });
    }

    sendPushNotification(message) {
        const { post } = this.props.navigation.state.params;

        const sender = Firebase.user().uid;
        const senderName = Firebase.user().name;
        const receiver = post.uid; // owner

        const data = {
            message: message,
            placeId: post.placeId,
            feedId: post.id
        };

        sendPushNotification(sender, senderName, receiver, Cons.pushNotification.review, data);
    }

    render() {
        const { post } = this.props.navigation.state.params;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
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
                        onPress={() => {
                            if (this._showNotification) {
                                this.hideNotification();
                            }
                        }}
                    >
                        <Ionicons name='md-close' color="black" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.searchBar}>
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
                            // this.refs.rating.stopAnimation();

                            if (this._showNotification) {
                                this.hideNotification();
                            }

                            this.props.navigation.state.params.initFromWriteReview(false);
                            this.props.navigation.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={styles.searchBarTitle}>{post.name}</Text>

                    {/*
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4 + 1, // paddingBottom from searchBar
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={async () => await this.post()}
                    >
                        <Text style={styles.post}>Post</Text>
                    </TouchableOpacity>
                    */}
                </View>

                <View style={styles.infoContainer}>
                    <TouchableWithoutFeedback
                        onPress={() => {
                            // console.log('TouchableWithoutFeedback onPress');
                            // hide keyboard
                            this.refs['comment'].blur();
                        }}
                    >
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
                            fontSize: 16, fontFamily: "Roboto-Regular",
                            color: "white", textAlign: 'justify',
                            textAlignVertical: 'top',
                            backgroundColor: '#212121'
                        }}
                        placeholder='Share details of your own experience'
                        placeholderTextColor={Theme.color.placeholder}
                        onChangeText={(text) => this.onChangeText(text)}
                        selectionColor={Theme.color.selection}
                        // keyboardAppearance={'dark'}
                        underlineColorAndroid="transparent"
                        autoCorrect={false}
                    />
                </View>

                <View style={{ position: 'absolute', top: this.state.postButtonTop, width: '100%', height: Cons.buttonHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={async () => await this.post()} style={styles.signUpButton} disabled={this.state.invalid}>
                        <Text style={{ fontSize: 16, fontFamily: "Roboto-Medium", color: Theme.color.buttonText }}>Post</Text>
                        {
                            this.state.showPostLoader &&
                            <ActivityIndicator
                                style={{ position: 'absolute', top: 0, bottom: 0, right: 20, zIndex: 1000 }}
                                animating={true}
                                size="small"
                                color={Theme.color.buttonText}
                            />
                        }
                    </TouchableOpacity>
                </View>

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

    showNotification(msg) {
        if (this._showNotification) this.hideNotification();

        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(this.state.opacity, {
                            toValue: 1,
                            duration: 200
                        }),
                        Animated.timing(this.state.offset, {
                            toValue: Constants.statusBarHeight + 6,
                            duration: 200
                        })
                    ])
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(this.state.opacity, {
                        toValue: 0,
                        duration: 200
                    }),
                    Animated.timing(this.state.offset, {
                        toValue: height * -1,
                        duration: 200
                    })
                ])
            ]).start();
        });

        this._showNotification = false;
    }

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }





    /*** Database ***/

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
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    searchBarTitle: {
        fontSize: 18,
        fontFamily: "Roboto-Medium",
        color: 'rgba(255, 255, 255, 0.8)',
        paddingBottom: 8
    },
    notification: {
        // width: '100%',
        width: '94%',
        alignSelf: 'center',

        height: (8 + 34 + 8) - 12,
        borderRadius: 5,
        position: "absolute",
        top: 0,
        backgroundColor: Theme.color.notification,
        zIndex: 10000,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    notificationText: {
        width: Dimensions.get('window').width - (12 + 24) * 2, // 12: margin right, 24: button width
        fontSize: 15,
        lineHeight: 17,
        fontFamily: "Roboto-Medium",
        color: "black",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    post: {
        alignSelf: 'center',
        fontSize: 18,
        fontFamily: "Roboto-Medium",
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
        fontFamily: "Roboto-Light",
        paddingTop: 10,
        paddingBottom: 10
    },
    signUpButton: {
        width: '85%',
        height: Cons.buttonHeight,
        backgroundColor: Theme.color.buttonBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
