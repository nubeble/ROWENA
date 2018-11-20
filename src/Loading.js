import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { Font, AppLoading } from 'expo';
import { Images, loadIcons } from "./rne/src/components";
import Firebase from './Firebase';
import { inject } from "mobx-react/native";
import type { ScreenProps } from "./src/rnff/components/Types";

// $FlowFixMe
const SFProTextBold = require("../fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("../fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("../fonts/SF-Pro-Text-Regular.otf");
const FriendlySchoolmatesItalic = require("../fonts/Friendly-Schoolmates-Italic.otf");
const FriendlySchoolmatesRegular = require("../fonts/Friendly-Schoolmates-Regular.otf");
const SansSerif = require("../fonts/Sans-Serif.ttf");


@inject("feedStore", "profileStore", "userFeedStore")
export default class Loading extends React.Component<ScreenProps<>> {
    state = {
        isUserAutoAuthenticated: true
    };

    async componentDidMount(): Promise<void> {
        console.log('Loading::componentDidMount');

        // const { navigation } = this.props;
        const { navigation, feedStore, profileStore, userFeedStore } = this.props;

        const fonts = Font.loadAsync({
            "SFProText-Bold": SFProTextBold,
            "SFProText-Semibold": SFProTextSemibold,
            "SFProText-Regular": SFProTextRegular,
            "FriendlySchoolmatesItalic": FriendlySchoolmatesItalic,
            "FriendlySchoolmatesRegular": FriendlySchoolmatesRegular,
            "SansSerif": SansSerif
        });

        const images = Images.downloadAsync(); // logo

        const icons = loadIcons();

        await Promise.all([fonts, ...images, icons]);


        Firebase.init();

        Firebase.auth.onAuthStateChanged((user) => {
            console.log('onAuthStateChanged', user);

            const isUserAuthenticated = !!user;

            if (isUserAuthenticated) {
                // ToDo: load user feed from database
                /*
                const { uid } = Firebase.auth.currentUser;

                const feedQuery = Firebase.firestore.collection("feed").orderBy("timestamp", "desc");
                const userFeedQuery = Firebase.firestore.collection("feed").where("uid", "==", uid).orderBy("timestamp", "desc");

                feedStore.init(feedQuery);
                profileStore.init();
                userFeedStore.init(userFeedQuery);
                */

                if (this.state.isUserAutoAuthenticated) {
                    // update
                    this.updateUser(user.uid, user.displayName, user.email, user.phoneNumber);

                    navigation.navigate('mainBottomTabNavigator');
                } else {
                    // save user info to database
                    this.addUser(user.uid, user.displayName, user.email, user.phoneNumber);

                    navigation.navigate('welcome');
                }
            } else {
                this.setState( { isUserAutoAuthenticated: false } );

                navigation.navigate("authStackNavigator");
            }
        });




        // database watch
		/*
		const ref = firebase.database().ref().child('users');
		ref.on('value', function(snapshot) {
			console.log('database watch', snapshot.val());
		});
		*/

		/*
		var userRatingRef = firebase.database().ref('users/' + userId + '/totalReviewsCount');
		userRatingRef.on('value', function(snapshot) {
			// updateReviewsCount(postElement, snapshot.val());
		});
		*/
    }

    addUser(uid, name, email, phoneNumber) {
        var user = {
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
                    preview: '',
                    uri: ''
                },
                two: {
                    preview: '',
                    uri: ''
                },
                three: {
                    preview: '',
                    uri: ''
                },
                four: {
                    preview: '',
                    uri: ''
                },
                five: {
                    preview: '',
                    uri: ''
                },
                six: {
                    preview: '',
                    uri: ''
                }
            },
            location: {
                longitude: 100.46775760000003, // 경도
                latitude: 13.7659225 // 위도
            },
            about: "let's make love",
            receivedReviews: [ // review UID List (나한테 달린 리뷰)
            ],
            // 총 리뷰 갯수 - receivedReviews.length

            // 평균 평점 - 리뷰가 추가될 때마다 다시 계산해서 업데이트
            averageRating: 2.7,
            postedReviews: [ // review UID List (내가 작성한 리뷰)
            ]
        };

        Firebase.firestore.collection("users").add(user).then((docRef) => {
            console.log('Add User succeeded. Document written with ID:', docRef.id);
        }).catch(function (error) {
            console.error('Add User failed. Error adding document:', error);
        });
    }

    updateUser(uid, name, email, phoneNumber) { // userUid, value
        var data = {
            name: name,
            email: email,
            phoneNumber: phoneNumber
        };

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
    }

    render() {
        const statusBar = (
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
        );

        return (
            <React.Fragment>
                {statusBar}
                <AppLoading />
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#fff'
    }
});
