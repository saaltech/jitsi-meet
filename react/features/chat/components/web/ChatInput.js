// @flow

import React, { Component } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import type { Dispatch } from 'redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconChatSend, Icon, IconPlane, IconSmile } from '../../../base/icons';
import { connect } from '../../../base/redux';
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';


// Unified code names of Smileys to be excluded
const SMILEYS_TO_EXCLUDE = [

    'hot_face', // Overheated face ':hot_face'
    'partying_face',
    'smiling_face_with_3_hearts', // smiling_face_with_3_hearts
    'compass',
    'woozy_face',
    'cold_face', // cold_face

    // Tab 1
    'curly_haired_man',
    'white_haired_man',
    'bald_person',
    'red_haired_woman',
    'red_haired_person',
    'curly_haired_woman',
    'curly_haired_person',
    'white_haired_woman',
    'bald_woman',
    'bald_person',
    'health_worker',
    'judge',
    'female-teacher',
    'farmer',
    'cook',
    'mechanic',
    'factory_worker',
    'office_worker',
    'scientist',
    'technologist',
    'singer',
    'male-singer',
    'female-singer',
    'artist',
    'pilot',
    'astronaut',
    'firefighter',
    'male_superhero',
    'female_superhero',
    'male_supervillain',
    'man_with_probing_cane',
    'female_supervillain',
    'women_with_probing_cane',
    'person_with_probing_cane',
    'person_in_motorized_wheelchair',
    'man_in_motorized_wheelchair',
    'woman_in_motorized_wheelchair',
    'person_in_manual_wheelchair',
    'woman_in_manual_wheelchair',
    'man_in_manual_wheelchair',
    'people_holding_hands',

    // Tab 2
    'orangutan',
    'guid_dog',
    'service_dog',
    'sloth',
    'otter',
    'skunk',
    'flamingo',

    // Tab 3
    'falafel',
    'waffle',
    'onion',
    'garlic',
    'butter',
    'oyster',
    'ice_cube',
    'mate_drink',
    'beverage_box',

    // Tab 5
    'hindu_temple',
    'manual_wheelchair',
    'motorized_wheelchair',
    'auto_rickshaw',
    'parachute',
    'ringed_planet',

    // Tab 6
    'safety_vest',
    'briefs',
    'shorts',
    'sari',
    'one-piece_swimsuit',
    'ballet_shoes',
    'womans_flat_shoe',
    'razor',
    'drop_of_blood',
    'adhesive_bandage',
    'banjo',
    'diya_lamp',
    'chair',
    'probing_cane',
    'axe'
];

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<any>,

    /**
     * Optional callback to invoke when the chat textarea has auto-resized to
     * fit overflowing text.
     */
    onResize: ?Function,

    /**
     * Callback to invoke on message send.
     */
    onSend: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    onChange?: Function,
};

/**
 * The type of the React {@code Component} state of {@link ChatInput}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string,

    /**
     * Whether or not the smiley selector is visible.
     */
    showSmileysPanel: boolean
};

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @extends Component
 */
class ChatInput extends Component<Props, State> {
    _textArea: ?HTMLTextAreaElement;

    state = {
        message: '',
        showSmileysPanel: false
    };

    /**
     * Initializes a new {@code ChatInput} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._textArea = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._onEscHandler = this._onEscHandler.bind(this);
        this._onToggleSmileysPanelKeyPress = this._onToggleSmileysPanelKeyPress.bind(this);
        this._onSubmitMessageKeyPress = this._onSubmitMessageKeyPress.bind(this);
        this._setTextAreaRef = this._setTextAreaRef.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        /**
         * HTML Textareas do not support autofocus. Simulate autofocus by
         * manually focusing.
         */
        this._focus();

