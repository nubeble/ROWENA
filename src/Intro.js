/*
    실행 시 최소 6개의 place (각 place는 1개 이상의 feed 소유.)가 있어야 한다!
    그래야 2 x 3 이미지 행렬이 제대로 보인다.
*/

// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image
} from "react-native";
import { Header } from 'react-navigation';
import { Svg } from "expo";
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import SmartImage from "./rnff/src/components/SmartImage";
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';
import { Cons, Vars } from "./Globals";
import autobind from "autobind-decorator";

/*
type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};
*/

const PLACE_SIZE = 6;
const FEED_SIZE = 8;

const _itemWidth = Dimensions.get('window').width - 40;
const _itemHeight = parseInt(Dimensions.get('window').width - 40) / 5 * 3;

/*
const skeletonViewWidth = Dimensions.get('window').width;
const skeletonViewHeight = (4 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 4) * 3;
*/


// @inject("feedStore", "profileStore") @observer
// export default class Intro extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
export default class Intro extends React.Component {
    // places images
    static images = [
        PreloadImage.Avatar1,
        PreloadImage.Avatar2,
        PreloadImage.Avatar3,
        PreloadImage.Avatar4,
        PreloadImage.Avatar5,
        PreloadImage.Avatar6,
        PreloadImage.Avatar7,
        PreloadImage.Avatar8,
        PreloadImage.Avatar9
    ];

    // popular feeds images
    static popularFeedsImages = [
        PreloadImage.Avatar1,
        PreloadImage.Avatar2,
        PreloadImage.Avatar3,
        PreloadImage.Avatar4,
        PreloadImage.Avatar5,
        PreloadImage.Avatar6,
        PreloadImage.Avatar7,
        PreloadImage.Avatar8,
        PreloadImage.Avatar9
    ];

    // recent feeds images
    static recentFeedsImages = [
        PreloadImage.Avatar1,
        PreloadImage.Avatar2,
        PreloadImage.Avatar3,
        PreloadImage.Avatar4,
        PreloadImage.Avatar5,
        PreloadImage.Avatar6,
        PreloadImage.Avatar7,
        PreloadImage.Avatar8,
        PreloadImage.Avatar9
    ];

    state = {
        // set the initial places (6)
        places: [
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'one'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'two'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'three'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'four'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'five'
            },
            {
                place_id: null,
                length: 0,
                name: null,
                uri: null,
                key: 'six'
            }
        ],

        popularFeeds: [],
        recentFeeds: [],

