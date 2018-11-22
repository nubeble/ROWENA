import * as firebase from "firebase";
import "firebase/firestore";

const config = {
    apiKey: "AIzaSyCT1LV1HF5REJw_SePsUeUdwFalo5IzrsQ",
    authDomain: "rowena-88cfd.firebaseapp.com",
    databaseURL: "https://rowena-88cfd.firebaseio.com",
    projectId: "rowena-88cfd",
    storageBucket: "rowena-88cfd.appspot.com",
    messagingSenderId: "457192015889"
};


export default class Firebase {
    static auth: firebase.auth.Auth;
    static firestore: firebase.firestore.Firestore;
    static storage: firebase.storage.Storage;

    static init() {
        firebase.initializeApp(config);

        Firebase.auth = firebase.auth();
        Firebase.firestore = firebase.firestore();
        Firebase.firestore.settings({ timestampsInSnapshots: true });
        Firebase.storage = firebase.storage();
    }


    // firestore
    static createProfile(uid, name, email, phoneNumber) { // set
        const user = {
            uid: uid,
            name: name,
            country: null,
            city: null,
            email: email,
            phoneNumber: phoneNumber,
            pictures: { // 6
                one: {
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
            location: {
                longitude: 0.0, // 경도
                latitude: 0.0 // 위도
            },
            about: null,
            receivedReviews: [], // 나한테 달린 리뷰
            // 총 리뷰 갯수 - receivedReviews.length
            averageRating: 2.7, // 평균 평점 - 리뷰가 추가될 때마다 다시 계산해서 업데이트
            postedReviews: [] // 내가 쓴 리뷰
        };

        return user;
    }
}
