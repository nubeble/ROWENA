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

    static getRandomNumber() {
        const max = Number.MIN_SAFE_INTEGER;
        const min = Number.MAX_SAFE_INTEGER;

        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static getBirthday(date) {
        let birthday = 'DDMMYYYY';

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        let _day = '';
        if (day < 10) {
            _day = '0' + day.toString();
        } else {
            _day = day.toString();
        }

        let _month = '';
        switch (month) {
            case 0: _month = '01'; break;
            case 1: _month = '02'; break;
            case 2: _month = '03'; break;
            case 3: _month = '04'; break;
            case 4: _month = '05'; break;
            case 5: _month = '06'; break;
            case 6: _month = '07'; break;
            case 7: _month = '08'; break;
            case 8: _month = '09'; break;
            case 9: _month = '10'; break;
            case 10: _month = '11'; break;
            case 11: _month = '12'; break;
        }

        birthday = _day + _month + year.toString();

        return birthday;
    }

    static getBust(breats) {
        let bust = '';

        const words = breats.split(' ');

        bust = words[0];

        return bust;
    }

    static getHeight(height) {
        let value = 0; // number

        const words = height.split(' ');

        value = parseInt(words[0]);

        return value;
    }

    static getWeight(weight) {
        let value = 0; // number

        const words = weight.split(' ');

        value = parseInt(words[0]);

        return value;
    }

    static getAge(birthday) { // 'DDMMYYYY'
        let age = 0;

        const dold = parseInt(birthday.substring(0, 2));
        const mold = parseInt(birthday.substring(2, 4));
        const yold = parseInt(birthday.substring(4, 8));

        const now = new Date();
        const ynew = now.getFullYear();
        const mnew = now.getMonth();
        const dnew = now.getDate();

        let years = (ynew - yold);
        if (mnew < mold || mnew == mold && dnew < dold) {
            years--;
        }

        age = years;

        return age;
    }

    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}
