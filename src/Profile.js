import autobind from "autobind-decorator";
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { Header } from 'react-navigation';
import { Constants, Permissions, Linking, ImagePicker } from "expo";
// import { StyleGuide } from "./rne/src/components/theme";
// import Image from "./rne/src/components/Image";
import SmartImage from "./rnff/src/components/SmartImage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { inject, observer } from "mobx-react/native";
import Firebase from "./Firebase";
import * as firebase from "firebase";
import Util from "./Util";
import type { FeedEntry } from "./rnff/src/components/Model";
import type { ScreenProps } from "./rnff/src/components/Types";
import { Theme } from "./rnff/src/components";

type InjectedProps = {
    // feedStore: FeedStore,
    profileStore: ProfileStore
};

type FlatListItem<T> = {
    item: T
};

const MAX_FEED_COUNT = 6; // 3 x 2


@inject("feedStore", "profileStore") @observer
export default class Profile extends React.Component<ScreenProps<> & InjectedProps> {
    state = {
        showIndicator: false,

        uploadingImage: false,
        uploadImage1: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage2: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage3: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',
        uploadImage4: 'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg',

        renderFeeds: [],
        isLoadingFeeds: false,
        currentFeedIndex: 0,

        refreshing: false,
    };

    componentDidMount() {
        console.log('Profile::componentDidMount');
        // console.log('this.props.feedStore', this.props.feedStore);
        // console.log('this.props.profileStore', this.props.profileStore);
        // console.log('this.props.userFeedStore', this.props.userFeedStore);

        // this.props.userFeedStore.checkForNewEntriesInFeed();


        const { profile } = this.props.profileStore;
        // console.log('Profile::componentDidMount() profile', profile);

        this.getUserFeeds();
    }

    @autobind
    onScrollHandler() {
        console.log('Profile::onScrollHandler');

        this.getUserFeeds();
    }

    async getUserFeeds() {
        if (this.state.isLoadingFeeds) {
            this.setState({refreshing: false});
            return;
        }

        this.setState({ isLoadingFeeds: true });

        const { profile } = this.props.profileStore;
        const feeds = profile.feeds;
        const keys = Object.keys(feeds);

        const currentFeedIndex = this.state.currentFeedIndex;
        const length = keys.length;

        if (currentFeedIndex >= length) {
            this.setState({ isLoadingFeeds: false, refreshing: false });
            return;
        }

        let count = 0;
        const newRecords = [];

        for (var i = currentFeedIndex; i < currentFeedIndex + MAX_FEED_COUNT; i++) {
            if (i >= length) break;

            var num = i;
            var key = num.toString();
            var value = feeds.get(key);
            // console.log(key, value);
            const feedDoc = await Firebase.firestore.collection("place").doc(value.placeId).collection("feed").doc(value.feedId).get();
            const _data = feedDoc.data();
            newRecords.push(_data);

            count++;
            // console.log('count', count);
        }

        this.setState({ isLoadingFeeds: false, currentFeedIndex: currentFeedIndex + count, renderFeeds: [...this.state.renderFeeds, ...newRecords],
            refreshing: false });
    }

