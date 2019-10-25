// @flow
import * as React from "react";
import moment from "moment";
import { StyleSheet, View, Dimensions, Platform, TouchableWithoutFeedback } from "react-native";
import Toast, { DURATION } from 'react-native-easy-toast';
import Dialog from "react-native-dialog";
import { AirbnbRating } from '../../../../react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import FeedStore from "../FeedStore";
import { Theme } from "../Theme";
import SmartImage from "../SmartImage";
import Text from "../Text";
// import Avatar from "../Avatar";
// import LikesAndComments from "./LikesAndComments";
import { Cons, Vars } from "../../../../Globals";
import Util from "../../../../Util";
import Firebase from '../../../../Firebase';

import type { Post, Profile } from "../Model";
import type { NavigationProps } from "../Types";

type PostProps = NavigationProps<> & {
    post: Post,
    profile: Profile,
    store: FeedStore,
    extra: Object
};

type PostState = {
    post: Post,
    profile: Profile,

    dialogVisible: false,
    dialogTitle: '',
    dialogMessage: ''
};

// 3:2 image
const imageWidth = Dimensions.get("window").width - (Theme.spacing.small * 2);
const imageHeight = imageWidth / 3 * 2;


export default class PostComp extends React.Component<PostProps, PostState> {
    state: $Shape<PostState> = {};

    /*
    unsubscribeToPost: () => void;
    unsubscribeToProfile: () => void;
    */

    static getDerivedStateFromProps({ profile, post }: PostProps): PostState {
        return { post, profile };
    }

    componentDidMount() {
        const { post, store } = this.props;

        if (post.pictures.one.uri) {
            this.thumbnailImage = post.pictures.one.uri;
        }

        /*
        this.unsubscribeToPost = store.subscribeToPost(post.placeId, post.id, newPost => this.setState({ post: newPost }));
        this.unsubscribeToProfile = store.subscribeToProfile(post.uid, newProfile => this.setState({ profile: newProfile }));
        */
    }

    componentWillUnmount() {
        /*
        this.unsubscribeToPost();
        this.unsubscribeToProfile();
        */

        if (this.thumbnailImage) this.thumbnailImage = null;

        this.closed = true;
    }

