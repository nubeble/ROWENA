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
import { Globals } from "./Globals";

type InjectedProps = {
    // feedStore: FeedStore,
    profileStore: ProfileStore
};

const MAX_FEED_COUNT = 12; // 3 x 4
// const MAX_FEED_COUNT = 3;


// @inject("feedStore", "profileStore") @observer
@inject("profileStore")
@observer
export default class ProfileMain extends React.Component<ScreenProps<> & InjectedProps> {
    state = {
        renderFeed: false,
        showIndicator: false,
        showAlert: false,

        uploadingImage: false,
        uploadImage1: 'http://imgnews.naver.net/image/001/2017/05/20/PYH2017052019870001300_P2_20170520101607447.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',

        feeds: [],
        isLoadingFeeds: false,
        refreshing: false
    };

    constructor(props) {
        super(props);

        this.lastFeedId = null;
        this.lastLoadedFeedIndex = -1;
        this.lastLoadedFeedId = null;
        this.reload = true;
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        // console.log('this.props.feedStore', this.props.feedStore);
        // console.log('this.props.profileStore', this.props.profileStore);
        // console.log('this.props.userFeedStore', this.props.userFeedStore);

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);

        // this.props.userFeedStore.checkForNewEntriesInFeed();


        // const { profile } = this.props.profileStore;

        this.getUserFeeds();

        setTimeout(() => {
            !this.isClosed && this.setState({ renderFeed: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            // this.props.navigation.dispatch(NavigationActions.back()); // move to intro
            // this.props.screenProps.rootNavigation.navigate("intro");
            this.props.navigation.navigate("intro");
        }

        return true;
    }

    @autobind
    onScrollHandler() {
        // console.log('ProfileMain.onScrollHandler');

        this.getUserFeeds();
    }

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();

        this.isClosed = true;
    }

    async getUserFeeds() {
        if (this.state.isLoadingFeeds) {
            this.setState({ refreshing: false });
            return;
        }

        this.setState({ isLoadingFeeds: true });


        const { profile } = this.props.profileStore;
        const feeds = profile.feeds;
        const keys = Object.keys(feeds);
        const length = keys.length;

        if (length === 0) {
            this.setState({ isLoadingFeeds: false, refreshing: false });
            return;
        }

        // get the last feed id
        const lastFeedId = this.getLastFeedId(feeds);

        // console.log('this.lastFeedId', this.lastFeedId);
        // console.log('lastFeedId', lastFeedId);

        if (this.lastFeedId !== lastFeedId) {
            this.lastFeedId = lastFeedId;

            // reload from the start
            this.lastLoadedFeedIndex = -1;

            this.reload = true;
        }

        // console.log('this.lastLoadedFeedIndex', this.lastLoadedFeedIndex);

        if (this.lastLoadedFeedIndex === 0) {
            this.setState({ isLoadingFeeds: false, refreshing: false });
            return;
        }

        let newFeeds = [];

        let startIndex = 0;
        if (this.lastLoadedFeedIndex === -1) {
            startIndex = length - 1;
        } else {
            startIndex = this.lastLoadedFeedIndex - 1;
        }

        let count = 0;

        for (var i = startIndex; i >= 0; i--) {
            if (count >= MAX_FEED_COUNT) break;

            const num = i;
            const key = num.toString();
            const value = feeds.get(key);
            // console.log(key, value);

            if (!value.valid) continue;

            newFeeds.push(value);

            this.lastLoadedFeedId = value.feedId;
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

    getLastFeedId(feeds) {
        const keys = Object.keys(feeds);
        const length = keys.length;

        const num = length - 1;
        const key = num.toString();
        const value = feeds.get(key);

        return value.feedId;
    }

    async openPost(item) {
        const placeId = item.placeId;
        const feedId = item.feedId;
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        const post = feedDoc.data();

        this.props.navigation.navigate("postPreview", { post: post, from: 'Profile' });
    }

    render() {
        const showIndicator = this.state.showIndicator;

        return (
            <View style={styles.flex}>

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={showIndicator}
                    size="large"
                    color='grey'
                />

                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 18,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center'
                        }}
                    >Profile</Text>

                </View>

                {
                    this.state.renderFeed &&
                    <FlatList
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={(
                            <View>
                                <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => this.createFeed()}
                                    // style={[styles.bottomButton, { marginBottom: 10 }]}
                                    style={styles.bottomButton}
                                >
                                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => this.removeFeed()}
                                    style={styles.bottomButton}
                                >
                                    <Text style={{ fontSize: 16, color: 'white' }}>Remove Feed</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => this.makeDummyData()}
                                    style={styles.bottomButton}
                                >
                                    <Text style={{ fontSize: 16, color: 'white' }}>☆ Make Dummy Data ★</Text>
                                </TouchableOpacity>



                                <View style={styles.titleContainer}>
                                    <Text style={styles.title}>{'Your post'}</Text>
                                </View>
                            </View>
                        )}
                        // scrollEventThrottle={1}
                        columnWrapperStyle={styles.columnWrapperStyle}
                        numColumns={3}
                        data={this.state.feeds}
                        // keyExtractor={item => item.id}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity onPress={async () => this.openPost(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            // preview={item.pictures.one.preview}
                                            // uri={item.pictures.one.uri}
                                            uri={item.imageUri}
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
                            this.state.isLoadingFeeds && (
                                <ActivityIndicator
                                    style={styles.bottomIndicator}
                                    animating={true}
                                    size="small"
                                    color='grey'
                                />
                            )}

