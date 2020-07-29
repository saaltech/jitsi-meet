/* @flow */

import React from 'react';

import { translate } from '../../base/i18n';

import MeetingInfo from './MeetingInfo';
import useRequest from '../../hooks/use-request';
import { LoginComponent, Profile } from '../../app-auth';
import { InputField } from '../../base/premeeting';
import { getDisplayName, updateSettings } from '../../base/settings';
import { connect } from '../../base/redux';
import { setPrejoinPageErrorMessageKey } from '../';
import { setLocationURL } from '../../base/connection/actions.web';
import { openConnection } from '../../../../connection';

import { config } from '../../../config'

import {
    Icon,
    IconLogo
} from '../../base/icons';

import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setSkipPrejoin as setSkipPrejoinAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../actions';


import { useState, useEffect } from 'react';
import JoinMeetingForm from './JoinMeetingForm';
import { setFatalError } from '../../overlay';

import {
    getQueryVariable
} from '../functions';

import { setPostWelcomePageScreen } from '../../app-auth/actions';

function GuestPrejoin(props) {
    const [disableJoin, setDisableJoin] = useState(true);
    const [meetingId, setMeetingId] = useState(props.meetingId);
    useEffect(() => {
        // if(meetingId && !_isUserSignedOut && !continueAsGuest && !window.sessionStorage.getItem('isJWTSet')) {
        //     //Host has already signed-in, so there will be no JWT token in the url
        //     window.sessionStorage.setItem('isJWTSet', true);
        //     addTokenToURL()
        // }
        // else {
            setTimeout(async () => {
                if (_isUserSignedOut)
                    await unauthGetConference()
                else 
                    refreshTokenAndFetchConference()
            }, 3000)
        // }
        // Fetch the meeting details using the id in the address bar
        
    }, [meetingId]);

    const [meetingName, setMeetingName] = useState('');
    const [meetingPassword, setMeetingPassword] = useState('');
    const [meetingFrom, setMeetingFrom] = useState(null);
    const [meetingTo, setMeetingTo] = useState(null);
    const { joinConference, _isUserSignedOut = true, joinMeeting } = props;
    const [isMeetingHost, setIsMeetingHost] = useState(false)
    const [continueAsGuest, setContinueAsGuest] = useState(false);
    const [showJoinMeetingForm, setShowJoinMeetingForm] = useState(false);
    const [showPasswordError, setShowPasswordError] = useState('')
    const [isSecretEnabled, setIsSecretEnabled] = useState(false)
    const [conferenceStatus, setConferenceStatus] = useState('')

    const [guestName, setGuestName] = useState('')
    useEffect(() => {
        continueAsGuest && guestName.trim() !== "" &&
            props.updateSettings({
                displayName: guestName,
                email: guestEmail // Done to reset the avatar that might have been set in the previous session 
            })
    }, [guestName])

    const [guestEmail, setGuestEmail] = useState('')
    useEffect(() => {
        continueAsGuest &&
            props.updateSettings({
                email: guestEmail
            })
    }, [guestEmail])

    const [unauthGetConference, fetchUnauthErrors] = useRequest({
        url: config.conferenceManager + config.unauthConferenceEP + '/' + meetingId,
        method: 'get',
        onSuccess: (data) => updateConferenceState(data)
    });

    const [getConference, fetchErrors] = useRequest({
        url: config.conferenceManager + config.conferenceEP + '/' + meetingId,
        method: 'get',
        onSuccess: (data) => updateConferenceState(data)
    });

    const formVerifySecretBody = () => {
        return {
            conferenceId: meetingId,
            conferenceSecret: meetingPassword
        }
    }

    const handleVerifySecret = (data) => {
        if (data.status === "SUCCESS") {
            window.sessionStorage.setItem('roomPassword', meetingPassword);
            checkMeetingStatus();
        }
        else {
            setShowPasswordError("Incorrect room password")
        }
    }

    const [verifySecret, verifySecretErrors] = useRequest({
        url: config.conferenceManager + config.verifySecretEP,
        method: 'post',
        body: formVerifySecretBody,
        onSuccess: (data) => handleVerifySecret(data)
    });


    const [meetingStarted, setMeetingStarted] = useState(null)

    const [meetingStatusCheck, meetingStatusErrors] = useRequest({
        url: config.conferenceManager + config.unauthConferenceEP + "/" + meetingId,
        method: 'get',
        onSuccess: (data) => {}
    });


    const updateConferenceState = (data) => {
        setMeetingId(data.conferenceId);
        setMeetingName(data.conferenceName);
        setMeetingFrom(data.scheduledFrom)
        setMeetingTo(data.scheduledTo)

        setIsMeetingHost(data.isHost)
        if(data.isHost && data.conferenceStatus === "STARTED") {
            window.sessionStorage.setItem('roomPassword', data.conferenceSecret);
            setMeetingPassword(data.conferenceSecret)
        }

        setShowJoinMeetingForm(!_isUserSignedOut && !data.isHost)

        setIsSecretEnabled(data.isSecretEnabled)
        setConferenceStatus(data.conferenceStatus);

        setDisableJoin(false)
        APP.store.dispatch(setPostWelcomePageScreen(null,
            {
                meetingId : data.conferenceId,
                meetingName : data.conferenceName,
                meetingFrom : data.scheduledFrom,
                meetingTo : data.scheduledTo
            })
        );
    }

    const refreshJidAndReinitializeApp = () => {
        const { locationURL } = APP.store.getState()['features/base/connection'];
        APP.store.dispatch(setLocationURL(locationURL))
        openConnection({
            retry: true,
            roomName: meetingId
        })
        .then(connection => {
            APP.conference.init({
                roomName: APP.conference.roomName
            })
        })
        .catch(err => {
            console.log("Unable to open new connection", err)
        });
    }

    const setMeetNowAndUpdatePage = (value) => {
        setMeetNow(value)
        isMeetNow(value)
    }

    const goToHome = () => {
        window.location.href = window.location.origin
    }

    const refreshTokenAndFetchConference = async (reinitializeApp = false) => {
        reinitializeApp && refreshJidAndReinitializeApp();
        // Do not navigate to session expiry page if the session has expired.
        // If session has expired, continue the guest/login flow in joining flow of the meeting.
        let res = await getConference(true, joinMeeting)
        if(!res) {
            await unauthGetConference()
        }
    }

    // const addTokenToURL = async () => {
    //     await getConference(true)
    //     // if(!getQueryVariable('jwt')) {
    //     //     window.location.href = window.location.href + "?jwt=" + APP.store.getState()['features/app-auth'].meetingAccessToken
    //     // }
    // }

    const checkMeetingStatus = async () => {
        setMeetingStarted(false);
        const decideToJoin = (response, intervalTimer) => {
            if (response && response.conferenceStatus === "STARTED") {
                intervalTimer && clearInterval(intervalTimer);
                setMeetingStarted(true)
                _joinConference()
                return true;
            }
        }

        let joined = decideToJoin(await meetingStatusCheck())

        if(!joined) {
            let intervalTimer = setInterval(async () => {
                decideToJoin(await meetingStatusCheck(), intervalTimer)
            }, 5000)
        }
        
    }

    const handleJoinNow = async () => {

        //Verify conference secret(when join form is displayed)
        if ((!_isUserSignedOut && showJoinMeetingForm) ||
            (!_isUserSignedOut && !isMeetingHost) ||
            continueAsGuest) {
            await verifySecret()
            return;
        }

        if (isMeetingHost) {
            _joinConference();
        }
        else {
            setShowJoinMeetingForm(true)
        }

    }

    const _joinConference = () => {
        APP.store.dispatch(setPrejoinPageErrorMessageKey('submitting'));
        joinConference();
    }

    const joinNowDisabled = continueAsGuest
        && (guestName.trim() === "" || (isSecretEnabled && meetingPassword.trim() === ""))

    

    useEffect(() => {
        if((!_isUserSignedOut || continueAsGuest)) {
            props.showTrackPreviews(true)
        }
        else {
            props.showTrackPreviews(false)
        }
    })

    return ( (fetchUnauthErrors || fetchErrors) ?  
        <div className={`hostPrejoin`}> <div className="invalid-meeting-code">{'Invalid meeting code'} </div></div> :
        <div className={`hostPrejoin`}>
            {/* onClick={() => setHideLogin(false)} */}
            {
                !_isUserSignedOut ?
                    <>
                        <div className="profileSection">
                            <Profile />
                        </div>
                    </>
                    :
                    <>
                        {
                            !continueAsGuest &&
                            <div className="login-message" 
                                style={{
                                    visibility: (conferenceStatus === '' || conferenceStatus === "STARTED")
                                         ? 'hidden': 'visible'
                                }}>
                                <span>Please</span>
                                <span className="sign-in-link"> sign in </span>
                                <span>if you are the host.</span>
                            </div>
                        }
                    </>
            }

            <MeetingInfo
                shareable={false}
                isPureJoinFlow={{
                    isMeetingHost
                }}
                meetingId={{
                    meetingId
                }}
                meetingName={{
                    meetingName, setMeetingName
                }}
                meetingPassword={{
                    meetingPassword, setMeetingPassword
                }}
                meetingFrom={{
                    meetingFrom, setMeetingFrom
                }}
                meetingTo={{
                    meetingTo, setMeetingTo
                }}
            />

            {
                meetingStarted !== null && meetingStarted == false ?
                <div className="waiting-display">
                    <h2>Please wait for the host to join the meeting...</h2>
                    <Icon src = { IconLogo } size={120}/>
                </div>
                :
                <>
                    {
                        (_isUserSignedOut && !continueAsGuest) &&
                        <>
                            <LoginComponent
                                closeAction={ () => {
                                    //Fetch the conference details for the logged in user
                                    setDisableJoin(true);
                                    refreshTokenAndFetchConference(true);

                                }}
                            />

                            <div className="no-account">
                                <div>Don't have an account?</div>
                                <div 
                                    className={`${disableJoin ? 'disabled' : ''} `}
                                    onClick={() => !disableJoin && setContinueAsGuest(true)}> Continue as a Guest </div>
                            </div>
                        </>
                    }

                    {
                        ((!_isUserSignedOut && showJoinMeetingForm) || 
                            (!_isUserSignedOut && !isMeetingHost) ||
                        continueAsGuest ) &&
                        <JoinMeetingForm
                            isSecretEnabled={isSecretEnabled}
                            isUserSignedOut={_isUserSignedOut}
                            meetingId={meetingId}
                            meetingPassword={{
                                meetingPassword, setMeetingPassword
                            }}
                            guestName={{
                                guestName, setGuestName
                            }}
                            guestEmail={{
                                guestEmail, setGuestEmail
                            }}
                            passwordError={showPasswordError}
                        />

                    }

                    {
                        (!_isUserSignedOut || continueAsGuest) &&
                        <div
                            className={`prejoin-page-button next 
                            ${(disableJoin || joinNowDisabled) ? 'disabled' : ''} `}
                            onClick={async () => (!disableJoin && !joinNowDisabled) && handleJoinNow()}>
                            Join Now
                        </div>
                    }
                </>
            }
            

        </div>
    );
};

function mapStateToProps(state): Object {
    return {
        //meetingDetails: APP.store.getState()['features/app-auth'].meetingDetails,
        _isUserSignedOut: state['features/app-auth'].isUserSignedOut,
        _user: state['features/app-auth'].user,
        _displayName: getDisplayName(state)
    };
}

const mapDispatchToProps = {
    joinConference: joinConferenceAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(GuestPrejoin));
