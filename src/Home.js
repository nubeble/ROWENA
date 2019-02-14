import React from 'react';
import { StyleSheet, Text, View, Button, Dimensions, Platform } from 'react-native';
import { Constants, Location, Permissions } from 'expo';
import { Card, Feed } from "./rne/src/components";
import TravelAPI, { type Guide } from "./rne/src/travel/api";
import type { NavigationProps } from "./rne/src/components";
import type { Action } from "./rne/src/components/Model";
import { ThemeProvider, Colors } from "./rne/src/components";
import Firebase from './Firebase';


type Chunk = {
    id: string,
    users: User[]
};

// ToDo: from server DB
const __USERS = require("./users");
const __REVIEWS = require("./reviews");

/* USER INFO */
type User = {
    uid: string,
    name: string,
    country: string,
    city: string,
    email: string,
    phoneNumber: string,
    // pictures: Picture[],
    pictures: Pictures,
    location: Location,
    about: string,
    receivedReviews: string[],
    averageRating: number,
    postedReviews: string[]
};

type Pictures = {
    one: Picture,
    two: Picture,
    three: Picture,
    four: Picture,
    five: Picture,
    six: Picture
};


export default class Home extends React.Component<NavigationProps<>> {
    state = {
        userLocationLoaded: false,
        girls: null
    };

    componentDidMount() {
        console.log('Home.componentDidMount');

        const themeProvider = ThemeProvider.getInstance();
        themeProvider.switchColors(Colors['Main']);

        // console.log('userLocationLoaded', this.state.userLocationLoaded);
        if (this.state.userLocationLoaded !== true) {
            const { uid } = Firebase.auth.currentUser;

            this.setGirls(uid); // async, set state until it shows loading icon

            this.setState({userLocationLoaded: true});
        }
    }

    async setGirls(uid) {
        // 1. get user's location
        let location = {
            country: null,
            city: null
        };

        let user = await this.getUser(uid);

        if (!user || !user.country || !user.city) {
            // get gps
            try {
                let position = await this.getPosition();
            } catch (error) {
                console.log('getPosition error', error);

                return;
            }

            // ToDo: get country, city from position
            /*
            location.country = position.country;
            location.city = position.city;
            */

        } else {
            console.log(user.country, user.city);
            location.country = user.country;
            location.city = user.city;
        }

        // 2. get girls
        try {
            let girls = await this.getGirls(location, uid);
            if (!girls.length) this.setState({girls: girls});
        } catch (error) {
            console.log('getGirls error', error);
        }
    }
    
    getPosition() {
        return new Promise(async (resolve, reject) => {
            let { status } = await Permissions.askAsync(Permissions.LOCATION);
            console.log('status', status);

            if (status !== 'granted') {
                console.log('Permission to access location was denied');

                reject('Permission to access location was denied.');
            } else {
                let position = await Location.getCurrentPositionAsync({});

                resolve(position);
            }
        });
    }

    getGirls(location, uid) {
        return new Promise(async (resolve, reject) => {
            try {
                let users = await this.getUsers(location.country, location.city, uid);
                console.log('girls', users);
                resolve(users);
            } catch (error) {
                reject(error);
            }
        });
    }

    /*
    getUser(uid, cb) {
        var query = Firebase.firestore.collection('users').where('uid', '==', uid);
        query.get().then((querySnapshot) => {
            if (!querySnapshot.size) {
                console.log("No such a user!");
            } else {
                querySnapshot.forEach(function(doc) {
                    // console.log(doc.id, " => ", doc.data());
                    var user = doc.data();
                    console.log(user.country, user.city);

                    cb(user);
                });
            }
        });
    }
    */
    getUser(uid) {
        return new Promise((resolve, reject) => {
            Firebase.firestore.collection('users').doc(uid).get().then(doc => {
                if (!doc.exists) {
                    console.log('No such document!');

                    reject();
                } else {
                    console.log('user', doc.data());

                    let user = doc.data();
                    resolve(user);
                }
            }).catch(err => {
                console.log('Error getting users', err);

                reject(err);
            });
        });
    }

    getUsers(country, city, uid) {
        return new Promise((resolve, reject) => {
            var query = Firebase.firestore.collection('users');
            query.where('country', '==', country);
            query.where('city', '==', city);
            query.orderBy('averageRating', 'desc').limit(50);
            query.get().then((querySnapshot) => {
                if (!querySnapshot.size) {
                    console.log("No such a user!");

                    reject("No such a user!");
                } else {
                    let users = [];
                    querySnapshot.forEach(function(doc) {
                        // console.log(doc.id, " => ", doc.data());

                        /*
                        if (user.uid !== uid) { // except me
                            users.push(user);
                        }
                        */
                        if (doc.id == uid) { // except me
                            let user = doc.data();
                            users.push(user);
                        }
                    });

                    resolve(users);
                }
            }).catch(err => {
                console.log('Error getting users', err);

                reject(err);
            });
        });
    }

