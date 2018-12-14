import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Dimensions,
    FlatList, ScrollView, TouchableWithoutFeedback, Alert
} from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, ImagePicker, Linking, MapView } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
// import * as firebase from 'firebase';
// import Firebase from "./Firebase"
// import { StyleGuide } from "./rne/src/components/theme";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import moment from 'moment';
import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
import Swiper from './Swiper';
import { Rating, AirbnbRating } from './react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";
import autobind from "autobind-decorator";


const tmp = "Woke up to the sound of pouring rain\
The wind would whisper and I'd think of you\
And all the tears you cried, that called my name\
And when you needed me I came through\
I paint a picture of the days gone by\
When love went blind and you would make me see\
I'd stare a lifetime into your eyes\
";



export default class Detail extends React.Component {
    state = {
        showIndicator: false,
        rating: 0,
        scrollPosition: 0,

    };

    onGoBack() {
        console.log('Detail::onGoBack');

        this.setState({ rating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating


        // ToDo: vertical 스크롤 좌표를 기억하고 있다가, 넘어갔다오면 다시 셋팅!
        // this._flatList.scrollToOffset(this.state.scrollPosition);
        this._flatList.scrollToEnd({animated: false});
    }

    @autobind
    handleScroll(event) {
        console.log(event.nativeEvent.contentOffset.y);
        this.setState({ scrollPosition: event.nativeEvent.contentOffset.y });
    }

    componentDidMount() {
        console.log('Detail::componentDidMount');

        const { post, profile } = this.props.navigation.state.params;

        /*
        type Post = {
            uid: string,
            id: string,
            location: Location, // 1
            note: string, // 2
            pictures: Pictures, // 3
            placeId: string, // 4
            // reviews: Review[], // 저장해 두지 않고, review 창이 뜰 때 동적으로 서버에서 가져온다. (Comments 처럼) // 7
            averageRating: number, // 5
            timestamp: number, // 6

            name: string, // 7
            age: number // 8
        };

        type Profile = {
            uid: string,
            name: string,
            country: string,
            city: string,
            email: string,
            phoneNumber: string,
            picture: Picture,
            location: Location,
            about: string,
            feeds: Feed[],
            postedReviews: string[]
        };
        */
    }

    render() {
        const { post, profile } = this.props.navigation.state.params;


        return (
            <View style={styles.flex} >

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={this.state.showIndicator}
                    size="large"
                    color='white'
                />

                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
                        // style={{ marginTop: Constants.statusBarHeight + Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        // style={{ marginTop: Header.HEIGHT / 3, marginLeft: 22, alignSelf: 'baseline' }}
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            left: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => this.props.navigation.goBack()}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 8 + 4, // paddingBottom from searchBarStyle
                            right: 22,
                            alignSelf: 'baseline'
                        }}
                        onPress={() => Alert.alert("Not Implemented")}
                    >
                        <Ionicons name='md-heart-empty' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList

                    ref={(fl) => this._flatList = fl}
                    onScroll={this.handleScroll}


                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <Animated.View style={{ backgroundColor: 'black' }}>
                            {/* profile pictures */}
                            {this.renderSwiper(post)}

                            <View style={styles.infoContainer}>
                                <Text style={styles.date}>posted {moment(post.timestamp).fromNow()}</Text>

                                {/*
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} >
                                    <Text style={styles.name}>{post.name}</Text>
                                    <Text style={styles.size}>
                                        {post.age}yr {post.height}cm {post.weight}kg
                                    </Text>
                                </View>
                                */}

                                <Text style={styles.name}>{post.name}</Text>
                                <Text style={styles.size}>
                                    {post.age}yr {post.height}cm {post.weight}kg
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }}>
                                    <View style={{ width: '27%' }}>
                                        <AirbnbRating
                                            count={5}
                                            readOnly={true}
                                            showRating={false}
                                            defaultRating={4}
                                            size={16}
                                            margin={1}
                                        // style={{alignSelf: 'flex-start'}}
                                        />
                                    </View>

                                    {/*
                                    // ToDo: draw stars based on averge rating & get review count
                                    <Text style={styles.rating}>{post.averageRating}</Text>
                                    */}
                                    <Text style={styles.rating}>4.4</Text>

                                    <AntDesign style={{ marginLeft: 12, marginTop: 1 }} name='message1' color="white" size={16} />
                                    <Text style={styles.reviewCount}>12</Text>
                                </View>

                                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%' }} />

                                <Text style={styles.note}>{post.note}
                                    {tmp}
                                </Text>

                                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%' }} />

                                {/* map */}
                                <TouchableOpacity activeOpacity={0.5}
                                    // onPress={() => this.props.navigation.navigate("map", { post: post, profile: profile, onGoBack: () => this.onGoBack() })}
                                    onPress={() => this.props.navigation.navigate("map", { post: post, profile: profile })}
                                >
                                    <View style={styles.mapContainer}>
                                        <MapView
                                            ref={map => { this.map = map }}
                                            style={styles.map}
                                            mapPadding={{ left: 0, right: 0, top: 25, bottom: 25 }}
                                            initialRegion={{
                                                longitude: post.location.longitude,
                                                latitude: post.location.latitude,
                                                latitudeDelta: 0.001,
                                                longitudeDelta: 0.001
                                            }}
                                            scrollEnabled={false}
                                            zoomEnabled={false}
                                            rotateEnabled={false}
                                            pitchEnabled={false}
                                        >
                                            <MapView.Marker
                                                coordinate={{
                                                    longitude: post.location.longitude,
                                                    latitude: post.location.latitude
                                                }}
                                            // title={'title'}
                                            // description={'description'}
                                            />
                                        </MapView>
                                    </View>
                                </TouchableOpacity>

                                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%' }} />

                                <Text style={styles.review}>Share your experience to help others</Text>
                                <View style={{ marginBottom: 10 }}>
                                    <AirbnbRating
                                        ref='rating'
                                        onFinishRating={this.ratingCompleted}
                                        showRating={false}
                                        count={5}
                                        defaultRating={this.state.rating}
                                        size={32}
                                        margin={3}
                                    />
                                </View>

                                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%' }} />

                                {/* ToDo: show reviews */}


                            </View>

                            {/* ToDo: contact button */}
                            <TouchableOpacity onPress={() => this.contact()} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Contact</Text>
                            </TouchableOpacity>

                            {/*
                            <TouchableOpacity onPress={() => this.pickImage()} style={styles.signUpButton} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Pick me</Text>
                            </TouchableOpacity>
                            */}


                        </Animated.View>
                    )}
                // scrollEventThrottle={1}
                // columnWrapperStyle={undefined}
                // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                // {...{ onScroll }}
                />

            </View>

        );
    }

    renderSwiper(post) {
        let pictures = [];

        let value = post.pictures.one.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`one`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.two.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`two`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.three.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`three`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }

        value = post.pictures.four.uri;
        if (value) {
            pictures.push(
                <View style={styles.slide} key={`four`}>
                    <SmartImage
                        style={styles.item}
                        preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={value}
                    />
                </View>
            );
        }


        return (
            <Swiper
                style={styles.wrapper}
                // containerStyle={{ marginBottom: 10 }}
                width={Dimensions.get('window').width}
                // height={Dimensions.get('window').width / 16 * 9}
                height={Dimensions.get('window').width}
                loop={false}
                autoplay={false}
                autoplayTimeout={3}
                paginationStyle={{ bottom: 4 }}
            >
                {pictures}
            </Swiper>
        );
    }

    @autobind
    ratingCompleted(rating) {
        // console.log("Rating is: " + rating);

        const { post, profile } = this.props.navigation.state.params;
        // this.navigation.navigate("review", { post: post, profile: profile })
        setTimeout(() => {
            // this.props.navigation.navigate("review", { post: post, profile: profile, rating: rating });
            this.props.navigation.navigate("review", { post: post, profile: profile, rating: rating, onGoBack: () => this.onGoBack() });
        }, 1500); // 1.5 sec
    }

    contact() {
        // ToDo
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'black'
    },
    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,

        flexDirection: 'column',
        justifyContent: 'flex-end',
        // alignItems: 'center'
    },
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small
    },
    signUpButton: {
        //position: 'absolute',
        //bottom: 30,

        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },

    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold'
    },
    item: {
        // flex: 1,
        width: Dimensions.get('window').width,
        // height: Dimensions.get('window').width / 16 * 9,
        height: Dimensions.get('window').width
    },
    date: {
        fontSize: 16,
        fontFamily: "SFProText-Light",
        color: "grey",
        textAlign: 'right'
        // marginTop: 10,
        // lineHeight: 20,
    },
    infoContainer: {
        flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        // padding: Theme.spacing.small,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.small,
        paddingRight: Theme.spacing.small,
        // backgroundColor: 'rgb(27,27,27)'
    },
    name: {
        color: 'white',
        fontSize: 24,
        lineHeight: 24,
        fontFamily: "SFProText-Semibold",
        paddingBottom: Theme.spacing.tiny
    },
    size: {
        color: "white",
        fontSize: 18,
        lineHeight: 18,
        fontFamily: "SFProText-Regular",
        paddingBottom: Theme.spacing.tiny
        /*
        position: 'absolute',
        right: 0
        */
    },
    rating: {
        marginLeft: 4,
        // marginTop: 0,
        // backgroundColor: 'red',
        color: '#f1c40f',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },
    reviewCount: {
        marginLeft: 4,
        color: 'white',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },
    note: {
        color: 'white',
        fontSize: 16,
        fontFamily: "SFProText-Regular",
        marginTop: 10,
        marginBottom: 10
    },
    mapContainer: {
        paddingTop: Theme.spacing.small,
        paddingBottom: Theme.spacing.small
    },
    map: {
        width: '100%',
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 5 * 3
    },
    review: {
        color: 'grey',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 16,
        fontFamily: "SFProText-Regular",
        paddingTop: 10,
        paddingBottom: 10
    },



});
