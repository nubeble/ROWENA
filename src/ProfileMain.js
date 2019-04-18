import autobind from "autobind-decorator";
import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image, TouchableHighlight, TouchableWithoutFeedback } from 'react-native';
import { NavigationActions } from 'react-navigation';
import SmartImage from "./rnff/src/components/SmartImage";
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from "react-native-vector-icons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Text, Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Dialog from "react-native-dialog";
import Util from "./Util";
import ProfileStore from "./rnff/src/home/ProfileStore";

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 12; // 3 x 4

const avatarWidth = Dimensions.get('window').height / 11;


@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<InjectedProps> {
    state = {
        renderFeed: false,
        // showIndicator: false,

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,
        showPostIndicator: -1,

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

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
        this.countsUnsubscribes = [];
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.getUserFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('ProfileMain.handleHardwareBackPress');

        if (this.state.dialogVisible) {
            this.hideDialog();

            return true;
        }

        this.props.navigation.navigate("intro");

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'ProfileMain';

        const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getUserFeeds();

            // move scroll top
            // if (this._flatList) this._flatList.scrollToOffset({ offset: 0, animated: true });
        }

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    /*
    @autobind
    onScrollHandler() {
        console.log('ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }
    */

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

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

    getUserFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        const feeds = profile.feeds;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });

            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.onLoading = true;

        console.log('ProfileMain', 'loading feeds...');

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

            const value = feeds[i];

            // if (!value.valid) continue;

            newFeeds.push(value);

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({
                // isLoadingFeeds: false, feeds: newFeeds, refreshing: false
                isLoadingFeeds: false,
                feeds: newFeeds, // refreshing: false
            });
        } else {
            this.setState({
                // isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds], refreshing: false
                isLoadingFeeds: false,
                feeds: [...this.state.feeds, ...newFeeds], // refreshing: false
            });
        }

        /*
        setTimeout(() => {
            this.setState({ isLoadingFeeds: false });
        }, 1000);
        */

        console.log('ProfileMain', 'loading feeds done!');

        this.onLoading = false;
    }

    async postClick(item) {
        if (item.newReviewAdded) {
            // update newReviewAdded in user profile
            const { profile } = this.props.profileStore;
            // await Firebase.updateReviewChecked(profile.uid, item.placeId, item.feedId, false);
            const result = Firebase.updateReviewChecked(profile.uid, item.placeId, item.feedId, false);
            if (!result) {
                // ToDo: toast
                return;
            }

            // update state
            let feeds = [...this.state.feeds];
            const index = feeds.findIndex(el => el.placeId === item.placeId && el.feedId === item.feedId);
            if (index !== -1) {
                let feed = feeds[index];
                feed.newReviewAdded = false;
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

    render() {
        const { profile } = this.props.profileStore;

        const avatarName = (profile.name) ? profile.name : 'Anonymous'; // ToDo: test
        const imageUri = profile.picture.uri;

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>

                    <TouchableOpacity activeOpacity={1.0}
                        onPress={() => this.openAdmin()}
                    >
                        <Text
                            style={{
                                color: Theme.color.text1,
                                fontSize: 20,
                                fontFamily: "Roboto-Medium",
                                alignSelf: 'flex-start',
                                marginLeft: 16
                            }}
                        >Profile</Text>
                    </TouchableOpacity>

                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <View>
                                <View style={styles.infoContainer}>
                                    {/* avatar view */}
                                    <TouchableHighlight
                                        style={{ marginTop: 20 }}
                                        onPress={() => {
                                            setTimeout(() => {
                                                this.props.navigation.navigate("edit");
                                            }, Cons.buttonTimeoutShort);
                                        }}
                                    >
                                        <View style={{
                                            width: '100%', height: Dimensions.get('window').height / 8,
                                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <View style={{ width: '70%', height: '100%', justifyContent: 'center', paddingLeft: 22 }}>
                                                <Text style={{ paddingTop: 4, color: Theme.color.text2, fontSize: 24, fontFamily: "Roboto-Medium" }}>{avatarName}</Text>
                                                <Text style={{ marginTop: Dimensions.get('window').height / 80, color: Theme.color.text3, fontSize: 16, fontFamily: "Roboto-Light" }}>View and edit profile</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    width: avatarWidth, height: avatarWidth,
                                                    marginRight: 22, justifyContent: 'center', alignItems: 'center'
                                                }}
                                                onPress={() => {
                                                    setTimeout(() => {
                                                        // ToDo: open picture

                                                    }, Cons.buttonTimeoutShort);
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
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableHighlight>

                                    <View style={{ width: '100%', paddingHorizontal: 20 }}>
                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* See my ratings & reviews */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setTimeout(() => {
                                                    this.props.navigation.navigate("check");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{"Girls You've Reviewed"}</Text>
                                                <AntDesign name='staro' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Advertise myself or my friends */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setTimeout(() => {
                                                    this.props.navigation.navigate("advertisement");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{'Advertise Yourself or Your Girls'}</Text>
                                                <Feather name='edit-3' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Log out */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.openDialog('alert', 'Log out', 'Are you sure you want to remove all data from this device?', async () => {

                                                    // ToDo: block now
                                                    return;

                                                    // 1. remove all created feeds (place - feed)
                                                    const { profile } = this.props.profileStore;
                                                    const feeds = profile.feeds;
                                                    const length = feeds.length;

                                                    for (var i = 0; i < length; i++) {
                                                        const feed = feeds[i];
                                                        await Firebase.removeFeed(profile.uid, feed.placeId, feed.feedId);
                                                    }

                                                    // 2. remove database (user profile & comments collection)
                                                    await Firebase.deleteProfile(profile.uid);

                                                    // 3. remove token

                                                    // 4. remove auth

                                                    // 5. move to auth main

                                                });

                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "Roboto-Regular" }}>{'Log Out'}</Text>
                                                <AntDesign name='logout' color={Theme.color.text2} size={22} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                                    </View>

                                    {/*
                                    <View style={{
                                        // backgroundColor: 'green',
                                        width: '100%',
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: '#123456'
                                        // position: "absolute", top: baselineTop + 120, left: 0
                                    }}
                                    >
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>20</Text>
                                            <Text style={styles.infoText2}>reviews</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>0</Text>
                                            <Text style={styles.infoText2}>posts</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>Weight</Text>
                                            <Text style={styles.infoText2}>48</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderLeftWidth: 5,
                                                borderLeftColor: Theme.color.line,
                                                //height: bodyInfoItemHeight * 0.5
                                            }}
                                        />
                                        <View style={{
                                            backgroundColor: Theme.color.component, width: bodyInfoItemWidth, height: bodyInfoItemHeight,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={styles.infoText1}>Bust Size</Text>
                                            <Text style={styles.infoText2}>C</Text>
                                        </View>
                                    </View>
                                    */}

                                </View>
                                {
                                    (this.state.totalFeedsSize > 0) &&
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>Your post ({this.state.totalFeedsSize})</Text>
                                    </View>
                                }
                            </View>
                        }
                        columnWrapperStyle={styles.columnWrapperStyle}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
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
                                        {/*
                                            <View style={styles.content}>
                                                <Text style={{
                                                    textAlign: 'center',
                                                    fontWeight: '500',
                                                    color: "white",
                                                    fontSize: 21,
                                                    // flexWrap: "wrap"
                                                }}>{item.city}</Text>
                                            </View>
                                            */}
                                        {
                                            item.newReviewAdded &&
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
                                                {/*
                                                <RefreshIndicator refreshing total={3} size={4} />
                                                */}
                                            </View>
                                        }
                                    </View>
                                </TouchableWithoutFeedback>
                            );
                        }}
                        // onEndReachedThreshold={0.5}
                        // onEndReached={this.onScrollHandler}
                        onScroll={({ nativeEvent }) => {
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getUserFeeds();
                            }
                        }}
                        // scrollEventThrottle={1}

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                    /*
                    ListFooterComponent={
                        this.state.isLoadingFeeds &&
                        <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator />
                        </View>
                    }
                    */
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
    } // end of render()

    handleRefresh = () => {
        /*
        if (this.onLoading) return;

        this.setState(
            {
                refreshing: true
            },
            () => {
                if (Vars.userFeedsChanged) Vars.userFeedsChanged = false;

                // reload from the start
                this.lastChangedTime = 0;
                this.getUserFeeds();
            }
        );
        */

        // if (this.state.isLoadingFeeds) return;

        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getUserFeeds();

        // if (Vars.userFeedsChanged) Vars.userFeedsChanged = false;

        !this.closed && this.setState({ refreshing: false });
    }

    // open admin menu
    openAdmin() {
        if (!this.adminCount) {
            this.adminCount = 1;

            return;
        } else {
            this.adminCount++;
        }

        if (this.adminCount > 9) {
            // open pw menu
            this.openDialog('pad', 'Admin Login', 'Type an administrator password', null);

            this.adminCount = undefined;
        }
    }

    openDialog(type, title, message, callback) {
        this.setState({ dialogType: type, dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        // --
        if (this.state.dialogType === 'pad') this.setState({ dialogPassword: '' });
        // --

        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        // --
        if (this.state.dialogType === 'pad') {
            const pw = this.state.dialogPassword;
            if (pw === '1103') {

                setTimeout(() => {
                    this.props.navigation.navigate("admin");
                }, Cons.buttonTimeoutShort);
            }

            this.setState({ dialogPassword: '' });
        }
        // --

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
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        paddingBottom: 4,
        flexDirection: 'column',
        justifyContent: 'flex-end'
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
        color: 'white',
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
    }
});
