// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import {Platform, Switch as RNSwitch} from "react-native";

import {Theme} from "./Theme";

type SwitchProps = {
    defaultValue?: boolean,
    onToggle?: boolean => void,
    onTintColor?: string
};

type SwitchState = {
    value: boolean
};

export default class Switch extends React.Component<SwitchProps, SwitchState> {

    static defaultProps = {
        onTintColor: Theme.palette.primary
    };

    static getDerivedStateFromProps({ defaultValue }: SwitchProps): SwitchState {
        return { value: !!defaultValue };
    }

    state = {
        value: false
    };

    @autobind
    toggle() {
        const {onToggle} = this.props;
        const {value} = this.state;
        this.setState({ value: !value });
        if (onToggle) {
            onToggle(!value);
        }
    }

    render(): React.Node {
        const {onTintColor} = this.props;
        const {value} = this.state;
        return (
            <RNSwitch
                {...{onTintColor, value}}
                thumbTintColor={Platform.OS === "android" ? "white" : undefined}
                onValueChange={this.toggle}
            />
        );
    }
}
