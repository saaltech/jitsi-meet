// @flow
import React from 'react';

type Props = {
    children: Object,
    timer: number,
    hideNotification: Function,
}

type State = {
    visible: boolean
}

/**
 * Renders a expireable element.
 */
export default class Expire extends React.Component<Props, State> {
    state = {
        visible: true
    }

    timer = null

    /**
     * ComponentDidMount.
     *
     * @inheritdoc
     * @returns {undefined}
     */
    componentDidMount() {
        const { hideNotification } = this.props;

        this.timer = setTimeout(() => {
            this.setState({ visible: false });

            setTimeout(() => hideNotification(), 1000);
        }, this.props.timer);
    }

    /**
     * ComponentWillUnmount.
     *
     * @inheritdoc
     * @returns {undefined}
     */
    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <>
                {this.state.visible ? this.props.children
                    : React.Children.only(
                        React.cloneElement(this.props.children, {
                            className: `${this.props.children.props.className} expired`
                        })
                    )
                }
            </>
        );
    }
}

