import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import {
    StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList, BackHandler,
    ActivityIndicator, TouchableOpacity, Keyboard, TextInput, TouchableWithoutFeedback
} from "react-native";
import Constants from 'expo-constants';
import * as Svg from 'react-native-svg';
import { Text, Theme, Avatar } from "./rnff/src/components";
// import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
// import ReadMore from "./ReadMore";
import { Ionicons, MaterialIcons, AntDesign } from "react-native-vector-icons";
import Dialog from "react-native-dialog";
import { Cons, Vars } from "./Globals";
import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import Util from './Util';
import PreloadImage from './PreloadImage';
import _ from 'lodash';

const DEFAULT_REVIEW_COUNT = 6;
const MAX_REVIEW_COUNT = 12;

const profilePictureWidth = 56;
const replyViewHeight = Dimensions.get('window').height / 9;


export default class ReadAllReviewsScreen extends React.Component {
    state = {
        renderReview: false,
        isLoadingReview: false,
        isOwner: false,
        reviews: null,
        showKeyboard: false,
        bottomPosition: Dimensions.get('window').height,

        refreshing: false,

        notification: '',

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.opacity = new Animated.Value(0);
        this.offset = new Animated.Value(((8 + 34 + 8) - 12) * -1);

        this.itemHeights = [];
        this.lastItemIndex = 0;
    }

