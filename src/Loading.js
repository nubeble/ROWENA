import React from 'react';
import { StyleSheet, Animated, Dimensions, View, StatusBar } from 'react-native';
import { Font, AppLoading, SplashScreen, Asset } from 'expo';
// import { Images, loadIcons } from "./rne/src/components";
import Firebase from './Firebase';
import { inject, observer } from "mobx-react/native";
import PreloadImage from './PreloadImage';
import Star from './react-native-ratings/src/Star';
import { registerExpoPushToken } from './PushNotifications';
import { RefreshIndicator } from "./rnff/src/components";

// $FlowFixMe
/*
const SFProTextBold = require("../fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("../fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("../fonts/SF-Pro-Text-Regular.otf");
const SFProTextMedium = require("../fonts/SF-Pro-Text-Medium.otf");
const SFProTextHeavy = require("../fonts/SF-Pro-Text-Heavy.otf");
const SFProTextLight = require("../fonts/SF-Pro-Text-Light.otf");
*/
const SFProTextBold = require("../fonts/SuisseIntl/SuisseIntl-Bold.otf");
const SFProTextSemibold = require("../fonts/SuisseIntl/SuisseIntl-SemiBold.otf");
const SFProTextRegular = require("../fonts/SuisseIntl/SuisseIntl-Regular.otf");
const SFProTextMedium = require("../fonts/SuisseIntl/SuisseIntl-Medium.otf");
const SFProTextLight = require("../fonts/SuisseIntl/SuisseIntl-Light.otf");
const SFProTextBlack = require("../fonts/SuisseIntl/SuisseIntl-Black.otf");
// const SuisseIntlUltraLightItalic = require("../fonts/SuisseIntl/SuisseIntl-UltraLightItalic.otf");
const SuisseIntlThinItalic = require("../fonts/SuisseIntl/SuisseIntl-ThinItalic.otf");
const FriendlySchoolmatesRegular = require("../fonts/Friendly-Schoolmates-Regular.otf"); // Logo
// const SansSerif = require("../fonts/Sans-Serif.ttf");

type InjectedProps = {
    feedStore: FeedStore,
    profileStore: ProfileStore
};


@inject("feedStore", "profileStore")
@observer
export default class Loading extends React.Component<InjectedProps> {
    static isUserAutoAuthenticated = true;

    state = {
        isReady: false,
        showIndicator: false,
        image1Opacity: new Animated.Value(1),
        image2Opacity: new Animated.Value(0)
    }

    constructor(props) {
        super(props);

        SplashScreen.preventAutoHide(); // Instruct SplashScreen not to hide yet

        StatusBar.setHidden(true);
    }

    componentDidMount() {
        this._cacheResourcesAsync().then(() => {
            this.setState({ isReady: true });

            // this.init();
        }).catch(error => console.error(`Unexpected error thrown when loading: ${error.stack}`));
    }

    render() {
        if (!this.state.isReady) {
            return null;
        }

        return (
            <View style={{ flex: 1 }}>
                <Animated.Image
                    // style={{ flex: 1, resizeMode: 'cover', width: undefined, height: undefined, opacity: this.state.image1Opacity }}
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover',
                        opacity: this.state.image1Opacity
                    }}
                    source={PreloadImage.Background}
                    onLoadEnd={() => { // wait for image's content to fully load [`Image#onLoadEnd`] (https://facebook.github.io/react-native/docs/image#onloadend)
                        SplashScreen.hide(); // Image is fully presented, instruct SplashScreen to hide

                        this.setState({ showIndicator: true });

                        this.init();
                    }}
                    fadeDuration={0} // we need to adjust Android devices (https://facebook.github.io/react-native/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300` 
                />
                {
                    this.state.showIndicator &&
                    <View style={{
                        position: 'absolute', top: Dimensions.get('window').height / 2 + 50,
                        width: '100%', height: 50, justifyContent: 'center', alignItems: 'center'
                    }}>
                        <RefreshIndicator color='white' />
                    </View>
                }

