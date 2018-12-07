// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import {
    StyleSheet, View, Animated, SafeAreaView, TouchableHighlight, TouchableWithoutFeedback,
    Platform, Dimensions, TouchableOpacity, TextInput, StatusBar, FlatList, Image, ScrollView
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
import SmartImage from "./rnff/src/components/SmartImage";

// const AnimatedText = Animated.createAnimatedComponent(Text);
// const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

/*
type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};
*/

const itemWidth = Dimensions.get('window').width - 40;
const itemHeight = parseInt(Dimensions.get('window').width - 40) / 4 * 3;



import Carousel from './Carousel';




// @inject("feedStore", "profileStore") @observer
// export default class Intro extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
export default class Intro extends React.Component {
    state = {
        // ToDo: 일단은 고정값으로 간다.
        // 추후 고정값이 아니라 query를 통해 가져와야 한다. place - feed length가 가장 많은 6개 (database indexes를 써서 미리 내림차순정렬로 가지고 있자.)
        // 이 때 thumbnail은 어떻게 가져올 지 고민!!
        places: [
            {
                place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                description: 'Bangkok, Thailand',
                city: 'Bangkok',
                uri: require('../assets/place/Bangkok.jpg'),
                length: 0
            },
            {
                place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk',
                description: 'Manila, Philippines',
                city: 'Manila',
                uri: require('../assets/place/Manila.jpg'),
                length: 0
            },
            {
                place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E',
                description: 'Ho Chi Minh, Vietnam',
                city: 'Ho Chi Minh',
                uri: require('../assets/place/HoChiMinh.jpg'),
                length: 0
            },
            {
                place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8',
                description: 'Vientiane, Laos',
                city: 'Vientiane',
                uri: require('../assets/place/Vientiane.jpg'),
                length: 0
            },
            {
                place_id: 'ChIJ42tqxz1RCTERuyW1WugOAZw',
                description: 'Phnom Penh, Cambodia',
                city: 'Phnom Penh',
                uri: require('../assets/place/PhnomPenh.jpg'),
                length: 0
            },
            {
                place_id: 'ChIJnUvjRenzaS4RoobX2g-_cVM',
                description: 'Jakarta, Indonesia',
                city: 'Jakarta',
                uri: require('../assets/place/Macau.jpg'),
                length: 0
            }
        ],

        searchText: '',


        childrenLength: 5,
        currentPage: 0,

    };

    constructor(props) {
        super(props);

        this.offset = 0;
        this.nextPage = 0;
    }




    /*
    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }
    */