    render(): React.Node {
        const { navigation, extra } = this.props;
        const { post, profile } = this.state;

        if (!post) { // removed
            return (
                <TouchableWithoutFeedback onPress={() => {
                    // toast
                    this.refs["toast"].show('The post has been removed by its owner.', 500);
                }}>
                    <View style={styles.container}>
                        <SmartImage
                            style={styles.picture}
                            showSpinner={false}
                            preview={"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={this.thumbnailImage}
                        />
                        <Toast
                            ref="toast"
                            position='top'
                            positionValue={imageHeight / 2 - 20}
                            opacity={0.6}
                        />
                    </View>
                </TouchableWithoutFeedback>
            );
        }

        if (!post.reporters || post.reporters.length === 0 || post.reporters.indexOf(Firebase.user().uid) === -1) {
            /*
            let placeName = post.placeName;
            const words = placeName.split(', ');
            if (words.length > 2) {
                const city = words[0];
                const country = words[words.length - 1];
                placeName = city + ', ' + country;
            }
            */

            const distance = Util.getDistance(post.location, Vars.location);
            // const distance = Math.round(Math.random() * 100) % 20 + ' km away'; // Test

            return (
                <TouchableWithoutFeedback
                    onPress={() => {
                        Firebase.addVisits(Firebase.user().uid, post.placeId, post.id);
                        navigation.navigate("detail", { post: post, profile: profile, extra: extra });
                    }}
                >
                    {/* // ToDo: impl image carousel */}
                    <View style={styles.container}>
                        <SmartImage
                            style={styles.picture}
                            showSpinner={false}
                            preview={post.pictures.one.preview ? post.pictures.one.preview : "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                            uri={post.pictures.one.uri}
                        />

                        <LinearGradient
                            colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                            start={[0, 0]}
                            end={[0, 1]}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                            <Text style={styles.feedItemText}>{post.name}</Text>
                            <Text style={styles.feedItemText}>{distance}</Text>
                            {
                                this.renderReview(post)
                            }
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            );
        } else {
            const distance = Util.getDistance(post.location, Vars.location);

            return (
                <View>
                    <TouchableWithoutFeedback
                        onPress={() => {
                            this.openDialog('Unblock Post', 'Are you sure you want to unblock ' + post.name + '?', async () => {
                                // unblock

                                // 1. update database (reporters)
                                const uid = Firebase.user().uid;
                                const placeId = post.placeId;
                                const feedId = post.id;

                                const result = await Firebase.unblockPost(uid, placeId, feedId);
                                if (!result) {
                                    // the post is removed
                                    this.refs["toast"].show('The post has been removed by its owner.', 500);
                                    return;
                                }

                                // 2. update state post
                                let _post = post;
                                const index = _post.reporters.indexOf(uid);
                                _post.reporters.splice(index, 1);
                                this.setState({ post: _post });

                                // 3. update feedStore
                                const { store } = this.props;
                                store.updateFeed(_post);
                            });
                        }}
                    >
                        {/* // ToDo: impl image carousel */}
                        <View style={styles.container}>
                            <SmartImage
                                style={styles.picture}
                                showSpinner={false}
                                preview={post.pictures.one.preview ? post.pictures.one.preview : "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                                uri={post.pictures.one.uri}
                            />

                            <LinearGradient
                                colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                                start={[0, 0]}
                                end={[0, 1]}
                                style={StyleSheet.absoluteFill}
                            />

                            <View style={[{ paddingHorizontal: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                                <Text style={styles.feedItemText}>{post.name}</Text>
                                <Text style={styles.feedItemText}>{distance}</Text>
                                {
                                    this.renderReview(post)
                                }
                            </View>

                            <View style={[StyleSheet.absoluteFill, {
                                borderRadius: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                paddingHorizontal: Theme.spacing.tiny, alignItems: 'center', justifyContent: 'center'
                            }]}>
                                <AntDesign style={{ marginTop: -8, marginBottom: 12 }} name='checkcircleo' color="#228B22" size={36} />
                                <Text style={{
                                    color: Theme.color.text1,
                                    fontSize: 14,
                                    fontFamily: "Roboto-Light",
                                    paddingHorizontal: 10,
                                    textAlign: 'center',
                                    marginBottom: 8
                                }}>{'Thanks for letting us know.'}</Text>
                                <Text style={{
                                    color: Theme.color.text3,
                                    fontSize: 14,
                                    fontFamily: "Roboto-Light",
                                    paddingHorizontal: 10,
                                    textAlign: 'center'
                                }}>{'Your feedback improves the quality of contents on Rowena.'}</Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    <Dialog.Container visible={this.state.dialogVisible}>
                        <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                        <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                        <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                        <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                    </Dialog.Container>
                </View>
            );
        }
    }

    renderReview(post) {
        // defaultRating, averageRating
        const averageRating = post.averageRating;

        const integer = Math.floor(averageRating);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        /*
        let likesCount = 0;
        if (post.likes) {
            likesCount = post.likes.length;
        }
        */
        const visitCount = Util.getVisitCount(post.visits);

        if (post.reviewCount > 0) {
            if (Platform.OS === 'android') {
                // ratings & reviews
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginLeft: 2,
                            width: 'auto', height: 'auto', borderRadius: 3, // paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)'
                        }}>
                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                <AirbnbRating
                                    count={5}
                                    readOnly={true}
                                    showRating={false}
                                    defaultRating={integer}
                                    size={12}
                                    margin={1}
                                />
                            </View>
                            <Text style={styles.rating}>{number}</Text>
                            <AntDesign style={{ marginLeft: 10, marginTop: 1 }} name='message1' color={Theme.color.title} size={12} />
                            <Text style={styles.reviewCount}>{Util.numberWithCommas(post.reviewCount)}</Text>
                        </View>
                    </View>
                );
            } else { // ios
                // likes & reviews
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginLeft: 2,
                            width: 'auto', height: 'auto', borderRadius: 3, // paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)'
                        }}>
                            {/*
                            <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                                <AirbnbRating
                                    count={5}
                                    readOnly={true}
                                    showRating={false}
                                    defaultRating={integer}
                                    size={12}
                                    margin={1}
                                />
                            </View>
                            <Text style={styles.rating}>{number}</Text>
                            */}
                            {/*
                            <Ionicons style={{ marginTop: 2 }} name="md-heart-empty" color={'red'} size={15} />
                            <Text style={[styles.rating, { color: Theme.color.title }]}>{likesCount}</Text>
                            */}
                            <Ionicons style={{ marginTop: 2 }} name="md-eye" color={'#4c9a2a'} size={15} />
                            <Text style={[styles.rating, { color: Theme.color.title }]}>{visitCount}</Text>

                            <AntDesign style={{ marginLeft: 10, marginTop: 1 }} name='message1' color={'#f1c40f'} size={12} />
                            <Text style={styles.reviewCount}>{Util.numberWithCommas(post.reviewCount)}</Text>
                        </View>
                    </View>
                );
            }
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                <View style={{
                    marginLeft: 2,
                    width: 36, height: 21, borderRadius: 3,
                    backgroundColor: Theme.color.new,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={styles.new}>new</Text>
                </View>
            </View>
        );
    }

    openDialog(title, message, callback) {
        this.setState({ dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
    }
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 2,

        /*
        shadowColor: "black",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
        */
        /*
        borderColor: Theme.palette.borderColor,
        borderWidth: Platform.OS === "ios" ? 0 : 1,
        */
        // borderColor: 'transparent',
        marginVertical: Theme.spacing.small,
        backgroundColor: "black"
    },
    content: {
        padding: Theme.spacing.small
    },
    header: {
        flexDirection: "row",
        marginBottom: Theme.spacing.small
    },
    metadata: {
        marginLeft: Theme.spacing.small
    },
    name: {
        color: "black"
    },
    text: {
        flexWrap: "wrap"
    },
    picture: {
        // height: width / 16 * 9,

        // width: imageWidth,
        height: imageHeight,

        borderRadius: 2
        // borderColor: "transparent",
        // borderWidth: 0
    },
    feedItemText: {
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        paddingHorizontal: 2,
        /*
        textShadowColor: 'black',
        textShadowOffset: { width: -0.3, height: -0.3 },
        textShadowRadius: Platform.OS === 'android' ? 10 : 4
        */
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    rating: {
        marginLeft: 5,
        color: '#f1c40f',
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    reviewCount: {
        marginLeft: 5,
        color: Theme.color.title,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        // paddingTop: Cons.ratingTextPaddingTop()
    },
    new: {
        color: 'white',
        fontSize: 13,
        lineHeight: 13,
        fontFamily: "Roboto-Bold",
        // backgroundColor: 'grey'
    }
});
