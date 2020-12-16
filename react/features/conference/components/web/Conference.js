// @flow

import _ from 'lodash';
import React from 'react';
import SockJsClient from 'react-stomp';

import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';
import Loading from '../../../always-on-top/Loading';
import { getConferenceNameForTitle } from '../../../base/conference';
import { connect, disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { Icon, IconArrowRight, IconShareDesktop, IconArrowLeft } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect as reactReduxConnect } from '../../../base/redux';
import { getLocalVideoTrack } from '../../../base/tracks';
import {
    addWaitingParticipants,
    flushOutWaitingList,
    removeWaitingParticipants
} from '../../../base/waiting-participants';
import { Chat } from '../../../chat';
import { Filmstrip, SpeakersList } from '../../../filmstrip/components';
import { setPage } from '../../../filmstrip/actions.web';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { KnockingParticipantList } from '../../../lobby';
import { NotificationsToasts, showNotification } from '../../../notifications-toasts';
import { Prejoin, isPrejoinPageVisible, isInterimPrejoinPageVisible } from '../../../prejoin';
import {
    Toolbox
} from '../../../toolbox/components';
import {
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox
} from '../../../toolbox/actions';
import { ToolboxMoreItems, ToastNotificationSettings } from '../../../toolbox-more-items';
import {
    leavingMeeting
} from '../../../toolbox/actions';
import { LAYOUTS, getCurrentLayout, calculateNumberOfPages, showPagination } from '../../../video-layout';
import { maybeShowSuboptimalExperienceNotification,
    getConferenceSocketBaseLink,
    getWaitingParticipantsSocketTopic,
    getAppSocketEndPoint, 
    setLowConnectionStatusMode, 
    setConferenceLastNToOne } from '../../functions';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';

