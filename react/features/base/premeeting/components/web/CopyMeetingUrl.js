// @flow

import React, { Component } from 'react';

import { getCurrentConferenceUrl } from '../../../connection';
import { translate } from '../../../i18n';
import { Icon, IconCopy, IconCheck } from '../../../icons';
import { connect } from '../../../redux';
import { copyText, getDecodedURI } from '../../../util';

type Props = {

    /**
     * The meeting url.
     */
    url: string,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Used to determine if invitation link should be automatically copied
     * after creating a meeting.
     */
    _enableAutomaticUrlCopy: boolean,
};

type State = {

    /**
     * If true it shows the 'copy link' message.
     */
    showCopyLink: boolean,

    /**
     * If true it shows the 'link copied' message.
     */
    showLinkCopied: boolean,
};

const COPY_TIMEOUT = 2000;

/**
 * Component used to copy meeting url on prejoin page.
 */
class CopyMeetingUrl extends Component<Props, State> {

    textarea: Object;

    /**
     * Initializes a new {@code Prejoin} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.textarea = React.createRef();
        this.state = {
            showCopyLink: false,
            showLinkCopied: false
        };
        this._copyUrl = this._copyUrl.bind(this);
        this._hideCopyLink = this._hideCopyLink.bind(this);
        this._hideLinkCopied = this._hideLinkCopied.bind(this);
        this._showCopyLink = this._showCopyLink.bind(this);
        this._showLinkCopied = this._showLinkCopied.bind(this);
        this._copyUrlAutomatically = this._copyUrlAutomatically.bind(this);
    }

    _copyUrl: () => void;

    /**
     * Callback invoked to copy the url to clipboard.
     *
     * @returns {void}
     */
    async _copyUrl() {
        const textarea = this.textarea.current;

        try {
            textarea.select();
            //document.execCommand('copy');
            await navigator.clipboard.writeText(textarea.value)
            textarea.blur();
            this._showLinkCopied();
            window.setTimeout(this._hideLinkCopied, COPY_TIMEOUT);
        } catch (err) {
            console.log('error when copying the meeting url. ', err);
        }
    }

    _hideLinkCopied: () => void;

    /**
     * Hides the 'Link copied' message.
     *
     * @private
     * @returns {void}
     */
    _hideLinkCopied() {
        this.setState({
            showLinkCopied: false
        });
    }

    _hideCopyLink: () => void;

    /**
     * Hides the 'Copy link' text.
     *
     * @private
     * @returns {void}
     */
    _hideCopyLink() {
        this.setState({
            showCopyLink: false,
            showLinkCopied: false
        });
    }

    _showCopyLink: () => void;

    /**
     * Shows the dark 'Copy link' text on hover.
     *
     * @private
     * @returns {void}
     */
    _showCopyLink() {
        this.setState({
            showCopyLink: true,
            showLinkCopied: false
        });
    }

    _showLinkCopied: () => void;

    /**
     * Shows the green 'Link copied' message.
     *
     * @private
     * @returns {void}
     */
    _showLinkCopied() {
        this.setState({
            showLinkCopied: true,
            showCopyLink: false
        });
    }

    _copyUrlAutomatically: () => void;

    /**
     * Attempts to automatically copy invitation URL.
     * Document has to be focused in order for this to work.
     *
     * @private
     * @returns {void}
     */
    _copyUrlAutomatically() {
        navigator.clipboard.writeText(this.props.url)
            .then(() => {
                this._showLinkCopied();
                window.setTimeout(this._hideLinkCopied, COPY_TIMEOUT);
            });
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately before mounting occurs.
     *
     * @inheritdoc
     */
    componentDidMount() {
        const { _enableAutomaticUrlCopy } = this.props;

        if (_enableAutomaticUrlCopy) {
            setTimeout(this._copyUrlAutomatically, 2000);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showCopyLink, showLinkCopied } = this.state;
        let { url, t, meetingUrl } = this.props;
        const { _copyUrl, _showCopyLink, _hideCopyLink } = this;
        const src = showLinkCopied ? IconCheck : IconCopy;

        if(!url && meetingUrl){
             url = meetingUrl
        }
        return (
            <div
                className = 'copy-meeting'
                onMouseEnter = { _showCopyLink }
                onMouseLeave = { _hideCopyLink }>
                <div
                    className = { `url ${showLinkCopied ? 'done' : ''}` }
                    onClick = { _copyUrl } >
                    { !showCopyLink && !showLinkCopied && 
                        <div className="url-text">{url}</div> }
                    { showCopyLink && t('prejoin.copyAndShare') }
                    { showLinkCopied && t('prejoin.linkCopied') }
                    <Icon
                        onClick = { _copyUrl }
                        size = { 24 }
                        src = { src } />
                </div>
                <textarea
                    readOnly = { true }
                    ref = { this.textarea }
                    tabIndex = '-1'
                    value = { url } />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { enableAutomaticUrlCopy } = state['features/base/config'];
    const { customizationReady } = state['features/dynamic-branding'];

    return {
        url: customizationReady ? getCurrentConferenceUrl(state) : '',
        _enableAutomaticUrlCopy: enableAutomaticUrlCopy || false
    };
}

export default connect(mapStateToProps)(translate(CopyMeetingUrl));
