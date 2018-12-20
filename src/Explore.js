// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import {
    StyleSheet, View, Animated, SafeAreaView, TouchableHighlight, TouchableWithoutFeedback,
    Platform, Dimensions, TouchableOpacity, TextInput, StatusBar, FlatList, Image, ActivityIndicator
} from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import SearchModal from "./SearchModal";
import { RefreshIndicator } from "./rnff/src/components";
import Swiper from './Swiper'

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore") @observer
export default class Explore extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {

    state = {
        scrollAnimation: new Animated.Value(0),

        searchText: '',
        cityName: '',
        feedSize: 0,

        // renderFeed: false,
        renderFeed: true, // ToDo: consider!!


    };

    /*
    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }
    */

    componentDidMount() {
        let place = this.props.screenProps.params.place;
        let length = this.props.screenProps.params.length;
        let city = place.city;
        console.log('place', place, 'length', length, 'city', city);

        !this.isClosed && this.setState({ searchText: place.description, cityName: city, feedSize: length });

        const query = Firebase.firestore.collection("place").doc(place.place_id).collection("feed").orderBy("timestamp", "desc");
        this.props.feedStore.init(query);

        /*
        setTimeout(() => {
            !this.isClosed && this.setState({ renderFeed: true });
        }, 0);
        */
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    moveToIntro() {
        this.props.screenProps.rootNavigation.navigate('intro');

        // this.props.navigation.goBack(this.props.screenProps.params.key);
        // this.props.navigation.dispatch(NavigationActions.back());

        /*
        this.props.navigation.dispatch(NavigationActions.popToTop());
        this.props.navigation.dispatch(NavigationActions.popToTop());
        this.props.navigation.dispatch(NavigationActions.back());
        */
        /*
        return this.props.navigation.dispatch(StackActions.reset(
            {
                index: 0,
                actions: [NavigationActions.navigate({ routeName: 'intro' })]
            }
        ));
        */
    }

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;

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

        return (
            <View style={styles.flex}>

                <SearchModal ref='searchModal'></SearchModal>

                <View style={styles.searchBarStyle}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: 'rgb(34, 34, 34)',
                        borderRadius: 25
                    }} >
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 12, top: 9, alignSelf: 'baseline' }}
                            onPress={() => {
                                // this.refs.searchModal.showModal();
                                console.log('move to Intro');
                                this.moveToIntro();
                            }}
                        >
                            {/*
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
                            */}
                            <FontAwesome name='chevron-left' color="white" size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                this.refs.searchModal.showModal();
                            }}
                        >
                            <TextInput
                                // ref='searchInput'
                                pointerEvents="none"
                                editable={false}
                                style={{ width: '100%', height: '100%', fontSize: 14, fontFamily: "SFProText-Semibold", color: "white", textAlign: 'center' }}
                                placeholder='Where to?' placeholderTextColor='rgb(160, 160, 160)'
                                // underlineColorAndroid="transparent"
                                // onTouchStart={() => this.startEditing()}
                                // onEndEditing={() => this.leaveEditing()}
                                value={this.state.searchText}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* <AnimatedSafeAreaView style={[styles.header, { shadowOpacity }]}>
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
                        {
                            profile && (
                                <TouchableWithoutFeedback onPress={this.profile}>
                                    <View>
                                        <Avatar {...profile.pictures.one} />
                                    </View>
                                </TouchableWithoutFeedback>
                            )
                        }
                    </Animated.View>
                </AnimatedSafeAreaView> */}

                {
                    !this.state.renderFeed ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            // color='rgba(255, 184, 24, 0.8)'
                            color='rgba(255, 255, 255, 0.8)'
                        />
                        :
                        <Feed
                            store={feedStore}
                            onScroll={Animated.event([{
                                nativeEvent: {
                                    contentOffset: {
                                        y: scrollAnimation
                                    }
                                }
                            }])}
                            ListHeaderComponent={(
                                <Animated.View>

                                    {/* advertising banner */}
                                    <TouchableWithoutFeedback onPress={() => {
                                        let index;
                                        if (this.currentSwiperIndex === undefined) {
                                            index = 0;
                                        } else {
                                            index = this.currentSwiperIndex;
                                        }

                                        console.log('TouchableWithoutFeedback onPress', index);

                                        // ToDo: use index
                                    }}>
                                        <Swiper
                                            style={styles.wrapper}
                                            containerStyle={{ marginBottom: 20 }}
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
                                            {`${(this.state.feedSize) ? 'Explore all ' + this.state.feedSize + '+ girls' : 'Explore girls'} in ` + this.state.cityName}
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}
                            {...{ navigation }}
                        />
                }
            </View>
        );
    } // end of render()

    startEditing() {
        // alert('startEditing()');
    }

    leaveEditing() {
        // alert('leaveEditing()');
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'black'
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


    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center'
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
        color: 'white',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },

    // loading indicator
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },


    // test: advertising area
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        padding: Theme.spacing.small,
        flex: 1
    }



});
