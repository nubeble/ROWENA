// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import { StyleSheet, View, FlatList, SafeAreaView, ActivityIndicator, Dimensions } from "react-native";
import { observer } from "mobx-react/native";
import { type AnimatedEvent } from "react-native/Libraries/Animated/src/AnimatedEvent";
import FeedStore from "./FeedStore";
import { RefreshIndicator, Post, Theme, FirstPost } from "../components";
import type { FeedEntry } from "../components/Model";
import type { NavigationProps } from "../components/Types";

type FlatListItem<T> = {
    item: T
};

type FeedProps = NavigationProps<> & {
    store: FeedStore,
    onScroll?: AnimatedEvent | () => void,
    bounce?: boolean,
    ListHeaderComponent?: React.Node
};


@observer
export default class Feed extends React.Component<FeedProps> {
    state = {
        isLoadingFeed: false,
        refreshing: false
    };

    componentDidMount() {
        // const { feed } = this.props.store; // FeedStore
        // console.log('Feed.componentDidMount', feed);

        this.props.store.setAddToFeedFinishedCallback(this.onAddToFeedFinished);
    }

    @autobind
    onAddToFeedFinished() {
        // console.log('onAddToFeedFinished', result);
        console.log('onAddToFeedFinished');

        /*
        if (!result) {
            // don't call loadFeed() again.
            this.allFeedsLoaded = true;
        }
        */

        !this.closed && this.setState({ isLoadingFeed: false, refreshing: false });
    }

    componentWillUnmount() {
        this.closed = true;
    }

    @autobind
    // eslint-disable-next-line class-methods-use-this
    keyExtractor(item: FeedEntry): string {
        return item.post.id;
    }

    @autobind
    loadMore() {
        console.log('Feed.loadMore');

        if (this.state.isLoadingFeed) {
            // this.setState({ refreshing: false });
            return;
        }

        if (this.props.store.allFeedsLoaded) {
            console.log('feedStore.allFeedsLoaded');

            this.setState({ refreshing: false });

            return;
        }

        this.setState({ isLoadingFeed: true });

        this.props.store.loadFeed();
    }

    @autobind
    renderItem({ item }: FlatListItem<FeedEntry>): React.Node {
        const { navigation, store } = this.props;
        const { post, profile } = item;

        return (
            <View style={styles.post}>
                <Post {...{ navigation, post, store, profile }} />
            </View>
        );
    }

    _scrollTo(offset) {
        this._flatList.scrollToOffset({ animated: false, offset: offset });
    }

    /*
    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false });
    }
    */

    render(): React.Node {
        const { onScroll, store, navigation, bounce, ListHeaderComponent } = this.props;
        const { feed } = store;
        const loading = feed === undefined;

        // console.log('renderItem.feed', feed); // true -> false


        return (
            <SafeAreaView style={styles.list}>
                <FlatList
                    ref={(fl) => this._flatList = fl}


                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator
                    data={feed}
                    keyExtractor={this.keyExtractor}
                    renderItem={this.renderItem}
                    onEndReachedThreshold={0.5}
                    onEndReached={this.loadMore}
                    ListEmptyComponent={
                        /*
                        <View style={styles.post}>
                            {
                                loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />
                            }
                        </View>
                        */

                        loading ?
                            <View style={{ height: Dimensions.get('window').height, paddingTop: 50 }}>
                                <RefreshIndicator />
                            </View>
                            :
                            <View style={{ paddingVertical: Theme.spacing.small, paddingHorizontal: Theme.spacing.small }}>
                                <FirstPost {...{ navigation }} />
                            </View>
                    }
                    ListFooterComponent={
                        this.state.isLoadingFeed &&
                        <ActivityIndicator
                            style={styles.bottomIndicator}
                            animating={true}
                            size="small"
                            color='grey'
                        />
                    }
                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                    {...{ onScroll, bounce, ListHeaderComponent }}
                />
            </SafeAreaView>
        );
    }

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                // this.loadMore();
                // this.allFeedsLoaded = false;
                this.loadFeedFromTheStart();
            }
        );
    }

    loadFeedFromTheStart() {
        this.props.store.loadFeedFromTheStart();
    }
}

const styles = StyleSheet.create({
    contentContainer: {
        flexGrow: 1,
        // paddingTop: Theme.spacing.tiny,
        paddingBottom: Theme.spacing.tiny
    },
    list: {
        flex: 1
    },
    post: {
        paddingHorizontal: Theme.spacing.small
    },
    bottomIndicator: {
        marginTop: 20,
        // marginTop: Theme.spacing.small + 2, // total size = 20 - 2 (margin of user feed picture)
        marginBottom: 20
    }
});
