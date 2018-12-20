import * as React from "react";
import autobind from "autobind-decorator";
import moment from "moment";
import { StyleSheet, View, Animated, Platform, Dimensions, StatusBar, FlatList, Image, ActivityIndicator } from "react-native";
import { Header, NavigationActions, StackActions } from 'react-navigation';
import { Constants } from "expo";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import SmartImage from "./rnff/src/components/SmartImage";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Firebase from './Firebase';
import { RefreshIndicator } from "./rnff/src/components";



export default class ReadReviewScreen extends React.Component {
    state = {
        renderReview: false,
    };

    componentDidMount() {
        const { reviewStore } = this.props.navigation.state.params;
        console.log('reviews', reviewStore.reviews);

        // reviewStore.checkForNewEntries(); // do not use here

        /*
        setTimeout(() => {
            !this.isClosed && this.setState({ renderReview: true });
        }, 0);
        */
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    moveToDetail() {
        this.props.screenProps.rootNavigation.navigate('detail');
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        // const { navigation } = this.props;

        const reviews = reviewStore.reviews;

        return (
            <View style={styles.flex}>

                <View style={styles.searchBarStyle}>
                </View>

                {
                    !this.state.renderReview ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            // color='rgba(255, 184, 24, 0.8)'
                            color='rgba(255, 255, 255, 0.8)'
                        />
                        :

                        <FlatList
                            // data={feed} // feedStore.feed
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
                            ListEmptyComponent={(
                                <View style={styles.post}>
                                    {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                                </View>
                            )}
                            ListFooterComponent={(
                                this.state.isLoadingFeed && (
                                <ActivityIndicator
                                    style={styles.bottomIndicator}
                                    animating={this.state.isLoadingFeed}
                                    size="small"
                                    color='rgba(255, 255, 255, 0.8)'
                                />
                                )
                            )}
                            */
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
        /*
        const { navigation, store } = this.props;
        const { post, profile } = item;

        return (
            <View style={styles.post}>
                <Post {...{ navigation, post, store, profile }} />
            </View>
        );
        */
    }

    @autobind
    loadMore() {
        /*
        if (this.state.isLoadingFeed) return;

        if (this.allFeedsLoaded) return;

        !this.isClosed && this.setState({isLoadingFeed: true});

        this.props.store.loadFeed();
        */
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

        backgroundColor: 'yellow'
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.base
    },
    list: {
        flex: 1
    },
    post: {
        paddingHorizontal: Theme.spacing.small
    },
    bottomIndicator: {
        // marginTop: 20,
        marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
    },





    header: {
        backgroundColor: "white",
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 8,
        zIndex: 10000
    },
    innerHeader: {
        marginHorizontal: Theme.spacing.base,
        marginVertical: Theme.spacing.tiny,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    newPosts: {
        position: "absolute",
        top: 0
    },


    
    wrapper: {
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    item: {
        // flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width / 21 * 9
    },

    titleContainer: {
        padding: Theme.spacing.small
    },
    title: {
        color: 'white',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },

    // loading indicator
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },


    // test: advertising area
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        padding: Theme.spacing.small,
        flex: 1
    }



});
