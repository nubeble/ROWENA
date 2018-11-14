import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { Font, AppLoading } from 'expo';
import { Images, loadIcons } from "./components";
import Firebase from './Firebase';

// $FlowFixMe
const SFProTextBold = require("../fonts/SF-Pro-Text-Bold.otf");
const SFProTextSemibold = require("../fonts/SF-Pro-Text-Semibold.otf");
const SFProTextRegular = require("../fonts/SF-Pro-Text-Regular.otf");
const FriendlySchoolmatesItalic = require("../fonts/Friendly-Schoolmates-Italic.otf");
const FriendlySchoolmatesRegular = require("../fonts/Friendly-Schoolmates-Regular.otf");
const SansSerif = require("../fonts/Sans-Serif.ttf");


export default class Loading extends React.Component {

    async componentDidMount(): Promise<void> {
        console.log('Loading::componentDidMount');

        const { navigation } = this.props;

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

        // ToDo: Split "Create New Account User" and "Auto Log In User"
        Firebase.auth.onAuthStateChanged((user) => {
            console.log('onAuthStateChanged', user);

            const isUserAuthenticated = !!user;

            if (isUserAuthenticated) {
                const { uid } = Firebase.auth.currentUser;

                const feedQuery = Firebase.firestore.collection("feed").orderBy("timestamp", "desc");

                const userFeedQuery = Firebase.firestore.collection("feed").where("uid", "==", uid).orderBy("timestamp", "desc");
				/*
                profileStore.init();
                feedStore.init(feedQuery);
				userFeedStore.init(userFeedQuery);
				*/

                navigation.navigate('mainBottomTabNavigator');
            } else {
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
