import React from 'react';
import {
    StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated, Dimensions,
    FlatList, ScrollView, TouchableWithoutFeedback, Alert, Image, Keyboard, KeyboardAvoidingView, TextInput
} from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, ImagePicker, Linking, MapView } from "expo";
// import ImagePicker from 'react-native-image-picker'; // ToDo: consider
import Ionicons from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import * as firebase from 'firebase';
import Firebase from "./Firebase";
// import { StyleGuide } from "./rne/src/components/theme";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import moment from 'moment';
// import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Util from "./Util";
import Swiper from './Swiper';
import { Rating, AirbnbRating } from './react-native-ratings/src';
import autobind from "autobind-decorator";
import ReviewStore from "./ReviewStore";
import ReadMore from "./ReadMore";
import { observer } from "mobx-react/native";


const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew you were there";


@observer
export default class Detail extends React.Component {
    reviewStore: ReviewStore = new ReviewStore();

    state = {
        showIndicator: false,
        rating: 0,
        isNavigating: false,
        renderReview: false,
        isOwner: false,
        showKeyboard: false,
        bottomLocation: Dimensions.get('window').height
    };

    onGoBack(result) { // back from rating
        console.log('Detail::onGoBack', result);

        this.setState({ isNavigating: false });

        this.setState({ rating: 0 });
        this.refs.rating.setPosition(0); // bug in AirbnbRating

        // reload reviews
        if (result) {
            const { post, profile } = this.props.navigation.state.params;
            const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
            this.reviewStore.init(query);
        }
    }

    // async componentDidMount(): Promise<void> { // ToDo
    componentDidMount() {
        console.log('Detail::componentDidMount');

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

        const { post, profile } = this.props.navigation.state.params;

        const isOwner = this.isOwner(post.uid, Firebase.auth.currentUser.uid);
        this.setState({isOwner});

        const query = Firebase.firestore.collection("place").doc(post.placeId).collection("feed").doc(post.id).collection("reviews").orderBy("timestamp", "desc");
        this.reviewStore.init(query);

        setTimeout(() => {
            !this.isClosed && this.setState({ renderReview: true });
        }, 0);
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        this.isClosed = true;
    }

    isOwner(postUid, uid) {
        if (postUid === uid) {
            return true;
        } else {
            return false;
        }
    }

    render() {
        const { post, profile } = this.props.navigation.state.params;


        return (
            <View style={styles.flex}>
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

                {
                    !this.state.renderReview ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            color='grey'
                        />
                        :
                        <FlatList
                            ref={(fl) => this._flatList = fl}
                            // ref='list'
                            contentContainerStyle={styles.container}
                            showsVerticalScrollIndicator={true}
                            ListHeaderComponent={(
                                <Animated.View
                                // style={{ backgroundColor: 'black' }}
                                >
                                    {/* profile pictures */}
                                    {this.renderSwiper(post)}

                                    <View style={styles.infoContainer}>
                                        {/*
                                        <Text style={styles.date}>posted {moment(post.timestamp).fromNow()}</Text>
                                        */}

                                        <TouchableWithoutFeedback onPress={this.profile}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <View style={styles.circle}></View>
                                                <Text style={styles.date}>Activate {moment(post.timestamp).fromNow()}</Text>
                                            </View>
                                        </TouchableWithoutFeedback>




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

                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
                                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                                <AirbnbRating
                                                    count={5}
                                                    readOnly={true}
                                                    showRating={false}
                                                    defaultRating={4}
                                                    size={16}
                                                    margin={1}
                                                />
                                            </View>

                                            {/* ToDo: draw stars based on averge rating & get review count
                                            {post.averageRating}
                                            */}
                                            <Text style={styles.rating}>4.4</Text>

                                            <AntDesign style={{ marginLeft: 12, marginTop: 1 }} name='message1' color="white" size={16} />
                                            <Text style={styles.reviewCount}>12</Text>
                                        </View>

                                        {/*
                                        <Text style={styles.note}>{tmp}</Text>
                                        */}
                                        <Text style={styles.note}>{post.note}</Text>


                                        <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                        {/* map */}
                                        <TouchableOpacity activeOpacity={0.5}
                                            /*
                                            onPress={() => {
                                                this.props.navigation.navigate("map", { post: post, profile: profile, onGoBack: () => this.onGoBack() });
                                            }}
                                            */
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

                                        <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />

                                        <View style={styles.reviewsContainer}>
                                            {/* show review chart */}
                                            <Image
                                                style={{ width: '100%', height: 140, marginBottom: 10 }}
                                                resizeMode={'cover'}
                                                source={require('../assets/sample1.jpg')}
                                            />

                                            {this.renderReviews(this.reviewStore.reviews)}
                                        </View>

                                        <Text style={styles.ratingText}>Share your experience to help others</Text>
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

                                        <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.small, marginBottom: Theme.spacing.small }} />
                                    </View>

                                    {/* contact button */}
                                    <TouchableOpacity onPress={() => this.contact()} style={[styles.signUpButton, { marginBottom: 10 }]} >
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>Contact</Text>
                                    </TouchableOpacity>

                                </Animated.View>
                            )}

                            ListFooterComponent={
                                this.state.isNavigating && (
                                    <View style={{ width: '100%', height: 100 }} // 100: (enough) height of tab bar
                                    />
                                )
                            }
                        // scrollEventThrottle={1}
                        // columnWrapperStyle={undefined}
                        // {...{ data, keyExtractor, renderItem, onScroll, numColumns, inverted }}
                        // {...{ onScroll }}
                        />
                }

