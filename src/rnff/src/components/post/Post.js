// @flow
import * as React from "react";
import moment from "moment";
import { StyleSheet, View, Dimensions, Platform, TouchableWithoutFeedback } from "react-native";
import Toast, { DURATION } from 'react-native-easy-toast';
import { AirbnbRating } from '../../../../react-native-ratings/src';
import AntDesign from "react-native-vector-icons/AntDesign";

import FeedStore from "../FeedStore";
import { Theme } from "../Theme";
import SmartImage from "../SmartImage";
import Text from "../Text";
// import Avatar from "../Avatar";
// import LikesAndComments from "./LikesAndComments";
import { Cons, Vars } from "../../../../Globals";
import Util from "../../../../Util";

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
    profile: Profile
};

// 3:2 image
const imageWidth = Dimensions.get("window").width - (Theme.spacing.small * 2);
const imageHeight = imageWidth / 3 * 2;


export default class PostComp extends React.Component<PostProps, PostState> {
    state: $Shape<PostState> = {};

    unsubscribeToPost: () => void;
    unsubscribeToProfile: () => void;

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

        const averageRating = post.averageRating;

        const integer = Math.floor(averageRating);
        // console.log('integer', integer);

        let number = '';
        if (Number.isInteger(averageRating)) {
            number = averageRating + '.0';
        } else {
            number = averageRating.toString();
        }

        // const { likes, comments } = post;
        const contentStyle = [styles.content];
        const nameStyle = [styles.name];
        const textStyle = [styles.text];
        const dateStyle = [];

        if (post.pictures.one.uri) {
            contentStyle.push(StyleSheet.absoluteFill);
            // contentStyle.push({ backgroundColor: "rgba(0, 0, 0, 0.25)", borderRadius: 2 });
            contentStyle.push({ backgroundColor: "transparent", borderRadius: 2 });
            nameStyle.push({ color: "white" });
            textStyle.push({ color: "white" });
            dateStyle.push({ color: "rgba(255, 255, 255, 0.8)" });
        }

        return (
            <TouchableWithoutFeedback onPress={() => navigation.navigate("detail", { post: post, profile: profile, extra: extra })}>
                {/* Consider: use image carousel (one, two, ...) */}
                <View style={styles.container}>
                    <SmartImage
                        style={styles.picture}
                        showSpinner={false}
                        preview={post.pictures.one.preview ? post.pictures.one.preview : "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="}
                        uri={post.pictures.one.uri}
                    />
                    <View style={[{ paddingLeft: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny, justifyContent: 'flex-end' }, StyleSheet.absoluteFill]}>
                        <Text style={styles.feedItemText}>{post.name}</Text>
                        <Text style={styles.feedItemText}>{distance}</Text>
                        {
                            post.reviewCount > 0 ?
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center',
                                        marginLeft: 2,
                                        width: 'auto', height: 'auto', paddingHorizontal: 4, backgroundColor: 'rgba(40, 40, 40, 0.6)', borderRadius: 3
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
                                        <Text style={styles.reviewCount}>{post.reviewCount}</Text>
                                    </View>
                                </View>
                                :
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
                        }
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
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
        paddingLeft: 2,

        textShadowColor: 'black',
        textShadowOffset: { width: -0.3, height: -0.3 },
        textShadowRadius: Platform.OS === 'android' ? 10 : 4
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
