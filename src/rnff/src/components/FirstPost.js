// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

import Text from "./Text";
import { Theme } from "./Theme";

import type { NavigationProps } from "./Types";

export default class FirstPost extends React.Component<NavigationProps<>> {

    @autobind
    share() {
        this.props.navigation.navigate("Share"); // ToDo
    }

    render(): React.Node {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={this.share}>
                    <Icon name="plus-circle" color={Theme.palette.primary} size={25}/>
                </TouchableOpacity>
                {/*
                <Text style={styles.text}>
                    Looks like you have not shared anything yet.
                    Now is the time to make your first post!
                </Text>
                */}
                <Text style={styles.text}>
                    Looks like no one posted anything yet.
                    Now is the time to make your first post!
                </Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",

        marginTop: Theme.spacing.large
    },
    text: {
        textAlign: "center",
        marginTop: Theme.spacing.base
    }
});
