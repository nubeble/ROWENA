import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';

export default class ChatMain extends React.Component {
    state = {
        name: '',

        renderChat: false,
        isLoadingChat: false
    }

    componentDidMount() {
        // load chat room list
        Firebase.loadChatRoomList(list => {
            console.log('list', list);

            /*
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, message)
            }));
            */

        });

        setTimeout(() => {
            !this.isClosed && this.setState({ renderChat: true });
        }, 0);
    }

    @autobind
    onAddToChatFinished(result) {
        console.log('onAddToChatFinished', result);

        if (!result) {
            this.allChatsLoaded = true; // don't call again!
        }

        !this.isClosed && this.setState({ isLoadingChat: false });
    }

    componentWillUnmount() {
        this.isClosed = true;
    }

    moveToRoom() {
        this.props.navigation.navigate('room', { name: this.state.name }); // ToDo: name
    }

    render(): React.Node {
        const { reviewStore } = this.props.navigation.state.params;
        const { navigation } = this.props;

        // const reviews = reviewStore.reviews;
        const { reviews } = reviewStore;

        const loading = reviews === undefined;

        return (
            /*
            <View style={styles.container}>
                <Text style={styles.title}>Enter your name:</Text>
                <TextInput
                    onChangeText={this.onChangeText}
                    style={styles.nameInput}
                    placeHolder="John Cena"
                    value={this.state.name}
                />
                <TouchableOpacity onPress={this.onPress}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
            */
            <View style={styles.flex}>
                <View style={styles.searchBarStyle}>
                    {/*
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
                    */}
                </View>

                {
                    !this.state.renderChat ?
                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={true}
                            size="large"
                            color='grey'
                        />
                        :
                        <TouchableWithoutFeedback
                            onPress={() => {
                                if (this.state.showKeyboard) this.setState({ showKeyboard: false });
                            }}
                        >
                            <FlatList
                                ref={(fl) => this._flatList = fl}
                                data={reviews}
                                keyExtractor={this.keyExtractor}
                                renderItem={this.renderItem}
                                onEndReachedThreshold={0.5}
                                onEndReached={this.loadMore}

                                contentContainerStyle={styles.contentContainer}
                                showsVerticalScrollIndicator

                                ListEmptyComponent={(
                                    <View style={{ paddingHorizontal: Theme.spacing.small }}>
                                        {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                                    </View>
                                )}
                                ListFooterComponent={(
                                    this.state.isLoadingChat && (
                                        <ActivityIndicator
                                            style={styles.bottomIndicator}
                                            animating={this.state.isLoadingChat}
                                            size="small"
                                            color='grey'
                                        />
                                    )
                                )}

                                ItemSeparatorComponent={this.itemSeparatorComponent}
                            />
                        </TouchableWithoutFeedback>
                }

                <Toast
                    ref="toast"
                    position='top'
                    positionValue={Dimensions.get('window').height / 2}
                    opacity={0.6}
                />
            </View >
        );
    }

    /*
    onChangeText = name => this.setState({ name });

    onPress = () => {
        this.props.navigation.navigate('room', { name: this.state.name });
    }
    */



    @autobind
    keyExtractor(item: ReviewEntry): string {
        return item.review.id;
    }

    @autobind
    renderItem({ item, index }: FlatListItem<ReviewEntry>): React.Node {
        const _profile = item.profile;
        const _review = item.review;

        const ref = item.review.id;

        const reply = _review.reply;

        const isMyReview = this.isOwner(_review.uid, Firebase.auth.currentUser.uid);

        let isMyReply = undefined;
        if (reply) isMyReply = this.isOwner(reply.uid, Firebase.auth.currentUser.uid);


        return (
            <View style={{ paddingBottom: Theme.spacing.tiny }} onLayout={(event) => this.onItemLayout(event, index)}>
                {/* ToDo: add profile image */}

                <View style={{ flexDirection: 'row', paddingTop: Theme.spacing.base, paddingBottom: Theme.spacing.tiny }}>
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
                    isMyReview && !reply && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                onPress={() => this.removeReview(index)}
                            >
                                <Text ref='delete' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                {
                    // comment, id, timestamp, uid
                    reply && (
                        <View style={{
                            paddingTop: Theme.spacing.small,
                            paddingBottom: Theme.spacing.small,
                            paddingLeft: Theme.spacing.small,
                            paddingRight: Theme.spacing.small,
                            backgroundColor: Theme.color.highlight, borderRadius: 2
                        }}>

                            <View style={{ flexDirection: 'row', paddingBottom: Theme.spacing.small }}>
                                <Text style={styles.replyOwner}>Management Response</Text>
                                <Text style={styles.replyDate}>{moment(reply.timestamp).fromNow()}</Text>
                            </View>

                            {/*
                               <Text style={styles.reviewText}>{tmp}</Text>
                           */}
                            <Text style={styles.replyComment}>{reply.comment}</Text>

                            {
                                isMyReply && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ alignSelf: 'baseline' }}
                                            onPress={() => this.removeReply(index)}
                                        >
                                            <Text ref='replyDelete' style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            }
                        </View>
                    )
                }

                {
                    this.state.isOwner && !reply ?
                        (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Theme.spacing.base }}>
                                <TouchableOpacity style={{ alignSelf: 'baseline' }} onPress={() => this.showKeyboard(ref, index)}>
                                    <Text style={{ marginLeft: 4, fontFamily: "SFProText-Light", color: "silver" }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        )
                        :
                        (
                            <View style={{ paddingTop: Theme.spacing.base - Theme.spacing.tiny }} />
                        )
                }
            </View>
        );
    }

    @autobind
    loadMore() {
        if (this.state.isLoadingReview) {
            this.setState({ refreshing: false });
            return;
        }

        if (this.allReviewsLoaded) {
            this.setState({ refreshing: false });
            return;
        }

        this.setState({ isLoadingReview: true });

        const { reviewStore } = this.props.navigation.state.params;
        reviewStore.loadReview();
    }

    @autobind
    itemSeparatorComponent() {
        return (
            <View style={{ borderBottomColor: Theme.color.line, borderBottomWidth: 1, width: '100%' }} />
        );
    }

    @autobind
    onItemLayout(event, index) {
        const { x, y, width, height } = event.nativeEvent.layout;
        // console.log(x, y, width, height);
        // console.log(index, height);

        this.itemHeights[index] = height;
    }
}

const offset = 24;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center'
    },
    nameInput: { // 3. <- Add a style for the input
        height: offset * 2,
        margin: offset,
        paddingHorizontal: offset,
        borderColor: '#111111',
        borderWidth: 1,
    },
    title: { // 4.
        marginTop: offset,
        marginLeft: offset,
        fontSize: offset,
    },
    buttonText: { // 5.
        marginLeft: offset,
        fontSize: offset,
    },

    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
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



});
