import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { NavigationActions } from 'react-navigation';
import Firebase from './Firebase';
import Util from './Util';


export default class AdvertisementMain extends React.Component {

    render() {
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
                </View>




                <View style={{ height: 300, width: '100%', backgroundColor: '#123456', paddingTop: 30, marginTop: 30 }}>
                    <TouchableOpacity onPress={() => this.createFeed()}
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
                </View>



            </View>
        );
    }

    //// DB
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
        const image1Uri = 'https://i.ytimg.com/vi/FLm-oBqOM24/maxresdefault.jpg';
        const image2Uri = 'https://pbs.twimg.com/media/DiABjHdXUAEHCdN.jpg';
        const image3Uri = 'https://i.ytimg.com/vi/jn2XzSxv4sU/maxresdefault.jpg';
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

        Vars.userFeedsChanged = true;
    }

    async removeFeed() {
        const uid = Firebase.user().uid;

        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const feedId = '26f7ee12-7b68-de8f-1dd1-b971b07421c4';

        await Firebase.removeFeed(uid, placeId, feedId);

        Vars.userFeedsChanged = true;
    }

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
                uri4 = 'https://i.pinimg.com/originals/a0/2e/ec/a02eecdae0e3fb79dcbf762cddaa952b.jpg';
            } break;

            case 2: {
                uri1 = 'https://i1.daumcdn.net/thumb/R750x0/?fname=http%3A%2F%2Fcfile27.uf.tistory.com%2Fimage%2F99115C3359D104EA04DB67';
                uri2 = 'https://i.ytimg.com/vi/dW0mXvpPRJ8/maxresdefault.jpg';
                uri3 = 'https://t1.daumcdn.net/cfile/tistory/27735B3959071E4A04';
                uri4 = 'https://pbs.twimg.com/profile_images/744128499904978944/eIN4yA3y_400x400.jpg';
            } break;

            case 3: {
                uri1 = 'https://i0.hdslb.com/bfs/archive/14e43191ca970b80912c58acf9987f0b8eadb80e.jpg';
                uri2 = 'https://i.ytimg.com/vi/aApMHbQR_OI/hqdefault.jpg?v=58dddaf4';
                uri3 = 'https://pbs.twimg.com/media/DA4zuBYUAAEfNMG.jpg';
                uri4 = 'https://i1.wp.com/overdope.com/wp-content/uploads/2017/01/2017-01-21_220645.jpg?fit=690%2C460';
            } break;

            case 4: {
                uri1 = 'https://pkpkgirls.files.wordpress.com/2018/08/38751740_651875865193841_3072906610452987904_o.jpg';
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



}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
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

        marginTop: 10,
        marginBottom: 10
    },


});