                        /*
                        ListEmptyComponent={(
                            <View style={styles.post}>
                                {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }}/>}
                            </View>
                        )}
                        */

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                }
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
    };

    async makeDummyData() {
        for (var i = 0; i < 10; i++) {
            this.makeBKK();
            this.makeHCM();
            this.makeManila();
            this.makeVientiane();
            this.makePP();
            this.makeJakarta();
        }
        /*
        // 1. Bangkok, Thailand
        for (var i = 0; i < 10; i++) await this.makeBKK();

        // 2. Ho Chi Minh, Vietnam
        for (var i = 0; i < 10; i++) await this.makeHCM();

        // 3. Manila
        for (var i = 0; i < 10; i++) await this.makeManila();

        // 4. Vientiane
        for (var i = 0; i < 10; i++) await this.makeVientiane();

        // 5. Phnom Penh
        for (var i = 0; i < 10; i++) await this.makePP();

        // 6. Jakarta
        for (var i = 0; i < 10; i++) await this.makeJakarta();
        */
    }

    getRandomImage(number) { // 0 ~ 5
        let images = []; // random item

        let uri1, uri2, uri3, uri4;

        switch (number) {
            case 0: {
                // --
                uri1 = 'https://pds.joins.com/news/component/htmlphoto_mmdata/201705/20/htm_2017052043510989199.jpeg';
                uri2 = 'https://i.pinimg.com/originals/a2/10/18/a210180e93b5e277050c3384b9dad462.jpg';
                uri3 = 'https://i.pinimg.com/originals/95/8a/f8/958af83d9cd2eb5a079cc652cffb3b4f.jpg';
                uri4 = 'https://upload.wikimedia.org/wikipedia/commons/0/04/%28%EC%98%88%EA%B3%A0%29_CNTV_%EC%97%AD%EC%A0%81_-_%EC%9C%A4%EA%B7%A0%EC%83%81%2C_%EC%B1%84%EC%88%98%EB%B9%88_%EC%B1%84%EC%88%98%EB%B9%88_24s.jpg';
                // --
            } break;

            case 1: {
                uri1 = 'https://post-phinf.pstatic.net/MjAxNzA4MzFfMTI5/MDAxNTA0MTYwODU4MzQ3.HxB3nEhj4uv-3XWu2Z2zAr4iSPas3aOokdPh1AgY5F4g.egcEId7lF7bFsE5s14XRTNnVGiqxUOYL4SJ4-7p95kQg.JPEG/AOA_%EC%84%A4%ED%98%84_%EB%8D%B0%EC%8B%B1%EB%94%94%EB%B0%94_%282%29.jpg?type=w1200';
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/263CCB345769E5A308';
                uri3 = 'https://img.huffingtonpost.com/asset/5aaf1a5b1e000057107af0b7.jpeg?cache=HNh7gSVWkr&ops=scalefit_630_noupscale';
                uri4 = 'https://ncache.ilbe.com/files/attach/new/20160313/377678/4736545360/7694389062/740d8fa77c6988296440860eb1f42589.gif';
            } break;

            case 2: {
                uri1 = 'https://i1.daumcdn.net/thumb/R750x0/?fname=http%3A%2F%2Fcfile27.uf.tistory.com%2Fimage%2F99115C3359D104EA04DB67';
                uri2 = 'https://i.ytimg.com/vi/dW0mXvpPRJ8/maxresdefault.jpg';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/27735B3959071E4A04';
                uri4 = 'https://pbs.twimg.com/profile_images/744128499904978944/eIN4yA3y_400x400.jpg';
            } break;

            case 3: {
                uri1 = 'https://t1.daumcdn.net/cfile/tistory/232DB142593A2F160B';
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/235BE942593A2F1813';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/24439342593A2F1A09';
                uri4 = 'https://t1.daumcdn.net/cfile/tistory/264CFB42593A2F1C07';
            } break;

            case 4: {
                uri1 = 'https://postfiles.pstatic.net/20160804_151/ykm3571_1470312644585B2lPV_GIF/%BA%ED%B7%A2%C7%CE%C5%A9_%C1%F6%BC%F6_03.gif?type=w966';
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/241FE94E58F9E0911C';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/2379514F58F806902F';
                uri4 = 'https://img1.daumcdn.net/thumb/R1920x0/?fname=http%3A%2F%2Fcfile21.uf.tistory.com%2Fimage%2F9969BD415C472ACB1DF0F5';
            } break;

            case 5: {
                uri1 = 'https://t1.daumcdn.net/news/201808/09/10asia/20180809101854646ppyw.jpg';
                uri2 = 'https://t1.daumcdn.net/news/201808/16/moneytoday/20180816131509218odci.jpg';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/99B9D8375A9E4FE30B';
                uri4 = 'https://t1.daumcdn.net/cfile/tistory/991B0F4F5BCEC5FC19';
            } break;
        }

        let image1Uri = null;
        let image2Uri = null;
        let image3Uri = null;
        let image4Uri = null;

        let num = parseInt(Math.random() * 10 % 4); // 0 ~ 3
        switch (num) {
            case 0: {
                image1Uri = uri1;
                image2Uri = uri2;
                image3Uri = uri3;
                image4Uri = uri4;
            } break;

            case 1: {
                image4Uri = uri1;
                image1Uri = uri2;
                image2Uri = uri3;
                image3Uri = uri4;
            } break;

            case 2: {
                image3Uri = uri1;
                image4Uri = uri2;
                image1Uri = uri3;
                image2Uri = uri4;
            } break;

            case 3: {
                image2Uri = uri1;
                image3Uri = uri2;
                image4Uri = uri3;
                image1Uri = uri4;
            } break;
        }

        images[0] = image1Uri;
        images[1] = image2Uri;
        images[2] = image3Uri;
        images[3] = image4Uri;

        return images;
    }

    async makeBKK() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        // ToDo: get it from google location api
        const location = {
            description: 'Bangkok, Thailand',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async makeHCM() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        // ToDo: get it from google location api
        const location = {
            description: 'Ho Chi Minh, Vietnam',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kim Seol-hyun';
        const age = 24;
        const height = 167;
        const weight = 49;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async makeManila() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk';
        // ToDo: get it from google location api
        const location = {
            description: 'Manila, Philippines',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async makeVientiane() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJIXvtBoZoJDER3-7BGIaxkx8';
        // ToDo: get it from google location api
        const location = {
            description: 'Vientiane, Laos',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Angelina Danilova';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async makePP() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ42tqxz1RCTERuyW1WugOAZw';
        // ToDo: get it from google location api
        const location = {
            description: 'Phnom Penh, Cambodia',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async makeJakarta() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJnUvjRenzaS4RoobX2g-_cVM';
        // ToDo: get it from google location api
        const location = {
            description: 'Jakarta, Indonesia',
            longitude: 0.0,
            latitude: 0.0
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there here for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";

        // --
        const number = parseInt(Math.random() * 10 % 6); // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const age = 24;
        const height = 167;
        const weight = 48;
        const bust = 'B+';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }







    async createFeed() {
        const feedId = Util.uid(); // create uuid
        const userUid = Firebase.user().uid;
        // ToDo: use google api
        let placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const location = {
            description: 'Bangkok, Thailand',
            longitude: 100.5017651,
            latitude: 13.7563309
        };
        /*
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const location = {
            description: 'Ho Chi Minh, Vietnam',
            longitude: 106.6296638,
            latitude: 10.8230989
        };
        */

        const note = 'note';

        // ToDo: use image picker
        const image1Uri = 'https://i.pinimg.com/originals/56/ac/4b/56ac4b66ae869303f1f259fd6d550d85.jpg';
        const image2Uri = 'https://pbs.twimg.com/media/DiABjHdXUAEHCdN.jpg';
        const image3Uri = 'https://3.bp.blogspot.com/-IlmY1gyVmQI/W3doZ9X9oAI/AAAAAAAAERQ/avgNK2r8A4Ms710A4s1Vew-8Zwz7eU4ZQCLcBGAs/s1600/ep10-1.gif';
        const image4Uri = 'https://t1.daumcdn.net/cfile/tistory/994E373C5BF1FD440A';

        const name = 'name';
        const age = 20;
        const height = 166;
        const weight = 50;
        const bust = 'D';

        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.location = location;
        feed.note = note;

        const pictures = {
            one: {
                // preview: null,
                uri: image1Uri
            },
            two: {
                // preview: null,
                uri: image2Uri
            },
            three: {
                // preview: null,
                uri: image3Uri
            },
            four: {
                // preview: null,
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.age = age;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        await Firebase.createFeed(feed);
    }

    async removeFeed() {
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';

        const feedId = '6598abb5-6c55-cf4b-5dec-86b8a1bd5f69';

        // await Firebase.deleteFeed(placeId, feedId);
    }




    uploadPicture(index) {
        this.pickImage(index);
    }

    async pickImage(index) {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync:', result);

            if (!result.cancelled) {
                this.setState({ uploadingImage: true });

                // show indicator
                this.setState({ showIndicator: true });

                // ToDo: show progress bar


                // upload image
                // var that = this;
                this.uploadImage(result.uri, index, (uri) => {
                    switch (index) {
                        case 0: this.setState({ uploadImage1: uri }); break;
                        case 1: this.setState({ uploadImage2: uri }); break;
                        case 2: this.setState({ uploadImage3: uri }); break;
                        case 3: this.setState({ uploadImage4: uri }); break;
                    }

                    // save to database
                    /*
                    var data = {
                        pictures: {
                            uri: uri
                        }
                    };

                    this.updateUser(Firebase.user().uid, data);
                    */
                });


                /*
                const fileName = result.uri.split('/').pop();
                const url = await firebase.storage().ref(fileName).getDownloadURL();
                console.log('download URL:', url);
                */



                // close indicator
                this.setState({ showIndicator: false });

                this.setState({ uploadingImage: false });

            } // press OK
        } else {
            Linking.openURL('app-settings:');
        }
    }

    async uploadImage(uri, index, cb) {
        const fileName = uri.split('/').pop();
        var ext = fileName.split('.').pop();

        if (!Util.isImage(ext)) {
            alert('invalid image file!');
            return;
        }

        var type = Util.getImageType(ext);
        // console.log('file type:', type);

        const formData = new FormData();
        formData.append("image", {
            // uri: uri,
            uri,
            name: fileName,
            type: type
        });
        formData.append("userUid", Firebase.user().uid);
        // formData.append("feedId", Firebase.user().uid);
        formData.append("pictureIndex", index);

        try {
            let response = await fetch("https://us-central1-rowena-88cfd.cloudfunctions.net/uploadFile/images",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data"
                    },
                    body: formData
                }
            );

            let responseJson = await response.json();
            console.log('uploadImage, responseJson', responseJson);

            // console.log('responseJson', await response.json());

            cb(responseJson.downloadUrl);

            /*
            try {
                let downloadURL = await Firebase.storage.ref(responseJson.name).getDownloadURL();
                // let downloadURL = await Firebase.storage.child(responseJson.name).getDownloadURL();
                cb(downloadURL);
            } catch (error) {
                console.error(error);
            }
            */
        } catch (error) {
            console.error(error);

            // ToDo: error handling
        }
    }
    /*
    async uploadImage(uri, imageName) {
        const response = await fetch(uri);

        if (response.ok) {
            const blob = await response.blob();

            let ref = firebase.storage().ref().child('images/' + imageName);

            const snapshot = ref.put(blob)
                .then(() => { console.log('uploadImage success.'); alert('Your photo has successfully uploaded.'); })
                .catch((error) => { console.log('error:', error); alert('Please try again.'); });

            const uploadedImage = snapshot.downloadURL;
            this.setState({ uploadingImageUri: uploadedImage });

        } else {
            alert('Please try again.');
        }
    }
    */






}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Globals.searchBarHeight,
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
        width: parseInt(Dimensions.get('window').width) - 2,
        height: (parseInt(Dimensions.get('window').width) - 2) / 21 * 9,
        marginBottom: Theme.spacing.small
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },


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

        marginBottom: 10
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
    }
});
