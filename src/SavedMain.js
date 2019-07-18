import React from 'react';
import {
    StyleSheet, View, TouchableWithoutFeedback, TouchableHighlight, Image, BackHandler, Dimensions, FlatList,
    TouchableOpacity, Platform, ActivityIndicator
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import PreloadImage from './PreloadImage';
import SmartImage from "./rnff/src/components/SmartImage";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import autobind from 'autobind-decorator';
import { Text, Theme, RefreshIndicator } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { AirbnbRating } from './react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";
import { LinearGradient } from 'expo-linear-gradient';
import Dialog from "react-native-dialog";

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 6;


@inject("profileStore")
@observer
export default class SavedMain extends React.Component<InjectedProps> {
    state = {
        feeds: [],
        isLoadingFeeds: false,
        loadingType: 0, // 0: none, 100: center, 200: down
        refreshing: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: ''
    };

    constructor(props) {
        super(props);

        this.map = {}; // place id : feed list
        this.order = []; // place id

        this.lastLoadedFeedIndex = -1;
        // this.lastChangedTime = 0;
    }

    initMap() {
        this.map = {};
        this.order = [];
    }

    addValue(key, value) {
        if (!this.map[key]) {
            this.map[key] = [];

            this.order.push(key);
        }

        this.map[key].push(value);
    }

    getValue(key) {
        return this.map[key];
    }

    componentDidMount() {
        console.log('SavedMain.componentDidMount');

        this.props.navigation.setParams({
            scrollToTop: () => {
                this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        });

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        // this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.props.profileStore.setLikesUpdatedCallback(this.onLikesUpdated);

        // reload from the start
        this.getPlaces();

        this.lastLoadedFeedIndex = -1;
        this.drawPlaces();
    }

    componentWillUnmount() {
        console.log('SavedMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.props.profileStore.unsetLikesUpdatedCallback(this.onLikesUpdated);

        this.closed = true;
    }

    @autobind
    handleHardwareBackPress() {
        console.log('SavedMain.handleHardwareBackPress');

        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onLikesUpdated() {
        console.log('SavedMain.onLikesUpdated');

        // reload from the start
        this.getPlaces();

        this.lastLoadedFeedIndex = -1;
        this.drawPlaces();
    }

    @autobind
    onFocus() {
        // console.log('SavedMain.onFocus');

        Vars.focusedScreen = 'SavedMain';

        /*
        const lastChangedTime = this.props.profileStore.lastTimeLikesUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.getPlaces();

            this.lastLoadedFeedIndex = -1;
            this.drawPlaces();
        }
        */

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

    getPlaces() {
        // console.log('getPlaces()');

        this.initMap();

        const { profile } = this.props.profileStore;

        const likes = profile.likes;
        const length = likes.length;

        console.log('SavedMain.getPlaces()', length);

        if (length === 0) return;

        for (let i = length - 1; i >= 0; i--) {
            const like = likes[i];
            const placeId = like.placeId;

            this.addValue(placeId, like);
        }
    }

    drawPlaces() { // set state feeds
        if (this.state.isLoadingFeeds) return;

        if (this.order.length === 0) {
            !this.closed && this.setState({ feeds: [] });
            return;
        }

        // all loaded
        if (this.lastLoadedFeedIndex >= this.order.length - 1) return;

        console.log('SavedMain', 'loading feeds ...');

        let newFeeds = [];

        let reload = false;
        let startIndex = 0;
        if (this.lastLoadedFeedIndex === -1) {
            reload = true;
            startIndex = 0;

            this.setState({ isLoadingFeeds: true, loadingType: 100 });
        } else {
            startIndex = this.lastLoadedFeedIndex + 1;

            this.setState({ isLoadingFeeds: true, loadingType: 200 });
        }

        let count = 0;

        for (let i = startIndex; i < this.order.length; i++) {
            if (count >= DEFAULT_FEED_COUNT) break;

            const placeId = this.order[i];

            // no need to subscribe
            const feeds = this.getValue(placeId);
            const feedsSize = feeds.length;
            const pictures = this.getPictures(feeds);

            const _placeName = feeds[0].placeName;
            const _placeId = feeds[0].placeId;

            const newFeed = {
                feeds, // array


                feedsSize,
                placeName: _placeName, // city, state, country | city, country
                pictures,
                placeId: _placeId
            };

            newFeeds.push(newFeed);

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (reload)
            this.setState({ feeds: newFeeds });
        else
            this.setState({ feeds: [...this.state.feeds, ...newFeeds] });

        console.log('SavedMain', 'loading feeds done!');

        setTimeout(() => {
            !this.closed && this.setState({ isLoadingFeeds: false, loadingType: 0 });
        }, 250);
    }

    getPictures(feeds) {
        let pictures = [];

        let count = 0;
        for (let i = 0; i < feeds.length; i++) {
            if (count >= 4) break;

            const picture = feeds[i].picture;
            pictures.push(picture);
            count++;
        }

        // console.log('pictures length', pictures.length);

        return pictures;
    }

    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        marginLeft: 16
                    }}>Saved</Text>
                </View>

                <FlatList
                    ref={(fl) => {
                        this._flatList = fl;
                    }}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}

                    data={this.state.feeds}
                    keyExtractor={item => item.placeId}
                    renderItem={({ item, index }) => {
                        const placeName = item.placeName;

                        let city = null;
                        const words = placeName.split(', ');
                        city = words[0];

                        const feedsSize = item.feedsSize;

                        if (item.pictures.length === 1) {
                            return (
                                <TouchableOpacity activeOpacity={0.5}
                                    onPress={() => this.onPressItem(item.placeId, city)}
                                    onLongPress={() => this.onLongPressItem(item.feeds, city)}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={styles.picture}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[0]}
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                            start={[0, 0]}
                                            end={[0, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{placeName}
                                                <Text style={[styles.feedItemText, { color: Theme.color.subtitle }]}> {feedsSize}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        } else if (item.pictures.length === 2) {
                            return (
                                <TouchableOpacity activeOpacity={0.5}
                                    onPress={() => this.onPressItem(item.placeId, city)}
                                    onLongPress={() => this.onLongPressItem(item.feeds, city)}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '100%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                left: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[0]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '100%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                right: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[1]}
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                            start={[0, 0]}
                                            end={[0, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{placeName}
                                                <Text style={[styles.feedItemText, { color: Theme.color.text4 }]}> {feedsSize}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        } else if (item.pictures.length === 3) {
                            return (
                                <TouchableOpacity activeOpacity={0.5}
                                    onPress={() => this.onPressItem(item.placeId, city)}
                                    onLongPress={() => this.onLongPressItem(item.feeds, city)}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '100%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                left: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[0]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                right: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[1]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                right: 0,
                                                bottom: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[2]}
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                            start={[0, 0]}
                                            end={[0, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{placeName}
                                                <Text style={[styles.feedItemText, { color: Theme.color.text4 }]}> {feedsSize}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        } else if (item.pictures.length === 4) {
                            return (
                                <TouchableOpacity activeOpacity={0.5}
                                    onPress={() => this.onPressItem(item.placeId, city)}
                                    onLongPress={() => this.onLongPressItem(item.feeds, city)}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                left: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[0]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                right: 0,
                                                top: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[1]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                left: 0,
                                                bottom: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[2]}
                                        />
                                        <SmartImage
                                            style={{
                                                width: '50%',
                                                height: '50%',
                                                borderRadius: 2,
                                                position: 'absolute',
                                                right: 0,
                                                bottom: 0
                                            }}
                                            showSpinner={false}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={item.pictures[3]}
                                        />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                            start={[0, 0]}
                                            end={[0, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                            <Text style={styles.feedItemText}>{placeName}
                                                <Text style={[styles.feedItemText, { color: Theme.color.text4 }]}> {feedsSize}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <View style={styles.pictureContainer}>
                                    <SmartImage
                                        style={styles.picture}
                                        showSpinner={false}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                    />
                                </View>
                            );
                        }
                    }}
                    // onEndReachedThreshold={0.5}
                    // onEndReached={this.handleScrollEnd}
                    onScroll={({ nativeEvent }) => {
                        if (!this.focused) return;

                        if (this.isCloseToBottom(nativeEvent)) {
                            this.drawPlaces();
                        }
                    }}
                    // scrollEventThrottle={1}

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}

                    ListFooterComponent={
                        this.state.isLoadingFeeds && this.state.loadingType === 200 &&
                        <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                        </View>
                    }

                    ListEmptyComponent={
                        // render illustration
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
                            <Text style={{
                                marginTop: 100,
                                color: Theme.color.text2,
                                fontSize: 28,
                                lineHeight: 32,
                                fontFamily: "Chewy-Regular"
                            }}>No selected girls</Text>

                            <Text style={{
                                marginTop: 10,
                                color: Theme.color.text3,
                                fontSize: 20,
                                lineHeight: 24,
                                fontFamily: "Chewy-Regular"
                            }}>Start exploring girls for your next trip</Text>

                            <Image
                                style={{
                                    marginTop: 30,
                                    width: Cons.stickerWidth,
                                    height: Cons.stickerHeight,
                                    resizeMode: 'cover'
                                }}
                                source={PreloadImage.explore}
                            />
                        </View>
                    }
                />

                {
                    this.state.isLoadingFeeds && this.state.loadingType === 100 &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
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

    onPressItem(placeId, city) {
        this.props.navigation.navigate("savedPlace", { placeId: placeId, city: city });
    }

    onLongPressItem(feeds, city) {
        this.openDialog('Remove likes', "Are you sure you want to remove all your likes from " + city + "?", async () => {
            // ToDo: toast?

            const uid = Firebase.user().uid;
            await Firebase.removeLikes(feeds, uid);
        });
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.getPlaces();

        this.lastLoadedFeedIndex = -1;
        this.drawPlaces();

        !this.closed && this.setState({ refreshing: false });
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
    },
    searchBar: {
        height: Cons.searchBarHeight,
        // paddingBottom: 8,
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    pictureContainer: {
        // 3:2 image
        width: (Dimensions.get('window').width - Theme.spacing.small * 2),
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 3 * 2,
        borderRadius: 2,
        marginVertical: Theme.spacing.small,
        marginHorizontal: Theme.spacing.small
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
    },
    feedItemText: {
        color: Theme.color.title,
        fontSize: 18,
        fontFamily: "Roboto-Medium",
        paddingHorizontal: 2,
        /*
        textShadowColor: 'black',
        textShadowOffset: { width: -0.3, height: -0.3 },
        textShadowRadius: Platform.OS === 'android' ? 10 : 4
        */
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    new: {
        color: 'white',
        fontSize: 13,
        lineHeight: 13,
        fontFamily: "Roboto-Bold",
        // backgroundColor: 'grey'
    }
});
