import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, Dimensions, BackHandler, Animated,
    FlatList, Image, TextInput
} from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons, Feather, MaterialCommunityIcons, MaterialIcons } from "react-native-vector-icons";
import SmartImage from './rnff/src/components/SmartImage';
import { Svg, Constants } from 'expo';
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

const DEFAULT_REVIEW_COUNT = 6;

const avatarWidth = Dimensions.get('window').height / 11;
const profilePictureWidth = Dimensions.get('window').height / 12;
// const replyViewHeight = Dimensions.get('window').height / 9;

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore")
@observer // for commentStore
export default class EditMain extends React.Component<InjectedProps> {
    commentStore: CommentStore = new CommentStore();

    state = {
        isLoadingFeeds: false,
        refreshing: false
    };

    componentDidMount() {
        console.log('EditMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { profile } = this.props.profileStore;

        const uid = profile.uid;
        // const receivedCommentsCount = profile.receivedCommentsCount;

        this.commentStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        const query = Firebase.firestore.collection("users").doc(uid).collection("comments").orderBy("timestamp", "desc");
        this.commentStore.init(query, DEFAULT_REVIEW_COUNT);
    }

    @autobind
    onAddToReviewFinished() {
        console.log('EditMain.onAddToReviewFinished');

        !this.closed && this.setState({ isLoadingFeeds: false, refreshing: false });
    }

    @autobind
    handleHardwareBackPress() {
        console.log('EditMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'EditMain';

        this.focused = true;
    }

    @autobind
    onBlur() {
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

        this.closed = true;
    }

    render() {
        const { profile } = this.props.profileStore;
        if (!profile) return null;

        let avatarName = 'Anonymous';
        let address = "No address registered";
        let count = 0;
        let picture = null;
        let dateText = null;

        // ToDo: use age, gender, note
        let age = '20';
        let gender = 'Female';
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
        if (profile.place) address = profile.place;
        count = profile.receivedCommentsCount;
        picture = profile.picture.uri;
        dateText = Util.getJoinedDate(profile.timestamp); // 'Joined in September 26, 2018'

        if (profile.birthday) age = Util.getAge(profile.birthday);
        gender = profile.gender;
        note = profile.about;

        let _avatarName = '';
        let _avatarColor = 'black';

        if (!picture) {
            _avatarName = Util.getAvatarName(name);
            _avatarColor = Util.getAvatarColor(profile.uid);
        }

        let reviewText = '';
        if (count === 0) {
            reviewText = 'No customer reviews yet';
        } else if (count === 1) {
            reviewText = '1 customer review';
        } else {
            reviewText = count.toString() + " customer reviews";
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

        const { reviews } = this.commentStore;

        // check comment store update
        let showReloadCommentsButton = false;
        if (this.count === undefined) {
            // console.log('set this.count');
            this.count = count;
        } else {
            if (this.count !== count) {
                // console.log('show reload comment store');
                showReloadCommentsButton = true;
            }
        }

        return (
            <View style={[styles.flex, { paddingBottom: Cons.viewMarginBottom() }]}>
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
                                <View style={{ marginTop: 20 }}>
                                    <View style={{
                                        width: '100%', height: Dimensions.get('window').height / 8,
                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                            <Text style={{ marginTop: Cons.redDotWidth / 2, paddingTop: 4, fontSize: 24, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
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
                                                        <Text style={{ color: 'white', fontSize: 28, lineHeight: 32, fontFamily: "Roboto-Medium" }}>
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
                                        <Text style={{ marginLeft: 12, fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Light" }}>{address}</Text>
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
                                                        // reload
                                                        if (this.state.isLoadingFeeds) return;
                                                        this.setState({ isLoadingFeeds: true });
                                                        this.commentStore.loadReviewFromTheStart();

                                                        const { profile } = this.props.profileStore;
                                                        this.count = profile.receivedCommentsCount;
                                                    }}>
                                                    <Ionicons name='md-refresh-circle' color={Theme.color.selection} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                        }
                                    </View>

                                    <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny }}
                                        onLayout={(event) => {
                                            const { x, y, width, height } = event.nativeEvent.layout;

                                            this.borderY = y;
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    }
                    // columnWrapperStyle={styles.columnWrapperStyle}
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
            </View>
        );
    }

    @autobind
    renderItem({ item, index }): React.Node {
        const post = item.post;
        const _review = item.comment;

        let picture = null;
        let placeName = null;
        let name = null;

        if (post) {
            picture = post.pictures.one.uri;
            placeName = post.placeName;
            name = post.name;
        } else {
            // ToDo: tmp
            picture = _review.picture;
            placeName = _review.place;
            name = _review.name;
        }

        let isMyComment = false;
        if (_review.uid === Firebase.user().uid) {
            isMyComment = true;
        }

        let avatarName = '';
        let avatarColor = 'black';
        if (!picture) {
            avatarName = Util.getAvatarName(name);
            avatarColor = Util.getAvatarColor(post.id);
        }

        return (
            <View style={{ paddingHorizontal: Theme.spacing.base, paddingVertical: Theme.spacing.small }}>

                <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                <Text style={styles.reviewText}>{_review.comment}</Text>
                {/*}
                <Text style={styles.reviewText}>{tmp}</Text>
                */}

                <View style={{ marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.xSmall, flexDirection: 'row', alignItems: 'center' }}>
                    {
                        picture ?
                            <SmartImage
                                style={{ width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2 }}
                                showSpinner={false}
                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={picture}
                            />
                            :
                            /*
                            <Image
                                style={{
                                    backgroundColor: 'black',
                                    width: profilePictureWidth, height: profilePictureWidth,
                                    borderRadius: profilePictureWidth / 2,
                                    resizeMode: 'cover'
                                }}
                                source={PreloadImage.user}
                            />
                            */
                            <View
                                style={{
                                    width: profilePictureWidth, height: profilePictureWidth, borderRadius: profilePictureWidth / 2,
                                    backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 28, lineHeight: 32, fontFamily: "Roboto-Medium" }}>
                                    {avatarName}
                                </Text>
                            </View>
                    }
                    <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
                        <Text style={{ color: Theme.color.text2, fontSize: 13, fontFamily: "Roboto-Regular" }}>
                            {name}</Text>
                        <Text style={{
                            marginTop: 4,
                            color: Theme.color.text2, fontSize: 13, fontFamily: "Roboto-Regular"
                        }}>{placeName}</Text>
                    </View>
                </View>
                {
                    isMyComment && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                onPress={() => this.removeComment(index)}
                            >
                                {/*
                                <Text style={{ marginLeft: 4, fontFamily: "Roboto-Regular", color: "silver", fontSize: 14 }}>Delete</Text>
                                */}
                                <MaterialIcons name='close' color={'silver'} size={20} />
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
        const { profile } = this.props.profileStore;
        if (!profile) return null;

        // const receivedCommentsCount = profile.receivedCommentsCount;
        // if (receivedCommentsCount === 0) return null;
        // if (receivedCommentsCount === 0) return this.renderEmptyImage();

        const { reviews } = this.commentStore;

        const loading = reviews === undefined;

        if (loading) {
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
                <View style={{ paddingVertical: Theme.spacing.small, paddingHorizontal: 20 }}>
                    {reviewArray}
                </View>
            );
        }

        return this.renderEmptyImage();
    }

    renderEmptyImage() {
        return (
            // ToDo: render design
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{
                    // color: Theme.color.text2,
                    color: 'rgb(247, 178, 57)',
                    fontSize: 24,
                    paddingTop: 4,
                    fontFamily: "Roboto-Medium"
                }}>No customer reviews yet</Text>

                {/*
                <Text style={{
                    marginTop: 10,
                    color: Theme.color.text3,
                    fontSize: 18,
                    fontFamily: "Roboto-Medium"
                }}>Start exploring girls for your next trip</Text>
                */}

                <Image
                    style={{
                        marginTop: 20,
                        width: 200 / 510 * 600,
                        height: 200,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.find}
                />
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
    contentContainer: {
        flexGrow: 1
    },
    columnWrapperStyle: {
        flex: 1,
        // justifyContent: 'center'
        justifyContent: 'flex-start'
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
        fontSize: 13,
        fontFamily: "Roboto-Light"
    },
    reviewText: {
        color: Theme.color.text2,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "Roboto-Regular",

        paddingVertical: Theme.spacing.tiny
    }
});