        this._filterFrequentlyUsedSmileys();
    }

    /**
     * Filter out the smileys that appear with proper enclosing html structure,
     * (bug from the emoji library).
     */
    _filterFrequentlyUsedSmileys() {
        const frequentEmoji = window.localStorage.getItem('emoji-mart.frequently');
        const obj = JSON.parse(frequentEmoji || '{}');
        let lastEmoji = window.localStorage.getItem('emoji-mart.last');

        lastEmoji = lastEmoji && JSON.parse(lastEmoji);

        SMILEYS_TO_EXCLUDE.forEach(id => {
            delete obj[id];
            if (id === lastEmoji) {
                lastEmoji = '';
            }
        });

        if (frequentEmoji) {
            window.localStorage.setItem('emoji-mart.frequently', JSON.stringify(obj));
        }
        if (!lastEmoji) {
            window.localStorage.removeItem('emoji-mart.last');
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileysPanelClassName = `${this.state.showSmileysPanel
            ? 'show-smileys' : 'hide-smileys'} smileys-panel`;

        return (
            <div className = { `chat-input-container${this.state.message.trim().length ? ' populated' : ''}` }>
                <div id = 'chat-input' >
                    <div className = 'smiley-input'>
                        <div id = 'smileysarea'>
                            <div id = 'smileys'>
                                <div
                                    aria-expanded = { this.state.showSmileysPanel }
                                    aria-haspopup = 'smileysContainer'
                                    aria-label = { this.props.t('chat.smileysPanel') }
                                    className = 'smiley-button'
                                    onClick = { this._onToggleSmileysPanel }
                                    onKeyDown = { this._onEscHandler }
                                    onKeyPress = { this._onToggleSmileysPanelKeyPress }
                                    role = 'button'
                                    tabIndex = { 0 }>
                                    <Icon src = { IconSmile } />
                                </div>
                            </div>
                        </div>
                        <div className = { smileysPanelClassName }>
                            <SmileysPanel
                                onSmileySelect = { this._onSmileySelect } />
                        </div>
                    </div>
                </div>
                {this.state.showSmileysPanel && <div className = { smileysPanelClassName }>
                    <Picker
                        emojisToShowFilter = { emoji => {
                            if (emoji.short_names.filter(symbol => SMILEYS_TO_EXCLUDE.includes(symbol)).length === 0) {
                                return true;
                            }
                        } }
                        onSelect = { this._onSmileySelect } />
                </div>}
                <div className = 'usrmsg-form'>
                    <TextareaAutosize
                        id = 'usermsg'
                        inputRef = { this._setTextAreaRef }
                        maxRows = { 5 }
                        onChange = { this._onMessageChange }
                        onHeightChange = { this.props.onResize }
                        onKeyDown = { this._onDetectSubmit }
                        placeholder = { this.props.t('chat.messagebox') }
                        value = { this.state.message } />
                    <button
                        onClick = { () => {
                            const trimmed = this.state.message.trim();

                            this.props.onSend(trimmed);
                            this.setState({ message: '' });
                        } }><Icon src = { IconChatSend } /></button>
                </div>
            </div>
        );
    }

    /**
     * Place cursor focus on this component's text area.
     *
     * @private
     * @returns {void}
     */
    _focus() {
        this._textArea && this._textArea.focus();
    }


    _onSubmitMessage: () => void;

    /**
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const trimmed = this.state.message.trim();

        if (trimmed) {
            this.props.onSend(trimmed);

            this.setState({ message: '' });

            // Keep the textarea in focus when sending messages via submit button.
            this._focus();
        }

    }
    _onDetectSubmit: (Object) => void;

    /**
     * Detects if enter has been pressed. If so, submit the message in the chat
     * window.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDetectSubmit(event) {
        if (event.key === 'Enter'
            && event.shiftKey === false
            && event.ctrlKey === false) {
            event.preventDefault();
            event.stopPropagation();

            this._onSubmitMessage();
        }
    }

    _onSubmitMessageKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onSubmitMessageKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onSubmitMessage();
        }
    }

    _onMessageChange: (Object) => void;

    /**
     * Updates the known message the user is drafting.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onMessageChange(event) {
        this.setState({ showSmileysPanel: false });
        this.setState({ message: event.target.value });

        this.props.onChange && this.props.onChange();
    }

    _onSmileySelect: (string) => void;

    /**
     * Appends a selected smileys to the chat message draft.
     *
     * @param {string} smileyText - The value of the smiley to append to the
     * chat message.
     * @private
     * @returns {void}
     */
    _onSmileySelect(smileyText) {
        this.setState({
            message: `${this.state.message} ${smileyText?.colons}`,
            showSmileysPanel: false
        });

        this._focus();
        this._filterFrequentlyUsedSmileys();
    }

    _onToggleSmileysPanel: () => void;

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        if (this.state.showSmileysPanel) {
            this._focus();
        }
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });
    }

    _onEscHandler: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscHandler(e) {
        // Escape handling does not work in onKeyPress
        if (this.state.showSmileysPanel && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this._onToggleSmileysPanel();
        }
    }

    _onToggleSmileysPanelKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onToggleSmileysPanelKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onToggleSmileysPanel();
        }
    }

    _setTextAreaRef: (?HTMLTextAreaElement) => void;

    /**
     * Sets the reference to the HTML TextArea.
     *
     * @param {HTMLAudioElement} textAreaElement - The HTML text area element.
     * @private
     * @returns {void}
     */
    _setTextAreaRef(textAreaElement: ?HTMLTextAreaElement) {
        this._textArea = textAreaElement;
    }
}

export default translate(connect()(ChatInput));
