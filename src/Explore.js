// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import moment from "moment";
import { StyleSheet, View, Animated, SafeAreaView, TouchableWithoutFeedback, Platform, Dimensions, TouchableOpacity, TextInput } from "react-native";
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import { Text, Theme, Avatar, Feed, FeedStore } from "./rnff/src/components";
import type { ScreenProps } from "./rnff/src/components/Types";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SmartImage from "./rnff/src/components/SmartImage";

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

type ExploreState = {
    scrollAnimation: Animated.Value
};

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore") @observer
export default class Explore extends React.Component<ScreenProps<> & InjectedProps, ExploreState> {
    state = {
        scrollAnimation: new Animated.Value(0)
    };

    @autobind
    profile() {
        this.props.navigation.navigate("Profile");
    }

    componentDidMount() {
        this.props.feedStore.checkForNewEntriesInFeed();
    }

    render(): React.Node {
        const { feedStore, profileStore, navigation } = this.props;
        const { scrollAnimation } = this.state;
        const { profile } = profileStore;

        const opacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [1, 0],
            extrapolate: "clamp"
        });
        const translateY = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, -60],
            extrapolate: "clamp"
        });
        const fontSize = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [36, 24],
            extrapolate: "clamp"
        });
        const height = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: Platform.OS === "android" ? [70, 70] : [100, 60],
            extrapolate: "clamp"
        });
        const marginTop = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [24, 0],
            extrapolate: "clamp"
        });
        const shadowOpacity = scrollAnimation.interpolate({
            inputRange: [0, 60],
            outputRange: [0, 0.25],
            extrapolate: "clamp"
        });

        return (
            <View style={styles.container}>
                <View style={styles.searchBarStyle}>
                    <View style={{ width: '70%', height: 32, backgroundColor: 'rgb(36, 36, 36)', borderColor: 'rgb(36, 36, 36)', borderRadius: 25, borderWidth: 1 }} >
                        <TouchableOpacity
                            style={{ position: 'absolute', left: 10, top: 7, alignSelf: 'baseline' }}
                            onPress={() => {
                                this.refs['searchInput'].focus();
                                this.startEditing();
                            }}
                        >
                            <FontAwesome name='search' color="grey" size={16} />
                        </TouchableOpacity>

                        <TextInput
                            ref='searchInput'
                            style={{ position: 'absolute', left: 40, right: 40, width: '100%', height: '100%', fontSize: 16, color: "white" }} underlineColorAndroid="transparent"
                            placeholder='Try "Bangkok"' placeholderTextColor='grey'
                            onTouchStart={() => this.startEditing()}
                            onEndEditing={() => this.leaveEditing()}
                        />
                    </View>
                </View>

                {/* <AnimatedSafeAreaView style={[styles.header, { shadowOpacity }]}>
                    <Animated.View style={[styles.innerHeader, { height }]}>
                        <View>
                            <AnimatedText
                                type="large"
                                style={[styles.newPosts, { opacity, transform: [{ translateY }] }]}
                            >
                                New posts
                            </AnimatedText>
                            <AnimatedText
                                type="header2"
                                style={{ fontSize, marginTop }}
                            >
                                {moment().format("dddd")}
                            </AnimatedText>
                        </View>
                        {
                            profile && (
                                <TouchableWithoutFeedback onPress={this.profile}>
                                    <View>
                                        <Avatar {...profile.pictures.one} />
                                    </View>
                                </TouchableWithoutFeedback>
                            )
                        }
                    </Animated.View>
                </AnimatedSafeAreaView> */}
                
                <Feed
                    store={feedStore}
                    onScroll={Animated.event([{
                        nativeEvent: {
                            contentOffset: {
                                y: scrollAnimation
                            }
                        }
                    }])}
                    ListHeaderComponent={(
                        <Animated.View>
                            <SmartImage
                                style={styles.ad}
                                preview={"data:image/gif;base64,R0lGODlhAQABAPAAAKyhmP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="}
                                uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                            />

                            <View style={styles.header}>
                                <Text style={styles.headerText}>{'NEARBY GIRLS'}</Text>
                            </View>
                        </Animated.View>
                    )}
                    // numColumns={2}
                    // keyExtractor
                    {...{ navigation }}
                />
            </View>
        );
    } // end of render()

    startEditing() {
        // ToDo: add animation
        // alert('startEditing()');
    }

    leaveEditing() {
        // ToDo: add animation
        // alert('leaveEditing()');
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgb(26, 26, 26)'
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





    searchBarStyle: { // View
        height: 80,
        paddingBottom: 14,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    ad: {
        width: Dimensions.get('window').width - 2,
        height: (Dimensions.get('window').width - 2) / 21 * 9,
        marginBottom: Theme.spacing.small
    },
    header: {
        padding: Theme.spacing.small
    },
    headerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 18,
        lineHeight: 20,
        fontFamily: "SFProText-Semibold"
    },
});
