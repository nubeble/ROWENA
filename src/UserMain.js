import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image,
    TouchableHighlight, TouchableWithoutFeedback
} from 'react-native';
import { Text, Theme } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { NavigationActions } from 'react-navigation';
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from "react-native-vector-icons";
import autobind from "autobind-decorator";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';
import { RefreshIndicator } from "./rnff/src/components";
import Util from "./Util";

const DEFAULT_REVIEW_COUNT = 6;

const avatarWidth = Dimensions.get('window').height / 11;


export default class UserMain extends React.Component {
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

        this.feedList = new Map();
        this.feedCountList = new Map();

        this.feedsUnsubscribes = [];
    }

    componentDidMount() {
        console.log('UserMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        // ToDo
        // this.getUserFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('UserMain.handleHardwareBackPress');
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'UserMain';

        /*
        const lastChangedTime = this.props.profileStore.lastTimeFeedsUpdated;
        if (this.lastChangedTime !== lastChangedTime) {
            // reload from the start

            // ToDo
            // this.getUserFeeds();

            // move scroll top
            this._flatList.scrollToOffset({ offset: 0, animated: true });
        }
        */

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
        console.log('UserMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        for (var i = 0; i < this.feedsUnsubscribes.length; i++) {
            const instance = this.feedsUnsubscribes[i];
            instance();
        }

        this.closed = true;
    }

    /*
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

        console.log('ProfileMain', 'loading feeds done!');

        this.onLoading = false;
    }
    */

    render() {
        const name = 'Anonymous';
        const hasImage = false;




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
                        <Ionicons name='md-close' color="rgba(255, 255, 255, 0.8)" size={24} />
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
                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        contentContainerStyle={styles.contentContainer}
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
                                                <Text style={{ paddingTop: 4, color: Theme.color.text2, fontSize: 24, fontFamily: "Roboto-Medium" }}>{name}</Text>
                                                <Text style={{ marginTop: Dimensions.get('window').height / 80, color: Theme.color.text3, fontSize: 16, fontFamily: "Roboto-Light" }}>View and edit profile</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    width: avatarWidth, height: avatarWidth,
                                                    marginRight: 22, justifyContent: 'center', alignItems: 'center'
                                                }}
                                                onPress={() => {
                                                    // nothing to do
                                                }}
                                            >
                                                {
                                                    hasImage ?
                                                        <Image
                                                            style={{ backgroundColor: 'black', width: avatarWidth, height: avatarWidth, borderRadius: avatarWidth / 2, borderColor: 'black', borderWidth: 1 }}
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


                                    </View>

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
                            return (
                                <TouchableWithoutFeedback
                                    onPress={async () => await this.openPost(item)}
                                >
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

                {
                    /*
                    !this.state.focused &&
                    <View style={{
                        width: '100%',
                        height: 100, // Consider: get the height of tab bar
                        // backgroundColor: 'green'
                    }} />
                    */
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
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: Theme.color.background
        backgroundColor: 'green'
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'black'
    },
    ad: {
        width: (Dimensions.get('window').width),
        height: (Dimensions.get('window').width) / 21 * 9,
        marginTop: Theme.spacing.tiny,
        marginBottom: Theme.spacing.tiny
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    contentContainer: {
        flexGrow: 1
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
