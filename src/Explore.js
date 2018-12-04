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

        renderFeed: false,

        // localFeeds: new FeedStore(),

    };

    /*
    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }
    */

    componentDidMount() {
        let place = this.props.screenProps.params.place;
        console.log('place', place);

        !this.isClosed && this.setState({ searchText: place.description });

        // ToDo: database indexes
        const query = Firebase.firestore.collection("place").doc(place.place_id).collection("feed").orderBy("timestamp", "desc");
        // this.state.localFeeds.init(query);
        this.props.feedStore.init(query);



        setTimeout(() => {
            !this.isClosed && this.setState({ renderFeed: true });
        }, 0);
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    loadFeed() { // load girls
        /*
        this.props.feedStore.checkForNewEntriesInFeed();


        // 1. get user location
        const { uid } = Firebase.auth.currentUser;
        Firebase.firestore.collection('users').doc(uid).get().then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                console.log('user', doc.data());

                let user = doc.data();
                let place = user.location.description;
                console.log('user location', place);

                // 2.

            }
        });
        */


        /*
        if (!user || !user.country || !user.city) {
            // get gps
            try {
                let position = await this.getPosition();
            } catch (error) {
                console.log('getPosition error', error);

                return;
            }

        } else {
            console.log(user.country, user.city);
            location.country = user.country;
            location.city = user.city;
        }
        */

        // 2. get feed from the user location
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

        // const feedStore = this.state.localFeeds;

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
                        backgroundColor: 'rgb(60, 60, 60)',
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
                                    <Swiper
                                        style={styles.wrapper}
                                        containerStyle={{ marginBottom: 100 }}
                                        width={Dimensions.get('window').width}
                                        height={Dimensions.get('window').width / 21 * 9}
                                        loop={false}
                                        autoplay={true}
                                        autoplayTimeout={3}
                                        paginationStyle={{ bottom: 4 }}
                                    >
                                        <View style={styles.slide}>
                                            <TouchableWithoutFeedback onPress={() => {
                                                console.log('move to Intro');
                                                this.moveToIntro();
                                            }}>
                                                <SmartImage
                                                    style={styles.item}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                                />
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.slide}>
                                            <TouchableWithoutFeedback onPress={() => {
                                                console.log('move to Intro');
                                                // this.moveToIntro();
                                            }}>
                                                <SmartImage
                                                    style={styles.item}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={'https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile10.uf.tistory.com%2Fimage%2F2535634A58D7CE280462A4'}
                                                />
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.slide}>
                                            <TouchableWithoutFeedback onPress={() => {
                                                console.log('move to Intro');
                                                // this.moveToIntro();
                                            }}>
                                                <SmartImage
                                                    style={styles.item}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={'https://cdn.clien.net/web/api/file/F01/5277958/e16aaf1ee2f745acb1d.PNG?w=780&h=30000'}
                                                />
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.slide}>
                                            <TouchableWithoutFeedback onPress={() => {
                                                console.log('move to Intro');
                                                // this.moveToIntro();
                                            }}>
                                                <SmartImage
                                                    style={styles.item}
                                                    preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                                    uri={'https://scontent-frx5-1.cdninstagram.com/vp/d1db3afc164d1ca671eeb1a8e2c4ded5/5C82F8D0/t51.2885-15/e35/43063022_181319842784322_7879118230333023640_n.jpg?se=8&ig_cache_key=MTg4NDk1MzA4NDIzMzQxOTYyMA%3D%3D.2'}
                                                />
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </Swiper>
                                    {/*
                                    <TouchableOpacity onPress={() => {
                                        console.log('move to Intro');
                                        this.moveToIntro();
                                    }}>
                                        <SmartImage
                                            style={styles.ad}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                        />
                                    </TouchableOpacity>
                                    */}

                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>{'Explore all ???+ girls'}</Text>
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
        backgroundColor: 'rgb(40, 40, 40)'
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

    //// SEARCH BAR ////
    searchBarStyle: {
        height: Constants.statusBarHeight + Header.HEIGHT,
        paddingBottom: 14 + 2,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    //// Swiper ////
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
        height: Dimensions.get('window').width / 21 * 9,
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
    }



});