                {
                    this.state.showKeyboard && (
                        <KeyboardAvoidingView style={{ position: 'absolute', top: this.state.bottomLocation - 10 - 50, justifyContent: 'center', alignItems: 'center', height: 50, width: '100%',
                            backgroundColor: 'red'
                         }}>

                            <TextInput
                                // autoFocus
                                // ref='reply'
                                ref={(c) => {this._reply = c;}}
                                // multiline={true}
                                // numberOfLines={4}
                                style={{
                                    // padding: 12, // not working in ios
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    paddingLeft: 12,
                                    paddingRight: 12,

                                    borderRadius: 5,
                                    width: '100%',
                                    height: Dimensions.get('window').height / 5,
                                    fontSize: 16, fontFamily: "SFProText-Regular",
                                    color: "white", textAlign: 'justify', textAlignVertical: 'top', backgroundColor: '#212121'
                                }}
                                placeholder='Share details of your own experience'
                                placeholderTextColor='rgb(160, 160, 160)'
                                underlineColorAndroid="transparent"
                                autoCorrect={false}
                                keyboardAppearance={'dark'} // Todo: what about android??
                                // onChangeText={(text) => this.onChangeText(text)}
                            />

                        </KeyboardAvoidingView>
                    )
                }
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

    renderReviews(reviews) { // draw items up to 4
        const reviewArray = [];

        if (reviews === undefined) {
            console.log('reviews is undefined');
            reviewArray.push(
                <ActivityIndicator
                    key={'indicator'}
                    style={{
                        /*
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0
                        */
                       marginTop:20,
                       marginBottom:20,
                    }}
                    animating={true}
                    size="large"
                    color='grey'
                />
            );
        } else {
            console.log('reviews length', reviews.length);

            for (var i = 0; i < reviews.length; i++) {
                if (i > 3) break;

                const review = reviews[i];

                const _profile = review.profile;
                const _review = review.review;

                reviewArray.push(
                    <View key={_review.id}>
                        {/* ToDo: add profile image */}

                        <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.xSmall, paddingBottom: Theme.spacing.xSmall }}>
                            <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>
                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: Theme.spacing.xSmall }}>
                            {/* ToDo: draw stars based on averge rating & get review count */}
                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                <AirbnbRating
                                    count={5}
                                    readOnly={true}
                                    showRating={false}
                                    defaultRating={4}
                                    size={12}
                                    margin={1}
                                />
                            </View>
                            <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                        </View>



                        {/*
                        <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                <AirbnbRating
                                    count={5}
                                    readOnly={true}
                                    showRating={false}
                                    defaultRating={4}
                                    size={12}
                                    margin={1}
                                />
                            </View>
                            <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>

                            <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                        </View>
                        */}

                        <View style={{ paddingTop: Theme.spacing.xSmall, paddingBottom: Theme.spacing.xSmall }}>
                            <ReadMore
                                numberOfLines={2}
                            // onReady={() => this.readingCompleted()}
                            >
                                {/*
                                <Text style={styles.reviewText}>{tmp}</Text>
                                */}                                
                                <Text style={styles.reviewText}>{_review.comment}</Text>
                            </ReadMore>
                        </View>

