import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Cons, Vars } from './Globals';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SmartImage from './rnff/src/components/SmartImage';
import * as Permissions from 'expo-permissions';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';


export default class Settings extends React.Component {

    componentDidMount() {
        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);
    }

    @autobind
    handleHardwareBackPress() {
        this.props.navigation.dispatch(NavigationActions.back());

        return true;
    }

    componentWillUnmount() {
        this.hardwareBackPressListener.remove();

        this.closed = true;
    }

    render() {
        return (
            <View style={styles.flex}>
                <View style={styles.searchBar}>
                    {/* close button */}
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            justifyContent: "center", alignItems: "center"
                        }}
                        onPress={() => {
                            this.props.navigation.dispatch(NavigationActions.back());
                        }}
                    >
                        <Ionicons name='md-arrow-back' color="rgba(255, 255, 255, 0.8)" size={24} />
                    </TouchableOpacity>

                    <Text style={{
                        color: Theme.color.text1,
                        fontSize: 20,
                        fontFamily: "Roboto-Medium",
                        // alignSelf: 'center'
                        marginLeft: 40 + 16
                    }}>Settings</Text>
                </View>
                <FlatList
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={this.renderListHeaderComponent()}
                />
            </View>
        );
    }

    renderListHeaderComponent() {
        return (
            <View style={styles.container}>

                {/* Terms of Service */}
                <TouchableOpacity
                    onPress={async () => {
                        const URL = `https://rowena-88cfd.web.app/terms.html`;
                        let result = await WebBrowser.openBrowserAsync(URL);
                    }}
                >
                    <View style={{
                        width: '100%', height: 36,
                        justifyContent: 'center', paddingLeft: 2
                    }}>
                        <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Terms of Service'}</Text>
                        <Feather name='book' color={Theme.color.text3} size={20} style={{ position: 'absolute', right: 1 }} />
                    </View>
                </TouchableOpacity>

                {/* Log out */}
                <TouchableOpacity
                    onPress={() => {
                        if (!profile) return;

                        this.openDialog('alert', 'Log Out', 'Are you sure you want to log out?', async () => {
                            // show indicator
                            !this.closed && this.setState({ isLoadingFeeds: true });

                            // unsubscribe profile
                            this.props.profileStore.final();

                            // init & unsubscribe
                            Intro.final();
                            ChatMain.final();

                            // remove push token
                            // await unregisterExpoPushToken(profile.uid);
                            await Firebase.deleteToken(uid);

                            await Firebase.signOut(profile.uid);

                            // hide indicator
                            !this.closed && this.setState({ isLoadingFeeds: false });
                        });

                        /*
                        this.openDialog('alert', 'Log out', 'Are you sure you want to remove all data from this device?', async () => {
                            // feeds
                            // storage
                            // user profile & auth

                            // comment store
                            //// reviews, comments

                            // chat
                            // token


                            // 1. unsubscribe profile first!
                            this.props.profileStore.final();

                            // 2. remove all the created feeds (place - feed)
                            const uid = profile.uid;
                            const feeds = profile.feeds;
                            const length = feeds.length;

                            for (let i = 0; i < length; i++) {
                                const feed = feeds[i];
                                await Firebase.removeFeed(uid, feed.placeId, feed.feedId);
                            }

                            // 3. delete all the chat rooms
                            await Firebase.deleteChatRooms(uid);

                            // 4. remove push token (tokens - uid)
                            await Firebase.deleteToken(uid);

                            // 5. remove all the received comments (users - user - comments - all the documents)
                            // 6. remove database (user profile & remove auth)
                            await Firebase.deleteProfile(uid);
                        });
                        */
                    }}
                >
                    <View style={{
                        width: '100%', height: 36,
                        justifyContent: 'center', paddingLeft: 2
                    }}>
                        <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Log Out'}</Text>
                        <AntDesign name='logout' color={Theme.color.text3} size={20} style={{ position: 'absolute', right: 0 }} />
                    </View>
                </TouchableOpacity>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Cons.searchBarHeight,
        paddingBottom: 14,
        justifyContent: 'flex-end'
    },
    container: {
        flex: 1,
        // backgroundColor: 'white'
    }
});