import InviteParticipants from './InviteParticipants';
import Labels from './Labels';
import { default as Notice } from './Notice';
import ParticipantsList from './ParticipantsList';
import PrivacyPage from './privacy/privacy';
import TermsPage from './terms/terms';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip'
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean,

    dispatch: Function,
    t: Function,
    _iAmSharingScreen: boolean,
    _isModerator: boolean,
    _sharer: Object,
    _otherSharers: Array<Object>,
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;
    isLegalPage: boolean;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);
        this.isLegalPage = (window.location.pathname === '/privacy-policy') || (window.location.pathname === '/TnC');

        if (!this.isLegalPage) {
            // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
            this._originalOnShowToolbar = this._onShowToolbar;
            this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

            this.state = {
                waitingParticipantsFetchDone: false,
                connectionQualityTimer: null
            };

            // Bind event handler so it is only bound once for every instance.
            this._onFullScreenChange = this._onFullScreenChange.bind(this);
        }
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (this.isLegalPage) {
            document.querySelector('body').classList.add('legal-page-body');

            return;
        }
        document.querySelector('body').classList.remove('legal-page-body');

        this.closeSocketConnection();
        this.props._isModerator && this.props.dispatch(flushOutWaitingList());

        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
        APP.store.dispatch(leavingMeeting(false));

        this._start();
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {
        if (this.isLegalPage) {
            document.querySelector('body').classList.add('legal-page-body');

            return;
        }
        document.querySelector('body').classList.remove('legal-page-body');
        this.sendMessageWaitingParticipants();
        if (this.props._connectionQuality
             !== prevProps._connectionQuality) {
                this.checkAndClearConnectionQualityTimer();
                let connectionQualityTimer = null;
                 // If _connectionQuality is not good, 
                 // set lastN to zero if no screen share is happening, else set to 1.
                if(this.props._connectionQuality < 70) {
                    connectionQualityTimer =
                        setTimeout(() => setLowConnectionStatusMode(), 10);
                    
                    this.setConnectionTimerInState(connectionQualityTimer);
                }
                else {
                    connectionQualityTimer =
                        setTimeout(() => {
                            // check if the _connectionQuality is good to restore the lastN value
                            const _connectionQuality = APP?.conference?.getStats()?.connectionQuality;
                            _connectionQuality && _connectionQuality >= 70
                            && !APP.store.getState()['features/filmstrip'].collapsed && setConferenceLastNToOne()
                        }, 5000);

                    this.setConnectionTimerInState(connectionQualityTimer);
                }
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        if (this.isLegalPage) {
            return;
        }
        this.closeSocketConnection();

        this.setState({ waitingParticipantsFetchDone: false });

        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());


    }

    /**
     * 
     */

    checkAndClearConnectionQualityTimer() {
        if(this.state.connectionQualityTimer) {
            clearTimeout(this.state.connectionQualityTimer);
            this.setConnectionTimerInState(null);
        }
    }

    /**
     * 
     */

    setConnectionTimerInState(timer) {
        this.setState({ 
            connectionQualityTimer: timer
        });
    }

    /**
     * Send message over socket to fetch the waiting participants list.
     *
     */
    sendMessageWaitingParticipants() {
        if (this.isLegalPage) {
            return;
        }

        if (this.props._isModerator
            && !this.state.waitingParticipantsFetchDone
            && this.clientRef && this.clientRef.client.connected) {
            this.setState({ waitingParticipantsFetchDone: true });
            this.clientRef.sendMessage(`${getAppSocketEndPoint() + this.props._participantsSocketTopic}`,
                    JSON.stringify({ 'status': 'PENDING' }));
        }

    }

    /**
     * Close the existing socket connection.
     *
     */
    closeSocketConnection() {
        if (this.isLegalPage) {
            return;
        }
        if (this.clientRef && this.clientRef.client.connected) {
            this.clientRef.disconnect();
        }
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly
        } = interfaceConfig;
        const {
            _iAmRecorder,
            _layoutClassName,
            _showPrejoin,
            _leavingMeeting,
            _otherSharers,
            _iAmSharingScreen,
            _sharer,
            _socketLink,
            _participantsSocketTopic,
            _isModerator,
            _isWaitingEnabled,
            _toastNotificationSettings
        } = this.props;
        const hideLabels = filmstripOnly || _iAmRecorder;

        const { page } = APP.store.getState()['features/filmstrip'];
        const { tileViewEnabled } = APP.store.getState()['features/video-layout'];

        // const maxGridSize = window.interfaceConfig.TILE_VIEW_MAX_COLUMNS * window.interfaceConfig.TILE_VIEW_MAX_COLUMNS;
        const participants = APP.store.getState()['features/base/participants'];
        const totalPages = calculateNumberOfPages(participants.length);
        const showPaging = showPagination();
        
        if (window.location.pathname === '/privacy-policy') {
            return <PrivacyPage />;
        }

        if (window.location.pathname === '/TnC') {
            return <TermsPage />;
        }



        return (
            <div
                className = { _layoutClassName }
                id = 'videoconference_page'
                onMouseMove = { this._onShowToolbar }>

                {
                    _isModerator && _isWaitingEnabled
                    && <SockJsClient
                        url = { _socketLink }
                        topics = { [ _participantsSocketTopic ] }
                        onMessage = { res => {
                            if (res.action === 'REMOVE') {
                                APP.store.dispatch(removeWaitingParticipants(res.participants.map(p => p.jid)));
                            } else {
                                APP.store.dispatch(addWaitingParticipants(res.participants));
                                if (_toastNotificationSettings.showParticipantWaiting) {
                                    res.participants && res.participants.forEach(p => {
                                        APP.store.dispatch(showNotification({
                                            userName: p.username,
                                            type: 'WAITING_TO_JOIN'
                                        }));
                                    });
                                }

                            }

                        } }
                        ref = { client => {
                            this.clientRef = client;
                        } } />
                }


                {
                    _leavingMeeting
                    && <Loading />
                }

                <Notice />
                <div id = 'videospace'>
                    <LargeVideo />
                    <KnockingParticipantList />
                    { hideLabels || <Labels /> }
                    <Filmstrip filmstripOnly = { filmstripOnly } />
                    {(tileViewEnabled && totalPages > 1 && showPaging)
                    && <div className = 'conference__pagination'>
                        <button
                            disabled = { page <= 1 }
                            onClick = { () => {

                                if (page <= 1) {
                                    return;
                                }
                                APP.store.dispatch(setPage(page - 1));
                            } }>
                            <Icon src = { IconArrowLeft } />
                        </button>
                        <button
                            disabled = { page >= totalPages }
                            onClick = { () => {

                                if (page >= totalPages) {

                                    return;
                                }
                                APP.store.dispatch(setPage(page + 1));
                            } }><Icon src = { IconArrowRight } /></button>
                    </div>}
                </div>

                { filmstripOnly || _showPrejoin || <Toolbox /> }
                { filmstripOnly || <Chat /> }

                <ToolboxMoreItems />
                <ToastNotificationSettings />
                {_isModerator && <SpeakersList />}

                { this.renderNotificationsContainer() }

                <CalleeInfoContainer />

                {(_sharer || _iAmSharingScreen) && <div
                    className = 'conference__screen-shared'
                    title = { (_otherSharers || []).reduce((agg, t) => `${t.name} \n${agg}`, '') }>
                    <Icon src = { IconShareDesktop } />
                    {_iAmSharingScreen && 'You are sharing screen'}
                    {!_iAmSharingScreen && _sharer && `${_sharer.name} is sharing screen`}
                    {(_otherSharers || []).length > 0 && ` +${(_otherSharers || []).length} other(s)` }
                </div>}

                {/* {(this.props._screensharing && !this.props._sharer) && <div className = 'conference__screen-shared'>
                    <Icon src = { IconShareDesktop } />Your screen is being shared
                </div>}

                {this.props._sharer && <div className = 'conference__screen-shared'>
                    <Icon src = { IconShareDesktop } />
                    {this.props._sharer.name} {_otherSharers.length > 0 ? `+${_otherSharers.length} other(s) are` : 'is'} sharing screen
                </div>} */}

                <NotificationsToasts />
                <ParticipantsList />
                <InviteParticipants />
                { !filmstripOnly && _showPrejoin /* || _interimPrejoin*/ && <Prejoin />}
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly
            && dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const tracks = state['features/base/tracks'];
    const participants = state['features/base/participants'];
    const localVideo = getLocalVideoTrack(tracks);
    const { participantId: screenSharerId } = tracks.find(t => t.videoType === 'desktop') || {};
    const sharer = participants.find(p => p.id === screenSharerId);
    const localParticipant = getLocalParticipant(state);
    const isModerator = (localParticipant || {}).role === PARTICIPANT_ROLE.MODERATOR;

    return {
        ...abstractMapStateToProps(state),
        _iAmSharingScreen: localVideo && localVideo.videoType === 'desktop',
        _sharer: localParticipant.id === screenSharerId ? null : sharer,
        _otherSharers: tracks
            .filter(t => t.videoType === 'desktop' && t.participantId !== screenSharerId)
            .map(t => participants.find(p => p.id === t.participantId) || {}),
        _iAmRecorder: state['features/base/config'].iAmRecorder,
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state)],
        _roomName: getConferenceNameForTitle(state),
        _showPrejoin: isPrejoinPageVisible(state),
        _interimPrejoin: isInterimPrejoinPageVisible(state),
        _isModerator: isModerator,
        _leavingMeeting: state['features/toolbox'].leaving,
        _socketLink: getConferenceSocketBaseLink(),
        _participantsSocketTopic: getWaitingParticipantsSocketTopic(state),
        _isWaitingEnabled: state['features/app-auth'].meetingDetails?.isWaitingEnabled,
        _toastNotificationSettings: state['features/toolbox-more'].toastNotificationSettings

    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
