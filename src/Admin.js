import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, AsyncStorage, Dimensions, FlatList } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import { Ionicons } from 'react-native-vector-icons';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import Firebase from './Firebase';
import Util from './Util';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


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

                <FlatList
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={this.renderContainer()}
                />
            </View>
        );
    }

    renderContainer() {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={() => this.initPost()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Initial Post (6 cities)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeDummyData()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>🔥 Make Dummy Data (11 x 10 cities) 🔥</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeInit()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>🔥 Make Init Data (12 cities) 🔥</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeSingapore()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Singapore)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeBangkok()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Bangkok)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeKL()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (KL)</Text>
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

                <TouchableOpacity onPress={() => this.makeHanoi()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Hanoi)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => this.makeSeattle()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Create Feed (Seattle, WA)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={async () => await this.clearStorage()}
                    style={styles.bottomButton}
                >
                    <Text style={{ fontSize: 16, color: 'white' }}>Clear Storage</Text>
                </TouchableOpacity>

                {/*
                    <TouchableOpacity onPress={() => this.addComment()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Add Comment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.removeComment()}
                        style={styles.bottomButton}
                    >
                        <Text style={{ fontSize: 16, color: 'white' }}>Remove Comment</Text>
                    </TouchableOpacity>
                */}
            </View>
        );
    }

    async initPost() { // 6 5 4 4 3 2
        for (let i = 0; i < 6; i++) this.initBangkok(i); // 6
        for (let i = 0; i < 5; i++) this.initManila(i); // 5
        /*
        for (let i = 0; i < 4; i++) this.initHCM(i); // 4
        for (let i = 0; i < 4; i++) this.initMacao(i); // 4
        for (let i = 0; i < 3; i++) this.initVientiane(i); // 3
        for (let i = 0; i < 2; i++) this.initPattaya(i); // 2
        */
    }

    async initBangkok(i) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const placeName = 'Bangkok, Thailand';
        const extra = {
            lat: 13.7563309,
            lng: 100.5017651
        };



        let location = null;
        let note = null;
        let image1Uri = null;
        let image2Uri = null;
        let image3Uri = null;
        let image4Uri = null;
        let name = null;
        let birthday = null;
        let height = 0;
        let weight = 0;
        let bust = null;
        let bodyType = null;

        if (i === 0) {
            // 1. location
            location = {
                description: 'S Sathorn Rd, Thung Maha Mek, Sathon, Bangkok, Thailand',
                latitude: 13.7236856,
                longitude: 100.5368514
            };

            // 2. note
            note = 'If you want to know me, plz chat me up 👻';

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F1%2F1.jpg?alt=media&token=27b12029-5f64-4bfd-8e0a-af08f9fd0321';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F1%2F2.jpg?alt=media&token=8c3861c4-4866-454c-9eba-2f6cc43e19db';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F1%2F3.jpg?alt=media&token=32a83eea-56d6-4647-8caa-b3a36d56ec7f';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F1%2F4.jpg?alt=media&token=c536dcd1-d314-4693-8afb-06db0614fef8';
            // --

            name = 'WANG WEN';
            birthday = '25061995';
            height = 168;
            weight = 49;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 1) {
            // 1. location
            location = {
                description: 'Raweewan Residence, Khan Na Yao, Bangkok, Thailand',
                latitude: 13.8334047,
                longitude: 100.6787331
            };

            // 2. note
            note = "ASIANS ONLY!\nI guess my favorate type of men is raMEN🤷";

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F2%2F1.jpg?alt=media&token=2b85b2c9-4d1b-417e-b83d-33996018de12';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F2%2F2.jpg?alt=media&token=0d427e0b-3fac-43d4-a73c-80d9f98d0c6d';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F2%2F3.jpg?alt=media&token=ed416956-4f53-480b-9216-499da67e7b5a';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F2%2F4.jpg?alt=media&token=232bb16d-2c38-45b5-9c3b-f36fcfe4ac92';
            // --

            name = 'Wichuda';
            birthday = '07081995';
            height = 168;
            weight = 46;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 2) {
            // 1. location
            location = {
                description: 'Baan Sukhumvit Condo, Napha Sap Alley, Lane 5, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.718516,
                longitude: 100.573484
            };

            // 2. note
            note = "I like traveling, reading comic books ❤\nDrinking coffee or beer is always welcome 🙋\nI want a partner 🤣👦🔥👀";

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F3%2F1.jpg?alt=media&token=fc2a6028-c145-468e-9868-8c6da7bb1ed3';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F3%2F2.jpg?alt=media&token=32ac33f6-592d-4b73-9745-2f702caeda9b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F3%2F3.jpg?alt=media&token=43c515b8-4ae9-4cf7-9940-0376c81c2780';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F3%2F4.jpg?alt=media&token=07416889-cf96-4798-bd70-ce5ae7f4d7cf';
            // --

            name = 'Chassudapon';
            birthday = '21021996';
            height = 167;
            weight = 45;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 3) {
            // 1. location
            location = {
                description: 'The Lumpini 24, Sukhumvit 24 Alley, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.7227387,
                longitude: 100.5661387
            };

            // 2. note
            note = "Chubby girl 👩\nAlone 😂\nWanna meet me? 💋";

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F4%2F1.jpg?alt=media&token=5507f498-bb83-42a1-b663-9ffe4110b230';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F4%2F2.jpg?alt=media&token=10a33390-fd92-4956-bba6-2a6ecee29ad5';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F4%2F3.jpg?alt=media&token=4ff434a3-bed2-48dc-9dde-9882540fec12';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F4%2F4.jpg?alt=media&token=638c5f23-0355-4fbf-9ef6-b49249f37a7b';
            // --

            name = 'Mai';
            birthday = '14071998';
            height = 165;
            weight = 43;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 4) {
            // 1. location
            location = {
                description: 'Condo One X, Soi Ari, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.7251042,
                longitude: 100.568789
            };

            // 2. note
            note = "Hi";

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F5%2F1.jpg?alt=media&token=61d175a2-3119-40e3-9bac-6f77738cef60';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F5%2F2.jpg?alt=media&token=23b6887b-9460-4866-a184-aba6ebde7b67';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F5%2F3.jpg?alt=media&token=50035620-5503-4a80-bfe0-466a984955ca';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F5%2F4.jpg?alt=media&token=e7d631dd-d871-40cf-8d0e-e172347843e5';
            // --

            name = 'Aimee';
            birthday = '29011992';
            height = 162;
            weight = 44;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 5) {
            // 1. location
            location = {
                description: 'Quinn Condo, Ratchadaphisek Road, Din Daeng, Bangkok, Thailand',
                latitude: 13.786335,
                longitude: 100.5732249
            };

            // 2. note
            note = "Hi there,\nI'm looking for friends. Not a serious relationship!";

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F6%2F1.jpg?alt=media&token=9efd9a22-368f-4047-bc38-20dff92b337f';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F6%2F2.jpg?alt=media&token=4660f94e-7af7-4ff9-a293-1c8230ea641d';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F6%2F3.jpg?alt=media&token=cfabeb5e-484f-4e4f-ad95-190692df6dd5';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F6%2F4.jpg?alt=media&token=a49d902f-70d2-4109-a40a-2f747b333eff';
            // --

            name = 'Areeya';
            birthday = '03101995';
            height = 166;
            weight = 48;
            bust = 'B';
            bodyType = 'Skinny';
        }



        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
        feed.location = location;
        feed.note = note;

        let pictures = null;
        pictures = {
            one: {
                uri: image1Uri
            },
            two: {
                uri: image2Uri
            },
            three: {
                uri: image3Uri
            },
            four: {
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = bodyType;

        await Firebase.createFeed(feed, extra);
    }

    async initManila(i) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJAe2gZALJlzMRzsoweNVuBis';
        const placeName = 'Makati, Philippines';
        const extra = {
            lat: 14.554729,
            lng: 121.0244452
        };



        let location = null;
        let note = null;
        let image1Uri = null;
        let image2Uri = null;
        let image3Uri = null;
        let image4Uri = null;
        let name = null;
        let birthday = null;
        let height = 0;
        let weight = 0;
        let bust = null;
        let bodyType = null;

        if (i === 0) {
            // 1. location
            location = {
                description: 'Greenbelt Mansion, Perea, Legaspi Village, Makati, Metro Manila, Philippines',
                latitude: 14.554688,
                longitude: 121.02061
            };

            // 2. note
            note = 'Your favorite German Filipino 🇩🇪🇵🇭\nWanna meet new people 😃';

            // 3. pictures
            // --
            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F7%2F1.jpg?alt=media&token=4459faca-ae48-4cf4-9b32-6afb5e9f127c';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F7%2F2.jpg?alt=media&token=e7f15c64-7c41-41f6-9033-9943db71e4a6';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F7%2F3.jpg?alt=media&token=93d5a48b-3a50-4225-a20b-2c6ecf1fa2a6';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2F7%2F4.jpg?alt=media&token=7e429e61-0315-45d9-9d21-8ca3539e738e';
            // --

            name = 'Laura';
            birthday = '02121996';
            height = 170;
            weight = 52;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 1) { // ToDo
            // 1. location
            location = {
                description: 'The Peninsula Manila, Makati, Metro Manila, Philippines',
                latitude: 14.5556401,
                longitude: 121.0251313
            };

        } else if (i === 2) {
            // 1. location
            location = {
                description: 'The Peninsula Manila, Makati, Metro Manila, Philippines',
                latitude: 14.5556401,
                longitude: 121.0251313
            };

        } else if (i === 3) {

        } else if (i === 4) {

        }



        // set
        let feed = {};
        feed.uid = userUid;
        feed.id = feedId;
        feed.placeId = placeId;
        feed.placeName = placeName;
        feed.location = location;
        feed.note = note;

        let pictures = null;
        pictures = {
            one: {
                uri: image1Uri
            },
            two: {
                uri: image2Uri
            },
            three: {
                uri: image3Uri
            },
            four: {
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = bodyType;

        await Firebase.createFeed(feed, extra);
    }

    async initHCM(i) {

    }

    async initMacao(i) {

    }

    async initVientiane(i) {

    }

    async initPattaya(i) {

    }



    async makeDummyData() { // 11 cities
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

            // 6. 마카오
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
                uri2 = 'https://t1.daumcdn.net/cfile/tistory/22219E3C591AC33505';
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

    getRandomNote(number) { // 0, 1, 2, 3
        let note = null;

        switch (number) {
            case 0:
                note = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through";
                break;

            case 1:
                note = "All happy girls are alike; every unhappy girl is unhappy in her own way. My kind of unhappy is full of self-deprecating humor, double IPAs, and is actually pretty rad.\nLet me know if you want to be miserable together.";
                break;

            case 2:
                note = "You should know that I hate old people, children, and dogs.\nActually, I love all those things but if you know what movie that line is from, we should go out.";
                break;

            case 3:
                note = "Grew up in the Portland, Oregon area. Survived middle school by becoming a skater kid (still haven’t grown out of it). Now I’m trying to pay my rent, play my music, and make my way.";
                break;
        }

        return note;
    }

    getNote(number) { // 0, 1, 2, 3
        let note = null;

        switch (number) {
            case 0:
                note = "教育的依据就是'爱情'和'关心'. 当优秀的老师绝对不容易, 但只当优秀的老师很危险的事. 因为学生学老师, 模仿老师. 所以教育应该不仅仅向学生传达知识.";
                break;

            case 1:
                note = "얼굴 하나야 손바닥 둘로 푹 가리지만\n보고 싶은 마음 호수만 하니 눈 감을 수 밖에";
                break;

            case 2:
                note = "อะไรยังเงี้ยะ\nพอดีเจอกันเขา\nน่ารัก     เหมือน  เดิม";
                break;

            case 3:
                note = "何か お探しですか\n高すぎです\n少し まけて くれませんか\n申し訳 ありませんが、 それは 困ります";
                break;
        }

        return note;
    }

    async makeInit() {
        this.makeBangkok();
        this.makePattaya();

        this.makeHCM();
        this.makeHanoi();

        this.makeManila(0);
        this.makeCebu();

        this.makeVientiane();

        this.makePP();

        this.makeMacao();

        this.makeJakarta();

        this.makeKL();

        this.makeSingapore();
    }

    async makeSingapore() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJdZOLiiMR2jERxPWrUs9peIg';
        const placeName = 'Singapore';

        const extra = {
            lat: 1.352083,
            lng: 103.819836
        };

        const LATITUDE = 1.2494041;
        const LONGITUDE = 103.8303209;
        const location = {
            description: '?, Sentosa, Singapore',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        // const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);
        const note = this.getNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Wendy, S';
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
                uri: image1Uri,
                ref: null
            },
            two: {
                uri: image2Uri,
                ref: null
            },
            three: {
                uri: image3Uri,
                ref: null
            },
            four: {
                uri: image4Uri,
                ref: null
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeBangkok() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const placeName = 'Bangkok, Thailand';

        const extra = {
            lat: 13.7563309,
            lng: 100.5017651
        };

        /*
        const location = {
            description: 'S Sathorn Rd, Thung Maha Mek, Sathon, Bangkok, Thailand',
            longitude: 100.5368514,
            latitude: 13.7236856
        };
        */
        const LATITUDE = 13.7236856;
        const LONGITUDE = 100.5368514;
        const location = {
            description: '?, Thung Maha Mek, Sathon, Bangkok, Thailand',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Angel';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);

        // Vars.userFeedsChanged = true;
    }

    async makePattaya() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ49cxTZKVAjER_xC9qQHzf6k';
        // const placeName = 'Pattaya, Bang Lamung District, Chon Buri, Thailand';
        const placeName = 'Pattaya, Thailand';

        const extra = {
            lat: 12.9235557,
            lng: 100.8824551
        };

        /*
        const location = {
            description: '333 North Pattaya Road, Pattaya City, Amphoe Bang Lamung, Chon Buri, Thailand',
            longitude: 100.8933377,
            latitude: 12.9503984
        };
        */
        const LATITUDE = 12.9503984;
        const LONGITUDE = 100.8933377;
        const location = {
            description: '?, 333 North Pattaya Road, Pattaya City, Amphoe Bang Lamung, Chon Buri, Thailand',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Evelyn';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeHCM() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const placeName = 'Ho Chi Minh City, Vietnam';

        const extra = {
            lat: 10.8230989,
            lng: 106.6296638
        };

        /*
        const location = {
            description: "125/51/25 Hẻm 47/52 Bùi Đình Túy, Ward Number 24, Bình Thạnh, Ho Chi Minh City, Vietnam",
            longitude: 106.7062009,
            latitude: 10.8063619
        };
        */
        const LATITUDE = 10.8063619;
        const LONGITUDE = 106.7062009;
        const location = {
            description: '?, 125/51/25 Hẻm 47/52 Bùi Đình Túy, Ward Number 24, Bình Thạnh, Ho Chi Minh City, Vietnam',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Molly';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeHanoi() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJoRyG2ZurNTERqRfKcnt_iOc';
        // const placeName = 'Hanoi, Hoàn Kiếm, Hanoi, Vietnam';
        const placeName = 'Hanoi, Vietnam';

        const extra = {
            lat: 21.0277644,
            lng: 105.8341598
        };

        /*
        const location = {
            description: "34 Hai Bà Trưng, Trang Tien, Hoàn Kiếm, Hanoi, Vietnam",
            longitude: 105.852382,
            latitude: 21.0246754
        };
        */
        const LATITUDE = 21.0246754;
        const LONGITUDE = 105.852382;
        const location = {
            description: '?, 34 Hai Bà Trưng, Trang Tien, Hoàn Kiếm, Hanoi, Vietnam',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Ivy';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeSeattle() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJVTPokywQkFQRmtVEaUZlJRA';
        const placeName = 'Seattle, WA, USA';

        const extra = {
            lat: 47.6062095,
            lng: -122.3320708
        };

        const LATITUDE = 47.6062095;
        const LONGITUDE = -122.3320708;
        const location = {
            description: '?, Seattle Center, Harrison Street, Seattle, WA, USA',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        /*
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        */
        // --
        let image1Uri = "https://static01.nyt.com/images/2017/06/01/arts/01DUALIPA/01DUALIPA-facebookJumbo-v3.jpg";
        let image2Uri = "https://i2-prod.mirror.co.uk/incoming/article13237879.ece/ALTERNATES/s1200/0_Lollapalooza-Berlin-2018-Germany-08-Sep-2018.jpg";
        let image3Uri = "https://ichef.bbci.co.uk/images/ic/720x405/p054bldr.jpg";
        let image4Uri = "https://media.them.us/photos/5b9bb05a85bf450011783c5d/master/w_1280,c_limit/DuaLipa.jpg";

        const name = 'Dua Lipa';
        const birthday = '22081995';
        const height = 171;
        const weight = 56;
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
                uri: image1Uri
            },
            two: {
                uri: image2Uri
            },
            three: {
                uri: image3Uri
            },
            four: {
                uri: image4Uri
            }
        };

        feed.pictures = pictures;
        feed.name = name;
        feed.birthday = birthday;
        feed.height = height;
        feed.weight = weight;
        feed.bust = bust;
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
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
        // const placeName = 'Manila, Metro Manila, Philippines';
        const placeName = 'Manila, Philippines';

        const extra = {
            lat: 14.5995124,
            lng: 120.9842195
        };

        /*
        const location = {
            description: "468 Epifanio de los Santos Avenue, East Grace Park, Caloocan, Metro Manila, Philippines",
            longitude: 120.9891925,
            latitude: 14.6569403
        };
        */
        const location = this.getRandomLocationManila(_number);

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Olivia';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeCebu() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ_S3NjSWZqTMRBzXT2wwDNEw';
        const placeName = 'Cebu, Philippines';

        const extra = {
            lat: 10.3156992,
            lng: 123.8854366
        };

        /*
        const location = {
            description: "37 Cebu Transcentral Highway, Cebu City, Cebu, Philippines",
            longitude: 123.9011798,
            latitude: 10.3162864
        };
        */
        const LATITUDE = 10.3162864;
        const LONGITUDE = 123.9011798;
        const location = {
            description: '?, 37 Cebu Transcentral Highway, Cebu City, Cebu, Philippines',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Elizabeth';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeVientiane() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJIXvtBoZoJDER3-7BGIaxkx8';
        const placeName = 'Vientiane, Laos';

        const extra = {
            lat: 17.9757058,
            lng: 102.6331035
        };

        /*
        const location = {
            description: 'Crowne Plaza Vientiane, Vientiane, Laos',
            longitude: 102.5970396,
            latitude: 17.9696983
        };
        */
        const LATITUDE = 17.9696983;
        const LONGITUDE = 102.5970396;
        const location = {
            description: '?, Crowne Plaza Vientiane, Vientiane, Laos',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makePP() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ42tqxz1RCTERuyW1WugOAZw';
        const placeName = 'Phnom Penh, Cambodia';

        const extra = {
            lat: 11.5563738,
            lng: 104.9282099
        };

        /*
        const location = {
            description: "831c Preah Monivong Boulevard (93), Phnom Penh, Cambodia",
            longitude: 104.925715,
            latitude: 11.530557
        };
        */
        const LATITUDE = 11.530557;
        const LONGITUDE = 104.925715;
        const location = {
            description: '?, 831c Preah Monivong Boulevard (93), Phnom Penh, Cambodia',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Kristen';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeMacao() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ88g14uB6ATQR9qyFtCzje8Y';
        const placeName = 'Macao';

        const extra = {
            lat: 22.198745,
            lng: 113.543873
        };

        const LATITUDE = 22.1997222;
        const LONGITUDE = 113.5463889;
        const location = {
            description: '?, Macau Island, Macao',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Lindsey';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeJakarta() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJnUvjRenzaS4RoobX2g-_cVM';
        const placeName = 'Jakarta, Indonesia';

        const extra = {
            lat: -6.180495,
            lng: 106.8283415
        };

        const LATITUDE = -6.2087634;
        const LONGITUDE = 106.845599;
        const location = {
            description: '?, Jalan Menteng Dalam No.48, RT.9/RW.10, Menteng Dalam, South Jakarta City, Jakarta, Indonesia',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'April';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async makeKL() {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ5-rvAcdJzDERfSgcL1uO2fQ';
        const placeName = "Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia";

        const extra = {
            lat: 3.139003,
            lng: 101.686855
        };

        /*
        const location = {
            description: "Central Market, Kuala Lumpur City Centre, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
            longitude: 101.695556,
            latitude: 3.145832999999999
        };
        */
        const LATITUDE = 3.145832999999999;
        const LONGITUDE = 101.695556;
        const location = {
            description: '?, Central Market, Kuala Lumpur City Centre, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia',
            latitude: LATITUDE + ((Math.random() - 0.5) * (LATITUDE_DELTA / 2)),
            longitude: LONGITUDE + ((Math.random() - 0.5) * (LONGITUDE_DELTA / 2))
        };

        const note = this.getRandomNote(Math.round(Math.random() * 10) % 4);

        // --
        const number = Math.round(Math.random() * 10) % 6; // 0 ~ 5
        const images = this.getRandomImage(number);
        let image1Uri = images[0];
        let image2Uri = images[1];
        let image3Uri = images[2];
        let image4Uri = images[3];
        // --

        const name = 'Erika';
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
        feed.muscle = null;
        feed.gender = 'Female';
        feed.bodyType = 'Skinny';

        await Firebase.createFeed(feed, extra);
    }

    async clearStorage() {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.log('jdub', 'clearStorage clear error', error);
        }
    }

    addComment() {
        /*
        const name = 'Max Power';
        const place = 'Cebu, Philippines';
        const uri = 'https://t1.daumcdn.net/cfile/tistory/27735B3959071E4A04';
        Firebase.addComment(Firebase.user().uid, 'VUg2ZB2PgWfwCNXyXwa94FwErrZ2', 'wow!', name, place, uri); // writer, receiver (m1), message
        */
    }

    removeComment() {
        // const commentId = '81e2967f-4877-70ee-6304-dce6267ea7f5';
        // Firebase.removeComment(Firebase.user().uid, 'LSeANvOEWOVLGQ94N0ArEIJDW2i2', commentId); // m1


        /*
        const uid = Firebase.user().uid;
        const db = Firebase.firestore.collection("users").doc(uid);
        const path = "comments";
        Firebase.deleteCollection(db, path, 10);
        */
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
    }
});
