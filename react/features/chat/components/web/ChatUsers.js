// @flow
import truncate from 'lodash/truncate';
import moment from 'moment';
import React, { Component } from 'react';

import { Avatar as AvatarDisplay } from '../../../../../react/features/base/avatar';
import { Icon, IconSearch } from '../../../base/icons';
type Props = {
    participants: Array<Object>,
    onSelect: Function,
    messagesSinceLastRead: Array<Object>,
    messages: Array<Object>,
    localParticipant: Object,
}

type State = {
    search: string
}

/**
 * React Component for displaying users list
 */
export default class ChatUsers extends Component<Props, State> {

    state = {
        search: ''
    }

    /**
     * Gets the uniqe users who have messaged user.
     *
     * @inheritdoc
     * @returns {Array<Object>}
     */
    _getEngagedUsers(): Array<Object> {
        const { localParticipant, messages, participants } = this.props;
        const senders = messages.map(msg => {
            const usr = participants.find(p => p.name === msg.displayName);

            return usr;
        });
        const recipients = messages.map(msg => {
            const usr = participants.find(p => p.name === msg.recipient);

            return usr;
        });

        return [
            ...senders,
            ...recipients
        ].filter(participant => {
            if (!participant) {
                return false;
            }

            return participant.name !== localParticipant.name;
        }).reduce((acc, participant: Object) => {
            const isInList = acc.find((p: Object) => p.id === participant.id);

            if (isInList) {
                return acc;
            }

            return [ ...acc, participant ];
        }, []);
    }

    /**
     * Gets last message from or to user.
     *
     * @inheritdoc
     * @returns {Object}
     */
    _getLastMessage(participant): Object {
        const { localParticipant, messages } = this.props;

        const message = messages
            .slice()
            .reverse()
            .find(msg => {
                const localSent = msg.displayName === localParticipant.name && msg.recipient === participant.name;
                const localReceived = msg.recipient === localParticipant.name && msg.displayName === participant.name;

                return localSent || localReceived;
            });

        return message;
    }

    /**
     * Gets time last message was sent.
     *
     * @inheritdoc
     * @returns {Object}
     */
    _getTimeSinceMessage(message): Object {
        const seconds = moment().diff(message.timestamp, 'seconds')
                        .toFixed();
        const minutes = moment().diff(message.timestamp, 'minutes')
                        .toFixed();
        const hours = moment().diff(message.timestamp, 'hours')
                        .toFixed();

        if (hours > 0) {
            return `${hours}H`;
        }

        if (minutes > 0) {
            return `${minutes}M`;
        }


        return `${seconds}S`;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const participants = this._getEngagedUsers().filter(user => {
            if (!this.state.search) {
                return user;
            }
            const search = String(this.state.search).toLowerCase();

            return String(user.name)
                .toLowerCase()
                .includes(search);
        });

        return (
            <div className = 'chat-users'>
                <label className = 'chat-users__search'>
                    <Icon src = { IconSearch } />
                    <input
                        onChange = { e => this.setState({ search: e.target.value }) }
                        placeholder = 'Search Participant'
                        type = 'text' />
                </label>
                <ul className = 'chat-users__list'>
                    {
                        (participants || []).map(participant => {
                            const lastMessage = this._getLastMessage(participant);

                            return (<li
                                key = { participant.id }
                                onClick = { () => this.props.onSelect(participant) }>
                                <div>
                                    <AvatarDisplay
                                        className = 'chat-users__avatar userAvatar'
                                        participantId = { participant.id } />
                                </div>
                                <div className = 'chat-users__user-details'>
                                    <div className = 'chat-users__user-header'>
                                        <span className = 'chat-users__username'>{participant.name}</span>
                                        {!lastMessage.hasRead && <span className = 'chat-users__status--new-message' />}
                                    </div>
                                    <div className = 'chat-users__user-details-body'>
                                        {truncate(lastMessage.message, { length: 70 })}
                                    </div>
                                </div>
                                <div className = 'chat-users__chat-time'>
                                    {this._getTimeSinceMessage(lastMessage)}
                                </div>
                            </li>);
                        })
                    }
                </ul>
            </div>
        );
    }
}
