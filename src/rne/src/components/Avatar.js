// @flow
import * as React from "react";
import {Image as NativeImage, StyleSheet} from "react-native";
import * as Svg from 'react-native-svg';

import CacheManager from "./CacheManager";
import type {StyleProps} from "./theme";

const {Defs, Image, ClipPath, Path} = Svg;

type AvatarProps = StyleProps & {
    size: number,
    uri: string,
    stacked: boolean
};

type AvatarState = {
  uri: ?string
};

export default class Avatar extends React.Component<AvatarProps, AvatarState> {

    static defaultProps = {
        size: 36,
        stacked: false
    };

    state = {
        uri: undefined
    };

    async componentDidMount(): Promise<void> {
        const {uri} = this.props;
        const newURI = await CacheManager.get(uri).getPath();
        if (newURI) {
            this.setState({ uri: newURI });
        }
    }

    render(): React.Node {
        const {stacked, size, style} = this.props;
        const {uri} = this.state;
        const width = stacked ? 27 : size;
        const height = size;
        if (!stacked) {
            const computedStyle = {
                height,
                width,
                borderRadius: width / 2
            };
            return (
                <NativeImage style={[styles.avatar, style, computedStyle]} source={{ uri }}/>
            );
        }
        return (
            <Svg style={[styles.avatar, style]} viewBox="0 0 27 36" {...{width, height}}>
                <Defs>
                    <ClipPath id="crescent">
                        <Path
                            // eslint-disable-next-line max-len
                            d="M0.897764484,34.07775 C5.81365469,30.4339111 9,24.5890609 9,18 C9,11.4109391 5.81365469,5.56608893 0.897764484,1.92225003 C3.33298752,0.6926267 6.08560794,5.35365135e-16 9,0 C18.9411255,-1.82615513e-15 27,8.0588745 27,18 C27,27.9411255 18.9411255,36 9,36 C6.08560794,36 3.33298752,35.3073733 0.897766964,34.0777481 Z"
                        />
                    </ClipPath>
                </Defs>
                {
                    uri && (
                        <Image
                            x={0}
                            y={0}
                            href={{ uri }}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#crescent)"
                            {...{width: size, height: size}}
                        />
                    )
                }
            </Svg>
        );
    }
}

const styles = StyleSheet.create({
    avatar: {
        alignSelf: "center"
    }
});
