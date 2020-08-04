// @flow

import React, { Component } from 'react';

import { connect } from '../../../base/redux';
import { getWaitingParticipantCount } from '../functions';

/**
 * The type of the React {@code Component} props of {@link WaitingParticipantNotifier}.
 */
type Props = {

    /**
     * The value of number of waiting participants.
     */
    _count: number
};

/**
 * Implements a React {@link Component} which displays a notification for new 
 * waiting list participants
 *
 * @extends Component
 */
class WaitingParticipantNotifier extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        console.log("this.props._count: ", this.props._count)
        return (
            <span className = 'badge-round'>
                <span>
                    { !this.props._participantsListOpen && (this.props._count || null) }
                </span>
            </span>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code WaitingParticipantNotifier}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _count: number
 * }}
 */
function _mapStateToProps(state) {
    const { participantsListOpen } = state['features/toolbox'];
    return {
        _participantsListOpen: participantsListOpen,
        _count: getWaitingParticipantCount(state)
    };
}

export default connect(_mapStateToProps)(WaitingParticipantNotifier);
