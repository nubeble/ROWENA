import React from 'react';
import { StyleSheet, View, TouchableOpacity, BackHandler, FlatList, ActivityIndicator, Image, AsyncStorage, Dimensions } from 'react-native';
import { Text, Theme } from './rnff/src/components';
import { Ionicons, AntDesign, Feather, MaterialIcons, Entypo } from "react-native-vector-icons";
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
import NavigationService from './NavigationService';
import Dialog from "react-native-dialog";
import Intro from './Intro';

type InjectedProps = {
    profileStore: ProfileStore
};


@inject("profileStore")
@observer
export default class Settings extends React.Component<InjectedProps> {
    static __Intro = null;

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

    componentWillReceiveProps() {
        console.log('Settings.componentWillReceiveProps');

        // get Intro instance
        if (!Settings.__Intro) {
            const mainStackNavigator = NavigationService.getRootRoute();
            if (mainStackNavigator) {
                const root = mainStackNavigator.routes.find(item => item.routeName === 'root');
                const main = root.routes.find(item => item.routeName === 'main');
                const home = main.routes.find(item => item.routeName === 'home');
                const intro = home.routes.find(item => item.routeName === 'intro');
                const introHome = intro.routes.find(item => item.routeName === 'introHome');

                // if (!introHome.params.final || !introHome.params.reload) {
                if (!introHome || !introHome.params || !introHome.params.reload) {
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('Settings Intro params not exists!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    console.log('mainStackNavigator', mainStackNavigator);

                } else {
                    console.log('Intro params set.');

                    Settings.__Intro = introHome;
                }
            }
        }
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
                {/* Post Filter */}
                <View style={{
                    width: '100%', height: 44,
                    justifyContent: 'center', paddingLeft: 2
                }}>
                    <Text style={{ fontSize: 18, color: Theme.color.text5, fontFamily: "Roboto-Medium" }}>{'Post Filter'}</Text>
                </View>

                {/* Show Me */}
                <View style={{
                    width: '100%', height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 2,
                }}>
                    <Text style={{ fontSize: 18, color: Theme.color.text3, fontFamily: "Roboto-Regular" }}>{'Show Me'}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setTimeout(() => {
                                if (this.closed) return;

                                const postFilter = profile.postFilter;

                                let selectedIndex = -1;
                                if (postFilter.showMe === 'Men') selectedIndex = 0;
                                else if (postFilter.showMe === 'Women') selectedIndex = 1;
                                else if (postFilter.showMe === 'Everyone') selectedIndex = 2;

                                this.props.navigation.navigate("showMe", { selectedIndex, initFromShowMe: async (selectedIndex) => await this.initFromShowMe(selectedIndex) });
                            }, Cons.buttonTimeout);
                        }}
                    >
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ fontSize: 18, color: Theme.color.splash, fontFamily: "Roboto-Regular" }}>{profile.postFilter.showMe}</Text>
                            <Entypo name='chevron-right' color={Theme.color.text5} size={24} style={{ marginLeft: 10 }} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Age Range */}

                {/* Legal */}
                <View style={{
                    width: '100%', height: 44,
                    justifyContent: 'center', paddingLeft: 2
                }}>
                    <Text style={{ fontSize: 18, color: Theme.color.text5, fontFamily: "Roboto-Medium" }}>{'Legal'}</Text>
                </View>

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
                        <MaterialIcons name='security' color={Theme.color.text3} size={22} style={{ position: 'absolute', right: 0 }} />
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

                {/* Logins */}
                <View style={{
                    width: '100%', height: 44,
                    justifyContent: 'center', paddingLeft: 2
                }}>
                    <Text style={{ fontSize: 18, color: Theme.color.text5, fontFamily: "Roboto-Medium" }}>{'Logins'}</Text>
                </View>

                {/* Log out */}
                <TouchableOpacity
                    onPress={() => {
                        if (!profile) return;

                        this.openDialog('alert', 'Log Out', 'Are you sure you want to log out?', () => {

                            setTimeout(async () => {
                                if (this.closed) return;

                                // show indicator
                                this.setState({ isLoadingFeeds: true });

                                // update activating
                                let _profile = this.props.profileStore.profile;
                                _profile.activating = false;
                                _profile.lastLogInTime = Date.now();
                                await Firebase.updateProfile(profile.uid, _profile, false);

                                // unsubscribe profile
                                this.props.profileStore.final();

                                // init & unsubscribe
                                // Settings.__Intro.params.final();
                                Intro.final();

                                Firebase.stopChatRoom(profile.uid);

                                // remove push token
                                // await unregisterExpoPushToken(profile.uid);
                                await Firebase.deleteToken(profile.uid);

                                await Firebase.signOut(profile.uid);

                                // hide indicator
                                this.setState({ isLoadingFeeds: false });
                            }, Cons.buttonTimeout);

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

                        this.openDialog('alert', 'Delete Account', 'Are you sure you want to remove all data from this device?', () => {

                            setTimeout(async () => {
                                if (this.closed) return;

                                // show indicator
                                this.setState({ isLoadingFeeds: true });

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
                                this.setState({ isLoadingFeeds: false });
                            }, Cons.buttonTimeout);

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
                        marginTop: 10,
                        fontSize: 12,
                        fontFamily: "Roboto-Regular",
                        color: 'grey'
                    }}>VERSION {Cons.version} ({Cons.buildNumber})</Text>

                    <Text style={{
                        marginBottom: 10,
                        fontSize: 12,
                        fontFamily: "Roboto-Regular",
                        color: 'grey'
                    }}>Created with passion.</Text>

                    {/*
                    <Text style={{
                        fontSize: 12,
                        fontFamily: "Roboto-Regular",
                        color: 'grey'
                    }}>Copyright ⓒ 2019 Nubeble Inc. All rights reserved.</Text>
                    */}
                </View>
            </View>
        );
    }

    async initFromShowMe(selectedIndex) {
        console.log('initFromShowMe()', selectedIndex);

        let showMe = null;
        if (selectedIndex === 0) showMe = 'Men';
        else if (selectedIndex === 1) showMe = 'Women';
        else if (selectedIndex === 2) showMe = 'Everyone';

        const { profile } = this.props.profileStore;
        if (!profile) return null;

        let postFilter = profile.postFilter;

        if (postFilter.showMe !== showMe) {
            postFilter.showMe = showMe;
            profile.postFilter = postFilter;

            await Firebase.updateShowMe(profile.uid, profile);

            Vars.showMe = showMe;



            // init & unsubscribe
            // Settings.__Intro.params.final();
            Intro.final();

            if (!Settings.__Intro) {
                // restart
                this.showToast('App is reloading now.', 500, () => {
                    !this.closed && this.props.navigation.navigate("loading");
                });
            } else {
                // reload
                Settings.__Intro.params.reload();
            }
        }
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

    showToast(msg, ms, cb = null) {
        if (this.props.screenProps.data) this.props.screenProps.data.showToast(msg, ms, cb);
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
        // marginTop: 20,
        paddingVertical: 10,
        width: '100%',
        height: Dimensions.get('window').height / 3,
        // backgroundColor: 'green',
        alignItems: 'center',
        justifyContent: 'flex-end'
    }
});
