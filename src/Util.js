import React from 'react';

const id = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);


export default class Util extends React.Component {

    static uid(): string {
        // a685d8a3-4ec0-4d5d-b334-1146865e7b95
        return `${id()}${id()}-${id()}-${id()}-${id()}-${id()}${id()}${id()}`;
    }


}
