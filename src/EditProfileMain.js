import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, Dimensions, BackHandler, Animated,
    FlatList, Image, Platform
} from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, Feather, MaterialCommunityIcons, MaterialIcons, AntDesign } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import * as Svg from 'react-native-svg';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Util from "./Util";
import type { CommentEntry } from "../rnff/src/components/Model";
import CommentStore from "./CommentStore";
import ProfileStore from "./rnff/src/home/ProfileStore";
import moment from "moment";
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import Toast from 'react-native-easy-toast';
import Dialog from "react-native-dialog";
import _ from 'lodash';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const DEFAULT_COMMENT_COUNT = 6;
const MAX_COMMENT_COUNT = 12;

const avatarWidth = Dimensions.get('window').height / 11;
const profilePictureWidth = 56;
// const replyViewHeight = Dimensions.get('window').height / 9;


@inject("feedStore", "profileStore")
@observer // for commentStore
export default class EditProfileMain extends React.Component<InjectedProps> {
    commentStore: CommentStore = new CommentStore();

    state = {
        isLoadingFeeds: false,
        reviews: null,
        refreshing: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    componentDidMount() {
        console.log('jdub', 'EditProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { profile } = this.props.profileStore;

        const uid = profile.uid;
        // const receivedCommentsCount = profile.receivedCommentsCount;

        this.commentStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        this.setState({ isLoadingFeeds: true });

        const query = Firebase.firestore.collection("users").doc(uid).collection("comments").orderBy("timestamp", "desc");
        this.commentStore.init(query, DEFAULT_COMMENT_COUNT);

        // this.disableScroll();
    }

    @autobind
    onAddToReviewFinished() {
        console.log('jdub', 'EditProfileMain.onAddToReviewFinished');

        /*
        const { reviews } = this.commentStore;
        const count = reviews.length;
        this.count = count;
        */

        const { reviews } = this.commentStore;

        let __reviews = _.cloneDeep(reviews); // deep copy

        !this.closed && this.setState({ reviews: __reviews, isLoadingFeeds: false, refreshing: false });

        // !this.closed && this.enableScroll();
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'EditProfileMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'EditProfileMain';

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
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.commentStore.unsetAddToReviewFinishedCallback(this.onAddToReviewFinished);

        this.closed = true;
    }

    render() {
        const { profile } = this.props.profileStore;
        if (!profile) return null;

        let avatarName = 'Anonymous';
        let place = "Not specified";
        let placeColor = Theme.color.text4;
        let placeFont = "Roboto-LightItalic";
        let count = 0;
        let picture = null;
        let dateText = null;

        // ToDo: use age, gender, note
        let age = '20';
        let gender = 'Woman';
        let note = 'hi';

        const name = profile.name;
        const email = profile.email;
        const phoneNumber = profile.phoneNumber;
        if (name) {
            avatarName = name;
        } else {
            if (email) {
                avatarName = email;
            } else {
                if (phoneNumber) {
                    avatarName = phoneNumber;
                }
            }
        }
        if (profile.place) {
            place = profile.place;
            placeColor = Theme.color.text2;
            placeFont = "Roboto-Light";
        }
        count = profile.receivedCommentsCount;
        picture = profile.picture.uri;
        dateText = Util.getJoinedDate(profile.timestamp); // 'Joined in September 26, 2018'

        if (profile.birthday) age = Util.getAge(profile.birthday);
        gender = profile.gender;
        note = profile.about;

        let _avatarName = '';
        let _avatarColor = 'black';
        let nameFontSize = 28;
        let nameLineHeight = 32;

        if (!picture) {
            _avatarName = Util.getAvatarName(name);
            _avatarColor = Util.getAvatarColor(profile.uid);

            if (_avatarName.length === 1) {
                nameFontSize = 30;
                nameLineHeight = 34;
            } else if (_avatarName.length === 2) {
                nameFontSize = 28;
                nameLineHeight = 32;
            } else if (_avatarName.length === 3) {
                nameFontSize = 26;
                nameLineHeight = 30;
            }
        }

        let reviewText = '';
        if (count === 0) {
            reviewText = Platform.OS === 'android' ? 'No customer reviews yet' : "No people's comments yet";
        } else if (count === 1) {
            reviewText = Platform.OS === 'android' ? '1 customer review' : "1 people's comment";
        } else {
            reviewText = Platform.OS === 'android' ? Util.numberWithCommas(count) + " customer reviews" : Util.numberWithCommas(count) + " people's comments";
        }

        /*
        let labelText = null;
        if (count === 0) {
            labelText = 'No reviews from girls';
        } else if (count === 1) {
            labelText = count.toString() + ' review from girls';
        } else if (count > 1) {
            labelText = count.toString() + ' reviews from girls';
        }
        */

        // check comment store update
        let showReloadCommentsButton = false;
        if (this.count === undefined) {
            this.count = count;
        } else {
            if (this.count !== count) {
                showReloadCommentsButton = true;
            }
        }

        // const { reviews } = this.commentStore;
        const { reviews } = this.state;

        return (
            <View style={styles.flex}>
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
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    {/*
                    <View style={{ paddingBottom: 8 }}>
                        <Text style={styles.title}>{'View & Edit Profile'}</Text>
                    </View>
                    */}

                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => this.props.navigation.navigate("editProfile")}
                    >
                        <MaterialCommunityIcons name="square-edit-outline" color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={(fl) => this._flatList = fl}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.infoContainer}>
                                {/* avatar view */}
                                <View>
                                    <View style={{
                                        width: '100%', height: Dimensions.get('window').height / 8,
                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                            <Text style={{ marginTop: Cons.redDotWidth / 2, fontSize: 24, lineHeight: 28, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
                                                {avatarName}
                                            </Text>
                                            <Text style={{ marginTop: Dimensions.get('window').height / 80, fontSize: 16, color: Theme.color.text3, fontFamily: "Roboto-Light" }}>
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
                                                picture ?
                                                    <SmartImage
                                                        style={{ width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2 }}
                                                        showSpinner={false}
                                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                        uri={picture}
                                                    />
                                                    :
                                                    /*
                                                    <Image
                                                        style={{
                                                            backgroundColor: 'black',
                                                            width: avatarWidth, height: avatarWidth,
                                                            borderRadius: avatarWidth / 2,
                                                            resizeMode: 'cover'
                                                        }}
                                                        source={PreloadImage.user}
                                                    />
                                                    */
                                                    <View
                                                        style={{
                                                            width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2,
                                                            backgroundColor: _avatarColor, alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: nameFontSize, lineHeight: nameLineHeight, fontFamily: "Roboto-Medium" }}>
                                                            {_avatarName}
                                                        </Text>
                                                    </View>
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
                                        <Text style={{ marginLeft: 12, fontSize: 18, color: placeColor, fontFamily: placeFont }}>{place}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: Theme.spacing.small }}>
                                        <Image
                                            style={{ width: 22, height: 22, resizeMode: 'cover' }}
                                            source={PreloadImage.comment}
                                        />
                                        <Text style={{ marginLeft: 10, fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Light" }}>{reviewText}</Text>
                                        {
                                            showReloadCommentsButton &&
                                            <View style={{ flex: 1, justifyContent: "center" }}>
                                                <TouchableOpacity
                                                    style={{
                                                        marginLeft: 8,
                                                        // backgroundColor: 'green',
                                                        // position: 'absolute', top: 0, left: 8,
                                                        width: 20,
                                                        height: 20,
                                                        justifyContent: "center", alignItems: "center"
                                                    }}
                                                    onPress={() => {
                                                        let count = this.state.reviews.length;
                                                        if (count < DEFAULT_COMMENT_COUNT) count = DEFAULT_COMMENT_COUNT;
                                                        else if (count > MAX_COMMENT_COUNT) count = MAX_COMMENT_COUNT;
                                                        this.loadReviewFromStart(count);
                                                    }}>
                                                    <Ionicons name='md-refresh-circle' color={Theme.color.selection} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                        }
                                    </View>
                                </View>

                                <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: Dimensions.get('window').width, marginTop: Theme.spacing.tiny }} />
                            </View>
                        </View>
                    }
                    data={reviews}
                    keyExtractor={item => item.comment.id}
                    renderItem={this.renderItem}
                    ItemSeparatorComponent={this.itemSeparatorComponent}
                    onScroll={({ nativeEvent }) => {
                        if (!this.focused) return;

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

    loadReviewFromStart(count) {
        this.setState({ reviews: null });
        // init
        this.originReviewList = undefined;
        this.translatedReviewList = undefined;

        this.setState({ isLoadingFeeds: true });

        this.commentStore.loadReviewFromStart(count);

        const { profile } = this.props.profileStore;
        this.count = profile.receivedCommentsCount;
    }

    @autobind
    renderItem({ item, index }): React.Node {
        const post = item.post;
        const _review = item.comment;

        const reporters = _review.reporters;
        if (!reporters || reporters.length === 0 || reporters.indexOf(Firebase.user().uid) === -1) {
            // show original
            return (
                this.renderReviewItemOrigin(post, _review, index)
            );
        } else {
            // show blocked image
            return (
                this.renderReviewItemBlocked(post, _review, index)
            );
        }
    }

    renderReviewItemOrigin(post, _review, index) {
        let picture = null;
        let placeName = 'Not specified';
        let placeColor = Theme.color.text4;
        let placeFont = "Roboto-Italic";
        let name = null;
        let avatarName = null;
        let avatarColor = 'black';
        let nameFontSize = 22;
        let nameLineHeight = 26;

        if (post) {
            picture = post.d.pictures.one.uri;
            placeName = post.d.placeName;
            if (placeName) {
                placeColor = Theme.color.text2;
                placeFont = "Roboto-Regular";
            }
            name = post.d.name;
            avatarName = Util.getAvatarName(name);
            avatarColor = Util.getAvatarColor(post.d.id);

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
        } else { // post removed
            // use original data
            picture = _review.picture;
            placeName = _review.placeName;
            if (placeName) {
                placeColor = Theme.color.text2;
                placeFont = "Roboto-Regular";
            }
            name = _review.name;
            avatarName = Util.getAvatarName(name);
            avatarColor = Util.getAvatarColor(_review.id);

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
        }

        let isMyComment = false;
        if (_review.uid === Firebase.user().uid) {
            isMyComment = true;
        }

        return (
            <View style={{ paddingHorizontal: Theme.spacing.base, paddingVertical: Theme.spacing.small }}>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>

                <View style={{ paddingBottom: 6 }}>
                    <TouchableOpacity activeOpacity={0.5}
                        onPress={() => {
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
                                !isMyComment &&
                                this.renderCommentReportButton(_review, index)
                            }
                        </View>

                        <Text style={{
                            marginTop: 4,
                            color: placeColor, fontSize: 14, fontFamily: placeFont
                        }}>
                            {placeName}
                        </Text>
                    </View>
                </View>
                {
                    isMyComment &&
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={{
                                // alignSelf: 'baseline'
                                width: 24, height: 24, justifyContent: "center", alignItems: "center"
                            }}
                            onPress={() => this.removeComment(index)}
                        >
                            <MaterialIcons name='close' color={'silver'} size={20} />
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    renderReviewItemBlocked(post, _review, index) {
        return (
            <TouchableOpacity activeOpacity={0.5}
                onPress={() => {
                    this.openDialog('Unblock Review', 'Are you sure you want to unblock ' + _review.name + '?', async () => {
                        const uid = Firebase.user().uid;
                        const result = await Firebase.unblockComment(uid, uid, _review.id);
                        if (!result) {
                            this.refs["toast"].show('The review has been removed by its owner.', 500);
                            return;
                        }

                        // reload comment
                        /*
                        let count = this.state.reviews.length;
                        if (count < DEFAULT_COMMENT_COUNT) count = DEFAULT_COMMENT_COUNT;
                        else if (count > MAX_COMMENT_COUNT) count = MAX_COMMENT_COUNT;
                        this.loadReviewFromStart(count);

                        // move scroll top
                        this._flatList.scrollToOffset({ offset: 0, animated: false });
                        */
                        this.showComment(index, uid);
                    });
                }}
            >
                {
                    this.renderReviewItemOrigin(post, _review, index)
                }

                <View style={[StyleSheet.absoluteFill, { marginHorizontal: 16, marginVertical: 9 }, {
                    borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                }]}>
                    <AntDesign style={{ marginBottom: 4 }} name='checkcircleo' color="#228B22" size={28} />
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

    hideComment(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.comment;
        if (!_review.reporters) {
            let reporters = [];
            reporters.push(uid);
            _review.reporters = reporters;
        } else {
            _review.reporters.push(uid);
        }

        this.setState({ reviews });
    }

    showComment(index, uid) {
        let reviews = this.state.reviews;
        let review = reviews[index];

        let _review = review.comment;

        const idx = _review.reporters.indexOf(uid);
        if (idx !== -1) _review.reporters.splice(idx, 1);

        this.setState({ reviews });
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingFeeds) return;

        if (this.commentStore.allReviewsLoaded) return;

        this.setState({ isLoadingFeeds: true });

        this.commentStore.loadReview(DEFAULT_COMMENT_COUNT);
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ alignSelf: 'center', width: Dimensions.get('window').width - 20 * 2, borderBottomColor: Theme.color.line, borderBottomWidth: 1 }} />
        );
    }

    @autobind
    renderListEmptyComponent() {
        const { profile } = this.props.profileStore;
        if (!profile) return null;

        // if (profile.receivedCommentsCount === 0) return this.renderEmptyImage();

        // const { reviews } = this.commentStore;
        // const loading = reviews === undefined;
        const { reviews } = this.state;
        const loading = reviews === null;

        if (loading) {
            // render skeleton

            const width = Dimensions.get('window').width - Theme.spacing.base * 2;

            let reviewArray = [];

            for (let i = 0; i < 4; i++) {
                reviewArray.push(
                    <View style={{ alignItems: 'center', paddingTop: 14 }} key={i}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={width} height={134 + 14}>
                            <Svg.Rect
                                x={width - 100}
                                y={10}
                                width={100}
                                height={6}
                            />
                            <Svg.Rect
                                x={0}
                                y={10 + 20}
                                width={'100%'}
                                height={8}
                            />
                            <Svg.Rect
                                x={0}
                                y={10 + 20 + 8 + 12}
                                width={'60%'}
                                height={8}
                            />
                            <Svg.Circle
                                cx={24}
                                cy={100}
                                r={24}
                            />
                            <Svg.Rect
                                x={24 * 2 + 16}
                                y={100 - 8 - 6}
                                width={80}
                                height={8}
                            />
                            <Svg.Rect
                                x={24 * 2 + 16}
                                y={100 + 6}
                                width={80}
                                height={8}
                            />
                        </SvgAnimatedLinearGradient>
                        {
                            i !== 3 &&
                            <View style={{ width: Dimensions.get('window').width - 20 * 2, borderBottomColor: Theme.color.line, borderBottomWidth: 1 }} />
                        }
                    </View>
                );
            }

            return (
                <View>
                    {reviewArray}
                </View>
            );
        }

        return this.renderEmptyImage();
    }

    renderEmptyImage() {
        return (
            // render illustration
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{
                    color: Theme.color.text2,
                    fontSize: 26,
                    lineHeight: 30,
                    fontFamily: "Chewy-Regular"
                }}>{Platform.OS === 'android' ? 'No customer reviews' : "No people's comments"}</Text>

                <Text style={{
                    marginTop: 8,
                    color: Theme.color.text3,
                    fontSize: 18,
                    lineHeight: 22,
                    fontFamily: "Chewy-Regular"
                }}>{Platform.OS === 'android' ? 'Stop expecting, start exploring' : 'Stop expecting, start accepting'}</Text>

                <Image
                    style={{
                        marginTop: 20,
                        width: Cons.stickerWidth,
                        height: Cons.stickerHeight,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.comments}
                />
            </View>
        );
    }

    renderCommentReportButton(review, index) {
        return (
            <TouchableOpacity
                style={{
                    width: 18,
                    height: 18,
                    marginLeft: 6,
                    justifyContent: "center", alignItems: "center"
                }}
                onPress={() => {
                    this.reportComment(review, index);
                }}
            >
                <Ionicons name='md-alert' color={Theme.color.text5} size={14} />
            </TouchableOpacity>
        );
    }

    reportComment(review, index) {
        this.openDialog('Report Review', 'Are you sure you want to report ' + review.name + '?', async () => {
            // report comment

            // 1. update database (reporters)
            const { profile } = this.props.profileStore;
            const uid = profile.uid;
            const result = await Firebase.reportComment(uid, uid, review.id);
            if (!result) {
                // the comment is removed
                this.refs["toast"].show('The review has been removed by its owner.', 500);
                return;
            }

            /*
            // reload comment
            let count = this.state.reviews.length;
            if (count < DEFAULT_COMMENT_COUNT) count = DEFAULT_COMMENT_COUNT;
            else if (count > MAX_COMMENT_COUNT) count = MAX_COMMENT_COUNT;
            this.loadReviewFromStart(count);

            // move scroll top
            this._flatList.scrollToOffset({ offset: 0, animated: false });
            */
            this.hideComment(index, uid);

            this.refs["toast"].show('Thanks for your feedback.', 500);
        });
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState({ refreshing: true });

        // reload from the start
        this.loadReviewFromStart(DEFAULT_COMMENT_COUNT);
    }

    translateReview(index) {
        let reviews = this.state.reviews;
        const comment = reviews[index].comment.comment;

        if (!this.translatedReviewList) this.translatedReviewList = [];

        const translatedReview = this.translatedReviewList[index];

        if (translatedReview) {
            this.originReviewList[index] = comment;

            reviews[index].comment.comment = translatedReview;
            this.setState({ reviews });
        } else {
            Util.translate(comment).then(translated => {
                console.log('jdub', 'translated', translated);

                this.originReviewList[index] = comment;

                reviews[index].comment.comment = translated;
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

        reviews[index].comment.comment = originReview;
        this.setState({ reviews });

        this.originReviewList[index] = null;
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
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
        // backgroundColor: 'green'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        // alignItems: 'center',
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1
    },
    titleContainer: {
        padding: Theme.spacing.small,
        flexDirection: 'row'
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    infoContainer: {
        flex: 1,
        // paddingBottom: Theme.spacing.tiny
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
    }
});
