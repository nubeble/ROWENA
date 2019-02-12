// @flow
import * as React from "react";
import {
    StyleSheet, View, Dimensions, TouchableOpacity, FlatList, Image
} from "react-native";
import { Header } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import SmartImage from "./rnff/src/components/SmartImage";
import Carousel from './Carousel';
import PreloadImage from './PreloadImage';
import { Globals } from "./Globals";

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
        // ToDo: Place는 일단 고정. 추후 등록된 Post 개수가 가장 많은 상위 6곳을 가져와야 한다. (database indexes를 써서 미리 내림차순정렬로 가지고 있자!)
        // 이 때 image는 어떻게 가져올 지 고민!!
        places: [
            {
                place_id: 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                description: 'Bangkok, Thailand',
                city: 'Bangkok',
                uri: PreloadImage.Bangkok,
                length: 0
            },
            {
                place_id: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk',
                description: 'Manila, Philippines',
                city: 'Manila',
                uri: PreloadImage.Manila,
                length: 0
            },
            {
                place_id: 'ChIJ0T2NLikpdTERKxE8d61aX_E',
                description: 'Ho Chi Minh, Vietnam',
                city: 'Ho Chi Minh',
                uri: PreloadImage.HoChiMinh,
                length: 0
            },
            {
                place_id: 'ChIJIXvtBoZoJDER3-7BGIaxkx8',
                description: 'Vientiane, Laos',
                city: 'Vientiane',
                uri: PreloadImage.Vientiane,
                length: 0
            },
            {
                place_id: 'ChIJ42tqxz1RCTERuyW1WugOAZw',
                description: 'Phnom Penh, Cambodia',
                city: 'Phnom Penh',
                uri: PreloadImage.PhnomPenh,
                length: 0
            },
            {
                place_id: 'ChIJnUvjRenzaS4RoobX2g-_cVM',
                description: 'Jakarta, Indonesia',
                city: 'Jakarta',
                uri: PreloadImage.Jakarta,
                length: 0
            }
        ],
        searchText: '',
        refreshing: false
    };

    componentDidMount() {
        // console.log('Intro::componentDidMount');

        console.log('window width', Dimensions.get('window').width); // Galaxy S7: 640, Tango: 731, iphone X: 812
        console.log('window height', Dimensions.get('window').height); // Galaxy S7: 640, Tango: 731, iphone X: 812

        this.getPlacesSize();
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
                    !this.isClosed && this.setState({ places });
                }
            });

            // if (this.state.refreshing) !this.isClosed && this.setState({ refreshing: false });
        }
    }

    componentWillUnmount() {
        // console.log('Intro::componentWillUnmount');

        if (this.unsubscribeToPlaceSize) this.unsubscribeToPlaceSize();

        this.isClosed = true;
    }

    render(): React.Node {
        // const { feedStore, profileStore, navigation } = this.props;
        // const { profile } = profileStore;

        return (
            <View style={styles.flex}>
                {/*
                <SearchModal ref='searchModal'></SearchModal>
                */}

                <View style={styles.searchBar}>
                    <View style={{
                        width: '70%', height: 34,
                        backgroundColor: Theme.color.component,
                        borderRadius: 25
                    }} >
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 12, top: 8, alignSelf: 'baseline' }}
                            onPress={() => {
                                // this.refs.searchModal.showModal();
                                this.props.navigation.navigate("introSearchModal");
                            }}
                        >
                            <FontAwesome name='search' color="rgb(160, 160, 160)" size={17} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ position: 'absolute', top: 3, width: '78%', height: 27, alignSelf: 'center' }}
                            onPress={() => {
                                // this.refs.searchModal.showModal();
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
                                style={{ width: '100%', height: '100%', fontSize: 16, fontFamily: "SFProText-Semibold", paddingTop: Globals.searchBarPaddingTop(),
                                    color: "rgb(160, 160, 160)", textAlign: 'center' }}
                            >{'Where to?'}</Text>
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
                            <TouchableOpacity
                                onPress={() => {
                                    setTimeout(() => {
                                        this.props.navigation.navigate("exploreMain", { place: item, length: this.state.places[index].length });
                                    }, Globals.buttonTimeout);
                                }}
                            >
                                <View style={styles.pictureContainer}>
                                    <Image
                                        style={styles.picture}
                                        source={item.uri}
                                    />

                                    <View style={styles.content}>
                                        <Text style={{
                                            textAlign: 'center',
                                            color: Theme.color.text1,
                                            fontSize: 20,
                                            lineHeight: 26,
                                            fontFamily: "SFProText-Bold"
                                        }}>{item.city}</Text>

                                        <Text style={{
                                            textAlign: 'center',
                                            color: Theme.color.text2,
                                            fontSize: 14,
                                            lineHeight: 18,
                                            fontFamily: "SFProText-Semibold"
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
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('1')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://2.bp.blogspot.com/-z2h6jj8PCKw/WiVyrSTiBUI/AAAAAAAAG7A/9D8ggDsoY5QArutqvVfzhSd82f5GtviAgCLcBGAs/s1600/%25EC%25A0%259C%25EB%25AA%25A9-%25EC%2597%2586%25EC%259D%258C2.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('2')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://coinpan.com/files/attach/images/198/637/529/067/504ea1e1eae11d0485347359ba31e0c5.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('3')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.nemopan.com/files/attach/images/6294/443/061/012/2926fb2e2919796604716f0aeb79c39b.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('4')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://t1.daumcdn.net/cfile/tistory/253E1A3D56F8F68821'}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/*
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('5')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://jjalbang.today/jj1ic.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('6')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://upload2.inven.co.kr/upload/2017/10/07/bbs/i15561885543.gif'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('7')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://www.city.kr/files/attach/images/238/795/978/010/00616702b6cfe1f570fb4c11730fa0cc.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                */}

                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('5')}>
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
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('1')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://ncache.ilbe.com/files/attach/new/20150710/377678/2901603725/6167124321/0c0e48771650a5ea45b0ec6ef4620faf.jpg'}
                                        // uri={'http://www.city.kr/files/attach/images/238/919/279/004/5e68e793cb4707dda80030169c395b30.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('2')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://www.city.kr/files/attach/images/238/919/279/004/5e68e793cb4707dda80030169c395b30.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('3')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://fimg4.pann.com/new/download.jsp?FileID=47449859'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('4')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile22.uf.tistory.com%2Fimage%2F99F75D335997CD46295649'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_middle}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('5')}>
                                        <SmartImage
                                            style={styles.item}
                                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                            uri={'http://www.city.kr/files/attach/images/238/795/978/010/00616702b6cfe1f570fb4c11730fa0cc.jpg'}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.view_rear}>
                                    <TouchableOpacity activeOpacity={1.0} onPress={() => console.log('6')}>
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
                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                />
            </View>
        );
    } // end of render()

    handleRefresh = () => {
        /*
        this.setState(
            {
                refreshing: true
            },
            () => {
                // this.getPlacesSize();
                // ToDo: refresh the latest feed of 6 places & show pictures
            }
        );
        */
    };

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
    searchBar: {
        height: Globals.searchBarHeight,
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
