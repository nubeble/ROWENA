import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';

import moment from "moment";
import {
    Animated, Platform, Dimensions, StatusBar, FlatList,
    ActivityIndicator, Keyboard, TextInput, TouchableWithoutFeedback
} from "react-native";

import { Constants, Svg } from "expo";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
// import Ionicons from "react-native-vector-icons/Ionicons";
import Toast, { DURATION } from 'react-native-easy-toast';
import Dialog from "react-native-dialog";
// import { sendPushNotification } from './PushNotifications';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import ProfileStore from "./rnff/src/home/ProfileStore";
import { inject, observer } from "mobx-react/native";

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 12; // 3 x 4


@inject("profileStore")
@observer
export default class CheckMain extends React.Component<InjectedProps> {
    state = {
        renderFeed: false,
        // showIndicator: false,

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert',
        dialogPassword: ''
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
        this.onLoading = false;

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    componentDidMount() {
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.getReviewedFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'CheckMain';

        const lastChangedTime = this.props.profileStore.lastTimeReviewsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getReviewedFeeds();

            // move scroll top
            // if (this._flatList) this._flatList.scrollToOffset({ offset: 0, animated: true });
        }

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    @autobind
    handleHardwareBackPress() {
        console.log('CheckMain.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        this.onFocusListener.remove();
        this.onBlurListener.remove();
        this.hardwareBackPressListener.remove();

        for (var i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        for (var i = 0; i < this.countsUnsubscribes.length; i++) {
            const instance = this.countsUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    render() {
        // const { profile } = this.props.profileStore;

        return (
            <View style={styles.flex}>
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
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        columnWrapperStyle={{ flex: 1, justifyContent: 'flex-start' }}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.reviewId}
                        renderItem={({ item, index }) => {

                            // red dot
                            const badgeWidth = Math.round(Dimensions.get('window').height / 100) + 1;

                            return (
                                <TouchableWithoutFeedback onPress={async () => await this.postClick(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.picture}
                                        />
                                        {
                                            item.replyAdded &&
                                            <View style={{
                                                position: 'absolute',
                                                top: 3,
                                                right: 3,
                                                backgroundColor: 'red',
                                                borderRadius: badgeWidth / 2,
                                                width: badgeWidth,
                                                height: badgeWidth
                                            }} />
                                        }
                                        {
                                            this.state.showPostIndicator === index &&
                                            <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: 'center', alignItems: 'center' }}>
                                                <ActivityIndicator animating size={'small'} color={'white'} />
                                            </View>
                                        }
                                    </View>
                                </TouchableWithoutFeedback>
                            );

                        }}
                        onScroll={({ nativeEvent }) => {
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getReviewedFeeds();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}


                        ListHeaderComponent={
                            (this.state.totalFeedsSize > 0) &&
                            <View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>Your girls ({this.state.totalFeedsSize})</Text>
                                </View>
                            </View>
                        }


                    />
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />

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
    }

    getReviewedFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        const reviews = profile.reviews;
        const length = reviews.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });

            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeReviewsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.onLoading = true;

        console.log('CheckMain', 'loading feeds...');

        this.setState({ isLoadingFeeds: true });

        let newFeeds = [];

        let startIndex = 0;
        if (this.reload) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (var i = startIndex; i >= 0; i--) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const value = reviews[i];

            newFeeds.push(value);

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({ isLoadingFeeds: false, feeds: newFeeds });
        } else {
            this.setState({ isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds] });
        }

        console.log('CheckMain', 'loading feeds done!');

        this.onLoading = false;
    }

    async postClick(item) {
        if (item.replyAdded) {
            // update replyAdded in user profile
            const { profile } = this.props.profileStore;
            /*
            const result = await Firebase.updateReplyChecked(item.placeId, item.feedId, profile.uid, item.reviewId, false);
            if (!result) {
                // ToDo: toast
                this.refs["toast"].show('The user no longer exists.', 500);

                return;
            }
            */
            Firebase.updateReplyChecked(item.placeId, item.feedId, profile.uid, item.reviewId, false);

            // update state
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId && el.reviewId === item.reviewId);
            if (index !== -1) {
                let feed = feeds[index];
                feed.replyAdded = false;
                feeds[index] = feed;
                !this.closed && this.setState({ feeds });
            }
        }

        await this.openPost(item);
    }

    async openPost(item) {
        // show indicator
        const feeds = [...this.state.feeds];
        const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
        if (index !== -1) {
            !this.closed && this.setState({ showPostIndicator: index });
        }

        const post = await this.getPost(item);

        if (!post) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);

            // we skip here. It'll update state feeds on onfocus event.

            return;
        }

        const feedSize = await this.getFeedSize(item.placeId);

        const extra = {
            feedSize: feedSize
        };

        // setTimeout(async () => {
        this.props.navigation.navigate("postPreview", { post: post, extra: extra, from: 'Profile' });
        // }, Cons.buttonTimeoutShort);

        // hide indicator
        !this.closed && this.setState({ showPostIndicator: -1 });
    }

    async getPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;

        if (this.feedList.has(feedId)) { // for now, use only feed id (no need place id)
            console.log('post from memory');
            return this.feedList.get(feedId);
        }

        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (!feedDoc.exists) return null;

        const post = feedDoc.data();

        this.feedList.set(feedId, post);

        // subscribe here
        // --
        const instance = Firebase.subscribeToFeed(placeId, feedId, newFeed => {
            if (newFeed === undefined) { // newFeed === undefined if removed
                this.feedList.delete(feedId);

                return;
            }

            // update this.feedList
            this.feedList.set(feedId, newFeed);
        });

        this.feedsUnsubscribes.push(instance);
        // --

        return post;
    }

    async getFeedSize(placeId) {
        if (this.feedCountList.has(placeId)) {
            console.log('count from memory');
            return this.feedCountList.get(placeId);
        }

        const placeDoc = await Firebase.firestore.collection("place").doc(placeId).get();
        // if (!placeDoc.exists) return 0; // never happen

        const count = placeDoc.data().count;

        this.feedCountList.set(placeId, count);

        // subscribe here
        // --
        const instance = Firebase.subscribeToPlace(placeId, newPlace => {
            if (newPlace === undefined) {
                this.feedCountList.delete(placeId);

                return;
            }

            // update this.feedCountList
            this.feedCountList.set(placeId, newPlace.count);
        });

        this.countsUnsubscribes.push(instance);
        // --

        return count;
    }

    handleRefresh = () => {
        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getReviewedFeeds();

        !this.closed && this.setState({ refreshing: false });
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        // backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.base,
        // paddingBottom: Theme.spacing.small,
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
    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium"
    }
});
