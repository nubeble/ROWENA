import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { MapView } from 'expo';


export default class MapScreen extends React.Component {
    componentDidMount() {

        console.log('!!!!!!!!!', this.props.navigation);

    }

    render() {
        return (
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        // alignItems: 'center',
        justifyContent: 'center',
    }
});
