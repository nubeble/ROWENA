import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import {
    StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList,
    ActivityIndicator, TouchableOpacity, Keyboard, TextInput
} from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants } from "expo";
import { Text, Theme, Avatar } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
// import ReadMore from "./ReadMore";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';

const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew that you were there for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";


export default class ReadReviewScreen extends React.Component {
    replyViewHeight = Dimensions.get('window').height / 9;

    state = {
        renderReview: false,
        isLoadingReview: false,
        reviewLength: 0,
        isOwner: false,
        showKeyboard: false,
        bottomLocation: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(0)
    };

    constructor(props) {
        super(props);

        this.itemRefs = {};
        this.itemHeights = [];
    }

    componentDidMount() {
        console.log('ReadReviewScreen::componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.keyboardDidWillListener = Keyboard.addListener('keyboardWillHide', this._keyboardWillHide);
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardWillShow);

        const { reviewStore, isOwner } = this.props.navigation.state.params;
        // console.log('reviews', reviewStore.reviews);

        this.setState({ isOwner });

        // reviewStore.checkForNewEntries(); // do not use here!

        reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        setTimeout(() => {
            !this.isClosed && this.setState({ renderReview: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished(result) {
        console.log('onAddToReviewFinished', result);

        if (!result) {
            this.allReviewsLoaded = true; // don't call loadReview() again!
        }

        !this.isClosed && this.setState({ isLoadingReview: false });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.keyboardDidWillListener.remove();
        this.keyboardWillShowListener.remove();

        this.isClosed = true;
    }

    moveToDetail() {
        this.props.screenProps.rootNavigation.navigate('detail');
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        const { navigation } = this.props;

        // const reviews = reviewStore.reviews;
        const { reviews } = reviewStore;

        const loading = reviews === undefined;

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
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    !this.state.renderReview ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            color='grey'
                        />
                        :
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            data={reviews}
                            keyExtractor={this.keyExtractor}
                            renderItem={this.renderItem}
                            onEndReachedThreshold={0.5}
                            onEndReached={this.loadMore}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator

                            ListEmptyComponent={(
                                <View style={{ paddingHorizontal: Theme.spacing.small }}>
                                    {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                                </View>
                            )}
                            ListFooterComponent={(
                                this.state.isLoadingReview && (
                                    <ActivityIndicator
                                        style={styles.bottomIndicator}
                                        animating={this.state.isLoadingReview}
                                        size="small"
                                        color='grey'
                                    />
                                )
                            )}

                            ItemSeparatorComponent={this.itemSeparatorComponent}
                        />
                }

                {
                    this.state.showKeyboard && (
                        <View style={{
                            position: 'absolute',
                            top: this.state.bottomLocation - this.replyViewHeight,
                            height: this.replyViewHeight,
                            width: '100%',
                            flexDirection: 'row',

                            flex: 1,

                            paddingTop: 10,
                            paddingBottom: 6,
                            paddingLeft: 10,
                            paddingRight: 0,

                            borderTopWidth: 1,
                            borderTopColor: Theme.color.line,
                            backgroundColor: Theme.color.background
                        }}>

                            <TextInput
                                // ref='reply'
                                ref={(c) => { this._reply = c; }}
                                multiline={true}
                                numberOfLines={3}
                                style={{
                                    /*
                                    width: '80%',
                                    // width: Dimensions.get('window').width * 0.5,
                                    height: '90%',
                                    */
                                    flex: 0.85,

                                    // padding: 12, // not working in ios
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    paddingLeft: 10,
                                    paddingRight: 10,

                                    borderRadius: 5,
                                    fontSize: 14,
                                    fontFamily: "SFProText-Regular",
                                    color: "white", textAlign: 'justify', textAlignVertical: 'top',
                                    backgroundColor: '#212121',

                                }}
                                placeholder='Reply to a review...'
                                placeholderTextColor='rgb(160, 160, 160)'
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                                keyboardAppearance={'dark'} // Todo: what about android??
                                onChangeText={(text) => this.onChangeText(text)}
                            />
                            <TouchableOpacity style={{
                                // marginLeft: 10,
                                // width: Dimensions.get('window').width * 0.2,
                                /*
                                width: '10%',
                                height: '90%',
                                */
                                flex: 0.15,
                                // borderRadius: 5,
                                // backgroundColor: 'red',

                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                                onPress={() => this.sendReply()}
                            >
                                <Ionicons name='ios-send' color="rgb(62, 165, 255)" size={24} />
                            </TouchableOpacity>

                        </View>
                    )
                }

                <Toast
                    ref="toast"
                    position='center'
                />
            </View >
        );
    } // end of render()

    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item, index }: FlatListItem<ReviewEntry>): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        const ref = item.review.id;

        return (
            <View
                ref={(_ref) => { this.itemRefs[item.review.id] = _ref; }}
                onLayout={(event) => this.onItemLayout(event, index)}
                style={{ paddingBottom: Theme.spacing.tiny }}
            >

                {/* ToDo: add profile image */}

                <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.base, paddingBottom: Theme.spacing.tiny }}>
                    <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>
                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: Theme.spacing.tiny }}>
                    {/* ToDo: draw stars based on averge rating & get review count */}
                    <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                        <AirbnbRating
                            count={5}
                            readOnly={true}
                            showRating={false}
                            defaultRating={4}
                            size={14}
                            margin={1}
                        />
                    </View>
                    <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                </View>

                <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
                    {/*
                    <Text style={styles.reviewText}>{tmp}</Text>
                    */}
                    <Text style={styles.reviewText}>{_review.comment}</Text>
                </View>

                {
                    this.state.isOwner ?
                        (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Theme.spacing.base }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }} onPress={() => this.showKeyboard(ref, index)}>
                                    <Text style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        )
                        :
                        (
                            <View style={{ paddingTop: Theme.spacing.base - Theme.spacing.tiny }} />
                        )
                }
            </View>
        );
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingReview) return;

        if (this.allReviewsLoaded) return;

        !this.isClosed && this.setState({ isLoadingReview: true });

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReview();
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%' }} />
        );
    }

    @autobind
    onItemLayout(event, index) {
        const { x, y, width, height } = event.nativeEvent.layout;
        // console.log(x, y, width, height);
        // console.log(index, height);

        this.itemHeights[index] = height;
    }

    @autobind
    _keyboardDidShow(e) {
        const height = Dimensions.get('window').height -
            (Constants.statusBarHeight + 8 + 34 + 8) -
            e.endCoordinates.height -
            this._itemHeight - (Theme.spacing.tiny * 2 + 1);

        this.setState({ bottomLocation: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardWillShow(e) {
        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (var i = 0; i < this.selectedItemIndex; i++) {
            var h = this.itemHeights[i];
            if (h) {
                totalHeights += h + 1;
            }
        }

        const height = this.itemHeights[this.selectedItemIndex];
        const keyboardHeight = e.endCoordinates.height;
        const searchBarHeight = (Constants.statusBarHeight + 8 + 34 + 8);

        const y = totalHeights;

        const gap = Dimensions.get('window').height - keyboardHeight - this.replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true });
    }

    @autobind
    _keyboardDidHide() {
        this.setState({ bottomLocation: Dimensions.get('window').height });
    }

    @autobind
    _keyboardWillHide() {
        this.setState({ showKeyboard: false });

        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;

        if (this._showNotification) {
            this.hideNotification();
            this._showNotification = false;
        }
    }

    showKeyboard(ref, index) {
        if (this.state.showKeyboard) return;

        // console.log('ref', ref);
        // console.log('index', index);

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
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

    sendReply() {
        let message = this._reply._lastNativeText;
        console.log('message', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');

            return;
        }

        this.addReply(message);

        this.refs.toast.show('Your reply has been submitted!', 500, () => {
            if (!this.isClosed) {
                this._reply.blur();
            }
        });
    }

    async addReply(message) {
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

        let reviewId = reviewStore.reviews[this.selectedItemIndex].review.id;

        let userUid = Firebase.auth.currentUser.uid; // 리뷰를 쓴 사람

        await Firebase.addReply(placeId, feedId, reviewId, userUid, message);
    };
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: 'red'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.base

        // flex: 1,
        // padding: Theme.spacing.small,
        // paddingTop: Theme.spacing.tiny,

        // paddingTop: Theme.spacing.small,
        // paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.base,
        paddingRight: Theme.spacing.base
    },

    reviewContainer: {
        marginHorizontal: 10,
        padding: 10,
        // borderRadius: 3,
        // borderColor: 'rgba(0,0,0,0.1)',
        // borderWidth: 1,
        // backgroundColor: 'yellow',
    },
    reviewText: {
        color: 'silver',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "SFProText-Regular"
    },
    reviewName: {
        color: 'white',
        fontSize: 15,
        fontFamily: "SFProText-Semibold",
        // paddingBottom: Theme.spacing.tiny
        // backgroundColor: 'red',

        // alignSelf: 'flex-start'
    },
    reviewDate: {
        // backgroundColor: 'red',
        // marginLeft: 27,
        color: 'grey',
        fontSize: 15,
        fontFamily: "SFProText-Light",

        marginLeft: 'auto'
    },
    reviewRating: {
        // backgroundColor: 'red',
        // marginLeft: 4,
        // marginTop: 0,
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 15,
        lineHeight: 17,
        // lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },

    bottomIndicator: {
        // marginTop: 20,
        marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
    },
    // loading indicator
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
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
    }
});