    async componentDidMount() {
        // test
        console.log('window width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        console.log('window height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812


        // ToDo: load city length
        // let _places = await Firebase.getPlaceLength(this.state.places);

        const places = this.state.places;
        for (var i = 0; i < places.length; i++) {
            let placeId = places[i].place_id;

            let size = 0;
            // get document length
            await Firebase.firestore.collection("place").doc(placeId).collection("feed").get().then(snapshot => {
                size = snapshot.size;
                console.log('getPlaceLength()', size);
            });

            places[i].length = size;
        }

        !this.isClosed && this.setState({ places });
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

    render(): React.Node {
        // const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;


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
                            style={{ position: 'absolute', left: 12, top: 8, alignSelf: 'baseline' }}
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
                    // scrollEventThrottle={1}
                    columnWrapperStyle={styles.columnWrapperStyle}
                    numColumns={2}
                    data={this.state.places}
                    keyExtractor={item => item.place_id}
                    renderItem={({ item, index }) => {
                        return (
                            <TouchableOpacity onPress={() =>
                                this.props.navigation.navigate("homeStackNavigator", { place: item, length: this.state.places[index].length })}>
                                <View style={styles.pictureContainer}>
                                    <Image
                                        style={styles.picture}
                                        source={item.uri}
                                    />

                                    <View style={styles.content}>
                                        <Text style={{
                                            // textAlign: 'left',
                                            // color: "white",
                                            // fontSize: 17,
                                            // lineHeight: 22,

                                            textAlign: 'center',
                                            fontWeight: '500',
                                            color: "white",
                                            // fontSize: 22,
                                            fontSize: parseInt(Dimensions.get('window').width / 100) + 18,
                                            fontFamily: "SFProText-Semibold"
                                        }}>{item.city}</Text>

                                        <Text style={{
                                            // textAlign: 'left',
                                            // color: "rgb(211, 211, 211)",
                                            // fontSize: 15,
                                            // lineHeight: 20,

                                            textAlign: 'center',
                                            fontWeight: '500',
                                            color: "rgba(211, 211, 211, 0.8)",
                                            // fontSize: 18,
                                            fontSize: parseInt(Dimensions.get('window').width / 100) + 12,
                                            fontFamily: "SFProText-Regular"
                                        }}>{`${(item.length) ? item.length + '+ girls' : ''}`}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListFooterComponent={(
                        <View style={{ marginTop: 20 }}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Top-rated girls'}</Text>
                            </View>


                            {/* Add image carousel here.. */}

                            <ScrollView
                                style={{ paddingBottom: Theme.spacing.base }}
                                ref={(scrollView) => { this.scrollView = scrollView; }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}

                                // decelerationRate={0.7}

                                decelerationRate={'fast'}
                                snapToInterval={Dimensions.get('window').width - 30} // width - (YOUR_INSET_LEFT + YOUR_INSET_RIGHT)
                                snapToAlignment={"center"}
                                /*
                                contentInset={{
                                    top: 0,
                                    left: 15, // YOUR_INSET_LEFT
                                    bottom: 0,
                                    right: 15, // YOUR_INSET_RIGHT
                                }}
                                */
                                contentInset={{ top: 0 }}
                                automaticallyAdjustContentInsets={false}

                                alwaysBounceHorizontal={false}
                                alwaysBounceVertical={false}


                                bounces={false}
                            >
                                <View style={styles.view1}>
                                    <SmartImage
                                        style={styles.item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'http://kr.people.com.cn/NMediaFile/2017/0804/FOREIGN201708041514000585670445943.jpg'}
                                    />
                                </View>
                                <View style={styles.view2}>
                                    <SmartImage
                                        style={styles.item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'http://image.cloud.sbs.co.kr/smr/clip/201806/15/Xj56w3N3h7jEMCD5cyJZ4f_640.jpg'}
                                    />
                                </View>
                                <View style={styles.view3}>
                                    <SmartImage
                                        style={styles.item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://www.thedailypost.kr/wp-content/uploads/2017/02/H52Am.jpg'}
                                    />
                                </View>
                                <View style={styles.view4}>
                                    <SmartImage
                                        style={styles.item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'http://kstatic.inven.co.kr/upload/2017/07/05/bbs/i13856102909.jpg'}
                                    />
                                </View>
                                <View style={styles.view5}>
                                    <SmartImage
                                        style={styles.item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                    />
                                </View>
                            </ScrollView>

                            {/*
                            <Carousel
                                style={styles.wrapper}
                                containerStyle={{ marginBottom: 20 }}
                                width={Dimensions.get('window').width}
                                height={Dimensions.get('window').width / 4 * 3}
                                loop={false}
                                autoplay={false}
                                // paginationStyle={{ bottom: 4 }}
                                onIndexChanged={(index) => {
                                    // console.log('onIndexChanged', index);
                                    this.currentSwiperIndex = index;
                                }}
                            >
                                <View style={styles.slide_f} key={'0'}>
                                    <SmartImage
                                        style={styles._item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                    />
                                </View>
                                <View style={styles.slide_m} key={'1'}>
                                    <SmartImage
                                        style={styles._item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile10.uf.tistory.com%2Fimage%2F2535634A58D7CE280462A4'}
                                    />
                                </View>
                                <View style={styles.slide_m} key={'2'}>
                                    <SmartImage
                                        style={styles._item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://cdn.clien.net/web/api/file/F01/5277958/e16aaf1ee2f745acb1d.PNG?w=780&h=30000'}
                                    />
                                </View>
                                <View style={styles.slide_l} key={'3'}>
                                    <SmartImage
                                        style={styles._item}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        uri={'https://scontent-frx5-1.cdninstagram.com/vp/d1db3afc164d1ca671eeb1a8e2c4ded5/5C82F8D0/t51.2885-15/e35/43063022_181319842784322_7879118230333023640_n.jpg?se=8&ig_cache_key=MTg4NDk1MzA4NDIzMzQxOTYyMA%3D%3D.2'}
                                    />
                                </View>
                            </Carousel>
                            */}


                        </View>
                    )}
                />

            </View>
        );
    } // end of render()

    startEditing() {
        // alert('startEditing()');
    }

    leaveEditing() {
        // alert('leaveEditing()');
    }



    _onScrollEnd = (event) => {
        const offset = { ...event.nativeEvent.contentOffset };
        const page = this._calculateCurrentPage(offset.x);

        this._placeCritical(page);
        this._setCurrentPage(page);
    }

    _calculateCurrentPage = (offset) => {
        // const { width } = this.state.size;
        const width = Dimensions.get('window').width - 20;
        const page = Math.round(offset / width); // index



        return this._normalizePageNumber(page);
    }

    _normalizePageNumber = (page) => {
        const { childrenLength } = this.state;

        if (page === childrenLength) {
            return 0;
        } else if (page > childrenLength) {
            return 1;
        } else if (page < 0) {
            return childrenLength - 1;
        }
        return page;
    }

    _placeCritical = (page) => {
        // const { isLooped } = this.props;
        const { childrenLength } = this.state;
        const width = Dimensions.get('window').width;
        let offset = 0;
        // if page number is bigger then length - something is incorrect
        if (page < childrenLength) {
            offset = page * width;
        }

        this._scrollTo({ offset, animated: true });
    }

    _scrollTo = ({ offset, animated, nofix }) => {
        offset = offset - 30;

        console.log('_scrollTo', offset);

        if (this.scrollView) {
            this.scrollView.scrollTo({ y: 0, x: offset, animated });

            // Fix bug #50
            if (!nofix && Platform.OS === 'android' && !animated) { // ToDo
                this.scrollView.scrollTo({ y: 0, x: offset, animated: true });
            }
        }
    }

    _setCurrentPage = (currentPage) => {
        this.setState({ currentPage: currentPage });
    }



    _onScroll = (event) => {
        const currentOffset = event.nativeEvent.contentOffset.x;
        const direction = currentOffset > this.offset ? 'right' : 'left';
        this.offset = currentOffset;

        const nextPage = this._calculateNextPage(direction);
        if (this.nextPage !== nextPage) {
            this.nextPage = nextPage;
        }
    }

    _calculateNextPage = (direction) => {
        const width = Dimensions.get('window').width;
        const ratio = this.offset / width;
        const page = direction === 'right' ? Math.ceil(ratio) : Math.floor(ratio);
        return this._normalizePageNumber(page);
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
        flex: 1,
        justifyContent: 'center'
    },

    //// picture ////
    pictureContainer: {
        // width: parseInt(Dimensions.get('window').width) / 2 - 12,
        // height: parseInt(Dimensions.get('window').width) / 2 - 12,
        width: parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2,
        height: parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2,
        borderRadius: 2,
        // marginVertical: Theme.spacing.tiny,
        // marginHorizontal: Theme.spacing.tiny
        marginVertical: 4,
        marginHorizontal: 4,
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
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        padding: Theme.spacing.small,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
        // justifyContent: 'flex-end'
    },

    //// ScrollView ////
    view1: {
        backgroundColor: 'blue',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        // paddingHorizontal : 30
        // margin: 10
        /*
        marginLeft: 20,
        marginRight: 5
        */
        marginLeft: 20,
        marginRight: 5
    },
    view2: {
        backgroundColor: 'red',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        // paddingHorizontal : 30
        marginLeft: 5,
        marginRight: 5
    },
    view3: {
        backgroundColor: 'orange',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        // paddingHorizontal : 30
        marginLeft: 5,
        marginRight: 5
    },
    view4: {
        backgroundColor: 'yellow',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        // paddingHorizontal : 30
        marginLeft: 5,
        marginRight: 5
    },
    view5: {
        backgroundColor: 'green',
        width: itemWidth,
        height: itemHeight,
        borderRadius: 2,
        // paddingHorizontal : 30
        marginLeft: 5,
        marginRight: 20
    },
    item: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },

    //// Carousel ////
    wrapper: {
        // marginLeft: 10
    },
    slide_f: {
        /*
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
        */
        backgroundColor: 'green',
        width: itemWidth,
        height: itemHeight,
        /*
        marginLeft: 20,
        marginRight: 5
        */
    },
    slide_m: {
        backgroundColor: 'green',
        width: itemWidth,
        height: itemHeight,
        /*
        marginLeft: 5,
        marginRight: 5
        */
    },
    slide_l: {
        backgroundColor: 'green',
        width: itemWidth,
        height: itemHeight,
        /*
        marginLeft: 5,
        marginRight: 20
        */
    },
    _item: {
        width: '100%',
        height: '100%'
    },




});
