import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, BackHandler, Image,
    Dimensions, FlatList, ActivityIndicator, TouchableWithoutFeedback
} from "react-native";
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import Toast, { DURATION } from 'react-native-easy-toast';
import Dialog from "react-native-dialog";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';

type InjectedProps = {
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 12; // 3 x 4

// 1:1
const illustHeight = 340;
const illustWidth = 340;


@inject("profileStore")
@observer
export default class CommentMain extends React.Component<InjectedProps> {
    state = {
        // renderFeed: false,
        feeds: [], // customers profile
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,
        // showPostIndicator: -1,

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

        this.customerList = new Map();
        this.customersUnsubscribes = [];
    }

    componentDidMount() {
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        this.getCommentedFeeds();

        /*
        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
        */
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'CommentMain';

        const lastChangedTime = this.props.profileStore.lastTimeCommentsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start
            this.getCommentedFeeds();

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
        console.log('CommentMain.handleHardwareBackPress');
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

        for (var i = 0; i < this.customersUnsubscribes.length; i++) {
            const instance = this.customersUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    render() {
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
                    // this.state.renderFeed &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        columnWrapperStyle={{ flex: 1, justifyContent: 'flex-start' }}
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.commentId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableWithoutFeedback onPress={() => this.postClick(item)}>
                                    <View style={styles.pictureContainer}>
                                        {
                                            item.picture.uri ?
                                                <SmartImage
                                                    style={styles.picture}
                                                    showSpinner={false}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={item.picture.uri}
                                                />
                                                :
                                                <Image
                                                    style={[styles.picture, {
                                                        backgroundColor: 'black', tintColor: 'white', resizeMode: 'cover'
                                                    }]}
                                                    source={PreloadImage.user}
                                                />
                                        }
                                        {
                                            /*
                                            this.state.showPostIndicator === index &&
                                            <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: 'center', alignItems: 'center' }}>
                                                <ActivityIndicator animating size={'small'} color={'white'} />
                                            </View>
                                            */
                                        }
                                    </View>
                                </TouchableWithoutFeedback>
                            );

                        }}
                        onScroll={({ nativeEvent }) => {
                            if (!this.state.focused) return;

                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getCommentedFeeds();
                            }
                        }}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        ListHeaderComponent={
                            (this.state.totalFeedsSize > 0) &&
                            <View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>Your customers ({this.state.totalFeedsSize})</Text>
                                </View>
                            </View>
                        }

                        ListEmptyComponent={
                            !this.state.isLoadingFeeds &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 24,
                                    paddingTop: 4,
                                    fontFamily: "Roboto-Medium"
                                }}>No reviewed girls</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 18,
                                    fontFamily: "Roboto-Medium"
                                }}>Let's find some hot chicks</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTimeout(() => {
                                            // Consider: set scroll position 0

                                            this.props.navigation.navigate("intro");
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                    style={{ marginTop: 20 }}>
                                    <Image
                                        style={{
                                            width: illustWidth,
                                            height: illustHeight,
                                            resizeMode: 'cover'
                                        }}
                                        source={PreloadImage.review}
                                    />
                                </TouchableOpacity>
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

    getCommentedFeeds() {
        if (this.onLoading) return;

        const { profile } = this.props.profileStore;
        const comments = profile.comments;
        const length = comments.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });

            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastTimeCommentsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) return;

        this.onLoading = true;

        console.log('CommentMain', 'loading feeds...');

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

            const comment = comments[i];

            // newFeeds.push(comment);



            const userUid = comment.userUid;
            const commentId = comment.commentId;
            const name = comment.name;
            const placeName = comment.placeName;
            const uri = comment.picture;

            if (this.customerList.has(userUid)) {
                console.log('customer from memory');

                const customer = this.customerList.get(userUid);
                newFeeds.push(customer);
            } else {
                const customer = {
                    uid: userUid,
                    name,
                    place: placeName,
                    picture: {
                        uri
                    }
                };

                newFeeds.push(customer);

                // subscribe here
                // --
                const instance = Firebase.subscribeToProfile(userUid, user => {
                    if (user === undefined) {
                        // update this.customerList
                        this.customerList.delete(userUid);

                        // update state feed & UI
                        /*
                        let feeds = [...this.state.feeds];
                        const index = feeds.findIndex(el => el.placeId === placeId && el.id === feedId);
                        if (index !== -1) {
                            feeds.splice(index, 1);
                        }
                        */

                        return;
                    }

                    console.log('subscribeToProfile userUid', userUid);

                    // update this.customerList
                    this.customerList.set(userUid, user);

                    // update state feed & UI
                    /*
                    let feeds = [...this.state.feeds];
                    const index = feeds.findIndex(el => el.placeId === newFeed.placeId && el.id === newFeed.id);
                    if (index !== -1) {
                        feeds[index] = newFeed;
                        !this.closed && this.setState({ feeds });
                    }
                    */
                });

                this.customersUnsubscribes.push(instance);
                // --
            }



            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({ isLoadingFeeds: false, feeds: newFeeds });
        } else {
            this.setState({ isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds] });
        }

        console.log('CommentMain', 'loading feeds done!');

        this.onLoading = false;
    }

    postClick(item) {
        this.openPost(item);
    }

    openPost(item) {
        // show indicator
        const feeds = [...this.state.feeds];
        const index = feeds.findIndex(el => el.uid === item.uid);
        if (index === -1) {
            this.refs["toast"].show('The user does not exist.', 500);

            return;
        }

        // !this.closed && this.setState({ showPostIndicator: index });

        const { profile } = this.props.profileStore;

        const host = {
            uid: profile.uid,
            name: profile.name,
            picture: profile.picture
        };

        const customer = this.customerList.get(item.uid);
        if (!customer) {
            this.refs["toast"].show('Please try again.', 500);

            return;
        }

        const { place, receivedCommentsCount, timestamp, birthday, gender, about } = customer;

        const guest = {
            uid: customer.uid,
            name: customer.name,
            picture: customer.picture.uri,
            address: place,
            receivedCommentsCount,
            timestamp, birthday, gender, about
        };

        const _item = {
            host,
            guest
        };

        setTimeout(async () => {
            this.props.navigation.navigate("userPost", { item: _item });
        }, Cons.buttonTimeoutShort);


        // hide indicator
        // !this.closed && this.setState({ showPostIndicator: -1 });
    }

    handleRefresh = () => {
        !this.closed && this.setState({ refreshing: true });

        // reload from the start
        this.lastChangedTime = 0;
        this.getCommentedFeeds();

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
        // paddingTop: Theme.spacing.base,
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
