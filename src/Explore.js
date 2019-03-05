// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import {
    StyleSheet, View, Animated, SafeAreaView, TouchableWithoutFeedback, BackHandler,
    Platform, Dimensions, TouchableOpacity, TextInput, StatusBar, FlatList, Image, ActivityIndicator
} from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import SmartImage from "./rnff/src/components/SmartImage";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import { RefreshIndicator } from "./rnff/src/components";
import Swiper from './Swiper';
import { Cons, Vars } from "./Globals";

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
    state = {
        // scrollAnimation: new Animated.Value(0),

        searchText: '',
        // cityName: '',
        feedSize: 0,
        renderFeed: false,

        scrollY: 0,
        selectedOrderIndex: 2 // time
    };

    componentDidMount() {
        console.log('Explore.componentDidMount');
        // console.log('width', Dimensions.get('window').width);
        // console.log('height', Dimensions.get('window').height);

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        // const params = this.props.screenProps.params;
        const params = this.props.navigation.state.params;

        const place = params.place;
        const length = params.length;

        // this.setState({ searchText: place.description, cityName: place.city, feedSize: length });
        this.setState({ searchText: place.name, feedSize: length });

        const query = Firebase.firestore.collection("place").doc(place.place_id).collection("feed").orderBy("timestamp", "desc");
        this.props.feedStore.init(query, 'timestamp');

        setTimeout(() => {
            !this.closed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        console.log('Explore.handleHardwareBackPress');


        console.log('move to Intro');

        // this.props.navigation.goBack();
        // this.props.navigation.dispatch(NavigationActions.back());
        // this.props.screenProps.rootNavigation.navigate("intro");

        this.props.navigation.navigate("intro");

        return true;
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'Explore';

    }

    componentWillUnmount() {
        console.log('Explore.componentWillUnmount');

        this.hardwareBackPressListener.remove();
        this.onFocusListener.remove();

        this.closed = true;
    }

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;

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
                            // style={{ position: 'absolute', left: 12, top: 9, alignSelf: 'baseline' }}
                            style={{ position: 'absolute', left: 2, top: (34 - 30) / 2, width: 30, height: 30, justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                setTimeout(() => {
                                    console.log('move to Intro');
                                    this.props.navigation.navigate("intro");
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            <FontAwesome name='chevron-left' color="rgb(160, 160, 160)" size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                setTimeout(() => {
                                    this.props.navigation.navigate("exploreSearch");
                                }, Cons.buttonTimeoutShort);
                            }}
                        >
                            {/*
                            <TextInput
                                // ref='searchInput'
                                pointerEvents="none"
                                editable={false}
                                style={{ width: '100%', height: '100%', fontSize: 16, fontFamily: "SFProText-Semibold", color: "white", textAlign: 'center' }}
                                placeholder='Where to?' placeholderTextColor='rgb(160, 160, 160)'
                                // underlineColorAndroid="transparent"
                                // onTouchStart={() => this.startEditing()}
                                // onEndEditing={() => this.leaveEditing()}
                                value={this.state.searchText}
                            />
                            */}
                            <Text
                                style={{
                                    width: '100%', height: '100%', fontSize: 16, fontFamily: "SFProText-Semibold", paddingTop: Cons.searchBarPaddingTop(),
                                    color: Theme.color.text2, textAlign: 'center'
                                }}
                            >{this.state.searchText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                {
                    showOrderTab &&
                    < View style={styles._orderTab}>
                        <TouchableOpacity
                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                            onPress={() => {
                                //this._feed.disableScroll();
                                this.orderByRatings();
                                this._feed._scrollTo(this.orderTabY);
                                // this._feed.enableScroll();

                                this.setState({ selectedOrderIndex: 0 });
                            }}
                        >
                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 0 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Ratings</Text>
                            {
                                this.state.selectedOrderIndex === 0 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                            onPress={() => {
                                // this._feed.disableScroll();
                                this.orderByReviews();
                                this._feed._scrollTo(this.orderTabY);
                                // this._feed.enableScroll();

                                this.setState({ selectedOrderIndex: 1 });
                            }}
                        >
                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 1 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Reviews</Text>
                            {
                                this.state.selectedOrderIndex === 1 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                            onPress={() => {
                                // this._feed.disableScroll();
                                this.orderByTime();
                                this._feed._scrollTo(this.orderTabY);
                                // this._feed.enableScroll();

                                this.setState({ selectedOrderIndex: 2 });
                            }}
                        >
                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 2 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Time</Text>
                            {
                                this.state.selectedOrderIndex === 2 &&
                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
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



                {
                    /*
                                        !this.state.renderFeed ?
                                            <ActivityIndicator
                                                style={styles.activityIndicator}
                                                animating={true}
                                                size="large"
                                                color='grey'
                                            />
                                            :
                    */
                    this.state.renderFeed &&
                    <Feed
                        ref={(feed) => this._feed = feed}
                        store={feedStore}

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
                            // console.log('_onScroll', event);
                            
                            // const y = event.nativeEvent.contentOffset.y;
                            const y = contentOffset.y;
                            this.setState({ scrollY: y });
                        }}

                        ListHeaderComponent={(
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
                                    console.log('TouchableWithoutFeedback onPress', index);
                                }}>
                                    <Swiper
                                        style={styles.wrapper}
                                        containerStyle={{ marginTop: Theme.spacing.tiny, marginBottom: 20 }}
                                        width={Dimensions.get('window').width}
                                        height={Dimensions.get('window').width / 21 * 9}
                                        loop={false}
                                        autoplay={true}
                                        autoplayTimeout={3}
                                        paginationStyle={{ bottom: 4 }}
                                        onIndexChanged={(index) => {
                                            // console.log('onIndexChanged', index);
                                            this.currentSwiperIndex = index;
                                        }}
                                    >
                                        <View style={styles.slide}>
                                            <SmartImage
                                                style={styles.item}
                                                showSpinner={false}
                                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                uri={'https://aydencreative.com/files/2018/10/180221-AYD-Website-Header_Mockup-1.jpg'}
                                            />
                                            {/*
                                                <View style={styles.content}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        fontWeight: '500',
                                                        color: "black",
                                                        fontSize: 21,
                                                        fontFamily: "SFProText-Semibold"
                                                    }}>{"advertising area 1"}
                                                    </Text>
                                                </View>
                                                */}
                                        </View>
                                        <View style={styles.slide}>
                                            <SmartImage
                                                style={styles.item}
                                                showSpinner={false}
                                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                uri={'https://www.esentra.com.tw/wp-content/uploads/2013/02/f2c70a681b8679277edc6d5e77ee5477.jpg'}
                                            />
                                            {/*
                                                <View style={styles.content}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        fontWeight: '500',
                                                        color: "black",
                                                        fontSize: 21,
                                                        fontFamily: "SFProText-Semibold"
                                                    }}>{"advertising area 2"}
                                                    </Text>
                                                </View>
                                                */}
                                        </View>
                                        <View style={styles.slide}>
                                            <SmartImage
                                                style={styles.item}
                                                showSpinner={false}
                                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                uri={'https://www.thefriaryguildford.com/wp-content/uploads/2018/04/7640-365-Creative-Web-Banners-AW6.jpg'}
                                            />
                                            {/*
                                                <View style={styles.content}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        fontWeight: '500',
                                                        color: "black",
                                                        fontSize: 21,
                                                        fontFamily: "SFProText-Semibold"
                                                    }}>{"advertising area 3"}
                                                    </Text>
                                                </View>
                                                */}
                                        </View>
                                        <View style={styles.slide}>
                                            <SmartImage
                                                style={styles.item}
                                                showSpinner={false}
                                                preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                uri={'https://www.designer-daily.com/wp-content/uploads/2015/02/wifi.jpg'}
                                            />
                                            {/*
                                                <View style={styles.content}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        fontWeight: '500',
                                                        color: "black",
                                                        fontSize: 21,
                                                        fontFamily: "SFProText-Semibold"
                                                    }}>{"advertising area 4"}
                                                    </Text>
                                                </View>
                                                */}
                                        </View>
                                    </Swiper>
                                </TouchableWithoutFeedback>

                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>
                                        {`${(this.state.feedSize) ? 'Explore ' + this.state.feedSize + '+ girls' : 'Explore girls'} in ` + this.state.searchText}
                                    </Text>
                                </View>

                                {/*
                                <View style={{ width: '100%', backgroundColor: '#123456', paddingTop: 10, marginTop: 30 }}>
                                    <TouchableOpacity onPress={() => this.orderByRatings()}
                                        style={styles.bottomButton}
                                    >
                                        <Text style={{ fontSize: 16, color: 'white' }}>orderByRatings</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => this.orderByReviews()}
                                        style={styles.bottomButton}
                                    >
                                        <Text style={{ fontSize: 16, color: 'white' }}>orderByReviews</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => this.orderByTime()}
                                        style={styles.bottomButton}
                                    >
                                        <Text style={{ fontSize: 16, color: 'white' }}>orderByTime</Text>
                                    </TouchableOpacity>
                                </View>
                                */}


                                {
                                    // !loading && hasFeed &&
                                    <View style={styles.orderTab} onLayout={(event) => {
                                        const { y } = event.nativeEvent.layout;
                                        // this.orderTabY = y;
                                        if (!this.orderTabY) this.orderTabY = y;

                                        // console.log('orderTaby', y);
                                    }}>
                                        <TouchableOpacity
                                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                                            onPress={() => {
                                                //this._feed.disableScroll();
                                                this.orderByRatings();
                                                this._feed._scrollTo(this.state.scrollY);
                                                // this._feed.enableScroll();

                                                this.setState({ selectedOrderIndex: 0 });
                                            }}
                                        >
                                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 0 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Ratings</Text>
                                            {
                                                this.state.selectedOrderIndex === 0 &&
                                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
                                            }
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                                            onPress={() => {
                                                // this._feed.disableScroll();
                                                this.orderByReviews();
                                                this._feed._scrollTo(this.state.scrollY);
                                                // this._feed.enableScroll();

                                                this.setState({ selectedOrderIndex: 1 });
                                            }}
                                        >
                                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 1 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Reviews</Text>
                                            {
                                                this.state.selectedOrderIndex === 1 &&
                                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
                                            }
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ width: 80, height: '100%', justifyContent: "center", alignItems: "center", marginHorizontal: 20 }}
                                            onPress={() => {
                                                // this._feed.disableScroll();
                                                this.orderByTime();
                                                this._feed._scrollTo(this.state.scrollY);
                                                // this._feed.enableScroll();

                                                this.setState({ selectedOrderIndex: 2 });
                                            }}
                                        >
                                            <Text style={{ fontSize: 15, fontFamily: this.state.selectedOrderIndex === 2 ? "SFProText-Bold" : "SFProText-Regular", color: Theme.color.text2 }}>Time</Text>
                                            {
                                                this.state.selectedOrderIndex === 2 &&
                                                <View style={{ borderBottomColor: Theme.color.text2, borderBottomWidth: 2, width: '80%', position: 'absolute', bottom: 10, alignSelf: 'center' }}/>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                        )}
                        {...{ navigation }}
                    />
                }
            </View >
        );
    } // end of render()


    orderByRatings() { // 평점
        this.order('averageRating');
    }

    orderByReviews() { // 리뷰 개수
        this.order('reviewCount');
    }

    orderByTime() { // 최근 등록
        this.order('timestamp');
    }

    orderByDistance() { // 가까운 거리
        // this.order('averageRating');
    }

    order(order) {
        const params = this.props.navigation.state.params;

        let place = params.place;

        const query = Firebase.firestore.collection("place").doc(place.place_id).collection("feed").orderBy(order, "desc");
        this.props.feedStore.init(query, order);
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },


    header: {
        backgroundColor: "white",
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
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
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',

        // backgroundColor: 'grey'
    },
    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        // flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width / 21 * 9
    },

    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: Theme.color.text2,
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    orderTab: {
        width: '100%',
        height: 50,
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
        height: 50,
        flexDirection: "row",
        justifyContent: 'center',
        alignItems: 'center',
        // borderTopColor: Theme.color.line, borderTopWidth: 1,
        borderBottomColor: Theme.color.line, borderBottomWidth: 1,

        position: 'absolute',
        top: Cons.searchBarHeight,

        backgroundColor: Theme.color.background,
        zIndex: 100000
    },


    // test: advertising area
    /*
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        padding: Theme.spacing.small,
        flex: 1
    }
    */

    bottomButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0,

        marginTop: 2,
        marginBottom: 2
    },




});
