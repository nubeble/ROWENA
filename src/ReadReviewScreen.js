import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import { StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants } from "expo";
import { Text, Theme, Avatar } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import Firebase from './Firebase';
import { RefreshIndicator, FirstPost } from "./rnff/src/components";
import { AirbnbRating } from './react-native-ratings/src';
// import ReadMore from "./ReadMore";
import Ionicons from "react-native-vector-icons/Ionicons";

const tmp = "Woke up to the sound of pouring rain\nThe wind would whisper and I'd think of you\nAnd all the tears you cried, that called my name\nAnd when you needed me I came through\nI paint a picture of the days gone by\nWhen love went blind and you would make me see\nI'd stare a lifetime into your eyes\nSo that I knew that you were there for me\nTime after time you there for me\nRemember yesterday, walking hand in hand\nLove letters in the sand, I remember you\nThrough the sleepless nights through every endless day\nI'd want to hear you say, I remember you";


export default class ReadReviewScreen extends React.Component {
    state = {
        renderReview: false,
        isLoadingReview: false,

        reviewLength: 0,
        isOwner: false
    };

    componentDidMount() {
        const { reviewStore, isOwner } = this.props.navigation.state.params;
        // console.log('reviews', reviewStore.reviews);

        this.setState({isOwner});

        // reviewStore.checkForNewEntries(); // do not use here!

        reviewStore.setAddToReviewFinishedCallback(this.onAddToReviewFinished);

        setTimeout(() => {
            !this.isClosed && this.setState({ renderReview: true });
        }, 0);
    }

    @autobind
    onAddToReviewFinished(result) {
        console.log('onAddToReviewFinished', result);

        if (!result) {
            this.allReviewsLoaded = true; // don't call loadReview() again!
        }

        !this.isClosed && this.setState({ isLoadingReview: false });
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    moveToDetail() {
        this.props.screenProps.rootNavigation.navigate('detail');
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        const { navigation } = this.props;

        // const reviews = reviewStore.reviews;
        const { reviews } = reviewStore;

        const loading = reviews === undefined;

        return (
            <View style={styles.flex}>

                <View style={styles.searchBarStyle}>
                    <TouchableOpacity
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
                            data={reviews}
                            keyExtractor={this.keyExtractor}
                            renderItem={this.renderItem}
                            onEndReachedThreshold={0.5}
                            onEndReached={this.loadMore}

                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator
                            /*
                            ListHeaderComponent={(
                                <View>
                                </View>
                            )}
                            */
                            ListEmptyComponent={(
                                <View style={{ paddingHorizontal: Theme.spacing.small }}>
                                    {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                                </View>
                            )}
                            ListFooterComponent={(
                                this.state.isLoadingReview && (
                                    <ActivityIndicator
                                        style={styles.bottomIndicator}
                                        animating={this.state.isLoadingReview}
                                        size="small"
                                        color='grey'
                                    />
                                )
                            )}
                        />
                }
            </View >
        );
    } // end of render()

    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item }: FlatListItem<ReviewEntry>): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        return (

            <View>
                {/* ToDo: add profile image */}

                <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
                    <Text style={styles.reviewName}>{_profile.name ? _profile.name : 'Max Power'}</Text>
                    <Text style={styles.reviewDate}>{moment(_review.timestamp).fromNow()}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: Theme.spacing.tiny }}>
                    {/* ToDo: draw stars based on averge rating & get review count */}
                    <View style={{ width: 'auto', alignItems: 'flex-start' }}>
                        <AirbnbRating
                            count={5}
                            readOnly={true}
                            showRating={false}
                            defaultRating={4}
                            size={14}
                            margin={1}
                        />
                    </View>
                    <Text style={styles.reviewRating}>{_review.rating + '.0'}</Text>
                </View>

                <View style={{ paddingTop: Theme.spacing.tiny, paddingBottom: Theme.spacing.tiny }}>
                    {/*
                    <Text style={styles.reviewText}>{tmp}</Text>
                    */}
                    <Text style={styles.reviewText}>{_review.comment}</Text>
                </View>

                {
                    this.state.isOwner && (
                        <TouchableOpacity
                            // onPress={this.profile}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {/*
                                <MaterialIcons name='reply' color="silver" size={16} />
                                */}
                                <Text style={{marginLeft: 4, fontSize: 15, fontFamily: "SFProText-Light", color: "silver"}}>Reply</Text>
                            </View>
                        </TouchableOpacity>
                    )
                }

                <View style={{ borderBottomColor: 'rgb(34, 34, 34)', borderBottomWidth: 1, width: '100%', marginTop: Theme.spacing.base, marginBottom: Theme.spacing.base }} />
            </View>

        );
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingReview) return;

        if (this.allReviewsLoaded) return;

        !this.isClosed && this.setState({ isLoadingReview: true });

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReview();
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: 'red'
    },
    contentContainer: {
        flexGrow: 1,
        // paddingBottom: Theme.spacing.base

        // flex: 1,
        // padding: Theme.spacing.small,
        // paddingTop: Theme.spacing.tiny,

        // paddingTop: Theme.spacing.small,
        // paddingBottom: Theme.spacing.small,
        paddingLeft: Theme.spacing.base,
        paddingRight: Theme.spacing.base
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
        color: 'silver',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "SFProText-Regular"
    },
    reviewName: {
        color: 'white',
        fontSize: 15,
        fontFamily: "SFProText-Semibold",
        // paddingBottom: Theme.spacing.tiny
        // backgroundColor: 'red',

        // alignSelf: 'flex-start'
    },
    reviewDate: {
        // backgroundColor: 'red',
        // marginLeft: 27,
        color: 'grey',
        fontSize: 15,
        fontFamily: "SFProText-Light",

        marginLeft: 'auto'
    },
    reviewRating: {
        // backgroundColor: 'red',
        // marginLeft: 4,
        // marginTop: 0,
        marginLeft: 4,
        color: '#f1c40f',
        fontSize: 15,
        lineHeight: 17,
        // lineHeight: 20,
        fontFamily: "SFProText-Regular"
    },

    bottomIndicator: {
        // marginTop: 20,
        marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
    },
    // loading indicator
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    }
});
