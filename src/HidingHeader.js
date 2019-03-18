import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, Image, Animated } from 'react-native';
import { Text } from "./rnff/src/components";
import { Cons, Vars } from "./Globals";

// const HEADER_MAX_HEIGHT = 200;// set the initial height
// const HEADER_MIN_HEIGHT = 60;// set the height on scroll

const HEADER_MAX_HEIGHT = Cons.searchBarHeight;
const HEADER_MIN_HEIGHT = 0;// set the height on scroll


const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default class HidingHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            scrollY: new Animated.Value(0),
        };
    }
    render() {
        const headerHeight = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
            extrapolate: 'clamp',
        });
        return (
            <View style={{ flex: 1 }}>
                <ScrollView
                    scrollEventThrottle={1}
                    onScroll={Animated.event(
                        [{
                            nativeEvent:
                                { contentOffset: { y: this.state.scrollY } }
                        }]
                    )}>
                    <View style={styles.container}>
                        <Text style={styles.paragraph}>hello</Text>
                        <Image source={{ uri: "https://static.pexels.com/photos/67843/splashing-splash-aqua-water-67843.jpeg" }} style={styles.imageStyle} />
                        <Image source={{ uri: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg" }} style={styles.imageStyle} />
                        <Image source={{ uri: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg" }} style={styles.imageStyle} />
                        <Image source={{ uri: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg" }} style={styles.imageStyle} />
                        <Image source={{ uri: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg" }} style={styles.imageStyle} />
                        <Image source={{ uri: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg" }} style={styles.imageStyle} />
                    </View>
                </ScrollView>
                <Animated.View style={[styles.footer, { height: headerHeight }]}>
                    <View style={styles.bar}>
                        <Text>text here</Text>
                    </View>
                </Animated.View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 24,
        backgroundColor: '#ecf0f1',
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#34495e',
    },
    imageStyle: {
        height: 360,
        width: '100%',
    },
    footer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'red',
    },
    bar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});