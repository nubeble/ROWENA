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

    async initPost() { // 7 5 5 5 4 3
        for (let i = 0; i < 7; i++) this.initBangkok(i);
        for (let i = 0; i < 6; i++) this.initPattaya(i);
        for (let i = 0; i < 5; i++) this.initMacao(i);
        for (let i = 0; i < 5; i++) this.initHCM(i);
        for (let i = 0; i < 4; i++) this.initManila(i);
        for (let i = 0; i < 3; i++) this.initVientiane(i);
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
            location = {
                description: 'S Sathorn Rd, Thung Maha Mek, Sathon, Bangkok, Thailand',
                latitude: 13.7236856,
                longitude: 100.5368514
            };

            note = "I guess my favorate type of men is raMEN🤷";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F1%2F1.jpg?alt=media&token=a8d84350-4794-4871-9400-c92aef4ab767';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F1%2F3.jpg?alt=media&token=56f641a2-c7ff-44c6-b031-bc1950508d4f';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F1%2F2.jpg?alt=media&token=f06a0088-78e4-410a-8d7f-70203118cdff';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F1%2F4.jpg?alt=media&token=3b8da359-ac24-400d-bc73-ee7a989ab16d';

            name = 'Chassudapon';
            birthday = '21021996';
            height = 165;
            weight = 48;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 1) {
            location = {
                description: 'Raweewan Residence, Khan Na Yao, Bangkok, Thailand',
                latitude: 13.8334047,
                longitude: 100.6787331
            };

            note = "Hi guys,\nI'm looking for friends.\nNot a serious relationship";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F2%2F1.jpg?alt=media&token=73501e9c-e799-4eb7-8959-e7e8208f861e';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F2%2F2.jpg?alt=media&token=1bebe75e-7ca5-4a4b-944a-c9b0da5f7a9a';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F2%2F4.jpg?alt=media&token=261264da-9c8f-4d1e-a769-88f2620af86b';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F2%2F3.jpg?alt=media&token=55198f86-8a67-47c8-97df-4c453e49e15c';

            name = 'WANG WEN';
            birthday = '25061996';
            height = 168;
            weight = 50;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 2) {
            location = {
                description: 'Baan Sukhumvit Condo, Napha Sap Alley, Lane 5, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.718516,
                longitude: 100.573484
            };

            note = "From South Korea 🇰🇷\nI like traveling, reading comic books ❤\nDrinking coffee or beer is find 🙋\nI want a travel partner 🤣👦🔥👀";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F3%2F1.jpg?alt=media&token=5c5f0c2c-6cd1-424a-ab59-dac0267d0636';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F3%2F2.jpg?alt=media&token=d1079452-2dc8-4b5d-8afe-9112864451bd';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F3%2F3.jpg?alt=media&token=d2d7789a-9f61-4774-8a20-0960baac24bc';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F3%2F4.jpg?alt=media&token=b2444135-a632-48fb-abd4-3f8101529d9f';

            name = 'Yoonji Park';
            birthday = '14071998';
            height = 166;
            weight = 52;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 3) {
            location = {
                description: 'Condo One X, Soi Ari, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.7251042,
                longitude: 100.568789
            };

            note = "Open to meet new people.\nIf you are looking for a good relationship, we can grab some coffee!";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F4%2F1.jpg?alt=media&token=c533a840-ab24-4c3d-9871-cc118620d457';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F4%2F2.jpg?alt=media&token=d82ff65d-3218-4d67-a7a2-71a91b306fa5';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F4%2F3.jpg?alt=media&token=108b852e-d502-49dd-a150-e216646b45dc';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F4%2F4.jpg?alt=media&token=920af70c-3319-446b-92b4-62057e2eb7fa';

            name = 'Areeya Phouad';
            birthday = '03101997';
            height = 167;
            weight = 51;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 4) {
            location = {
                description: 'The Lumpini 24, Sukhumvit 24 Alley, Khlong Tan, Khlong Toei, Bangkok, Thailand',
                latitude: 13.7227387,
                longitude: 100.5661387
            };

            note = "ASIANS ONLY!\nI think I'm hot 🔥\nGood service 😘\nWanna meet me tonight? 💋";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F5%2F1.jpg?alt=media&token=a3220827-7083-4f82-b366-c4dd465d1c92';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F5%2F2.jpg?alt=media&token=ecce89e1-c165-4c10-a1f2-e1030e61ec22';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F5%2F3.jpg?alt=media&token=c11433f1-532b-44b7-9bb7-d69e8d77f41c';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F5%2F4.jpg?alt=media&token=05115a61-88c5-456e-9f9b-8f73a0769ed3';

            name = 'Aimee Morakot';
            birthday = '29011994';
            height = 162;
            weight = 46;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 5) {
            location = {
                description: 'Quinn Condo, Ratchadaphisek Road, Din Daeng, Bangkok, Thailand',
                latitude: 13.786335,
                longitude: 100.5732249
            };

            note = 'If you want to know me, chat me up now.';

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F6%2F1.jpg?alt=media&token=83c4c5f6-baf5-4dd0-a3d6-f632378c2493';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F6%2F2.jpg?alt=media&token=a9849bf8-1e48-4dad-8cd4-fa13185396a5';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F6%2F3.jpg?alt=media&token=c7aff358-c9e6-4243-8a16-327bcd25e98b';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F6%2F4.jpg?alt=media&token=7df820f3-e0d3-434f-b847-07a184a67330';

            name = 'Wichuda';
            birthday = '07081996';
            height = 167;
            weight = 52;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 6) {
            location = {
                description: 'DEMO, Sukhumvit Rd, Khlong Tan Nuea, Watthana, Bangkok, Thailand',
                latitude: 13.7325629,
                longitude: 100.5855291
            };

            note = 'Looking for new friends\n\nFitness 💪\n\nHangout 🍺\n\nTravel ✈️';

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F7%2F1.jpg?alt=media&token=4c440a46-0a55-46bc-b9a6-c26c0bbeed3a';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F7%2F2.jpg?alt=media&token=7dd2ac81-2779-4309-a4b1-fd1f48cdfd39';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F7%2F3.jpg?alt=media&token=c2db0b33-3a34-4868-9b98-e9dfa8cf2316';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FBangkok%2F7%2F4.jpg?alt=media&token=8f582d5b-184e-4610-bd93-9327bcb4f72c';

            name = 'Nunchayaphat';
            birthday = '07081994';
            height = 166;
            weight = 50;
            bust = 'B';
            bodyType = 'Fit';
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

    async initPattaya(i) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ49cxTZKVAjER_xC9qQHzf6k';
        const placeName = 'Pattaya City, Thailand';
        const extra = {
            lat: 12.9235557,
            lng: 100.8824551
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
            location = {
                description: 'Seven Seas Condo Resort Jomtien Thanon Chaiyaphruek, Pattaya City, Bang Lamung District, Chon Buri, Thailand',
                latitude: 12.8779918,
                longitude: 100.8917015
            };

            note = "English well 😊\nService better 😝\nLet's have some fun together 💕";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F1%2F2.JPG?alt=media&token=93af15e7-d467-47fb-b3bb-8207bacaaf1f';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F1%2F1.JPG?alt=media&token=b14902d1-8caf-4a92-b016-deebbc5f7a1b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F1%2F3.JPG?alt=media&token=74da4dd8-d930-467e-a902-ba45e1d6511b';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F1%2F4.JPG?alt=media&token=9be7c154-05c4-4afa-8550-95fd7e918a91';

            name = 'Anong Somyok';
            birthday = '14071996';
            height = 166;
            weight = 49;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 1) {
            location = {
                description: 'South Pattaya Road, Pattaya City, Bang Lamung District, Chon Buri, Thailand',
                latitude: 12.921861,
                longitude: 100.8861047
            };

            // 2. note
            note = "Looking for people to have a good time with\nLet's meet for a tea and see what happens from there. 😊";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F2%2F1.jpg?alt=media&token=18eb0347-96e2-4a4b-969a-306ceb681eca';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F2%2F2.jpg?alt=media&token=f3858f46-f499-4c2b-b4c7-ad9e2e4d2b37';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F2%2F3.jpg?alt=media&token=081acc44-8be5-4451-8f4d-73cd69e87dd5';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F2%2F4.jpg?alt=media&token=0629e1c2-62eb-46dc-97e0-aa5e0f6457b7';

            name = 'Lawana Siilva';
            birthday = '28031996';
            height = 164;
            weight = 47;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 2) {
            location = {
                description: 'Yensabai Condotel, ถนน พัทยาสาย 2 ซอย 17 ตำบล หนองปรือ Bang Lamung District, Chon Buri, Thailand',
                latitude: 12.922629,
                longitude: 100.87611
            };

            // 2. note
            note = "If you are not serious then please don't waste my time.";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F3%2F1.jpg?alt=media&token=164fe3a4-524a-41f2-a7f1-8230e5fb9b35';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F3%2F2.jpg?alt=media&token=76eeb498-4835-4199-9bcf-0c67ed665d0b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F3%2F3.jpg?alt=media&token=a1cad18f-ad58-4e3a-b2c3-35afe39ec6b1';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F3%2F4.jpg?alt=media&token=ff455e2c-625d-4246-bb32-773b24f27f2f';

            name = 'Kulap';
            birthday = '05091995';
            height = 167;
            weight = 52;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 3) {
            location = {
                description: 'City Garden Pattaya Condominium, ถนน พัทยาสายสอง ซอย 15 ตำบล หนองปรือ Bang Lamung District, Chon Buri, Thailand',
                latitude: 12.9266139,
                longitude: 100.878973
            };

            // 2. note
            note = "Where are you? I'm waiting for you here. 💕";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F4%2F1.jpg?alt=media&token=c3b4acb1-4f90-40cb-aa7b-f2f4928d1c07';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F4%2F2.jpg?alt=media&token=a5ed6305-d508-4ce7-940d-a242ab6a8163';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F4%2F3.jpg?alt=media&token=693f0346-e1fa-489d-ab67-97a326a0d7c9';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F4%2F4.jpg?alt=media&token=a089df18-086f-422c-a8bc-7722e1fcb378';

            name = 'Phaelyn Tasanee';
            birthday = '20041996';
            height = 166;
            weight = 48;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 4) {
            location = {
                description: 'Underwater World Pattaya, Sukhumvit Road, ตำบล หนองปรือ Bang Lamung District, Chon Buri, Thailand',
                latitude: 12.896693,
                longitude: 100.896062
            };

            // 2. note
            note = "Willing to meet a guy who can do my little favor. 😸";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F5%2F20190814_133304.jpg?alt=media&token=9f7f3a05-3929-4275-814d-8a8be87241f1';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F5%2F20190814_133322.jpg?alt=media&token=f1bb4f22-90d5-4c3b-9948-d1d0815e8d9b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F5%2F20190814_133343.jpg?alt=media&token=16309f2a-aa91-42b2-8468-0f00c61fdf4d';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F5%2F20190814_133359.jpg?alt=media&token=17a23dd5-144f-4efa-9ca2-5bc4151b51dd';
            // --

            name = 'Apinya Kaweepun';
            birthday = '27061996';
            height = 168;
            weight = 51;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 5) {
            location = {
                description: "Atthasit Village, Pattaya City, Bang Lamung District, Chon Buri, Thailand",
                latitude: 12.909882,
                longitude: 100.880767
            };

            note = "Hope to make lots of friends here.\n";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F6%2F1.jpg?alt=media&token=6bf6b0b3-a56c-402e-b2ff-c33d915b0400';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F6%2F2.jpg?alt=media&token=38eb39e8-9ab3-470e-ab60-94e11e3f27cd';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F6%2F3.jpg?alt=media&token=a0f2bf8c-7a09-4552-a06e-618123191a7a';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FPattaya%2F6%2F4.jpg?alt=media&token=765743d4-31a3-4bae-89ed-3351f251b0c9';

            name = '';
            birthday = '23041994';
            height = 164;
            weight = 49;
            bust = 'B';
            bodyType = 'Fit';
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

    async initMacao(i) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ88g14uB6ATQR9qyFtCzje8Y';
        const placeName = 'Macao';
        const extra = {
            lat: 22.198745,
            lng: 113.543873
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
            location = {
                description: 'Edf. Hung Fat Garden (Bloco 2), Rua do Minho, Macao',
                latitude: 22.161526,
                longitude: 113.554033
            };

            note = "Chinese, English 👌\nFriends 👫\nmovies 🎬\nMaybe more? 😳";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F1%2F1.jpg?alt=media&token=08243466-8b36-4903-b0f0-b9b73563372d';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F1%2F2.jpg?alt=media&token=be8d93ff-ea25-4b6c-9e52-dacf52e03bc6';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F1%2F3.jpg?alt=media&token=b336aa3b-b429-4bfa-9b86-fc216ff355f0';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F1%2F4.jpg?alt=media&token=c434938f-f5b3-42ce-887b-7837138f15eb';

            name = 'Li Na';
            birthday = '12101994';
            height = 167;
            weight = 49;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 1) {
            location = {
                description: '3 R. de Tome Pires, Macao',
                latitude: 22.2041189,
                longitude: 113.5444902
            };

            note = "Let's be real you just want my tits";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F2%2F1.jpg?alt=media&token=456cdc47-f2bc-4752-a122-840615617022';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F2%2F2.jpg?alt=media&token=2eedbfab-565c-42bc-92fe-fe8c78d42f6f';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F2%2F3.jpg?alt=media&token=0f4190a8-c5b0-4d14-bf0c-c6ce7608687c';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F2%2F4.jpg?alt=media&token=900d9d95-ecb7-482b-a710-8fc05b82415e';

            name = 'Mei Xiang';
            birthday = '26091995';
            height = 163;
            weight = 46;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 2) {
            location = {
                description: "Park 'n Shop Taipa, Rua de Évora, Macao",
                latitude: 22.1566428,
                longitude: 113.5567555
            };

            note = "I'll still kiss you after you give me a rim job and I do a lot of yoga";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F3%2F1.jpg?alt=media&token=775e3abe-b20f-4933-8601-03fe48b51141';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F3%2F2.jpg?alt=media&token=d44c3235-9d4c-4f3c-be88-f569973de155';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F3%2F3.jpg?alt=media&token=f245f040-3d73-427f-b42f-c0c5a012c2a6';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F3%2F4.jpg?alt=media&token=a8d7e77e-089d-456f-be7e-77ecbc9b0e04';

            name = 'Zhang Xiu';
            birthday = '03101994';
            height = 163;
            weight = 46;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 3) {
            location = {
                description: "Ka Meng Villa, Rua da Madeira, Macao",
                latitude: 22.1960877,
                longitude: 113.5377319
            };

            note = "I'm looking for Korean guys, for obvious reasons 👸";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F4%2F1.jpg?alt=media&token=122abe17-3662-4930-8780-b9f38f807733';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F4%2F2.jpg?alt=media&token=ec5d87a3-da31-41c7-a1bd-f3ec72b5ee9a';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F4%2F3.jpg?alt=media&token=db19ac5b-4979-4db9-9652-83b56ccefeed';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F4%2F4.jpg?alt=media&token=1f836cba-cc27-47b7-881d-dd3201796e12';

            name = 'Ming';
            birthday = '19121996';
            height = 167;
            weight = 51;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 4) {
            location = {
                description: "45 R. dos Currais, Macao",
                latitude: 22.2144939,
                longitude: 113.5464781
            };

            note = "I’ll treat you good 💋💋";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F5%2F1.jpg?alt=media&token=eef8041f-d82a-4685-a6d2-c1a6f088b72a';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F5%2F2.jpg?alt=media&token=7dbd8e29-105a-412f-83b0-641255ef61a9';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F5%2F3.jpg?alt=media&token=bb8eba18-5b81-4956-bac7-dc071eb76a67';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FMacao%2F5%2F4.jpg?alt=media&token=6abcf5df-a074-4f47-93c9-c4c7cf35df0a';

            name = 'Linda';
            birthday = '30111993';
            height = 162;
            weight = 47;
            bust = 'C';
            bodyType = 'Fit';
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
            location = {
                description: 'Greenbelt Mansion, Perea, Legaspi Village, Makati, Metro Manila, Philippines',
                latitude: 14.554688,
                longitude: 121.02061
            };

            note = 'Your favorite German Filipino 🇩🇪🇵🇭\nWanna meet new guys 😃';

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F1%2F1.jpg?alt=media&token=9db33673-8d0e-4fde-8bbb-205e270fc43f';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F1%2F2.jpg?alt=media&token=bac9e054-c962-4db6-b376-95532638a5fe';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F1%2F3.jpg?alt=media&token=e939094a-3457-4f56-bb88-6055f84e9b79';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F1%2F4.jpg?alt=media&token=8930dd5c-3609-473e-b418-5a7fd078257c';

            name = 'Laura';
            birthday = '02121996';
            height = 170;
            weight = 51;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 1) {
            location = {
                description: 'The Peninsula Manila, Makati, Metro Manila, Philippines',
                latitude: 14.5556401,
                longitude: 121.0251313
            };

            note = "Just got out of a long relationship\nBig sad 😭\nHere for a good time not a long one 💏";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F2%2F1.jpg?alt=media&token=e4c8ad17-f2c5-4a01-a837-27c379611b97';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F2%2F2.jpg?alt=media&token=d4789a54-6a4e-4c08-a2eb-52840a26c8e4';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F2%2F3.jpg?alt=media&token=03871b00-59a9-40ce-9376-cf557ff0c324';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F2%2F4.jpg?alt=media&token=ef1cd3bf-124e-4a38-b25d-9699cba7a61c';

            name = 'Angelina';
            birthday = '02121994';
            height = 166;
            weight = 51;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 2) {
            location = {
                description: "4125 Gen. Mascardo, Makati, Metro Manila, Philippines",
                latitude: 14.546625,
                longitude: 121.009536
            };

            note = "Love to travel ✈️\nLooking for fun and coffee dates ☕\n";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F3%2F1.jpg?alt=media&token=2bd4c6b0-a036-4f27-842b-c8190c294ae3';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F3%2F2.jpg?alt=media&token=587c5d6f-f090-44b9-a0a0-0c9479625401';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F3%2F3.jpg?alt=media&token=7d2d3415-c28d-4817-a9d0-0e32205fc4a6';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F3%2F4.jpg?alt=media&token=12e1610b-3442-4560-91f1-019a5d2a72fe';

            name = 'Nicole';
            birthday = '08091994';
            height = 164;
            weight = 49;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 3) {
            location = {
                description: "1580 Cypress, Makati, Metro Manila, Philippines",
                latitude: 14.536199,
                longitude: 121.02803
            };

            note = "Searching for hot guys\nPlease be polite and show good manners to me";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F4%2F1.jpg?alt=media&token=d7ec6416-32b9-47f4-92f1-d9ac26fc8981';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F4%2F4.jpg?alt=media&token=71d20f6c-f72f-4e63-86ec-929be7aa6ec1';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F4%2F3.jpg?alt=media&token=41dfe5c2-1d1d-4683-897f-456950790574';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FManila%2F4%2F2.jpg?alt=media&token=d029fe5e-3e85-43e3-b33c-43fc17e067cc';

            name = 'Jasmine';
            birthday = '08091992';
            height = 167;
            weight = 51;
            bust = 'C';
            bodyType = 'Fit';
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
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const placeName = 'Ho Chi Minh City, Vietnam';
        const extra = {
            lat: 10.8230989,
            lng: 106.6296638
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
            location = {
                description: "Springlight City, Nguyễn Đình Chiểu, Da Kao, District 1, Ho Chi Minh City, Vietnam",
                latitude: 10.7905412,
                longitude: 106.7021585
            };

            note = "Just looking for a cute guy to grab a drink with.";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F1%2F1.jpg?alt=media&token=fb60fa1f-0853-43e6-8a84-58231433441d';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F1%2F2.jpg?alt=media&token=ec9ed72e-ee21-45c5-97fd-fac401a576c8';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F1%2F3.jpg?alt=media&token=5bdd43e7-83f9-43ca-853e-1a022690ebe4';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F1%2F4.jpg?alt=media&token=ba85eccc-74bf-4b55-a775-ecf6b037d405';

            name = 'Ngân Hoà';
            birthday = '28061994';
            height = 164;
            weight = 48;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 1) {
            location = {
                description: "AEON MALL Bình Tân - Cổng Nhập Hàng (Cổng số 1), Tên Lửa, Binh Tri Dong B, Bình Tân, Ho Chi Minh City, Vietnam",
                latitude: 10.7431063,
                longitude: 106.613496
            };

            note = "Here to meet new people but always open to more if we are connected. 👻\n Deep talks and/or good sex are always welcome. 👌";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F2%2F1.jpg?alt=media&token=2b0b9058-8f20-4588-adf9-bf780979aa30';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F2%2F2.jpg?alt=media&token=4e89cf8a-2b1d-494d-9843-85d9852b9832';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F2%2F3.jpg?alt=media&token=800fd242-3b45-4f83-bb5e-426cb087f98a';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F2%2F4.jpg?alt=media&token=6e24fd15-4237-4568-b5ef-a6f0cf140dc8';

            name = 'Trương Hoàng Mỹ Yến';
            birthday = '04051995';
            height = 166;
            weight = 50;
            bust = 'B';
            bodyType = 'Skinny';
        } else if (i === 2) {
            location = {
                description: "30/13 Trịnh Đình Thảo, Tân Phú, Ho Chi Minh City, Vietnam",
                latitude: 10.7742257,
                longitude: 106.6349334
            };

            // 2. note
            note = "Looking for fun!\nNothing serious 😜\nHookups\nFWB";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F3%2F1.jpg?alt=media&token=90c82fd7-5a3f-469e-ad64-499495039630';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F3%2F2.jpg?alt=media&token=a6e5e118-35a0-4eab-a142-cb542562a251';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F3%2F3.jpg?alt=media&token=de2d3f1a-4519-4150-9e3d-916d74992da5';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F3%2F4.jpg?alt=media&token=622f010f-543f-4290-beb8-d1591d5b02fb';

            name = 'Maia';
            birthday = '04051997';
            height = 162;
            weight = 47;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 3) {
            location = {
                description: "Somerset Ho Chi Minh City, Nguyễn Bỉnh Khiêm, Da Kao, District 1, Ho Chi Minh City, Vietnam",
                latitude: 10.7898591,
                longitude: 106.7031687
            };

            // 2. note
            note = "Mixed blood\nJapanese X Vietnamese\nHalf devil 😈 X half goodness 😁";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F4%2F1.jpg?alt=media&token=8c850e06-9fa3-4d25-ba17-3fe09beb3399';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F4%2F2.jpg?alt=media&token=1671506a-7329-4504-bc19-4684b7558619';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F4%2F3.jpg?alt=media&token=a7ca6aed-26d0-47bb-8cd9-1747d671528e';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F4%2F4.jpg?alt=media&token=79e7578e-8099-4c56-b746-da38b2119625';

            name = 'Phương Nga';
            birthday = '19091996';
            height = 164;
            weight = 49;
            bust = 'B';
            bodyType = 'Fit';
        } else if (i === 4) {
            location = {
                description: "220/90 Xô Viết Nghệ Tĩnh, Thành phố Buôn Ma Thuột, Đắk Lắk Province, Vietnam",
                latitude: 12.6871911,
                longitude: 108.0407688
            };

            note = "Looking for 🤴❤\nI'm from china. 🇨🇳\nStaying in Vietnam for 2 years. 🇻🇳";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F5%2F1.jpg?alt=media&token=c0e8421a-7050-4e4d-8291-5fa1ebb51051';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F5%2F2.jpg?alt=media&token=8fde0163-8bf0-41c0-a401-8034c8009b6b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F5%2F3.jpg?alt=media&token=087d8f05-4810-4a72-b131-7fd3c52c2f71';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FHCM%2F5%2F4.jpg?alt=media&token=7f4fdf1e-4f35-4db3-a93e-731d602e892d';

            name = 'Nana';
            birthday = '24031995';
            height = 163;
            weight = 47;
            bust = 'C';
            bodyType = 'Fit';
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

    async initVientiane(i) {
        const userUid = Firebase.user().uid;
        const feedId = Util.uid();

        const placeId = 'ChIJIXvtBoZoJDER3-7BGIaxkx8';
        const placeName = 'Vientiane, Laos';
        const extra = {
            lat: 17.9757058,
            lng: 102.6331035
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
            location = {
                description: "Rue Phai Nam, Vientiane, Laos",
                latitude: 17.9666882,
                longitude: 102.6111809
            };

            // 2. note
            note = "FROM THAI🇹🇭🇹🇭🇹🇭\n🍺🍺CLUB & HANGOUT🍷🍷\nNOW IN VIENTIANE";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F1%2F1.jpg?alt=media&token=969fd8d4-59d4-4f69-91d8-f2d545d639c7';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F1%2F2.jpg?alt=media&token=7c48419a-a566-41e7-ab3d-a43b993eba31';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F1%2F3.jpg?alt=media&token=7ad2ae36-8fa5-471f-b7bf-d03865bc10de';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F1%2F4.jpg?alt=media&token=5ad8a432-76ee-4083-9d41-04244bd3af90';

            name = 'Nana';
            birthday = '24031995';
            height = 163;
            weight = 47;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 1) {
            location = {
                description: "Kamu Tea Laos, Vientiane, Laos",
                latitude: 17.9618905,
                longitude: 17.9618905
            };

            // 2. note
            note = "How to say ‘Handsome’ in Korean?\n Somebody teach me Korean :)";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F2%2F1.jpg?alt=media&token=42a5aaa2-79f3-4a2e-9920-5371cbbb5a2d';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F2%2F2.jpg?alt=media&token=b3075585-3ab6-4e09-9b72-1d3e6a8975bb';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F2%2F3.jpg?alt=media&token=078c0a22-178f-49e6-8404-87e0c751b026';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F2%2F4.jpg?alt=media&token=cc5abbca-02d6-4e37-961d-330007b38711';

            name = 'May Lynn';
            birthday = '24031995';
            height = 163;
            weight = 48;
            bust = 'C';
            bodyType = 'Fit';
        } else if (i === 2) {
            location = {
                description: "Khualuang Road, Vientiane, Laos",
                latitude: 17.9719909,
                longitude: 102.6047841
            };

            // 2. note
            note = "☺😊\nhalf chinese half vietnamese 🇨🇳🇻🇳";

            image1Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F3%2F1.jpg?alt=media&token=f75a9d5a-8da6-4431-af66-55f936337ee9';
            image2Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F3%2F2.jpg?alt=media&token=a29c0d3e-e525-4498-868f-78638e387e3b';
            image3Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F3%2F3.jpg?alt=media&token=44bc133c-666b-4e61-ab4c-0ad59563b006';
            image4Uri = 'https://firebasestorage.googleapis.com/v0/b/rowena-88cfd.appspot.com/o/samples%2FVientiane%2F3%2F4.jpg?alt=media&token=5ea6b056-eb2d-4ae0-bcd9-e94f80d321fb';

            name = 'Chandaly Keolakhone';
            birthday = '24031995';
            height = 165;
            weight = 50;
            bust = 'C';
            bodyType = 'Fit';
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
        const height = 162;
        const weight = 47;
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
        const placeName = 'Pattaya City, Thailand';
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