                        {
                            this.state.isOwner && (
                                <TouchableOpacity
                                    onPress={() => this.showKeyboard()}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {/*
                                        <MaterialIcons name='reply' color="silver" size={16} />
                                        */}
                                        <Text style={{marginLeft: 4, fontSize: 14, fontFamily: "SFProText-Light", color: "silver"}}>Reply</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }

                        <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
                    </View>
                );
            } // end of for
        }


        return (
            <View style={styles.reviewContainer}>
                {reviewArray}

                {/* Read all ??? reviews button */}
                <TouchableOpacity
                    onPress={() => {
                        this.props.navigation.navigate("readReview", { reviewStore: this.reviewStore, isOwner: this.state.isOwner });
                    }}
                >
                    <View style={{
                        width: '100%', height: Dimensions.get('window').height / 14,
                        justifyContent: 'center',
                        // alignItems: 'center',
                        // backgroundColor: 'blue',
                        // borderTopWidth: 1,
                        // borderBottomWidth: 1,
                        // borderColor: 'rgb(34, 34, 34)'
                    }}>
                        <Text style={{ fontSize: 16, color: '#f1c40f', fontFamily: "SFProText-Regular" }}>Read all ??? reviews</Text>
                        <FontAwesome name='chevron-right' color="#f1c40f" size={16} style={{ position: 'absolute', right: 12 }} />

                    </View>
                </TouchableOpacity>

                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.tiny, marginBottom: Theme.spacing.tiny }} />
            </View>
        );

    }

    @autobind
    ratingCompleted(rating) {
        // console.log("Rating is: " + rating);

        const { post, profile } = this.props.navigation.state.params;

        this.setState({ isNavigating: true });

        setTimeout(() => {
            this.props.navigation.navigate("writeReview", { post: post, profile: profile, rating: rating, onGoBack: (result) => this.onGoBack(result) });
        }, 500); // 0.5 sec
    }

    readingCompleted() {
        console.log("reading done");
        // this.setState({showReviews: true});
    }

    contact() {
        // ToDo
    }

    @autobind
    _keyboardDidShow(e) {
        this.setState({ bottomLocation: Dimensions.get('window').height - e.endCoordinates.height });
    }

    @autobind
    _keyboardDidHide() {
        this.setState({ bottomLocation: Dimensions.get('window').height });
    }

    showKeyboard() {
        // this.setState({showKeyboard: true});
        this.setState({showKeyboard: true}, () => this._reply.focus());

        // console.log('this', this);
        //console.log('this');


        /*
        let that = this;
        this.setState({showKeyboard: true}, () => that.refs.reply.focus());
        */

        //this.refs['reply'].focus();
        // this._input.focus();
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
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },
    replyButton: {
        width: '85%',
        height: 45,
        alignSelf: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
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
    circle: {
        width: 10,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: 'rgb(70, 154, 32)'
    },
    date: {
        marginLeft: 4,
        fontSize: 14,
        fontFamily: "SFProText-Light",
        color: "grey"
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
        color: 'silver',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "SFProText-Regular",
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    mapContainer: {
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    map: {
        width: '100%',
        height: (Dimensions.get('window').width - Theme.spacing.small * 2) / 5 * 3
    },
    ratingText: {
        color: 'grey',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 16,
        fontFamily: "SFProText-Regular",
        paddingTop: 10,
        paddingBottom: 10
    },
    reviewsContainer: {
        width: '100%',
        // height: 500,
        paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny,
        // backgroundColor: 'red'
    },
    sample: {
        width: '100%',
        height: '100%'
    },
    reviewContainer: {
        marginHorizontal: 10,
        padding: 10,
        // borderRadius: 3,
        // borderColor: 'rgba(0,0,0,0.1)',
        // borderWidth: 1,
        // backgroundColor: 'yellow',
    },
    reviewText: {
        // color: 'rgba(255, 255, 255, 0.8)',
        color: 'silver',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: "SFProText-Regular"
    },
    /*
    reviewName: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
    },
    reviewDate: {
        // backgroundColor: 'red',
        marginLeft: 20,
        color: 'grey',
        fontSize: 14,
        lineHeight: 15,
        // lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },
    */
    reviewName: {
        color: 'white',
        fontSize: 14,
        fontFamily: "SFProText-Semibold",
    },
    reviewDate: {
        color: 'grey',
        fontSize: 14,
        fontFamily: "SFProText-Light",

        marginLeft: 'auto'
    },
    reviewRating: {
        // backgroundColor: 'red',
        // marginLeft: 4,
        // marginTop: 0,
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 14,
        lineHeight: 15,
        // lineHeight: 20,
        fontFamily: "SFProText-Regular"
    }
});


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

