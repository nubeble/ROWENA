import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, FlatList, ActivityIndicator, Image } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Ionicons, AntDesign, Feather } from "react-native-vector-icons";
import { Cons, Vars } from './Globals';
import SmartImage from './rnff/src/components/SmartImage';
import * as Permissions from 'expo-permissions';
import { NavigationActions } from 'react-navigation';
import autobind from 'autobind-decorator';
import { inject, observer } from "mobx-react/native";
import ProfileStore from "./rnff/src/home/ProfileStore";
import Firebase from "./Firebase";
import PreloadImage from './PreloadImage';
import * as WebBrowser from 'expo-web-browser';
import Dialog from "react-native-dialog";
import Intro from './Intro';
import ChatMain from './ChatMain';

type InjectedProps = {
    profileStore: ProfileStore
};


@inject("profileStore")
@observer
export default class Settings extends React.Component<InjectedProps> {
    state = {
        isLoadingFeeds: false,

        dialogVisible: false,
        dialogTitle: '',
        dialogMessage: '',
        dialogType: 'alert',
        dialogPassword: ''
    };

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
                {
                    this.state.isLoadingFeeds &&
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                            animating={true}
                            size="large"
                            color={Theme.color.selection}
                        />
                    </View>
                }
                <Dialog.Container visible={this.state.dialogVisible}>
                    <Dialog.Title>{this.state.dialogTitle}</Dialog.Title>
                    <Dialog.Description>{this.state.dialogMessage}</Dialog.Description>
                    {
                        this.state.dialogType === 'pad' &&
                        <Dialog.Input
                            keyboardType={'phone-pad'}
                            // keyboardAppearance={'dark'}
                            onChangeText={(text) => this.setState({ dialogPassword: text })}
                            autoFocus={true}
                            secureTextEntry={true}
                        />
                    }
                    <Dialog.Button label="Cancel" onPress={() => this.handleCancel()} />
                    <Dialog.Button label="OK" onPress={() => this.handleConfirm()} />
                </Dialog.Container>
            </View>
        );
    }

    renderListHeaderComponent() {
        const { profile } = this.props.profileStore;
        if (!profile) return null;

        return (
            <View style={styles.container}>
                {/* Privacy Policy */}
                <TouchableOpacity
                    onPress={async () => {
                        const URL = `https://rowena-88cfd.web.app/privacy_policy.html`;
                        let result = await WebBrowser.openBrowserAsync(URL);
                    }}
                >
                    <View style={{
                        width: '100%', height: 44,
                        justifyContent: 'center', paddingLeft: 2
                    }}>
                        <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Privacy Policy'}</Text>
                        <Feather name='shield' color={Theme.color.text3} size={22} style={{ position: 'absolute', right: 0 }} />
                    </View>
                </TouchableOpacity>

                {/* Terms of Service */}
                <TouchableOpacity
                    onPress={async () => {
                        const URL = `https://rowena-88cfd.web.app/terms.html`;
                        let result = await WebBrowser.openBrowserAsync(URL);
                    }}
                >
                    <View style={{
                        width: '100%', height: 44,
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
                            await Firebase.deleteToken(profile.uid);

                            await Firebase.signOut(profile.uid);

                            // hide indicator
                            !this.closed && this.setState({ isLoadingFeeds: false });
                        });
                    }}
                >
                    <View style={{
                        width: '100%', height: 44,
                        justifyContent: 'center', paddingLeft: 2
                    }}>
                        <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Log Out'}</Text>
                        <AntDesign name='logout' color={Theme.color.text3} size={20} style={{ position: 'absolute', right: 0 }} />
                    </View>
                </TouchableOpacity>


                {/* Delete Account */}
                <TouchableOpacity
                    onPress={() => {
                        if (!profile) return;

                        this.openDialog('alert', 'Delete Account', 'Are you sure you want to remove all data from this device?', async () => {
                            // show indicator
                            !this.closed && this.setState({ isLoadingFeeds: true });

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

                            // hide indicator
                            !this.closed && this.setState({ isLoadingFeeds: false });
                        });
                    }}
                >
                    <View style={{
                        width: '100%', height: 44,
                        justifyContent: 'center', paddingLeft: 2
                    }}>
                        <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Delete Account'}</Text>
                        <Ionicons name='ios-remove-circle-outline' color={Theme.color.text3} size={25} style={{ position: 'absolute', right: 0 }} />
                    </View>
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logo}>
                    <Image
                        style={{
                            tintColor: 'grey',
                            width: 64, height: 64,
                            resizeMode: 'cover'
                        }}
                        source={PreloadImage.logo}
                    />
                    <Text style={{
                        fontSize: 24,
                        lineHeight: 28,
                        fontFamily: "MPLUSRounded1c-Bold",
                        color: 'grey'
                    }}>ROWENA</Text>

                    <Text style={{
                        fontSize: 12,
                        fontFamily: "Roboto-Regular",
                        color: 'grey'
                    }}>VERSION {Cons.version} ({Cons.buildNumber})</Text>

                    <Text style={{
                        fontSize: 12,
                        fontFamily: "Roboto-Regular",
                        color: 'grey'
                    }}>Created with passion.</Text>
                </View>
            </View>
        );
    }

    openDialog(type, title, message, callback) {
        this.setState({ dialogType: type, dialogTitle: title, dialogMessage: message, dialogVisible: true });

        this.setDialogCallback(callback);
    }

    setDialogCallback(callback) {
        this.dialogCallback = callback;
    }

    hideDialog() {
        if (this.state.dialogVisible) this.setState({ dialogVisible: false });
    }

    handleCancel() {
        // --
        if (this.state.dialogType === 'pad') this.setState({ dialogPassword: '' });
        // --

        if (this.dialogCallback) this.dialogCallback = undefined;

        this.hideDialog();
    }

    handleConfirm() {
        // --
        if (this.state.dialogType === 'pad') {
            const pw = this.state.dialogPassword;
            if (pw === '1103') {

                setTimeout(() => {
                    if (this.closed) return;
                    this.props.navigation.navigate("admin");
                }, Cons.buttonTimeout);
            }

            this.setState({ dialogPassword: '' });
        }
        // --

        if (this.dialogCallback) {
            this.dialogCallback();
            this.dialogCallback = undefined;
        }

        this.hideDialog();
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
        paddingHorizontal: 20
    },
    logo: {
        // flex: 1,
        // marginTop: 80,
        // marginBottom: 20,
        // backgroundColor: 'green',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        // justifyContent: 'center'
        justifyContent: 'flex-end'
    }
});
