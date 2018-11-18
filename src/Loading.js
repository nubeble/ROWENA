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

                const { uid } = Firebase.auth.currentUser;

                /*
                const feedQuery = Firebase.firestore.collection("feed").orderBy("timestamp", "desc");
                const userFeedQuery = Firebase.firestore.collection("feed").where("uid", "==", uid).orderBy("timestamp", "desc");

                feedStore.init(feedQuery);
                profileStore.init();
                userFeedStore.init(userFeedQuery);
                */

                if (this.state.isUserAutoAuthenticated) {
                    navigation.navigate('mainBottomTabNavigator');
                } else {
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
