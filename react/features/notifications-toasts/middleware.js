/* @flow */
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    getLocalParticipant,
    getParticipantById
} from '../base/participants';
import {
    MiddlewareRegistry
} from '../base/redux';
import {
    ADD_MESSAGE
} from '../chat/actionTypes';

import {
    showNotification
} from './actions';

declare var interfaceConfig: Object;

/**
 * Middleware that captures actions to display notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {

    case ADD_MESSAGE: {
        const { dispatch, getState } = store;
        const { message, senderId } = action;
        const state = getState();

        const { toastNotificationSettings } = state['features/toolbox-more'];

        if (!toastNotificationSettings.showChat) {
            return next(action);
        }

        const _localParticipant = getLocalParticipant(state);

        if (_localParticipant.id === senderId) {
            return next(action);
        }

        dispatch(showNotification({
            text: message,
            userId: senderId

        }));

        return next(action);
    }

    case PARTICIPANT_JOINED: {
        const result = next(action);
        const { participant: p } = action;
        const { dispatch, getState } = store;

        if (p.local) {
            return;
        }

        const state = getState();

        const { toastNotificationSettings } = state['features/toolbox-more'];

        if (!toastNotificationSettings.showJoinedMeeting) {
            return;
        }

        dispatch(showNotification({
            userId: p.id,
            userName: p.name,
            type: PARTICIPANT_JOINED
        }));

        return result;
    }

    case PARTICIPANT_LEFT: {
        const { dispatch, getState } = store;


        const state = getState();

        const { toastNotificationSettings } = state['features/toolbox-more'];

        if (!toastNotificationSettings.showLeftMeeting) {
            return;
        }


        const participant = getParticipantById(
            store.getState(),
            action.participant.id
        );

        dispatch(showNotification({
            userId: participant.id,
            userName: participant.name,
            type: PARTICIPANT_LEFT
        }));

        return next(action);
    }
    }

    return next(action);
});
