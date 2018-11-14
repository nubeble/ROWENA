import React from 'react';
import { StyleSheet, Text, View, Button, Dimensions } from 'react-native';
import { Card, Feed } from "./components";
import TravelAPI, { type Guide } from "./travel/api";
import type { NavigationProps } from "./components";
import type { Action } from "./components/Model";
import { ThemeProvider, Colors } from "./components";

/*
type Chunk = {
    id: string,
    guides: Guide[]
};
*/
type Chunk = {
    id: string,
    users: User[]
};

// ToDo: from server DB
const users = require("./users");
const reviews = require("./reviews");

type User = {
    uid: string,
    name: string,
    country: string,
    city: string,
    picture: Picture,
    location: Location,
    about: string,
    receivedReviews: string[],
    averageRating: number,
    postedReviews: string[]
};


export default class Home extends React.Component<NavigationProps<>> {

    componentDidMount() {
        const themeProvider = ThemeProvider.getInstance();
        themeProvider.switchColors(Colors['Main']);
    }
    /*
    render() {
        const { navigate } = this.props.navigation;

        return (
            <View style={styles.container}>
                <Text>Main Page</Text>
                <Button
                    title='Go to Detail'
                    onPress={() => {
                        navigate('detail', { data: 'params' }); // ToDo
                    }}
                />
            </View>
        );
    }
    */


    renderItem = (chunk: Chunk): React.Node => { // ToDo
        const { navigation } = this.props;

        let gap = 2;
        const height1 = Dimensions.get('window').width - gap * 2;
        const height2 = Dimensions.get('window').width / 2 - gap * 2; // image width - padding

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
                            picture={user.picture}
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
        const { navigation } = this.props;

        /*
        const data = windowing(TravelAPI.guides).map(guides => (
            { id: guides.map(guide => guide.id).join(""), guides } // (id, guides[]) - join two IDs
        ));
        console.log('windowing data:', data);
        */
        const data = _windowing(users).map(users => (
            { uid: users.map(user => user.uid).join(""), users }
            // { uid: users.map(user => user.uid).join(""), users, key: parseInt(Math.random() * 1000) }
        ));
        // console.log('windowing data:', data);




        // const title = "Guides";
        const rightAction: Action = {
            icon: "sign-out",
            onPress
        };

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


    // ToDo: test

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
