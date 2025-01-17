// @flow

import React, { Component } from 'react';

import { Icon, IconCheck, IconMore } from '../../icons';


type Props = {
    checked: boolean,
    onCheck: Function,
    onOpenMenu: ?Function,
    label: string,
    icon: ?Object,
    children: ?Object,
    disabled: ?boolean
}


/**
 * Implements the options items
 * @extends Component
 */
class OptionItemCheck extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { checked, label, onCheck, onOpenMenu, disabled } = this.props;

        return (
            <div>
                <label
                    className = { `
                    option-item-check
                    ${checked ? 'option-item-check--checked' : ''}
                    ${disabled ? 'option-item-check--disabled' : ''}
                    ` }
                    onClick = { e => {
                        if (disabled) {
                            return;
                        }
                        e.stopPropagation();
                        e.preventDefault();
                        onCheck && onCheck();
                    } }>
                    <div className = 'option-item-check__label'>
                        <div className = 'option-item-check__mark'>
                            {checked && <Icon src = { IconCheck } />}
                        </div>
                        {label}
                    </div>
                    {onOpenMenu && <button
                        className = 'option-item-check__menu-btn'
                        onClick = { e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenMenu();
                        } }
                        type = 'button'>

                        <Icon src = { IconMore } />
                    </button>}
                </label>
                {this.props.children && <div className = 'option-item-check__children'>
                    {this.props.children}
                </div>}
            </div>
        );
    }
}
export default OptionItemCheck;
