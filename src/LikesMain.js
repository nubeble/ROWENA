import React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, ActivityIndicator, BackHandler, Dimensions, FlatList } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Constants, Permissions, Linking, ImagePicker } from "expo";
import SmartImage from "./rnff/src/components/SmartImage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
// import type { FeedEntry } from "./rnff/src/components/Model";
// import type { ScreenProps } from "./rnff/src/components/Types";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import autobind from 'autobind-decorator';
import { Theme, RefreshIndicator, FeedStore } from "./rnff/src/components";
import ProfileStore from "./rnff/src/home/ProfileStore";

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

const DEFAULT_FEED_COUNT = 10;


@inject("feedStore", "profileStore")
@observer
export default class LikesMain extends React.Component<InjectedProps> {
    state = {
        renderList: false,
        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        focused: false
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
        this.onLoading = false;
    }

    componentDidMount() {
        console.log('LikesMain.componentDidMount');

        // this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        // this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.getSavedFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderList: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.goBack();

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'LikesMain';

        if (Vars.postToggleButtonPressed) {
            Vars.postToggleButtonPressed = false;
            this.getSavedFeeds();
        }

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 20; // how far from the bottom
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    componentWillUnmount() {
        console.log('LikesMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    getSavedFeeds() {
        if (this.onLoading) return;

        this.onLoading = true;

        const { profile } = this.props.profileStore;
        const feeds = profile.likes;
        const length = feeds.length;
        if (length === 0) {
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });
            if (this.state.refreshing) this.setState({ refreshing: false });

            this.onLoading = false;
            return;
        }

        // check update
        const lastChangedTime = this.props.profileStore.lastChangedTime;
        if (this.lastChangedTime !== lastChangedTime) {
            this.lastChangedTime = lastChangedTime;

            // reload from the start
            this.reload = true;
            this.lastLoadedFeedIndex = -1;
        }

        // all loaded
        if (this.lastLoadedFeedIndex === 0) {
            if (this.state.refreshing) this.setState({ refreshing: false });

            this.onLoading = false;
            return;
        }

        console.log('LikesMain', 'loading feeds...');

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

            if (!value.valid) continue;

            newFeeds.push(value);

            this.lastLoadedFeedIndex = i;

            count++;
        }

        if (this.reload) {
            this.reload = false;

            this.setState({
                isLoadingFeeds: false, feeds: newFeeds, refreshing: false
            });
        } else {
            this.setState({
                isLoadingFeeds: false, feeds: [...this.state.feeds, ...newFeeds], refreshing: false
            });
        }

        console.log('LikesMain', 'loading feeds done!');

        this.onLoading = false;
    }

    async openPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        
        // check if removed by the owner
        if (!feedDoc.exists) {
            this.refs["toast"].show('The post has been removed by its owner.', 500);
            return;
        }

        setTimeout(() => {
            const post = feedDoc.data();
            this.props.navigation.navigate("likesPost", { post: post, from: 'LikesMain' });
        }, Cons.buttonTimeoutShort);
    }

    render() {

        return (
            <View style={styles.flex}>

                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: Theme.color.text1,
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'flex-start',
                            marginLeft: 16
                        }}
                    >Saved</Text>

                </View>

                {
                    this.state.renderList &&
                    <FlatList
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        /*
                        ListHeaderComponent={
                            <View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>Bangkok, Thailand (3)</Text>
                                </View>
                            </View>
                        }
                        */
                        data={this.state.feeds}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableWithoutFeedback onPress={async () => await this.openPost(item)}>
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
                                    </View>
                                </TouchableWithoutFeedback>
                            );
                        }}
                        // onEndReachedThreshold={0.5}
                        // onEndReached={this.handleScrollEnd}
                        onScroll={({ nativeEvent }) => {
                            if (this.isCloseToBottom(nativeEvent)) {
                                this.getSavedFeeds();
                            }
                        }}
                        // scrollEventThrottle={1}

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}

                        ListFooterComponent={
                            this.state.isLoadingFeeds &&
                            <View style={{ width: '100%', height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                <RefreshIndicator />
                            </View>
                        }
                    />
                }

                {
                    !this.state.focused &&
                    <View style={{
                        width: '100%',
                        height: 100, // ToDo: get the height of tab bar
                        // backgroundColor: 'green'
                    }}>
                    </View>
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2 - 20}
                    opacity={0.6}
                />
            </View>

        );
    }

    handleRefresh = () => {
        if (this.onLoading) return;

        this.setState(
            {
                refreshing: true
            },
            () => {
                // if user moved to likes page before the Vars.postToggleButtonPressed updated to true.
                // Then the user could update all feeds. In this case we need to change the Vars.postToggleButtonPressed to false manually to avoid rerendering on onfocus event.
                if (Vars.postToggleButtonPressed) Vars.postToggleButtonPressed = false;

                // reload
                this.lastChangedTime = 0;
                this.getSavedFeeds();
            }
        );
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
    contentContainer: {
        flexGrow: 1,
        paddingLeft: Theme.spacing.base,
        paddingRight: Theme.spacing.base,
        paddingTop: Theme.spacing.base,
        paddingBottom: Theme.spacing.base
    },
    pictureContainer: { // 8:5 image
        width: parseInt(Dimensions.get('window').width - Theme.spacing.base * 2),
        height: parseInt(Dimensions.get('window').width - Theme.spacing.base * 2) / 8 * 5,
        borderRadius: 2,
        marginVertical: Theme.spacing.base
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
        color: 'white',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
    /*
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    },
    */


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


});
