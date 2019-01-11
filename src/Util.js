import React from 'react';
import moment from "moment";

const id = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);


export default class Util extends React.Component {

    static uid(): string {
        // a685d8a3-4ec0-4d5d-b334-1146865e7b95
        return `${id()}${id()}-${id()}-${id()}-${id()}-${id()}${id()}${id()}`;
    }

    static getImageType(ext) {
        switch (ext.toLowerCase()) {
            case 'gif':
                return 'image/gif';

            case 'png':
                return 'image/png';

            case 'jpg':
                // return 'image/jpg';
                return 'image/jpeg';

            case 'jpeg':
                return 'image/jpeg';

            case 'bmp':
                return 'image/bmp';

            default:
                return '';
        }
    }

    static isImage(ext) {
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'png':
                //etc
                return true;
        }

        return false;
    }

    static reverseSnapshot(snapshot) {
        let reversed = [];

        snapshot.forEach(child => {
            reversed.unshift(child);
        });

        return reversed;
    }

    static getTime(timestamp) {
        let time;

        const today = moment();
        const yesterday = moment().subtract(1, 'day');

        if (moment(timestamp).isSame(today, 'day')) {
            time = moment(timestamp).format('h:mm a');
        } else if (moment(timestamp).isSame(yesterday, 'day')) {
            time = 'Yesterday';
        } else {
            time = moment(timestamp).fromNow();

            if (time === 'a day ago') time = 'Yesterday';
        }

        return time;
    }



}
