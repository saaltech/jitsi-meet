import { toState } from '../base/redux';
import { areThereNotifications } from '../notifications';
import { getOverlayToRender } from '../overlay';
import { config } from '../../config';
import {
  getParticipantById
} from '../base/participants/functions';
import logger from './logger';

/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful) {
    const state = toState(stateful);
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { calleeInfoVisible } = state['features/invite'];

    return areThereNotifications(state)
      && !isAnyOverlayVisible
      && !calleeInfoVisible;
}

export function getAppSocketEndPoint() {
  return `/app`
}

export function getConferenceSocketBaseLink() {
  return `${window.location.origin}`+ //  `https://dev-blync.saal.ai/`+
      `${config.conferenceManager}/wss`
}

export function getWaitingParticipantsSocketTopic(state = {}) {
  return `/conference/${state['features/app-auth']?.meetingDetails?.meetingId}/participants`
}

export function setLowConnectionStatusMode(lastN = 1) {
  const state = APP.store.getState();
  const { conference } = state['features/base/conference'];
  const { screenShares, tileViewEnabled } = state['features/video-layout'];
  const largeVideoParticipantId = state['features/large-video'].participantId;
  const largeVideoParticipant
      = largeVideoParticipantId ? getParticipantById(state, largeVideoParticipantId) : undefined;

  // Use tileViewEnabled state from redux here instead of determining if client should be in tile
  // view since we make an exception only for screenshare when in audio-only mode. If the user unpins
  // the screenshare, lastN will be set to 0 here. It will be set to 1 if screenshare has been auto pinned.
  if (!tileViewEnabled && largeVideoParticipant && !largeVideoParticipant.local) {
      lastN = (screenShares || []).includes(largeVideoParticipantId) ? 1 : 0;
  } else {
      lastN = 0;
  }

  if (!conference || conference.getLastN() === lastN) {
      return;
  }

  logger.info(`(setLowConnectionStatusMode) Setting last N to: ${lastN}`);

  try {
      conference.setLastN(lastN);
  } catch (err) {
      logger.error(`(setLowConnectionStatusMode) Failed to set lastN: ${err}`);
  }

  // Alternatively we can do the below if no one is sharing screen.
  // dispatch({
  //     type: SET_AUDIO_ONLY,
  //     audioOnly,
  //     ensureVideoTrack
  // });
}

export function setConferenceLastNToOne(act = false) {
  const { conference } = APP.store.getState()['features/base/conference'];
  if(act) {
      conference && conference.setLastN(1);
  }
  else {
      logger.info('Restoring lastN to config.channelLastN')
      conference && conference.setLastN(window.config.channelLastN);
  }
}
  
