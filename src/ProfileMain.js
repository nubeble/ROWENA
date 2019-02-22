import autobind from "autobind-decorator";
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList, Image, TouchableHighlight } from 'react-native';
import { NavigationActions } from 'react-navigation';
import SmartImage from "./rnff/src/components/SmartImage";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import { Theme } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";
import Toast, { DURATION } from 'react-native-easy-toast';
import PreloadImage from './PreloadImage';

type InjectedProps = {
    profileStore: ProfileStore
};

const MAX_FEED_COUNT = 12; // 3 x 4


@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<InjectedProps> {
    state = {
        renderFeed: false,
        showIndicator: false,
        showAlert: false,
        feeds: [],
        isLoadingFeeds: false,
        refreshing: false,
        totalFeedsSize: 0,
        focused: false,

        uploadingImage: false,
        uploadImage1: 'http://imgnews.naver.net/image/001/2017/05/20/PYH2017052019870001300_P2_20170520101607447.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'
    };

    constructor(props) {
        super(props);

        this.reload = true;
        this.lastLoadedFeedIndex = -1;
        this.lastChangedTime = 0;
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        // this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onFocusListener = this.props.navigation.addListener('willFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        this.getUserFeeds();

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            this.props.navigation.navigate("intro");
        }

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'ProfileMain';

        if (Vars.userFeedsChanged) {
            Vars.userFeedsChanged = false;
            this.getUserFeeds();
        }

        this.setState({ focused: true });
    }

    @autobind
    onBlur() {
        this.setState({ focused: false });
    }

    @autobind
    onScrollHandler() {
        console.log('ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    getUserFeeds() {
        if (this.state.isLoadingFeeds) {
            if (this.state.refreshing) this.setState({ refreshing: false });
            return;
        }

        const { profile } = this.props.profileStore;
        const feeds = profile.feeds;
        const length = feeds.length;

        this.setState({ totalFeedsSize: length });

        if (length === 0) {
            if (this.state.refreshing) this.setState({ refreshing: false });
            if (this.state.feeds.length > 0) this.setState({ feeds: [] });
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
            setTimeout(() => {
                this.props.navigation.navigate("postPreview", { post: post, from: 'Profile' });
            }, Cons.buttonTimeoutShort);
        }
    }

    render() {
        const { profile } = this.props.profileStore;

        const baselineTop = 0;

        const avatarName = (profile.name) ? profile.name : 'Max Power';
        // const uri = (profile.picture.uri) ? profile.picture.uri : PreloadImage.user;
        const hasImage = !!profile.picture.uri;
        const imageUri = profile.picture.uri;


        const avatarHeight = 70;

        const bodyInfoItemWidth = Dimensions.get('window').width / 5;
        const bodyInfoItemHeight = bodyInfoItemWidth;

        return (
            <View style={styles.flex}>

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={this.state.showIndicator}
                    size="large"
                    color='grey'
                />

                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: Theme.color.text1,
                            fontSize: 20,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'flex-start',
                            marginLeft: 16
                        }}
                    >Profile</Text>

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
                                        <View style={{ width: '100%', height: 100 }}>

                                            <TouchableOpacity
                                                style={{ width: avatarHeight, height: avatarHeight, position: "absolute", top: (100 - avatarHeight) / 2, right: 30 }}
                                                onPress={() => {
                                                    setTimeout(() => {
                                                        // ToDo: open picture
                                                    }, Cons.buttonTimeoutShort);
                                                }}
                                            >
                                                {
                                                    hasImage ?
                                                        <Image
                                                            style={{ backgroundColor: 'black', width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2, borderColor: 'black', borderWidth: 1 }}
                                                            source={{ uri: imageUri }}
                                                        />
                                                        :
                                                        <Image
                                                            style={{ backgroundColor: 'black', tintColor: 'white', width: avatarHeight, height: avatarHeight, borderRadius: avatarHeight / 2, borderColor: 'black', borderWidth: 1 }}
                                                            source={PreloadImage.user}
                                                        />
                                                }

                                            </TouchableOpacity>
                                            <Text style={{ color: Theme.color.text2, fontSize: 24, fontFamily: "SFProText-Semibold", position: "absolute", top: baselineTop + 20, left: 30 }}>{avatarName}</Text>
                                            <Text style={{ color: Theme.color.text3, fontSize: 16, fontFamily: "SFProText-Light", position: "absolute", top: baselineTop + 56, left: 30 }}>View and edit profile</Text>

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
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "SFProText-Regular" }}>{'See my ratings & reviews'}</Text>
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
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "SFProText-Regular" }}>{'Advertise myself or my friends'}</Text>
                                                <AntDesign name='notification' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />

                                        {/* Log out */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setTimeout(() => {
                                                    this.props.navigation.navigate("logout");
                                                }, Cons.buttonTimeoutShort);
                                            }}
                                        >
                                            <View style={{
                                                width: '100%', height: Dimensions.get('window').height / 14,
                                                justifyContent: 'center',
                                                paddingLeft: 2
                                            }}>
                                                <Text style={{ fontSize: 18, color: Theme.color.text2, fontFamily: "SFProText-Regular" }}>{'Log out'}</Text>
                                                <Feather name='log-out' color={Theme.color.text2} size={24} style={{ position: 'absolute', right: 0 }} />
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
                        // scrollEventThrottle={1}
                        columnWrapperStyle={styles.columnWrapperStyle}
                        numColumns={3}
                        data={this.state.feeds}
                        // keyExtractor={item => item.id}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity
                                    onPress={async () => {
                                        setTimeout(() => {
                                            this.openPost(item);
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                >
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            // preview={item.pictures.one.preview}
                                            // uri={item.pictures.one.uri}
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
                        ListFooterComponent={
                            this.state.isLoadingFeeds &&
                            <ActivityIndicator
                                style={styles.bottomIndicator}
                                animating={true}
                                size="small"
                                color='grey'
                            />
                        }

                        /*
                        ListEmptyComponent={
                            <View style={styles.post}>
                                {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }}/>}
                            </View>
                        }
                        */

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                }

                {
                    !this.state.focused &&
                    <View style={{
                        width: '100%',
                        height: 100, // ToDo: get the height of tab bar
                        // backgroundColor: 'green'
                    }} />
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View>

        );
    } // end of render()

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                this.getUserFeeds();
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
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'black'
    },
    ad: {
        width: parseInt(Dimensions.get('window').width),
        height: parseInt(Dimensions.get('window').width) / 21 * 9,
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
        // width: (parseInt(Dimensions.get('window').width) - 2) / 3,
        // height: (parseInt(Dimensions.get('window').width) - 2) / 3,
        width: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
        height: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
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
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    },
    infoContainer: {
        // backgroundColor: '#123456',
        // borderBottomWidth: 1,
        flex: 1,
        width: '100%',
        paddingBottom: Theme.spacing.tiny
    },
    /*
    bodyInfoTitle: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
        paddingTop: Theme.spacing.base
    },
    bodyInfoContent: {
        color: 'white',
        fontSize: 18,
        fontFamily: "SFProText-Bold",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },
    */
    infoText1: {
        color: Theme.color.text2,
        fontSize: 17,
        fontFamily: "SFProText-Semibold",
        paddingTop: Theme.spacing.base
    },
    infoText2: {
        color: Theme.color.text3,
        fontSize: 15,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.xSmall,
        paddingBottom: Theme.spacing.base
    },









});