    render() {
        const showIndicator = this.state.showIndicator;

        return (
            <View style={styles.flex} >

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={showIndicator}
                    size="large"
                    color='grey'
                />

                <View style={styles.searchBarStyle}>

                    {/* add components here.. */}

                </View>

                <FlatList
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={(
                        <View>
                            <TouchableOpacity onPress={() => this.uploadPicture(0)}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log('onPress')}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log('onPress')}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => console.log('onPress')}>
                                <SmartImage
                                    style={styles.ad}
                                    uri={'http://pocketnow.com/wp-content/uploads/2013/04/9MP-sample.jpg'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.addFeed()}
                                style={[styles.bottomButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Add Feed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => this.removeFeed()}
                                style={[styles.bottomButton, { marginBottom: 10 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Remove Feed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                // onPress={() => this.removeReview()}
                                style={[styles.bottomButton, { marginBottom: 50 }]} >
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>Test</Text>
                            </TouchableOpacity>



                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>{'Your post'}</Text>
                            </View>
                        </View>
                    )}
                    // scrollEventThrottle={1}
                    columnWrapperStyle={styles.columnWrapperStyle}
                    numColumns={3}
                    data={this.state.renderFeeds}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => {
                        return (
                            <TouchableOpacity
                                // onPress={() => this.props.navigation.navigate("homeStackNavigator", { place: item })}
                            >
                                <View style={styles.pictureContainer}>
                                    <SmartImage
                                        preview={item.pictures.one.preview}
                                        uri={item.pictures.one.uri}
                                        style={styles.picture}
                                    />

                                    {/*
                                    <View style={styles.content}>
                                        <Text style={{
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            color: "white",
                                            fontSize: 21,
                                            // flexWrap: "wrap"
                                        }}>{item.city}</Text>
                                    </View>
                                    */}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    onEndReachedThreshold={0.5}
                    onEndReached={this.onScrollHandler}
                    ListFooterComponent={
                        this.state.isLoadingFeeds && (
                        <ActivityIndicator
                            style={styles.bottomIndicator}
                            animating={true}
                            size="small"
                            color='grey'
                        />
                    )}

                    /*
                    ListEmptyComponent={(
                        <View style={styles.post}>
                            {loading ? <RefreshIndicator /> : <FirstPost {...{ navigation }} />}
                        </View>
                    )}
                    */

                    onRefresh={this.handleRefresh}
                    refreshing={this.state.refreshing}
                />
            </View>

        );
    } // end of render()

    handleRefresh = () => {
        this.setState(
            {
                refreshing: true
            },
            () => {
                this.getUserFeeds();
            }
        );
    };






    async addFeed() {
        const feedId = Util.uid(); // create uuid

        const userUid = Firebase.auth.currentUser.uid;
        /*
        let placeId = 'ChIJ82ENKDJgHTERIEjiXbIAAQE';
        const location = {
            description: 'Bangkok, Thailand',
            longitude: 100.5017651, // ToDo: use google api
            latitude: 13.7563309
        };
        */
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';
        const location = {
            description: 'Ho Chi Minh, Vietnam',
            longitude: 106.6296638,
            latitude: 10.8230989
        };
        const name = 'name';
        const age = 20;
        const height = 163;
        const weight = 48;
        const image1Uri = 'http://tenasia.hankyung.com/webwp_kr/wp-content/uploads/2017/02/2017022722084954500-540x360.jpg'; // ToDo: use image picker
        const image2Uri = null;
        const image3Uri = null;
        const image4Uri = null;
        const note = 'note';
        
        await Firebase.createFeed(feedId, userUid, placeId, name, age, height, weight, location, image1Uri, image2Uri, image3Uri, image4Uri, note);
    }

    async removeFeed() {
        const placeId = 'ChIJ0T2NLikpdTERKxE8d61aX_E';

        const feedId = '6598abb5-6c55-cf4b-5dec-86b8a1bd5f69';

        await Firebase.deleteFeed(placeId, feedId);
    }

    uploadPicture(index) {
        this.pickImage(index);
    }

    async pickImage(index) {
        const { status: cameraPermission } = await Permissions.askAsync(Permissions.CAMERA);
        const { status: cameraRollPermission } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (cameraPermission === 'granted' && cameraRollPermission === 'granted') {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0
            });

            console.log('result of launchImageLibraryAsync:', result);

            if (!result.cancelled) {
                this.setState({ uploadingImage: true });

                // show indicator
                this.setState({ showIndicator: true });

                // ToDo: show progress bar


                // upload image
                // var that = this;
                this.uploadImage(result.uri, index, (uri) => {
                    switch (index) {
                        case 0: this.setState({ uploadImage1: uri }); break;
                        case 1: this.setState({ uploadImage2: uri }); break;
                        case 2: this.setState({ uploadImage3: uri }); break;
                        case 3: this.setState({ uploadImage4: uri }); break;
                    }

                    // save to database
                    /*
                    var data = {
                        pictures: {
                            uri: uri
                        }
                    };

                    this.updateUser(Firebase.auth.currentUser.uid, data);
                    */
                });


                /*
                const fileName = result.uri.split('/').pop();
                const url = await firebase.storage().ref(fileName).getDownloadURL();
                console.log('download URL:', url);
                */



                // close indicator
                this.setState({ showIndicator: false });

                this.setState({ uploadingImage: false });

            } // press OK
        } else {
            Linking.openURL('app-settings:');
        }
    }

    async uploadImage(uri, index, cb) {
        const fileName = uri.split('/').pop();
        var ext = fileName.split('.').pop();

        if (!this.isImage(ext)) {
            alert('invalid image file!');
            return;
        }

        var type = this.getImageType(ext);
        // console.log('file type:', type);

        const formData = new FormData();
        formData.append("image", {
            // uri: uri,
            uri,
            name: fileName,
            type: type
        });
        formData.append("userUid", Firebase.auth.currentUser.uid);
        // formData.append("feedId", Firebase.auth.currentUser.uid);
        formData.append("pictureIndex", index);

        try {
            let response = await fetch("https://us-central1-rowena-88cfd.cloudfunctions.net/api/images",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data"
                    },
                    body: formData
                }
            );

            let responseJson = await response.json();
            console.log('responseJson', responseJson);

            // console.log('responseJson', await response.json());

            cb(responseJson.downloadUrl);

            /*
            try {
                let downloadURL = await Firebase.storage.ref(responseJson.name).getDownloadURL();
                // let downloadURL = await Firebase.storage.child(responseJson.name).getDownloadURL();
                cb(downloadURL);
            } catch (error) {
                console.error(error);
            }
            */
        } catch (error) {
            console.error(error);

            // ToDo: error handling
        }
    }
    /*
    async uploadImage(uri, imageName) {
        const response = await fetch(uri);

        if (response.ok) {
            const blob = await response.blob();

            let ref = firebase.storage().ref().child('images/' + imageName);

            const snapshot = ref.put(blob)
                .then(() => { console.log('uploadImage success.'); alert('Your photo has successfully uploaded.'); })
                .catch((error) => { console.log('error:', error); alert('Please try again.'); });

            const uploadedImage = snapshot.downloadURL;
            this.setState({ uploadingImageUri: uploadedImage });

        } else {
            alert('Please try again.');
        }
    }
    */






}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Theme.color.background
    },
    searchBarStyle: {
        height: Constants.statusBarHeight + 8 + 34 + 8,
        paddingBottom: 8,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    container: {
        flexGrow: 1,
        paddingBottom: Theme.spacing.small,
        // backgroundColor: 'black'
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
        //position: 'absolute',
        //bottom: 30,

        width: '85%',
        height: 45,
        alignSelf: 'center',

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "grey",
        borderRadius: 5,
        borderColor: "transparent",
        borderWidth: 0
    },


    //// FlatList ////
    contentContainer: {
        flexGrow: 1,
        // backgroundColor: 'black',
        // paddingBottom: Theme.spacing.base
    },
    columnWrapperStyle: {
        /*
        marginRight: Theme.spacing.small,
        marginTop: Theme.spacing.small
        */
        flex: 1,
        // justifyContent: 'center'
        justifyContent: 'flex-start'
    },
    //// picture ////
    pictureContainer: {
        // width: (parseInt(Dimensions.get('window').width) - 2) / 3,
        // height: (parseInt(Dimensions.get('window').width) - 2) / 3,
        width: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
        height: (parseInt(Dimensions.get('window').width) - 2 * 6) / 3,
        /*
        marginVertical: Theme.spacing.tiny,
        marginHorizontal: Theme.spacing.tiny,
        */
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
        //position: 'absolute',
        //top: 0, bottom: 0, left: 0, right: 0
    },

});