    componentDidMount() {
        console.log('jdub', 'ReadAllReviewsScreen.componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        const { reviewStore, isOwner } = this.props.navigation.state.params;

        this.setState({ isOwner });

        reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        // reviewStore.checkForNewEntries(); // do not use here!
        this.reload();

        setTimeout(() => {
            !this.closed && this.setState({ renderReview: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished() {
        // console.log('jdub', 'onAddToReviewFinished');

        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;

        let __reviews = _.cloneDeep(reviews); // deep copy

        !this.closed && this.setState({ reviews: __reviews, isLoadingReview: false, refreshing: false });

        // !this.closed && this.enableScroll();
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'ReadAllReviewsScreen.handleHardwareBackPress');

        if (this._showNotification) {
            this.hideNotification();

            return true;
        }

        this.props.navigation.state.params.initFromReadAllReviews();
        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'ReadAllReviewsScreen';

        this.focused = true;
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;

        this.focused = false;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.unsetAddToReviewFinishedCallback(this.onAddToReviewFinished);

        this.closed = true;
    }

    render(): React.Node {
        // const { reviewStore } = this.props.navigation.state.params;
        // const { reviews } = reviewStore;
        const { reviews } = this.state;

        const notificationStyle = {
            opacity: this.opacity,
            transform: [{ translateY: this.offset }]
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
                            this.props.navigation.state.params.initFromReadAllReviews();
                            this.props.navigation.goBack();
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    this.state.renderReview &&
                    <TouchableWithoutFeedback
                        onPress={() => {
                            if (this.state.showKeyboard) this.setState({ showKeyboard: false });
                        }}
                    >
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            data={reviews}
                            keyExtractor={this.keyExtractor}
                            renderItem={this.renderItem}
                            // onEndReachedThreshold={0.5}
                            // onEndReached={this.loadMore}
                            onScroll={({ nativeEvent }) => {
                                if (!this.focused) return;

                                if (this.isCloseToBottom(nativeEvent)) {
                                    this.loadMore();
                                }
                            }}
                            // scrollEventThrottle={1}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator

                            ListEmptyComponent={this.renderListEmptyComponent}
                            ListFooterComponent={
                                this.state.isLoadingReview &&
                                <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                                    <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                                </View>
                            }

                            ItemSeparatorComponent={this.itemSeparatorComponent}

                            onRefresh={this.handleRefresh}
                            refreshing={this.state.refreshing}
                        />
                    </TouchableWithoutFeedback>
                }

                {
                    this.state.showKeyboard &&
                    <View style={{
                        position: 'absolute',
                        top: this.state.bottomPosition - replyViewHeight,
                        height: replyViewHeight,
                        width: '100%',
                        flexDirection: 'row',

                        flex: 1,

                        paddingTop: 8,
                        paddingBottom: 8,
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
                                flex: 0.85,
                                borderRadius: 5,

                                // padding: 10, // not working in ios
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingLeft: 10,
                                paddingRight: 10,

                                fontSize: 14, fontFamily: "Roboto-Regular", color: Theme.color.title,

                                textAlignVertical: 'top',

                                backgroundColor: '#212121'
                            }}
                            placeholder='Reply to a review'
                            placeholderTextColor={Theme.color.placeholder}
                            onChangeText={(text) => this.onChangeText(text)}
                            selectionColor={Theme.color.selection}
                            // keyboardAppearance={'dark'}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                        />
                        <TouchableOpacity style={{
                            flex: 0.15,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                            onPress={() => this.sendReply()}
                        >
                            <Ionicons name='ios-send' color={Theme.color.selection} size={24} />
                        </TouchableOpacity>
                    </View>
                }

                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    {
                        this.state.dialogType === 'pad' &&
                        <Dialog.Input
                            keyboardType={'phone-pad'}
                            // keyboardAppearance={'dark'}
                            onChangeText={(text) => this.setState({ dialogPassword: text })}
                            autoFocus={true}
                            secureTextEntry={true}
                        />
                    }
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>
            </View>
        );
    } // end of render()

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState({ refreshing: true });

        // reload from the start
        this.reload();
    }

    reload(count = DEFAULT_REVIEW_COUNT) {
        this.setState({ reviews: null });
        // init
        this.originReviewList = undefined;
        this.translatedReviewList = undefined;
        this.originReplyList = undefined;
        this.translatedReplyList = undefined;

        this.setState({ isLoadingReview: true });

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReviewFromStart(count);

        // this.disableScroll();
    }

    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item, index }): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        const reporters = _review.reporters;
        if (!reporters || reporters.length === 0 || reporters.indexOf(Firebase.user().uid) === -1) {
            // show original
            return (
                this.renderReviewItemOrigin(_profile, _review, index)
            );
        } else {
            // show blocked image
            return (
                this.renderReviewItemBlocked(_profile, _review, index)
            );
        }
    }

    renderReviewItemOrigin(_profile, _review, index) {
        const ref = _review.id;
        const reply = _review.reply;

        const isMyReview = this.isOwner(_review.uid, Firebase.user().uid);
        let isMyReply = false;
        if (reply) isMyReply = this.isOwner(reply.uid, Firebase.user().uid);

        let uid, picture, name, place, placeColor, placeFont;

        if (_profile) {
            uid = _profile.uid;
            picture = _profile.picture.uri;
            name = _profile.name;

            place = _profile.place ? _profile.place : 'Not specified';
            placeColor = _profile.place ? Theme.color.text2 : Theme.color.text4;
            placeFont = _profile.place ? "Roboto-Regular" : "Roboto-Italic";
        } else { // user removed
            uid = _review.uid;
            picture = _review.picture.uri;
            name = _review.name;

            place = _review.place ? _review.place : 'Not specified';
            placeColor = _review.place ? Theme.color.text2 : Theme.color.text4;
            placeFont = _review.place ? "Roboto-Regular" : "Roboto-Italic";
        }

        const avatarName = Util.getAvatarName(name);
        const avatarColor = Util.getAvatarColor(uid);
        let nameFontSize = 22;
        let nameLineHeight = 26;

        if (avatarName.length === 1) {
            nameFontSize = 24;
            nameLineHeight = 28;
        } else if (avatarName.length === 2) {
            nameFontSize = 22;
            nameLineHeight = 26;
        } else if (avatarName.length === 3) {
            nameFontSize = 20;
            nameLineHeight = 24;
        }

        return (
            <View style={{ paddingTop: 20, paddingBottom: 16 }} onLayout={(event) => this.onItemLayout(event, index)}>
                {
                    Platform.OS === 'android' ?
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                    <AirbnbRating
                                        count={5}
                                        readOnly={true}
                                        showRating={false}
                                        defaultRating={_review.rating}
                                        size={14}
                                        margin={1}
                                    />
                                </View>
                                <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                            </View>

                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>
                        :
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>
                }

                <View style={{ paddingTop: 10, paddingBottom: 6 }}>
                    <TouchableOpacity activeOpacity={0.5}
                        onPress={() => {
                            // console.log('jdub', 'onpress', index);

                            if (!this.originReviewList) this.originReviewList = [];

                            if (this.originReviewList[index]) { // means translated
                                this.setOriginReview(index);
                            } else {
                                this.translateReview(index);
                            }
                        }}>
                        <Text style={styles.reviewText}>{_review.comment}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        picture ?
                            <SmartImage
                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={picture}
                            />
                            :
                            <View
                                style={{
                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: Theme.color.text2, fontSize: 14, fontFamily: "Roboto-Regular" }}>
                                {name}
                            </Text>
                            {
                                !isMyReview &&
                                this.renderReviewReportButton(_review, index)
                            }
                        </View>

                        <Text style={{
                            marginTop: 4,
                            color: placeColor, fontSize: 14, fontFamily: placeFont
                        }}>
                            {place}
                        </Text>
                    </View>
                </View>
                {
                    isMyReview && !reply &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={{
                                // alignSelf: 'baseline'
                                width: 24, height: 24, justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.removeReview(index)}
                        >
                            <MaterialIcons name='close' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }

                {
                    // comment, id, timestamp, uid
                    reply &&
                    <View style={{
                        marginTop: Theme.spacing.tiny,
                        paddingTop: Theme.spacing.small,
                        paddingBottom: Theme.spacing.small,
                        paddingLeft: Theme.spacing.small,
                        paddingRight: Theme.spacing.small,
                        backgroundColor: Theme.color.highlight, borderRadius: 2
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Theme.spacing.tiny }}>
                            <Text style={styles.replyOwner}>Owner Response</Text>
                            <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                        </View>

                        <View style={{ paddingTop: 10, paddingBottom: 6 }}>
                            <TouchableOpacity activeOpacity={0.5}
                                onPress={() => {
                                    // console.log('jdub', 'onpress', index);

                                    if (!this.originReplyList) this.originReplyList = [];

                                    if (this.originReplyList[index]) { // means translated
                                        this.setOriginReply(index);
                                    } else {
                                        this.translateReply(index);
                                    }
                                }}>
                                <Text style={styles.replyComment}>{reply.comment}</Text>
                            </TouchableOpacity>
                        </View>

                        {
                            isMyReply &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={{
                                        // alignSelf: 'baseline'
                                        width: 24, height: 24, justifyContent: "center", alignItems: "center"
                                    }}
                                    onPress={() => this.removeReply(index)}
                                >
                                    <MaterialIcons name='close' color={'silver'} size={20} />
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                }

                {
                    this.state.isOwner && !reply &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={{
                                // alignSelf: 'baseline'
                                width: 24, height: 24, justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.openKeyboard(ref, index)}
                        >
                            <MaterialIcons name='reply' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    renderReviewItemBlocked(_profile, _review, index) {
        return (
            <TouchableOpacity activeOpacity={0.5}
                onPress={() => {
                    this.openDialog('Unblock Review', 'Are you sure you want to unblock ' + _review.name + '?', async () => {
                        const uid = Firebase.user().uid;
                        const { placeId, feedId } = this.props.navigation.state.params;
                        const reviewId = _review.id;

                        const result = await Firebase.unblockReview(uid, placeId, feedId, reviewId);
                        if (!result) {
                            this.showToast('The review has been removed by its owner.', 500);
                            return;
                        }

                        /*
                        // reload review
                        let count = this.state.reviews.length;
                        if (count < DEFAULT_REVIEW_COUNT) count = DEFAULT_REVIEW_COUNT;
                        else if (count > MAX_REVIEW_COUNT) count = MAX_REVIEW_COUNT;
                        this.reload(count);

                        // move scroll top
                        this._flatList.scrollToOffset({ offset: 0, animated: false });
                        */
                        this.showReview(index, uid);
                    });
                }}
            >
                {
                    this.renderReviewItemOrigin(_profile, _review, index)
                }

                <View style={[StyleSheet.absoluteFill, { marginVertical: 9 }, {
                    borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                }]}>
                    <AntDesign style={{ marginBottom: 12 }} name='checkcircleo' color="#228B22" size={36} />
                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 14,
                        fontFamily: "Roboto-Light",
                        paddingHorizontal: 10,
                        textAlign: 'center',
                        marginBottom: 8
                    }}>{'Thanks for letting us know.'}</Text>
                    <Text style={{
                        color: Theme.color.text3,
                        fontSize: 14,
                        fontFamily: "Roboto-Light",
                        paddingHorizontal: 10,
                        textAlign: 'center'
                    }}>{'Your feedback improves the quality of contents on Rowena.'}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    isOwner(uid1, uid2) {
        if (uid1 === uid2) {
            return true;
        } else {
            return false;
        }
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingReview) return;

        const { reviewStore } = this.props.navigation.state.params;
        if (reviewStore.allReviewsLoaded) return;

        this.setState({ isLoadingReview: true });

        reviewStore.loadReview(DEFAULT_REVIEW_COUNT);
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
        // console.log('jdub', x, y, width, height);
        console.log('jdub', index, height);

        this.itemHeights[index] = height;
        this.lastItemIndex = index;
    }

    @autobind
    renderListEmptyComponent() {
        /*
        const { reviewStore } = this.props.navigation.state.params;
        const { reviews } = reviewStore;
        const loading = reviews === undefined;
        */

        const { reviews } = this.state;
        const loading = reviews === null;

        if (loading) {
            // render skeleton

            const width = Dimensions.get('window').width - Theme.spacing.base * 2;

            let reviewArray = [];

            if (Platform.OS === 'android') {
                for (let i = 0; i < 5; i++) {
                    reviewArray.push(
                        <View style={{ alignItems: 'center', paddingTop: 16 }} key={i}>
                            <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={162 + 16}>
                                <Svg.Rect
                                    x={0}
                                    y={10}
                                    width={100}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={width - 100}
                                    y={11}
                                    width={100}
                                    height={6}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12 + 8 + 12}
                                    width={'60%'}
                                    height={8}
                                />
                                <Svg.Circle
                                    cx={26}
                                    cy={126}
                                    r={26}
                                />
                                <Svg.Rect
                                    x={26 * 2 + 16}
                                    y={126 - 8 - 6}
                                    width={80}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={26 * 2 + 16}
                                    y={126 + 6}
                                    width={80}
                                    height={8}
                                />
                            </SvgAnimatedLinearGradient>
                            {
                                i !== 4 &&
                                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: width }} />
                            }
                        </View>
                    );
                }
            } else {
                for (let i = 0; i < 5; i++) {
                    reviewArray.push(
                        <View style={{ alignItems: 'center', paddingTop: 16 }} key={i}>
                            <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={162 + 16}>
                                <Svg.Rect
                                    x={width - 100}
                                    y={11}
                                    width={100}
                                    height={6}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12}
                                    width={'100%'}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={0}
                                    y={36 + 8 + 12 + 8 + 12}
                                    width={'60%'}
                                    height={8}
                                />
                                <Svg.Circle
                                    cx={26}
                                    cy={126}
                                    r={26}
                                />
                                <Svg.Rect
                                    x={26 * 2 + 16}
                                    y={126 - 8 - 6}
                                    width={80}
                                    height={8}
                                />
                                <Svg.Rect
                                    x={26 * 2 + 16}
                                    y={126 + 6}
                                    width={80}
                                    height={8}
                                />
                            </SvgAnimatedLinearGradient>
                            {
                                i !== 4 &&
                                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: width }} />
                            }
                        </View>
                    );
                }
            }

            return (
                <View>
                    {reviewArray}
                </View>
            );
        }

        // this.state.reviews.length === 0
        return this.renderEmptyImage();
    }

    renderEmptyImage() {
        return (
            // render illustration
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{
                    color: Theme.color.text2,
                    fontSize: 28,
                    lineHeight: 32,
                    fontFamily: "Chewy-Regular"
                }}>{Platform.OS === 'android' ? 'No customer reviews yet' : "No people's comments yet"}</Text>

                <Text style={{
                    marginTop: 10,
                    color: Theme.color.text3,
                    fontSize: 20,
                    lineHeight: 24,
                    fontFamily: "Chewy-Regular"
                }}>{Platform.OS === 'android' ? 'Stop expecting, start exploring' : 'Stop expecting, start accepting'}</Text>

                <Image
                    style={{
                        marginTop: 30,
                        width: Cons.stickerWidth,
                        height: Cons.stickerHeight,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.reviews}
                />
            </View>
        );
    }

    renderReviewReportButton(review, index) {
        return (
            <TouchableOpacity
                style={{
                    width: 18,
                    height: 18,
                    marginLeft: 6,
                    justifyContent: "center", alignItems: "center"
                }}
                onPress={() => {
                    this.reportReview(review, index);
                }}
            >
                <Ionicons name='md-alert' color={Theme.color.text5} size={14} />
            </TouchableOpacity>
        );
    }

    reportReview(review, index) {
        this.openDialog('Report Review', 'Are you sure you want to report ' + review.name + '?', async () => {
            // report review

            // 1. update database (reporters)
            const uid = Firebase.user().uid;
            const { placeId, feedId } = this.props.navigation.state.params;
            const reviewId = review.id;

            const result = await Firebase.reportReview(uid, placeId, feedId, reviewId);
            if (!result) {
                // the review is removed
                this.showToast('The review has been removed by its owner.', 500);
                return;
            }

            /*
            // reload review
            let count = this.state.reviews.length;
            if (count < DEFAULT_REVIEW_COUNT) count = DEFAULT_REVIEW_COUNT;
            else if (count > MAX_REVIEW_COUNT) count = MAX_REVIEW_COUNT;
            this.reload(count);

            // move scroll top
            this._flatList.scrollToOffset({ offset: 0, animated: false });
            */
            this.hideReview(index, uid);

            this.showToast('Thanks for your feedback.', 500);
        });
    }

    hideReview(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.review;
        if (!_review.reporters) {
            let reporters = [];
            reporters.push(uid);
            _review.reporters = reporters;
        } else {
            _review.reporters.push(uid);
        }

        this.setState({ reviews });
    }

    showReview(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.review;

        const idx = _review.reporters.indexOf(uid);
        if (idx !== -1) _review.reporters.splice(idx, 1);

        this.setState({ reviews });
    }

    @autobind
    _keyboardDidShow(e) {
        this.setState({ bottomPosition: Dimensions.get('window').height - e.endCoordinates.height });

        if (!this.selectedItem) return;

        let totalHeights = 0;
        for (let i = 0; i < this.selectedItemIndex; i++) {
            let h = this.itemHeights[i];
            if (h) {
                totalHeights += h + 1; // separator width
            }
        }

        const height = this.itemHeights[this.selectedItemIndex];
        const keyboardHeight = e.endCoordinates.height;
        const searchBarHeight = Cons.searchBarHeight;

        const y = totalHeights;

        const gap = Dimensions.get('window').height - keyboardHeight - replyViewHeight - height - searchBarHeight;

        this._flatList.scrollToOffset({ offset: y - gap, animated: true });
    }

    @autobind
    _keyboardDidHide(e) {
        this.setState({ showKeyboard: false, bottomPosition: Dimensions.get('window').height });

        this.selectedItem = undefined;
        this.selectedItemIndex = undefined;

        /*
        if (this._showNotification) {
            this.hideNotification();
        }
        */
    }

    openKeyboard(ref, index) {
        if (this.state.showKeyboard) return;

        this.setState({ showKeyboard: true }, () => {
            this._reply.focus();
        });

        this.selectedItem = ref;
        this.selectedItemIndex = index;
    }

    showNotification(msg) {
        this._showNotification = true;

        this.setState({ notification: msg }, () => {
            this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
                Animated.parallel([
                    Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.offset, {
                        toValue: Constants.statusBarHeight + 6,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            });
        });
    };

    hideNotification() {
        this._notification.getNode().measure((x, y, width, height, pageX, pageY) => {
            Animated.parallel([
                Animated.timing(this.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(this.offset, {
                    toValue: height * -1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start(() => { this._showNotification = false });
        });
    }

    onChangeText(text) {
        if (this._showNotification) {
            this.hideNotification();
        }
    }

    sendReply() {
        const message = this._reply._lastNativeText;
        console.log('jdub', 'sendReply', message);

        if (message === undefined || message === '') {
            this.showNotification('Please enter a valid reply.');

            return;
        }

        this.addReply(message);

        // send push notification
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;
        // const receiver = reviewStore.reviews[this.selectedItemIndex].profile.uid;
        const receiver = this.state.reviews[this.selectedItemIndex].profile.uid;

        const data = {
            // message: Firebase.user().name + ' replied to your review: ' + message,
            message,
            placeId,
            feedId
        };

        sendPushNotification(Firebase.user().uid, Firebase.user().name, receiver, Cons.pushNotification.reply, data);

        this.showToast('Your reply has been submitted!', 500, () => {
            if (this.closed) return;

            // this._reply.blur();
            this.setState({ showKeyboard: false });

            // reload
            let count = this.state.reviews.length;
            if (count < DEFAULT_REVIEW_COUNT) count = DEFAULT_REVIEW_COUNT;
            else if (count > MAX_REVIEW_COUNT) count = MAX_REVIEW_COUNT;
            this.reload(count);

            // move scroll top
            this._flatList.scrollToOffset({ offset: 0, animated: false });
        });
    }

    async addReply(message) {
        const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

        // const reviewOwnerUid = reviewStore.reviews[this.selectedItemIndex].profile.uid;
        // const reviewId = reviewStore.reviews[this.selectedItemIndex].review.id;
        const reviewOwnerUid = this.state.reviews[this.selectedItemIndex].profile.uid;
        const reviewId = this.state.reviews[this.selectedItemIndex].review.id;

        const userUid = Firebase.user().uid;

        /*
        const result = await Firebase.addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message);
        if (!result) {
            this.refs["toast"].show('The user no longer exists.', 500);
        }
        */
        await Firebase.addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message);
    };

    async removeReview(index) {
        const title = Platform.OS === 'android' ? 'Delete Review' : 'Delete Comment';
        const subtitle = Platform.OS === 'android' ? 'Are you sure you want to delete this review?' : 'Are you sure you want to delete this comment?';

        this.openDialog(title, subtitle, async () => {
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            // const reviewId = reviewStore.reviews[index].review.id;
            const reviewId = this.state.reviews[index].review.id;

            const userUid = Firebase.user().uid;

            const result = await Firebase.removeReview(placeId, feedId, reviewId, userUid);
            if (!result) {
                // the post is removed
                this.showToast('The post has been removed by its owner.', 500);
                return;
            }

            this.showToast('Your review has successfully been removed.', 500, () => {
                if (this.closed) return;

                let count = this.state.reviews.length;
                if (count < DEFAULT_REVIEW_COUNT) count = DEFAULT_REVIEW_COUNT;
                else if (count > MAX_REVIEW_COUNT) count = MAX_REVIEW_COUNT;
                this.reload(count);

                // move scroll top
                this._flatList.scrollToOffset({ offset: 0, animated: false });
            });
        });
    }

    async removeReply(index) {
        this.openDialog('Delete Reply', 'Are you sure you want to delete this reply?', async () => {
            const { reviewStore, placeId, feedId } = this.props.navigation.state.params;

            // const reviewId = reviewStore.reviews[index].review.id;
            // const replyId = reviewStore.reviews[index].review.reply.id;
            const reviewId = this.state.reviews[index].review.id;
            const replyId = this.state.reviews[index].review.reply.id;

            const userUid = Firebase.user().uid;

            await Firebase.removeReply(placeId, feedId, reviewId, replyId, userUid);

            this.showToast('Your reply has successfully been removed.', 500, () => {
                if (this.closed) return;

                let count = this.state.reviews.length;
                if (count < DEFAULT_REVIEW_COUNT) count = DEFAULT_REVIEW_COUNT;
                else if (count > MAX_REVIEW_COUNT) count = MAX_REVIEW_COUNT;
                this.reload(count);

                // move scroll top
                this._flatList.scrollToOffset({ offset: 0, animated: false });
            });
        });
    }

    translateReview(index) {
        let reviews = this.state.reviews;
        const comment = reviews[index].review.comment;

        if (!this.translatedReviewList) this.translatedReviewList = [];

        const translatedReview = this.translatedReviewList[index];

        if (translatedReview) {
            this.originReviewList[index] = comment;

            reviews[index].review.comment = translatedReview;
            this.setState({ reviews });
        } else {
            Util.translate(comment).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originReviewList[index] = comment;

                reviews[index].review.comment = translated;
                !this.closed && this.setState({ reviews });

                this.translatedReviewList[index] = translated;
            }).catch(err => {
                console.error('translate error', err);
            });
        }
    }

    setOriginReview(index) {
        const originReview = this.originReviewList[index];

        let reviews = this.state.reviews;

        reviews[index].review.comment = originReview;
        this.setState({ reviews });

        this.originReviewList[index] = null;
    }

    translateReply(index) {
        let reviews = this.state.reviews;
        const comment = reviews[index].review.reply.comment;

        if (!this.translatedReplyList) this.translatedReplyList = [];

        const translatedReply = this.translatedReplyList[index];

        if (translatedReply) {
            this.originReplyList[index] = comment;

            reviews[index].review.reply.comment = translatedReply;
            this.setState({ reviews });
        } else {
            Util.translate(comment).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originReplyList[index] = comment;

                reviews[index].review.reply.comment = translated;
                !this.closed && this.setState({ reviews });

                this.translatedReplyList[index] = translated;
            }).catch(err => {
                console.error('translate error', err);
            });
        }
    }

    setOriginReply(index) {
        const originReply = this.originReplyList[index];

        let reviews = this.state.reviews;

        reviews[index].review.reply.comment = originReply;
        this.setState({ reviews });

        this.originReplyList[index] = null;
    }

    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true, showsVerticalScrollIndicator: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false, showsVerticalScrollIndicator: false });
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

    showToast(msg, ms, cb = null) {
        if (this.props.screenProps.data) this.props.screenProps.data.showToast(msg, ms, cb);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center'
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
    reviewRating: {
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 16,
        fontFamily: "Roboto-Regular"
    },
    reviewDate: {
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: "Roboto-Regular"
    },
    replyOwner: {
        color: Theme.color.text2,
        fontSize: 14,
        fontFamily: "Roboto-Italic"
    },
    replyDate: {
        color: Theme.color.text3,
        fontSize: 14,
        fontFamily: "Roboto-Light"
    },
    replyComment: {
        color: Theme.color.text2,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: "Roboto-Italic"
    },
    bottomIndicator: {
        marginTop: 20,
        // marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
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
    }
});
