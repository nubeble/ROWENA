// ToDo: add flash

import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, Dimensions, BackHandler, Animated,
    FlatList, Image, TextInput
} from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { Svg, Constants } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Util from "./Util";
import CommentStore from "./CommentStore";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from "moment";
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import Toast, { DURATION } from 'react-native-easy-toast';
import { sendPushNotification } from './PushNotifications';
import Dialog from "react-native-dialog";

const DEFAULT_REVIEW_COUNT = 6;

const avatarWidth = Dimensions.get('window').height / 11;
const profilePictureWidth = Dimensions.get('window').height / 12;
const replyViewHeight = Dimensions.get('window').height / 9;

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore")
@observer // for commentStore
export default class EditMain extends React.Component<InjectedProps> {
    commentStore: CommentStore = new CommentStore();

    state = {
        renderFeed: false,

        isLoadingFeeds: false,
        refreshing: false,

        host: null,
        guest: null,

        focused: false,

        // showKeyboard: false,
        // bottomPosition: Dimensions.get('window').height,

        notification: '',
        opacity: new Animated.Value(0),
        offset: new Animated.Value(((8 + 34 + 8) - 12) * -1),

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',

        flashMessageTitle: '',
        flashMessageSubtitle: '',
        flashImage: null, // uri
        flashOpacity: new Animated.Value(0),
        flashOffset: new Animated.Value(Cons.searchBarHeight * -1)
    };

    constructor(props) {
        super(props);

        // this.opponentUser = null;

        this.opponentUserUnsubscribe = null;
    }

