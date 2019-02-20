import autobind from "autobind-decorator";
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Constants, Permissions, Linking, ImagePicker } from "expo";
// import { StyleGuide } from "./rne/src/components/theme";
// import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
import type { FeedEntry } from "./rnff/src/components/Model";
import type { ScreenProps } from "./rnff/src/components/Types";
import { Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';

type InjectedProps = {
    profileStore: ProfileStore
};

const MAX_FEED_COUNT = 5;


@inject("profileStore")
@observer
export default class LikesMain extends React.Component<ScreenProps<> & InjectedProps> {
    state = {
        renderList: false,
        showAlert: false,
        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
    }

    componentDidMount() {
        console.log('LikesMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        this.getSavedFeeds();

        setTimeout(() => {
            !this.isClosed && this.setState({ renderList: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            // this.props.navigation.navigate("intro"); // ToDo: not working
            this.props.navigation.navigate("home");
        }

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'LikesMain';

        if (Vars.postToggleButtonPressed) {
            Vars.postToggleButtonPressed = false;
            this.getSavedFeeds();
        }



    }

    @autobind
    onScrollHandler() {
        console.log('LikesMain.onScrollHandler');

        this.getSavedFeeds();
    }

    componentWillUnmount() {
        console.log('LikesMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.isClosed = true;
    }

    getSavedFeeds() {
        if (this.state.isLoadingFeeds) {
            if (this.state.refreshing) this.setState({ refreshing: false });
            return;
        }

        const { profile } = this.props.profileStore;
        const feeds = profile.likes;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.refreshing) this.setState({ refreshing: false });
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

        // load all?
        if (this.lastLoadedFeedIndex === 0) {
            if (this.state.refreshing) this.setState({ refreshing: false });
            return;
        }

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
            if (count >= MAX_FEED_COUNT) break;

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
    }

    async openPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        const post = feedDoc.data();

        if (!post) {
            // post removed
            this.refs["toast"].show('The post is removed by the owner.', 500);
        } else {
            this.props.navigation.navigate("likesPost", { post: post, from: 'LikesMain' });
        }
    }

    render() {

        return (
            <View style={styles.flex}>

                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 18,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'flex-start',
                            paddingLeft: 16
                        }}
                    >Saved ({this.state.totalFeedsSize})</Text>

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
                        ListFooterComponent={
                            this.state.isLoadingFeeds &&
                            <ActivityIndicator
                                style={styles.bottomIndicator}
                                animating={true}
                                size="small"
                                color='grey'
                            />
                        }

                        // scrollEventThrottle={1}
                        data={this.state.feeds}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity onPress={async () => this.openPost(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            uri={item.picture}
                                            style={styles.picture}
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
                                </TouchableOpacity>
                            );
                        }}
                        onEndReachedThreshold={0.5}
                        onEndReached={this.onScrollHandler}
                        // ItemSeparatorComponent={this.itemSeparatorComponent}
                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View>

        );
    }

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                // if user moved to likes page before the Vars.postToggleButtonPressed updated to true.
                // Then the user could update all feeds. In this case we need to change the Vars.postToggleButtonPressed to false manually to avoid rerendering on onfocus event.
                if (Vars.postToggleButtonPressed) Vars.postToggleButtonPressed = false;

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
        paddingBottom: 8,
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
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
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


});
