// @flow

import React, { PureComponent } from 'react';

import { AudioSettingsButton, VideoSettingsButton } from '../../../../toolbox';

import CopyMeetingUrl from './CopyMeetingUrl';
import Preview from './Preview';
import Background from '../../../../welcome/components/background';

type Props = {

    /**
     * Children component(s) to be rendered on the screen.
     */
    children: React$Node,

    /**
     * Footer to be rendered for the page (if any).
     */
    footer?: React$Node,

    /**
     * Title of the screen.
     */
    title: string,

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean,

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object
}

/**
 * Implements a pre-meeting screen that can be used at various pre-meeting phases, for example
 * on the prejoin screen (pre-connection) or lobby (post-connection).
 */
export default class PreMeetingScreen extends PureComponent<Props> {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { title, videoMuted, videoTrack } = this.props;

        return (
            <div
                className = 'premeeting-screen'
                id = 'lobby-screen'>
                <Background backgroundColor='black'/>
                <Preview
                        videoMuted = { videoMuted }
                        videoTrack = { videoTrack } >
                    <div className = 'media-btn-container'>
                        <AudioSettingsButton visible = { true } />
                        <VideoSettingsButton visible = { true } />
                    </div>
                    { this.props.footer }
                </Preview>

                <div className = 'content'>
                    <a href="/" class="close-icon"></a>
                    <div className = 'title'>
                        { title }
                    </div>
                    <CopyMeetingUrl />
                    { this.props.children }
                </div>
            </div>
        );
    }
}