    componentDidMount() {
        console.log('EditMain.componentDidMount');

        // this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        // this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { profile } = this.props.profileStore;
        // const feeds = profile.feeds;
        // const length = feeds.length;
        const uid = profile.uid;

        const receivedCommentsCount = profile.receivedCommentsCount;

        this.commentStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        const query = Firebase.firestore.collection("users").doc(uid).collection("comments").orderBy("timestamp", "desc");
        this.commentStore.init(query, DEFAULT_REVIEW_COUNT);

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished() {
        console.log('EditMain.onAddToReviewFinished');

        !this.closed && this.setState({ isLoadingFeeds: false, refreshing: false });
    }

    @autobind
    handleHardwareBackPress() {
        console.log('EditMain.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        if (this.state.dialogVisible) {
            this.hideDialog();

            return true;
        }

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'EditMain';

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }

    componentWillUnmount() {
        // this.keyboardDidShowListener.remove();
        // this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    render() {
        const { profile } = this.props.profileStore;

        let name = profile.name;
        if (!name) name = 'Anonymous'; // test

        let address = "No address registered";
        if (profile.city && profile.country) {
            address = profile.city + ', ' + profile.country;
        }

        const count = profile.receivedCommentsCount;

        let reviewText = 'loading...';
        if (count === 0) {
            reviewText = 'No host reviews yet';
        } else if (count === 1) {
            reviewText = ' 1 review';
        } else {
            reviewText = count.toString() + " reviews";
        }

        let labelText = null;
        if (count === 1) {
            labelText = count.toString() + ' review from hosts';
        } else if (count > 1) {
            labelText = count.toString() + ' reviews from hosts';
        }

        const imageUri = profile.picture.uri;

        let dateText = 'Joined in September 26, 2018';
        const date = profile.timestamp; // ToDo: Joined in September 26, 2018



        const { reviews } = this.commentStore;

        const notificationStyle = {
            opacity: this.state.opacity,
            transform: [{ translateY: this.state.offset }]
        };

        return (
            <View style={[styles.flex, { paddingBottom: Cons.viewMarginBottom() }]}>
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
                        <Ionicons name='md-close' color="white" size={20} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.searchBar}>
                    {/* close button */}
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/*
                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 20,
                            fontFamily: "Roboto-Medium",
                            alignSelf: 'center',
                            paddingBottom: 4
                        }}
                    >{post.name}</Text>
                    */}
                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={styles.infoContainer}>
                                    {/* avatar view */}
                                    <View
                                        style={{ marginTop: 20 }}
                                    >
                                        <View style={{
                                            width: '100%', height: Dimensions.get('window').height / 8,
                                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                                <Text style={{ paddingTop: 4, color: Theme.color.text2, fontSize: 24, fontFamily: "Roboto-Medium" }}>{name}</Text>
                                                <Text style={{ marginTop: Dimensions.get('window').height / 80, color: Theme.color.text3, fontSize: 16, fontFamily: "Roboto-Light" }}>
                                                    {dateText}
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: avatarWidth, height: avatarWidth,
                                                    marginRight: 22, justifyContent: 'center', alignItems: 'center'
                                                }}
                                            >
                                                {
                                                    imageUri ?
                                                        <Image
                                                            style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                            source={{ uri: imageUri }}
                                                        />
                                                        :
                                                        <Image
                                                            style={{
                                                                backgroundColor: 'black', tintColor: 'white', width: avatarWidth, height: avatarWidth,
                                                                borderRadius: avatarWidth / 2, borderColor: 'black', borderWidth: 1,
                                                                resizeMode: 'cover'
                                                            }}
                                                            source={PreloadImage.user}
                                                        />
                                                }
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ width: '100%', paddingHorizontal: 20 }}>

                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }}>
                                            <Image
                                                style={{ width: 20, height: 20, resizeMode: 'cover' }}
                                                source={PreloadImage.home}
                                            />
                                            <Text style={{ marginLeft: 12, fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Light" }}>{address}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: Theme.spacing.small }}>
                                            <Image
                                                style={{ width: 22, height: 22, resizeMode: 'cover' }}
                                                source={PreloadImage.comment}
                                            />
                                            <Text style={{ marginLeft: 10, fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Light" }}>{reviewText}</Text>
                                        </View>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }}
                                            onLayout={(event) => {
                                                const { x, y, width, height } = event.nativeEvent.layout;

                                                console.log('onLayout', y);

                                                this.borderY = y;
                                            }}
                                        />
                                    </View>
                                </View>
                                {
                                    labelText &&
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>
                                            {
                                                labelText
                                            }
                                        </Text>
                                    </View>
                                }

                                {
                                    labelText &&
                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, alignSelf: 'center', width: Dimensions.get('window').width - 20 * 2 }} />
                                }
                            </View>
                        }
                        // columnWrapperStyle={styles.columnWrapperStyle}
                        data={reviews}
                        keyExtractor={item => item.review.id}
                        renderItem={this.renderItem}
                        ItemSeparatorComponent={this.itemSeparatorComponent}

                        onScroll={({ nativeEvent }) => {
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.loadMore();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        ListFooterComponent={
                            this.state.isLoadingFeeds &&
                            <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                                <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                            </View>
                        }

                        ListEmptyComponent={this.renderListEmptyComponent}
                    />
                }

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View>
        );
    }

    @autobind
    renderItem({ item, index }: FlatListItem<CommentEntry>): React.Node {
        // const _profile = item.profile; // boss's profile
        const _review = item.review;

        /*
        console.log ('profile', _profile.uid); // writer
        console.log ('review', _review.id); // comment
        */

        let isMyComment = false;
        if (_review.uid === Firebase.user().uid) {
            isMyComment = true;
        }

        return (
            <View style={{ paddingHorizontal: Theme.spacing.base, paddingVertical: Theme.spacing.small }}>

                <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                <Text style={styles.reviewText}>{_review.comment}</Text>
                {/*}
                <Text style={styles.reviewText}>{tmp}</Text>
                */}

                <View style={{ marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.xSmall, flexDirection: 'row', alignItems: 'center' }}>
                    <SmartImage
                        style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                        showSpinner={false}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={_review.picture}
                    />
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <Text style={{ color: Theme.color.text2, fontSize: 13, fontFamily: "Roboto-Regular" }}>
                            {_review.name}</Text>
                        <Text style={{
                            marginTop: 4,
                            color: Theme.color.text2, fontSize: 13, fontFamily: "Roboto-Regular"
                        }}>{_review.place}</Text>
                    </View>
                </View>

                {
                    isMyComment && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                onPress={() => this.removeComment(index)}
                            >
                                <Text style={{ marginLeft: 4, fontFamily: "Roboto-Regular", color: "silver", fontSize: 14 }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

            </View>
        );
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingFeeds) return;

        if (this.commentStore.allReviewsLoaded) return;

        this.setState({ isLoadingFeeds: true });

        this.commentStore.loadReview();
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ alignSelf: 'center', width: Dimensions.get('window').width - 20 * 2, borderBottomColor: Theme.color.line, borderBottomWidth: 1 }} />
        );
    }

    @autobind
    renderListEmptyComponent() {
        // const { navigation } = this.props;

        const { reviews } = this.commentStore;
        const loading = reviews === undefined;

        const width = Dimensions.get('window').width - Theme.spacing.base * 2;

        let reviewArray = [];

        for (var i = 0; i < 4; i++) {
            reviewArray.push(
                <View key={i}>
                    <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={100}>
                        <Svg.Circle
                            cx={18 + 2}
                            cy={18 + 2}
                            r={18}
                        />
                        <Svg.Rect
                            x={2 + 18 * 2 + 10}
                            y={2 + 18 - 12}
                            width={60}
                            height={6}
                        />
                        <Svg.Rect
                            x={2 + 18 * 2 + 10}
                            y={2 + 18 + 6}
                            width={100}
                            height={6}
                        />

                        <Svg.Rect
                            x={0}
                            y={2 + 18 * 2 + 14}
                            width={'100%'}
                            height={6}
                        />
                        <Svg.Rect
                            x={0}
                            y={2 + 18 * 2 + 14 + 14}
                            width={'100%'}
                            height={6}
                        />
                        <Svg.Rect
                            x={0}
                            y={2 + 18 * 2 + 14 + 14 + 14}
                            width={'80%'}
                            height={6}
                        />
                    </SvgAnimatedLinearGradient>
                </View>
            );
        }

        return (
            /*
            loading ?
                <View style={{ paddingVertical: Theme.spacing.small }}>
                    {reviewArray}
                </View>
                :
                <View style={{ paddingVertical: Theme.spacing.small, paddingHorizontal: Theme.spacing.small }}>
                    <FirstPost {...{ navigation }} />
                </View>
            */
            loading &&
            <View style={{ paddingVertical: Theme.spacing.small, paddingHorizontal: 20 }}>
                {reviewArray}
            </View>
        );
    }

    handleRefresh = () => {
        if (this.state.isLoadingFeeds) return;

        this.setState({ isLoadingFeeds: true, refreshing: true });

        // this.disableScroll();

        // reload from the start
        this.commentStore.loadReviewFromTheStart();
    }

    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true, showsVerticalScrollIndicator: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false, showsVerticalScrollIndicator: false });
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

    openDialog(title, message, callback) {
        this.setState({ dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
        // backgroundColor: 'green'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'black'
    },
    ad: {
        width: (Dimensions.get('window').width),
        height: (Dimensions.get('window').width) / 21 * 9,
        marginTop: Theme.spacing.tiny,
        marginBottom: Theme.spacing.tiny
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    contentContainer: {
        flexGrow: 1
    },
    columnWrapperStyle: {
        flex: 1,
        // justifyContent: 'center'
        justifyContent: 'flex-start'
    },
    pictureContainer: {
        width: (Dimensions.get('window').width - 2 * 6) / 3,
        height: (Dimensions.get('window').width - 2 * 6) / 3,
        marginVertical: 2,
        marginHorizontal: 2,
        borderRadius: 2
    },
    picture: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    },
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        justifyContent: 'center',

        borderRadius: 2,
    },
    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    },
    infoContainer: {
        flex: 1,
        // width: '100%',
        paddingBottom: Theme.spacing.tiny
    },
    /*
    bodyInfoTitle: {
        color: 'white',
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        paddingTop: Theme.spacing.base
    },
    bodyInfoContent: {
        color: 'white',
        fontSize: 18,
        fontFamily: "Roboto-Bold",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },
    */
    infoText1: {
        color: Theme.color.text2,
        fontSize: 17,
        fontFamily: "Roboto-Medium",
        paddingTop: Theme.spacing.base
    },
    infoText2: {
        color: Theme.color.text3,
        fontSize: 15,
        fontFamily: "Roboto-Light",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },
    contactButton: {
        // width: '85%',
        width: Dimensions.get('window').width * 0.85,
        height: Cons.buttonHeight,
        alignSelf: 'center',
        backgroundColor: "transparent",
        borderRadius: 5,
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,

        alignItems: 'center',
        justifyContent: 'center'
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 13,
        fontFamily: "Roboto-Light"
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "Roboto-Regular",

        paddingVertical: Theme.spacing.tiny
    },
    reviewName: {
        color: Theme.color.text2,
        fontSize: 15,
        fontFamily: "Roboto-Medium",
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
        fontFamily: "Roboto-Medium",
        color: "white",
        textAlign: 'center'
    },
    notificationButton: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
