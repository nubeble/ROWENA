import React from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';


export default class Welcome extends React.Component {
    render() {
        const { goBack } = this.props.navigation;

        return (
            <View style={styles.container}>
                <Text>Welcome</Text>
                <Button
                    title='Go back'
                    onPress={() => {
                        this.props.navigation.goBack();
                    }}
                />
            </View>
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
