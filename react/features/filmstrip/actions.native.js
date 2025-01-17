// @flow

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBLE,
    SET_TILE_VIEW_DIMENSIONS,
    SET_SHOW_SPEAKERS_LIST
} from './actionTypes';

/**
 * Sets whether the filmstrip is enabled.
 *
 * @param {boolean} enabled - Whether the filmstrip is enabled.
 * @returns {{
 *     type: SET_FILMSTRIP_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setFilmstripEnabled(enabled: boolean) {
    return {
        type: SET_FILMSTRIP_ENABLED,
        enabled
    };
}

/**
 * Sets whether the filmstrip is being hovered (over).
 *
 * @param {boolean} hovered - Whether the filmstrip is being hovered (over).
 * @returns {{
 *     type: SET_FILMSTRIP_HOVERED,
 *     hovered: boolean
 * }}
 */
export function setFilmstripHovered(hovered: boolean) {
    return {
        type: SET_FILMSTRIP_HOVERED,
        hovered
    };
}

/**
 * Sets whether the filmstrip is visible.
 *
 * @param {boolean} visible - Whether the filmstrip is visible.
 * @returns {{
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setFilmstripVisible(visible: boolean) {
    return {
        type: SET_FILMSTRIP_VISIBLE,
        visible
    };
}

/**
 * Sets the dimensions of the tile view grid. The action is only partially implemented on native as not all
 * of the values are currently used. Check the description of {@link SET_TILE_VIEW_DIMENSIONS} for the full set
 * of properties.
 *
 * @param {Object} dimensions - The tile view dimensions.
 * @param {Object} thumbnailSize - The size of an individual video thumbnail.
 * @param {number} thumbnailSize.height - The height of an individual video thumbnail.
 * @param {number} thumbnailSize.width - The width of an individual video thumbnail.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions({ thumbnailSize }: Object) {
    return {
        type: SET_TILE_VIEW_DIMENSIONS,
        dimensions: {
            thumbnailSize
        }
    };
}

/**
 * Sets whether the filmstrip is visible.
 *
 * @param {boolean} visible - Whether the filmstrip is visible.
 * @returns {{
    *     type: SET_SHOW_SPEAKERS_LIST,
    *     visible: boolean
    * }}
    */
export function setShowSpeakersList(visible: boolean) {
    return {
        type: SET_SHOW_SPEAKERS_LIST,
        visible
    };
}