                <Animated.Image
                    style={{
                        position: 'absolute',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                        resizeMode: 'cover',
                        opacity: this.state.image2Opacity
                    }}
                    source={PreloadImage.Splash}
                />
            </View>
        );
    }

    async _cacheResourcesAsync() {
        console.log('Loading._cacheResourcesAsync');

        const fonts = Font.loadAsync({
            "SFProText-Bold": SFProTextBold,
            "SFProText-Semibold": SFProTextSemibold,
            "SFProText-Regular": SFProTextRegular,
            "SFProText-Medium": SFProTextMedium,
            "SFProText-Black": SFProTextBlack,
            "SFProText-Light": SFProTextLight,
            // "SuisseIntl-UltraLightItalic": SuisseIntlUltraLightItalic,
            "SuisseIntl-ThinItalic": SuisseIntlThinItalic,
            "FriendlySchoolmates-Regular": FriendlySchoolmatesRegular,
            // "SansSerif": SansSerif
        });

        // const images = Images.downloadAsync(); // logo
        // const icons = loadIcons();
        // await Promise.all([fonts, ...images, icons]);

        const preload = PreloadImage.downloadAsync();
        const star = Star.downloadAsync();

        await Promise.all([fonts, ...preload, ...star]);
    }

    init() {
        console.log('Loading.init');

        Firebase.init();

        Firebase.auth.onAuthStateChanged(async (user) => {
            console.log('onAuthStateChanged', user);

            // const { navigation, feedStore, profileStore, userFeedStore } = this.props;
            const { navigation, feedStore, profileStore } = this.props;

            const isUserAuthenticated = !!user;

            if (isUserAuthenticated) {

                registerExpoPushToken();

                // const { uid } = Firebase.auth.currentUser;
                /*
                const feedQuery = Firebase.firestore.collection("feed").orderBy("timestamp", "desc"); // 전체 feed
                feedStore.init(feedQuery);

                profileStore.init();

                const userFeedQuery = Firebase.firestore.collection("feed").where("uid", "==", uid).orderBy("timestamp", "desc"); // 내가 올린 feed
                userFeedStore.init(userFeedQuery);
                */
                profileStore.init();



                // ToDo: check updates (chat first.. post, likes, review, reply later)

                // 1. home
                // const home = await this.checkUpdateOnHome();
                // 새로 등록된 girls

                // 2. likes
                // const likes = await this.checkUpdateOnLikes();

                // 3. chat
                const chat = await this.checkUpdateOnChat();
                if (chat) {
                    // show badge
                    setTimeout(() => {
                        const screenProps = this.props.screenProps;
                        screenProps.changeBadgeOnChat(true, 0);
                    }, 2000); // 2 sec
                }

                // 4. profile
                // const profile = await this.checkUpdateOnProfile();
                // owner: 내가 올린 post에 리뷰
                // customer: 내가 올린 review에 답글



                if (Loading.isUserAutoAuthenticated) {
                    // update user info to database

                    const profile = {
                        name: user.displayName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        picture: {
                            preview: null,
                            uri: user.photoURL
                        }
                    };

                    const uid = Firebase.user().uid;
                    await Firebase.updateProfile(uid, profile);

                    console.log('move to main');
                    StatusBar.setHidden(false);
                    navigation.navigate("mainStackNavigator");
                } else {
                    console.log('move to welcome');
                    StatusBar.setHidden(false);
                    navigation.navigate("welcome");
                }
            } else {
                Loading.isUserAutoAuthenticated = false;

                Animated.parallel([
                    Animated.timing(this.state.image1Opacity, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.image2Opacity, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true
                    })
                ]).start(() => {
                    !this.closed && this.setState({ showIndicator: false });

                    console.log('move to auth main');
                    // StatusBar.setHidden(false);
                    navigation.navigate("authStackNavigator");
                });
            }
        });
    }

    async checkUpdateOnChat() {
        const uid = Firebase.user().uid;
        const room = await Firebase.getLastChatRoom(uid);

        if (!room) return false;

        const mid = room.mid;
        const lastReadMessageId = room.lastReadMessageId;

        if (!mid) { // no contents (will never happen)
            return false;
        }

        if (!lastReadMessageId) { // user never read
            return true;
        }

        if (mid === lastReadMessageId) {
            return false;
        }

        return true;
    }






    addUser(uid, name, email, phoneNumber) { // set
        const user = {
            uid: uid,
            name: name,
            country: "Thailand",
            city: "Bangkok",
            email: email,
            phoneNumber: phoneNumber,
            pictures: { // 6
                one: {
                    // preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
                    // uri: 'https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a'
                    preview: null,
                    uri: null
                },
                two: {
                    preview: null,
                    uri: null
                },
                three: {
                    preview: null,
                    uri: null
                },
                four: {
                    preview: null,
                    uri: null
                },
                five: {
                    preview: null,
                    uri: null
                },
                six: {
                    preview: null,
                    uri: null
                }
            },
            /*
            pictures: [ // up to 6
                {
                    preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
                    uri: 'https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a'
                    // preview: '',
                    // uri: ''
                }
            ],
            */
            location: {
                longitude: 100.46775760000003, // 경도
                latitude: 13.7659225 // 위도
            },
            about: "let's make love",
            receivedReviews: [ // 나한테 달린 리뷰 [review id]
            ],

            // 총 리뷰 갯수 - receivedReviews.length

            // 평균 평점 - 리뷰가 추가될 때마다 다시 계산해서 업데이트
            averageRating: 2.7,

            postedReviews: [ // 내가 작성한 리뷰 [review id]
            ]
        };

        /*
        Firebase.firestore.collection("users").add(user).then((docRef) => {
            console.log('Add User succeeded. Document written with ID:', docRef.id);
        }).catch(function (error) {
            console.error('Add User failed. Error adding document:', error);
        });
        */
        // await Firebase.firestore.collection("users").doc(uid).set(user).then(() => console.log('inside then'));
        // Firebase.firestore.collection("users").doc(uid).set(user);
        // console.log('await');

        return Firebase.firestore.collection("users").doc(uid).set(user);
    }

    /*
    // let users = await getUsers();
    getUsers() { // get
        return new Promise((resolve, reject) => {
            let users = {};

            Firebase.firestore.collection("users").get().then((snapshot) => {
                snapshot.forEach((doc) => {
                    console.log(doc.id, '=>', doc.data());
                    users[doc.id] = doc.data();
                });

                resolve(users);
            }).catch((err) => {
                console.log('Error getting documents', err);

                reject(err);
            });
        });
    }
    */

    updateUser(uid, name, email, phoneNumber) {
        var data = {
            name: name,
            email: email,
            phoneNumber: phoneNumber
        };

        /*
        var query = Firebase.firestore.collection('users');
        query = query.where('uid', '==', uid);
        query.get().then((querySnapshot) => {
            if (!querySnapshot.size) {
                console.log("No such a user!");
            } else {
                querySnapshot.forEach((queryDocumentSnapshot) => {
                    console.log(queryDocumentSnapshot.id, queryDocumentSnapshot.data());

                    Firebase.firestore.collection('users').doc(queryDocumentSnapshot.id).update(data);
                });
            }
        });
        */

        return new Promise((resolve, reject) => {
            // --
            /*
            Firebase.firestore.collection('users').doc(uid).get().then(async doc => {
                if (!doc.exists) {
                    console.log('No such document!');
                } else {
                    console.log('Document data:', doc.data());

                    // update data
                    await Firebase.firestore.collection('users').doc(uid).update(data);

                    resolve();
                }
            }).catch(err => {
                console.log('Error getting document', err);

                reject(err);
            });
            */
            // --
            Firebase.firestore.collection('users').doc(uid).update(data).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }



}
