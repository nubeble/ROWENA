// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import { StyleSheet, View, FlatList, SafeAreaView, TouchableOpacity, Image, Dimensions } from "react-native";
import { observer } from "mobx-react/native";
import { type AnimatedEvent } from "react-native/Libraries/Animated/src/AnimatedEvent";
import FeedStore from "./FeedStore";
import { RefreshIndicator, Post, Text, Theme, FirstPost } from "../components";
import PreloadImage from '../../../PreloadImage';
import type { FeedEntry } from "../components/Model";
import type { NavigationProps } from "../components/Types";
import { Cons, Vars } from "../../../Globals";

type FlatListItem<T> = {
    item: T
};

type FeedProps = NavigationProps<> & {
    store: FeedStore,
    extra: Object,
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

    constructor(props) {
        super(props);

        this.onLoading = false;
    }

    componentDidMount() {
        // const { feed } = this.props.store; // FeedStore
        // console.log('Feed.componentDidMount', feed);

        this.props.store.setAddToFeedFinishedCallback(this.onAddToFeedFinished);
    }

    @autobind
    onAddToFeedFinished() {
        console.log('Feed.onAddToFeedFinished');

        !this.closed && this.setState({ isLoadingFeed: false, refreshing: false });

        this.onLoading = false;
    }

    componentWillUnmount() {
        this.closed = true;
    }

    @autobind
    // eslint-disable-next-line class-methods-use-this
    keyExtractor(item: FeedEntry): string {
        return item.post.id;
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 80;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    };

    @autobind
    loadMore() {
        if (this.onLoading) return;

        this.onLoading = true;

        if (this.props.store.allFeedsLoaded) {
            if (this.state.refreshing) this.setState({ refreshing: false });

            this.onLoading = false;
            return;
        }

        this.setState({ isLoadingFeed: true });

        console.log('Feed.loadMore');

        this.props.store.loadFeed();
    }

    @autobind
    renderItem({ item }: FlatListItem<FeedEntry>): React.Node {
        const { navigation, store, extra } = this.props;
        const { post, profile } = item;

        return (
            <View style={styles.post}>
                <Post {...{ navigation, post, store, extra, profile }} />
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

        return (
            <SafeAreaView style={styles.list}>
                <FlatList
                    ref={(fl) => this._flatList = fl}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator
                    data={feed}
                    keyExtractor={this.keyExtractor}
                    renderItem={this.renderItem}
                    // onEndReachedThreshold={0.5}
                    // onEndReached={this.loadMore}
                    onScroll={({ nativeEvent }) => {
                        if (this.isCloseToBottom(nativeEvent)) {
                            this.loadMore();
                        }

                        this.props._onScroll(nativeEvent);
                    }}

                    ListFooterComponent={
                        this.state.isLoadingFeed &&
                        <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator />
                        </View>
                    }

                    ListEmptyComponent={
                        loading ?
                            <View style={{ height: Dimensions.get('window').height, paddingTop: 50 }}>
                                <RefreshIndicator />
                            </View>
                            :
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{
                                    color: Theme.color.text2,
                                    fontSize: 24,
                                    paddingTop: 4,
                                    fontFamily: "Roboto-Medium"
                                }}>No registered girls yet</Text>

                                <Text style={{
                                    marginTop: 10,
                                    color: Theme.color.text3,
                                    fontSize: 18,
                                    fontFamily: "Roboto-Medium"
                                }}>Start exploring girls for your next trip</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTimeout(() => {
                                            this.props.navigation.navigate("intro");
                                        }, Cons.buttonTimeoutShort);
                                    }}
                                    style={{ marginTop: 10 }}>

                                    <Image
                                        style={{
                                            width: 180,
                                            height: 180,
                                            resizeMode: 'cover'
                                        }}
                                        source={PreloadImage.feed}
                                    />
                                </TouchableOpacity>
                            </View>
                    }

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                    // {...{ onScroll, bounce, ListHeaderComponent }}
                    {...{ bounce, ListHeaderComponent }}
                />
            </SafeAreaView>
        );
    }

    handleRefresh = () => {
        if (this.onLoading) return;

        this.setState(
            {
                refreshing: true
            },
            () => {
                // reload from the start
                this.props.store.loadFeedFromTheStart();
            }
        );
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
