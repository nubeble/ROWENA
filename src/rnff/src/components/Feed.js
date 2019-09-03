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
import * as Svg from 'react-native-svg';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';

type FeedProps = NavigationProps<> & {
    store: FeedStore,
    extra: Object,
    onScroll?: AnimatedEvent | () => void,
    bounce?: boolean,
    ListHeaderComponent?: React.Node
};


@observer
export default class Feed extends React.Component<FeedProps> {
    // static __flatList = null;

    state = {
        isLoadingFeeds: false,
        refreshing: false
    };

    /*
    scrollToTop() {
        Feed.__flatList.scrollToOffset({ offset: 0, animated: true });
    }
    */

    componentDidMount() {
        this.props.navigation.setParams({
            scrollToTop: () => {
                this._flatList.scrollToOffset({ offset: 0, animated: true });
            }
        });

        // const { feed } = this.props.store; // FeedStore
        // console.log('jdub', 'Feed.componentDidMount', feed);

        this.props.store.setAddToFeedFinishedCallback(this.onAddToFeedFinished);
    }

    @autobind
    onAddToFeedFinished() {
        console.log('jdub', 'Feed.onAddToFeedFinished');

        !this.closed && this.setState({ isLoadingFeeds: false, refreshing: false });

        !this.closed && this.enableScroll();
    }

    componentWillUnmount() {
        this.props.store.unsetAddToFeedFinishedCallback(this.onAddToFeedFinished);

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

    // @autobind
    loadMore() {
        if (this.state.isLoadingFeeds) return;

        if (this.props.store.allFeedsLoaded) return;

        this.setState({ isLoadingFeeds: true });

        // console.log('jdub', 'Feed.loadMore');

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

    enableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: true, showsVerticalScrollIndicator: true });
    }

    disableScroll() {
        this._flatList.setNativeProps({ scrollEnabled: false, showsVerticalScrollIndicator: false });
    }

    _scrollTo(offset) {
        this._flatList.scrollToOffset({ offset: offset, animated: false });
    }

    render(): React.Node {
        const { onScroll, store, navigation, bounce, ListHeaderComponent } = this.props;
        const { feed } = store;
        // const loading = feed === undefined;

        return (
            <SafeAreaView style={{ flex: 1 }}>
                <FlatList
                    ref={(fl) => {
                        this._flatList = fl;
                        // Feed.__flatList = fl;
                    }}
                    contentContainerStyle={styles.contentContainer}
                    // showsVerticalScrollIndicator
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
                        this.state.isLoadingFeeds &&
                        <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                        </View>
                    }

                    ListEmptyComponent={this.renderListEmptyComponent}

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                    // {...{ onScroll, bounce, ListHeaderComponent }}
                    {...{ bounce, ListHeaderComponent }}
                />
            </SafeAreaView>
        );
    }

    @autobind
    renderListEmptyComponent() {
        const { store } = this.props;
        const { feed } = store;
        const loading = feed === undefined;

        if (loading) {
            /*
            return (
                <View style={{ height: Dimensions.get('window').height, paddingTop: Dimensions.get('window').height / 12 }}>
                    <RefreshIndicator refreshing total={3} size={5} color={Theme.color.selection} />
                </View>
            );
            */

            // render skeleton
            // 3:2 image
            const itemWidth = Dimensions.get("window").width - (Theme.spacing.small * 2);
            const itemHeight = itemWidth / 3 * 2;

            return (
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ marginVertical: Theme.spacing.small }}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={itemWidth} height={itemHeight}>
                            <Svg.Rect
                                x={0}
                                y={0}
                                rx={2}
                                ry={2}
                                width={itemWidth}
                                height={itemHeight}
                            />
                        </SvgAnimatedLinearGradient>
                    </View>

                    <View style={{ marginVertical: Theme.spacing.small }}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={itemWidth} height={itemHeight}>
                            <Svg.Rect
                                x={0}
                                y={0}
                                rx={2}
                                ry={2}
                                width={itemWidth}
                                height={itemHeight}
                            />
                        </SvgAnimatedLinearGradient>
                    </View>

                    <View style={{ marginVertical: Theme.spacing.small }}>
                        <SvgAnimatedLinearGradient primaryColor={Theme.color.skeleton1} secondaryColor={Theme.color.skeleton2} width={itemWidth} height={itemHeight}>
                            <Svg.Rect
                                x={0}
                                y={0}
                                rx={2}
                                ry={2}
                                width={itemWidth}
                                height={itemHeight}
                            />
                        </SvgAnimatedLinearGradient>
                    </View>
                </View>
            );
        }

        return this.renderEmptyImage();
    }

    renderEmptyImage() {
        return (
            // render illustration
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{
                    color: Theme.color.text2,
                    fontSize: 26,
                    lineHeight: 30,
                    fontFamily: "Chewy-Regular"
                }}>
                    {
                        // ToDo: ios review
                        Platform.OS === 'android' ? "No registered girls yet" : "No registered posts yet"
                    }
                </Text>

                <Text style={{
                    marginTop: 8,
                    color: Theme.color.text3,
                    fontSize: 18,
                    lineHeight: 22,
                    fontFamily: "Chewy-Regular"
                }}>Let's wait awhile</Text>

                <Image
                    style={{
                        marginTop: 20,
                        width: Cons.stickerWidth,
                        height: Cons.stickerHeight,
                        resizeMode: 'cover'
                    }}
                    source={PreloadImage.post}
                />
            </View>
        );
    }

    handleRefresh = () => {
        if (this.state.refreshing) return;

        this.setState({ refreshing: true });

        this.setState({ isLoadingFeeds: true });

        // reload from the start
        this.props.store.loadFeedFromStart();

        // this.disableScroll();
    }
}

const styles = StyleSheet.create({
    contentContainer: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.tiny // Explore.js styles.orderTab.marginBottom
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
