// @flow
import * as React from "react";
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions } from "react-native";
import { LinearGradient } from "expo";

import Image from "./Image";
import Text from "./Text";
import { StyleGuide, type StyleProps } from "./theme";

import type { Picture } from "./Model";

type CardProps = StyleProps & {
    /*
    title: string,
    subtitle?: string,
    description?: string | React.Node,
    */
    name: string,
    rating: number,
    reviews: number,

    picture?: Picture,
    height?: number,
    onPress: () => mixed,
    children?: React.Node
};

export default class Card extends React.PureComponent<CardProps> {

    static defaultProps = {
        height: 300
        // height: Dimensions.get('window').width / 2 - 2
    };

    render(): React.Node {
        const { name, rating, reviews, picture, height, onPress, children, style } = this.props;
        //const { picture, title, subtitle, description, onPress, children, style } = this.props;

        //const width = Dimensions.get('window').width / 2 - 2;
        //const height = Dimensions.get('window').width / 2 - 2;

        return (
            <TouchableWithoutFeedback {...{ onPress }}>
                <View style={[styles.card, style]}>

                    {/*
                    {picture && <Image style={[styles.image, { width, height }]} {...picture} />}
                    */}
                    {picture && <Image style={[styles.image, { height }]} {...picture} />}

                    {children}

                    <View style={styles.content}>

                        {/*
                        <LinearGradient colors={topGradient} style={styles.gradient}>
                            {
                                subtitle && (
                                    <Text type="headline" style={styles.subtitle}>{subtitle.toUpperCase()}</Text>
                                )
                            }

                            <Text type="title2" color="white">{title}</Text>

                        </LinearGradient>

                        {
                            description && (
                                <LinearGradient colors={bottomGradient} style={styles.gradient}>
                                    {
                                        typeof description === "string" && (
                                            <Text color="white" numberOfLines={1}>{description}</Text>
                                        )
                                    }
                                    {
                                        typeof description !== "string" && description
                                    }
                                </LinearGradient>
                            )
                        }
                        */}



                        <LinearGradient colors={topGradient} style={styles.gradient}>
                            <Text type="headline" style={styles.subtitle}>{name.toUpperCase()}</Text>
                        </LinearGradient>

                        {/*
                            rating icon
                        */}


                        <LinearGradient colors={bottomGradient} style={styles.gradient}>
                            <Text color="white">{reviews}</Text>
                        </LinearGradient>
                    </View>

                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const topGradient = ["rgba(0,0,0,0.8)", "transparent"];
const bottomGradient = ["transparent", "rgba(0,0,0,0.8)"];
const subtitle = "rgba(255, 255, 255, 0.7)";
const styles = StyleSheet.create({
    card: {
        // ...StyleGuide.styles.borderRadius,
        // marginTop: StyleGuide.spacing.small,
        marginTop: 2,
        marginBottom: 2,
        // marginHorizontal: StyleGuide.spacing.small,
        marginHorizontal: 2,
        backgroundColor: StyleGuide.palette.darkGray,
        flex: 1
    },
    image: {
        // ...StyleGuide.styles.borderRadius
    },
    content: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between"
    },
    gradient: {
        padding: StyleGuide.spacing.small,
        ...StyleGuide.styles.borderRadius
    },
    subtitle: {
        color: subtitle,
        fontSize: 15
    }
});