    renderItem = (chunk: Chunk): React.Node => {
        const { navigation } = this.props;

        let gap = 2;
        const height1 = parseInt(Dimensions.get('window').width) - gap * 2;
        const height2 = parseInt(Dimensions.get('window').width) / 2 - gap * 2; // image width - padding

        return (
            <View style={styles.row}>
                {
                    /*
                    chunk.guides.map(guide => (
                        <Card
                            key={guide.id}
                            title={guide.city}
                            subtitle={guide.country}
                            description={`${guide.duration} days`}
                            // onPress={() => navigation.navigate("Guide", { guide })}
                            onPress={() => navigation.navigate("detail", { guide })}
                            picture={guide.picture}
                            // height={chunk.guides.length === 1 ? 300 : 175}
                            height={chunk.guides.length === 1 ? height1 : height2}
                        />
                    ))
                    */
                    chunk.users.map(user => (
                        <Card
                            key={user.uid}
                            // title={user.city}
                            // subtitle={user.country}
                            // description={`${user.duration} days`}
                            name={user.name}
                            rating={user.averageRating}
                            reviews={`${user.receivedReviews.length} reviews`}
                            onPress={() => navigation.navigate("detail", { user })}
                            // picture={user.pictures[0]}
                            picture={user.pictures.one}
                            height={chunk.users.length === 1 ? height1 : height2}
                        />
                    ))
                }
            </View>
        );
    }



    onPress = () => {
        const { navigation } = this.props;
        // navigation.navigate("Welcome");
    }

    render(): React.Node {
        const { renderItem, onPress } = this;
        // const { navigation } = this.props;
        const girls = this.state.girls;

        /*
        const data = _windowing(__USERS).map(users => (
            { uid: users.map(user => user.uid).join(""), users }
        ));
        */
        // console.log('windowing data', data);

        let data;
        if (!girls) {
            data = null;
        } else {
            data = _windowing(girls).map(users => (
                { uid: users.map(user => user.uid).join(""), users }
            ));
        }
        




        /*
        const title = "Guides";
        const rightAction: Action = {
            icon: "sign-out",
            onPress
        };
        */

        let title1 = null, title2 = null, title3 = null;

        // title1 = "Recently Viewed Girls";
        title1 = "Nearby Girls";
        // title2 = "Popular Girls";
        // title3 = "Nearby Girls";

        return (
            /*
            <Feed {...{ data, renderItem, title, navigation, rightAction }} />
            */
           <Feed {...{ data, renderItem, title1, title2, title3 }} />
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#fff'
    },


    row: {
        flexDirection: "row"
    }
});

// convert 1d array to 2d array
const windowing = (guides: Guide[]): Guide[][] => {
    const windows = [[]];

    /*
    guides.forEach(guide => {
        if (windows[windows.length - 1].length === 2) {
            windows.push([guide]);
            windows.push([]);
        } else {
            windows[windows.length - 1].push(guide);
        }
    });
    */
    
    let order = parseInt(Math.random() * 100 % 2) + 1; // 1 or 2
    // console.log('order:', order);

    let randomFlag = false;

    guides.forEach(guide => {

        // ToDo: check

        if (order === 1) {
            windows[windows.length - 1].push(guide);
            windows.push([]);

            randomFlag = true;
        } else if (order === 2) {
            windows[windows.length - 1].push(guide);

            if (windows[windows.length - 1].length === 2) {
                windows.push([]);
                randomFlag = true;
            }
        }

        if (randomFlag) {
            order = parseInt(Math.random() * 100 % 2) + 1; // 1 or 2
            // console.log('order:', order);
            randomFlag = false;
        }

    });

    if (windows[windows.length - 1].length === 0) windows.pop();


    // test

    let tmp = cloneArray(windows);

    for (i = 0; i < windows.length; i++) {
        tmp.push(windows[i]);
    }

    for (i = 0; i < windows.length; i++) {
        tmp.push(windows[i]);
    }

    for (i = 0; i < windows.length; i++) {
        tmp.push(windows[i]);
    }

    // return windows;
    return tmp;
};


const cloneArray = (arr) => {
    // Deep copy arrays. Going one level deep seems to be enough.
    let clone = [];
    for (i=0; i<arr.length; i++) {
      clone.push( arr[i].slice(0) )
    }
    return clone;
}




const _windowing = (users: User[]): User[][] => {
    // console.log('users:', users);

    const windows = [[]];

    let order = parseInt(Math.random() * 100 % 2) + 1; // 1 or 2
    // console.log('order:', order);

    let randomFlag = false;

    users.forEach(user => {

        // user['key'] = parseInt(Math.random() * 1000);

        // ToDo: check

        if (order === 1) {
            windows[windows.length - 1].push(user);
            windows.push([]);

            randomFlag = true;
        } else if (order === 2) {
            windows[windows.length - 1].push(user);

            if (windows[windows.length - 1].length === 2) {
                windows.push([]);
                randomFlag = true;
            }
        }

        if (randomFlag) {
            order = parseInt(Math.random() * 100 % 2) + 1; // 1 or 2
            // console.log('order:', order);
            randomFlag = false;
        }

    });

    if (windows[windows.length - 1].length === 0) windows.pop();

    return windows;
};
