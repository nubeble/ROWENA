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
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';

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

const _itemWidth = Dimensions.get('window').width - 40;
const _itemHeight = parseInt(Dimensions.get('window').width - 40) / 5 * 3;



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
                // uri: require('../assets/place/Bangkok.jpg'),
                uri: PreloadImage.Bangkok,
                length: 0
            },
            {
                place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk',
                description: 'Manila, Philippines',
                city: 'Manila',
                // uri: require('../assets/place/Manila.jpg'),
                uri: PreloadImage.Manila,
                length: 0
            },
            {
                place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E',
                description: 'Ho Chi Minh, Vietnam',
                city: 'Ho Chi Minh',
                // uri: require('../assets/place/HoChiMinh.jpg'),
                uri: PreloadImage.HoChiMinh,
                length: 0
            },
            {
                place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8',
                description: 'Vientiane, Laos',
                city: 'Vientiane',
                // uri: require('../assets/place/Vientiane.jpg'),
                uri: PreloadImage.Vientiane,
                length: 0
            },
            {
                place_id: 'ChIJ42tqxz1RCTERuyW1WugOAZw',
                description: 'Phnom Penh, Cambodia',
                city: 'Phnom Penh',
                // uri: require('../assets/place/PhnomPenh.jpg'),
                uri: PreloadImage.PhnomPenh,
                length: 0
            },
            {
                place_id: 'ChIJnUvjRenzaS4RoobX2g-_cVM',
                description: 'Jakarta, Indonesia',
                city: 'Jakarta',
                // uri: require('../assets/place/Macau.jpg'),
                uri: PreloadImage.Jakarta,
                length: 0
            }
        ],

        searchText: '',


    };


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
                        backgroundColor: Theme.color.component,
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
                                            color: Theme.color.text1,
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
                                            color: Theme.color.text2,
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

                            <Carousel>
                                <View style={styles.view_front}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://2.bp.blogspot.com/-z2h6jj8PCKw/WiVyrSTiBUI/AAAAAAAAG7A/9D8ggDsoY5QArutqvVfzhSd82f5GtviAgCLcBGAs/s1600/%25EC%25A0%259C%25EB%25AA%25A9-%25EC%2597%2586%25EC%259D%258C2.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://coinpan.com/files/attach/images/198/637/529/067/504ea1e1eae11d0485347359ba31e0c5.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.nemopan.com/files/attach/images/6294/443/061/012/2926fb2e2919796604716f0aeb79c39b.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://t1.daumcdn.net/cfile/tistory/253E1A3D56F8F68821'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://jjalbang.today/jj1ic.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://upload2.inven.co.kr/upload/2017/10/07/bbs/i15561885543.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://file2.instiz.net/data/file2/2017/04/25/c/8/e/c8e389c7dc8d8ee4bde9523ff398b54d.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('onPress')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://fimg4.pann.com/new/download.jsp?FileID=47136904'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Carousel>

                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Recently listed girls'}</Text>
                            </View>

                            <Carousel>
                                <View style={styles.view_front}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('0')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://www.city.kr/files/attach/images/238/919/279/004/5e68e793cb4707dda80030169c395b30.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('1')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://image.cloud.sbs.co.kr/smr/clip/201806/15/Xj56w3N3h7jEMCD5cyJZ4f_640.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('2')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.thedailypost.kr/wp-content/uploads/2017/02/H52Am.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('3')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://kstatic.inven.co.kr/upload/2017/07/05/bbs/i13856102909.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('4')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://pbs.twimg.com/media/DZsUYFoVMAAoKY4.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Carousel>



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


}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        // backgroundColor: 'black'
        backgroundColor: Theme.color.background
    },

    //// SEARCH BAR ////
    searchBarStyle: {
        // height: Constants.statusBarHeight + Header.HEIGHT,
        // paddingBottom: 14 + 2,
        height: Constants.statusBarHeight + 8 + 34 + 8,
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
        color: Theme.color.text1,
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },

    //// FlatList ////
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
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        padding: Theme.spacing.small,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
        // justifyContent: 'flex-end'
    },

    //// ScrollView item ////
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
