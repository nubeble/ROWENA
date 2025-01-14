// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import {
    StyleSheet, View, Animated, SafeAreaView, TouchableWithoutFeedback, BackHandler,
    Platform, Dimensions, TouchableOpacity, TextInput, StatusBar, FlatList, Image, ActivityIndicator
} from "react-native";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import { FontAwesome, MaterialIcons } from 'react-native-vector-icons';
import Firebase from './Firebase';
import { RefreshIndicator } from "./rnff/src/components";
// import Swiper from './Swiper';
import SwiperFlatList from './react-native-swiper-flatlist/src/components/SwiperFlatList/SwiperFlatList';
import { Cons, Vars } from "./Globals";
import Util from "./Util";
import PreloadImage from "./PreloadImage";
import { subscribeToTopic, unsubscribeToTopic } from './PushNotifications';

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};

/*
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
*/


@inject("feedStore", "profileStore")
@observer
export default class Explore extends React.Component<InjectedProps> {
    // static __feed = null;

    state = {
        // scrollAnimation: new Animated.Value(0),

        searchText: '',
        titleText: '',
        feedSize: 0,
        placeId: null,
        placeCounts: null,
        latitude: 0,
        longitude: 0,

        scrollY: 0,
        selectedOrderIndex: 2 // 2: order by time
    };

    constructor(props) {
        super(props);

        this.ads = []; // length 4
    }

    /*
    static scrollToTop() {
        Explore.__feed.scrollToTop();
    }
    */

    componentDidMount() {
        // console.log('jdub', 'Explore.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);
        this.onBlurListener = this.props.navigation.addListener('willBlur', this.onBlur);

        // const params = this.props.screenProps.params;
        const params = this.props.navigation.state.params;
        // console.log('jdub', 'Explore.componentDidMount', params);

        const place = params.place;
        this.init(place);

        const rn = Math.round(Math.random() * 10) % 4; // 0 ~ 3

        switch (rn) {
            case 0: // starbucks
                this.ads[0] = PreloadImage.starbucks1;
                this.ads[1] = PreloadImage.starbucks2;
                this.ads[2] = PreloadImage.starbucks3;
                this.ads[3] = PreloadImage.starbucks4;
                break;

            case 1: // coca-cola
                this.ads[0] = PreloadImage.coke1;
                this.ads[1] = PreloadImage.coke2;
                this.ads[2] = PreloadImage.coke3;
                this.ads[3] = PreloadImage.coke4;
                break;

            case 2: // burger king
                this.ads[0] = PreloadImage.burger1;
                this.ads[1] = PreloadImage.burger2;
                this.ads[2] = PreloadImage.burger3;
                this.ads[3] = PreloadImage.burger4;
                break;

            case 3: // add your ad
                /*
                this.ads[0] = { uri: 'https://www.iprayprayer.com/wp-content/uploads/2017/04/images.png' };
                this.ads[1] = { uri: 'https://s3.envato.com/files/71383791/origami_590_preview.jpg' };
                this.ads[2] = { uri: 'https://image.shutterstock.com/z/stock-vector-sale-banner-template-and-special-offer-off-vector-illustration-346063715.jpg' };
                this.ads[3] = { uri: 'https://dnacademy.in/wp-content/uploads/2018/08/Graphic-Designer.jpg' };
                */
                this.ads[0] = PreloadImage.wanted1;
                this.ads[1] = PreloadImage.wanted2;
                this.ads[2] = PreloadImage.wanted3;
                this.ads[3] = PreloadImage.wanted4;
                break;
        }
    }

