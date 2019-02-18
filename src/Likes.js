import autobind from "autobind-decorator";
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, BackHandler, Dimensions, FlatList } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Constants, Permissions, Linking, ImagePicker } from "expo";
// import { StyleGuide } from "./rne/src/components/theme";
// import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import Util from "./Util";
import type { FeedEntry } from "./rnff/src/components/Model";
import type { ScreenProps } from "./rnff/src/components/Types";
import { Theme } from "./rnff/src/components";
import { Globals } from "./Globals";

/*
type InjectedProps = {
    // feedStore: FeedStore,
    profileStore: ProfileStore
};
*/

const MAX_FEED_COUNT = 12; // 3 x 4
// const MAX_FEED_COUNT = 3;


// @inject("feedStore", "profileStore") @observer
/*
@inject("profileStore")
@observer
*/
// export default class Likes extends React.Component<ScreenProps<> & InjectedProps> {
export default class Likes extends React.Component {
    state = {
        refreshing: false,
        renderList: false,
        isLoadingFeeds: false,


        showIndicator: false,
        showAlert: false,

        feeds: [],


    };

    constructor(props) {
        super(props);

        this.lastFeedId = null;
        this.lastLoadedFeedIndex = -1;
        this.lastLoadedFeedId = null;
        this.reload = true;
    }

    componentDidMount() {
        console.log('ProfileMain.componentDidMount');

        this.hardwareBackPressListener = BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBackPress);


        // const { profile } = this.props.profileStore;

        // this.getUserFeeds();

        setTimeout(() => {
            !this.isClosed && this.setState({ renderList: true });
        }, 0);
    }

    @autobind
    handleHardwareBackPress() {
        if (this.state.showAlert) {
            this.setState({ showAlert: false });
        } else {
            // this.props.navigation.navigate("intro");
        }

        return true;
    }

    @autobind
    onScrollHandler() {
        // console.log('ProfileMain.onScrollHandler');

        // this.getUserFeeds();
    }

    componentWillUnmount() {
        console.log('ProfileMain.componentWillUnmount');

        this.hardwareBackPressListener.remove();

        this.isClosed = true;
    }

    render() {

        return (
            <View style={styles.flex}>

                <View style={styles.searchBar}>

                    <Text
                        style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 18,
                            fontFamily: "SFProText-Semibold",
                            alignSelf: 'center'
                        }}
                    >Likes</Text>

                </View>

                {
                    this.state.renderList &&
                    <FlatList
                        ref={(fl) => this._flatList = fl}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}

                        ListHeaderComponent={
                            <View>
                                <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => console.log('onPress')}>
                                    <SmartImage
                                        style={styles.ad}
                                        uri={'https://1.bp.blogspot.com/-Q7b5Vuw_iCA/Wyw8mnZHKzI/AAAAAAAAAOU/9QsgXyOPPXkENuNj9w2W-N_cn02kY9JHwCLcBGAs/s1600/01.gif'}
                                    />
                                </TouchableOpacity>


                            </View>
                        }
                        ListFooterComponent={
                            this.state.isLoadingFeeds &&
                            <ActivityIndicator
                                style={styles.bottomIndicator}
                                animating={true}
                                size="small"
                                color='grey'
                            />
                        }


                        // scrollEventThrottle={1}
                        // columnWrapperStyle={styles.columnWrapperStyle}
                        /*
                        numColumns={3}
                        data={this.state.feeds}
                        keyExtractor={item => item.feedId}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity onPress={async () => this.openPost(item)}>
                                    <View style={styles.pictureContainer}>
                                        <SmartImage
                                            // preview={item.pictures.one.preview}
                                            // uri={item.pictures.one.uri}
                                            uri={item.imageUri}
                                            style={styles.picture}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        onEndReachedThreshold={0.5}
                        onEndReached={this.onScrollHandler}
                        */
                        // ItemSeparatorComponent={this.itemSeparatorComponent}

                        onRefresh={this.handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                }
            </View>

        );
    }

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                // this.getUserFeeds();
            }
        );
    };






}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBar: {
        height: Globals.searchBarHeight,
        paddingBottom: 8,
        flexDirection: 'column',
        justifyContent: 'flex-end'
    },
    contentContainer: {
        flexGrow: 1,
        paddingLeft: Theme.spacing.tiny,
        paddingRight: Theme.spacing.tiny
    },



    ad: {
        width: parseInt(Dimensions.get('window').width) - 2,
        height: (parseInt(Dimensions.get('window').width) - 2) / 21 * 9,
        marginBottom: Theme.spacing.small
    },
    activityIndicator: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0
    },


    bottomButton: {
        width: '85%',
        height: 45,

        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0,

        marginBottom: 10
    },



    columnWrapperStyle: {
        flex: 1,
        // justifyContent: 'center'
        justifyContent: 'flex-start'
    },
    pictureContainer: {
        // width: (parseInt(Dimensions.get('window').width) - 2) / 3,
        // height: (parseInt(Dimensions.get('window').width) - 2) / 3,
        width: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
        height: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
        marginVertical: 2,
        marginHorizontal: 2,
        borderRadius: 2
    },
    picture: {
        width: '100%',
        height: '100%',
        borderRadius: 2
    },
    content: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: Theme.spacing.small,
        flex: 1,
        justifyContent: 'center',

        borderRadius: 2,
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
    bottomIndicator: {
        marginTop: 20,
        marginBottom: 20
    }
});
