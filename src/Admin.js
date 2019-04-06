import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, AsyncStorage, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import { Permissions, Linking, ImagePicker } from 'expo';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import Util from './Util';


export default class Admin extends React.Component {
    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

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
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <TouchableOpacity
                        onPress={() => this.makeDummyData()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>☆ Make Dummy Data ★</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.makeBangkok()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Bangkok)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.makePattaya()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Pattaya)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.makeManila(0)}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Manila)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.makeMacao()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Macao)</Text>
                    </TouchableOpacity>

                    {/*
                    <TouchableOpacity
                        onPress={async () => await this.removeFeed()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Remove Feed</Text>
                    </TouchableOpacity>
                    */}

                    <TouchableOpacity
                        onPress={async () => await this.clearStorage()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Clear Storage</Text>
                    </TouchableOpacity>
                </View>

            </View>
        );
    }

    async makeDummyData() {
        for (var i = 0; i < 10; i++) {
            // 1. 태국
            this.makeBangkok(); // 방콕
            this.makePattaya(); // 파타야

            // 2. 베트남
            this.makeHCM(); // 호치민
            this.makeHanoi(); // 하노이

            // 3. 필리핀
            // this.makeManila();
            this.makeManila(i + 1); // 1 ~ 10
            this.makeCebu();

            // 4. 라오스
            this.makeVientiane();

            // 5. 캄보디아
            this.makePP();

            // 6. 마카오 (Macao, Macau)
            this.makeMacao();

            // 7. 인도네시아
            this.makeJakarta();

            // 8. 말레이시아
            this.makeKL();
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

        let num = Math.round(Math.random() * 10) % 4; // 0 ~ 3
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

    async makeBangkok() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const placeName = 'Bangkok, Thailand';

        // random street address
        const location = {
            description: 'S Sathorn Rd, Thung Maha Mek, Sathon, Bangkok, Thailand',
            longitude: 100.5368514,
            latitude: 13.7236856
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 13.7563309,
            lng: 100.5017651
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makePattaya() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ49cxTZKVAjER_xC9qQHzf6k';
        const placeName = 'Pattaya City, Thailand';

        const location = {
            description: '333 North Pattaya Road, Pattaya City, Amphoe Bang Lamung, Chon Buri, Thailand',
            longitude: 100.8933377,
            latitude: 12.9503984
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 12.9235557,
            lng: 100.8824551
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeHCM() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const placeName = 'Ho Chi Minh City, Vietnam';

        const location = {
            description: "125/51/25 Hẻm 47/52 Bùi Đình Túy, Ward Number 24, Bình Thạnh, Ho Chi Minh City, Vietnam",
            longitude: 106.7062009,
            latitude: 10.8063619
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kim Seol-hyun';
        const birthday = '02121996';
        const height = 167;
        const weight = 49;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 10.8230989,
            lng: 106.6296638
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeHanoi() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJoRyG2ZurNTERqRfKcnt_iOc';
        const placeName = 'Hanoi, Hoàn Kiếm, Hanoi, Vietnam';

        const location = {
            description: "34 Hai Bà Trưng, Trang Tien, Hoàn Kiếm, Hanoi, Vietnam",
            longitude: 105.852382,
            latitude: 21.0246754
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kim Seol-hyun';
        const birthday = '02121996';
        const height = 167;
        const weight = 49;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 21.0277644,
            lng: 105.8341598
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    getRandomLocationManila(_number) {
        let description = '';
        let longitude = 0;
        let latitude = 0;

        let number = 0;
        if (_number === 0) number = Math.floor(Math.random() * 10) + 1; // 1 ~ 10
        else number = _number;

        switch (number) {
            case 1: {
                description = 'Main Cathedral, General Luna St, Intramuros, Manila, 1002 Metro Manila, 필리핀';
                latitude = 14.591799;
                longitude = 120.973383;
            } break;

            case 2: {
                description = '2597 Abad Santos Ave, Tondo, Manila, Metro Manila, 필리핀';
                latitude = 14.626237;
                longitude = 120.978308;
            } break;

            case 3: {
                description = 'Banco De Oro, FFW Building, 1943 Taft Avenue, Malate, Malate, Manila, 1000, Metro Manila, 1004 Metro Manila, 필리핀';
                latitude = 14.565525;
                longitude = 120.994316;
            } break;

            case 4: {
                description = 'Brgy. 630, 산타 메사 마닐라 마닐라 대도시 필리핀';
                latitude = 14.599488;
                longitude = 121.010702;
            } break;

            case 5: {
                description = '38-58 N.S. Amoranto Sr. St, La Loma, Quezon City, Metro Manila, 필리핀';
                latitude = 14.626239;
                longitude = 120.991622;
            } break;

            case 6: {
                description = '2647-2605 Pedro Guevarra St, Santa Cruz, Manila, Metro Manila, 필리핀';
                latitude = 14.625564;
                longitude = 120.985871;
            } break;

            case 7: {
                description = '397 Lallana St, Tondo, Manila, 1013 Metro Manila, 필리핀';
                latitude = 14.621151;
                longitude = 120.966869;
            } break;

            case 8: {
                description = '756-932 Yuseco St, Tondo, Manila, Metro Manila, 필리핀';
                latitude = 14.620034;
                longitude = 120.974110;
            } break;

            case 9: {
                description = 'PLM Field, Victoria St, Intramuros, Manila, 1002 Metro Manila, 필리핀';
                latitude = 14.586849;
                longitude = 120.976437;
            } break;

            case 10: {
                description = 'España Blvd, Sampaloc, Manila, 1008 Metro Manila, 필리핀';
                latitude = 14.614661;
                longitude = 120.998268;
            } break;
        }

        const location = {
            description,
            longitude,
            latitude
        };

        return location;
    }

    async makeManila(_number) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk';
        const placeName = 'Manila, Metro Manila, Philippines';

        /*
        const location = {
            description: "468 Epifanio de los Santos Avenue, East Grace Park, Caloocan, Metro Manila, Philippines",
            longitude: 120.9891925,
            latitude: 14.6569403
        };
        */
        const location = this.getRandomLocationManila(_number);

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 14.5995124,
            lng: 120.9842195
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeCebu() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ_S3NjSWZqTMRBzXT2wwDNEw';
        const placeName = 'Cebu, Philippines';

        const location = {
            description: "37 Cebu Transcentral Highway, Cebu City, Cebu, Philippines",
            longitude: 123.9011798,
            latitude: 10.3162864
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 10.3156992,
            lng: 123.8854366
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeVientiane() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJIXvtBoZoJDER3-7BGIaxkx8';
        const placeName = 'Vientiane, Laos';

        const location = {
            description: 'Crowne Plaza Vientiane, Vientiane, Laos',
            longitude: 102.5970396,
            latitude: 17.9696983
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Angelina Danilova';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 17.9757058,
            lng: 102.6331035
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makePP() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ42tqxz1RCTERuyW1WugOAZw';
        const placeName = 'Phnom Penh, Cambodia';

        const location = {
            description: "831c Preah Monivong Boulevard (93), Phnom Penh, Cambodia",
            longitude: 104.925715,
            latitude: 11.530557
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 11.5563738,
            lng: 104.9282099
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeMacao() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJmY8AduF6ATQRrXXv59PpHbk';
        const placeName = 'Macau, China'; // ToDo: exception

        const location = {
            description: "Macau Island, Macau",
            longitude: 113.5463889,
            latitude: 22.1997222
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 22.1980994,
            lng: 113.5435639
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeJakarta() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJnUvjRenzaS4RILjULejFAAE';
        const placeName = 'Jakarta, Indonesia';

        const location = {
            description: "Jalan Menteng Dalam No.48, RT.9/RW.10, Menteng Dalam, South Jakarta City, Jakarta, Indonesia",
            longitude: 106.8400149,
            latitude: -6.227615
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: -6.180495,
            lng: 106.8283415
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async makeKL() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();
        const placeId = 'ChIJ5-rvAcdJzDERfSgcL1uO2fQ';
        const placeName = "Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia";

        const location = {
            description: "Central Market, Kuala Lumpur City Centre, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
            longitude: 101.695556,
            latitude: 3.145832999999999
        };

        const note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Bae Soo-bin';
        const birthday = '02121996';
        const height = 167;
        const weight = 48;
        const bust = 'B';

        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
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
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;

        const extra = {
            lat: 3.139003,
            lng: 101.686855
        };

        await Firebase.createFeed(feed, extra);

        Vars.userFeedsChanged = true;
    }

    async clearStorage() {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.log('clearStorage clear error', error);
        }
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: Theme.color.background
    },
    searchBar: {
        backgroundColor: '#123456',
        height: Cons.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    bottomButton: {
        width: '85%',
        height: Cons.buttonHeight,
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