    componentWillUnmount() {
        console.log('jdub', 'Explore.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();
        this.onBlurListener.remove();

        this.closed = true;
    }

    init(place) {
        let placeName = place.name;

        const words = placeName.split(', ');
        searchText = words[0];

        const titleText = placeName;

        this.setState({ searchText, titleText, placeId: place.place_id, feedSize: place.length, placeCounts: place.placeCounts, latitude: place.lat, longitude: place.lng });

        // setState isLoadingFeeds true in Feed.js
        this._feed.setState({ isLoadingFeeds: true });

        let gender = null;
        const showMe = Vars.showMe;
        if (showMe === 'Men') gender = 'Man';
        else if (showMe === 'Women') gender = 'Woman';

        if (gender) {
            const query = Firebase.firestore.collection("places").doc(place.place_id).collection("feed").where("d.gender", "==", gender).orderBy("d.timestamp", "desc");
            this.props.feedStore.init(query, 'd.timestamp');
        } else {
            const query = Firebase.firestore.collection("places").doc(place.place_id).collection("feed").orderBy("d.timestamp", "desc");
            this.props.feedStore.init(query, 'd.timestamp');
        }

        this._feed.disableScroll();
    }

    async initFromSearch(result) {
        console.log('jdub', 'Explore.initFromSearch', result);

        let name = result.description;
        // name = Util.getPlaceName(name); // city + country

        let count = 0;
        let placeCounts = null;

        const placeDoc = await Firebase.firestore.collection("places").doc(result.place_id).get();
        if (!placeDoc.exists) {
            // nothing to do here
        } else {
            let place = placeDoc.data();

            if (Vars.showMe === 'Men') count = place.men;
            else if (Vars.showMe === 'Women') count = place.women;
            else count = place.count;

            const counts = {
                count: place.count,
                men: place.men,
                women: place.women
            };
            placeCounts = counts;
        }

        subscribeToTopic(result.place_id);

        const placeData = {
            name: name,
            place_id: result.place_id,
            length: count,
            placeCounts,

            // location: result.location
            lat: result.location.lat,
            lng: result.location.lng
        }

        this.init(placeData);
        this.setState({ selectedOrderIndex: 2, scrollY: 0 });

        this._feed._scrollTo(0);
    }

    async initFromMap(posts) {
        // update feedStore
        this.props.feedStore.updateFeeds(posts);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('jdub', 'Explore.handleHardwareBackPress');
        // console.log('jdub', 'Explore.handleHardwareBackPress');
        // this.props.navigation.goBack(); // not working
        // this.props.navigation.dispatch(NavigationActions.back()); // not working

        // this.props.screenProps.rootNavigation.navigate("intro");
        this.props.navigation.navigate("intro");

        return true;
    }

    @autobind
    onFocus() {
        Vars.focusedScreen = 'Explore';
    }

    @autobind
    onBlur() {
        Vars.focusedScreen = null;
    }

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;

        const extra = {
            // cityName: this.state.searchText,
            placeCounts: this.state.placeCounts
        };

        /*
        const { profile } = profileStore;

        const { scrollAnimation } = this.state;
        const opacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [1, 0],
            extrapolate: "clamp"
        });
        const translateY = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, -60],
            extrapolate: "clamp"
        });
        const fontSize = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [36, 24],
            extrapolate: "clamp"
        });
        const height = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: Platform.OS === "android" ? [70, 70] : [100, 60],
            extrapolate: "clamp"
        });
        const marginTop = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [24, 0],
            extrapolate: "clamp"
        });
        const shadowOpacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, 0.25],
            extrapolate: "clamp"
        });
        */

        /*
        const { feed } = feedStore;
        const loading = feed === undefined;
        let hasFeed = false;
        if (feed) {
            const size = feed.length;
            hasFeed = !!size;
        }
        */

        let showOrderTab = false;
        if (this.orderTabY - this.state.scrollY <= 0) {
            showOrderTab = true;
        }

        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: Theme.color.component,
                        borderRadius: 25
                    }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 0, top: (34 - 30) / 2, width: 30, height: 30, justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                setTimeout(() => {
                                    !this.closed && this.props.navigation.navigate("intro");
                                }, Cons.buttonTimeout);
                            }}
                        >
                            <FontAwesome name='chevron-left' color="rgb(160, 160, 160)" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                setTimeout(() => {
                                    !this.closed && this.props.navigation.navigate("search", { from: 'Explore', initFromSearch: (result) => this.initFromSearch(result) });
                                }, Cons.buttonTimeout);
                            }}
                        >
                            <Text
                                style={{
                                    width: '100%', height: '100%', fontSize: 16, fontFamily: "Roboto-Medium",
                                    // paddingTop: Cons.searchBarPaddingTop(),
                                    paddingTop: 3,
                                    color: Theme.color.text2, textAlign: 'center'
                                }}
                            >{this.state.searchText}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            // bottom: 2,
                            bottom: 0,
                            right: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => this.openMap()}
                    >
                        <View style={{
                            width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center",
                            backgroundColor: Theme.color.component
                        }}>
                            <MaterialIcons name="location-on" color="rgba(255, 255, 255, 0.8)" size={24} />
                        </View>
                    </TouchableOpacity>
                </View>

                {
                    showOrderTab &&
                    < View style={styles._orderTab}>
                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                if (Platform.OS === 'android') this.orderByRatings();
                                else this.orderByViews();

                                this.setState({ selectedOrderIndex: 0, scrollY: this.orderTabY });

                                this._feed._scrollTo(this.orderTabY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 0 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{Platform.OS === 'android' ? 'Ratings' : 'Views'}</Text>
                            {
                                this.state.selectedOrderIndex === 0 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.orderByReviews();

                                this.setState({ selectedOrderIndex: 1, scrollY: this.orderTabY });

                                this._feed._scrollTo(this.orderTabY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 1 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{Platform.OS === 'android' ? 'Reviews' : 'Comments'}</Text>
                            {
                                this.state.selectedOrderIndex === 1 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.orderByTime();

                                this.setState({ selectedOrderIndex: 2, scrollY: this.orderTabY });

                                this._feed._scrollTo(this.orderTabY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 2 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{'Time'}</Text>
                            {
                                this.state.selectedOrderIndex === 2 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>
                }

                {/*
                <AnimatedSafeAreaView style={[styles.header, { shadowOpacity }]}>
                    <Animated.View style={[styles.innerHeader, { height }]}>
                        <View>
                            <AnimatedText
                                type="large"
                                style={[styles.newPosts, { opacity, transform: [{ translateY }] }]}
                            >
                                New posts
                            </AnimatedText>
                            <AnimatedText
                                type="header2"
                                style={{ fontSize, marginTop }}
                            >
                                {moment().format("dddd")}
                            </AnimatedText>
                        </View>


                        <TouchableWithoutFeedback onPress={this.profile}>
                            <View>
                                <Avatar {...profile.picture.uri} />
                            </View>
                        </TouchableWithoutFeedback>


                    </Animated.View>
                </AnimatedSafeAreaView>
                */}

                <Feed
                    ref={(feed) => {
                        this._feed = feed;
                        // Explore.__feed = feed;
                    }}
                    store={feedStore}
                    extra={extra}

                    /*
                    onScroll={Animated.event([{
                        nativeEvent: {
                            contentOffset: {
                                y: scrollAnimation
                            }
                        }
                    }])}
                    */

                    _onScroll={({ layoutMeasurement, contentOffset, contentSize }) => {
                        // console.log('jdub', '_onScroll', event);

                        // const y = event.nativeEvent.contentOffset.y;
                        const y = contentOffset.y;
                        this.setState({ scrollY: y });
                    }}

                    ListHeaderComponent={this.renderListHeaderComponent()}
                    {...{ navigation }}
                />
            </View>
        );
    } // end of render()

    renderListHeaderComponent() {
        let titleText = null;

        if (this.state.feedSize > 0) {
            titleText = 'Meet ' + Util.numberWithCommas(this.state.feedSize) + '+ ' + Util.getPostName(false, Vars.showMe) + ' in ' + this.state.titleText;
        } else {
            titleText = 'Meet ' + Util.getPostName(false, Vars.showMe) + ' in ' + this.state.titleText;
        }

        return (
            <View>
                {/* advertising banner */}
                <TouchableWithoutFeedback onPress={() => {
                    let index;
                    if (this.currentSwiperIndex === undefined) {
                        index = 0;
                    } else {
                        index = this.currentSwiperIndex;
                    }

                    // ToDo: use index
                    console.log('jdub', 'TouchableWithoutFeedback onPress', index);
                }}>
                    {
                        this.ads.length === 4 ?
                            <SwiperFlatList
                                autoplay
                                autoplayDelay={3}
                                onChangeIndex={({ index, prevIndex }) => {
                                    // console.log(prevIndex, index);
                                    this.currentSwiperIndex = index;
                                }}
                            >
                                <View style={styles.slide}>
                                    <Image
                                        style={styles.item}
                                        source={this.ads[0]}
                                    />
                                    {/*
                                        <View style={styles.content}>
                                            <Text style={{
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                color: "black",
                                                fontSize: 21,
                                                fontFamily: "Roboto-Medium"
                                            }}>{"advertising area 1"}
                                            </Text>
                                        </View>
                                        */}
                                </View>
                                <View style={styles.slide}>
                                    <Image
                                        style={styles.item}
                                        source={this.ads[1]}
                                    />
                                    {/*
                                        <View style={styles.content}>
                                            <Text style={{
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                color: "black",
                                                fontSize: 21,
                                                fontFamily: "Roboto-Medium"
                                            }}>{"advertising area 2"}
                                            </Text>
                                        </View>
                                        */}
                                </View>
                                <View style={styles.slide}>
                                    <Image
                                        style={styles.item}
                                        source={this.ads[2]}
                                    />
                                    {/*
                                        <View style={styles.content}>
                                            <Text style={{
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                color: "black",
                                                fontSize: 21,
                                                fontFamily: "Roboto-Medium"
                                            }}>{"advertising area 3"}
                                            </Text>
                                        </View>
                                        */}
                                </View>
                                <View style={styles.slide}>
                                    <Image
                                        style={styles.item}
                                        source={this.ads[3]}
                                    />
                                    {/*
                                    <View style={styles.content}>
                                        <Text style={{
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            color: "black",
                                            fontSize: 21,
                                            fontFamily: "Roboto-Medium"
                                        }}>{"advertising area 4"}
                                        </Text>
                                    </View>
                                    */}
                                </View>
                            </SwiperFlatList>
                            :
                            <View style={{
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').width / 21 * 9,
                                backgroundColor: 'green'
                            }} />
                    }
                </TouchableWithoutFeedback>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{titleText}</Text>
                </View>
                {
                    // !loading && hasFeed &&
                    <View style={styles.orderTab} onLayout={(event) => {
                        const { y } = event.nativeEvent.layout;
                        // this.orderTabY = y;
                        if (!this.orderTabY) this.orderTabY = y;
                    }}>
                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                if (Platform.OS === 'android') this.orderByRatings();
                                else this.orderByViews();

                                this.setState({ selectedOrderIndex: 0 });

                                this._feed._scrollTo(this.state.scrollY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 0 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{Platform.OS === 'android' ? 'Ratings' : 'Views'}</Text>
                            {
                                this.state.selectedOrderIndex === 0 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.orderByReviews();

                                this.setState({ selectedOrderIndex: 1 });

                                this._feed._scrollTo(this.state.scrollY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 1 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{Platform.OS === 'android' ? 'Reviews' : 'Comments'}</Text>
                            {
                                this.state.selectedOrderIndex === 1 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: '33%', height: '100%', justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.orderByTime();

                                this.setState({ selectedOrderIndex: 2 });

                                this._feed._scrollTo(this.state.scrollY);
                            }}
                        >
                            <Text style={{ fontSize: 16, fontFamily: this.state.selectedOrderIndex === 2 ? "Roboto-Bold" : "Roboto-Regular", color: Theme.color.text2 }}>{'Time'}</Text>
                            {
                                this.state.selectedOrderIndex === 2 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '70%', position: 'absolute', bottom: 0, alignSelf: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    orderByRatings() { // review score
        this.order('d.averageRating');
    }

    orderByReviews() { // review count
        this.order('d.reviewCount');
    }

    orderByTime() { // recently posted
        this.order('d.timestamp');
    }

    orderByViews() { // total visit count
        this.order('d.totalVisitCount');
    }

    orderByDistance() {
        // Consider: order by distance
    }

    order(order) {
        let gender = null;
        const showMe = Vars.showMe;
        if (showMe === 'Men') gender = 'Man';
        else if (showMe === 'Women') gender = 'Woman';

        if (gender) {
            const query = Firebase.firestore.collection("places").doc(this.state.placeId).collection("feed").where("d.gender", "==", gender).orderBy(order, "desc");
            this.props.feedStore.init(query, order);
        } else {
            const query = Firebase.firestore.collection("places").doc(this.state.placeId).collection("feed").orderBy(order, "desc");
            this.props.feedStore.init(query, order);
        }

        this._feed.disableScroll();
    }

    openMap() {
        setTimeout(() => {
            const region = {
                latitude: this.state.latitude,
                longitude: this.state.longitude
            };

            // const placeName = this.state.searchText;
            const placeName = this.state.titleText;
            const placeId = this.state.placeId;
            const placeCounts = this.state.placeCounts;

            !this.closed && this.props.navigation.navigate("mapExplore", { region, placeName, placeId, placeCounts, initFromMap: (posts) => this.initFromMap(posts) });
        }, Cons.buttonTimeout);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    /*
    header: {
        backgroundColor: "white",
        shadowColor: "black",
        shadowOffset: {width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 8,
        zIndex: 10000
    },
    innerHeader: {
        marginHorizontal: Theme.spacing.base,
        marginVertical: Theme.spacing.tiny,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    newPosts: {
        position: "absolute",
        top: 0
    },
    */
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',

        // backgroundColor: 'grey'
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width / 21 * 9,
        resizeMode: 'cover'
    },
    titleContainer: {
        // padding: Theme.spacing.small,
        paddingHorizontal: Theme.spacing.small,
        paddingTop: 12,
        paddingBottom: 8
    },
    title: {
        color: Theme.color.title,
        fontSize: 18,
        lineHeight: 26,
        fontFamily: "Roboto-Medium"
    },
    /*
    activityIndicator: {
            position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    */
    orderTab: {
        width: '100%',
        height: 38,
        flexDirection: "row",
        justifyContent: 'center',
        alignItems: 'center',
        // borderTopColor: Theme.color.line, borderTopWidth: 1,
        borderBottomColor: Theme.color.line, borderBottomWidth: 1,

        // backgroundColor: 'green',
        marginBottom: Theme.spacing.tiny
    },
    _orderTab: {
        width: '100%',
        height: 38,
        flexDirection: "row",
        justifyContent: 'center',
        alignItems: 'center',
        // borderTopColor: Theme.color.line, borderTopWidth: 1,
        borderBottomColor: Theme.color.line, borderBottomWidth: 1,

        position: 'absolute',
        top: Cons.searchBarHeight,

        backgroundColor: Theme.color.background,
        zIndex: 100000
    }
});
