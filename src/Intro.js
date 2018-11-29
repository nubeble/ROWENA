// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import { StyleSheet, View, Animated, SafeAreaView, TouchableHighlight, TouchableWithoutFeedback, 
    Platform, Dimensions, TouchableOpacity, TextInput, StatusBar, FlatList, Image
} from "react-native";
import { Header } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import SearchModal from "./SearchModal";

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


// ToDo: 일단은 고정값으로 간다.
// 추후 고정값이 아니라 query를 통해 가져와야 한다. place - feed length가 가장 많은 6개 (database indexes를 써서 미리 내림차순정렬로 가지고 있자.)
// 이 때 thumbnail은 어떻게 가져올 지 고민!!
const places = [
    { // place
        place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
        description: 'Bangkok, Thailand',
        city: 'Bangkok',
        uri: require('../assets/place/Bangkok.jpg')
        // uri: '../assets/thumbnail/Bangkok.png' // require('../assets/splash.png')
        // uri: 'http://image.newdaily.co.kr/site/data/img/2015/06/10/2015061000209_0.png'
	},
	{
        place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk',
        description: 'Manila, Philippines',
        city: 'Manila',
        uri: require('../assets/place/Manila.jpg')
        // uri: 'http://image.newdaily.co.kr/site/data/img/2015/06/10/2015061000209_0.png'
        // uri: 'require("../assets/place/Manila.png")'
    },
    {
        place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E',
        description: 'Ho Chi Minh, Vietnam',
        city: 'Ho Chi Minh',
        uri: require('../assets/place/HoChiMinh.jpg')
        // uri: 'http://image.newdaily.co.kr/site/data/img/2015/06/10/2015061000209_0.png'
        // uri: 'require("../assets/place/HoChiMinh.png")'
    },
    {
        place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8',
        description: 'Vientiane, Laos',
        city: 'Vientiane',
        uri: require('../assets/place/Vientiane.jpg')
        // uri: 'http://image.newdaily.co.kr/site/data/img/2015/06/10/2015061000209_0.png'
        // uri: 'require("../assets/place/Vientiane.png")'
    },
    {
        place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8', // ToDo
        description: 'Phnom Penh, Cambodia',
        city: 'Phnom Penh',
        uri: require('../assets/place/PhnomPenh.jpg')
    },
    {
        place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8', // ToDo
        description: 'Macau, Macao',
        city: 'Macau',
        uri: require('../assets/place/Macau.jpg')
	}
];



@inject("feedStore", "profileStore") @observer
export default class Intro extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
    state = {
        scrollAnimation: new Animated.Value(0),

        searchText: '',

    };

    /*
    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }
    */

    componentDidMount() {
        // test
        console.log('window height', Dimensions.get('window').height); // iphone X: 812, Galaxy S7: 640, , Tango: 731
    }

    loadFeed() { // load girls
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

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;
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

        return (
            <View style={styles.flex}>

                <SearchModal ref='searchModal'></SearchModal>

                <View style={styles.searchBarStyle}>
                    <View style={{
                        width: '70%', height: 32,
                        backgroundColor: 'rgb(60, 60, 60)',
                        borderRadius: 25
                    }} >
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 12, top: 7, alignSelf: 'baseline' }}
                            onPress={() => {
                                this.refs.searchModal.showModal();
                            }}
                        >
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
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
                                style={{ width:'100%', height:'100%', fontSize: 17, color: "white", textAlign: 'center' }}
                                placeholder='Where to?' placeholderTextColor='rgb(160, 160, 160)'
                                // underlineColorAndroid="transparent"
                                // onTouchStart={() => this.startEditing()}
                                // onEndEditing={() => this.leaveEditing()}
                                value={this.state.searchText}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <View>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Popular destinations'}</Text>
                            </View>
                        </View>
                    )}
                    scrollEventThrottle={1}
                    columnWrapperStyle={styles.columnWrapperStyle}
                    numColumns={2}
                    data={places}
                    keyExtractor={item => item.place_id}
                    renderItem={({item, index}) => {
                        return (
                            <TouchableOpacity onPress={() => this.props.navigation.navigate("homeStackNavigator", { place: item, key: this.props.navigation.state.key })}>
                                <View style={styles.pictureContainer}>
                                    <Image
                                        style={styles.picture}
                                        source={item.uri}
                                    />

                                    <View style={styles.content}>
                                        <Text style={ {
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            color: "white",
                                            fontSize: 21,
                                            // flexWrap: "wrap"
                                            }}>{item.city}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListFooterComponent={(
                        <View style={{marginTop: 20}}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Top-rated girls'}</Text>
                            </View>


                            {/* Add image carousel here.. */}



                        </View>
                    )}
                />



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

                
            </View>
        );
    } // end of render()

    startEditing() {
        // ToDo: add animation
        // alert('startEditing()');
    }

    leaveEditing() {
        // ToDo: add animation
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
    ad: {
        width: parseInt(Dimensions.get('window').width) - 2,
        height: (parseInt(Dimensions.get('window').width) - 2) / 21 * 9,
        marginBottom: Theme.spacing.small
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
    //// FlatList ////
    contentContainer: {
        flexGrow: 1,
        backgroundColor: 'rgb(40, 40, 40)',
        paddingBottom: Theme.spacing.base
    },
    columnWrapperStyle: {
        /*
        marginRight: Theme.spacing.small,
        marginTop: Theme.spacing.small
        */
        flex:1,
        justifyContent: 'center'
    },

    //// picture ////
    pictureContainer: {
        width: parseInt(Dimensions.get('window').width) / 2 - 24,
        height: parseInt(Dimensions.get('window').width) / 2 - 24,
        borderRadius: 2,
        // backgroundColor: "yellow",
        marginVertical: Theme.spacing.tiny,
        marginHorizontal: Theme.spacing.tiny
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
        borderRadius: 2,
        // backgroundColor: "transparent",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        justifyContent: 'center'
    },



});
