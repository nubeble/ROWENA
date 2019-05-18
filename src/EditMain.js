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
        // renderFeed: false,

        isLoadingFeeds: false,
        refreshing: false,

        host: null,
        guest: null,

        focused: false
    };

    constructor(props) {
        super(props);

        this.opponentUserUnsubscribe = null;
    }

    componentDidMount() {
        console.log('EditMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        const { profile } = this.props.profileStore;
        if (profile) {
            const uid = profile.uid;
            const receivedCommentsCount = profile.receivedCommentsCount;

            this.commentStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

            const query = Firebase.firestore.collection("users").doc(uid).collection("comments").orderBy("timestamp", "desc");
            this.commentStore.init(query, DEFAULT_REVIEW_COUNT);
        }

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
        */
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

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    render() {
        const { profile } = this.props.profileStore;

        let avatarName = 'Anonymous';
        let address = "No address registered";
        let count = 0;
        let picture = null;
        let dateText = null;

        // ToDo: use age, gender, note
        let age = '20';
        let gender = 'Female';
        let note = 'hi';

        if (profile) {
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
        }

        let reviewText = '';
        if (count === 0) {
            reviewText = 'No host reviews yet';
        } else if (count === 1) {
            reviewText = ' 1 review';
        } else {
            reviewText = count.toString() + " reviews";
        }

        let labelText = null;
        if (count === 0) {
            labelText = 'No reviews from hosts';
        } else if (count === 1) {
            labelText = count.toString() + ' review from hosts';
        } else if (count > 1) {
            labelText = count.toString() + ' reviews from hosts';
        }

        const { reviews } = this.commentStore;

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

                {
                    // this.state.renderFeed &&
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
                                                <Text style={{ marginTop: Cons.badgeWidth / 2, paddingTop: 4, fontSize: 24, color: Theme.color.text2, fontFamily: "Roboto-Medium" }}>
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
                                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                            uri={picture}
                                                            showSpinner={false}
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

                                                this.borderY = y;
                                            }}
                                        />
                                    </View>
                                </View>
                                {
                                    labelText &&
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>{labelText}</Text>
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
        const receivedCommentsCount = profile.receivedCommentsCount;
        if (receivedCommentsCount === 0) return null;

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
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    },
    infoContainer: {
        flex: 1,
        // width: '100%',
        paddingBottom: Theme.spacing.tiny
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
