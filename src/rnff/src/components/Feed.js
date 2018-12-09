// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import { StyleSheet, View, FlatList, SafeAreaView, ActivityIndicator } from "react-native";
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
        isLoadingFeed: false

    };

    componentDidMount() {
        const { feed } = this.props.store; // FeedStore
        console.log('Feed::componentDidMount', feed);

        // 1209
        this.props.store.setAddToFeedFinishedCallback(this.onAddToFeedFinished);
    }
    
    componentWillUnmount() {
        this.isClosed = true;
    }

    @autobind
    onAddToFeedFinished(result) {
        console.log('onAddToFeedFinished', result);
        // ToDo:

        if (!result) {
            // don't call loadFeed() again.
            this.allFeedsLoaded = true;
        }

        !this.isClosed && this.setState({isLoadingFeed: false});
    }

    @autobind
    // eslint-disable-next-line class-methods-use-this
    keyExtractor(item: FeedEntry): string {
        return item.post.id;
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingFeed) return;

        if (this.allFeedsLoaded) return;

        // 1209
        !this.isClosed && this.setState({isLoadingFeed: true});

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

    render(): React.Node {
        const { onScroll, store, navigation, bounce, ListHeaderComponent } = this.props;
        const { feed } = store;
        const loading = feed === undefined;

        // console.log('renderItem.feed', feed); // true -> false


        return (
            <SafeAreaView style={styles.list}>
                <FlatList
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator
                    data={feed}
                    keyExtractor={this.keyExtractor}
                    renderItem={this.renderItem}
                    onEndReachedThreshold={0.5}
                    onEndReached={this.loadMore}
                    ListEmptyComponent={(
                        <View style={styles.post}>
                            {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                        </View>
                    )}

                    // 1209
                    ListFooterComponent={(
                        this.state.isLoadingFeed && (
                        <ActivityIndicator
                            style={styles.bottomIndicator}
                            animating={this.state.isLoadingFeed}
                            size="small"
                            // color='rgba(255, 184, 24, 0.8)'
                            color='rgba(255, 255, 255, 0.8)'
                        />
                        )
                    )}






                    {...{ onScroll, bounce, ListHeaderComponent }}
                />
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    contentContainer: {
        flexGrow: 1,
        // backgroundColor: 'rgb(40, 40, 40)',
        paddingBottom: Theme.spacing.base
    },
    list: {
        flex: 1
    },
    post: {
        paddingHorizontal: Theme.spacing.small
    },
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    }
});