        searchText: '',
        refreshing: false
    };

    async componentDidMount() {
        console.log('Intro.componentDidMount');

        // console.log('window width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        // console.log('window height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812

        this.onFocusListener = this.props.navigation.addListener('didFocus', this.onFocus);

        // await this.getPlacesImage();
        // this.getPlacesSize();

        await this.getPlaces();

        await this.getPopularFeeds();
        await this.getRecentFeeds();
    }

    async getPlacesImage() {
        const _places = this.state.places;

        let places = [...this.state.places];

        for (var i = 0; i < _places.length; i++) {
            let placeId = _places[i].place_id;
            const uri = await Firebase.getPlaceRandomFeedImage(placeId);
            if (!uri) continue;

            const _uri = { "uri": uri };

            /*
            let index = places.findIndex(el => el.place_id === placeId);
            if (index !== -1) {
                places[index] = { ...places[index], uri: _uri };
                // Intro.images[i] = _uri;

                // load one by one
                !this.closed && this.setState({ places });
                Intro.images[i] = _uri;
            }
            */

            places[i] = { ...places[i], uri: _uri };
            Intro.places[i] = places[i];

            // load one by one
            !this.closed && this.setState({ places });




            /*
            places[i] = { ...places[i], uri: _uri };
            Intro.images[i] = _uri;
            */
        }

        // load all at once
        // !this.closed && this.setState({ places, refreshing: false });
    }

    /*
    async getPlacesSize() {
        let places = this.state.places;

        const ref1 = Firebase.firestore.collection("place").doc(places[0].place_id);
        const ref2 = Firebase.firestore.collection("place").doc(places[1].place_id);
        const ref3 = Firebase.firestore.collection("place").doc(places[2].place_id);
        const ref4 = Firebase.firestore.collection("place").doc(places[3].place_id);
        const ref5 = Firebase.firestore.collection("place").doc(places[4].place_id);
        const ref6 = Firebase.firestore.collection("place").doc(places[5].place_id);

        let count1 = 0, count2 = 0, count3 = 0, count4 = 0, count5 = 0, count6 = 0;

        await Firebase.firestore.runTransaction(transaction => {
            return new Promise(resolve => {
                const t1 = transaction.get(ref1);
                const t2 = transaction.get(ref2);
                const t3 = transaction.get(ref3);
                const t4 = transaction.get(ref4);
                const t5 = transaction.get(ref5);
                const t6 = transaction.get(ref6);

                const all = Promise.all([t1, t2, t3, t4, t5, t6]);
                all.then(docs => {
                    doc1 = docs[0];
                    doc2 = docs[1];
                    doc3 = docs[2];
                    doc4 = docs[3];
                    doc5 = docs[4];
                    doc6 = docs[5];

                    if (doc1.exists) count1 = doc1.data().count;
                    if (doc2.exists) count2 = doc2.data().count;
                    if (doc3.exists) count3 = doc3.data().count;
                    if (doc4.exists) count4 = doc4.data().count;
                    if (doc5.exists) count5 = doc5.data().count;
                    if (doc6.exists) count6 = doc6.data().count;

                    resolve(true);
                });
            });
        });

        console.log(count1, count2, count3, count4, count5, count6);

        places[0].length = count1;
        places[1].length = count2;
        places[2].length = count3;
        places[3].length = count4;
        places[4].length = count5;
        places[5].length = count6;

        this.setState({ places, refreshing: false });
    }
    */

    getPlacesSize() { // load feed length of each cities
        let __places = this.state.places;

        for (var i = 0; i < __places.length; i++) {
            let placeId = __places[i].place_id;

            this.unsubscribeToPlaceSize = Firebase.subscribeToPlaceSize(placeId, (count) => {
                let places = [...this.state.places];
                let index = places.findIndex(el => el.place_id === placeId); // snap.id
                if (index !== -1) {
                    console.log('watchPlaceSize', index, count);

                    places[index] = { ...places[index], length: count };
                    !this.closed && this.setState({ places });
                }
            });

            // if (this.state.refreshing) !this.closed && this.setState({ refreshing: false });
        }
    }

    async getPlaces() {
        const size = PLACE_SIZE;

        const snap = await Firebase.firestore.collection("place").orderBy("count", "desc").limit(size).get();

        if (snap.docs.length !== 0) {
            let places = [...this.state.places];

            var i = 0;

            snap.forEach(async (doc) => {
                // console.log(doc.id, '=>', doc.data());
                const data = doc.data();

                const uri = await Firebase.getPlaceRandomFeedImage(doc.id);
                // if (!uri) continue;

                places[i] = {
                    // ...places[i],

                    place_id: doc.id,
                    length: data.count,

                    name: data.name,
                    uri,
                    key: doc.id
                };

                Intro.images[i] = { 'uri': uri };

                !this.closed && this.setState({ places });

                i++;
            });
        }
    }

    async getPopularFeeds() {
        /*
        const size = FEED_SIZE;

        let popularFeeds = [...this.state.popularFeeds];

        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            // console.log('!!!!!!!!!!!!!!!!!', placeId) // ToDo

            const feed = await Firebase.getFeedByAverageRating(placeId);

            popularFeeds[i] = feed;
            Intro.popularFeedsImages[i] = { 'uri': feed.pictures.one.uri };
        }

        !this.closed && this.setState({ popularFeeds });
        */

        const size = FEED_SIZE;
        let placeList = [];
        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            placeList.push(placeId);
        }
        placeList.sort();

        const prevItem = null;
        let array = {};
        for (var i = 0; i < size; i++) {
            const item = placeList[i];

            if (item === prevItem) {
                array[item]++;
            } else {
                // new item
                array[item] = 1;
                prevItem = item;
            }
        }

        console.log('array', array);

        let popularFeeds = [...this.state.popularFeeds];
        let index = 0;

        // map search
        for (var [key, value] of array) {
            console.log(key + ":" + value);

            const feeds = await Firebase.getFeedByAverageRating(key, value);

            for (var i = 0; i < feeds.length; i++) {
                const feed = feeds[i];

                popularFeeds[index] = feed;
                Intro.popularFeedsImages[index] = { 'uri': feed.pictures.one.uri };

                index++;
            }
        }

        !this.closed && this.setState({ popularFeeds });
    }

    async getRecentFeeds() {
        /*
        const size = FEED_SIZE;

        let recentFeeds = [...this.state.recentFeeds];

        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            // console.log('@@@@@@@@@@@@@@@@@@@@@@', placeId)  // ToDo

            const feed = await Firebase.getFeedByTimestamp(placeId);

            recentFeeds[i] = feed;
            Intro.recentFeedsImages[i] = { 'uri': feed.pictures.one.uri };
        }

        !this.closed && this.setState({ recentFeeds });
        */

        const size = FEED_SIZE;
        let placeList = [];
        for (var i = 0; i < size; i++) {
            const placeId = await Firebase.getRandomPlace();
            placeList.push(placeId);
        }
        placeList.sort();

        const prevItem = null;
        let array = {};
        for (var i = 0; i < size; i++) {
            const item = placeList[i];

            if (item === prevItem) {
                array[item]++;
            } else {
                // new item
                array[item] = 1;
                prevItem = item;
            }
        }

        console.log('array', array);

        let recentFeeds = [...this.state.recentFeeds];
        let index = 0;

        // map search
        for (var [key, value] of array) {
            console.log(key + ":" + value);

            const feeds = await Firebase.getFeedByAverageRating(key, value);

            for (var i = 0; i < feeds.length; i++) {
                const feed = feeds[i];

                recentFeeds[index] = feed;
                Intro.recentFeedsImages[index] = { 'uri': feed.pictures.one.uri };

                index++;
            }
        }

        !this.closed && this.setState({ recentFeeds });
    }

    @autobind
    onFocus() {
        Vars.currentScreenName = 'Intro';

    }

    componentWillUnmount() {
        if (this.unsubscribeToPlaceSize) this.unsubscribeToPlaceSize();

        this.onFocusListener.remove();

        this.closed = true;
    }

    render(): React.Node {
        // const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;


        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: Theme.color.component,
                        borderRadius: 25
                    }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 2, top: (34 - 30) / 2, width: 30, height: 30, justifyContent: "center", alignItems: "center" }}
                            onPress={() => {
                                this.props.navigation.navigate("introSearchModal");
                            }}
                        >
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                this.props.navigation.navigate("introSearchModal");
                            }}
                        >

                            {/*
                            <TextInput
                                // ref='searchInput'
                                pointerEvents="none"
                                editable={false}
                                style={{ width: '100%', height: '100%', backgroundColor: 'green', fontSize: 16, fontFamily: "SFProText-Semibold", color: "white", textAlign: 'center' }}
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
                                    color: "rgb(160, 160, 160)", textAlign: 'center'
                                }}
                            >{'Where to?'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Popular destinations'}</Text>
                            </View>
                        </View>
                    }

                    /*
                    ListEmptyComponent={
                        <View>
                            <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton} secondaryColor="grey" width={skeletonViewWidth} height={skeletonViewHeight}>
                                <Svg.Rect
                                    x={8}
                                    y={8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />

                                <Svg.Rect
                                    x={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    y={8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />

                                <Svg.Rect
                                    x={8}
                                    y={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />

                                <Svg.Rect
                                    x={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    y={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />

                                <Svg.Rect
                                    x={8}
                                    y={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />

                                <Svg.Rect
                                    x={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    y={8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8 + parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2 + 8}
                                    width={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                    height={parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2}
                                />
                            </SvgAnimatedLinearGradient>
                        </View>
                    }
                    */

                    columnWrapperStyle={styles.columnWrapperStyle}
                    numColumns={2}
                    data={this.state.places}
                    // keyExtractor={item => item.place_id}
                    keyExtractor={item => item.key}

                    renderItem={({ item, index }) => {
                        const place_id = item.place_id;
                        const length = item.length;
                        const name = item.name;
                        let uri = item.uri;

                        let source;
                        if (uri) {
                            source = { 'uri': uri };
                        } else {
                            source = Intro.images[index];
                        }

                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    if (!place_id) return;

                                    setTimeout(() => {
                                        this.props.navigation.navigate("exploreMain", { place: item, length: item.length });
                                    }, Cons.buttonTimeoutLong);
                                }}
                            >
                                <View style={styles.pictureContainer}>

                                    <Image
                                        style={styles.picture}
                                        source={source}
                                    />
                                    {/*
                                    <SmartImage
                                        style={styles.picture}
                                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                        // preview={item.preview}
                                        uri={_uri}
                                    />
                                    */}

                                    <View style={styles.content}>
                                        <Text style={{
                                            textAlign: 'center',
                                            color: Theme.color.title,
                                            fontSize: 20,
                                            lineHeight: 26,
                                            fontFamily: "SFProText-Bold"
                                        }}>{name}</Text>

                                        <Text style={{
                                            textAlign: 'center',
                                            color: Theme.color.subtitle,
                                            fontSize: 14,
                                            lineHeight: 18,
                                            fontFamily: "SFProText-Semibold"
                                        }}>{`${(length) ? length + '+ girls' : ''}`}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}

                    ListFooterComponent={
                        <View style={{ marginTop: 20 }}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Top-rated girls'}</Text>
                            </View>

                            {
                                this.renderPopularFeeds()
                            }
                            {/*
                            <Carousel>
                                <View style={styles.view_front}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('1')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://2.bp.blogspot.com/-z2h6jj8PCKw/WiVyrSTiBUI/AAAAAAAAG7A/9D8ggDsoY5QArutqvVfzhSd82f5GtviAgCLcBGAs/s1600/%25EC%25A0%259C%25EB%25AA%25A9-%25EC%2597%2586%25EC%259D%258C2.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('2')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://coinpan.com/files/attach/images/198/637/529/067/504ea1e1eae11d0485347359ba31e0c5.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('3')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.nemopan.com/files/attach/images/6294/443/061/012/2926fb2e2919796604716f0aeb79c39b.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('4')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://t1.daumcdn.net/cfile/tistory/253E1A3D56F8F68821'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('5')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://fimg4.pann.com/new/download.jsp?FileID=47136904'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Carousel>
                            */}

                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Recently listed girls'}</Text>
                            </View>

                            {
                                this.renderRecentFeeds()
                            }
                            {/*
                            <Carousel>
                                <View style={styles.view_front}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('1')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://ncache.ilbe.com/files/attach/new/20150710/377678/2901603725/6167124321/0c0e48771650a5ea45b0ec6ef4620faf.jpg'}
                                        // uri={'http://www.city.kr/files/attach/images/238/919/279/004/5e68e793cb4707dda80030169c395b30.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('2')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.city.kr/files/attach/images/238/919/279/004/5e68e793cb4707dda80030169c395b30.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('3')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://fimg4.pann.com/new/download.jsp?FileID=47449859'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('4')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile22.uf.tistory.com%2Fimage%2F99F75D335997CD46295649'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('5')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://www.city.kr/files/attach/images/238/795/978/010/00616702b6cfe1f570fb4c11730fa0cc.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('6')}>
                                        <SmartImage
                                            style={styles.item}
                                            // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Carousel>
                            */}
                        </View>
                    }

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                />
            </View>
        );
    } // end of render()

    renderPopularFeeds() {
        let feeds = this.state.popularFeeds;
        if (feeds.length === 0) {
            // use static value (skeleton image or previous image)
            for (var i = 0; i < FEED_SIZE; i++) {
                const feed = {};
                feed.id = 'id' + i;
                feed.uri = Intro.popularFeedsImages[i];

                feeds.push(feed);
            }
        }


        let pictures = [];

        for (var i = 0; i < feeds.length; i++) {
            const feed = feeds[i];

            let source;
            if (feed.placeId) { // state value
                const uri = feed.pictures.one.uri;
                source = { 'uri': uri };
            } else { // static value
                source = feed.uri;
            }

            if (i === 0) {
                pictures.push(
                    <View key={feed.id} style={styles.view_front}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('front', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            {/*
                            <SmartImage
                                style={styles.item}
                                // preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={feed.pictures.one.uri}
                            />
                            */}
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                pictures.push(
                    <View key={feed.id} style={styles.view_rear}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('rear', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            } else {
                pictures.push(
                    <View key={feed.id} style={styles.view_middle}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('middle', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            }
        }


        return (
            <Carousel>
                {pictures}
            </Carousel>
        );
    }

    renderRecentFeeds() {
        let feeds = this.state.recentFeeds;
        if (feeds.length === 0) {
            // use static feeds (skeleton image or previous image)
            for (var i = 0; i < FEED_SIZE; i++) {
                const feed = {};
                feed.id = 'id' + i;
                feed.uri = Intro.popularFeedsImages[i];

                feeds.push(feed);
            }
        }


        let pictures = [];

        for (var i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            let source;
            if (feed.placeId) { // state value
                const uri = feed.pictures.one.uri;
                source = { 'uri': uri };
            } else { // static value
                source = feed.uri;
            }

            if (i === 0) {
                pictures.push(
                    <View key={feed.id} style={styles.view_front}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('front', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            } else if (i !== 0 && i === feeds.length - 1) {
                pictures.push(
                    <View key={feed.id} style={styles.view_rear}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('rear', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            } else {
                pictures.push(
                    <View key={feed.id} style={styles.view_middle}>
                        <TouchableOpacity activeOpacity={1.0} onPress={() => {
                            if (!feed.placeId) return;
                            // console.log('middle', i);
                            navigation.navigate("detail", { post: feed })
                        }}>
                            <Image
                                style={styles.item}
                                source={source}
                            />
                        </TouchableOpacity>
                    </View>
                );
            }
        }

        return (
            <Carousel>
                {pictures}
            </Carousel>
        );
    }

    handleRefresh = () => {
        if (this.refreshing) return;

        this.refreshing = true;

        this.setState(
            {
                refreshing: true
            },
            async () => {
                setTimeout(() => {
                    !this.closed && this.setState({ refreshing: false });
                }, 100);

                // await this.getPlacesImage();
                // this.getPlacesSize();

                await this.getPlaces();

                /*
                await this.getPopularFeeds();
                await this.getRecentFeeds();
                */

                this.refreshing = false;
            }
        );
    }

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
        // backgroundColor: 'black'
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 8,
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
        color: Theme.color.text2,
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
    contentContainer: {
        flexGrow: 1,
        // backgroundColor: 'black',
        paddingBottom: Theme.spacing.tiny
    },
    columnWrapperStyle: {
        /*
        marginRight: Theme.spacing.small,
        marginTop: Theme.spacing.small
        */
        flex: 1,
        justifyContent: 'center'
    },
    pictureContainer: {
        // width: parseInt(Dimensions.get('window').width) / 2 - 12,
        // height: parseInt(Dimensions.get('window').width) / 2 - 12,
        width: parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2,
        height: parseInt(Dimensions.get('window').width - 4 * 2 * 3) / 2,
        borderRadius: 2,
        // marginVertical: Theme.spacing.tiny,
        // marginHorizontal: Theme.spacing.tiny
        marginVertical: 4,
        marginHorizontal: 4
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
        // backgroundColor: "rgba(0, 0, 0, 0.3)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
        // justifyContent: 'flex-end'
    },
    view_front: {
        backgroundColor: 'black',
        width: _itemWidth,
        height: _itemHeight,
        borderRadius: 2,
        marginLeft: 20,
        marginRight: 5
    },
    view_middle: {
        backgroundColor: 'black',
        width: _itemWidth,
        height: _itemHeight,
        borderRadius: 2,
        marginLeft: 5,
        marginRight: 5
    },
    view_rear: {
        backgroundColor: 'black',
        width: _itemWidth,
        height: _itemHeight,
        borderRadius: 2,
        marginLeft: 5,
        marginRight: 20
    },
    item: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    }
});
